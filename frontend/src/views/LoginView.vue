<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-10">
        <h1 class="font-display text-4xl font-800 text-tx-primary">Dev<span class="text-accent">Stand</span></h1>
        <p class="text-tx-secondary mt-2 text-sm">Team standup & milestone tracker</p>
      </div>

      <!-- Pending approval message -->
      <div v-if="registered"
        class="card p-6 text-center space-y-3">
        <div class="text-4xl">⏳</div>
        <h2 class="text-tx-primary font-semibold">Account Created</h2>
        <p class="text-tx-secondary text-sm">Your account is pending approval by the admin. You'll be able to log in once approved.</p>
        <button @click="registered = false; mode = 'login'"
          class="btn-ghost text-sm mx-auto">Back to Login</button>
      </div>

      <div v-else class="card p-6">
        <div class="flex rounded-lg bg-surface-overlay p-1 mb-6">
          <button v-for="tab in ['login','register']" :key="tab"
            @click="mode = tab; error = ''"
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

          <p v-if="error" class="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{{ error }}</p>

          <button type="submit" class="btn-primary w-full justify-center py-2.5" :disabled="loading">
            <span v-if="loading">Loading…</span>
            <span v-else>{{ mode === 'login' ? 'Sign in' : 'Create account' }}</span>
          </button>
        </form>
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
const registered = ref(false)
const form = reactive({ name: '', email: '', password: '' })

async function submit() {
  error.value = ''; loading.value = true
  try {
    if (mode.value === 'login') {
      const { token } = await store.dispatch('login', { email: form.email, password: form.password })
      connect(token)
      const role = store.state.user?.role
      router.push(role === 'superadmin' ? '/leaves' : '/board')
    } else {
      await store.dispatch('register', { name: form.name, email: form.email, password: form.password })
      registered.value = true
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>
