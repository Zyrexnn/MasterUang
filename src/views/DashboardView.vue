<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  Plus,
  Download,
  Lock
} from 'lucide-vue-next'
import { type ApexOptions } from 'apexcharts'
import { useTransactionsStore } from '../stores/transactionsStore'
import { useAuthStore } from '../stores/authStore'
import { exportToCSV } from '../services/api'
import { useNotifications } from '../composables/useNotifications'

const authStore = useAuthStore()
const notifications = useNotifications()

const router = useRouter()
const transactionsStore = useTransactionsStore()

onMounted(() => {
  transactionsStore.fetchTransactions()
})

const stats = computed(() => [
  { 
    name: 'Total Balance', 
    value: `Rp ${transactionsStore.balance.toLocaleString('id-ID')}`, 
    change: transactionsStore.monthlyTrends.balance, 
    icon: Wallet, 
    color: 'text-bloomberg-amber' 
  },
  { 
    name: 'Monthly Income', 
    value: `Rp ${transactionsStore.income.toLocaleString('id-ID')}`, 
    change: transactionsStore.monthlyTrends.income, 
    icon: TrendingUp, 
    color: 'text-zen-green' 
  },
  { 
    name: 'Monthly Expenses', 
    value: `Rp ${transactionsStore.expenses.toLocaleString('id-ID')}`, 
    change: transactionsStore.monthlyTrends.expense, 
    icon: TrendingDown, 
    color: 'text-zen-red' 
  },
  { 
    name: 'Savings Rate', 
    value: `${transactionsStore.savingsRate.toFixed(1)}%`, 
    change: transactionsStore.monthlyTrends.savings, 
    icon: CreditCard, 
    color: 'text-zen-blue' 
  },
])

const recentTransactions = computed(() => {
  return transactionsStore.transactions.slice(0, 4).map(tx => ({
    id: tx.id,
    name: tx.name,
    category: tx.category,
    amount: tx.type === 'income' ? `+Rp ${tx.amount.toLocaleString('id-ID')}` : `-Rp ${tx.amount.toLocaleString('id-ID')}`,
    date: new Date(tx.date).toLocaleDateString('id-ID'),
    status: tx.status,
    type: tx.type
  }))
})

