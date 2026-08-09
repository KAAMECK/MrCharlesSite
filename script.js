const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const backToTop = document.querySelector('.back-to-top');

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
};

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
  navigation.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1020) closeMenu();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const clientTrack = document.querySelector('.client-track');
document.querySelector('.client-arrow.prev').addEventListener('click', () => {
  clientTrack.scrollBy({ left: -clientTrack.clientWidth * 0.7, behavior: 'smooth' });
});
document.querySelector('.client-arrow.next').addEventListener('click', () => {
  clientTrack.scrollBy({ left: clientTrack.clientWidth * 0.7, behavior: 'smooth' });
});

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('is-visible', window.scrollY > 700);
}, { passive: true });

const newsletter = document.querySelector('.newsletter form');
newsletter.addEventListener('submit', (event) => {
  event.preventDefault();
  newsletter.querySelector('.form-status').textContent = 'Formulaire en attente des informations définitives (#).';
});

document.getElementById('year').textContent = new Date().getFullYear();
