<template>
  <div class="card p-4 cursor-pointer hover:border-accent/30 transition-all group">
    <div class="flex items-start justify-between gap-2 mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-tx-primary text-sm group-hover:text-accent transition-colors truncate">{{ milestone.title }}</h3>
        <p v-if="milestone.description" class="text-tx-muted text-xs mt-0.5 line-clamp-1">{{ milestone.description }}</p>
      </div>
      <span class="badge flex-shrink-0"
        :class="{ 'bg-green-500/15 text-green-400': milestone.status === 'completed',
                  'bg-surface-overlay text-tx-muted': milestone.status === 'archived',
                  'bg-accent/10 text-accent': milestone.status === 'active' }">
        {{ milestone.status }}
      </span>
    </div>

    <!-- Progress -->
    <div class="mb-3">
      <div class="flex items-center justify-between text-xs text-tx-muted mb-1.5">
        <span>Progress</span>
        <span class="font-mono">{{ milestone.progress }}%</span>
      </div>
      <div class="h-1.5 bg-surface-overlay rounded-full overflow-hidden">
        <div class="h-full bg-accent rounded-full transition-all"
          :style="{ width: milestone.progress + '%' }"></div>
      </div>
    </div>

    <!-- Stage counts -->
    <div class="flex gap-1.5 flex-wrap">
      <span v-for="(count, stage) in milestone.taskCounts" :key="stage"
        v-if="count > 0"
        class="stage-badge text-[10px]" :class="`stage-${stage}`">
        {{ count }} {{ stage }}
      </span>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-surface-border text-xs text-tx-muted">
      <span>by {{ milestone.creator?.name }}</span>
      <span v-if="milestone.deadline">📅 {{ formatDate(milestone.deadline) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
defineProps<{ milestone: any }>()
const formatDate = (d: string) => format(new Date(d), 'MMM d, yyyy')
</script>
