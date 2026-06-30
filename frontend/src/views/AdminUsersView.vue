<template>
  <div class="p-6 max-w-3xl mx-auto space-y-4">
    <div v-if="loading" class="text-tx-muted text-sm">Loading…</div>

    <div v-for="user in users" :key="user.id" class="card p-4 flex items-center gap-4">
      <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
        :style="{ background: user.color }">
        {{ user.name[0] }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-tx-primary truncate">{{ user.name }}</p>
        <p class="text-xs text-tx-muted">{{ user.email }}</p>
      </div>

      <!-- Role -->
      <select :value="user.role" @change="changeRole(user.id, ($event.target as HTMLSelectElement).value)"
        class="text-xs bg-surface-overlay border border-surface-border rounded-lg px-2 py-1.5 text-tx-primary outline-none">
        <option value="employee">Employee</option>
        <option value="team_lead">Team Lead</option>
        <option value="manager">Manager</option>
      </select>

      <!-- Approve -->
      <button v-if="!user.isApproved" @click="approve(user.id)"
        class="btn text-xs py-1 px-3 bg-green-500/15 text-green-400 hover:bg-green-500/25">
        Approve
      </button>
      <span v-else class="text-xs text-green-400 font-medium">✓ Active</span>

      <!-- Remove -->
      <button @click="remove(user.id)"
        class="flex items-center justify-center w-7 h-7 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-base">
        🗑
      </button>
    </div>

    <div v-if="!loading && !users.length" class="text-sm text-tx-muted text-center py-8">No users registered yet.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../utils/api'

const users = ref<any[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  const { data } = await api.get('/admin/users')
  users.value = data.users
  loading.value = false
}

async function approve(id: number) {
  await api.patch(`/admin/users/${id}/approve`)
  await load()
}

async function changeRole(id: number, role: string) {
  await api.patch(`/admin/users/${id}/role`, { role })
  await load()
}

async function remove(id: number) {
  if (!confirm('Remove this user?')) return
  await api.delete(`/admin/users/${id}`)
  await load()
}

onMounted(load)
</script>
