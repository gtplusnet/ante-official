export interface ICreateGateRequest {
  gateName: string;
}

export interface IUpdateGateRequest {
  id: string;
  gateName: string;
}

export interface IDeleteGateRequest {
  ids: string[];
}

export interface IGateTableRequest {
  search?: string;
}
