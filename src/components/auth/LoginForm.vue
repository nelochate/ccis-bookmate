<script setup>
import { formActionDefault, supabase } from '@/utils/supabase'
import { requiredValidator, emailValidator } from '@/utils/validators';
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const passwordVisible = ref(false)
const refVform = ref()

// Utilize pre-defined vue functions
const router = useRouter()

// Load Variables
const formDataDefault = {
  email: '',
  password: ''
}

const formData = ref({
  ...formDataDefault
})

const formAction = ref({
    ...formActionDefault
  })

  const onSubmit = async () => {
    // Reset Form Action utils; Turn on processing at the same time
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password
    })

    if (error) {
      // Add Error Message and Status Code
      formAction.value.formErrorMessage = error.message
      formAction.value.formStatus = error.status
    } else if (data) {
      // Add Success Message
      formAction.value.formSuccessMessage = 'Successfully Logged Account.'
      // Redirect Acct to Dashboard
      router.replace('/dashboard')
    }

    // Reset Form
    refVForm.value?.reset()
    // Turn off processing+
    formAction.value.formProcess = false
  }

const onFormSubmit = () => {
  refVform.value.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
  return { formData, formAction, refVForm, onFormSubmit }
}
</script>

<template>
  <v-form ref="refVform" @submit.prevent="onFormSubmit">
    <v-text-field
        v-model="formData.email"
        density="compact"
        placeholder="Email address"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        :rules="[requiredValidator, emailValidator]">
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
        :rules="[requiredValidator]">
      </v-text-field>

    <v-btn class="mt-2" type="submit" block color="blue-grey-darken-3" prepend-icon="mdi-login">Login</v-btn>
  </v-form>
</template>
