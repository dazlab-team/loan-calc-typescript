import {Loan, RepaymentFrequency} from '../src';

// Resources used for reference numbers:
// https://www.commbank.com.au/digital/home-buying/calculator/home-loan-repayments
// https://moneysmart.gov.au/home-loans/interest-only-mortgage-calculator
// https://www.yourmortgage.com.au/calculators/extra-lump-sum-payment/
// https://www.savings.com.au/home-loans/monthly-fortnightly-weekly-mortgage-repayments

interface TestExpectation {
    totalInterest?: number;
    totalCost?: number;
    repaymentAmount?: number;
    paymentsPerYear?: number;
    paymentsTotal?: number;
    interestOnlyRepayment?: number | undefined;
    interestOnlyCostDiff?: number | undefined;
}

interface TestOptions {
    frequency: RepaymentFrequency;
    amount: number;
    years: number;
    rate: number;
    interestOnlyRepaymentCount?: number | undefined;
    calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments?: boolean;
    rounding?: number;
    expect: TestExpectation;
}

function newLoan(amount: number, years: number, rate: number): Loan {
    const loan = new Loan();
    loan.amount = amount;
    loan.years = years;
    loan.interestRate = rate;
    return loan;
}

test('Basic loan (monthly)', () => {
    testLoanProperties({
        amount: 800_000,
        years: 5,
        rate: 2.56,
        frequency: 'monthly',
        expect: {
            totalCost: 853_144,
            totalInterest: 53_144,
            paymentsPerYear: 12,
            paymentsTotal: 60,
            repaymentAmount: 14_219
        }
    });
});

test('Extra monthly payments', () => {

    const loan = newLoan(800_000, 5, 2.56);
    loan.extraPayment = 1000;
    expect(loan.totalInterest.toFixed(0)).toEqual('49427');
    expect(loan.totalCost.toFixed(0)).toEqual('849427');

    const copy = loan.clone();
    copy.extraPayment = 0;
    const monthsDiff = copy.payments.length - loan.payments.length;
    expect(monthsDiff).toEqual(4);

    const costDiff = copy.totalInterest - loan.totalInterest;
    expect(costDiff.toFixed(0)).toEqual('3717');
});

test('Interest only 1 year mortgage (yearly)', () => {
    testLoanProperties({
        frequency: 'yearly',
        amount: 800_000,
        years: 5,
        rate: 2.56,
        interestOnlyRepaymentCount: 1,
        expect: {
            totalInterest: 72_327,
            totalCost: 872_327,
            interestOnlyRepayment: 20_480,
            repaymentAmount: 212_962,
            paymentsPerYear: 1,
            paymentsTotal: 5,
            interestOnlyCostDiff: 9_852
        }
    });
});

test('Interest only 1 year mortgage (quarterly)', () => {
    testLoanProperties({
        frequency: 'quarterly',
        amount: 800_000,
        years: 5,
        rate: 2.56,
        interestOnlyRepaymentCount: 4,
        expect: {
            totalInterest: 64_694,
            totalCost: 864_694,
            interestOnlyRepayment: 5_120,
            repaymentAmount: 52_763,
            paymentsPerYear: 4,
            paymentsTotal: 20,
            interestOnlyCostDiff: 9_848
        }
    });
});

test('Interest only 1 year mortgage (monthly)', () => {
    testLoanProperties({
        frequency: 'monthly',
        amount: 800_000,
        years: 5,
        rate: 2.56,
        interestOnlyRepaymentCount: 12,
        expect: {
            totalInterest: 62_991,
            totalCost: 862_991,
            interestOnlyRepayment: 1_707,
            repaymentAmount: 17_552,
            paymentsPerYear: 12,
            paymentsTotal: 60,
            interestOnlyCostDiff: 9_847
        }
    });
});

test('Interest only 1 year mortgage (fortnightly calculated from yearly repayments)', () => {
    testLoanProperties({
        frequency: 'fortnightly',
        amount: 800_000,
        years: 5,
        rate: 2.56,
        interestOnlyRepaymentCount: 26,
        calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments: true,
        expect: {
            totalInterest: 62_532,
            totalCost: 862_532,
            interestOnlyRepayment: 788,
            repaymentAmount: 8_097,
            paymentsPerYear: 26,
            paymentsTotal: 130,
            interestOnlyCostDiff: 9_847
        }
    });
});

test('Interest only 1 year mortgage (weekly calculated from yearly repayments)', () => {
    testLoanProperties({
        frequency: 'weekly',
        amount: 800_000,
        years: 5,
        rate: 2.56,
        interestOnlyRepaymentCount: 52,
        calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments: true,
        expect: {
            totalInterest: 62_336,
            totalCost: 862_336,
            interestOnlyRepayment: 394,
            repaymentAmount: 4_047,
            paymentsPerYear: 52,
            paymentsTotal: 52 * 5,
            interestOnlyCostDiff: 9_847
        }
    });
});

