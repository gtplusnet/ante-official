import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  forwardRef,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { Prisma, PayrollGroup } from '@prisma/client';
import {
  OvertimeRateFactors,
  PayrollConfigurationUpdateDTO,
} from './payroll-group-configuration.interface';
import { ShiftConfigurationService } from '../shift-configuration/shift-configuration.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { CutoffConfigurationService } from '../cutoff-configuration/cutoff-configuration.service';
import SalaryRateTypeReference from '../../../../reference/salary-rate-type.reference';
import DeductionPeriodReferenceInterface from '../../../../reference/deduction-period.reference';
import DeductionTypeReferenceInterface from '../../../../reference/deduction-type.reference';
import DeductionTimeBasisInterface from '../../../../reference/deduction-time-basis.reference';
import OvertimeRateFactorsReference from '../../../../reference/overtime-rate-factors.reference';
import DeductionBasisReferenceInterface from '../../../../reference/deduction-basis.reference';
import { PayrollGroupDataResponse } from '../../../../shared/response/payroll-group.response';

@Injectable()
export class PayrollGroupConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public shiftConfigurationService: ShiftConfigurationService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject(forwardRef(() => CutoffConfigurationService))
  public cutoffConfigurationService: CutoffConfigurationService;

  async getOvertimeDefaultRateFactors(): Promise<OvertimeRateFactors> {
    return OvertimeRateFactorsReference;
  }

  async getPayrollGroupList() {
    const payrollGroups = await this.prisma.payrollGroup.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
      },
      select: {
        id: true,
        payrollGroupCode: true,
      },
    });

    // Sort case-insensitively in JavaScript
    return payrollGroups
      .map(group => ({
        label: group.payrollGroupCode,
        value: group.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }

  async getInfo(id: number): Promise<PayrollGroupDataResponse> {
    id = Number(id);

    if (!id) {
      throw new BadRequestException('Invalid ID.');
    }

    const payrollGroup = await this.prisma.payrollGroup.findUnique({
      where: { id: id },
    });

    if (!payrollGroup) {
      throw new NotFoundException('Payroll group not found.');
    }

    const formattedResponse: PayrollGroupDataResponse =
      await this.formatResponse(payrollGroup);
    return formattedResponse;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'payrollGroup');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['include'] = { cutoff: true };
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
      isDeleted: false,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.payrollGroup,
      query,
      tableQuery,
    );
    const formattedList = await Promise.all(
      baseList.map(async (payrollGroup: PayrollGroup) => {
        return await this.formatResponse(payrollGroup);
      }),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async create(
    params: PayrollConfigurationUpdateDTO,
  ): Promise<PayrollGroupDataResponse> {
    const payrollGroupInsert: Prisma.PayrollGroupCreateInput = {
      payrollGroupCode: params.payrollGroupCode,
      cutoff: { connect: { id: params.cutoffId } },
      salaryRateType: params.salaryRateType,
      deductionPeriodWitholdingTax: params.deductionPeriodWitholdingTax,
      deductionPeriodSSS: params.deductionPeriodSSS,
      deductionPeriodPhilhealth: params.deductionPeriodPhilhealth,
      deductionPeriodPagibig: params.deductionPeriodPagibig,
      deductionBasisPhilhealth: params.deductionBasisPhilhealth,
      deductionBasisSSS: params.deductionBasisSSS,
      lateDeductionType: params.lateDeductionType,
      lateDeductionCustom: JSON.stringify(
        params.lateDeductionCustom ? params.lateDeductionCustom : null,
      ),
      undertimeDeductionType: params.undertimeDeductionType,
      undertimeDeductionCustom: JSON.stringify(
        params.undertimeDeductionCustom
          ? params.undertimeDeductionCustom
          : null,
      ),
      absentDeductionHours: params.absentDeductionHours,
      shiftingWorkingDaysPerWeek: params.shiftingWorkingDaysPerWeek,
      lateGraceTimeMinutes: params.lateGraceTimeMinutes,
      undertimeGraceTimeMinutes: params.undertimeGraceTimeMinutes,
      overtimeGraceTimeMinutes: params.overtimeGraceTimeMinutes,
      overtimeRateFactors: JSON.stringify(params.overtimeRateFactors),
      company: { connect: { id: this.utilityService.companyId } },
    };

    let response;

    // Check if ID is present, if present, update the record, else, create a new record
    if (params.id) {
      delete payrollGroupInsert.payrollGroupCode;
      response = await this.prisma.payrollGroup.update({
        where: { id: params.id },
        data: payrollGroupInsert,
      });
    } else {
      response = await this.prisma.payrollGroup.create({
        data: payrollGroupInsert,
      });
    }

    const formattedResponse: PayrollGroupDataResponse =
      await this.formatResponse(response);

    return formattedResponse;
  }

  async deletePayrollGroup(id: number) {
    id = Number(id);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid ID.');
    }
    const payrollGroup = await this.prisma.payrollGroup.findUnique({
      where: { id },
    });
    if (!payrollGroup) {
      throw new NotFoundException('Payroll group not found.');
    }

    const employee = await this.prisma.employeeData.findFirst({
      where: {
        payrollGroupId: id,
      },
    });

    if (employee) {
      throw new ConflictException(
        'Cannot delete payroll group. Payroll group is being used by employee.',
      );
    }

    await this.prisma.payrollGroup.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  async formatResponse(
    payrollGroup: PayrollGroup,
  ): Promise<PayrollGroupDataResponse> {
    const cutoffInformation = await this.cutoffConfigurationService.info(
      payrollGroup.cutoffId,
    );

    const lateDeductionCustom = payrollGroup.lateDeductionCustom
      ? JSON.parse(payrollGroup.lateDeductionCustom.toString())
      : null;
    const undertimeDeductionCustom = payrollGroup.undertimeDeductionCustom
      ? JSON.parse(payrollGroup.undertimeDeductionCustom.toString())
      : null;

    if (
      lateDeductionCustom &&
      lateDeductionCustom.hasOwnProperty('timeBasis')
    ) {
      lateDeductionCustom.timeBasis = await DeductionTimeBasisInterface.find(
        (timeBasis) => timeBasis.key == lateDeductionCustom.timeBasis,
      );
    }

    if (
      undertimeDeductionCustom &&
      undertimeDeductionCustom.hasOwnProperty('timeBasis')
    ) {
      undertimeDeductionCustom.timeBasis =
        await DeductionTimeBasisInterface.find(
          (timeBasis) => timeBasis.key == undertimeDeductionCustom.timeBasis,
        );
    }

    const formattedResponse: PayrollGroupDataResponse = {
      id: payrollGroup.id,
      payrollGroupCode: payrollGroup.payrollGroupCode,
      cutoff: cutoffInformation,
      salaryRateType: SalaryRateTypeReference.find(
        (salaryRateType) => salaryRateType.key === payrollGroup.salaryRateType,
      ),
      deductionPeriodWitholdingTax: DeductionPeriodReferenceInterface.find(
        (deductionBasisWitholdingTax) =>
          deductionBasisWitholdingTax.key ===
          payrollGroup.deductionPeriodWitholdingTax,
      ),
      deductionPeriodSSS: DeductionPeriodReferenceInterface.find(
        (deductionPeriodSSS) =>
          deductionPeriodSSS.key === payrollGroup.deductionPeriodSSS,
      ),
      deductionPeriodPhilhealth: DeductionPeriodReferenceInterface.find(
        (deductionPeriodPhilhealth) =>
          deductionPeriodPhilhealth.key ===
          payrollGroup.deductionPeriodPhilhealth,
      ),
      deductionPeriodPagibig: DeductionPeriodReferenceInterface.find(
        (deductionPeriodPagibig) =>
          deductionPeriodPagibig.key === payrollGroup.deductionPeriodPagibig,
      ),
      deductionBasisPhilhealth: DeductionBasisReferenceInterface.find(
        (deductionBasisPhilhealth) =>
          deductionBasisPhilhealth.key ===
          payrollGroup.deductionBasisPhilhealth,
      ),
      deductionBasisSSS: DeductionBasisReferenceInterface.find(
        (deductionBasisSSS) =>
          deductionBasisSSS.key === payrollGroup.deductionBasisSSS,
      ),
      lateDeductionType: DeductionTypeReferenceInterface.find(
        (lateDeductionType) =>
          lateDeductionType.key === payrollGroup.lateDeductionType,
      ),
      lateDeductionCustom: lateDeductionCustom,
      undertimeDeductionType: DeductionTypeReferenceInterface.find(
        (undertimeDeductionType) =>
          undertimeDeductionType.key === payrollGroup.undertimeDeductionType,
      ),
      undertimeDeductionCustom: undertimeDeductionCustom,
      absentDeductionHours: payrollGroup.absentDeductionHours,
      shiftingWorkingDaysPerWeek: payrollGroup.shiftingWorkingDaysPerWeek,
      lateGraceTimeMinutes: payrollGroup.lateGraceTimeMinutes,
      undertimeGraceTimeMinutes: payrollGroup.undertimeGraceTimeMinutes,
      overtimeGraceTimeMinutes: payrollGroup.overtimeGraceTimeMinutes,
      overtimeRateFactors: JSON.parse(
        payrollGroup.overtimeRateFactors.toString(),
      ),
    };

    return formattedResponse;
  }
}
