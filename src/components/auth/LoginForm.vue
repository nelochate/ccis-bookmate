<script setup>
import { formActionDefault, supabase } from '@/utils/supabase'
import { requiredValidator, emailValidator } from '@/utils/validators'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const passwordVisible = ref(false)
const refVForm = ref()

// Utilize pre-defined Vue functions
const router = useRouter()

// Load Variables
const formDataDefault = {
  email: '',
  password: '',
}

const formData = ref({
  ...formDataDefault,
})

const formAction = ref({
  ...formActionDefault,
})

const onSubmit = async () => {
  // Reset Form Action utils; Turn on processing at the same time
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    })

    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message || 'Invalid email or password'
      formAction.value.formStatus = error.status || 400

      // Automatically clear the error message after 2 seconds
      setTimeout(() => {
        formAction.value.formErrorMessage = ''
      }, 2000)

      return
    }

    if (data?.user) {
      // Add Success Message
      formAction.value.formSuccessMessage = 'Successfully Logged In.'

      // Get complete user information including admin status
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      // Check admin status - either from user_metadata or your user_profiles view
      const isAdmin = user?.user_metadata?.is_admin || false

      // Redirect based on admin status
      if (isAdmin) {
        await router.replace('/admin')
      } else {
        await router.replace('/dashboard')
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    formAction.value.formErrorMessage = error.message || 'An error occurred during login'

    // Automatically clear the error message after 2 seconds
    setTimeout(() => {
      formAction.value.formErrorMessage = ''
    }, 2000)
  } finally {
    // Turn off processing
    formAction.value.formProcess = false
  }
}

const onFormSubmit = () => {
  refVForm.value.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
}
</script>

<template>
  <v-form ref="refVForm" @submit.prevent="onFormSubmit">
    <v-text-field
      v-model="formData.email"
      density="compact"
      placeholder="Email address"
      prepend-inner-icon="mdi-email-outline"
      variant="outlined"
      :rules="[requiredValidator, emailValidator]"
    >
    </v-text-field>

    <v-text-field
      v-model="formData.password"
      :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
      :type="passwordVisible ? 'text' : 'password'"
      density="compact"
      placeholder="Enter your password"
      prepend-inner-icon="mdi-lock-outline"
      variant="outlined"
      @click:append-inner="passwordVisible = !passwordVisible"
      :rules="[requiredValidator]"
    >
    </v-text-field>

    <v-alert v-if="formAction.formErrorMessage" type="error" class="mt-2">
      {{ formAction.formErrorMessage }}
    </v-alert>

    <v-btn
      class="mt-2"
      type="submit"
      block
      color="blue-grey-darken-3"
      prepend-icon="mdi-login"
      :loading="formAction.formProcess" 
      :disabled="formAction.formProcess" 
    >
      <template v-slot:loader>
        <v-progress-circular
          indeterminate
          color="white"
          size="20"
        ></v-progress-circular>
      </template>
      Login
    </v-btn>
  </v-form>
</template>
