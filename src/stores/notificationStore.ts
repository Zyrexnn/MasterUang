import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
    id: string
    title: string
    message: string
    type: NotificationType
    duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])

    function addNotification(notif: Omit<Notification, 'id'>) {
        const id = Math.random().toString(36).substring(2, 9)
        const newNotif = { ...notif, id }
        notifications.value.push(newNotif)

        const duration = notif.duration || 5000
        if (duration !== -1) {
            setTimeout(() => {
                removeNotification(id)
            }, duration)
        }
    }

    function removeNotification(id: string) {
        notifications.value = notifications.value.filter((n) => n.id !== id)
    }

    return {
        notifications,
        addNotification,
        removeNotification,
    }
})
