# TaskFlow

A personal task and project manager built with the MERN stack. Users register, log in, organise work into projects, and track tasks with priorities, due dates, filters, search and a progress dashboard.

## Live Demo

| | Link |
|---|---|
| Frontend | https://taskflow-ten-olive.vercel.app |
| Backend API | https://taskflow-myf4.onrender.com/api |
| Health check | https://taskflow-myf4.onrender.com/api/health |

The backend runs on a free Render instance. After 15 minutes of inactivity it sleeps, so the first request can take 30 to 60 seconds. To try the app, register a new account on the login page.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, plain CSS (no UI libraries) |
| Backend | Node.js, Express.js (ES modules) |
| Database | MongoDB (Atlas in production) with Mongoose |
| Auth | JWT, bcrypt |
| Validation | express-validator and Mongoose schema validation |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Features

- **Authentication:** register, login, logout, JWT-protected routes, passwords hashed with bcrypt.
- **Ownership:** every query is scoped to the logged-in user. One user can never read or change another user's data.
- **Projects:** create, edit, delete. Each project has a name, description, colour, created date, task count and completion percentage. Deleting a project also deletes its tasks.
- **Tasks:** create, edit, delete, mark complete from the list, move a task to another project. Fields: title, description, status, priority, due date, project.
- **Filters, search and sort:** filter by status, priority, project and due date range. Search by title. Sort by due date, priority or created date. All of these work together in one query.
- **Dashboard:** total, completed, pending and overdue counts, tasks due today and this week, and a progress bar per project.
- **UX states:** empty, loading and error states on every page.
- **Dark mode:** toggle in the navbar, saved in the browser and defaults to the system setting.

## Folder Structure

```
taskflow/
├── client/
│   └── src/
│       ├── components/     Layout, ProtectedRoute
│       ├── context/        AuthContext
│       ├── hooks/          useDebounce
│       ├── pages/          Login, Register, Dashboard, Projects, Tasks
│       ├── services/       api (axios), dashboard, project, task services
│       └── utils/          getErrorMessage
├── server/
│   ├── config/             db connection
│   ├── controllers/        auth, project, task, dashboard
│   ├── middleware/         auth (protect), validate, errorHandler
│   ├── models/             User, Project, Task
│   ├── routes/             auth, project, task, dashboard
│   └── server.js
├── .env.example
└── README.md
```

## Running Locally

### Prerequisites

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Clone and install

```bash
git clone https://github.com/Praveen-Bhandari/taskflow.git
cd taskflow

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

Copy the values from `.env.example` into two files.

`server/.env`

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

`client/.env`

```
VITE_API_URL=http://localhost:5000/api
```

`CLIENT_URL` must exactly match the address the frontend runs on, with no trailing slash. Otherwise the browser blocks API calls (CORS).

### 3. Start both servers

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

Open http://localhost:5173.

## API Documentation

Base URL: `/api`. All endpoints except register and login need the header `Authorization: Bearer <token>`.

### Response format

```json
{ "success": true, "message": "Tasks fetched", "data": { } }
```

```json
{
  "success": false,
  "message": "Due date cannot be in the past",
  "errors": [{ "field": "dueDate", "message": "Due date cannot be in the past" }]
}
```

### Status codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error, or email already registered |
| 401 | Missing or invalid token, or wrong credentials |
| 404 | Not found, or not owned by the caller |
| 500 | Unexpected server error |

Another user's resource returns 404 instead of 403. The server always filters by owner, so for the caller that record does not exist, and its ID is not revealed.

### Auth

| Method | Endpoint | Body | Result |
|---|---|---|---|
| POST | `/auth/register` | `name, email, password` (min 6) | 201, token and user |
| POST | `/auth/login` | `email, password` | 200, token and user |
| GET | `/auth/me` | none | 200, current user |

### Projects

| Method | Endpoint | Body | Result |
|---|---|---|---|
| GET | `/projects` | none | All projects with `taskCount`, `completedCount`, `completionPercentage` |
| POST | `/projects` | `name, description?, color?` | 201, project |
| GET | `/projects/:id` | none | Project with stats |
| PUT | `/projects/:id` | `name?, description?, color?` | Updated project |
| DELETE | `/projects/:id` | none | Deletes the project and all its tasks |

Rules: name required (max 60), description max 300, colour must be a hex code.

### Tasks

| Method | Endpoint | Body or query | Result |
|---|---|---|---|
| GET | `/tasks` | `status, priority, projectId, search, dueFrom, dueTo, sort, order` | Filtered and sorted tasks |
| POST | `/tasks` | `title, project, description?, status?, priority?, dueDate?` | 201, task |
| PUT | `/tasks/:id` | any task field (changing `project` moves the task) | Updated task |
| PATCH | `/tasks/:id/status` | `status` | Updated task |
| DELETE | `/tasks/:id` | none | Deleted |

Rules: title required (max 120), description max 1000, status is `todo`, `in-progress` or `done`, priority is `low`, `medium` or `high`. On creation the due date cannot be in the past. `sort` is `dueDate`, `priority` or `createdAt`, and `order` is `asc` or `desc`.

### Dashboard

`GET /dashboard` returns:

```json
{
  "stats": { "total": 0, "completed": 0, "pending": 0, "overdue": 0, "dueToday": 0, "dueThisWeek": 0 },
  "todayTasks": [],
  "weekTasks": [],
  "projectProgress": [
    { "_id": "...", "name": "College", "color": "#3b82f6", "taskCount": 0, "completedCount": 0, "completionPercentage": 0 }
  ]
}
```

Pending means not done. Overdue means pending with a due date before today. Due this week covers today and the next 7 days. Each task list returns at most 10 items.

## Database Design

Three collections. Task references User and Project, and Project references User.

| Model | Main fields |
|---|---|
| User | name, email (unique), password (bcrypt hash) |
| Project | user, name, description, color, timestamps |
| Task | user, project, title, description, status, priority, dueDate, timestamps |

### Indexes

| Index | Used for |
|---|---|
| Project `{ user, createdAt: -1 }` | Listing a user's projects, newest first |
| Task `{ user, project, status }` | Per-project counts and progress, project cascade delete, project filter |
| Task `{ user, dueDate }` | Due date sort and range filter, overdue, due today, due this week |
| Task `{ user, status, priority, createdAt: -1 }` | Status and priority filters, created date sort |

Every index starts with `user`, because every query is scoped to the owner.

## Deployment Notes

- **Database:** MongoDB Atlas free cluster. Network access allows `0.0.0.0/0` because Render's IP changes.
- **Backend (Render):** root directory `server`, build command `npm install`, start command `npm start`. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (the Vercel URL).
- **Frontend (Vercel):** root directory `client`. Environment variable `VITE_API_URL` pointing at the Render URL ending in `/api`. Vite reads it at build time, so redeploy after changing it. `client/vercel.json` rewrites all paths to `index.html` so page refreshes work.
- File names are case sensitive on Linux hosting, so imports must match exactly (for example `models/User.js`).

## Known Limitations

- "Today" is calculated in UTC, so between midnight and about 5:30 AM IST the dashboard's "due today" can be one day behind.
- The past due date rule applies when creating a task, not when editing one.
- Duplicate project names are allowed.
