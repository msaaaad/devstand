<template>
  <div class="card p-3 group hover:border-surface-border/80 transition-all">
    <!-- Stage badge -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="stage-badge text-[10px]" :class="`stage-${task.stage}`">{{ task.stage }}</span>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button v-if="canApprove && task.approvalStatus === 'pending'"
          @click.stop="$emit('approve', task.id)"
          class="btn text-[10px] py-0.5 px-1.5 bg-green-500/15 text-green-400">✓</button>
        <button v-if="canApprove && task.approvalStatus === 'pending'"
          @click.stop="$emit('reject', task)"
          class="btn text-[10px] py-0.5 px-1.5 bg-red-500/15 text-red-400">✕</button>
        <button v-if="canApprove" @click.stop="$emit('delete', task.id)"
          class="btn text-[10px] py-0.5 px-1.5 text-tx-muted hover:text-red-400">🗑</button>
      </div>
    </div>

    <!-- Title -->
    <p class="text-sm text-tx-primary font-medium leading-snug mb-2">{{ task.title }}</p>
    <p v-if="task.description" class="text-xs text-tx-muted mb-2 line-clamp-2">{{ task.description }}</p>

    <!-- Pending badge -->
    <div v-if="task.approvalStatus === 'pending'"
      class="text-xs bg-amber-500/10 text-amber-400 rounded px-2 py-1 mb-2">
      ⏳ Awaiting approval
    </div>
    <div v-if="task.approvalStatus === 'rejected'"
      class="text-xs bg-red-500/10 text-red-400 rounded px-2 py-1 mb-2"
      :title="task.rejectionNote">
      ❌ Rejected{{ task.rejectionNote ? ': ' + task.rejectionNote : '' }}
    </div>

    <!-- Assignee -->
    <div class="flex items-center justify-between">
      <div v-if="task.assignedTo" class="flex items-center gap-1.5">
        <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          :style="{ background: task.assignedTo.color }">
          {{ task.assignedTo.name[0] }}
        </div>
        <span class="text-xs text-tx-muted">{{ task.assignedTo.name }}</span>
      </div>
      <button v-else-if="task.approvalStatus === 'approved' && !isMyTask && canSelfAssign"
        @click.stop="$emit('self-assign', task.id)"
        class="text-xs text-accent hover:underline">Take it</button>
      <div v-else></div>

      <!-- Stage move -->
      <select v-if="task.approvalStatus === 'approved' && canMove"
        :value="task.stage" @change="onStageChange"
        class="text-[10px] bg-transparent text-tx-muted border-0 outline-none cursor-pointer hover:text-tx-primary"
        @click.stop>
        <option v-for="s in stages" :key="s" :value="s">→ {{ s }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const props = defineProps<{ task: any }>()
const emit = defineEmits(['stage-change','assign','approve','reject','self-assign','delete'])
const store = useStore()

const me = computed(() => store.state.user)
const canApprove = computed(() => store.getters.canApprove)
const isMyTask = computed(() => props.task.assignedTo?.id === me.value?.id)
const canMove = computed(() => isMyTask.value || canApprove.value)
const canSelfAssign = computed(() => me.value?.role === 'employee' || canApprove.value)

const stages = ['backlog','todo','doing','done','deployed']

function onStageChange(e: Event) {
  emit('stage-change', props.task.id, (e.target as HTMLSelectElement).value)
}
</script>
