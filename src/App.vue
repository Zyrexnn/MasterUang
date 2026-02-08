<script setup lang="ts">
import MainLayout from './layouts/MainLayout.vue'
import NotificationToast from './components/NotificationToast.vue'
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  authStore.checkAuth()
})

const isAuthPage = computed(() => route.path === '/auth')
</script>

<template>
  <NotificationToast />
  <template v-if="isAuthPage">
    <router-view />
  </template>
  <template v-else>
    <MainLayout />
  </template>
</template>

<style>
/* Global resets or additions */
</style>
