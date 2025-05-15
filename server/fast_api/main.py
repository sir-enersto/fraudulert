from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from enum import Enum
import pandas as pd
import numpy as np
import joblib
import io
import logging
import time
from psycopg2.extras import execute_values
from tenacity import retry, stop_after_attempt, wait_fixed

from typing import Optional
from db import get_connection

# ---------- FastAPI Setup ----------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Logging ----------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- Model Selector Enum ----------

class ModelType(str, Enum):
    xgboost = "xgboost"
    lightgbm = "lightgbm"

# ---------- Load Models ----------

models = {
    "xgboost": joblib.load("./models/xgboost.pkl"),
    "lightgbm": joblib.load("./models/lightgbm.pkl")
}

logger.info("✅ Models loaded successfully")

# ---------- Fraud Category Function ----------

def categorize_fraud(prob: float) -> str:
    if prob >= 0.9:
        return "Very High Risk"
    elif prob >= 0.7:
        return "High Risk"
    elif prob >= 0.5:
        return "Medium Risk"
    elif prob >= 0.3:
        return "Low Risk"
    else:
        return "Very Low Risk"

# ---------- Retry Logic for Database Inserts ----------

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def insert_predictions(cur, insert_query, values):
    execute_values(cur, insert_query, values)

# ---------- Prediction Route ----------

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_type: ModelType = Query(..., description="Model to use: xgboost or lightgbm"),
    sample_size: int = Query(5, ge=1, le=100, description="Number of samples to return")
):
    start_time = time.time()
    try:
        logger.info("Starting file upload processing...")
        content = await file.read()
        logger.info(f"File read completed in {time.time() - start_time:.2f} seconds")

        logger.info("Parsing CSV file...")
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        logger.info(f"CSV parsed in {time.time() - start_time:.2f} seconds, rows: {len(df)}")

        required_columns = [
            'id', 'client_id', 'Amount($)', 'Absolute_Amount', 'day_of_week',
            'hour_of_day', 'is_weekend', 'use_chip', 'merchant_city',
            'merchant_state', 'mcc', 'errors', 'merchant_category'
        ]
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            logger.error(f"Missing columns: {missing}")
            return JSONResponse(status_code=400, content={"error": f"Missing columns: {missing}"})

        features = df[required_columns[2:]]
        model = models[model_type.value]

        logger.info("Running model prediction...")
        probs = model.predict_proba(features)[:, 1]
        logger.info(f"Prediction completed in {time.time() - start_time:.2f} seconds")

        df['fraud_probability'] = probs
        df['fraud_category'] = df['fraud_probability'].apply(categorize_fraud)
        df['model_used'] = model_type.value

        sample = df.sample(min(sample_size, len(df)))
        results = sample[["id", "client_id", "fraud_probability", "fraud_category", "model_used"]].to_dict(orient="records")

        # ---------- Insert into PostgreSQL ----------
        logger.info(f"Inserting {len(df)} predictions into database...")
        conn = get_connection()
        conn.set_session(autocommit=False)
        cur = conn.cursor()

        insert_query = """
            INSERT INTO fraud_predictions (
                transaction_id, client_id, fraud_probability,
                fraud_category, model_used
            ) VALUES %s
            ON CONFLICT (transaction_id) DO UPDATE SET
                fraud_probability = EXCLUDED.fraud_probability,
                fraud_category = EXCLUDED.fraud_category,
                model_used = EXCLUDED.model_used,
                updated_at = CURRENT_TIMESTAMP;
        """

        chunk_size = 1000
        if len(df) <= chunk_size:
            values = [
                (row['id'], row['client_id'], row['fraud_probability'], row['fraud_category'], row['model_used'])
                for _, row in df.iterrows()
            ]
            try:
                insert_predictions(cur, insert_query, values)
                conn.commit()
            except Exception as e:
                conn.rollback()
                logger.error(f"Database insert failed: {str(e)}")
                return JSONResponse(status_code=500, content={"error": "Database operation failed", "details": str(e)})
        else:
            chunks = pd.read_csv(io.StringIO(content.decode("utf-8")), chunksize=chunk_size)
            for i, chunk in enumerate(chunks):
                logger.info(f"Processing chunk {i+1} with {len(chunk)} rows...")
                features = chunk[required_columns[2:]]
                probs = model.predict_proba(features)[:, 1]
                chunk['fraud_probability'] = probs
                chunk['fraud_category'] = chunk['fraud_probability'].apply(categorize_fraud)
                chunk['model_used'] = model_type.value
                values = [
                    (row['id'], row['client_id'], row['fraud_probability'], row['fraud_category'], row['model_used'])
                    for _, row in chunk.iterrows()
                ]
                try:
                    insert_predictions(cur, insert_query, values)
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Chunk {i+1} insert failed: {str(e)}")
                    return JSONResponse(status_code=500, content={"error": f"Database operation failed for chunk {i+1}", "details": str(e)})
                logger.info(f"Chunk {i+1} inserted in {time.time() - start_time:.2f} seconds")

        cur.close()
        conn.close()
        logger.info(f"Database insert completed in {time.time() - start_time:.2f} seconds")

        response = {
            "status": "success",
            "predictions": results,
            "metadata": {
                "total_transactions": len(df),
                "fraud_stats": {
                    "high_risk_count": int((probs >= 0.7).sum()),
                    "medium_risk_count": int(((probs >= 0.5) & (probs < 0.7)).sum()),
                    "fraud_percentage": f"{(probs >= 0.5).mean():.2%}"
                },
                "model_used": model_type.value,
                "sample_size_returned": len(sample),
                "processing_time_seconds": f"{time.time() - start_time:.2f}"
            }
        }
        logger.info(f"Request completed in {time.time() - start_time:.2f} seconds")
        return response

    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "Prediction failed", "details": str(e)})