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
     * Sets or gets the number of interest only repayments.
     * Overrides one previously defined in years (below).
     * Default is 0.
     */
    interestOnlyRepaymentCount: number;

    /**
     * Sets or gets the number of interest only repayments in years.
     * Overrides one defined in repayment count (above).
     * Default is 0.
     */
    interestOnlyYears: number;

    /**
     * Whether to calculate weekly and fortnightly repayments based on the
     * yearly repayment amount, instead of deriving it from monthly repayment.
     * Default is false, which means to derive weekly and fortnightly repayment
     * amount from monthly repayments, decreasing the total cost of the loan.
     * See https://www.savings.com.au/home-loans/monthly-fortnightly-weekly-mortgage-repayments
     */
    calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments: boolean;

    /**
     * Sets or gets the length of the fractional part for numbers used in calculation.
     * Default is 8.
     */
    rounding: number;

    // ARM (Adjustable Rate Mortgage) options

    /**
     * Sets or gets the ARM (Adjustable Rate Mortgage) period.
     * Overrides one previously defined in years (below).
     * Default is 0.
     * @see https://www.valuepenguin.com/loans/fixed-vs-variable-interest-rates
     */
    armFixedRateForRepaymentCount: number;

    /**
     * Sets or gets the ARM (Adjustable Rate Mortgage) period in years.
     * Overrides one previously defined in repayment count (above).
     * Default is 0.
     */
    armFixedRateForYears: number;

    /**
     * Rate that will be used for calculating variable rate
     * part of the loan with adjustments etc as the initial rate
     * that will be adjusted over time.
     */
    armInitialVariableRate: number;

    /**
     * Repayment count between ARM adjustments.
     * Overrides one previously defined in months (below).
     */
    armRepaymentCountBetweenAdjustments: number;

    /**
     * Sets or gets the ARM (Adjustable Rate Mortgage) adjustment period in months.
     * Overrides one previously defined in repayment count (above).
     * Default is 12.
     */
    armMonthsBetweenAdjustments: number;

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
    private _termInMonths: number = 0;
    private _interestOnlyRepayments = 0;
    private _calculated = false;
    private _armVariableRate: number = 0;

    private _amount: number = 0;

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

    private _repaymentFrequency: RepaymentFrequency = 'monthly';

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

    private _extraPayment = 0;

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

    private _interestOnlyYears = 0;

    get interestOnlyYears(): number {
        if (this._interestOnlyYears) {
            return this._interestOnlyYears;
        }
        return this._interestOnlyRepayments / this.paymentsCountPerYear;
    }

    set interestOnlyYears(y: number) {
        if (this._interestOnlyYears === y) {
            return;
        }
        this._interestOnlyYears = y;
        this._interestOnlyRepayments = 0;
        this._invalidate();
    }

    private _calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments = false;

    get calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments(): boolean {
        return this._calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments;
    }

    set calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments(value: boolean) {
        this._calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments = value;
        this._invalidate();
    }

    private _totalCost = 0;

    get totalCost(): number {
        this._calculate();
        return this._totalCost;
    }

    private _totalInterest = 0;

    get totalInterest(): number {
        this._calculate();
        return this._totalInterest;
    }

    private _payments: LoanPayment[] = [];

    get payments(): LoanPayment[] {
        this._calculate();
        return this._payments;
    }

    private _armFixedRateForRepaymentCount = 0;

    get armFixedRateForRepaymentCount(): number {
        if (this._armFixedRateForYears) {
            return this._armFixedRateForYears * this.paymentsCountPerYear;
        }
        return this._armFixedRateForRepaymentCount;
    }

    set armFixedRateForRepaymentCount(n: number) {
        if (this._armFixedRateForRepaymentCount === n) {
            return;
        }
        this._armFixedRateForRepaymentCount = n;
        this._armFixedRateForYears = 0;
        this._invalidate();
    }

    private _armFixedRateForYears = 0;

    get armFixedRateForYears(): number {
        if (this._armFixedRateForYears) {
            return this._armFixedRateForYears;
        }
        return this._armFixedRateForRepaymentCount / this.paymentsCountPerYear;
    }

    set armFixedRateForYears(y: number) {
        if (this._armFixedRateForYears === y) {
            return;
        }
        this._armFixedRateForRepaymentCount = 0;
        this._armFixedRateForYears = y;
        this._invalidate();
    }

    private _armRepaymentCountBetweenAdjustments = 0;

    get armRepaymentCountBetweenAdjustments(): number {
        if (this._armMonthsBetweenAdjustments) {
            return this._armMonthsBetweenAdjustments / 12 * this.paymentsCountPerYear;
        }
        return this._armRepaymentCountBetweenAdjustments;
    }

    set armRepaymentCountBetweenAdjustments(m: number) {
        if (this._armRepaymentCountBetweenAdjustments === m) {
            return;
        }
        this._armRepaymentCountBetweenAdjustments = m;
        this._armMonthsBetweenAdjustments = 0;
        this._invalidate();
    }

    private _armMonthsBetweenAdjustments = 12;

    get armMonthsBetweenAdjustments(): number {
        if (this._armMonthsBetweenAdjustments) {
            return this._armMonthsBetweenAdjustments;
        }
        return this._armRepaymentCountBetweenAdjustments / this.paymentsCountPerYear * 12;
    }

    set armMonthsBetweenAdjustments(m: number) {
        if (this._armMonthsBetweenAdjustments === m) {
            return;
        }
        this._armMonthsBetweenAdjustments = m;
        this._armRepaymentCountBetweenAdjustments = 0;
        this._invalidate();
    }

    private _armExpectedAdjustmentRate: number = 0;

    get armExpectedAdjustmentRate(): number {
        return this._armExpectedAdjustmentRate;
    }

    set armExpectedAdjustmentRate(rate: number) {
        if (this._armExpectedAdjustmentRate === rate) {
            return;
        }
        this._armExpectedAdjustmentRate = rate;
        this._invalidate();
    }

    private _armMaximumInterestRate: number = 0;

    get armMaximumInterestRate(): number {
        return this._armMaximumInterestRate;
    }

    set armMaximumInterestRate(rate: number) {
        if (this._armMaximumInterestRate === rate) {
            return;
        }
        this._armMaximumInterestRate = rate;
        this._invalidate();
    }

    private _rounding = 8;

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

    get interestOnlyRepaymentCount(): number {
        if (this._interestOnlyYears) {
            return this._interestOnlyYears * this.paymentsCountPerYear;
        }
        return this._interestOnlyRepayments;
    }

    set interestOnlyRepaymentCount(n: number) {
        if (this._interestOnlyRepayments === n) {
            return;
        }
        this._interestOnlyRepayments = n;
        this._interestOnlyYears = 0;
        this._invalidate();
    }

    get armInitialVariableRate(): number {
        return this._armVariableRate;
    }

    set armInitialVariableRate(rate: number) {
        if (this._armVariableRate === rate) {
            return;
        }
        this._armVariableRate = rate;
        this._invalidate();
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
        if (!this._calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments) {
            switch (this._repaymentFrequency) {
                case 'weekly':
                case 'fortnightly':
                    const monthly = this.clone();
                    monthly.repaymentFrequency = 'monthly';
                    return 'weekly' === this.repaymentFrequency
                        ? monthly.repaymentAmount / 4
                        : monthly.repaymentAmount / 2;
            }
        }
        const ppy = this.paymentsCountPerYear;
        const paymentsTotal = this.paymentsCountTotal;
        const interestOnlyRepayments = this._interestOnlyRepayments;
        const interest = this._rate / ppy / 100;
        const x = Math.pow(1 + interest, paymentsTotal - interestOnlyRepayments);
        const amount = (this._amount * x * interest) / (x - 1);
        return this._round(amount);
    }

    clone(): LoanInterface {
        const copy = new Loan();
        copy._amount = this._amount;
        copy._rate = this._rate;
        copy._termInMonths = this._termInMonths;
        copy._repaymentFrequency = this._repaymentFrequency;
        copy._extraPayment = this._extraPayment;
        copy._interestOnlyRepayments = this._interestOnlyRepayments;
        copy._interestOnlyYears = this._interestOnlyYears;
        copy._calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments = this._calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments;
        copy._armFixedRateForRepaymentCount = this._armFixedRateForRepaymentCount;
        copy._armFixedRateForYears = this._armFixedRateForYears;
        copy._armVariableRate = this._armVariableRate;
        copy._armRepaymentCountBetweenAdjustments = this._armRepaymentCountBetweenAdjustments;
        copy._armMonthsBetweenAdjustments = this._armMonthsBetweenAdjustments;
        copy._armExpectedAdjustmentRate = this._armExpectedAdjustmentRate;
        copy._armMaximumInterestRate = this._armMaximumInterestRate;
        copy._rounding = this._rounding;
        return copy;
    }

    private _invalidate() {
        this._calculated = false;
    }

    private _calcInterestRateForPeriod(): number {
        return this.interestRate / this.paymentsCountPerYear / 100;
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

        let rate = this._calcInterestRateForPeriod();
        const repayment = this.repaymentAmount;
        const variableRate = this.armInitialVariableRate / 12 / 100;
        const interestOnlyRepayments = this.interestOnlyRepaymentCount;
        const adjustAfterRepayments = this.armFixedRateForRepaymentCount;
        const adjustmentPeriod = this.armRepaymentCountBetweenAdjustments;
        const adjustmentPercentage = this.armExpectedAdjustmentRate / 12 / 100;
        const maxAdjustedRate = this.armMaximumInterestRate / 12 / 100;
        const doAdjustments = variableRate && adjustmentPercentage && maxAdjustedRate;
        let balance = this.amount;
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
                ? this.extraPayment : 0;
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
