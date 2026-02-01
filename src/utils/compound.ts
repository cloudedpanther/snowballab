export type Mode = 'lump' | 'recurring';
export type CompoundFrequency = 'yearly' | 'semi' | 'quarterly' | 'monthly';

export type CalculatorInput = {
  mode: Mode;
  principal: number;
  annualRate: number;
  years: number;
  compound: CompoundFrequency;
  monthlyContribution: number;
  /** 연도별 매월 적립액(원). yearlyContributions[i] = (i+1)년차. 없거나 비면 monthlyContribution 사용 */
  yearlyContributions?: number[];
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

  const useYearly =
    Array.isArray(input.yearlyContributions) && input.yearlyContributions.length > 0;
  const getContribution = (month1Based: number): number => {
    if (!useYearly) return monthlyContribution;
    const yearIndex = Math.floor((month1Based - 1) / 12);
    const v = input.yearlyContributions![yearIndex];
    return Number.isFinite(v) && v >= 0 ? clampNonNegative(v) : 0;
  };

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
    // 연복리 적립식(SPEC): 연 6% → 월 0.5% 단리. 연도 경계로 끊어서, 당해 연도에는 전년 말 잔액+당해 연도 납입분만으로 이자 계산. 1년차 1월은 초기금만(납입 없음). 반올림 없음.
    const r = annualRateDecimal / 12; // 0.005
    let carried = principal;
    let runningContributed = 0;

    for (let year = 1; year <= years; year += 1) {
      const contribThisYear = year === 1 ? getContribution(2) : getContribution((year - 1) * 12 + 1);

      for (let t = 1; t <= 12; t += 1) {
        const month = (year - 1) * 12 + t;
        if (month > totalMonths) break;

        let balanceEnd: number;
        let balanceStart: number;
        let interestThisMonth: number;
        let contributedStart: number;

        if (year === 1 && t === 1) {
          balanceStart = carried;
          interestThisMonth = r * carried;
          balanceEnd = carried + interestThisMonth;
          contributedStart = balanceStart;
        } else if (year === 1) {
          balanceEnd =
            carried * (1 + r * t) +
            contribThisYear * (t - 1) +
            (contribThisYear * r * ((t - 1) * t)) / 2;
          balanceStart =
            t === 1
              ? carried
              : carried * (1 + r * (t - 1)) +
                contribThisYear * (t - 2) +
                (contribThisYear * r * ((t - 2) * (t - 1))) / 2;
          contributedStart = balanceStart + contribThisYear;
          interestThisMonth = balanceEnd - balanceStart - contribThisYear;
          runningContributed += contribThisYear;
        } else {
          balanceEnd =
            carried * (1 + r * t) +
            contribThisYear * t +
            (contribThisYear * r * (t * (t + 1))) / 2;
          balanceStart =
            t === 1
              ? carried
              : carried * (1 + r * (t - 1)) +
                contribThisYear * (t - 1) +
                (contribThisYear * r * ((t - 1) * t)) / 2;
          contributedStart =
            t === 1 ? balanceStart + contribThisYear : balanceStart + contribThisYear;
          interestThisMonth = balanceEnd - balanceStart - contribThisYear;
          runningContributed += contribThisYear;
        }

        monthly.push({
          period: month,
          contributedStart,
          interestEarned: interestThisMonth,
          total: balanceEnd
        });

        if (t === 12) {
          const yearPrincipal =
            year === 1 ? principal + contribThisYear * 11 : carried + contribThisYear * 12;
          const yearInterest = monthly
            .slice(month - 12, month)
            .reduce((sum, row) => sum + row.interestEarned, 0);

          yearly.push({
            period: year,
            contributedStart: yearPrincipal,
            interestEarned: yearInterest,
            total: balanceEnd
          });
          carried = balanceEnd;
        }
      }
    }

    const lastMonth = monthly[monthly.length - 1];
    balance = lastMonth ? lastMonth.total : principal;
    contributed = principal + runningContributed;
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

      const contributionThisMonth = getContribution(month);
      if (contributionThisMonth > 0) {
        balance = round2(balance + contributionThisMonth);
        contributed = round2(contributed + contributionThisMonth);
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
