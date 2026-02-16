<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { Send, BrainCircuit, Clock, AlertCircle, Sparkles, TrendingUp, Wallet, PieChart } from 'lucide-vue-next'
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
  displayedContent?: string // For teletype effect
  time: string
  isTypingEffect?: boolean
}

const messages = ref<Message[]>([
  {
    role: 'bot',
    content: 'Halo! Saya Penasihat Keuangan MasterUang (Gemini 2.0 Flash). Saya siap membantu menganalisis strategi finansial Anda hari ini. Apa yang ingin Anda diskusikan?',
    displayedContent: 'Halo! Saya Penasihat Keuangan MasterUang (Gemini 2.0 Flash). Saya siap membantu menganalisis strategi finansial Anda hari ini. Apa yang ingin Anda diskusikan?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
])

const suggestions = [
  { label: 'Analisis Pengeluaran', query: 'Tolong analisis pengeluaran saya bulan ini dan berikan saran penghematan.' },
  { label: 'Rasio Tabungan', query: 'Apakah rasio tabungan saya sudah sehat? Berikan rekomendasi alokasi yang ideal.' },
  { label: 'Tips Investasi', query: 'Berdasarkan sisa saldo saya, instrumen investasi apa yang cocok untuk pemula?' }
]

const financialContext = computed(() => {
  const topCategories = Object.entries(transactionsStore.categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amt]) => `${cat}: Rp ${amt.toLocaleString('id-ID')}`)
    .join(', ')

  return `
    Saldo Saat Ini: Rp ${transactionsStore.balance.toLocaleString('id-ID')}
    Total Pemasukan: Rp ${transactionsStore.income.toLocaleString('id-ID')}
    Total Pengeluaran: Rp ${transactionsStore.expenses.toLocaleString('id-ID')}
    Rasio Tabungan: ${transactionsStore.savingsRate.toFixed(1)}%
    Kategori Terbesar: ${topCategories || 'Belum ada data'}
    Jumlah Transaksi: ${transactionsStore.transactions.length}
  `.trim()
})

// Custom Markdown-ish Parser
const parseContent = (content: string) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<b class="text-bloomberg-amber">$1</b>') // Bold
    .replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>') // Bullet points
    .replace(/\n/g, '<br>')
}

const typeMessage = async (index: number) => {
  const msg = messages.value[index]
  if (!msg || msg.role !== 'bot') return

  msg.isTypingEffect = true
  msg.displayedContent = ''
  const fullText = msg.content
  
  for (let i = 0; i < fullText.length; i++) {
    msg.displayedContent += fullText[i]
    // Variable typing speed for realism
    const speed = fullText[i] === '.' || fullText[i] === '?' ? 200 : 15
    await new Promise(resolve => setTimeout(resolve, speed))
    
    // Scroll while typing
    if (i % 10 === 0) {
      await nextTick(() => { if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight })
    }
  }
  msg.isTypingEffect = false
}

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

