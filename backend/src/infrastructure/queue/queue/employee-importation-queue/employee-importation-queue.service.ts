import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { QueueAbstract } from '../queue.abstract';
import { Queue, QueueLogs } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as ExcelJS from 'exceljs';

@Injectable()
export class EmployeeImportationQueueService extends QueueAbstract {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly prisma: PrismaService;

  async processPendingQueue(queueData: Queue): Promise<void> {
    const fileId = queueData.fileId;
    this.utilityService.log(
      'Processing of employee importation -- Queue #' +
        queueData.id +
        ' started. File ID for importation is ' +
        fileId +
        '.',
    );

    const file = await this.prisma.files.findUnique({
      where: {
        id: queueData.fileId,
      },
    });

    const excelPathURL = file.url;

    try {
      // Download the Excel file
      const response = await axios.get(excelPathURL, {
        responseType: 'arraybuffer',
      });
      const data = response.data;

      // Parse the Excel file using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0]; // Get the first sheet

      // Convert sheet to JSON
      const jsonData = [];
      const headers = [];

      // Get headers from the first row
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Process data rows
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        // Only add non-empty rows
        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      }

      const mappedExcelData = jsonData.map((row: any) => {
        return {
          id: row['Employee ID'],
          employeeId: row['Employee ID_1'],
          firstName: row['First Name'],
          lastName: row['Last Name'],
          middleName: row['Middle Name'],
          birthdate: row['Birthdate'],
          phone: row['Phone'],
          email: row['Email Address'],
          civilStatus: row['Civil Status'],
          sex: row['Sex'],
          street: row['Street'],
          city: row['City / Town'],
          province: row['State / Province'],
          postalCode: row['Postal Code'],
          zipCode: row['ZIP Code'],
          country: row['Country'],
          contactPerson: row['Contact Person'],
          contactPersonPhone: row['Contact Number'],
          isMinimumWage: row['Is Minimum Wage'] == 'True' ? true : false,
          monthlyRate: row['Monthly Rate'],
          effectivityDate: row['Effectivity Date'],
          startingDate: row['Starting Date'],
          endDate: row['End Date'],
          employmentStatus: row['Employment Status'],
          contractFilePath: row['Contract'],
          bankCode: row['Bank (Code)'],
          bankAccount: row['Bank Account'],
          branchCode: row['Branch (Code)'],
          position: row['Position'],
          departmentCode: row['Department (Code)'],
          payrollGroupCode: row['Payroll Group (Code)'],
          reportsTo: row['Reports To (Employee ID)'],
          userLevel: row['User Level'],
        };
      });

      // clear queue logs if any
      await this.prisma.queueLogs.deleteMany({
        where: {
          queueId: queueData.id,
        },
      });

      // Update queue data counts
      const totalCount = mappedExcelData.length;

      await this.prisma.queue.update({
        where: {
          id: queueData.id,
        },
        data: {
          totalCount: totalCount,
        },
      });

      // Create queue logs for each employee data
      await Promise.all(
        mappedExcelData.map(async (employeeData) => {
          const queueParamsLogs: Prisma.QueueLogsCreateInput = {
            queue: { connect: { id: queueData.id } },
            params: JSON.stringify(employeeData),
            message:
              'Processing employee data for ID: ' + employeeData.employeeId,
          };

          await this.prisma.queueLogs.create({
            data: queueParamsLogs,
          });
        }),
      );
    } catch (error) {
      throw new BadRequestException(
        'Error processing the Excel file: ' + error.message,
      );
    }

    this.utilityService.log(
      'Processing of employee importation -- Queue #' +
        queueData.id +
        ' finished',
    );
  }
  async processQueueLog(queueLog: QueueLogs): Promise<void> {
    const params = JSON.parse(queueLog.params.toString());
    const employeeId = params.employeeId;
    this.utilityService.log('Processing employee data for ID: ' + employeeId);
  }
}
