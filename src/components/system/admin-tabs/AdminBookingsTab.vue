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

          <!-- View Approved Booking Button -->
          <v-btn
            v-if="item.status === 'approved'"
            icon
            size="small"
            color="green"
            @click.stop="openViewBookingDialog(item)"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>

          <!-- View Rejected Booking Button -->
          <v-btn
            v-if="item.status === 'rejected'"
            icon
            size="small"
            color="red"
            @click.stop="openViewBookingDialog(item)"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>

          <!-- View Cancelled Booking Button -->
          <v-btn
            v-if="item.status === 'cancelled'"
            icon
            size="small"
            color="grey"
            @click.stop="openViewBookingDialog(item)"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>
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
