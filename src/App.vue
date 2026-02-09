<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
</script>

<template>
  <div class="p-8">
    <div class="flex flex-row justify-start items-center gap-4">
      <h1 class="text-xl font-semibold">Учетные записи</h1>
      <Button variant="outline" size="icon-lg">
        <Plus />
      </Button>
    </div>


  </div>
</template>

<style scoped></style>
