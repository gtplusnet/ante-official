<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">People Without Checkout</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 text-grey-6 q-mb-md">
          Date: {{ formattedDate }}
        </div>
        
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner size="50px" color="primary" />
          <div class="q-mt-md">Loading people...</div>
        </div>

        <div v-else-if="people.length === 0" class="text-center q-pa-lg">
          <q-icon name="check_circle" size="50px" color="positive" />
          <div class="text-h6 q-mt-md">Everyone has checked out</div>
          <div class="text-subtitle2 text-grey-6">
            No one is pending checkout for this date.
          </div>
        </div>

        <div v-else>
          <div class="q-mb-md">
            <q-badge color="warning" class="q-pa-sm">
              {{ people.length }} {{ people.length === 1 ? 'person' : 'people' }} without checkout
            </q-badge>
          </div>

          <q-table
            :rows="people"
            :columns="columns"
            flat
            bordered
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="people-table"
          >
            <template v-slot:body-cell-personType="props">
              <q-td :props="props">
                <q-badge 
                  :color="props.value === 'student' ? 'primary' : 'secondary'" 
                  text-color="white"
                >
                  {{ props.value === 'student' ? 'Student' : 'Guardian' }}
                </q-badge>
              </q-td>
            </template>

            <template v-slot:body-cell-checkInTime="props">
              <q-td :props="props">
                <q-icon name="login" color="green" size="xs" class="q-mr-xs" />
                {{ props.value }}
              </q-td>
            </template>

            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge color="warning" text-color="black">
                  <q-icon name="schedule" size="xs" class="q-mr-xs" />
                  Pending Checkout
                </q-badge>
              </q-td>
            </template>
          </q-table>

          <div class="q-mt-md text-caption text-grey-6">
            <q-icon name="info" size="xs" />
            These people have checked in but have not yet checked out for the selected date.
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="people.length > 0"
          flat
          label="Export List"
          color="primary"
          icon="download"
          @click="exportList"
          class="q-mr-sm"
        />
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface Person {
  id: string;
  personId: string;
  personName: string;
  personType: 'student' | 'guardian';
  checkInTime: string;
  checkInDateTime: string;
  deviceId: string;
  location: string;
}

export default defineComponent({
  name: 'PeopleWithoutCheckoutDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const loading = ref(false);
    const people = ref<Person[]>([]);

    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const formattedDate = computed(() => {
      const date = new Date(props.date);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    const columns = [
      {
        name: 'personName',
        label: 'Name',
        field: 'personName',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'personType',
        label: 'Type',
        field: 'personType',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'checkInTime',
        label: 'Check-in Time',
        field: 'checkInTime',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'deviceId',
        label: 'Device',
        field: 'deviceId',
        align: 'center' as const,
      },
      {
        name: 'location',
        label: 'Location',
        field: 'location',
        align: 'center' as const,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center' as const,
      },
    ];

    const fetchPeople = async () => {
      loading.value = true;
      try {
        const response = await api.get('/school/attendance/people-without-checkout', {
          params: { date: props.date },
        });
        people.value = response.data.people || [];
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        loading.value = false;
      }
    };

    const exportList = () => {
      if (people.value.length === 0) return;

      const headers = ['Name', 'Type', 'Check-in Time', 'Device', 'Location'];
      const csvContent = [
        headers.join(','),
        ...people.value.map(p => 
          [
            `"${p.personName}"`,
            p.personType,
            p.checkInTime,
            p.deviceId,
            p.location
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `people-without-checkout-${props.date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      $q.notify({
        type: 'positive',
        message: 'List exported successfully',
      });
    };

    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        fetchPeople();
      }
    });

    return {
      dialogModel,
      loading,
      people,
      columns,
      formattedDate,
      exportList,
    };
  },
});
</script>

<style scoped>
.people-table {
  max-height: 400px;
}
</style>