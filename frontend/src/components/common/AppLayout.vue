<template>
  <div class="flex h-screen overflow-hidden bg-surface">
    <!-- Sidebar -->
    <aside class="w-60 flex-shrink-0 bg-surface-raised border-r border-surface-border flex flex-col">
      <!-- Logo -->
      <div class="px-5 py-5 border-b border-surface-border">
        <span class="font-display text-xl font-700 text-tx-primary tracking-tight">Dev<span class="text-accent">Stand</span></span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group"
          :class="isActive(item.to)
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-tx-secondary hover:text-tx-primary hover:bg-surface-overlay'">
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User -->
      <div class="p-3 border-t border-surface-border">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            :style="{ background: user?.color }">
            {{ user?.name?.[0]?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-tx-primary truncate">{{ user?.name }}</p>
            <p class="text-xs text-tx-muted capitalize">{{ user?.role?.replace('_', ' ') }}</p>
          </div>
          <button @click="logout" class="text-tx-muted hover:text-red-400 transition-colors text-sm">⎋</button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 border-b border-surface-border flex items-center justify-between px-6 bg-surface-raised flex-shrink-0">
        <h1 class="font-display text-base font-700 text-tx-primary">{{ pageTitle }}</h1>
        <div class="flex items-center gap-3">
          <!-- Connection indicator -->
          <div class="flex items-center gap-1.5 text-xs text-tx-muted">
            <span class="w-1.5 h-1.5 rounded-full" :class="isConnected ? 'bg-green-400' : 'bg-red-400'"></span>
            {{ isConnected ? 'Live' : 'Offline' }}
          </div>
          <!-- Notification Bell -->
          <NotificationBell />
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { isConnected } from '../../composables/useSocket'
import NotificationBell from './NotificationBell.vue'

const store = useStore()
const route = useRoute()
const router = useRouter()
const user = computed(() => store.state.user)

const navItems = [
  { to: '/board',       icon: '⬡',  label: 'Today\'s Board' },
  { to: '/standup',     icon: '✎',  label: 'My Standup' },
  { to: '/milestones',  icon: '⚑',  label: 'Milestones' },
  { to: '/history',     icon: '⧖',  label: 'History Vault' },
  { to: '/learning',    icon: '⬘',  label: 'Learning Feed' },
]

const titles: Record<string, string> = {
  '/board': 'Today\'s Board',
  '/standup': 'My Standup',
  '/milestones': 'Milestones',
  '/history': 'History Vault',
  '/learning': 'Learning Feed',
}

const pageTitle = computed(() => titles[route.path] || 'DevStand')
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')

function logout() {
  store.dispatch('logout')
  router.push('/login')
}
</script>
