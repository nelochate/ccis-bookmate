<script setup>
defineProps({
  users: Array,
  loading: Boolean,
  error: String,
})

const headers = [
  { title: 'Username', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Joined', key: 'updated_at' },
]
</script>

<template>
  <v-card class="mx-4 my-4 elevation-2" outlined>
    <!-- Card Title -->
    <v-card-title>
      <h2 class="text-h6">User Management</h2>
    </v-card-title>

    <!-- Loader -->
    <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

    <!-- Error Message -->
    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Data Table -->
    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
      dense
      outlined
      class="elevation-1"
    >
      <!-- Role Column -->
      <template #item.role="{ item }">
        <v-chip :color="item.is_admin || item.role === 'admin' ? 'primary' : 'default'" small>
          {{ item.is_admin || item.role === 'admin' ? 'Admin' : 'User' }}
        </v-chip>
      </template>

      <!-- Created At Column -->
      <template #item.updated_at="{ item }">
        <span v-if="item.updated_at">
          {{ new Date(item.updated_at).toLocaleDateString() }}
        </span>
        <span v-else> N/A </span>
      </template>
    </v-data-table>
  </v-card>
</template>
