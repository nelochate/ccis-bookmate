<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  bookings: Array,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['update-booking-status'])

const headers = [
  { title: '#', key: 'number', sortable: false },
  { title: 'User', key: 'user', sortable: false },
  { title: 'Facility', key: 'facilityName', sortable: true },
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Time', key: 'time', sortable: false },
  { title: 'Purpose', key: 'purpose', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const approvalDialog = ref(false)
const viewBookingDialog = ref(false)
const selectedBooking = ref(null)
const selectedApprovedBooking = ref(null)
const notificationMessage = ref(null)
const statusFilter = ref('') // Filter for status

// Filtered bookings
const filteredBookings = computed(() => {
  let filtered = props.bookings

  // Apply status filter
  if (statusFilter.value && statusFilter.value !== 'all') {
    filtered = filtered.filter((booking) => booking.status === statusFilter.value)
  }

  return filtered
})

const getStatusColor = (status) => {
  const statusColors = {
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    cancelled: 'grey',
  }
  return statusColors[status] || 'info'
}

const openApprovalDialog = (booking) => {
  selectedBooking.value = booking
  approvalDialog.value = true
}

const openViewBookingDialog = (booking) => {
  selectedApprovedBooking.value = booking
  viewBookingDialog.value = true
}

const updateStatus = (status) => {
  emit('update-booking-status', {
    id: selectedBooking.value.id,
    status,
  })
  approvalDialog.value = false

  // Set notification message
  notificationMessage.value = `Booking ${status} successfully!`

  // Clear notification after 2 seconds
  setTimeout(() => {
    notificationMessage.value = null
  }, 2000)
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateString).toLocaleDateString(undefined, options)
}
</script>

<template>
  <div class="admin-bookings-tab">
    <!-- Notification -->
    <v-alert v-if="notificationMessage" type="success" class="mb-4" transition="scale-transition">
      {{ notificationMessage }}
    </v-alert>

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-select
          v-model="statusFilter"
          :items="['all', 'approved', 'pending', 'rejected', 'cancelled']"
          label="Filter by Status"
          dense
          outlined
        ></v-select>
      </v-col>
    </v-row>

    <!-- Bookings Table -->
    <v-data-table
      :headers="headers"
      :items="filteredBookings"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1 table-with-border"
    >
      <!-- Numbering Column -->
      <template #item.number="{ index }">
        {{ index + 1 }}
      </template>

      <template #item.user="{ item }">
        <div>
          <div>{{ item.userName }}</div>
          <div class="text-caption text-grey">{{ item.userEmail }}</div>
        </div>
      </template>

      <template #item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>

      <template #item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" size="small">
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex">
          <!-- Approve Button -->
          <v-btn
            v-if="item.status === 'pending'"
            icon
            size="small"
            color="orange"
            class="mr-2"
            @click.stop="openApprovalDialog(item)"
          >
            <v-icon>mdi-check-decagram-outline</v-icon>
          </v-btn>

          <!-- View Booking Button -->
          <v-btn icon size="small" color="gray" @click.stop="openViewBookingDialog(item)">
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- View Booking Dialog -->
    <<v-dialog v-model="viewBookingDialog" max-width="600px">
      <v-card>
        <!-- Dialog Title -->
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="mr-2">mdi-information-outline</v-icon>
          Booking Details
        </v-card-title>

        <!-- Dialog Content -->
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-account</v-icon>
              <strong>User:</strong> {{ selectedApprovedBooking?.userName }}
            </v-col>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-email</v-icon>
              <strong>Email:</strong> {{ selectedApprovedBooking?.userEmail }}
            </v-col>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-home-city-outline</v-icon>
              <strong>Facility:</strong> {{ selectedApprovedBooking?.facilityName }}
            </v-col>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-calendar</v-icon>
              <strong>Date:</strong> {{ formatDate(selectedApprovedBooking?.date) }}
            </v-col>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-clock-outline</v-icon>
              <strong>Time:</strong> {{ selectedApprovedBooking?.time }}
            </v-col>
            <v-col cols="12" sm="6">
              <v-icon color="blue" class="mr-1">mdi-text-box-outline</v-icon>
              <strong>Purpose:</strong> {{ selectedApprovedBooking?.purpose }}
            </v-col>
            <v-col cols="12">
              <v-icon color="blue" class="mr-1">mdi-note-outline</v-icon>
              <strong>Notes:</strong>
              {{ selectedApprovedBooking?.notes || 'No additional notes provided.' }}
            </v-col>
            <v-col cols="12">
              <v-icon color="blue" class="mr-1">mdi-check-circle-outline</v-icon>
              <strong>Status:</strong>
              <v-chip :color="getStatusColor(selectedApprovedBooking?.status)" small>
                {{ selectedApprovedBooking?.status }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Dialog Actions -->
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" text @click="viewBookingDialog = false"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    
    <!-- Approval Dialog -->
    <v-dialog v-model="approvalDialog" max-width="500px">
      <v-card>
        <!-- Dialog Title -->
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon color="blue" class="mr-2">mdi-alert-circle-outline</v-icon>
          Approve or Reject Booking
        </v-card-title>

        <!-- Dialog Content -->
        <v-card-text>
          <v-row align="center" justify="center">
            <v-icon color="orange" size="48">mdi-help-circle-outline</v-icon>
          </v-row>
          <p class="text-center mt-4">
            Are you sure you want to update the status of this booking?
          </p>
          <p class="text-center text-caption text-grey">This action cannot be undone.</p>
        </v-card-text>

        <!-- Dialog Actions -->
        <v-card-actions class="justify-center">
          <v-btn color="green" text @click="updateStatus('approved')">
            <v-icon left>mdi-check-circle-outline</v-icon> Approve
          </v-btn>
          <v-btn color="red" text @click="updateStatus('rejected')">
            <v-icon left>mdi-close-circle-outline</v-icon> Reject
          </v-btn>
          <v-btn text @click="approvalDialog = false">
            <v-icon left>mdi-cancel</v-icon> Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin-bookings-tab {
  padding: 16px;
}

.v-btn + .v-btn {
  margin-left: 8px;
}

/* Add border styling for the table */
.table-with-border {
  border: 0px solid #ccc;
  border-radius: 7px;
  overflow: hidden;
}

.filters {
  display: flex;
  align-items: center;
}
</style>
