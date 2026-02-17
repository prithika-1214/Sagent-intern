// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const recoverSession = () => {
            try {
                const token = localStorage.getItem('token');
                const role = localStorage.getItem('role');
                const userData = localStorage.getItem('user');
                
                if (token && role && userData) {
                    setUser({ role, ...JSON.parse(userData) });
                }
            } catch (error) {
                localStorage.clear();
            } finally {
                setLoading(false);
            }
        };
        recoverSession();
    }, []);

    const login = async (email, password, role) => {
        try {
            const endpoint = role === 'student' ? '/auth/student/login' : '/auth/officer/login';
            const response = await api.post(endpoint, { email, password });
            
            const token = response?.data?.token || `Basic ${btoa(`${email}:${password}`)}`;
            const userData = response?.data?.user || response?.data || {};

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser({ role, ...userData });
            navigate(role === 'student' ? '/student-dashboard' : '/officer-dashboard');
            return { success: true };
        } catch (error) {
            return { success: false, message: "Invalid credentials" };
        }
    };

    const registerStudent = async (studentData) => {
        try {
            await api.post('/auth/student/register', studentData);
            return { success: true };
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                'Registration failed';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, registerStudent, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
