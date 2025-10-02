<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title">Gate Management</div>
          <div>
            <q-breadcrumbs>
              <q-breadcrumbs-el label="School Management" :to="{ name: 'member_school_gate_management' }" />
              <q-breadcrumbs-el label="Devices" />
              <q-breadcrumbs-el label="Gate Management" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="text-right">
          <q-btn @click="openAddEditDialog()" no-caps color="primary" unelevated>
            <q-icon name="add"></q-icon>
            Add Gate
          </q-btn>
        </div>
      </div>
    </div>

    <g-card class="q-pa-md">
      <g-table 
        :isRowActionEnabled="true" 
        tableKey="gateTable" 
        apiUrl="school/gate/table" 
        ref="table"
      >
        <!-- Gate Name Slot -->
        <template v-slot:gateName="props">
          <div class="text-weight-medium">{{ props.data.gateName }}</div>
        </template>

        <!-- Created At Slot -->
        <template v-slot:createdAt="props">
          {{ formatDate(props.data.createdAt) }}
        </template>

        <!-- Updated At Slot -->
        <template v-slot:updatedAt="props">
          {{ formatDate(props.data.updatedAt) }}
        </template>

        <!-- Row Actions -->
        <template v-slot:rowAction="props">
          <q-btn-dropdown flat dense>
            <q-list dense>
              <q-item clickable v-close-popup @click="openAddEditDialog(props.data)">
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="confirmDelete(props.data)">
                <q-item-section side>
                  <q-icon name="delete" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">Delete</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>
      </g-table>
    </g-card>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddEditDialog">
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ isEdit ? 'Edit Gate' : 'Add Gate' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit="saveGate" ref="gateForm">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <g-input
                  v-model="form.gateName"
                  label="Gate Name"
                  type="text"
                  placeholder="Enter gate name"
                  :required="true"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            :label="isEdit ? 'Update' : 'Save'" 
            @click="saveGate"
            :loading="loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { IGateResponse } from '@shared/response/gate.response';
import GInput from 'src/components/shared/form/GInput.vue';
import GTable from 'src/components/shared/display/GTable.vue';
import GCard from 'src/components/shared/display/GCard.vue';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

export default defineComponent({
  name: 'GateManagement',
  components: {
    ExpandedNavPageContainer,
GInput,
    GTable,
    GCard,
  },
  setup() {
    const $q = useQuasar();
    const table = ref();
    const showAddEditDialog = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const gateForm = ref();

    const form = ref({
      id: '',
      gateName: '',
    });

    const openAddEditDialog = (gate?: IGateResponse) => {
      if (gate) {
        isEdit.value = true;
        form.value = {
          id: gate.id,
          gateName: gate.gateName,
        };
      } else {
        isEdit.value = false;
        form.value = {
          id: '',
          gateName: '',
        };
      }
      showAddEditDialog.value = true;
    };

    const saveGate = async () => {
      if (!form.value.gateName || form.value.gateName.trim() === '') {
        $q.notify({
          type: 'negative',
          message: 'Gate name is required',
        });
        return;
      }

      loading.value = true;
      try {
        const endpoint = isEdit.value ? 'school/gate/update' : 'school/gate/create';
        const method = isEdit.value ? 'put' : 'post';
        
        await api[method](endpoint, form.value);
        
        $q.notify({
          type: 'positive',
          message: `Gate ${isEdit.value ? 'updated' : 'added'} successfully`,
        });
        
        showAddEditDialog.value = false;
        table.value.reload();
      } catch (error) {
        console.error('Error saving gate:', error);
      } finally {
        loading.value = false;
      }
    };

    const confirmDelete = (gate: IGateResponse) => {
      $q.dialog({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${gate.gateName}"?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await api.delete('school/gate/delete', { data: { ids: [gate.id] } });
          
          $q.notify({
            type: 'positive',
            message: 'Gate deleted successfully',
          });
          
          table.value.reload();
        } catch (error) {
          console.error('Error deleting gate:', error);
        }
      });
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString();
    };

    return {
      table,
      showAddEditDialog,
      isEdit,
      loading,
      form,
      gateForm,
      openAddEditDialog,
      saveGate,
      confirmDelete,
      formatDate,
    };
  },
});
</script>