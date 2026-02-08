<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBinanceStore, type BinanceTicker } from '../stores/binanceStore';
import { useCryptoStore } from '../stores/cryptoStore';
import TradingChart from './TradingChart.vue';
import BinanceChart from './BinanceChart.vue';
import LeverageCalculator from './LeverageCalculator.vue';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Newspaper, 
  LayoutDashboard,
  LineChart,
  Calculator,
  ChevronRight,
  Zap,
  Activity,
  Menu,
  X,
  Lock,
  RefreshCw,
  ArrowUpRight
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();

const binanceStore = useBinanceStore();
const cryptoStore = useCryptoStore();
const router = useRouter();

const selectedSymbol = ref('BTCUSDT');
const selectedInterval = ref('1h');
const searchQuery = ref('');
const showSidebar = ref(true);
const activeTab = ref<'NEWS' | 'CALC' | 'CHART'>('NEWS');
const chartMode = ref<'TRADINGVIEW' | 'BINANCE'>('TRADINGVIEW');
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const intervals = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

const filteredTickers = computed<BinanceTicker[]>(() => {
  const query = searchQuery.value.toUpperCase();
  return Object.values(binanceStore.tickers).filter((t: BinanceTicker) => 
    t.symbol.includes(query)
  ).sort((a: BinanceTicker, b: BinanceTicker) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
});

const selectedTicker = computed(() => binanceStore.tickers[selectedSymbol.value]);

const handleSearch = () => {
  if (searchQuery.value) {
    const formatted = binanceStore.addSymbol(searchQuery.value);
    selectedSymbol.value = formatted;
    searchQuery.value = '';
  }
};

const binanceSymbol = computed(() => {
  // Convert BTCUSDT to BTC_USDT for Binance URL
  if (selectedSymbol.value.endsWith('USDT')) {
    return selectedSymbol.value.replace('USDT', '_USDT');
  }
  return selectedSymbol.value;
});

const selectSymbol = (symbol: string) => {
  selectedSymbol.value = symbol;
  if (window.innerWidth < 1024) showSidebar.value = false;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

let newsInterval: any = null;

onMounted(async () => {
  try {
    console.log('Initializing Crypto Terminal...');
    
    // 1. CRITICAL PATH: Fetch only top 6 assets first for instant UI paint
    // This allows the "Establishing Neural Uplink" screen to vanish almost immediately
    const prioriySymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
    await binanceStore.fetchMarketData(prioriySymbols);
    
    // 2. BACKGROUND: Fetch the rest of the market ecosystem silently
    // We delay this slightly to let the UI settle
    setTimeout(() => {
        // Explicitly pass the full list to ensure it's not forgotten
        console.log('Fetching full market list...', binanceStore.activeSymbols.length, 'assets');
        binanceStore.fetchMarketData(binanceStore.activeSymbols); 
    }, 800);
    
    // DELAYED LOAD for news to prioritize core UI thread
    setTimeout(async () => {
       await cryptoStore.fetchNews();
    }, 3000);
    
    window.addEventListener('resize', handleResize);
    if (windowWidth.value < 1024) showSidebar.value = false;
    
    // OPTIMIZED BACKGROUND REFRESH: Only if tab is active
    newsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
         cryptoStore.fetchNews().catch(err => console.error('BG News Fetch Error:', err));
      }
    }, 5 * 60 * 1000);
  } catch (err) {
    console.error('Crypto Terminal Initialization Error:', err);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (newsInterval) clearInterval(newsInterval);
});

const formatPrice = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!num) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: num < 1 ? 4 : 2,
    maximumFractionDigits: num < 1 ? 4 : 2
  });
};

const formatVolume = (val: string) => {
  const num = parseFloat(val);
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toLocaleString();
};
</script>

