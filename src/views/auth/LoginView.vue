<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
</script>

<template>
<AppLayout>
  <template #content>
      <v-row class="d-flex justify-center">
            <v-col col="12" md="6" class="d-flex justify-center">
              <v-card class="mx-auto"width="400"elevation="15">
                <v-card-title class="text-center">
                  <v-img class="mx-auto" src="img/logo-nobg.png" :width ="mobile ? '50%' : '25%'" ></v-img>
                  <h3>CCIS BookMate</h3>
                  <p style="font-size: 14px;">Login to your account</p>
                </v-card-title>

                <v-divider></v-divider>
                <v-card-text class="bg-surface-light pt-4">
                  <LoginForm></LoginForm>
                  <v-divider class="my-4"></v-divider>
                  <h4 class="text-center">Don't have an account?<RouterLink to ="/register" class="text-primary"> Register</RouterLink></h4>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
  </template>
</AppLayout>

</template>