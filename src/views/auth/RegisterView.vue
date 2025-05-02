<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import { useDisplay } from 'vuetify'


const { mobile } = useDisplay()
</script>

<template>
  <AppLayout>
    <template #content>
      <v-row class="d-flex justify-center">
        <v-col cols="12" md="6" class="d-flex justify-center">
          <v-card
            class="pa-3 text-center elevation-0 rounded-x0"
            max-width="600"
            color="transparent"
          >
            <v-img
              class="mb-6 rounded-lg"
              src="img/Hiraya.png"
              :width="mobile ? '100%' : '100%'"
              height="auto"
              style="box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)"
            ></v-img>
              <h2 class="font-weight-bold text-h5 mb-3">Welcome to CCIS BookMate</h2>
              <p class="text-body-1 text-medium-emphasis">
                Easily book and manage facilities within the CCIS building — your centralized
                platform for hassle-free scheduling and access.
              </p>
          </v-card>
        </v-col>

        <v-col col="12" md="6" class="d-flex justify-center">
          <v-card class="mx-auto" width="400" elevation="15">
            <v-card-title class="text-center">
              <v-img
                class="mx-auto"
                src="img/logo-nobg.png"
                :width="mobile ? '50%' : '25%'"
              ></v-img>
              <h3>CCIS BookMate</h3>
              <p style="font-size: 14px">Register to create an account</p>
            </v-card-title>

            <v-divider></v-divider>
            <v-card-text class="bg-surface-light pt-4">
              <RegisterForm></RegisterForm>
              <v-divider class="my-4"></v-divider>
              <h4 class="text-center">
                Already have an account?<RouterLink to="/" class="text-primary"> Login</RouterLink>
              </h4>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </AppLayout>
</template>
