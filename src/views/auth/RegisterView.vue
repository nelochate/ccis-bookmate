<script setup>
import { ref } from 'vue'

const theme = ref('light')

function onClick() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <v-responsive class="border rounded">
    <v-app :theme="theme">
      <v-app-bar class="px-3" color="grey-darken-3">
        <v-spacer></v-spacer>

        <v-btn
          :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"

          slim
          @click="onClick"
        ></v-btn>
      </v-app-bar>

      <v-main>
        <v-container>
          <v-row>
            <v-col col="12" md="6" class="mx-auto">
              <v-card
                class="mx-auto"
                prepend-icon="mdi-account-plus"
                subtitle="Register to create an account"
                width="400"
                elevation="15"
              >
                <template v-slot:title>
                  <span class="font-weight-black">CCIS BookMate</span>
                </template>

                <v-card-text class="bg-surface-light pt-4">
                  <v-form fast-fail @submit.prevent>
                    <v-text-field label="First Name" variant="outlined"></v-text-field>
                    <v-text-field label="Last Name" variant="outlined"></v-text-field>
                    <v-text-field label="Email" variant="outlined"></v-text-field>
                    <v-text-field label="Password" type ="password" variant="outlined"></v-text-field>
                    <v-text-field label="Confirm Password" type ="password" variant="outlined"></v-text-field>

                    <v-btn class="mt-2" type="submit" block>Register Now</v-btn>
                  </v-form>
                  <v-divider class="my-4"></v-divider>
                  <h4 class="text-center">Already have an account?<RouterLink to ="/"> Login</RouterLink></h4>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>

      <v-footer border app color="grey-darken-3">Copyright &copy; 2025 BookMate</v-footer>
    </v-app>
  </v-responsive>
</template>