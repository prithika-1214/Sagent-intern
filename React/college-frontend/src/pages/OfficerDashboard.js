import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';

const OfficerDashboard = () => {
    const [apps, setApps] = useState([]);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = () => {
        api.get('/applications').then(res => setApps(res.data));
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/applications/${id}`, { status });
            fetchApps(); // Refresh table
        } catch (err) {
            alert("Update failed");
        }
    };

    return (
        <div className="dashboard-layout">
            <Navbar role="officer" />
            <div className="content">
                <h1>Officer Dashboard</h1>
                <table className="clean-table">
                    <thead>
                        <tr>
                            <th>App ID</th>
                            <th>Student ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map(app => (
                            <tr key={app.id}>
                                <td>{app.id}</td>
                                <td>{app.studentId}</td>
                                <td><span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span></td>
                                <td>
                                    <button className="action-btn approve" onClick={() => updateStatus(app.id, 'ACCEPTED')}>Accept</button>
                                    <button className="action-btn reject" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OfficerDashboard;