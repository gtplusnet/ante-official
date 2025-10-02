<template>
  <q-dialog ref="dialog" @before-show="fetchData">
    <q-card flat class="dialog-card">
      <!-- Fixed Header -->
      <q-card-section class="row items-center q-py-sm bg-white" style="position: sticky; top: 0; z-index: 10;">
        <div class="text-body1 text-weight-medium">New Liquidation Form</div>
        <q-space />
        <q-btn icon="close" flat round dense size="sm" v-close-popup />
      </q-card-section>
      
      <q-separator />

      <div style="overflow-y: auto; max-height: calc(100vh - 200px); display: flex; flex-direction: column;">
        <!-- Loading state -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="50px" />
          <div class="q-mt-md">Loading petty cash information...</div>
        </div>

        <!-- No petty cash holder state -->
        <div v-else-if="!currentHolder && fetchAttempted" class="text-center q-pa-xl">
          <q-avatar size="80px" color="grey-3" text-color="grey-7" icon="account_balance_wallet" />
          <div class="text-h6 q-mt-lg text-grey-8">No Active Petty Cash Assignment</div>
          <div class="q-mt-md text-body1 text-grey-7">
            You need to be assigned as a petty cash holder before you can submit liquidation requests.
          </div>
          <div class="q-mt-sm text-body2 text-grey-6">
            Please contact your administrator or finance department.
          </div>
          <q-btn
            flat
            no-caps
            class="q-mt-xl"
            label="Close"
            color="grey-8"
            padding="sm lg"
            v-close-popup
          />
        </div>

        <!-- Form with petty cash holder -->
        <div v-else-if="currentHolder" class="full-height" style="display: flex; flex-direction: column;">
          <!-- Fixed Petty Cash Balance Display -->
          <div style="position: sticky; top: 0; z-index: 5; background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div class="row items-center justify-between q-px-md q-py-sm">
              <div class="row items-center">
                <q-avatar size="32px" color="white" text-color="primary" flat>
                  <q-icon name="account_balance_wallet" size="20px" />
                </q-avatar>
                <div class="q-ml-sm">
                  <div class="text-caption" style="opacity: 0.85; font-size: 11px;">
                    Available Balance
                    <q-tooltip v-if="currentHolder.pendingLiquidation > 0">
                      ₱{{ formatNumber(currentHolder.pendingLiquidation) }} pending liquidation
                    </q-tooltip>
                  </div>
                  <div class="text-body1 text-weight-bold" style="line-height: 1.2;">
                    ₱{{ formatNumber(remainingBalance) }}
                  </div>
                  <div class="text-caption" style="opacity: 0.7; font-size: 10px;">
                    Total: ₱{{ formatNumber(currentHolder.actualBalance || currentHolder.currentBalance) }}
                    <span v-if="currentHolder.pendingLiquidation > 0">
                      | Pending: ₱{{ formatNumber(currentHolder.pendingLiquidation) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right">
                <q-chip 
                  dense 
                  color="white" 
                  text-color="primary" 
                  size="sm"
                  class="q-ma-none"
                  style="font-size: 11px;"
                >
                  <q-avatar size="16px" color="primary" text-color="white">
                    <span style="font-size: 10px;">{{ currentHolder.account.name.charAt(0) }}</span>
                  </q-avatar>
                  {{ currentHolder.account.name }}
                </q-chip>
              </div>
            </div>
          </div>

          <q-form @submit.prevent="submitRequest" ref="form" class="relative-position q-px-md q-pb-sm q-pt-sm" :style="{ opacity: extractingReceipt ? 0.5 : 1 }">
            <!-- Loading overlay for extraction -->
            <q-inner-loading :showing="extractingReceipt" class="z-max">
              <q-spinner-dots size="40px" color="primary" />
              <div class="q-mt-md text-body2 text-grey-7">Extracting receipt data...</div>
            </q-inner-loading>

            <!-- AI Extraction Status Card -->
            <div v-if="isAiExtracted" class="q-mb-md">
              <!-- Main AI Status Card with improved design -->
              <div class="ai-status-card" :class="getConfidenceCardClass(form.totalAIConfidence)">
                <!-- Header Section -->
                <div class="row items-center justify-between q-mb-sm">
                  <div class="row items-center">
                    <q-avatar size="32px" :color="getConfidenceColor(form.totalAIConfidence)" text-color="white">
                      <q-icon name="smart_toy" size="20px" />
                    </q-avatar>
                    <div class="q-ml-sm">
                      <div class="text-subtitle2 text-weight-medium">AI Data Extraction</div>
                      <div class="text-caption text-grey-7">Automatically filled from receipt</div>
                    </div>
                  </div>
                  <q-btn
                    flat
                    dense
                    no-caps
                    size="sm"
                    color="grey-8"
                    label="Edit Manually"
                    icon="edit"
                    @click="disableAiMode"
                  />
                </div>
                
                <!-- Confidence Score Section -->
                <div class="confidence-section">
                  <!-- Circular Progress Indicator -->
                  <div class="row items-center q-gutter-md">
                    <div class="relative-position">
                      <q-circular-progress
                        :value="form.totalAIConfidence"
                        size="80px"
                        :thickness="0.15"
                        :color="getConfidenceColor(form.totalAIConfidence)"
                        track-color="grey-3"
                        class="confidence-gauge"
                      >
                        <div class="text-center">
                          <div class="text-h6 text-weight-bold">{{ form.totalAIConfidence }}%</div>
                          <div class="text-caption text-grey-7">Confidence</div>
                        </div>
                      </q-circular-progress>
                    </div>
                    
                    <!-- Confidence Details -->
                    <div class="col">
                      <div class="text-subtitle2 text-weight-medium q-mb-xs">
                        {{ getConfidenceTitle(form.totalAIConfidence) }}
                      </div>
                      <div class="text-body2 text-grey-7 q-mb-sm">
                        {{ getConfidenceDescription(form.totalAIConfidence) }}
                      </div>
                      
                      <!-- Linear Progress Bar -->
                      <q-linear-progress
                        :value="form.totalAIConfidence / 100"
                        size="8px"
                        :color="getConfidenceColor(form.totalAIConfidence)"
                        track-color="grey-3"
                        rounded
                        class="q-mb-xs"
                      />
                      
                      <!-- Confidence Breakdown Link -->
                      <div class="text-caption text-grey-7">
                        <q-icon name="info" size="xs" class="q-mr-xs" />
                        Individual field confidence scores shown below
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Alert/Warning for Low Confidence -->
                <q-banner 
                  v-if="form.totalAIConfidence < 50" 
                  class="q-mt-md q-pa-sm"
                  dense
                  rounded
                  :class="form.totalAIConfidence < 30 ? 'bg-red-1' : 'bg-orange-1'"
                >
                  <template v-slot:avatar>
                    <q-icon 
                      :name="form.totalAIConfidence < 30 ? 'error' : 'warning'" 
                      :color="form.totalAIConfidence < 30 ? 'red' : 'orange'" 
                    />
                  </template>
                  <div class="text-caption">
                    {{ form.totalAIConfidence < 30 
                      ? 'Low extraction confidence. Please carefully review all fields before submitting.'
                      : 'Medium extraction confidence. Some fields may need verification.' 
                    }}
                  </div>
                </q-banner>
              </div>
            </div>

            <!-- Receipt Upload Section -->
            <div class="text-overline text-grey-7 q-mb-xs">RECEIPT UPLOAD</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-12">
                <g-input-media
                  label="Receipt Image"
                  v-model="form.attachmentProof"
                  :rules="[val => !!val || 'Receipt image is required']"
                  @update:model-value="onFileSelected"
                  :key="fileInputKey"
                  :module="ModuleType.TREASURY"
                  folder-name="Liquidations"
                  hint="Upload a clear image of your receipt for automatic data extraction"
                  accept="image/*"
                ></g-input-media>
              </div>
            </div>

            <!-- Receipt Information Section -->
            <div class="text-overline text-grey-7 q-mb-xs q-mt-md">RECEIPT INFORMATION</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div>
                  <!-- Label with inline confidence badge -->
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Receipt Number</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.receiptNumberConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.receiptNumberConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.receiptNumberConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.receiptNumber"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.receiptNumberConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.receiptNumberConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Receipt Date</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.receiptDateConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.receiptDateConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.receiptDateConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.receiptDate"
                    type="date"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.receiptDateConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.receiptDateConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Amount *</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.amountConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.amountConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.amountConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.amount"
                    type="number"
                    prefix="₱"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.amountConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.amountConfidence)"
                    :rules="[
                      val => !!val || 'Amount is required',
                      val => val > 0 || 'Amount must be greater than 0',
                      val => !currentHolder || val <= remainingBalance || `Amount cannot exceed your available balance of ₱${formatNumber(remainingBalance)}`
                    ]"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Expense Category</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.expenseCategoryConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.expenseCategoryConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.expenseCategoryConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-select
                    v-model="form.expenseCategory"
                    :options="expenseCategories"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.expenseCategoryConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.expenseCategoryConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
            </div>

            <!-- Tax Information Section -->
            <div class="text-overline text-grey-7 q-mb-xs q-mt-md">TAX INFORMATION</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">VAT Amount</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.vatAmountConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.vatAmountConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.vatAmountConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.vatAmount"
                    type="number"
                    prefix="₱"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.vatAmountConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.vatAmountConfidence)"
                    :rules="[
                      val => val >= 0 || 'VAT amount cannot be negative',
                      val => !form.amount || val <= form.amount * 0.13 || 'VAT amount seems too high (>13% of total)'
                    ]"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Withholding Tax</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.withholdingTaxConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.withholdingTaxConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.withholdingTaxConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.withholdingTaxAmount"
                    type="number"
                    prefix="₱"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.withholdingTaxConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.withholdingTaxConfidence)"
                    :rules="[
                      val => val >= 0 || 'Withholding tax cannot be negative',
                      val => !form.amount || val <= form.amount * 0.15 || 'Withholding tax seems too high (>15% of total)'
                    ]"
                    hide-bottom-space
                  />
                </div>
              </div>
              <!-- Tax validation warning -->
              <div v-if="showTaxWarning" class="col-12">
                <q-banner class="bg-warning-1" dense>
                  <template v-slot:avatar>
                    <q-icon name="warning" color="warning" />
                  </template>
                  <div class="text-caption">
                    Combined tax amounts (₱{{ formatNumber(Number(form.vatAmount) + Number(form.withholdingTaxAmount)) }}) 
                    should not exceed the total amount (₱{{ formatNumber(form.amount) }})
                  </div>
                </q-banner>
              </div>
            </div>

            <!-- Vendor Information Section -->
            <div class="text-overline text-grey-7 q-mb-xs q-mt-md">VENDOR INFORMATION</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Vendor Name</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.vendorNameConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.vendorNameConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.vendorNameConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.vendorName"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.vendorNameConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.vendorNameConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-6">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Vendor TIN</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.vendorTinConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.vendorTinConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.vendorTinConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.vendorTin"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.vendorTinConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.vendorTinConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
              <div class="col-12">
                <div>
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Vendor Address</div>
                    <q-space />
                    <q-chip 
                      v-if="isAiExtracted"
                      :color="getConfidenceChipColor(form.vendorAddressConfidence)" 
                      text-color="white" 
                      size="xs"
                      dense
                      class="q-ml-sm"
                    >
                      <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                      {{ form.vendorAddressConfidence }}%
                      <q-tooltip>AI Confidence: {{ getConfidenceLabel(form.vendorAddressConfidence) }}</q-tooltip>
                    </q-chip>
                  </div>
                  <q-input
                    v-model="form.vendorAddress"
                    outlined
                    dense
                    :readonly="isAiExtracted && form.vendorAddressConfidence > 75"
                    :bg-color="getFieldBackgroundColor(form.vendorAddressConfidence)"
                    hide-bottom-space
                  />
                </div>
              </div>
            </div>

            <!-- Expense Details Section -->
            <div class="text-overline text-grey-7 q-mb-xs q-mt-md">EXPENSE DETAILS</div>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <g-input
                  label="Business Purpose"
                  v-model="form.businessPurpose"
                  type="textarea"
                  :rules="[val => !!val || 'Business purpose is required']"
                  hint="Explain the business reason for this expense"
                ></g-input>
              </div>
              <div class="col-12">
                <g-input
                  label="Additional Notes (Optional)"
                  v-model="form.description"
                  type="textarea"
                ></g-input>
              </div>
            </div>

          </q-form>
        </div>
      </div>
      
      <!-- Fixed Actions Footer -->
      <q-separator />
      <q-card-actions class="bg-white q-py-sm q-px-md" style="position: sticky; bottom: 0; z-index: 10;">
        <!-- Development only: Auto-fill button -->
        <q-btn
          v-if="isDevelopment && currentHolder"
          flat
          no-caps
          dense
          label="Auto Fill (Dev)"
          color="purple"
          padding="xs md"
          @click="autoFillForm"
          style="margin-right: auto;"
        />
        <q-space />
        <q-btn
          flat
          no-caps
          dense
          label="Cancel"
          color="grey-8"
          padding="xs md"
          v-close-popup
        />
        <q-btn
          unelevated
          no-caps
          dense
          label="Create"
          color="primary"
          padding="xs md"
          @click="submitRequest"
          :disable="extractingReceipt || !currentHolder"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dialog-card {
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

// Material Design 3 flat styling
:deep(.q-field--outlined .q-field__control) {
  background-color: #f5f5f5;
  
  &:before {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  
  &:hover:before {
    border-color: #9e9e9e;
  }
  
  &:after {
    border: 2px solid $primary;
    border-radius: 8px;
    transition: opacity 0.36s;
    opacity: 0;
  }
}

:deep(.q-field--focused.q-field--outlined .q-field__control:after) {
  opacity: 1;
}

// Make form fields denser
:deep(.q-field) {
  .q-field__bottom {
    padding-top: 2px;
  }
}

:deep(.g-field) {
  margin-bottom: 12px !important;
}

// Ensure scrollable area takes full height
.full-height {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// Style for disabled AI-extracted fields
:deep(.q-field--disabled) {
  .q-field__control {
    background-color: #f5f5f5 !important;
    
    &:before {
      border-color: #e0e0e0 !important;
    }
    
    input, textarea {
      color: #616161 !important;
      -webkit-text-fill-color: #616161 !important;
    }
  }
  
  .q-field__label {
    color: #757575 !important;
  }
}

// Style for disabled q-select
:deep(.q-select.disabled) {
  .q-field__control {
    background-color: #f5f5f5 !important;
  }
}

// MD3 button styling
:deep(.q-btn) {
  border-radius: 20px;
  font-weight: 500;
  letter-spacing: 0.1px;
}

:deep(.q-btn--unelevated) {
  box-shadow: none;
}

// Remove blue outline on focus for cleaner MD3 look
:deep(.q-field--outlined.q-field--focused .q-field__control:after) {
  opacity: 0.12;
  border-width: 1px;
}

// Dense overline headers
.text-overline {
  font-size: 11px !important;
  letter-spacing: 0.5px !important;
  margin-bottom: 4px !important;
}

// Confidence-based background colors
:deep(.q-field--outlined .q-field__control) {
  &.bg-green-1 {
    background-color: #e8f5e9 !important;
  }
  &.bg-orange-1 {
    background-color: #fff3e0 !important;
  }
  &.bg-red-1 {
    background-color: #ffebee !important;
  }
}

// Tax warning banner styling
.bg-warning-1 {
  background-color: #fff3e0 !important;
  border-left: 3px solid #ff9800;
}

// Confidence chip styling
:deep(.q-chip) {
  font-size: 10px !important;
  padding: 2px 6px !important;
  height: 20px !important;
  
  &.q-chip--dense {
    margin: 0 !important;
  }
}

// AI Status Card Styling
.ai-status-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.confidence-high {
    background: linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%);
    border-color: #c5e1a5;
  }
  
  &.confidence-medium {
    background: linear-gradient(135deg, #ffffff 0%, #fff8e1 100%);
    border-color: #ffe082;
  }
  
  &.confidence-low {
    background: linear-gradient(135deg, #ffffff 0%, #ffebee 100%);
    border-color: #ffcdd2;
  }
}

.confidence-section {
  .confidence-gauge {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
}

// Smooth animation for progress indicators
:deep(.q-circular-progress__track),
:deep(.q-circular-progress__svg) {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.q-linear-progress__track) {
  background: rgba(0, 0, 0, 0.06);
}

:deep(.q-linear-progress__model) {
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

<script>
import { api } from 'src/boot/axios';
import GInput from "../../../../components/shared/form/GInput.vue";
import GInputMedia from "../../../../components/shared/form/GInputMedia.vue";
import { ModuleType } from 'src/types/media.types';

export default {
  name: 'CreateRequestForPaymentDialog',
  components: {
    GInput,
    GInputMedia,
  },
  props: {},
  computed: {
    ModuleType() {
      return ModuleType;
    },
    remainingBalance() {
      if (!this.currentHolder) return 0;
      const actualBalance = this.currentHolder.actualBalance || this.currentHolder.currentBalance || 0;
      const pendingLiquidation = this.currentHolder.pendingLiquidation || 0;
      return actualBalance - pendingLiquidation;
    },
    showTaxWarning() {
      if (!this.form.amount) return false;
      const totalTax = Number(this.form.vatAmount || 0) + Number(this.form.withholdingTaxAmount || 0);
      return totalTax > Number(this.form.amount);
    },
    isDevelopment() {
      return process.env.NODE_ENV === 'development';
    }
  },
  data: () => ({
    fileInputKey: 0, // Key to force re-render of file input
    form: {
      attachmentProof: null,
      amount: null,
      description: null,
      receiptNumber: null,
      receiptDate: null,
      vendorName: null,
      vendorAddress: null,
      vendorTin: null,
      expenseCategory: null,
      businessPurpose: null,
      vatAmount: 0,
      withholdingTaxAmount: 0,
      vatAmountConfidence: 0,
      withholdingTaxConfidence: 0,
    },
    currentHolder: null,
    loading: false,
    fetchAttempted: false,
    extractingReceipt: false,
    isAiExtracted: false,
    isAutoFilling: false, // Flag to track auto-fill mode
    expenseCategories: [
      'Meals',
      'Transportation',
      'Office Supplies',
      'Utilities',
      'Communication',
      'Maintenance',
      'Travel',
      'Entertainment',
      'Professional Services',
      'Others'
    ],
  }),
  methods: {
    async submitRequest() {
      const isValid = await this.$refs.form.validate();
      if (!isValid) return;

      if (!this.currentHolder) {
        this.$q.notify({
          type: 'negative',
          message: 'You don\'t have an active petty cash assignment',
        });
        return;
      }

      // Convert date to ISO 8601 format if it exists
      let formattedReceiptDate = null;
      if (this.form.receiptDate) {
        try {
          // The date comes from Quasar in YYYY/MM/DD format, convert to ISO 8601
          const dateParts = this.form.receiptDate.split('/');
          if (dateParts.length === 3) {
            formattedReceiptDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).toISOString();
          } else {
            // Try parsing as is
            formattedReceiptDate = new Date(this.form.receiptDate).toISOString();
          }
        } catch (dateError) {
          console.error('Date parsing error:', dateError);
          this.$q.notify({
            type: 'negative',
            message: 'Invalid receipt date format',
          });
          return;
        }
      }

      const params = {
        attachmentProof: this.form.attachmentProof.id,
        amount: Number(this.form.amount),
        description: this.form.description || '',
        receiptNumber: this.form.receiptNumber,
        receiptDate: formattedReceiptDate,
        vendorName: this.form.vendorName,
        vendorAddress: this.form.vendorAddress,
        vendorTin: this.form.vendorTin,
        expenseCategory: this.form.expenseCategory,
        businessPurpose: this.form.businessPurpose,
        isAiExtracted: this.isAiExtracted,
        pettyCashHolderId: this.currentHolder.id,
        vatAmount: Number(this.form.vatAmount) || 0,
        vatAmountConfidence: Number(this.form.vatAmountConfidence) || 0,
        withholdingTaxAmount: Number(this.form.withholdingTaxAmount) || 0,
        withholdingTaxConfidence: Number(this.form.withholdingTaxConfidence) || 0,
        totalAIConfidence: Number(this.form.totalAIConfidence) || 0,
      };

      api
        .post('petty-cash/liquidation', params)
        .then(() => {
          this.$refs.dialog.hide();
          
          // Safely emit event to update tables
          try {
            this.$bus.emit('newSaveLiquidation');
          } catch (busError) {
            console.warn('Error emitting newSaveLiquidation event:', busError);
            // Continue execution even if table refresh fails
          }
          
          this.$emit('saveDone');
          this.$q.notify({
            type: 'positive',
            message: 'Liquidation request submitted successfully',
          });
        })
        .catch((error) => {
          console.error('Liquidation submission error:', error);
          
          // Extract error message from backend response
          let errorMessage = 'Failed to submit liquidation request';
          
          if (error.response && error.response.data) {
            if (error.response.data.message) {
              // Handle array of messages or single message
              if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message.join(', ');
              } else {
                errorMessage = error.response.data.message;
              }
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            }
          }
          
          this.$q.notify({
            type: 'negative',
            message: errorMessage,
            position: 'top',
            timeout: 5000
          });
        });
    },
    async fetchData() {
      // Reset file input key to ensure fresh state
      this.fileInputKey = 0;
      
      this.form = {
        attachmentProof: null,
        amount: null,
        description: null,
        receiptNumber: null,
        receiptDate: null,
        vendorName: null,
        vendorAddress: null,
        vendorTin: null,
        expenseCategory: null,
        businessPurpose: null,
        vatAmount: 0,
        withholdingTaxAmount: 0,
        vatAmountConfidence: 0,
        withholdingTaxConfidence: 0,
        // Additional confidence fields (not saved to DB, only for display)
        receiptNumberConfidence: 0,
        receiptDateConfidence: 0,
        vendorNameConfidence: 0,
        vendorAddressConfidence: 0,
        vendorTinConfidence: 0,
        amountConfidence: 0,
        expenseCategoryConfidence: 0,
        totalAIConfidence: 0,
      };
      this.loading = true;
      this.fetchAttempted = false;
      this.isAiExtracted = false;
      this.extractingReceipt = false;

      try {
        const response = await api.get('petty-cash/holder/current');
        this.currentHolder = response.data;
      } catch (error) {
        console.error('Error fetching petty cash holder:', error);
        this.currentHolder = null;
      } finally {
        this.loading = false;
        this.fetchAttempted = true;
      }
    },
    autoFillForm() {
      // Set auto-filling flag to prevent AI extraction
      this.isAutoFilling = true;
      
      // Generate random number for uniqueness
      const randomNum = Math.floor(Math.random() * 10000);
      
      // Get current date
      const today = new Date();
      const receiptDate = today.toISOString().split('T')[0].replace(/-/g, '/');
      
      // Random expense categories from the available list
      const randomCategory = this.expenseCategories[Math.floor(Math.random() * this.expenseCategories.length)];
      
      // Calculate a reasonable amount (less than remaining balance)
      const maxAmount = Math.min(this.remainingBalance * 0.5, 5000); // Use 50% of remaining balance or 5000, whichever is smaller
      const amount = Math.floor(Math.random() * maxAmount) + 100; // Random amount between 100 and maxAmount
      
      // Calculate VAT (12% of amount)
      const vatAmount = (amount * 0.12).toFixed(2);
      
      // Create a mock file object for the attachment
      // Note: In development, we'll simulate having uploaded a file with ID 1
      const mockFile = {
        id: 1,  // Use numeric ID 1 as specified
        name: `receipt-${randomNum}.jpg`,
        type: 'image/jpeg',
        size: 1024 * 100, // 100KB
      };
      
      // Auto-fill form fields
      this.form.attachmentProof = mockFile;
      this.form.amount = amount;
      this.form.description = `Test liquidation ${randomNum} for development`;
      this.form.receiptNumber = `RCP-${randomNum}`;
      this.form.receiptDate = receiptDate;
      this.form.vendorName = `Test Vendor ${randomNum}`;
      this.form.vendorAddress = `${randomNum} Test Street, Manila, Philippines`;
      this.form.vendorTin = `${randomNum.toString().padStart(3, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}-000`;
      this.form.expenseCategory = randomCategory;
      this.form.businessPurpose = `Business purpose for ${randomCategory.toLowerCase()} expense - Test ${randomNum}`;
      this.form.vatAmount = vatAmount;
      this.form.withholdingTaxAmount = 0;
      
      // Reset AI extraction state since this is manual fill
      this.isAiExtracted = false;
      
      // Reset auto-filling flag after a short delay
      this.$nextTick(() => {
        this.isAutoFilling = false;
      });
      
      this.$q.notify({
        type: 'info',
        message: 'Form auto-filled with test data',
        caption: `Amount: ₱${this.formatNumber(amount)}`,
        timeout: 2000
      });
    },
    async onFileSelected(file) {
      console.log('onFileSelected called with:', file);
      
      // Skip extraction if auto-filling
      if (this.isAutoFilling) {
        console.log('Auto-filling in progress, skipping AI extraction');
        return;
      }
      
      // If file is removed/cleared, reset all AI-extracted data
      if (!file || !file.id) {
        console.log('File removed, clearing all data');
        
        // Clear all AI-extracted fields
        this.form.receiptNumber = null;
        this.form.receiptDate = null;
        this.form.vendorName = null;
        this.form.vendorAddress = null;
        this.form.vendorTin = null;
        this.form.amount = null;
        this.form.expenseCategory = null;
        this.form.vatAmount = 0;
        this.form.withholdingTaxAmount = 0;
        
        // Clear all confidence scores
        this.form.receiptNumberConfidence = 0;
        this.form.receiptDateConfidence = 0;
        this.form.vendorNameConfidence = 0;
        this.form.vendorAddressConfidence = 0;
        this.form.vendorTinConfidence = 0;
        this.form.amountConfidence = 0;
        this.form.expenseCategoryConfidence = 0;
        this.form.vatAmountConfidence = 0;
        this.form.withholdingTaxConfidence = 0;
        this.form.totalAIConfidence = 0;
        
        // Reset AI extraction flags and loading state
        this.isAiExtracted = false;
        this.extractingReceipt = false;
        
        // Force re-render of file input component
        this.fileInputKey++;
        return;
      }

      console.log('New file selected, starting AI extraction for file ID:', file.id);
      
      // Reset previous data before new extraction
      this.isAiExtracted = false;
      
      // Small delay to ensure UI updates
      await this.$nextTick();
      
      this.extractingReceipt = true;

      try {
        const response = await api.post('petty-cash/extract-receipt-data', {
          fileId: file.id
        });

        console.log('Receipt extraction response:', response);

        if (response.data) {
          // The responseHandler returns data directly
          const extractedData = response.data;
          console.log('Extracted data:', extractedData);
          console.log('Confidence scores received:', {
            receiptNumber: extractedData.receiptNumberConfidence,
            receiptDate: extractedData.receiptDateConfidence,
            vendorName: extractedData.vendorNameConfidence,
            vendorAddress: extractedData.vendorAddressConfidence,
            vendorTin: extractedData.vendorTinConfidence,
            amount: extractedData.amountConfidence,
            expenseCategory: extractedData.expenseCategoryConfidence,
            vat: extractedData.vatAmountConfidence,
            withholding: extractedData.withholdingTaxConfidence,
            total: extractedData.totalAIConfidence
          });
          
          // Populate form fields with extracted data and confidence scores
          if (extractedData.receiptNumber !== undefined) {
            this.form.receiptNumber = extractedData.receiptNumber;
            this.form.receiptNumberConfidence = extractedData.receiptNumberConfidence !== undefined ? extractedData.receiptNumberConfidence : 0;
            console.log(`Set receiptNumber confidence to: ${this.form.receiptNumberConfidence}`);
          }
          if (extractedData.receiptDate !== undefined) {
            this.form.receiptDate = extractedData.receiptDate;
            this.form.receiptDateConfidence = extractedData.receiptDateConfidence || 0;
          }
          if (extractedData.vendorName !== undefined) {
            this.form.vendorName = extractedData.vendorName;
            this.form.vendorNameConfidence = extractedData.vendorNameConfidence || 0;
          }
          if (extractedData.vendorAddress !== undefined) {
            this.form.vendorAddress = extractedData.vendorAddress;
            this.form.vendorAddressConfidence = extractedData.vendorAddressConfidence || 0;
          }
          if (extractedData.vendorTin !== undefined) {
            this.form.vendorTin = extractedData.vendorTin;
            this.form.vendorTinConfidence = extractedData.vendorTinConfidence || 0;
          }
          if (extractedData.amount !== undefined) {
            this.form.amount = extractedData.amount;
            this.form.amountConfidence = extractedData.amountConfidence || 0;
          }
          if (extractedData.expenseCategory !== undefined) {
            this.form.expenseCategory = extractedData.expenseCategory;
            this.form.expenseCategoryConfidence = extractedData.expenseCategoryConfidence || 0;
          }
          
          // Handle VAT and Withholding Tax fields
          if (extractedData.vatAmount !== undefined) {
            this.form.vatAmount = extractedData.vatAmount || 0;
            this.form.vatAmountConfidence = extractedData.vatAmountConfidence || 0;
          }
          if (extractedData.withholdingTaxAmount !== undefined) {
            this.form.withholdingTaxAmount = extractedData.withholdingTaxAmount || 0;
            this.form.withholdingTaxConfidence = extractedData.withholdingTaxConfidence || 0;
          }
          
          // Set total AI confidence
          if (extractedData.totalAIConfidence !== undefined) {
            this.form.totalAIConfidence = extractedData.totalAIConfidence || 0;
          }
          
          this.isAiExtracted = true;
          
          // Log final form confidence values for debugging
          console.log('Form confidence values after setting:', {
            receiptNumber: this.form.receiptNumberConfidence,
            receiptDate: this.form.receiptDateConfidence,
            vendorName: this.form.vendorNameConfidence,
            vendorAddress: this.form.vendorAddressConfidence,
            vendorTin: this.form.vendorTinConfidence,
            amount: this.form.amountConfidence,
            expenseCategory: this.form.expenseCategoryConfidence,
            vat: this.form.vatAmountConfidence,
            withholding: this.form.withholdingTaxConfidence,
            total: this.form.totalAIConfidence,
            isAiExtracted: this.isAiExtracted
          });
          
          this.$q.notify({
            type: 'positive',
            message: 'Receipt data extracted successfully',
            caption: 'Please review and complete the form'
          });
        }
      } catch (error) {
        console.error('Error extracting receipt data:', error);
        
        // Show more specific error message
        let message = 'Could not extract receipt data';
        let caption = 'Please fill in the form manually';
        
        if (error.response && error.response.data && error.response.data.message) {
          message = error.response.data.message;
        }
        
        this.$q.notify({
          type: 'warning',
          message: message,
          caption: caption,
          timeout: 5000
        });
      } finally {
        this.extractingReceipt = false;
      }
    },
    formatNumber(value) {
      if (!value) return '0.00';
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },
    disableAiMode() {
      this.$q.dialog({
        title: 'Edit Manually',
        message: 'Are you sure you want to edit the extracted data manually? The record will no longer be marked as AI-extracted.',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Yes, Edit Manually',
          color: 'primary'
        },
        cancel: {
          label: 'Cancel',
          color: 'grey'
        }
      }).onOk(() => {
        this.isAiExtracted = false;
        // Remove debug logs
        console.log('AI mode disabled, fields are now editable');
        this.$q.notify({
          type: 'info',
          message: 'Manual editing enabled',
          caption: 'You can now edit all fields',
          icon: 'edit'
        });
      });
    },
    getFieldBackgroundColor(confidence) {
      // Show background color when AI extraction has been performed
      if (this.isAiExtracted) {
        if (confidence >= 75) return 'green-1';
        if (confidence >= 50) return 'orange-1';
        return 'red-1';  // This includes 0 confidence
      }
      return undefined;
    },
    getConfidenceChipColor(confidence) {
      if (confidence >= 75) return 'green';
      if (confidence >= 50) return 'orange';
      return 'red';
    },
    getConfidenceLabel(confidence) {
      if (confidence >= 75) return 'High confidence';
      if (confidence >= 50) return 'Medium confidence';
      return 'Low confidence - please verify';
    },
    shouldShowConfidenceWarning(confidence) {
      return confidence > 0 && confidence < 75;
    },
    getConfidenceColor(confidence) {
      if (confidence >= 75) return 'green-7';
      if (confidence >= 50) return 'orange-7';
      return 'red-7';
    },
    getConfidenceCardClass(confidence) {
      if (confidence >= 75) return 'confidence-high';
      if (confidence >= 50) return 'confidence-medium';
      return 'confidence-low';
    },
    getConfidenceTitle(confidence) {
      if (confidence >= 90) return 'Excellent Extraction Quality';
      if (confidence >= 75) return 'Good Extraction Quality';
      if (confidence >= 50) return 'Fair Extraction Quality';
      if (confidence >= 30) return 'Poor Extraction Quality';
      return 'Very Low Extraction Quality';
    },
    getConfidenceDescription(confidence) {
      if (confidence >= 90) return 'AI has extracted data with very high accuracy. Minor review recommended.';
      if (confidence >= 75) return 'Most fields extracted successfully. Please verify key information.';
      if (confidence >= 50) return 'Some fields may be inaccurate. Review all fields carefully.';
      if (confidence >= 30) return 'Many fields uncertain. Manual verification required.';
      return 'Extraction quality is very low. Extensive manual review needed.';
    },
  },
};
</script>
