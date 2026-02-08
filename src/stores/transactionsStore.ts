import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../composables/useSupabase'
import { useAuthStore } from './authStore'

export interface Transaction {
    id?: string
    created_at?: string
    user_code?: string
    name: string
    category: string
    amount: number
    type: 'income' | 'expense'
    date: string
    status: string
}

// Disable DEMO MODE to use real Supabase DB
const DEMO_MODE = false

export const useTransactionsStore = defineStore('transactions', () => {
    const transactions = ref<Transaction[]>([])
    const loading = ref(false)
    const authStore = useAuthStore()

    const income = computed(() =>
        transactions.value
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)
    )

    const expenses = computed(() =>
        transactions.value
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    )

    const balance = computed(() => income.value - expenses.value)

    const savingsRate = computed(() => {
        if (income.value === 0) return 0
        return ((income.value - expenses.value) / income.value) * 100
    })

    // Computed data for Charts
    const categoryDistribution = computed(() => {
        const dist: Record<string, number> = {}
        transactions.value
            .filter(t => t.type === 'expense')
            .forEach(t => {
                dist[t.category] = (dist[t.category] || 0) + Math.abs(t.amount)
            })
        return dist
    })

    const monthlyStats = computed(() => {
        const stats: Record<string, { income: number, expense: number, label: string }> = {}

        // Sort transactions by date first to ensure stable order
        const sortedTransactions = [...transactions.value].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        sortedTransactions.forEach(t => {
            const date = new Date(t.date)
            if (isNaN(date.getTime())) return // Skip invalid dates

            // Use YYYY-MM as key for correct chronological sorting
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const label = date.toLocaleString('id-ID', { month: 'short', year: '2-digit' })

            if (!stats[key]) {
                stats[key] = { income: 0, expense: 0, label }
            }

            if (t.type === 'income') stats[key].income += t.amount
            else stats[key].expense += Math.abs(t.amount)
        })

        return Object.keys(stats).sort().map(key => ({
            key,
            label: stats[key].label,
            income: stats[key].income,
            expense: stats[key].expense
        }))
    })

    const monthlyTrends = computed(() => {
        const stats = monthlyStats.value
        if (stats.length === 0) return { income: '0%', expense: '0%', balance: '0%', savings: '0%' }

        const current = stats[stats.length - 1]
        const previous = stats.length > 1 ? stats[stats.length - 2] : null

        const calculateChange = (curr: number, prev: number | null) => {
            if (prev === null || prev === 0) return curr > 0 ? '+100%' : '0%'
            const diff = ((curr - prev) / Math.abs(prev)) * 100
            return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
        }

        const currentBalance = current.income - current.expense
        const previousBalance = previous ? (previous.income - previous.expense) : null

        const currentSavings = current.income > 0 ? ((current.income - current.expense) / current.income) * 100 : 0
        const previousSavings = previous && previous.income > 0 ? ((previous.income - previous.expense) / previous.income) * 100 : null

        return {
            income: calculateChange(current.income, previous ? previous.income : null),
            expense: calculateChange(current.expense, previous ? previous.expense : null),
            balance: calculateChange(currentBalance, previousBalance),
            savings: previousSavings !== null ? `${(currentSavings - previousSavings).toFixed(1)}%` : '0%'
        }
    })

    // Demo mode functions
    function loadDemoTransactions() {
        const saved = localStorage.getItem('demo_transactions')
        if (saved) {
            transactions.value = JSON.parse(saved)
        } else {
            transactions.value = [
                { id: '1', name: 'Salary', category: 'Income', amount: 12000000, type: 'income', date: '2026-02-01', status: 'Completed', created_at: new Date().toISOString() },
                { id: '2', name: 'Rent', category: 'Housing', amount: 3500000, type: 'expense', date: '2026-01-31', status: 'Completed', created_at: new Date().toISOString() },
                { id: '3', name: 'Groceries', category: 'Food', amount: 650000, type: 'expense', date: '2026-01-30', status: 'Completed', created_at: new Date().toISOString() },
            ]
            saveDemoTransactions()
        }
    }

    function saveDemoTransactions() {
        localStorage.setItem('demo_transactions', JSON.stringify(transactions.value))
    }

    async function fetchTransactions() {
        if (!authStore.user?.code) return

        loading.value = true
        try {
            if (DEMO_MODE) {
                loadDemoTransactions()
            } else {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_code', authStore.user.code) // STRICT FILTERING BY USER CODE
                    .order('date', { ascending: false })

                if (error) throw error
                transactions.value = (data as Transaction[]) || []
            }
        } catch (e) {
            console.error('Error fetching transactions:', e)
            loadDemoTransactions()
        } finally {
            loading.value = false
        }
    }

    async function addTransaction(transaction: Transaction) {
        if (!authStore.user?.code) throw new Error('Unauthorized Access')

        try {
            if (DEMO_MODE) {
                const newTransaction = {
                    ...transaction,
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    user_code: authStore.user.code
                }
                transactions.value.unshift(newTransaction)
                saveDemoTransactions()
                return newTransaction
            } else {
                const payload = {
                    ...transaction,
                    user_code: authStore.user.code // INJECT USER CODE
                }
                const { data, error } = await supabase
                    .from('transactions')
                    .insert([payload])
                    .select()

                if (error) throw error
                if (data) transactions.value.unshift(data[0] as Transaction)
                return data?.[0]
            }
        } catch (e) {
            console.error('Error adding transaction:', e)
            throw e
        }
    }

    async function updateTransaction(id: string, updates: Partial<Transaction>) {
        if (!authStore.user?.code) return

        try {
            if (DEMO_MODE) {
                const index = transactions.value.findIndex(t => t.id === id)
                if (index !== -1) {
                    transactions.value[index] = { ...transactions.value[index], ...updates }
                    saveDemoTransactions()
                }
            } else {
                const { data, error } = await supabase
                    .from('transactions')
                    .update(updates)
                    .eq('id', id)
                    .eq('user_code', authStore.user.code) // SAFETY CHECK
                    .select()

                if (error) throw error

                const index = transactions.value.findIndex(t => t.id === id)
                if (index !== -1 && data && data.length > 0) {
                    transactions.value[index] = data[0] as Transaction
                }
            }
        } catch (e) {
            console.error('Error updating transaction:', e)
            throw e
        }
    }

    async function deleteTransaction(id: string) {
        if (!authStore.user?.code) return

        try {
            if (DEMO_MODE) {
                transactions.value = transactions.value.filter(t => t.id !== id)
                saveDemoTransactions()
            } else {
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', id)
                    .eq('user_code', authStore.user.code) // SAFETY CHECK

                if (error) throw error
                transactions.value = transactions.value.filter(t => t.id !== id)
            }
        } catch (e) {
            console.error('Error deleting transaction:', e)
            throw e
        }
    }

    return {
        transactions,
        loading,
        income,
        expenses,
        balance,
        savingsRate,
        categoryDistribution,
        monthlyStats,
        monthlyTrends,
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction
    }
})
