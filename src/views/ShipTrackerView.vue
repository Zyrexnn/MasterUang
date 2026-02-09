<script setup lang="ts">
import VesselMapEmbed from '../components/VesselMapEmbed.vue';
</script>

<template>
  <div class="h-full flex flex-col bg-[#0B0E11] text-white">
    <!-- Header / Toolbar -->
    <div class="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-[#0B0E11] z-20 relative">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-bloomberg-amber/10 border border-bloomberg-amber/20 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-bloomberg-amber">
            <path d="M12 2L2 22L12 18L22 22L12 2Z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-black tracking-widest uppercase text-white font-outfit">Sovereign Stream</h1>
          <p class="text-[10px] text-neutral-500 font-mono tracking-wider">VESSELFINDER LIVE TELEMETRY • CORE NODE</p>
        </div>
      </div>
      
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
        <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
        <span class="text-[9px] font-black tracking-widest text-neutral-400">EXTERNAL FEED ACTIVE</span>
      </div>
    </div>

    <!-- Main Map Area -->
    <div class="flex-1 relative overflow-hidden">
      <VesselMapEmbed />

      <!-- Legend Overlay -->
      <div class="absolute bottom-6 left-6 z-20">
         <div class="zen-glass p-4 border border-white/10 bg-[#11141D]/90 backdrop-blur-xl rounded-xl shadow-2xl">
            <div class="flex items-center gap-3 mb-3">
               <div class="w-2 h-2 rounded-full bg-bloomberg-amber"></div>
               <span class="text-[10px] font-black text-white uppercase tracking-widest">Global Maritime Traffic</span>
            </div>
            <p class="text-[9px] text-neutral-500 leading-relaxed font-mono max-w-[200px]">
              Powered by VesselFinder. Real-time satellite AIS data integration for global vessel tracking.
            </p>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zen-glass {
  background: rgba(17, 20, 29, 0.9);
  backdrop-filter: blur(12px);
}
</style>
