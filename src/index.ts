export type RepaymentFrequency = 'yearly' | 'quarterly' | 'monthly' | 'fortnightly' | 'weekly';

export interface LoanPayment {
    /**
     * Payment amount.
     */
    amount: number;

    /**
     * Principal part.
     */
    principal: number;

    /**
     * Interest payment part.
     */
    interest: number;

    /**
     * Remaining balance.
     */
    balance: number;
}

export interface LoanInterface {

    // Adjustable properties

    /**
     * Loan amount.
     */
    amount: number;

    /**
     * Interest rate, 0-100.
     */
    interestRate: number;

    /**
     * Sets or gets loan period in months.
     * Overrides one previously defined in years.
     * @see #years
     */
    months: number;

    /**
     * Sets or gets loan period in years.
     * Overrides one previously defined in months.
     * @see #months
     */
    years: number;

    /**
     * 'monthly' by default.
     */
    repaymentFrequency: RepaymentFrequency;

    /**
     * Optional extra payment.
     */
    extraPayment: number;

    /**
     * Sets or gets the number of interest only repayments. Default is 0.
     */
    interestOnlyRepaymentCount: number;

    /**
     * Sets or gets the length of the fractional part for numbers used in calculation.
     * Default is 8.
     */
    rounding: number;

    // ARM (Adjustable Rate Mortgage) options

    /**
     * Sets or gets the ARM (Adjustable Rate Mortgage) period. Default is 0.
     * @see https://www.valuepenguin.com/loans/fixed-vs-variable-interest-rates
     */
    armFixedRateForRepaymentCount: number;

    /**
     * Rate that will be used for calculating variable rate
     * part of the loan with adjustments etc as the initial rate
     * that will be adjusted over time.
     */
    armInitialVariableRate: number;

    /**
     * Repayment count between ARM adjustments. 1 year by default.
     */
    armRepaymentCountBetweenAdjustments: number;

    /**
     * Interest rate adjustment for ARM.
     */
    armExpectedAdjustmentRate: number;

    /**
     * Max interest rate for ARM.
     */
    armMaximumInterestRate: number;

    /**
     * Gets the average repayments _after_
     * interest-only repayment period.
     */
    readonly repaymentAmount: number;

    /**
     * Total repayments sum.
     */
    readonly totalCost: number;

    /**
     * Total interest charged.
     */
    readonly totalInterest: number;

    readonly paymentsCountPerYear: number;
    readonly paymentsCountTotal: number;

    /**
     * Payment schedule for the loan.
     */
    readonly payments: LoanPayment[];

    // Methods

    /**
     * To easily calculate differences between various loan options.
     * @return Loan with the exact same options as the current one.
     */
    clone(): LoanInterface;
}

export class Loan implements LoanInterface {
    private _rate: number = 0;
    private _amount: number = 0;
    private _termInMonths: number = 0;
    private _repaymentFrequency: RepaymentFrequency = 'monthly';
    private _extraPayment = 0;
    private _interestOnlyRepayments = 0;
    private _totalCost = 0;
    private _totalInterest = 0;
    private _payments: LoanPayment[] = [];
    private _calculated = false;
    private _armFixedRateForRepaymentCount = 0;
    private _armVariableRate: number = 0;
    private _armRepaymentCountBetweenAdjustments = 12;
    private _armExpectedAdjustmentRate: number = 0;
    private _armMaximumInterestRate: number = 0;
    private _rounding = 8;

    get amount(): number {
        return this._amount;
    }

    set amount(amount: number) {
        if (this._amount === amount) {
            return;
        }
        this._amount = amount;
        this._invalidate();
    }

    get interestRate(): number {
        return this._rate;
    }

    set interestRate(rate: number) {
        if (this._rate === rate) {
            return;
        }
        this._rate = rate;
        this._invalidate();
    }

    get months(): number {
        return this._termInMonths;
    }

    set months(m: number) {
        if (this._termInMonths === m) {
            return;
        }
        this._termInMonths = m;
        this._invalidate();
    }

    get years(): number {
        return Math.floor(this._termInMonths / 12);
    }

    set years(y: number) {
        if (this._termInMonths === y * 12) {
            return;
        }
        this._termInMonths = y * 12;
        this._invalidate();
    }

    get repaymentFrequency(): RepaymentFrequency {
        return this._repaymentFrequency;
    }

    set repaymentFrequency(f: RepaymentFrequency) {
        if (this._repaymentFrequency === f) {
            return;
        }
        this._repaymentFrequency = f;
        this._invalidate();
    }

    get extraPayment(): number {
        return this._extraPayment;
    }

    set extraPayment(p: number) {
        if (this._extraPayment === p) {
            return;
        }
        this._extraPayment = p;
        this._invalidate();
    }

    get interestOnlyRepaymentCount(): number {
        return this._interestOnlyRepayments;
    }

    set interestOnlyRepaymentCount(n: number) {
        if (this._interestOnlyRepayments === n) {
            return;
        }
        this._interestOnlyRepayments = n;
        this._invalidate();
    }

    get rounding(): number {
        return this._rounding;
    }

    set rounding(r: number) {
        if (this._rounding === r) {
            return;
        }
        this._rounding = r;
        this._invalidate();
    }

    get armFixedRateForRepaymentCount(): number {
        return this._armFixedRateForRepaymentCount;
    }

    set armFixedRateForRepaymentCount(n: number) {
        if (this._armFixedRateForRepaymentCount === n) {
            return;
        }
        this._armFixedRateForRepaymentCount = n;
        this._invalidate();
    }

