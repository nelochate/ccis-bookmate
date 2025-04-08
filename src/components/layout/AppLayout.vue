<script setup>
import { ref } from 'vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')

function onClick() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}
</script>

<template>
  <v-responsive>
    <v-app :theme="theme">
      <v-app-bar class="px-3" :color="theme === 'light' ? 'blue-grey-lighten-5' : 'blue-grey-darken-4'">
        <v-spacer></v-spacer>

        <v-btn
          :icon="theme === 'light' ? 'mdi-weather-sunny' : 'mdi-weather-night'"
          variant="elevated"
          slim
          @click="onClick"
        ></v-btn>
      </v-app-bar>

      <v-main>
        <v-container>
         <slot name="content"></slot>
        </v-container>
      </v-main>

      <v-footer border app :color="theme === 'light' ? 'blue-grey-lighten-5' : 'blue-grey-darken-4'" class="d-flex justify-center" elevation ="20">Copyright &copy; 2025 CCIS BookMate</v-footer>
    </v-app>
  </v-responsive>
</template>