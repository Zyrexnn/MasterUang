<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { Send, Trash2, BrainCircuit, Clock, AlertCircle } from 'lucide-vue-next'
import { sendGeminiMessage } from '../services/api'
import { useTransactionsStore } from '../stores/transactionsStore'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'

const transactionsStore = useTransactionsStore()
const authStore = useAuthStore()
const router = useRouter()
const notifications = useNotifications()
const userInput = ref('')
const isTyping = ref(false)
const chatContainer = ref<HTMLElement | null>(null)

// COOLDOWN STATE
const lastPromptTime = ref(0)
const promptCount = ref(0)
const cooldownRemaining = ref(0)
const globalCooldownActive = ref(false)

interface Message {
  role: 'user' | 'bot'
  content: string
  time: string
}

const messages = ref<Message[]>([
  {
    role: 'bot',
    content: 'Halo! Saya Penasihat Keuangan MasterUang (Gemini 2.5 Flash). Bagaimana saya bisa membantu Anda hari ini?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
])

const financialContext = computed(() => {
  return `Saldo: Rp ${transactionsStore.balance.toLocaleString('id-ID')}, Tabungan: ${transactionsStore.savingsRate.toFixed(1)}%`
})

const startCooldownTimer = (seconds: number) => {
  cooldownRemaining.value = seconds
  const timer = setInterval(() => {
    cooldownRemaining.value--
    if (cooldownRemaining.value <= 0) {
      clearInterval(timer)
      globalCooldownActive.value = false
    }
  }, 1000)
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isTyping.value || cooldownRemaining.value > 0) return

  const now = Date.now()
  
  // 1. Cek Cooldown 7 Detik per prompt
  if (now - lastPromptTime.value < 7000) {
    return
  }

  const query = userInput.value
  messages.value.push({
    role: 'user',
    content: query,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  
  userInput.value = ''
  isTyping.value = true
  lastPromptTime.value = now
  promptCount.value++

  // 2. Cek Cooldown 1 Menit setiap 3 prompt
  if (promptCount.value >= 3) {
    globalCooldownActive.value = true
    promptCount.value = 0
    startCooldownTimer(60)
  } else {
    startCooldownTimer(7)
  }

  await nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight })
  
  try {
    const response = await sendGeminiMessage(query, financialContext.value)
    messages.value.push({
      role: 'bot',
      content: response,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  } catch (error) {
    messages.value.push({ role: 'bot', content: 'Koneksi AI Terganggu.', time: 'Now' })
  } finally {
    isTyping.value = false
    await nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight })
  }
}

onMounted(() => { 
  if (!authStore.isPremium) {
     notifications.warning('Access Denied', 'Advisory Protocol Terkunci: Sesi ini membutuhkan tingkat otorisasi Premium.')
     router.push('/profile')
     return
  }
  transactionsStore.fetchTransactions() 
})
</script>

