# GlobalInputTemplate Component Documentation

## Overview

A unified, reusable input component that supports multiple input types with consistent styling based on Material Design principles. This component matches the Figma design system and provides a cohesive user experience across all form inputs.

## Installation & Import

```vue
import GlobalInputTemplate from 'src/components/shared/form/GlobalInput/GlobalInputTemplate.vue'
```

## Features

- 🎨 **Material Design** floating labels
- 🔧 **11 input types** supported
- 📱 **Responsive** design
- ♿ **Accessible** with ARIA support
- 🎯 **TypeScript** support
- 🌙 **Dark mode** ready
- ✅ **Validation** states
- 🎭 **Custom icons** support

## Supported Input Types

| Type | Description | Special Features |
|------|-------------|------------------|
| `text` | Standard text input | Basic text validation |
| `email` | Email address input | Email format validation |
| `password` | Password input | Visibility toggle |
| `date` | Date picker | Calendar icon |
| `time` | Time picker | Clock icon |
| `number` | Numeric input | Min/max validation, stepper icon |
| `textarea` | Multi-line text | Resizable, custom rows |
| `select` | Dropdown selection | Custom arrow icon |
| `file` | File upload | File name display, upload icon |
| `phone` | Phone number | Country code prefix |
| `text-with-add` | Text with add button | Add button for dynamic lists |

## Basic Usage Examples

### Text Input
```vue
<template>
  <GlobalInputTemplate
    v-model="textValue"
    type="text"
    label="Full Name"
    placeholder="Enter your full name"
    required
  />
</template>

<script setup>
import { ref } from 'vue'
import GlobalInputTemplate from 'src/components/shared/form/GlobalInput/GlobalInputTemplate.vue'

const textValue = ref('')
</script>
```

### Email Input
```vue
<GlobalInputTemplate
  v-model="emailValue"
  type="email"
  label="Email Address"
  placeholder="user@example.com"
  :error="emailError"
  error-message="Please enter a valid email address"
  required
/>
```

### Password Input
```vue
<GlobalInputTemplate
  v-model="passwordValue"
  type="password"
  label="Password"
  placeholder="Enter your password"
  required
/>
```

### Date Input
```vue
<GlobalInputTemplate
  v-model="dateValue"
  type="date"
  label="Birth Date"
  placeholder="mm/dd/yyyy"
/>
```

### Time Input
```vue
<GlobalInputTemplate
  v-model="timeValue"
  type="time"
  label="Appointment Time"
  placeholder="00:00 AM"
/>
```

### Number Input
```vue
<GlobalInputTemplate
  v-model="numberValue"
  type="number"
  label="Quantity"
  placeholder="Enter quantity"
  :min="1"
  :max="100"
/>
```

### Textarea
```vue
<GlobalInputTemplate
  v-model="textareaValue"
  type="textarea"
  label="Description"
  placeholder="Enter description..."
  :rows="5"
/>
```

### Select/Dropdown
```vue
<GlobalInputTemplate
  v-model="selectedValue"
  type="select"
  label="Country"
  placeholder="Choose a country"
  :options="[
    { label: 'Philippines', value: 'PH' },
    { label: 'United States', value: 'US' },
    { label: 'Canada', value: 'CA' }
  ]"
/>
```

Alternative options format:
```vue
<GlobalInputTemplate
  v-model="selectedValue"
  type="select"
  label="Status"
  :options="['Active', 'Inactive', 'Pending']"
/>
```

### File Upload
```vue
<GlobalInputTemplate
  v-model="fileValue"
  type="file"
  label="Upload Document"
  placeholder="Select a file"
  accept=".pdf,.doc,.docx,.jpg,.png"
  @file-selected="handleFileSelected"
/>

<script setup>
const handleFileSelected = (file) => {
  console.log('Selected file:', file.name)
}
</script>
```

### Phone Number
```vue
<GlobalInputTemplate
  v-model="phoneValue"
  type="phone"
  label="Phone Number"
  placeholder="917 123 4567"
  country-code="+63"
/>
```

