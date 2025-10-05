<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card class="full-width dialog-card">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="inventory" />
        <div>Item Breakdown ({{ part.partName }})</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="text-right q-mb-md">
          <q-btn
            rounded
            no-caps
            color="primary"
            label="Add Item"
            unelevated
            @click="showAddItemDialog"
          />
        </div>

        <table class="global-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="3" v-if="items.length === 0" class="text-center">
                No items found
              </td>
            </tr>
            <tr v-for="(item, index) in items" :key="index">
              <td class="text-center">{{ item.item.name }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-center">
                <q-btn
                  rounded
                  dense
                  no-caps
                  flat
                  icon="delete"
                  color="red"
                  @click="deleteItem(item)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </q-card-section>
    </q-card>

    <choose-item-dialog
      v-model="isChooseItemDialogOpen"
      @chooseItem="addItemRequestQuantity"
    />
  </q-dialog>
</template>
<style scoped lang="scss">
.dialog-card {
  max-width: 800px;
}
</style>

<script>
import { defineAsyncComponent } from 'vue';
import { api } from 'src/boot/axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ChooseItemDialog = defineAsyncComponent(() =>
  import("../../../../components/dialog/ChooseItemDialog.vue")
);

export default {
  name: 'AddEditEquipmentPartsDialog',
  props: {
    equipmentId: {
      type: Number,
      required: true,
    },
    part: {
      type: Object,
      default: null,
    },
  },
  components: {
    ChooseItemDialog,
  },
  data: () => ({
    form: {
      partName: '',
      scheduleDay: 10,
    },
    items: [],
    quantity: 1,
    isChooseItemDialogOpen: false,
  }),
  methods: {
    showAddItemDialog() {
      this.isChooseItemDialogOpen = true;
    },
    submitRequest() {
      this.form.equipmentId = this.equipmentId;
      this.form.scheduleDay = parseInt(this.form.scheduleDay, 10);

      api
        .post('equipment/part', this.form)
        .then(() => {
          this.$refs.dialog.hide();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
    addItemRequestQuantity(item) {
      this.$q
        .dialog({
          title: 'Add Item Quantity',
          message: 'Enter the quantity of the item',
          prompt: {
            model: this.quantity,
            type: 'number',
          },
          cancel: true,
          persistent: true,
        })
        .onOk((data) => {
          this.addItemRequest(item, data);
        });
    },
    addItemRequest(item, data) {
      this.$q.loading.show();

      api
        .post('equipment/parts-items', {
          equipmentId: this.equipmentId,
          partId: this.part.id,
          itemId: item.id,
          quantity: Number(data),
        })
        .then(() => {
          this.fetchData();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    deleteItem(item) {
      this.$q.loading.show();

      api
        .delete('equipment/parts-items', {
          data: { id: item.id },
        })
        .then(() => {
          this.fetchData();
          this.$emit('saveDone');
        })
        .catch((error) => {
          this.handleAxiosError(error);
        })
        .finally(() => {
          this.$q.loading.hide();
        });
    },
    fetchData() {
      this.form = {
        partName: '',
        scheduleDay: 10,
      };

      api
        .get('equipment/parts-items', {
          params: {
            partId: this.part.id,
          },
        })
        .then((response) => {
          this.items = response.data;
        })
        .catch((error) => {
          this.handleAxiosError(error);
        });
    },
  },
};
</script>
