<script setup>
import { ref } from 'vue'

const props = defineProps({
  bookings: Array,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['update-booking-status'])

const headers = [
  { title: '#', key: 'number', sortable: false }, // Add numbering column
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
const notificationMessage = ref(null) // Notification message ref

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

    <!-- Bookings Table -->
    <v-data-table
      :headers="headers"
      :items="bookings"
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

    <!-- Booking Approval Dialog -->
    <v-dialog v-model="approvalDialog" max-width="500">
      <v-card>
        <v-card-title>Booking Approval</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-office-building</v-icon>
              </template>
              <v-list-item-title>{{ selectedBooking?.facilityName }}</v-list-item-title>
              <v-list-item-subtitle>Facility</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>{{ selectedBooking?.userName }}</v-list-item-title>
              <v-list-item-subtitle>{{ selectedBooking?.userEmail }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>{{ formatDate(selectedBooking?.date) }}</v-list-item-title>
              <v-list-item-subtitle>Date</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon>mdi-clock</v-icon>
              </template>
              <v-list-item-title>{{ selectedBooking?.time }}</v-list-item-title>
              <v-list-item-subtitle>Time Slot</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedBooking?.purpose">
              <template #prepend>
                <v-icon>mdi-text</v-icon>
              </template>
              <v-list-item-title>{{ selectedBooking?.purpose }}</v-list-item-title>
              <v-list-item-subtitle>Purpose</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedBooking?.notes">
              <template #prepend>
                <v-icon>mdi-note</v-icon>
              </template>
              <v-list-item-title>{{ selectedBooking?.notes }}</v-list-item-title>
              <v-list-item-subtitle>Notes</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="updateStatus('rejected')">Reject</v-btn>
          <v-btn color="success" @click="updateStatus('approved')">Approve</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Booking Details -->
    <v-dialog v-model="viewBookingDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold primary--text">
          <v-icon class="mr-2">mdi-information-outline</v-icon> Booking Details
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list dense>
            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-office-building</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedApprovedBooking?.facilityName
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Facility</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-account</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedApprovedBooking?.userName
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">{{
                selectedApprovedBooking?.userEmail
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-calendar</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                formatDate(selectedApprovedBooking?.date)
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Date</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-clock</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedApprovedBooking?.time
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Time Slot</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedApprovedBooking?.purpose">
              <template #prepend>
                <v-icon color="primary">mdi-text</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedApprovedBooking?.purpose
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Purpose</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedApprovedBooking?.notes">
              <template #prepend>
                <v-icon color="primary">mdi-note</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedApprovedBooking?.notes
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Notes</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="viewBookingDialog = false">
            <v-icon left>mdi-close</v-icon> Close
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
</style>
