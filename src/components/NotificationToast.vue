<script setup lang="ts">
import { useNotificationStore } from '../stores/notificationStore'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  ShieldCheck,
  Zap,
  Bell
} from 'lucide-vue-next'

const notificationStore = useNotificationStore()

const getIcon = (type: string) => {
  switch (type) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'warning': return AlertCircle
    case 'info': return Info
    default: return Bell
  }
}

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'success': return 'border-zen-green/20 bg-zen-green/10 text-zen-green shadow-zen-green/10'
    case 'error': return 'border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-rose-500/10'
    case 'warning': return 'border-bloomberg-amber/20 bg-bloomberg-amber/10 text-bloomberg-amber shadow-bloomberg-amber/10'
    case 'info': return 'border-blue-500/20 bg-blue-500/10 text-blue-500 shadow-blue-500/10'
    default: return 'border-white/10 bg-white/5 text-white'
  }
}

const getIconStyles = (type: string) => {
  switch (type) {
    case 'success': return 'text-zen-green'
    case 'error': return 'text-rose-500'
    case 'warning': return 'text-bloomberg-amber'
    case 'info': return 'text-blue-500'
    default: return 'text-white'
  }
}
</script>

<template>
  <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-[400px] pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="notif in notificationStore.notifications" 
        :key="notif.id"
        class="pointer-events-auto relative group"
      >
        <div 
          class="flex items-start gap-4 p-5 rounded-3xl border backdrop-blur-2xl transition-all duration-500"
          :class="getTypeStyles(notif.type)"
        >
          <div class="shrink-0 mt-1">
            <component :is="getIcon(notif.type)" class="w-6 h-6" :class="getIconStyles(notif.type)" />
          </div>
          
          <div class="flex-1 space-y-1">
            <h4 class="text-sm font-black uppercase tracking-tight font-outfit">{{ notif.title }}</h4>
            <p class="text-[11px] font-bold opacity-80 leading-relaxed uppercase tracking-wider">{{ notif.message }}</p>
          </div>

          <button 
            @click="notificationStore.removeNotification(notif.id)"
            class="p-1 hover:bg-white/5 rounded-full transition-colors opacity-40 group-hover:opacity-100"
          >
            <X class="w-4 h-4" />
          </button>

          <!-- Progress Bar -->
          <div 
            v-if="notif.duration !== -1"
            class="absolute bottom-0 left-4 right-4 h-[2px] bg-white/5 overflow-hidden rounded-full"
          >
            <div 
              class="h-full bg-current transition-all linear"
              :style="{ 
                animation: `progress ${notif.duration || 5000}ms linear forwards`,
                backgroundColor: 'currentColor'
              }"
            ></div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(50%) scale(0.9);
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>
