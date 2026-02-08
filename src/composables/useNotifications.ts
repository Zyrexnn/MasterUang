import { useNotificationStore, type NotificationType } from '../stores/notificationStore'

export function useNotifications() {
    const store = useNotificationStore()

    const notify = (title: string, message: string, type: NotificationType = 'info', duration?: number) => {
        store.addNotification({ title, message, type, duration })
    }

    const success = (title: string, message: string, duration?: number) => {
        notify(title, message, 'success', duration)
    }

    const error = (title: string, message: string, duration?: number) => {
        notify(title, message, 'error', duration)
    }

    const warning = (title: string, message: string, duration?: number) => {
        notify(title, message, 'warning', duration)
    }

    const info = (title: string, message: string, duration?: number) => {
        notify(title, message, 'info', duration)
    }

    return {
        notify,
        success,
        error,
        warning,
        info
    }
}
