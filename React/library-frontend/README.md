# Library Management System SPA (React + Vite)

Production-ready React SPA for your Spring Boot Library API.

## Tech Stack

- React 18 + Vite
- React Router DOM (SPA routing)
- Axios API layer
- React Hook Form + Zod validation
- Material UI (consistent UI framework)
- react-hot-toast notifications
- Role-based dashboards (MEMBER / LIBRARIAN)
- Error boundary + loading states + empty states

## Environment Setup

1. Create `.env` in project root.
2. Set:

```bash
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=http://localhost:8080
```

If not set, app defaults to:
- `VITE_API_BASE_URL=/api`
- `VITE_PROXY_TARGET=http://localhost:8080`

This routes API calls through Vite dev proxy and avoids CORS issues in local development.

## Run Instructions

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Required Routes Implemented

- `/login`
- `/register`
- `/member`
- `/member/books`
- `/member/reservations`
- `/member/borrows`
- `/member/fines`
- `/member/notifications`
- `/librarian`
- `/librarian/books`
- `/librarian/book-copies`
- `/librarian/reservations`
- `/librarian/borrows`
- `/librarian/fines`

## API Layer Design

- `src/api/axiosClient.js` as single Axios client.
- Per-resource services in `src/api/services/*`:
  - `booksService`
  - `bookCopiesService`
  - `membersService`
  - `librariansService`
  - `reservationsService`
  - `borrowsService`
  - `finesService`

All services use only your controller-defined endpoints.

## Use-Case to Endpoint Mapping

### 1) Member Registration / Login

- Register: `POST /members`
- Login fallback (no auth controller in provided backend):
  - `GET /members`
  - `GET /librarians`
  - Match by `libraryId` / `id` / `email`
  - Validate password only if backend payload includes a password field
- Session persistence: localStorage via `src/utils/storage.js`

### 2) Book Search + Availability

- Catalog source: `GET /books`
- Copy source: `GET /book-copies`
- Search is client-side by title/author/subject.
- Availability mapping is best-effort and isolated in:
  - `src/utils/entityMappers.js` -> `computeBookAvailabilityMap`

### 3) Borrowing / Reservation Flow

- Member request: `POST /reservations`
- Member cancel:
  - Try `DELETE /reservations/{id}`
  - Fallback to `PUT /reservations/{id}` with `CANCELED`
- Librarian approve/cancel reservation: `PUT /reservations/{id}`
- Librarian issue:
  - `POST /borrows`
  - `PUT /book-copies/{id}` to mark copy borrowed
  - `PUT /reservations/{id}` to set issued status

### 4) Return + Fines

- Return processing:
  - `PUT /borrows/{id}` with return date/status
  - `PUT /book-copies/{id}` set copy to available
- Fine handling:
  - Existing fine update: `PUT /fines/{id}`
  - New fine: `POST /fines`
- Fallback fine calculation isolated in:
  - `src/utils/fineUtils.js` -> `calculateFineForBorrow`

### 5) Inventory Management

- Books CRUD:
  - `POST /books`
  - `GET /books`
  - `PUT /books/{id}`
  - `DELETE /books/{id}`
- Book Copies CRUD:
  - `POST /book-copies`
  - `GET /book-copies`
  - `PUT /book-copies/{id}`
  - `DELETE /book-copies/{id}`
- Damaged/Lost status updates are done through copy updates.

### 6) Notifications

- No push endpoint required.
- Client-side reminders computed from borrows/fines:
  - Due soon
  - Overdue
  - Outstanding fines
- Notification logic:
  - `src/utils/notificationUtils.js`

## Dynamic Form / Unknown Field Fallback

If backend entity shape differs from expected fields:

- Forms use known common fields (name, email, password, title, author, subject, status, issue/due/return dates, etc.).
- Every CRUD form includes `Advanced JSON` editor.
- JSON is merged into payload before submit.

Implementation:

- `src/components/forms/DynamicForm.jsx`
- `src/components/forms/EntityDialogForm.jsx`

## Folder Structure

```text
college-frontend/
  .env.example
  index.html
  package.json
  vite.config.js
  src/
    App.jsx
    main.jsx
    api/
      axiosClient.js
      services/
        baseCrudService.js
        bookCopiesService.js
        booksService.js
        borrowsService.js
        finesService.js
        index.js
        librariansService.js
        membersService.js
        reservationsService.js
    auth/
      AuthContext.jsx
    components/
      common/
        EmptyState.jsx
        EntityTable.jsx
        ErrorBoundary.jsx
        LoadingState.jsx
        PageHeader.jsx
        StatCard.jsx
      forms/
        DynamicForm.jsx
        EntityDialogForm.jsx
      layout/
        AppLayout.jsx
    config/
      appConfig.js
    pages/
      NotFoundPage.jsx
      auth/
        LoginPage.jsx
        RegisterPage.jsx
      member/
        MemberBooksPage.jsx
        MemberBorrowsPage.jsx
        MemberDashboardPage.jsx
        MemberFinesPage.jsx
        MemberNotificationsPage.jsx
        MemberReservationsPage.jsx
      librarian/
        BookCopiesManagementPage.jsx
        BooksManagementPage.jsx
        LibrarianBorrowsPage.jsx
        LibrarianDashboardPage.jsx
        LibrarianFinesPage.jsx
        LibrarianReservationsPage.jsx
    routes/
      AppRouter.jsx
      ProtectedRoute.jsx
    styles/
      global.css
    types/
      models.js
    utils/
      dateUtils.js
      entityMappers.js
      fineUtils.js
      notificationUtils.js
      storage.js
```

## Assumptions (Important)

1. Backend may return different field names (`memberId` vs `member_id`, `status` vs `reservationStatus`, etc.).
2. Field inference and best-effort mapping are centralized in `src/utils/entityMappers.js`.
3. Member controller has no `GET /members/{id}`. App uses `GET /members` + filtering.
4. Authentication is local fallback because auth endpoints are not in provided controllers.
5. If no available copy is found at issue time, borrow can still be created (copy link optional), and behavior is surfaced in UI toast.

## Build Check

```bash
npm run build
```

This verifies Vite production compilation.
