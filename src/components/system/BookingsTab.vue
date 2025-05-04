<script setup>
import { ref } from 'vue'
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
</script>

<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" @click="openBookingDialog(null)" class="mr-2">
        <v-icon start>mdi-plus</v-icon>
        New Booking
      </v-btn>
      <v-btn @click="handleRefresh" :loading="loading">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

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
      @submit-success="handleRefresh"
      @close="showBookingDialog = false"
    />
  </div>
</template>