/**
 * 연복리 적립식 검증: 초기 100,000원, 매월 100,000원, 15년, 6%
 * - 매월 초 납입(1월은 초기금만), 당월 말 이자 적용
 */
import assert from 'node:assert/strict';
import { calculateCompound } from '../src/utils/compound.ts';

const roundWon = (value) => Math.round(value);

const input = {
  mode: 'recurring',
  principal: 100000,
  annualRate: 6,
  years: 15,
  compound: 'yearly',
  monthlyContribution: 100000
};

const result = calculateCompound(input);

// 월별: 기대 패턴 (1월=초기금만+이자, 2월~=매월 초 납입+이자). 이자 500원 단위 반올림
const expectedMonthly = [
  { period: 1, start: 100000, interest: 500, total: 100500 },
  { period: 2, start: 200500, interest: 1000, total: 201500 },
  { period: 12, start: 1233000, interest: 6000, total: 1239000 }
];
expectedMonthly.forEach((exp) => {
  const row = result.monthly.find((r) => r.period === exp.period);
  assert.ok(row, `Missing monthly period ${exp.period}`);
  assert.strictEqual(roundWon(row.contributedStart), exp.start, `month ${exp.period} start`);
  assert.strictEqual(roundWon(row.interestEarned), exp.interest, `month ${exp.period} interest`);
  assert.strictEqual(roundWon(row.total), exp.total, `month ${exp.period} total`);
});

// 15년차 월별·최종은 500원 단위 누적으로 기대표와 소폭 차이 가능
const month180 = result.monthly.find((r) => r.period === 180);
assert.ok(month180, 'Missing month 180');
assert.ok(
  roundWon(month180.total) >= 28800000 && roundWon(month180.total) <= 29300000,
  'month 180 total in range'
);

// 연도별: 1년차는 기대값과 정확히 일치
const year1 = result.yearly.find((r) => r.period === 1);
assert.ok(year1, 'Missing year 1');
assert.strictEqual(roundWon(year1.contributedStart), 1200000, 'year 1 원금 누적');
assert.strictEqual(roundWon(year1.interestEarned), 39000, 'year 1 연 이자');
assert.strictEqual(roundWon(year1.total), 1239000, 'year 1 최종 금액');

// 15년차 원금 = 전년 말 잔액 + 당해 연도 납입 12회 (SPEC)
assert.ok(
  Math.abs(roundWon(result.yearly.find((r) => r.period === 15).contributedStart) - 27237667) <=
    100000,
  'year 15 원금 (전년말+당해연도납입)'
);
assert.ok(Math.abs(roundWon(result.finalAmount) - 28838927) <= 1000, 'finalAmount');
assert.equal(roundWon(result.totalContributed), 18000000, 'totalContributed'); // 100000 + 179*100000 (1월 제외 179회 납입)

console.log('compound-recurring-15y.test.js passed');
console.log('  month 1:', result.monthly[0]);
console.log('  month 2:', result.monthly[1]);
console.log('  year 1:', result.yearly[0]);
console.log('  year 15:', result.yearly[14]);
console.log('  finalAmount:', result.finalAmount);
