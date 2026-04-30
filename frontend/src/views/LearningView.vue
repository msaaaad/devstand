<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div class="flex-1 mr-4">
        <input v-model="keyword" class="input text-sm" placeholder="Search learnings…" @keyup.enter="loadPosts" />
      </div>
      <button @click="showCompose = true" class="btn-primary text-sm flex-shrink-0">+ Share Learning</button>
    </div>

    <!-- Pinned -->
    <div v-if="pinned.length" class="mb-6">
      <p class="text-xs font-semibold text-tx-muted uppercase tracking-wider mb-3">📌 Team Knowledge</p>
      <div class="space-y-3">
        <LearningPostCard v-for="p in pinned" :key="p.id" :post="p" @react="reactPost" @pin="pinPost" />
      </div>
    </div>

    <!-- Feed -->
    <div class="space-y-3">
      <LearningPostCard v-for="p in unpinned" :key="p.id" :post="p" @react="reactPost" @pin="pinPost" />
      <div v-if="!posts.length" class="py-16 text-center text-tx-muted text-sm">
        No posts yet. Share something you learned!
      </div>
    </div>

    <!-- Compose modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCompose" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showCompose = false">
          <div class="card w-full max-w-lg p-6">
            <h3 class="font-display text-base font-700 mb-4">Share a Learning</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Title</label>
                <input v-model="composeForm.title" class="input" placeholder="What did you learn or discover?" />
              </div>
              <div>
                <label class="block text-xs text-tx-secondary mb-1">Content (Markdown supported)</label>
                <textarea v-model="composeForm.body" class="input resize-none h-32 font-mono text-xs"
                  placeholder="Today I finally understood why database indexes slow down writes..." />
              </div>
              <div class="flex gap-2 pt-1">
                <button @click="publishPost" :disabled="!composeForm.title || !composeForm.body || posting"
                  class="btn-primary flex-1 justify-center text-sm">
                  {{ posting ? 'Publishing…' : 'Publish' }}
                </button>
                <button @click="showCompose = false" class="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSocket } from '../composables/useSocket'
import LearningPostCard from '../components/learning/LearningPostCard.vue'

const store = useStore()
const { getSocket } = useSocket()
const keyword = ref('')
const showCompose = ref(false)
const posting = ref(false)
const composeForm = reactive({ title: '', body: '' })

const posts = computed(() => store.state.learningPosts)
const pinned = computed(() => posts.value.filter((p: any) => p.isPinned))
const unpinned = computed(() => posts.value.filter((p: any) => !p.isPinned))

async function loadPosts() {
  await store.dispatch('fetchLearning', keyword.value ? { keyword: keyword.value } : undefined)
}

async function publishPost() {
  if (!composeForm.title || !composeForm.body) return
  posting.value = true
  const fd = new FormData()
  fd.append('title', composeForm.title)
  fd.append('body', composeForm.body)
  try {
    await store.dispatch('createLearningPost', fd)
    showCompose.value = false
    Object.assign(composeForm, { title: '', body: '' })
  } finally { posting.value = false }
}

async function reactPost({ id, type }: any) {
  const result = await store.dispatch('reactToPost', { id, type })
  const post = posts.value.find((p: any) => p.id === id)
  if (post) {
    post.reactionCounts = result.reactionCounts
    post.userReaction = result.userReaction
  }
}

async function pinPost(id: number) {
  await store.dispatch('pinPost', id)
}

onMounted(async () => {
  await loadPosts()
  const socket = getSocket()
  socket?.on('learning:new', loadPosts)
})
onUnmounted(() => getSocket()?.off('learning:new', loadPosts))
</script>
