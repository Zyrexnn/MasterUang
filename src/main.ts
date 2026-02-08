import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/authStore'
import './style.css'
import App from './App.vue'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(VueApexCharts)
app.use(router)

async function initializeApp() {
    const authStore = useAuthStore()
    
    // Wait for the initial auth check to complete
    try {
        await authStore.checkAuth()
    } catch (err) {
        console.error('Auth initialization error:', err)
    }

    app.mount('#app')
}

initializeApp()
