<template>
  <q-dialog @before-show="beforeShow" persistent v-model="internalModelValue">
    <TemplateDialog maxWidth="600px">
      <template #DialogIcon>
        <q-icon name="person_add" size="24px" />
      </template>
      <template #DialogTitle>
        <div>{{ mode === 'add' ? 'Add New Contract' : 'Edit Contract' }}</div>
      </template>
      <template #DialogContent>
        <section>
          <q-form @submit.prevent="onSave">
            <div class="column">
              <div class="rounded-borders q-px-md">
                <div class="row">
                  <div class="rounded-borders full-width">
                    <div>
                      <g-input
                        v-model="form.employmentStatus"
                        label="Employment Status"
                        type="select"
                        apiUrl="hris/employee/contract/employment-status"
                        class="full-width"
                      />
                    </div>
                    <div class="q-mt-md E2">
                      <g-input v-model="form.startDate" label="Start Date" type="date" class="full-width q-mb-md" />
                      <g-input v-if="form.employmentStatus !== 'REGULAR'" v-model="form.endDate" label="End Date" type="date" class="full-width" />
                    </div>
                    <div class="q-mt-md">
                      <g-input v-model="form.monthlyRate" label="Monthly Rate" type="number" class="full-width" />
                    </div>
                    <div>
                      <g-input v-model="contractFile" label="Contract File" type="file" class="full-width" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-form>
        </section>
      </template>

      <template #DialogSubmitActions>
        <g-button
          :label="mode === 'add' ? 'Save' : 'Update'"
          type="submit"
          color="primary"
          :loading="isLoading"
        />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import GInput from "src/components/shared/form/GInput.vue";
import { ContractDataResponse } from '@shared/response/contract.response';
import { ContractCreateRequest, ContractEditRequest, EmploymentStatus } from '@shared/request/contract.request';
import { api } from 'src/boot/axios';
import { handleAxiosError } from "src/utility/axios.error.handler";
import { AxiosError } from 'axios';
import { useQuasar } from 'quasar';
import { FileDataResponse } from "@shared/response";
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default defineComponent({
  name: 'ContractDialog',
  components: { GInput, TemplateDialog, GButton },
  props: {
    modelValue: { type: Boolean, required: true },
    mode: { type: String, required: true },
    contract: { type: Object as () => ContractDataResponse | null, default: null },
    accountId: { type: String, required: true },
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const internalModelValue = ref(props.modelValue);
    const isLoading = ref(false);
    const contractFile = ref<FileDataResponse | null>(null);
    const $q = useQuasar();

    watch(
      () => props.modelValue,
      (v) => (internalModelValue.value = v)
    );
    watch(internalModelValue, (v) => emit('update:modelValue', v));

    const form = ref({
      employmentStatus: props.contract?.employmentStatus || 'REGULAR',
      startDate: props.contract?.startDate || '',
      endDate: props.contract?.endDate || '',
      monthlyRate: props.contract?.monthlyRate || '',
      contractFileId: props.contract?.contractFile,
    });

    function close() {
      internalModelValue.value = false;
    }

    function toISODate(val: unknown): string {
      if (!val) return '';
      if (typeof val === 'string') {
        // Convert YYYY/MM/DD to YYYY-MM-DD
        if (val.includes('/')) {
          return val.replace(/\//g, '-');
        }
        return val;
      }
      if (typeof val === 'object' && val !== null && 'date' in val && typeof (val as Record<string, unknown>).date === 'string') {
        const dateStr = (val as Record<string, unknown>).date as string;
        // Convert YYYY/MM/DD to YYYY-MM-DD if needed
        if (dateStr.includes('/')) {
          return dateStr.replace(/\//g, '-');
        }
        return dateStr;
      }
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      return '';
    }

    async function onSave() {
      isLoading.value = true;
      try {
        const startDate = toISODate(form.value.startDate) || '';
        let endDate: string | undefined = toISODate(form.value.endDate) || undefined;
        if (form.value.employmentStatus === 'REGULAR') {
          endDate = undefined;
        }
        if (props.mode === 'add') {
          const req: ContractCreateRequest = {
            accountId: props.accountId,
            contractData: {
              monthlyRate: Number(form.value.monthlyRate),
              employmentStatus: form.value.employmentStatus as EmploymentStatus,
              startDate,
              ...(endDate ? { endDate } : {}),
              contractFileId: contractFile.value ? Number(contractFile.value['id']) : undefined,
            },
          };

          await api.post('/hris/employee/contract/add', req);
          notifySuccess('Contract added successfully');
        } else if (props.mode === 'edit' && props.contract) {
          const req: ContractEditRequest = {
            contractId: props.contract.id,
            contractData: {
              monthlyRate: Number(form.value.monthlyRate),
              employmentStatus: form.value.employmentStatus as EmploymentStatus,
              startDate,
              ...(endDate ? { endDate } : {}),
              contractFileId: form.value.contractFileId ? Number(form.value.contractFileId) : undefined,
            },
          };

          await api.patch('/hris/employee/contract/edit', req);
          notifySuccess('Contract updated successfully');
        }
        emit('saved');
        close();
      } catch (err) {
        handleAxiosError($q, err as AxiosError);
      } finally {
        isLoading.value = false;
      }
    }

    function notifySuccess(msg: string) {
      // @ts-expect-error Quasar $q is injected at runtime
      if (window.$q) window.$q.notify({ type: 'positive', message: msg });
    }

    function beforeShow() {
      contractFile.value = null;
      form.value.startDate = '';
      form.value.endDate = '';
      form.value.monthlyRate = '';
      form.value.employmentStatus = 'REGULAR';
    }

    return { internalModelValue, form, close, onSave, isLoading, beforeShow, contractFile };
  },
});
</script>

<style scoped lang="scss" src="../../../dialogs/hris/ManpowerAddEditHRISEmployeeDialog.scss"></style>
