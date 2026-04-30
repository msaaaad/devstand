<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from 'vuex'
import { useSocket } from './composables/useSocket'

const store = useStore()
const { connect } = useSocket()

onMounted(() => {
  const token = localStorage.getItem('ds_token')
  if (token) {
    const socket = connect(token)
    socket.on('notification:new', (n: any) => store.commit('ADD_NOTIFICATION', n))
    store.dispatch('fetchNotifications').catch(() => {})
  }
})
</script>
