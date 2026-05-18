import type { CounterpartyBankAccount } from './bank-account.types';

export type CounterpartyPartyType = 'person' | 'company';

export interface Counterparty {
  id: number;
  name: string;
  partyType: CounterpartyPartyType;
  companyName?: string | null;
  /** @deprecated — از bankAccounts استفاده کنید */
  accountNumber?: string | null;
  /** @deprecated */
  shebaNumber?: string | null;
  /** @deprecated */
  cardNumber?: string | null;
  bankAccounts?: CounterpartyBankAccount[];
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CounterpartyListResponse {
  items: Counterparty[];
  total: number;
  page: number;
  pageSize: number;
}
