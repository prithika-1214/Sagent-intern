# Tickify Frontend

React + Vite frontend for movies, events, and concerts booking integrated with Spring Boot REST APIs.

## Tech Stack

- React (JavaScript)
- Vite
- React Router
- Axios
- Plain CSS

## API Base URL

- Frontend requests default to `/api` through the Vite dev or preview proxy.
- Outside Vite proxy mode, the frontend falls back to `http://localhost:8080`.
- Proxy target default: `http://localhost:8080`
- Config files: `src/api/axios.js`, `vite.config.js`
- Environment overrides:
  - `VITE_API_BASE_URL` (leave empty to use the smart fallback)
  - `VITE_API_PROXY_TARGET` (default `http://localhost:8080`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Build production:
   ```bash
   npm run build
   ```

## Folder Structure

```text
src/
  api/
    axios.js
    usersApi.js
    eventsApi.js
    venuesApi.js
    seatsApi.js
    schedulesApi.js
    eventSeatsApi.js
    bookingsApi.js
    bookedSeatsApi.js
    paymentsApi.js
    cancellationsApi.js
  components/
    common/
      ConfirmDialog.jsx
      DataTable.jsx
      EmptyState.jsx
      ErrorState.jsx
      FormInput.jsx
      Loader.jsx
      Modal.jsx
      SelectInput.jsx
      StatCard.jsx
      ToastProvider.jsx
    layout/
      Navbar.jsx
      Footer.jsx
      Sidebar.jsx
    events/
      EventCard.jsx
      ScheduleCard.jsx
    seats/
      SeatGrid.jsx
    booking/
      BookingSummary.jsx
      CancellationForm.jsx
    admin/
      AdminCrudPage.jsx
      AdminEntityForm.jsx
  hooks/
    useAsync.js
    useDebounce.js
    useLocalStorage.js
  utils/
    entity.js
    format.js
    status.js
    storage.js
  pages/
    public/
      PublicLayout.jsx
      LandingPage.jsx
      EventsPage.jsx
      EventDetailsPage.jsx
      SeatSelectionPage.jsx
      CheckoutPage.jsx
      BookingSuccessPage.jsx
      MyBookingsPage.jsx
      NotFoundPage.jsx
    admin/
      AdminLayout.jsx
      DashboardHomePage.jsx
      ManageEventsPage.jsx
      ManageVenuesPage.jsx
      ManageSeatsPage.jsx
      ManageSchedulesPage.jsx
      ManageEventSeatsPage.jsx
      ManageUsersPage.jsx
      ManagePaymentsPage.jsx
      ManageCancellationsPage.jsx
  router/
    index.jsx
  styles/
    index.css
  App.jsx
  main.jsx
```
