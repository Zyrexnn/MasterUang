<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useNotifications } from '../composables/useNotifications'
import { supabase } from '../composables/useSupabase'
import { 
  KeyRound, 
  Bell, 
  Users, 
  Plus, 
  Trash2, 
  Edit3,
  Clock, 
  ShieldCheck,
  RefreshCcw,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  X,
  Save,
  ChevronRight
} from 'lucide-vue-next'

const notifications_ui = useNotifications()

// TABS & UI STATE
const activeTab = ref('codes')
const isMobileMenuOpen = ref(false)
const searchQuery = ref('')
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')

// STATS
const stats = ref({
  totalUsers: 0,
  activeCodes: 0,
  premiumUsers: 0,
  onlineToday: 0
})

// DATA STATE
const codes = ref<any[]>([])
const profiles = ref<any[]>([])
const notifications = ref<any[]>([])

// FORM STATE
const currentCode = ref({
  id: '',
  code: '',
  role: 'premium',
  duration_value: 30,
  duration_unit: 'days',
  description: ''
})

const currentNotif = ref({
  title: '',
  message: '',
  type: 'info',
  role_target: 'premium'
})

// FETCH DATA
const fetchData = async () => {
  try {
    // 1. Fetch Codes
    const { data: codesData } = await supabase
      .from('redeem_codes')
      .select('*')
      .order('created_at', { ascending: false })
    codes.value = codesData || []

    // 2. Fetch Profiles (Users)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('last_login', { ascending: false })
    profiles.value = profilesData || []

    // 3. Fetch Notifications
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    notifications.value = notifData || []

    // Update Stats
    stats.value.totalUsers = profiles.value.length
    stats.value.activeCodes = codes.value.length
    stats.value.premiumUsers = profiles.value.filter(u => u.role === 'premium').length
    
    // Simple "Online" logic: active in last 1 hour
    const oneHourAgo = new Date(Date.now() - 3600000)
    stats.value.onlineToday = profiles.value.filter(u => new Date(u.last_login) > oneHourAgo).length

  } catch (error) {
    console.error('Failed to sync database:', error)
  }
}

// HELPERS
const isCodeUsed = (codeStr: string) => {
  return profiles.value.some(u => u.code === codeStr)
}

const getUserForCode = (codeStr: string) => {
  if (!codeStr) return null
  return profiles.value.find(u => u.code?.toUpperCase() === codeStr.toUpperCase())
}

