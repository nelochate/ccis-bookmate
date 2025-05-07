<script setup>
import { formActionDefault, supabase } from '@/utils/supabase' // Import default form action state and Supabase instance
import { requiredValidator, emailValidator } from '@/utils/validators' // Import validation rules for form fields
import { useRouter } from 'vue-router' // Import Vue Router for navigation
import { ref } from 'vue' // Import Vue's reactive reference

// Reactive variable to toggle password visibility
const passwordVisible = ref(false)

// Reference to the form for validation
const refVForm = ref()

// Initialize Vue Router for navigation
const router = useRouter()

// Default structure for form data
const formDataDefault = {
  email: '',
  password: '',
}

// Reactive variable to hold form data
const formData = ref({
  ...formDataDefault,
})

// Reactive variable to manage form action states (e.g., loading, error messages)
const formAction = ref({
  ...formActionDefault,
})

// Function to handle form submission
const onSubmit = async () => {
  // Reset form action state and enable loading indicator
  formAction.value = { ...formActionDefault, formProcess: true }

  try {
    // Attempt to sign in using Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    })

    if (error) {
      // Display error message and status code if login fails
      formAction.value.formErrorMessage = error.message || 'Invalid email or password'
      formAction.value.formStatus = error.status || 400

      // Clear the error message after 2 seconds
      setTimeout(() => {
        formAction.value.formErrorMessage = ''
      }, 2000)

      return
    }

    if (data?.user) {
      // Display success message upon successful login
      formAction.value.formSuccessMessage = 'Successfully Logged In.'

      // Fetch complete user information, including admin status
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      // Determine if the user is an admin
      const isAdmin = user?.user_metadata?.is_admin || false

      // Redirect user based on admin status
      if (isAdmin) {
        await router.push('/admin') // Redirect to admin dashboard
      } else {
        await router.push('/dashboard') // Redirect to user dashboard
      }
    }
  } catch (error) {
    // Log and display any unexpected errors during login
    console.error('Login error:', error)
    formAction.value.formErrorMessage = error.message || 'An error occurred during login'

    // Clear the error message after 2 seconds
    setTimeout(() => {
      formAction.value.formErrorMessage = ''
    }, 2000)
  } finally {
    // Disable loading indicator
    formAction.value.formProcess = false
  }
}

// Function to validate the form and trigger submission
const onFormSubmit = () => {
  refVForm.value.validate().then(({ valid }) => {
    if (valid) onSubmit() // Submit the form if validation passes
  })
}
</script>

<template>
  <!-- Form container -->
  <v-form ref="refVForm" @submit.prevent="onFormSubmit">
    <!-- Email input field -->
    <v-text-field
      v-model="formData.email"
      density="compact"
      placeholder="Email address"
      prepend-inner-icon="mdi-email-outline"
      variant="outlined"
      :rules="[requiredValidator, emailValidator]" 
    >
    </v-text-field>

    <!-- Password input field with toggle visibility -->
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

    <!-- Error alert for displaying form errors -->
    <v-alert v-if="formAction.formErrorMessage" type="error" class="mt-2">
      {{ formAction.formErrorMessage }}
    </v-alert>

    <!-- Submit button with loading indicator -->
    <v-btn
      class="mt-2"
      type="submit"
      block
      color="blue-grey-darken-3"
      prepend-icon="mdi-login"
      :loading="formAction.formProcess" 
      :disabled="formAction.formProcess"
    >
      <!-- Loader template for the button -->
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