    get armInitialVariableRate(): number {
        return this._armVariableRate;
    }

    set armInitialVariableRate(rate: number) {
        this._armVariableRate = rate;
    }

    get armExpectedAdjustmentRate(): number {
        return this._armExpectedAdjustmentRate;
    }

    set armExpectedAdjustmentRate(rate: number) {
        this._armExpectedAdjustmentRate = rate;
    }

    get armRepaymentCountBetweenAdjustments(): number {
        return this._armRepaymentCountBetweenAdjustments;
    }

    set armRepaymentCountBetweenAdjustments(m: number) {
        this._armRepaymentCountBetweenAdjustments = m;
    }

    get armMaximumInterestRate(): number {
        return this._armMaximumInterestRate;
    }

    set armMaximumInterestRate(rate: number) {
        this._armMaximumInterestRate = rate;
    }

    get paymentsCountPerYear(): number {
        switch (this._repaymentFrequency) {
            case 'yearly':
                return 1;
            case 'quarterly':
                return 4;
            case 'monthly':
                return 12;
            case 'fortnightly':
                return 26;
            case 'weekly':
                return 52;
        }
    }

    get paymentsCountTotal(): number {
        return Math.floor(this.paymentsCountPerYear * this._termInMonths / 12);
    }

    get repaymentAmount(): number {
        const ppy = this.paymentsCountPerYear;
        const paymentsTotal = this.paymentsCountTotal;
        const interestOnlyRepayments = this._interestOnlyRepayments;
        const interest = this._rate / ppy / 100;
        const x = Math.pow(1 + interest, paymentsTotal - interestOnlyRepayments);
        const amount = (this._amount * x * interest) / (x - 1);
        return this._round(amount);
    }

    get totalCost(): number {
        this._calculate();
        return this._totalCost;
    }

    get totalInterest(): number {
        this._calculate();
        return this._totalInterest;
    }

    get payments(): LoanPayment[] {
        this._calculate();
        return this._payments;
    }

    clone(): LoanInterface {
        const copy = new Loan();
        copy.amount = this.amount;
        copy.interestRate = this.interestRate;
        copy.months = this.months;
        copy.years = this.years;
        copy.repaymentFrequency = this.repaymentFrequency;
        copy.extraPayment = this.extraPayment;
        copy.interestOnlyRepaymentCount = this.interestOnlyRepaymentCount;
        copy.armFixedRateForRepaymentCount = this.armFixedRateForRepaymentCount;
        copy.armInitialVariableRate = this.armInitialVariableRate;
        copy.armRepaymentCountBetweenAdjustments = this.armRepaymentCountBetweenAdjustments;
        copy.armExpectedAdjustmentRate = this.armExpectedAdjustmentRate;
        copy.armMaximumInterestRate = this.armMaximumInterestRate;
        copy.rounding = this.rounding;
        return copy;
    }

    private _invalidate() {
        this._calculated = false;
    }

    private _calculate() {
        if (this._calculated) {
            return;
        }

        if (!this._amount || !this._termInMonths || !this._rate) {
            return;
        }

        this._payments = [];
        this._totalInterest = 0;
        this._totalCost = 0;

        let rate = this.interestRate / this.paymentsCountPerYear / 100;
        const repayment = this.repaymentAmount;
        const interestOnlyRepayments = this._interestOnlyRepayments;
        const variableRate = this._armVariableRate / 12 / 100;
        const adjustAfterRepayments = this._armFixedRateForRepaymentCount;
        const adjustmentPeriod = this._armRepaymentCountBetweenAdjustments;
        const adjustmentPercentage = this._armExpectedAdjustmentRate / 12 / 100;
        const maxAdjustedRate = this._armMaximumInterestRate / 12 / 100;
        const doAdjustments = variableRate && adjustmentPercentage && maxAdjustedRate;
        let balance = this._amount;
        for (let p = 0, n = this.paymentsCountTotal; balance > 0 && p < n; ++p) {
            if (doAdjustments) {
                if (p === adjustAfterRepayments) {
                    // first time change rate to variable one
                    rate = variableRate;
                }
                if ((p > adjustAfterRepayments) && (p % adjustmentPeriod === 0)) {
                    // then adjust each N repayments
                    rate = Math.min(rate + adjustmentPercentage, maxAdjustedRate);
                }
            }
            const extra = p >= interestOnlyRepayments
                ? this._extraPayment : 0;
            const interest = this._round(rate * balance);
            const amount = p >= interestOnlyRepayments
                ? this._round(Math.min(repayment + extra, balance + interest))
                : interest;
            const principal = p >= interestOnlyRepayments
                ? Math.min(this._round(repayment - interest + extra), balance) : 0;
            balance = this._round(balance - principal);
            this._addPayment(amount, principal, interest, balance);
        }

        if (round(balance, 2) > 0.01) { // ignore less-than-cent balance diffs
            // Interest only loan
            this._addPayment(balance, balance, 0, 0);
        }

        this._calculated = true;
    }

    private _addPayment(amount: number, principal: number, interest: number, balance: number) {
        let payment = {
            amount: amount,
            principal: principal,
            interest: interest,
            balance: balance
        } as LoanPayment;
        this._payments.push(payment);
        this._totalCost += payment.amount;
        this._totalInterest += payment.interest;
    }

    private _round(num: number): number {
        return round(num, this._rounding);
    }
}

function round(num: number, f: number) {
    const div = Math.pow(10, f);
    return Math.round((num + Number.EPSILON) * div) / div;
}
