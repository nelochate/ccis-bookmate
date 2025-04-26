<script setup>
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators'
import { ref } from 'vue'
import { supabase, formActionDefault } from '@/utils/supabase.js'

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

const isSubmitting = ref(false);
    const lastSubmitTime = ref(0);
    const minTimeBetweenSubmits = 3000; // 3 seconds
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
  }

  formAction.value.formProcess = false

  const currentTime = Date.now();
        if (isSubmitting.value || currentTime - lastSubmitTime.value < minTimeBetweenSubmits) {
          // If the previous request is still in progress or if the interval is less than 3 seconds
          return; // Exit and prevent submitting
        }

        isSubmitting.value = true;
        lastSubmitTime.value = currentTime;

        try {
          // Your Supabase signup code here
          await yourSupabaseClient.auth.signUp({
             // Your credentials
          });
        } catch (error) {
          console.error('Error signing up:', error);
          // Handle errors
        } finally {
          isSubmitting.value = false;
        }
}


const onFormSubmit = () => {
  refVform.value.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })

  
}

const visible = ref(false)
const visible2 = ref(false)



</script>

<template>
  <v-alert
    v-if="formAction.formSuccessMessage"
    :text="formAction.formSuccessMessage"
    title="Success"
    type="success"
    variant="tonal"
    density="compact"
    border="start"
    closable
  ></v-alert>

  <v-alert
    v-if="formAction.formErrorMessage"
    :text="formAction.formErrorMessage"
    title="Ooops!"
    type="error"
    variant="tonal"
    density="compact"
    border="start"
    closable
  ></v-alert>

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
      :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
      :type="visible ? 'text' : 'password'"
      density="compact"
      prepend-inner-icon="mdi-lock-outline"
      variant="outlined"
      @click:append-inner="visible = !visible"
      label="Password"
      :rules="[requiredValidator, passwordValidator]"
    >
    </v-text-field>

    <v-text-field
      v-model="formData.confirmPassword"
      :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
      :type="visible2 ? 'text' : 'password'"
      density="compact"
      prepend-inner-icon="mdi-lock-check"
      variant="outlined"
      @click:append-inner="visible2 = !visible2"
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
