<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'verify', success: boolean): void
}>();

const isDragging = ref(false);
const startX = ref(0);
const currentX = ref(0);
const maxSlide = ref(0);
const sliderRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const isVerified = ref(false);
const showSuccessAlpha = ref(0);

const handleStart = (e: MouseEvent | TouchEvent) => {
  if (isVerified.value) return;
  isDragging.value = true;
  startX.value = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  if (containerRef.value && sliderRef.value) {
    maxSlide.value = containerRef.value.offsetWidth - sliderRef.value.offsetWidth - 8;
  }
};

const handleMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value || isVerified.value) return;
  const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
  let diff = x - startX.value;
  
  if (diff < 0) diff = 0;
  if (diff > maxSlide.value) diff = maxSlide.value;
  
  currentX.value = diff;
  
  // Check if reached the end
  if (diff >= maxSlide.value - 2) {
    handleEnd();
  }
};

const handleEnd = () => {
  if (!isDragging.value || isVerified.value) return;
  isDragging.value = false;
  
  if (currentX.value >= maxSlide.value - 5) {
    // SUCCESS
    currentX.value = maxSlide.value;
    isVerified.value = true;
    emit('verify', true);
    playSuccessAnimation();
  } else {
    // RESET
    currentX.value = 0;
  }
};

const playSuccessAnimation = () => {
    let alpha = 0;
    const interval = setInterval(() => {
        alpha += 0.1;
        showSuccessAlpha.value = alpha;
        if (alpha >= 1) clearInterval(interval);
    }, 30);
};

const reset = () => {
    isVerified.value = false;
    currentX.value = 0;
    showSuccessAlpha.value = 0;
};

defineExpose({ reset });

onMounted(() => {
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleEnd);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', handleEnd);
  window.removeEventListener('touchmove', handleMove);
  window.removeEventListener('touchend', handleEnd);
});

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2">
            <ShieldCheck class="w-3.5 h-3.5" :class="isVerified ? 'text-zen-green' : 'text-neutral-500'" />
            <span class="text-[10px] font-black uppercase tracking-[0.2em]" :class="isVerified ? 'text-white' : 'text-neutral-500'">
                Human Verification
            </span>
        </div>
        <span v-if="isVerified" class="text-[9px] font-bold text-zen-green uppercase tracking-widest animate-pulse">
            Verified
        </span>
    </div>

    <div 
      ref="containerRef"
      class="captcha-container relative h-14 bg-black/40 border border-white/5 rounded-2xl overflow-hidden group transition-all font-outfit"
      :class="{ 'border-zen-green/30 bg-zen-green/[0.02]': isVerified }"
    >
      <!-- Background Text -->
      <div 
        class="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        :style="{ opacity: 1 - (currentX / maxSlide) }"
      >
        <span class="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700 group-hover:text-neutral-500 transition-colors">
          Geser untuk Verifikasi
        </span>
      </div>

      <!-- Success Overlay -->
      <div 
        v-if="isVerified"
        class="absolute inset-0 bg-zen-green/10 flex items-center justify-center pointer-events-none z-10"
        :style="{ opacity: showSuccessAlpha }"
      >
         <div class="flex items-center gap-2">
             <CheckCircle2 class="w-4 h-4 text-zen-green" />
             <span class="text-[10px] font-black text-zen-green uppercase tracking-widest">Akses Valid</span>
         </div>
      </div>

      <!-- Slider Track (Progress) -->
      <div 
        class="absolute left-0 top-0 bottom-0 bg-bloomberg-amber/10 transition-[width] duration-0"
        :style="{ width: `${currentX + 28}px` }"
        v-if="!isVerified"
      ></div>

      <!-- Slider Handle -->
      <div 
        ref="sliderRef"
        @mousedown="handleStart"
        @touchstart="handleStart"
        class="absolute top-1 bottom-1 h-auto aspect-square bg-[#1A1F26] border border-white/10 rounded-xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-20 transition-all"
        :style="{ 
          left: `4px`, 
          transform: `translateX(${currentX}px)`,
          borderColor: isVerified ? 'rgba(16, 185, 129, 0.4)' : (isDragging ? 'rgba(251, 77, 2, 0.4)' : 'rgba(255,255,255,0.1)'),
          backgroundColor: isVerified ? '#10B981' : (isDragging ? '#FB4D02' : '#1A1F26')
        }"
      >
        <ArrowRight 
          class="w-5 h-5 transition-all" 
          :class="[
            isVerified ? 'text-white' : 'text-neutral-400',
            { 'rotate-180': isVerified }
          ]" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.captcha-container {
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.4);
}

.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}
</style>
