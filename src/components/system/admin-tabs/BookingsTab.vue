<script setup>
defineProps({
  bookings: Array,
  loading: Boolean,
  error: String
});

const headers = [
  { title: 'User', key: 'user' },
  { title: 'Facility', key: 'facility' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' }
];
</script>

<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="bookings"
      :loading="loading"
    >
      <template #item.user="{ item }">
        {{ item.profiles.name }} ({{ item.profiles.email }})
      </template>
      <template #item.facility="{ item }">
        {{ item.facilities.name }}
      </template>
      <template #item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)">
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>
  </div>
</template>