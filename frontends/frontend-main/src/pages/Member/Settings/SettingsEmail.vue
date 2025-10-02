<template>
  <div class="settings-email">
    <div class="page-head">
      <div class="title text-title-large">Email Configuration</div>
      <div class="actions">
        <q-btn
          v-if="!hasEmailConfig"
          @click="showDialog = true"
          unelevated
          color="primary"
          no-caps
        >
          <q-icon name="add" class="q-mr-xs text-label-large" />
          Add Email Configuration
        </q-btn>
      </div>
    </div>

    <div class="page-content q-mt-lg">
      <div v-if="isLoading" class="flex flex-center" style="height: 400px">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <template v-else>
        <div v-if="!hasEmailConfig" class="no-config">
          <q-card class="text-center q-pa-xl">
            <q-icon name="email" size="80px" color="grey-5" />
            <div class="text-title-medium q-mt-md q-mb-sm">No Email Configuration</div>
            <div class="text-body-small q-mb-lg">Configure your email settings to send and receive emails within Ante.</div>
            <q-btn
              @click="showDialog = true"
              unelevated
              color="primary"
              no-caps
              class="text-label-large"
            >
              <q-icon name="settings" class="q-mr-xs" />
              Configure Email
            </q-btn>
          </q-card>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-card>
              <q-card-section>
                <div class="text-h6">Email Configuration Details</div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <div class="config-details" v-if="emailConfig">
                  <div class="detail-row">
                    <div class="detail-label">Email Address</div>
                    <div class="detail-value">{{ emailConfig.emailAddress }}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Email Provider</div>
                    <div class="detail-value">
                      <q-chip :color="getProviderColor(emailConfig.emailProvider)" text-color="white" dense>
                        {{ emailConfig.emailProvider }}
                      </q-chip>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Protocol</div>
                    <div class="detail-value">{{ emailConfig.emailProtocol }}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                      <q-chip
                        :color="emailConfig.isActive ? 'green' : 'red'"
                        text-color="white"
                        dense
                      >
                        {{ emailConfig.isActive ? 'Active' : 'Inactive' }}
                      </q-chip>
                    </div>
                  </div>
                </div>

                <q-separator class="q-my-md" />

                <div v-if="emailConfig">
                  <div class="text-subtitle2 q-mb-sm">Server Settings</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <div class="server-info">
                        <div class="server-title">Incoming Mail Server</div>
                        <div class="server-detail">{{ emailConfig.incomingServer }}:{{ emailConfig.incomingPort }}</div>
                        <div class="server-ssl">
                          <q-icon :name="emailConfig.incomingSSL ? 'lock' : 'lock_open'" size="16px" />
                          SSL {{ emailConfig.incomingSSL ? 'Enabled' : 'Disabled' }}
                        </div>
                      </div>
                    </div>
                    <div class="col-12 col-sm-6">
                      <div class="server-info">
                        <div class="server-title">Outgoing Mail Server</div>
                        <div class="server-detail">{{ emailConfig.outgoingServer }}:{{ emailConfig.outgoingPort }}</div>
                        <div class="server-ssl">
                          <q-icon :name="emailConfig.outgoingSSL ? 'lock' : 'lock_open'" size="16px" />
                          SSL {{ emailConfig.outgoingSSL ? 'Enabled' : 'Disabled' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card>
              <q-card-section>
                <div class="text-h6">Actions</div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <q-btn
                  @click="testConnection"
                  outline
                  color="primary"
                  no-caps
                  class="full-width q-mb-sm"
                  :loading="isTesting"
                >
                  <q-icon name="wifi" class="q-mr-xs" />
                  Test Connection
                </q-btn>
                <q-btn
                  @click="editConfig"
                  outline
                  color="primary"
                  no-caps
                  class="full-width q-mb-sm"
                >
                  <q-icon name="edit" class="q-mr-xs" />
                  Edit Configuration
                </q-btn>
                <q-btn
                  @click="deleteConfig"
                  outline
                  color="negative"
                  no-caps
                  class="full-width"
                >
                  <q-icon name="delete" class="q-mr-xs" />
                  Remove Configuration
                </q-btn>
              </q-card-section>
            </q-card>

            <q-card class="q-mt-md">
              <q-card-section>
                <div class="text-h6">Quick Tips</div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <ul class="tips-list">
                  <li>For Gmail, you may need to use an App Password instead of your regular password</li>
                  <li>IMAP is recommended over POP3 for better email synchronization</li>
                  <li>Always use SSL/TLS for secure email connections</li>
                  <li>Test your connection after making any changes</li>
                </ul>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </template>
    </div>

    <!-- Email Configuration Dialog -->
    <email-config-dialog
      v-model="showDialog"
      :email-config="emailConfig || undefined"
      @saved="onConfigSaved"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../../utility/api.handler';
import EmailConfigDialog from '../../../components/dialog/EmailConfigDialog.vue';

interface EmailConfiguration {
  id: string;
  emailProvider: string;
  emailProtocol: string;
  incomingServer: string;
  incomingPort: number;
  incomingSSL: boolean;
  outgoingServer: string;
  outgoingPort: number;
  outgoingSSL: boolean;
  emailAddress: string;
  isActive: boolean;
}

export default defineComponent({
  name: 'SettingsEmail',
  components: {
    EmailConfigDialog,
  },
  setup() {
    const $q = useQuasar();
    const isLoading = ref(true);
    const showDialog = ref(false);
    const emailConfig = ref<EmailConfiguration | null>(null);
    const hasEmailConfig = ref(false);
    const isTesting = ref(false);

    const fetchEmailConfig = async () => {
      try {
        isLoading.value = true;
        const response = await APIRequests.getEmailConfig($q);
        if (response) {
          emailConfig.value = response as EmailConfiguration;
          hasEmailConfig.value = true;
        } else {
          emailConfig.value = null;
          hasEmailConfig.value = false;
        }
      } catch (error) {
        console.error('Failed to fetch email configuration:', error);
        hasEmailConfig.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    const testConnection = async () => {
      if (!emailConfig.value) return;

      try {
        isTesting.value = true;
        // Use the saved configuration test that doesn't require password
        const response = await APIRequests.testSavedEmailConnection($q);

        if (response.success) {
          $q.notify({
            color: 'positive',
            message: response.message,
            icon: 'check',
          });
        } else if (response.details) {
          // Show detailed results
          let message = 'Connection test results:\n';
          if (response.details.incoming.success) {
            message += `✓ Incoming (${emailConfig.value?.emailProtocol}): Success\n`;
          } else {
            message += `✗ Incoming (${emailConfig.value?.emailProtocol}): ${response.details.incoming.message}\n`;
          }
          if (response.details.outgoing.success) {
            message += '✓ Outgoing (SMTP): Success';
          } else {
            message += `✗ Outgoing (SMTP): ${response.details.outgoing.message}`;
          }

          $q.notify({
            color: response.success ? 'positive' : 'warning',
            message: message,
            icon: response.success ? 'check' : 'warning',
            timeout: 5000,
            multiLine: true,
          });
        } else {
          $q.notify({
            color: 'negative',
            message: response.message,
            icon: 'error',
          });
        }
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: 'Failed to test connection',
          icon: 'error',
        });
      } finally {
        isTesting.value = false;
      }
    };

    const editConfig = () => {
      showDialog.value = true;
    };

    const deleteConfig = async () => {
      $q.dialog({
        title: 'Remove Email Configuration',
        message: 'Are you sure you want to remove your email configuration? This action cannot be undone.',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await APIRequests.deleteEmailConfig($q);
          emailConfig.value = null;
          hasEmailConfig.value = false;
          $q.notify({
            color: 'positive',
            message: 'Email configuration removed successfully',
            icon: 'check',
          });
        } catch (error) {
          $q.notify({
            color: 'negative',
            message: 'Failed to remove email configuration',
            icon: 'error',
          });
        }
      });
    };

    const onConfigSaved = () => {
      showDialog.value = false;
      fetchEmailConfig();
    };

    const getProviderColor = (provider: string) => {
      const colors: Record<string, string> = {
        GMAIL: 'red',
        OUTLOOK: 'blue',
        YAHOO: 'purple',
        CUSTOM: 'grey',
      };
      return colors[provider] || 'grey';
    };

    onMounted(() => {
      fetchEmailConfig();
    });

    return {
      isLoading,
      showDialog,
      emailConfig,
      hasEmailConfig,
      isTesting,
      testConnection,
      editConfig,
      deleteConfig,
      onConfigSaved,
      getProviderColor,
    };
  },
});
</script>

<style lang="scss" scoped>
.settings-email {
  .no-config {
    max-width: 600px;
    margin: 0 auto;
  }

  .config-details {
    .detail-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .detail-label {
        flex: 0 0 150px;
        font-weight: 500;
        color: #666;
      }

      .detail-value {
        flex: 1;
        color: #333;
      }
    }
  }

  .server-info {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;

    .server-title {
      font-weight: 500;
      color: #666;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .server-detail {
      color: #333;
      font-family: monospace;
      margin-bottom: 4px;
    }

    .server-ssl {
      font-size: 12px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .tips-list {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 8px;
      color: #666;
      font-size: 13px;
    }
  }

  .full-width {
    width: 100%;
  }
}
</style>
