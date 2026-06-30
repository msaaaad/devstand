import { Router } from 'express'
import multer from 'multer'
import { authenticate, canApprove, canManageMilestones, managerOnly, superAdminOnly } from '../middleware/auth'
import * as auth from '../controllers/auth.controller'
import * as admin from '../controllers/admin.controller'
import * as leave from '../controllers/leave.controller'
import * as standup from '../controllers/standup.controller'
import * as milestone from '../controllers/milestone.controller'
import * as history from '../controllers/history.controller'
import * as notification from '../controllers/notification.controller'
import * as learning from '../controllers/learning.controller'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// --- Auth (public) ---
router.post('/auth/register', auth.register)
router.post('/auth/login', auth.login)

// --- Protected ---
router.use(authenticate)

// Admin (superadmin only)
router.get('/admin/users', superAdminOnly, admin.listUsers)
router.patch('/admin/users/:id/approve', superAdminOnly, admin.approveUser)
router.patch('/admin/users/:id/role', superAdminOnly, admin.updateRole)
router.delete('/admin/users/:id', superAdminOnly, admin.removeUser)
router.get('/admin/leaves', superAdminOnly, leave.allRequests)
router.patch('/admin/leaves/:id/approve', superAdminOnly, leave.approveRequest)
router.patch('/admin/leaves/:id/reject', superAdminOnly, leave.rejectRequest)
router.get('/admin/users/:id/balance', superAdminOnly, leave.getUserBalance)
router.patch('/admin/users/:id/balance', superAdminOnly, leave.updateUserBalance)

// Auth
router.get('/auth/me', auth.me)
router.post('/auth/profile', upload.single('avatar'), auth.updateProfile)
router.get('/users', auth.listUsers)

// Standup
router.get('/standup/today', standup.todayBoard)
router.get('/standup/mine', standup.mine)
router.post('/standup/tasks', standup.addTask)
router.put('/standup/tasks/:id', standup.updateTask)
router.delete('/standup/tasks/:id', standup.deleteTask)
router.put('/standup/eod', standup.updateEod)
router.post('/standup/submit', standup.submit)

// Milestones
router.get('/milestones', milestone.index)
router.get('/milestones/archived', milestone.archived)
router.get('/milestones/:id', milestone.show)
router.post('/milestones', canManageMilestones, milestone.store)
router.put('/milestones/:id', canManageMilestones, milestone.update)
router.put('/milestones/:id/archive', managerOnly, milestone.archive)
router.get('/milestones/:id/tasks/pending', canApprove, milestone.pendingTasks)
router.post('/milestones/:id/tasks', milestone.storeTask)

// Milestone Tasks
router.put('/tasks/:id', milestone.updateTask)
router.put('/tasks/:id/stage', milestone.moveStage)
router.put('/tasks/:id/assign', canApprove, milestone.assignTask)
router.put('/tasks/:id/self-assign', milestone.selfAssign)
router.put('/tasks/:id/approve', canApprove, milestone.approveTask)
router.put('/tasks/:id/reject', canApprove, milestone.rejectTask)
router.delete('/tasks/:id', canApprove, milestone.deleteTask)

// History
router.get('/history', history.historyIndex)
router.get('/history/:id', history.historyShow)

// Notifications
router.get('/notifications', notification.index)
router.put('/notifications/read-all', notification.markAllRead)
router.put('/notifications/:id/read', notification.markRead)

// Leaves (employee)
router.get('/leaves/balance', leave.myBalance)
router.get('/leaves/requests', leave.myRequests)
router.post('/leaves/request', leave.submitRequest)

// Learning
router.get('/learning', learning.index)
router.post('/learning', upload.single('image'), learning.store)
router.put('/learning/:id', learning.update)
router.delete('/learning/:id', learning.destroy)
router.post('/learning/:id/react', learning.react)
router.put('/learning/:id/pin', managerOnly, learning.pin)

export default router
