<template>
  <div v-if="hasError" class="error-boundary q-pa-lg text-center">
    <q-icon name="error_outline" size="64px" color="negative" />
    <h5 class="q-mt-md">Something went wrong</h5>
    <p class="text-grey-6">{{ errorMessage }}</p>
    <q-btn
      color="primary"
      label="Retry"
      @click="retry"
      class="q-mt-md"
    />
  </div>
  <slot v-else />
</template>

<script setup>
import { ref } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

const showError = (message) => {
  hasError.value = true
  errorMessage.value = message
}

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
}

defineExpose({
  showError,
  retry
})
</script>