const filteredCodes = computed(() => {
  if (!searchQuery.value) return codes.value
  return codes.value.filter(c => c.code.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

// REMAINING TIME HELPER
const calculateRemainingTime = (codeStr: string, defaultDuration: number, unit: string) => {
  const user = getUserForCode(codeStr)
  if (!user || !user.expires_at) {
    return `${defaultDuration} ${unit === 'minutes' ? 'Menit' : unit === 'hours' ? 'Jam' : 'Hari'}`
  }

  const expiry = new Date(user.expires_at)
  const now = new Date()
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'EXPIRED'

  const totalMinutes = Math.floor(diff / (1000 * 60))
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor(totalHours / 24)

  if (totalDays > 0) {
    const remainingHours = totalHours % 24
    return `${totalDays} Hari ${remainingHours} Jam`
  }
  if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60
    return `${totalHours} Jam ${remainingMinutes} Menit`
  }
  return `${totalMinutes} Menit`
}

// MODAL HANDLERS
const openModal = (mode: 'create' | 'edit', codeData?: any) => {
  modalMode.value = mode
  if (mode === 'edit' && codeData) {
    currentCode.value = { 
      ...codeData,
      duration_value: codeData.duration_value || codeData.duration_days || 0,
      duration_unit: codeData.duration_unit || 'days'
    }
  } else {
    currentCode.value = { 
      id: '', 
      code: '', 
      role: 'premium', 
      duration_value: 30, 
      duration_unit: 'days', 
      description: '' 
    }
  }
  isModalOpen.value = true
}

const closeModal = () => {
    isModalOpen.value = false
}

// CRUD ACTIONS
const handleCodeSubmit = async () => {
  if (!currentCode.value.code) return
  
  const payload = {
    code: currentCode.value.code.trim().toUpperCase(),
    role: currentCode.value.role,
    duration_value: currentCode.value.duration_value,
    duration_unit: currentCode.value.duration_unit,
    description: currentCode.value.description
  }

  if (modalMode.value === 'create') {
    const { error } = await supabase.from('redeem_codes').insert([payload])
    if (error) notifications_ui.error('Database Sync Error', 'Gagal membuat kode: ' + error.message)
    else notifications_ui.success('System Provisioned', 'Kode lisensi baru berhasil diterbitkan.')
  } else {
    const { error } = await supabase
      .from('redeem_codes')
      .update(payload)
      .eq('id', currentCode.value.id)
    
    // Also update profile expiry if user exists
    const normalizedCode = currentCode.value.code.trim().toUpperCase()
    const userForCode = getUserForCode(normalizedCode)
    
    if (userForCode) {
        // PERBAIKAN: Selalu gunakan created_at sebagai dasar perhitungan "TOTAL" durasi.
        // Jika created_at tidak ada, gunakan waktu sekarang sebagai fallback untuk perpanjangan dari nol.
        const baseDate = userForCode.created_at ? new Date(userForCode.created_at) : new Date()
        const val = currentCode.value.duration_value
        const unit = currentCode.value.duration_unit

        const newExpiry = new Date(baseDate)
        if (unit === 'minutes') {
            newExpiry.setMinutes(newExpiry.getMinutes() + val)
        } else if (unit === 'hours') {
            newExpiry.setHours(newExpiry.getHours() + val)
        } else {
            newExpiry.setDate(newExpiry.getDate() + val)
        }
        
        await supabase.from('profiles').update({ 
            expires_at: newExpiry.toISOString(),
            role: currentCode.value.role 
        }).eq('code', normalizedCode)
    }

    if (error) notifications_ui.error('Encryption Sync Failure', 'Gagal memperbarui kode: ' + error.message)
    else notifications_ui.success('Configuration Updated', 'Detail lisensi berhasil diselaraskan.')
  }

  fetchData()
  isModalOpen.value = false
}

const deleteCode = async (id: string) => {
  if (!confirm('Are you sure you want to decommission this license key?')) return
  await supabase.from('redeem_codes').delete().eq('id', id)
  fetchData()
}

const broadcastNotif = async () => {
  if (!currentNotif.value.title || !currentNotif.value.message) return
  const { error } = await supabase.from('notifications').insert([currentNotif.value])
  if (!error) {
    currentNotif.value = { title: '', message: '', type: 'info', role_target: 'premium' }
    fetchData()
    notifications_ui.info('Transmission Success', 'Global Broadcast Initialized')
  }
}

const deleteNotif = async (id: string) => {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) {
    notifications_ui.error('Deletion Failure', 'Gagal menghapus pengumuman: ' + error.message)
  } else {
    notifications_ui.success('Transmission Terminated', 'Pengumuman telah dihapus dari feed.')
    fetchData()
  }
}

const clearAllNotifs = async () => {
  if (!confirm('Are you sure you want to flush all transmission logs? This will remove alerts for all users.')) return
  const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000') 
  if (error) {
    notifications_ui.error('Flush Failure', 'Gagal membersihkan notifikasi: ' + error.message)
  } else {
    notifications_ui.success('Logs Cleared', 'Semua riwayat pengumuman telah dimusnahkan.')
    fetchData()
  }
}

const purgeExpiredData = async () => {
  if (!confirm('Peringatan Keamanan: Anda akan menghapus SEMUA data (Kode, Profil, & Transaksi) yang sudah kadaluarsa. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return
  
  try {
    // 1. Dapatkan daftar kode yang expired
    const expiredCodes = profiles.value
      .filter(u => new Date(u.expires_at!) < new Date())
      .map(u => u.code)

    if (expiredCodes.length === 0) {
      notifications_ui.info('System Clean', 'Tidak ada data kadaluarsa ditemukan.')
      return
    }

    // 2. Hapus dari redeem_codes (ini akan memicu CASCADE DELETE ke profiles & transactions)
    const { error } = await supabase
      .from('redeem_codes')
      .delete()
      .in('code', expiredCodes)

    if (error) throw error
    
    notifications_ui.success('Purge Complete', `${expiredCodes.length} data kadaluarsa telah dimusnahkan dari database.`)
    fetchData()
  } catch (err: any) {
    notifications_ui.error('Purge Failed', 'Gagal membersihkan data: ' + err.message)
  }
}

onMounted(() => {
  fetchData()
  // Refresh data every 60 seconds to update remaining time and stats
  const interval = setInterval(fetchData, 60000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="min-h-screen bg-[#07090E] flex flex-col font-outfit text-white overflow-x-hidden">
    <!-- Top Global Header -->
    <header class="h-16 border-b border-white/5 bg-[#0F1117]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
      <div class="flex items-center gap-4">
        <div class="p-2 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-xl">
           <ShieldCheck class="w-6 h-6 text-bloomberg-amber" />
        </div>
        <div>
          <h1 class="text-lg font-black tracking-tighter uppercase italic">
            Master<span class="text-bloomberg-amber">Uang</span> <span class="text-neutral-600 text-[10px] ml-2 not-italic tracking-[0.3em]">ADMIN</span>
          </h1>
          <p class="text-[8px] font-bold text-neutral-500 uppercase tracking-[0.4em]">Panel Kontrol Admin MasterUang</p>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="hidden md:flex items-center gap-4 text-[9px] font-black text-neutral-600 uppercase tracking-widest border-r border-white/5 pr-6">
           <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
              <span>System Operational</span>
           </div>
           <span>{{ new Date().toLocaleTimeString() }}</span>
        </div>
        <button @click="fetchData" class="p-2 hover:bg-white/5 rounded-full transition-colors group">
           <RefreshCcw class="w-4 h-4 text-neutral-500 group-hover:text-bloomberg-amber" />
        </button>
      </div>
    </header>

    <main class="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full flex flex-col gap-10">
      
      <!-- STATS OVERVIEW -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <div v-for="(val, key) in stats" :key="key" class="terminal-card p-6 bg-[#0F1117] border-white/5 relative group hover:border-bloomberg-amber/30 transition-all">
           <div class="absolute top-4 right-4 text-bloomberg-amber/20 group-hover:text-bloomberg-amber/40 transition-colors">
              <Activity v-if="key === 'onlineToday'" class="w-5 h-5" />
              <Users v-else-if="key === 'totalUsers'" class="w-5 h-5" />
              <KeyRound v-else-if="key === 'activeCodes'" class="w-5 h-5" />
              <ShieldCheck v-else class="w-5 h-5" />
           </div>
           <p class="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1">
             {{ key === 'totalUsers' ? 'Total Pengguna' : key === 'activeCodes' ? 'Kode Aktif' : key === 'premiumUsers' ? 'User Premium' : 'Online Hari Ini' }}
           </p>
           <h3 class="text-3xl font-black font-mono tracking-tighter">{{ val }}</h3>
        </div>
      </section>

      <!-- NAVIGATION TABS -->
      <nav class="flex items-center justify-between border-b border-white/5 pb-1">
        <div class="flex gap-8">
          <button 
            v-for="tab in ['codes', 'notifs', 'users']" 
            :key="tab"
            @click="activeTab = tab"
            class="pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative"
            :class="activeTab === tab ? 'text-bloomberg-amber' : 'text-neutral-500 hover:text-white'"
          >
            {{ tab === 'codes' ? 'Daftar Kode' : tab === 'notifs' ? 'Notifikasi' : 'Daftar User' }}
            <div v-if="activeTab === tab" class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-bloomberg-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
          </button>
        </div>

        <div v-if="activeTab === 'codes'" class="hidden md:flex items-center gap-4">
           <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Cari kode..." 
                class="bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-[10px] font-bold text-white focus:border-bloomberg-amber/50 outline-none w-64 uppercase tracking-widest placeholder:lowercase"
              />
           </div>
            <button @click="purgeExpiredData" class="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all">
               <Trash2 class="w-4 h-4" /> Bersihkan Data Expired
            </button>
            <button @click="openModal('create')" class="bg-bloomberg-amber text-black px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-bloomberg-amber/15">
               <Plus class="w-4 h-4" /> Tambah Kode
            </button>
        </div>
      </nav>

      <!-- CONTENT: CODES -->
      <section v-if="activeTab === 'codes'" class="flex-1">
        <div class="terminal-card p-0 bg-[#0F1117] border border-white/5 overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-white/[0.02] border-b border-white/5">
              <tr class="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">
                <th class="px-8 py-5">Kode Akses</th>
                <th class="px-8 py-5">Tingkat Akses</th>
                <th class="px-8 py-5">Masa Berlaku</th>
                <th class="px-8 py-5">Status</th>
                <th class="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.03]">
              <tr v-for="code in filteredCodes" :key="code.id" class="group hover:bg-white/[0.02] transition-colors">
                <td class="px-8 py-5">
                   <span class="text-[11px] font-mono font-black text-white px-3 py-1 bg-white/5 rounded border border-white/5 tracking-wider group-hover:border-bloomberg-amber/50 transition-colors">
                      {{ code.code }}
                   </span>
                </td>
                <td class="px-8 py-5">
                   <div class="flex items-center gap-3">
                      <div class="w-1.5 h-1.5 rounded-full" :class="code.role === 'admin' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-bloomberg-amber shadow-[0_0_8px_rgba(251,191,36,0.5)]'"></div>
                      <span class="text-[10px] font-black uppercase tracking-widest" :class="code.role === 'admin' ? 'text-rose-500' : 'text-bloomberg-amber'">
                        {{ code.role }}
                      </span>
                   </div>
                </td>
                <td class="px-8 py-5">
                   <div class="flex items-center gap-2" :class="getUserForCode(code.code) ? (new Date(getUserForCode(code.code).expires_at) < new Date() ? 'text-rose-500' : 'text-zen-green') : 'text-neutral-400'">
                      <Clock class="w-3 h-3" />
                      <span class="text-[11px] font-black font-mono">
                        {{ calculateRemainingTime(code.code, code.duration_value || code.duration_days, code.duration_unit || 'days') }}
                      </span>
                   </div>
                </td>
                <td class="px-8 py-5">
                   <div v-if="isCodeUsed(code.code)" class="flex items-center gap-2">
                      <div class="flex -space-x-2">
                         <div class="w-6 h-6 rounded-full bg-bloomberg-amber border-2 border-[#0F1117] flex items-center justify-center text-[8px] font-black text-black">
                            {{ getUserForCode(code.code)?.username.substring(0, 2).toUpperCase() }}
                         </div>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-[9px] font-black text-white uppercase">{{ getUserForCode(code.code)?.username }}</span>
                        <span class="text-[8px] font-bold text-zen-green uppercase flex items-center gap-1">
                          <Activity class="w-2.5 h-2.5" /> Terkoneksi
                        </span>
                      </div>
                   </div>
                   <div v-else class="flex items-center gap-2 text-neutral-600">
                      <CheckCircle2 class="w-4 h-4 opacity-30" />
                      <span class="text-[9px] font-bold uppercase tracking-widest">Tersedia</span>
                   </div>
                </td>
                <td class="px-8 py-5 text-right">
                   <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button @click="openModal('edit', code)" class="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white transition-all">
                        <Edit3 class="w-4 h-4" />
                      </button>
                      <button @click="deleteCode(code.id)" class="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-all">
                        <Trash2 class="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredCodes.length === 0" class="p-20 text-center flex flex-col items-center gap-4">
             <Search class="w-10 h-10 text-neutral-800" />
             <p class="text-[10px] font-black text-neutral-600 uppercase tracking-widest">No matching sequences found</p>
          </div>
        </div>
      </section>

      <!-- CONTENT: NOTIFICATIONS -->
      <section v-if="activeTab === 'notifs'" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <!-- Compose -->
         <div class="lg:col-span-4 terminal-card p-8 bg-[#11141D] space-y-8">
            <div class="space-y-2">
               <h3 class="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <Bell class="w-4 h-4 text-bloomberg-amber" /> Kirim Pengumuman
               </h3>
               <p class="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Kirim pengumuman kepada semua pengguna.</p>
            </div>

            <div class="space-y-6">
               <div class="space-y-2">
                  <label class="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Judul Pesan</label>
                  <input v-model="currentNotif.title" type="text" placeholder="URGENT: SYSTEM SYNC REQUIRED" class="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs font-bold text-white focus:border-bloomberg-amber/50 outline-none" />
               </div>
               <div class="space-y-2">
                  <label class="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Isi Pengumuman</label>
                  <textarea v-model="currentNotif.message" rows="5" placeholder="Enter broadcast content here..." class="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 text-xs font-medium text-neutral-300 focus:border-bloomberg-amber/50 outline-none resize-none"></textarea>
               </div>
               <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em]">Target User</label>
                    <select v-model="currentNotif.role_target" class="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-[10px] font-black text-white uppercase outline-none">
                       <option value="premium">Hanya Premium</option>
                       <option value="user">Semua Pengguna</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em]">Protocol</label>
                    <select v-model="currentNotif.type" class="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-[10px] font-black text-white uppercase outline-none">
                       <option value="info">Info</option>
                       <option value="warning">Warning</option>
                       <option value="alert">Critical</option>
                    </select>
                  </div>
               </div>
               <button @click="broadcastNotif" class="w-full py-5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-bloomberg-amber transition-all shadow-xl shadow-white/5">
                  Siarkan Pengumuman
               </button>
            </div>
         </div>

         <!-- Feed -->
         <div class="lg:col-span-8 flex flex-col gap-6">
            <div class="flex items-center justify-between ml-2">
               <h3 class="text-[9px] font-black text-neutral-700 uppercase tracking-[0.4em]">Riwayat Pengumuman</h3>
               <button 
                 @click="clearAllNotifs"
                 class="text-[8px] font-black text-rose-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
               >
                 <Trash2 class="w-3 h-3" /> Hapus Semua
               </button>
            </div>

            <div v-for="n in notifications" :key="n.id" class="terminal-card bg-[#0F1117] p-6 group flex items-start justify-between border-white/5 hover:border-white/10 transition-colors">
               <div class="flex gap-6">
                  <div class="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <AlertCircle v-if="n.type === 'alert'" class="w-6 h-6 text-rose-500" />
                     <Bell v-else class="w-6 h-6 text-bloomberg-amber" />
                  </div>
                  <div class="space-y-3">
                     <div class="flex items-center gap-3">
                        <h4 class="text-sm font-black text-white uppercase tracking-tight">{{ n.title }}</h4>
                        <span class="text-[8px] font-black px-2 py-0.5 bg-white/5 rounded uppercase" :class="n.type === 'alert' ? 'text-rose-500' : 'text-bloomberg-amber'">{{ n.type }}</span>
                     </div>
                     <p class="text-[11px] text-neutral-500 font-medium leading-relaxed max-w-2xl">{{ n.message }}</p>
                     <div class="flex items-center gap-4">
                        <span class="text-[8px] font-black text-neutral-700 uppercase tracking-widest">{{ new Date(n.created_at).toLocaleString() }}</span>
                        <div class="w-1 h-1 rounded-full bg-neutral-800"></div>
                        <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">{{ n.role_target }} ACCESS LEVEL</span>
                     </div>
                  </div>
               </div>
               <button @click="deleteNotif(n.id)" class="p-2 text-neutral-700 hover:text-rose-500 transition-all">
                  <Trash2 class="w-4 h-4" />
               </button>
            </div>
         </div>
      </section>

      <!-- CONTENT: USERS -->
      <section v-if="activeTab === 'users'" class="flex-1">
        <div class="terminal-card p-0 bg-[#0F1117] border border-white/5 overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-white/[0.02] border-b border-white/5">
              <tr class="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em]">
                <th class="px-8 py-5">Nama Pengguna</th>
                <th class="px-8 py-5">Kode Digunakan</th>
                <th class="px-8 py-5">Terakhir Aktif</th>
                <th class="px-8 py-5">Masa Aktif</th>
                <th class="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.03]">
              <tr v-for="user in profiles" :key="user.id" class="group hover:bg-white/[0.02]">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-neutral-400 group-hover:text-bloomberg-amber transition-colors">
                      {{ (user.username || 'US').substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="flex flex-col">
                       <span class="text-xs font-black text-white uppercase tracking-tight">{{ user.username }}</span>
                       <span class="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">{{ user.role }} Operator</span>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span class="text-[10px] font-black font-mono text-neutral-500 group-hover:text-white transition-colors tracking-widest">{{ user.code }}</span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black font-mono text-white">{{ new Date(user.last_login).toLocaleDateString() }}</span>
                    <span class="text-[8px] font-bold text-neutral-600 uppercase mt-0.5">{{ new Date(user.last_login).toLocaleTimeString() }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div v-if="user.expires_at" class="flex flex-col gap-1">
                     <div class="flex items-center gap-2">
                        <Clock class="w-3.5 h-3.5 text-neutral-600" />
                        <span class="text-[10px] font-black font-mono" :class="new Date(user.expires_at) < new Date() ? 'text-rose-500' : 'text-zen-green'">
                          {{ calculateRemainingTime(user.code, 0, '') }}
                        </span>
                     </div>
                     <span v-if="new Date(user.expires_at) < new Date()" class="text-[7px] font-black bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded uppercase tracking-tighter w-fit">
                        Access Revoked: Expired
                     </span>
                     <span v-else class="text-[7px] font-black text-neutral-600 uppercase tracking-widest">
                        Exp: {{ new Date(user.expires_at).toLocaleDateString() }}
                     </span>
                  </div>
                  <span v-else class="text-[9px] font-black text-neutral-700 uppercase tracking-widest">Permanent</span>
                </td>
                <td class="px-8 py-6 text-right">
                   <span class="inline-flex items-center gap-2 px-3 py-1 bg-zen-green/5 border border-zen-green/20 rounded-lg text-zen-green text-[9px] font-black">
                      <div class="w-1 h-1 rounded-full bg-zen-green animate-pulse"></div>
                      SECURE_SYNC
                   </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <!-- MODAL: ADD/EDIT CODE -->
    <transition name="modal">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
        <div class="w-full max-w-lg bg-[#0F1117] border border-white/10 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          
          <div class="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
             <div class="flex items-center gap-4">
                <div class="p-3 bg-bloomberg-amber/10 rounded-2xl">
                   <KeyRound class="w-5 h-5 text-bloomberg-amber" />
                </div>
                <div>
                   <h3 class="text-xl font-black font-outfit uppercase tracking-tighter">{{ modalMode === 'create' ? 'Generate Protocol' : 'Edit Access Level' }}</h3>
                   <p class="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Configuration for Access License</p>
                </div>
             </div>
             <button @click="closeModal" class="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X class="w-5 h-5 text-neutral-600" />
             </button>
          </div>

          <div class="p-8 space-y-8">
             <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                   <label class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Kode Lisensi</label>
                   <input v-model="currentCode.code" type="text" placeholder="CONTOH: VIP-2026-NEXUS" class="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-black text-white focus:border-bloomberg-amber/50 outline-none uppercase tracking-widest" :disabled="modalMode === 'edit'" />
                </div>
                <div class="space-y-2">
                   <label class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Tingkat Akses</label>
                   <select v-model="currentCode.role" class="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-black text-white uppercase outline-none focus:border-bloomberg-amber/50 transition-all">
                      <option value="premium">User Premium</option>
                      <option value="admin">Super Admin</option>
                   </select>
                </div>
             </div>

             <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                   <label class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Durasi</label>
                   <input v-model="currentCode.duration_value" type="number" class="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 px-4 text-xs font-black text-white outline-none focus:border-bloomberg-amber/50 transition-all" />
                </div>
                <div class="space-y-2">
                   <label class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Satuan</label>
                   <select v-model="currentCode.duration_unit" class="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-black text-white uppercase outline-none focus:border-bloomberg-amber/50 transition-all">
                      <option value="minutes">Menit</option>
                      <option value="hours">Jam</option>
                      <option value="days">Hari</option>
                   </select>
                </div>
             </div>

             <div class="space-y-2">
                <label class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] ml-1">Keterangan (Opsional)</label>
                <input v-model="currentCode.description" type="text" placeholder="Catatan internal..." class="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-bloomberg-amber/50 transition-all" />
             </div>

             <div class="pt-4 flex gap-4">
                <button @click="closeModal" class="flex-1 py-4 bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all font-outfit">Batal</button>
                <button @click="handleCodeSubmit" class="flex-1 py-4 bg-bloomberg-amber text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-bloomberg-amber/20 font-outfit flex items-center justify-center gap-2">
                   <Save class="w-4 h-4" /> Simpan Kode
                </button>
             </div>
          </div>

          <div class="p-6 bg-black/40 text-center border-t border-white/5">
             <p class="text-[8px] font-black text-neutral-800 uppercase tracking-[0.5em]">Sistem Keamanan Aktif</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Footer Stats (Zen) -->
    <footer class="p-6 border-t border-white/5 flex items-center justify-between text-[8px] font-black text-neutral-700 uppercase tracking-[0.4em]">
       <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
             <div class="w-1 h-1 rounded-full bg-zen-green"></div>
             <span>Koneksi Aman</span>
          </div>
          <span>Server Terkoneksi & Terenkripsi</span>
       </div>
       <div class="flex items-center gap-4">
          <span>v2.60.29 - Control Panel</span>
       </div>
    </footer>
  </div>
</template>

<style scoped>
.terminal-card {
  border-radius: 1.5rem;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23404040'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

/* Custom Scrollbar for dark theme */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
</style>
