<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import FlightMap from '../components/FlightMap.vue';
import { useFlightTracking } from '../composables/useFlightTracking';
import { Search, X, Plane, Crosshair, Map as MapIcon, Info, Activity, Gauge, ArrowUp, ArrowDown, Radio, Layers, Globe, Clock } from 'lucide-vue-next';

const { 
  aircraftList, 
  selectedAircraft, 
  selectedAircraftId,
  isFollowing,
  isLoading, 
  error, 
  activeCount, 
  lastFetchTime, 
  fetchAircraft,
  getCategoryName
} = useFlightTracking();

const searchQuery = ref('');
const timeSinceSync = ref(0);

// Update time since last sync every second
let syncTimer: number;
onMounted(() => {
  syncTimer = window.setInterval(() => {
    timeSinceSync.value = Math.floor((Date.now() - lastFetchTime.value) / 1000);
  }, 1000);
});
onUnmounted(() => clearInterval(syncTimer));

const filteredList = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return aircraftList.value.filter(ac => 
    ac.callsign.toLowerCase().includes(query) || 
    ac.icao24.toLowerCase().includes(query)
  ).slice(0, 5);
});

const handleSelect = (id: string) => {
  selectedAircraftId.value = id;
  isFollowing.value = true;
  searchQuery.value = '';
};

const toggleTracking = () => {
  isFollowing.value = !isFollowing.value;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(Math.round(num));
};

const getVerticalIndicator = (rate: number) => {
  if (rate > 50) return { icon: 'up', label: 'Climbing', color: 'text-green-400' };
  if (rate < -50) return { icon: 'down', label: 'Descending', color: 'text-red-400' };
  return { icon: 'level', label: 'Level', color: 'text-neutral-400' };
};

const formatSyncTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
};
</script>

