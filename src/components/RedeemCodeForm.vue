<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { ShieldCheck, Info, KeyRound, ArrowRight } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const redeemCode = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleRedeem = async () => {
    if (!redeemCode.value) {
        errorMsg.value = 'Please enter a code.'
        return
    }

    isLoading.value = true
    errorMsg.value = ''

    try {
        const success = await authStore.loginWithCode(redeemCode.value)
        if (success) {
            router.push({ name: 'dashboard' })
        } else {
            errorMsg.value = authStore.error || 'Invalid redeem code. Access denied.'
        }
    } catch (err: any) {
        // Show specific error from verified logic
        errorMsg.value = err.message || 'System error. Please try again.'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <div class="terminal-card bg-[#11141D] border border-white/5 overflow-hidden shadow-2xl">
      <!-- Glow Decor -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-bloomberg-amber/[0.03] blur-[60px] pointer-events-none"></div>
      
      <div class="p-8 lg:p-10 flex flex-col items-center text-center">
        <div class="mb-8 p-4 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-2xl">
           <ShieldCheck class="w-8 h-8 text-bloomberg-amber" />
        </div>
        
        <h3 class="text-xl lg:text-2xl font-black font-outfit text-white uppercase tracking-tighter mb-3">
          Premium Access Locked
        </h3>
        <p class="text-[10px] lg:text-[11px] font-bold text-neutral-500 uppercase tracking-widest leading-relaxed mb-10 max-w-[280px]">
          Management features require a valid authorization code to synchronize with the main server.
        </p>

        <form @submit.prevent="handleRedeem" class="w-full space-y-6">
          <div class="relative group">
            <KeyRound class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-bloomberg-amber transition-colors" />
            <input 
              v-model="redeemCode"
              type="password" 
              placeholder="ENTER REDEEM CODE..."
              class="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-xs font-bold text-white focus:border-bloomberg-amber/50 focus:bg-bloomberg-amber/5 outline-none transition-all placeholder:text-neutral-800"
              :disabled="isLoading"
            />
          </div>

          <button 
            type="submit"
            :disabled="isLoading || !redeemCode"
            class="w-full py-5 bg-bloomberg-amber text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(251,191,36,0.2)] disabled:opacity-20 disabled:grayscale"
          >
            <span>Unlock Terminal</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </form>

        <transition name="fade">
          <div v-if="errorMsg" class="mt-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 w-full text-left backdrop-blur-md">
            <Info class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div class="space-y-1">
               <p class="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Authentication Error</p>
               <p class="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider leading-relaxed">{{ errorMsg }}</p>
            </div>
          </div>
        </transition>

        <div class="mt-10 pt-8 border-t border-white/5 w-full flex flex-col items-center gap-4">
           <p class="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Belum punya kode akses?</p>
           <a 
             href="https://wa.me/6289673344599" 
             target="_blank"
             class="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-bloomberg-amber text-[10px] font-black uppercase tracking-widest hover:bg-bloomberg-amber hover:text-black transition-all"
           >
             Contact Admin for License
           </a>
           <p class="text-[8px] font-black text-neutral-800 uppercase tracking-[0.4em] mt-4">
             Authorized Personnel Only • Secure 256-bit
           </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
