<template>
  <div class="p-6">
    <!-- Filters -->
    <div class="card p-4 mb-6 flex flex-wrap gap-3 items-end">
      <div class="flex-1 min-w-40">
        <label class="block text-xs text-tx-secondary mb-1">Person</label>
        <select v-model="filters.userId" class="input text-sm">
          <option value="">Everyone</option>
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-tx-secondary mb-1">From</label>
        <input v-model="filters.dateFrom" type="date" class="input text-sm" />
      </div>
      <div>
        <label class="block text-xs text-tx-secondary mb-1">To</label>
        <input v-model="filters.dateTo" type="date" class="input text-sm" />
      </div>
      <div class="flex-1 min-w-40">
        <label class="block text-xs text-tx-secondary mb-1">Keyword</label>
        <input v-model="filters.keyword" class="input text-sm" placeholder="Search tasks, learnings…" @keyup.enter="search" />
      </div>
      <button @click="search" class="btn-primary text-sm">Search</button>
      <button @click="clearFilters" class="btn-ghost text-sm">Clear</button>
    </div>

    <!-- Results -->
    <div class="space-y-4">
      <div v-for="s in history" :key="s.id" class="card p-5">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            :style="{ background: s.user.color }">{{ s.user.name[0] }}</div>
          <div>
            <p class="text-sm font-semibold text-tx-primary">{{ s.user.name }}</p>
            <p class="text-xs text-tx-muted">{{ formatDate(s.date) }}</p>
          </div>
          <div class="ml-auto flex gap-3 text-xs text-tx-muted">
            <span>{{ s.taskCount }} tasks</span>
            <span>{{ formatTime(s.totalTime) }}</span>
          </div>
        </div>

        <!-- Tasks -->
        <div class="space-y-2">
          <div v-for="task in s.tasks" :key="task.id" class="pl-4 border-l-2 border-surface-border">
            <p class="text-sm text-tx-primary font-medium">{{ task.title }}</p>
            <p class="text-xs text-accent">⏱ {{ task.timeFormatted }}</p>
            <p v-if="task.challenge" class="text-xs text-amber-400/80 mt-0.5">⚡ {{ task.challenge }}</p>
            <p v-if="task.learned" class="text-xs text-green-400/80">💡 {{ task.learned }}</p>
          </div>
        </div>

        <!-- EOD -->
        <div v-if="s.eodSummary" class="mt-3 pt-3 border-t border-surface-border">
          <p class="text-xs text-tx-secondary italic">{{ s.eodSummary }}</p>
        </div>
      </div>

      <div v-if="!history.length && !loading" class="py-16 text-center text-tx-muted text-sm">
        No standup history found.
      </div>

      <!-- Pagination -->
      <div v-if="meta && meta.lastPage > 1" class="flex items-center justify-center gap-2 pt-4">
        <button v-for="p in meta.lastPage" :key="p" @click="goPage(p)"
          class="w-8 h-8 text-sm rounded-lg transition-colors"
          :class="p === meta.page ? 'bg-accent text-white' : 'btn-ghost'">{{ p }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'

const store = useStore()
const loading = ref(false)
const filters = reactive({ userId: '', dateFrom: '', dateTo: '', keyword: '' })
const page = ref(1)

const history = computed(() => store.state.history)
const meta = computed(() => store.state.historyMeta)
const users = computed(() => store.state.users)

onMounted(async () => {
  await Promise.all([search(), store.dispatch('fetchUsers')])
})

async function search() {
  loading.value = true
  await store.dispatch('fetchHistory', { ...filters, page: page.value })
  loading.value = false
}

function clearFilters() {
  Object.assign(filters, { userId: '', dateFrom: '', dateTo: '', keyword: '' })
  search()
}

function goPage(p: number) { page.value = p; search() }

const formatDate = (d: string) => format(new Date(d), 'EEEE, MMMM d, yyyy')
const formatTime = (m: number) => {
  const h = Math.floor(m / 60); const mn = m % 60
  return h > 0 ? `${h}h ${mn > 0 ? mn + 'm' : ''}`.trim() : `${mn}m`
}
</script>
