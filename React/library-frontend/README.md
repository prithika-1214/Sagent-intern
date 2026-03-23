# Library Management Frontend

React 18 + Vite single-page app for a Library Management System.

## Run

```bash
npm install
npm run dev
```

## Backend

This frontend uses only these Spring endpoints:

- `/books`
- `/book-copies`
- `/borrows`
- `/fines`
- `/librarians`
- `/members`
- `/reservations`

The API base URL is hardcoded in `src/api/axiosClient.js`:

```js
const BASE_URL = "http://localhost:8080";
```
