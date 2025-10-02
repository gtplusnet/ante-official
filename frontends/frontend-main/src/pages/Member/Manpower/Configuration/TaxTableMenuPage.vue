<template>
  <expanded-nav-page-container>
    <div class="row items-center justify-between">
      <div>
        <div class="text-title-large">Range Of Taxable Income</div>
        <div>
          <q-breadcrumbs class="text-body-small">
            <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
            <q-breadcrumbs-el label="Configuration" />
            <q-breadcrumbs-el label="Tax Table" />
          </q-breadcrumbs>
        </div>
      </div>
      <q-select v-model="selectedDate" :options="dateOptions" outlined dense label="Select Date" standout emit-value map-options class="text-label-large"/>
    </div>

    <div>
      <ConsolidatedTaxTable label="Daily" v-if="isLoaded" :selectedDate="selectedDate" />
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { ref, onMounted, Ref } from 'vue';
import { api } from 'src/boot/axios';
import ConsolidatedTaxTable from "../../../../pages/Member/Manpower/components/tables/ManpowerConsolidatedTaxTable.vue";
import { useQuasar } from 'quasar';
import { AxiosResponse } from 'axios';
import { SelectBoxResponse } from "@shared/response";
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
export default {
  components: {
    ConsolidatedTaxTable,
    ExpandedNavPageContainer,
  },

  setup() {
    const isLoaded: Ref<boolean> = ref(false);
    const selectedDate: Ref<string> = ref('');
    const dateOptions: Ref<SelectBoxResponse[]> = ref([]);
    const $q = useQuasar();

    const fetchDateOptions = async () => {
      $q.loading.show();

      api
        .get('/hr-configuration/tax/select-date')
        .then((response: AxiosResponse<SelectBoxResponse[]>) => {
          if (response && response.data) {
            dateOptions.value = response.data.map((item: SelectBoxResponse) => ({
              key: item.key,
              label: item.label,
              value: item.key,
            }));

            //default selected date
            if (dateOptions.value.length) {
              selectedDate.value = dateOptions.value[0].value ?? '';
            }
          }
        })
        .then(() => {
          isLoaded.value = true;
        })
        .catch((error) => {
          console.error('Error fetching date options:', error);
        })
        .finally(() => {});
    };

    onMounted(fetchDateOptions);

    return {
      selectedDate,
      dateOptions,
      isLoaded,
    };
  },
};
</script>
