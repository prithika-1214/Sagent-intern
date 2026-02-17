// src/pages/Register.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

const Register = () => {
    const { registerStudent } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await registerStudent(formData);
        if (result.success) {
            alert("Registration successful! Please login.");
            navigate('/login');
        } else {
            alert("Registration failed.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Student Registration</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Full Name" 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        required 
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    <button type="submit" className="primary-btn">Create Account</button>
                </form>
                <p style={{ marginTop: '15px' }}>
                    Already registered? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;