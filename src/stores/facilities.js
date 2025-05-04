import { defineStore } from 'pinia';
import { ref } from 'vue';
import { computed } from 'vue';
import { supabase } from '@//utils/supabase';

export const useFacilitiesStore = defineStore('facilities', () => {
  // State
  const facilities = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Actions
  async function getFacilitiesFromApi() {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: sbError } = await supabase
        .from('facilities')
        .select('*');

      if (sbError) throw sbError;

      facilities.value = data;
    } catch (err) {
      error.value = err.message;
      console.error('Supabase error fetching facilities:', err);
      facilities.value = [];
    } finally {
      loading.value = false;
    }
  }

  // Getters
  const isEmpty = computed(() => facilities.value.length === 0);
  const availableFacilities = computed(() => 
    facilities.value.filter(f => f.is_available)
  );

  return {
    // State
    facilities,
    loading,
    error,
    
    // Actions
    getFacilitiesFromApi,
    
    // Getters
    isEmpty,
    availableFacilities
  };
});