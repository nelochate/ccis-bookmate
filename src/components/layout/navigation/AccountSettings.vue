<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import { useAuthUserStore } from '@/stores/authUser'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const authStore = useAuthUserStore()
const router = useRouter()
const formAction = ref({ loading: false, error: null })
const showDialog = ref(false)

const deleteAccount = async () => {
  formAction.value = { loading: true, error: null }
  
  try {
    // 1. Delete from user_roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', authStore.user.id)

    if (rolesError) throw new Error(`Roles deletion failed: ${rolesError.message}`)

    // 2. Delete from profiles (RLS policy: auth.uid() = user_id)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', authStore.user.id)

    if (profileError) throw new Error(`Profile deletion failed: ${profileError.message}`)

    // 3. Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(authStore.user.id)
    if (authError) throw new Error(`Auth user deletion failed: ${authError.message}`)

    // 4. Logout and redirect
    await authStore.logoutUser()
    await router.push('/')
    
  } catch (err) {
    formAction.value.error = err.message
    console.error('Deletion error:', err)
  } finally {
    formAction.value.loading = false
    showDialog.value = false
  }
}
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container class="max-w-xl py-8">
        <!-- Back Button -->
        <v-btn
          variant="text"
          @click="router.go(-1)"
          class="mb-6"
          prepend-icon="mdi-arrow-left"
        >
          Back
        </v-btn>

        <!-- Error Alert -->
        <AlertNotification 
          v-if="formAction.error"
          :message="formAction.error"
          type="error"
          class="mb-6"
        />

        <!-- Main Card -->
        <v-card class="pa-6 border" elevation="0">
          <div class="d-flex align-center mb-4">
            <v-icon color="error" size="32" class="mr-3">mdi-account-remove</v-icon>
            <v-card-title class="text-h5 px-0">Delete Your Account</v-card-title>
          </div>

          <v-divider class="my-4"></v-divider>

          <v-card-text>
            <div class="mb-6">
              <p class="text-body-1 mb-2">This action will permanently remove:</p>
              <ul class="text-body-2 pl-4">
                <li class="mb-2">
                  <v-icon small class="mr-2">mdi-account</v-icon>
                  Your profile information
                </li>
                <li class="mb-2">
                  <v-icon small class="mr-2">mdi-shield-account</v-icon>
                  All role assignments
                </li>
                <li>
                  <v-icon small class="mr-2">mdi-key</v-icon>
                  Login credentials
                </li>
              </ul>
            </div>

            <v-alert
              type="warning"
              variant="tonal"
              class="mb-6"
            >
              <template v-slot:prepend>
                <v-icon color="warning">mdi-alert-circle</v-icon>
              </template>
              This action cannot be undone. All data will be permanently erased.
            </v-alert>
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn
              color="error"
              variant="flat"
              @click="showDialog = true"
              :disabled="formAction.loading"
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
            <div class="d-flex align-center mb-4">
              <v-icon color="error" size="32" class="mr-3">mdi-alert-octagon</v-icon>
              <v-card-title class="text-h5 px-0">Final Confirmation</v-card-title>
            </div>

            <v-card-text>
              <p class="text-body-1 mb-4">
                You are about to permanently delete your account and all associated data.
              </p>
              <p class="text-body-2 text-medium-emphasis">
                User ID: <code>{{ authStore.user?.id }}</code>
              </p>
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn
                variant="text"
                @click="showDialog = false"
                :disabled="formAction.loading"
                class="mr-3"
              >
                Cancel
              </v-btn>
              <v-btn
                color="error"
                variant="flat"
                @click="deleteAccount"
                :loading="formAction.loading"
                prepend-icon="mdi-delete-forever"
              >
                Confirm Deletion
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
}

.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

code {
  background: rgba(var(--v-theme-error), 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  color: rgb(var(--v-theme-error));
}
</style>