<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog>
      <template #DialogIcon>
        <q-icon name="visibility" size="24px" />
      </template>
      <template #DialogTitle>
        <div>View Branch</div>
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <q-form>
            <div class="col-6 q-mb-md">
              <g-input
                v-model="form.branchCode"
                label="Branch Code"
                type="readonly"
              />
            </div>
            <div class="col-6 q-mb-md">
              <g-input
                v-model="form.branchName"
                label="Branch Name"
                type="readonly"
              />
            </div>
            <div class="col-6">
              <selection-location
                required
                :disabled="true"
                label="Location"
                v-model="form.selectedLocation"
              ></selection-location>
            </div>

            <div class="full-width text-right q-mt-md">
              <GButton
                class="q-mr-sm text-label-large"
                variant="outline"
                label="Cancel"
                type="button"
                color="primary"
                v-close-popup
              />
              <GButton
                class="text-label-large"
                label="Edit"
                type="button"
                @click="$emit('edit', branchData)"
                color="primary"
                v-close-popup
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  max-width: 500px;
}
</style>

<script lang="ts">
import GInput from "../../../../../components/shared/form/GInput.vue";
import SelectionLocation from "../../../../../components/selection/SelectionLocation.vue";
import { ref } from "vue";
import { defineAsyncComponent } from 'vue';
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: "ViewBranchManagementDialog",
  components: {
    SelectionLocation,
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    branchData: {
      type: Object || null,
      default: null,
    },
  },
  setup(props) {
    const form = ref({
      branchCode: "",
      branchName: "",
      selectedLocation: "",
    });

    const fetchData = () => {
      if (props.branchData) {
        form.value.branchCode = props.branchData.code;
        form.value.branchName = props.branchData.name;
        form.value.selectedLocation = props.branchData.location.id;
      } else {
        form.value.branchCode = "";
        form.value.branchName = "";
        form.value.selectedLocation = "";
      }
    };

    return {
      fetchData,
      form,
    };
  },
  // data() {
  //   return {
  //     form: {
  //       branchCode: '',
  //       branchName: '',
  //       locationId: null,
  //     },
  //   };
  // },
  // mounted() {},
  // methods: {
  //   fetchData() {
  //     if (this.branchData) {
  //       this.form.branchCode = this.branchData.data.code;
  //       this.form.branchName = this.branchData.data.name;
  //       this.form.locationId = this.branchData.data.location.id;
  //     } else {
  //       this.form.branchCode = '';
  //       this.form.branchName = '';
  //       this.form.locationId = null;
  //     }
  //   },
  // },
};
</script>
