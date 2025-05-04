<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'
import AdminFacilitiesTab from '@/components/system/admin-tabs/AdminFacilitiesTab.vue'
import AdminBookingsTab from '@/components/system/admin-tabs/AdminBookingsTab.vue'
import AdminUsersTab from '@/components/system/admin-tabs/AdminUsersTab.vue'

const theme = ref(localStorage.getItem('theme') ?? 'light')
const tab = ref('facilities')
const channels = ref([])

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
const successMessage = ref(null)

// Computed properties
const globalLoading = computed(() => 
  loading.value.facilities || loading.value.bookings || loading.value.users
)

// Fetch data from Supabase
async function fetchFacilities() {
  try {
    error.value = null
    loading.value.facilities = true
    const { data, error: fetchError } = await supabase.from('facilities').select('*')
    if (fetchError) throw fetchError
    facilities.value = data
    updateQuickStats()
  } catch (err) {
    error.value = `Error fetching facilities: ${err.message}`
    throw err
  } finally {
    loading.value.facilities = false
  }
}

async function fetchAllBookings() {
  try {
    loading.value.bookings = true
    error.value = null
    
    // 1. Fetch bookings with facility info
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, purpose, booking_date, start_time, end_time, status, notes, 
        facilities (id, name), user_id
      `)
      .order('booking_date', { ascending: true })

    if (bookingsError) throw bookingsError

    // 2. Get unique user IDs from bookings
    const userIds = [...new Set(bookingsData.map(booking => booking.user_id))]

    // 3. Fetch user data in a single query
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, username, full_name') // Use actual columns you have
      .in('id', userIds)

    if (userError) throw userError

    // 4. Map bookings with user info
    allBookings.value = bookingsData.map(booking => {
      const user = userData?.find(u => u.id === booking.user_id) || {}
      return {
        id: booking.id,
        facilityId: booking.facilities?.id,
        facilityName: booking.facilities?.name,
        userId: booking.user_id,
        userName: user.username || user.full_name || user.email.split('@')[0], // Fallback chain
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
    console.error('Booking fetch error:', err)
  } finally {
    loading.value.bookings = false
  }
}

async function fetchUsers() {
  try {
    loading.value.users = true;
    error.value = null;

    // Query only columns that actually exist
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, username, full_name, avatar_url');

    if (fetchError) throw fetchError;

    users.value = data.map(user => ({
      id: user.id,
      email: user.email,
      // Use whatever naming fields you have available
      name: user.full_name || user.username || user.email.split('@')[0],
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      avatar: user.avatar_url
    }));

  } catch (err) {
    error.value = `Error fetching users: ${err.message}`;
    console.error('User fetch error:', err);
  } finally {
    loading.value.users = false;
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

async function handleBookingStatusUpdate({ id, status }) {
  try {
    error.value = null
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (updateError) throw updateError
    successMessage.value = 'Booking status updated successfully'
    await fetchAllBookings()
  } catch (err) {
    error.value = `Error updating booking: ${err.message}`
    throw err
  }
}

async function saveFacility(facilityData) {
  try {
    if (!facilityData.name) {
      throw new Error('Facility name is required')
    }

    error.value = null
    loading.value.facilities = true

    let result
    if (facilityData.id) {
      const { data, error: updateError } = await supabase
        .from('facilities')
        .update(facilityData)
        .eq('id', facilityData.id)
        .select()

      if (updateError) throw updateError
      result = data[0]
      successMessage.value = 'Facility updated successfully'
    } else {
      const { data, error: insertError } = await supabase
        .from('facilities')
        .insert(facilityData)
        .select()

      if (insertError) throw insertError
      result = data[0]
      successMessage.value = 'Facility created successfully'
    }

    await fetchFacilities()
    return result
  } catch (err) {
    error.value = `Error saving facility: ${err.message}`
    throw err
  } finally {
    loading.value.facilities = false
  }
}

async function deleteFacility(facilityId) {
  try {
    error.value = null
    loading.value.facilities = true
    const { error: deleteError } = await supabase
      .from('facilities')
      .delete()
      .eq('id', facilityId)

    if (deleteError) throw deleteError
    successMessage.value = 'Facility deleted successfully'
    await fetchFacilities()
  } catch (err) {
    error.value = `Error deleting facility: ${err.message}`
    throw err
  } finally {
    loading.value.facilities = false
  }
}

function clearMessages() {
  error.value = null
  successMessage.value = null
}

// Initialize
onMounted(async () => {
  try {
    await Promise.all([
      fetchFacilities(),
      fetchAllBookings(),
      fetchUsers()
    ])

    const facilitiesChannel = supabase
      .channel('admin_facilities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () => {
        fetchFacilities()
      })
      .subscribe((status, err) => {
        if (err) error.value = `Facilities subscription error: ${err.message}`
      })

    const bookingsChannel = supabase
      .channel('admin_bookings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchAllBookings()
      })
      .subscribe((status, err) => {
        if (err) error.value = `Bookings subscription error: ${err.message}`
      })

    channels.value = [facilitiesChannel, bookingsChannel]
  } catch (err) {
    error.value = `Initialization error: ${err.message}`
  }
})

onUnmounted(() => {
  channels.value.forEach(channel => {
    if (channel) supabase.removeChannel(channel)
  })
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container fluid>
        <!-- Messages Section -->
        <v-row v-if="error || successMessage">
          <v-col cols="12">
            <v-alert
              v-if="error"
              type="error"
              dismissible
              @click:close="clearMessages"
            >
              {{ error }}
            </v-alert>
            <v-alert
              v-if="successMessage"
              type="success"
              dismissible
              @click:close="clearMessages"
            >
              {{ successMessage }}
            </v-alert>
          </v-col>
        </v-row>

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
                <v-progress-circular
                  v-if="globalLoading"
                  indeterminate
                  color="primary"
                  size="24"
                  width="3"
                />
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
              @refresh="fetchUsers"
            />
          </v-window-item>
        </v-window>
      </v-container>
    </template>
  </AppLayout>
</template>

<style scoped>
.v-progress-circular {
  margin-left: auto;
}
</style>