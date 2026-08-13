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

const contactForm = document.querySelector('#contact-form');
const contactFormStatus = document.querySelector('#contact-form-status');
const submissionReceipt = document.querySelector('#submission-receipt');
const receiptReference = document.querySelector('#receipt-reference');
const receiptDate = document.querySelector('#receipt-date');
const receiptTime = document.querySelector('#receipt-time');

const kinshasaDate = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Kinshasa', dateStyle: 'long' });
const kinshasaTime = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Kinshasa', hour: '2-digit', minute: '2-digit', second: '2-digit' });

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const nom = String(data.get('nom') || '').trim();
  const email = String(data.get('email') || '').trim();
  const besoin = String(data.get('besoin') || '').trim();
  const website = String(data.get('website') || '').trim();
  const apiUrl = window.UV_CONFIG?.apiUrl;
  const whatsappNumber = window.UV_CONFIG?.whatsappNumber || '243848392035';
  const button = contactForm.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('.submit-button-label');
  const message = [
    'Bonjour Usemi Vizuri Consulting,',
    '',
    'Je vous contacte depuis votre site.',
    'Nom complet : ' + nom,
    'Adresse e-mail : ' + email,
    'Description brève du besoin : ' + besoin
  ].join('\n');
  const whatsappUrl = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message);

  button.disabled = true;
  button.classList.add('is-loading');
  buttonLabel.textContent = 'Transmission en cours…';
  contactForm.setAttribute('aria-busy', 'true');
  contactFormStatus.textContent = 'Ouverture de WhatsApp et enregistrement de votre demande…';
  contactFormStatus.classList.remove('is-error');
  submissionReceipt.hidden = true;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

  if (!apiUrl || apiUrl === '#') {
    contactFormStatus.textContent = 'WhatsApp a été préparé. Le registre Google Sheets doit encore être autorisé par son compte propriétaire.';
    button.disabled = false;
    button.classList.remove('is-loading');
    buttonLabel.textContent = 'Envoyer et ouvrir WhatsApp';
    contactForm.removeAttribute('aria-busy');
    return;
  }

  const payload = new URLSearchParams({ nom, email, besoin, source: 'Site web', website });
  fetch(apiUrl, { method: 'POST', body: payload })
    .then((response) => response.json())
    .then((result) => {
      if (!result.ok) throw new Error(result.error || 'Enregistrement impossible');
      const receivedAt = new Date(result.receivedAt || Date.now());
      receiptReference.textContent = result.reference || '#';
      receiptDate.textContent = kinshasaDate.format(receivedAt);
      receiptTime.textContent = kinshasaTime.format(receivedAt);
      submissionReceipt.hidden = false;
      contactFormStatus.textContent = result.emailSent === false
        ? 'Demande enregistrée. La notification e-mail devra être vérifiée.'
        : 'Demande enregistrée et transmise avec succès.';
      contactForm.reset();
      submissionReceipt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(() => {
      contactFormStatus.textContent = 'WhatsApp a été préparé, mais le registre n’a pas répondu. Vérifiez votre connexion puis réessayez.';
      contactFormStatus.classList.add('is-error');
    })
    .finally(() => {
      button.disabled = false;
      button.classList.remove('is-loading');
      buttonLabel.textContent = 'Envoyer et ouvrir WhatsApp';
      contactForm.removeAttribute('aria-busy');
    });
});

const newsletter = document.querySelector('.newsletter form');
newsletter.addEventListener('submit', (event) => {
  event.preventDefault();
  newsletter.querySelector('.form-status').textContent = 'Merci. L’inscription en ligne sera activée prochainement.';
});

document.getElementById('year').textContent = new Date().getFullYear();
