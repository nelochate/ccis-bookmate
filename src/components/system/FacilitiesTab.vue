<script setup>
import { onMounted, computed } from 'vue';


// Props
const props = defineProps({
  facilities: {
    type: Array,
    required: true
  },
  error: String,
  loadingFacilities: Boolean
});

// Emits
const emit = defineEmits(['open-booking-dialog']);

// Computed
const isEmpty = computed(() => props.facilities.length === 0);

// Methods
function getStatusColor(status) {
  return status ? 'success' : 'error';
}

// Lifecycle
onMounted(async () => {

  facilitiesStore.getFacilitiesFromApi ()
  console.log(facilitiesStore.facilities)
  
  try {
    await facilitiesStore.getFacilitiesFromApi();
    console.log('Facilities loaded:', facilitiesStore.facilities);
  } catch (error) {
    console.error('Error loading facilities:', error);
  }
});
</script>

<template>
  <div class="facilities-container">
    <!-- Error State -->
    <v-alert 
      v-if="error" 
      type="error" 
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear 
      v-if="loadingFacilities" 
      indeterminate 
      color="primary"
    />

    <!-- Empty State -->
    <v-alert
      v-if="!loadingFacilities && isEmpty"
      type="info"
      class="my-4"
    >
      No facilities available
    </v-alert>

    <!-- Facilities Grid -->
    <v-row 
      v-if="!isEmpty && !loadingFacilities"
      class="mt-4 facilities-grid"
    >
      <v-col
        v-for="facility in facilities"
        :key="facility.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card 
          hover 
          class="facility-card"
          @click="emit('open-booking-dialog', facility)"
        >
          <v-img 
            :src="facility.image_url" 
            height="150" 
            cover 
            class="facility-image_url"
          >
            <v-card-title class="facility-title text-shadow">
              {{ facility.name }}
            </v-card-title>
          </v-img>

          <v-card-text class="facility-details">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="facility-capacity">
                Capacity: {{ facility.capacity }}
              </span>
              <v-chip 
                :color="getStatusColor(facility.is_available)" 
                small
                class="facility-status"
              >
                {{ facility.is_available ? 'Available' : 'Booked' }}
              </v-chip>
            </div>

            <div class="facility-location">
              <v-icon small class="mr-1">mdi-map-marker</v-icon>
              {{ facility.location }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.facilities-container {
  padding: 16px;
}

.facility-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.facility-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.facility-image_url {
  position: relative;
}

.facility-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 16px;
}

.facility-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.facility-location {
  display: flex;
  align-items: center;
  margin-top: auto;
}

.text-shadow {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
</style>