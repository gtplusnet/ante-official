import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import * as ExcelJS from 'exceljs';
import { SalaryInformationListResponse } from '@shared/response';

@Injectable()
export class PayrollReportGeneratorService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async generatePayrollDetailsExcel(
    cutoffDateRangeId: string,
    employeeData: SalaryInformationListResponse[],
  ): Promise<Buffer> {
    // Get cutoff details
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: cutoffDateRangeId },
      include: {
        cutoff: {
          include: {
            PayrollGroup: true,
          },
        },
      },
    });

    if (!cutoffDateRange) {
      throw new Error('Cutoff date range not found');
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll Summary');

    // Set column widths
    worksheet.columns = [
      { header: 'Employee Code', key: 'employeeCode', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 30 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Payroll Group', key: 'payrollGroup', width: 15 },
      { header: 'Basic Salary', key: 'basicSalary', width: 15 },
      { header: 'Late Deduction', key: 'lateDeduction', width: 15 },
      { header: 'Undertime Deduction', key: 'undertimeDeduction', width: 15 },
      { header: 'Absent Deduction', key: 'absentDeduction', width: 15 },
      { header: 'Basic Pay', key: 'basicPay', width: 15 },
      { header: 'Allowances', key: 'allowances', width: 15 },
      { header: 'Holiday Pay', key: 'holidayPay', width: 15 },
      { header: 'Overtime Pay', key: 'overtimePay', width: 15 },
      { header: 'Night Diff', key: 'nightDiff', width: 15 },
      { header: 'Rest Day Pay', key: 'restDayPay', width: 15 },
      { header: 'Gross Pay', key: 'grossPay', width: 15 },
      { header: 'SSS', key: 'sss', width: 12 },
      { header: 'PhilHealth', key: 'philhealth', width: 12 },
      { header: 'Pag-IBIG', key: 'pagibig', width: 12 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Other Deductions', key: 'otherDeductions', width: 15 },
      {
        header: 'Net Pay',
        key: 'netPay',
        width: 15,
        style: { font: { bold: true } },
      },
    ];

    // Add header row with company info
    worksheet.mergeCells('A1:U1');
    worksheet.getCell('A1').value = 'PAYROLL SUMMARY REPORT';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:U2');
    worksheet.getCell('A2').value =
      cutoffDateRange.cutoff.PayrollGroup[0]?.payrollGroupCode || 'All Groups';
    worksheet.getCell('A2').font = { size: 14 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:U3');
    worksheet.getCell('A3').value =
      `Period: ${this.formatDate(cutoffDateRange.startDate)} - ${this.formatDate(cutoffDateRange.endDate)}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:U4');
    worksheet.getCell('A4').value =
      `Processing Date: ${this.formatDate(cutoffDateRange.processingDate)}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    // Add empty row
    worksheet.addRow([]);

    // Style header row
    const headerRow = worksheet.getRow(6);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add employee data
    employeeData.forEach((employee) => {
      const summary = employee.salaryComputation.summary;
      worksheet.addRow({
        employeeCode: employee.employeeInformation.employeeCode,
        employeeName: employee.employeeInformation.accountDetails.fullName,
        branch: employee.employeeInformation.branch.name,
        payrollGroup:
          employee.employeeInformation.payrollGroup.payrollGroupCode,
        basicSalary: summary.basicSalary,
        lateDeduction: summary.deductions.late,
        undertimeDeduction: summary.deductions.undertime,
        absentDeduction: summary.deductions.absent,
        basicPay: summary.basicPay,
        allowances: summary.totalAllowance,
        holidayPay:
          summary.additionalEarnings.regularHoliday +
          summary.additionalEarnings.specialHoliday,
        overtimePay: summary.additionalEarnings.overtime,
        nightDiff: summary.additionalEarnings.nightDifferentialOvertime,
        restDayPay: summary.additionalEarnings.restDay,
        grossPay: summary.grossPay,
        sss: summary.contributions.sss,
        philhealth: summary.contributions.philhealth,
        pagibig: summary.contributions.pagibig,
        tax: summary.contributions.withholdingTax,
        otherDeductions: summary.totalLoan + summary.salaryAdjustmentDeductions,
        netPay: summary.netPay,
      });
    });

    // Add totals row
    const totalsRow = worksheet.addRow({
      employeeCode: '',
      employeeName: 'TOTAL',
      branch: '',
      payrollGroup: '',
      basicSalary: cutoffDateRange.totalBasicSalary,
      lateDeduction: cutoffDateRange.totalDeductionLate,
      undertimeDeduction: cutoffDateRange.totalDeductionUndertime,
      absentDeduction: cutoffDateRange.totalDeductionAbsent,
      basicPay: cutoffDateRange.totalBasicPay,
      allowances: cutoffDateRange.totalAllowance,
      holidayPay:
        cutoffDateRange.totalEarningRegularHoliday +
        cutoffDateRange.totalEarningSpecialHoliday,
      overtimePay: cutoffDateRange.totalEarningOvertime,
      nightDiff: cutoffDateRange.totalEarningNightDiff,
      restDayPay: cutoffDateRange.totalEarningRestDay,
      grossPay: cutoffDateRange.totalGrossPay,
      sss: cutoffDateRange.totalGovernmentContributionSSS,
      philhealth: cutoffDateRange.totalGovernmentContributionPhilhealth,
      pagibig: cutoffDateRange.totalGovernmentContributionPagibig,
      tax: cutoffDateRange.totalGovernmentContributionTax,
      otherDeductions:
        cutoffDateRange.totalLoans +
        cutoffDateRange.totalDeductionSalaryAdjustmnt,
      netPay: cutoffDateRange.totalNetPay,
    });

    // Style totals row
    totalsRow.font = { bold: true };
    totalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFE0' },
    };

    // Format currency columns
    const currencyColumns = [
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
    ];
    currencyColumns.forEach((col) => {
      for (let row = 7; row <= worksheet.rowCount; row++) {
        const cell = worksheet.getCell(`${col}${row}`);
        if (cell.value !== null && cell.value !== undefined) {
          cell.numFmt = '#,##0.00';
        }
      }
    });

    // Add borders to all cells with data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 6) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
