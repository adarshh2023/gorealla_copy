<template>
  <q-drawer
    v-model="isOpen"
    side="right"
    :width="drawerWidth"
    :breakpoint="768"
    bordered
    overlay
    class="property-drawer"
  >
    <!-- Header Bar -->
    <q-bar class="drawer-header-bar">
      <q-icon :name="nodeIcon" :color="iconColor" size="24px" />
      <div class="q-ml-sm">
        <div class="text-weight-medium">{{ nodeName }}</div>
        <div class="text-caption text-grey-6">{{ nodeType }}</div>
      </div>
      <q-space />
      <q-btn
        icon="close"
        flat
        round
        dense
        @click="handleClose"
      />
    </q-bar>

    <!-- Progress Section -->
    <div v-if="completionPercentage !== null" class="progress-section q-px-md q-py-sm">
      <div class="progress-label">
        <span>Progress</span>
        <span class="text-weight-bold">{{ completionPercentage }}%</span>
      </div>
      <q-linear-progress
        :value="completionPercentage / 100"
        color="positive"
        track-color="grey-3"
        size="8px"
        rounded
      />
    </div>

    <!-- Tabs -->
    <q-tabs
      v-model="activeTab"
      dense
      active-color="primary"
      indicator-color="purple"
      align="justify"
      narrow-indicator
    >
      <q-tab name="basic" label="Basic" />

      <q-tab name="tasks" label="Tasks">
        <!-- Show loading spinner during preload, otherwise show count badge -->
        <q-spinner-dots
          v-if="isPreloadingTasks"
          size="16px"
          color="primary"
          class="q-ml-xs"
        />
        <q-badge
          v-else-if="taskCount > 0"
          color="primary"
          floating
        >
          {{ taskCount }}
        </q-badge>
      </q-tab>

      <q-tab name="notes" label="Notes">
        <!-- Show loading spinner during preload, otherwise show count badge -->
        <q-spinner-dots
          v-if="isPreloadingNotes"
          size="16px"
          color="primary"
          class="q-ml-xs"
        />
        <q-badge
          v-else-if="noteCount > 0"
          color="primary"
          floating
        >
          {{ noteCount }}
        </q-badge>
      </q-tab>

      <q-tab name="gallery" label="Gallery">
        <!-- Show loading spinner during preload, otherwise show count badge -->
        <q-spinner-dots
          v-if="isPreloadingGallery"
          size="16px"
          color="primary"
          class="q-ml-xs"
        />
        <q-badge
          v-else-if="galleryCount > 0"
          color="primary"
          floating
        >
          {{ galleryCount }}
        </q-badge>
      </q-tab>

      <q-tab name="stakeholders" label="Stakeholders">
        <!-- Show loading spinner during preload, otherwise show count badge -->
        <q-spinner-dots
          v-if="isPreloadingStakeholders"
          size="16px"
          color="primary"
          class="q-ml-xs"
        />
        <q-badge
          v-else-if="stakeholderCount > 0"
          color="primary"
          floating
        >
          {{ stakeholderCount }}
        </q-badge>
      </q-tab>

      <q-tab name="chat" label="Chat">
        <q-badge v-if="unreadMessages > 0" color="negative" floating>{{ unreadMessages }}</q-badge>
      </q-tab>
    </q-tabs>

    <q-separator />

    <!-- Tab Panels -->
    <q-tab-panels
      v-model="activeTab"
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      class="tab-panels"
    >
      <!-- Basic Tab -->
      <q-tab-panel name="basic" class="q-pa-md">
        <!-- Basic tab content remains the same -->
        <div v-if="isLoadingProperties" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else class="basic-properties">
          <div class="row q-col-gutter-xs">
            <!-- Start Date -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="nodeData.startDate"
                label="Start Date"
                dense
                mask="##-##-####"
                outlined
                :rules="[val => !val || /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Invalid date format']"
                @update:model-value="handlePropertyChange('startDate', $event)"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="nodeData.startDate"
                        mask="DD-MM-YYYY"
                        format="DD-MM-YYYY"
                        @update:model-value="handlePropertyChange('startDate', $event)"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- End Date -->
            <div class="col-12 col-sm-6">
              <q-input
                v-model="nodeData.endDate"
                label="End Date"
                outlined
                dense
                mask="##-##-####"
                :rules="[val => !val || /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Invalid date format']"
                @update:model-value="handlePropertyChange('endDate', $event)"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="nodeData.endDate"
                        mask="DD-MM-YYYY"
                        format="DD-MM-YYYY"
                        @update:model-value="handlePropertyChange('endDate', $event)"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Priority -->
            <div class="col-12 col-sm-6">
              <q-select
                v-model="nodeData.priority"
                label="Priority"
                :options="priorityOptions"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="handlePropertyChange('priority', $event)"
              >
                <template v-slot:selected-item="scope">
                  <q-chip
                    :color="getPriorityColor(scope.opt.value)"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ scope.opt.label }}
                  </q-chip>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-chip
                        :color="getPriorityColor(scope.opt.value)"
                        text-color="white"
                        size="sm"
                      >
                        {{ scope.opt.label }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Status -->
            <div class="col-12 col-sm-6">
              <q-select
                v-model="nodeData.status"
                label="Status"
                :options="statusOptions"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="handlePropertyChange('status', $event)"
              >
                <template v-slot:selected-item="scope">
                  <q-chip
                    :color="getStatusColor(scope.opt.value)"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ scope.opt.label }}
                  </q-chip>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-chip
                        :color="getStatusColor(scope.opt.value)"
                        text-color="white"
                        size="sm"
                      >
                        {{ scope.opt.label }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Budget Amount -->
            <div class="col-12">
              <q-input
                v-model.number="nodeData.budgetAmount"
                label="Budgeted Amount"
                outlined
                dense
                type="number"
                prefix="₹"
                :rules="[val => val >= 0 || 'Amount must be positive']"
                @update:model-value="handlePropertyChange('budgetAmount', $event)"
              />
            </div>

            <!-- Description -->
            <div class="col-12">
              <q-input
                v-model="nodeData.nodeDescription"
                label="Description"
                outlined
                dense
                type="textarea"
                rows="3"
                @update:model-value="handlePropertyChange('nodeDescription', $event)"
              />
            </div>
          </div>

          <!-- Custom Properties (if any) -->
          <div v-if="customProperties.length > 0" class="custom-properties q-mt-lg">
            <h6 class="text-subtitle1 q-mb-md">Additional Properties</h6>
            <div class="row q-col-gutter-md">
              <div
                v-for="prop in customProperties"
                :key="prop.recCode"
                class="col-12"
                :class="prop.dataType === 'BOOLEAN' ? 'col-sm-6' : ''"
              >
                <component
                  :is="getPropertyComponent(prop.dataType)"
                  v-model="customPropertyValues[prop.recCode]"
                  :label="prop.propertyName"
                  :options="prop.listValues"
                  filled
                  dense
                  @update:model-value="handleCustomPropertyChange(prop.recCode, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>

      <!-- Tasks Tab -->
      <q-tab-panel name="tasks" class="q-pa-md">
        <!-- Tasks tab content remains the same -->
        <div class="tasks-header q-mb-md">
          <q-btn
            label="Add Task"
            icon="add"
            color="primary"
            size="sm"
            @click="showAddTaskDialog = true"
          />
        </div>

        <div v-if="isLoadingTasks" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else-if="tasks.length === 0" class="empty-state text-center q-pa-lg">
          <q-icon name="assignment" size="48px" color="grey-5" />
          <p class="text-grey-6 q-mt-md">No tasks yet</p>
        </div>

        <q-list v-else separator class="tasks-list">
          <q-item
            v-for="task in tasks"
            :key="task.recCode"
            clickable
            @click="editTask(task)"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="task.status === 'Completed'"
                @update:model-value="toggleTaskStatus(task)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label :class="{ 'text-strike': task.status === 'Completed' }">
                {{ task.taskName }}
              </q-item-label>
              <q-item-label caption>
                <span v-if="task.assignedUserName">
                  <q-icon name="person" size="xs" />
                  {{ task.assignedUserName }}
                </span>
                <span v-if="task.dueDate" class="q-ml-sm">
                  <q-icon name="event" size="xs" />
                  {{ formatDate(task.dueDate) }}
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-right">
                <q-chip
                  :color="getStatusColor(task.status)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ task.status }}
                </q-chip>
                <q-chip
                  :color="getPriorityColor(task.priority)"
                  text-color="white"
                  size="sm"
                  dense
                  class="q-ml-xs"
                >
                  {{ task.priority }}
                </q-chip>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-tab-panel>

      <!-- Notes Tab -->
      <q-tab-panel name="notes" class="q-pa-md">
        <!-- Notes tab header -->
        <div class="notes-header q-mb-md">
          <q-btn
            label="Add Note"
            icon="add"
            color="primary"
            size="sm"
            @click="showAddNoteDialog = true"
          />
        </div>

        <div v-if="isLoadingNotes" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
        </div>

        <div v-else-if="notes.length === 0" class="empty-state text-center q-pa-lg">
          <q-icon name="sticky_note_2" size="48px" color="grey-5" />
          <p class="text-grey-6 q-mt-md">No notes yet</p>
        </div>

        <div v-else class="notes-list">
          <q-card
            v-for="(note, index) in notes"
            :key="note.recCode"
            class="note-card q-mb-md"
            flat
            bordered
          >
            <q-card-section>
              <!-- Note Header with User Info -->
              <div class="note-header q-mb-sm">
                <div class="note-meta">
                  <div class="note-author-info">
                    <q-icon name="person" size="16px" class="q-mr-xs text-grey-6" />
                    <span class="text-weight-medium text-primary">
                      {{ note.insertUserName || 'Unknown User' }}
                    </span>
                    <span class="text-grey-6 q-mx-sm">•</span>
                    <span class="text-caption text-grey-6">
                      {{ formatDateTime(note.insertDate) }}
                    </span>
                  </div>
                </div>

                <div class="note-actions">
                  <q-btn
                    icon="edit"
                    size="sm"
                    flat
                    round
                    dense
                    :disable="!canEditNoteWithTimestamp(note, index)"
                    :color="canEditNoteWithTimestamp(note, index) ? 'primary' : 'grey-5'"
                    @click="editNote(note)"
                  >
                    <q-tooltip>{{ getEditTooltipText(note, index) }}</q-tooltip>
                  </q-btn>
                  <q-btn
                    icon="delete"
                    size="sm"
                    flat
                    round
                    dense
                    @click="deleteNote(note)"
                    :disable="!canEditNoteWithTimestamp(note, index)"
                    :color="canEditNoteWithTimestamp(note, index) ? 'negative' : 'grey-5'"
                  >
                    <q-tooltip>
                      {{ canEditNoteWithTimestamp(note, index) ? 'Delete note' : getEditTooltipText(note, index) }}
                    </q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Note Subject -->
              <div v-if="note.subject" class="note-subject text-weight-medium q-mb-xs">
                {{ note.subject }}
              </div>

              <!-- Note Content with Mentions -->
              <div class="note-content-container">
                <div
                  class="note-content"
                  v-html="getDisplayContent(note)"
                ></div>

                <!-- More/Less Button -->
                <div
                  v-if="isContentTruncated(note.noteContent)"
                  class="note-expand-controls q-mt-sm"
                >
                  <q-btn
                    :label="isNoteExpanded(note.recCode) ? 'Show less' : 'Show more'"
                    size="sm"
                    flat
                    dense
                    color="primary"
                    class="text-underline"
                    @click="toggleNoteExpansion(note.recCode)"
                  />
                </div>
              </div>

              <!-- Mentions Display -->
              <div v-if="note.mentions && note.mentions.length > 0" class="note-mentions q-mt-sm">
                <div class="text-caption text-grey-6 q-mb-xs">Mentioned:</div>
                <div class="mentions-chips">
                  <q-chip
                    v-for="mention in note.mentions"
                    :key="mention.recCode"
                    size="sm"
                    color="primary"
                    text-color="white"
                    icon="alternate_email"
                    class="q-mr-xs q-mb-xs"
                  >
                    {{ mention.name }}
                  </q-chip>
                </div>
              </div>

              <!-- Note Type and Important Badge -->
              <div v-if="note.noteType !== 'General' || note.isImportant" class="note-badges q-mt-sm">
                <q-chip
                  v-if="note.noteType !== 'General'"
                  :label="note.noteType"
                  size="sm"
                  color="grey-3"
                  text-color="grey-8"
                />
                <q-chip
                  v-if="note.isImportant"
                  label="Important"
                  size="sm"
                  color="orange"
                  text-color="white"
                  icon="star"
                />
                <q-chip
                  v-if="note.isPrivate"
                  label="Private"
                  size="sm"
                  color="purple"
                  text-color="white"
                  icon="lock"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-tab-panel>

      <!-- Gallery Tab - NEW IMPLEMENTATION -->
      <q-tab-panel name="gallery" class="q-pa-none">
        <GalleryTab
          :node-id="nodeId"
          @gallery-loaded="handleGalleryLoaded"
          @gallery-error="handleGalleryError"
        />
      </q-tab-panel>

      <!-- Stakeholders Tab - NEW IMPLEMENTATION -->
      <q-tab-panel name="stakeholders" class="q-pa-md">
        <StakeholderAssignmentTab
          :node-id="nodeId"
          @assignments-loaded="handleAssignmentsLoaded"
          @assignments-error="handleAssignmentsError"
        />
      </q-tab-panel>

      <!-- Chat Tab -->
      <q-tab-panel name="chat" class="chat-panel q-pa-none">
        <!-- Chat tab content remains the same -->
        <div class="chat-container">
          <!-- Messages Area -->
          <div
            ref="messagesContainer"
            class="messages-area q-pa-md"
            @scroll="handleMessagesScroll"
          >
            <div v-if="isLoadingMessages" class="text-center q-pa-lg">
              <q-spinner-dots size="40px" color="primary" />
            </div>

            <div v-else-if="messages.length === 0" class="empty-state text-center q-pa-lg">
              <q-icon name="chat_bubble_outline" size="48px" color="grey-5" />
              <p class="text-grey-6 q-mt-md">No messages yet. Start the conversation!</p>
            </div>

            <div v-else class="messages-list">
              <div
                v-for="(message, index) in messages"
                :key="message.recCode"
                class="message-item q-mb-md"
                :class="{ 'own-message': isOwnMessage(message) }"
              >
                <!-- Date separator -->
                <div
                  v-if="shouldShowDateSeparator(message, index)"
                  class="date-separator text-center q-my-md"
                >
                  <q-chip size="sm" color="grey-3" text-color="grey-7">
                    {{ formatMessageDate(message.insertDate) }}
                  </q-chip>
                </div>

                <div class="message-bubble">
                  <div class="message-header">
                    <span class="sender-name">{{ message.senderName }}</span>
                    <span class="message-time text-caption text-grey-6">
                      {{ formatTime(message.insertDate) }}
                    </span>
                  </div>

                  <div class="message-content">
                    {{ message.content }}
                  </div>

                  <!-- Mentions -->
                  <div v-if="message.mentions && message.mentions.length > 0" class="message-mentions">
                    <q-chip
                      v-for="mention in message.mentions"
                      :key="mention.userId"
                      size="sm"
                      color="primary"
                      text-color="white"
                      icon="alternate_email"
                    >
                      {{ mention.userName }}
                    </q-chip>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <q-separator />
            <div class="q-pa-md">
              <div class="row q-col-gutter-sm">
                <div class="col">
                  <q-input
                    v-model="newMessage"
                    placeholder="Type a message..."
                    dense
                    outlined
                    @keyup.enter="sendMessage"
                  >
                    <template v-slot:prepend>
                      <q-btn
                        icon="alternate_email"
                        size="sm"
                        flat
                        round
                        dense
                        @click="showMentionMenu = true"
                      >
                        <q-tooltip>Mention someone</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </div>
                <div class="col-auto">
                  <q-btn
                    icon="send"
                    color="primary"
                    round
                    dense
                    :disable="!newMessage.trim()"
                    @click="sendMessage"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Task Dialog -->
    <q-dialog v-model="showAddTaskDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">{{ editingTask ? 'Edit Task' : 'Add Task' }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="taskForm.taskName"
            label="Task Name"
            filled
            dense
            :rules="[val => !!val || 'Task name is required']"
          />

          <q-input
            v-model="taskForm.taskDescription"
            label="Description"
            filled
            dense
            type="textarea"
            rows="2"
            class="q-mt-md"
          />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-select
                v-model="taskForm.priority"
                label="Priority"
                :options="priorityOptions"
                filled
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="taskForm.status"
                label="Status"
                :options="statusOptions"
                filled
                dense
                emit-value
                map-options
              />
            </div>
          </div>

          <q-select
            v-model="taskForm.assignedUserId"
            label="Assign To"
            :options="userOptions"
            option-value="recCode"
            option-label="fullName"
            emit-value
            map-options
            filled
            dense
            class="q-mt-md"
            use-input
            @filter="filterUsers"
          />

          <q-input
            v-model="taskForm.dueDate"
            label="Due Date"
            filled
            dense
            mask="##-##-####"
            class="q-mt-md"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="taskForm.dueDate"
                    mask="DD-MM-YYYY"
                    format="DD-MM-YYYY"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="Close" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelTaskEdit" />
          <q-btn flat label="Save" color="primary" @click="saveTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Note Dialog with NoteEditor Component -->
    <q-dialog v-model="showAddNoteDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px;">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingNote ? 'Edit Note' : 'Add Note' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 80vh" class="scroll">
          <NoteEditor
            :users="projectUsers"
            v-model="currentNoteData"
            :existing-note="editingNote"
            :readonly="editingNote && !canEditNote(editingNote)"
            @save-note="handleNoteSave"
            @cancel-note="handleNoteCancel"
            @note-changed="handleNoteChange"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-drawer>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useGalleryStore } from 'stores/gallery'
import { useProjectStore } from 'stores/project'
import projectService from 'src/services/api/project.service'
import taskService from 'src/services/api/task.service'
import noteService from 'src/services/api/note.service'
import chatService from 'src/services/api/chat.service'
import propertyService from 'src/services/api/property.service'
import userService from 'src/services/api/user.service'
import { useAuthStore } from 'stores/auth'
import { showSuccess, showError } from 'src/utils/notification'
import GalleryTab from './GalleryTab.vue'
import StakeholderAssignmentTab from './StakeholderAssignmentTab.vue'
import NoteEditor from './NoteEditor.vue'

// Props
const props = defineProps({
  nodeId: {
    type: String,
    required: true
  },
  nodeName: {
    type: String,
    required: true
  },
  nodeType: {
    type: String,
    default: ''
  },
  nodeTypeId: {
    type: String,
    default: null
  },
  nodeIcon: {
    type: String,
    default: 'folder'
  },
  iconColor: {
    type: String,
    default: 'primary'
  },
  completionPercentage: {
    type: Number,
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'basic',
    validator: (value) => ['basic', 'tasks', 'notes', 'gallery', 'stakeholders', 'chat'].includes(value)
  },
  // NEW: Project users and stakeholders for mentions
  projectUsers: {
    type: Array,
    default: () => [],
    validator: (users) => {
      return users.every(user =>
        'recCode' in user &&
        'name' in user &&
        'userRole' in user
      )
    }
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'node-updated'])

// Composables
const $q = useQuasar()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()
const projectStore = useProjectStore()

// Drawer state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Auto-save handling
const autoSaveTimer = ref(null)
const pendingChanges = ref({})

// Screen size based drawer width
const drawerWidth = computed(() => {
  if ($q.screen.lt.sm) return $q.screen.width
  if ($q.screen.lt.md) return 400
  return 500
})

// Tab state
const activeTab = ref(props.initialTab)

// Basic properties data
const isLoadingProperties = ref(false)
const nodeData = ref({
  startDate: '',
  endDate: '',
  priority: 'Medium',
  status: 'Not Started',
  budgetAmount: 0,
  nodeDescription: ''
})

// Custom properties
const customProperties = ref([])
const customPropertyValues = ref({})

// Options
const priorityOptions = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
  { label: 'Urgent', value: 'Urgent' }
]

const statusOptions = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' }
]

