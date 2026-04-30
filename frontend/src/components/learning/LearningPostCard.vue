<template>
  <div class="card p-5">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          :style="{ background: post.user.color }">{{ post.user.name[0] }}</div>
        <div>
          <p class="text-sm font-semibold text-tx-primary">{{ post.user.name }}</p>
          <p class="text-xs text-tx-muted">{{ timeAgo(post.createdAt) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="post.isPinned" class="text-sm">📌</span>
        <button v-if="isManager" @click="$emit('pin', post.id)"
          class="text-xs text-tx-muted hover:text-accent transition-colors">
          {{ post.isPinned ? 'Unpin' : 'Pin' }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <h4 class="font-semibold text-tx-primary mb-2">{{ post.title }}</h4>
    <div class="text-sm text-tx-secondary prose-sm leading-relaxed"
      v-html="renderedBody"></div>

    <!-- Image -->
    <img v-if="post.imageUrl" :src="post.imageUrl" class="mt-3 rounded-lg max-h-48 object-cover w-full" />

    <!-- Reactions -->
    <div class="flex items-center gap-2 mt-4 pt-3 border-t border-surface-border">
      <button v-for="r in reactions" :key="r.type"
        @click="$emit('react', { id: post.id, type: r.type })"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
        :class="post.userReaction === r.type
          ? 'bg-accent/15 text-accent'
          : 'bg-surface-overlay text-tx-muted hover:text-tx-primary hover:bg-surface-overlay/80'">
        {{ r.emoji }} <span>{{ post.reactionCounts?.[r.type] || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps<{ post: any }>()
defineEmits(['react', 'pin'])
const store = useStore()

const isManager = computed(() => store.getters.isManager)
const timeAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true })
const renderedBody = computed(() => DOMPurify.sanitize(marked.parse(props.post.body) as string))

const reactions = [
  { type: 'insightful', emoji: '💡' },
  { type: 'impressive', emoji: '🔥' },
  { type: 'question',   emoji: '❓' },
]
</script>
