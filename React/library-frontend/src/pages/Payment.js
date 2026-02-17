import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const Payment = () => {
    const { appId } = useParams();
    const navigate = useNavigate();

    const handlePayment = async () => {
        try {
            await api.post('/payments', {
                applicationId: appId,
                amount: 500, // Fixed fee
                status: 'COMPLETED'
            });
            alert("Payment Successful!");
            navigate('/student-dashboard');
        } catch (err) {
            alert("Payment Failed");
        }
    };

    return (
        <div className="dashboard-layout">
            <Navbar role="student" />
            <div className="content">
                <div className="auth-card">
                    <h2>Fee Payment</h2>
                    <p>Application ID: <strong>{appId}</strong></p>
                    <p>Total Amount: <strong>$500</strong></p>
                    <button onClick={handlePayment} className="primary-btn" style={{backgroundColor: '#10b981'}}>
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;