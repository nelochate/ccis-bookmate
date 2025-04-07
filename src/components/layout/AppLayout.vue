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
      <v-app-bar class="px-3" color="blue-grey-darken-4">
        <v-spacer></v-spacer>

        <v-btn
          :prepend-icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"

          slim
          @click="onClick"
        ></v-btn>
      </v-app-bar>

      <v-main>
        <v-container>
         <slot name="content"></slot>
        </v-container>
      </v-main>

      <v-footer border app color="blue-grey-darken-4" class="d-flex justify-center">Copyright &copy; 2025 CCIS BookMate</v-footer>
    </v-app>
  </v-responsive>
</template>