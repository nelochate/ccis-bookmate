<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase' // Import your Supabase client

import FacilitiesTab from '@/components/system/FacilitiesTab.vue';
import BookingsTab from '@/components/system/BookingsTab.vue';
import SchedulesTab from '@/components/system/SchedulesTab.vue';

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref('facilities')

// Data refs
const quickStats = ref([
  { title: 'Total Facilities', value: '0', icon: 'mdi-office-building', color: 'indigo' },
  { title: 'Available Now', value: '0', icon: 'mdi-check-circle', color: 'green' },
  { title: 'My Bookings', value: '0', icon: 'mdi-bookmark', color: 'orange' },
  { title: 'Pending', value: '0', icon: 'mdi-clock', color: 'blue' },
])

const facilities = ref([])
const userBookings = ref([])
const computerLabs = ref([])
const lectureRooms = ref([])

// Booking dialog
const bookingDialog = ref(false)
const selectedFacility = ref(null)
const bookingForm = ref({
  facility: null,
  purpose: '',
  date: null,
  startTime: null,
  endTime: null,
  notes: '',
})

// Fetch data from Supabase
async function fetchFacilities() {
  try {
    const { data, error } = await supabase.from('facilities').select('*')

    if (error) throw error

    facilities.value = data
    updateQuickStats()

    // Populate computer labs and lecture rooms for schedules
    computerLabs.value = data.filter((f) => f.type === 'computer_lab')
    lectureRooms.value = data.filter((f) => f.type === 'lecture_room')
  } catch (error) {
    console.error('Error fetching facilities:', error.message)
  }
}

async function fetchUserBookings() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        purpose,
        booking_date,
        start_time,
        end_time,
        status,
        notes,
        facilities (id, name)
      `,
      )
      .eq('user_id', user.id)
      .order('booking_date', { ascending: true })

    if (error) throw error

    userBookings.value = data.map((booking) => ({
      id: booking.id,
      facilityId: booking.facilities.id,
      facilityName: booking.facilities.name,
      date: booking.booking_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      purpose: booking.purpose,
      status: booking.status,
      notes: booking.notes,
    }))

    updateQuickStats()
  } catch (error) {
    console.error('Error fetching user bookings:', error.message)
  }
}

function updateQuickStats() {
  quickStats.value[0].value = facilities.value.length.toString()
  quickStats.value[1].value = facilities.value.filter((f) => f.is_available).length.toString()
  quickStats.value[2].value = userBookings.value.length.toString()
  quickStats.value[3].value = userBookings.value
    .filter((b) => b.status === 'pending')
    .length.toString()
}

async function submitBooking() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.from('bookings').insert({
      facility_id: bookingForm.value.facility,
      user_id: user.id,
      purpose: bookingForm.value.purpose,
      booking_date: bookingForm.value.date,
      start_time: bookingForm.value.startTime,
      end_time: bookingForm.value.endTime,
      notes: bookingForm.value.notes,
      status: 'pending',
    })

    if (error) throw error

    // Refresh data
    await fetchUserBookings()
    await fetchFacilities()

    bookingDialog.value = false
    resetBookingForm()
  } catch (error) {
    console.error('Error submitting booking:', error.message)
  }
}

async function cancelBooking(booking) {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id)

    if (error) throw error

    // Refresh data
    await fetchUserBookings()
    await fetchFacilities()
  } catch (error) {
    console.error('Error canceling booking:', error.message)
  }
}

// Initialize
onMounted(async () => {
  bookingForm.value.date = new Date().toISOString().substr(0, 10)
  await fetchFacilities()
  await fetchUserBookings()
})

// In your dashboard component's onMounted
onMounted(async () => {
  bookingForm.value.date = new Date().toISOString().substr(0, 10)
  await fetchFacilities()
  await fetchUserBookings()

  // Set up real-time subscriptions
  const facilitiesChannel = supabase
    .channel('facilities_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () =>
      fetchFacilities(),
    )
    .subscribe()

  const bookingsChannel = supabase
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () =>
      fetchUserBookings(),
    )
    .subscribe()

  // Clean up on unmount
  onUnmounted(() => {
    supabase.removeChannel(facilitiesChannel)
    supabase.removeChannel(bookingsChannel)
  })
})

// Add to your dashboard component
const user = ref(null)

async function fetchUser() {
  const {
    data: { user: userData },
  } = await supabase.auth.getUser()
  user.value = userData
}

async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Error logging out:', error.message)
  }
}

// Call fetchUser in onMounted

// Add these refs
const loadingFacilities = ref(false)
const loadingBookings = ref(false)
const error = ref(null)

// Booking Conflict Detection
async function checkBookingConflict() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('facility_id', bookingForm.value.facility)
      .eq('booking_date', bookingForm.value.date)
      .or(
        `and(start_time.lte.${bookingForm.value.endTime},end_time.gte.${bookingForm.value.startTime})`,
      )

    if (error) throw error

    return data.length > 0
  } catch (error) {
    console.error('Error checking booking conflicts:', error.message)
    return false
  }
}
</script>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
</style>

<template>
  <AppLayout>
    <template #content>
      <v-container fluid>
        
        <!-- Header Section -->
        <v-row class="mb-6 d-flex justify-center align-center">
          <v-col cols="12">
            <v-card
              class="pa-4"
              :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'"
            >
              <div class="d-flex justify-space-between align-center">
                <div>
                  <h1 class="text-h4 font-weight-bold">CCIS BookMate Dashboard</h1>
                  <p class="text-subtitle-1">Manage your facility bookings and schedules</p>
                </div>
                <v-btn color="primary" @click="openBookingDialog(null)">
                  <v-icon start>mdi-plus</v-icon>
                  New Booking
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Quick Stats -->
        <v-row class="mb-6">
          <v-col v-for="stat in quickStats" :key="stat.title" cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-subtitle-1">{{ stat.title }}</div>
                  <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
                </div>
                <v-icon :color="stat.color" size="40">{{ stat.icon }}</v-icon>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Tabs for Different Views -->
        <v-tabs v-model="tab" grow>
          <v-tab value="facilities">Facilities</v-tab>
          <v-tab value="bookings">My Bookings</v-tab>
          <v-tab value="schedules">Class Schedules</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Facilities Tab -->
          <v-window-item value="facilities">
            <FacilitiesTab
              :facilities="facilities"
              :error="error"
              :loading-facilities="loadingFacilities"
              @open-booking-dialog="openBookingDialog"
            />
          </v-window-item>

          <!-- My Bookings Tab -->
          <v-window-item value="bookings">
            <BookingsTab
              :user-bookings="userBookings"
              @cancel-booking="cancelBooking"
            />
          </v-window-item>

          <!-- Class Schedules Tab -->
          <v-window-item value="schedules">
            <SchedulesTab
              :computer-labs="computerLabs"
              :lecture-rooms="lectureRooms"
            />
          </v-window-item>
        </v-window>

        <!-- Booking Dialog remains the same -->
      </v-container>
    </template>
  </AppLayout>
</template>