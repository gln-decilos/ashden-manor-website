// Checks src/scripts/pricing.ts against the venue's price list, written out
// again here from the brief as a flat table (a different shape from the code
// under test). Run with:  node scripts/check-pricing.mjs
import { calculateEstimate, clampWhole } from '../src/scripts/pricing.ts';

// month -> [Mon-Thu, Fri or Sun, Saturday], straight from the price list.
const list = {
  nov: [4500, 6000, 8000], dec: [4500, 6000, 8000], jan: [4500, 6000, 8000], feb: [4500, 6000, 8000], mar: [4500, 6000, 8000],
  apr: [5500, 7500, 10000], may: [5500, 7500, 10000], oct: [5500, 7500, 10000],
  jun: [6500, 9000, 12000], jul: [6500, 9000, 12000], aug: [6500, 9000, 12000], sep: [6500, 9000, 12000],
};
const dayIndex = { weekday: 0, frisun: 1, saturday: 2 };

let checked = 0;
const failures = [];
const expect = (label, got, want) => {
  checked++;
  if (got !== want) failures.push(`${label}: got ${got}, want ${want}`);
};

for (const [month, rates] of Object.entries(list)) {
  for (const [day, i] of Object.entries(dayIndex)) {
    for (let guests = 1; guests <= 100; guests++) {
      for (const evening of [0, 1, 17, 100]) {
        for (const garden of [false, true]) {
          for (const dressing of [false, true]) {
            const want =
              rates[i] +
              (guests > 50 ? (guests - 50) * 95 : 0) +
              evening * 45 +
              (garden ? 750 : 0) +
              (dressing ? 400 : 0);
            const got = calculateEstimate({ month, day, dayGuests: guests, eveningGuests: evening, garden, dressing }).total;
            expect(`${month}/${day}/${guests}/${evening}/${garden}/${dressing}`, got, want);
          }
        }
      }
    }
  }
}

// Spot checks worked out by hand, so the loop above isn't only checking itself.
const base = { dayGuests: 50, eveningGuests: 0, garden: false, dressing: false };
expect('Jan Mon-Thu, 50', calculateEstimate({ ...base, month: 'jan', day: 'weekday' }).total, 4500);
expect('Jun Sat, 50', calculateEstimate({ ...base, month: 'jun', day: 'saturday' }).total, 12000);
expect('Oct Fri, 51 (one extra)', calculateEstimate({ ...base, month: 'oct', day: 'frisun', dayGuests: 51 }).total, 7595);
expect('Jul Sun, 100', calculateEstimate({ ...base, month: 'jul', day: 'frisun', dayGuests: 100 }).total, 13750);
expect('Dec Sat, 80 + 30 evening + garden', calculateEstimate({ month: 'dec', day: 'saturday', dayGuests: 80, eveningGuests: 30, garden: true, dressing: false }).total, 8000 + 2850 + 1350 + 750);
expect('Everything on: Sep Sat', calculateEstimate({ month: 'sep', day: 'saturday', dayGuests: 100, eveningGuests: 100, garden: true, dressing: true }).total, 12000 + 4750 + 4500 + 750 + 400);

// Awkward input is held inside the limits, never priced as something else.
expect('101 guests priced as 100', calculateEstimate({ ...base, month: 'jun', day: 'weekday', dayGuests: 101 }).dayGuests, 100);
expect('0 guests priced as 1', calculateEstimate({ ...base, month: 'jun', day: 'weekday', dayGuests: 0 }).dayGuests, 1);
expect('NaN guests priced as 1', calculateEstimate({ ...base, month: 'jun', day: 'weekday', dayGuests: NaN }).dayGuests, 1);
expect('-5 evening priced as 0', calculateEstimate({ ...base, month: 'jun', day: 'weekday', eveningGuests: -5 }).eveningGuests, 0);
expect('clampWhole("42abc")', clampWhole('42abc', 1, 100), 42);
expect('clampWhole(7.9)', clampWhole(7.9, 1, 100), 7);

console.log(`${checked} checks run.`);
if (failures.length) {
  console.error(`${failures.length} FAILED`);
  failures.slice(0, 20).forEach((f) => console.error(' ', f));
  process.exit(1);
}
console.log('All prices match the venue price list.');
