<template>
  <v-form fast-fail @submit.prevent>
    <v-text-field label="First Name" variant="outlined"></v-text-field>
    <v-text-field label="Last Name" variant="outlined"></v-text-field>
    <v-text-field label="Email" variant="outlined"></v-text-field>
    <v-text-field label="Password" type="password" variant="outlined"></v-text-field>
    <v-text-field label="Confirm Password" type="password" variant="outlined"></v-text-field>

    <v-btn class="mt-2" type="submit" block color="blue-grey-darken-3" prepend-icon="mdi-account-plus"
      >Register Now</v-btn
    >
  </v-form>
</template>
