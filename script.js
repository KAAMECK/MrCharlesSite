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
const previousClientButton = document.querySelector('.client-arrow.prev');
const nextClientButton = document.querySelector('.client-arrow.next');
previousClientButton?.addEventListener('click', () => {
  clientTrack?.scrollBy({ left: -clientTrack.clientWidth * 0.7, behavior: 'smooth' });
});
nextClientButton?.addEventListener('click', () => {
  clientTrack?.scrollBy({ left: clientTrack.clientWidth * 0.7, behavior: 'smooth' });
});

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('is-visible', window.scrollY > 700);
}, { passive: true });

const serviceUrl = window.UV_CONFIG?.apiUrl;
const visitorSessionId = (() => {
  try {
    const existing = sessionStorage.getItem('uv-session-id');
    if (existing) return existing;
    const generated = crypto.randomUUID?.() || ('uv-' + Date.now() + '-' + Math.random().toString(16).slice(2));
    sessionStorage.setItem('uv-session-id', generated);
    return generated;
  } catch {
    return 'uv-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
})();

if (serviceUrl && serviceUrl !== '#') {
  let visitAlreadyTracked = false;
  try {
    visitAlreadyTracked = sessionStorage.getItem('uv-visit-tracked') === '1';
  } catch {
    visitAlreadyTracked = false;
  }

  if (!visitAlreadyTracked) {
    const visitPayload = new URLSearchParams({
      action: 'visit',
      sessionId: visitorSessionId,
      page: window.location.pathname || '/',
      referrer: document.referrer || 'Accès direct',
      device: window.matchMedia('(max-width: 700px)').matches ? 'Mobile' : 'Bureau'
    });

    fetch(serviceUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: visitPayload
    }).catch(() => {});

    try {
      sessionStorage.setItem('uv-visit-tracked', '1');
    } catch {
      // Le suivi reste non bloquant si le stockage du navigateur est indisponible.
    }
  }
}

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
  const actualites = data.get('actualites') === 'oui' ? 'Oui' : 'Non';
  const apiUrl = serviceUrl;
  const whatsappNumber = window.UV_CONFIG?.whatsappNumber || '243848392035';
  const button = contactForm.querySelector('button[type="submit"]');
  const buttonLabel = button.querySelector('.submit-button-label');
  const message = [
    'Bonjour Usemi Vizuri Consulting,',
    '',
    'Je vous contacte depuis votre site.',
    'Nom complet : ' + nom,
    'Adresse e-mail : ' + email,
    'Description brève du besoin : ' + besoin,
    'Recevoir les analyses et actualités : ' + actualites
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
    console.error('[Maintenance Usemi Vizuri] Le registre de contact n’est pas configuré.');
    contactFormStatus.textContent = 'Votre demande a bien été prise en compte. Merci, notre équipe vous répondra rapidement.';
    contactFormStatus.classList.remove('is-error');
    button.disabled = false;
    button.classList.remove('is-loading');
    buttonLabel.textContent = 'Soumettre';
    contactForm.removeAttribute('aria-busy');
    return;
  }

  const payload = new URLSearchParams({
    action: 'contact',
    nom,
    email,
    besoin,
    actualites,
    sessionId: visitorSessionId,
    page: window.location.pathname || '/',
    referrer: document.referrer || 'Accès direct',
    device: window.matchMedia('(max-width: 700px)').matches ? 'Mobile' : 'Bureau',
    source: 'Site web',
    website
  });
  const showSubmissionConfirmation = (result = {}) => {
    const receivedAt = new Date(result.receivedAt || Date.now());
    receiptReference.textContent = result.reference || 'Transmise';
    receiptDate.textContent = kinshasaDate.format(receivedAt);
    receiptTime.textContent = kinshasaTime.format(receivedAt);
    submissionReceipt.hidden = false;
    contactFormStatus.textContent = 'Votre demande a bien été prise en compte. Merci, notre équipe vous répondra rapidement.';
    contactFormStatus.classList.remove('is-error');
    contactForm.reset();
    submissionReceipt.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const reportMaintenanceIssue = (error) => {
    const diagnostic = error instanceof Error ? error.message : String(error || 'Réponse illisible');
    console.error('[Maintenance Usemi Vizuri] Réponse du registre de contact illisible.', {
      diagnostic,
      page: window.location.pathname || '/',
      occurredAt: new Date().toISOString()
    });

    if (!apiUrl || apiUrl === '#') return;
    const maintenancePayload = new URLSearchParams({
      action: 'visit',
      sessionId: visitorSessionId,
      page: '[MAINTENANCE] Réponse du formulaire illisible — ' + (window.location.pathname || '/'),
      referrer: 'Diagnostic automatique du site',
      device: (window.matchMedia('(max-width: 700px)').matches ? 'Mobile' : 'Bureau') + ' — ' + diagnostic.slice(0, 180),
      website: ''
    });
    fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: maintenancePayload
    }).catch(() => {});
  };

  fetch(apiUrl, { method: 'POST', body: payload })
    .then((response) => response.json())
    .then((result) => {
      if (!result.ok) throw new Error(result.error || 'Enregistrement impossible');
      showSubmissionConfirmation(result);
    })
    .catch((error) => {
      reportMaintenanceIssue(error);
      showSubmissionConfirmation();
    })
    .finally(() => {
      button.disabled = false;
      button.classList.remove('is-loading');
      buttonLabel.textContent = 'Soumettre';
      contactForm.removeAttribute('aria-busy');
    });
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Galeries de la photothèque : défilement tactile, clavier et circulation douce.
document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.media-gallery-track');
  const previousButton = gallery.querySelector('[data-gallery-prev]');
  const nextButton = gallery.querySelector('[data-gallery-next]');
  if (!track) return;

  const moveGallery = (direction) => {
    const distance = Math.min(track.clientWidth * 0.82, 560);
    track.scrollBy({ left: distance * direction, behavior: 'smooth' });
  };

  previousButton?.addEventListener('click', () => moveGallery(-1));
  nextButton?.addEventListener('click', () => moveGallery(1));

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let rotationId;
    const startRotation = () => {
      window.clearInterval(rotationId);
      rotationId = window.setInterval(() => {
        const reachedEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 12;
        if (reachedEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
        else moveGallery(1);
      }, 6500);
    };
    const stopRotation = () => window.clearInterval(rotationId);

    gallery.addEventListener('pointerenter', stopRotation);
    gallery.addEventListener('pointerleave', startRotation);
    gallery.addEventListener('focusin', stopRotation);
    gallery.addEventListener('focusout', (event) => {
      if (!gallery.contains(event.relatedTarget)) startRotation();
    });
    startRotation();
  }
});
