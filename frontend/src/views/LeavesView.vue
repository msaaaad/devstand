<template>
  <div class="p-6 space-y-6 max-w-4xl mx-auto">

    <!-- ── SUPERADMIN VIEW ─────────────────────────────────── -->
    <template v-if="isSuperAdmin">
      <div class="flex items-center justify-between">
        <h2 class="text-tx-primary font-semibold">All Leave Requests</h2>
        <span class="text-xs text-tx-muted">{{ pending.length }} pending</span>
      </div>

      <div v-if="loading" class="text-tx-muted text-sm">Loading…</div>
      <div v-else-if="!requests.length" class="card p-8 text-center text-tx-muted text-sm">No leave requests yet.</div>

      <div v-for="req in requests" :key="req.id" class="card p-0 overflow-hidden">
        <!-- Header bar -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-surface-border"
          :class="req.type === 'casual' ? 'bg-blue-500/5' : 'bg-amber-500/5'">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              :style="{ background: req.user.color }">
              {{ req.user.name[0] }}
            </div>
            <div>
              <p class="text-sm font-semibold text-tx-primary">{{ req.user.name }}</p>
              <p class="text-xs text-tx-muted">{{ req.user.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge text-xs"
              :class="req.type === 'casual' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'">
              {{ req.type }} leave
            </span>
            <span class="badge text-xs"
              :class="{
                'bg-amber-500/15 text-amber-400': req.status === 'pending',
                'bg-green-500/15 text-green-400': req.status === 'approved',
                'bg-red-500/15 text-red-400': req.status === 'rejected',
              }">{{ req.status }}</span>
          </div>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-3">
          <div>
            <p class="text-xs text-tx-muted mb-0.5">Subject</p>
            <p class="text-sm font-semibold text-tx-primary">{{ req.subject }}</p>
          </div>
          <div>
            <p class="text-xs text-tx-muted mb-0.5">Description</p>
            <p class="text-sm text-tx-secondary leading-relaxed">{{ req.description }}</p>
          </div>
          <div class="flex gap-6 pt-1">
            <div>
              <p class="text-xs text-tx-muted mb-0.5">From</p>
              <p class="text-sm text-tx-primary">{{ fmt(req.fromDate) }}</p>
            </div>
            <div>
              <p class="text-xs text-tx-muted mb-0.5">To</p>
              <p class="text-sm text-tx-primary">{{ fmt(req.toDate) }}</p>
            </div>
            <div>
              <p class="text-xs text-tx-muted mb-0.5">Duration</p>
              <p class="text-sm text-tx-primary font-semibold">{{ req.days }} day{{ req.days > 1 ? 's' : '' }}</p>
            </div>
            <div>
              <p class="text-xs text-tx-muted mb-0.5">Requested</p>
              <p class="text-sm text-tx-primary">{{ fmt(req.createdAt) }}</p>
            </div>
          </div>

          <!-- Balance editor (per user, inline) -->
          <div class="pt-2 border-t border-surface-border flex items-center gap-4">
            <span class="text-xs text-tx-muted">Leave balance:</span>
            <span class="text-xs text-tx-secondary">
              Casual:
              <input type="number" min="0" class="w-12 bg-surface-overlay border border-surface-border rounded px-1.5 py-0.5 text-xs text-tx-primary text-center ml-1"
                :value="balances[req.user.id]?.casual ?? '…'"
                @change="updateBalance(req.user.id, 'casual', +($event.target as HTMLInputElement).value)" />
            </span>
            <span class="text-xs text-tx-secondary">
              Sick:
              <input type="number" min="0" class="w-12 bg-surface-overlay border border-surface-border rounded px-1.5 py-0.5 text-xs text-tx-primary text-center ml-1"
                :value="balances[req.user.id]?.sick ?? '…'"
                @change="updateBalance(req.user.id, 'sick', +($event.target as HTMLInputElement).value)" />
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="req.status === 'pending'" class="flex gap-2 px-5 py-3 border-t border-surface-border bg-surface">
          <button @click="action(req.id, 'approve')"
            class="btn text-xs py-1.5 px-3 bg-green-500/15 text-green-400 hover:bg-green-500/25">
            ✓ Approve
          </button>
          <button @click="action(req.id, 'reject')"
            class="btn text-xs py-1.5 px-3 bg-red-500/15 text-red-400 hover:bg-red-500/25">
            ✕ Reject
          </button>
        </div>
      </div>
    </template>

    <!-- ── EMPLOYEE VIEW ───────────────────────────────────── -->
    <template v-else>
      <!-- Balance cards -->
      <div class="grid grid-cols-2 gap-4">
        <div class="card p-4">
          <p class="text-xs text-tx-muted mb-1">Casual Leave</p>
          <p class="text-3xl font-bold text-blue-400">{{ balance.casual ?? '…' }}</p>
          <p class="text-xs text-tx-muted mt-1">days remaining</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-tx-muted mb-1">Sick Leave</p>
          <p class="text-3xl font-bold text-amber-400">{{ balance.sick ?? '…' }}</p>
          <p class="text-xs text-tx-muted mt-1">days remaining</p>
        </div>
      </div>

      <!-- Request form -->
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-tx-primary mb-4">Request Leave</h3>
        <form @submit.prevent="submitRequest" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-tx-secondary mb-1">Leave Type</label>
              <select v-model="form.type" class="input text-sm bg-surface-overlay">
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-tx-secondary mb-1">Duration (days)</label>
              <p class="input text-sm bg-surface-overlay/50 text-tx-primary flex items-center">
                {{ computedDays > 0 ? computedDays + ' day' + (computedDays > 1 ? 's' : '') : '—' }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-tx-secondary mb-1">From</label>
              <input v-model="form.fromDate" type="date" class="input text-sm" required />
            </div>
            <div>
              <label class="block text-xs text-tx-secondary mb-1">To</label>
              <input v-model="form.toDate" type="date" class="input text-sm" required />
            </div>
          </div>
          <div>
            <label class="block text-xs text-tx-secondary mb-1">Subject</label>
            <input v-model="form.subject" class="input text-sm" placeholder="e.g. Casual leave for family event" required />
          </div>
          <div>
            <label class="block text-xs text-tx-secondary mb-1">Description</label>
            <textarea v-model="form.description" class="input text-sm resize-none" rows="3"
              placeholder="Brief reason for your leave request…" required />
          </div>
          <p v-if="formError" class="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{{ formError }}</p>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? 'Submitting…' : 'Submit Request' }}
          </button>
        </form>
      </div>

      <!-- My requests -->
      <div>
        <h3 class="text-sm font-semibold text-tx-primary mb-3">My Requests</h3>
        <div v-if="!myRequests.length" class="text-sm text-tx-muted">No requests yet.</div>
        <div class="space-y-2">
          <div v-for="req in myRequests" :key="req.id" class="card p-4 flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-tx-primary truncate">{{ req.subject }}</p>
              <p class="text-xs text-tx-muted mt-0.5">{{ fmt(req.fromDate) }} → {{ fmt(req.toDate) }} · {{ req.days }} day{{ req.days > 1 ? 's' : '' }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="badge text-xs"
                :class="req.type === 'casual' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'">
                {{ req.type }}
              </span>
              <span class="badge text-xs"
                :class="{
                  'bg-amber-500/15 text-amber-400': req.status === 'pending',
                  'bg-green-500/15 text-green-400': req.status === 'approved',
                  'bg-red-500/15 text-red-400': req.status === 'rejected',
                }">{{ req.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '../utils/api'
import { differenceInCalendarDays, parseISO, format } from 'date-fns'

const store = useStore()
const isSuperAdmin = computed(() => store.getters.isSuperAdmin)

const loading = ref(false)
const requests = ref<any[]>([])
const balance = ref<any>({})
const myRequests = ref<any[]>([])
const balances = ref<Record<number, any>>({})
const submitting = ref(false)
const formError = ref('')

const form = reactive({ type: 'casual', subject: '', description: '', fromDate: '', toDate: '' })

const computedDays = computed(() => {
  if (!form.fromDate || !form.toDate) return 0
  const d = differenceInCalendarDays(parseISO(form.toDate), parseISO(form.fromDate)) + 1
  return d > 0 ? d : 0
})

const pending = computed(() => requests.value.filter(r => r.status === 'pending'))

function fmt(d: string) {
  try { return format(new Date(d), 'MMM d, yyyy') } catch { return d }
}

async function loadAdmin() {
  loading.value = true
  const { data } = await api.get('/admin/leaves')
  requests.value = data.requests
  const userIds = [...new Set(data.requests.map((r: any) => r.user.id))]
  await Promise.all(userIds.map(async (id: any) => {
    const b = await api.get(`/admin/users/${id}/balance`)
    balances.value[id] = b.data.balance
  }))
  loading.value = false
}

async function loadEmployee() {
  const [b, r] = await Promise.all([api.get('/leaves/balance'), api.get('/leaves/requests')])
  balance.value = b.data.balance
  myRequests.value = r.data.requests
}

async function action(id: number, type: 'approve' | 'reject') {
  await api.patch(`/admin/leaves/${id}/${type}`)
  await loadAdmin()
}

async function updateBalance(userId: number, field: 'casual' | 'sick', value: number) {
  const current = balances.value[userId] || {}
  const updated = { casual: current.casual ?? 10, sick: current.sick ?? 12, [field]: value }
  const { data } = await api.patch(`/admin/users/${userId}/balance`, updated)
  balances.value[userId] = data.balance
}

async function submitRequest() {
  formError.value = ''; submitting.value = true
  try {
    await api.post('/leaves/request', { ...form, days: computedDays.value })
    form.subject = ''; form.description = ''; form.fromDate = ''; form.toDate = ''
    await loadEmployee()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to submit'
  } finally {
    submitting.value = false
  }
}

onMounted(() => isSuperAdmin.value ? loadAdmin() : loadEmployee())
</script>
