import { BoqInformationInterface } from './boqInformation.interface';
import { BoqItemInterface } from './boqItem.interface';

export interface BoqRoomInterface {
  boqInformation: BoqInformationInterface;
  boqItems: BoqItemInterface[];
  boqTotal: number;
  boqTotalWithProfit: number;
}
