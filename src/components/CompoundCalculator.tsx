import { useEffect, useMemo, useState } from 'react';
import {
  calculateCompound,
  type CalculatorInput,
  type CompoundFrequency,
  type Mode
} from '../utils/compound';

const currency = new Intl.NumberFormat('ko-KR');
const percent = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const basePath = import.meta.env.BASE_URL ?? '/';

const displayWon = (value: number) => {
  const scaled = BigInt(Math.round(value * 100));
  return Number((scaled + 50n) / 100n);
};
const formatCurrency = (value: number) => `${currency.format(displayWon(value))}원`;
const formatPercent = (value: number) => `${percent.format(value)}%`;

type Scenario = {
  label: string;
  description: string;
  input: CalculatorInput;
};

const lumpScenarios: Scenario[] = [
  {
    label: '거치식 1',
    description: '초기 1,000만원 · 수익률 7% · 20회차',
    input: {
      mode: 'lump',
      principal: 10000000,
      annualRate: 7,
      years: 20,
      compound: 'quarterly',
      monthlyContribution: 0
    }
  },
  {
    label: '거치식 2',
    description: '초기 3,000만원 · 수익률 5% · 12회차',
    input: {
      mode: 'lump',
      principal: 30000000,
      annualRate: 5,
      years: 12,
      compound: 'semi',
      monthlyContribution: 0
    }
  }
];

const recurringDefault: CalculatorInput = {
  mode: 'recurring',
  principal: 100000,
  annualRate: 6,
  years: 15,
  compound: 'yearly',
  monthlyContribution: 100000
};

const recurringScenarios: Scenario[] = [
  {
    label: '적립식 1',
    description: '초기 500만원 · 매월 30만원 · 연 6% · 15년 · 월복리',
    input: {
      mode: 'recurring',
      principal: 5000000,
      annualRate: 6,
      years: 15,
      compound: 'monthly',
      monthlyContribution: 300000
    }
  },
  {
    label: '적립식 2',
    description: '초기 0원 · 매월 50만원 · 연 8% · 20년 · 연복리',
    input: {
      mode: 'recurring',
      principal: 0,
      annualRate: 8,
      years: 20,
      compound: 'yearly',
      monthlyContribution: 500000
    }
  }
];

const compoundOptionsByMode: Record<Mode, { value: CompoundFrequency; label: string }[]> = {
  lump: [],
  recurring: [
    { value: 'yearly', label: '연복리' },
    { value: 'monthly', label: '월복리' }
  ]
};

const modeLabels: Record<Mode, string> = {
  lump: '거치식',
  recurring: '적립식'
};

const toNumber = (value: string) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseNumberParam = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCompound = (value: string | null, fallback: CompoundFrequency): CompoundFrequency => {
  if (!value) return fallback;
  if (value === 'yearly' || value === 'monthly') return value;
  return fallback;
};

const buildQuery = (mode: Mode, input: CalculatorInput, recurringView: 'year' | 'month') => {
  const params = new URLSearchParams();
  params.set('p', String(input.principal));
  params.set('r', String(input.annualRate));
  if (mode === 'lump') {
    params.set('n', String(input.years));
  } else {
    params.set('y', String(input.years));
    params.set('m', String(input.monthlyContribution));
    params.set('c', input.compound);
    params.set('v', recurringView);
  }
  return params;
};

const updateInput = (
  current: CalculatorInput,
  patch: Partial<CalculatorInput>
): CalculatorInput => ({
  ...current,
  ...patch
});

type FieldProps = {
  input: CalculatorInput;
  onChange: (patch: Partial<CalculatorInput>) => void;
};

type NumberInputProps = {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onValueChange: (value: number) => void;
};

const NumberInput = ({ label, value, min, step, onValueChange }: NumberInputProps) => {
  const [focused, setFocused] = useState(false);
  const displayValue = focused ? String(value) : currency.format(Math.round(value));

  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
      {label}
      <input
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        type="text"
        inputMode="numeric"
        min={min}
        step={step}
        value={displayValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onValueChange(toNumber(event.target.value))}
      />
    </label>
  );
};

const LumpSumFields = ({ input, onChange }: FieldProps) => (
  <>
    <NumberInput
      label="초기 금액(원)"
      value={input.principal}
      min={0}
      step={10000}
      onValueChange={(value) => onChange({ principal: value })}
    />
    <NumberInput
      label="복리 횟수(기간)"
      value={input.years}
      min={0}
      step={1}
      onValueChange={(value) => onChange({ years: value })}
    />
    <NumberInput
      label="수익률(%)"
      value={input.annualRate}
      min={0}
      step={0.1}
      onValueChange={(value) => onChange({ annualRate: value })}
    />
  </>
);

