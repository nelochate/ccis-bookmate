<script setup>
  import { ref } from 'vue'

  const visible = ref(false)
  const visible2 = ref(false)
</script>

<template>
  <v-form fast-fail @submit.prevent>
    <v-text-field label="First Name" variant="outlined"></v-text-field>
    <v-text-field label="Last Name" variant="outlined"></v-text-field>
    <v-text-field prepend-inner-icon="mdi-email-outline" label="Email" variant="outlined"></v-text-field>

    <v-text-field :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        @click:append-inner="visible = !visible" label="Password"></v-text-field>

    <v-text-field :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible2 ? 'text' : 'password'"
        density="compact"
        prepend-inner-icon="mdi-lock-check"
        variant="outlined"
        @click:append-inner="visible2 = !visible2" label="Confirm Password"></v-text-field>

    <v-btn class="mt-2" type="submit" block color="blue-grey-darken-3" prepend-icon="mdi-account-plus"
      >Register Now</v-btn
    >
  </v-form>
</template>
