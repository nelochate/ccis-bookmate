<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import { useAuthUserStore } from '@/stores/authUser'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthUserStore()
const router = useRouter()
const showDialog = ref(false)
const deletionState = ref({
  loading: false,
  error: null,
  step: null
})

const deleteAccount = async () => {
  deletionState.value = { 
    loading: true, 
    error: null,
    step: 'Starting account deletion...'
  }
  
  try {
    deletionState.value.step = 'Removing user data...'
    await authStore.deleteUserAccount()
    
    deletionState.value.step = 'Finalizing...'
    await router.push('/')
  } catch (err) {
    deletionState.value.error = err.message || 'Account deletion failed'
    console.error('Deletion error:', err)
  } finally {
    deletionState.value.loading = false
    showDialog.value = false
  }
}
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container class="max-w-xl py-8">
        <!-- Header with Back Button -->
        <div class="d-flex align-center mb-6">
          <v-btn
            variant="text"
            @click="router.go(-1)"
            prepend-icon="mdi-arrow-left"
            class="mr-4"
          >
            Back
          </v-btn>
          <h1 class="text-h4 font-weight-bold">Account Settings</h1>
        </div>

        <!-- Error Alert -->
        <AlertNotification 
          v-if="deletionState.error"
          :message="deletionState.error"
          type="error"
          class="mb-6"
        />

        <!-- Deletion Card -->
        <v-card class="pa-6 border" elevation="0">
          <v-card-title class="d-flex align-center text-h5 px-0 mb-4">
            <v-icon color="error" size="32" class="mr-3">mdi-account-remove</v-icon>
            Delete Account
          </v-card-title>

          <v-divider class="my-4"></v-divider>

          <v-card-text>
            <v-list lines="two" class="mb-6">
              <v-list-item
                v-for="item in [
                  { icon: 'mdi-account', text: 'Your profile information' },
                  { icon: 'mdi-shield-account', text: 'All role assignments' },
                  { icon: 'mdi-key', text: 'Login access' }
                ]"
                :key="item.icon"
                class="pl-0"
              >
                <template v-slot:prepend>
                  <v-icon :icon="item.icon" class="mr-3"></v-icon>
                </template>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <v-alert
              type="warning"
              variant="tonal"
              border="start"
              class="mb-6"
            >
              <template v-slot:prepend>
                <v-icon color="warning">mdi-alert</v-icon>
              </template>
              <strong>Important:</strong> This will permanently remove your account data but may not immediately delete your authentication record.
            </v-alert>

            <div v-if="deletionState.step" class="text-caption text-medium-emphasis">
              Status: {{ deletionState.step }}
            </div>
          </v-card-text>

          <v-card-actions class="justify-end px-0">
            <v-btn
              color="error"
              variant="flat"
              @click="showDialog = true"
              :disabled="deletionState.loading"
              prepend-icon="mdi-delete"
              class="px-6"
            >
              Delete Account
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Confirmation Dialog -->
        <v-dialog v-model="showDialog" max-width="450">
          <v-card class="pa-6">
            <v-card-title class="d-flex align-center text-h5 px-0 mb-4">
              <v-icon color="error" size="32" class="mr-3">mdi-alert-octagon</v-icon>
              Confirm Deletion
            </v-card-title>

            <v-card-text>
              <p class="text-body-1 mb-2">
                You are about to:
              </p>
              <v-chip
                color="red-darken-4"
                variant="outlined"
                class="mb-4"
                label
              >
                <v-icon start>mdi-identifier</v-icon>
                {{ authStore.userId }}
              </v-chip>
              
              <v-alert
                type="error"
                variant="tonal"
                border="start"
                class="mb-4"
              >
                This will permanently remove your account data from our systems.
              </v-alert>
              
              <p class="text-body-2 text-medium-emphasis">
                Your authentication record may remain in the system until cleaned by administrators.
              </p>
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn
                variant="text"
                @click="showDialog = false"
                :disabled="deletionState.loading"
                class="mr-3"
              >
                Cancel
              </v-btn>
              <v-btn
                color="error"
                variant="flat"
                @click="deleteAccount"
                :loading="deletionState.loading"
                prepend-icon="mdi-delete-forever"
              >
                Confirm Permanent Removal
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </template>
  </AppLayout>
</template>

<style scoped>
.max-w-xl {
  max-width: 36rem;
  margin: 0 auto;
}

.border {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}
</style>