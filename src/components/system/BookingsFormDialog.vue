<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { useFacilitiesStore } from '@/stores/facilities'

const facilitiesStore = useFacilitiesStore()

const props = defineProps({
  facility: {
    type: Object,
    default: null
  },
  facilities: {
    type: Array,
    default: () => []
  },
  booking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit-success', 'close', 'delete-success'])

const dialog = ref(true)
const loading = ref(false)
const error = ref(null)
const isDeleteConfirmationOpen = ref(false)

// Use facilities from store if not provided via props
const availableFacilities = computed(() => {
  return props.facilities.length > 0 ? props.facilities : facilitiesStore.facilities
})

// Initialize form
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

// Get facility name for display
const selectedFacilityName = computed(() => {
  if (props.facility) return props.facility.name
  if (form.value.facility_id) {
    const facility = availableFacilities.value.find(f => f.id === form.value.facility_id)
    return facility?.name || 'Selected Facility'
  }
  return 'Select Facility'
})

// Watch for changes
watch(() => props.facility, (newFacility) => {
  form.value.facility_id = newFacility?.id || null
})

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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

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
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', form.value.id)
        .select()
      if (updateError) throw updateError
      result = data[0]
    } else {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
      if (insertError) throw insertError
      result = data[0]
    }

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
        {{ form.id ? 'Edit Booking' : `Book ${selectedFacilityName}` }}
      </v-card-title>
      
      <v-alert v-if="error" type="error" class="ma-4">
        {{ error }}
      </v-alert>
      
      <v-card-text>
        <v-form @submit.prevent="submit">
          <!-- Show facility chip if facility is preselected -->
          <v-chip v-if="facility" class="mb-4" color="primary" size="large">
            <v-icon start>mdi-office-building</v-icon>
            {{ facility.name }}
          </v-chip>
          
          <!-- Show select only if no specific facility is preselected -->
          <v-select
            v-if="!facility"
            v-model="form.facility_id"
            :items="availableFacilities"
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
            :min="new Date().toISOString().substr(0, 10)"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="form.start_time"
                type="time"
                label="Start Time"
                required
                :disabled="loading"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end_time"
                type="time"
                label="End Time"
                required
                :disabled="loading"
              />
            </v-col>
          </v-row>

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