// Tasks data
const isLoadingTasks = ref(false)
const tasks = ref([])
const taskCount = computed(() => tasks.value.length)
const showAddTaskDialog = ref(false)
const editingTask = ref(null)
const taskForm = ref({
  taskName: '',
  taskDescription: '',
  priority: 'Medium',
  status: 'Not Started',
  assignedUserId: null,
  dueDate: ''
})

// Notes data
const isLoadingNotes = ref(false)
const notes = ref([])
const noteCount = computed(() => notes.value.length)
const showAddNoteDialog = ref(false)
const editingNote = ref(null)
const currentNoteData = ref({
  subject: '',        // Changed from 'title'
  noteContent: '',    // Changed from 'htmlContent'
  mentions: []        // Remove 'plainContent'
})
const expandedNotes = ref(new Set())
const TRUNCATE_WORDS = 50

// Gallery data
const isPreloadingGallery = ref(false)
const galleryCount = computed(() => {
  return galleryStore.gallerySummary?.totalCount || 0
})

// Stakeholder assignment data
const isPreloadingStakeholders = ref(false)
const stakeholderCount = computed(() => {
  return assignments.value.length
})
const assignments = ref([])

// Chat data
const isLoadingMessages = ref(false)
const messages = ref([])
const unreadMessages = ref(0)
const newMessage = ref('')
const chatId = ref(null)
const messagesContainer = ref(null)
const showMentionMenu = ref(false)