<template>
  <div v-if="!binanceStore.tickers || Object.keys(binanceStore.tickers).length === 0" class="h-screen bg-[#0B0E11] flex items-center justify-center p-8">
     <div class="text-center space-y-6">
        <div class="relative">
           <div class="w-16 h-16 border-4 border-white/5 rounded-full mx-auto"></div>
           <div class="w-16 h-16 border-4 border-bloomberg-amber border-t-transparent rounded-full animate-spin absolute inset-0 m-auto"></div>
        </div>
        <p class="text-bloomberg-amber font-black font-outfit text-sm uppercase tracking-[0.4em]">Establishing Neural Uplink...</p>
        <p class="text-neutral-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">Synchronizing Global Market Nodes</p>
     </div>
  </div>
  <div v-else class="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-64px)] bg-[#0B0E11] text-white font-sans selection:bg-bloomberg-amber selection:text-black overflow-hidden relative">
    
    <!-- Asset Selector / Sidebar (Mobile Overlay + Desktop Sidebar) -->
    <aside 
      class="fixed inset-y-0 left-0 lg:relative z-[60] w-full md:w-80 h-full bg-[#0B0E11]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 ease-out shadow-[40px_0_60px_rgba(0,0,0,0.5)]"
      :class="[
        showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-none'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Close Button (Mobile Only) -->
        <div class="lg:hidden p-4 flex justify-end">
           <button @click="showSidebar = false" class="p-3 bg-white/5 rounded-2xl text-neutral-400">
             <X class="w-6 h-6" />
           </button>
        </div>
        <!-- Search -->
        <div class="p-6 border-b border-white/5">
          <div class="relative group">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-bloomberg-amber transition-colors" />
            <input 
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text" 
              placeholder="DECRYPT SYMBOL..."
              class="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-bold focus:border-bloomberg-amber/50 outline-none transition-all placeholder:text-neutral-800"
            />
          </div>
        </div>

        <!-- Market List -->
        <div class="flex-grow overflow-y-auto custom-scrollbar pt-2 px-4 space-y-2">
          <div 
            v-for="ticker in filteredTickers" 
            :key="ticker.symbol"
            @click="selectSymbol(ticker.symbol)"
            class="flex items-center justify-between px-5 py-5 cursor-pointer transition-all rounded-2xl group border"
            :class="selectedSymbol === ticker.symbol 
              ? 'bg-bloomberg-amber border-bloomberg-amber text-black shadow-xl shadow-bloomberg-amber/20' 
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white'"
          >
            <div class="flex flex-col">
              <span class="text-sm font-black tracking-tighter uppercase">{{ ticker.symbol.replace('USDT', '') }}</span>
              <span class="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-50">V: {{ formatVolume(ticker.quoteVolume) }}</span>
            </div>
            <div class="flex flex-col items-end">
              <span class="text-sm font-black font-mono tabular-nums tracking-tighter">{{ formatPrice(ticker.lastPrice) }}</span>
              <div 
                class="text-[9px] font-black font-mono tracking-tighter mt-1 px-2 py-0.5 rounded-md"
                :class="selectedSymbol === ticker.symbol 
                  ? 'bg-black/10 text-black' 
                  : (parseFloat(ticker.priceChangePercent) >= 0 ? 'bg-zen-green/10 text-zen-green' : 'bg-zen-red/10 text-zen-red')"
              >
                {{ parseFloat(ticker.priceChangePercent) >= 0 ? '+' : '' }}{{ ticker.priceChangePercent }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Stats -->
        <div class="p-6 border-t border-white/5 bg-black/20 mt-auto">
            <div class="flex items-center justify-between text-[9px] font-black text-neutral-600 uppercase tracking-widest">
               <span>Nexus Status:</span>
               <span class="text-zen-green flex items-center gap-2">
                 <div class="w-1.5 h-1.5 bg-zen-green rounded-full animate-pulse"></div>
                 Active
               </span>
            </div>
         </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-grow flex flex-col min-w-0 relative">
      
      <!-- Top Stats Bar -->
      <header class="h-16 md:h-24 bg-[#0B0E11] border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 relative z-20">
        <div class="flex items-center gap-4 md:gap-10 min-w-0">
          <button @click="showSidebar = !showSidebar" class="p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-neutral-400 hover:text-bloomberg-amber hover:bg-white/[0.08] transition-all flex-shrink-0">
            <Menu v-if="!showSidebar" class="w-5 h-5 md:w-6 md:h-6" />
            <X v-else class="w-5 h-5 md:w-6 md:h-6" />
          </button>
 
           <div class="flex flex-col md:flex-row md:items-center gap-1 md:gap-8 min-w-0">
             <div class="flex items-center gap-2">
                <h1 @click="showSidebar = true" class="text-lg md:text-3xl font-black font-outfit text-white uppercase tracking-tighter cursor-pointer hover:text-bloomberg-amber transition-colors">{{ selectedSymbol.replace('USDT', '') }}</h1>
                <span class="text-[8px] md:text-[10px] font-black text-neutral-600 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded leading-none">USDT</span>
             </div>
 
             <div v-if="selectedTicker" class="flex items-center gap-6 md:gap-10">
               <div class="flex flex-col">
                 <span 
                   class="text-sm md:text-2xl font-black font-mono tabular-nums leading-none tracking-tighter"
                   :class="parseFloat(selectedTicker.priceChangePercent) >= 0 ? 'text-zen-green' : 'text-zen-red'"
                 >
                   {{ formatPrice(selectedTicker.lastPrice) }}
                 </span>
                 <span class="text-[8px] md:text-[10px] font-black text-neutral-700 uppercase tracking-widest leading-none mt-1">Live Feed</span>
               </div>
               <div class="flex flex-col">
                 <span 
                   class="text-sm md:text-2xl font-black font-mono tabular-nums leading-none tracking-tighter"
                   :class="parseFloat(selectedTicker.priceChangePercent) >= 0 ? 'text-zen-green' : 'text-zen-red'"
                 >
                   {{ parseFloat(selectedTicker.priceChangePercent) >= 0 ? '+' : '' }}{{ selectedTicker.priceChangePercent }}%
                 </span>
                 <span class="text-[8px] md:text-[10px] font-black text-neutral-700 uppercase tracking-widest leading-none mt-1">Vola</span>
               </div>
             </div>
           </div>
        </div>

        <div class="flex items-center gap-2 md:gap-6 shrink-0">
          <!-- Terminal Switcher -->
          <div class="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-xl">
            <button 
              @click="chartMode = 'TRADINGVIEW'"
              class="relative px-3 md:px-5 py-2 rounded-xl transition-all duration-300 group overflow-hidden"
              :class="chartMode === 'TRADINGVIEW' ? 'text-black font-black' : 'text-neutral-500 font-bold hover:text-white'"
            >
              <div v-if="chartMode === 'TRADINGVIEW'" class="absolute inset-0 bg-bloomberg-amber"></div>
              <span class="relative z-10 text-[9px] md:text-[11px] uppercase tracking-widest flex items-center gap-2">
                <LineChart class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Universal</span>
              </span>
            </button>
            <button 
              @click="chartMode = 'BINANCE'"
              class="relative px-3 md:px-5 py-2 rounded-xl transition-all duration-300 group overflow-hidden"
              :class="chartMode === 'BINANCE' ? 'text-black font-black' : 'text-neutral-500 font-bold hover:text-white'"
            >
              <div v-if="chartMode === 'BINANCE'" class="absolute inset-0 bg-bloomberg-amber"></div>
              <span class="relative z-10 text-[9px] md:text-[11px] uppercase tracking-widest flex items-center gap-2">
                <Zap class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Native</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- Trading Area -->
      <div class="flex-grow flex flex-col lg:flex-row min-h-0 lg:h-[calc(100vh-220px)] overflow-hidden relative">
        
        <!-- Center Space: Chart & Metrics -->
        <div class="flex-grow flex flex-col min-w-0 border-r border-white/5 h-full relative z-10">
          <!-- Interval Selector -->
          <div class="h-14 border-b border-white/5 flex items-center px-4 gap-2 bg-[#0B0E11] shrink-0 overflow-x-auto no-scrollbar">
            <div class="flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
              <button 
                v-for="int in intervals" 
                :key="int"
                @click="selectedInterval = int"
                class="px-4 md:px-6 py-2 text-[9px] md:text-[11px] font-black rounded-xl transition-all uppercase tracking-[0.2em] whitespace-nowrap"
                :class="selectedInterval === int ? 'bg-bloomberg-amber text-black shadow-lg shadow-bloomberg-amber/20' : 'text-neutral-600 hover:text-white'"
              >
                {{ int }}
              </button>
            </div>
            <div class="ml-auto hidden md:flex items-center gap-4">
              <span class="text-[10px] font-black text-neutral-800 uppercase tracking-[0.3em]">Quantum Engine Active</span>
              <div class="w-2 h-2 rounded-full bg-zen-green shadow-[0_0_10px_rgba(14,203,129,0.5)]"></div>
            </div>
          </div>

          <!-- The Chart Container -->
          <div class="flex-grow relative bg-[#0B0E11] px-2 py-2 md:px-4 md:py-4">
            <div class="h-full w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-black relative">
               <TradingChart 
                 v-if="chartMode === 'TRADINGVIEW'"
                 :symbol="selectedSymbol" 
                 :interval="selectedInterval" 
                 :advanced="true"
               />
               <BinanceChart
                 v-else
                 :symbol="selectedSymbol"
                 :interval="selectedInterval"
               />
               
               <!-- Mobile Overlay Trigger (Invisible touch area) -->
               <div v-if="!showSidebar && windowWidth < 1024" @click="showSidebar = true" class="absolute top-0 left-0 w-12 h-full z-40 bg-gradient-to-r from-black/20 to-transparent cursor-pointer"></div>
            </div>
          </div>

          <!-- Terminal Status Bar -->
          <div class="h-8 md:h-10 border-t border-white/5 bg-[#0B0E11] flex items-center px-4 md:px-6 text-[8px] md:text-[9px] font-black text-neutral-600 shrink-0 uppercase tracking-widest">
            <div class="flex items-center gap-4 md:gap-6">
               <span class="flex items-center gap-1.5">
                 <div class="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-zen-green"></div>
                 ORDER: LIVE
               </span>
               <span class="hidden sm:flex items-center gap-1.5">
                 <div class="w-1.5 h-1.5 rounded-full bg-zen-green"></div>
                 Wire: Encrypted
               </span>
            </div>
            <div class="ml-auto flex items-center gap-3">
              <span class="text-neutral-800 font-mono hidden md:inline">LATENCY: 12MS</span>
              <span class="text-bloomberg-amber text-[7px] md:text-[9px]">ALPHA NODE 07</span>
            </div>
          </div>
        </div>

        <!-- Right Sidebar: Intelligence & Analysis -->
        <div class="w-full lg:w-[450px] xl:w-[500px] flex flex-col bg-[#0B0E11] h-full border-t lg:border-t-0 lg:border-l border-white/5 overflow-hidden transition-all relative">
          <!-- Premium Tabs -->
          <div class="flex p-4 gap-3 bg-black/20">
            <button 
              @click="activeTab = 'NEWS'"
              class="flex-1 py-5 text-[11px] font-black transition-all rounded-[1.2rem] relative uppercase tracking-[0.3em] overflow-hidden group"
              :class="activeTab === 'NEWS' ? 'bg-bloomberg-amber text-black shadow-[0_10px_30px_rgba(243,186,47,0.2)]' : 'bg-white/[0.02] text-neutral-600 hover:bg-white/5'"
            >
              Intelligence
              <div v-if="activeTab === 'NEWS'" class="absolute -right-2 -bottom-2 w-10 h-10 bg-black/5 rounded-full filter blur-xl"></div>
            </button>
            <button 
              @click="authStore.isPremium ? activeTab = 'CALC' : router.push('/profile')"
              class="flex-1 py-5 text-[11px] font-black transition-all rounded-[1.2rem] relative uppercase tracking-[0.3em] overflow-hidden flex items-center justify-center gap-2 group"
              :class="activeTab === 'CALC' ? 'bg-bloomberg-amber text-black shadow-[0_10px_30px_rgba(243,186,47,0.2)]' : 'bg-white/[0.02] text-neutral-600 hover:bg-white/5'"
            >
              <Lock v-if="!authStore.isPremium" class="w-3.5 h-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
              Arsenal
            </button>
          </div>

          <!-- Content Scroll Area -->
          <div class="flex-grow overflow-y-auto no-scrollbar p-0 relative z-10">
            <!-- News Feed -->
            <div v-if="activeTab === 'NEWS'" class="divide-y divide-white/5">
              <div v-if="cryptoStore.newsLoading && cryptoStore.news.length === 0" class="p-20 flex flex-col items-center justify-center gap-6">
                <RefreshCw class="w-8 h-8 animate-spin text-bloomberg-amber" />
                <span class="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">Scanning Spectra...</span>
              </div>
              
              <a 
                v-for="(item, idx) in cryptoStore.news" 
                :key="idx"
                :href="item.url"
                target="_blank"
                class="block p-8 hover:bg-white/[0.03] transition-all group border-b border-white/5 relative"
              >
                <div class="flex justify-between items-start mb-4">
                  <span class="text-[10px] font-black text-bloomberg-amber uppercase tracking-[0.3em] bg-bloomberg-amber/10 px-2 py-0.5 rounded">{{ item.source }}</span>
                  <span class="text-[10px] text-neutral-600 font-black tabular-nums uppercase">{{ item.time }}</span>
                </div>
                <h3 class="text-base font-black font-outfit leading-tight group-hover:text-bloomberg-amber transition-colors tracking-tight text-white">{{ item.title }}</h3>
                <p v-if="item.description" class="mt-4 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed font-bold uppercase tracking-tight">{{ item.description }}</p>
                <div class="mt-6 flex items-center justify-between">
                   <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-zen-green"></div>
                      <span class="text-[9px] font-black text-neutral-700 uppercase tracking-widest">Verified Dispatch</span>
                   </div>
                   <ArrowUpRight class="w-4 h-4 text-neutral-700 group-hover:text-bloomberg-amber transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </a>
            </div>

            <!-- Calculator Component -->
            <div v-if="activeTab === 'CALC'" class="h-full bg-transparent">
              <LeverageCalculator />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Global Mobile Overlay -->
    <div 
      v-if="showSidebar && windowWidth < 1024" 
      @click="showSidebar = false"
      class="fixed inset-0 bg-black/80 backdrop-blur-md z-[45] lg:hidden"
    ></div>
  </div>
</template>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2B3139;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3B4149;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
