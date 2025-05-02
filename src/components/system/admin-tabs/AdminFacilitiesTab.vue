<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/utils/supabase';

const props = defineProps({
  loading: Boolean,
  error: String
});

const emit = defineEmits(['refresh']);

// Local state
const facilities = ref([]);
const localLoading = ref(false);
const localError = ref(null);

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Capacity', key: 'capacity' },
  { title: 'Status', key: 'is_available' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const statusColors = {
  computer_lab: 'blue',
  lecture_room: 'green',
  meeting_room: 'orange',
  auditorium: 'purple',
  conference_room: 'teal'
};

const getStatusText = (is_available) => is_available ? 'Available' : 'Occupied';

const facilityTypes = ref([
  { text: 'Computer Lab', value: 'computer_lab' },
  { text: 'Lecture Room', value: 'lecture_room' },
  { text: 'Auditorium', value: 'auditorium' },
  { text: 'Conference Room', value: 'conference_room' }
]);

// Facility Dialog
const facilityDialog = ref(false);
const facilityForm = ref({
  id: null,
  name: '',
  type: 'computer_lab',
  capacity: '',
  location: '',
  is_available: true,
  image_url: ''
});

// Fetch facilities from Supabase
const fetchFacilities = async () => {
  try {
    localLoading.value = true;
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    
    facilities.value = data;
    localError.value = null;
  } catch (err) {
    localError.value = `Error loading facilities: ${err.message}`;
    console.error(err);
  } finally {
    localLoading.value = false;
  }
};

// Initialize by fetching facilities
onMounted(() => {
  fetchFacilities();
});

const openFacilityDialog = (facility = null) => {
  if (facility) {
    facilityForm.value = { ...facility };
  } else {
    facilityForm.value = {
      id: null,
      name: '',
      type: 'computer_lab',
      capacity: '',
      location: '',
      is_available: true,
      image_url: ''
    };
  }
  facilityDialog.value = true;
};

const saveFacility = async () => {
  try {
    localLoading.value = true;
    
    if (facilityForm.value.id) {
      // Update existing facility
      const { data, error } = await supabase
        .from('facilities')
        .update({
          name: facilityForm.value.name,
          type: facilityForm.value.type,
          capacity: facilityForm.value.capacity,
          location: facilityForm.value.location,
          is_available: facilityForm.value.is_available,
          image_url: facilityForm.value.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', facilityForm.value.id)
        .select();
      
      if (error) throw error;
    } else {
      // Create new facility - removed created_by reference
      const { data, error } = await supabase
        .from('facilities')
        .insert({
          name: facilityForm.value.name,
          type: facilityForm.value.type,
          capacity: facilityForm.value.capacity,
          location: facilityForm.value.location,
          is_available: facilityForm.value.is_available,
          image_url: facilityForm.value.image_url
        })
        .select();
      
      if (error) throw error;
    }
    
    facilityDialog.value = false;
    await fetchFacilities();
    localError.value = null;
    emit('refresh');
  } catch (err) {
    localError.value = `Error saving facility: ${err.message}`;
    console.error(err);
  } finally {
    localLoading.value = false;
  }
};

const deleteFacility = async (id) => {
  try {
    localLoading.value = true;
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await fetchFacilities();
    localError.value = null;
    emit('refresh');
  } catch (err) {
    localError.value = `Error deleting facility: ${err.message}`;
    console.error(err);
  } finally {
    localLoading.value = false;
  }
};
</script>

<template>
  <!-- Rest of your template remains exactly the same -->
  <div class="admin-facilities-tab">
    <!-- Error State -->
    <v-alert
      v-if="localError"
      type="error"
      class="mb-4"
    >
      {{ localError }}
    </v-alert>

    <!-- Loading State -->
    <v-progress-linear
      v-if="localLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Action Bar -->
    <div class="d-flex justify-space-between mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openFacilityDialog()"
      >
        Add Facility
      </v-btn>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-refresh"
        @click="fetchFacilities"
        :loading="localLoading"
      >
        Refresh
      </v-btn>
    </div>

    <!-- Facilities Table -->
    <v-data-table
      :headers="headers"
      :items="facilities"
      :loading="localLoading"
      class="elevation-1"
    >
      <template #item.type="{ item }">
        <v-chip :color="statusColors[item.type] || 'grey'">
          {{ item.type.replace('_', ' ') }}
        </v-chip>
      </template>

      <template #item.is_available="{ item }">
        <v-chip :color="item.is_available ? 'green' : 'red'">
          {{ getStatusText(item.is_available) }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          class="mr-2"
          @click.stop="openFacilityDialog(item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          color="error"
          @click.stop="deleteFacility(item.id)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Facility Management Dialog -->
    <v-dialog v-model="facilityDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ facilityForm.id ? 'Edit Facility' : 'Add New Facility' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveFacility">
            <v-text-field 
              v-model="facilityForm.name" 
              label="Name" 
              required
              :rules="[v => !!v || 'Name is required']"
            ></v-text-field>
            
            <v-select
              v-model="facilityForm.type"
              :items="facilityTypes"
              label="Type"
              item-title="text"
              item-value="value"
              required
              :rules="[v => !!v || 'Type is required']"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon :color="statusColors[item.raw.value]">
                      {{ item.raw.value === 'computer_lab' ? 'mdi-desktop-classic' : 
                         item.raw.value === 'lecture_room' ? 'mdi-school' :
                         item.raw.value === 'conference_room' ? 'mdi-account-group' :
                         'mdi-door' }}
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <v-text-field
              v-model="facilityForm.capacity"
              label="Capacity"
              type="number"
              required
              :rules="[
                v => !!v || 'Capacity is required',
                v => v > 0 || 'Capacity must be positive'
              ]"
            ></v-text-field>
            
            <v-text-field
              v-model="facilityForm.location"
              label="Location"
              required
              :rules="[v => !!v || 'Location is required']"
            ></v-text-field>
            
            <v-switch 
              v-model="facilityForm.is_available" 
              label="Available"
              color="primary"
            ></v-switch>
            
            <v-text-field 
              v-model="facilityForm.image_url" 
              label="Image URL"
              placeholder="https://example.com/image.jpg"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="facilityDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="saveFacility"
            :loading="localLoading"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin-facilities-tab {
  padding: 16px;
  background-color: var(--v-background-base);
  border-radius: 5px;
}
</style>