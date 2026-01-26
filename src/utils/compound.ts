export type Mode = 'lump' | 'recurring';
export type CompoundFrequency = 'yearly' | 'semi' | 'quarterly' | 'monthly';

export type CalculatorInput = {
  mode: Mode;
  principal: number;
  annualRate: number;
  years: number;
  compound: CompoundFrequency;
  monthlyContribution: number;
};

export type SummaryRow = {
  period: number;
  contributedStart: number;
  interestEarned: number;
  total: number;
  periodInterest?: number;
};

export type CalculatorResult = {
  finalAmount: number;
  totalContributed: number;
  totalInterest: number;
  yearly: SummaryRow[];
  monthly: SummaryRow[];
};

const clampNonNegative = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

const compoundMonthsMap: Record<CompoundFrequency, number> = {
  yearly: 12,
  semi: 6,
  quarterly: 3,
  monthly: 1
};

const toFixedPrecision = (value: number) => Math.round(value * 100) / 100;
const round2 = toFixedPrecision;
const MONEY_SCALE = 100n;
const RATE_SCALE = 1000000000n;

const roundDiv = (numerator: bigint, denominator: bigint) =>
  (numerator + denominator / 2n) / denominator;

const toMoneyScaled = (value: number) => {
  // TODO: large values should be passed as strings to avoid precision loss.
  return BigInt(Math.round(value * Number(MONEY_SCALE)));
};

const fromMoneyScaled = (value: bigint) => Number(value) / Number(MONEY_SCALE);

const calculateLumpSum = (
  principal: number,
  ratePercent: number,
  periods: number
): CalculatorResult => {
  const sanitizedPrincipal = clampNonNegative(principal);
  const sanitizedRate = clampNonNegative(ratePercent);
  const totalPeriods = Math.floor(clampNonNegative(periods));
  const periodicRate = sanitizedRate / 100;

  let balance = sanitizedPrincipal;
  const yearly: SummaryRow[] = [];

  for (let period = 1; period <= totalPeriods; period += 1) {
    const before = balance;
    balance *= 1 + periodicRate;
    const periodInterest = balance - before;

    const total = toFixedPrecision(balance);
    const contributed = toFixedPrecision(sanitizedPrincipal);
    const interestEarned = toFixedPrecision(total - contributed);

    yearly.push({
      period,
      contributedStart: contributed,
      interestEarned,
      total,
      periodInterest: toFixedPrecision(periodInterest)
    });
  }

  const finalAmount = toFixedPrecision(balance);
  const totalContributed = toFixedPrecision(sanitizedPrincipal);
  const totalInterest = toFixedPrecision(finalAmount - totalContributed);

  return {
    finalAmount,
    totalContributed,
    totalInterest,
    yearly,
    monthly: []
  };
};

