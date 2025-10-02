<template>
  <form @submit.prevent="eventCreateAccountSubmit" class="q-mt-md">
    <div class="two-column">
      <!-- Company Name -->
      <div class="fieldset">
        <div class="label text-label-medium">Company Name</div>
        <div class="field">
          <input type="text" v-model="form.companyInformation.companyName" @input="generateCompanyCode" class="text-body-medium signup-input" />
        </div>
      </div>

      <!-- Domain Prefix -->
      <div class="fieldset">
        <div class="label text-label-medium">Company Code</div>
        <div class="field">
          <input type="text" v-model="form.companyInformation.domainPrefix" @input="validateCompanyCode"
            :class="{ 'error': companyCodeError }" class="text-body-medium signup-input" />
          <div v-if="companyCodeError" class="error-message text-label-small">{{ companyCodeError }}</div>
        </div>
      </div>

      <!-- Business Type -->
      <div class="fieldset">
        <div class="label text-label-medium">Business Type</div>
        <div class="field">
          <q-select v-model="form.companyInformation.businessType" :options="businessTypeOptions" emit-value map-options
            outlined dense placeholder="Select Business Type" class="text-body-medium" />
        </div>
      </div>

      <!-- Industry -->
      <div class="fieldset">
        <div class="label text-label-medium">Industry</div>
        <div class="field">
          <q-select v-model="form.companyInformation.industry" :options="industryOptions" emit-value map-options
            outlined dense placeholder="Select Industry" class="text-body-medium" />
        </div>
      </div>

      <!-- First Name -->
      <div class="fieldset">
        <div class="label text-label-medium">First Name</div>
        <div class="field">
          <input type="text" v-model="form.accountInformation.firstName" class="text-body-medium signup-input" />
        </div>
      </div>

      <!-- Last Name -->
      <div class="fieldset">
        <div class="label text-label-medium">Last Name</div>
        <div class="field">
          <input type="text" v-model="form.accountInformation.lastName" class="text-body-medium signup-input" />
        </div>
      </div>

      <!-- Contact Number -->
      <div class="fieldset">
        <div class="label text-label-medium">Contact Number</div>
        <div class="field contact-number-field">
          <span class="country-code-prefix">+63</span>
          <input type="text" v-model="phoneNumber" @input="validatePhoneNumber" placeholder="9123456789" class="text-body-medium phone-input signup-input" />
        </div>
      </div>

      <!-- Email -->
      <div class="fieldset">
        <div class="label text-label-medium">Email</div>
        <div class="field">
          <input type="text" v-model="form.accountInformation.email" class="text-body-medium signup-input" />
        </div>
      </div>

      <!-- Username -->
      <div class="fieldset">
        <div class="label text-label-medium">Username</div>
        <div class="field">
          <input type="text" v-model="form.accountInformation.username" @input="validateUsername"
            :class="{ 'error': usernameError }" class="text-body-medium signup-input" />
          <div v-if="usernameError" class="error-message text-label-small">{{ usernameError }}</div>
        </div>
      </div>

      <!-- Password -->
      <div class="fieldset">
        <div class="label text-label-medium">Password</div>
        <div class="field">
          <input type="password" v-model="form.accountInformation.password" class="text-body-medium signup-input" />
        </div>
      </div>
    </div>

    <div class="action-btn">
      <GButton type="submit" class="full-width q-mt-lg text-label-large" variant="filled" label="Sign Up" color="primary" block />
      <GButton @click="goToLoginPage" class="full-width q-mt-sm text-label-large" variant="text" label="Back" />
    </div>
  </form>
</template>

<style lang="scss" scoped src="./SignUp.scss"></style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { SignUpRequest } from "@shared/request";
import { useRouter } from 'vue-router';
import { APIRequests } from "../../../utility/api.handler";
import { AuthSuccess } from "../../../utility/auth.success";
import GButton from 'src/components/shared/buttons/GButton.vue';

const $q = useQuasar();
const router = useRouter();

const form = ref<SignUpRequest>({
  companyInformation: {
    companyName: '',
    domainPrefix: '',
    businessType: 'OTHERS',
    industry: 'OTHERS',
    registrationNo: '',
    phone: '',
    tinNo: '',
  },
  accountInformation: {
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    username: '',
    password: '',
  },
  sourceUrl: '',
});

