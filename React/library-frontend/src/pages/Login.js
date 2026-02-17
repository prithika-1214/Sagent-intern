// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../App.css'; // This makes it look good

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // Default role
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password, role);
        if (!result.success) setError(result.message);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>College Portal</h2>
                <p style={{textAlign: 'center', color: '#666', marginBottom: '20px'}}>
                    Login to manage applications
                </p>
                
                {/* Role Toggle Switch */}
                <div className="role-toggle">
                    <button 
                        className={role === 'student' ? 'active' : ''} 
                        onClick={() => setRole('student')}>Student</button>
                    <button 
                        className={role === 'officer' ? 'active' : ''} 
                        onClick={() => setRole('officer')}>Officer</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        placeholder={`${role === 'student' ? 'Student' : 'Officer'} Email`} 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    {error && <p className="error-msg">{error}</p>}
                    
                    <button type="submit" className="primary-btn">
                        Login as {role}
                    </button>
                </form>

                {role === 'student' && (
                    <p className="redirect-text">
                        Don't have an account? <Link to="/register">Register Here</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;