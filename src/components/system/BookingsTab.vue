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

const emit = defineEmits(['cancel-booking', 'refresh-bookings'])

const bookingHeaders = [
  { title: 'Facility', key: 'facilityName' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Purpose', key: 'purpose' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const showBookingDialog = ref(false)
const selectedFacility = ref(null)
const isSubmitting = ref(false)
const bookingError = ref(null)
const confirmationDialog = ref(false)
const bookingToCancel = ref(null)
const viewBookingDialog = ref(false)
const selectedBooking = ref(null)

function getStatusColor(status) {
  const colors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'grey',
  }
  return colors[status.toLowerCase()] || 'blue'
}

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

function confirmCancellation(booking) {
  bookingToCancel.value = booking
  confirmationDialog.value = true
}

function cancelBooking() {
  if (!bookingToCancel.value) return

  // Update the booking status to "cancelled" in the database
  supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingToCancel.value.id)
    .then(({ error }) => {
      if (error) {
        bookingError.value = 'Failed to cancel the booking. Please try again.'
      } else {
        handleRefresh() // Refresh the bookings list
        confirmationDialog.value = false // Close the confirmation dialog
      }
    })
    .catch(() => {
      bookingError.value = 'An unexpected error occurred while cancelling the booking.'
    })
}

async function handleSubmitBooking(bookingData) {
  try {
    isSubmitting.value = true
    bookingError.value = null

    const requiredFields = ['facility_id', 'date', 'start_time', 'end_time']
    const missingFields = requiredFields.filter((field) => !bookingData[field])
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: conflicts } = await supabase
      .from('bookings')
      .select()
      .eq('facility_id', bookingData.facility_id)
      .eq('date', bookingData.date)
      .or(`and(start_time.lte.${bookingData.end_time},end_time.gte.${bookingData.start_time})`)
      .neq('id', bookingData.id || '')

    if (conflicts?.length > 0) {
      throw new Error('Time slot already booked')
    }

    const { error: dbError } = await supabase.from('bookings').upsert({
      ...bookingData,
      user_id: user.id,
      status: bookingData.status || 'pending',
    })

    if (dbError) throw dbError

    showBookingDialog.value = false
    handleRefresh()
    return { success: true }
  } catch (err) {
    bookingError.value = err.message
    return { success: false }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn @click="openBookingDialog(null)" class="mr-4">
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-btn @click="handleRefresh" :loading="loading">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <v-alert v-if="bookingError" type="error" class="mb-4">
      {{ bookingError }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="bookingHeaders"
        :items="props.userBookings"
        :loading="props.loading"
        :items-per-page="10"
        class="elevation-1"
        dense
        outlined
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" small>
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            class="mr-3"
            icon
            size="small"
            color="gray"
            @click.stop="openViewBookingDialog(item)"
            @click="openViewBookingDialog(item)"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>

          <v-btn
            v-if="item.status === 'pending' || item.status === 'approved'"
            icon
            size="small"
            color="gray"
            @click="confirmCancellation(item)"
            :disabled="props.loading"
          >
            <v-icon>mdi-cancel</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmationDialog" max-width="400">
      <v-card>
        <v-card-title>Cancel Booking</v-card-title>
        <v-card-text> Are you sure you want to cancel this booking? </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="confirmationDialog = false">No</v-btn>
          <v-btn color="red" @click="cancelBooking">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
