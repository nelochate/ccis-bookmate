<script setup>
defineProps({
  facilities: {
    type: Array,
    required: true
  },
  error: String,
  loadingFacilities: Boolean
});

const emit = defineEmits(['open-booking-dialog']);

function getStatusColor(status) {
  return status ? 'success' : 'error';
}
</script>

<template>
  <div>
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>
    <v-progress-linear v-if="loadingFacilities" indeterminate></v-progress-linear>

    <v-row class="mt-4">
      <v-col
        v-for="facility in facilities"
        :key="facility.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card hover @click="emit('open-booking-dialog', facility)">
          <v-img :src="facility.image" height="150" cover class="text-white">
            <v-card-title class="text-white text-shadow">
              {{ facility.name }}
            </v-card-title>
          </v-img>
          <v-card-text>
            <div class="d-flex justify-space-between">
              <span>Capacity: {{ facility.capacity }}</span>
              <v-chip :color="getStatusColor(facility.available)" small>
                {{ facility.available ? 'Available' : 'Booked' }}
              </v-chip>
            </div>
            <div class="mt-2">
              <v-icon small>mdi-map-marker</v-icon>
              {{ facility.location }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
</style>