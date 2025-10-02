<template>
  <q-dialog ref="dialog">
    <q-card class="full-width dialog-card1">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <div>Edit Contract</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <q-form class="q-gutter-md">
          <div class="column">
            <!------------------------------------------>
            <div class="q-pa-md q-mb-md rounded-borders">
              <div class="row q-col-gutter-md">
                <div class="rounded-borders EMain">
                  <div class="E1">
                    <div class="q-mb-xs">Employee Status</div>
                    <q-select
                      :options="employeeStatus"
                      dense
                      outlined
                      options-dense
                      emit-value
                      map-options
                      class="full-width"
                    />
                  </div>

                  <div class="E2">
                    <g-input
                      label="Start Date"
                      type="date"
                      class="full-width"
                    />

                    <g-input label="End Date" type="date" class="full-width" />
                  </div>

                  <div class="E3">
                    <g-input label="Monthly Rate" class="full-width" />
                  </div>

                  <div class="E3">
                    <g-input
                      label="Pag-Ibig Employee Rate (Optional)"
                      class="full-width"
                    />
                  </div>

                  <div class="E3">
                    <g-input label="Contract" class="full-width" type="file" />
                  </div>
                </div>
              </div>
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn
                no-caps
                class="q-mr-sm"
                unelevated
                label="Update"
                type="button"
                color="primary"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "src/components/shared/form/GInput.vue";

export default {
  name: 'NewContract',
  components: {
    GInput,
  },
  props: {},
  data: () => ({
    employeeStatus: [
      { label: 'REGULAR', value: 'REGULAR' },
      { label: 'CONTRACTTUAL', value: 'CONTRACTTUAL' },
      { label: 'PROBATIONARY', value: 'PROBATIONARY' },
      { label: 'TRAINEE', value: 'TRAINEE' },
    ],
  }),

  methods: {},
};
</script>

<style
  scoped
  lang="scss"
  src="../../../dialogs/hris/ManpowerAddEditHRISEmployeeDialog.scss"
></style>
