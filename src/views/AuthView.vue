<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useNotifications } from '../composables/useNotifications'
import { KeyRound, Lock, ArrowRight, ShieldAlert, Cpu, Users, ShieldCheck, CheckCircle2 } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const notifications = useNotifications()

const authMode = ref<'CODE' | 'ADMIN'>('CODE')
const inputCode = ref('')
const adminCreds = ref({ username: '', password: '' })
const isValidating = ref(false)

const handleLogin = async () => {
    isValidating.value = true
    let success = false
    
    if (authMode.value === 'CODE') {
        if (!inputCode.value.trim()) {
            isValidating.value = false
            return
        }
        success = await authStore.loginWithCode(inputCode.value)
    } else {
        if (!adminCreds.value.username || !adminCreds.value.password) {
            isValidating.value = false
            return
        }
        success = await authStore.loginAdmin(adminCreds.value.username, adminCreds.value.password)
    }
    
    if (success) {
        notifications.success('Access Granted', `Selamat datang kembali, ${authStore.user?.username || 'Operator'}.`)
        if (authStore.isAdmin) {
            router.push('/admin')
        } else if (authStore.isPremium) {
            router.push('/')
        } else {
            router.push('/world-news')
        }
    } else {
        notifications.error('Authentication Failed', authStore.error || 'Identitas tidak dikenali oleh sistem.')
    }
    
    isValidating.value = false
}

const handleGuestEntry = async () => {
    await authStore.setGuestSession()
    router.push('/world-news')
}
</script>

<template>
  <div class="min-h-screen bg-[#07090E] flex items-center justify-center p-6 relative overflow-hidden font-outfit">
    <!-- Cyber Background Elements -->
    <div class="absolute inset-0 pointer-events-none">
       <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bloomberg-amber/5 blur-[80px] rounded-full"></div>
       <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-bloomberg-amber/5 blur-[80px] rounded-full"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo Branding -->
      <div class="text-center mb-10 space-y-2">
        <div class="inline-flex p-4 bg-bloomberg-amber/5 border border-bloomberg-amber/20 rounded-3xl mb-4 group transition-all hover:border-bloomberg-amber/40">
           <Cpu class="w-10 h-10 text-bloomberg-amber animate-pulse" />
        </div>
        <h1 class="text-4xl font-black text-white tracking-tighter uppercase italic">
          Master<span class="text-bloomberg-amber">Uang</span>
        </h1>
        <p class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.4em]">Kelola Keuangan dengan Bijak</p>
      </div>

      <div class="terminal-card bg-[#0F1117]/80 backdrop-blur-2xl border border-white/5 p-8 lg:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
        <!-- Mode Switcher -->
        <div class="flex bg-black/40 p-1 border border-white/5 rounded-2xl mb-10">
          <button 
            @click="authMode = 'CODE'"
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            :class="authMode === 'CODE' ? 'bg-bloomberg-amber text-black' : 'text-neutral-500 hover:text-white'"
          >
            Kode Akses
          </button>
          <button 
            @click="authMode = 'ADMIN'"
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
            :class="authMode === 'ADMIN' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-neutral-500 hover:text-white'"
          >
            Login Admin
          </button>
        </div>

        <div class="space-y-8">
          <div class="space-y-2">
            <h2 class="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
               <component :is="authMode === 'CODE' ? Lock : ShieldCheck" class="w-5 h-5 text-bloomberg-amber" :class="authMode === 'ADMIN' ? 'text-rose-500' : ''" />
               {{ authMode === 'CODE' ? 'Masuk Sekarang' : 'Halaman Admin' }}
            </h2>
            <p class="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed">
              {{ authMode === 'CODE' 
                ? 'Gunakan kode lisensi untuk membuka akun premium Anda.' 
                : 'Khusus untuk admin pengelola sistem MasterUang.' 
              }}
            </p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- CODE MODE -->
            <div v-if="authMode === 'CODE'" class="relative group">
               <KeyRound class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-bloomberg-amber transition-colors" />
               <input 
                 v-model="inputCode"
                 type="text" 
                 placeholder="MASUKKAN KODE LISENSI..."
                 class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs font-black text-white focus:border-bloomberg-amber/50 focus:bg-bloomberg-amber/5 outline-none transition-all placeholder:text-neutral-800"
                 :disabled="isValidating"
               />
            </div>

            <!-- ADMIN MODE -->
            <div v-else class="space-y-4">
              <div class="relative group">
                 <Users class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-rose-500 transition-colors" />
                 <input 
                   v-model="adminCreds.username"
                   type="text" 
                   placeholder="USERNAME ADMIN..."
                   class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs font-black text-white focus:border-rose-500/50 focus:bg-rose-500/5 outline-none transition-all placeholder:text-neutral-800"
                   :disabled="isValidating"
                 />
              </div>
              <div class="relative group">
                 <Lock class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-rose-500 transition-colors" />
                 <input 
                   v-model="adminCreds.password"
                   type="password" 
                   placeholder="PASSWORD ADMIN..."
                   class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs font-black text-white focus:border-rose-500/50 focus:bg-rose-500/5 outline-none transition-all placeholder:text-neutral-800"
                   :disabled="isValidating"
                 />
              </div>
            </div>

            <button 
              type="submit"
              :disabled="isValidating || (authMode === 'CODE' ? !inputCode.trim() : (!adminCreds.username || !adminCreds.password))"
              class="w-full py-5 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] disabled:opacity-20 disabled:grayscale"
              :class="authMode === 'CODE' ? 'bg-bloomberg-amber shadow-bloomberg-amber/15' : 'bg-rose-500 text-white shadow-rose-500/15'"
            >
              <span v-if="isValidating" class="animate-pulse">Sedang Memproses...</span>
              <template v-else>
                <span>Masuk ke Aplikasi</span>
                <ArrowRight class="w-4 h-4" />
              </template>
            </button>

            <div v-if="authMode === 'CODE'" class="pt-4 text-center">
              <button 
                type="button"
                @click="handleGuestEntry" 
                class="text-[10px] font-black text-neutral-500 hover:text-white uppercase tracking-[0.2em] transition-colors py-2"
              >
                 Masuk Tanpa Kode Lisensi &rarr;
              </button>
            </div>
          </form>

          <transition name="fade">
            <div v-if="authStore.error" class="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 backdrop-blur-md">
               <ShieldAlert class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
               <div class="space-y-1">
                 <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Access Denied</p>
                 <p class="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider leading-relaxed">
                   {{ authStore.error }}
                 </p>
               </div>
            </div>
          </transition>
        </div>

        <div class="mt-10 pt-6 border-t border-white/5 text-center">
           <div class="flex items-center justify-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
              <p class="text-[8px] font-black text-neutral-700 uppercase tracking-[0.3em]">Secure Connection</p>
           </div>
        </div>
      </div>

      <!-- Footer Help -->
      <div class="mt-8 text-center">
         <p class="text-[10px] font-bold text-neutral-700 uppercase tracking-widest leading-relaxed">
           No session key? <a href="https://wa.me/6289673344599" target="_blank" class="text-bloomberg-amber/80 hover:text-bloomberg-amber transition-colors underline decoration-bloomberg-amber/30">Contact Admin for Provisioning</a>
         </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(5px); }
</style>
