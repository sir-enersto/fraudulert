import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../assets/styles/Auth.css";
import logo from "../assets/logo.png";
import Navbar from "../components/Navbar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing auth state when component mounts
    localStorage.removeItem("token");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await userCredential.user.getIdToken();
      const response = await axios.post(
        "http://localhost:5000/api/auth/login", 
        { firebaseToken }
      );
  
      localStorage.setItem("token", response.data.token);
      // Store first login flag for dashboard
      localStorage.setItem("showWelcome", response.data.isFirstLogin ? "true" : "false");
  
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
      
    } catch (err) {
      handleLoginError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (err) => {
    switch(err.code) {
      case "auth/user-not-found":
        setError("No account found with this email.");
        break;
      case "auth/wrong-password":
        setError("Incorrect password.");
        break;
      case "auth/invalid-email":
        setError("Invalid email address.");
        break;
      case "auth/too-many-requests":
        setError("Too many attempts. Please try again later.");
        break;
      default:
        setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <Navbar />
      
      {/* Floating Alert */}
      {(error || success) && (
        <div
          className="floating-alert"
          style={{
            backgroundColor: error ? "#ffe0e0" : "#e0ffe0",
            color: error ? "#b10000" : "#007700",
            border: error ? "1px solid #ffb3b3" : "1px solid #99ff99"
          }}
        >
          {error || success}
        </div>
      )}
      
      {/* Login Form */}
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
              autoComplete="username"
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
              autoComplete="current-password"
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