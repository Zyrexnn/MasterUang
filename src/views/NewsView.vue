<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Globe, 
  Search, 
  Filter, 
  Clock, 
  ArrowUpRight, 
  ExternalLink,
  Newspaper,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'
import { getAggregatedNews, type NewsItem } from '../services/api'

const news = ref<NewsItem[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('ALL')

const categories = [
  { id: 'ALL', name: 'ALL STORIES' },
  { id: 'CRYPTOMAX', name: 'CRYPTOMAX' },
  { id: 'CRYPTO', name: 'BLOCKCHAIN' },
  { id: 'FINANCE', name: 'BUSINESS' },
  { id: 'GEOPOLITICS', name: 'GLOBAL AFFAIRS' }
]


const fetchNews = async () => {
  loading.value = true
  try {
    news.value = await getAggregatedNews()
  } catch (error) {
    console.error('Failed to fetch news:', error)
  } finally {
    loading.value = false
  }
}



 


onMounted(fetchNews)

const filteredNews = computed(() => {
  return news.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'ALL' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'CRYPTO': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    case 'CRYPTOMAX': return 'text-rose-400 bg-rose-400/10 border-rose-400/20'
    case 'FINANCE': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'GEOPOLITICS': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20'
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 space-y-10 lg:space-y-12 max-w-[1600px] mx-auto w-full pb-16">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
      <div class="space-y-2">
        <div class="flex items-center gap-4">
          <div class="p-2.5 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded-xl">
             <Newspaper class="w-6 h-6 text-bloomberg-amber" />
          </div>
          <h1 class="text-3xl lg:text-4xl font-black font-outfit tracking-tighter uppercase text-white">World Wire</h1>
        </div>
        <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em] ml-16">Real-time Spectral Intelligence • Global Node 07</p>
      </div>

      <div class="flex items-center gap-4 w-full md:w-auto">
        <div class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-full">
           <div class="w-1.5 h-1.5 rounded-full bg-zen-green animate-pulse"></div>
           <span class="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Feed Active</span>
        </div>
        <button 
          @click="fetchNews" 
          class="flex-1 md:flex-none py-3 px-6 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Sync Terminal
        </button>
      </div>
    </div>

    <!-- Interface Controller -->
    <div class="terminal-card bg-[#11141D] p-5 lg:p-6 flex flex-col lg:flex-row gap-6 lg:items-center">
      <div class="relative flex-1 group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-bloomberg-amber transition-colors" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="DECRYPT HEADLINES OR SOURCES..." 
          class="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:border-bloomberg-amber/50 outline-none transition-all placeholder:text-neutral-800"
        />
      </div>
      
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectedCategory = cat.id"
          class="flex-shrink-0 px-5 py-2.5 text-[10px] font-black border rounded-xl transition-all uppercase tracking-widest"
          :class="selectedCategory === cat.id 
            ? 'bg-bloomberg-amber text-black border-bloomberg-amber shadow-lg shadow-bloomberg-amber/20' 
            : 'bg-transparent border-white/5 text-neutral-500 hover:text-white hover:border-white/20'"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- Active Stream -->
    <div v-if="loading && filteredNews.length === 0" class="h-96 flex flex-col items-center justify-center gap-6">
      <div class="relative">
         <div class="w-20 h-20 border-2 border-white/5 rounded-full"></div>
         <RefreshCw class="w-8 h-8 animate-spin text-bloomberg-amber absolute inset-0 m-auto" />
      </div>
      <p class="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse text-neutral-600">Syncing Neural News Stream...</p>
    </div>

    <div v-else-if="!loading && filteredNews.length === 0" class="h-96 flex flex-col items-center justify-center terminal-card bg-transparent border-dashed">
      <AlertCircle class="w-12 h-12 text-neutral-800 mb-4" />
      <p class="text-xs font-black text-neutral-600 uppercase tracking-widest">No Intelligence signals detected</p>
    </div>

    <div v-else class="relative animate-zen">
      <!-- Floating Sync Indicator -->
      <transition name="zen">
        <div v-if="loading" class="fixed bottom-12 right-12 z-50 bg-[#11141D] border border-bloomberg-amber/30 p-5 rounded-2xl shadow-3xl flex items-center gap-4">
          <RefreshCw class="w-4 h-4 animate-spin text-bloomberg-amber" />
          <span class="text-[10px] font-black text-white uppercase tracking-widest">Background Sync Active</span>
        </div>
      </transition>
      
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      <a 
        v-for="(item, i) in filteredNews" 
        :key="i" 
        :href="item.url" 
        target="_blank"
        class="group flex flex-col terminal-card bg-[#11141D] overflow-hidden hover:border-bloomberg-amber/40 shadow-xl"
      >
        <!-- Vision Port -->
        <div v-if="item.image" class="h-52 overflow-hidden relative">
          <img :src="item.image" :alt="item.title" class="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
          <div class="absolute inset-0 bg-gradient-to-t from-[#11141D] via-transparent to-transparent"></div>
          <div class="absolute top-5 left-5">
            <span class="px-3 py-1.5 text-[9px] font-black rounded-lg shadow-2xl backdrop-blur-md uppercase tracking-widest border" :class="getCategoryColor(item.category)">
              {{ item.category }}
            </span>
          </div>
        </div>
        <div v-else class="h-3 bg-gradient-to-r from-bloomberg-amber to-transparent opacity-20"></div>

        <div class="p-8 pb-10 flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <span class="text-[10px] font-black text-bloomberg-amber uppercase tracking-widest">{{ item.source }}</span>
            <div class="flex items-center gap-2 text-neutral-600">
              <Clock class="w-3.5 h-3.5" />
              <span class="text-[10px] font-bold font-mono">{{ item.time }}</span>
            </div>
          </div>

          <h3 class="text-lg font-black font-outfit leading-tight text-white group-hover:text-bloomberg-amber transition-colors mb-5 tracking-tight">
            {{ item.title }}
          </h3>

          <p v-if="item.description" class="text-xs text-neutral-500 leading-relaxed font-medium line-clamp-3 mb-8">
            {{ item.description }}
          </p>

          <div class="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
            <div class="flex items-center gap-2">
               <div class="w-1.5 h-1.5 rounded-full bg-zen-green"></div>
               <span class="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Verified Dispatch</span>
            </div>
            <div class="flex items-center gap-2 text-neutral-600 group-hover:text-bloomberg-amber transition-colors">
               <span class="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">Open Wire</span>
               <ArrowUpRight class="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </div>
        </div>
      </a>
      </div>
    </div>

    <!-- Terminal Footer Info -->
    <div class="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-3">
           <div class="w-2 h-2 rounded-full bg-bloomberg-amber"></div>
           <span class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">MasterUang Wire Protocol</span>
        </div>
        <div class="hidden md:flex items-center gap-3 border-l border-white/5 pl-6">
           <TrendingUp class="w-4 h-4 text-neutral-700" />
           <span class="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Market Efficiency: 98.4%</span>
        </div>
      </div>
      <div class="text-[10px] font-bold text-neutral-700 uppercase tracking-[0.2em] bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
        Security Level: Alpha-07
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