### Input with Add Button
```vue
<GlobalInputTemplate
  v-model="itemValue"
  type="text-with-add"
  label="Add Item"
  placeholder="Enter item name"
  @add="handleAddItem"
/>

<script setup>
const handleAddItem = (value) => {
  if (value.trim()) {
    items.value.push(value)
    itemValue.value = '' // Clear input
  }
}
</script>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | Input type: `'text'` \| `'email'` \| `'password'` \| `'date'` \| `'time'` \| `'number'` \| `'textarea'` \| `'select'` \| `'file'` \| `'phone'` \| `'text-with-add'` |
| `modelValue` | `string \| number \| File \| null` | `''` | v-model binding value |
| `label` | `string` | `''` | Floating label text |
| `placeholder` | `string` | `''` | Placeholder text (shown when no label or not focused) |
| `required` | `boolean` | `false` | Makes field required |
| `disabled` | `boolean` | `false` | Disables the input |
| `readonly` | `boolean` | `false` | Makes input readonly |
| `error` | `boolean` | `false` | Shows error state (red border) |
| `errorMessage` | `string` | `''` | Error message to display below input |
| `icon` | `string` | `''` | Custom icon to display |
| `iconPosition` | `'left' \| 'right'` | `'right'` | Icon position |
| `countryCode` | `string` | `'+63'` | Country code for phone input |
| `accept` | `string` | `'*'` | File types for file input (e.g., `.pdf,.jpg,.png`) |
| `options` | `Array<{label: string, value: string \| number} \| string>` | `[]` | Options for select input |
| `min` | `number` | `undefined` | Minimum value for number input |
| `max` | `number` | `undefined` | Maximum value for number input |
| `rows` | `number` | `3` | Number of rows for textarea |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| number \| File \| null` | Emitted when value changes (v-model) |
| `focus` | `FocusEvent` | Emitted when input receives focus |
| `blur` | `FocusEvent` | Emitted when input loses focus |
| `add` | `string \| number` | Emitted when add button is clicked (text-with-add type) |
| `file-selected` | `File` | Emitted when file is selected (file type) |

## Advanced Usage

### Form with Validation
```vue
<template>
  <form @submit.prevent="handleSubmit" class="form-container">
    <GlobalInputTemplate
      v-model="form.email"
      type="email"
      label="Email Address"
      :error="errors.email"
      error-message="Please enter a valid email address"
      required
      @blur="validateEmail"
    />
    
    <GlobalInputTemplate
      v-model="form.password"
      type="password"
      label="Password"
      :error="errors.password"
      error-message="Password must be at least 8 characters"
      required
      @blur="validatePassword"
    />
    
    <GlobalInputTemplate
      v-model="form.confirmPassword"
      type="password"
      label="Confirm Password"
      :error="errors.confirmPassword"
      error-message="Passwords do not match"
      required
      @blur="validateConfirmPassword"
    />
    
    <GlobalInputTemplate
      v-model="form.birthDate"
      type="date"
      label="Date of Birth"
      :error="errors.birthDate"
      error-message="Please select a valid date"
      required
    />
    
    <GlobalInputTemplate
      v-model="form.phone"
      type="phone"
      label="Phone Number"
      country-code="+63"
      :error="errors.phone"
      error-message="Please enter a valid phone number"
    />
    
    <GlobalInputTemplate
      v-model="form.bio"
      type="textarea"
      label="Biography"
      placeholder="Tell us about yourself..."
      :rows="4"
    />
    
    <button type="submit" :disabled="!isFormValid">Submit</button>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import GlobalInputTemplate from 'src/components/shared/form/GlobalInput/GlobalInputTemplate.vue'

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  phone: '',
  bio: ''
})

const errors = ref({
  email: false,
  password: false,
  confirmPassword: false,
  birthDate: false,
  phone: false
})

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  errors.value.email = !emailRegex.test(form.value.email)
}

const validatePassword = () => {
  errors.value.password = form.value.password.length < 8
}

const validateConfirmPassword = () => {
  errors.value.confirmPassword = form.value.password !== form.value.confirmPassword
}

const isFormValid = computed(() => {
  return form.value.email && 
         form.value.password && 
         form.value.confirmPassword &&
         !Object.values(errors.value).some(error => error)
})

const handleSubmit = () => {
  // Validate all fields
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  
  if (isFormValid.value) {
    console.log('Form submitted:', form.value)
  }
}
</script>

<style scoped>
.form-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #2F40C4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
```

