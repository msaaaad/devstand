<template>
  <div class="relative" ref="bellRef">
    <button @click="open = !open"
      class="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-overlay transition-colors">
      <span class="text-lg">🔔</span>
      <span v-if="unreadCount > 0"
        class="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full text-[10px] font-bold flex items-center justify-center text-white">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <Transition name="fade">
      <div v-if="open"
        class="absolute right-0 top-11 w-80 card shadow-xl overflow-hidden z-50">
        <div class="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <span class="text-sm font-semibold text-tx-primary">Notifications</span>
          <button v-if="unreadCount > 0" @click="markAll" class="text-xs text-accent hover:underline">Mark all read</button>
        </div>

        <div class="overflow-y-auto max-h-80">
          <div v-if="!notifications.length" class="px-4 py-8 text-center text-tx-muted text-sm">All caught up 🎉</div>
          <div v-for="n in notifications" :key="n.id"
            @click="markOne(n.id)"
            class="px-4 py-3 hover:bg-surface-overlay cursor-pointer transition-colors border-b border-surface-border/50 last:border-0"
            :class="!n.readAt ? 'bg-accent/5' : ''">
            <div class="flex items-start gap-3">
              <span class="text-base mt-0.5">{{ typeIcon(n.type) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-tx-primary leading-snug">{{ (n.data as any).message }}</p>
                <p class="text-xs text-tx-muted mt-1">{{ timeAgo(n.createdAt) }}</p>
              </div>
              <div v-if="!n.readAt" class="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { formatDistanceToNow } from 'date-fns'

const store = useStore()
const open = ref(false)
const bellRef = ref<HTMLElement>()

const notifications = computed(() => store.state.notifications)
const unreadCount = computed(() => store.state.unreadCount)

const typeIcon = (type: string) => ({
  task_assigned: '📋', task_approved: '✅', task_rejected: '❌',
  task_self_assigned: '👋', milestone_completed: '🏆',
}[type] || '🔔')

const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true })

function markOne(id: number) { store.dispatch('markRead', id) }
function markAll() { store.dispatch('markAllRead') }

function clickOutside(e: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', clickOutside))
onUnmounted(() => document.removeEventListener('click', clickOutside))
</script>
