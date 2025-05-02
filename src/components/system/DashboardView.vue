<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')

// Tab control
const tab = ref('facilities')

// Quick stats
const quickStats = ref([
  { title: 'Total Facilities', value: '4', icon: 'mdi-office-building', color: 'indigo', },
  { title: 'Available Now', value: '2', icon: 'mdi-check-circle', color: 'green' },
  { title: 'My Bookings', value: '3', icon: 'mdi-bookmark', color: 'yellow' },
  { title: 'Pending', value: '1', icon: 'mdi-clock', color: 'blue' }
])

// Facilities data
const facilities = ref([
  {
    id: 1,
    name: 'Auditorium',
    capacity: '200 persons',
    location: 'CCIS Ground Floor',
    available: true,
    image: '/img/audi1.jpg',
    type: 'auditorium'
  },
  {
    id: 2,
    name: 'Computer Lab 1',
    capacity: '40 computers',
    location: 'CCIS 2nd Floor',
    available: false,
    image: '/img/comlab1.png',
    type: 'computer_lab'
  },
  {
    id: 3,
    name: 'Lecture Room A',
    capacity: '50 persons',
    location: 'CCIS 3rd Floor',
    available: true,
    image: '/img/lecture room.jpg',
    type: 'lecture_room'
  },
  {
    id: 4,
    name: 'Conference Room',
    capacity: '20 persons',
    location: 'CCIS 4th Floor',
    available: true,
    image: '/img/conference room.jpg',
    type: 'conference_room'
  }
])

// User bookings
const bookingHeaders = ref([
  { title: 'Facility', key: 'facilityName' },
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'time' },
  { title: 'Purpose', key: 'purpose' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
])

const userBookings = ref([
  {
    id: 1,
    facilityId: 1,
    facilityName: 'Auditorium',
    date: '2023-11-15',
    time: '13:00 - 15:00',
    purpose: 'Faculty Meeting',
    status: 'Approved'
  },
  {
    id: 2,
    facilityId: 3,
    facilityName: 'Lecture Room A',
    date: '2023-11-16',
    time: '09:00 - 11:00',
    purpose: 'Student Workshop',
    status: 'Pending'
  },
  {
    id: 3,
    facilityId: 4,
    facilityName: 'Conference Room',
    date: '2023-11-17',
    time: '14:00 - 16:00',
    purpose: 'Thesis Defense',
    status: 'Approved'
  }
])

// Class schedules data
const computerLabs = ref([
  { id: 1, name: 'Computer Lab 1' },
  { id: 2, name: 'Computer Lab 2' },
  { id: 3, name: 'Computer Lab 3' }
])

const lectureRooms = ref([
  { id: 1, name: 'Lecture Room A' },
  { id: 2, name: 'Lecture Room B' },
  { id: 3, name: 'Lecture Room C' }
])

const selectedLab = ref(null)
const selectedLectureRoom = ref(null)
const calendarDate = ref(new Date().toISOString().substr(0, 10))

// Sample schedule data (in a real app, this would come from an API)
const labSchedules = ref({
  1: {
    name: 'Computer Lab 1',
    events: [
      {
        name: 'CS 101 - Intro to Programming',
        start: '2023-11-13 08:00',
        end: '2023-11-13 10:00',
        color: 'primary'
      },
      {
        name: 'IT 201 - Database Systems',
        start: '2023-11-13 13:00',
        end: '2023-11-13 15:00',
        color: 'primary'
      },
      // More events...
    ]
  },
  // More labs...
})

const lectureRoomSchedules = ref({
  1: {
    name: 'Lecture Room A',
    events: [
      {
        name: 'Math 101 - Calculus',
        start: '2023-11-13 09:00',
        end: '2023-11-13 11:00',
        color: 'secondary'
      },
      {
        name: 'Physics 101 - Mechanics',
        start: '2023-11-13 14:00',
        end: '2023-11-13 16:00',
        color: 'secondary'
      },
      // More events...
    ]
  },
  // More rooms...
})

const selectedLabSchedule = computed(() => {
  return selectedLab.value ? labSchedules.value[selectedLab.value] : null
})

const selectedLectureRoomSchedule = computed(() => {
  return selectedLectureRoom.value ? lectureRoomSchedules.value[selectedLectureRoom.value] : null
})

// Booking dialog
const bookingDialog = ref(false)
const selectedFacility = ref(null)
const bookingForm = ref({
  facility: null,
  purpose: '',
  date: null,
  startTime: null,
  endTime: null,
  notes: ''
})

function openBookingDialog(facility) {
  selectedFacility.value = facility
  bookingForm.value.facility = facility ? facility.id : null
  bookingDialog.value = true
}

function submitBooking() {
  // In a real app, this would send data to your backend
  const newBooking = {
    id: userBookings.value.length + 1,
    facilityId: bookingForm.value.facility,
    facilityName: facilities.value.find(f => f.id === bookingForm.value.facility).name,
    date: bookingForm.value.date,
    time: `${bookingForm.value.startTime} - ${bookingForm.value.endTime}`,
    purpose: bookingForm.value.purpose,
    status: 'Pending'
  }
  
  userBookings.value.push(newBooking)
  bookingDialog.value = false
  resetBookingForm()
}

function cancelBooking(booking) {
  const index = userBookings.value.findIndex(b => b.id === booking.id)
  if (index !== -1) {
    userBookings.value.splice(index, 1)
  }
}

function resetBookingForm() {
  bookingForm.value = {
    facility: null,
    purpose: '',
    date: null,
    startTime: null,
    endTime: null,
    notes: ''
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Approved': return 'green'
    case 'Pending': return 'orange'
    case 'Rejected': return 'red'
    default: return 'gray'
  }
}

// Initialize with today's date
onMounted(() => {
  bookingForm.value.date = new Date().toISOString().substr(0, 10)
})
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
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card class="pa-4" :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'">
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

        <v-row class="mb-6">
  <v-col v-for="stat in quickStats" :key="stat.title" cols="12" sm="6" md="3">
    <v-hover v-slot="{ isHovering, props }">
      <v-card
        v-bind="props"
        :elevation="isHovering ? 8 : 2"
        class="transition-swing"
      >
        <v-card-text class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-1">{{ stat.title }}</div>
            <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
          </div>
          <v-icon :color="stat.color" size="48">{{ stat.icon }}</v-icon>
        </v-card-text>
      </v-card>
    </v-hover>
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
            <v-row class="mt-4">
              <v-col v-for="facility in facilities" :key="facility.id" cols="12" sm="6" md="4" lg="3">
                <v-card hover @click="openBookingDialog(facility)">
                  <v-img
                    :src="facility.image"
                    height="150"
                    cover
                    class="text-white"
                  >
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
                  <v-btn
                    icon
                    size="small"
                    color="error"
                    @click="cancelBooking(item)"
                  >
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
                      style="max-width: 200px;"
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
                      style="max-width: 200px;"
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
                <v-text-field
                  v-model="bookingForm.purpose"
                  label="Purpose"
                  required
                ></v-text-field>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-date-picker
                      v-model="bookingForm.date"
                      label="Date"
                      required
                    ></v-date-picker>
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
                <v-textarea
                  v-model="bookingForm.notes"
                  label="Additional Notes"
                ></v-textarea>
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