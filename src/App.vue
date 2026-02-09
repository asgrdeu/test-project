<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Plus, CircleHelp, Trash2 } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectItem,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAccountsStore } from '@/stores/accounts'

const store = useAccountsStore()
const { accounts, errors } = storeToRefs(store)

onMounted(() => {
  store.initFromStorage()
})
</script>

<template>
  <div class="flex flex-col p-8 max-w-5xl mx-auto gap-4">
    <div class="flex flex-row justify-start items-center gap-4">
      <h1 class="text-xl font-semibold">Учетные записи</h1>
      <Button variant="outline" size="icon" @click="store.addEmptyAccount">
        <Plus class="w-4 h-4" />
      </Button>
    </div>

    <div class="flex flex-row gap-2 p-2 items-center bg-gray-100 rounded-md">
      <CircleHelp class="w-5 h-5 text-blue-500" />
      <span class="text-sm"
        >Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;</span
      >
    </div>

    <div class="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-4 items-start">
      <span class="text-gray-400 font-medium">Метки</span>
      <span class="text-gray-400 font-medium">Тип записи</span>
      <span class="text-gray-400 font-medium">Логин</span>
      <span class="text-gray-400 font-medium">Пароль</span>
      <span></span>

      <template v-for="account in accounts" :key="account.id">
        <div class="flex flex-col gap-1">
          <Input
            type="text"
            :model-value="account.labelText"
            placeholder="Метки через ;"
            :class="{ 'border-destructive focus-visible:ring-destructive/50': errors[account.id]?.labelText }"
            @update:model-value="(val) => store.setField(account.id, 'labelText', String(val))"
            @blur="store.validateAccount(account.id)"
          />
          <span v-if="errors[account.id]?.labelText" class="text-[10px] text-destructive leading-none">
            {{ errors[account.id].labelText }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <Select
            :model-value="account.type"
            @update:model-value="(val) => store.setField(account.id, 'type', val as any)"
          >
            <SelectTrigger class="w-full" :class="{ 'border-destructive focus-visible:ring-destructive/50': errors[account.id]?.type }">
              <SelectValue placeholder="Тип записи" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Типы записей</SelectLabel>
                <SelectItem value="LDAP"> LDAP </SelectItem>
                <SelectItem value="LOCAL"> Локальная </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <span v-if="errors[account.id]?.type" class="text-[10px] text-destructive leading-none">
            {{ errors[account.id].type }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <Input
            type="text"
            :model-value="account.login"
            placeholder="Логин"
            :class="{ 'border-destructive focus-visible:ring-destructive/50': errors[account.id]?.login }"
            @update:model-value="(val) => store.setField(account.id, 'login', String(val))"
            @blur="store.validateAccount(account.id)"
          />
          <span v-if="errors[account.id]?.login" class="text-[10px] text-destructive leading-none">
            {{ errors[account.id].login }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <Input
            v-if="account.type === 'LOCAL'"
            type="password"
            :model-value="account.password || ''"
            placeholder="Пароль"
            :class="{ 'border-destructive focus-visible:ring-destructive/50': errors[account.id]?.password }"
            @update:model-value="(val) => store.setField(account.id, 'password', String(val))"
            @blur="store.validateAccount(account.id)"
          />
          <div v-else class="text-gray-400 text-sm italic py-2">Не требуется для LDAP</div>
          <span v-if="account.type === 'LOCAL' && errors[account.id]?.password" class="text-[10px] text-destructive leading-none">
            {{ errors[account.id].password }}
          </span>
        </div>

        <Button variant="ghost" size="icon" @click="store.removeAccount(account.id)">
          <Trash2 class="w-4 h-4 text-gray-500" />
        </Button>
      </template>

      <div v-if="accounts.length === 0" class="col-span-5 py-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
        Учетные записи отсутствуют. Нажмите "+", чтобы добавить новую.
      </div>
    </div>
  </div>
</template>

<style scoped></style>
