<script setup lang="ts">
import { useMarketData } from '../composables/useMarketData';
import { TrendingUp, TrendingDown, RefreshCw, Layers, Activity, AlertCircle } from 'lucide-vue-next';

// Start polling every 60s
const { marketStore, isPolling } = useMarketData(60);

const formatPrice = (val: number, isIdr: boolean = false) => {
    if (isIdr) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

const getColor = (change: number) => {
    if (change > 0) return 'text-zen-green';
    if (change < 0) return 'text-zen-red';
    return 'text-neutral-400';
};

const getBg = (change: number) => {
    if (change > 0) return 'bg-zen-green/10 border-zen-green/20';
    if (change < 0) return 'bg-zen-red/10 border-zen-red/20';
    return 'bg-white/5 border-white/10';
};
</script>

<template>
  <div class="space-y-8">
     <!-- Header -->
     <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
           <Layers class="w-5 h-5 text-bloomberg-amber" />
           <h2 class="text-xl font-black font-outfit uppercase tracking-tighter text-white">Global Markets</h2>
        </div>
        <div class="flex items-center gap-4">
           <div v-if="marketStore.error" class="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
              <AlertCircle class="w-3 h-3" />
              <span>Partial Outage</span>
           </div>
           <button class="p-2 rounded-lg bg-white/5 hover:text-white text-neutral-500 transition-colors" @click="marketStore.fetchMarketData(true)">
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': marketStore.loading }" />
           </button>
        </div>
     </div>

     <!-- Indices Grid -->
     <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="item in marketStore.indices" :key="item.description" 
             class="terminal-card bg-[#11141D] p-5 relative overflow-hidden group hover:border-bloomberg-amber/30 transition-all border border-white/5">
             
           <div class="flex justify-between items-start mb-2">
              <span class="text-[10px] font-black font-mono text-neutral-500 uppercase tracking-widest">{{ item.description }}</span>
              <Activity class="w-4 h-4 text-neutral-700 group-hover:text-bloomberg-amber transition-colors" />
           </div>
           
           <div class="mt-2">
              <h3 class="text-2xl font-black font-mono tracking-tighter text-white tabular-nums">
                 {{ formatPrice(item.current) }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                 <span class="text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" :class="[getColor(item.change), getBg(item.change)]">
                    <TrendingUp v-if="item.change >= 0" class="w-3 h-3" />
                    <TrendingDown v-else class="w-3 h-3" />
                    {{ Math.abs(item.change).toFixed(2) }}%
                 </span>
              </div>
           </div>
        </div>

        <!-- Commodities -->
        <div v-for="item in marketStore.commodities" :key="item.description" 
             class="terminal-card bg-[#11141D] p-5 relative overflow-hidden group hover:border-bloomberg-amber/30 transition-all border border-white/5">
           <div class="flex justify-between items-start mb-2">
              <span class="text-[10px] font-black font-mono text-neutral-500 uppercase tracking-widest">{{ item.description }}</span>
              <div class="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase">CMDTY</div>
           </div>
           <div class="mt-2">
              <h3 class="text-2xl font-black font-mono tracking-tighter text-white tabular-nums">
                 ${{ formatPrice(item.current) }}
              </h3>
              <div class="flex items-center gap-2 mt-1">
                 <span class="text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" :class="[getColor(item.change), getBg(item.change)]">
                    {{ item.change >= 0 ? '+' : '' }}{{ item.change.toFixed(2) }}%
                 </span>
              </div>
           </div>
        </div>
     </div>

     <!-- IDX Stocks Ticker -->
     <div v-if="marketStore.localStocks.length > 0" class="terminal-card bg-[#0D0F16] border border-white/5 p-6">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
               <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
               Jakarta Composite (LQ45 Leaders)
            </h3>
            <span class="text-[9px] font-mono text-neutral-600">DELAYED 15M</span>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           <div v-for="stock in marketStore.localStocks" :key="stock.symbol" class="flex items-center justify-between group cursor-default">
              <div>
                 <p class="text-[11px] font-black text-white group-hover:text-bloomberg-amber transition-colors">{{ stock.description }}</p>
                 <p class="text-[9px] font-mono text-neutral-600 uppercase tracking-widest">{{ stock.symbol }}</p>
              </div>
              <div class="text-right">
                 <p class="text-sm font-black font-mono text-white tabular-nums">{{ formatPrice(stock.current, true) }}</p>
                 <span class="text-[10px] font-bold" :class="getColor(stock.change)">
                    {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
                 </span>
              </div>
           </div>
        </div>
     </div>
  </div>
</template>
