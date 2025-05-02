<script setup>
defineProps({
  userBookings: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['cancel-booking']);

const bookingHeaders = [
  { title: 'Facility', key: 'facilityName' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Purpose', key: 'purpose' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
];

function getStatusColor(status) {
  const statusColors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'grey',
  };
  return statusColors[status.toLowerCase()] || 'blue';
}
</script>

<template>
  <v-card class="mt-4">
    <v-data-table
      :headers="bookingHeaders"
      :items="userBookings"
      :items-per-page="10"
      class="elevation-1"
    >
      <template #item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" small>
          {{ item.status }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon size="small" color="error" @click="emit('cancel-booking', item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-card>
</template>