// Users for assignment
const userOptions = ref([])
const filteredUserOptions = ref([])

// Preloading
const isPreloadingNotes = ref(false)
const isPreloadingTasks = ref(false)
const preloadErrors = ref({
  notes: false,
  tasks: false,
  gallery: false
})

// Gallery event handlers
const handleGalleryLoaded = (summary) => {
  console.log('Gallery loaded:', summary)
  isPreloadingGallery.value = false
  preloadErrors.value.gallery = false
}

const handleGalleryError = (error) => {
  console.error('Gallery error:', error)
  isPreloadingGallery.value = false
  preloadErrors.value.gallery = true
}

// Preloading functions
const preloadGallery = async () => {
  if (galleryStore.galleryItems.length > 0 && galleryStore.currentNodeId === props.nodeId) {
    return // Already loaded for this node
  }

  isPreloadingGallery.value = true
  preloadErrors.value.gallery = false

  try {
    galleryStore.setCurrentNode(props.nodeId)
    await galleryStore.loadGallerySummary()
  } catch (error) {
    console.error('Failed to preload gallery:', error)
    preloadErrors.value.gallery = true
  } finally {
    isPreloadingGallery.value = false
  }
}

// Preload stakeholder assignments
const preloadStakeholders = async () => {
  if (assignments.value.length > 0) return

  isPreloadingStakeholders.value = true
  preloadErrors.value.stakeholders = false

  try {
    const assignmentData = await projectStore.fetchNodeAssignments(props.nodeId)
    assignments.value = assignmentData
  } catch (error) {
    console.error('Failed to preload stakeholder assignments:', error)
    preloadErrors.value.stakeholders = true
  } finally {
    isPreloadingStakeholders.value = false
  }
}

