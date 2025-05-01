<script setup>
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'
import { ref } from 'vue'
import { supabase, formActionDefault } from '@/utils/supabase.js'
import AlertNotification from '@/components/common/AlertNotification.vue'
import { useRouter } from 'vue-router'



//Load pre-defined funstions
const router = useRouter()

//Load Variables
const formDataDefault = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const formData = ref({
  ...formDataDefault,
})

const formAction = ref({
  ...formActionDefault,
})

const refVform = ref()

//Register Functionality
const onSubmit = async () => {
  formAction.value = { ...formActionDefault }
  formAction.value.formProcess = true

  const { data, error } = await supabase.auth.signUp({
    email: formData.value.email,
    password: formData.value.password,
    options: {
      data: {
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        is_admin: false
      },
    },
  })

  if (error) {
    console.log(error)
    formAction.value.formErrorMessage = error.message
    formAction.value.formStatus = error.status
  } else if (data) {
    console.log(data)
    formAction.value.formSuccessMessage = 'Registration successful'
    router.replace('/dashboard')
  }
  //Reset Form
  refVform.value?.reset()
  //Turn off processing
  formAction.value.formProcess = false
}


const onFormSubmit = () => {
  refVform.value.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })

  
}

const passwordVisible = ref(false)
const passwordVisible2 = ref(false)
</script>

<template>
  <AlertNotification 
  :formSuccessMessage="formAction.formSuccessMessage" 
  :formErrorMessage="formAction.formErrorMessage">
</AlertNotification>

  <v-form ref="refVform" @submit.prevent="onFormSubmit">
    <v-row>
    <v-text-field
      class="pa-3"
      v-model="formData.firstName"
      label="First Name"
      variant="outlined"
      :rules="[requiredValidator]"
    ></v-text-field>
    <v-text-field
      class="pa-3"
      v-model="formData.lastName"
      label="Last Name"
      variant="outlined"
      :rules="[requiredValidator]"
    ></v-text-field>
  </v-row>

    <v-text-field
      v-model="formData.email"
      prepend-inner-icon="mdi-email-outline"
      label="Email"
      variant="outlined"
      :rules="[requiredValidator, emailValidator]"
    ></v-text-field>

    <v-text-field
      v-model="formData.password"
      :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
      :type="passwordVisible ? 'text' : 'password'"
      density="compact"
      prepend-inner-icon="mdi-lock-outline"
      variant="outlined"
      @click:append-inner="passwordVisible = !passwordVisible"
      label="Password"
      :rules="[requiredValidator, passwordValidator]"
    >
    </v-text-field>

    <v-text-field
      v-model="formData.confirmPassword"
      :append-inner-icon="passwordVisible2 ? 'mdi-eye-off' : 'mdi-eye'"
      :type="passwordVisible2 ? 'text' : 'password'"
      density="compact"
      prepend-inner-icon="mdi-lock-check"
      variant="outlined"
      @click:append-inner="passwordVisible2= !passwordVisible2"
      label="Confirm Password"
      :rules="[requiredValidator, confirmedValidator(formData.confirmPassword, formData.password)]"
    >
    </v-text-field>

    <v-btn
      class="mt-2"
      type="submit"
      block
      color="blue-grey-darken-3"
      prepend-icon="mdi-account-plus"
      :disabled="formAction.formProcess"
      :loading="formAction.formProcess"
      >Register Now
    </v-btn>
  </v-form>
</template>
