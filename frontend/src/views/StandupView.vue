<template>
  <div class="p-6 max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <p class="text-tx-muted text-sm">{{ todayLabel }}</p>
        <p v-if="standup?.isLocked" class="text-xs text-amber-400 mt-0.5">🔒 Standup locked at 6PM</p>
        <p v-else-if="standup?.submittedAt" class="text-xs text-green-400 mt-0.5">✓ Submitted</p>
      </div>
      <button v-if="!standup?.isLocked && !standup?.submittedAt"
        @click="submitStandup" class="btn-primary text-sm">
        Submit Standup
      </button>
    </div>

    <!-- Tasks list -->
    <div class="space-y-3 mb-6">
      <TransitionGroup name="slide-up" tag="div" class="space-y-3">
        <div v-for="task in tasks" :key="task.id"
          class="card p-4 group">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <p class="text-sm font-medium text-tx-primary">{{ task.title }}</p>
              <p class="text-xs text-accent mt-0.5">⏱ {{ task.timeFormatted }}</p>
              <p v-if="task.challenge" class="text-xs text-amber-400/80 mt-1.5">⚡ {{ task.challenge }}</p>
              <p v-if="task.learned" class="text-xs text-green-400/80 mt-1">💡 {{ task.learned }}</p>
            </div>
            <div v-if="!standup?.isLocked"
              class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="startEdit(task)" class="btn-ghost p-1.5 text-xs">✎</button>
              <button @click="removeTask(task.id)" class="btn-ghost p-1.5 text-xs text-red-400">✕</button>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="!tasks.length" class="card p-8 text-center text-tx-muted text-sm">
        No tasks yet. Add your first task below.
      </div>
    </div>

    <!-- Add / Edit task form -->
    <div v-if="!standup?.isLocked" class="card p-5 mb-6">
      <h3 class="text-sm font-semibold text-tx-primary mb-4">{{ editing ? 'Edit Task' : '+ Add Task' }}</h3>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-tx-secondary mb-1">What did you work on?</label>
          <input v-model="form.title" class="input" placeholder="Implemented JWT refresh token rotation" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs text-tx-secondary mb-1">Hours</label>
            <input v-model.number="form.hours" type="number" min="0" max="12" class="input" placeholder="0" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-tx-secondary mb-1">Minutes</label>
            <input v-model.number="form.minutes" type="number" min="0" max="59" class="input" placeholder="0" />
          </div>
        </div>
        <div>
          <label class="block text-xs text-tx-secondary mb-1">Challenge faced <span class="text-tx-muted">(optional)</span></label>
          <input v-model="form.challenge" class="input" placeholder="Cookie expiry wasn't syncing with Redis TTL" />
        </div>
        <div>
          <label class="block text-xs text-tx-secondary mb-1">What did you learn? <span class="text-tx-muted">(optional)</span></label>
          <input v-model="form.learned" class="input" placeholder="How httpOnly cookies behave across browsers" />
        </div>
        <div class="flex gap-2 pt-1">
          <button @click="saveTask" :disabled="!form.title || saving" class="btn-primary text-sm">
            {{ saving ? 'Saving…' : editing ? 'Update' : 'Add Task' }}
          </button>
          <button v-if="editing" @click="cancelEdit" class="btn-ghost text-sm">Cancel</button>
        </div>
      </div>
    </div>

    <!-- EOD Summary -->
    <div class="card p-5">
      <h3 class="text-sm font-semibold text-tx-primary mb-3">End of Day Summary</h3>
      <textarea v-model="eodText" :disabled="standup?.isLocked"
        class="input resize-none h-24" placeholder="How did today go? What matters most from today?"></textarea>
      <button v-if="!standup?.isLocked" @click="saveEod"
        class="btn-ghost text-xs mt-2">Save summary</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'

const store = useStore()
const todayLabel = format(new Date(), 'EEEE, MMMM d')
const saving = ref(false)
const editing = ref<any>(null)
const eodText = ref('')

const standup = computed(() => store.state.myStandup)
const tasks = computed(() => standup.value?.tasks ?? [])

const form = reactive({ title: '', hours: 0, minutes: 0, challenge: '', learned: '' })

watch(() => standup.value?.eodSummary, v => { if (v) eodText.value = v }, { immediate: true })

onMounted(() => store.dispatch('fetchMyStandup'))

function startEdit(task: any) {
  editing.value = task
  form.title = task.title
  form.hours = Math.floor(task.timeSpentMinutes / 60)
  form.minutes = task.timeSpentMinutes % 60
  form.challenge = task.challenge ?? ''
  form.learned = task.learned ?? ''
}

function cancelEdit() {
  editing.value = null
  Object.assign(form, { title: '', hours: 0, minutes: 0, challenge: '', learned: '' })
}

async function saveTask() {
  if (!form.title) return
  saving.value = true
  const payload = {
    title: form.title,
    timeSpentMinutes: form.hours * 60 + form.minutes,
    challenge: form.challenge || undefined,
    learned: form.learned || undefined,
  }
  try {
    if (editing.value) {
      await store.dispatch('updateStandupTask', { id: editing.value.id, ...payload })
      cancelEdit()
    } else {
      await store.dispatch('addStandupTask', payload)
      Object.assign(form, { title: '', hours: 0, minutes: 0, challenge: '', learned: '' })
    }
  } finally { saving.value = false }
}

async function removeTask(id: number) {
  await store.dispatch('deleteStandupTask', id)
}

async function saveEod() {
  await store.dispatch('updateEod', eodText.value)
}

async function submitStandup() {
  await store.dispatch('submitStandup')
}
</script>