<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-10">
        <h1 class="font-display text-4xl font-800 text-tx-primary">Dev<span class="text-accent">Stand</span></h1>
        <p class="text-tx-secondary mt-2 text-sm">Team standup & milestone tracker</p>
      </div>

      <!-- Card -->
      <div class="card p-6">
        <!-- Tabs -->
        <div class="flex rounded-lg bg-surface-overlay p-1 mb-6">
          <button v-for="tab in ['login','register']" :key="tab"
            @click="mode = tab"
            class="flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize"
            :class="mode === tab ? 'bg-surface-raised text-tx-primary shadow' : 'text-tx-muted hover:text-tx-secondary'">
            {{ tab }}
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="mode === 'register'">
            <label class="block text-xs text-tx-secondary mb-1">Full Name</label>
            <input v-model="form.name" class="input" placeholder="Saad Rahman" required />
          </div>
          <div>
            <label class="block text-xs text-tx-secondary mb-1">Email</label>
            <input v-model="form.email" type="email" class="input" placeholder="you@team.dev" required />
          </div>
          <div>
            <label class="block text-xs text-tx-secondary mb-1">Password</label>
            <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
          </div>
          <div v-if="mode === 'register'">
            <label class="block text-xs text-tx-secondary mb-1">Role</label>
            <select v-model="form.role" class="input">
              <option value="employee">Employee</option>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <p v-if="error" class="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{{ error }}</p>

          <button type="submit" class="btn-primary w-full justify-center py-2.5" :disabled="loading">
            <span v-if="loading">Loading…</span>
            <span v-else>{{ mode === 'login' ? 'Sign in' : 'Create account' }}</span>
          </button>
        </form>

        <!-- Dev hint -->
        <p class="text-xs text-tx-muted text-center mt-4">
          Seed: manager@devstand.app / password
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useSocket } from '../composables/useSocket'

const store = useStore()
const router = useRouter()
const { connect } = useSocket()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = reactive({ name: '', email: '', password: '', role: 'employee' })

async function submit() {
  error.value = ''; loading.value = true
  try {
    const action = mode.value === 'login' ? 'login' : 'register'
    const payload = mode.value === 'login'
      ? { email: form.email, password: form.password }
      : { ...form }
    const { token } = await store.dispatch(action, payload)
    connect(token)
    router.push('/board')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>
