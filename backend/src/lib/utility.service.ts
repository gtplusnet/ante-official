import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { randomBytes } from 'crypto';
import configReference from '../reference/config.reference';
import * as moment from 'moment-timezone';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  CurrencyFormat,
  DateFormat,
  HoursFormat,
  PercentageFormat,
  TimeFormat,
} from 'src/shared/response';
import { Logger } from 'winston';
import { Response } from 'express';
import { AccountSocketDataInterface } from '@modules/communication/socket/socket/socket.interface';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';

@Injectable()
export class UtilityService {
  @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger;
  @Inject() private telegramService: TelegramService;
  public accountInformation: AccountSocketDataInterface = null;
  public companyId: number = null;
  constructor() {}

  log(data: any) {
    this.logger.info(data);
  }

  error(data: any) {
    this.logger.error(data);
  }

  setAccountInformation(accountInformation: AccountSocketDataInterface) {
    this.accountInformation = accountInformation;
    this.companyId = accountInformation.company?.id || 1;
  }

  clearContext() {
    this.accountInformation = null;
    this.companyId = null;
    this.logger.info('Cleared user context for system task execution');
  }
  randomString() {
    return randomBytes(20).toString('hex');
  }
  formatFileSize(size: number) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let unitIndex = 0;

    while (size > 1024) {
      size = size / 1024;
      unitIndex++;
    }

