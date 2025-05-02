<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'
import AdminFacilitiesTab from '@/components/system/admin-tabs/AdminFacilitiesTab.vue'
import AdminBookingsTab from '@/components/system/admin-tabs/AdminBookingsTab.vue'
import AdminUsersTab from '@/components/system/admin-tabs/AdminUsersTab.vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref('facilities')

// Data refs
const quickStats = ref([
  { title: 'Total Facilities', value: '0', icon: 'mdi-office-building', color: 'indigo' },
  { title: 'Available Now', value: '0', icon: 'mdi-check-circle', color: 'green' },
  { title: 'Total Bookings', value: '0', icon: 'mdi-bookmark', color: 'orange' },
  { title: 'Pending Approvals', value: '0', icon: 'mdi-clock', color: 'blue' },
])

const facilities = ref([])
const allBookings = ref([])
const users = ref([])
const loading = ref({
  facilities: false,
  bookings: false,
  users: false,
})
const error = ref(null)

// Facility management dialog
const facilityDialog = ref(false)
const facilityForm = ref({
  id: null,
  name: '',
  type: 'computer_lab',
  capacity: '',
  location: '',
  is_available: true,
  image: '',
})

// Booking approval dialog
const approvalDialog = ref(false)
const selectedBooking = ref(null)

// Fetch data from Supabase
async function fetchFacilities() {
  try {
    loading.value.facilities = true
    const { data, error: fetchError } = await supabase.from('facilities').select('*')

    if (fetchError) throw fetchError

    facilities.value = data
    updateQuickStats()
  } catch (err) {
    error.value = `Error fetching facilities: ${err.message}`
  } finally {
    loading.value.facilities = false
  }
}

async function fetchAllBookings() {
  try {
    loading.value.bookings = true
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `id, purpose, booking_date, start_time, end_time, status, notes, 
               facilities (id, name), profiles (id, full_name, email)`,
      )
      .order('booking_date', { ascending: true })

    if (fetchError) throw fetchError

    allBookings.value = data.map((booking) => ({
      id: booking.id,
      facilityId: booking.facilities.id,
      facilityName: booking.facilities.name,
      userId: booking.profiles.id,
      userName: booking.profiles.full_name,
      userEmail: booking.profiles.email,
      date: booking.booking_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      purpose: booking.purpose,
      status: booking.status,
      notes: booking.notes,
    }))

    updateQuickStats()
  } catch (err) {
    error.value = `Error fetching bookings: ${err.message}`
  } finally {
    loading.value.bookings = false
  }
}

async function fetchUsers() {
  try {
    loading.value.users = true
    const { data, error: fetchError } = await supabase.from('profiles').select('*')

    if (fetchError) throw fetchError

    users.value = data
  } catch (err) {
    error.value = `Error fetching users: ${err.message}`
  } finally {
    loading.value.users = false
  }
}

function updateQuickStats() {
  quickStats.value[0].value = facilities.value.length.toString()
  quickStats.value[1].value = facilities.value.filter((f) => f.is_available).length.toString()
  quickStats.value[2].value = allBookings.value.length.toString()
  quickStats.value[3].value = allBookings.value
    .filter((b) => b.status === 'pending')
    .length.toString()
}

// Facility CRUD operations
function openFacilityDialog(facility = null) {
  if (facility) {
    facilityForm.value = { ...facility }
  } else {
    facilityForm.value = {
      id: null,
      name: '',
      type: 'computer_lab',
      capacity: '',
      location: '',
      is_available: true,
      image: '',
    }
  }
  facilityDialog.value = true
}

async function saveFacility() {
  try {
    if (facilityForm.value.id) {
      // Update existing facility
      const { error } = await supabase
        .from('facilities')
        .update(facilityForm.value)
        .eq('id', facilityForm.value.id)

      if (error) throw error
    } else {
      // Create new facility
      const { error } = await supabase.from('facilities').insert(facilityForm.value)

      if (error) throw error
    }

    await fetchFacilities()
    facilityDialog.value = false
  } catch (err) {
    error.value = `Error saving facility: ${err.message}`
  }
}

async function deleteFacility(facilityId) {
  try {
    const { error } = await supabase.from('facilities').delete().eq('id', facilityId)

    if (error) throw error

    await fetchFacilities()
  } catch (err) {
    error.value = `Error deleting facility: ${err.message}`
  }
}

// Booking management
function openApprovalDialog(booking) {
  selectedBooking.value = booking
  approvalDialog.value = true
}

