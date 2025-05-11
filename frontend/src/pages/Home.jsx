import { FaXTwitter, FaLinkedin, FaGithub, FaInstagram } from "react-icons/fa6";
import { Link } from "react-router-dom";
import coolimg from "../assets/coolimg.png";
import "../assets/styles/Home.css";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      {/* Hero Section with Animated Tech Elements */}
      <section className="hero">
        {/* Animated Tech Elements */}
        <div className="tech-element cog-1">⚙️</div>
        <div className="tech-element cog-2">⚛</div>
        <div className="hero-content">
          <h1>
            <span className="hero-title">Advanced Fraud Detection</span>
            <span className="hero-subtitle">Powered by AI</span>
          </h1>
          <p className="hero-text">
            Real-time protection against financial fraud with our cutting-edge
            machine learning models
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-primary">
              Get Started
            </Link>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <img
            src={coolimg}
            alt="Fraud Detection Visualization"
            className="hero-floating-image"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <h3>Real-Time Monitoring</h3>
          <p>Detect anomalies as they happen with sub-second latency</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>AI-Powered</h3>
          <p>Self-learning models that improve over time</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Multi-Layer Protection</h3>
          <p>Combination of rule-based and behavioral analysis</p>
        </div>
      </section>

      {/* Social Media Footer */}
      <footer className="social-footer">
        <div className="footer-content">
          <div className="social-links">
            <a
              href="https://instagram.com/sir.enersto"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram className="social-icon" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin className="social-icon" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="social-icon" />
            </a>
            <a href="https://X.com" target="_blank" rel="noopener noreferrer">
              <FaXTwitter className="social-icon" />
            </a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} Fraudulert. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