// Methods (keeping all existing methods from the original component)
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-')
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessageDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return formatDate(dateString)
  }
}

// Property helpers
const getPriorityColor = (priority) => {
  const colorMap = {
    'Low': 'grey',
    'Medium': 'primary',
    'High': 'warning',
    'Urgent': 'negative'
  }
  return colorMap[priority] || 'grey'
}

const getStatusColor = (status) => {
  const colorMap = {
    'Not Started': 'grey',
    'Pending': 'grey',
    'In Progress': 'primary',
    'On Hold': 'warning',
    'Completed': 'positive',
    'Cancelled': 'negative'
  }
  return colorMap[status] || 'grey'
}

// Property component based on data type
const getPropertyComponent = (dataType) => {
  switch (dataType) {
    case 'BOOLEAN':
      return 'q-toggle'
    case 'DATE':
      return 'q-input'
    case 'NUMBER':
    case 'CURRENCY':
      return 'q-input'
    case 'DROPDOWN':
      return 'q-select'
    default:
      return 'q-input'
  }
}

// Load node data
const loadNodeData = async () => {
  if (!props.nodeId) return

  isLoadingProperties.value = true
  try {
    const response = await projectService.getNodeById(props.nodeId)
    if (response.success) {
      const node = response.data
      nodeData.value = {
        startDate: formatDate(node.startDate),
        endDate: formatDate(node.endDate),
        priority: node.priority || 'Medium',
        status: node.status || 'Not Started',
        budgetAmount: node.budgetAmount || 0,
        nodeDescription: node.nodeDescription || ''
      }
    }

    if (props.nodeTypeId) {
      await loadCustomProperties()
    }
  } catch (error) {
    console.error('Failed to load node data:', error)
  } finally {
    isLoadingProperties.value = false
  }
}

