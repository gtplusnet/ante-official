export class CompanyCreatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly companyName: string,
    public readonly companyData?: any,
  ) {}
}

export class CompanyUpdatedEvent {
  constructor(
    public readonly companyId: number,
    public readonly companyName: string,
    public readonly updatedFields?: string[],
    public readonly companyData?: any,
  ) {}
}

export class CompanyDeletedEvent {
  constructor(
    public readonly companyId: number,
    public readonly companyName: string,
  ) {}
}
