import { createRouter, createWebHistory } from 'vue-router'
import { useAuthUserStore } from '@/stores/authUser'
import { routes } from './routes'
import { supabase } from '@/utils/supabase'

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
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { name: 'login' }
      }

      // Fetch user profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      // Check if user has admin role
      if (profile?.role !== 'admin') {
        return { name: 'forbidden' }
      }
      
    } catch (error) {
      console.error('Admin check failed:', error)
      return { name: 'dashboard' }
    }
  }
})

export default router
