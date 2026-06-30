import { createStore } from 'vuex'
import api from '../utils/api'

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('ds_user') || 'null'),
    token: localStorage.getItem('ds_token') || null,
    users: [] as any[],
    // Standup
    todayBoard: [] as any[],
    myStandup: null as any,
    // Milestones
    milestones: [] as any[],
    currentMilestone: null as any,
    // Notifications
    notifications: [] as any[],
    unreadCount: 0,
    // Learning
    learningPosts: [] as any[],
    // History
    history: [] as any[],
    historyMeta: null as any,
    // UI
    loading: false,
  },

  getters: {
    isAuth: s => !!s.token,
    me: s => s.user,
    isManager: s => s.user?.role === 'manager',
    isLead: s => s.user?.role === 'team_lead',
    isSuperAdmin: s => s.user?.role === 'superadmin',
    canApprove: s => ['manager','team_lead'].includes(s.user?.role),
    canManageMilestones: s => ['manager','team_lead'].includes(s.user?.role),
  },

  mutations: {
    SET_AUTH(state, { user, token }) {
      state.user = user; state.token = token
      localStorage.setItem('ds_user', JSON.stringify(user))
      localStorage.setItem('ds_token', token)
    },
    CLEAR_AUTH(state) {
      state.user = null; state.token = null
      localStorage.removeItem('ds_user'); localStorage.removeItem('ds_token')
    },
    UPDATE_USER(state, user) {
      state.user = user
      localStorage.setItem('ds_user', JSON.stringify(user))
    },
    SET_USERS(state, users) { state.users = users },
    SET_TODAY_BOARD(state, board) { state.todayBoard = board },
    UPDATE_BOARD_CARD(state, { userId }) {
      // Triggers a re-fetch — handled in action
    },
    SET_MY_STANDUP(state, standup) { state.myStandup = standup },
    SET_MILESTONES(state, milestones) { state.milestones = milestones },
    SET_CURRENT_MILESTONE(state, m) { state.currentMilestone = m },
    UPDATE_MILESTONE_TASK(state, task) {
      if (!state.currentMilestone) return
      const idx = state.currentMilestone.tasks.findIndex((t: any) => t.id === task.id)
      if (idx !== -1) state.currentMilestone.tasks.splice(idx, 1, task)
      else state.currentMilestone.tasks.push(task)
    },
    REMOVE_MILESTONE_TASK(state, taskId) {
      if (!state.currentMilestone) return
      state.currentMilestone.tasks = state.currentMilestone.tasks.filter((t: any) => t.id !== taskId)
    },
    SET_NOTIFICATIONS(state, { notifications, unreadCount }) {
      state.notifications = notifications; state.unreadCount = unreadCount
    },
    ADD_NOTIFICATION(state, n) {
      state.notifications.unshift(n); state.unreadCount++
    },
    MARK_READ(state, id) {
      const n = state.notifications.find(n => n.id === id)
      if (n) { n.readAt = new Date().toISOString(); state.unreadCount = Math.max(0, state.unreadCount - 1) }
    },
    MARK_ALL_READ(state) {
      state.notifications.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString() })
      state.unreadCount = 0
    },
    SET_LEARNING(state, posts) { state.learningPosts = posts },
    ADD_LEARNING_POST(state, post) { state.learningPosts.unshift(post) },
    UPDATE_LEARNING_POST(state, post) {
      const idx = state.learningPosts.findIndex(p => p.id === post.id)
      if (idx !== -1) state.learningPosts.splice(idx, 1, post)
    },
    REMOVE_LEARNING_POST(state, id) {
      state.learningPosts = state.learningPosts.filter(p => p.id !== id)
    },
    SET_HISTORY(state, { data, meta }) { state.history = data; state.historyMeta = meta },
    SET_LOADING(state, v) { state.loading = v },
  },

  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_AUTH', data)
      return data
    },
    async register(_, payload) {
      const { data } = await api.post('/auth/register', payload)
      return data
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },
    async fetchMe({ commit }) {
      const { data } = await api.get('/auth/me')
      commit('UPDATE_USER', data.user)
    },
    async fetchUsers({ commit }, params?: any) {
      const { data } = await api.get('/users', { params })
      commit('SET_USERS', data.users)
    },

    // --- Standup ---
    async fetchTodayBoard({ commit }) {
      const { data } = await api.get('/standup/today')
      commit('SET_TODAY_BOARD', data.board)
    },
    async fetchMyStandup({ commit }) {
      const { data } = await api.get('/standup/mine')
      commit('SET_MY_STANDUP', data.standup)
    },
    async addStandupTask({ commit, dispatch }, taskData) {
      await api.post('/standup/tasks', taskData)
      dispatch('fetchMyStandup')
    },
    async updateStandupTask({ dispatch }, { id, ...data }) {
      await api.put(`/standup/tasks/${id}`, data)
      dispatch('fetchMyStandup')
    },
    async deleteStandupTask({ dispatch }, id) {
      await api.delete(`/standup/tasks/${id}`)
      dispatch('fetchMyStandup')
    },
    async updateEod({ dispatch }, eodSummary) {
      await api.put('/standup/eod', { eodSummary })
      dispatch('fetchMyStandup')
    },
    async submitStandup({ dispatch }) {
      await api.post('/standup/submit')
      dispatch('fetchMyStandup')
    },

    // --- Milestones ---
    async fetchMilestones({ commit }, params?) {
      const { data } = await api.get('/milestones', { params })
      commit('SET_MILESTONES', data.milestones)
    },
    async fetchMilestone({ commit }, id) {
      const { data } = await api.get(`/milestones/${id}`)
      commit('SET_CURRENT_MILESTONE', data.milestone)
    },
    async createMilestone({ dispatch }, payload) {
      await api.post('/milestones', payload)
      dispatch('fetchMilestones')
    },
    async updateMilestone({ dispatch }, { id, ...data }) {
      await api.put(`/milestones/${id}`, data)
      dispatch('fetchMilestones')
    },
    async archiveMilestone({ dispatch }, id) {
      await api.put(`/milestones/${id}/archive`)
      dispatch('fetchMilestones')
    },
    async createTask({ commit }, { milestoneId, ...data }) {
      const res = await api.post(`/milestones/${milestoneId}/tasks`, data)
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async moveTaskStage({ commit }, { id, stage }) {
      const res = await api.put(`/tasks/${id}/stage`, { stage })
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async assignTask({ commit }, { id, assignedToId }) {
      const res = await api.put(`/tasks/${id}/assign`, { assignedToId })
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async selfAssignTask({ commit }, id) {
      const res = await api.put(`/tasks/${id}/self-assign`)
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async approveTask({ commit }, id) {
      const res = await api.put(`/tasks/${id}/approve`)
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async rejectTask({ commit }, { id, rejectionNote }) {
      const res = await api.put(`/tasks/${id}/reject`, { rejectionNote })
      commit('UPDATE_MILESTONE_TASK', res.data.task)
    },
    async deleteTask({ commit }, id) {
      await api.delete(`/tasks/${id}`)
      commit('REMOVE_MILESTONE_TASK', id)
    },

    // --- Notifications ---
    async fetchNotifications({ commit }) {
      const { data } = await api.get('/notifications')
      commit('SET_NOTIFICATIONS', { notifications: data.notifications, unreadCount: data.unreadCount })
    },
    async markRead({ commit }, id) {
      await api.put(`/notifications/${id}/read`)
      commit('MARK_READ', id)
    },
    async markAllRead({ commit }) {
      await api.put('/notifications/read-all')
      commit('MARK_ALL_READ')
    },

    // --- Learning ---
    async fetchLearning({ commit }, params?) {
      const { data } = await api.get('/learning', { params })
      commit('SET_LEARNING', data.data)
    },
    async createLearningPost({ commit }, formData) {
      const { data } = await api.post('/learning', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      commit('ADD_LEARNING_POST', data.post)
    },
    async reactToPost({ commit }, { id, type }) {
      const { data } = await api.post(`/learning/${id}/react`, { type })
      return data
    },
    async pinPost({ dispatch }, id) {
      await api.put(`/learning/${id}/pin`)
      dispatch('fetchLearning')
    },

    // --- History ---
    async fetchHistory({ commit }, params?) {
      const { data } = await api.get('/history', { params })
      commit('SET_HISTORY', data)
    },
  },
})
