import { Injectable } from '@nestjs/common';
import { ImportTimeFromImageDTO } from './import-time-from-image.dto';
import {
  ImportTimeFromImageResponse,
  ImportTimeFromImageGeminiResponse,
} from '../../../../shared/response/import-time-from-image.response';
import { AiChatService } from '@integrations/ai-chat/ai-chat/ai-chat.service';
import { OpenAIUserMessage } from '@integrations/ai-chat/providers/openai/openai.service';
import * as sharp from 'sharp';
import { FileType, FileTypeDetector } from './utils/file-type.detector';
import { ExcelConverter } from './utils/excel.converter';
import { CsvConverter } from './utils/csv.converter';
import { PdfConverter } from './utils/pdf.converter';
import { BiometricModel } from '../../../../shared/enums/biometric-model.enum';
import { BiometricParserFactory } from './parsers/parser.factory';
import { EmployeeValidationService } from './services/employee-validation.service';

@Injectable()
export class HrTimeImportationService {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly parserFactory: BiometricParserFactory,
    private readonly employeeValidationService: EmployeeValidationService,
  ) {}

  async importTimeFromImage(
    dto: ImportTimeFromImageDTO,
  ): Promise<ImportTimeFromImageResponse> {
    let response: ImportTimeFromImageResponse;

    // Check if a specific biometric model is selected (not AI)
    if (dto.importMethod && dto.importMethod !== BiometricModel.AI_SMART) {
      const parser = this.parserFactory.getParser(dto.importMethod);
      if (parser) {
        response = await parser.parse(dto.imageData, dto.fileName, dto.remarks);
      } else {
        return {
          status: 'Error',
          remarks: `Parser for ${dto.importMethod} is not available.`,
          logs: [],
        };
      }
    } else {
      // Default to AI processing
      // Detect file type
      const fileType = dto.fileName
        ? FileTypeDetector.detectFromFileName(dto.fileName)
        : FileTypeDetector.detectFromBase64(dto.imageData);

      let contentForAI: string;
      let prompt: string;

      switch (fileType) {
        case FileType.IMAGE:
          // Resize image to 800x800 before sending to OpenAI
          const resizedBase64 = await this.resizeBase64Image(
            dto.imageData,
            800,
            800,
          );
          response = await this.processImageWithAI(resizedBase64, dto.remarks);
          break;

        case FileType.EXCEL:
          contentForAI = await ExcelConverter.convertToText(dto.imageData);
          prompt = `Extract timekeeping logs from this Excel data. The user said: "${dto.remarks}"`;
          response = await this.processTextWithAI(
            contentForAI,
            prompt,
            dto.remarks,
          );
          break;

        case FileType.CSV:
          contentForAI = await CsvConverter.convertToText(dto.imageData);
          prompt = `Extract timekeeping logs from this CSV data. The user said: "${dto.remarks}"`;
          response = await this.processTextWithAI(
            contentForAI,
            prompt,
            dto.remarks,
          );
          break;

        case FileType.PDF:
          contentForAI = await PdfConverter.convertToText(dto.imageData);
          prompt = `Extract timekeeping logs from this PDF text. The user said: "${dto.remarks}"`;
          response = await this.processTextWithAI(
            contentForAI,
            prompt,
            dto.remarks,
          );
          break;

        default:
          return {
            status: 'Error',
            remarks:
              'Unsupported file type. Please upload an image, Excel, CSV, or PDF file.',
            logs: [],
          };
      }
    }

    // Validate employee logs
    if (response.status === 'Complete' && response.logs.length > 0) {
      const validation =
        await this.employeeValidationService.validateEmployeeLogs(
          response.logs,
        );

      // Update response with validation results
      response.logs = [...validation.validLogs, ...validation.invalidLogs];
      response.validationErrors = validation.validationErrors;

      // Update status if there are validation errors
      if (validation.invalidLogs.length > 0) {
        response.status = 'Validation Error';
        const summary =
          await this.employeeValidationService.getValidationSummary(
            response.logs,
          );
        response.remarks = `${response.remarks}. ${summary}`;
      }
    }

    return response;
  }

  private async processImageWithAI(
    resizedBase64: string,
    remarks: string,
  ): Promise<ImportTimeFromImageResponse> {
    const prompt = `Extract timekeeping logs from this. The user said: "${remarks}"`;
    const instructions = `You are an expert at extracting timekeeping data from images and remarks. The user has uploaded an image (base64 below) and provided remarks. Your job is to extract the following information from the image and remarks:

Return ONLY a valid JSON object in this format:
{
  "status": "success" | "error",
  "remarks": "",
  "logs": [
    {
      "employeeId": "Number or String (id) of the employee",
      "timeIn": "YYYY-MM-DD  hh:mm AM/PM",
      "timeOut": "YYYY-MM-DD hh:mm AM/PM",
      "remarks": "<any remarks about the log>"
    }
  ]
}

- If you cannot determine any required field for any log, respond with status: "error" and a remarks string explaining why. You can state details that you've successfully extracted in the remarks. If you are unsure about the timeIn or timeOut, you can add remarks.
- The image is base64 encoded. If you cannot read it, respond with status: "error" and a remarks string.`;

    // Get the OpenAI provider directly for image processing
    const openaiProvider = this.aiChatService.getProvider('openai');
    if (!openaiProvider) {
      throw new Error('OpenAI provider not available');
    }

    // Use the OpenAI service directly with proper image support
    const messages: OpenAIUserMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'text', text: instructions },
          { type: 'image_url', image_url: { url: resizedBase64 } },
        ],
      },
    ];

    const openaiResponseRaw = await (openaiProvider as any).askOpenAI(messages);
    return this.parseAIResponse(openaiResponseRaw);
  }

  private async processTextWithAI(
    content: string,
    prompt: string,
    remarks: string,
  ): Promise<ImportTimeFromImageResponse> {
    const instructions = `You are an expert at extracting timekeeping data from structured data files. The user has uploaded a file and provided remarks. Your job is to extract timekeeping information.

File content:
${content}

Return ONLY a valid JSON object in this format:
{
  "status": "success" | "error",
  "remarks": "",
  "logs": [
    {
      "employeeId": "Number or String (id) of the employee",
      "timeIn": "YYYY-MM-DD  hh:mm AM/PM",
      "timeOut": "YYYY-MM-DD hh:mm AM/PM",
      "remarks": "<any remarks about the log>"
    }
  ]
}

- Look for employee IDs, dates, and time entries in the data
- Time entries might be in various formats (24-hour, 12-hour, etc.)
- If you cannot determine required fields, respond with status: "error" and explain in remarks
- Consider the user's remarks: "${remarks}" when interpreting the data`;

    // Get the OpenAI provider
    const openaiProvider = this.aiChatService.getProvider('openai');
    if (!openaiProvider) {
      throw new Error('OpenAI provider not available');
    }

    // Use text-based message for non-image files
    const messages: OpenAIUserMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'text', text: instructions },
        ],
      },
    ];

    const openaiResponseRaw = await (openaiProvider as any).askOpenAI(messages);
    return this.parseAIResponse(openaiResponseRaw);
  }

  private parseAIResponse(
    openaiResponseRaw: string,
  ): ImportTimeFromImageResponse {
    let openaiResponse: ImportTimeFromImageGeminiResponse | null = null;
    try {
      // Remove code block markers if present
      const cleaned = openaiResponseRaw
        .replace(/```json/i, '')
        .replace(/```/g, '')
        .trim();
      openaiResponse = JSON.parse(cleaned) as ImportTimeFromImageGeminiResponse;
    } catch (e) {
      console.error(
        'Failed to parse OpenAI response as JSON:',
        openaiResponseRaw,
      );
      return {
        status: 'Error',
        remarks: 'Failed to parse AI response',
        logs: [],
      };
    }

    console.log('OpenAI response:', openaiResponse);

    if (openaiResponse.status === 'error') {
      return {
        status: 'Error',
        remarks: openaiResponse.remarks,
        logs: [],
      };
    } else {
      return {
        status: 'Complete',
        remarks: openaiResponse.remarks,
        logs: openaiResponse.logs,
      };
    }
  }

  /**
   * Resizes a base64 image string to the given width and height using sharp.
   * Handles both data URL and plain base64.
   */
  private async resizeBase64Image(
    base64: string,
    width: number,
    height: number,
  ): Promise<string> {
    // Extract base64 data (remove data URL prefix if present)
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const imageBuffer = Buffer.from(matches ? matches[2] : base64, 'base64');
    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: 'inside' })
      .jpeg({ quality: 70 }) // Optimize as JPEG
      .toBuffer();
    const mimeType = 'image/jpeg';
    return `data:${mimeType};base64,${resizedBuffer.toString('base64')}`;
  }
}