### Dynamic List with Text-Add Input
```vue
<template>
  <div>
    <GlobalInputTemplate
      v-model="newItem"
      type="text-with-add"
      label="Add Skills"
      placeholder="Enter a skill"
      @add="addSkill"
      @keyup.enter="addSkill"
    />
    
    <div class="tags-container">
      <span 
        v-for="(skill, index) in skills" 
        :key="index"
        class="tag"
      >
        {{ skill }}
        <button @click="removeSkill(index)" class="tag-remove">×</button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const newItem = ref('')
const skills = ref(['JavaScript', 'Vue.js', 'CSS'])

const addSkill = () => {
  if (newItem.value.trim() && !skills.value.includes(newItem.value.trim())) {
    skills.value.push(newItem.value.trim())
    newItem.value = ''
  }
}

const removeSkill = (index) => {
  skills.value.splice(index, 1)
}
</script>

<style scoped>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: #e3f2fd;
  border-radius: 4px;
  font-size: 14px;
}

.tag-remove {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}
</style>
```

## Styling Customization

The component uses CSS custom properties that can be overridden:

```css
.global-input-template {
  --input-primary-color: #2F40C4;
  --input-border-default: #DDE1F0;
  --input-text-color: #333333;
  --input-label-color: #747786;
  --input-placeholder-color: #97999F;
  --input-error-color: #f44336;
  --input-disabled-bg: #F5F5F5;
  --input-disabled-border: #E0E0E0;
  --input-border-radius: 8px;
  --input-height: 45px;
  --input-padding: 16px;
  --input-font-size: 14px;
  --label-font-size: 12px;
  --transition-duration: 0.2s;
}
```

### Custom Theme Example
```css
/* Custom theme */
.my-form .global-input-template {
  --input-primary-color: #4CAF50;
  --input-border-radius: 12px;
  --input-height: 50px;
}
```

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Clear focus indicators
- **Error Announcements**: Error messages are announced to screen readers
- **Required Field Indicators**: Proper ARIA attributes for required fields
- **High Contrast**: Works with high contrast mode
- **Touch Friendly**: Appropriate touch targets on mobile

## Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile Safari**: iOS 14+
- **Chrome Mobile**: Android 90+

## Performance Notes

- **Lightweight**: Minimal JavaScript footprint
- **CSS-only Animations**: Smooth transitions without JavaScript
- **Lazy Loading**: Icons and features loaded only when needed
- **Mobile Optimized**: Prevents zoom on iOS devices

## Migration from Existing Components

### From GInput.vue
```vue
<!-- Old GInput -->
<g-input
  v-model="value"
  type="text"
  :label="label"
  :placeholder="placeholder"
/>

<!-- New GlobalInputTemplate -->
<GlobalInputTemplate
  v-model="value"
  type="text"
  :label="label"
  :placeholder="placeholder"
/>
```

### From Quasar q-input
```vue
<!-- Old q-input -->
<q-input
  v-model="value"
  :label="label"
  outlined
  dense
/>

<!-- New GlobalInputTemplate -->
<GlobalInputTemplate
  v-model="value"
  type="text"
  :label="label"
/>
```

## Troubleshooting

### Common Issues

1. **Label not floating**: Ensure you have both `label` and `v-model` props set
2. **Styling not applied**: Check that the SCSS file is properly imported
3. **File upload not working**: Verify `accept` prop format (e.g., `.pdf,.jpg`)
4. **Phone input not displaying country code**: Check `countryCode` prop format (include `+`)

### Debug Mode

Add `debug` class to see internal structure:
```vue
<GlobalInputTemplate class="debug" ... />
```

## Contributing

When contributing to this component:

1. **Maintain Design Consistency**: Follow Figma design specifications
2. **Test All Input Types**: Ensure changes work across all supported types
3. **Check Accessibility**: Verify screen reader compatibility
4. **Mobile Testing**: Test on various mobile devices
5. **Browser Testing**: Verify cross-browser compatibility

## Changelog

### v1.0.0 (Current)
- Initial implementation with 11 input types
- Material Design floating labels
- Full accessibility support
- Responsive design
- TypeScript support
- Dark mode compatibility