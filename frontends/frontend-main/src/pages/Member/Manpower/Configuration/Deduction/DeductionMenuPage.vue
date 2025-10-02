<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title text-title-large">Deduction</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el
                label="Manpower"
                :to="{ name: 'member_manpower' }"
              />
              <q-breadcrumbs-el label="Configuration" />
              <q-breadcrumbs-el label="Deduction" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <g-button
            icon="add"
            label="Add Deduction Type"
            @click="openDialog('Deduction Type', null)"
          />
        </div>
      </div>
    </div>
    <GCard class="deduction-content">
      <q-card-section class="full-height">
        <div class="row justify-between q-pb-md">
          <div class="q-px-sm text-body-small">Deduction Type</div>
          <div class="q-px-sm text-body-small">Action</div>
        </div>

        <template v-if="deductions.length">
          <div
            v-for="(deduction, index) in deductions"
            :key="index"
            class="deduction-item"
          >
            <div
              class="row justify-between items-center q-py-xs"
              :class="{ 'cursor-pointer': deduction.childDeduction?.length }"
              @click="deduction.childDeduction?.length && toggleExpand(index)"
            >
              <div class="q-px-md">
                <span
                  @click="!deduction.childDeduction?.length"
                  class="clickable-label text-label-medium"
                >
                  {{ deduction.name }}
                </span>
                <span class="text-grey-7 q-pl-xs text-label-medium">
                  ({{ deduction.childDeduction.length }})
                </span>
                <q-icon
                  v-if="deduction.childDeduction?.length"
                  name="keyboard_arrow_down"
                  color="grey-7"
                  size="24px"
                  class="transition-rotate"
                  :class="{ rotated: expandedIndex === index }"
                />
              </div>
              <div class="q-px-xs">
                <g-button
                  color="grey"
                  variant="icon"
                  icon="more_horiz"
                  size="md"
                  icon-size="md"
                  round
                  @click.stop
                >
                  <q-menu auto-close>
                    <div class="q-pa-sm">
                      <div class="row q-pa-xs cursor-pointer">
                        <q-icon name="add" color="grey" size="20px" />
                        <div
                          @click="openDialog('Deduction Sub-Type', deduction)"
                          class="text-blue text-label-small"
                        >
                          Add Sub-Type
                        </div>
                      </div>
                      <div
                        @click="editDeduction('Deduction Type', deduction)"
                        class="row q-pa-xs cursor-pointer"
                      >
                        <q-icon name="edit" color="grey" size="20px" />
                        <div class="text-blue q-ml-xs text-label-medium">
                          Edit
                        </div>
                      </div>
                      <div
                        @click="archiveDeduction(deduction)"
                        class="row q-pa-xs cursor-pointer"
                      >
                        <q-icon name="archive" color="grey" size="20px" />
                        <div class="text-blue q-ml-xs text-label-medium">
                          Archive
                        </div>
                      </div>
                    </div>
                  </q-menu>
                </g-button>
              </div>
            </div>

            <q-slide-transition>
              <div v-show="expandedIndex === index" class="q-ml-lg q-mb-sm">
                <div
                  v-for="(sub, subIndex) in deduction.childDeduction"
                  :key="subIndex"
                  class="row items-center justify-between q-pr-sm q-pl-lg"
                >
                  <span
                    @click="handleSelectedDeduction(sub)"
                    class="clickable-sub-label"
                    >{{ sub.name }}</span
                  >
                  <div>
                    <g-button
                      color="grey"
                      variant="icon"
                      icon="more_horiz"
                      size="sm"
                      icon-size="sm"
                      round
                      @click.stop
                    >
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div
                            @click="editDeduction('Deduction Sub-Type', sub)"
                            class="row q-pa-xs cursor-pointer"
                          >
                            <q-icon name="edit" color="grey" size="20px" />
                            <div class="text-blue q-ml-xs text-label-medium">
                              Edit
                            </div>
                          </div>
                          <div
                            @click="archiveDeduction(sub)"
                            class="row q-pa-xs cursor-pointer"
                          >
                            <q-icon name="archive" color="grey" size="20px" />
                            <div class="text-blue q-ml-xs text-label-medium">
                              Archive
                            </div>
                          </div>
                        </div>
                      </q-menu>
                    </g-button>
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
  </expanded-nav-page-container>
  <!-- Add Deduction type and sub-type-->
  <AddEditDeductionTypeDialog
    v-model="isAddDeductionDialogOpen"
    :dialogMode="dialogMode"
    :deductionData="deductionData"
    :deductionParent="currentDeductionParent"
    @saveDone="getDeductionList"
  />
