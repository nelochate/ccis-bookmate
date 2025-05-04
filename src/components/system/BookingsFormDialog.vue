<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  facility: {
    type: Object,
    default: null
  },
  facilities: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit-success', 'close'])

const form = ref({
  facility_id: null,
  date: new Date().toISOString().split('T')[0],
  start_time: '08:00',
  end_time: '09:00',
  purpose: '',
  notes: ''
})

const dialog = ref(true)
const loading = ref(false)
const error = ref(null)

const isFormValid = computed(() => {
  return form.value.facility_id && 
         form.value.date && 
         form.value.start_time && 
         form.value.end_time &&
         form.value.purpose
})

onMounted(() => {
  if (props.facility) {
    form.value.facility_id = props.facility.id
  }
})

function resetForm() {
  form.value = {
    facility_id: props.facility?.id || null,
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00',
    purpose: '',
    notes: ''
  }
}

function validateForm() {
  const errors = []
  if (!form.value.facility_id) errors.push('Facility is required')
  if (!form.value.date) errors.push('Date is required')
  if (!form.value.start_time) errors.push('Start time is required')
  if (!form.value.end_time) errors.push('End time is required')
  if (!form.value.purpose) errors.push('Purpose is required')
  if (form.value.start_time >= form.value.end_time) {
    errors.push('End time must be after start time')
  }
  return errors
}

async function submit() {
  try {
    loading.value = true
    error.value = null

    const errors = validateForm()
    if (errors.length > 0) throw new Error(errors.join('\n'))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const bookingData = {
      ...form.value,
      user_id: user.id,
      status: 'pending'
    }

    emit('submit-success', bookingData)
    dialog.value = false
    resetForm()
  } catch (err) {
    error.value = err.message
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
        {{ props.facility ? `Book ${props.facility.name}` : 'New Booking' }}
      </v-card-title>
      
      <v-alert v-if="error" type="error" class="ma-4" variant="tonal">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>
          <div>{{ error }}</div>
        </div>
      </v-alert>
      
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-select
            v-if="!props.facility"
            v-model="form.facility_id"
            :items="props.facilities"
            label="Select Facility*"
            item-title="name"
            item-value="id"
            required
            :disabled="loading"
            :rules="[v => !!v || 'Facility is required']"
          />

          <v-text-field
            v-model="form.purpose"
            label="Purpose*"
            required
            :disabled="loading"
            :rules="[v => !!v || 'Purpose is required']"
          />

          <v-text-field
            v-model="form.date"
            type="date"
            label="Date*"
            required
            :disabled="loading"
            :min="new Date().toISOString().split('T')[0]"
            :rules="[v => !!v || 'Date is required']"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="form.start_time"
                type="time"
                label="Start Time*"
                required
                :disabled="loading"
                :rules="[v => !!v || 'Start time is required']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end_time"
                type="time"
                label="End Time*"
                required
                :disabled="loading"
                :rules="[
                  v => !!v || 'End time is required',
                  v => v > form.start_time || 'Must be after start time'
                ]"
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
        <v-spacer></v-spacer>
        <v-btn color="error" @click="close" :disabled="loading">
          Cancel
        </v-btn>
        <v-btn 
          color="primary" 
          @click="submit"
          :loading="loading"
          :disabled="!isFormValid"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>