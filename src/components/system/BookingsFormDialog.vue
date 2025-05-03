<script setup>
import { ref } from 'vue'
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

const emit = defineEmits(['submit-booking', 'close'])

const dialog = ref(true)
const form = ref({
  facility: props.facility?.id || null,
  purpose: '',
  date: new Date().toISOString().substr(0, 10),
  startTime: null,
  endTime: null,
  notes: '',
})

function resetForm() {
  form.value = {
    facility: props.facility?.id || null,
    purpose: '',
    date: new Date().toISOString().substr(0, 10),
    startTime: null,
    endTime: null,
    notes: '',
  }
}

async function submit() {
  try {
    emit('submit-booking', form.value)
    dialog.value = false
    resetForm()
  } catch (error) {
    console.error('Error submitting booking:', error)
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
        {{ facility ? `Book ${facility.name}` : 'New Booking' }}
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-select
            v-if="!facility"
            v-model="form.facility"
            :items="facilities"
            label="Select Facility"
            item-title="name"
            item-value="id"
            required
          />

          <v-text-field
            v-model="form.purpose"
            label="Purpose"
            required
          />

          <v-text-field
            v-model="form.date"
            type="date"
            label="Date"
            required
          />

          <v-text-field
            v-model="form.startTime"
            type="time"
            label="Start Time"
            required
          />

          <v-text-field
            v-model="form.endTime"
            type="time"
            label="End Time"
            required
          />

          <v-textarea
            v-model="form.notes"
            label="Additional Notes"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="submit">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>