<template>
  <div class="p-6 lg:p-10 h-full flex flex-col gap-6 lg:gap-10 max-w-6xl mx-auto w-full overflow-hidden pb-12">
    <!-- Header Protocol -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
      <div class="space-y-1">
        <div class="flex items-center space-x-4">
          <div class="p-2 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-xl">
             <BrainCircuit class="w-5 h-5 text-bloomberg-amber" />
          </div>
          <h2 class="text-2xl font-black font-outfit tracking-tighter uppercase text-white">Advisor Protocol</h2>
        </div>
        <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-14">Neural Network Synthesis • Gemini 2.5 Flash</p>
      </div>
      
      <div v-if="cooldownRemaining > 0" class="flex items-center space-x-3 text-[10px] font-black text-bloomberg-amber bg-bloomberg-amber/5 border border-bloomberg-amber/10 px-4 py-2 rounded-full uppercase tracking-widest">
        <div class="w-2 h-2 rounded-full bg-bloomberg-amber animate-pulse"></div>
        <span>Protocol Cooldown: {{ cooldownRemaining }}S</span>
      </div>
    </div>

    <!-- Chat Terminal -->
    <div class="flex-1 flex flex-col terminal-card bg-[#11141D] overflow-hidden relative min-h-0 shadow-3xl">
      <!-- Ambient Glow Decor -->
      <div class="absolute top-0 left-0 w-64 h-64 bg-bloomberg-amber/[0.02] blur-[100px] pointer-events-none"></div>
      
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 lg:p-12 space-y-10 no-scrollbar relative z-10">
        <div v-for="(msg, i) in messages" :key="i" class="flex flex-col" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
          <div class="flex items-center gap-3 mb-2 px-1">
             <span class="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{{ msg.role === 'bot' ? 'SYSTEM_CORE' : 'OPERATOR_LOCAL' }}</span>
             <div class="w-1 h-1 rounded-full bg-neutral-800"></div>
             <span class="text-[9px] font-bold text-neutral-700 font-mono">{{ msg.time }}</span>
          </div>
          
          <div 
            class="max-w-[85%] lg:max-w-[70%] p-5 lg:p-6 text-sm leading-relaxed relative"
            :class="msg.role === 'user' 
              ? 'bg-bloomberg-amber text-black font-bold rounded-2xl rounded-tr-none shadow-[0_10px_30px_rgba(251,191,36,0.1)]' 
              : 'zen-glass border-white/5 text-neutral-200 rounded-2xl rounded-tl-none font-medium'"
          >
            <p v-html="msg.content.replace(/\n/g, '<br>')" class="whitespace-pre-wrap"></p>
            <div v-if="msg.role === 'bot'" class="absolute -left-2 top-0 w-4 h-4 bg-[#11141D] rotate-45 border-t border-l border-white/5"></div>
          </div>
        </div>

        <!-- Typing Feedback -->
        <div v-if="isTyping" class="flex items-center gap-3 ml-2">
           <div class="flex gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce [animation-delay:-0.3s]"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce [animation-delay:-0.15s]"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce"></div>
           </div>
           <span class="text-[10px] font-black text-bloomberg-amber/60 uppercase tracking-widest italic">Decrypting Synthesis...</span>
        </div>
      </div>

      <!-- Protocol Cooldown Overlay -->
      <transition name="zen">
        <div v-if="globalCooldownActive" class="absolute inset-0 bg-black/95 backdrop-blur-2xl z-20 flex flex-col items-center justify-center p-12 text-center">
          <div class="relative mb-8">
             <AlertCircle class="w-16 h-16 text-bloomberg-amber opacity-20 animate-pulse" />
             <Clock class="w-8 h-8 text-bloomberg-amber absolute inset-0 m-auto" />
          </div>
          <h3 class="text-xl font-black text-white uppercase tracking-tighter mb-2">Protocol Safeguard Active</h3>
          <p class="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mb-10 max-w-xs leading-relaxed">System is recalibrating neural pathways to prevent overflow. Sequence resume in:</p>
          
          <div class="w-64 h-2 bg-white/5 rounded-full overflow-hidden relative">
            <div class="h-full bg-bloomberg-amber shadow-[0_0_15px_#FBBD24] transition-all duration-1000" :style="{ width: `${(cooldownRemaining/60)*100}%` }"></div>
          </div>
          <div class="mt-4 font-mono text-3xl font-black text-white tabular-nums">{{ cooldownRemaining }}S</div>
        </div>
      </transition>

      <!-- Input Protocol -->
      <div class="p-6 lg:p-8 border-t border-white/5 bg-black/20">
        <form @submit.prevent="sendMessage" class="relative group">
          <input 
            v-model="userInput"
            type="text" 
            placeholder="INPUT COMMAND OR QUERY..."
            class="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-8 py-5 text-sm font-bold text-white focus:border-bloomberg-amber focus:bg-bloomberg-amber/5 outline-none transition-all disabled:opacity-30 pr-16 placeholder:text-neutral-800"
            :disabled="isTyping || cooldownRemaining > 0"
          />
          <button 
            type="submit" 
            :disabled="!userInput.trim() || isTyping || cooldownRemaining > 0" 
            class="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-bloomberg-amber flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
          >
            <Send class="w-5 h-5" />
          </button>
        </form>
        <p class="text-[8px] font-black text-neutral-600 uppercase tracking-[0.4em] text-center mt-4">
          Encrypted Neural Uplink Active • TLS 1.3
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