test('1 year mortgage (fixed rate, monthly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'monthly',
        amount: 500_000,
        years: 1,
        rate: 2.49,
        expect: {
            repaymentAmount: 42_230.78,
            totalInterest: 6_769.37
        }
    });
});

test('1 year mortgage (fixed rate, fortnightly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'fortnightly',
        amount: 500_000,
        years: 1,
        rate: 2.49,
        expect: {
            repaymentAmount: 21_115.39,
            totalInterest: 5999.09
        }
    });
});

test('1 year mortgage (fixed rate, weekly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'weekly',
        amount: 500_000,
        years: 1,
        rate: 2.49,
        expect: {
            repaymentAmount: 10_557.70,
            totalInterest: 5_877.91
        }
    });
});

test('20 years mortgage (fixed rate, monthly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'monthly',
        amount: 500_000,
        years: 20,
        rate: 2.49,
        expect: {
            repaymentAmount: 2_647.08,
            totalInterest: 135_299.00
        }
    });
});

test('20 years mortgage (fixed rate, fortnightly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'fortnightly',
        amount: 500_000,
        years: 20,
        rate: 2.49,
        expect: {
            repaymentAmount: 1_323.54,
            totalInterest: 120_945.31
        }
    });
});

test('20 years mortgage (fixed rate, weekly)', () => {
    // see https://www.savings.com.au/calculators/repayment-frequency-calculator
    testLoanProperties({
        frequency: 'weekly',
        amount: 500_000,
        years: 20,
        rate: 2.49,
        expect: {
            repaymentAmount: 661.77,
            totalInterest: 120_796.55
        }
    });
});

test('Should override interestOnlyRepaymentCount with interestOnlyYears and vice versa', () => {

    const loan = newLoan(80000, 5, 2.56);
    loan.repaymentFrequency = 'monthly';
    loan.interestOnlyRepaymentCount = 12; // 1 year
    expect(loan.interestOnlyYears).toEqual(1);
    expect(loan.interestOnlyRepaymentCount).toEqual(12);

    loan.interestOnlyYears = 2;
    expect(loan.interestOnlyYears).toEqual(2);
    expect(loan.interestOnlyRepaymentCount).toEqual(24);

    loan.repaymentFrequency = 'quarterly';
    expect(loan.interestOnlyYears).toEqual(2);
    expect(loan.interestOnlyRepaymentCount).toEqual(8);

    loan.interestOnlyRepaymentCount = 12;
    expect(loan.interestOnlyYears).toEqual(3);
    expect(loan.interestOnlyRepaymentCount).toEqual(12);
});

test('Should override armFixedRateForRepaymentCount with armFixedRateForYears and vice versa', () => {

    const loan = newLoan(80000, 5, 2.56);
    loan.repaymentFrequency = 'monthly';
    loan.armFixedRateForRepaymentCount = 12; // 1 year
    expect(loan.armFixedRateForYears).toEqual(1);
    expect(loan.armFixedRateForRepaymentCount).toEqual(12);

    loan.armFixedRateForYears = 2;
    expect(loan.armFixedRateForYears).toEqual(2);
    expect(loan.armFixedRateForRepaymentCount).toEqual(24);

    loan.repaymentFrequency = 'quarterly';
    expect(loan.armFixedRateForYears).toEqual(2);
    expect(loan.armFixedRateForRepaymentCount).toEqual(8);

    loan.armFixedRateForRepaymentCount = 12;
    expect(loan.armFixedRateForYears).toEqual(3);
    expect(loan.armFixedRateForRepaymentCount).toEqual(12);
});

test('Should override armRepaymentCountBetweenAdjustments with armMonthsBetweenAdjustments and vice versa', () => {

    const loan = newLoan(80000, 5, 2.56);
    loan.repaymentFrequency = 'monthly';
    expect(loan.armMonthsBetweenAdjustments).toEqual(12);
    expect(loan.armRepaymentCountBetweenAdjustments).toEqual(12);

    loan.armRepaymentCountBetweenAdjustments = 12; // 1 year
    expect(loan.armMonthsBetweenAdjustments).toEqual(12);
    expect(loan.armRepaymentCountBetweenAdjustments).toEqual(12);

    loan.armMonthsBetweenAdjustments = 24;
    expect(loan.armMonthsBetweenAdjustments).toEqual(24);
    expect(loan.armRepaymentCountBetweenAdjustments).toEqual(24);

    loan.repaymentFrequency = 'quarterly';
    expect(loan.armMonthsBetweenAdjustments).toEqual(24);
    expect(loan.armRepaymentCountBetweenAdjustments).toEqual(8);

    loan.armRepaymentCountBetweenAdjustments = 12;
    expect(loan.armMonthsBetweenAdjustments).toEqual(36);
    expect(loan.armRepaymentCountBetweenAdjustments).toEqual(12);
});

// test('ARM options', () => {
//
//     // https://www.commbank.com.au/home-loans/split-loan-calculator.html
//     // TODO: find better reference with the trivial ARM calculation.
//
//     const loan = newLoan(800_000, 25, 2.56);
//     loan.armInitialVariableRate = 1.56;
//     loan.armMaximumInterestRate = 3.56;
//     loan.armExpectedAdjustmentRate = 0.25;
//     loan.armRepaymentCountBetweenAdjustments = 12;
//     expect(loan.totalInterest.toFixed(2)).toEqual('53143.84');
//     expect(loan.totalCost.toFixed(2)).toEqual('853143.84');
// });

function testLoanProperties(options: TestOptions) {
    const loan = newLoan(options.amount, options.years, options.rate);
    loan.repaymentFrequency = options.frequency;

    if (options.interestOnlyRepaymentCount !== undefined) {
        loan.interestOnlyRepaymentCount = options.interestOnlyRepaymentCount;
    }

    if (options.calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments) {
        loan.calculateWeeklyAndFortnightlyRepaymentsBasedOnYearlyRepayments = true;
    }

    if (options.rounding !== undefined) {
        loan.rounding = options.rounding;
    }

    if (options.expect.repaymentAmount !== undefined) {
        expect(loan.repaymentAmount.toFixed(0)).toEqual(options.expect.repaymentAmount.toFixed(0));
    }

    if (options.expect.totalInterest !== undefined) {
        expect(loan.totalInterest.toFixed(0)).toEqual(options.expect.totalInterest.toFixed(0));
    }

    if (options.expect.totalCost !== undefined) {
        expect(loan.totalCost.toFixed(0)).toEqual(options.expect.totalCost.toFixed(0));
    }

    if (options.expect.paymentsPerYear !== undefined) {
        expect(loan.paymentsCountPerYear).toEqual(options.expect.paymentsPerYear);
        if (options.interestOnlyRepaymentCount && options.expect.interestOnlyRepayment) {
            let interestOnlyRepayments = loan.payments.slice(0, options.interestOnlyRepaymentCount);
            expect(interestOnlyRepayments.map(p => p.amount.toFixed(0)))
                .toEqual(new Array(options.expect.paymentsPerYear).fill(options.expect.interestOnlyRepayment.toFixed(0)));
            expect(interestOnlyRepayments.map(p => p.interest.toFixed(0)))
                .toEqual(new Array(options.expect.paymentsPerYear).fill(options.expect.interestOnlyRepayment.toFixed(0)));
            expect(interestOnlyRepayments.map(p => p.balance.toFixed(0)))
                .toEqual(new Array(options.expect.paymentsPerYear).fill(options.amount.toFixed(0)));
            expect(interestOnlyRepayments.map(p => p.principal.toFixed(0)))
                .toEqual(new Array(options.expect.paymentsPerYear).fill('0'));
        }
    }

    if (options.expect.paymentsTotal !== undefined) {

        expect(loan.paymentsCountTotal).toEqual(options.expect.paymentsTotal);
        expect(loan.payments.length).toEqual(options.expect.paymentsTotal);

        let principalRepaymentCount = options.expect.paymentsTotal - (options.interestOnlyRepaymentCount || 0);
        let otherRepayments = loan.payments.slice(options.interestOnlyRepaymentCount);
        expect(otherRepayments.length).toEqual(principalRepaymentCount);
        expect(otherRepayments.map(p => p.balance.toFixed(0)))
            .not.toEqual(new Array(principalRepaymentCount).fill('0'));
        expect(otherRepayments.map(p => p.amount.toFixed(0)))
            .toEqual(new Array(principalRepaymentCount).fill(options.expect.repaymentAmount.toFixed(0)));
        expect(otherRepayments[principalRepaymentCount - 2].balance.toFixed(0)).not.toEqual('0');
        expect(otherRepayments[principalRepaymentCount - 1].balance.toFixed(0)).toEqual('0');
    }

    if (options.expect.interestOnlyCostDiff) {
        const copy = loan.clone();
        copy.interestOnlyRepaymentCount = 0;
        const costDiff = loan.totalInterest - copy.totalInterest;
        expect(costDiff.toFixed(0)).toEqual(options.expect.interestOnlyCostDiff.toFixed(0));
    }
}
