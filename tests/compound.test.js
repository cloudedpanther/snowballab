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

  const expectedMonthly = [
    { period: 11, principal: 1022500, interest: 5000, total: 1027500 },
    { period: 12, principal: 1127500, interest: 5500, total: 1133000 },
    { period: 13, principal: 1233000, interest: 6165, total: 1239165 },
    { period: 14, principal: 1339165, interest: 6665, total: 1345830 },
    { period: 15, principal: 1445830, interest: 7165, total: 1452995 }
  ];

  expectedMonthly.forEach((expected) => {
    const row = monthly.find((item) => item.period === expected.period);
    assert.ok(row, `Missing monthly period ${expected.period}`);
    assert.equal(displayWon(row.contributedStart), expected.principal);
    assert.equal(displayWon(row.interestEarned), expected.interest);
    assert.equal(displayWon(row.total), expected.total);
  });

  const expectedYearly = [
    { period: 1, principal: 1100000, interest: 33000, total: 1133000 },
    { period: 2, principal: 2333000, interest: 106980, total: 2439980 }
  ];

  expectedYearly.forEach((expected) => {
    const row = yearly.find((item) => item.period === expected.period);
    assert.ok(row, `Missing yearly period ${expected.period}`);
    assert.equal(displayWon(row.contributedStart), expected.principal);
    assert.equal(displayWon(row.interestEarned), expected.interest);
    assert.equal(displayWon(row.total), expected.total);
  });
};

run();
console.log('compound.test.js passed');
