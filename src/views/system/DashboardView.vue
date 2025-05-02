<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase' // Import your Supabase client

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
            <v-alert v-if="error" type="error" class="mb-4">
              {{ error }}
            </v-alert>
            <v-progress-linear v-if="loadingFacilities" indeterminate></v-progress-linear>

            <v-row class="mt-4">
              <v-col
                v-for="facility in facilities"
                :key="facility.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card hover @click="openBookingDialog(facility)">
                  <v-img :src="facility.image" height="150" cover class="text-white">
                    <v-card-title class="text-white text-shadow">
                      {{ facility.name }}
                    </v-card-title>
                  </v-img>
                  <v-card-text>
                    <div class="d-flex justify-space-between">
                      <span>Capacity: {{ facility.capacity }}</span>
                      <v-chip :color="facility.available ? 'success' : 'error'" small>
                        {{ facility.available ? 'Available' : 'Booked' }}
                      </v-chip>
                    </div>
                    <div class="mt-2">
                      <v-icon small>mdi-map-marker</v-icon>
                      {{ facility.location }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- My Bookings Tab -->
          <v-window-item value="bookings">
            <v-card class="mt-4">
              <v-data-table
                :headers="bookingHeaders"
                :items="userBookings"
                :items-per-page="10"
                class="elevation-1"
              >
                <template v-slot:item.status="{ item }">
                  <v-chip :color="getStatusColor(item.status)" small>
                    {{ item.status }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon size="small" color="error" @click="cancelBooking(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <!-- Class Schedules Tab -->
          <v-window-item value="schedules">
            <v-row class="mt-4">
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title class="d-flex justify-space-between">
                    <span>Computer Lab Schedules</span>
                    <v-select
                      v-model="selectedLab"
                      :items="computerLabs"
                      item-title="name"
                      item-value="id"
                      label="Select Lab"
                      dense
                      outlined
                      hide-details
                      class="ml-2"
                      style="max-width: 200px"
                    ></v-select>
                  </v-card-title>
                  <v-card-text>
                    <v-sheet v-if="selectedLabSchedule">
                      <v-calendar
                        ref="calendar"
                        v-model="calendarDate"
                        :events="selectedLabSchedule.events"
                        event-overlap-mode="stack"
                        event-color="primary"
                        type="week"
                      ></v-calendar>
                    </v-sheet>
                    <v-alert v-else type="info">
                      Select a computer lab to view its schedule
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title class="d-flex justify-space-between">
                    <span>Lecture Room Schedules</span>
                    <v-select
                      v-model="selectedLectureRoom"
                      :items="lectureRooms"
                      item-title="name"
                      item-value="id"
                      label="Select Room"
                      dense
                      outlined
                      hide-details
                      class="ml-2"
                      style="max-width: 200px"
                    ></v-select>
                  </v-card-title>
                  <v-card-text>
                    <v-sheet v-if="selectedLectureRoomSchedule">
                      <v-calendar
                        ref="calendar"
                        v-model="calendarDate"
                        :events="selectedLectureRoomSchedule.events"
                        event-overlap-mode="stack"
                        event-color="secondary"
                        type="week"
                      ></v-calendar>
                    </v-sheet>
                    <v-alert v-else type="info">
                      Select a lecture room to view its schedule
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>

        <!-- Booking Dialog -->
        <v-dialog v-model="bookingDialog" max-width="600">
          <v-card>
            <v-card-title>
              {{ selectedFacility ? `Book ${selectedFacility.name}` : 'New Booking' }}
            </v-card-title>
            <v-card-text>
              <v-form ref="bookingForm">
                <v-select
                  v-model="bookingForm.facility"
                  :items="facilities"
                  item-title="name"
                  item-value="id"
                  label="Facility"
                  :disabled="!!selectedFacility"
                  required
                ></v-select>
                <v-text-field v-model="bookingForm.purpose" label="Purpose" required></v-text-field>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-date-picker v-model="bookingForm.date" label="Date" required></v-date-picker>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-time-picker
                      v-model="bookingForm.startTime"
                      label="Start Time"
                      format="24hr"
                      required
                    ></v-time-picker>
                    <v-time-picker
                      v-model="bookingForm.endTime"
                      label="End Time"
                      format="24hr"
                      required
                    ></v-time-picker>
                  </v-col>
                </v-row>
                <v-textarea v-model="bookingForm.notes" label="Additional Notes"></v-textarea>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="error" @click="bookingDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="submitBooking">Submit</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </template>
  </AppLayout>
</template>
