<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import BookingsFormDialog from '@/components/system/BookingsFormDialog.vue'

const props = defineProps({
  userBookings: {
    type: Array,
    required: true
  },
  facilities: {
    type: Array,
    default: () => []
  }
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

// Dialog control
const showBookingDialog = ref(false)
const selectedFacility = ref(null)

function openBookingDialog(facility) {
  selectedFacility.value = facility
  showBookingDialog.value = true
}

function getStatusColor(status) {
  const statusColors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'grey',
  }
  return statusColors[status.toLowerCase()] || 'blue'
}

async function handleSubmitBooking(bookingData) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.from('bookings').insert({
      facility_id: bookingData.facility,
      user_id: user.id,
      purpose: bookingData.purpose,
      booking_date: bookingData.date,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      notes: bookingData.notes,
      status: 'pending',
    })

    if (error) throw error

    emit('refresh-bookings')
  } catch (error) {
    console.error('Error submitting booking:', error.message)
  }
}
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" @click="openBookingDialog(null)">
        <v-icon start>mdi-plus</v-icon>
      </v-btn>
    </div>

    <v-card class="mt-4">
      <v-data-table
        :headers="bookingHeaders"
        :items="props.userBookings"
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

    <BookingsFormDialog
      v-if="showBookingDialog"
      :facility="selectedFacility"
      :facilities="props.facilities"
      @submit-booking="handleSubmitBooking"
      @close="showBookingDialog = false"
    />
  </div>
</template>