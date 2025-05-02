<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/utils/supabase';
import BookingsTab from '@/components/system/admin-tabs/BookingsTab.vue';

const bookings = ref([]);
const loading = ref(false);
const error = ref(null);

async function fetchAllBookings() {
  try {
    loading.value = true;
    const { data, error: supabaseError } = await supabase
      .from('bookings')
      .select(`
        id,
        purpose,
        booking_date,
        start_time,
        end_time,
        status,
        notes,
        facilities (id, name),
        profiles (id, name, email)
      `)
      .order('booking_date', { ascending: true });
      
    if (supabaseError) throw supabaseError;
    bookings.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAllBookings);
</script>

<template>
  <AdminBookingsTab 
    :bookings="bookings"
    :loading="loading"
    :error="error"
  />
</template>