<template>
  <div class="tax-withholding-table">
    <div class="table-wrapper">
      <q-table
        :rows="rows"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onRequest"
        :rows-per-page-options="[10, 20, 50, 100]"
        :no-data-label="''"
        class="md3-table"
        flat
        square
      >
        <template v-slot:top>
          <div class="col row items-center q-pa-md">
            <div>
              <div class="text-title-medium text-dark">{{ title }}</div>
              <div class="text-body-medium text-dark q-mt-xs">{{ rows.length }} records found</div>
            </div>
            <q-space />
            <GButton
              round
              icon="table_view"
              size="md"
              variant="tonal"
              icon-size="md"
              @click="exportToExcel"
              :disable="!rows.length"
            >
              <q-tooltip class="text-body-small">Export to Excel</q-tooltip>
            </GButton>
          </div>
        </template>

        <template v-slot:header>
          <q-tr class="table-header-row">
            <q-th class="text-body-medium text-weight-medium">No.</q-th>
            <q-th class="text-body-medium text-weight-medium">Employee Code</q-th>
            <q-th class="text-body-medium text-weight-medium">Employee Name</q-th>
            <q-th class="text-body-medium text-weight-medium">Branch</q-th>
            <q-th class="text-body-medium text-weight-medium">Covered</q-th>
            <q-th class="text-body-medium text-weight-medium">Period Covered</q-th>
            <q-th class="text-body-medium text-weight-medium">Taxable Income</q-th>
            <q-th class="text-body-medium text-weight-medium">Tax Withheld</q-th>
            <q-th class="text-body-medium text-weight-medium">Date Posted</q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props" class="table-body-row">
            <q-td class="text-center text-body-medium">
              {{ props.rowIndex + 1 }}
            </q-td>
            <q-td class="text-body-medium">
              <span class="text-weight-medium">{{ props.row.employeeCode || "-" }}</span>
            </q-td>
            <q-td class="text-body-medium">
              {{ props.row.employeeName || "-" }}
            </q-td>
            <q-td class="text-body-medium">
              <q-chip size="sm" color="surface-variant" text-color="on-surface-variant" square>
                {{ props.row.branch || "-" }}
              </q-chip>
            </q-td>
            <q-td class="text-center text-body-medium">
              {{ props.row.covered || "-" }}
            </q-td>
            <q-td class="text-center text-body-medium">
              <div class="text-caption text-on-surface-variant">{{ props.row.periodStart.dateFull }}</div>
              <div class="text-caption text-on-surface-variant">{{ props.row.periodEnd.dateFull }}</div>
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ props.row.basis?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              <span class="text-primary text-weight-bold">{{ props.row.amount?.formatCurrency || "₱ 0.00" }}</span>
            </q-td>
            <q-td class="text-center text-body-medium">
              {{ props.row.datePosted.dateFull }}
            </q-td>
          </q-tr>
        </template>

        <template v-slot:bottom-row v-if="rows.length > 0">
          <q-tr class="totals-row">
            <q-td colspan="6" class="text-right text-body-large text-weight-medium"> Total </q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.basis }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-bold text-primary">
              {{ totals.amount }}
            </q-td>
            <q-td></q-td>
          </q-tr>
        </template>

        <template v-slot:no-data>
          <div class="no-data-container">
            <div class="column items-center">
              <q-icon name="folder_open" size="64px" color="grey" />
              <div class="text-title-large text-grey q-mt-sm">No tax withholding records found</div>
              <div class="text-body-medium text-grey q-mt-sm">Try adjusting your filters or date range</div>
            </div>
          </div>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { useQuasar } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";
// import * as XLSX from 'xlsx-js-style'; // Removed - Excel export under development

const $q = useQuasar();

interface TaxWithholdingRow {
  id: number;
  employeeCode: string;
  employeeName: string;
  branch: string;
  covered: string;
  periodStart: { dateFull: string; dateStandard: string; raw: string };
  periodEnd: { dateFull: string; dateStandard: string; raw: string };
  basis: { raw: number; formatCurrency: string; formatNumber: string };
  employeeShare: { raw: number; formatCurrency: string; formatNumber: string };
  employerShare: { raw: number; formatCurrency: string; formatNumber: string };
  amount: { raw: number; formatCurrency: string; formatNumber: string };
  datePosted: { dateFull: string; dateStandard: string; raw: string };
}

interface SortColumn {
  column: string;
  order: "asc" | "desc";
}

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  rows: {
    type: Array as PropType<TaxWithholdingRow[]>,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    default: () => ({
      sortBy: null,
      descending: true,
      page: 1,
      rowsPerPage: 20,
      rowsNumber: 0,
    }),
  },
  sortColumns: {
    type: Array as PropType<SortColumn[]>,
    default: () => [],
  },
});

const emit = defineEmits(["request", "sort"]);