    return size.toFixed(2) + ' ' + units[unitIndex];
  }
  convertToRoman(order: number): string {
    const roman = [
      'I',
      'IV',
      'V',
      'IX',
      'X',
      'XL',
      'L',
      'XC',
      'C',
      'CD',
      'D',
      'CM',
      'M',
    ];
    const values = [1, 4, 5, 9, 10, 40, 50, 90, 100, 400, 500, 900, 1000];
    let result = '';
    for (let i = values.length - 1; i >= 0; i--) {
      while (order >= values[i]) {
        result += roman[i];
        order -= values[i];
      }
    }
    return result;
  }
  formatHours(hours: number): HoursFormat {
    const raw = Number(hours);
    const hoursValue = Math.floor(hours);
    const minutesValue = Math.round((hours - hoursValue) * 60);

    // format hours and minutes 00:00
    const formattedHoursMinutes =
      hoursValue.toString().padStart(2, '0') +
      ':' +
      minutesValue.toString().padStart(2, '0');
    const totalMinutes = hoursValue * 60 + minutesValue;

    return {
      raw,
      formatted: formattedHoursMinutes,
      hours: hoursValue,
      minutes: minutesValue,
      totalMinutes,
    };
  }
  manilaToUTC(dateInput: string | Date): Date {
    return moment.tz(dateInput, 'Asia/Manila').utc().toDate();
  }
  getDayOfWeek(dateValue: Date): string {
    const dayOfWeek = moment(dateValue).format('dddd');
    return dayOfWeek;
  }
  formatTime(timeValue: string): TimeFormat {
    // check if time is invalid then response 00:00
    if (!moment(timeValue, 'HH:mm').isValid()) {
      return { time: '00:00', raw: '00:00', hours: 0, minutes: 0, seconds: 0 };
    }

    // the value of timeValue is is "HH:MM" conver this to other formats.
    const time = moment(timeValue, 'HH:mm').format('hh:mm A');
    const raw = timeValue;
    const hours = moment(timeValue, 'HH:mm').diff(
      moment().startOf('day'),
      'hours',
      true,
    );
    const minutes = moment(timeValue, 'HH:mm').diff(
      moment().startOf('day'),
      'minutes',
    );
    const seconds = moment(timeValue, 'HH:mm').diff(
      moment().startOf('day'),
      'seconds',
    );

    return { time, raw, hours, minutes, seconds };
  }
  currentDate() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
  }
  formatDate(dateValue: string | Date): DateFormat {
    const dateTime = moment(dateValue).format('MM/DD/YYYY (hh:mm A)');
    const dateStandard = moment(dateValue).format('YYYY-MM-DD');
    const time = moment(dateValue).format('hh:mm A');
    const time24 = moment(dateValue).format('HH:mm');
    const date = moment(dateValue).format('MM/DD/YYYY');
    const dateFull = moment(dateValue).format('MMMM D, YYYY');
    const timeAgo = moment(dateValue).fromNow();
    const day = moment(dateValue).format('dddd');
    const daySmall = moment(dateValue).format('ddd');
    const raw = this.manilaToUTC(dateValue);

    // Check if date is invalid
    if (!moment(dateValue).isValid()) {
      return {
        dateTime: '-',
        time: '-',
        time24: '-',
        date: '-',
        dateFull: '-',
        dateStandard: '-',
        raw: null,
        timeAgo: '-',
        day: '-',
        daySmall: '-',
      };
    }

    return {
      dateTime,
      time,
      time24,
      date,
      dateFull,
      dateStandard,
      raw,
      timeAgo,
      day,
      daySmall,
    };
  }
  formatPercentage(dataValue: number, decimal = 2): PercentageFormat {
    const formatPercentage = (dataValue * 100).toFixed(decimal) + '%';
    const formatNumber = (dataValue * 100).toFixed(decimal);
    const raw = dataValue;
    return { formatPercentage, formatNumber, raw };
  }
  formatNumber(dataValue: number, decimal = 0): number {
    return Number(Number(dataValue).toFixed(decimal));
  }
  formatQuantity(dataValue: number): number {
    return Number(dataValue);
  }
  getHowManyDayPerYear(day = 'monday', date: Date): number {
    const year = moment(date).year();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    const days = [];
    for (
      let date = startDate;
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayMap = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };
      if (date.getDay() === dayMap[day.toLowerCase()]) {
        days.push(new Date(date));
      }
    }

    return days.length;
  }
  formatCurrency(dataValue: number): CurrencyFormat {
    const formatCurrency =
      configReference.currency.prefix +
      ' ' +
      dataValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatName = configReference.currency.name;
    const formatNumber = dataValue
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const raw = Number(dataValue);
    return { formatName, formatCurrency, formatNumber, raw };
  }
  async responseHandler(promise: Promise<any>, response: Response) {
    try {
      const data = await promise;
      return response.status(HttpStatus.OK).json(data);
    } catch (error) {
      return this.errorResponse(response, error, error.message);
    }
  }
  async handleResponse(
    promise: Promise<any>,
    response: Response,
    successMessage: string,
  ) {
    try {
      const data = await promise;
      return response
        .status(HttpStatus.OK)
        .json({ message: successMessage, data });
    } catch (error) {
      return this.errorResponse(response, error, error.message);
    }
  }
  capitalizeFirstLetter(string: string) {
    if (!string) {
      return '';
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  errorResponse(response, err: any, message: string) {
    if (
      err instanceof NotFoundException ||
      err instanceof ForbiddenException ||
      err instanceof BadRequestException
    ) {
      console.log(err.stack);
    } else {
      this.error(err.stack);
      const requestBody = response.req.body;
      const requestQuery = response.req.query;
      const requestParams = response.req.params;
      const requestIp = response.req.ip;
      const requestMethod = response.req.method;
      const requestUrl = response.req.url;
      const message = `An error has occurred in <b>${process.env.SERVER_NAME}</b><pre>${err.stack}</pre>\n\nRequest Body: <pre>${JSON.stringify(requestBody, null, 2)}</pre>\n\nRequest Query: <pre>${JSON.stringify(requestQuery, null, 2)}</pre>\n\nRequest Params: <pre>${JSON.stringify(requestParams, null, 2)}</pre>\n\nRequest IP: <b>${requestIp}</b>\n\nRequest Method: <b>${requestMethod}</b>\n\nRequest URL: <b>${requestUrl}</b>`;

      this.telegramService.sendMessage(message, true);
    }

    let errorMessage = err.message || null;
    let errorCode = 0;

    err.hasOwnProperty('response')
      ? (errorMessage = err.response.message)
      : null;
    err.hasOwnProperty('meta') ? (errorMessage = err.meta.cause) : null;
    errorCode = err.hasOwnProperty('code') ? err.code : 0;

    return response.status(HttpStatus.BAD_REQUEST).json({
      message,
      errorMessage,
      errorCode,
      error: 'Bad Request',
    });
  }
}
