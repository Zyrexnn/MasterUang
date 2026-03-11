<script setup lang="ts">
import { Anchor } from 'lucide-vue-next'
import VesselMapEmbed from '../components/VesselMapEmbed.vue';
</script>

<template>
  <div class="h-full flex flex-col bg-[#07090E] text-white font-outfit relative overflow-hidden">
    <!-- Cyber Grid Overlay behind the map for texture -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.03] z-10" 
         style="background-image: radial-gradient(#F59E0B 0.5px, transparent 0.5px); background-size: 24px 24px;"></div>

    <!-- Header / Command Bar -->
    <header class="h-16 lg:h-20 px-6 lg:px-10 flex items-center justify-between border-b border-white/[0.05] bg-[#0B0E11]/80 backdrop-blur-xl z-30 relative shrink-0">
      <div class="flex items-center gap-4 lg:gap-6">
        <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-bloomberg-amber/10 border border-bloomberg-amber/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <Anchor class="w-5 h-5 lg:w-6 lg:h-6 text-bloomberg-amber" />
        </div>
        <div class="space-y-0.5">
          <h1 class="text-sm lg:text-lg font-black tracking-widest uppercase text-white leading-none">Global Maritime Terminal</h1>
          <div class="flex items-center gap-2">
            <span class="text-[8px] lg:text-[10px] text-neutral-500 font-mono tracking-widest uppercase">AIS Feed: Node-Sigma-04</span>
            <div class="w-1 h-1 rounded-full bg-zen-green animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-4 lg:gap-8">
        <!-- System Metric (Desktop) -->
        <div class="hidden lg:flex items-center gap-6 border-r border-white/5 pr-8">
           <div class="flex flex-col items-end">
              <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Active Links</span>
              <span class="text-[10px] font-mono text-white">12,482 VESSELS</span>
           </div>
           <div class="flex flex-col items-end">
              <span class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Refresh Rate</span>
              <span class="text-[10px] font-mono text-white">4.2 OPS/S</span>
           </div>
        </div>

        <!-- Connection Badge -->
        <div class="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 group hover:border-bloomberg-amber/30 transition-all">
          <div class="relative">
            <div class="w-2 h-2 rounded-full bg-zen-green"></div>
            <div class="absolute inset-0 w-2 h-2 rounded-full bg-zen-green animate-ping"></div>
          </div>
          <span class="text-[9px] font-black tracking-[0.2em] text-neutral-400 group-hover:text-white transition-colors uppercase">Secure Link</span>
        </div>
      </div>
    </header>

    <!-- Main Map Area -->
    <div class="flex-1 relative z-20 overflow-hidden">
      <VesselMapEmbed />

      <!-- Map Details Overlay (Bottom Left) -->
      <div class="absolute bottom-6 left-6 right-6 lg:right-auto z-40">
         <div class="zen-glass p-5 lg:p-6 border border-white/10 bg-[#11141D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] max-w-sm">
            <div class="flex items-center justify-between mb-4">
               <div class="flex items-center gap-3">
                  <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                  <span class="text-[10px] font-black text-white uppercase tracking-[0.2em]">Global AIS Stream</span>
               </div>
               <span class="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Data by VesselFinder</span>
            </div>
            <p class="text-[10px] text-neutral-400 leading-relaxed font-medium mb-4">
              Institutional-grade maritime surveillance terminal. Monitoring international waters via satellite transponder integration.
            </p>
            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
               <div class="space-y-1">
                  <p class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Coverage</p>
                  <p class="text-[10px] font-bold text-white uppercase">Worldwide</p>
               </div>
               <div class="space-y-1">
                  <p class="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Latency</p>
                  <p class="text-[10px] font-bold text-zen-green uppercase">&lt; 0.5ms</p>
               </div>
            </div>
         </div>
      </div>

      <!-- Tactical UI Elements (corners) -->
      <div class="absolute top-6 right-6 z-40 hidden lg:flex flex-col gap-4">
         <div class="p-3 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
            <div class="w-24 h-24 border border-white/5 rounded relative overflow-hidden bg-white/[0.02]">
               <div class="absolute top-1/2 left-0 w-full h-[1px] bg-white/10"></div>
               <div class="absolute top-0 left-1/2 h-full w-[1px] bg-white/10"></div>
               <div class="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-bloomberg-amber/20 rounded-full animate-pulse"></div>
               <div class="absolute bottom-2 right-2 flex flex-col items-end">
                  <span class="text-[6px] font-black text-neutral-600 uppercase">Sector</span>
                  <span class="text-[8px] font-mono text-bloomberg-amber">A-04</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.zen-glass {
  background: linear-gradient(135deg, rgba(17, 20, 29, 0.95) 0%, rgba(13, 16, 23, 0.95) 100%);
}
</style>