async function updateBookingStatus(status) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', selectedBooking.value.id)

    if (error) throw error

    await fetchAllBookings()
    approvalDialog.value = false
  } catch (err) {
    error.value = `Error updating booking: ${err.message}`
  }
}

// Initialize
onMounted(async () => {
  await fetchFacilities()
  await fetchAllBookings()
  await fetchUsers()

  // Set up real-time subscriptions
  const facilitiesChannel = supabase
    .channel('admin_facilities_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () =>
      fetchFacilities(),
    )
    .subscribe()

  const bookingsChannel = supabase
    .channel('admin_bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () =>
      fetchAllBookings(),
    )
    .subscribe()

  const usersChannel = supabase
    .channel('admin_users_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
    .subscribe()

  // Clean up on unmount
  onUnmounted(() => {
    supabase.removeChannel(facilitiesChannel)
    supabase.removeChannel(bookingsChannel)
    supabase.removeChannel(usersChannel)
  })
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container fluid>
        <!-- Header Section -->
        <v-row class="mb-4 mb-sm-6">
          <v-col cols="12">
            <v-card
              class="pa-3 pa-sm-4"
              :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'"
            >
              <div
                class="d-flex flex-column flex-sm-row justify-space-between align-center align-sm-start"
              >
                <div class="text-center text-sm-left mb-2 mb-sm-0">
                  <h1 class="text-h5 text-sm-h4 font-weight-bold">CCIS BookMate Admin Dashboard</h1>
                  <p class="text-subtitle-2 text-sm-subtitle-1 mt-1">
                    Manage facilities, bookings, and users
                  </p>
                </div>
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
          <v-tab value="bookings">All Bookings</v-tab>
          <v-tab value="users">Users</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Facilities Tab -->
          <v-window-item value="facilities">
            <AdminFacilitiesTab
              :facilities="facilities"
              :loading="loading.facilities"
              :error="error"
              @edit-facility="openFacilityDialog"
              @delete-facility="deleteFacility"
            />
          </v-window-item>

          <!-- Bookings Tab -->
          <v-window-item value="bookings">
            <AdminBookingsTab
              :bookings="allBookings"
              :loading="loading.bookings"
              :error="error"
              @approve-booking="openApprovalDialog"
              @reject-booking="
                (id) => {
                  selectedBooking = { id }
                  updateBookingStatus('rejected')
                }
              "
            />
          </v-window-item>

          <!-- Users Tab -->
          <v-window-item value="users">
            <AdminUsersTab
              :users="users"
              :loading="loading.users"
              :error="error"
              @edit-user="(user) => console.log('Edit user', user)"
              @delete-user="(id) => console.log('Delete user', id)"
            />
          </v-window-item>
        </v-window>

        <!-- Facility Management Dialog -->
        <v-dialog v-model="facilityDialog" max-width="600">
          <v-card>
            <v-card-title>
              {{ facilityForm.id ? 'Edit Facility' : 'Add New Facility' }}
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field v-model="facilityForm.name" label="Name" required></v-text-field>
                <v-select
                  v-model="facilityForm.type"
                  :items="[
                    { text: 'Computer Lab', value: 'computer_lab' },
                    { text: 'Lecture Room', value: 'lecture_room' },
                  ]"
                  label="Type"
                  required
                ></v-select>
                <v-text-field
                  v-model="facilityForm.capacity"
                  label="Capacity"
                  type="number"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="facilityForm.location"
                  label="Location"
                  required
                ></v-text-field>
                <v-switch v-model="facilityForm.is_available" label="Available"></v-switch>
                <v-text-field v-model="facilityForm.image" label="Image URL"></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="error" @click="facilityDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="saveFacility">Save</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Booking Approval Dialog -->
        <v-dialog v-model="approvalDialog" max-width="500">
          <v-card>
            <v-card-title>Booking Approval</v-card-title>
            <v-card-text>
              <p><strong>Facility:</strong> {{ selectedBooking?.facilityName }}</p>
              <p>
                <strong>User:</strong> {{ selectedBooking?.userName }} ({{
                  selectedBooking?.userEmail
                }})
              </p>
              <p><strong>Date:</strong> {{ selectedBooking?.date }}</p>
              <p><strong>Time:</strong> {{ selectedBooking?.time }}</p>
              <p><strong>Purpose:</strong> {{ selectedBooking?.purpose }}</p>
              <p><strong>Notes:</strong> {{ selectedBooking?.notes || 'None' }}</p>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="error" @click="updateBookingStatus('rejected')">Reject</v-btn>
              <v-btn color="primary" @click="updateBookingStatus('approved')">Approve</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </template>
  </AppLayout>
</template>