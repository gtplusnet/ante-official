export enum BiometricModel {
  AI_SMART = 'ai-smart',
  ZKTECO_AVIGNON = 'zkteco-avignon',
  // Future models can be added here
  // ZKTECO_K40 = 'zkteco-k40',
  // SUPREMA_BIOSTATION = 'suprema-biostation',
  // ANVIZ_T5 = 'anviz-t5',
}

export const BiometricModelLabels = {
  [BiometricModel.AI_SMART]: 'AI Smart Import',
  [BiometricModel.ZKTECO_AVIGNON]: 'ZKTeco Avignon',
};

export const BiometricModelDescriptions = {
  [BiometricModel.AI_SMART]:
    'Uses AI to intelligently extract time data from any format (images, Excel, CSV, PDF)',
  [BiometricModel.ZKTECO_AVIGNON]:
    'Specific parser for ZKTeco Avignon biometric device Excel exports',
};

export const BiometricModelFileTypes = {
  [BiometricModel.AI_SMART]: ['image', 'excel', 'csv', 'pdf'],
  [BiometricModel.ZKTECO_AVIGNON]: ['excel'],
};
