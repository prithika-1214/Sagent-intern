import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const ApplicationForm = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState({ dob: '', address: '', marks: '' });
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Application
            const appRes = await api.post('/applications', { 
                courseId, 
                ...details, 
                status: 'PENDING' 
            });
            const appId = appRes.data.id;

            // 2. Upload Document
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('applicationId', appId);
                
                await api.post('/documents', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert("Application Submitted! Proceeding to Payment...");
            navigate(`/payment/${appId}`);
        } catch (err) {
            alert("Submission failed. Please try again.");
        }
    };

    return (
        <div className="dashboard-layout">
            <Navbar role="student" />
            <div className="content">
                <div className="auth-card" style={{maxWidth: '600px'}}>
                    <h2>Application Form</h2>
                    <form onSubmit={handleSubmit}>
                        <label>Date of Birth</label>
                        <input type="date" onChange={(e) => setDetails({...details, dob: e.target.value})} required />
                        
                        <label>Address</label>
                        <input type="text" placeholder="Full Address" onChange={(e) => setDetails({...details, address: e.target.value})} required />
                        
                        <label>High School Marks (%)</label>
                        <input type="number" placeholder="Marks" onChange={(e) => setDetails({...details, marks: e.target.value})} required />
                        
                        <label>Upload Marksheet (PDF/Image)</label>
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
                        
                        <button type="submit" className="primary-btn">Submit Application</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;