const chartOptions = computed<ApexOptions>(() => {
  const categories = transactionsStore.monthlyStats.map(s => s.label)
  
  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#B0B0B0',
      fontFamily: 'JetBrains Mono, monospace'
    },
    colors: ['#10B981', '#F43F5E'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    grid: {
      borderColor: '#2A2E37',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: categories.length > 0 ? categories : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}`
      }
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      style: { fontSize: '12px', fontFamily: 'JetBrains Mono' },
      y: {
        formatter: (val: number) => `Rp ${val.toLocaleString('id-ID')}`
      },
      marker: { show: true }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#B0B0B0' }
    }
  }
})

const chartSeries = computed(() => {
  if (transactionsStore.monthlyStats.length === 0) {
     return [
       { name: 'Pemasukan', data: [0] },
       { name: 'Pengeluaran', data: [0] }
     ]
  }
  return [
    {
      name: 'Pemasukan',
      data: transactionsStore.monthlyStats.map(s => s.income)
    },
    {
      name: 'Pengeluaran',
      data: transactionsStore.monthlyStats.map(s => s.expense)
    }
  ]
})

// CSV Export Function
const downloadCSV = () => {
  if (transactionsStore.transactions.length === 0) {
    notifications.info('Empty Dataset', 'Tidak ada transaksi untuk di-export. Tambahkan transaksi terlebih dahulu.')
    return
  }
  
  // Prepare data for CSV
  const csvData = transactionsStore.transactions.map(tx => ({
    ID: tx.id,
    Date: new Date(tx.date).toLocaleDateString('id-ID'),
    Name: tx.name,
    Category: tx.category,
    Type: tx.type,
    Amount: tx.amount,
    Status: tx.status,
    Created: new Date(tx.created_at || tx.date).toLocaleDateString('id-ID')
  }))
  
  const filename = `MasterUang_Transactions_${new Date().toISOString().split('T')[0]}.csv`
  exportToCSV(csvData, filename)
  notifications.success('Export Complete', 'File CSV berhasil diunduh.')
}

const goToTransactions = () => {
  router.push('/transactions')
}
</script>

<template>
  <div class="p-6 lg:p-10 space-y-12 pb-12">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
      <div class="space-y-1">
        <h2 class="text-3xl lg:text-4xl font-black font-outfit tracking-tighter uppercase text-white">
          Ringkasan Keuangan
        </h2>
        <div class="flex items-center gap-3">
           <div class="px-2 py-0.5 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded text-[9px] font-black text-bloomberg-amber uppercase tracking-widest">
              Live
           </div>
           <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Pantau aset dan pengeluaran Anda</p>
        </div>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <button 
          @click="authStore.isPremium ? downloadCSV() : router.push('/profile')"
          class="flex-1 md:flex-none py-3 px-6 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          :class="authStore.isPremium 
            ? 'bg-white/[0.03] border-white/10 text-white hover:bg-white/5 active:scale-95' 
            : 'bg-black/20 border-white/5 text-neutral-600 opacity-60'"
        >
          <component :is="authStore.isPremium ? Download : Lock" class="w-4 h-4" /> 
          Export Data
        </button>
        <button 
          @click="goToTransactions"
          class="flex-1 md:flex-none py-3 px-6 rounded-xl bg-bloomberg-amber text-black font-black text-xs uppercase tracking-[0.1em] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Plus class="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>
    </div>

    <!-- Stats Matrix -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      <div v-for="stat in stats" :key="stat.name" class="terminal-card p-6 lg:p-8 relative group overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-bl-full group-hover:bg-bloomberg-amber/[0.03] transition-colors"></div>
        <div class="flex justify-between items-start mb-6">
          <div class="p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-neutral-400 group-hover:text-bloomberg-amber group-hover:border-bloomberg-amber/20 transition-all">
            <component :is="stat.icon" class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-black font-mono px-2 py-1 rounded" :class="stat.change.startsWith('+') ? 'gain-bg' : 'loss-bg'">
            {{ stat.change }}
          </span>
        </div>
        <div>
          <p class="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-1.5">{{ stat.name === 'Total Balance' ? 'Total Saldo' : stat.name === 'Monthly Income' ? 'Pemasukan' : stat.name === 'Monthly Expenses' ? 'Pengeluaran' : 'Rasio Tabungan' }}</p>
          <h3 class="text-2xl lg:text-3xl font-black font-outfit text-white tracking-tighter tabular-nums truncate">
            {{ stat.value }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Performance & Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
      <!-- Chart Column -->
      <div class="lg:col-span-2 terminal-card p-8 lg:p-10">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
          <h3 class="font-outfit font-black text-lg tracking-tight flex items-center gap-4 text-white uppercase">
            <span class="w-1.5 h-6 bg-bloomberg-amber rounded-full block"></span>
            Intelligence Metrics
          </h3>
          <div class="flex bg-white/[0.03] p-1 border border-white/5 rounded-xl">
            <button class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-bloomberg-amber text-black shadow-lg">Month</button>
            <button class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-neutral-500 hover:text-white transition-all">Quarter</button>
            <button class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-neutral-500 hover:text-white transition-all">Annum</button>
          </div>
        </div>
        <div class="h-80 lg:h-[420px]">
          <apexchart 
            v-if="transactionsStore.monthlyStats.length > 0"
            :key="transactionsStore.monthlyStats.length"
            type="area" 
            height="100%" 
            :options="chartOptions" 
            :series="chartSeries" 
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-white/[0.01]">
             <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <TrendingUp class="w-8 h-8 text-neutral-800" />
             </div>
             <p class="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Analisis Arus Kas Belum Tersedia</p>
          </div>
        </div>
      </div>

      <!-- Feed Column -->
      <div class="terminal-card p-8 lg:p-10 flex flex-col bg-[#11141B]">
        <div class="flex items-center justify-between mb-10">
          <h3 class="font-outfit font-black text-lg tracking-tight flex items-center gap-4 text-white uppercase">
            <span class="w-1.5 h-6 bg-white opacity-20 rounded-full block"></span>
            Wire Log
          </h3>
          <button 
            @click="goToTransactions"
            class="text-[9px] font-black text-bloomberg-amber hover:underline uppercase tracking-[0.2em]"
          >
            Archive >
          </button>
        </div>
        
        <div class="space-y-8 flex-1 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
          <div v-if="recentTransactions.length === 0" class="text-center py-12">
            <p class="text-neutral-600 text-xs font-bold uppercase tracking-widest">No Signals Registered</p>
          </div>
          
          <div v-for="tx in recentTransactions" :key="tx.id" class="flex items-center justify-between group cursor-default">
            <div class="flex items-center space-x-5">
              <div class="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-white/10 transition-all">
                <ArrowUpRight v-if="tx.amount.startsWith('+')" class="w-5 h-5 text-zen-green" />
                <TrendingDown v-else class="w-5 h-5 text-zen-red" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black font-outfit text-white tracking-tight uppercase group-hover:text-bloomberg-amber transition-colors">{{ tx.name }}</p>
                <p class="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{{ tx.category }} • {{ tx.date }}</p>
              </div>
            </div>
            <div class="text-right ml-4">
              <p class="text-sm font-black font-mono tabular-nums tracking-tighter" :class="tx.amount.startsWith('+') ? 'text-zen-green' : 'text-neutral-100'">
                {{ tx.amount }}
              </p>
              <p class="text-[8px] font-black text-neutral-600 uppercase tracking-tighter mt-1">{{ tx.status }}</p>
            </div>
          </div>
        </div>

        <div class="mt-10 pt-8 border-t border-white/5">
          <div class="bg-bloomberg-amber/5 border border-bloomberg-amber/10 rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-12 h-12 bg-bloomberg-amber/10 blur-2xl rounded-full"></div>
            <p class="text-[10px] text-bloomberg-amber font-bold font-mono leading-relaxed uppercase italic">
              "Capital growth is optimized. High allocation in crypto assets is yielding 12.4% alpha."
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
