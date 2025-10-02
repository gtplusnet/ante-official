<template>
  <q-dialog ref="dialog" v-model="show" transition-show="slide-left" transition-hide="slide-right" class="email-compose-dialog">
    <q-card class="compose-dialog">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="drafts" />
        <div class="text-subtitle1">{{ dialogTitle }}</div>
        <q-space />
        <q-btn dense flat icon="close" @click="close">
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <!-- Form -->
      <q-card-section class="compose-form q-pa-none">
        <q-form @submit.prevent="sendEmail">
          <div class="form-fields">
            <!-- To Field -->
            <div class="field-row">
              <label class="field-label q-mr-xs">To:</label>
              <q-input v-model="form.to" dense borderless placeholder="Recipients" class="field-input" required />

              <!-- Additional Fields Toggle -->
              <div v-if="!showCc || !showBcc" class="field-row no-border">
                <label class="field-label q-mr-xs"></label>
                <div class="additional-fields">
                  <span v-if="!showCc" @click="showCc = true" class="field-toggle text-weight-medium">Cc</span>
                  <span v-if="!showBcc" @click="showBcc = true" class="field-toggle text-weight-medium">Bcc</span>
                </div>
              </div>
            </div>

            <!-- CC Field -->
            <div v-if="showCc" class="field-row">
              <label class="field-label q-mr-xs">Cc:</label>
              <q-input v-model="form.cc" dense borderless placeholder="Cc" class="field-input" />
            </div>

            <!-- BCC Field -->
            <div v-if="showBcc" class="field-row">
              <label class="field-label q-mr-xs">Bcc:</label>
              <q-input v-model="form.bcc" dense borderless placeholder="Bcc" class="field-input" />
            </div>

            <!-- Subject Field -->
            <div class="field-row">
              <label class="field-label">Subject Regarding:</label>
              <q-input v-model="form.subject" dense borderless placeholder="Subject" class="field-input" required />
            </div>
          </div>

          <!-- Email Body -->
          <div class="compose-body">
            <q-editor v-model="form.html" :toolbar="editorToolbar" min-height="300px" placeholder="Compose email" />
          </div>

          <!-- Actions -->
          <q-card-actions class="compose-actions">
            <q-btn type="submit" unelevated color="secondary" class="col-3" no-caps :loading="isSending">
              <q-icon name="send" size="20px" class="q-mr-sm" />
              Send
            </q-btn>

            <q-btn unelevated no-caps class="col-3" color="light-grey text-dark" @click="saveDraft">
              <q-icon name="save" size="20px" class="q-mr-sm" />
              Save draft
            </q-btn>

            <q-space />

            <q-btn flat round dense icon="attach_file" :style="{ color: 'var(--q-text-light-grey)' }">
              <q-tooltip>Attach files</q-tooltip>
            </q-btn>

            <q-btn flat round dense icon="insert_link" :style="{ color: 'var(--q-text-light-grey)' }">
              <q-tooltip>Insert link</q-tooltip>
            </q-btn>

            <q-btn flat round dense icon="add_reaction" :style="{ color: 'var(--q-text-light-grey)' }">
              <q-tooltip>Insert emoji</q-tooltip>
            </q-btn>

            <q-btn flat round dense icon="delete" @click="discard" :style="{ color: 'var(--q-text-light-grey)' }">
              <q-tooltip>Discard draft</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../utility/api.handler';

