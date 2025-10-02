<template>
  <q-dialog ref="dialog" :maximized="true" persistent transition-show="slide-up" transition-hide="slide-down"
    @before-show="initializeData">
    <q-card class="full-width">
      <q-bar @dblclick="fillData()" class="bg-primary text-white cursor-default" dark>
        <q-icon name="o_task" />
        <div class="text-title-medium">{{ capitalizeFirstLetter(dialogType) }} Inventory</div>
        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="text-label-small">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row justify-between">
          <!-- left topbar -->
          <div class="row left-side">
            <GInput ref="warehouseSelect" type="select-search" apiUrl="/select-box/warehouse-list" label="Warehouse" class="text-body-medium"
              v-model="form.warehouseId">
            </GInput>
          </div>

          <!-- right topbar -->
          <div class="right-side text-right">
            <div class="text-title-medium">Total Estimated Price</div>
            <div class="text-headline-small">{{ totalAmount }}</div>
          </div>
        </div>

        <!-- item table -->
        <div class="q-mt-lg text-body-medium">
          <ItemTableSelect ref="itemTableSelect" v-model="form.items" @totalAmount="getTotal"></ItemTableSelect>
        </div>

        <!-- bottom area -->
        <div class="q-mt-md">
          <g-input v-model="form.memo" style="width: 400px" label="Memo" type="textarea" class="text-body-medium"></g-input>
        </div>

        <!-- bottom buttons -->
        <div class="bottom-nav text-right">
          <q-btn class="q-mr-sm text-label-large" no-caps color="white" @click="$refs.dialog.hide()" flat>Close</q-btn>
          <q-btn @click="saveData" no-caps color="white" unelevated class="text-black text-label-large">Save</q-btn>
        </div>

      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import GInput from "../../../components/shared/form/GInput.vue";
import ItemTableSelect from './ItemTableSelect.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'RefillWriteOffInventoryDialog',
  components: {
    GInput,
    ItemTableSelect,
  },
  props: {
    warehouseId: {
      type: String,
      required: true,
    },
    dialogType: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    form: {
      warehouseId: null,
      items: [],
      memo: '',
    },
    totalAmount: '0',
  }),
  watch: {
  },
  mounted() {
    this.initializeData();
  },
  methods: {
    async fillData() {
      this.$refs.itemTableSelect.fillData();
    },
    async initializeData() {
      setTimeout(() => {
        this.$refs.warehouseSelect.setAutoSelect(this.warehouseId);
      })

      this.totalAmount = this.currencyFormat(0);
    },
    getTotal(totalAmount) {
      this.totalAmount = this.currencyFormat(totalAmount);
    },
    async saveData() {
      try {
        this.$q.loading.show();
        await api.post(`/inventory/${this.dialogType}`, this.form);
        this.$emit('saveDone');
        this.$refs.dialog.hide()
      } catch (error) {
        this.handleAxiosError(error);
      }

      this.$q.loading.hide();

    }
  },
};
</script>
