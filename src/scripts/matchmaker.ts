// MatchMaker: a live, itemised price for a full-day exclusive-use wedding.
// All arithmetic lives in ./pricing.ts (tested against the venue's price list);
// this file only reads the form, renders the result and handles the lead form.
import {
  BAND_LABEL, DAY_NAME, EVENING_GUEST, EXTRA_DAY_GUEST, INCLUDED_DAY_GUESTS,
  MAX_DAY_GUESTS, MAX_EVENING_GUESTS, MONTH_NAME, calculateEstimate, clampWhole, money,
  type DayKey, type Estimate, type MonthKey,
} from './pricing';

const root = document.querySelector<HTMLElement>('[data-matchmaker]');

if (root) {
  const section = document.getElementById('matchmaker')!;
  const form = root.querySelector<HTMLFormElement>('[data-mm-form]')!;
  const dayInput = form.querySelector<HTMLInputElement>('#mm-day-guests')!;
  const dayRange = form.querySelector<HTMLInputElement>('#mm-day-range')!;
  const eveningInput = form.querySelector<HTMLInputElement>('#mm-evening-guests')!;
  const garden = form.querySelector<HTMLInputElement>('input[name="garden"]')!;
  const dressing = form.querySelector<HTMLInputElement>('input[name="dressing"]')!;
  const dayMsg = form.querySelector<HTMLElement>('#mm-day-msg')!;
  const eveningMsg = form.querySelector<HTMLElement>('#mm-evening-msg')!;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const setText = (selector: string, value: string) => { $(selector).textContent = value; };
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  const chosen = (name: string) =>
    form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '';

  // Read a guest box. While someone is typing we never rewrite the box (so
  // clearing it to type a new number works); we only count a sensible value.
  const readGuests = (input: HTMLInputElement, min: number, max: number) => {
    const raw = input.value.trim();
    const typed = Number(raw);
    const value = clampWhole(raw === '' ? min : typed, min, max);
    const outOfRange = raw !== '' && (!Number.isFinite(typed) || typed < min || typed > max);
    return { value, outOfRange, typed };
  };

  let last: Estimate | null = null;
  let announceTimer = 0;

  const render = (e: Estimate, month: MonthKey, day: DayKey) => {
    const extraNote = e.additionalDayGuests
      ? `${e.additionalDayGuests} × ${money(EXTRA_DAY_GUEST)}`
      : `First ${INCLUDED_DAY_GUESTS} included`;
    const eveningNote = e.eveningGuests ? `${e.eveningGuests} × ${money(EVENING_GUEST)} · from 8 pm` : 'None added';

    setText('[data-mm-summary]',
      `${MONTH_NAME[month]} · ${DAY_NAME[day]} · ${e.dayGuests} day ${plural(e.dayGuests, 'guest', 'guests')}` +
      (e.eveningGuests ? ` · ${e.eveningGuests} evening ${plural(e.eveningGuests, 'guest', 'guests')}` : ''));
    setText('[data-mm-venue-note]', `${BAND_LABEL[e.band]} · ${DAY_NAME[day]}`);
    setText('[data-mm-venue]', money(e.venue));
    setText('[data-mm-day-note]', extraNote);
    setText('[data-mm-day-cost]', e.additionalDayCost ? money(e.additionalDayCost) : 'Included');
    setText('[data-mm-evening-note]', eveningNote);
    setText('[data-mm-evening-cost]', e.eveningCost ? money(e.eveningCost) : '—');
    setText('[data-mm-garden]', e.gardenCost ? money(e.gardenCost) : '—');
    setText('[data-mm-dressing]', e.dressingCost ? money(e.dressingCost) : '—');
    setText('[data-mm-total-line]', money(e.total));
    const barTotal = section.querySelector<HTMLElement>('[data-mm-bar-total]');
    if (barTotal) barTotal.textContent = money(e.total);
    setText('[data-mm-total]', money(e.total));

    const zero = (row: string, isZero: boolean) =>
      $(`[data-mm-row="${row}"]`).classList.toggle('is-zero', isZero);
    zero('day', !e.additionalDayCost);
    zero('evening', !e.eveningCost);
    zero('garden', !e.gardenCost);
    zero('dressing', !e.dressingCost);

    // Hidden fields travel with the lead so the venue sees exactly what was priced.
    const breakdown = [
      `Month: ${MONTH_NAME[month]} (${BAND_LABEL[e.band]})`,
      `Day: ${DAY_NAME[day]}`,
      `Exclusive use: ${money(e.venue)}`,
      `Day guests: ${e.dayGuests} (${e.additionalDayGuests} additional × ${money(EXTRA_DAY_GUEST)} = ${money(e.additionalDayCost)})`,
      `Evening guests: ${e.eveningGuests} × ${money(EVENING_GUEST)} = ${money(e.eveningCost)}`,
      `Garden ceremony: ${e.gardenCost ? money(e.gardenCost) : 'No'}`,
      `Dressing room the night before: ${e.dressingCost ? money(e.dressingCost) : 'No'}`,
      `Estimated total: ${money(e.total)}`,
    ].join(' | ');
    $<HTMLInputElement>('[data-mm-hidden-estimate]').value = breakdown;
    $<HTMLInputElement>('[data-mm-hidden-total]').value = money(e.total);

    if (last && last.total !== e.total) {
      const total = $('[data-mm-total]');
      if (!reduced) {
        total.classList.remove('is-pulse');
        void total.offsetWidth; // restart the animation
        total.classList.add('is-pulse');
      }
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        setText('[data-mm-announce]', `Estimated total ${money(e.total)}`);
      }, 500);
    }
    last = e;
  };

  const update = () => {
    const day = readGuests(dayInput, 1, MAX_DAY_GUESTS);
    const evening = readGuests(eveningInput, 0, MAX_EVENING_GUESTS);

    dayMsg.textContent = day.outOfRange
      ? day.typed > MAX_DAY_GUESTS
        ? `Ashden welcomes up to ${MAX_DAY_GUESTS} guests through the day, so we’ve priced ${MAX_DAY_GUESTS}.`
        : 'Please enter at least 1 guest.'
      : '';
    eveningMsg.textContent = evening.outOfRange
      ? evening.typed > MAX_EVENING_GUESTS
        ? `We’ve priced the most we can show here, ${MAX_EVENING_GUESTS}. Tell us the real number when you get in touch.`
        : 'Evening guests can’t be fewer than none.'
      : '';
    dayInput.setAttribute('aria-invalid', String(day.outOfRange));
    eveningInput.setAttribute('aria-invalid', String(evening.outOfRange));

    dayRange.value = String(day.value);
    dayRange.style.setProperty('--fill', `${((day.value - 1) / (MAX_DAY_GUESTS - 1)) * 100}%`);

    const month = chosen('month') as MonthKey;
    const dayKey = chosen('day') as DayKey;
    const e = calculateEstimate({
      month, day: dayKey,
      dayGuests: day.value, eveningGuests: evening.value,
      garden: garden.checked, dressing: dressing.checked,
    });

    form.querySelector<HTMLButtonElement>('[data-step="day"][data-change="-1"]')!.disabled = day.value <= 1;
    form.querySelector<HTMLButtonElement>('[data-step="day"][data-change="1"]')!.disabled = day.value >= MAX_DAY_GUESTS;
    form.querySelector<HTMLButtonElement>('[data-step="evening"][data-change="-1"]')!.disabled = evening.value <= 0;
    form.querySelector<HTMLButtonElement>('[data-step="evening"][data-change="1"]')!.disabled = evening.value >= MAX_EVENING_GUESTS;

    render(e, month, dayKey);
  };

  // Tidy the boxes once someone has finished typing.
  const normalise = (input: HTMLInputElement, min: number, max: number) => {
    input.value = String(clampWhole(input.value === '' ? min : input.value, min, max));
    update();
  };
  dayInput.addEventListener('change', () => normalise(dayInput, 1, MAX_DAY_GUESTS));
  eveningInput.addEventListener('change', () => normalise(eveningInput, 0, MAX_EVENING_GUESTS));
  dayInput.addEventListener('blur', () => normalise(dayInput, 1, MAX_DAY_GUESTS));
  eveningInput.addEventListener('blur', () => normalise(eveningInput, 0, MAX_EVENING_GUESTS));

  form.addEventListener('input', (event) => {
    if (event.target === dayRange) dayInput.value = dayRange.value;
    update();
  });
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => event.preventDefault()); // Enter in a guest box does nothing odd

  form.querySelectorAll<HTMLButtonElement>('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const isDay = button.dataset.step === 'day';
      const input = isDay ? dayInput : eveningInput;
      const [min, max] = isDay ? [1, MAX_DAY_GUESTS] : [0, MAX_EVENING_GUESTS];
      const current = readGuests(input, min, max).value;
      input.value = String(clampWhole(current + Number(button.dataset.change), min, max));
      update();
    });
  });

  form.querySelector('[data-mm-reset]')?.addEventListener('click', () => {
    form.reset();
    // Browsers keep "checked" from the markup on reset, but be explicit.
    form.querySelector<HTMLInputElement>('input[name="month"][value="jun"]')!.checked = true;
    form.querySelector<HTMLInputElement>('input[name="day"][value="saturday"]')!.checked = true;
    dayInput.value = '50';
    eveningInput.value = '0';
    garden.checked = false;
    dressing.checked = false;
    update();
  });

  // Mobile: a slim bar keeps the total visible until the full estimate is on screen.
  const bar = section.querySelector<HTMLElement>('[data-mm-bar]');
  const panel = document.getElementById('mm-estimate')!;
  if (bar && 'IntersectionObserver' in window) {
    const narrow = window.matchMedia('(max-width: 959px)');
    const lead = root.querySelector<HTMLElement>('.matchmaker__lead')!;
    let inSection = false;
    let panelInView = false;
    let leadInView = false;
    const sync = () => { bar.hidden = !(narrow.matches && inSection && !panelInView && !leadInView); };
    new IntersectionObserver(([entry]) => { inSection = entry.isIntersecting; sync(); }, { threshold: 0.05 }).observe(section);
    new IntersectionObserver(([entry]) => { panelInView = entry.isIntersecting; sync(); }, { threshold: 0.15 }).observe(panel);
    new IntersectionObserver(([entry]) => { leadInView = entry.isIntersecting; sync(); }, { threshold: 0.1 }).observe(lead);
    narrow.addEventListener('change', sync);
  }

  // Lead capture: same voice and behaviour as the enquiry form.
  const leadForm = root.querySelector<HTMLFormElement>('[data-mm-lead]')!;
  const status = leadForm.querySelector<HTMLElement>('.form__status')!;
  const submit = leadForm.querySelector<HTMLButtonElement>('.form__submit')!;
  const submitLabel = submit.querySelector<HTMLElement>('.form__submit-label')!;
  const success = root.querySelector<HTMLElement>('.form-success')!;

  const rules: Record<string, (value: string) => string | null> = {
    name: (v) => (v.trim() ? null : 'Please tell us your name.'),
    email: (v) => {
      if (!v.trim()) return 'We’ll need an email address to reply to you.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'That email address doesn’t look quite right.';
    },
  };
  const field = (name: string) => leadForm.elements.namedItem(name) as HTMLInputElement;
  const check = (name: string) => {
    const input = field(name);
    const message = rules[name](input.value);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    input.closest('.field')?.classList.toggle('has-error', Boolean(message));
    document.getElementById(`${input.id}-err`)!.textContent = message ?? '';
    return !message;
  };
  for (const name of Object.keys(rules)) {
    const input = field(name);
    input.addEventListener('blur', () => { if (input.value || input.dataset.touched) check(name); input.dataset.touched = 'true'; });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(name); });
  }

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    const invalid = Object.keys(rules).filter((name) => !check(name));
    if (invalid.length) {
      field(invalid[0]).focus();
      status.textContent = invalid.length === 1 ? 'One thing needs a second look before we can send this.' : `${invalid.length} things need a second look before we can send this.`;
      return;
    }
    submit.disabled = true;
    leadForm.classList.add('is-sending');
    submitLabel.textContent = 'Sending…';
    try {
      const body = new URLSearchParams(new FormData(leadForm) as unknown as Record<string, string>).toString();
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const first = field('name').value.trim().split(/\s+/)[0];
      success.querySelector('[data-success-name]')!.textContent = first ? `, ${first}` : '';
      success.querySelector('[data-success-copy]')!.textContent =
        `Your estimate of ${last ? money(last.total) : ''} is with the Ashden team. Someone will be in touch personally, usually to suggest a time to come and look round.`;
      leadForm.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      status.textContent = 'Sorry, that didn’t send. Please check your connection and try again.';
      submit.disabled = false;
      submitLabel.textContent = 'Send me my estimate';
    } finally {
      leadForm.classList.remove('is-sending');
    }
  });

  // Export the live estimate as a branded, shareable PNG receipt.
  const downloadButton = root.querySelector<HTMLButtonElement>('[data-mm-download]');
  downloadButton?.addEventListener('click', async () => {
    if (!last) return;
    const month = chosen('month') as MonthKey;
    const day = chosen('day') as DayKey;
    const estimate = last;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 1500;
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);

    const ink = '#1e1e1c';
    const olive = '#3b4034';
    const linen = '#e9d9c7';
    const chalk = '#f5f1ea';
    const bronze = '#907b60';
    ctx.fillStyle = chalk;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = olive;
    ctx.fillRect(54, 54, width - 108, height - 108);
    ctx.strokeStyle = 'rgba(233,217,199,.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(78, 78, width - 156, height - 156);

    const logo = new Image();
    logo.src = '/img/logo-crest-chalk.webp';
    try { await logo.decode(); } catch { /* Text wordmark remains if the logo cannot load. */ }
    if (logo.complete && logo.naturalWidth) {
      const logoW = 112;
      const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
      ctx.drawImage(logo, (width - logoW) / 2, 116, logoW, logoH);
    }

    const center = (text: string, y: number, font: string, color = chalk) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, y);
    };
    center('ASHDEN MANOR', 310, '500 25px Cinzel, Georgia, serif', linen);
    ctx.fillStyle = bronze;
    ctx.fillRect(500, 344, 200, 2);
    center('YOUR WEDDING ESTIMATE', 408, '500 22px Cinzel, Georgia, serif', linen);
    center(`${MONTH_NAME[month]}  ·  ${DAY_NAME[day]}`, 465, 'italic 30px "Cormorant Garamond", Georgia, serif');
    center(`${estimate.dayGuests} day guests${estimate.eveningGuests ? `  ·  ${estimate.eveningGuests} evening guests` : ''}`, 510, 'italic 25px "Cormorant Garamond", Georgia, serif', linen);

    const left = 142;
    const right = width - 142;
    let y = 590;
    const rule = () => {
      ctx.strokeStyle = 'rgba(233,217,199,.28)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
    };
    const row = (label: string, detail: string, amount: string) => {
      y += 26;
      ctx.textAlign = 'left';
      ctx.fillStyle = chalk;
      ctx.font = '30px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(label, left, y);
      ctx.textAlign = 'right';
      ctx.font = '600 27px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(amount, right, y);
      if (detail) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(245,241,234,.72)';
        ctx.font = 'italic 21px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(detail, left, y + 30);
      }
      y += 58;
      rule();
    };
    row('Exclusive use, full day', `${BAND_LABEL[estimate.band]}  ·  ${DAY_NAME[day]}`, money(estimate.venue));
    row('Additional day guests', estimate.additionalDayGuests ? `${estimate.additionalDayGuests} × ${money(EXTRA_DAY_GUEST)} · first 50 included` : 'First 50 guests included', estimate.additionalDayCost ? money(estimate.additionalDayCost) : 'Included');
    row('Evening guests', estimate.eveningGuests ? `${estimate.eveningGuests} × ${money(EVENING_GUEST)} · joining from 8 pm` : 'None added', estimate.eveningCost ? money(estimate.eveningCost) : '—');
    row('Ceremony in the gardens', garden.checked ? 'Rather than the ceremony room' : 'Not selected', estimate.gardenCost ? money(estimate.gardenCost) : '—');
    row('Private dressing room', dressing.checked ? 'The night before the wedding' : 'Not selected', estimate.dressingCost ? money(estimate.dressingCost) : '—');

    y += 42;
    ctx.textAlign = 'left';
    ctx.fillStyle = linen;
    ctx.font = '500 21px Cinzel, Georgia, serif';
    ctx.fillText('ESTIMATED TOTAL', left, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = chalk;
    ctx.font = '500 58px Cinzel, Georgia, serif';
    ctx.fillText(money(estimate.total), right, y + 68);

    const footerY = height - 190;
    ctx.strokeStyle = bronze;
    ctx.beginPath(); ctx.moveTo(390, footerY - 34); ctx.lineTo(810, footerY - 34); ctx.stroke();
    center('Exclusive use includes the manor, gardens, dining room', footerY + 8, 'italic 22px "Cormorant Garamond", Georgia, serif', linen);
    center('and ceremony room. All figures are Ashden Manor’s own.', footerY + 40, 'italic 22px "Cormorant Garamond", Georgia, serif', linen);
    center('A GUIDE TO YOUR DAY  ·  SUBJECT TO CONFIRMATION', footerY + 100, '500 15px Cinzel, Georgia, serif', 'rgba(245,241,234,.72)');

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ashden-manor-estimate-${month}-${day}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  });

  update();
}
