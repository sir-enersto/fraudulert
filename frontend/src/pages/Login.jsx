import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/Auth.css";
import logo from "../assets/logo.png";
import Navbar from "../components/Navbar";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // 1. Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Get Firebase ID token
      const firebaseToken = await userCredential.user.getIdToken();
      
      // 3. Exchange for your JWT
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { firebaseToken }
      );

      // 4. Store your JWT
      localStorage.setItem("token", response.data.token);

      // 🔍 Decode and log the contents of the JWT
      const decodedToken = jwtDecode(response.data.token);
      console.log("Decoded JWT:", decodedToken);
      
      // 5. Show success message (kept your original alert)
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
      
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Navbar />
      {(error || success) && (
        <div
          className="floating-alert"
          style={{
            backgroundColor: error ? "#ffe0e0" : "#e0ffe0",
            color: error ? "#b10000" : "#007700",
          }}
        >
          {error || success}
        </div>
      )}

      <div className="auth-card">
        <Link to="/" className="auth-logo-link">
          <img src={logo} alt="Fraudulert Logo" className="auth-logo" />
        </Link>
        <h2>Welcome Back</h2>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="input-group">
            <div className="input-icon">
              <FaEnvelope className="icon" />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <FaLock className="icon" />
            </div>
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;