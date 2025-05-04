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
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel-booking', 'refresh-bookings'])

const bookingHeaders = [
  { title: 'Facility', key: 'facilityName' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Purpose', key: 'purpose' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const showBookingDialog = ref(false)
const selectedFacility = ref(null)
const isSubmitting = ref(false)
const bookingError = ref(null)

function getStatusColor(status) {
  const colors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'grey'
  }
  return colors[status.toLowerCase()] || 'blue'
}

function openBookingDialog(facility) {
  selectedFacility.value = facility
  showBookingDialog.value = true
}

function handleRefresh() {
  emit('refresh-bookings')
}

async function handleSubmitBooking(bookingData) {
  try {
    isSubmitting.value = true
    bookingError.value = null

    // Validate booking data
    const requiredFields = ['facility_id', 'date', 'start_time', 'end_time']
    const missingFields = requiredFields.filter((field) => !bookingData[field])
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check for conflicts
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

    // Save booking
    const { error: dbError } = await supabase
      .from('bookings')
      .upsert({
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
      <v-btn color="primary" @click="openBookingDialog(null)" class="mr-4">
        <v-icon>mdi-plus</v-icon></v-btn>
      
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
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" small>
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon
            size="small"
            color="error"
            @click="emit('cancel-booking', item)"
            :disabled="props.loading"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

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