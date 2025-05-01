// Auth
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

// Errors
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'

// Default
import DashboardView from '@/components/system/DashboardView.vue'

// Toggle for system deface mode
const isDefaced = false

// 👉 Routes
export const routes = isDefaced
  ? [
      {
        path: '/',
        name: 'home'
      },
      {
        path: '/login',
        name: 'home',
        component: ForbiddenView,
        meta: { requiresAuth: false }
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: ForbiddenView,
        meta: { requiresAuth: true, isDefault: true }
      },
      {
        path: '/forbidden',
        name: 'forbidden',
        component: ForbiddenView,
        meta: { isDefault: true }
      },
      {
        path: '/:catchAll(.*)',
        name: 'not-found',
        component: NotFoundView,
        meta: { isDefault: true }
      }
    ]
  : [
      // Auth Pages
      {
        path: '/',
        name: 'home'
      },
      {
        path: '/',
        name: 'login',
        component: LoginView,
        meta: { requiresAuth: false }
      },
      {
        path: '/register',
        name: 'register',
        component: RegisterView,
        meta: { requiresAuth: false }
      },

      // Default Pages
      {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { requiresAuth: true, isDefault: true }
      },

      // Errors Pages
      {
        path: '/forbidden',
        name: 'forbidden',
        component: ForbiddenView,
        meta: { isDefault: true }
      },
      {
        path: '/:catchAll(.*)',
        name: 'not-found',
        component: NotFoundView,
        meta: { isDefault: true }
      }

      // TODO: Add User Pages, Products, etc.
    ]
