// client/src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="home-content">
          <h1 className="app-title">VerdeHire</h1>
          <p className="tagline">Empowering careers with AI-driven insights and opportunities</p>
          
          <div className="options-container">
            {/* Employee Button - Links to Employee Tool Page */}
            <Link to="/employee-tool" className="option-button employee-button">
              <span className="button-text">For Employees</span>
              <span className="button-subtitle">Get AI resume analysis</span>
            </Link>
            
            {/* Employer Button - Now active and links to Employer Tool Page */}
            <Link to="/employer-tool" className="option-button employer-button"> {/* Changed to Link, removed disabled class */}
              <span className="button-text">For Employers</span>
              <span className="button-subtitle">Identify Best Resumes</span> {/* Updated subtitle */}
              {/* Removed <div className="coming-soon-badge">Soon</div> */}
            </Link>
          </div>
        </div>
      </section>

      {/* What VerdeHire Does Section */}
      <section className="what-we-do-section">
        <div className="section-content">
          <h2 className="section-heading">Unlock Your Career Potential</h2>
          <div className="description-content">
            <p className="description-paragraph">
              VerdeHire is an AI-powered platform designed to optimize your job application process.
            </p>
            <p className="description-paragraph">
              Upload your resume and the job description, and our intelligent AI provides a detailed analysis, 
              identifying strengths, areas for improvement, and crucial keyword gaps.
            </p>
            <p className="description-paragraph">
              Engage in an interactive chat to get personalized advice, tailor your resume, and boost your 
              chances of landing your dream job.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="features-section">
        <div className="section-content">
          <h2 className="section-heading">Why Choose VerdeHire?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Instant AI Analysis</h3>
              <p className="feature-description">
                Get immediate, data-driven feedback on your resume.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Personalized Coaching</h3>
              <p className="feature-description">
                Chat directly with AI for tailored advice and improvements.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Job Match Optimization</h3>
              <p className="feature-description">
                Identify exactly what hiring managers are looking for.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3 className="feature-title">User-Friendly Interface</h3>
              <p className="feature-description">
                Simple and intuitive design for a seamless experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <a href="#terms" className="footer-link">Terms of Service</a>
            <a href="#contact" className="footer-link">Contact Us</a>
          </div>
          <div className="social-links">
            <a href="#linkedin" className="social-link" aria-label="LinkedIn">💼</a>
            <a href="#github" className="social-link" aria-label="GitHub">🔗</a>
            <a href="#twitter" className="social-link" aria-label="Twitter">🐦</a>
          </div>
          <div className="copyright">
            © 2025 VerdeHire. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
