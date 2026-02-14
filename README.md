

# EDMS – Collaborative Workspace & Document Management System

A full-stack application for managing workspaces, documents, and team collaboration with role-based access control.

## Overview

This project allows users to create workspaces, upload and manage documents, invite members, and control access using roles and permissions. It is designed as a multi-tenant system where each workspace operates independently with its own members and documents.

## Features

* User authentication with JWT
* Workspace creation and management
* Document upload, preview, and organization
* Role-based access control (owner, admin, editor, viewer)
* Invitation-based member onboarding
* Document permissions and sharing
* Dashboard with workspace and document insights

## Tech Stack

**Frontend**

* React
* Redux Toolkit
* Tailwind CSS
* Axios

**Backend**

* Node.js
* Express.js
* JWT Authentication

**Database**

* MongoDB
* Mongoose

## Project Structure

```
frontend/     → React UI and state management
backend/      → API, controllers, middleware
models/       → Database schemas
routes/       → API endpoints
```

## Installation

### 1. Clone the repository

```
git clone <repo-url>
cd <project-folder>
```

### 2. Backend setup

```
cd backend
npm install
```

Create `.env` file:

```
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret
```

Run server:

```
npm start
```

### 3. Frontend setup

```
cd frontend
npm install
npm start
```

## API Base URL

```
http://localhost:5000/api
```

## Main Modules

* Authentication
* Workspaces
* Documents
* Invitations
* Permissions & Roles

## Future Improvements

* Real-time collaboration
* Activity logs
* File versioning enhancements
* Cloud storage integration

## Author

Harshal Pinge
