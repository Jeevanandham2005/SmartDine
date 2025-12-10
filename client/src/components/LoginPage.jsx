import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackgroundFood from './BackgroundFood';
import '../App.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Toggle state for eye button
    const [showPwd, setShowPwd] = useState(false);
    
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/search');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token); 
                navigate('/search');
            } else {
                setError(data.message || 'Login failed.');
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
                    <h2>Welcome Back!</h2>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="error-msg" style={{padding:'10px', fontSize:'0.9rem'}}>{error}</p>}
                        
                        <input 
                            className="input-field auth-input" 
                            type="text" 
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                        
                        {/* PASSWORD WITH EYE */}
                        <div className="password-wrapper">
                            <input 
                                className="input-field auth-input" 
                                type={showPwd ? "text" : "password"} 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                                {showPwd ? "🙈" : "👁️"}
                            </button>
                        </div>
                        
                        <button type="submit" className="search-btn auth-btn">Log In</button>
                    </form>
                    <p className="auth-link-text">Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </div>
            </div>
        </div>
    );
}
export default LoginPage;