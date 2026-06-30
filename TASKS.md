# DevStand — Task Board

---

## 🗄️ Backend

### Schema & Migration
- [ ] Add `taskType` enum to `StandupTask` → `yesterday | today | learned | challenge`
- [ ] Add `milestoneTaskId Int?` (nullable FK → `MilestoneTask`) to `StandupTask`
- [ ] Auto-create "Uncategorized" milestone helper (if not exists, create it — never duplicate)
- [ ] Run migration

### Standup Endpoints
- [ ] Update `POST /standup/tasks` — accept `taskType` and optional `milestoneTaskId`
- [ ] Update `PUT /standup/tasks/:id` — accept `taskType` and optional `milestoneTaskId`
- [ ] Update `GET /standup/mine` — return `milestoneTaskId` and linked task data in response
- [ ] Update `GET /standup/today` (board) — include each user's linked tasks with stage info

### Task Picker Endpoints
- [ ] `GET /tasks/mine` — return all milestone tasks assigned to current user (exclude `done` / `deployed`) — for "will do today" picker
- [ ] `GET /tasks/mine/recent-done` — return assigned tasks moved to `done` / `deployed` recently — for "yesterday" auto-suggest

### Inline Task Creation
- [ ] `POST /standup/tasks/create-linked` — create a new `MilestoneTask` under a given milestone (or Uncategorized), auto-assign to user, link to standup entry

---

## 🖥️ Frontend

### Standup View — Split into 2 Tabs
- [ ] Add tab switcher: **Morning Update** / **Day End Summary**
- [ ] Persist active tab in local state (not URL)
- [ ] Show Morning tab by default; switch to EOD tab after noon (optional UX touch)

### Morning Tab — Yesterday
- [ ] Auto-suggest tasks that were recently moved to `done` / `deployed` and assigned to user
- [ ] Allow manual pick from all assigned tasks
- [ ] Free-text fallback if no task selected
- [ ] Display linked task as a badge/chip (with stage color)

### Morning Tab — Today
- [ ] Task picker dropdown: show assigned tasks (exclude `done` / `deployed`)
- [ ] "Not found? Create it" option at bottom of picker
- [ ] Inline create flow:
  - [ ] Show milestone selector (active milestones list)
  - [ ] "No milestone" option → uses Uncategorized milestone
  - [ ] On confirm → creates task, auto-assigns to user, links to standup entry
- [ ] Display selected task as a linked chip

### Morning Tab — Other Fields
- [ ] **What I learned** — free text field
- [ ] **What challenge I faced** — free text field (new)

### EOD Tab
- [ ] Show list of today's linked "will do" tasks
- [ ] Auto-check tasks already in `done` or `deployed` stage
- [ ] Manual checkbox on remaining tasks → on check, moves milestone task to `done`
- [ ] **EOD narrative** — free text summary field
- [ ] Submit button — locks standup for the day

### Board View (`/board`) — Enrich Cards
- [ ] Show each user's "will do today" linked tasks on their board card
- [ ] Show stage badge per linked task
- [ ] Show EOD submitted indicator (✓ badge) on card
- [ ] Keep existing standup status indicators

---

## ✅ Done

- [x] Superadmin role + user approval flow
- [x] Leave management (casual / sick) with balance tracking
- [x] Formal leave request email to admin
- [x] Leave approval / rejection notifications (real-time + bell)
- [x] Task stage dropdown fix (dark theme, no native select)
- [x] Employee stage limited to `doing` / `done`
- [x] Nav icons replaced with inline SVG
- [x] Adminer added to docker-compose
- [x] Prisma migrations committed
- [x] TypeScript errors fixed
