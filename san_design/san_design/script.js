'use strict';
document.documentElement.classList.add('js');
let currentLanguage = 'ka';
const translations = window.SAN_TRANSLATIONS || {};
const normalizeText = value => value.replace(/\s+/g, ' ').trim();
// Keep original text nodes so switching languages preserves links, fields, and layout.
const textTranslations = [];
const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
  const node = walker.currentNode;
  if (node.parentElement?.closest('script, style')) continue;
  const english = translations[normalizeText(node.nodeValue)];
  if (english) textTranslations.push({ node, georgian: node.nodeValue, english });
}
const attributeTranslations = [];
document.querySelectorAll('[aria-label], [alt], [placeholder], meta[name="description"]').forEach(element => {
  for (const attribute of ['aria-label', 'alt', 'placeholder', 'content']) {
    const original = element.getAttribute(attribute);
    const english = original && translations[normalizeText(original)];
    if (english) attributeTranslations.push({ element, attribute, georgian: original, english });
  }
});
const languageButtons = document.querySelectorAll('[data-language]');
function updateMenuLabel() {
  const open = menuButton?.getAttribute('aria-expanded') === 'true';
  menuButton?.setAttribute('aria-label', currentLanguage === 'en'
    ? (open ? 'Close menu' : 'Open menu')
    : (open ? 'მენიუს დახურვა' : 'მენიუს გახსნა'));
}
function setLanguage(language, persist = false) {
  currentLanguage = language === 'en' ? 'en' : 'ka';
  document.documentElement.lang = currentLanguage;
  textTranslations.forEach(({ node, georgian, english }) => {
    node.nodeValue = currentLanguage === 'ka' ? georgian
      : (georgian.match(/^\s*/)[0] + english + georgian.match(/\s*$/)[0]);
  });
  attributeTranslations.forEach(({ element, attribute, georgian, english }) => {
    element.setAttribute(attribute, currentLanguage === 'ka' ? georgian : english);
  });
  languageButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === currentLanguage));
  });
  // Carry the selection through page links, including when browser storage is blocked.
  document.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#')) return;
    const url = new URL(raw, window.location.href);
    if (url.origin === window.location.origin && /\/(index|products|materials|about)\.html$/.test(url.pathname)) {
      url.searchParams.set('lang', currentLanguage);
      link.href = url.href;
    }
  });
  if (persist) {
    try { localStorage.setItem('san-design-language', currentLanguage); } catch { /* Links carry the language when storage is unavailable. */ }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', currentLanguage);
      window.history.replaceState(null, '', url.href);
    } catch { /* Some browsers restrict history for local files. */ }
  }
  updateMenuLabel();
}

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu(returnFocus = false) {
  navigation?.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  updateMenuLabel();
  if (returnFocus) menuButton?.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  updateMenuLabel();
});
navigation?.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
const mobileViewport = window.matchMedia('(max-width: 800px)');
mobileViewport.addEventListener('change', () => closeMenu());
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach(link => {
  const active = new URL(link.href).pathname.split('/').pop() === currentPage && !new URL(link.href).hash;
  link.classList.toggle('active-link', active);
  if (active) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('a[href^="https://"]').forEach(link => {
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});
const sectionLinks = [...document.querySelectorAll('.section-nav a')];
if (sectionLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach(link => {
      const active = link.hash === '#' + visible.target.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-135px 0px -45% 0px', threshold: [0, .1, .5] });
  sectionLinks.forEach(link => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}
document.querySelector('.contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const greeting = currentLanguage === 'en' ? "Hello! My name is" : 'გამარჯობა! მე ვარ';
  const message = `${greeting} ${String(data.get('name')).trim()}.\n${String(data.get('message')).trim()}`;
  window.open('https://wa.me/995597001891?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
});

let preferredLanguage = 'ka';
try { preferredLanguage = localStorage.getItem('san-design-language') || 'ka'; } catch { /* Georgian is the default. */ }
const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
if (requestedLanguage === 'en' || requestedLanguage === 'ka') preferredLanguage = requestedLanguage;
setLanguage(preferredLanguage);
languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language, true)));
