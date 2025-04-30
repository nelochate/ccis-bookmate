<script setup>
import { isAuthenticated } from '@/utils/supabase'
import TopProfileNavigation from './navigation/TopProfileNavigation.vue'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { supabase } from '@/utils/supabase' // Make sure to import supabase

const theme = ref(localStorage.getItem('theme') ?? 'light')

// User state
const isLoggedIn = ref(false)
const user = ref(null)

// Get authentication status and user info
const getLoggedStatus = async () => {
  isLoggedIn.value = await isAuthenticated()
  if (isLoggedIn.value) {
    await fetchUser()
  }
}

// Fetch user data
async function fetchUser() {
  const {
    data: { user: userData },
  } = await supabase.auth.getUser()
  user.value = userData
}

// Handle logout
async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    isLoggedIn.value = false
    user.value = null
    // You might want to redirect to login page here
    // router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', error.message)
  }
}

function onClick() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

// Initialize on mount
onMounted(() => {
  getLoggedStatus()
})
</script>

<template>
  <v-responsive>
    <v-app :theme="theme">
      <v-app-bar
        class="px-3"
        :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'"
      >
        <v-spacer></v-spacer>

        <v-btn
          :icon="theme === 'light' ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
          variant="text"
          slim
          @click="onClick"
        ></v-btn>

        <!-- User menu (replaces TopProfileNavigation) -->
        <v-menu v-if="isLoggedIn && user">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon class="ml-2">
              <v-avatar size="36">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
            </v-btn>
          </template>

          <v-list>
            <v-list-item>
              <v-list-item-title>{{ user.email }}</v-list-item-title>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item @click="handleLogout">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-main>
        <v-container>
          <slot name="content"></slot>
        </v-container>
      </v-main>

      <v-footer
        border
        app
        :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'"
        class="d-flex justify-center"
        elevation="20"
      >
        Copyright &copy; 2025 CCIS BookMate
      </v-footer>
    </v-app>
  </v-responsive>
</template>
