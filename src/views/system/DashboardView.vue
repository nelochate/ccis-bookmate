<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'

import FacilitiesTab from '@/components/system/FacilitiesTab.vue'
import BookingsTab from '@/components/system/BookingsTab.vue'
import SchedulesTab from '@/components/system/SchedulesTab.vue'

import BookingsFormDialog from '@/components/system/BookingsFormDialog.vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref('facilities')

// Add these new refs for dialog control
const showBookingDialog = ref(false)
const selectedFacility = ref(null)

  // Clean up on unmount
  onUnmounted(() => {
    supabase.removeChannel(facilitiesChannel)
    supabase.removeChannel(bookingsChannel)
  })

// Add this function to handle opening the dialog
function openBookingDialog(facility) {
  selectedFacility.value = facility
  showBookingDialog.value = true
}

// Add this function to handle booking submission
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

    // Refresh data
    await fetchUserBookings()
    await fetchFacilities()
    
    showBookingDialog.value = false
  } catch (error) {
    console.error('Error submitting booking:', error.message)
  }
}


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

// Add these refs
const loadingFacilities = ref(false)
const loadingBookings = ref(false)
const error = ref(null)
const user = ref(null)

// Fetch data from Supabase
async function fetchFacilities() {
  try {
    loadingFacilities.value = true
    const { data, error: fetchError } = await supabase.from('facilities').select('*')

    if (fetchError) throw fetchError

    facilities.value = data
    updateQuickStats()

    // Populate computer labs and lecture rooms for schedules
    computerLabs.value = data.filter((f) => f.type === 'computer_lab')
    lectureRooms.value = data.filter((f) => f.type === 'lecture_room')
  } catch (err) {
    error.value = err.message
    console.error('Error fetching facilities:', err.message)
  } finally {
    loadingFacilities.value = false
  }
}

async function fetchUserBookings() {
  try {
    loadingBookings.value = true
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) throw authError
    if (!authUser) return

    const { data, error: bookingsError } = await supabase
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
      .eq('user_id', authUser.id)
      .order('booking_date', { ascending: true })

    if (bookingsError) throw bookingsError

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
  } catch (err) {
    error.value = err.message
    console.error('Error fetching user bookings:', err.message)
  } finally {
    loadingBookings.value = false
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

async function cancelBooking(booking) {
  try {
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', booking.id)

    if (deleteError) throw deleteError

    // Refresh data
    await fetchUserBookings()
    await fetchFacilities()
  } catch (err) {
    error.value = err.message
    console.error('Error canceling booking:', err.message)
  }
}

async function fetchUser() {
  try {
    const {
      data: { user: userData },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    user.value = userData
  } catch (err) {
    error.value = err.message
    console.error('Error fetching user:', err.message)
  }
}

async function handleLogout() {
  try {
    const { error: logoutError } = await supabase.auth.signOut()
    if (logoutError) throw logoutError
    router.push({ name: 'login' })
  } catch (err) {
    error.value = err.message
    console.error('Error logging out:', err.message)
  }
}


</script>

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
            <FacilitiesTab :facilities="facilities" :error="error" :loading="loadingFacilities" />
          </v-window-item>

          <!-- My Bookings Tab -->
          <v-window-item value="bookings">
            <BookingsTab
              :user-bookings="userBookings"
              @cancel-booking="cancelBooking"
              @refresh-bookings="fetchUserBookings"
            />
          </v-window-item>

          <!-- Class Schedules Tab -->
          <v-window-item value="schedules">
            <SchedulesTab :computer-labs="computerLabs" :lecture-rooms="lectureRooms" />
          </v-window-item>
        </v-window>
      </v-container>
      
      <!-- Booking Form Dialog -->
      <BookingsFormDialog
        v-if="showBookingDialog"
        :facility="selectedFacility"
        :facilities="facilities"
        @submit-success="handleSubmitBooking"
        @close="showBookingDialog = false"
      />

    </template>
  </AppLayout>
</template>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}
</style>
