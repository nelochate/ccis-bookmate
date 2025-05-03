import { createRouter, createWebHistory } from 'vue-router'
import { useAuthUserStore } from '@/stores/authUser'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthUserStore()
  const isLoggedIn = await authStore.isAuthenticated()

  // Home page redirection
  if (to.name === 'home') {
    return isLoggedIn ? { name: 'dashboard' } : { name: 'login' }
  }

  // Prevent logged-in users from accessing auth pages
  if (isLoggedIn && (to.name === 'login' || to.name === 'register')) {
    return { name: 'dashboard' }
  }

  // Protect auth-required routes
  if (!isLoggedIn && to.meta.requiresAuth) {
    return { name: 'login' }
  }

  // Admin route protection
  if (isLoggedIn && to.meta.requiresAdmin) {
    try {
      // Get fresh user data including admin status
      const user = await authStore.getUserInformation()
      
      if (!user?.is_admin) {
        return { name: 'forbidden' }
      }
    } catch (error) {
      console.error('Admin check failed:', error)
      return { name: 'dashboard' }
    }
  }
})

export default router