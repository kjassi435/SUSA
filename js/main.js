// ═══════════════ HEADER SCROLL ═══════════════
const header = document.getElementById('header');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  header.classList.toggle('scrolled', currentScroll > 30);
  lastScroll = currentScroll;
});

// ═══════════════ MOBILE NAV ═══════════════
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const mobileClose = document.getElementById('mobileClose');

function openMobileNav() {
  hamburger.classList.add('active');
  mobileNav.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
  hamburger.classList.remove('active');
  mobileNav.classList.remove('active');
  document.body.style.overflow = '';
}
hamburger.addEventListener('click', () => {
  if (mobileNav.classList.contains('active')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});
if (mobileClose) {
  mobileClose.addEventListener('click', closeMobileNav);
}
// Close on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileNav();
});

// ═══════════════ SCROLL REVEAL ═══════════════
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in').forEach(el => revealObserver.observe(el));

// ═══════════════ GALLERY FILTER ═══════════════
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    const items = document.querySelectorAll('.gallery-item');
    items.forEach((item, i) => {
      const show = filter === 'all' || item.dataset.category === filter;
      setTimeout(() => {
        item.style.opacity = show ? '1' : '0.2';
        item.style.transform = show ? 'scale(1)' : 'scale(0.97)';
        item.style.pointerEvents = show ? 'auto' : 'none';
      }, i * 40);
    });
  });
});

// ═══════════════ SMOOTH SCROLL ═══════════════
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileNav();
    }
  });
});

// ═══════════════ COUNTER ANIMATION ═══════════════
function animateCounter(el) {
  const text = el.textContent;
  const num = parseInt(text);
  const suffix = text.replace(/[0-9]/g, '');
  if (isNaN(num)) return;
  let current = 0;
  const increment = Math.max(1, Math.ceil(num / 40));
  const interval = setInterval(() => {
    current += increment;
    if (current >= num) {
      current = num;
      clearInterval(interval);
    }
    el.textContent = current + suffix;
  }, 25);
}

const heroStatsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('.hero-stat strong').forEach(el => animateCounter(el));
    heroStatsObserver.disconnect();
  }
}, { threshold: 0.5 });
const heroStatsEl = document.querySelector('.hero-stats');
if (heroStatsEl) heroStatsObserver.observe(heroStatsEl);

// ═══════════════ IMAGE LAZY LOAD FALLBACK ═══════════════
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', function() {
    this.style.background = 'linear-gradient(135deg, #3A1E16, #5C3526, #C8962E)';
    this.style.minHeight = '200px';
    this.alt = '';
  });
});
