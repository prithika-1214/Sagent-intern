# College Admissions Management Frontend (Vite + React)

Production-ready React SPA for a College Admissions Management System frontend.

This project is frontend-only and is wired against the discovered Spring Boot endpoints.

## Tech Stack

- Vite + React (JavaScript)
- React Router
- Axios
- TanStack React Query
- React Hook Form + Yup
- Material UI + MUI Data Grid
- React Toastify

## Endpoint Discovery (from controllers)

I could not access the exact `/mnt/data/*.java` path in this environment, so I inferred routes from the locally available backend project controllers at:

- `C:\Sagent\Springboot\college-admission-app\src\main\java\com\college\admission\controller\UserController.java`
- `C:\Sagent\Springboot\college-admission-app\src\main\java\com\college\admission\controller\ApplicationController.java`
- `C:\Sagent\Springboot\college-admission-app\src\main\java\com\college\admission\controller\DesiredCourseController.java`
- `C:\Sagent\Springboot\college-admission-app\src\main\java\com\college\admission\controller\DocumentController.java`
- `C:\Sagent\Springboot\college-admission-app\src\main\java\com\college\admission\controller\FeesPaymentController.java`

### Discovered API routes

#### Auth/User (mapped from `UserController`)
- `POST /api/users/register`
  - Request: `{ name, email, password, role, age }`
  - Response: `User`
- `POST /api/users/login`
  - Request: `{ email, password }`
  - Response: `User | null`
- `GET /api/users`
  - Response: `User[]`
- `GET /api/users/{id}`
  - Response: `User`
- `PUT /api/users/{id}`
  - Request: partial user (`name, age, email` used)
  - Response: `User`
- `DELETE /api/users/{id}`
  - Response: `"User deleted successfully"`

#### Applications (`ApplicationController`)
- `POST /api/applications`
  - Request: `Application`
  - Response: `Application`
- `GET /api/applications`
  - Response: `Application[]`
- `GET /api/applications/{id}`
  - Response: `Application`
- `PUT /api/applications/{id}`
  - Request: fields used by backend update: `{ status, percentage, address }`
  - Response: `Application`
- `DELETE /api/applications/{id}`
  - Response: `"Application deleted successfully"`

#### Courses (`DesiredCourseController`)
- `POST /api/courses`
- `GET /api/courses`
- `GET /api/courses/{id}`
- `PUT /api/courses/{id}`
- `DELETE /api/courses/{id}`

#### Documents (`DocumentController`)
- `POST /api/documents`
  - Request: `{ application: { appId }, fileUrl, docType }`
  - Response: `Document`
- `GET /api/documents`
- `GET /api/documents/{id}`
- `PUT /api/documents/{id}`
- `DELETE /api/documents/{id}`

#### Payments (`FeesPaymentController`)
- `POST /api/payments`
  - Request: `{ application: { appId }, payMethod, status, amount }`
  - Response: `FeesPayment`
- `GET /api/payments`
- `GET /api/payments/{id}`
- `PUT /api/payments/{id}`
- `DELETE /api/payments/{id}`

## Notes on requested controllers

Requested but not found in the inspected backend project:
- `ReviewRecordController`
- `AppStatusController`

Frontend behavior for these:
- Officer review notes are stored locally (browser `localStorage`) as fallback.
- Timeline is composed from application + payment timestamps + local review notes.

## Document Upload Note

The inspected backend `DocumentController` accepts JSON `@RequestBody Document`, not `multipart/form-data`.

So frontend does this for compatibility:
- Reads selected files as Data URLs.
- Sends `fileUrl` + `docType` + `application.appId` JSON payload.
- Shows upload progress in UI.

If your backend supports multipart in another controller version, update `src/services/documentService.js` accordingly.

## Project Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` in project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3) Run dev server

```bash
npm run dev
```

### 4) Build production bundle

```bash
npm run build
```

## CORS Notes

Frontend uses browser requests to `VITE_API_BASE_URL`, so backend must allow your frontend origin.

Example frontend origin during dev:
- `http://localhost:5173`

In Spring Boot, ensure CORS is enabled for this origin (global CORS config or controller-level config).

## Implemented Screens

Public:
- Landing
- Not Found

Student:
- Register
- Login
- Dashboard
- New Application (6-step wizard)
- My Applications
- Application Details

Officer:
- Login
- Dashboard with search + status/course/date/appId filters
- App details review modal
- Status update
- Review notes (local fallback)

## Runtime Features

- Role-based route guards (`student` vs `officer`)
- Centralized Axios instance + request/response interceptors
- Auto-logout handling for `401/403`
- React Query caching + invalidation
- Form validation with Yup
- Loading, empty, and error states
- Toast notifications

