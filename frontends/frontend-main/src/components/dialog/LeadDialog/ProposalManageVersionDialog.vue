<template>
  <q-dialog ref="dialog">
    <TemplateDialog minWidth="600px" maxHeight="calc(100% - 5px)">
      <template #DialogTitle> Manage Versions </template>
      <template #DialogContent>
        <div class="q-pb-sm">
          <q-btn label="Upload New Version" color="secondary" no-caps unelevated />
        </div>
        <div class="version-container">
          <div class="version-card row justify-between">
            <div>
              <div class="text-dark text-label-large q-pb-xs">Version 3(Current) <span class="text-grey">Proposal 001.docx</span></div>
              <div class="text-grey text-label-small">July 3, 2025 4:20 PM <span class="text-dark text-label-small q-ml-sm">David Paman</span></div>
            </div>
            <div class="row items-center">
              <q-btn icon="more_vert" color="light-grey" flat round dense />
            </div>
          </div>

          <div class="version-card row justify-between">
            <div>
              <div class="text-dark text-label-large q-pb-xs">Version 3(Current) <span class="text-grey">Proposal 001.docx</span></div>
              <div class="text-grey text-label-small">July 3, 2025 4:20 PM <span class="text-dark text-label-small q-ml-sm">David Paman</span></div>
            </div>
            <div class="row items-center">
              <q-btn icon="more_vert" color="light-grey" flat round dense />
            </div>
          </div>

          <div class="version-card row justify-between">
            <div>
              <div class="text-dark text-label-large q-pb-xs">Version 3(Current) <span class="text-grey">Proposal 001.docx</span></div>
              <div class="text-grey text-label-small">July 3, 2025 4:20 PM <span class="text-dark text-label-small q-ml-sm">David Paman</span></div>
            </div>
            <div class="row items-center">
              <q-btn icon="more_vert" color="light-grey" flat round dense />
            </div>
          </div>
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script lang="ts">

export default {
  name: 'ProposalManageVersionDilaog',
  components: {
    TemplateDialog,
  },

  setup() {
    return {};
  },
};
</script>

<style scoped lang="scss">
.version-container {
  border-radius: 8px;
  border: 1px solid #eee;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  max-height: calc(100vh - 195px);

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }

  .version-card {
    padding: 16px;
    border-radius: 8px;
    background-color: #f6f8fb;
  }
}
</style>
