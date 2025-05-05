<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import BookingsFormDialog from '@/components/system/BookingsFormDialog.vue'

const props = defineProps({
  userBookings: {
    type: Array,
    required: true,
  },
  facilities: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['refresh-bookings'])

const showBookingDialog = ref(false)
const selectedFacility = ref(null)
const isSubmitting = ref(false)
const bookingError = ref(null)
const confirmationDialog = ref(false) // For cancellation
const deleteDialog = ref(false) // For deletion
const bookingToCancel = ref(null)
const bookingToDelete = ref(null)
const viewBookingDialog = ref(false)
const selectedBooking = ref(null)

function openBookingDialog(facility) {
  selectedFacility.value = facility
  showBookingDialog.value = true
}

function openViewBookingDialog(booking) {
  selectedBooking.value = booking
  viewBookingDialog.value = true
}

function handleRefresh() {
  emit('refresh-bookings')
}

function confirmCancelBooking(booking) {
  bookingToCancel.value = booking
  confirmationDialog.value = true
}

async function cancelBooking() {
  if (!bookingToCancel.value) return

  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingToCancel.value.id)

    if (error) {
      bookingError.value = 'Failed to cancel the booking. Please try again.'
    } else {
      handleRefresh()
      confirmationDialog.value = false
    }
  } catch (err) {
    bookingError.value = 'An unexpected error occurred while cancelling the booking.'
  }
}

function confirmDeleteBooking(booking) {
  bookingToDelete.value = booking
  deleteDialog.value = true
}

async function deleteBooking() {
  if (!bookingToDelete.value) return

  try {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingToDelete.value.id)

    if (error) {
      bookingError.value = 'Failed to delete the booking. Please try again.'
    } else {
      handleRefresh() // Refresh the bookings list
      deleteDialog.value = false // Close the delete confirmation dialog
    }
  } catch (err) {
    bookingError.value = 'An unexpected error occurred while deleting the booking.'
  }
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn @click="handleRefresh" :loading="loading">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <v-alert v-if="bookingError" type="error" class="mb-4">
      {{ bookingError }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="[
          { title: 'Facility', key: 'facilityName' },
          { title: 'Date', key: 'date' },
          { title: 'Time', key: 'time' },
          { title: 'Purpose', key: 'purpose' },
          { title: 'Status', key: 'status' },
          { title: 'Actions', key: 'actions', sortable: false },
        ]"
        :items="props.userBookings"
        :loading="props.loading"
        :items-per-page="10"
        class="elevation-1"
        dense
        outlined
      >
        <template #item.status="{ item }">
          <v-chip
            :color="
              item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : item.status === 'cancelled' ? 'gray' : 'orange'
            "
            small
          >
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <!-- View Booking -->
          <v-btn
            class="mr-3"
            icon
            size="small"
            color="gray"
            @click.stop="openViewBookingDialog(item)"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>

          <!-- Cancel Booking -->
          <v-btn
            v-if="item.status === 'pending' || item.status === 'approved'"
            icon
            size="small"
            @click="confirmCancelBooking(item)"
            :disabled="props.loading"
          >
            <v-icon>mdi-cancel</v-icon>
          </v-btn>

          <!-- Delete Booking -->
          <v-btn icon size="small" @click="confirmDeleteBooking(item)" :disabled="props.loading">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- View Booking Dialog -->
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
                selectedBooking?.facilityName
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Facility</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-calendar</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedBooking?.date
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Date</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-clock</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedBooking?.time
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Time Slot</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedBooking?.purpose">
              <template #prepend>
                <v-icon color="primary">mdi-text</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedBooking?.purpose
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Purpose</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template #prepend>
                <v-icon color="primary">mdi-information-outline</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">{{
                selectedBooking?.status
              }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption grey--text">Status</v-list-item-subtitle>
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

    <!-- Cancel Confirmation Dialog -->
    <v-dialog v-model="confirmationDialog" max-width="400">
      <v-card>
        <v-card-title>Cancel Booking</v-card-title>
        <v-card-text> Are you sure you want to cancel this booking? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmationDialog = false">No</v-btn>
          <v-btn color="orange" @click="cancelBooking">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Booking</v-card-title>
        <v-card-text> Are you sure you want to delete this booking? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">No</v-btn>
          <v-btn color="red" @click="deleteBooking">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <BookingsFormDialog
      v-if="showBookingDialog"
      :facility="selectedFacility"
      :facilities="props.facilities"
      :loading="isSubmitting"
      :error="bookingError"
      @submit-success="handleSubmitBooking"
      @close="showBookingDialog = false"
    />
  </div>
</template>

<style scoped>
.v-data-table {
  border: 1.8px solid #ccc; /* Add a border around the table */
}

.v-data-table th,
.v-data-table td {
  border-bottom: 1.5px solid #ccc; /* Add borders between rows */
}
</style>