<template>
  <div class="h-full flex flex-col bg-[#010101] text-white overflow-hidden relative font-outfit">
    <!-- Header -->
    <div class="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#010101] z-[100] shrink-0">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-bloomberg-amber/10 border border-bloomberg-amber/20 flex items-center justify-center shrink-0">
          <Plane class="text-bloomberg-amber w-6 h-6" />
        </div>
        <div>
          <h1 class="text-sm font-black tracking-widest uppercase text-white">Aerial Stream: OSN</h1>
          <div class="flex items-center gap-2">
             <div class="w-1 h-1 rounded-full bg-zen-green animate-pulse"></div>
             <p class="text-[9px] text-neutral-500 font-mono tracking-wider uppercase">Smart Cache • No Rate Limits</p>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="hidden lg:flex relative w-80">
        <div class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
          <Search class="w-4 h-4" />
        </div>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="SEARCH CALLSIGN..."
          class="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[10px] font-black tracking-widest focus:border-bloomberg-amber/50 outline-none transition-all placeholder:text-neutral-700"
        />
        
        <div v-if="filteredList.length > 0" class="absolute top-[115%] left-0 right-0 bg-[#0B0E11] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[110] p-1">
          <button 
            v-for="ac in filteredList" 
            :key="ac.icao24"
            @click="handleSelect(ac.icao24)"
            class="w-full px-4 py-2.5 hover:bg-white/5 flex items-center justify-between rounded-lg group"
          >
            <div class="text-left">
              <p class="text-[11px] font-black text-bloomberg-amber uppercase">{{ ac.callsign }}</p>
              <p class="text-[8px] text-neutral-500 uppercase font-black">{{ ac.icao24.toUpperCase() }}</p>
            </div>
            <Plane class="w-3.5 h-3.5 text-neutral-700 group-hover:text-bloomberg-amber" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Last Sync Timer -->
        <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
          <Clock class="w-3 h-3 text-neutral-500" />
          <span class="text-[9px] font-mono font-bold text-neutral-400">{{ formatSyncTime(timeSinceSync) }}</span>
        </div>
        
        <div class="hidden lg:flex flex-col items-end">
          <p class="text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em] mb-0.5">Cached</p>
          <p class="text-xs font-mono font-bold text-white tracking-widest">{{ formatNumber(activeCount) }}</p>
        </div>
        
        <button 
          @click="fetchAircraft()"
          :disabled="isLoading"
          class="px-5 py-2.5 bg-bloomberg-amber hover:bg-amber-600 disabled:opacity-50 text-black text-[10px] font-black tracking-widest uppercase rounded-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <Activity v-if="isLoading" class="w-3 h-3 animate-spin" />
          {{ isLoading ? 'SYNC' : 'REFRESH' }}
        </button>
      </div>
    </div>

    <!-- Map -->
    <div class="flex-1 relative">
      <FlightMap 
        :aircraft="aircraftList" 
        :selectedAircraft="selectedAircraft"
        :isFollowing="isFollowing"
        @select="id => handleSelect(id)"
      />

      <!-- Aircraft Panel -->
      <div v-if="selectedAircraft" class="absolute top-4 left-4 w-[340px] z-[1000]">
        <div class="bg-[#0B0E11]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)]">
          <!-- Header -->
          <div class="p-4 border-b border-white/5 bg-gradient-to-r from-bloomberg-amber/10 to-transparent">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-black text-white leading-none mb-1">{{ selectedAircraft.callsign }}</h3>
                <p class="text-[9px] text-bloomberg-amber font-black tracking-widest uppercase">{{ selectedAircraft.icao24.toUpperCase() }}</p>
              </div>
              <button @click="selectedAircraftId = null" class="p-1.5 hover:bg-white/10 rounded-full">
                <X class="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            <div class="flex items-center gap-2 mt-3">
              <div class="px-2 py-0.5 bg-zen-green/20 border border-zen-green/30 rounded flex items-center gap-1.5">
                 <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
                 <span class="text-[8px] font-black text-zen-green uppercase tracking-widest">{{ selectedAircraft.onGround ? 'GROUND' : 'AIRBORNE' }}</span>
              </div>
              <div class="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                 <span class="text-[8px] font-black text-neutral-400 uppercase tracking-widest">{{ selectedAircraft.positionSource }}</span>
              </div>
            </div>
          </div>

          <!-- Tracking -->
          <div class="p-2 border-b border-white/5">
             <button 
               @click="toggleTracking"
               class="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all"
               :class="isFollowing ? 'bg-bloomberg-amber text-black' : 'bg-white/5 text-white hover:bg-white/10'"
             >
               <div class="flex items-center gap-2">
                  <Crosshair class="w-4 h-4" :class="isFollowing ? 'animate-pulse' : ''" />
                  <span class="text-[10px] font-black uppercase tracking-widest">
                     {{ isFollowing ? 'TRACKING' : 'START TRACK' }}
                  </span>
               </div>
               <div class="w-2 h-2 rounded-full" :class="isFollowing ? 'bg-black' : 'bg-neutral-600'"></div>
             </button>
          </div>

          <!-- Telemetry -->
          <div class="p-4 grid grid-cols-3 gap-3">
            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <MapIcon class="w-2.5 h-2.5" /> ALT
              </p>
              <p class="text-base font-mono font-bold text-white leading-none">{{ formatNumber(selectedAircraft.altitude * 3.28084) }}</p>
              <p class="text-[8px] text-neutral-500 font-black">FT</p>
            </div>
            
            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Gauge class="w-2.5 h-2.5" /> SPD
              </p>
              <p class="text-base font-mono font-bold text-white leading-none">{{ formatNumber(selectedAircraft.velocity * 1.94384) }}</p>
              <p class="text-[8px] text-neutral-500 font-black">KTS</p>
            </div>

            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Activity class="w-2.5 h-2.5" /> HDG
              </p>
              <p class="text-base font-mono font-bold text-white leading-none">{{ formatNumber(selectedAircraft.heading) }}</p>
              <p class="text-[8px] text-neutral-500 font-black">°</p>
            </div>

            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <component :is="selectedAircraft.verticalRate > 50 ? ArrowUp : selectedAircraft.verticalRate < -50 ? ArrowDown : Activity" class="w-2.5 h-2.5" /> V/S
              </p>
              <p class="text-base font-mono font-bold leading-none" :class="getVerticalIndicator(selectedAircraft.verticalRate).color">
                {{ selectedAircraft.verticalRate > 0 ? '+' : '' }}{{ formatNumber(selectedAircraft.verticalRate * 196.85) }}
              </p>
              <p class="text-[8px] text-neutral-500 font-black">FPM</p>
            </div>

            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Radio class="w-2.5 h-2.5" /> SQK
              </p>
              <p class="text-base font-mono font-bold text-bloomberg-amber leading-none">{{ selectedAircraft.squawk || '----' }}</p>
              <p class="text-[8px] text-neutral-500 font-black">CODE</p>
            </div>

            <div class="bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p class="text-[7px] font-black text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Globe class="w-2.5 h-2.5" /> GEO
              </p>
              <p class="text-base font-mono font-bold text-white leading-none">{{ formatNumber(selectedAircraft.geoAltitude * 3.28084) }}</p>
              <p class="text-[8px] text-neutral-500 font-black">FT</p>
            </div>
          </div>

          <!-- Details -->
          <div class="px-4 pb-4 space-y-2">
            <div class="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <div class="flex items-center gap-2">
                <Layers class="w-3.5 h-3.5 text-neutral-600" />
                <span class="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Type</span>
              </div>
              <span class="text-[9px] font-mono font-bold text-white">{{ getCategoryName(selectedAircraft.category) }}</span>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <div class="flex items-center gap-2">
                <Globe class="w-3.5 h-3.5 text-neutral-600" />
                <span class="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Origin</span>
              </div>
              <span class="text-[9px] font-mono font-bold text-white uppercase">{{ selectedAircraft.origin }}</span>
            </div>
          </div>
          
          <div class="px-4 py-2 bg-white/5 border-t border-white/5 flex justify-between items-center text-[7px] font-black text-neutral-600 uppercase tracking-widest">
            <span>Position Interpolated</span>
            <span class="font-mono text-zen-green text-[9px]">ACTIVE</span>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="absolute top-6 left-1/2 -translate-x-1/2 z-[2000]">
         <div class="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl backdrop-blur-md">
            <Info class="w-3 h-3" />
            {{ error }}
         </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="absolute top-4 right-4 z-[50]">
         <div class="px-3 py-1.5 bg-black/80 border border-white/5 rounded-full flex items-center gap-2">
            <div class="w-1.5 h-1.5 bg-bloomberg-amber rounded-full animate-ping"></div>
            <span class="text-[8px] font-black text-white uppercase tracking-widest">Syncing...</span>
         </div>
      </div>
    </div>
  </div>
</template>
