import { createRouter, createWebHistory } from 'vue-router'
import { useAuthUserStore } from '@/stores/authUser'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  // Use Pinia Store
  const authStore = useAuthUserStore()
  // Load if user is logged in
  const isLoggedIn = await authStore.isAuthenticated()

  // Redirect to appropriate page if accessing home route
  if (to.name === 'home') {
    return isLoggedIn ? { name: 'dashboard' } : { name: 'login' }
  }

  // If logged in, prevent access to login or register pages
  if (isLoggedIn && (to.name === 'login' || to.name === 'register')) {
    // redirect the user to the dashboard page
    return { name: 'dashboard' }
  }

  // If not logged in, prevent access to system pages
  if (!isLoggedIn && to.meta.requiresAuth) {
    // redirect the user to the login page
    return { name: 'login' }
  }
/*
  // Check if the user is logged in
  if (isLoggedIn) {
    //Retrieve user information
    const userMetadata = await getUserInformation()
    //Get user role
    const isAdmin = userMetadata.is_admin

    //Restrict access to admin pages
    if(!isAdmin && to.meta.requiresAdmin) {
      return { name: 'forbidden' }
    }
  }*/
 
})

export default router
