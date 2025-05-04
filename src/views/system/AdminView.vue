<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { supabase } from '@/utils/supabase'
import AdminFacilitiesTab from '@/components/system/admin-tabs/AdminFacilitiesTab.vue'
import AdminBookingsTab from '@/components/system/admin-tabs/AdminBookingsTab.vue'
import AdminUsersTab from '@/components/system/admin-tabs/AdminUsersTab.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Admin state
const isAdmin = ref(false)
const userProfile = ref(null)

// Theme and UI state
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

// Loading and error states
const loading = ref({
  facilities: false,
  bookings: false,
  users: false,
})
const error = ref(null)
const successMessage = ref(null)

// Computed properties
const globalLoading = computed(() => 
  Object.values(loading.value).some(state => state)
)

const pendingApprovalsCount = computed(() => 
  allBookings.value.filter(b => b.status === 'pending').length
)

// Data fetching functions
async function fetchFacilities() {
  try {
    error.value = null
    loading.value.facilities = true
    const { data, error: fetchError } = await supabase
      .from('facilities')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) throw fetchError
    facilities.value = data
    updateQuickStats()
  } catch (err) {
    error.value = `Error fetching facilities: ${err.message}`
    console.error('Facilities fetch error:', err)
  } finally {
    loading.value.facilities = false
  }
}

async function fetchAllBookings() {
  try {
    loading.value.bookings = true
    error.value = null
    
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, 
        purpose, 
        date, 
        start_time, 
        end_time, 
        status, 
        notes, 
        created_at,
        facilities (id, name, is_available),
        user_id
      `)
      .order('date', { ascending: true })

    if (bookingsError) throw bookingsError

    const userIds = [...new Set(bookingsData.map(booking => booking.user_id))]

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, username, full_name, role')
      .in('id', userIds)

    if (userError) throw userError

    allBookings.value = bookingsData.map(booking => ({
      id: booking.id,
      facilityId: booking.facilities?.id,
      facilityName: booking.facilities?.name || 'Unknown Facility',
      userId: booking.user_id,
      userName: userData.find(u => u.id === booking.user_id)?.full_name || 
               userData.find(u => u.id === booking.user_id)?.username || 
               userData.find(u => u.id === booking.user_id)?.email.split('@')[0] || 
               'Unknown User',
      userEmail: userData.find(u => u.id === booking.user_id)?.email || 'No email',
      userRole: userData.find(u => u.id === booking.user_id)?.role || 'user',
      date: booking.date,
      time: `${booking.start_time} - ${booking.end_time}`,
      purpose: booking.purpose || 'No purpose specified',
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.created_at
    }))

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
    loading.value.users = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, username, full_name, avatar_url, updated_at, role')
      .order('updated_at', { ascending: false })

    if (fetchError) throw fetchError

    users.value = data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name || user.username || user.email.split('@')[0],
      avatar: user.avatar_url,
      role: user.role || 'user',
      createdAt: user.updated_at,
    }))

  } catch (err) {
    error.value = `Error fetching users: ${err.message}`
    console.error('User fetch error:', err)
  } finally {
    loading.value.users = false
  }
}

function updateQuickStats() {
  quickStats.value[0].value = facilities.value.length.toString()
  quickStats.value[1].value = facilities.value.filter(f => f.is_available).length.toString()
  quickStats.value[2].value = allBookings.value.length.toString()
  quickStats.value[3].value = pendingApprovalsCount.value.toString()
}

// Data mutation functions
async function handleBookingStatusUpdate({ id, status }) {
  try {
    error.value = null
    loading.value.bookings = true

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (updateError) throw updateError

    successMessage.value = `Booking ${status} successfully`
    
    // Optimistic update
    const bookingIndex = allBookings.value.findIndex(b => b.id === id)
    if (bookingIndex !== -1) {
      allBookings.value[bookingIndex].status = status
      updateQuickStats()
    }
    
  } catch (err) {
    error.value = `Failed to update booking: ${err.message}`
    console.error('Booking update error:', err)
  } finally {
    loading.value.bookings = false
    await fetchAllBookings()
  }
}

// Other functions
function clearMessages() {
  error.value = null
  successMessage.value = null
}

// Lifecycle hooks
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    userProfile.value = profile
    isAdmin.value = profile.role === 'admin'

    if (!isAdmin.value) {
      router.push('/')
      return
    }

    await Promise.all([
      fetchFacilities(),
      fetchAllBookings(),
      fetchUsers()
    ])

    // Set up realtime subscriptions
    const facilitiesChannel = supabase
      .channel('admin_facilities_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'facilities'
      }, () => fetchFacilities())
      .subscribe()

    const bookingsChannel = supabase
      .channel('admin_bookings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => fetchAllBookings())
      .subscribe()

    channels.value = [facilitiesChannel, bookingsChannel]
  } catch (err) {
    error.value = `Initialization error: ${err.message}`
    console.error('Initialization error:', err)
  }
})

onUnmounted(() => {
  channels.value.forEach(channel => {
    supabase.removeChannel(channel)
  })
})
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container fluid class="pa-4 pa-sm-6">
        <!-- Messages Section -->
        <v-row v-if="error || successMessage" class="mb-4">
          <v-col cols="12">
            <v-alert
              v-if="error"
              type="error"
              dismissible
              @click:close="clearMessages"
              class="mb-2"
            >
              {{ error }}
            </v-alert>
            <v-alert
              v-if="successMessage"
              type="success"
              dismissible
              @click:close="clearMessages"
              class="mb-2"
            >
              {{ successMessage }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Header Section -->
        <v-row class="mb-4 mb-sm-6">
          <v-col cols="12">
            <v-card
              class="pa-4"
              :color="theme === 'light' ? 'blue-grey-lighten-4' : 'blue-grey-darken-4'"
            >
              <div class="d-flex justify-space-between align-center">
                <div>
                  <h1 class="text-h5 text-sm-h4 font-weight-bold">Admin Dashboard</h1>
                  <p class="text-subtitle-1 mt-1">
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
          <v-col 
            v-for="stat in quickStats" 
            :key="stat.title" 
            cols="12" 
            sm="6" 
            md="3"
          >
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
        <v-tabs v-model="tab" grow class="mb-6">
          <v-tab value="facilities">
            <v-icon start>mdi-office-building</v-icon>
            Facilities
          </v-tab>
          <v-tab value="bookings">
            <v-icon start>mdi-bookmark</v-icon>
            Bookings
          </v-tab>
          <v-tab value="users">
            <v-icon start>mdi-account-group</v-icon>
            Users
          </v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Facilities Tab -->
          <v-window-item value="facilities">
            <AdminFacilitiesTab
              :facilities="facilities"
              :loading="loading.facilities"
              :error="error"
              @refresh="fetchFacilities"
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

.v-tab {
  min-width: 120px;
}
</style>