<script setup>
defineProps({
  users: Array,
  loading: Boolean,
  error: String
});

const headers = [
  { title: 'Username', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Joined', key: 'updated_at' },
  { title: 'Actions', key: 'actions' }
];
</script>

<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
    >
      <template #item.role="{ item }">
        <v-chip :color="item.is_admin ? 'primary' : 'default'">
          {{ item.is_admin ? 'Admin' : 'User' }}
        </v-chip>
      </template>
    </v-data-table>
  </div>
</template>