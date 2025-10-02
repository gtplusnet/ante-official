export interface BoardLaneInterface {
  id: number;
  name: string;
  description: string;
  order: number;
  key?: string;
}

export interface BoardLaneResponseInterface {
  id: number;
  order: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isDefault: boolean;
}
