<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/utils/supabase';
import FacilitiesTab from '@/components/admin/FacilitiesTab.vue';

const facilities = ref([]);
const loading = ref(false);
const error = ref(null);

async function fetchFacilities() {
  try {
    loading.value = true;
    const { data, error: supabaseError } = await supabase.from('facilities').select('*');
    if (supabaseError) throw supabaseError;
    facilities.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchFacilities);
</script>

<template>
  <FacilitiesTab 
    :facilities="facilities"
    :loading="loading"
    :error="error"
  />
</template>