<template>
  <div class="g-field">
    <div class="label text-label-large">{{ label }}</div>
    <div class="field">
      <!-- manual -->
      <slot v-if="type == 'manual'"></slot>

      <!-- readonly -->
      <div class="readonly text-body-medium" v-if="type == 'readonly'">
        {{ modelValue }}
      </div>

      <!-- file upload -->
      <div class="file-upload q-mb-md" v-if="type == 'file'">
        <input :accept="accept" class="hidden" ref="fileUpload" type="file" @change="fileUploadTrigger" />
        <div class="file-name">
          <a v-if="textProp && textProp.url" class="file-path" :href="textProp.url" target="_blank">{{ textProp.originalName || textProp.name || 'File' }}</a>
          <div v-else class="file-path text-grey-6 user-select-none text-body-medium">Select a file</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat @click="triggerUpload" class="button" color="accent" outline>
            <q-icon size="16px" :name="textProp ? 'sync' : 'file_upload'"></q-icon>
            <q-tooltip class="text-label-small">{{ textProp ? 'Change file' : 'Upload file' }}</q-tooltip>
          </q-btn>
          <q-btn v-if="textProp" flat @click="removeFile" class="button" color="negative" outline>
            <q-icon size="16px" name="delete"></q-icon>
            <q-tooltip class="text-label-small">Remove file</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- text input -->
      <q-input
        :required="required"
        v-if="type == 'text'"
        :placeholder="placeholder"
        :readonly="isDisabled"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
        :data-testid="$attrs['data-testid']"
      />

      <!-- email input -->
      <q-input
        :required="required"
        v-if="type == 'email'"
        :placeholder="placeholder"
        type="email"
        :readonly="isDisabled"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
      />

      <!-- choose item -->
      <div v-if="type == 'choose_item'">
        <div class="choose-item">
          <div class="info" :class="{ 'no-item': !textProp }">
            <div
              class="text-body-medium"
              @click="!textProp ? showChooseItemDialog() : showItemInformationDialog()"
              :class="textProp ? 'choose-item-enabled' : 'choose-item-disabled'"
            >
              {{
                textProp
                  ? `${textProp.name}
              (${textProp.sku})`
                  : chooseItemLabel
              }}
            </div>
          </div>
          <div class="actions">
            <q-icon v-if="textProp" name="close" class="cursor-pointer icon" @click="removeItem" />
            <q-icon v-if="!textProp" name="search" class="cursor-pointer icon" @click="showChooseItemDialog" />
          </div>
        </div>
      </div>

      <!-- editor input -->
      <q-editor
        :readonly="isDisabled"
        :fonts="fonts"
        :required="required"
        v-if="type == 'editor'"
        :placeholder="placeholder"
        outlined
        class="q-mb-md text-body-medium"
        :toolbar="toolbar"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
        :data-testid="$attrs['data-testid']"
      />

      <!-- with text_checkbox -->
      <div class="q-mb-xs" v-if="type == 'text_checkbox'">
        <q-input
          :required="required"
          :placeholder="placeholder"
          outlined
          @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
          hide-bottom-space
          v-model="textProp"
          dense
          :filled="isCheckboxTicked"
          :readonly="isCheckboxTicked"
        />
        <div class="row float-right">
          <q-checkbox v-model="isCheckboxTicked" @update:model-value="(newValue) => $emit('isCheckboxTicked', newValue)">
            <div class="label">{{ checkboxLabel }}</div>
          </q-checkbox>
        </div>
      </div>

      <!-- with text_with_tooltip -->
      <div class="q-mb-xs" v-if="type == 'text_with_tooltip'">
        <q-input
          :required="required"
          :placeholder="placeholder"
          outlined
          @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
          hide-bottom-space
          v-model="textProp"
          dense
          :filled="isDisabled"
          :readonly="isDisabled"
          class="text-body-medium"
        />
        <q-tooltip v-if="tooltipLabel" class="text-label-small">{{ tooltipLabel }}</q-tooltip>
      </div>

      <!-- with delete on the right side -->
      <q-input
        :readonly="isDisabled"
        class="q-mb-xs text-body-medium"
        v-if="type == 'text_with_delete'"
        :required="required"
        :placeholder="placeholder"
        outlined
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
      >
        <template v-slot:after>
          <q-icon name="delete_outline" class="cursor-pointer q-ml-sm q-pr-sm" color="negative" @click="() => $emit('onDelete', textProp)"> </q-icon>
        </template>
      </q-input>

      <!-- password input -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        v-if="type == 'password'"
        :placeholder="placeholder"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
        :type="isPasswordVisible ? 'text' : 'password'"
      >
        <template v-slot:append>
          <q-icon
            :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
            class="cursor-pointer"
            @click="isPasswordVisible = !isPasswordVisible"
          />
        </template>
      </q-input>

      <!-- text area -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        type="textarea"
        v-if="type == 'textarea'"
        :placeholder="placeholder"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
      />

      <!-- number -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        v-if="type == 'number'"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        hide-bottom-space
        v-model="textProp"
        dense
        :rules="['numeric']"
        type="number"
        :min="min"
      />

      <!-- currency -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        v-if="type == 'currency'"
        outlined
        class="q-mb-md text-body-medium"
        @update:modelValue="handleCurrencyInput"
        @blur="handleCurrencyBlur"
        @focus="handleCurrencyFocus"
        hide-bottom-space
        v-model="displayValue"
        dense
      />

      <!-- date -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        v-if="type == 'date'"
        outlined
        class="text-body-medium"
        @update:modelValue="
          (newValue) => {
            $emit('update:modelValue', newValue);
            date = newValue;
          }
        "
        mask="date"
        :rounded="rounded"
        hide-hint
        dense
        v-model="date"
      >
        <template v-slot:append>
          <q-icon v-if="!isDisabled" name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date color="accent" v-model="date"></q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <!-- date-time -->
      <q-input
        :readonly="isDisabled"
        :required="required"
        v-if="type == 'date-time'"
        outlined
        class="text-body-medium"
        @update:modelValue="
          (newValue) => {
            $emit('update:modelValue', newValue);
            date = newValue;
          }
        "
        mask="date"
        hide-hint
        dense
        v-model="date"
      >
        <template v-slot:prepend>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="date" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat class="text-label-large"/>
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
        <template v-slot:append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time v-model="date" mask="YYYY-MM-DD HH:mm">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat class="text-label-large"/>
                </div>
              </q-time>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <!-- select -->
      <g-select
        :storeCache="storeCache"
        :readonly="isDisabled"
        :borderless="borderless"
        :nullOption="nullOption"
        :modelValue="modelValue"
        ref="gSelect"
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        v-if="type == 'select'"
        class="text-body-medium"
        :apiUrl="apiUrl"
        :options="options"
        :data-testid="$attrs['data-testid']"
      />

      <!-- select-search -->
      <g-select
        :storeCache="storeCache"
        :readonly="isDisabled"
        :borderless="borderless"
        :nullOption="nullOption"
        :modelValue="modelValue"
        ref="gSelect"
        use-input
        @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
        v-if="type == 'select-search'"
        class="text-body-medium"
        :apiUrl="apiUrl"
        :options="options"
        :data-testid="$attrs['data-testid']"
      />

      <!-- select-search-with-add -->
      <div v-if="type == 'select-search-with-add'" class="select-search-with-add">
        <g-select
          :storeCache="storeCache"
          :readonly="isDisabled"
          :borderless="borderless"
          :nullOption="nullOption"
          :modelValue="modelValue"
          ref="gSelect"
          class="search text-body-medium"
          use-input
          @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
          :apiUrl="apiUrl"
          :options="options"
        />
        <q-btn @click="$emit('showAddDialog', newValue)" class="button" color="dark" outline style="border-width: 0.5px !important; "> <q-icon size="16px" name="add"></q-icon></q-btn>
      </div>
    </div>
  </div>
