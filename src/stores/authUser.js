import { supabase } from '@/utils/supabase'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthUserStore = defineStore('authUser', () => {
  // States
  const userData = ref(null)
  const authPages = ref([])


  // Getters
  // Computed Properties; Use for getting the state but not modifying its reactive state
  const isLoggedIn = computed(() => !!userData.value)
  const isAdmin = computed(() => userData.value?.user_role === 'admin')

  // Reset State Action
  function $reset() {
    userData.value = null
  }

  // Actions
  // Retrieve User Session if Logged
  async function isAuthenticated() {
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      const { id, email, user_metadata } = data.session.user
      userData.value = { id, email, ...user_metadata }
    }

    return !!data.session
  }

  // Retrieve User Information
  async function getUserInformation() {
    const {
      data: {
        // Retrieve Id, Email and Metadata thru Destructuring
        user: { id, email, user_metadata }
      }
    } = await supabase.auth.getUser()

    // Set the retrieved information to state
    userData.value = { id, email, ...user_metadata }
  }

  // Retrieve User Roles Pages
  async function getAuthPages(name) {
    const { data } = await supabase
      .from('user_roles')
      .select('*, pages: user_role_pages (page)')
      .eq('user_role', name)

    // Set the retrieved data to state
    if (data.length > 0) authPages.value = data[0].pages.map((p) => p.page)
  }

  return {
    userData,
    isLoggedIn,
    isAdmin,
    $reset,
    isAuthenticated,
    getUserInformation
  }
  
})

