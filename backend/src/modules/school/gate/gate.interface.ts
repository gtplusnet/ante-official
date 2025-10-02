import {
  ICreateGateRequest,
  IUpdateGateRequest,
  IDeleteGateRequest,
  IGateTableRequest,
} from '@shared/request/gate.request';

export interface IGate {
  id: string;
  gateName: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface ICreateGate extends ICreateGateRequest {}

export interface IUpdateGate extends IUpdateGateRequest {}

export interface IDeleteGate extends IDeleteGateRequest {}

export interface IGateTable extends IGateTableRequest {}
