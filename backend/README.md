# WECARE Backend (MongoDB Atlas)

## Setup

```bash
cd backend
npm.cmd install
```

Create `backend/.env` (see `.env.example`).

Required core values:

```env
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5500
MONGODB_URI=...
JWT_SECRET=...
SESSION_SECRET=...
JWT_EXPIRES_IN=7d
```

## Run

```bash
npm.cmd run dev
```

Base API URL: `http://localhost:5000/api`

## Auth

- `POST /auth/register` (public: healthcare provider only)
- `POST /auth/login` (email/password, role auto-detected)
- `GET /auth/me` (token required)

OAuth routes (configure provider env vars first):
- `GET /auth/oauth/google`
- `GET /auth/oauth/github`
- `GET /auth/oauth/microsoft`
- `GET /auth/oauth/apple`

## Student Registration Flow

Healthcare provider registers a student via `POST /students` with:
- student profile
- parent account credentials
- student account credentials

Backend creates linked parent+student users and sends parent notification.

## Security Notes

- Passwords are hashed with `bcryptjs` before storage.
- Role-based route authorization is enforced.
- `helmet` and auth rate limiting are enabled.
