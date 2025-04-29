import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../assets/styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo-link">
        <img src={logo} alt="Fraudulert Logo" className="navbar-logo" />
      </Link>
      
      <div className="nav-links">
        <Link to="/login" className="nav-link">
          Log In
        </Link>
        <Link to="/signup" className="nav-link signup-btn">
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;