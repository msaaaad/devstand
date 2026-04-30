<template>
  <div class="card p-4 flex flex-col gap-3 transition-all hover:border-surface-border/80"
    :style="{ borderLeftColor: entry.user.color, borderLeftWidth: '3px' }">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow"
        :style="{ background: entry.user.color }">
        {{ entry.user.name[0].toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-tx-primary text-sm truncate">{{ entry.user.name }}</p>
        <p class="text-xs capitalize"
          :class="`text-role-${entry.user.role.replace('_','_')}`"
          :style="{ color: roleColor(entry.user.role) }">
          {{ entry.user.role.replace('_', ' ') }}
        </p>
      </div>
      <!-- Status badge -->
      <span v-if="entry.isLocked" class="badge bg-surface-overlay text-tx-muted text-[10px]">Locked</span>
      <span v-else-if="entry.hasUpdate" class="badge bg-green-500/15 text-green-400 text-[10px]">✓ Done</span>
      <span v-else class="badge bg-surface-overlay text-tx-muted text-[10px]">Pending</span>
    </div>

    <!-- No standup -->
    <div v-if="!entry.standup" class="text-center py-4">
      <p class="text-tx-muted text-xs">No update yet</p>
    </div>

    <!-- Standup data -->
    <div v-else class="space-y-2">
      <div class="flex items-center gap-3 text-xs text-tx-secondary">
        <span>📋 {{ entry.standup.taskCount }} tasks</span>
        <span>⏱ {{ formatTime(entry.standup.totalTime) }}</span>
      </div>

      <!-- Task previews -->
      <div class="space-y-1">
        <div v-for="task in entry.standup.tasks.slice(0, 3)" :key="task.id"
          class="text-xs text-tx-secondary truncate flex items-center gap-1.5">
          <span class="w-1 h-1 rounded-full flex-shrink-0" :style="{ background: entry.user.color }"></span>
          {{ task.title }}
        </div>
        <p v-if="entry.standup.tasks.length > 3" class="text-xs text-tx-muted">
          +{{ entry.standup.tasks.length - 3 }} more
        </p>
      </div>

      <!-- EOD summary -->
      <div v-if="entry.standup.eodSummary" class="mt-2 pt-2 border-t border-surface-border">
        <p class="text-xs text-tx-muted line-clamp-2">{{ entry.standup.eodSummary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ entry: any }>()

function formatTime(minutes: number) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60), m = minutes % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

function roleColor(role: string) {
  return { manager: '#ec4899', team_lead: '#f97316', employee: '#6366f1' }[role] ?? '#8B949E'
}
</script>
