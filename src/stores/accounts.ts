import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type AccountType = 'LDAP' | 'LOCAL'

export interface AccountLabel {
  text: string
}

export interface Account {
  id: string
  labelText: string
  labels: AccountLabel[]
  type: AccountType
  login: string
  password: string | null
  updatedAt: number
}

export type AccountField = 'labelText' | 'type' | 'login' | 'password'

export type AccountErrors = Partial<Record<AccountField, string>>

const STORAGE_KEY = 'accounts_store_v1'

function safeJSONParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

function parseLabels(labelText: string): AccountLabel[] {
  return labelText
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((text) => ({ text }))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])
  const errors = ref<Record<string, AccountErrors>>({})

  const getAccountById = computed(() => (id: string) => accounts.value.find((a) => a.id === id))

  const isAccountValid = computed(() => (id: string) => {
    const errorObj = errors.value[id]
    if (!errorObj) return true
    return Object.keys(errorObj).length === 0
  })

  function persistToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value))
    }
  }

  function initFromStorage() {
    if (typeof window === 'undefined') return

    const stored = safeJSONParse<Record<string, unknown>[]>(localStorage.getItem(STORAGE_KEY), [])

    accounts.value = stored
      .filter((item) => {
        return (
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          (item.type === 'LOCAL' || item.type === 'LDAP') &&
          item.login !== undefined
        )
      })
      .map((item): Account => {
        const type: AccountType = item.type === 'LOCAL' ? 'LOCAL' : 'LDAP'
        const labelText = typeof item.labelText === 'string' ? item.labelText : ''
        return {
          id: String(item.id),
          labelText,
          labels: parseLabels(labelText),
          type,
          login: String(item.login || ''),
          password:
            type === 'LDAP' ? null : typeof item.password === 'string' ? item.password : '',
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now()
        }
      })
  }

  function addEmptyAccount() {
    const newAccount: Account = {
      id: generateId(),
      labelText: '',
      labels: [],
      type: 'LDAP',
      login: '',
      password: null,
      updatedAt: Date.now()
    }
    accounts.value.push(newAccount)
    delete errors.value[newAccount.id]
    persistToStorage()
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter((a) => a.id !== id)
    delete errors.value[id]
    persistToStorage()
  }

  function setField(id: string, field: AccountField, value: string | AccountType) {
    const account = accounts.value.find((a) => a.id === id)
    if (!account) return

    if (field === 'type') {
      account.type = value as AccountType
      if (account.type === 'LDAP') {
        account.password = null
      } else if (account.type === 'LOCAL' && account.password === null) {
        account.password = ''
      }
    } else if (field === 'labelText') {
      const val = String(value)
      account.labelText = val
      account.labels = parseLabels(val)
    } else if (field === 'login') {
      account.login = String(value)
    } else if (field === 'password') {
      account.password = account.type === 'LDAP' ? null : String(value)
    }

    persistToStorage()
  }

  function validateAccount(id: string): boolean {
    const account = accounts.value.find((a) => a.id === id)
    if (!account) return true

    const newErrors: AccountErrors = {}

    // Login validation
    if (!account.login.trim()) {
      newErrors.login = 'Обязательное поле'
    } else if (account.login.length > 100) {
      newErrors.login = 'Максимум 100 символов'
    }

    // Type validation
    if (!['LDAP', 'LOCAL'].includes(account.type)) {
      newErrors.type = 'Некорректный тип'
    }

    // Password validation
    if (account.type === 'LOCAL') {
      if (!account.password || !account.password.trim()) {
        newErrors.password = 'Обязательное поле'
      } else if (account.password.length > 100) {
        newErrors.password = 'Максимум 100 символов'
      }
    } else {
      // LDAP
      if (account.password !== null) {
        account.password = null
      }
    }

    // LabelText validation
    if (account.labelText.length > 50) {
      newErrors.labelText = 'Максимум 50 символов'
    }

    errors.value[id] = newErrors
    return Object.keys(newErrors).length === 0
  }

  function saveAccount(id: string): boolean {
    const account = accounts.value.find((a) => a.id === id)
    if (!account) return false

    // Приведение к инвариантам перед валидацией
    account.labels = parseLabels(account.labelText)
    if (account.type === 'LDAP') {
      account.password = null
    }

    const isValid = validateAccount(id)
    if (isValid) {
      account.updatedAt = Date.now()
      delete errors.value[id]
      persistToStorage()
      return true
    }

    // По желанию persist даже если не валидна, в условии "не обязателен"
    persistToStorage()
    return false
  }

  return {
    accounts,
    errors,
    getAccountById,
    isAccountValid,
    initFromStorage,
    persistToStorage,
    addEmptyAccount,
    removeAccount,
    setField,
    validateAccount,
    saveAccount
  }
})
