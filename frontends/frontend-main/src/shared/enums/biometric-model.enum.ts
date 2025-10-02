export enum BiometricModel {
  AI_SMART = 'ai-smart',
  ZKTECO_AVIGNON = 'zkteco-avignon',
  DEFAULT_LOG = 'default-log',
}

export const BiometricModelInfo = {
  [BiometricModel.AI_SMART]: {
    label: 'AI Smart Import',
    description: 'Uses AI to intelligently extract time data from any format',
    icon: 'smart_toy',
    color: 'primary',
    acceptedFormats: '.jpg,.jpeg,.png,.gif,.bmp,.xlsx,.xls,.csv,.pdf',
    formatText: 'Images, Excel, CSV, PDF',
  },
  [BiometricModel.ZKTECO_AVIGNON]: {
    label: 'ZKTeco Avignon',
    description: 'Import from ZKTeco Avignon biometric device',
    icon: 'fingerprint',
    color: 'secondary',
    acceptedFormats: '.xlsx,.xls',
    formatText: 'Excel files only',
  },
  [BiometricModel.DEFAULT_LOG]: {
    label: 'Default Log Importation',
    description: 'Import timekeeping logs from standard Excel format',
    icon: 'upload_file',
    color: 'accent',
    acceptedFormats: '.xlsx,.xls',
    formatText: 'Excel files only',
  },
};
