<template>
  <q-dialog v-model="showDialog" :maximized="$q.screen.lt.sm" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
    <TemplateDialog minWidth="500px" maxWidth="500px">
      <template #DialogTitle>
        <div>{{ dialogTitle ? "Edit" : "Add To Calendar" }}</div>
      </template>

      <template #DialogContent>
        <q-form @submit="submitForm" class="q-px-lg q-pb-lg">
          <!-- Tab buttons for Meeting/Event/Task -->
          <div class="row q-gutter-x-sm q-mb-md">
            <q-btn
              label="Meeting"
              :style="
                dialogType === 'meeting'
                  ? 'background-color: #2F40C4; color: white;'
                  : 'background-color: rgba(47, 64, 196, 0.12); color: #2F40C4;'
              "
              no-caps
              unelevated
              rounded
              dense
              size="md"
              padding="6px 16px"
              @click="dialogType = 'meeting'"
            />
            <q-btn
              label="Event"
              :style="
                dialogType === 'event'
                  ? 'background-color: #2F40C4; color: white;'
                  : 'background-color: rgba(47, 64, 196, 0.12); color: #2F40C4;'
              "
              no-caps
              unelevated
              rounded
              dense
              size="md"
              padding="6px 16px"
              @click="dialogType = 'event'"
            />
            <q-btn
              label="Task"
              :style="
                dialogType === 'task'
                  ? 'background-color: #2F40C4; color: white;'
                  : 'background-color: rgba(47, 64, 196, 0.12); color: #2F40C4;'
              "
              no-caps
              unelevated
              rounded
              dense
              size="md"
              padding="6px 16px"
              @click="dialogType = 'task'"
            />
          </div>

          <!-- Pin this schedule toggle -->
          <div class="row justify-end items-center q-mb-md">
            <span class="text-caption text-grey-6 q-mr-sm">Pin this schedule</span>
            <q-toggle v-model="formData.isPinned" color="primary" size="sm" />
          </div>

          <!-- Title input -->
          <GlobalInputTemplate
            v-model="formData.title"
            type="text-with-add"
            label="Add label"
            class="q-mb-md"
          />

          <!-- Date picker -->
          <GlobalInputTemplate v-model="formData.date" type="date" label="Date" class="q-mb-md" />

          <!-- Time range inputs -->
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <GlobalInputTemplate v-model="formData.startTime" type="time" label="From" placeholder="Start time" />
            </div>
            <div class="col-6">
              <GlobalInputTemplate v-model="formData.endTime" type="time" label="To" placeholder="End time" />
            </div>
          </div>

          <!-- Repeat option -->
          <GButton :label="formData.repeat || 'No Repeat'" flat icon="loop" icon-size="md" class="q-mb-md text-grey">
            <q-menu
              auto-close
              fit
              anchor="bottom middle"
              self="top middle"
              transition-show="jump-down"
              transition-hide="jump-up"
              transition-duration="150"
            >
              <q-list dense>
                <q-item clickable v-close-popup @click="formData.repeat = 'Repeat'">
                  <q-item-section>Repeat</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'No Repeat'">
                  <q-item-section>No Repeat</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'Everyday'">
                  <q-item-section>Everyday</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'Every Week'">
                  <q-item-section>Every Week</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'Every Month'">
                  <q-item-section>Every Month</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'Every Year'">
                  <q-item-section>Every Year</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="formData.repeat = 'Custom'">
                  <q-item-section>Custom</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </GButton>

          <!-- Description textarea -->
          <GlobalInputTemplate
            v-model="formData.description"
            type="textarea"
            label="Description"
            placeholder="Add description..."
            :rows="6"
            class="q-mb-md"
          />

          <!-- Event Attachments Section -->
          <div class="attachments-section q-mb-lg">
            <div class="text-subtitle2 q-mb-sm">
              <q-icon name="attach_file" class="q-mr-sm" />Event Attachments
            </div>
            <calendar-event-attachments :event-id="formData.id" />
          </div>

          <!-- Action buttons -->
          <div class="row justify-end q-gutter-sm">
            <GButton
              label="Cancel"
              color="grey-4"
              text-color="grey-7"
              unelevated
              rounded
              padding="8px 24px"
              v-close-popup
            />
            <GButton :label="dialogTitle ? 'Update' : 'Save'" type="submit" color="primary" padding="8px 24px" />
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { useQuasar } from "quasar";
import { ref } from "vue";
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";
import GlobalInputTemplate from "src/components/shared/form/GlobalInput/GlobalInputTemplate.vue";
import CalendarEventAttachments from "../components/CalendarEventAttachments.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

type DialogType = "task" | "meeting" | "event";

export default {
  name: "AddEditCalendarDialog",
  components: {
    TemplateDialog,
    GButton,
    GlobalInputTemplate,
    CalendarEventAttachments,
  },
  props: {
    createType: {
      type: String,
      required: true,
    },
  },

  setup() {
    // Dialog state
    const $q = useQuasar();
    const showDialog = ref(false);
    const dialogType = ref<DialogType>("meeting");
    const dialogTitle = ref("");
    const formData = ref({
      id: null,
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      repeat: "No Repeat",
      isPinned: false,
    });

    const submitForm = () => {
      // Here you would typically make an API call to save the event/meeting/task
      console.log(`Submitting ${dialogType.value}:`, formData.value);
      // Reset form and close dialog
      // Show success notification
      $q.notify({
        type: "positive",
        message: `${dialogType.value.charAt(0).toUpperCase() + dialogType.value.slice(1)} ${
          dialogTitle.value ? "updated" : "created"
        } successfully!`,
        position: "top",
      });
      showDialog.value = false;
    };

    return {
      showDialog,
      dialogType,
      dialogTitle,
      formData,
      submitForm,
    };
  },
};
</script>

<style lang="scss" scoped>
// Custom styles for this dialog if needed
</style>
