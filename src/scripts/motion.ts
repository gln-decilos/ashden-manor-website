// Extra motion layer: split hero words, parallax, magnetic buttons, count-up.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero split-words
document.querySelectorAll<HTMLElement>('[data-split-words]').forEach((el) => {
  const raw = el.innerHTML;
  const parts = raw.split(/(\s+)/);
  let i = 0;
  let out = '';
  parts.forEach((part) => {
    if (part.trim() === '') { out += part; return; }
    out += `<span class="word" style="--d:${i}"><span>${part}</span></span>`;
    i++;
  });
  el.innerHTML = out;
});

// Parallax
if (!reduced) {
  const parallaxEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-parallax]'),
  );
  let ticking = false;
  const apply = () => {
    ticking = false;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - vh / 2) / vh;
      const speed = parseFloat(el.dataset.parallax || '0.1');
      const shift = -offset * speed * rect.height * 0.4;
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(apply); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

// Magnetic buttons
if (!reduced && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((btn) => {
    let raf = 0;
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.setProperty('--mx', `${x * 0.18}px`);
        btn.style.setProperty('--my', `${y * 0.25}px`);
      });
    });
    btn.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      btn.style.setProperty('--mx', '0px');
      btn.style.setProperty('--my', '0px');
    });
  });
}

// Count-up (the 100 watermark)
const counters = document.querySelectorAll<HTMLElement>('[data-count]');
if (counters.length) {
  const runCount = (el: HTMLElement) => {
    const target = parseInt(el.dataset.count || '0', 10);
    if (reduced) { el.textContent = String(target); return; }
    const dur = 1600;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round(ease(p) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          runCount(e.target as HTMLElement);
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  counters.forEach((c) => io.observe(c));
}