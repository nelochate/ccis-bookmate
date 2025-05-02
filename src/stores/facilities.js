import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('facilities', () => {
  //States
  const facilities = ref([])

  //Getters
  //const sample = computed(() => count.value * 2)

  //Actions
  async function getFacilitiesFromApi() {
    const response = await axios.get('https://api.restful-api.dev/objects/facilities')

    facilities.value = response.data
  }

  return { facilities, getFacilitiesFromApi }
})