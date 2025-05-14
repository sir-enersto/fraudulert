import { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaLock, FaBuilding } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import "../assets/styles/Auth.css";
import logo from "../assets/logo.png";
import Navbar from "../components/Navbar";

const Signup = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.target);
    const { name, email, password, confirmPassword, organization } = Object.fromEntries(formData);

    if (!name?.trim() || !email?.trim() || !password || !confirmPassword || !organization?.trim()) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔗 Send user info to your PostgreSQL backend
      await axios.post("http://localhost:5000/api/users/signup", {
        firebase_uid: user.uid,
        email: email.trim(),
        username: name.trim(),
        organisation: organization.trim(),
        role: "admin",
        created_by: user.uid,
      });

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.error || err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Navbar />
      {(error || success) && (
        <div className={`floating-alert ${error ? "error" : "success"}`}>
          {error || success}
        </div>
      )}
      <div className="auth-card">
        <Link to="/" className="auth-logo-link">
          <img src={logo} alt="Fraudulert Logo" className="auth-logo" />
        </Link>
        <h2>Create Admin Account</h2>
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="input-group">
            <div className="input-icon"><FaUser className="icon" /></div>
            <input type="text" name="name" placeholder="Full Name" className="auth-input" required />
          </div>

          <div className="input-group">
            <div className="input-icon"><FaEnvelope className="icon" /></div>
            <input type="email" name="email" placeholder="Email Address" className="auth-input" required />
          </div>

          <div className="input-group">
            <div className="input-icon"><FaBuilding className="icon" /></div>
            <input type="text" name="organization" placeholder="Organization" className="auth-input" required />
          </div>

          <div className="input-group">
            <div className="input-icon"><FaLock className="icon" /></div>
            <input type="password" name="password" placeholder="Password" className="auth-input" required minLength="6" />
          </div>

          <div className="input-group">
            <div className="input-icon"><FaLock className="icon" /></div>
            <input type="password" name="confirmPassword" placeholder="Confirm Password" className="auth-input" required minLength="6" />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
