import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../assets/styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="auth-navbar">
      <Link to="/" className="auth-navbar-logo-link">
        <img src={logo} alt="Fraudulert Logo" className="auth-navbar-logo" />
      </Link>
      
      <div className="auth-nav-links">
        <Link to="/login" className="auth-nav-link">
          Log In
        </Link>
        <Link to="/signup" className="auth-nav-link auth-signup-btn">
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;