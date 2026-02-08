import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../composables/useSupabase'

export interface AppProfile {
    id: string
    code: string
    username: string
    role: 'user' | 'premium' | 'admin'
    expires_at: string | null
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<AppProfile | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    const isExpired = computed(() => {
        if (!user.value?.expires_at) return false
        return new Date(user.value.expires_at) < new Date()
    })

    const isAdmin = computed(() => {
        if (isExpired.value) return false
        return user.value?.role === 'admin'
    })

    const isPremium = computed(() => {
        if (isExpired.value) return false
        return user.value?.role === 'premium' || user.value?.role === 'admin'
    })

    // Persistent Session Logic
    async function checkAuth() {
        loading.value = true
        const savedCode = localStorage.getItem('masteruang_session_code')
        const isAdminSession = localStorage.getItem('masteruang_admin_session') === 'true'

        if (savedCode) {
            if (isAdminSession && savedCode === 'ADMIN-CONSOLE') {
                user.value = {
                    id: 'admin-restore',
                    code: 'ADMIN-CONSOLE',
                    username: 'SUPER-ADMIN',
                    role: 'admin',
                    expires_at: null
                }
            } else if (savedCode === 'GUEST-SESSION') {
                user.value = {
                    id: 'guest-user',
                    code: 'GUEST-SESSION',
                    username: 'GUEST-OPERATOR',
                    role: 'user',
                    expires_at: null
                }
            } else {
                try {
                    const { data, error: fetchError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('code', savedCode)
                        .single()

                    if (data && !fetchError) {
                        user.value = data
                        console.log('✅ Session Restored:', data.username)
                    } else {
                        localStorage.removeItem('masteruang_session_code')
                    }
                } catch (e) {
                    console.error('Session restoration failed')
                }
            }
        }
        loading.value = false
    }

    async function loginWithCode(inputCode: string) {
        loading.value = true
        error.value = null

        try {
            // 1. Validate the code in redeem_codes table
            const { data: codeData, error: codeError } = await supabase
                .from('redeem_codes')
                .select('*')
                .eq('code', inputCode.trim())
                .eq('is_active', true)
                .single()

            if (codeError || !codeData) {
                throw new Error('Kode akses tidak valid atau sudah kadaluarsa.')
            }

            // 2. Check if profile already exists for this code
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('code', inputCode.trim())
                .single()

            if (profileData) {
                // If profile already exists, check if it's expired
                const expiryDate = profileData.expires_at ? new Date(profileData.expires_at) : null
                if (expiryDate && expiryDate < new Date()) {
                    throw new Error('Kode ini sudah digunakan dan masa berlakunya telah habis. Silakan gunakan kode baru.')
                }

                // Return existing profile
                user.value = profileData
                await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('code', inputCode.trim())
            } else {
                // 3. Create new profile if first time
                const expiryDate = new Date()
                const value = codeData.duration_value || 0
                const unit = codeData.duration_unit || 'days'

                if (unit === 'minutes') {
                    expiryDate.setMinutes(expiryDate.getMinutes() + value)
                } else if (unit === 'hours') {
                    expiryDate.setHours(expiryDate.getHours() + value)
                } else {
                    expiryDate.setDate(expiryDate.getDate() + value)
                }

                const newProfile = {
                    code: inputCode.trim(),
                    username: `Operator-${inputCode.substring(0, 4)}`,
                    role: codeData.role,
                    expires_at: expiryDate.toISOString()
                }

                const { data: createdProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single()

                if (createError) throw createError
                user.value = createdProfile
            }

            localStorage.setItem('masteruang_session_code', inputCode.trim())
            return true
        } catch (err: any) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    async function loginAdmin(usernameInput: string, passwordInput: string) {
        loading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('admin_vault')
                .select('*')
                .eq('username', usernameInput)
                .eq('password', passwordInput)
                .single()

            if (fetchError || !data) {
                throw new Error('Username atau Password Admin salah.')
            }

            const adminProfile: AppProfile = {
                id: data.id,
                code: 'ADMIN-CONSOLE',
                username: 'SUPER-ADMIN',
                role: 'admin',
                expires_at: null
            }

            user.value = adminProfile
            localStorage.setItem('masteruang_session_code', 'ADMIN-CONSOLE')
            // Special flag to remember it's an admin session
            localStorage.setItem('masteruang_admin_session', 'true')

            return true
        } catch (err: any) {
            error.value = err.message
            return false
        } finally {
            loading.value = false
        }
    }

    async function setGuestSession() {
        user.value = {
            id: 'guest-user',
            code: 'GUEST-SESSION',
            username: 'GUEST-OPERATOR',
            role: 'user',
            expires_at: null
        }
        localStorage.setItem('masteruang_session_code', 'GUEST-SESSION')
        localStorage.removeItem('masteruang_admin_session')
        return true
    }

    async function signOut() {
        user.value = null
        localStorage.removeItem('masteruang_session_code')
        localStorage.removeItem('masteruang_admin_session')
    }

    return {
        user,
        loading,
        error,
        isAdmin,
        isPremium,
        isExpired,
        checkAuth,
        loginWithCode,
        loginAdmin,
        setGuestSession,
        signOut
    }
})
