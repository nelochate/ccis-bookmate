<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  users: false
})
const error = ref(null)

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
      .select(`id, purpose, booking_date, start_time, end_time, status, notes, 
               facilities (id, name), user_id`)
      .order('booking_date', { ascending: true })

    if (fetchError) throw fetchError

    // Get user data for all bookings in one query
    const userIds = data.map(booking => booking.user_id)
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('id, email, raw_user_meta_data')
      .in('id', userIds)

    allBookings.value = data.map(booking => {
      const user = userData?.find(u => u.id === booking.user_id) || {}
      return {
        id: booking.id,
        facilityId: booking.facilities?.id,
        facilityName: booking.facilities?.name,
        userId: booking.user_id,
        userName: user.raw_user_meta_data?.name || 
                 user.raw_user_meta_data?.full_name || 
                 user.email,
        userEmail: user.email,
        date: booking.booking_date,
        time: `${booking.start_time} - ${booking.end_time}`,
        purpose: booking.purpose,
        status: booking.status,
        notes: booking.notes,
      }
    })

    updateQuickStats()
  } catch (err) {
    error.value = `Error fetching bookings: ${err.message}`
  } finally {
    loading.value.bookings = false
  }
}

async function fetchUsers() {
  try {
    loading.value.users = true;
    
    // Query the user_profiles view
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, created_at, last_sign_in_at, avatar_url');
    
    if (error) throw error;
    
    users.value = data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0], // Fallback
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      avatar: user.avatar_url  // Optional
    }));
    
  } catch (err) {
    error.value = `Error fetching users: ${err.message}`;
  } finally {
    loading.value.users = false;
  }
}

function updateQuickStats() {
  quickStats.value[0].value = facilities.value.length.toString()
  quickStats.value[1].value = facilities.value.filter(f => f.is_available).length.toString()
  quickStats.value[2].value = allBookings.value.length.toString()
  quickStats.value[3].value = allBookings.value.filter(b => b.status === 'pending').length.toString()
}

// Handle booking status updates from child component
async function handleBookingStatusUpdate({ id, status }) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    await fetchAllBookings()
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, fetchFacilities)
    .subscribe()

  const bookingsChannel = supabase
    .channel('admin_bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchAllBookings)
    .subscribe()

  // Note: Can't subscribe directly to auth.users changes - need to use auth channel
  // or create a function that calls fetchUsers when auth changes

  // Clean up on unmount
  onUnmounted(() => {
    supabase.removeChannel(facilitiesChannel)
    supabase.removeChannel(bookingsChannel)
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
              <div class="d-flex flex-column flex-sm-row justify-space-between align-center align-sm-start">
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
              @refresh="fetchFacilities"
              @save-facility="saveFacility"
              @delete-facility="deleteFacility"
            />
          </v-window-item>

          <!-- Bookings Tab -->
          <v-window-item value="bookings">
            <AdminBookingsTab
              :bookings="allBookings"
              :loading="loading.bookings"
              :error="error"
              @update-booking-status="handleBookingStatusUpdate"
            />
          </v-window-item>

          <!-- Users Tab -->
          <v-window-item value="users">
            <AdminUsersTab
              :users="users"
              :loading="loading.users"
              :error="error"
            />
          </v-window-item>
        </v-window>
      </v-container>
    </template>
  </AppLayout>
</template>