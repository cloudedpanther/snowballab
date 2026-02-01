import assert from 'node:assert/strict';
import { calculateCompound } from '../src/utils/compound.ts';

const displayWon = (value) => {
  const scaled = BigInt(Math.round(value * 100));
  return Number((scaled + 50n) / 100n);
};

const run = () => {
  const result = calculateCompound({
    mode: 'recurring',
    principal: 0,
    annualRate: 6,
    years: 2,
    compound: 'yearly',
    monthlyContribution: 100000
  });

  const monthly = result.monthly;
  const yearly = result.yearly;

  // 연복리 적립식(SPEC): principal 0이면 1년차 1월 (0,0,0), 2월부터 적립. 연도 경계 단리.
  const expectedMonthly = [
    { period: 11, principal: 1022500, interest: 5000, total: 1027500 },
    { period: 12, principal: 1127500, interest: 5500, total: 1133000 },
    { period: 13, principal: 1233000, interest: 6165, total: 1239165 },
    { period: 14, principal: 1339165, interest: 6665, total: 1345830 },
    { period: 15, principal: 1445830, interest: 7165, total: 1452995 }
  ];

  const tol = 500;
  expectedMonthly.forEach((expected) => {
    const row = monthly.find((item) => item.period === expected.period);
    assert.ok(row, `Missing monthly period ${expected.period}`);
    assert.ok(Math.abs(displayWon(row.contributedStart) - expected.principal) <= tol);
    assert.ok(Math.abs(displayWon(row.interestEarned) - expected.interest) <= tol);
    assert.ok(Math.abs(displayWon(row.total) - expected.total) <= tol);
  });

  const expectedYearly = [
    { period: 1, principal: 1100000, interest: 33000, total: 1133000 },
    { period: 2, principal: 2333000, interest: 106980, total: 2439980 }
  ];

  const yearlyTol = 1000;
  expectedYearly.forEach((expected) => {
    const row = yearly.find((item) => item.period === expected.period);
    assert.ok(row, `Missing yearly period ${expected.period}`);
    assert.ok(Math.abs(displayWon(row.contributedStart) - expected.principal) <= yearlyTol);
    assert.ok(Math.abs(displayWon(row.interestEarned) - expected.interest) <= yearlyTol);
    assert.ok(Math.abs(displayWon(row.total) - expected.total) <= yearlyTol);
  });
};

run();
console.log('compound.test.js passed');
