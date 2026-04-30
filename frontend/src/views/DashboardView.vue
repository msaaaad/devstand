<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <p class="text-tx-muted text-sm">{{ todayLabel }}</p>
        <p class="text-tx-secondary text-xs mt-0.5">{{ board.length }} team members</p>
      </div>
      <button @click="refresh" class="btn-ghost text-xs gap-1.5">↺ Refresh</button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="card p-4 animate-pulse h-48">
        <div class="w-24 h-3 bg-surface-overlay rounded mb-3"></div>
        <div class="w-full h-2 bg-surface-overlay rounded mb-2"></div>
        <div class="w-3/4 h-2 bg-surface-overlay rounded"></div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <EmployeeCard v-for="entry in board" :key="entry.user.id" :entry="entry" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { useSocket } from '../composables/useSocket'
import EmployeeCard from '../components/standup/EmployeeCard.vue'

const store = useStore()
const { getSocket } = useSocket()
const loading = ref(false)
const board = computed(() => store.state.todayBoard)
const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy')

async function refresh() {
  loading.value = true
  await store.dispatch('fetchTodayBoard')
  loading.value = false
}

onMounted(async () => {
  await refresh()
  const socket = getSocket()
  socket?.on('standup:updated', refresh)
})

onUnmounted(() => {
  const socket = getSocket()
  socket?.off('standup:updated', refresh)
})
</script>
