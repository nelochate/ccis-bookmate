// Auth
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

// Errors
import ForbiddenView from '@/views/errors/ForbiddenView.vue'
import NotFoundView from '@/views/errors/NotFoundView.vue'

// System
import DashboardView from '@/views/system/DashboardView.vue'
import AdminView from '@/views/system/AdminView.vue'
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

      // System Pages/User Management Page
      {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { requiresAuth: true, isDefault: true }
      },
      {
        path: '/admin',
        name: 'admin',
        component: AdminView,
        meta: { requiresAuth: true, requiresAdmin: true }
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
