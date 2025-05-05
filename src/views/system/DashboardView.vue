<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'

import FacilitiesTab from '@/components/system/FacilitiesTab.vue'
import BookingsTab from '@/components/system/BookingsTab.vue'
import SchedulesTab from '@/components/system/SchedulesTab.vue'
import BookingsFormDialog from '@/components/system/BookingsFormDialog.vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref('facilities')
const loading = ref(false)
const showBookingDialog = ref(false)
const selectedFacility = ref(null)
const error = ref(null)

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
const loadingFacilities = ref(false)
const loadingBookings = ref(false)

// Load data on component mount
onMounted(async () => {
  await refreshAllData()
})

async function refreshAllData() {
  try {
    loading.value = true
    await Promise.all([fetchFacilities(), fetchUserBookings()])
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function fetchFacilities() {
  try {
    loadingFacilities.value = true
    const { data, error: fetchError } = await supabase.from('facilities').select('*')
    if (fetchError) throw fetchError

    facilities.value = data
    computerLabs.value = data.filter((f) => f.type === 'computer_lab')
    lectureRooms.value = data.filter((f) => f.type === 'lecture_room')
    updateQuickStats()
  } catch (err) {
    error.value = err.message
  } finally {
    loadingFacilities.value = false
  }
}

async function fetchUserBookings() {
  try {
    loadingBookings.value = true
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        purpose,
        date,
        start_time,
        end_time,
        status,
        notes,
        facilities (id, name)
      `,
      )
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (bookingsError) throw bookingsError

    userBookings.value = data.map((booking) => ({
      id: booking.id,
      facilityId: booking.facilities?.id,
      facilityName: booking.facilities?.name || 'Unknown',
      date: booking.date,
      time: `${booking.start_time} - ${booking.end_time}`,
      purpose: booking.purpose,
      status: booking.status,
      notes: booking.notes,
    }))

    updateQuickStats()
  } catch (err) {
    error.value = err.message
  } finally {
    loadingBookings.value = false
  }
}

function updateQuickStats() {
  quickStats.value[0].value = facilities.value?.length.toString() || '0'
  quickStats.value[1].value =
    facilities.value?.filter((f) => f.is_available).length.toString() || '0'
  quickStats.value[2].value = userBookings.value?.length.toString() || '0'
  quickStats.value[3].value =
    userBookings.value?.filter((b) => b.status === 'pending').length.toString() || '0'
}

async function handleSubmitBooking(bookingData) {
  try {
    loading.value = true
    error.value = null

    // Validate booking data
    const requiredFields = ['facility_id', 'date', 'start_time', 'end_time']
    const missingFields = requiredFields.filter((field) => !bookingData[field])
    if (missingFields.length > 0) throw new Error(`Missing fields: ${missingFields.join(', ')}`)

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
    const { data, error: dbError } = await supabase
      .from('bookings')
      .upsert({
        ...bookingData,
        user_id: user.id,
        status: bookingData.status || 'pending',
      })
      .select()

    if (dbError) throw dbError

    await refreshAllData()
    showBookingDialog.value = false
    return { success: true, booking: data[0] }
  } catch (err) {
    error.value = err.message
    return { success: false }
  } finally {
    loading.value = false
  }
}

async function cancelBooking(booking) {
  try {
    loading.value = true
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', booking.id)

    if (deleteError) throw deleteError
    await refreshAllData()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function openBookingDialog(facility) {
  selectedFacility.value = facility
  showBookingDialog.value = true
}
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container fluid>
        <!-- Header Card with hover effect -->
        <v-row class="mb-6 d-flex justify-center align-center">
          <v-col cols="12">
            <v-card
              :color="theme === 'light' ? 'blue-grey-darken-4' : 'blue-grey-darken-4'"
              class="pa-4 header-card"
              hover
            >
              <v-row class="d-flex justify-space-between align-center">
                <v-col class="d-flex flex-column justify-center">
                  <h1 class="text-h4 font-weight-bold mb-1">Welcome To Your Dashboard</h1>
                  <p class="text-subtitle-1 mb-0">Manage your facility bookings</p>
                </v-col>
                <v-col class="d-flex justify-end align-center" cols="auto">
                  <v-btn color="primary" @click="openBookingDialog(null)" class="new-booking-btn">
                    <v-icon start>mdi-plus</v-icon>
                    New Booking
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>

        <!-- Stats Cards with hover effects -->
        <v-row class="mb-6">
          <v-col v-for="stat in quickStats" :key="stat.title" cols="12" sm="6" md="3">
            <v-card class="stat-card" hover>
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

        <!-- Tabs with hover effect on items -->
        <v-tabs v-model="tab" grow class="dashboard-tabs" :touch="false">
          <v-tab
            :touch="false"
            value="facilities"
            class="tab-item"
            :class="{ 'tab-item--active': tab === 'facilities' }"
          >
            Facilities
          </v-tab>
          <v-tab
            :touch="false"
            value="bookings"
            class="tab-item"
            :class="{ 'tab-item--active': tab === 'bookings' }"
          >
            My Bookings
          </v-tab>
          <v-tab
            :touch="false"
            value="schedules"
            class="tab-item"
            :class="{ 'tab-item--active': tab === 'schedules' }"
          >
            Schedules
          </v-tab>
        </v-tabs>

        <v-window :touch="false" v-model="tab">
          <v-window-item value="facilities">
            <FacilitiesTab :facilities="facilities" :error="error" :loading="loadingFacilities" />
          </v-window-item>

          <v-window-item value="bookings">
            <BookingsTab
              :user-bookings="userBookings"
              :facilities="facilities"
              :loading="loadingBookings"
              @cancel-booking="cancelBooking"
              @refresh-bookings="fetchUserBookings"
            />
          </v-window-item>

          <v-window-item value="schedules">
            <SchedulesTab :computer-labs="computerLabs" :lecture-rooms="lectureRooms" />
          </v-window-item>
        </v-window>
      </v-container>

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
.header-card {
  transition: all 0.3s ease;
  transform: translateY(0);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-card {
  transition: all 0.3s ease;
  cursor: pointer;
  transform: translateY(0);
  box-shadow: 10px 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #14161731; /* Blue darken-4 stroke */
  border-radius: 8px; /* Optional: Add rounded corners */
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.new-booking-btn {
  transition: all 0.3s ease;
}

.new-booking-btn:hover {
  transform: scale(1.05);
}

.tab-item {
  transition: all 0.3s ease;
  position: relative;
  padding: 10px 20px;
  border: 2px solid transparent;
  border-radius: 8px;
  background-color: #2c353e; /* Blue darken-4 */
  color: white; /* Ensure text is visible on dark background */
}

.tab-item:hover {
  background-color: #1c2430a1; /* Slightly darker shade for hover effect */
  border-color: var(--v-primary-base);
}

.tab-item--active {
  background-color: var(--v-primary-lighten5);
  border-color: var(--v-primary-base);
  color: var(--v-primary-darken2);
  font-weight: bold;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.tab-item:hover::after {
  width: 80%;
}

/* Add smooth transitions for window items */
.v-window-item {
  transition: opacity 0.3s ease;
}
</style>
