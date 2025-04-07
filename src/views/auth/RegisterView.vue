<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
</script>

<template>
<AppLayout>
  <template #content>
    <v-row>
            <v-col col="12" md="6" class="mx-auto">
              <v-card class="mx-auto" width="400" elevation="15">
                <v-card-title class="text-center">
                  <v-img class="mx-auto" src="public/img/BM logo copy.png" :width ="mobile ? '65%' : '25%'"></v-img>
                  <h3>CCIS BookMate</h3>
                  <p style="font-size: 14px;">Register to create an account</p>
                </v-card-title>

                <v-divider></v-divider>
                <v-card-text class="bg-surface-light pt-4">
                  <v-form fast-fail @submit.prevent>
                    <v-text-field label="First Name" variant="outlined"></v-text-field>
                    <v-text-field label="Last Name" variant="outlined"></v-text-field>
                    <v-text-field label="Email" variant="outlined"></v-text-field>
                    <v-text-field label="Password" type ="password" variant="outlined"></v-text-field>
                    <v-text-field label="Confirm Password" type ="password" variant="outlined"></v-text-field>

                    <v-btn class="mt-2" type="submit" block color="primary" prepend-icon="mdi-account-plus">Register Now</v-btn>
                  </v-form>
                  <v-divider class="my-4"></v-divider>
                  <h4 class="text-center">Already have an account?<RouterLink to ="/"> Login</RouterLink></h4>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
  </template>
</AppLayout>

</template>