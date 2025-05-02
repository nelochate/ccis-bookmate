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

const emit = defineEmits(['refresh', 'edit-facility', 'delete-facility']);

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
        @click="$emit('edit-facility', null)"
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
          @click.stop="$emit('edit-facility', item)"
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
  </div>
</template>

<style scoped>
.admin-facilities-tab {
  padding: 16px;
  background-color: var(--v-background-base);
  border-radius: 5px;
}
</style>