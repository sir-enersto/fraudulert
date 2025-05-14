import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AccountCard = ({ account }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className={`account-card ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/accounts/${account.id}`)}
        >
            <div className="account-header">
                <h3>Account #{account.id}</h3>
                <span className={`risk-badge risk-${Math.floor(account.risk_score / 20)}`}>
                    Risk: {account.risk_score.toFixed(1)}
                </span>
            </div>
            <div className="account-details">
                <p><strong>Age:</strong> {account.current_age}</p>
                <p><strong>Gender:</strong> {account.gender}</p>
                <p><strong>Transactions:</strong> {account.transaction_count}</p>
            </div>
            {isHovered && (
                <div className="account-hover">
                    <p>Click for details</p>
                </div>
            )}
        </div>
    );
};

export default AccountCard;