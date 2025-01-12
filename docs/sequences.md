# sequences

<!-- Section break -->
<div style="margin: 2em 0;"></div>

## Transfer Money

<!-- Diagram description -->

_This diagram shows the flow of money transfer between accounts_

```mermaid
sequenceDiagram
participant C as Client
participant B as Bank
participant GR as GlobalRegistry
participant SA as Source Account
participant TA as Target Account

    C->>B: send(fromUserId, toUserId, amount)
    B->>GR: getUser(fromUserId)
    GR-->>B: User
    B->>B: findUserAccount(fromUserId)
    B->>GR: getUser(toUserId)
    GR-->>B: User
    B->>B: findUserAccountInBank(toUserId)

    B->>SA: debit(amount)
    alt Insufficient Funds
        SA-->>B: throw InsufficientFundsError
        B-->>C: throw Error
    else Success
        SA-->>B: ok
        B->>TA: credit(amount)
        TA-->>B: ok
        B-->>C: ok
    end

    SA->>SA: recordTransaction("debit")
    TA->>TA: recordTransaction("credit")
```

<!-- Section break -->
<div style="margin: 2em 0;"></div>

## Account Creation

<!-- Diagram description -->

_This diagram illustrates the account creation process_

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Bank
    participant BA as BankAccount
    participant GR as GlobalRegistry
    participant U as User

    C->>B: createAccount(initialBalance)

    alt Negative Balance Not Allowed
        B->>B: check isNegativeAllowed
    end

    B->>BA: create(balance, isNegativeAllowed)
    BA->>BA: generate id
    BA->>GR: registerAccount(account)
    GR-->>BA: ok
    BA-->>B: new BankAccount

    B->>B: accounts.set(account.getId(), account)
    B-->>C: BankAccount

    C->>U: addAccount(accountId)
    U->>GR: getAccount(accountId)
    GR-->>U: BankAccount
    U->>U: accountIds.add(accountId)
    U-->>C: ok
```

<!-- Section break -->
<div style="margin: 2em 0;"></div>

# Multi-Account Transfer

<!-- Diagram description -->

_This diagram illustrates the account creation process_

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Bank
    participant GR as GlobalRegistry
    participant SA1 as Source Account 1
    participant SA2 as Source Account 2
    participant TA as Target Account

    C->>B: send(fromUserId, toUserId, amount)
    B->>GR: getUser(fromUserId)
    GR-->>B: User

    B->>B: findUserAccounts(fromUserId)
    Note over B: Get accounts in priority order

    B->>SA1: canDebit(amount)
    alt Can fulfill from first account
        SA1-->>B: true
        B->>SA1: debit(amount)
        B->>TA: credit(amount)
    else Need multiple accounts
        SA1-->>B: false
        B->>SA1: getBalance()
        SA1-->>B: balance
        B->>SA1: debit(balance)
        B->>TA: credit(balance)

        B->>SA2: canDebit(remainingAmount)
        SA2-->>B: true
        B->>SA2: debit(remainingAmount)
        B->>TA: credit(remainingAmount)
    end

    SA1->>SA1: recordTransaction
    SA2->>SA2: recordTransaction
    TA->>TA: recordTransaction

    B-->>C: ok
```
