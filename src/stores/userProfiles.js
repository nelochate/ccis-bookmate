import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthUsersStore = defineStore('authUsers', () => {
  // States
  const users = ref([])
  const currentUser = ref(null)

  // Reset State Action
  function $reset() {
    users.value = []
    currentUser.value = null
  }

  // Retrieve All Users (requires admin privileges)
  async function fetchUsers() {
    try {
      // Note: This requires appropriate permissions in your Supabase setup
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, raw_user_meta_data, updated_at, last_sign_in_at')
        .order('updated_at', { ascending: false })

      if (error) throw error
      
      // Transform data to match your expected structure
      users.value = data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.name || 
              user.raw_user_meta_data?.full_name || 
              user.email.split('@')[0], // Fallback to first part of email
        avatar_url: user.raw_user_meta_data?.avatar_url,
        updated_at: user.updated_at,
        // Add any additional fields you need
        is_admin: user.raw_user_meta_data?.is_admin || false
      }))
      
      return { data: users.value, error: null }
    } catch (error) {
      console.error('Error fetching users:', error)
      return { data: null, error }
    }
  }

  // Get Current User's Data
  async function fetchCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) return { data: null, error: 'No authenticated user' }
      if (authError) throw authError

      // Get additional user data from auth.users
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, raw_user_meta_data')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      currentUser.value = {
        id: data.id,
        email: data.email,
        name: data.raw_user_meta_data?.name || 
              data.raw_user_meta_data?.full_name || 
              data.email.split('@')[0],
        avatar_url: data.raw_user_meta_data?.avatar_url,
        is_admin: data.raw_user_meta_data?.is_admin || false
      }
      
      return { data: currentUser.value, error: null }
    } catch (error) {
      console.error('Error fetching current user:', error)
      return { data: null, error }
    }
  }

  // Update User Data
  async function updateUser(userData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Update auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...userData,
          // Preserve existing metadata
          ...(currentUser.value?.raw_user_meta_data || {})
        }
      })

      if (error) throw error
      
      // Refresh local state
      await fetchCurrentUser()
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user:', error)
      return { data: null, error }
    }
  }

  // Set Admin Status (requires special permissions)
  async function setAdminStatus(userId, isAdmin) {
    try {
      // This requires a custom function or direct database access
      // as Supabase doesn't allow directly updating auth.users
      const { data, error } = await supabase.rpc('set_admin_status', {
        user_id: userId,
        is_admin: isAdmin
      })

      if (error) throw error
      
      // Update local state if needed
      if (currentUser.value?.id === userId) {
        currentUser.value.is_admin = isAdmin
      }
      
      // Refresh users list
      await fetchUsers()
      
      return { data, error: null }
    } catch (error) {
      console.error('Error setting admin status:', error)
      return { data: null, error }
    }
  }

  return {
    users,
    currentUser,
    $reset,
    fetchUsers,
    fetchCurrentUser,
    updateUser,
    setAdminStatus
  }
})