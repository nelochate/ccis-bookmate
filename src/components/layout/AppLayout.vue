<script setup>
import TopProfileNavigation from './navigation/TopProfileNavigation.vue'
import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'


// Utilize pre-defined vue functions
const { xs, sm, mobile } = useDisplay()

// Use Pinia Store  
const authStore = useAuthUserStore()

// Load Variables
const isLoggedIn = ref(false)
const isMobileLogged = ref(false)
const isDesktop = ref(false)
const theme = ref(localStorage.getItem('theme') ?? 'light')

//  Toggle Theme
function onClick() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

// Load Functions during component rendering
onMounted(async () => {
  isLoggedIn.value = await authStore.isAuthenticated()
  isMobileLogged.value = mobile.value && isLoggedIn.value
  isDesktop.value = !mobile.value && (isLoggedIn.value || !isLoggedIn.value)
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
          :icon="theme === 'light' ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
          variant="text"
          slim
          @click="onClick"
        ></v-btn>

        <!-- User menu -->
        <TopProfileNavigation v-if="isLoggedIn"></TopProfileNavigation>
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
