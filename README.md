# EDMS — Enterprise Document Management System

A full-stack collaborative workspace and document management platform where teams can securely store, organize, and manage documents with role-based access control — instead of relying on scattered tools like email and shared drives.

---

## Problem It Solves

Teams struggle with:
- Documents scattered across emails, drives, and chats
- No structured ownership or access control
- Difficult onboarding and collaboration tracking

EDMS solves this by providing centralized document storage inside structured, permission-controlled workspaces.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Redux Toolkit, React Router, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT-based authentication |
| API | Axios with interceptors |

---

## Core Features

- **JWT Authentication** — secure login, token validation on reload, auto logout on expiry
- **Workspace Management** — create isolated workspaces, manage members and settings
- **Invitation System** — email-based onboarding with role assignment and token expiry
- **Document Module** — upload, preview, tag, and manage documents per workspace
- **Role-Based Access Control** — owner, admin, editor, viewer roles with per-action permission flags
- **Protected Routes** — authentication and permission guards on both frontend and backend

---

## Architecture

```
Frontend (React + Redux)
    ↓ Axios (interceptors for token + 401 handling)
Backend (Node.js + Express)
    ↓ Auth Middleware → Permission Middleware
    ↓ Controllers
    ↓ Mongoose Models
MongoDB
```

**Request lifecycle:** every protected request is validated by JWT middleware, then the user's workspace role and permission flags are checked before the controller executes.

---

## Permission Model

Permissions operate at two levels:

- **Workspace-level** — embedded inside the workspace's members array as a permissions object (`view`, `edit`, `add`, `delete`, `invite`)
- **Document-level** — stored as a permissions array inside each document for granular access

Roles: `owner` → `admin` → `editor` → `viewer`

Permissions are always read from the database at request time — never trusted from the client or JWT payload.

---

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/       # UI primitives, guards, layout
│   │   ├── pages/            # Route-level views
│   │   ├── store/slices/     # Redux: auth, documents, ui
│   │   ├── hooks/            # useAuth, useDocuments, redux hooks
│   │   └── services/         # Centralized Axios API layer
├── backend/
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth + permission enforcement
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   └── config/               # DB connection
```

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.local .env        # add your MONGO_URI and JWT_SECRET
node server.js
```

### Frontend

```bash
cd frontend
npm install
cp .env.development .env
npm start
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/login` | Login, returns JWT |
| POST | `/api/users/register` | Register new user |
| GET | `/api/workspaces` | Get user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/documents?workspaceId=` | List workspace documents |
| POST | `/api/documents` | Upload document |
| POST | `/api/invitations` | Send workspace invitation |
| POST | `/api/invitations/accept` | Accept invitation by token |

---

## Key Design Decisions

**Why MongoDB over PostgreSQL?**
The permission model uses nested member objects inside workspaces. A single document read returns the workspace, all members, and their permission flags — no joins needed. This is the most frequent query in the system.

**Why Redux over Context API?**
Auth state, workspace context, and document state are shared across deeply nested, unrelated components. Redux gives structured async flows via thunks and predictable state transitions that Context would make messy.

**Why embed members in workspace instead of a separate collection?**
Permission checks happen on every authenticated request. Embedding keeps it a single DB read instead of a join, which matters at scale.

---

## Author

Built end-to-end by Harshal Pinge — system design, frontend, backend, database modeling, auth, and deployment.
