## GSelect Component

## Purpose

A reusable dropdown select component that integrates with backend API endpoints to dynamically fetch and display select options. It extends Quasar's q-select component with additional functionality for API integration, filtering, and default option handling.

## Usage Instructions

```plaintext
<template>
  <div class="g-field">
    <div class="label">Field Label</div>
    <gselect v-model="formData.fieldName" api-url="/select-options/endpoint" :null-option="'Select an option'" @update:modelvalue="(val) => handleValueChange(val)">
  </gselect></div>
</template>

<script>
import GSelect from 'components/form/GSelect.vue';

export default {
  components: {
    GSelect
  },
  data() {
    return {
      formData: {
        fieldName: null
      }
    };
  },
  methods: {
    handleValueChange(val) {
      // Handle the value change if needed
      console.log('Selected value:', val);
    }
  }
};
</script>
```

## Props

| Prop         | Type    | Default | Description                                                          |
| ------------ | ------- | ------- | -------------------------------------------------------------------- |
| `apiUrl`     | String  | ''      | The backend API endpoint to fetch select options                     |
| `nullOption` | String  | null    | Text to display for the null/empty option (e.g., "Select an option") |
| `borderless` | Boolean | false   | Whether to display the select without borders                        |

## Events

| Event                   | Parameters     | Description                                             |
| ----------------------- | -------------- | ------------------------------------------------------- |
| `update:modelValue`     | selected value | Emitted when a selection is made                        |
| `first-option-selected` | option object  | Emitted when the first option is automatically selected |
| `error`                 | error object   | Emitted when an error occurs during options fetching    |

## Backend Connection

This component is designed to work with the SelectOptionsModule in the backend, which provides standardized endpoints for dropdown options. See `/backend/templates/modules/SelectOptionsModule.md` for details on the backend implementation.

## Dependencies

- Quasar Framework (q-select component)
- Axios for API requests

## Examples

### Basic Usage with Business Types

```plaintext
<gselect v-model="formData.businessType" api-url="/select-options/business-types" :null-option="'Select Business Type'">
```

### Industry Selection with Custom Handler

```plaintext
<gselect v-model="formData.industry" api-url="/select-options/industries" :null-option="'Select Industry'" @update:modelvalue="(val) => handleIndustryChange(val)">
```

## Contact

For questions or improvements, contact the frontend development team.
