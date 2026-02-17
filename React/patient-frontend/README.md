# Patient Monitoring System Frontend

React SPA built with Vite for patient registration, health data entry, doctor dashboard, appointments, and feedback management.

## Tech Stack

- React (JavaScript)
- Vite
- React Router
- Axios
- Bootstrap 5

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Environment Variables

Create `.env` with:

```env
VITE_API_BASE_URL=http://localhost:8080
```

In development, API calls go through the Vite proxy (`/api`) to avoid browser CORS issues.

## Routes

- `/login`
- `/register/patient`
- `/register/doctor`
- `/patient/registration`
- `/patient/health-data`
- `/patient/feedback`
- `/doctor/dashboard`
- `/doctor/consultation`

## Project Structure

```text
src/
  api/
    axios.js
    patients.js
    doctors.js
    vitals.js
    medicalHistory.js
    appointments.js
    feedback.js
  components/
    AppLayout.jsx
    ErrorAlert.jsx
    LoadingSpinner.jsx
    ToastProvider.jsx
  context/
    AuthContext.jsx
  pages/
    LoginPage.jsx
    PatientRegistrationPage.jsx
    DoctorRegistrationPage.jsx
    HealthDataPage.jsx
    PatientFeedbackPage.jsx
    DoctorDashboardPage.jsx
    DoctorConsultationPage.jsx
    NotFoundPage.jsx
  routes/
    AppRoutes.jsx
    ProtectedRoute.jsx
  styles/
    app.css
  utils/
    assignments.js
    formatters.js
  App.jsx
  main.jsx
```