const totals = computed(() => {
  let basis = 0;
  let amount = 0;

  props.rows.forEach((row) => {
    basis += row.basis?.raw || 0;
    amount += row.amount?.raw || 0;
  });

  const formatCurrency = (value: number) => `₱ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return {
    basis: formatCurrency(basis),
    amount: formatCurrency(amount),
  };
});

const onRequest = (requestProp: {
  pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean };
}) => {
  emit("request", requestProp);
};

const exportToExcel = () => {
  // Excel export functionality is under development
  // Will be migrated to backend for better performance and security
  $q.notify({
    type: "info",
    message: "Excel export is under development. This feature will be available soon.",
    position: "top",
    timeout: 3000,
  });
  return;
  /*
  // Create the data array starting with headers
  const wsData = [];
  
  // Headers
  wsData.push([
    'No.',
    'Employee Code',
    'Employee Name',
    'Branch',
    'Covered',
    'Period Start',
    'Period End',
    'Taxable Income',
    'Tax Withheld',
    'Date Posted'
  ]);
  
  // Add data rows
  props.rows.forEach((row, index) => {
    wsData.push([
      index + 1,
      row.employeeCode || '-',
      row.employeeName || '-',
      row.branch || '-',
      row.covered || '-',
      row.periodStart.dateFull || '-',
      row.periodEnd.dateFull || '-',
      row.basis?.raw || 0,
      row.amount?.raw || 0,
      row.datePosted.dateFull || '-'
    ]);
  });
  
  // Add totals row
  wsData.push([
    '', '', '', '', '', '', 'Total',
    props.rows.reduce((sum, row) => sum + (row.basis?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.amount?.raw || 0), 0),
    ''
  ]);
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wpx: 50 },   // No.
    { wpx: 120 },  // Employee Code
    { wpx: 200 },  // Employee Name
    { wpx: 120 },  // Branch
    { wpx: 100 },  // Covered
    { wpx: 120 },  // Period Start
    { wpx: 120 },  // Period End
    { wpx: 120 },  // Taxable Income
    { wpx: 120 },  // Tax Withheld
    { wpx: 120 }   // Date Posted
  ];
  
  // Set row heights
  ws['!rows'] = [
    { hpx: 30 } // Header row
  ];
  
  // Apply styles
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  // Header style
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };
  
  // Totals row style
  const totalsStyle = {
    font: { bold: true, sz: 11 },
    fill: { fgColor: { rgb: "F2F2F2" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    },
    numFmt: "#,##0.00"
  };
  
  // Data cell border
  const dataBorder = {
    top: { style: "thin", color: { rgb: "D3D3D3" } },
    bottom: { style: "thin", color: { rgb: "D3D3D3" } },
    left: { style: "thin", color: { rgb: "D3D3D3" } },
    right: { style: "thin", color: { rgb: "D3D3D3" } }
  };
  
  // Apply styles to all cells
  for (let R = 0; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      
      if (!ws[cell_ref]) {
        ws[cell_ref] = { t: 's', v: '' };
      }
      
      // Row 0 - Headers
      if (R === 0) {
        ws[cell_ref].s = headerStyle;
      }
      // Last row - Totals
      else if (R === range.e.r) {
        if (C === 6) {
          // "Total" label
          ws[cell_ref].s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: "right", vertical: "center" },
            border: totalsStyle.border,
            fill: totalsStyle.fill
          };
        } else if (C >= 7 && C <= 8) {
          ws[cell_ref].s = totalsStyle;
        }
      }
      // Data rows
      else if (R > 0) {
        // No. column (center)
        if (C === 0) {
          ws[cell_ref].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: dataBorder
          };
        }
        // Date/Covered columns (center)
        else if (C === 4 || C === 5 || C === 6 || C === 9) {
          ws[cell_ref].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: dataBorder
          };
        }
        // Numeric columns (right align with number format)
        else if (C >= 7 && C <= 8) {
          ws[cell_ref].s = {
            alignment: { horizontal: "right", vertical: "center" },
            border: dataBorder,
            numFmt: "#,##0.00"
          };
        }
        // Text columns (left align)
        else {
          ws[cell_ref].s = {
            alignment: { horizontal: "left", vertical: "center" },
            border: dataBorder
          };
        }
      }
    }
  }
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tax Withholding');
  
  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `Tax-Withholding-${date}.xlsx`;
  
  // Save file
  XLSX.writeFile(wb, filename);
  */
};
</script>

<style scoped lang="scss">
.tax-withholding-table {
  width: 100%;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.table-header {
  border-bottom: 1px solid var(--q-outline, #e7e0ec);
}

:deep(.md3-table) {
  width: 100%;
  background-color: #fff;

  .q-table__container {
    border-radius: 0;
    box-shadow: none;
    width: 100%;
  }

  .q-table__top {
    padding: 0;
  }

  th {
    font-weight: 500;
    color: var(--q-on-surface, #1c1b1f);
    border-bottom: 1px solid var(--q-outline-variant, #cac4d0);
    white-space: nowrap;
    padding: 12px 8px;
  }

  tbody tr {
    &:hover {
      background-color: var(--q-surface-variant, #f7f2fa);
    }
  }

  td {
    border-bottom: 1px solid var(--q-outline-variant, #e7e0ec);
    padding: 12px 8px;
    white-space: nowrap;
  }
}

.table-header-row {
  background-color: var(--q-extra-light);
}

.table-body-row {
  transition: background-color 0.2s ease;
}

.totals-row {
  background-color: var(--q-primary-container, #eaddff);

  td {
    border-bottom: none;
    padding: 16px;
  }
}

.md3-icon-button {
  &:hover {
    background-color: var(--q-primary-container, #eaddff);
  }
}

.no-data-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454e);
}

.surface-variant {
  background-color: var(--q-surface-variant, #f7f2fa);
}

@media (max-width: $breakpoint-sm-max) {
  :deep(.md3-table) {
    .q-table__card {
      box-shadow: none;
    }

    td {
      padding: 8px 12px;
    }
  }

  .table-header h2 {
    font-size: 1.125rem;
  }
}
</style>
