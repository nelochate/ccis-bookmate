<script setup>
import { requiredValidator, emailValidator } from '@/utils/validators';
import { ref } from 'vue'

const visible = ref(false)

const refVform = ref()
const formDataDefault = {
  email: '',
  password: ''
}

const formData = ref({
  ...formDataDefault
})

const onSubmit = () => {
  //alert(formData.value.email)
}
const onFormSubmit = () => {
  refVform.value.validate().then(({ valid }) => {
    if (valid) onSubmit()
  })
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
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        @click:append-inner="visible = !visible"
        :rules="[requiredValidator]">
      </v-text-field>

    <v-btn class="mt-2" type="submit" block color="blue-grey-darken-3" prepend-icon="mdi-login">Login</v-btn>
  </v-form>
</template>
