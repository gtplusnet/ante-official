<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <TemplateDialog minWidth="600px" maxWidth="700px">
      <template #DialogIcon>
        <q-icon name="person" />
      </template>

      <template #DialogTitle>
        <div @dblclick="fillData()" class="cursor-pointer">Create Client</div>
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <q-form @submit.prevent="save">
            <div class="row">
              <!-- Logo -->
              <div class="col-12 q-px-sm">
                <g-input accept="image/*" required type="file" label="Client Logo" v-model="form.clientLogo"></g-input>
              </div>

              <!-- Client Name -->
              <div class="col-12 q-px-sm">
                <g-input required type="text" label="Client Name" v-model="form.name"></g-input>
              </div>

              <!-- Contact Number -->
              <div class="col-6 q-px-sm">
                <g-input required type="text" label="Contact Number" v-model="form.contactNumber"></g-input>
              </div>

              <!-- Email -->
              <div class="col-6 q-px-sm">
                <g-input required type="text" label="Email" v-model="form.email"></g-input>
              </div>

              <!-- Location -->
              <div class="col-12 q-px-sm">
                <selection-location required label="Location" v-model="form.locationId"></selection-location>
              </div>
            </div>

            <div class="text-right q-mt-md">
              <GButton no-caps class="q-mr-sm" variant="tonal" label="Close" type="button" color="light-grey" v-close-popup />
              <GButton no-caps unelevated label="Save" @click="save" color="primary" />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
/* Styles managed by TemplateDialog */
</style>

<script>
import { defineAsyncComponent } from 'vue';
import GInput from "../../components/shared/form/GInput.vue";
import GButton from "../../components/shared/buttons/GButton.vue";
import SelectionLocation from "../selection/SelectionLocation.vue";
import { api } from "src/boot/axios";
import { useGlobalMethods } from "src/composables/useGlobalMethods";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);
export default {
  name: "AddEditClientDialog",
  components: {
    GInput,
    GButton,
    SelectionLocation,
    TemplateDialog,
  },
  setup() {
    const { handleAxiosError } = useGlobalMethods();
    return { handleAxiosError };
  },
  props: {},
  data: () => ({
    form: {
      name: "",
      contactNumber: "",
      email: "",
      locationId: null,
      clientLogo: null,
    },
  }),
  watch: {},
  methods: {
    async fillData() {
      this.$q.loading.show();
      const { data } = await api.get("https://randomuser.me/api");
      const personInformation = data.results[0];

      this.form.name = `${personInformation.name.first} ${personInformation.name.last}`;
      this.form.contactNumber = personInformation.phone;
      this.form.email = personInformation.email;

      this.$q.loading.hide();
    },
    async save() {
      this.$q.loading.show();

      try {
        const clientInformation = await api.post("client", this.form);

        this.$q.notify({
          message: "Client created successfully",
          color: "positive",
          position: "top",
          timeout: 2000,
        });

        this.$emit("close", clientInformation.data);
        this.$emit("saveDone", clientInformation.data);
        this.$refs.dialog.hide();
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.$q.loading.hide();
    },
    fetchData() {},
  },
};
</script>
