<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  facility: {
    type: Object,
    default: null
  },
  facilities: {
    type: Array,
    default: () => []
  },
  booking: { // Add booking prop for edit/delete mode
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit-success', 'close', 'delete-success'])

const dialog = ref(true)
const loading = ref(false)
const error = ref(null)
const isDeleteConfirmationOpen = ref(false)

// Initialize form with booking data if in edit mode
const form = ref({
  id: props.booking?.id || null,
  facility_id: props.booking?.facility_id || props.facility?.id || null,
  purpose: props.booking?.purpose || '',
  booking_date: props.booking?.booking_date || new Date().toISOString().substr(0, 10),
  start_time: props.booking?.start_time || null,
  end_time: props.booking?.end_time || null,
  notes: props.booking?.notes || '',
  status: props.booking?.status || 'pending'
})

// Reset form when facility prop changes
watch(() => props.facility, (newFacility) => {
  form.value.facility_id = newFacility?.id || null
})

// Watch for booking prop changes (for edit mode)
watch(() => props.booking, (newBooking) => {
  if (newBooking) {
    form.value = {
      id: newBooking.id,
      facility_id: newBooking.facility_id,
      purpose: newBooking.purpose,
      booking_date: newBooking.booking_date,
      start_time: newBooking.start_time,
      end_time: newBooking.end_time,
      notes: newBooking.notes,
      status: newBooking.status
    }
  }
})

function resetForm() {
  form.value = {
    id: null,
    facility_id: props.facility?.id || null,
    purpose: '',
    booking_date: new Date().toISOString().substr(0, 10),
    start_time: null,
    end_time: null,
    notes: '',
    status: 'pending'
  }
}

async function submit() {
  try {
    loading.value = true
    error.value = null
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    // Prepare the booking data
    const bookingData = {
      user_id: user.id,
      facility_id: form.value.facility_id,
      purpose: form.value.purpose,
      booking_date: form.value.booking_date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      notes: form.value.notes,
      status: form.value.status
    }

    let result
    if (form.value.id) {
      // Update existing booking
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', form.value.id)
        .select()

      if (updateError) throw updateError
      result = data[0]
    } else {
      // Create new booking
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()

      if (insertError) throw insertError
      result = data[0]
    }

    // Success - emit event and reset
    emit('submit-success', result)
    dialog.value = false
    resetForm()
    
  } catch (err) {
    error.value = err.message || 'Failed to save booking'
    console.error('Booking error:', err)
  } finally {
    loading.value = false
  }
}

async function deleteBooking() {
  try {
    if (!form.value.id) return
    
    loading.value = true
    error.value = null

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', form.value.id)

    if (deleteError) throw deleteError

    // Success - emit event and close
    emit('delete-success', form.value.id)
    dialog.value = false
    resetForm()
    isDeleteConfirmationOpen.value = false
    
  } catch (err) {
    error.value = err.message || 'Failed to delete booking'
    console.error('Delete error:', err)
  } finally {
    loading.value = false
  }
}

function close() {
  dialog.value = false
  resetForm()
  emit('close')
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title>
        {{ form.id ? 'Edit Booking' : facility ? `Book ${facility.name}` : 'New Booking' }}
      </v-card-title>
      
      <v-alert
        v-if="error"
        type="error"
        class="ma-4"
      >
        {{ error }}
      </v-alert>
      
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-select
            v-if="!facility"
            v-model="form.facility_id"
            :items="facilities"
            label="Select Facility"
            item-title="name"
            item-value="id"
            required
            :disabled="loading || !!form.id"
          />

          <v-text-field
            v-model="form.purpose"
            label="Purpose"
            required
            :disabled="loading"
          />

          <v-text-field
            v-model="form.booking_date"
            type="date"
            label="Date"
            required
            :disabled="loading"
          />

          <v-text-field
            v-model="form.start_time"
            type="time"
            label="Start Time"
            required
            :disabled="loading"
          />

          <v-text-field
            v-model="form.end_time"
            type="time"
            label="End Time"
            required
            :disabled="loading"
          />

          <v-textarea
            v-model="form.notes"
            label="Additional Notes"
            :disabled="loading"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="form.id"
          color="error"
          @click="isDeleteConfirmationOpen = true"
          :disabled="loading"
          class="mr-auto"
        >
          Delete
        </v-btn>
        
        <v-spacer></v-spacer>
        <v-btn 
          color="error" 
          @click="close"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="primary" 
          @click="submit"
          :loading="loading"
        >
          {{ form.id ? 'Update' : 'Submit' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="isDeleteConfirmationOpen" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Confirm Deletion</v-card-title>
      <v-card-text>
        Are you sure you want to delete this booking? This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn 
          color="grey" 
          @click="isDeleteConfirmationOpen = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn 
          color="error" 
          @click="deleteBooking"
          :loading="loading"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>