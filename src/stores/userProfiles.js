import { supabase } from '@/utils/supabase'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProfilesStore = defineStore('profiles', () => {
  // States
  const profiles = ref([])
  const currentProfile = ref(null)

  // Reset State Action
  function $reset() {
    profiles.value = []
    currentProfile.value = null
  }

  // Retrieve All Profiles
  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      profiles.value = data
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      return { data: null, error }
    }
  }

  // Get Current User's Profile
  async function fetchCurrentProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: 'No authenticated user' }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      currentProfile.value = data
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching current profile:', error)
      return { data: null, error }
    }
  }

  // Create or Update Profile
  async function saveProfile(profileData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // If profile exists, update it
      if (profileData.id) {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileData.id)
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      }
      // Otherwise create new profile
      else {
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            ...profileData
          }])
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      return { data: null, error }
    }
  }

  // Set Admin Status
  async function setAdminStatus(userId, isAdmin) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      
      // Update local state if needed
      if (currentProfile.value?.id === userId) {
        currentProfile.value.is_admin = isAdmin
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error setting admin status:', error)
      return { data: null, error }
    }
  }

  return {
    profiles,
    currentProfile,
    $reset,
    fetchProfiles,
    fetchCurrentProfile,
    saveProfile,
    setAdminStatus
  }
})