// Load custom properties
const loadCustomProperties = async () => {
  try {
    const propDefsResponse = await propertyService.getPropertiesForNodeType(props.nodeTypeId)
    if (propDefsResponse.success) {
      customProperties.value = propDefsResponse.data

      const propValuesResponse = await propertyService.getNodePropertiesAsMap(props.nodeId)
      if (propValuesResponse.success) {
        customPropertyValues.value = propValuesResponse.data
      }
    }
  } catch (error) {
    console.error('Failed to load custom properties:', error)
  }
}

// Handle property changes with auto-save
const handlePropertyChange = (property, value) => {
  pendingChanges.value[property] = value

  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    saveProperties()
  }, 1500)
}

const handleCustomPropertyChange = (propertyDefId, value) => {
  pendingChanges.value[`custom_${propertyDefId}`] = value

  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    saveProperties()
  }, 1500)
}

// Assignment event handlers
const handleAssignmentsLoaded = (assignmentData) => {
  console.log('Assignments loaded:', assignmentData)
  assignments.value = assignmentData
  isPreloadingStakeholders.value = false
  preloadErrors.value.stakeholders = false
}

const handleAssignmentsError = (error) => {
  console.error('Assignment error:', error)
  isPreloadingStakeholders.value = false
  preloadErrors.value.stakeholders = true
}

// Save properties
const saveProperties = async () => {
  try {
    const updates = {}
    const customUpdates = {}

    Object.entries(pendingChanges.value).forEach(([key, value]) => {
      if (key.startsWith('custom_')) {
        const propId = key.replace('custom_', '')
        customUpdates[propId] = value
      } else {
        if (key === 'startDate' || key === 'endDate') {
          if (value) {
            const [day, month, year] = value.split('-')
            updates[key] = `${year}-${month}-${day}`
          } else {
            updates[key] = null
          }
        } else {
          updates[key] = value
        }
      }
    })

    if (Object.keys(updates).length > 0) {
      await projectService.updateNode(props.nodeId, updates)
    }

    if (Object.keys(customUpdates).length > 0) {
      await propertyService.setNodeProperties(props.nodeId, customUpdates)
    }

    pendingChanges.value = {}
    showSuccess('Properties saved')
    emit('node-updated', { nodeId: props.nodeId, updates })
  } catch (error) {
    showError('Failed to save properties')
    console.error('Save properties error:', error)
  }
}

// Tasks methods (keeping all existing task methods)
const loadTasks = async (forceRefresh = false) => {
  if (!forceRefresh && tasks.value.length > 0 && !preloadErrors.value.tasks) {
    return
  }

  isLoadingTasks.value = true
  try {
    const response = await taskService.getNodeTasks(props.nodeId)
    if (response.success) {
      tasks.value = response.data
    }
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    isLoadingTasks.value = false
  }
}

const editTask = (task) => {
  editingTask.value = task
  taskForm.value = {
    taskName: task.taskName,
    taskDescription: task.taskDescription || '',
    priority: task.priority,
    status: task.status,
    assignedUserId: task.assignedUserId,
    dueDate: formatDate(task.dueDate)
  }
  showAddTaskDialog.value = true
}

