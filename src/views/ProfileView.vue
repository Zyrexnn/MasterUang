<script setup lang="ts">
import { useAuthStore } from '../stores/authStore'
import RedeemCodeForm from '../components/RedeemCodeForm.vue'
import { User as UserIcon, Mail, ShieldCheck, BadgeCheck, Zap, ArrowRight } from 'lucide-vue-next'

const authStore = useAuthStore()
</script>

<template>
  <div class="p-6 lg:p-12 max-w-6xl mx-auto w-full space-y-12 pb-24">
    <!-- Profile Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-white/5">
      <div class="flex items-center gap-6">
        <div class="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden group">
          <div class="absolute inset-0 bg-bloomberg-amber/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <UserIcon class="w-10 h-10 text-neutral-500 group-hover:text-bloomberg-amber transition-colors relative z-10" />
        </div>
        <div>
          <h2 class="text-3xl lg:text-4xl font-black font-outfit text-white uppercase tracking-tighter">
            {{ authStore.user?.username || 'Operator' }}
          </h2>
          <div class="flex items-center gap-3 mt-1">
            <ShieldCheck class="w-3 h-3 text-neutral-600" />
            <span class="text-[10px] lg:text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Kode Saya: {{ authStore.user?.code }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div 
          class="px-5 py-2.5 rounded-full flex items-center gap-3 border transition-all"
          :class="authStore.isPremium 
            ? 'bg-bloomberg-amber/10 border-bloomberg-amber/20 text-bloomberg-amber' 
            : 'bg-white/[0.03] border-white/10 text-neutral-600'"
        >
          <BadgeCheck v-if="authStore.isPremium" class="w-4 h-4" />
          <Zap v-else class="w-4 h-4 opacity-30" />
          <span class="text-[10px] font-black uppercase tracking-[0.2em]">
            {{ authStore.isPremium ? 'Akun Premium' : 'Akses Tamu' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <!-- Account Info Section -->
      <div class="space-y-10">
        <div class="space-y-4">
          <h3 class="text-sm font-black text-neutral-600 uppercase tracking-[0.3em] flex items-center gap-3">
            <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber"></div>
            Informasi Keamanan Akun
          </h3>
          <div class="terminal-card p-8 lg:p-10 space-y-6">
            <div class="flex items-center justify-between py-4 border-b border-white/5">
              <span class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Status Koneksi</span>
              <span class="text-[11px] font-black font-mono text-white">TERHUBUNG & AMAN</span>
            </div>
            <div class="flex items-center justify-between py-4 border-b border-white/5">
              <span class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Tipe Sistem</span>
              <span class="text-[11px] font-black text-bloomberg-amber uppercase tracking-widest">MasterUang Nexus</span>
            </div>
            <div class="flex items-center justify-between py-4 border-b border-white/5">
              <span class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Session ID</span>
              <span class="text-[11px] font-black font-mono text-neutral-700 truncate max-w-[150px]">{{ authStore.user?.id }}</span>
            </div>
            <div v-if="authStore.user?.expires_at" class="flex items-center justify-between py-4">
              <span class="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Masa Berlaku</span>
              <span class="text-[11px] font-black font-mono" :class="authStore.isExpired ? 'text-rose-500' : 'text-zen-green'">
                {{ authStore.isExpired ? 'HABIS' : new Date(authStore.user.expires_at).toLocaleDateString('id-ID') }}
              </span>
            </div>
            <div class="pt-6 border-t border-white/5 space-y-4">
              <p class="text-[9px] font-black text-neutral-700 uppercase tracking-widest text-center italic">Butuh bantuan teknis atau perpanjangan lisensi?</p>
              <a 
                href="https://wa.me/6289673344599" 
                target="_blank"
                class="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/5 rounded-xl text-bloomberg-amber text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all font-outfit"
              >
                <span>Hubungi Dukungan Admin</span>
                <ArrowRight class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div v-if="authStore.isPremium" class="bg-zen-green/5 border border-zen-green/20 rounded-2xl p-8 relative overflow-hidden group transition-all hover:bg-zen-green/10">
           <div class="absolute top-0 right-0 w-32 h-32 bg-zen-green/10 blur-[60px] rounded-full"></div>
           <div class="flex items-center gap-6 relative z-10">
              <div class="p-4 bg-zen-green/10 rounded-2xl">
                 <ShieldCheck class="w-8 h-8 text-zen-green" />
              </div>
              <div class="space-y-1">
                 <h4 class="text-white font-black uppercase tracking-tighter">Status: Akun Premium Aktif</h4>
                 <p class="text-[10px] text-zen-green/60 font-bold uppercase tracking-widest">Semua fitur MasterUang telah terbuka.</p>
              </div>
           </div>
        </div>
      </div>

      <!-- Redemption Section -->
      <div v-if="!authStore.isPremium" class="space-y-4">
        <h3 class="text-sm font-black text-neutral-600 uppercase tracking-[0.3em] flex items-center gap-3">
          <div class="w-1.5 h-1.5 rounded-full bg-bloomberg-amber"></div>
          Verification Protocol
        </h3>
        <RedeemCodeForm />
      </div>

      <!-- Features Summary if Premium -->
      <div v-else class="space-y-4">
        <h3 class="text-sm font-black text-neutral-600 uppercase tracking-[0.3em] flex items-center gap-3">
          <div class="w-1.5 h-1.5 rounded-full bg-zen-green"></div>
          Module Synchronization
        </h3>
        <div class="grid grid-cols-2 gap-4">
           <div v-for="mod in ['Wealth Console', 'Transaction Log', 'Portfolio Matrix', 'Risk Engine']" :key="mod" class="terminal-card border-zen-green/10 p-5 flex items-center gap-3 group hover:border-zen-green/30 transition-all">
              <div class="w-1.5 h-1.5 rounded-full bg-zen-green scale-75 group-hover:scale-110 transition-transform"></div>
              <span class="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{{ mod }}</span>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
