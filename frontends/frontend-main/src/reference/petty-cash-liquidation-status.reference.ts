interface LiquidationStatus {
  label: string;
  key: string;
  color: string;
  textColor: string;
  nextStage?: string;
  nextStageLabel?: string;
  isInitial?: boolean;
  isFinal?: boolean;
}

const pettyCashLiquidationStatusReference: LiquidationStatus[] = [
  {
    label: 'Pending Review',
    key: 'PENDING',
    color: '#FFA726',
    textColor: 'white',
    nextStage: 'APPROVED,REJECTED',
    nextStageLabel: 'Approved,Rejected',
    isInitial: true,
    isFinal: false,
  },
  {
    label: 'Approved',
    key: 'APPROVED',
    color: '#66BB6A',
    textColor: 'white',
    isInitial: false,
    isFinal: true,
  },
  {
    label: 'Rejected',
    key: 'REJECTED',
    color: '#EF5350',
    textColor: 'white',
    isInitial: false,
    isFinal: true,
  },
];

export default pettyCashLiquidationStatusReference;