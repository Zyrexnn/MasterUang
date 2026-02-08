<script setup lang="ts">
import { ref } from 'vue';
import ShipMap from '../components/ShipMap.vue';
import { useAisPolling } from '../composables/useAisPolling';
import { useAisStore } from '../stores/aisStore';
import { REGIONS } from '../config/regions';

const store = useAisStore();
const { isPolling, isAutoRefreshEnabled, fetchVessels, stats, error, lastUpdate } = useAisPolling();

const toggleAutoRefresh = () => {
  isAutoRefreshEnabled.value = !isAutoRefreshEnabled.value;
};

const formatTimeAgo = (timestamp: number) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
};
</script>

<template>
  <div class="h-full flex flex-col bg-[#0B0E11] text-white">
    <!-- Header / Toolbar -->
    <div class="h-auto lg:h-16 px-4 md:px-6 py-3 lg:py-0 flex flex-col lg:flex-row items-center justify-between border-b border-white/5 bg-[#0B0E11] z-20 relative gap-4 lg:gap-0">
      <div class="flex items-center justify-between w-full lg:w-auto">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-bloomberg-amber/10 border border-bloomberg-amber/20 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-bloomberg-amber">
              <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 class="text-sm font-black tracking-widest uppercase text-white font-outfit">Sovereign Stream</h1>
            <p class="text-[10px] text-neutral-500 font-mono tracking-wider">GLOBAL AIS TELEMETRY • ALPHA NODE 07</p>
          </div>
        </div>
      </div>
      
      <!-- Region Selector (Desktop) -->
      <div class="hidden lg:flex items-center gap-2 bg-white/5 p-1 rounded-lg">
         <button 
           v-for="region in [REGIONS.SOUTHEAST_ASIA, REGIONS.EAST_ASIA, REGIONS.EUROPE, REGIONS.GLOBAL]" 
           :key="region.id"
           @click="() => store.setRegion(region.id)"
           class="px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all font-outfit tracking-widest"
           :class="store.selectedRegion.id === region.id ? 'bg-bloomberg-amber text-black shadow-lg shadow-amber-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5'"
         >
           {{ region.name }}
         </button>
         
         <div class="relative group">
            <button class="px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all font-outfit tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 flex items-center gap-1">
              More <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <div class="absolute top-full right-0 mt-2 w-48 bg-[#161A23] border border-white/10 rounded-lg shadow-xl hidden group-hover:block overflow-hidden z-50">
               <button 
                v-for="region in [REGIONS.SOUTH_ASIA, REGIONS.MIDDLE_EAST, REGIONS.AFRICA, REGIONS.NORTH_AMERICA, REGIONS.SOUTH_AMERICA, REGIONS.OCEANIA]" 
                :key="region.id"
                @click="() => store.setRegion(region.id)"
                class="w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                :class="store.selectedRegion.id === region.id ? 'text-bloomberg-amber' : 'text-neutral-400'"
               >
                 {{ region.name }}
               </button>
            </div>
         </div>
      </div>

      <!-- Region Selector (Mobile Horizontal Scroll) -->
      <div class="lg:hidden w-full overflow-x-auto no-scrollbar pb-1">
        <div class="flex items-center gap-2 min-w-max">
          <button 
            v-for="region in Object.values(REGIONS)" 
            :key="region.id"
            @click="() => store.setRegion(region.id)"
            class="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all font-outfit tracking-[0.15em]"
            :class="store.selectedRegion.id === region.id 
              ? 'bg-bloomberg-amber text-black border-bloomberg-amber shadow-lg shadow-amber-500/10' 
              : 'bg-white/[0.03] border-white/5 text-neutral-500'"
          >
            {{ region.name }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
        <!-- Latency Indicator -->
        <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
          <span class="text-[9px] font-black tracking-widest text-neutral-400">LATENCY: 240MS</span>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2">
           <button 
            @click="toggleAutoRefresh"
            class="px-3 py-1.5 rounded border text-[10px] font-bold tracking-wider uppercase transition-all duration-200 flex items-center gap-2"
            :class="isAutoRefreshEnabled 
              ? 'bg-zen-green/10 border-zen-green/30 text-zen-green hover:bg-zen-green/20' 
              : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'"
          >
            <div class="w-1.5 h-1.5 rounded-full" :class="isAutoRefreshEnabled ? 'bg-zen-green' : 'bg-neutral-500'"></div>
            {{ isAutoRefreshEnabled ? 'Auto ON' : 'Auto OFF' }}
          </button>

          <button 
            @click="fetchVessels" 
            :disabled="isPolling()"
            class="px-4 py-1.5 bg-bloomberg-amber hover:bg-amber-600 active:bg-amber-700 text-black text-[10px] font-black tracking-widest uppercase rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="isPolling()" class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19V22Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {{ isPolling() ? 'SYNC...' : 'REFRESH' }}
          </button>
        </div>
      </div>
    </div>

      <!-- Main Map Area -->
      <div class="flex-1 relative overflow-hidden">
        <ShipMap />

        <!-- Overlay Stats (Bottom) -->
        <div class="absolute bottom-4 left-4 right-4 lg:right-auto lg:bottom-6 lg:left-6 z-20 flex flex-col md:flex-row lg:flex-col gap-2 pointer-events-none">
           <!-- Active Fleet Card -->
           <div class="zen-glass p-3 lg:p-5 border border-white/10 flex items-center gap-4 lg:gap-5 bg-[#11141D]/90 backdrop-blur-xl pointer-events-auto rounded-xl shadow-2xl">
              <div class="p-2 lg:p-3 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-lg shrink-0">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="lg:w-6 lg:h-6" stroke="#FB4D02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M3 21h18"/>
                   <path d="M5 21V7"/>
                   <path d="M19 21V7"/>
                   <path d="M2 10h20"/>
                   <path d="M12 21V3"/>
                   <path d="M12 3l-4 4"/>
                   <path d="M12 3l4 4"/>
                 </svg>
              </div>
              <div class="flex-1 lg:flex-none">
                <h4 class="text-[8px] lg:text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-0.5 lg:mb-1">Active Fleet</h4>
                <div class="flex items-baseline gap-2">
                   <p class="text-xl lg:text-3xl font-black font-outfit text-white tracking-tighter leading-none">{{ stats().activeCount }}</p>
                   <span class="text-[8px] lg:text-[10px] text-neutral-600 font-bold uppercase">Units Detected</span>
                </div>
              </div>
           </div>

           <!-- Last Updated & Status -->
           <div class="zen-glass px-4 py-2 border border-white/10 bg-[#11141D]/90 backdrop-blur-xl rounded-lg pointer-events-auto flex items-center justify-between lg:justify-start gap-4">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full" :class="error() ? 'bg-red-500' : 'bg-zen-green'"></div>
                <span class="text-[8px] lg:text-[9px] font-bold text-neutral-300 tracking-wider">
                  {{ error() ? 'OFFLINE' : 'ONLINE' }}
                </span>
              </div>
              <div class="h-3 w-px bg-white/10 hidden lg:block"></div>
              <span class="text-[8px] lg:text-[9px] font-mono text-neutral-500 uppercase truncate">
                SYNC: <span class="text-white">{{ formatTimeAgo(lastUpdate()) }}</span>
              </span>
           </div>
        </div>

        <!-- Scanning Sector (Right) -->
        <div class="absolute top-6 right-6 z-20 pointer-events-none hidden lg:block">
           <div class="zen-glass p-5 border border-white/10 bg-[#11141D]/90 backdrop-blur-xl rounded-xl w-64 pointer-events-auto shadow-2xl">
              <div class="flex items-center gap-2 mb-4">
                <svg class="text-bloomberg-amber animate-spin-slow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  <path d="M2 12h20"/>
                </svg>
                <h3 class="text-[10px] font-black text-white uppercase tracking-widest">Scanning Sector</h3>
              </div>
              
              <div class="space-y-3">
                <div class="p-3 bg-white/5 rounded border border-white/5">
                  <p class="text-[9px] text-neutral-500 uppercase font-bold mb-1">Current Zone</p>
                  <p class="text-xs text-white font-mono font-bold">{{ store.selectedRegion.name }}</p>
                </div>
                <div class="p-3 bg-white/5 rounded border border-white/5">
                  <p class="text-[9px] text-neutral-500 uppercase font-bold mb-1">Protocol Status</p>
                  <p class="text-xs font-mono font-bold" :class="isPolling() ? 'text-bloomberg-amber' : 'text-zen-green'">
                    {{ isPolling() ? 'SYNCING DATA...' : store.selectedRegion.description }}
                  </p>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-white/5">
                <div class="flex gap-2 text-[10px] text-neutral-500 leading-relaxed font-mono">
                  <svg class="w-3 h-3 flex-shrink-0 mt-0.5 text-bloomberg-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  Data synthesized via public AIS stream. Protocol is not certified for maritime navigation or tactical deployment.
                </div>
              </div>
           </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
