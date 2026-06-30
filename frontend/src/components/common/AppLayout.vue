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
          <svg class="w-[22px] h-[22px] flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.75"
            stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"
            v-html="item.icon" />
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
          <button @click="logout" title="Logout"
            class="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="h-14 border-b border-surface-border flex items-center justify-between px-6 bg-surface-raised flex-shrink-0">
        <h1 class="font-display text-base font-700 text-tx-primary">{{ pageTitle }}</h1>
        <div class="flex items-center gap-3">
          <div v-if="!isSuperAdmin" class="flex items-center gap-1.5 text-xs text-tx-muted">
            <span class="w-1.5 h-1.5 rounded-full" :class="isConnected ? 'bg-green-400' : 'bg-red-400'"></span>
            {{ isConnected ? 'Live' : 'Offline' }}
          </div>
          <NotificationBell v-if="!isSuperAdmin" />
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
const isSuperAdmin = computed(() => store.getters.isSuperAdmin)

const LEAVES_ICON = '<path d="M12 2a10 10 0 00-6.88 17.24M12 2a10 10 0 016.88 17.24M12 2v20M2 12h20"/>'

const regularNav = [
  {
    to: '/board',
    label: "Today's Board",
    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  },
  {
    to: '/standup',
    label: 'My Standup',
    icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  },
  {
    to: '/milestones',
    label: 'Milestones',
    icon: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  },
  {
    to: '/history',
    label: 'History Vault',
    icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  },
  {
    to: '/learning',
    label: 'Learning Feed',
    icon: '<path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>',
  },
  {
    to: '/leaves',
    label: 'Leaves',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  },
]

const adminNav = [
  {
    to: '/leaves',
    label: 'Leave Requests',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  },
  {
    to: '/admin/users',
    label: 'Manage Users',
    icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
  },
]

const navItems = computed(() => isSuperAdmin.value ? adminNav : regularNav)

const titles: Record<string, string> = {
  '/board': "Today's Board",
  '/standup': 'My Standup',
  '/milestones': 'Milestones',
  '/history': 'History Vault',
  '/learning': 'Learning Feed',
  '/leaves': isSuperAdmin.value ? 'Leave Requests' : 'My Leaves',
  '/admin/users': 'Manage Users',
}

const pageTitle = computed(() => titles[route.path] || 'DevStand')
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')

function logout() {
  store.dispatch('logout')
  router.push('/login')
}
</script>
