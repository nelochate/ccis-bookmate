<script setup>
import { supabase, formActionDefault } from '@/utils/supabase'
import { useAuthUserStore } from '@/stores/authUser'
import { getAvatarText } from '@/utils/helpers'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

// Utilize pre-defined vue functions
const router = useRouter()

// Use Pinia Store
const authStore = useAuthUserStore()

// Load Variables
const formAction = ref({
  ...formActionDefault,
})

const notificationMessage = ref(null) // Notification message ref

// Logout Functionality
const onLogout = async () => {
  try {
    formAction.value = { ...formActionDefault, formProcess: true }
    
    await supabase.auth.signOut()
    authStore.$reset()
    formAction.value.formProcess = false

    // Show notification
    notificationMessage.value = 'You have successfully logged out.'
    setTimeout(() => {
      notificationMessage.value = null
    }, 2000) // Clear message after 2 seconds

    // Redirect to home page
    router.push('/')
    window.location.reload()
  } catch (err) {
    formAction.value.formProcess = false
    console.error('Logout error:', err)
  }
}
</script>

<template>
  <v-menu min-width="200px" rounded>
    <template #activator="{ props }">
      <v-btn icon v-bind="props">
        <v-avatar color="blue-darken-3" size="large">
          <span class="text-h6">
            {{ getAvatarText(authStore.userData.firstName + ' ' + authStore.userData.lastName) }}
          </span>
        </v-avatar>
      </v-btn>
    </template>

    <v-card class="mt-1">
      <v-card-text>
        <!-- Notification -->
        <v-alert
          v-if="notificationMessage"
          type="success"
          class="mb-4"
          transition="scale-transition"
        >
          {{ notificationMessage }}
        </v-alert>

        <v-list>
          <v-list-item
            :subtitle="authStore.userData.email"
            :title="authStore.userData.firstName + ' ' + authStore.userData.lastName"
          >
            <template #prepend>
              <v-avatar color="blue-darken-3" size="large">
                <span class="text-h6">
                  {{
                    getAvatarText(authStore.userData.firstName + ' ' + authStore.userData.lastName)
                  }}
                </span>
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>

        <v-divider class="my-3"></v-divider>

        <v-btn prepend-icon="mdi-wrench" variant="plain" to="/account-settings">
          Account Settings
        </v-btn>

        <v-divider class="my-3"></v-divider>

        <v-btn
          prepend-icon="mdi-logout"
          variant="plain"
          @click="onLogout"
          :loading="formAction.formProcess"
          :disabled="formAction.formProcess"
        >
          Logout
        </v-btn>
      </v-card-text>
    </v-card>
  </v-menu>
</template>
