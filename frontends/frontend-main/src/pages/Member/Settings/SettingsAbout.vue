<template>
  <div>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title text-title-large">About</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Settings" :to="{ name: 'member_settings' }" />
              <q-breadcrumbs-el label="About" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <div class="row q-col-gutter-lg">
        <!-- System Information Card -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <div class="q-mb-md text-title-medium">
                <q-icon name="info" class="q-mr-sm" />
                System Information
              </div>
              <q-separator class="q-mb-md" />

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <div class="text-body-small text-grey-6">Application Name</div>
                  <div class="text-label-large">GEER-ANTE ERP</div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">Version</div>
                  <div>
                    <q-badge :label="versionInfo.version" color="primary" class="text-label-large"/>
                  </div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">Build Date</div>
                  <div class="text-label-large">{{ versionInfo.buildDate }}</div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">Environment</div>
                  <div>
                    <q-badge
                      :label="versionInfo.environment"
                      :color="versionInfo.environment === 'production' ? 'positive' : 'warning'"
                      class="text-label-large"
                    />
                  </div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">Last Deployment</div>
                  <div class="text-label-large">{{ formatDateTime(versionInfo.deploymentTime) }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Company Information Card -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-title-medium q-mb-md">
                <q-icon name="business" class="q-mr-sm" />
                Company Information
              </div>
              <q-separator class="q-mb-md" />

              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <div class="text-body-small text-grey-6">Company Name</div>
                  <div class="text-label-large">{{ companyInfo.companyName }}</div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">License Type</div>
                  <div class="text-label-large">{{ companyInfo.licenseType || 'Standard' }}</div>
                </div>

                <div class="col-12 q-mt-md">
                  <div class="text-body-small text-grey-6">Active Modules</div>
                  <div class="text-label-large">{{ companyInfo.activeModules || 'All Modules' }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Support Information Card -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-title-medium q-mb-md">
                <q-icon name="support_agent" class="q-mr-sm" />
                Support Information
              </div>
              <q-separator class="q-mb-md" />

              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                  <div class="text-body-small text-grey-6">Technical Support</div>
                  <div class="text-label-large">support@geerplus.net</div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="text-body-small text-grey-6">Documentation</div>
                  <div class="text-label-large">
                    <a href="https://docs.geerplus.net" target="_blank" class="text-primary">
                      docs.geerplus.net
                    </a>
                  </div>
                </div>

                <div class="col-12 col-md-4">
                  <div class="text-body-small text-grey-6">Developer</div>
                  <div class="text-label-large">GEER Plus Technologies</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Recent Updates Card -->
        <div class="col-12">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-title-medium q-mb-md">
                <q-icon name="update" class="q-mr-sm" />
                Recent Updates
              </div>
              <q-separator class="q-mb-md" />

              <q-list dense>
                <q-item v-for="update in recentUpdates" :key="update.version">
                  <q-item-section avatar>
                    <q-icon :name="update.icon" :color="update.color"/>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-label-large">{{ update.title }}</q-item-label>
                    <q-item-label caption class="text-body-small">Version {{ update.version }} - {{ update.date }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </g-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import GCard from 'src/components/shared/display/GCard.vue';
import { LocalStorage } from 'quasar';

interface VersionInfo {
  version: string;
  buildDate: string;
  environment: string;
  deploymentTime: string;
}

interface CompanyInfo {
  companyName: string;
  licenseType?: string;
  activeModules?: string;
}

interface RecentUpdate {
  version: string;
  title: string;
  date: string;
  icon: string;
  color: string;
}

export default defineComponent({
  name: 'SettingsAbout',
  components: {
    GCard,
  },
  setup() {
    const accountInfo = LocalStorage.getItem('accountInformation') as any;

    const versionInfo = ref<VersionInfo>({
      version: '1.0.0',
      buildDate: '2025-01-10',
      environment: 'staging',
      deploymentTime: new Date().toISOString(),
    });

    const companyInfo = ref<CompanyInfo>({
      companyName: accountInfo?.company?.companyName || 'Your Company',
      licenseType: 'Enterprise',
      activeModules: 'All Modules',
    });

    const recentUpdates = ref<RecentUpdate[]>([
      {
        version: '1.0.0',
        title: 'Gate Management Feature',
        date: '2025-01-10',
        icon: 'door_sliding',
        color: 'primary',
      },
      {
        version: '0.9.9',
        title: 'Device License Management',
        date: '2025-01-09',
        icon: 'devices',
        color: 'secondary',
      },
      {
        version: '0.9.8',
        title: 'School Management Module',
        date: '2025-01-08',
        icon: 'school',
        color: 'accent',
      },
    ]);

    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const loadVersionInfo = async () => {
      try {
        // In production, this would fetch from an API endpoint
        // For now, we'll use static data
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          versionInfo.value = {
            ...data,
            deploymentTime: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.log('Using default version info');
      }
    };

    onMounted(() => {
      loadVersionInfo();
    });

    return {
      versionInfo,
      companyInfo,
      recentUpdates,
      formatDateTime,
    };
  },
});
</script>

<style scoped>
.title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
