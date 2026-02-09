<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useNotifications } from '../composables/useNotifications'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Bitcoin, 
  MessageSquare, 
  LogOut,
  Settings,
  Bell,
  Newspaper,
  Anchor,
  Menu,
  X,
  Lock,
  ShieldCheck,
  TrendingUp
} from 'lucide-vue-next'
import { getLatestIdrPrice, getCryptoPrices } from '../services/api'
import { supabase } from '../composables/useSupabase'

const authStore = useAuthStore()
const router = useRouter()
const currentPath = ref(router.currentRoute.value.path)
const isMobileMenuOpen = ref(false)
const notifications_ui = useNotifications()

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', premium: true },
  { name: 'Transactions', icon: ArrowRightLeft, path: '/transactions', premium: true },
  { name: 'Markets', icon: TrendingUp, path: '/markets' },
  { name: 'Crypto', icon: Bitcoin, path: '/crypto' },
  { name: 'AI Advisor', icon: MessageSquare, path: '/ai-advisor', premium: true },
  { name: 'World News', icon: Newspaper, path: '/world-news' },
  { name: 'Ship Tracker', icon: Anchor, path: '/ship-tracker' },
  { name: 'Profile', icon: Settings, path: '/profile' },
  { name: 'Admin', icon: ShieldCheck, path: '/admin', adminOnly: true },
]

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const navigate = (path: string) => {
  const item = navItems.find(n => n.path === path)
  if (item?.premium && !authStore.isPremium) {
     notifications_ui.warning('Premium Locked', 'Fitur ini eksklusif untuk member Premium. Silakan aktifkan kode lisensi.')
     router.push('/profile')
     isMobileMenuOpen.value = false
     return
  }
  currentPath.value = path
  router.push(path)
  isMobileMenuOpen.value = false
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/auth')
  notifications_ui.info('Session Terminated', 'Anda telah keluar dari aplikasi.')
}

const usdToIdr = ref(15650)
const notifications = ref<any[]>([])
const showNotifs = ref(false)

const fetchNotifications = async () => {
    // Determine current role (default to 'user' for guests)
    const userRole = authStore.user?.role || 'user'
    
    // Fetch notifications that target the user's role or public (user)
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`role_target.eq.${userRole},role_target.eq.user`)
        .order('created_at', { ascending: false })
    
    // Filter out dismissed notifications stored in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
    notifications.value = (data || []).filter((n: any) => !dismissed.includes(n.id))
}

const dismissNotification = (id: string) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifs') || '[]')
    dismissed.push(id)
    localStorage.setItem('dismissed_notifs', JSON.stringify(dismissed))
    notifications.value = notifications.value.filter(n => n.id !== id)
}

const updatePrices = async () => {
    // 1. Get Crypto Prices as usual
    await getCryptoPrices()
    
    // 2. Fetch Real-time IDR Rate (Free API)
    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR');
        if (res.ok) {
            const data = await res.json();
            // Add ~0.3% spread/premium for USDT
            usdToIdr.value = Math.floor(data.rates.IDR * 1.003);
        } else {
             // Fallback
             usdToIdr.value = getLatestIdrPrice();
        }
    } catch (e) {
        // Fallback
        usdToIdr.value = getLatestIdrPrice();
    }
}

onMounted(() => {
    updatePrices()
    fetchNotifications()
    
    const priceTimer = setInterval(updatePrices, 30000)
    const notifTimer = setInterval(fetchNotifications, 60000)
    
    return () => {
        clearInterval(priceTimer)
        clearInterval(notifTimer)
    }
})

router.afterEach((to) => {
  currentPath.value = to.path
  showNotifs.value = false // Close on navigate
})
</script>

