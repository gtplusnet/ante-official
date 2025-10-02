<template>
  <q-dialog ref="dialog" @before-show="loadInitialData">
    <template v-if="!isPrompt">
      <q-card class="full-width">
        <q-bar class="bg-primary text-white cursor-default" dark>
          <div>Name of version</div>

          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <q-form @submit.prevent="submitData" class="row">
            <div class="col-12 q-px-sm">
              <GInput type="text" label="Version Title" v-model="form.versionTitle"></GInput>
            </div>

            <div class="col-12 text-right">
              <q-btn no-caps class="q-mr-sm" outline label="Cancel" type="button" color="primary" v-close-popup />
              <q-btn no-caps unelevated label="Submit Version" type="submit" color="primary" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </template>
    <template v-else>
      <q-card>
        <!-- Prompt Message -->
        <div class="q-pa-md text-center">
          <p class="q-mb-none text-h6">Are you sure you want to switch version?</p>
        </div>

        <!-- Buttons for Cancel and Yes -->
        <div class="q-pa-md text-center">
          <q-btn
            no-caps
            outline
            label="Cancel"
            color="primary"
            v-close-popup
            class="q-mr-sm"
            style="width: 120px;"
          />
          <q-btn
            no-caps
            unelevated
            label="Yes"
            color="primary"
            @click="submitData()"
            style="width: 120px;"
          />
        </div>
      </q-card>
    </template>
  </q-dialog>
</template>

<script>
import GInput from "../../../components/shared/form/GInput.vue";
import { api } from 'src/boot/axios';

export default {
  name: 'BillOfQuantityDialogVersionHistorySubmit',
  components: {
    GInput,
  },
  props: {
    versionTitle:String,
    isPrompt:Boolean,
    projectId: {
      type: Number,
      required: true,
    },
    boqId: {
      type: null, 
      required: false,
    },
  },
  data: () => ({
    form: {},
  }),
  mounted() {
  },
  methods: {
    loadInitialData() {
      this.form = {};
      this.form.projectId = this.projectId;
      this.form.versionTitle = this.versionTitle;

      if(this.boqId)
      {
        this.form.sourceBoqId = this.boqId;
      }
    },
    async submitData(){
      this.$q.loading.show();
      console.log(this.form);
      try {
          this.isLoading = true;
          await api.post('/boq/version' , this.form);
          this.$emit('saveDone');
      } catch (error) {
          this.handleAxiosError(error);
      }
      this.$q.loading.hide();
    }
  }
};
</script>
