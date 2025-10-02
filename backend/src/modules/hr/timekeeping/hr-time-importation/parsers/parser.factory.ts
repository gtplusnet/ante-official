import { Injectable } from '@nestjs/common';
import { BiometricModel } from '../../../../../shared/enums/biometric-model.enum';
import { BiometricParser } from './biometric-parser.interface';
import { ZKTecoAvignonParser } from './zkteco-avignon.parser';
import { DefaultLogParser } from './default-log.parser';

@Injectable()
export class BiometricParserFactory {
  private readonly parsers: Map<BiometricModel, BiometricParser>;

  constructor(
    private readonly zktecoAvignonParser: ZKTecoAvignonParser,
    private readonly defaultLogParser: DefaultLogParser,
  ) {
    this.parsers = new Map();
    this.parsers.set(BiometricModel.ZKTECO_AVIGNON, this.zktecoAvignonParser);
    this.parsers.set(BiometricModel.DEFAULT_LOG, this.defaultLogParser);
  }

  getParser(model: BiometricModel): BiometricParser | null {
    return this.parsers.get(model) || null;
  }

  isModelSupported(model: BiometricModel): boolean {
    return this.parsers.has(model);
  }

  getSupportedModels(): BiometricModel[] {
    return Array.from(this.parsers.keys());
  }
}
