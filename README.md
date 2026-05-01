# PrioritEase

A smart task management PWA built for university students. PrioritEase integrates with Google Classroom to automatically import courses and assignments, calculates deadline-based priorities, and delivers push notifications when tasks are approaching or past their deadline.

**Live Demo:** [priorit-ease.vercel.app](https://priorit-ease.vercel.app)

---

## Features

- **Google OAuth** — one-click sign in with your university Google account
- **Google Classroom Sync** — imports your courses and assignments automatically
- **Priority Engine** — recalculates task urgency based on time left (high < 24h, medium < 72h, low > 72h)
- **Smart Notifications** — one-shot push notifications for deadline escalations and overdue tasks, no spam
- **Calendar View** — monthly and weekly views with tasks plotted on their deadlines
- **Analytics Dashboard** — task completion trends, per-course breakdowns, upcoming deadlines
- **PWA** — installable on desktop and mobile, works with push notifications

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- vite-plugin-pwa (Workbox, Web Push)

**Backend**
- Node.js + Express
- MySQL (via mysql2)
- JWT authentication
- node-cron for scheduled jobs
- web-push for VAPID push notifications
- Google Classroom API

**Infrastructure**
- Frontend → Vercel
- Backend → Vercel (serverless)
- Database → Clever Cloud (MySQL)

---

## Project Structure

```
PrioritEase/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js      # Google OAuth, JWT issuing
│   │   │   ├── analyticsController.js # Summary, trends, per-course stats
│   │   │   ├── courseController.js    # Course CRUD
│   │   │   ├── notificationController.js
│   │   │   └── taskController.js      # Task CRUD + status management
│   │   ├── jobs/
│   │   │   └── notificationJob.js     # Priority recalc + overdue marking
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # JWT verification
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── pushRoutes.js          # VAPID subscribe/unsubscribe
│   │   │   ├── classroomRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── services/
│   │   │   ├── priorityService.js     # Deadline priority calculation
│   │   │   ├── pushService.js         # Web Push via VAPID
│   │   │   ├── classroomService.js    # Google Classroom API integration
│   │   │   └── timeService.js         # PKT timezone helpers
│   │   └── server.js
│   ├── vercel.json
│   └── .env
│
└── frontend/
    ├── public/
    │   ├── sw.js                      # Custom service worker (push handler)
    │   ├── _redirects
    │   └── icons/
    ├── src/
    │   ├── api/
    │   │   └── axios.js               # Axios instance + JWT interceptor
    │   ├── components/
    │   │   ├── Layout.jsx             # Nav, sidebar, page wrapper
    │   │   ├── AmbientBackground.jsx  # Animated canvas background
    │   │   └── TaskDetailPanel.jsx    # Shared task detail/edit panel
    │   ├── context/
    │   │   └── AuthContext.jsx        # Auth state, login, logout
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Courses.jsx
    │   │   ├── Tasks.jsx
    │   │   ├── Calendar.jsx
    │   │   ├── Notifications.jsx
    │   │   └── Settings.jsx
    │   ├── utils/
    │   │   └── time.js                # PKT date formatting helpers
    │   └── App.jsx
    ├── index.html
    ├── vite.config.js
    └── vercel.json
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- MySQL (XAMPP or local)
- A Google Cloud project with OAuth 2.0 credentials and Classroom API enabled

### 1. Clone the repo

```bash
git clone https://github.com/bilalabbasi14/PrioritEase.git
cd PrioritEase
```

### 2. Set up the database

Start MySQL locally and create the database:

```sql
CREATE DATABASE prioritease;
```

Then import the schema:

```bash
mysql -u root prioritease < prioritease_export.sql
```

### 3. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=prioritease
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com
```

To generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Start the backend:

```bash
npm run dev
```

### 4. Configure the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

App will be available at `http://localhost:5173`.

---

## Environment Variables Reference

### Backend

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `VAPID_PUBLIC_KEY` | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | VAPID private key for Web Push |
| `VAPID_EMAIL` | Contact email for VAPID |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/google` | Exchange Google auth code for JWT |
| GET | `/api/auth/me` | Get current user |

### Courses
| Method | Route | Description |
|---|---|---|
| GET | `/api/courses` | Get all courses |
| POST | `/api/courses` | Create a course |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |

### Tasks
| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Notifications
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Get all notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| PUT | `/api/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete one |
| DELETE | `/api/notifications/all` | Delete all |

### Push
| Method | Route | Description |
|---|---|---|
| GET | `/api/push/vapid-public-key` | Get VAPID public key |
| POST | `/api/push/subscribe` | Subscribe device |
| DELETE | `/api/push/subscribe` | Unsubscribe device |

### Classroom
| Method | Route | Description |
|---|---|---|
| POST | `/api/classroom/sync` | Sync courses and assignments |

### Analytics
| Method | Route | Description |
|---|---|---|
| GET | `/api/analytics/summary` | Overall task summary |
| GET | `/api/analytics/upcoming` | Upcoming deadlines |
| GET | `/api/analytics/trend` | Completion trend |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Vercel (serverless) |
| Database | Clever Cloud (MySQL) |

### Notes
- Vercel serverless functions do not support persistent cron jobs. Priority recalculation and overdue marking are triggered manually via the sync button in the app.
- Clever Cloud free tier has a limit of 5 simultaneous MySQL connections. The pool is configured with `connectionLimit: 4` to stay within this limit.
- On Vercel serverless, API requests spins up a separate function instance with its own connection pool. So 4 simultaneous requests = 4 pools trying to open connections = instantly hits the 5 connection limit even with just you as the only user. So App may not fetch data from database after a few API requests like /api/courses, /api/tasks, /api/analytics/summary ,/api/analytics/upcoming

---

## Author

**Ahmad Bilal**
BS Computer Science — FAST-NUCES Islamabad
GitHub: [@bilalabbasi14](https://github.com/bilalabbasi14)
LinkedIn: [Ahmad Bilal](https://linkedin.com/in/ahmad-bilal)
