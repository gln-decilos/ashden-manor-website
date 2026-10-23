// Enquiry form: inline validation written in the venue's voice, then an AJAX
// post to Netlify Forms (URL-encoded, as Netlify requires). Without JS the
// form still posts normally to "/".
const form = document.querySelector<HTMLFormElement>('form[name="enquiry"]');

type Rule = (value: string) => string | null;

const rules: Record<string, Rule> = {
  name: (v) => (v.trim() ? null : 'Please tell us your name.'),
  email: (v) => {
    if (!v.trim()) return 'We’ll need an email address to reply to you.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : 'That email address doesn’t look quite right.';
  },
  phone: (v) => {
    if (!v.trim()) return null;
    return v.replace(/\D/g, '').length >= 7 ? null : 'That number looks a little short. Leave it blank if you’d rather.';
  },
  guests: (v) => {
    if (!v.trim()) return 'Roughly how many guests? A guess is fine.';
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) return 'Please enter a whole number of guests.';
    if (n > 100)
      return 'Ashden welcomes up to 100 guests. If your list is longer, tell us in the message and we’ll be honest about whether it works.';
    return null;
  },
};

if (form) {
  const status = form.querySelector<HTMLElement>('.form__status')!;
  const submit = form.querySelector<HTMLButtonElement>('.form__submit')!;
  const submitLabel = submit.querySelector<HTMLElement>('.form__submit-label')!;
  const success = form.parentElement!.querySelector<HTMLElement>('.form-success')!;

  const fieldFor = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null;

  const check = (name: string): boolean => {
    const input = fieldFor(name);
    if (!input) return true;
    const message = rules[name](input.value);
    const error = document.getElementById(`${input.id}-err`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    input.closest('.field')?.classList.toggle('has-error', Boolean(message));
    if (error) error.textContent = message ?? '';
    return !message;
  };

  // Validate once someone has left a field, then live as they correct it.
  for (const name of Object.keys(rules)) {
    const input = fieldFor(name);
    if (!input) continue;
    input.addEventListener('blur', () => {
      if (input.value || input.dataset.touched) check(name);
      input.dataset.touched = 'true';
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') check(name);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';

    const invalid = Object.keys(rules).filter((name) => !check(name));
    if (invalid.length) {
      fieldFor(invalid[0])?.focus();
      status.textContent =
        invalid.length === 1 ? 'One thing needs a second look before we can send this.' : `${invalid.length} things need a second look before we can send this.`;
      return;
    }

    submit.disabled = true;
    form.classList.add('is-sending');
    submitLabel.textContent = 'Sending…';

    try {
      const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const first = fieldFor('name')!.value.trim().split(/\s+/)[0];
      success.querySelector('[data-success-name]')!.textContent = first ? `, ${first}` : '';
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      status.textContent = 'Sorry, that didn’t send. Please check your connection and try again.';
      submit.disabled = false;
      submitLabel.textContent = 'Send enquiry';
    } finally {
      form.classList.remove('is-sending');
    }
  });
}