const fillMockData = () => {
  const mockNumber = Math.floor(Math.random() * 1000);
  form.value = {
    companyInformation: {
      companyName: `Test Company ${mockNumber}`,
      domainPrefix: `testcompany${mockNumber}`,
      businessType: 'CORPORATION',
      industry: 'SERVICES',
      registrationNo: '',
      phone: '',
      tinNo: '',
    },
    accountInformation: {
      firstName: 'Test',
      lastName: `User${mockNumber}`,
      contactNumber: '+639171234567',
      email: `testuser${mockNumber}@example.com`,
      username: `testuser${mockNumber}`,
      password: 'TestPassword123!',
    },
    sourceUrl: window.location.href,
  };
  phoneNumber.value = '9171234567';
  validateCompanyCode();
  validateUsername();
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'F11') {
    event.preventDefault();
    fillMockData();
  }
};

onMounted(() => {
  // Capture the current URL when the component is mounted
  form.value = {
    ...form.value,
    sourceUrl: window.location.href,
  };

  // Add F11 key listener
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('keydown', handleKeyPress);
});

const companyCodeError = ref('');
const usernameError = ref('');

const phoneNumber = ref('');

const businessTypeOptions = [
  { label: 'Sole Proprietorship', value: 'SOLE_PROPRIETORSHIP' },
  { label: 'Partnership', value: 'PARTNERSHIP' },
  { label: 'Corporation', value: 'CORPORATION' },
  { label: 'Others', value: 'OTHERS' },
];

const industryOptions = [
  { label: 'Construction', value: 'CONSTRUCTION' },
  { label: 'Manufacturing', value: 'MANUFACTURING' },
  { label: 'Retail', value: 'RETAIL' },
  { label: 'Services', value: 'SERVICES' },
  { label: 'Others', value: 'OTHERS' },
];

const validateCompanyCode = () => {
  const value = form.value.companyInformation.domainPrefix;
  if (!value) {
    companyCodeError.value = 'Company code is required';
    return;
  }
  if (!/^[a-z0-9.]+$/.test(value)) {
    companyCodeError.value = 'Company code must contain only lowercase letters, numbers, and dots';
    return;
  }
  companyCodeError.value = '';
};

const validateUsername = () => {
  const value = form.value.accountInformation.username;
  if (!value) {
    usernameError.value = 'Username is required';
    return;
  }
  if (value.includes(' ')) {
    usernameError.value = 'Username must not contain spaces';
    return;
  }
  usernameError.value = '';
};

const validatePhoneNumber = () => {
  // Remove any non-digit characters
  phoneNumber.value = phoneNumber.value.replace(/\D/g, '');

  // Update the form's contactNumber with +63 prefix + phone number
  form.value.accountInformation.contactNumber = '+63' + phoneNumber.value;
};

const generateCompanyCode = () => {
  const companyName = form.value.companyInformation.companyName;
  if (!companyName) {
    form.value.companyInformation.domainPrefix = '';
    return;
  }

  // Generate company code from company name
  // Remove special characters, convert to lowercase, and replace spaces with dots
  let code = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .trim()
    .replace(/\s+/g, '.'); // Replace spaces with dots

  // If the code is empty after cleaning, use the first few letters
  if (!code) {
    code = companyName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) || 'company';
  }

  // Ensure the code doesn't start or end with a dot
  code = code.replace(/^\.+|\.+$/g, '');

  // Limit the length to a reasonable size
  if (code.length > 20) {
    code = code.substring(0, 20);
    // Ensure it doesn't end with a dot after truncation
    code = code.replace(/\.+$/, '');
  }

  form.value.companyInformation.domainPrefix = code;
  validateCompanyCode();
};

const eventCreateAccountSubmit = async () => {
  validateCompanyCode();
  validateUsername();

  if (companyCodeError.value || usernameError.value) {
    return;
  }

  $q.loading.show();

  APIRequests.signUp($q, form.value).then((response) => {
    $q.notify({
      color: 'positive',
      message: 'Account created successfully',
      icon: 'check_circle',
    });

    AuthSuccess(router, response);
  }).catch(() => {
    $q.loading.hide();
  }).finally(() => {
    $q.loading.hide();
  });
};

const goToLoginPage = () => {
  router.push('/login');
};
</script>

<style scoped>
.error {
  border-color: red !important;
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 4px;
}

.contact-number-field {
  display: flex;
  align-items: center;
  position: relative;
}

.country-code-prefix {
  position: absolute;
  left: 12px;
  color: #666;
  font-weight: 500;
  pointer-events: none;
  z-index: 1;
}

.signup-input {
  width: 100%;
  border-radius: 8px;
  padding: 8px 10px;
  border: solid 1px #ccc;

  &:focus {
    outline-color: var(--q-primary);
  }
}

:deep(.q-field__control) {
  border-radius: 8px !important;
  overflow: hidden;
}

.phone-input {
  padding-left: 45px !important;
  width: 100%;
}

</style>
