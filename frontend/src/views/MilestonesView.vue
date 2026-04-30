<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex gap-2">
        <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
          class="btn text-sm"
          :class="activeTab === tab.value ? 'bg-accent/10 text-accent' : 'btn-ghost'">
          {{ tab.label }}
        </button>
      </div>
      <button v-if="canManage" @click="showCreate = true" class="btn-primary text-sm">
        + New Milestone
      </button>
    </div>

    <!-- Active milestones -->
    <div v-if="activeTab === 'active'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <MilestoneCard v-for="m in milestones" :key="m.id" :milestone="m" @click="$router.push(`/milestones/${m.id}`)" />
      <div v-if="!milestones.length" class="col-span-3 py-16 text-center text-tx-muted">
        <p class="text-4xl mb-3">⚑</p>
        <p class="text-sm">No active milestones yet.</p>
        <button v-if="canManage" @click="showCreate = true" class="btn-primary mt-4 text-sm">Create first milestone</button>
      </div>
    </div>

    <!-- Archived -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <MilestoneCard v-for="m in archived" :key="m.id" :milestone="m" />
      <div v-if="!archived.length" class="col-span-3 py-16 text-center text-tx-muted text-sm">No archived milestones.</div>
    </div>

    <!-- Create modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreate" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showCreate = false">
          <div class="card w-full max-w-md p-6">
            <h2 class="font-display text-lg font-700 mb-5">New Milestone</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Title</label>
                <input v-model="createForm.title" class="input" placeholder="Launch v1.0 Checkout Flow" />
              </div>
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Description</label>
                <textarea v-model="createForm.description" class="input resize-none h-20" placeholder="What does this milestone cover?" />
              </div>
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Deadline</label>
                <input v-model="createForm.deadline" type="date" class="input" />
              </div>
              <div class="flex gap-2 pt-1">
                <button @click="createMilestone" :disabled="!createForm.title || creating" class="btn-primary flex-1 justify-center">
                  {{ creating ? 'Creating…' : 'Create' }}
                </button>
                <button @click="showCreate = false" class="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useStore } from 'vuex'
import MilestoneCard from '../components/milestone/MilestoneCard.vue'

const store = useStore()
const activeTab = ref('active')
const showCreate = ref(false)
const creating = ref(false)
const createForm = reactive({ title: '', description: '', deadline: '' })

const tabs = [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }]
const milestones = computed(() => store.state.milestones)
const archived = ref<any[]>([])
const canManage = computed(() => store.getters.canManageMilestones)

onMounted(async () => {
  await store.dispatch('fetchMilestones')
  const { data } = await import('../utils/api').then(m => m.default.get('/milestones/archived'))
  archived.value = data.milestones
})

async function createMilestone() {
  if (!createForm.title) return
  creating.value = true
  try {
    await store.dispatch('createMilestone', { ...createForm })
    showCreate.value = false
    Object.assign(createForm, { title: '', description: '', deadline: '' })
  } finally { creating.value = false }
}
</script>
