import { supabase } from '@/utils/supabase'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthUserStore = defineStore('authUser', () => {
  // States
  const userData = ref(null)
  const isLoading = ref(false)

  // Getters
  const isLoggedIn = computed(() => !!userData.value)
  const isAdmin = computed(() => userData.value?.is_admin || false)

  // Reset State Action
  function $reset() {
    userData.value = null
  }

  // Actions
  async function isAuthenticated() {
    try {
      isLoading.value = true
      const { data, error } = await supabase.auth.getSession()
      
      if (error) throw error
      if (!data.session) return false
      
      // Store basic user data
      userData.value = {
        id: data.session.user.id,
        email: data.session.user.email,
        ...data.session.user.user_metadata,
        is_admin: data.session.user.user_metadata?.is_admin || false
      }
      
      return true
    } catch (error) {
      console.error('Authentication check failed:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function getUserInformation() {
    try {
      isLoading.value = true
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) throw new Error('No authenticated user')
      
      // Update user data from auth metadata
      userData.value = {
        id: user.id,
        email: user.email,
        ...user.user_metadata,
        is_admin: user.user_metadata?.is_admin || false
      }
      
      return userData.value
    } catch (error) {
      console.error('Failed to get user information:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    userData,
    isLoading,
    isLoggedIn,
    isAdmin,
    $reset,
    isAuthenticated,
    getUserInformation
  }
})