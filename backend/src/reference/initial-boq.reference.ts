import { BoqInsertReferenceMethod } from '../interfaces/boq/boqInsertData';

export default [
  {
    description: 'Main Contract',
    inserReferenceId: null,
    insertReferenceMethod: BoqInsertReferenceMethod.BEFORE,
  },
  {
    description: 'General Requirements',
    inserReferenceId: 1,
    insertReferenceMethod: BoqInsertReferenceMethod.INSIDE,
  },
];