export const calculateCompound = (input: CalculatorInput): CalculatorResult => {
  const principal = clampNonNegative(input.principal);
  const annualRate = clampNonNegative(input.annualRate);
  const years = Math.floor(clampNonNegative(input.years));
  const monthlyContribution =
    input.mode === 'recurring' ? clampNonNegative(input.monthlyContribution) : 0;

  if (input.mode === 'lump') {
    return calculateLumpSum(principal, annualRate, years);
  }

  const annualRateDecimal = annualRate / 100;
  const isYearlyCompound = input.compound === 'yearly';
  const compoundMonths = compoundMonthsMap[input.compound];
  const periodsPerYear = 12 / compoundMonths;
  const periodicRate = periodsPerYear === 0 ? 0 : annualRateDecimal / periodsPerYear;

  let balance = round2(principal);
  let contributed = round2(principal);
  const yearly: SummaryRow[] = [];
  const monthly: SummaryRow[] = [];
  const totalMonths = years * 12;

  if (isYearlyCompound) {
    const annualRateScaled = roundDiv(BigInt(Math.round(annualRate * Number(RATE_SCALE))), 100n);
    const monthlyRateScaled = roundDiv(annualRateScaled, 12n);
    const principalScaled = toMoneyScaled(principal);
    const monthlyContributionScaled = toMoneyScaled(monthlyContribution);
    let yearInterestAccScaled = 0n;
    let capitalizedInterestScaled = 0n;
    let previousTotalScaled = 0n;

    for (let month = 1; month <= totalMonths; month += 1) {
      const isYearEnd = month % 12 === 0;

      if (month === 1) {
        monthly.push({
          period: month,
          contributedStart: 0,
          interestEarned: 0,
          total: 0
        });
      } else {
        const contributionCumulativeScaled =
          principalScaled + monthlyContributionScaled * BigInt(month - 1);
        const displayedPrincipalScaled = previousTotalScaled + monthlyContributionScaled;
        const baseForInterestScaled = contributionCumulativeScaled + capitalizedInterestScaled;
        const monthInterestScaled = roundDiv(baseForInterestScaled * monthlyRateScaled, RATE_SCALE);
        const totalScaled = displayedPrincipalScaled + monthInterestScaled;

        monthly.push({
          period: month,
          contributedStart: fromMoneyScaled(displayedPrincipalScaled),
          interestEarned: fromMoneyScaled(monthInterestScaled),
          total: fromMoneyScaled(totalScaled)
        });

        previousTotalScaled = totalScaled;
        yearInterestAccScaled += monthInterestScaled;
      }

      if (isYearEnd) {
        const contributionCumulativeScaled =
          principalScaled + monthlyContributionScaled * BigInt(month - 1);
        const yearBaseScaled = contributionCumulativeScaled + capitalizedInterestScaled;
        const interestForYearScaled = yearInterestAccScaled;
        const yearTotalScaled = yearBaseScaled + interestForYearScaled;

        yearly.push({
          period: month / 12,
          contributedStart: fromMoneyScaled(yearBaseScaled),
          interestEarned: fromMoneyScaled(interestForYearScaled),
          total: fromMoneyScaled(yearTotalScaled)
        });

        capitalizedInterestScaled += interestForYearScaled;
        yearInterestAccScaled = 0n;
        previousTotalScaled = yearTotalScaled;
      }
    }

    balance = round2(fromMoneyScaled(previousTotalScaled));
    contributed = round2(
      fromMoneyScaled(
        principalScaled + monthlyContributionScaled * BigInt(Math.max(totalMonths - 1, 0))
      )
    );
  } else {
    let contributedStartOfYear = contributed;

    for (let month = 1; month <= totalMonths; month += 1) {
      const isYearStart = (month - 1) % 12 === 0;
      if (isYearStart) {
        contributedStartOfYear = contributed;
      }

      const contributedStartOfMonth = contributed;

      if (month % compoundMonths === 0) {
        balance = round2(balance * (1 + periodicRate));
      }

      if (monthlyContribution > 0) {
        balance = round2(balance + monthlyContribution);
        contributed = round2(contributed + monthlyContribution);
      }

      if (month % 12 === 0) {
        const total = round2(balance);
        const totalContributed = round2(contributed);
        const interestEarned = round2(total - totalContributed);
        const contributedStart = round2(contributedStartOfYear);

        yearly.push({
          period: month / 12,
          contributedStart,
          interestEarned,
          total
        });
      }

      {
        const total = round2(balance);
        const totalContributed = round2(contributed);
        const interestEarned = round2(total - totalContributed);

        monthly.push({
          period: month,
          contributedStart: round2(contributedStartOfMonth),
          interestEarned,
          total
        });
      }
    }
  }

  const finalAmount = round2(balance);
  const totalContributed = round2(contributed);
  const totalInterest = round2(finalAmount - totalContributed);

  return {
    finalAmount,
    totalContributed,
    totalInterest,
    yearly,
    monthly
  };
};