const saveTask = async () => {
  try {
    const taskData = {
      ...taskForm.value,
      nodeId: props.nodeId
    }

    if (taskData.dueDate) {
      const [day, month, year] = taskData.dueDate.split('-')
      taskData.dueDate = `${year}-${month}-${day}`
    }

    if (editingTask.value) {
      await taskService.updateTask(editingTask.value.recCode, taskData)
      showSuccess('Task updated')
    } else {
      await taskService.createTask(taskData)
      showSuccess('Task created')
    }

    showAddTaskDialog.value = false
    await loadTasks(true)
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to save task')
  }
}

const cancelTaskEdit = () => {
  showAddTaskDialog.value = false
  editingTask.value = null
  taskForm.value = {
    taskName: '',
    taskDescription: '',
    priority: 'Medium',
    status: 'Pending',
    assignedUserId: null,
    dueDate: ''
  }
}

const toggleTaskStatus = async (task) => {
  try {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
    await taskService.updateTaskStatus(task.recCode, { status: newStatus })
    task.status = newStatus
    showSuccess('Task status updated')
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to update task status')
  }
}

// Notes methods - Updated for NoteEditor integration
const loadNotes = async (forceRefresh = false) => {
  if (!forceRefresh && notes.value.length > 0 && !preloadErrors.value.notes) {
    return
  }

  isLoadingNotes.value = true
  try {
    const response = await noteService.getNodeNotes(props.nodeId)
    if (response.success) {
      notes.value = (response.data.content || []).map(note => ({
        ...note,
        // Ensure mentions have the correct structure
        mentions: note.mentions || []
      }))
    }
  } catch (error) {
    console.error('Failed to load notes:', error)
  } finally {
    isLoadingNotes.value = false
  }
}

const editNote = (note) => {
  editingNote.value = {
    ...note,
    subject: note.subject || '',           // Changed from 'title'
    noteContent: note.noteContent || '',   // Changed from 'htmlContent'
    mentions: note.mentions || []          // Keep mentions as is
  }

  currentNoteData.value = {
    subject: note.subject || '',           // Changed from 'title'
    noteContent: note.noteContent || '',   // Changed from 'htmlContent'
    mentions: note.mentions || []          // Keep mentions as is
  }

  showAddNoteDialog.value = true
}

// Note Editor event handlers
const handleNoteSave = async (noteData) => {
  try {
    // Validate note data before sending
    const validation = noteService.validateNoteData(noteData)
    if (!validation.isValid) {
      validation.errors.forEach(error => showError(error))
      return
    }

    // Show warnings if any
    validation.warnings.forEach(warning => {
      console.warn('Note validation warning:', warning)
    })

    // Process note data for backend compatibility
    const apiNoteData = noteService.processNoteForBackend({
      ...noteData,
      nodeId: props.nodeId,
      noteType: 'General'  // Default to General, can be made configurable
    })

    if (editingNote.value) {
      await noteService.updateNote(editingNote.value.recCode, apiNoteData)
      showSuccess('Note updated')
    } else {
      await noteService.createNote(apiNoteData)
      showSuccess('Note created')
    }

    showAddNoteDialog.value = false
    await loadNotes(true)
    resetNoteForm()
  } catch (error) {
    showError('Failed to save note')
    console.error('Note save error:', error)
  }
}

const handleNoteCancel = () => {
  showAddNoteDialog.value = false
  resetNoteForm()
}

const handleNoteChange = (noteData) => {
  currentNoteData.value = noteData
}

const resetNoteForm = () => {
  editingNote.value = null
  currentNoteData.value = {
    subject: '',        // Changed from 'title'
    noteContent: '',    // Changed from 'htmlContent'
    mentions: []
  }
}

const isNewestNote = (note, index) => {
  return index === 0
}

const canEditNoteWithTimestamp = (note, index) => {
  if (!canEditNote(note)) {
    return false
  }

  if (notes.value.length > 1 && !isNewestNote(note, index)) {
    return false
  }

  return true
}

const canEditNote = (note) => {
  return authStore.user?.recCode === note.insertUser
}

const getEditTooltipText = (note, index) => {
  if (!canEditNote(note)) {
    return "You don't have permission to edit this note"
  }

  if (notes.value.length > 1 && !isNewestNote(note, index)) {
    return "Note locked due to new note activity"
  }

  return "Edit note"
}

const deleteNote = async (note) => {
  $q.dialog({
    title: 'Delete Note',
    message: 'Are you sure you want to delete this note?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await noteService.deleteNote(note.recCode)
      showSuccess('Note deleted')
      await loadNotes(true)
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      showError('Failed to delete note')
    }
  })
}

// eslint-disable-next-line no-unused-vars
const truncateContent = (content, wordLimit = TRUNCATE_WORDS) => {
  if (!content) return ''

  const words = content.split(' ')
  if (words.length <= wordLimit) {
    return content
  }

  return words.slice(0, wordLimit).join(' ')
}

const isContentTruncated = (content, wordLimit = TRUNCATE_WORDS) => {
  if (!content) return false
  return content.split(' ').length > wordLimit
}

const toggleNoteExpansion = (noteId) => {
  if (expandedNotes.value.has(noteId)) {
    expandedNotes.value.delete(noteId)
  } else {
    expandedNotes.value.add(noteId)
  }
}

const isNoteExpanded = (noteId) => {
  return expandedNotes.value.has(noteId)
}

const getDisplayContent = (note) => {
  if (!isContentTruncated(note.noteContent)) {
    return note.noteContent
  }

  if (isNoteExpanded(note.recCode)) {
    return note.noteContent
  }

  // Use the note service utility for creating excerpts
  return noteService.createNoteExcerpt(note.noteContent, TRUNCATE_WORDS * 10) // Approximate word to character conversion
}

