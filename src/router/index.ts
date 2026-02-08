import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import DashboardView from '../views/DashboardView.vue'
import CryptoView from '../views/CryptoView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/auth',
            name: 'auth',
            component: () => import('../views/AuthView.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true, requiresPremium: true }
        },
        {
            path: '/transactions',
            name: 'transactions',
            component: () => import('../views/TransactionsView.vue'),
            meta: { requiresAuth: true, requiresPremium: true }
        },
        {
            path: '/crypto',
            name: 'crypto',
            component: CryptoView,
            meta: { public: true }
        },
        {
            path: '/ai-advisor',
            name: 'ai-advisor',
            component: () => import('../views/AiAdvisorView.vue'),
            meta: { requiresAuth: true, requiresPremium: true }
        },
        {
            path: '/world-news',
            name: 'news',
            component: () => import('../views/NewsView.vue'),
            meta: { public: true }
        },
        {
            path: '/markets',
            name: 'markets',
            component: () => import('../views/MarketView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/ship-tracker',
            name: 'ship-tracker',
            component: () => import('../views/ShipTrackerView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/ProfileView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/admin',
            name: 'admin',
            component: () => import('../views/AdminView.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
    ],
})

// Navigation guard middleware
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = !!authStore.user
    const isPremium = authStore.isPremium
    const isAdmin = authStore.isAdmin

    const requiresAuth = to.meta.requiresAuth
    const requiresGuest = to.meta.requiresGuest
    const requiresPremium = to.meta.requiresPremium
    const requiresAdmin = to.meta.requiresAdmin
    const isPublic = to.meta.public

    if (requiresAuth && !isAuthenticated) {
        // Must login for these routes
        next({ name: 'auth' })
    } else if (requiresGuest && isAuthenticated) {
        // Already logged in, go to home or admin
        if (isAdmin) next({ name: 'admin' })
        else if (isPremium) next({ name: 'dashboard' })
        else next({ name: 'news' })
    } else if (requiresAdmin && !isAdmin) {
        // Not an admin
        console.warn('⛔ ACCESS DENIED: Administrator rights required')
        next({ name: 'news' })
    } else if (requiresPremium && !isPremium) {
        // Feature locked, redirect to profile to redeem
        console.warn('🔒 Protected Feature: Premium License Required')
        next({ name: 'profile' })
    } else {
        next()
    }
})

export default router
