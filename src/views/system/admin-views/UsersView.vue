<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/utils/supabase';
import AdminUsersTab from '@/components/admin/AdminUsersTab.vue';

const users = ref([]);
const loading = ref(false);
const error = ref(null);

async function fetchAllUsers() {
  try {
    loading.value = true;
    const { data, error: supabaseError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (supabaseError) throw supabaseError;
    users.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAllUsers);
</script>

<template>
  <AdminUsersTab 
    :users="users"
    :loading="loading"
    :error="error"
  />
</template>