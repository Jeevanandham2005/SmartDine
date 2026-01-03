import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackgroundFood from './BackgroundFood';
import '../App.css';

function SignupPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    
    // Toggle states for the eye buttons
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- VALIDATION LOGIC ---
    const validatePassword = (password) => {
        if (password.length < 8) return "Password must be at least 8 characters long.";
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharRegex.test(password)) return "Password must contain at least one special symbol (!@#$%).";
        return null;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Check Matching
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        // 2. Check Rules
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: formData.username, 
                    password: formData.password 
                }),
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/login'); 
            } else { 
                setError(data.message || 'Registration failed.'); 
            }
        } catch (e) { 
            setError('Could not connect to the server.'); 
        }
    };

    return (
        <div className="main-wrapper">
            <BackgroundFood />
            
            <div className="auth-container">
                <div className="auth-header">
                    <h1>🍽️ SmartDine</h1>
                    <p>AI-Powered Food Discovery</p>
                </div>

                <div className="auth-card">
                    <h2>Create Account</h2>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="error-msg" style={{padding:'10px', fontSize:'0.9rem'}}>{error}</p>}
                        
                        <input 
                            className="input-field auth-input" 
                            type="text" 
                            name="username"
                            placeholder="Username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                        />
                        
                        {/* PASSWORD WITH EYE */}
                        <div className="password-wrapper">
                            <input 
                                className="input-field auth-input" 
                                type={showPwd ? "text" : "password"} 
                                name="password"
                                placeholder="Password (Min 8 chars, 1 symbol)" 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                            />
                            <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                                {showPwd ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {/* CONFIRM PASSWORD WITH EYE */}
                        <div className="password-wrapper">
                            <input 
                                className="input-field auth-input" 
                                type={showConfirmPwd ? "text" : "password"} 
                                name="confirmPassword"
                                placeholder="Confirm Password" 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                required 
                            />
                            <button type="button" className="eye-btn" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                                {showConfirmPwd ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <button type="submit" className="search-btn auth-btn">Sign Up</button>
                    </form>
                    <p className="auth-link-text">Already have an account? <Link to="/login">Log In</Link></p>
                </div>
            </div>
        </div>
    );
}
export default SignupPage;