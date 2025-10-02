<template>
  <div class="sss-contribution-table">
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
          <!-- Main group headers -->
          <q-tr class="table-header-row">
            <q-th rowspan="2" class="text-label-medium">No.</q-th>
            <q-th rowspan="2" class="text-label-medium">Employee Code</q-th>
            <q-th rowspan="2" class="text-label-medium">SSS Number</q-th>
            <q-th rowspan="2" class="text-label-medium">Last Name</q-th>
            <q-th rowspan="2" class="text-label-medium">First Name</q-th>
            <q-th rowspan="2" class="text-label-medium">Middle Name</q-th>
            <q-th rowspan="2" class="text-label-medium">Covered</q-th>
            <q-th rowspan="2" class="text-label-medium">Basis Amount</q-th>
            <q-th colspan="3" class="text-label-medium">Employee Share</q-th>
            <q-th colspan="4" class="text-label-medium">Employer Share</q-th>
            <q-th rowspan="2" class="text-label-medium">TOTAL</q-th>
          </q-tr>
          <!-- Sub-headers for shares -->
          <q-tr class="table-header-row">
            <!-- Employee Share sub-headers -->
            <q-th class="text-body-medium">Regular SS</q-th>
            <q-th class="text-body-medium">MPF</q-th>
            <q-th class="text-body-medium">Total</q-th>
            <!-- Employer Share sub-headers -->
            <q-th class="text-body-medium">Regular SS</q-th>
            <q-th class="text-body-medium">MPF</q-th>
            <q-th class="text-body-medium">EC</q-th>
            <q-th class="text-body-medium">Total</q-th>
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
              {{ props.row.sssNumber || "-" }}
            </q-td>
            <q-td class="text-body-medium">
              {{ props.row.lastName || "-" }}
            </q-td>
            <q-td class="text-body-medium">
              {{ props.row.firstName || "-" }}
            </q-td>
            <q-td class="text-body-medium">
              {{ props.row.middleName || "-" }}
            </q-td>
            <q-td class="text-center text-body-medium">
              {{ props.row.covered || "-" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ props.row.basis?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <!-- Employee Share -->
            <q-td class="text-right text-body-medium">
              {{ props.row.employeeShareRegular?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ props.row.employeeShareMPF?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              <span class="text-primary text-weight-medium">{{
                props.row.employeeShare?.formatCurrency || "₱ 0.00"
              }}</span>
            </q-td>
            <!-- Employer Share -->
            <q-td class="text-right text-body-medium">
              {{ props.row.employerShareRegular?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ props.row.employerShareMPF?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              {{ props.row.employerShareEC?.formatCurrency || "₱ 0.00" }}
            </q-td>
            <q-td class="text-right text-body-medium">
              <span class="text-secondary text-weight-medium">{{
                props.row.employerShare?.formatCurrency || "₱ 0.00"
              }}</span>
            </q-td>
            <q-td class="text-right text-body-medium">
              <span class="text-weight-bold">{{ props.row.amount?.formatCurrency || "₱ 0.00" }}</span>
            </q-td>
          </q-tr>
        </template>

        <template v-slot:bottom-row v-if="rows.length > 0">
          <q-tr class="totals-row">
            <q-td colspan="7" class="text-right text-body-large text-weight-medium"> Total </q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.basis }}
            </q-td>
            <!-- Employee Share Totals -->
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.employeeShareRegular }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.employeeShareMPF }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-medium text-primary">
              {{ totals.employeeShare }}
            </q-td>
            <!-- Employer Share Totals -->
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.employerShareRegular }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.employerShareMPF }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-medium">
              {{ totals.employerShareEC }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-medium text-secondary">
              {{ totals.employerShare }}
            </q-td>
            <q-td class="text-right text-body-large text-weight-bold">
              {{ totals.total }}
            </q-td>
          </q-tr>
        </template>

        <template v-slot:no-data>
          <div class="no-data-container">
            <div class="column items-center">
              <q-icon name="folder_open" size="64px" color="grey" />
              <div class="text-title-large text-grey q-mt-sm">No SSS contribution records found</div>
              <div class="text-body-medium text-grey q-mt-sm">
                Try adjusting your filters or date range
              </div>
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

interface SSSContributionRow {
  id: number;
  employeeCode: string;
  sssNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  employeeName: string;
  branch: string;
  covered: string;
  periodStart: { dateFull: string; dateStandard: string; raw: string };
  periodEnd: { dateFull: string; dateStandard: string; raw: string };
  basis: { raw: number; formatCurrency: string; formatNumber: string };
  employeeShare: { raw: number; formatCurrency: string; formatNumber: string };
  employerShare: { raw: number; formatCurrency: string; formatNumber: string };
  // SSS Breakdown fields
  employeeShareRegular: { raw: number; formatCurrency: string; formatNumber: string };
  employeeShareMPF: { raw: number; formatCurrency: string; formatNumber: string };
  employerShareRegular: { raw: number; formatCurrency: string; formatNumber: string };
  employerShareMPF: { raw: number; formatCurrency: string; formatNumber: string };
  employerShareEC: { raw: number; formatCurrency: string; formatNumber: string };
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
    type: Array as PropType<SSSContributionRow[]>,
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
  let employeeShare = 0;
  let employerShare = 0;
  let employeeShareRegular = 0;
  let employeeShareMPF = 0;
  let employerShareRegular = 0;
  let employerShareMPF = 0;
  let employerShareEC = 0;
  let total = 0;

  props.rows.forEach((row) => {
    basis += row.basis?.raw || 0;
    employeeShare += row.employeeShare?.raw || 0;
    employerShare += row.employerShare?.raw || 0;
    employeeShareRegular += row.employeeShareRegular?.raw || 0;
    employeeShareMPF += row.employeeShareMPF?.raw || 0;
    employerShareRegular += row.employerShareRegular?.raw || 0;
    employerShareMPF += row.employerShareMPF?.raw || 0;
    employerShareEC += row.employerShareEC?.raw || 0;
    total += row.amount?.raw || 0;
  });

  const formatCurrency = (value: number) => `₱ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  return {
    basis: formatCurrency(basis),
    employeeShare: formatCurrency(employeeShare),
    employerShare: formatCurrency(employerShare),
    employeeShareRegular: formatCurrency(employeeShareRegular),
    employeeShareMPF: formatCurrency(employeeShareMPF),
    employerShareRegular: formatCurrency(employerShareRegular),
    employerShareMPF: formatCurrency(employerShareMPF),
    employerShareEC: formatCurrency(employerShareEC),
    total: formatCurrency(total),
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
  
  // Row 1: Main headers with placeholders for merged cells
  wsData.push([
    'No.',
    'Employee Code',
    'SSS Number',
    'Last Name',
    'First Name',
    'Middle Name',
    'Covered',
    'Basis Amount',
    'Employee Share', '', '', // 3 columns for Employee Share
    'Employer Share', '', '', '', // 4 columns for Employer Share
    'TOTAL'
  ]);
  
  // Row 2: Sub-headers
  wsData.push([
    '', '', '', '', '', '', '', '', // Empty for first 8 columns
    'Regular SS', 'MPF', 'Total', // Employee Share sub-headers
    'Regular SS', 'MPF', 'EC', 'Total', // Employer Share sub-headers
    '' // Empty for TOTAL
  ]);
  
  // Add data rows
  props.rows.forEach((row, index) => {
    wsData.push([
      index + 1,
      row.employeeCode || '-',
      row.sssNumber || '-',
      row.lastName || '-',
      row.firstName || '-',
      row.middleName || '-',
      row.covered || '-',
      row.basis?.raw || 0,
      row.employeeShareRegular?.raw || 0,
      row.employeeShareMPF?.raw || 0,
      row.employeeShare?.raw || 0,
      row.employerShareRegular?.raw || 0,
      row.employerShareMPF?.raw || 0,
      row.employerShareEC?.raw || 0,
      row.employerShare?.raw || 0,
      row.amount?.raw || 0
    ]);
  });
  
  // Add totals row
  wsData.push([
    '', '', '', '', '', '', 'Total',
    props.rows.reduce((sum, row) => sum + (row.basis?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employeeShareRegular?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employeeShareMPF?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employeeShare?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employerShareRegular?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employerShareMPF?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employerShareEC?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.employerShare?.raw || 0), 0),
    props.rows.reduce((sum, row) => sum + (row.amount?.raw || 0), 0)
  ]);
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Merge cells for main headers
  ws['!merges'] = [
    { s: { r: 0, c: 8 }, e: { r: 0, c: 10 } },  // Employee Share (I1:K1)
    { s: { r: 0, c: 11 }, e: { r: 0, c: 14 } }  // Employer Share (L1:O1)
  ];
  
  // Set column widths
  ws['!cols'] = [
    { wpx: 50 },   // No.
    { wpx: 120 },  // Employee Code
    { wpx: 120 },  // SSS Number
    { wpx: 120 },  // Last Name
    { wpx: 120 },  // First Name
    { wpx: 120 },  // Middle Name
    { wpx: 100 },  // Covered
    { wpx: 120 },  // Basis Amount
    { wpx: 100 },  // Employee Share - Regular SS
    { wpx: 100 },  // Employee Share - MPF
    { wpx: 100 },  // Employee Share - Total
    { wpx: 100 },  // Employer Share - Regular SS
    { wpx: 100 },  // Employer Share - MPF
    { wpx: 100 },  // Employer Share - EC
    { wpx: 100 },  // Employer Share - Total
    { wpx: 120 }   // TOTAL
  ];
  
  // Set row heights for headers
  ws['!rows'] = [
    { hpx: 30 }, // Row 0 - Main headers
    { hpx: 25 }  // Row 1 - Sub-headers
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
  
  // Sub-header style
  const subHeaderStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "5B9BD5" } },
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
      
      // Row 0 - Main headers
      if (R === 0) {
        ws[cell_ref].s = headerStyle;
      }
      // Row 1 - Sub-headers
      else if (R === 1) {
        if (C >= 8) {
          ws[cell_ref].s = subHeaderStyle;
        } else {
          // Empty cells in row 1 should also have header styling
          ws[cell_ref].s = headerStyle;
        }
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
        } else if (C >= 7) {
          ws[cell_ref].s = totalsStyle;
        }
      }
      // Data rows
      else if (R > 1) {
        // No. column (center)
        if (C === 0) {
          ws[cell_ref].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: dataBorder
          };
        }
        // Covered column (center)
        else if (C === 6) {
          ws[cell_ref].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: dataBorder
          };
        }
        // Numeric columns (right align with number format)
        else if (C >= 7) {
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
  XLSX.utils.book_append_sheet(wb, ws, 'SSS Contributions');
  
  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `SSS-Contributions-${date}.xlsx`;
  
  // Save file
  XLSX.writeFile(wb, filename);
  */
};
</script>

<style scoped lang="scss">
.sss-contribution-table {
  width: 100%;
}

.table-wrapper {
  width: 100%;
  max-width: calc(100vw - 450px);
  margin: 0 auto;
  overflow: auto;
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
