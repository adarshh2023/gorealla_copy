<template>
  <div class="search-chips-container">
    <q-input
      ref="searchInput"
      v-model="inputText"
      outlined
      dense
      filled
      :placeholder="placeholder"
      @keydown.enter="addChip"
      class="search-input"
    >
      <!-- Chips display inside input -->
      <!-- <template v-slot:prepend v-if="keywords.length > 0">
        <div class="chips-container">
          <q-chip
            v-for="(keyword, index) in keywords"
            :key="index"
            removable
            @remove="removeChip(index)"
            color="primary"
            text-color="white"
            size="md"
            class="q-ma-xs"
          >
            {{ keyword }}
          </q-chip>
        </div>
      </template> -->

      <!-- Search icon on the right -->
      <template v-slot:append>
        <q-btn
          round
          dense
          flat
          icon="search"
          @click="performSearch"
          :disable="keywords.length === 0"
          color="primary"
        >
          <q-tooltip>Search</q-tooltip>
        </q-btn>
      </template>
    </q-input>

    <!-- Alternative layout: Chips outside input (uncomment if preferred) -->
    <div v-if="keywords.length > 0" class="chips-outside q-mt-sm">
      <q-chip
        v-for="(keyword, index) in keywords"
        :key="index"
        removable
        @remove="removeChip(index)"
        color="primary"
        text-color="white"
        class="q-ma-xs"
      >
        {{ keyword }}
      </q-chip>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'SearchChips',

  props: {
    placeholder: {
      type: String,
      default: 'Enter search terms and press Enter...'
    },
    searchCallback: {
      type: Function,
      default: null
    },
    maxChips: {
      type: Number,
      default: 10
    },
    clearOnSearch: {
      type: Boolean,
      default: false
    }
  },

  emits: ['search', 'chips-updated'],

  setup(props, { emit }) {
    const inputText = ref('')
    const keywords = ref([])
    const searchInput = ref(null)

    const addChip = () => {
      const trimmedText = inputText.value.trim()

      if (!trimmedText) return

      // Prevent duplicates (case-insensitive)
      if (keywords.value.some(keyword =>
          keyword.toLowerCase() === trimmedText.toLowerCase())) {
        inputText.value = ''
        return
      }

      // Check max chips limit
      if (keywords.value.length >= props.maxChips) {
        // You can show a notification here if needed
        inputText.value = ''
        return
      }

      keywords.value.push(trimmedText)
      inputText.value = ''

      // Emit chips updated event
      emit('chips-updated', [...keywords.value])
    }

    const removeChip = (index) => {
      keywords.value.splice(index, 1)
      emit('chips-updated', [...keywords.value])
    }

    const performSearch = () => {
      if (keywords.value.length === 0) return

      const searchTerms = [...keywords.value]

      // Emit search event
      emit('search', searchTerms)

      // Call callback function if provided
      if (props.searchCallback && typeof props.searchCallback === 'function') {
        props.searchCallback(searchTerms)
      }

      // Clear chips if specified
      if (props.clearOnSearch) {
        clearAll()
      }
    }

    const clearAll = () => {
      keywords.value = []
      inputText.value = ''
      emit('chips-updated', [])
    }

    const getKeywords = () => {
      return [...keywords.value]
    }

    const setKeywords = (newKeywords) => {
      keywords.value = [...newKeywords]
      emit('chips-updated', [...keywords.value])
    }

    // Expose methods for parent components
    return {
      inputText,
      keywords,
      searchInput,
      addChip,
      removeChip,
      performSearch,
      clearAll,
      getKeywords,
      setKeywords
    }
  }
})
</script>

<style scoped>
.search-chips-container {
  width: 100%;
}

.search-input {
  width: 100%;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 300px; /* Adjust based on your needs */
  overflow-x: auto;
}

.chips-outside {
  display: flex;
  flex-wrap: wrap;
}


</style>