export default defineComponent({
  name: 'EmailComposeDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    defaultTo: {
      type: String,
      default: '',
    },
    defaultSubject: {
      type: String,
      default: '',
    },
    defaultBody: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      default: 'new', // 'new', 'reply', 'forward'
    },
  },
  emits: ['update:modelValue', 'sent'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const isSending = ref(false);

    const show = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const form = ref({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      html: '',
    });

    const showCc = ref(false);
    const showBcc = ref(false);
    // const isFullscreen = ref(false);

    const dialogTitle = computed(() => {
      switch (props.mode) {
        case 'reply':
          return 'Reply';
        case 'forward':
          return 'Forward';
        default:
          return 'New Message';
      }
    });

    const editorToolbar = [['bold', 'italic', 'underline', 'strike'], ['quote', 'unordered', 'ordered'], ['undo', 'redo'], ['viewsource']];

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          // Initialize form with default values
          form.value.to = props.defaultTo;
          form.value.subject = props.defaultSubject;
          form.value.html = props.defaultBody;
        }
      }
    );

    // const minimize = () => {
    //   // TODO: Implement minimize functionality
    //   $q.notify({
    //     color: 'info',
    //     message: 'Minimize feature coming soon',
    //     icon: 'info',
    //   });
    // };

    // const toggleFullscreen = () => {
    //   isFullscreen.value = !isFullscreen.value;
    //   // TODO: Implement fullscreen toggle
    // };

    const close = () => {
      if (form.value.to || form.value.subject || form.value.html) {
        $q.dialog({
          title: 'Save Draft?',
          message: 'Do you want to save this email as a draft?',
          cancel: {
            label: 'Discard',
            color: 'negative',
            flat: true,
          },
          ok: {
            label: 'Save',
            color: 'primary',
          },
          persistent: true,
        })
          .onOk(() => {
            saveDraft();
            show.value = false;
            showCc.value = false;
            showBcc.value = false;
          })
          .onCancel(() => {
            show.value = false;
            showCc.value = false;
            showBcc.value = false;
          });
      } else {
        show.value = false;
      }
    };

    const sendEmail = async () => {
      if (!form.value.to) {
        $q.notify({
          color: 'negative',
          message: 'Please specify at least one recipient',
          icon: 'error',
        });
        return;
      }

      try {
        isSending.value = true;

        // First check if email is configured
        const emailConfig = await APIRequests.getEmailConfig($q);
        if (!emailConfig) {
          $q.notify({
            color: 'warning',
            message: 'Please configure your email settings first',
            icon: 'warning',
            actions: [
              {
                label: 'Go to Settings',
                color: 'white',
                handler: () => {
                  window.location.href = '/member/settings/email';
                },
              },
            ],
          });
          return;
        }

        // Prepare email data
        const emailData = {
          to: form.value.to.split(',').map((email) => email.trim()),
          subject: form.value.subject,
          html: form.value.html,
          cc: form.value.cc ? form.value.cc.split(',').map((email) => email.trim()) : undefined,
          bcc: form.value.bcc ? form.value.bcc.split(',').map((email) => email.trim()) : undefined,
        };

        // Send the email
        const response = await APIRequests.sendEmail($q, emailData);

        if (response.success) {
          $q.notify({
            color: 'positive',
            message: 'Email sent successfully',
            icon: 'check',
          });
          emit('sent');
          show.value = false;

          // Reset form
          form.value = {
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            html: '',
          };
        } else {
          $q.notify({
            color: 'negative',
            message: response.message || 'Failed to send email',
            icon: 'error',
          });
        }
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Failed to send email',
          icon: 'error',
        });
      } finally {
        isSending.value = false;
      }
    };

    const saveDraft = () => {
      // TODO: Implement save draft
      $q.notify({
        color: 'positive',
        message: 'Draft saved',
        icon: 'check',
      });
    };

    const discard = () => {
      $q.dialog({
        title: 'Discard Draft',
        message: 'Are you sure you want to discard this draft?',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        show.value = false;
      });
    };

    return {
      show,
      form,
      showCc,
      showBcc,
      // isFullscreen,
      isSending,
      dialogTitle,
      editorToolbar,
      // minimize,
      // toggleFullscreen,
      close,
      sendEmail,
      saveDraft,
      discard,
    };
  },
});
</script>

<style lang="scss" scoped>
.email-compose-dialog {
  position: relative;
}

.compose-dialog {
  width: 100%;
  min-width: 500px;
  max-height: 80vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  right: 0;

  .compose-form {
    flex: 1;
    overflow-y: auto;

    .form-fields {
      .field-row {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
        min-height: 50px;

        &.no-border {
          border-bottom: none;
        }

        .field-label {
          width: 135px;
          padding: 0 0 0 16px;
          font-size: 14px;
          color: var(--q-text-light-grey);
        }

        .field-input {
          flex: 1;

          :deep(.q-field__control) {
            height: 50px;
          }

          :deep(.q-field__native) {
            height: 50px;
            color: var(--q-text-dark);
            font-weight: 500;
          }
        }

        .additional-fields {
          .field-toggle {
            color: #5f6368;
            cursor: pointer;
            margin-right: 16px;
            font-size: 14px;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }

    .compose-body {
      :deep(.q-editor) {
        border: none;
      }

      :deep(.q-editor__toolbar-group) {
        padding: 5px 10px;
      }
    }
  }

  .compose-actions {
    padding: 16px;
  }
}
</style>
