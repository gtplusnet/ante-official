<template>
  <q-btn @click="openDiscussionTopic" no-caps color="primary" outline>
    <q-icon size="14px" class="q-mr-xs" name="mode_comment" />
    <span class="q-mt-xxs">View Topic</span>
  </q-btn>
</template>

<script lang="ts">
import { PropType, ref, Ref } from 'vue';
import { DiscussionModule, DiscussionProps } from './DiscussionProps';
import { useQuasar } from 'quasar';
import { CutoffDateRangeResponse } from "@shared/response";
import { api } from 'src/boot/axios';
import bus from 'src/bus';

export default {
  name: 'DiscussionViewTopicButton',

  props: {
    data: {
      type: Object as PropType<DiscussionProps>,
      required: true,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const cutoffDateRangeResponse: Ref<CutoffDateRangeResponse> = ref({} as CutoffDateRangeResponse);

    const openDiscussionTopic = () => {
      $q.loading.show();

      switch (props.data.discussionModule) {
        case DiscussionModule.PayrollSummary:
          api
            .get(`/hr-configuration/cutoff/date-range-information?id=${props.data.targetId}`)
            .then((response) => {
              cutoffDateRangeResponse.value = response.data;
              bus.emit('showPayrollSummaryDialog', cutoffDateRangeResponse.value);
            })
            .finally(() => {
              $q.loading.hide();
            });
          break;
        case DiscussionModule.Task:
          api
            .get(`/task?id=${props.data.targetId}`)
            .then((response) => {
              bus.emit('showTaskDialog', { task: response.data, fromDiscussion: true });
            })
            .catch((error) => {
              $q.notify({
                type: 'negative',
                message: 'Failed to load task information',
              });
              console.error('Error loading task:', error);
            })
            .finally(() => {
              $q.loading.hide();
            });
          break;
        default:
          $q.notify({
            type: 'negative',
            message: 'Feature not implemented yet',
          });
          $q.loading.hide();
          break;
      }
    };
    return {
      cutoffDateRangeResponse,
      openDiscussionTopic,
    };
  },
};
</script>
