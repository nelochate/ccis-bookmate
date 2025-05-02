<script setup>
import { ref } from 'vue';

const props = defineProps({
  facilities: {
    type: Array,
    required: true
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['refresh', 'edit-facility', 'delete-facility', 'save-facility']);

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Status', key: 'available' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const statusColors = {
  computer_lab: 'blue',
  lecture_room: 'green',
  meeting_room: 'orange'
};

const getStatusText = (available) => available ? 'Available' : 'Occupied';

// Facility Dialog
const facilityDialog = ref(false);
const facilityForm = ref({
  id: null,
  name: '',
  type: 'computer_lab',
  capacity: '',
  location: '',
  available: true,
  image: ''
});

const openFacilityDialog = (facility = null) => {
  if (facility) {
    facilityForm.value = { ...facility };
  } else {
    facilityForm.value = {
      id: null,
      name: '',
      type: 'computer_lab',
      capacity: '',
      location: '',
      available: true,
      image: ''
    };
  }
  facilityDialog.value = true;
};

const saveFacility = () => {
  emit('save-facility', facilityForm.value);
  facilityDialog.value = false;
};
</script>

<template>
  <div class="admin-facilities-tab">
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
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Action Bar -->
    <div class="d-flex justify-space-between mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openFacilityDialog()"
      >
        Add Facility
      </v-btn>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-refresh"
        @click="$emit('refresh')"
      >
        Refresh
      </v-btn>
    </div>

    <!-- Facilities Table -->
    <v-data-table
      :headers="headers"
      :items="facilities"
      :loading="loading"
      class="elevation-1"
    >
      <template #item.type="{ item }">
        <v-chip :color="statusColors[item.type] || 'grey'">
          {{ item.type.replace('_', ' ') }}
        </v-chip>
      </template>

      <template #item.available="{ item }">
        <v-chip :color="item.available ? 'green' : 'red'">
          {{ getStatusText(item.available) }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          class="mr-2"
          @click.stop="openFacilityDialog(item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          color="error"
          @click.stop="$emit('delete-facility', item.id)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Facility Management Dialog -->
    <v-dialog v-model="facilityDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ facilityForm.id ? 'Edit Facility' : 'Add New Facility' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveFacility">
            <v-text-field 
              v-model="facilityForm.name" 
              label="Name" 
              required
            ></v-text-field>
            <v-select
              v-model="facilityForm.type"
              :items="[
                { text: 'Computer Lab', value: 'computer_lab' },
                { text: 'Lecture Room', value: 'lecture_room' },
              ]"
              label="Type"
              required
            ></v-select>
            <v-text-field
              v-model="facilityForm.capacity"
              label="Capacity"
              type="number"
              required
            ></v-text-field>
            <v-text-field
              v-model="facilityForm.location"
              label="Location"
              required
            ></v-text-field>
            <v-switch 
              v-model="facilityForm.available" 
              label="Available"
            ></v-switch>
            <v-text-field 
              v-model="facilityForm.image" 
              label="Image URL"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="facilityDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveFacility">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin-facilities-tab {
  padding: 16px;
  background-color: var(--v-background-base);
  border-radius: 5px;
}
</style>