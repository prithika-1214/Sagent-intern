import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [myApps, setMyApps] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch Courses
        api.get('/courses').then(res => setCourses(res.data));
        // Fetch My Applications
        api.get('/applications').then(res => setMyApps(res.data)).catch(err => console.log(err));
    }, []);

    return (
        <div className="dashboard-layout">
            <Navbar role="student" />
            <div className="content">
                <h1>Admissions Open</h1>
                
                {/* List Courses */}
                <div className="grid-container">
                    {courses.map(course => (
                        <div key={course.id} className="card">
                            <h3>{course.name}</h3>
                            <p>Duration: {course.duration}</p>
                            <button className="secondary-btn" onClick={() => navigate(`/apply/${course.id}`)}>
                                Apply Now
                            </button>
                        </div>
                    ))}
                </div>

                {/* List My Applications */}
                <h2 style={{marginTop: '2rem'}}>My Applications</h2>
                <table className="clean-table">
                    <thead><tr><th>App ID</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {myApps.map(app => (
                            <tr key={app.id}>
                                <td>{app.id}</td>
                                <td><span className={`badge ${app.status.toLowerCase()}`}>{app.status}</span></td>
                                <td>
                                    {/* If pending, show Pay button */}
                                    {app.status === 'PENDING' && 
                                        <button className="action-btn approve" onClick={() => navigate(`/payment/${app.id}`)}>Pay Fee</button>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentDashboard;