export type UserId = string;
export type BankId = string;
export type BankAccountId = string;

export interface BankOptions {
  isNegativeAllowed?: boolean;
}

export interface TransferOptions {
  targetBankId?: BankId;
}