const RecurringFields = ({ input, onChange }: FieldProps) => (
  <>
    <NumberInput
      label="초기금액(원)"
      value={input.principal}
      min={0}
      step={10000}
      onValueChange={(value) => onChange({ principal: value })}
    />
    <NumberInput
      label="기대 수익률(%)"
      value={input.annualRate}
      min={0}
      step={0.1}
      onValueChange={(value) => onChange({ annualRate: value })}
    />
    <NumberInput
      label="기간(년)"
      value={input.years}
      min={0}
      step={1}
      onValueChange={(value) => onChange({ years: value })}
    />
    <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
      복리 방식
      <select
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        value={input.compound}
        onChange={(event) => onChange({ compound: event.target.value as CompoundFrequency })}
      >
        {compoundOptionsByMode.recurring.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
    <NumberInput
      label="매월 적립 금액(원)"
      value={input.monthlyContribution}
      min={0}
      step={10000}
      onValueChange={(value) => onChange({ monthlyContribution: value })}
    />
  </>
);

type CompoundCalculatorProps = {
  mode: Mode;
};

export default function CompoundCalculator({ mode }: CompoundCalculatorProps) {
  const [lumpInput, setLumpInput] = useState<CalculatorInput>(lumpScenarios[0].input);
  const [recurringInput, setRecurringInput] = useState<CalculatorInput>(recurringDefault);
  const [recurringView, setRecurringView] = useState<'year' | 'month'>('year');
  const [calculatedInput, setCalculatedInput] = useState<CalculatorInput | null>(null);
  const [copied, setCopied] = useState(false);

  const input = mode === 'lump' ? lumpInput : recurringInput;
  const setInput = mode === 'lump' ? setLumpInput : setRecurringInput;
  const result = useMemo(
    () => (calculatedInput ? calculateCompound(calculatedInput) : null),
    [calculatedInput]
  );

  const handleScenario = (scenario: Scenario) => {
    if (scenario.input.mode === 'lump') {
      setLumpInput(scenario.input);
      setCalculatedInput(scenario.input);
      return;
    }

    setRecurringInput(scenario.input);
    setCalculatedInput(scenario.input);
  };

  const scenarios = mode === 'lump' ? lumpScenarios : recurringScenarios;
  const recurringRows =
    result && recurringView === 'month' ? result.monthly : (result?.yearly ?? []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (mode === 'lump') {
      const nextInput = {
        ...lumpScenarios[0].input,
        principal: parseNumberParam(params.get('p'), lumpScenarios[0].input.principal),
        annualRate: parseNumberParam(params.get('r'), lumpScenarios[0].input.annualRate),
        years: parseNumberParam(params.get('n'), lumpScenarios[0].input.years)
      };
      if (params.has('p') || params.has('r') || params.has('n')) {
        setLumpInput(nextInput);
        setCalculatedInput(nextInput);
      }
    } else {
      const nextInput = {
        ...recurringDefault,
        principal: parseNumberParam(params.get('p'), recurringDefault.principal),
        annualRate: parseNumberParam(params.get('r'), recurringDefault.annualRate),
        years: parseNumberParam(params.get('y'), recurringDefault.years),
        monthlyContribution: parseNumberParam(
          params.get('m'),
          recurringDefault.monthlyContribution
        ),
        compound: parseCompound(params.get('c'), recurringDefault.compound)
      };
      if (
        params.has('p') ||
        params.has('r') ||
        params.has('y') ||
        params.has('m') ||
        params.has('c')
      ) {
        setRecurringInput(nextInput);
        setCalculatedInput(nextInput);
      }
      if (params.get('v') === 'month') {
        setRecurringView('month');
      }
    }
  }, [mode]);

  useEffect(() => {
    if (!calculatedInput || typeof window === 'undefined') return;
    const params = buildQuery(mode, calculatedInput, recurringView);
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, '', url.toString());
  }, [calculatedInput, mode, recurringView]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const params = buildQuery(mode, input, recurringView);
    const url = new URL(window.location.href);
    url.search = params.toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      window.prompt('공유 링크를 복사하세요.', url.toString());
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">입력</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {mode === 'lump'
                  ? '수익률은 회차 기준이며, 기간(회차) 동안 동일하게 복리 적용합니다.'
                  : '수익률은 연 기준이며, 적립금은 매월 말 납입으로 가정합니다.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(modeLabels) as Mode[]).map((option) => (
                <a
                  key={option}
                  href={`${basePath}compound/${option}/`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    mode === option
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200'
                      : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  {modeLabels[option]}
                </a>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {mode === 'lump' ? (
                <LumpSumFields
                  input={input}
                  onChange={(patch) => setInput((prev) => updateInput(prev, patch))}
                />
              ) : (
                <RecurringFields
                  input={input}
                  onChange={(patch) => setInput((prev) => updateInput(prev, patch))}
                />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">결과</p>
          {result ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>최종 금액</span>
                <span className="text-base font-semibold text-emerald-600 dark:text-emerald-200">
                  {formatCurrency(result.finalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>총 납입 원금</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(result.totalContributed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>총 수익</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(result.totalInterest)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              계산하기 버튼을 눌러 결과를 확인하세요.
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {mode === 'lump'
                ? '거치식은 입력한 회차 기준으로 복리가 적용됩니다.'
                : '연복리 적립식은 월별 이자를 2자리 소수로 계산해 누적하고, 표에서는 원 단위로 반올림해 표시합니다.'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalculatedInput(input)}
                className="rounded-full border border-emerald-400 bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-600 hover:border-emerald-500 dark:text-emerald-200"
              >
                계산하기
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
              >
                {copied ? '복사됨' : '링크 복사'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">예시 시나리오</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <button
              key={scenario.label}
              type="button"
              onClick={() => handleScenario(scenario)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-left text-xs text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:text-slate-300"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {scenario.label}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {mode === 'lump'
              ? '회차별 요약'
              : recurringView === 'year'
                ? '연도별 요약'
                : '월별 요약'}
          </p>
          {mode === 'recurring' && (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setRecurringView('year')}
                className={`rounded-full border px-3 py-1 ${
                  recurringView === 'year'
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200'
                    : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
                }`}
              >
                년
              </button>
              <button
                type="button"
                onClick={() => setRecurringView('month')}
                className={`rounded-full border px-3 py-1 ${
                  recurringView === 'month'
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-600 dark:text-emerald-200'
                    : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
                }`}
              >
                월
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">
                  {mode === 'lump' ? '회차' : recurringView === 'year' ? '년도' : '월'}
                </th>
                {mode === 'recurring' && <th className="px-5 py-3">원금 누적</th>}
                <th className="px-5 py-3">{mode === 'lump' ? '회차 수익' : '수익 누적'}</th>
                <th className="px-5 py-3">{mode === 'lump' ? '누적 총액' : '최종 금액'}</th>
                {mode === 'lump' && <th className="px-5 py-3">누적 수익률</th>}
              </tr>
            </thead>
            <tbody>
              {!result || result.yearly.length === 0 ? (
                <tr>
                  <td
                    colSpan={mode === 'lump' ? 4 : 4}
                    className="px-5 py-6 text-center text-slate-500 dark:text-slate-400"
                  >
                    {result
                      ? mode === 'lump'
                        ? '기간을 입력하면 회차별 요약이 표시됩니다.'
                        : '기간을 입력하면 요약이 표시됩니다.'
                      : '계산하기 버튼을 눌러 결과를 확인하세요.'}
                  </td>
                </tr>
              ) : (
                (mode === 'lump' ? result.yearly : recurringRows).map((row) => (
                  <tr key={row.period} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-5 py-3">
                      {mode === 'lump'
                        ? row.period
                        : recurringView === 'year'
                          ? `${row.period}년`
                          : `${row.period}월`}
                    </td>
                    {mode === 'recurring' && (
                      <td className="px-5 py-3">{formatCurrency(row.contributedStart)}</td>
                    )}
                    <td className="px-5 py-3">
                      {mode === 'lump' && typeof row.periodInterest === 'number'
                        ? formatCurrency(row.periodInterest)
                        : formatCurrency(row.interestEarned)}
                    </td>
                    <td className="px-5 py-3">{formatCurrency(row.total)}</td>
                    {mode === 'lump' && (
                      <td className="px-5 py-3">
                        {formatPercent(
                          row.contributedStart === 0
                            ? 0
                            : (row.interestEarned / row.contributedStart) * 100
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
