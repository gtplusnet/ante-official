<template>
  <div class="developer-promotion-container">
    <div class="developer-promotion-card">
      <q-card-section>
        <div class="developer-promotion-title text-title-large">Developer Account Promotion</div>
      </q-card-section>

      <q-card-section>
        <div class="developer-promotion-desc text-body-medium">
          To promote your account to a developer account, you'll need to verify your identity using a one-time password (OTP) that will be sent to our Telegram channel.
        </div>

        <q-form @submit="onSubmit" class="developer-promotion-form">
          <div v-if="!otpRequested">
            <q-btn
              color="primary"
              label="Request OTP"
              @click="requestOTP"
              :loading="loading"
              class="developer-promotion-btn text-label-large"
            />
          </div>

          <div v-else>
            <q-input
              v-model="otp"
              label="Enter OTP"
              :rules="[val => !!val || 'OTP is required']"
              outlined
              dense
              :loading="loading"
              class="developer-promotion-input text-body-medium"
            />

            <div class="row q-mt-md">
              <q-btn
                color="primary"
                label="Verify OTP"
                type="submit"
                :loading="loading"
                class="developer-promotion-btn text-label-large"
              />
              <q-btn
                flat
                label="Request New OTP"
                @click="requestOTP"
                :loading="loading"
                class="developer-promotion-btn q-ml-sm text-label-large"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from "../../../utility/api.handler";
import './DeveloperPromotion.scss';

const $q = useQuasar();
const loading = ref(false);
const otpRequested = ref(false);
const otp = ref('');

const requestOTP = async () => {
  try {
    loading.value = true;
    await APIRequests.requestDeveloperPromotionOTP($q);
    otpRequested.value = true;
    $q.notify({
      color: 'positive',
      message: 'OTP has been sent to our Telegram channel',
      icon: 'check_circle',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Failed to request OTP',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  try {
    loading.value = true;
    await APIRequests.verifyDeveloperPromotionOTP($q, otp.value);
    $q.notify({
      color: 'positive',
      message: 'Account successfully promoted to developer',
      icon: 'check_circle',
    });
    // Redirect to settings page or refresh user data
    window.location.reload();
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: 'Invalid or expired OTP',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};
</script>
