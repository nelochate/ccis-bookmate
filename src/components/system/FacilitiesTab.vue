<script setup>
import { computed, onMounted } from 'vue';
import { useFacilitiesStore } from '@/stores/facilities';

const facilitiesStore = useFacilitiesStore();

// Props with more defensive defaults
const props = defineProps({
  useLocalFacilities: {
    type: Boolean,
    default: true
  },
  externalFacilities: {
    type: Array,
    default: () => [], // Always ensure array default
    validator: (value) => Array.isArray(value) // Type checking
  },
  error: {
    type: String,
    default: ''
  },
  loadingFacilities: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['open-booking-dialog']);

// Safe computed properties
const displayedFacilities = computed(() => {
  try {
    return props.useLocalFacilities 
      ? (facilitiesStore.facilities || [])
      : (props.externalFacilities || []);
  } catch (error) {
    console.error('Error accessing facilities:', error);
    return [];
  }
});

const isEmpty = computed(() => {
  try {
    return displayedFacilities.value.length === 0;
  } catch (error) {
    console.error('Error checking if facilities are empty:', error);
    return true; // Treat errors as empty state
  }
});

// Methods
function getStatusColor(status) {
  return status ? 'success' : 'error';
}

// Lifecycle with error handling
onMounted(async () => {
  if (props.useLocalFacilities) {
    try {
      await facilitiesStore.getFacilitiesFromApi();
    } catch (error) {
      console.error('Failed to load facilities:', error);
    }
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
        v-for="facility in displayedFacilities"
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
/* Your existing styles remain unchanged */
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
  color: white !important; 
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