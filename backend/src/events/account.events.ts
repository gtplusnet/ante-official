export class AccountUpdatedEvent {
  constructor(
    public readonly accountId: string,
    public readonly updateType:
      | 'profile'
      | 'password'
      | 'deactivation'
      | 'restoration'
      | 'auth-methods',
    public readonly changedBy?: 'admin' | 'self',
    public readonly accountData?: any,
  ) {}
}

export class RoleUpdatedEvent {
  constructor(
    public readonly roleId: string,
    public readonly roleData?: any,
  ) {}
}
