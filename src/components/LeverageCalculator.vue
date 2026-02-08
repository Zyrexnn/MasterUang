<script setup lang="ts">
import { ref, computed } from 'vue';
import { Calculator, TrendingUp, TrendingDown, Info } from 'lucide-vue-next';

const entryPrice = ref<number | null>(null);
const exitPrice = ref<number | null>(null);
const leverage = ref<number>(10);
const margin = ref<number | null>(100);
const side = ref<'LONG' | 'SHORT'>('LONG');

const pnl = computed(() => {
  if (!entryPrice.value || !exitPrice.value || !margin.value) return 0;
  
  const positionSize = margin.value * leverage.value;
  const quantity = positionSize / entryPrice.value;
  
  if (side.value === 'LONG') {
    return (exitPrice.value - entryPrice.value) * quantity;
  } else {
    return (entryPrice.value - exitPrice.value) * quantity;
  }
});

const pnlPercentage = computed(() => {
  if (!margin.value || margin.value === 0) return 0;
  return (pnl.value / margin.value) * 100;
});

const liquidationPrice = computed(() => {
  if (!entryPrice.value || !leverage.value) return 0;
  // Simple liquidation formula (approximate)
  if (side.value === 'LONG') {
    return entryPrice.value * (1 - 1 / leverage.value);
  } else {
    return entryPrice.value * (1 + 1 / leverage.value);
  }
});

const formatCurrency = (val: number) => {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<template>
  <div class="h-full bg-[#0B0E11] font-mono flex flex-col">
    <!-- Calculator Body -->
    <div class="p-6 lg:p-8 space-y-8 flex-grow overflow-y-auto no-scrollbar">
      
      <!-- Side Selector (Premium Glass) -->
      <div class="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-lg shadow-inner">
        <button 
          @click="side = 'LONG'"
          class="flex-1 py-3 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-2"
          :class="side === 'LONG' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-neutral-500 hover:text-neutral-300'"
        >
          <TrendingUp class="w-3.5 h-3.5" /> LONG
        </button>
        <button 
          @click="side = 'SHORT'"
          class="flex-1 py-3 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-2"
          :class="side === 'SHORT' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-neutral-500 hover:text-neutral-300'"
        >
          <TrendingDown class="w-3.5 h-3.5" /> SHORT
        </button>
      </div>

      <div class="space-y-6">
        <!-- Leverage Area -->
        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <label class="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Leverage</label>
            <span class="text-amber-400 text-lg font-bold">{{ leverage }}x</span>
          </div>
          <div class="relative group">
            <input 
              type="range" 
              v-model.number="leverage" 
              min="1" 
              max="125" 
              class="w-full h-1.5 bg-white/[0.05] rounded-full appearance-none cursor-pointer accent-amber-500"
            />
            <div class="flex justify-between text-[10px] text-neutral-600 mt-2 font-bold px-1">
              <span>1x</span>
              <span>125x</span>
            </div>
          </div>
        </div>

        <!-- Input Grids -->
        <div class="grid grid-cols-1 gap-5">
          <div class="space-y-2">
            <label class="text-[10px] text-neutral-500 uppercase font-black tracking-widest block">Entry Capital (USDT)</label>
            <div class="relative">
               <input 
                v-model.number="margin" 
                type="number" 
                placeholder="100.00"
                class="w-full bg-white/[0.02] border border-white/5 rounded-lg px-5 py-3.5 text-sm lg:text-base focus:border-amber-400 focus:bg-amber-400/5 focus:outline-none transition-all placeholder:text-neutral-700 font-bold"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600 font-bold">USDT</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] text-neutral-500 uppercase font-black tracking-widest block">Entry Price</label>
              <input 
                v-model.number="entryPrice" 
                type="number" 
                placeholder="Entry"
                class="w-full bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3.5 text-sm focus:border-amber-400/50 focus:outline-none focus:bg-white/[0.05] transition-all font-bold"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] text-neutral-500 uppercase font-black tracking-widest block">Target Price</label>
              <input 
                v-model.number="exitPrice" 
                type="number" 
                placeholder="Target"
                class="w-full bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3.5 text-sm focus:border-amber-400/50 focus:outline-none focus:bg-white/[0.05] transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Results Terminal (Premium Dark Zone) -->
      <div class="bg-black/30 border border-white/5 rounded-xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-[50px] -mr-16 -mt-16 rounded-full"></div>
        
        <div class="flex justify-between items-center group">
          <span class="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Return on Equity (ROE)</span>
          <span 
            class="text-xl lg:text-3xl font-black tabular-nums transition-all"
            :class="pnlPercentage >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'"
          >
            {{ pnlPercentage >= 0 ? '+' : '' }}{{ pnlPercentage.toFixed(2) }}%
          </span>
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        <div class="grid grid-cols-2 gap-8">
           <div class="space-y-1">
             <span class="text-[9px] text-neutral-600 font-black uppercase tracking-widest block">EST. PROFIT</span>
             <span class="text-sm lg:text-base font-bold tabular-nums" :class="pnl >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'">
               {{ pnl >= 0 ? '+' : '' }}${{ formatCurrency(pnl) }}
             </span>
           </div>
           <div class="space-y-1 text-right">
             <span class="text-[9px] text-neutral-600 font-black uppercase tracking-widest block">LIQ. PRICE</span>
             <span class="text-sm lg:text-base font-bold text-amber-500/90 tabular-nums">
               ${{ formatCurrency(liquidationPrice) }}
             </span>
           </div>
        </div>
      </div>
    </div>

    <!-- Alert Banner -->
    <div class="px-6 py-4 bg-amber-400/[0.02] border-t border-white/5 flex items-center justify-center">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
        <p class="text-[9px] text-neutral-600 font-bold leading-relaxed uppercase tracking-tighter text-center">
          Terminal Mode: Estimates based on current live data feeds.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
