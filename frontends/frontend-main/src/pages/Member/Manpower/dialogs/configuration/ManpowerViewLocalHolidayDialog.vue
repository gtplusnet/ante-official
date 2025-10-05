<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogTitle>
        View Local Holiday
      </template>

      <template #DialogContent>
        <div class="col q-gutter-y-md q-px-md q-pt-md">
          <!-- Name -->
          <div class="col-6">
            <g-input
              required
              type="readonly"
              label="Holiday Name"
              v-model="form.name"
            ></g-input>
          </div>

          <!-- Type -->
          <div class="col-6">
            <g-input
              required
              type="readonly"
              apiUrl="/select-box/holiday-type"
              label="Type"
              v-model="form.type"
            ></g-input>
          </div>

          <!-- Region -->
          <div class="col-6">
            <g-input
              required
              type="readonly"
              apiUrl="/select-box/location-region-list"
              label="Region"
              v-model="form.region"
            ></g-input>
          </div>

          <!-- province -->
          <div class="col-6">
            <g-input
              required
              type="readonly"
              label="Province"
              v-model="form.province"
            ></g-input>
          </div>

          <!-- Date -->
          <div class="col-6">
            <g-input
              required
              type="readonly"
              label="Date"
              v-model="form.date"
            ></g-input>
          </div>
          <div class="col-12 text-right q-pb-md q-gutter-x-sm">
            <GButton
              class="text-label-large"
              variant="outline"
              label="Close"
              type="button"
              color="primary"
              v-close-popup
            />

            <GButton
              @click="$emit('edit', localHolidayData)"
              label="Edit"
              class="text-label-large"
              type="button"
              color="primary"
              v-close-popup
            />
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.schedule-card {
  max-width: 400px;
}
</style>

<script lang="ts">
import { useQuasar } from 'quasar';
import GInput from "src/components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import { ref } from 'vue';
import { defineAsyncComponent } from 'vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'ViewLocalHoliday',
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  props: {
    localHolidayData: {
      type: Object || null,
      default: null,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const form = ref({
      name: '',
      type: '',
      region: '',
      province: '',
      date: '',
    });

    const fetchData = () => {
      $q.loading.show();

      if (props.localHolidayData) {
        form.value.name = props.localHolidayData.name;
        form.value.type = props.localHolidayData.type.label;
        form.value.region = props.localHolidayData.province.region.name;
        form.value.province = props.localHolidayData.province.name;
        form.value.date = props.localHolidayData.date.dateFull;
      }

      $q.loading.hide();
    };

    return {
      form,
      fetchData,
    };
  },
};
</script>