// eslint-disable-next-line no-unused-vars
const formatNotesForDisplay = (rawNotes) => {
  return rawNotes.map(note => noteService.formatNoteDisplay(note))
}

// eslint-disable-next-line no-unused-vars
const getMentionSummary = (note) => {
  if (!note.mentions || note.mentions.length === 0) {
    return null
  }

  const userMentions = note.mentions.filter(m => m.userRole === 'User')
  const stakeholderMentions = note.mentions.filter(m => m.userRole === 'Stakeholder')

  return {
    total: note.mentions.length,
    users: userMentions.length,
    stakeholders: stakeholderMentions.length,
    names: note.mentions.map(m => m.name).join(', ')
  }
}

// Chat methods (keeping all existing chat methods)
const loadChat = async () => {
  isLoadingMessages.value = true
  try {
    const chatsResponse = await chatService.getNodeChats(props.nodeId)
    if (chatsResponse.success && chatsResponse.data.content.length > 0) {
      if (chatsResponse.data.length !== 0) {
        chatId.value = chatsResponse.data.content[0].recCode
        await loadMessages()
      }
    } else {
      const newChatResponse = await chatService.createChat({
        chatName: `Chat - ${props.nodeName}`,
        chatType: 'Node',
        nodeId: props.nodeId
      })
      if (newChatResponse.success) {
        chatId.value = newChatResponse.data.recCode
      }
    }
  } catch (error) {
    console.error('Failed to load chat:', error)
  } finally {
    isLoadingMessages.value = false
  }
}

