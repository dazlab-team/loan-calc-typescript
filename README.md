# loan-calc-typescript
Loan calculator written in TypeScript. 
OO interface. 
ARM (Adjustable Rate Mortgage) options.
Interest only repayments. 
Extra payments option.

## Installation

```
npm install @dazlab-team/loan-calc
```

## Usage examples

### Basic usage

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```

### Extra monthly payments

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;
loan.extraPayment = 1000;

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```

### Interest only repayments

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;
loan.interestOnlyYears = 3;

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```

### ARM

Please note that the trivial ARM rate calculation strategy is implemented at the
moment which implies increasing the initial variable rate by fixed percentage each
N months (N=12 by default).

Here's an example:   

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;

loan.armInitialVariableRate = 1.86;
loan.armMaximumInterestRate = 3.56;
loan.armExpectedAdjustmentRate = 0.25;
loan.armMonthsBetweenAdjustments = 12;
loan.armFixedRateForYears = 1;

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```

### Rounding

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;
loan.rounding = 0; // means to calculate numbers with no fraction part

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```

### Repayment frequency

```typescript
import {Loan} from '@dazlab-team/loan-calc';

let loan = new Loan();
loan.amount = 800000;
loan.years = 25;
loan.interestRate = 2.56;
loan.repaymentFrequency = 'fortnightly';

console.log(loan.totalCost);
console.log(loan.totalInterest);
console.dir(loan.payments);
```
