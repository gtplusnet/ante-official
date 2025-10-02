<template>
  <q-dialog ref="dialog" @before-show="initForm">
    <TemplateDialog minWidth="400px" maxWidth="400px">
      <template #DialogIcon>
        <q-icon name="o_note_add" />
      </template>
      
      <template #DialogTitle>
        {{ noteData?.id ? "Edit" : "Add" }} Note
      </template>

      <template #DialogContent>
        <section class="q-px-md q-pb-md">
          <q-form @submit.prevent="save">
            <div class="row">
              <div class="col-12 q-px-sm">
                <g-input 
                  v-model="form.note" 
                  label="What needs to be done in this stages..." 
                  type="textarea" 
                  required 
                  :placeholder="placeholder"
                />
              </div>
            </div>

            <div class="text-right">
              <GButton
                no-caps
                class="q-mr-sm"
                variant="tonal"
                label="Cancel"
                type="button"
                color="light-grey"
                v-close-popup
              />
              <GButton 
                no-caps 
                unelevated 
                :label="noteData?.id ? 'Update' : 'Save'" 
                type="submit" 
                color="primary" 
              />
            </div>
          </q-form>
        </section>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style scoped lang="scss">
/* Styles managed by TemplateDialog */
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { QDialog, useQuasar } from "quasar";
import GInput from "src/components/shared/form/GInput.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";

interface NoteForm {
  note: string;
}

interface NoteData {
  id?: number;
  note: string;
  createdAt?: string;
  updatedAt?: string;
}

export default defineComponent({
  name: "AddNoteDialog",
  components: {
    GInput,
    GButton,
    TemplateDialog,
  },
  props: {
    noteData: {
      type: Object as () => NoteData | null,
      default: null,
    },
    placeholder: {
      type: String,
      default: "Enter your note here...",
    },
  },
  emits: ["close", "saveDone"],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialog = ref<InstanceType<typeof QDialog>>();

    const form = ref<NoteForm>({
      note: "",
    });

    const initForm = () => {
      if (props.noteData && props.noteData.id) {
        // Edit mode - populate form with existing data
        form.value = {
          note: props.noteData.note || "",
        };
      } else {
        // Create mode - reset form
        form.value = {
          note: "",
        };
      }
    };

    const save = async () => {
      const isEdit = !!props.noteData?.id;
      $q.loading.show({
        message: isEdit ? "Updating note..." : "Saving note...",
      });

      try {
        // Simulate API call - replace with actual API implementation
        await new Promise((resolve) => setTimeout(resolve, 800));

        const responseData: NoteData = {
          id: isEdit ? props.noteData!.id : Date.now(),
          note: form.value.note,
          createdAt: isEdit ? props.noteData!.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        $q.notify({
          message: `Note ${isEdit ? "updated" : "saved"} successfully`,
          color: "positive",
          position: "top",
          timeout: 2000,
        });

        emit("saveDone", responseData);
        emit("close");

        if (dialog.value) {
          dialog.value.hide();
        }
      } catch (error) {
        console.error(`Failed to ${isEdit ? "update" : "save"} note:`, error);
        $q.notify({
          message: `Failed to ${isEdit ? "update" : "save"} note`,
          color: "negative",
          position: "top",
          timeout: 2000,
        });
      } finally {
        $q.loading.hide();
      }
    };

    return {
      dialog,
      form,
      initForm,
      save,
    };
  },
});
</script>