// Fades sections in as they scroll into view. Content is fully visible
// without JS (the hidden state only applies under html.js), and the effect
// is skipped entirely for visitors who prefer reduced motion.
const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduced || !('IntersectionObserver' in window)) {
  items.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

// Header picks up a hairline once the page has scrolled past the hero top.
const header = document.querySelector('.site-header');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
