# EDMS — Enterprise Document Management System

A full-stack, multi-tenant document lifecycle platform. Teams work inside isolated **workspaces**, upload and organize documents, and move them through a **sequential review → approval workflow** with role-based access control enforced on every request — instead of tracking approvals over email and shared drives.

---

## Problem It Solves

Teams managing documents outside a structured system run into:
- No single source of truth — files scattered across email threads and shared drives
- No enforced approval trail — who reviewed what, and when, is undocumented
- Flat access control — everyone with a link can edit, or no one can

EDMS addresses this with permission-scoped workspaces, a fixed reviewer → approver pipeline per document, and an audit trail of every status transition.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, Redux Persist, React Router v7, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose (+ mongoose-paginate-v2) |
| Auth | JWT (access token, guest login supported) |
| Email | Nodemailer / SendGrid (workspace invitations) |
| API client | Axios with interceptors |
| CI/CD | GitHub Actions — lint, test, build, deploy to Vercel (frontend) + health-check Render (backend) |
| Testing | Jest + Supertest (backend) |

---

## Core Features

- **JWT authentication** — register, login, guest login, token validation on reload, auto logout on expiry
- **Workspaces** — create isolated workspaces, manage members, per-member permission flags
- **Invitation system** — email-based onboarding with token expiry, resend, bulk invite, and pending/accepted/rejected/expired states
- **Document management** — upload, preview, tag, describe, version, move, duplicate, bulk delete, export
- **Sequential approval workflow** — each document is routed through exactly one assigned reviewer, then one assigned approver, not a pool of candidates
- **Document lifecycle status** — `draft → in-review → final-review → approved`, with a full `DocumentHistory` audit trail of every transition
- **Favorites & sharing** — per-user favoriting, document sharing, granular per-user read/write permissions
- **Dashboard & Home** — attention-needed items, workspace quick access, recent documents, workspace stats
- **Calendar** — surfaces document `dueDate` / `expiryDate` across workspaces
- **Role-based access control** — enforced in middleware on both workspace and document operations, never trusted from the client

---

## Architecture

```
Frontend (React + Redux Toolkit)
    ↓ Axios (interceptors: auth token attach, 401 → logout)
Backend (Node.js + Express)
    ↓ auth middleware (JWT) → workspace/document access middleware
    ↓ Controllers
    ↓ Mongoose Models
MongoDB
```

Every protected request is authenticated by JWT middleware, then checked against the caller's workspace role and permission flags — read fresh from the database, not from the JWT payload — before the controller runs.

---

## Permission Model

Permissions operate at two levels:

**Workspace-level** — each entry in a workspace's `members[]` array carries a `role` (`admin` / `editor` / `viewer`) and a `permissions` object:
```js
{ canView, canEdit, canAdd, canDelete, canInvite, canManageWorkflow }
```
The workspace's `owner` is a separate top-level field, auto-added to `members[]` as `admin` on creation. `canManageWorkflow` gates who can assign a document's reviewer/approver.

**Document-level** — a `permissions[]` array on each document grants individual users `read` or `write` access, independent of workspace role. The document owner always has full access.

Permissions are always read from the database at request time, never trusted from the client or the JWT payload.

---

## Document Workflow

Each document carries a `workflow` object with exactly one `reviewer` and one `approver` (both `ObjectId` refs to `User`, assigned by a workspace admin or a member with `canManageWorkflow`). Status moves through:

```
draft → in-review → final-review → approved
```

`final-review` is a distinct stage from `in-review`: the assigned reviewer has already passed it, and the document is now waiting on the assigned approver, not the reviewer. Every transition — `workflow_assigned`, `submitted`, `changes_requested`, `review_passed`, `approved`, `overridden` — is written to a `DocumentHistory` collection with `fromStatus`, `toStatus`, `performedBy`, `actingRole`, and an optional comment, giving a full audit trail per document.

---

## Project Structure

