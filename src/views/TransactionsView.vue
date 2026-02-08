<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Search, 
  Filter, 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Edit,
  Trash2,
  X,
  Lock
} from 'lucide-vue-next'
import { useTransactionsStore, type Transaction } from '../stores/transactionsStore'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'

const transactionsStore = useTransactionsStore()
const authStore = useAuthStore()
const router = useRouter()
const notifications = useNotifications()

const showModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const formData = ref({
  name: '',
  category: '',
  amount: 0,
  type: 'expense' as 'income' | 'expense',
  date: new Date().toISOString().split('T')[0],
  status: 'Completed'
})

const categories = ['Food', 'Housing', 'Transport', 'Entertainment', 'Income', 'Utilities', 'Healthcare', 'Investment', 'Other']

onMounted(() => {
  transactionsStore.fetchTransactions()
})

const openAddModal = () => {
  editingTransaction.value = null
  formData.value = {
    name: '',
    category: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    status: 'Completed'
  }
  showModal.value = true
}

const openEditModal = (transaction: Transaction) => {
  editingTransaction.value = transaction
  formData.value = {
    name: transaction.name,
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type,
    date: transaction.date,
    status: transaction.status
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingTransaction.value = null
}

const saveTransaction = async () => {
  try {
    if (editingTransaction.value) {
      await transactionsStore.updateTransaction(editingTransaction.value.id!, formData.value)
      notifications.success('Transaction Updated', 'Transaksi berhasil diperbarui.')
    } else {
      await transactionsStore.addTransaction(formData.value)
      notifications.success('Transaction Recorded', 'Transaksi baru berhasil ditambahkan.')
    }
    closeModal()
  } catch (error: any) {
    notifications.error('Operation Failed', 'Gagal menyimpan transaksi: ' + (error.message || 'Unknown error'))
    console.error(error)
  }
}

const deleteTransaction = async (id: string) => {
  if (confirm('Are you sure you want to delete this transaction?')) {
    try {
      await transactionsStore.deleteTransaction(id)
      notifications.success('Deleted', 'Transaksi berhasil dihapus dari sistem.')
    } catch (error: any) {
      notifications.error('Deletion Failed', 'Gagal menghapus transaksi: ' + (error.message || 'Unknown error'))
      console.error(error)
    }
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 space-y-10 pb-12">
    <!-- Header Area -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
      <div class="space-y-1">
        <h2 class="text-3xl lg:text-4xl font-black font-outfit tracking-tighter uppercase text-white">
          Daftar Transaksi
        </h2>
        <div class="flex items-center gap-3">
           <div class="px-2 py-0.5 bg-bloomberg-amber/10 border border-bloomberg-amber/20 rounded text-[9px] font-black text-bloomberg-amber uppercase tracking-widest">
              Data Aman
           </div>
           <p class="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <button 
          @click="authStore.isPremium ? null : router.push('/profile')"
          class="flex-1 md:flex-none py-3 px-6 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          :class="authStore.isPremium 
            ? 'bg-white/[0.03] border-white/10 text-white hover:bg-white/5 active:scale-95' 
            : 'bg-black/20 border-white/5 text-neutral-600 opacity-60 cursor-not-allowed'"
        >
          <component :is="authStore.isPremium ? Filter : Lock" class="w-4 h-4" /> Filter
        </button>
        <button 
          @click="authStore.isPremium ? openAddModal() : router.push('/profile')"
          class="flex-1 md:flex-none py-3 px-6 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2"
          :class="authStore.isPremium 
            ? 'bg-bloomberg-amber text-black hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] active:scale-95' 
            : 'bg-black/40 border border-white/5 text-neutral-700'"
        >
          <component :is="authStore.isPremium ? Plus : Lock" class="w-4 h-4" /> Tambah Baru
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="terminal-card bg-[#11141D] p-5 flex flex-col lg:flex-row gap-5 lg:items-center">
      <div class="relative flex-1 group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-bloomberg-amber transition-colors" />
        <input 
          type="text" 
          placeholder="CARI TRANSAKSI..." 
          class="w-full bg-white/[0.02] border border-white/5 rounded-lg pl-12 pr-4 py-3 text-sm font-mono focus:border-bloomberg-amber/50 outline-none transition-all placeholder:text-neutral-700"
        />
      </div>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="flex-1 lg:flex-none flex items-center space-x-3 bg-white/[0.03] px-4 py-3 rounded-lg border border-white/5 w-full sm:w-auto">
          <Calendar class="w-4 h-4 text-neutral-500" />
          <span class="text-[10px] font-black uppercase tracking-widest text-neutral-400">Semua Waktu</span>
        </div>
        <div class="flex-1 lg:flex-none flex items-center gap-3 w-full sm:w-auto">
          <span class="text-[10px] font-black text-neutral-600 uppercase tracking-widest whitespace-nowrap">Urutkan</span>
          <select class="flex-1 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-bold px-4 py-3 focus:border-bloomberg-amber/50 outline-none min-w-[160px] uppercase text-neutral-300">
            <option>Terbaru</option>
            <option>Nominal Terbesar</option>
            <option>Berdasarkan Kategori</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Registry Section -->
    <div class="terminal-card overflow-hidden bg-[#11141D]">
      <!-- Desktop Registry Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="zen-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Transaksi</th>
              <th>Kategori</th>
              <th>Status</th>
              <th class="text-right">Jumlah</th>
              <th class="w-20">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transactionsStore.transactions.length === 0">
              <td colspan="6" class="px-6 py-24 text-center">
                <div class="flex flex-col items-center gap-4">
                   <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Search class="w-8 h-8 text-neutral-700" />
                   </div>
                   <p class="text-neutral-500 text-xs font-black uppercase tracking-widest">Belum ada riwayat transaksi ditemukan</p>
                </div>
              </td>
            </tr>
            <tr v-for="tx in transactionsStore.transactions" :key="tx.id" class="group">
              <td class="font-mono text-neutral-500 text-[11px] tabular-nums whitespace-nowrap">{{ tx.date }}</td>
              <td>
                <div class="flex items-center space-x-4">
                  <div class="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-white/10 transition-all flex-shrink-0">
                    <ArrowUpRight v-if="tx.type === 'income'" class="w-4 h-4 text-zen-green" />
                    <ArrowDownLeft v-else class="w-4 h-4 text-zen-red" />
                  </div>
                  <span class="text-sm font-black font-outfit text-white uppercase tracking-tight group-hover:text-bloomberg-amber transition-colors">{{ tx.name }}</span>
                </div>
              </td>
              <td>
                <span class="text-[9px] font-black px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-neutral-500 uppercase tracking-widest">
                  {{ tx.category }}
                </span>
              </td>
              <td>
                <div class="flex items-center space-x-2">
                  <div :class="tx.status === 'Completed' ? 'bg-zen-green' : 'bg-bloomberg-amber'" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" :style="{ boxShadow: tx.status === 'Completed' ? '0 0 8px #0ECB81' : '0 0 8px #FFB74D' }"></div>
                  <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{{ tx.status === 'Completed' ? 'Selesai' : 'Pending' }}</span>
                </div>
              </td>
              <td class="text-sm font-black font-mono text-right tabular-nums whitespace-nowrap" :class="tx.type === 'income' ? 'text-zen-green' : 'text-neutral-100'">
                {{ tx.type === 'income' ? '+' : '-' }}Rp{{ tx.amount.toLocaleString('id-ID') }}
              </td>
              <td>
                <div class="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openEditModal(tx)"
                    class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:text-bloomberg-amber transition-colors"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteTransaction(tx.id!)"
                    class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-500 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List Registry -->
      <div class="md:hidden divide-y divide-white/5">
        <div v-for="tx in transactionsStore.transactions" :key="tx.id" class="p-6 space-y-5 bg-[#0D0F16]">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                <ArrowUpRight v-if="tx.type === 'income'" class="w-5 h-5 text-zen-green" />
                <ArrowDownLeft v-else class="w-5 h-5 text-zen-red" />
              </div>
              <div>
                <p class="text-sm font-black font-outfit text-white uppercase tracking-tight truncate max-w-[140px]">{{ tx.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                   <div :class="tx.status === 'Completed' ? 'bg-zen-green' : 'bg-bloomberg-amber'" class="w-1.5 h-1.5 rounded-full"></div>
                   <p class="text-[9px] text-neutral-600 font-black uppercase tracking-widest">{{ tx.date }}</p>
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-black font-mono tabular-nums leading-none mb-2" :class="tx.type === 'income' ? 'text-zen-green' : 'text-neutral-100'">
                {{ tx.type === 'income' ? '+' : '-' }}Rp{{ tx.amount.toLocaleString('id-ID') }}
              </p>
              <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5 text-neutral-600 uppercase tracking-[0.1em]">
                {{ tx.category }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-white/[0.03]">
             <span class="text-[9px] font-black text-neutral-700 uppercase tracking-[0.3em]">Terverifikasi</span>
             <div class="flex gap-4">
               <button @click="openEditModal(tx)" class="p-2 text-neutral-500 active:text-bloomberg-amber">
                 <Edit class="w-4 h-4" />
               </button>
               <button @click="deleteTransaction(tx.id!)" class="p-2 text-neutral-500 active:text-rose-500">
                 <Trash2 class="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
      </div>
      
      <!-- Registry Footer -->
      <div class="px-8 py-5 border-t border-white/5 bg-black/40 flex items-center justify-between">
        <p class="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] flex items-center gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-zen-green shadow-[0_0_8px_#10B981]"></span>
          Total: {{ transactionsStore.transactions.length }} Transaksi
        </p>
      </div>
    </div>

    <!-- Registry Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div @click="closeModal" class="absolute inset-0 bg-black/95 backdrop-blur-xl"></div>
      <div class="relative bg-[#11141D] border border-white/10 rounded-2xl shadow-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="flex items-center justify-between p-6 lg:p-10 border-b border-white/5">
          <div>
             <h3 class="text-2xl font-black font-outfit text-white uppercase tracking-tighter">
               {{ editingTransaction ? 'Ubah Transaksi' : 'Transaksi Baru' }}
             </h3>
             <p class="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Masukkan rincian transaksi Anda</p>
          </div>
          <button @click="closeModal" class="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-neutral-600 hover:text-white hover:bg-white/5 transition-all">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto no-scrollbar">
          <form @submit.prevent="saveTransaction" class="p-8 lg:p-14 space-y-10">
            <div class="space-y-8">
              <!-- Name & Category -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="md:col-span-2 space-y-3">
                  <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Nama Transaksi</label>
                  <input 
                    v-model="formData.name"
                    type="text" 
                    required
                    class="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm font-bold text-white focus:border-bloomberg-amber focus:bg-bloomberg-amber/5 outline-none transition-all placeholder:text-neutral-800"
                    placeholder="Contoh: Gaji Bulanan atau Belanja Sembako"
                  />
                </div>

                <div class="space-y-3">
                  <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Kategori</label>
                  <select 
                    v-model="formData.category"
                    required
                    class="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm font-bold text-white focus:border-bloomberg-amber outline-none appearance-none"
                  >
                    <option value="" class="bg-[#11141D]">Pilih Kategori...</option>
                    <option v-for="cat in categories" :key="cat" :value="cat" class="bg-[#11141D]">{{ cat.toUpperCase() }}</option>
                  </select>
                </div>

                <div class="space-y-3">
                  <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Status</label>
                  <select 
                    v-model="formData.status"
                    class="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm font-bold text-white focus:border-bloomberg-amber outline-none appearance-none"
                  >
                    <option value="Completed" class="bg-[#11141D]">Selesai</option>
                    <option value="Pending" class="bg-[#11141D]">Belum Lunas/Tunda</option>
                  </select>
                </div>
              </div>

              <!-- Classification Matrix -->
              <div class="space-y-4">
                <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Jenis Transaksi</label>
                <div class="flex gap-4 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    @click="formData.type = 'income'"
                    class="flex-1 py-4 px-4 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    :class="formData.type === 'income' ? 'bg-zen-green text-white shadow-lg' : 'text-neutral-600 hover:text-neutral-400'"
                  >
                    <ArrowUpRight class="w-4 h-4 transition-transform group-hover:scale-125" /> Pemasukan
                  </button>
                  <button 
                    type="button"
                    @click="formData.type = 'expense'"
                    class="flex-1 py-4 px-4 rounded-xl font-black text-[11px] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    :class="formData.type === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-neutral-600 hover:text-neutral-400'"
                  >
                    <ArrowDownLeft class="w-4 h-4" /> Pengeluaran
                  </button>
                </div>
              </div>

              <!-- Numerical Input -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                  <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Jumlah (Rp)</label>
                  <div class="relative group">
                    <input 
                      v-model.number="formData.amount"
                      type="number" 
                      required
                      min="0"
                      class="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-lg font-black text-white focus:border-bloomberg-amber outline-none transition-all tabular-nums"
                    />
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-neutral-700">IDR</span>
                  </div>
                </div>

                <div class="space-y-3">
                  <label class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block">Tanggal</label>
                  <input 
                    v-model="formData.date"
                    type="date" 
                    required
                    class="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm font-bold text-white focus:border-bloomberg-amber outline-none appearance-none"
                  />
                </div>
              </div>
            </div>

            <!-- Modal Protocol Actions -->
            <div class="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="button"
                @click="closeModal"
                class="flex-1 order-2 sm:order-1 py-5 px-8 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 transition-all outline-none"
              >
                Batalkan
              </button>
              <button 
                type="submit"
                class="flex-1 order-1 sm:order-2 py-5 px-8 bg-bloomberg-amber text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_10px_30px_rgba(251,191,36,0.25)] hover:scale-[1.02] transition-all outline-none"
              >
                {{ editingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-amber:focus {
  border-color: #FFB74D;
  box-shadow: 0 0 0 1px #FFB74D;
  outline: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