const sendMessage = async (customQuery?: string) => {
  const query = (customQuery || userInput.value).trim()
  if (!query || isTyping.value || cooldownRemaining.value > 0) return

  const now = Date.now()
  if (now - lastPromptTime.value < 7000) return

  messages.value.push({
    role: 'user',
    content: query,
    displayedContent: query,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })
  
  userInput.value = ''
  isTyping.value = true
  lastPromptTime.value = now
  promptCount.value++

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
    const newMsgIndex = messages.value.push({
      role: 'bot',
      content: response,
      displayedContent: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }) - 1
    
    await typeMessage(newMsgIndex)
  } catch (error) {
    messages.value.push({ 
      role: 'bot', 
      content: 'ERROR: Koneksi ke Neural Link terputus. Sinyal tidak stabil.', 
      displayedContent: 'ERROR: Koneksi ke Neural Link terputus. Sinyal tidak stabil.',
      time: 'Now' 
    })
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
          <div class="p-2 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.1)]">
             <BrainCircuit class="w-5 h-5 text-bloomberg-amber" />
          </div>
          <div>
            <h2 class="text-2xl font-black font-outfit tracking-tighter uppercase text-white leading-none">Advisor Protocol</h2>
            <div class="flex items-center gap-2 mt-1">
               <span class="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span class="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Neural Link: Online</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3">
        <div v-if="cooldownRemaining > 0" class="flex items-center space-x-3 text-[10px] font-black text-bloomberg-amber bg-bloomberg-amber/5 border border-bloomberg-amber/10 px-4 py-2 rounded-full uppercase tracking-widest">
          <Clock class="w-3 h-3" />
          <span>Recalibrating: {{ cooldownRemaining }}S</span>
        </div>
      </div>
    </div>

    <!-- Main Interface -->
    <div class="flex-1 flex flex-col terminal-card bg-[#0D0F16] border border-white/5 overflow-hidden relative min-h-0 shadow-2xl rounded-3xl">
      <!-- Ambient Decor -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-bloomberg-amber/[0.03] blur-[120px] pointer-events-none"></div>
      
      <!-- Suggestions Bar -->
      <div class="flex items-center gap-2 p-4 border-b border-white/5 bg-black/40 overflow-x-auto no-scrollbar scroll-smooth">
        <div class="flex items-center gap-2 px-3 py-1.5 mr-2 border-r border-white/10 shrink-0">
          <Sparkles class="w-3 h-3 text-bloomberg-amber" />
          <span class="text-[9px] font-black text-white uppercase tracking-widest">Prompt Presets:</span>
        </div>
        <button 
          v-for="s in suggestions" 
          :key="s.label"
          @click="sendMessage(s.query)"
          :disabled="isTyping || cooldownRemaining > 0"
          class="shrink-0 px-4 py-1.5 bg-white/[0.03] hover:bg-bloomberg-amber hover:text-black border border-white/5 rounded-full text-[10px] font-bold text-neutral-400 transition-all active:scale-95 disabled:opacity-20"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Chat Container -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 no-scrollbar relative z-10 scroll-smooth">
        <div v-for="(msg, i) in messages" :key="i" class="flex flex-col" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
          <div class="flex items-center gap-3 mb-2 px-1">
             <span class="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{{ msg.role === 'bot' ? 'SYSTEM_CORE' : 'OPERATOR_UNIT' }}</span>
             <div class="w-1 h-1 rounded-full bg-white/10"></div>
             <span class="text-[9px] font-bold text-neutral-600 font-mono uppercase">{{ msg.time }}</span>
          </div>
          
          <div 
            class="max-w-[85%] lg:max-w-[75%] p-5 lg:p-7 text-sm leading-relaxed relative transition-all duration-300"
            :class="msg.role === 'user' 
              ? 'bg-neutral-800 text-white font-medium rounded-2xl rounded-tr-none border border-white/5 shadow-xl' 
              : 'zen-glass border-white/10 text-neutral-200 rounded-2xl rounded-tl-none font-medium shadow-2xl'"
          >
            <div 
              class="whitespace-pre-wrap select-text" 
              v-html="parseContent(msg.displayedContent || '')"
            ></div>
            
            <!-- Bot Cursor Effect while typing -->
            <span v-if="msg.isTypingEffect" class="inline-block w-1.5 h-4 bg-bloomberg-amber ml-1 animate-pulse align-middle"></span>
          </div>
        </div>

        <!-- Typing Feedback -->
        <div v-if="isTyping && !messages[messages.length-1].isTypingEffect" class="flex flex-col gap-3 ml-2">
           <div class="flex items-center gap-3">
              <div class="flex gap-1.5">
                 <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce [animation-delay:-0.3s]"></div>
                 <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce [animation-delay:-0.15s]"></div>
                 <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber animate-bounce"></div>
              </div>
              <span class="text-[10px] font-black text-bloomberg-amber uppercase tracking-[0.3em] italic animate-pulse">Accessing Neural Database...</span>
           </div>
        </div>
      </div>

      <!-- Protocol Cooldown Overlay -->
      <transition name="zen">
        <div v-if="globalCooldownActive" class="absolute inset-0 bg-black/98 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-12 text-center">
          <div class="relative mb-8">
             <div class="absolute inset-0 bg-bloomberg-amber/20 blur-3xl animate-pulse"></div>
             <AlertCircle class="w-20 h-20 text-bloomberg-amber/20 animate-pulse" />
             <Clock class="w-10 h-10 text-bloomberg-amber absolute inset-0 m-auto" />
          </div>
          <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-3">Protocol Safeguard Active</h3>
          <p class="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.25em] mb-12 max-w-sm leading-relaxed">System is recalibrating neural pathways to prevent data overflow. Security sequence resume in:</p>
          
          <div class="flex items-center gap-6">
            <div class="text-6xl font-black text-white font-mono tabular-nums tracking-tighter">{{ cooldownRemaining }}</div>
            <div class="text-[10px] font-black text-bloomberg-amber uppercase tracking-[0.4em] origin-left rotate-90">Seconds remaining</div>
          </div>
        </div>
      </transition>

      <!-- Input Protocol -->
      <div class="p-6 lg:p-10 border-t border-white/5 bg-black/40">
        <form @submit.prevent="sendMessage()" class="relative max-w-4xl mx-auto">
          <input 
            v-model="userInput"
            type="text" 
            placeholder="TYPE COMMAND OR FINANCIAL QUERY..."
            class="w-full bg-[#1A1D27] border border-white/10 rounded-2xl px-8 py-6 text-sm font-bold text-white focus:border-bloomberg-amber/50 focus:bg-bloomberg-amber/5 outline-none transition-all disabled:opacity-30 pr-20 placeholder:text-neutral-700"
            :disabled="isTyping || cooldownRemaining > 0"
          />
          <button 
            type="submit" 
            :disabled="!userInput.trim() || isTyping || cooldownRemaining > 0" 
            class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-bloomberg-amber flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale shadow-[0_4px_20px_rgba(251,191,36,0.3)]"
          >
            <Send class="w-5 h-5 stroke-[2.5px]" />
          </button>
        </form>
        
        <div class="flex items-center justify-center gap-8 mt-6">
          <div class="flex items-center gap-2">
            <TrendingUp class="w-3 h-3 text-neutral-600" />
            <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Market Context: Aware</span>
          </div>
          <div class="flex items-center gap-2">
            <Wallet class="w-3 h-3 text-neutral-600" />
            <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Portfolio Link: Active</span>
          </div>
          <div class="flex items-center gap-2">
            <PieChart class="w-3 h-3 text-neutral-600" />
            <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Auto-Analysis: Enabled</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.zen-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
  backdrop-filter: blur(10px);
}

.terminal-card {
  box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
}

.zen-enter-active, .zen-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.zen-enter-from, .zen-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

::placeholder {
  letter-spacing: 0.1em;
  opacity: 0.3;
}

li {
  margin-bottom: 0.25rem;
}
</style>
