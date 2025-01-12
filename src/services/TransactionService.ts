import type Bank from "@/models/bank";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class TransactionService {
  static transfer(
    senderBank: Bank,
    senderUserId: string,
    receiverBank: Bank,
    receiverUserId: string,
    amount: number
  ): void {
    const senderAccount = senderBank.getAccount(senderUserId);
    const receiverAccount = receiverBank.getAccount(receiverUserId);

    if (!senderAccount || !receiverAccount) {
      throw new Error("Account not found");
    }

    senderAccount.debit(amount);
    receiverAccount.credit(amount);
  }
}

export default TransactionService;
