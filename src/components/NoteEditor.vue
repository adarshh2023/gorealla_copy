<template>
  <div class="note-editor-container">
    <!-- Title Input -->
    <q-input
      v-model="noteTitle"
      placeholder="Subject/Title"
      outlined
      dense
      class="q-mb-md"
      :readonly="readonly"
      @update:model-value="handleChange"
    />

    <!-- Rich Text Editor with Mentions -->
    <div class="editor-container">
      <!-- Editor Toolbar -->
      <q-toolbar class="editor-toolbar" v-if="!readonly">
        <q-btn
          flat
          dense
          icon="format_bold"
          @click="execCommand('bold')"
          :class="{ 'text-primary': isCommandActive('bold') }"
        />
        <q-btn
          flat
          dense
          icon="format_italic"
          @click="execCommand('italic')"
          :class="{ 'text-primary': isCommandActive('italic') }"
        />
        <q-btn
          flat
          dense
          icon="format_underlined"
          @click="execCommand('underline')"
          :class="{ 'text-primary': isCommandActive('underline') }"
        />
        <q-btn
          flat
          dense
          icon="format_strikethrough"
          @click="execCommand('strikeThrough')"
          :class="{ 'text-primary': isCommandActive('strikeThrough') }"
        />
        <q-separator vertical class="q-mx-sm" />
        <q-btn
          flat
          dense
          icon="format_list_bulleted"
          @click="execCommand('insertUnorderedList')"
        />
        <q-btn
          flat
          dense
          icon="format_list_numbered"
          @click="execCommand('insertOrderedList')"
        />
        <q-separator vertical class="q-mx-sm" />
        <q-btn
          flat
          dense
          icon="undo"
          @click="execCommand('undo')"
        />
        <q-btn
          flat
          dense
          icon="redo"
          @click="execCommand('redo')"
        />
        <q-separator vertical class="q-mx-sm" />
        <q-btn
          flat
          dense
          icon="code"
          @click="toggleHtmlView"
        />
      </q-toolbar>

      <!-- Editor Content Area -->
      <div class="editor-content-wrapper" style="position: relative;">
        <div
          ref="editor"
          class="editor-content"
          :contenteditable="!readonly"
          @input="onEditorInput"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @click="onEditorClick"
          :style="editorStyle"
          :placeholder="readonly ? '' : 'Start typing your note... Use @ to mention someone'"
        ></div>

        <!-- Mention Dropdown -->
        <div
          v-if="showMentionDropdown && !readonly"
          class="mention-dropdown"
          :style="dropdownStyle"
        >
          <q-list dense>
            <q-item
              v-for="(user, index) in filteredUsers"
              :key="user.recCode"
              clickable
              @click="selectMention(user)"
              :class="{ 'bg-blue-1': index === selectedMentionIndex }"
            >
              <q-item-section avatar>
                <q-avatar size="24px" color="primary" text-color="white">
                  {{ user.name.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption class="text-capitalize">
                  {{ user.userRole.toLowerCase() }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="filteredUsers.length === 0">
              <q-item-section>
                <q-item-label class="text-grey">No users found</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="note-actions q-mt-md" v-if="!readonly">
      <q-btn
        flat
        label="Cancel"
        color="grey"
        @click="handleCancel"
      />
      <q-btn
        unelevated
        label="Save"
        color="primary"
        @click="handleSave"
        class="q-ml-sm"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

export default {
  name: 'NoteEditor',
  props: {
    users: {
      type: Array,
      default: () => [],
      validator: (users) => {
        return users.every(user =>
          'recCode' in user &&
          'name' in user &&
          'userRole' in user
        )
      }
    },
    modelValue: {
      type: Object,
      default: () => ({
        subject: '',
        noteContent: '',
        mentions: []
      })
    },
    existingNote: {
      type: Object,
      default: null
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },

  emits: ['note-changed', 'save-note', 'cancel-note', 'update:modelValue'],

  setup(props, { emit }) {
    // Reactive data
    const editor = ref(null)
    const noteTitle = ref('')
    const showMentionDropdown = ref(false)
    const mentionQuery = ref('')
    const selectedMentionIndex = ref(0)
    const dropdownStyle = ref({})
    const currentMentionRange = ref(null)
    const currentMentions = ref([])

    // Computed
    const editorStyle = computed(() => ({
      minHeight: '200px',
      maxHeight: '400px',
      overflowY: 'auto',
      padding: '12px',
      border: props.readonly ? 'none' : '1px solid #e0e0e0',
      borderTop: props.readonly ? 'none' : (showMentionDropdown.value ? '1px solid #e0e0e0' : 'none'),
      outline: 'none',
      backgroundColor: props.readonly ? 'transparent' : 'white',
      direction: 'ltr',
      textAlign: 'left',
      unicodeBidi: 'normal'
    }))

    const filteredUsers = computed(() => {
      if (!mentionQuery.value || mentionQuery.value.length < 1) {
        return props.users.slice(0, 8)
      }
      return props.users.filter(user =>
        user.name.toLowerCase().includes(mentionQuery.value.toLowerCase())
      ).slice(0, 10)
    })

    // Methods
    const execCommand = (command, value = null) => {
      document.execCommand(command, false, value)
      editor.value.focus()
      handleChange()
    }

    const isCommandActive = (command) => {
      return document.queryCommandState(command)
    }

    const toggleHtmlView = () => {
      const content = editor.value.innerHTML
      if (editor.value.contentEditable === 'true') {
        editor.value.textContent = content
        editor.value.contentEditable = 'false'
      } else {
        editor.value.innerHTML = editor.value.textContent
        editor.value.contentEditable = 'true'
      }
    }

    const onEditorInput = () => {
      checkForMentions()
      // handleChange()
    }

    const onKeyDown = (event) => {
      if (showMentionDropdown.value) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          selectedMentionIndex.value = Math.min(
            selectedMentionIndex.value + 1,
            filteredUsers.value.length - 1
          )
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
        } else if (event.key === 'Enter') {
          event.preventDefault()
          if (filteredUsers.value[selectedMentionIndex.value]) {
            selectMention(filteredUsers.value[selectedMentionIndex.value])
          }
        } else if (event.key === 'Escape') {
          hideMentionDropdown()
        }
      }
    }

    // eslint-disable-next-line no-unused-vars
    const onKeyUp = (event) => {
      if (!showMentionDropdown.value) {
        checkForMentions()
      }
    }

    const onEditorClick = () => {
      if (showMentionDropdown.value) {
        hideMentionDropdown()
      }
    }

    const checkForMentions = () => {
      if (props.readonly) return

      const selection = window.getSelection()
      if (selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const textNode = range.startContainer

      if (textNode.nodeType !== Node.TEXT_NODE) {
        hideMentionDropdown()
        return
      }

      const text = textNode.textContent
      const cursorPos = range.startOffset

      let atIndex = -1
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === '@') {
          if (i === 0 || text[i - 1] === ' ' || text[i - 1] === '\n') {
            atIndex = i
            break
          }
        } else if (text[i] === ' ' || text[i] === '\n') {
          break
        }
      }

      if (atIndex !== -1) {
        const query = text.substring(atIndex + 1, cursorPos)
        if (query.length >= 0) {
          mentionQuery.value = query
          currentMentionRange.value = {
            textNode,
            startOffset: atIndex,
            endOffset: cursorPos
          }
          showMentionDropdownAtCursor()
          selectedMentionIndex.value = 0
        }
      } else {
        hideMentionDropdown()
      }
    }

    const showMentionDropdownAtCursor = () => {
      const selection = window.getSelection()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const editorRect = editor.value.getBoundingClientRect()

      dropdownStyle.value = {
        position: 'absolute',
        top: `${rect.bottom - editorRect.top + 5}px`,
        left: `${rect.left - editorRect.left}px`,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '250px'
      }
      showMentionDropdown.value = true
    }

    const hideMentionDropdown = () => {
      showMentionDropdown.value = false
      mentionQuery.value = ''
      currentMentionRange.value = null
      selectedMentionIndex.value = 0
    }

    const selectMention = (user) => {
      if (!currentMentionRange.value) return

      const { textNode, startOffset, endOffset } = currentMentionRange.value

      // Calculate accurate position in the full document text for backend
      const mentionPosition = calculateMentionPosition(startOffset)

      // Create mention chip element
      const mentionId = `mention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const mentionChip = document.createElement('span')
      mentionChip.className = 'mention-chip'
      mentionChip.contentEditable = 'false'
      mentionChip.dataset.mentionId = mentionId
      mentionChip.dataset.recCode = user.recCode
      mentionChip.dataset.userRole = user.userRole
      mentionChip.innerHTML = `
        <span class="mention-text">@${user.name}</span>
        <span class="mention-remove" data-action="remove-mention" style="margin-left: 4px; cursor: pointer; color: #666;">×</span>
      `
      mentionChip.style.cssText = `
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 12px;
        padding: 2px 8px;
        margin: 0 2px;
        display: inline-block;
        color: #1976d2;
        font-size: 14px;
        white-space: nowrap;
      `

      mentionChip.addEventListener('click', (event) => {
        if (event.target.dataset.action === 'remove-mention') {
          removeMention(mentionChip)
          event.preventDefault()
          event.stopPropagation()
        }
      })

      const range = document.createRange()
      range.setStart(textNode, startOffset)
      range.setEnd(textNode, endOffset)

      const spaceNode = document.createTextNode(' ')
      const fragment = document.createDocumentFragment()
      fragment.appendChild(mentionChip)
      fragment.appendChild(spaceNode)

      range.deleteContents()
      range.insertNode(fragment)

      // UPDATED: Backend-compatible mention structure with accurate position
      const mention = {
        id: mentionId,
        recCode: user.recCode,
        name: user.name,
        userRole: user.userRole,
        mentionPosition: mentionPosition // More accurate position calculation
      }
      currentMentions.value.push(mention)

      const spaceAfter = document.createTextNode('\u00A0')
      mentionChip.parentNode.insertBefore(spaceAfter, mentionChip.nextSibling)

      const newRange = document.createRange()
      newRange.setStartAfter(spaceAfter)
      newRange.collapse(true)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(newRange)

      hideMentionDropdown()
      editor.value.focus()
      // handleChange()
    }

    const calculateMentionPosition = (textOffset) => {
      if (!editor.value) return textOffset

      // Get text content before the mention point to calculate accurate position
      const range = document.createRange()
      range.setStart(editor.value, 0)
      range.setEnd(currentMentionRange.value.textNode, textOffset)

      const textContent = range.toString()
      return textContent.length
    }

    const removeMention = (chipElement) => {
      const mentionId = chipElement.dataset.mentionId

      const mentionIndex = currentMentions.value.findIndex(m => m.id === mentionId)
      if (mentionIndex !== -1) {
        currentMentions.value.splice(mentionIndex, 1)
      }

      chipElement.remove()
      // handleChange()
    }

    // UPDATED: Backend-compatible data methods
    const getCurrentNoteData = () => {
      return {
        subject: noteTitle.value || '',
        noteContent: editor.value ? editor.value.innerHTML : '',
        mentions: currentMentions.value.map(mention => ({
          // Ensure all required fields for MentionDTO are present
          recCode: mention.recCode,
          name: mention.name,
          userRole: mention.userRole,
          mentionPosition: mention.mentionPosition || 0
        }))
      }
    }

    // eslint-disable-next-line no-unused-vars
    const getPlainContent = () => {
      if (!editor.value) return ''

      let content = editor.value.innerHTML
      const chips = editor.value.querySelectorAll('.mention-chip')
      chips.forEach(chip => {
        const name = chip.querySelector('.mention-text').textContent
        content = content.replace(chip.outerHTML, name)
      })

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      return tempDiv.textContent || tempDiv.innerText || ''
    }

    let changeTimeout = null
    const handleChange = () => {
      if (changeTimeout) {
        clearTimeout(changeTimeout)
      }

      changeTimeout = setTimeout(() => {
        const noteData = getCurrentNoteData()
        emit('update:modelValue', noteData)
        emit('note-changed', noteData)
      }, 100)
    }

    // UPDATED: Backend-compatible save handler
    const handleSave = () => {
      const noteData = getCurrentNoteData()

      // Validate that we have content
      if (!noteData.subject.trim() && !noteData.noteContent.trim()) {
        // Could emit an error or show notification
        console.warn('Note has no content')
        return
      }

      // Backend-compatible data structure
      const backendData = {
        subject: noteData.subject.trim(),
        noteContent: noteData.noteContent,
        mentions: noteData.mentions,
        // Default values for other required backend fields
        noteType: 'General',
        isImportant: false,
        isPrivate: false
      }

      emit('save-note', backendData)
    }

    const handleCancel = () => {
      emit('cancel-note')
    }

    // UPDATED: Load existing note with backend structure
    const loadExistingNote = (noteData) => {
      if (!noteData) return

      // Handle both frontend and backend data structures
      noteTitle.value = noteData.subject || noteData.title || ''

      // Ensure mentions have proper structure
      const mentions = (noteData.mentions || []).map(mention => ({
        id: mention.id || `mention-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        recCode: mention.recCode,
        name: mention.name,
        userRole: mention.userRole,
        mentionPosition: mention.mentionPosition || 0
      }))

      currentMentions.value = [...mentions]

      nextTick(() => {
        if (editor.value) {
          let htmlContent = noteData.noteContent || noteData.htmlContent || ''

          if (mentions.length > 0) {
            htmlContent = reconstructMentions(htmlContent, mentions)
          }

          editor.value.innerHTML = htmlContent
          attachMentionHandlers()
        }
      })
    }

    // UPDATED: Reconstruct mentions using backend MentionDTO structure
    const reconstructMentions = (htmlContent, mentions) => {
      let reconstructedContent = htmlContent

      // Handle both stored mention spans and plain @mentions
      mentions.forEach(mention => {
        // Pattern 1: Already stored as mention spans (from previous edits)
        const storedMentionRegex = new RegExp(
          `<span[^>]*data-mention-id="${mention.id}"[^>]*>@${mention.name}</span>`,
          'g'
        )

        // Pattern 2: Plain @mentions that need to be converted to chips
        const plainMentionRegex = new RegExp(`@${mention.name}(?=\\s|$|[.,!?])`, 'g')

        const interactiveChip = `
          <span class="mention-chip" contenteditable="false"
                data-mention-id="${mention.id}"
                data-rec-code="${mention.recCode}"
                data-user-role="${mention.userRole}"
                style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 12px; padding: 2px 8px; margin: 0 2px; display: inline-block; color: #1976d2; font-size: 14px; white-space: nowrap;">
            <span class="mention-text">@${mention.name}</span>
            <span class="mention-remove" data-action="remove-mention" style="margin-left: 4px; cursor: pointer; color: #666;">×</span>
          </span>
        `

        // Replace both patterns
        reconstructedContent = reconstructedContent
          .replace(storedMentionRegex, interactiveChip)
          .replace(plainMentionRegex, interactiveChip)
      })

      return reconstructedContent
    }

    const validateNote = () => {
      const noteData = getCurrentNoteData()
      const errors = []
      const warnings = []

      // Check for empty content
      if (!noteData.subject.trim() && !noteData.noteContent.trim()) {
        errors.push('Note cannot be empty')
      }

      // Check subject length
      if (noteData.subject.length > 200) {
        errors.push('Subject cannot exceed 200 characters')
      }

      // Check content length (assuming 5000 char limit)
      if (noteData.noteContent.length > 5000) {
        errors.push('Note content cannot exceed 5000 characters')
      }

      // Check mention count
      if (noteData.mentions.length > 50) {
        warnings.push('Note has many mentions which may impact performance')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    }

    const attachMentionHandlers = () => {
      const chips = editor.value.querySelectorAll('.mention-chip')
      chips.forEach(chip => {
        chip.addEventListener('click', (event) => {
          if (event.target.dataset.action === 'remove-mention') {
            removeMention(chip)
            event.preventDefault()
            event.stopPropagation()
          }
        })
      })
    }

    // Watch for existing note changes
    watch(() => props.existingNote, (newNote) => {
      if (newNote) {
        loadExistingNote(newNote)
      }
    }, { immediate: true })

    // Watch for model value changes from parent
    watch(() => props.modelValue, (newValue) => {
      if (newValue && newValue !== getCurrentNoteData()) {
        loadExistingNote(newValue)
      }
    }, { deep: true })

    onMounted(() => {
      nextTick(() => {
        if (editor.value) {
          const style = document.createElement('style')
          style.textContent = `
            .editor-content:empty:before {
              content: attr(placeholder);
              color: #999;
              pointer-events: none;
            }
            .editor-content:focus:empty:before {
              content: '';
            }
          `
          document.head.appendChild(style)

          if (props.existingNote) {
            loadExistingNote(props.existingNote)
          } else if (props.modelValue && (props.modelValue.subject || props.modelValue.noteContent)) {
            loadExistingNote(props.modelValue)
          }
        }
      })
    })

    return {
      editor,
      noteTitle,
      showMentionDropdown,
      filteredUsers,
      selectedMentionIndex,
      dropdownStyle,
      editorStyle,
      execCommand,
      isCommandActive,
      toggleHtmlView,
      onEditorInput,
      onKeyDown,
      onKeyUp,
      onEditorClick,
      selectMention,
      handleSave,
      handleCancel,
      handleChange,
      validateNote
    }
  }
}
</script>

<style scoped>
.note-editor-container {
  width: 100%;
}

.editor-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  min-height: 40px !important;
  padding: 4px 8px;
}

.editor-content {
  direction: ltr !important;
  text-align: left !important;
  writing-mode: horizontal-tb !important;
}

.editor-content-wrapper {
  position: relative;
}

.mention-dropdown {
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.mention-chip {
  user-select: none;
}

.mention-remove:hover {
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.note-editor-container .editor-container {
  border: none;
}

.note-editor-container .editor-content[contenteditable="false"] {
  border: none;
  background: transparent;
  cursor: default;
}

.note-editor-container .editor-content[contenteditable="false"] .mention-chip {
  pointer-events: none;
}

.note-editor-container .editor-content[contenteditable="false"] .mention-remove {
  display: none;
}
</style>