const loadMessages = async () => {
  if (!chatId.value) return

  try {
    const response = await chatService.getUndeletedMessages(chatId.value)
    if (response.success) {
      messages.value = response.data.content || []
      await nextTick()
      scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !chatId.value) return

  try {
    const messageData = {
      content: newMessage.value,
      messageType: 'Text'
    }

    await chatService.sendMessage(chatId.value, messageData)
    newMessage.value = ''
    await loadMessages()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to send message')
  }
}

const isOwnMessage = (message) => {
  return message.senderId === authStore.user?.recCode
}

const shouldShowDateSeparator = (message, index) => {
  if (index === 0) return true

  const currentDate = new Date(message.insertDate).toDateString()
  const previousDate = new Date(messages.value[index - 1].insertDate).toDateString()

  return currentDate !== previousDate
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleMessagesScroll = () => {
  // TODO: Implement infinite scroll for loading more messages
}

// User filtering for task assignment
const loadUsers = async () => {
  try {
    const response = await userService.getAllUsers()
    if (response.success) {
      userOptions.value = response.data.content || []
      filteredUserOptions.value = userOptions.value
    }
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const filterUsers = (val, update) => {
  update(() => {
    if (val === '') {
      filteredUserOptions.value = userOptions.value
    } else {
      const needle = val.toLowerCase()
      filteredUserOptions.value = userOptions.value.filter(
        user => user.fullName.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

// Handle close
const handleClose = () => {
  if (Object.keys(pendingChanges.value).length > 0) {
    saveProperties()
  }
  isOpen.value = false
}

// Clear all tab data
const clearAllTabData = () => {
  tasks.value = []
  notes.value = []
  messages.value = []
  chatId.value = null
  unreadMessages.value = 0
  newMessage.value = ''
  isLoadingTasks.value = false
  isLoadingNotes.value = false
  isLoadingMessages.value = false
  resetNoteForm()
}

// Preloading functions
const preloadNotes = async () => {
  if (notes.value.length > 0) return

  isPreloadingNotes.value = true
  preloadErrors.value.notes = false

  try {
    const response = await noteService.getNodeNotes(props.nodeId)
    if (response.success) {
      notes.value = response.data.content || []
    }
  } catch (error) {
    console.error('Failed to preload notes:', error)
    preloadErrors.value.notes = true
  } finally {
    isPreloadingNotes.value = false
  }
}

const preloadTasks = async () => {
  if (tasks.value.length > 0) return

  isPreloadingTasks.value = true
  preloadErrors.value.tasks = false

  try {
    const response = await taskService.getNodeTasks(props.nodeId)
    if (response.success) {
      tasks.value = response.data
    }
  } catch (error) {
    console.error('Failed to preload tasks:', error)
    preloadErrors.value.tasks = true
  } finally {
    isPreloadingTasks.value = false
  }
}

const preloadNotesAndTasksAndStakeholders = async () => {
  await Promise.allSettled([
    preloadNotes(),
    preloadTasks(),
    preloadGallery(),
    preloadStakeholders()
  ])
}

const loadAllData = async () => {
  await loadNodeData()
  await loadTasks()
  await loadNotes()
  await loadChat()
}

// Watch for tab changes
watch(activeTab, async (newTab) => {
  switch (newTab) {
    case 'basic':
      await loadNodeData()
      break
    case 'tasks':
      await loadTasks()
      break
    case 'notes':
      await loadNotes()
      break
    case 'gallery':
      // Gallery will auto-load when component is mounted
      break
    case 'stakeholders':
      // Stakeholder tab will auto-load when component is mounted
      break
    case 'chat':
      await loadChat()
      break
  }
})

// watch projectUsers change
watch(() => props.projectUsers, (newUsers) => {
  if (newUsers && newUsers.length > 0) {
    console.log('Project users updated:', newUsers.length)
    // The NoteEditor will automatically receive the new data via props
  }
}, { immediate: true, deep: true })

// Watch for node changes
watch(() => props.nodeId, async (newNodeId, oldNodeId) => {
  if (newNodeId !== oldNodeId && isOpen.value) {
    console.log(`Node changed from ${oldNodeId} to ${newNodeId} - clearing and reloading data`)
    clearAllTabData()

    if (userOptions.value.length === 0) {
      await loadUsers()
    }

    loadAllData()
  }
}, { immediate: false })

// Watch for drawer open/close
watch(isOpen, async (newVal) => {
  if (newVal) {
    console.log(`Properties drawer opened for node: ${props.nodeId}`)
    console.log(`Initial tab: ${props.initialTab}`)

    clearAllTabData()

    // Set initial tab from props
    activeTab.value = props.initialTab

    if (userOptions.value.length === 0) {
      await loadUsers()
    }

    // Load basic data first
    await loadNodeData()

    // Then preload other data in background
    await preloadNotesAndTasksAndStakeholders()

    // If initial tab is not 'basic', load that tab's data immediately
    if (props.initialTab !== 'basic') {
      switch (props.initialTab) {
        case 'notes':
          await loadNotes(true)
          break
        case 'tasks':
          await loadTasks(true)
          break
        case 'chat':
          await loadChat()
          break
        // gallery and stakeholders load automatically via their components
      }
    }
  } else {
    clearAllTabData()
  }
}, { immediate: true })

watch(() => props.initialTab, (newTab) => {
  if (newTab && newTab !== activeTab.value) {
    console.log(`Switching to ${newTab} tab from notification`)
    activeTab.value = newTab

    // Trigger tab-specific loading if needed
    nextTick(() => {
      switch (newTab) {
        case 'notes':
          if (notes.value.length === 0) {
            loadNotes(true)
          }
          break
        case 'tasks':
          if (tasks.value.length === 0) {
            loadTasks(true)
          }
          break
        case 'gallery':
          // Gallery will auto-load
          break
        case 'stakeholders':
          // Stakeholders will auto-load
          break
        case 'chat':
          if (messages.value.length === 0) {
            loadChat()
          }
          break
      }
    })
  }
}, { immediate: true })

// Cleanup on unmount
onBeforeUnmount(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})
</script>

<style lang="scss" scoped>
// Keep all existing styles from the original component
.property-drawer {
  display: flex;
  flex-direction: column;
}

.drawer-header-bar {
  background: white;
  color: $dark;
  height: 50px;

  .text-weight-medium {
    font-size: 16px;
    line-height: 1.2;
  }

  .text-caption {
    font-size: 12px;
    line-height: 1.2;
  }
}

.progress-section {
  background: white;
  border-bottom: 1px solid #e0e0e0;

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }
}

.tab-panels {
  flex: 1;
  overflow: hidden;
}

// Basic tab styles
.basic-properties {
  .custom-properties {
    border-top: 1px solid #e0e0e0;
    padding-top: 16px;
  }
}

// Tasks tab styles
.tasks-list {
  .text-strike {
    text-decoration: line-through;
    opacity: 0.6;
  }
}

// Notes tab styles
.notes-list {
  .note-card {
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .note-meta {
        flex: 1;

        .note-author-info {
          display: flex;
          align-items: center;
          font-size: 13px;

          .text-weight-medium {
            font-size: 14px;
          }
        }
      }

      .note-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease;

        .q-btn {
          &[disabled] {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }
      }
    }

    &:hover .note-actions {
      opacity: 1;
    }

    .note-subject {
      font-size: 15px;
      color: #1976d2;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .note-content-container {
      .note-content {
        line-height: 1.5;
        color: #424242;

        ::v-deep(p) {
          margin: 0 0 8px 0;
          &:last-child {
            margin-bottom: 0;
          }
        }

        ::v-deep(ul), ::v-deep(ol) {
          margin: 8px 0;
          padding-left: 20px;
        }

        ::v-deep(blockquote) {
          border-left: 3px solid #e0e0e0;
          margin: 8px 0;
          padding-left: 12px;
          color: #666;
        }
      }

      .note-expand-controls {
        text-align: left;

        .q-btn {
          padding: 2px 8px;
          min-height: 24px;
          text-decoration: underline;

          &:hover {
            background-color: rgba(25, 118, 210, 0.08);
          }
        }
      }
    }

    .note-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .note-mentions {
      border-top: 1px solid #f0f0f0;
      padding-top: 8px;

      .mentions-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  }
}

.note-content {
  transition: all 0.3s ease;
}

// Chat tab styles
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .messages-area {
    flex: 1;
    overflow-y: auto;
    background: #f5f5f5;

    .message-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      &.own-message {
        align-items: flex-end;

        .message-bubble {
          background: #e3f2fd;
        }
      }

      .message-bubble {
        max-width: 80%;
        background: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;

          .sender-name {
            font-weight: 600;
            font-size: 14px;
          }
        }

        .message-content {
          word-wrap: break-word;
        }

        .message-mentions {
          margin-top: 8px;
        }
      }
    }

    .date-separator {
      margin: 16px 0;
    }
  }

  .message-input-area {
    background: white;
  }
}

// Empty state
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

// Utility classes
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-underline {
  text-decoration: underline !important;
}

// Responsive
@media (max-width: 599px) {
  .drawer-header-bar {
    height: 45px;

    .text-weight-medium {
      font-size: 14px;
    }

    .text-caption {
      font-size: 11px;
    }
  }

  .chat-container {
    .messages-area {
      .message-item {
        .message-bubble {
          max-width: 90%;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .notes-list {
    .note-card {
      .note-header {
        .note-meta {
          .note-author-info {
            font-size: 12px;

            .text-weight-medium {
              font-size: 13px;
            }
          }
        }

        .note-actions {
          opacity: 1; // Always show on mobile
        }
      }

      .note-subject {
        font-size: 14px;
      }

      .note-content {
        font-size: 14px;
      }
    }
  }
}
</style>