<template>
  <div class="flex h-screen bg-[#0B0E11] overflow-hidden relative">
    <!-- Sidebar for Desktop -->
    <aside 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-[#11141D] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-[20px_0_40px_rgba(0,0,0,0.3)]"
      :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="p-8 pb-10 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-bloomberg-amber tracking-tighter font-outfit uppercase">
            Master<span class="text-white opacity-80">Uang</span>
          </h1>
          <div class="flex items-center gap-2 mt-1">
             <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
             <p class="text-[9px] text-neutral-500 font-black tracking-[0.2em] uppercase">MasterUang Terminal</p>
          </div>
        </div>
        <button @click="toggleMobileMenu" class="lg:hidden p-2 text-text-secondary">
          <X class="w-6 h-6" />
        </button>
      </div>

      <nav class="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        <template v-for="item in navItems" :key="item.name">
        <button 
            v-if="!item.adminOnly || authStore.isAdmin"
            @click="navigate(item.path)"
          class="w-full flex items-center px-5 py-4 text-xs font-black transition-all group rounded-xl uppercase tracking-widest relative overflow-hidden active:scale-95"
          :class="[
            currentPath === item.path 
              ? 'bg-bloomberg-amber/10 text-bloomberg-amber border border-white/5 shadow-[0_0_20px_rgba(251,191,36,0.15)]' 
              : 'text-neutral-500 hover:bg-white/[0.03] hover:text-white',
            item.premium && !authStore.isPremium ? 'opacity-40 grayscale grayscale-[50%] bg-black/10' : ''
          ]"
        >
          <div v-if="item.premium && !authStore.isPremium" class="absolute inset-0 bg-black/5 pointer-events-none"></div>
          <component 
            :is="item.icon" 
            class="w-4 h-4 mr-4 transition-transform group-hover:scale-110 shrink-0" 
            :class="[
              currentPath === item.path ? 'text-bloomberg-amber' : 'group-hover:text-bloomberg-amber',
              item.premium && !authStore.isPremium ? 'text-neutral-700' : ''
            ]" 
          />
          <span class="font-outfit flex-1 text-left">{{ item.name }}</span>
          <Lock v-if="item.premium && !authStore.isPremium" class="w-3 h-3 ml-2 text-neutral-700 group-hover:text-bloomberg-amber/50 transition-colors" />
        </button>
        </template>
      </nav>

      <div class="p-6 mt-4 border-t border-white/5 space-y-1">
        <button class="w-full flex items-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-white transition-colors">
          <Settings class="w-4 h-4 mr-4" />
          <span class="font-outfit">Configuration</span>
        </button>
        <button 
          @click="handleLogout"
          class="w-full flex items-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-rose-500 transition-colors"
        >
          <LogOut class="w-4 h-4 mr-4" />
          <span class="font-outfit">Terminate Session</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="toggleMobileMenu" 
      class="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden w-full relative">
      <!-- Topbar (Zen Thin) -->
      <header class="h-12 lg:h-14 border-b border-white/5 bg-[#0B0E11]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-10 shrink-0 z-30">
        <div class="flex items-center space-x-2 md:space-x-4">
          <button @click="toggleMobileMenu" class="lg:hidden p-2 -ml-2 text-text-secondary hover:text-bloomberg-amber transition-colors">
            <Menu class="w-5 h-5" />
          </button>
          
          <div class="flex items-center space-x-3 md:space-x-6">
            <div class="flex items-center gap-2">
              <span class="text-[8px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest hidden xs:block">Status Sistem</span>
              <div class="h-1 w-1 rounded-full bg-zen-green hidden xs:block"></div>
            </div>
            <div class="flex items-center gap-1 text-[9px] md:text-[10px] font-mono text-neutral-400">
              <span class="uppercase font-black text-neutral-600 mr-1 hidden md:inline">USDT/IDR</span>
              <span class="text-white font-bold tabular-nums text-[10px]">Rp {{ usdToIdr.toLocaleString('id-ID') }}</span>
              <span class="text-zen-green text-[8px] ml-1">LIVE</span>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3 lg:space-x-8">
          <!-- Notification Bell -->
          <div class="relative">
            <button 
              @click="showNotifs = !showNotifs"
              class="p-2 text-neutral-500 hover:text-bloomberg-amber transition-colors relative"
            >
              <Bell class="w-4 h-4" />
              <div v-if="notifications.length > 0" class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0B0E11] animate-pulse"></div>
            </button>

            <!-- Notif Dropdown -->
            <transition name="zen-fade">
              <div v-if="showNotifs" class="absolute right-0 mt-3 w-80 bg-[#11141D] border border-white/5 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                <div class="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                   <h4 class="text-[10px] font-black text-white uppercase tracking-widest">Pusat Notifikasi</h4>
                   <span class="text-[8px] font-bold text-neutral-600 uppercase">{{ notifications.length }} Pesan Baru</span>
                </div>
                <div class="max-h-96 overflow-y-auto no-scrollbar">
                   <div v-if="notifications.length === 0" class="p-10 text-center space-y-3">
                      <Bell class="w-6 h-6 text-neutral-800 mx-auto" />
                      <p class="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">Tidak ada notifikasi</p>
                   </div>
                   <div v-for="n in notifications" :key="n.id" class="p-5 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group relative">
                      <div class="flex gap-4">
                         <div class="mt-1">
                            <div class="w-1.5 h-1.5 rounded-full" :class="n.type === 'alert' ? 'bg-rose-500' : 'bg-bloomberg-amber'"></div>
                         </div>
                         <div class="space-y-1 pr-6">
                            <p class="text-[10px] font-black text-white uppercase tracking-tight">{{ n.title }}</p>
                            <p class="text-[9px] text-neutral-500 font-medium leading-relaxed">{{ n.message }}</p>
                            <p class="text-[7px] font-bold text-neutral-700 uppercase tracking-widest pt-1">{{ new Date(n.created_at).toLocaleTimeString() }}</p>
                         </div>
                      </div>
                      <button 
                        @click="dismissNotification(n.id)"
                        class="absolute top-4 right-4 p-1 text-neutral-700 hover:text-white transition-all"
                      >
                         <X class="w-3 h-3" />
                      </button>
                   </div>
                </div>
              </div>
            </transition>
          </div>

          <div class="hidden lg:flex items-center gap-2 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
             MasterUang Terminal
          </div>
          <div class="flex items-center space-x-3 md:space-x-4 pl-3 md:pl-4 border-l border-white/10">
            <div class="flex flex-col items-end hidden sm:block">
               <span class="text-[9px] md:text-[10px] font-bold text-white uppercase">{{ authStore.user?.username || 'GUEST' }}</span>
               <span class="text-[7px] md:text-[8px] font-bold text-neutral-600 uppercase tracking-widest leading-none">{{ authStore.user?.role || 'Tamu' }}</span>
            </div>
            <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-bloomberg-amber font-black shadow-inner text-xs">
              {{ (authStore.user?.username || 'GUEST').substring(0, 2).toUpperCase() }}
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto bg-[#0B0E11] w-full relative">
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-b from-bloomberg-amber/[0.02] to-transparent h-64"></div>
        <div class="relative h-full">
           <router-view v-slot="{ Component }">
             <transition name="zen" mode="out-in">
               <component :is="Component" />
             </transition>
           </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.zen-enter-active,
.zen-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.zen-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.zen-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.zen-fade-enter-active, .zen-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.zen-fade-enter-from, .zen-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