</template>
<style scoped src="./GInput.scss"></style>
<script>
import { date } from 'quasar';
import GSelect from './GSelect.vue';
import { api } from 'src/boot/axios';

export default {
  name: 'GInput',
  components: {
    GSelect,
  },
  props: {
    accept: {
      type: String,
      default: 'image/*',
    },
    borderless: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: [String, Number, Object, FileList, null],
      default: '',
    },
    label: String,
    type: {
      type: String,
      default: 'text',
    },
    min: {
      type: [String, Number],
      default: undefined,
    },
    placeholder: {
      type: String,
      default: '',
    },
    apiUrl: {
      type: String,
      default: '',
    },
    options: {
      type: Array,
      default: () => [],
    },
    required: {
      type: Boolean,
      default: false,
    },
    rounded: {
      type: Boolean,
      default: false,
    },
    checkboxLabel: {
      type: String,
      default: 'text',
    },
    enabledCheckbox: {
      type: Boolean,
      default: false,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    tooltipLabel: {
      type: String,
      default: '',
    },
    nullOption: {
      type: String,
      default: null,
    },
    storeCache: {
      type: Boolean,
      default: false,
    },
    prefix: {
      type: String,
      default: '',
    },
    suffix: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      date: null,
      fileInformation: '',
      textProp: this.modelValue,
      displayValue: '',
      emitKey: null,
      isCheckboxTicked: this.enabledCheckbox,
      isPasswordVisible: false,
      isChooseItemDialogShown: false,
      chooseItemLabel: 'No Item Selected',
      fonts: {
        arial: 'Arial',
        arial_black: 'Arial Black',
        comic_sans: 'Comic Sans MS',
        courier_new: 'Courier New',
        impact: 'Impact',
        lucida_grande: 'Lucida Grande',
        times_new_roman: 'Times New Roman',
        verdana: 'Verdana',
      },
      toolbar: [
        ['left', 'center', 'right', 'justify'],
        ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
        ['unordered', 'ordered'],
        [
          {
            label: this.$q.lang.editor.formatting,
            icon: this.$q.iconSet.editor.formatting,
            list: 'no-icons',
            options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7'],
          },
        ],
        [
          {
            label: this.$q.lang.editor.formatting,
            icon: this.$q.iconSet.editor.formatting,
            list: 'no-icons',
            options: ['default_font', 'arial', 'arial_black', 'comic_sans', 'courier_new', 'impact', 'lucida_grande', 'times_new_roman', 'verdana'],
          },
        ],
        ['undo', 'redo'],
      ],
    };
  },
  methods: {
    triggerUpload() {
      this.$refs.fileUpload.click();
    },
    removeFile() {
      this.textProp = null;
      this.$emit('update:modelValue', null);
      // Reset the file input
      if (this.$refs.fileUpload) {
        this.$refs.fileUpload.value = '';
      }
    },
    fileUploadTrigger(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('fileData', file);
        this.$q.loading.show();

        let url = '/file-upload/upload-document';
        const params = new URLSearchParams();

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        api
          .post(url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then((data) => {
            this.textProp = data.data;
            this.$emit('update:modelValue', data.data);
          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => {
            this.$q.loading.hide();
          });
      }
    },
    showItemInformationDialog() {
      this.$bus.emit('showItemInformationDialog', this.textProp.id);
    },
    removeItem() {
      this.textProp = 0;
    },

    showChooseItemDialog() {
      this.emitKey = Math.random().toString(36).substring(7);
      this.$bus.emit('showChooseItemDialog', this.emitKey);
      this.isChooseItemDialogShown = true;
    },
    getSelectData() {
      return this.$refs.gSelect.getSelectData();
    },
    getSelectOptions() {
      return this.$refs.gSelect.options;
    },
    async setAutoSelect(autoSelect) {
      await this.$refs.gSelect.setAutoSelect(autoSelect);
    },
    async reloadGSelect(autoSelect = null) {
      await this.$refs.gSelect.fetchOptions(autoSelect);
    },

    async refreshSelectOptions(autoSelectValue = null) {
      if (['select', 'select-search', 'select-search-with-add'].includes(this.type)) {
        await this.$refs.gSelect.refreshOptions(autoSelectValue);
      }
    },

    watchChooseItem() {
      this.$bus.on('chooseItem', (itemData) => {
        if (this.emitKey == itemData.emitKey) {
          console.log('itemData  ', itemData);
          this.$emit('update:modelValue', itemData);
        }
      });
    },

    // Currency formatting methods
    formatCurrencyValue(value) {
      if (value === null || value === undefined || value === '') {
        return '';
      }

      // Convert to number
      const numValue = typeof value === 'string' ? parseFloat(value) : value;

      if (isNaN(numValue)) {
        return '';
      }

      // Format with thousand separators, no forced decimals
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    },

    parseCurrencyValue(value) {
      if (!value) return 0;

      // Remove all non-numeric characters except decimal point and minus sign
      const cleaned = String(value).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);

      return isNaN(parsed) ? 0 : parsed;
    },

    handleCurrencyInput(newValue) {
      // Allow numbers and common symbols (users can type them but they won't be preserved)
      // Filter out letters but allow numbers, commas, periods, and common currency symbols
      const filtered = String(newValue).replace(/[a-zA-Z]/g, '');
      this.displayValue = filtered;
    },

    handleCurrencyBlur() {
      // Parse and format the value on blur
      const numericValue = this.parseCurrencyValue(this.displayValue);

      // Format the value (thousand separators only, no prefix/suffix)
      this.displayValue = this.formatCurrencyValue(numericValue);

      // Emit the numeric value
      this.$emit('update:modelValue', numericValue);
    },

    handleCurrencyFocus() {
      // When focused, show the raw numeric value for easier editing
      if (this.displayValue) {
        const numericValue = this.parseCurrencyValue(this.displayValue);
        if (numericValue !== 0) {
          this.displayValue = String(numericValue);
        }
      }
    },

    initializeCurrencyDisplay() {
      if (this.type === 'currency' && this.modelValue !== null && this.modelValue !== undefined) {
        this.displayValue = this.formatCurrencyValue(this.modelValue);
      }
    },
  },
  async mounted() {
    if (this.modelValue) {
      if (this.type == 'date') {
        this.date = this.modelValue;
      }

      if (this.type == 'choose_item' && this.modelValue) {
        this.$q.loading.show();
        api.get(`/items/${this.modelValue}`).then((response) => {
          this.textProp = response.data.data;
          this.$q.loading.hide();
        });
      }

      if (['select', 'select-search', 'select-search-with-add'].includes(this.type)) {
        await this.$refs.gSelect.setAutoSelect(this.modelValue);
      }
    }

    // Initialize currency display
    this.initializeCurrencyDisplay();

    this.watchChooseItem();
  },
  watch: {
    date(newValue) {
      if (this.type == 'date') {
        this.$emit('update:modelValue', date.formatDate(newValue, 'YYYY-MM-DD'));
      }
    },
    modelValue(newValue) {
      this.textProp = newValue;
      // Also update date property for date inputs
      if (this.type === 'date' && newValue) {
        this.date = newValue;
      }
      // Update display value for currency inputs
      if (this.type === 'currency') {
        this.displayValue = this.formatCurrencyValue(newValue);
      }
    },
    textProp(newValue) {
      this.$emit('update:modelValue', newValue);
    },
  },
};
</script>
