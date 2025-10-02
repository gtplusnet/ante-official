<template>
  <q-dialog ref="dialog" @before-show="loadInitialData">
    <q-card class="full-width boq-history">
      <q-bar class="bg-primary text-white cursor-default" dark>
        <q-icon name="check" />
        <div>Version Control</div>

        <q-space />

        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <div class="col-12 text-right" style="padding-bottom:7px;">
            <q-btn no-caps label="Create New Version" type="button" color="primary" @click="openVersionSubmit()" />
        </div>
        <template v-if="isLoading">
          <GlobalLoader />
        </template>
        <template v-else>
          <table class="non-selectable text-center">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Version Name</th>
                    <th>Source Version</th>
                    <th>Date Created</th>
                    <th>Time</th>
                    <th style="width:300px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="version_data in version_lists" :key="version_data.id">
                    <td>{{version_data.revision}}</td>
                    <td>{{version_data.subject}}</td>
                    <td>{{version_data.sourceBillOfQuantity ? version_data.sourceBillOfQuantity.revision : '-'}}</td>
                    <td>{{version_data.createdAt.date}}</td>
                    <td>{{version_data.createdAt.time}}</td>
                    <td v-if="version_data.sourceBillOfQuantity"> <span class="version-btn" @click="openVersionSubmit(version_data.id,version_data.subject)">Switch to this version </span> | <span class="version-btn">Preview Version </span> </td>
                    <td v-else></td>
                  </tr>
                </tbody>
          </table>
        </template>
      </q-card-section>
    </q-card>
    <BillOfQuantityDialogVersionHistorySubmit v-model="isBillOfQuantityVersionSubmitShown" :boqId="submitBoqId" @saveDone="saveDone"
      :isPrompt="isPrompt" :versionTitle="versionTitle" :projectId="projectId" />
  </q-dialog>
</template>
<style scoped src="./BillOfQuantityDialogVersionHistory.scss"></style>
<script>

import BillOfQuantityDialogVersionHistorySubmit from './BillOfQuantityDialogVersionHistorySubmit.vue';
import { api } from 'src/boot/axios';
import GlobalLoader from "../../../components/shared/common/GlobalLoader.vue";

export default {
  name: 'BillOfQuantityDialogVersionHistory',
  components: {
    GlobalLoader,
    BillOfQuantityDialogVersionHistorySubmit
  },
  props: {
    projectId: Number,
    boqId: Number,
    isBillVersionOpenNew:Boolean
  },
  data: () => ({
    isPrompt:false,
    isLoading:true,
    version_lists: [],
    isBillOfQuantityVersionSubmitShown: false,
    submitBoqId: null,
    versionTitle:'',
  }),
  mounted() {
    this.loadInitialData();
  },
  methods: {
    saveDone(){
      this.isBillOfQuantityVersionSubmitShown = false;
      this.loadInitialData();
    },
    async loadInitialData() {
        this.isLoading = true;
        try {
            const response = await api.get('/boq/version?projectId=' + this.projectId);
            this.version_lists = response.data.data;
        } catch (error) {
            this.handleAxiosError(error);
        }
        this.isLoading = false;
    },
    async openVersionSubmit(boqId = null, versionTitle = '')
    {
        if(boqId)
        {
            this.submitBoqId = boqId;
            this.isPrompt = true;
            this.versionTitle = versionTitle;
        }
        else
        {
            this.submitBoqId = false;
            this.isPrompt = false;
            this.versionTitle = '';
        }
        
        this.isBillOfQuantityVersionSubmitShown = true;
    }

  },
};
</script>
