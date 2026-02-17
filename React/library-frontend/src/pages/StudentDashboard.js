import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, appsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/applications'),
        ]);

        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const myApplications = useMemo(() => {
    const userId = user?.id || user?.studentId;
    if (!userId) return applications;

    return applications.filter(
      (app) => app.studentId === userId || app.student?.id === userId
    );
  }, [applications, user]);

  return (
    <div className="dashboard-layout">
      <Navbar role="student" />
      <div className="content">
        <h2>Student Dashboard</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error-msg">{error}</p>}

        <h3>Available Courses</h3>
        <div className="grid-container">
          {courses.map((course) => {
            const id = course.id || course.courseId;
            return (
              <div key={id} className="card">
                <h4>{course.name || course.courseName || `Course ${id}`}</h4>
                <p>{course.description || 'No description available.'}</p>
                <button
                  className="primary-btn"
                  onClick={() => navigate(`/apply/${id}`)}
                >
                  Apply
                </button>
              </div>
            );
          })}
        </div>

        <h3 style={{ marginTop: '2rem' }}>My Applications</h3>
        <table className="clean-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Course</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myApplications.map((app) => {
              const appId = app.id || app.applicationId;
              const status = (app.status || 'PENDING').toLowerCase();
              return (
                <tr key={appId}>
                  <td>{appId}</td>
                  <td>{app.courseName || app.course?.name || app.courseId}</td>
                  <td>
                    <span className={`badge ${status}`}>{status}</span>
                  </td>
                  <td>
                    <button
                      className="secondary-btn"
                      onClick={() => navigate(`/documents/${appId}`)}
                    >
                      Upload Docs
                    </button>
                    <button
                      className="secondary-btn"
                      style={{ marginLeft: '8px' }}
                      onClick={() => navigate(`/payment/${appId}`)}
                    >
                      Pay Fee
                    </button>
                    <button
                      className="secondary-btn"
                      style={{ marginLeft: '8px' }}
                      onClick={() => navigate(`/status/${appId}`)}
                    >
                      Status
                    </button>
                  </td>
                </tr>
              );
            })}
            {myApplications.length === 0 && !loading && (
              <tr>
                <td colSpan="4">No applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
