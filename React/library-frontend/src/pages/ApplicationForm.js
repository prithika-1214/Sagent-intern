import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ApplicationForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    address: '',
    grades: '',
    subjects: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      studentId: user?.id || user?.studentId,
      courseId: Number(courseId),
      personalDetails: {
        name: formData.fullName,
        dob: formData.dob,
        address: formData.address,
      },
      academicDetails: {
        grades: formData.grades,
        subjects: formData.subjects,
      },
      status: 'PENDING',
    };

    try {
      const response = await api.post('/applications', payload);
      const appId = response?.data?.id || response?.data?.applicationId;

      alert('Application submitted successfully.');
      navigate(appId ? `/payment/${appId}` : '/student-dashboard');
    } catch (err) {
      alert('Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar role="student" />
      <div className="content">
        <div className="auth-card" style={{ maxWidth: '700px' }}>
          <h2>Application Form</h2>
          <p>Course ID: {courseId}</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
            />
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Grades (Example: 92%)"
              value={formData.grades}
              onChange={(e) =>
                setFormData({ ...formData, grades: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Subjects (Example: Math, Physics, Chemistry)"
              value={formData.subjects}
              onChange={(e) =>
                setFormData({ ...formData, subjects: e.target.value })
              }
              required
            />
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