```
edms/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/           # Primitives — Button, Card, Modal, Badge, Alert, Table, Dropdown...
│       │   ├── documents/    # StatusPill, StatusTransitionMenu, WorkflowAssignmentPanel, ReviewerPicker...
│       │   ├── dashboard/    # MetricTile, AttentionListItem, DashboardWidgets
│       │   ├── workspace/    # WorkspaceCard, WorkspaceSelector, CreateWorkspaceModal
│       │   ├── members/      # MemberList, MemberCard, RoleSelector, InviteMemberModal
│       │   ├── permissions/  # PermissionGuard, RoleBasedComponent
│       │   └── layout/       # Sidebar, GuestBanner, Footer
│       ├── pages/            # Home, Dashboard, DocumentList, DocumentDetail, Workspaces, Calendar...
│       ├── store/slices/     # auth, documents, ui (Redux Toolkit)
│       ├── hooks/            # useAuth, useDocuments, redux hooks
│       └── services/         # Centralized Axios API layer
│
├── backend/
│   ├── controllers/          # documentController, workspaceController, userController, invitationController
│   ├── middleware/           # auth (JWT), workspaceAuth (access/permission checks)
│   ├── models/                # User, Workspace, Document, DocumentHistory, WorkspaceInvitation
│   ├── routes/                # userRoutes, workspaceRoutes, documentRoutes, invitationRoutes
│   └── config/                 # DB connection
│
└── .github/workflows/pipeline.yml   # CI: lint + test → build → deploy frontend (Vercel) → health-check backend (Render)
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
cp .env.local .env        # set MONGO_URI, JWT_SECRET, and email provider credentials
npm run dev                # nodemon, or: node server.js
```

Backend exits on boot if `MONGO_URI` or `JWT_SECRET` is missing. Health check: `GET /health`.

### Frontend

```bash
cd frontend
npm install
cp .env.development .env   # set REACT_APP_API_URL
npm start
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login, returns JWT |
| POST | `/api/users/guest-login` | Guest session |
| GET/PUT | `/api/users/profile` | Get / update profile |
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET/PUT/DELETE | `/api/workspaces/:id` | Get / update / delete workspace |
| POST | `/api/workspaces/:id/members` | Add member (invitation flow) |
| PUT/DELETE | `/api/workspaces/:id/members/:memberId` | Update role / remove member |
| GET | `/api/documents/workspace/:workspaceId` | List workspace documents |
| POST | `/api/documents` | Upload document |
| GET/PUT/DELETE | `/api/documents/:id` | Get / update / delete document |
| PATCH | `/api/documents/:id/workflow` | Assign reviewer + approver |
| PATCH | `/api/documents/:id/status` | Transition lifecycle status |
| PUT | `/api/documents/:id/favorite` | Toggle favorite |
| POST | `/api/documents/:id/share` | Share document |
| GET | `/api/documents/dashboard-data` | Dashboard aggregates |
| POST | `/api/invitations/send` | Send workspace invitation |
| POST | `/api/invitations/:token/accept` | Accept invitation by token |

---

## Key Design Decisions

**Why MongoDB over PostgreSQL?**
The permission model embeds `members[]` (with per-member role and permission flags) directly inside the workspace document. A single read returns the workspace, every member, and their permissions — no joins — for what is the most frequent query in the system.

**Why Redux Toolkit over Context API?**
Auth state, workspace context, and document state are shared across deeply nested, unrelated routes. Redux Toolkit gives structured async flows via thunks and predictable state transitions that Context makes hard to reason about at this depth.

**Why a fixed reviewer/approver instead of a reviewers pool?**
An earlier design used a `reviewers[]` array of candidate approvers. It was replaced with a single `workflow.reviewer` and single `workflow.approver` field, plus a `final-review` status and a `DocumentHistory` collection — so every document has one clearly accountable reviewer and one clearly accountable approver, and every transition between them is logged rather than inferred.

---

## Author

Built end-to-end by Harshal Pinge — system design, frontend, backend, database modeling, auth, and deployment.
