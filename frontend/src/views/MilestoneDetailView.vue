<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div v-if="milestone" class="px-6 py-4 border-b border-surface-border flex items-center justify-between flex-shrink-0">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="font-display text-lg font-700 text-tx-primary">{{ milestone.title }}</h2>
          <span class="badge" :class="milestone.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-accent/10 text-accent'">
            {{ milestone.status }}
          </span>
        </div>
        <div class="flex items-center gap-4 mt-1 text-xs text-tx-muted">
          <span v-if="milestone.deadline">📅 {{ formatDate(milestone.deadline) }}</span>
          <span>{{ milestone.progress }}% complete</span>
        </div>
        <!-- Progress bar -->
        <div class="w-48 h-1 bg-surface-overlay rounded-full mt-2">
          <div class="h-full bg-accent rounded-full transition-all" :style="{ width: milestone.progress + '%' }"></div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Pending approvals badge -->
        <button v-if="canApprove && pendingCount > 0" @click="showPending = true"
          class="btn text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
          ⏳ {{ pendingCount }} pending
        </button>
        <button @click="showAddTask = true" class="btn-primary text-sm">+ Add Task</button>
      </div>
    </div>

    <!-- Kanban -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden">
      <div class="flex gap-4 h-full p-6 min-w-max">
        <div v-for="col in columns" :key="col.stage" class="flex flex-col w-72 flex-shrink-0">
          <!-- Column header -->
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :style="{ background: col.color }"></span>
              <span class="text-xs font-semibold text-tx-secondary uppercase tracking-wider">{{ col.label }}</span>
              <span class="badge bg-surface-overlay text-tx-muted text-[10px]">{{ col.tasks.length }}</span>
            </div>
          </div>

          <!-- Tasks -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            <TaskCard v-for="task in col.tasks" :key="task.id" :task="task"
              @stage-change="moveStage" @assign="openAssign" @approve="approveTask"
              @reject="openReject" @self-assign="selfAssign" @delete="deleteTask" />
          </div>
        </div>
      </div>
    </div>

    <!-- Add task modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddTask" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showAddTask = false">
          <div class="card w-full max-w-md p-6">
            <h3 class="font-display text-base font-700 mb-4">Add Task</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Title</label>
                <input v-model="taskForm.title" class="input" placeholder="Implement cart API endpoints" />
              </div>
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Description</label>
                <textarea v-model="taskForm.description" class="input resize-none h-16" placeholder="Optional details..." />
              </div>
              <div v-if="canApprove">
                <label class="block text-xs text-tx-secondary mb-1">Assign to</label>
                <select v-model="taskForm.assignedToId" class="input">
                  <option :value="null">Unassigned</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
              </div>
              <div class="flex gap-2 pt-1">
                <button @click="addTask" :disabled="!taskForm.title" class="btn-primary flex-1 justify-center text-sm">Add Task</button>
                <button @click="showAddTask = false" class="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Pending approvals modal -->
      <Transition name="fade">
        <div v-if="showPending" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showPending = false">
          <div class="card w-full max-w-lg p-6">
            <h3 class="font-display text-base font-700 mb-4">Pending Approvals</h3>
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div v-for="task in pendingTasks" :key="task.id" class="p-3 bg-surface-overlay rounded-lg">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-tx-primary">{{ task.title }}</p>
                    <p class="text-xs text-tx-muted mt-0.5">by {{ task.createdBy?.name }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button @click="approveTask(task.id)" class="btn text-xs bg-green-500/15 text-green-400 hover:bg-green-500/25">Approve</button>
                    <button @click="openReject(task)" class="btn-danger text-xs">Reject</button>
                  </div>
                </div>
              </div>
              <p v-if="!pendingTasks.length" class="text-center text-tx-muted text-sm py-4">All clear!</p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Reject modal -->
      <Transition name="fade">
        <div v-if="rejectTarget" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="rejectTarget = null">
          <div class="card w-full max-w-sm p-6">
            <h3 class="font-display text-base font-700 mb-4 text-red-400">Reject Task</h3>
            <p class="text-sm text-tx-secondary mb-3">{{ rejectTarget.title }}</p>
            <textarea v-model="rejectionNote" class="input resize-none h-20 mb-3" placeholder="Why is this being rejected?" />
            <div class="flex gap-2">
              <button @click="confirmReject" :disabled="!rejectionNote" class="btn-danger flex-1 justify-center text-sm">Reject</button>
              <button @click="rejectTarget = null" class="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import api from '../utils/api'
import { useSocket } from '../composables/useSocket'
import TaskCard from '../components/milestone/TaskCard.vue'

const route = useRoute()
const store = useStore()
const { getSocket } = useSocket()

const milestoneId = computed(() => +route.params.id)
const milestone = computed(() => store.state.currentMilestone)
const canApprove = computed(() => store.getters.canApprove)
const users = computed(() => store.state.users)

const showAddTask = ref(false)
const showPending = ref(false)
const pendingTasks = ref<any[]>([])
const rejectTarget = ref<any>(null)
const rejectionNote = ref('')
const taskForm = reactive({ title: '', description: '', assignedToId: null as any })

const STAGES = [
  { stage: 'backlog', label: 'Backlog', color: '#484F58' },
  { stage: 'todo',    label: 'To Do',   color: '#3b82f6' },
  { stage: 'doing',   label: 'Doing',   color: '#f59e0b' },
  { stage: 'done',    label: 'Done',    color: '#22c55e' },
  { stage: 'deployed',label: 'Deployed',color: '#6366f1' },
]

const columns = computed(() => {
  const tasks = milestone.value?.tasks ?? []
  return STAGES.map(col => ({
    ...col,
    tasks: tasks.filter((t: any) => t.stage === col.stage && t.approvalStatus !== 'pending'),
  }))
})

const pendingCount = computed(() =>
  (milestone.value?.tasks ?? []).filter((t: any) => t.approvalStatus === 'pending').length
)

const formatDate = (d: string) => format(new Date(d), 'MMM d, yyyy')

onMounted(async () => {
  await store.dispatch('fetchMilestone', milestoneId.value)
  await store.dispatch('fetchUsers')

  if (canApprove.value) {
    const res = await api.get(`/milestones/${milestoneId.value}/tasks/pending`)
    pendingTasks.value = res.data.tasks
  }

  const socket = getSocket()
  socket?.emit('milestone:join', milestoneId.value)
  socket?.on('task:updated', (task: any) => store.commit('UPDATE_MILESTONE_TASK', task))
  socket?.on('task:deleted', ({ taskId }: any) => store.commit('REMOVE_MILESTONE_TASK', taskId))
  socket?.on('milestone:completed', () => store.dispatch('fetchMilestone', milestoneId.value))
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.emit('milestone:leave', milestoneId.value)
  socket?.off('task:updated')
  socket?.off('task:deleted')
  socket?.off('milestone:completed')
})

async function addTask() {
  if (!taskForm.title) return
  await store.dispatch('createTask', { milestoneId: milestoneId.value, ...taskForm })
  showAddTask.value = false
  Object.assign(taskForm, { title: '', description: '', assignedToId: null })
}

async function moveStage(taskId: number, stage: string) {
  await store.dispatch('moveTaskStage', { id: taskId, stage })
}

function openAssign(task: any) {
  // inline in TaskCard dropdown
}

async function approveTask(taskId: number) {
  await store.dispatch('approveTask', taskId)
  pendingTasks.value = pendingTasks.value.filter(t => t.id !== taskId)
}

function openReject(task: any) {
  rejectTarget.value = task
  rejectionNote.value = ''
}

async function confirmReject() {
  if (!rejectTarget.value || !rejectionNote.value) return
  await store.dispatch('rejectTask', { id: rejectTarget.value.id, rejectionNote: rejectionNote.value })
  pendingTasks.value = pendingTasks.value.filter(t => t.id !== rejectTarget.value.id)
  rejectTarget.value = null
}

async function selfAssign(taskId: number) {
  await store.dispatch('selfAssignTask', taskId)
}

async function deleteTask(taskId: number) {
  if (!confirm('Delete this task?')) return
  await store.dispatch('deleteTask', taskId)
}
</script>