</template>

<style src="./DeductionMenuPage.scss" scoped></style>

<script lang="ts">
import { DeductionConfigurationDataResponse } from "@shared/response";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AddEditDeductionTypeDialog from "../../dialogs/configuration/ManpowerAddEditDeductionTypeDialog.vue";
import GCard from "../../../../../components/shared/display/GCard.vue";
import { handleAxiosError } from "../../../../../utility/axios.error.handler";
import { onMounted, ref } from "vue";
import ExpandedNavPageContainer from "../../../../../components/shared/ExpandedNavPageContainer.vue";
import { useRouter } from "vue-router";
import GButton from "src/components/shared/buttons/GButton.vue";

export default {
  name: "DeductionMenuPage",
  components: {
    AddEditDeductionTypeDialog,
    ExpandedNavPageContainer,
    GCard,
    GButton,
  },
  props: {},
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const deductions = ref<DeductionConfigurationDataResponse[]>([]);
    const currentDeductionParent =
      ref<DeductionConfigurationDataResponse | null>(null);
    const isAddDeductionDialogOpen = ref(false);
    const isDeductionTypeTableOpen = ref(false);
    const deductionData = ref<DeductionConfigurationDataResponse | null>(null);
    const expandedIndex = ref<null | number>(null);
    const dialogMode = ref<null | "Deduction Type" | "Deduction Sub-Type">(
      null
    );
    const selectedDeduction = ref<DeductionConfigurationDataResponse | null>(
      null
    );

    const onSelectedDeduction = (payload: {
      deduction: DeductionConfigurationDataResponse;
    }) => {
      router.push({
        name: "member_manpower_deduction_plan",
        params: { planId: payload.deduction.id },
      });
    };

    onMounted(() => {
      getDeductionList();
    });

    const getDeductionList = () => {
      $q.loading.show();
      api
        .get("hr-configuration/deduction/parents")
        .then((response) => {
          if (Array.isArray(response.data) && response.data.length > 0) {
            deductions.value = response.data;
          } else {
            deductions.value = [];
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

    const openDialog = (
      mode: typeof dialogMode.value,
      parent: DeductionConfigurationDataResponse | null
    ) => {
      dialogMode.value = mode;
      deductionData.value = null;
      isAddDeductionDialogOpen.value = true;
      currentDeductionParent.value = parent;
    };

    const handleSelectedDeduction = (
      deduct: DeductionConfigurationDataResponse
    ) => {
      onSelectedDeduction({ deduction: deduct });
    };

    const editDeduction = (
      mode: typeof dialogMode.value,
      data: DeductionConfigurationDataResponse
    ) => {
      dialogMode.value = mode;
      deductionData.value = data;
      isAddDeductionDialogOpen.value = true;
    };

    const archiveDeduction = (data: DeductionConfigurationDataResponse) => {
      $q.dialog({
        title: "Archive Deduction",
        message: `Are you sure you want to archive <b>${data.name}</b> Deduction?`,
        ok: "Yes",
        cancel: "No",
        html: true,
      }).onOk(() => {
        archiveDeductionData(data.id);
      });
    };

    const archiveDeductionData = (id: number) => {
      $q.loading.show();
      api
        .delete("hr-configuration/deduction?id=" + id)
        .then(() => {
          getDeductionList();
        })
        .catch((error) => {
          handleAxiosError($q, error);
        })
        .finally(() => {
          $q.loading.hide();
        });
    };

    return {
      isAddDeductionDialogOpen,
      isDeductionTypeTableOpen,
      deductionData,
      dialogMode,
      deductions,
      expandedIndex,
      currentDeductionParent,
      selectedDeduction,
      toggleExpand,
      openDialog,
      getDeductionList,
      handleSelectedDeduction,
      onSelectedDeduction,
      editDeduction,
      archiveDeduction,
    };
  },
};
</script>
