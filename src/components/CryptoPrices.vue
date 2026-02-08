<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useCryptoStore } from '@/stores/cryptoStore';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-vue-next';

const cryptoStore = useCryptoStore();

// Refresh interval: 2 minutes (120s) - Rate limit friendly
let intervalId: any = null;

onMounted(() => {
  cryptoStore.fetchQuotes();
  intervalId = setInterval(() => {
    cryptoStore.fetchQuotes();
  }, 120000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

const formatPrice = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};

const formatMktCap = (val: number) => {
  if (val >= 1e12) return (val / 1e12).toFixed(2) + 'T';
  if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
  return (val / 1e6).toFixed(2) + 'M';
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Control -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Clock class="w-4 h-4 text-text-secondary" />
        <span class="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em]">Live Market Feed</span>
      </div>
      
      <button 
        @click="cryptoStore.fetchQuotes('BTC,ETH,SOL,BNB,XRP', true)"
        :disabled="cryptoStore.loading"
        class="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-text-secondary hover:text-bloomberg-amber transition-colors disabled:opacity-30"
      >
        <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': cryptoStore.loading }" />
        <span>{{ cryptoStore.loading ? 'Updating...' : 'Refresh' }}</span>
      </button>
    </div>

    <!-- Error/Warning Alert -->
    <div v-if="cryptoStore.error" class="bg-zen-amber/10 border border-zen-amber/30 p-4 rounded flex items-start space-x-3">
      <AlertTriangle class="w-4 h-4 text-bloomberg-amber mt-0.5" />
      <p class="text-[11px] font-mono text-bloomberg-amber leading-relaxed">{{ cryptoStore.error }}</p>
    </div>

    <!-- Pricing Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div 
        v-for="coin in cryptoStore.prices" 
        :key="coin.symbol"
        class="bg-[#0F1117] border border-white/5 p-5 rounded-lg hover:border-bloomberg-amber/30 transition-all group"
      >
        <div class="flex justify-between items-start mb-6">
          <div class="space-y-1">
            <h4 class="text-xs font-mono font-bold text-white group-hover:text-bloomberg-amber transition-colors">{{ coin.symbol }}/USD</h4>
            <p class="text-[9px] font-mono text-text-secondary uppercase tracking-tighter">{{ coin.name }}</p>
          </div>
          <div 
            class="text-[10px] font-mono px-2 py-0.5 rounded flex items-center"
            :class="coin.change24h >= 0 ? 'bg-zen-green/10 text-zen-green' : 'bg-zen-red/10 text-zen-red'"
          >
            <TrendingUp v-if="coin.change24h >= 0" class="w-3 h-3 mr-1" />
            <TrendingDown v-else class="w-3 h-3 mr-1" />
            {{ coin.change24h.toFixed(2) }}%
          </div>
        </div>

        <div class="space-y-1">
          <h3 class="text-xl font-mono text-white tracking-tighter tabular-nums">
            {{ formatPrice(coin.price) }}
          </h3>
          <div class="flex items-center justify-between text-[9px] font-mono text-text-secondary uppercase">
            <span>Market Cap</span>
            <span>{{ formatMktCap(coin.marketCap) }}</span>
          </div>
        </div>
        
        <!-- Subtle progress bar for design -->
        <div class="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            class="h-full transition-all duration-1000"
            :class="coin.change24h >= 0 ? 'bg-zen-green/50' : 'bg-zen-red/50'"
            :style="{ width: '100%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bloomberg Typography Vibes */
.font-mono {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}
</style>
