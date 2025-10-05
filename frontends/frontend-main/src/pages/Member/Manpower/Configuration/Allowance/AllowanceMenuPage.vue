<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Allowance</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Allowance" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <GButton @click="openDialog()" icon="add" label="Create Allowance Type" color="primary" />
        </div>
      </div>
    </div>
    <GCard class="allowance-content">
      <q-card-section class="full-height">
        <div class="row justify-between q-pb-md">
          <div class="q-px-sm text-body-small">Allowance Category</div>
          <div class="q-px-sm text-body-small">Action</div>
        </div>

        <template v-if="allowances.length">
          <div v-for="(allowance, index) in allowances" :key="index" class="allowance-item">
            <div class="row justify-between items-center q-py-md" @click="allowance.children?.length && toggleExpand(index)">
              <div class="q-px-md">
                <span @click="!allowance.children?.length" class="clickable-label no-underline-hover text-label-medium">
                  {{ allowance.value }}
                </span>
                <span class="text-grey-7 q-pl-xs text-label-medium"> ({{ allowance.children.length > 0 ? allowance.children.length : 0 }}) </span>
                <q-icon
                  v-if="allowance.children?.length"
                  name="keyboard_arrow_down"
                  color="grey-7"
                  size="24px"
                  class="transition-rotate"
                  :class="{ rotated: expandedIndex === index }"
                />
              </div>
            </div>

            <q-slide-transition>
              <div v-show="expandedIndex === index" class="q-ml-lg q-mb-sm">
                <div v-for="(sub, subIndex) in allowance.children" :key="subIndex" class="row items-center justify-between q-pr-sm q-pl-lg">
                  <span @click="handleSelectedAllowance(sub)" class="clickable-sub-label text-body-small">{{ sub.name }}</span>
                  <div>
                    <GButton variant="icon" color="gray" size="sm" icon="more_horiz" icon-size="sm" @click.stop>
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div @click="editAllowance(sub)" class="row q-pa-xs cursor-pointer">
                            <q-icon name="edit" color="grey" size="20px" />
                            <div class="text-primary q-ml-xs text-label-medium">Edit</div>
                          </div>
                          <div @click="archiveAllowance(sub)" class="row q-pa-xs cursor-pointer">
                            <q-icon name="archive" color="grey" size="20px" />
                            <div class="text-primary q-ml-xs text-label-medium">Archive</div>
                          </div>
                        </div>
                      </q-menu>
                    </GButton>
                  </div>
                </div>
              </div>
            </q-slide-transition>
          </div>
        </template>
        <div v-else class="q-py-lg q-mt-md">
          <div class="text-center q-pa-md text-grey">This page is empty</div>
        </div>
      </q-card-section>
    </GCard>
    <!-- Add Edit Allowance -->
    <AddEditAllowanceTypeDialog
      @saveDone="getAllowanceList()"
      :allowanceInformation="allowanceInformation"
      v-model="isAddEditAllowanceTypeDialogOpen"
    />
  </expanded-nav-page-container>
</template>

<style scoped src="./AllowanceMenuPage.scss"></style>

<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GCard from "../../../../../components/shared/display/GCard.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref, defineAsyncComponent } from 'vue';
import ExpandedNavPageContainer from '../../../../../components/shared/ExpandedNavPageContainer.vue';
import { useRouter } from 'vue-router';
import { AllowanceConfigurationDataResponse, AllowanceTreeResponse } from '@shared/response/allowance-configuration.response';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditAllowanceTypeDialog = defineAsyncComponent(() =>
  import('../../dialogs/configuration/ManpowerAddEditAllowanceTypeDialog.vue')
);

export default {
  name: 'AllowanceMenuPage',
  components: {
    GButton,
    ExpandedNavPageContainer,
    AddEditAllowanceTypeDialog,
    GCard,
  },
  props: {},
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const allowances = ref<AllowanceTreeResponse[]>([]);
    const isAddEditAllowanceTypeDialogOpen = ref(false);
    const allowanceInformation = ref<AllowanceConfigurationDataResponse | null>(null);
    const expandedIndex = ref<null | number>(null);

    const onSelectedAllowanceType = (payload: { allowance: AllowanceConfigurationDataResponse }) => {
      router.push({
        name: 'member_manpower_allowance_plan',
        params: { planId: payload.allowance.id },
      });
    };

    onMounted(() => {
      getAllowanceList();
    });

    const getAllowanceList = () => {
      $q.loading.show();
      api
        .get('hr-configuration/allowance/tree')
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            allowances.value = response.data;
          } else {
            allowances.value = [];
          }
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    const toggleExpand = (index: number) => {
      expandedIndex.value = expandedIndex.value === index ? null : index;
    };

    const openDialog = () => {
      allowanceInformation.value = null;
      isAddEditAllowanceTypeDialogOpen.value = true;
    };

    const handleSelectedAllowance = (allowance: AllowanceConfigurationDataResponse) => {
      onSelectedAllowanceType({ allowance: allowance });
    };

    const editAllowance = (data: AllowanceConfigurationDataResponse) => {
      allowanceInformation.value = data;
      isAddEditAllowanceTypeDialogOpen.value = true;
    };

    const archiveAllowance = (data: AllowanceConfigurationDataResponse) => {
      $q.dialog({
        title: 'Archive Allowance',
        message: `Are you sure you want to archive <b>${data.name}</b> Allowance?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        archiveAllowanceData(data.id);
      });
    };

    const archiveAllowanceData = (id: number) => {
      $q.loading.show();
      api
        .delete('hr-configuration/allowance?id=' + id)
        .then(() => {
          getAllowanceList();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    return {
      allowanceInformation,
      isAddEditAllowanceTypeDialogOpen,
      allowances,
      expandedIndex,
      toggleExpand,
      openDialog,
      getAllowanceList,
      handleSelectedAllowance,
      onSelectedAllowanceType,
      editAllowance,
      archiveAllowance,
    };
  },
};
</script>
