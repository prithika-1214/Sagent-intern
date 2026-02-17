# Personal Budget Tracker Frontend

React (JavaScript) + Vite SPA for a Spring Boot backend.

## Run

```bash
npm install
npm run dev
```

App URL: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Environment

Set backend base URL in `.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8082
```

## Implemented modules

- User registration and user management (select active user)
- Income tracking (CRUD + totals + month filter)
- Expense logging (CRUD + category mapping + totals + month filter)
- Categories and budget limits (CRUD + spending-vs-limit progress)
- Savings goals (CRUD + progress)
- Dashboard (totals, recent transactions, category and monthly charts)

## Backend endpoints used

- `POST /users`, `GET /users`, `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}`
- `GET /income`, `GET /income/{id}`, `POST /income`, `PUT /income/{id}`, `DELETE /income/{id}`
- `GET /expenses`, `GET /expenses/{id}`, `POST /expenses`, `PUT /expenses/{id}`, `DELETE /expenses/{id}`
- `GET /categories`, `GET /categories/{id}`, `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}`
- `GET /savings`, `GET /savings/{id}`, `POST /savings`, `PUT /savings/{id}`, `DELETE /savings/{id}`
- `GET /balance`, `GET /balance/{id}`, `POST /balance`, `PUT /balance/{id}`, `DELETE /balance/{id}`
