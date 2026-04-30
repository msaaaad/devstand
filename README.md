# DevStand

A focused team standup & milestone tracker. Every developer owns their day, the whole team's progress is visible at a glance.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Express.js + TypeScript + Prisma |
| Database | PostgreSQL |
| Real-time | Socket.io |
| File Storage | MinIO (S3-compatible) |
| Frontend | Vue 3 + Vite + Tailwind + Vuex |
| Auth | JWT (jsonwebtoken) |
| Email | Nodemailer |
| Container | Docker + Docker Compose |

---

## Features

- **Today's Board** — color-coded employee cards, live updates via Socket.io
- **Standup Logger** — log tasks with time spent, challenge, what you learned; EOD summary; auto-lock at 6PM
- **Milestone Board** — Kanban pipeline (Backlog → To Do → Doing → Done → Deployed)
- **Task Approval Flow** — employees create tasks (pending), team leads approve/reject with email notifications
- **History Vault** — search all standups by person, date range, or keyword
- **Learning Feed** — Markdown posts, 💡🔥❓ reactions, manager can pin posts
- **3 Roles** — Manager, Team Lead, Employee with RBAC

---

## Quick Start (Docker)

```bash
# 1. Clone and enter
cd devstand

# 2. Copy env files
cp backend/.env.example backend/.env     # edit JWT_SECRET and MAIL_* values
cp frontend/.env.example frontend/.env

# 3. Start everything
docker compose up --build

# 4. In a new terminal, run migrations and seed
docker exec devstand_api npx prisma migrate deploy
docker exec devstand_api npm run db:seed
```

Open:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:4000
- **MinIO Console** → http://localhost:9001 (minioadmin / minioadmin)

### Seed Accounts (password: `password`)

| Email | Role |
|---|---|
| manager@devstand.app | Manager |
| lead@devstand.app | Team Lead |
| saad@devstand.app | Employee |
| rahim@devstand.app | Employee |
| nadia@devstand.app | Employee |

---

## Local Dev (without Docker)

### Backend

```bash
cd backend
npm install

# Start PostgreSQL and MinIO separately, then:
cp .env.example .env   # update DATABASE_URL to point to localhost

npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Deployment

### Backend → Railway

1. Push `backend/` folder to a GitHub repo
2. Connect Railway → New Project → Deploy from GitHub
3. Set environment variables in Railway dashboard (copy from `.env`, change `MINIO_ENDPOINT` to your MinIO host)
4. Add a PostgreSQL plugin in Railway — it sets `DATABASE_URL` automatically

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import in Vercel → framework: Vite
3. Set environment variables:
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   VITE_SOCKET_URL=https://your-railway-app.railway.app
   ```
4. Deploy

### MinIO on Production

For production, use MinIO on a VPS or Hetzner Object Storage. Update `MINIO_ENDPOINT`, `MINIO_PUBLIC_URL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` in your Railway env.

---

## Project Structure

```
devstand/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # All models
│   │   └── seed.ts                # Demo users
│   └── src/
│       ├── index.ts               # Server entry
│       ├── socket.ts              # Socket.io setup
│       ├── middleware/auth.ts     # JWT + role guards
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── standup.controller.ts
│       │   ├── milestone.controller.ts
│       │   ├── history.controller.ts
│       │   ├── notification.controller.ts
│       │   └── learning.controller.ts
│       ├── services/
│       │   ├── email.service.ts   # Nodemailer
│       │   ├── minio.service.ts   # File uploads
│       │   └── notification.service.ts
│       ├── jobs/standupLock.ts    # Cron: lock at 6PM
│       └── routes/index.ts        # All API routes
└── frontend/
    └── src/
        ├── views/
        │   ├── LoginView.vue
        │   ├── DashboardView.vue  # Today's Board
        │   ├── StandupView.vue    # My standup logger
        │   ├── MilestonesView.vue
        │   ├── MilestoneDetailView.vue  # Kanban
        │   ├── HistoryView.vue
        │   └── LearningView.vue
        ├── components/
        │   ├── common/
        │   │   ├── AppLayout.vue       # Sidebar + nav
        │   │   └── NotificationBell.vue
        │   ├── standup/EmployeeCard.vue
        │   ├── milestone/
        │   │   ├── MilestoneCard.vue
        │   │   └── TaskCard.vue        # Kanban card
        │   └── learning/LearningPostCard.vue
        ├── store/index.ts              # Vuex (all modules)
        ├── router/index.ts
        └── composables/useSocket.ts
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users` | List users |

### Standup
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/standup/today` | Board view — all users |
| GET | `/api/standup/mine` | My today standup |
| POST | `/api/standup/tasks` | Add task |
| PUT | `/api/standup/tasks/:id` | Update task |
| DELETE | `/api/standup/tasks/:id` | Delete task |
| PUT | `/api/standup/eod` | Save EOD summary |
| POST | `/api/standup/submit` | Submit standup |

### Milestones
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/milestones` | List active milestones |
| GET | `/api/milestones/archived` | Archived |
| GET | `/api/milestones/:id` | Detail with all tasks |
| POST | `/api/milestones` | Create (TL/Manager) |
| PUT | `/api/milestones/:id/archive` | Archive |
| POST | `/api/milestones/:id/tasks` | Add task |
| PUT | `/api/tasks/:id/stage` | Move pipeline stage |
| PUT | `/api/tasks/:id/assign` | Assign to employee |
| PUT | `/api/tasks/:id/self-assign` | Employee self-assigns |
| PUT | `/api/tasks/:id/approve` | TL approves |
| PUT | `/api/tasks/:id/reject` | TL rejects with note |

### History, Notifications, Learning
See `backend/src/routes/index.ts` for full list.

---

## Socket Events

| Event (client listens) | Payload | Trigger |
|---|---|---|
| `standup:updated` | `{ userId }` | Any standup save |
| `task:updated` | `task` | Task stage/approval change |
| `task:deleted` | `{ taskId }` | Task deleted |
| `milestone:completed` | `{ milestoneId, title }` | All tasks deployed |
| `notification:new` | `notification` | New notification for user |
| `learning:new` | `{ postId, title }` | New learning post |

---

## Notes

- Standups auto-lock at **18:00 UTC** every day (node-cron)
- Employees creating tasks → `approvalStatus: pending` → TL approves → moves to backlog
- Team leads creating tasks → auto-approved
- Email uses Nodemailer — configure Mailtrap for dev, any SMTP for production
- MinIO bucket `devstand` is created automatically on first start
