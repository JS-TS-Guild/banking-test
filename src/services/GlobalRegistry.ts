import type BankAccount from "../models/bank-account";
import type Bank from "../models/bank";
import type User from "../models/user";

interface Service {
  // Define the properties and methods that a Service should have
  // For example:
  start(): void;
  stop(): void;
}

class GlobalRegistry {
  private static instance: GlobalRegistry;
  private services: Map<string, Service>;
  private static banks: Map<string, Bank> = new Map();
  private static accounts: Map<string, BankAccount> = new Map();
  private static users: Map<string, User> = new Map();

  private constructor() {
    this.services = new Map<string, Service>();
  }

  public static getInstance(): GlobalRegistry {
    if (!GlobalRegistry.instance) {
      GlobalRegistry.instance = new GlobalRegistry();
    }
    return GlobalRegistry.instance;
  }

  public registerService(name: string, service: Service): void {
    if (this.services.has(name)) {
      throw new Error(`Service with name ${name} is already registered.`);
    }
    this.services.set(name, service);
  }

  public getService(name: string): Service | undefined {
    return this.services.get(name);
  }

  public unregisterService(name: string): void {
    if (!this.services.has(name)) {
      throw new Error(`Service with name ${name} is not registered.`);
    }
    this.services.delete(name);
  }

  static registerBank(bank: Bank): void {
    GlobalRegistry.banks.set(bank.getId(), bank);
  }

  static registerAccount(account: BankAccount): void {
    GlobalRegistry.accounts.set(account.getId(), account);
  }

  static registerUser(user: User): void {
    GlobalRegistry.users.set(user.getId(), user);
  }

  static getBank(id: string): Bank | undefined {
    return GlobalRegistry.banks.get(id);
  }

  static getAccount(id: string): BankAccount | undefined {
    return GlobalRegistry.accounts.get(id);
  }

  static getUser(id: string): User | undefined {
    return GlobalRegistry.users.get(id);
  }

  static clear(): void {
    GlobalRegistry.banks.clear();
    GlobalRegistry.accounts.clear();
    GlobalRegistry.users.clear();
  }
}

export default GlobalRegistry;
