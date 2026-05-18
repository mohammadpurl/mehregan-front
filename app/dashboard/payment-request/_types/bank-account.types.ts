export interface BankAccountDetail {
  label?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  shebaNumber?: string | null;
  cardNumber?: string | null;
}

export interface CompanyBankAccount extends BankAccountDetail {
  id: number;
  label: string;
  bankName: string;
  isDefault: boolean;
}

export interface CounterpartyBankAccount extends BankAccountDetail {
  id: number;
  counterpartyId?: number;
  isDefault?: boolean;
}

export interface CompanyBankAccountListResponse {
  items: CompanyBankAccount[];
  total?: number;
}
