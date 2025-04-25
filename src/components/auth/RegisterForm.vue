<script setup>
import { requiredValidator, emailValidator, passwordValidator, confirmedValidator } from '@/utils/validators';
import { ref } from 'vue'

const formDataDefault = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
}

const formData = ref({
  ...formDataDefault
})

const refVform = ref()
const onSubmit = () => {
  //alert(formData.value.email)
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
  <v-form @submit.prevent="onFormSubmit">
    <v-text-field v-model="formData.firstName" label="First Name" variant="outlined" :rules="[requiredValidator]"></v-text-field>
    <v-text-field v-model="formData.lastName" label="Last Name" variant="outlined" :rules="[requiredValidator]"></v-text-field>
    <v-text-field v-model="formData.email" prepend-inner-icon="mdi-email-outline" label="Email" variant="outlined" :rules="[requiredValidator, emailValidator]"></v-text-field>

    <v-text-field
        v-model="formData.password"
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        @click:append-inner="visible = !visible" label="Password"
        :rules="[requiredValidator, passwordValidator]">
      </v-text-field>

    <v-text-field
        v-model="formData.confirmPassword"
        :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible2 ? 'text' : 'password'"
        density="compact"
        prepend-inner-icon="mdi-lock-check"
        variant="outlined"
        @click:append-inner="visible2 = !visible2" label="Confirm Password"
        :rules="[requiredValidator, confirmedValidator(formData.confirmPassword, formData.password)]">
      </v-text-field>

    <v-btn class="mt-2" type="submit" block color="blue-grey-darken-3" prepend-icon="mdi-account-plus"
      >Register Now</v-btn
    >
  </v-form>
</template>
