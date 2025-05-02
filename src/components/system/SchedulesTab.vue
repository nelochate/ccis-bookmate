<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  computerLabs: {
    type: Array,
    required: true
  },
  lectureRooms: {
    type: Array,
    required: true
  }
});

const calendarDate = ref(new Date().toISOString().substr(0, 10));
const selectedLab = ref(null);
const selectedLectureRoom = ref(null);

const selectedLabSchedule = computed(() => {
  if (!selectedLab.value) return null;
  const lab = props.computerLabs.find(l => l.id === selectedLab.value);
  return lab ? { ...lab, events: generateEvents(lab) } : null;
});

const selectedLectureRoomSchedule = computed(() => {
  if (!selectedLectureRoom.value) return null;
  const room = props.lectureRooms.find(r => r.id === selectedLectureRoom.value);
  return room ? { ...room, events: generateEvents(room) } : null;
});

function generateEvents(facility) {
  // Implement your event generation logic here
  return [];
}
</script>

<template>
  <v-row class="mt-4">
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          <span>Computer Lab Schedules</span>
          <v-select
            v-model="selectedLab"
            :items="computerLabs"
            item-title="name"
            item-value="id"
            label="Select Lab"
            dense
            outlined
            hide-details
            class="ml-2"
            style="max-width: 200px"
          ></v-select>
        </v-card-title>
        <v-card-text>
          <v-sheet v-if="selectedLabSchedule">
            <v-calendar
              ref="calendar"
              v-model="calendarDate"
              :events="selectedLabSchedule.events"
              event-overlap-mode="stack"
              event-color="primary"
              type="week"
            ></v-calendar>
          </v-sheet>
          <v-alert v-else type="info">
            Select a computer lab to view its schedule
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          <span>Lecture Room Schedules</span>
          <v-select
            v-model="selectedLectureRoom"
            :items="lectureRooms"
            item-title="name"
            item-value="id"
            label="Select Room"
            dense
            outlined
            hide-details
            class="ml-2"
            style="max-width: 200px"
          ></v-select>
        </v-card-title>
        <v-card-text>
          <v-sheet v-if="selectedLectureRoomSchedule">
            <v-calendar
              ref="calendar"
              v-model="calendarDate"
              :events="selectedLectureRoomSchedule.events"
              event-overlap-mode="stack"
              event-color="secondary"
              type="week"
            ></v-calendar>
          </v-sheet>
          <v-alert v-else type="info">
            Select a lecture room to view its schedule
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>