<script setup>
import { ref } from 'vue';

const props = defineProps({
  bookings: Array,
  loading: Boolean,
  error: String
});

const emit = defineEmits(['update-booking-status']);

const headers = [
  { title: 'User', key: 'user' },
  { title: 'Facility', key: 'facility' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' }
];

// Booking approval dialog
const approvalDialog = ref(false);
const selectedBooking = ref(null);

const getStatusColor = (status) => {
  switch (status) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'error';
    default: return 'info';
  }
};

const openApprovalDialog = (booking) => {
  selectedBooking.value = booking;
  approvalDialog.value = true;
};

const updateBookingStatus = (status) => {
  emit('update-booking-status', {
    id: selectedBooking.value.id,
    status
  });
  approvalDialog.value = false;
};
</script>

<template>
  <div class="admin-bookings-tab">
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

    <!-- Bookings Table -->
    <v-data-table
      :headers="headers"
      :items="bookings"
      :loading="loading"
      class="elevation-1"
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
      
      <template #item.actions="{ item }">
        <v-btn
          v-if="item.status === 'pending'"
          icon
          size="small"
          color="primary"
          @click.stop="openApprovalDialog(item)"
        >
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Booking Approval Dialog -->
    <v-dialog v-model="approvalDialog" max-width="500">
      <v-card>
        <v-card-title>Booking Approval</v-card-title>
        <v-card-text>
          <p><strong>Facility:</strong> {{ selectedBooking?.facilities?.name }}</p>
          <p>
            <strong>User:</strong> {{ selectedBooking?.profiles?.name }} ({{
              selectedBooking?.profiles?.email
            }})
          </p>
          <p><strong>Date:</strong> {{ selectedBooking?.booking_date }}</p>
          <p><strong>Time:</strong> {{ selectedBooking?.start_time }} - {{ selectedBooking?.end_time }}</p>
          <p><strong>Purpose:</strong> {{ selectedBooking?.purpose }}</p>
          <p><strong>Notes:</strong> {{ selectedBooking?.notes || 'None' }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="updateBookingStatus('rejected')">Reject</v-btn>
          <v-btn color="primary" @click="updateBookingStatus('approved')">Approve</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin-bookings-tab {
  padding: 16px;
  background-color: var(--v-background-base);
  border-radius: 5px;
}
</style>