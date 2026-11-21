'use strict';
/* Bad Habits Can Die — le jeu à plusieurs.
   Chaque mauvaise habitude est une « bête » à 300 points de vie : chaque jour tenu lui retire 1 PV,
   chaque rechute lui en rend 10. Il faut l'abattre avant la fin de l'année.
   Le serveur (Apps Script) garde la partie ; les photos et vidéos sont chiffrées sur le téléphone avec
   la clé du lien d'invitation, et effacées vite (24 h, ou dès que la preuve est jugée). */

const SERVEUR = window.BHCD_SERVEUR;
const SITE = 'https://gregoryalcindo.github.io/';
const J = 86400000, H = 3600000;
const PV_DEPART = 300, PV_RECHUTE = 10, DUREE = 365, MAX_DEFIS = 3;
const MAX_VIDEO = 20 * 1024 * 1024, MAX_DUREE_VIDEO = 16;
const CLE = 'bhcd-v2';

const HABITUDES = {
  clope:     { nom: 'Fumer',           e: '🚬', bete: 'La Clope',     c: '#A8988A' },
  alcool:    { nom: 'Alcool',          e: '🍺', bete: 'La Picole',    c: '#E8A33A' },
  reseaux:   { nom: 'Réseaux sociaux', e: '📱', bete: 'Le Scroll',    c: '#7AB8FF' },
  sucre:     { nom: 'Sucre',           e: '🍬', bete: 'Le Sucre',     c: '#FF7EC8' },
  ongles:    { nom: 'Ongles rongés',   e: '💅', bete: 'La Rongeuse',  c: '#C99BFF' },
  retard:    { nom: 'Retards',         e: '⏰', bete: 'Le Retard',    c: '#FFB347' },
  grosmots:  { nom: 'Gros mots',       e: '🤬', bete: 'Le Gros Mot',  c: '#FF6B6B' },
  malbouffe: { nom: 'Malbouffe',       e: '🍔', bete: 'La Malbouffe', c: '#D9893B' },
  flemme:    { nom: 'Procrastination', e: '🛋️', bete: 'La Flemme',    c: '#8FD18F' },
  autre:     { nom: 'Autre',           e: '✏️', bete: 'La Bête',      c: '#B6A8D8' }
};

const SUGGESTIONS = [
  'Faire 50 pompes en vidéo',
  'Payer un café à toute la partie',
  'Chanter une chanson choisie par le groupe, en vidéo',
  'Porter un vêtement ridicule toute une journée',
  'Faire la vaisselle chez quelqu\'un de la partie',
  'Prendre une douche froide de 2 minutes',
  'Courir 5 km et poster le tracé',
  'Photo de toi bébé en photo de profil pendant 24 h',
  'Danser 30 secondes dans la rue',
  'Préparer un gâteau pour la partie',
  'Écrire une lettre d\'excuses à ta bête',
  'Laver la voiture de quelqu\'un de la partie'
];

const COULEURS = ['#FF5A4E', '#FFC93C', '#3DDC97', '#7AB8FF', '#C99BFF', '#FF7EC8'];
const REACTIONS = [['respect', '👏'], ['honte', '🤡'], ['force', '💪'], ['mdr', '😂']];

const BADGES = [
  { id: 'go',        nom: 'C\'est parti',  desc: 'Lancer ton premier défi',          g: '🚀', c: ['#FF5A4E', '#FF9A6B'] },
  { id: 'j1',        nom: '24 heures',     desc: '1 jour sans craquer',              g: '🌱', c: ['#3DDC97', '#A6F2CF'] },
  { id: 'j7',        nom: 'Une semaine',   desc: '7 jours d\'affilée',               g: '🔥', c: ['#FF7A3D', '#FFC93C'] },
  { id: 'j30',       nom: 'Un mois',       desc: '30 jours d\'affilée',              g: '🗓️', c: ['#7AB8FF', '#B9DAFF'] },
  { id: 'j100',      nom: 'Centurion',     desc: '100 jours d\'affilée',             g: '💯', c: ['#C99BFF', '#FF7EC8'] },
  { id: 'j182',      nom: 'Mi-parcours',   desc: '6 mois dans la partie',            g: '⏳', c: ['#FFC93C', '#FFE9A8'] },
  { id: 'rip',       nom: 'R.I.P.',        desc: 'Abattre ta bête',                  g: '🪦', c: ['#3DDC97', '#FFC93C'] },
  { id: 'honnete',   nom: 'Honnête',       desc: 'Avouer une rechute toi-même',      g: '🙋', c: ['#7AB8FF', '#3DDC97'] },
  { id: 'dette',     nom: 'Dette payée',   desc: 'Gage prouvé et validé',            g: '🧾', c: ['#FFC93C', '#FF9A6B'] },
  { id: 'bourreau',  nom: 'Bourreau',      desc: 'Choisir le gage d\'un ami',        g: '🪓', c: ['#FF5A4E', '#C8352C'] },
  { id: 'juge',      nom: 'Juge',          desc: 'Juger une preuve',                 g: '⚖️', c: ['#B6A8D8', '#7AB8FF'] },
  { id: 'balance',   nom: 'Balance',       desc: 'Dénonciation confirmée',           g: '🐀', c: ['#A8988A', '#FF7EC8'] },
  { id: 'phenix',    nom: 'Phénix',        desc: '7 jours tenus après une rechute',  g: '🌅', c: ['#FF7A3D', '#FF5A4E'] },
  { id: 'flair',     nom: 'Flair',         desc: 'Gagner un pari',                   g: '🎯', c: ['#3DDC97', '#7AB8FF'] },
  { id: 'supporter', nom: 'Supporter',     desc: 'Donner 10 réactions',              g: '📣', c: ['#FF7EC8', '#C99BFF'] },
  { id: 'multi',     nom: 'Multitâche',    desc: '3 défis en même temps',            g: '🎪', c: ['#FFC93C', '#FF5A4E'] },
  { id: 'innocent',  nom: 'Innocenté',     desc: 'Gagner un vote de contestation',   g: '😇', c: ['#E8F0FF', '#7AB8FF'] },
  { id: 'riche',     nom: 'Pactole',       desc: 'Atteindre 500 points',             g: '💰', c: ['#FFC93C', '#3DDC97'] }
];

/* ================= État ================= */

function localNeuf() {
  return { v: 2, joueur: null, secret: null, pseudo: '', couleur: COULEURS[0], parties: [], courante: null,
    son: true, onglet: 'fil', vus: {}, appareil: null, invitation: null };
}

let L = chargerLocal();     // ce qui reste sur le téléphone : identité, clés des parties, réglages
let P = null;               // la partie affichée, telle que le serveur l'a envoyée
let E = { mode: null, etape: 0, b: null, apercu: null }; // écrans hors partie (création, invitation…)
const MEDIAS = {};          // médias déchiffrés de la session : id → URL locale
const PV_AFFICHE = {};

function chargerLocal() {
  try {
    const t = localStorage.getItem(CLE);
    if (t) { const e = JSON.parse(t); if (e && e.v === 2) return Object.assign(localNeuf(), e); }
    localStorage.removeItem('bhcd-etat-v1'); // ancienne démo
  } catch (e) { /* stockage indisponible */ }
  return localNeuf();
}
function sauverLocal() {
  try { localStorage.setItem(CLE, JSON.stringify(L)); } catch (e) { /* tant pis */ }
}
function memoriserPartie() {
  if (!P) return;
  try { localStorage.setItem('bhcd-p:' + P.id, JSON.stringify(P)); } catch (e) { /* tant pis */ }
}
function partieMemorisee(id) {
  try { const t = localStorage.getItem('bhcd-p:' + id); return t ? JSON.parse(t) : null; } catch (e) { return null; }
}

/* ================= Outils ================= */

const $ = (s, r = document) => r.querySelector(s);
const attendre = ms => new Promise(r => setTimeout(r, ms));
const hasard = a => a[Math.floor(Math.random() * a.length)];
const maintenant = () => Date.now();
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const nom = id => (P && P.membres[id] ? P.membres[id].nom : '?');
const defi = id => P.defis.find(d => d.id === id);
const mesDefis = () => P.defis.filter(d => d.qui === L.joueur);
const moiMembre = () => P.membres[L.joueur];
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
const autonome = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function jours(d) { return d.debut ? Math.max(0, Math.min(DUREE, Math.floor((maintenant() - d.debut) / J))) : 0; }
function pv(d) { return d.mort ? 0 : Math.max(0, PV_DEPART - jours(d) + PV_RECHUTE * d.rechutes.length); }
function serie(d) {
  if (!d.debut) return 0;
  const der = d.rechutes.length ? Math.max(d.debut, d.rechutes[d.rechutes.length - 1]) : d.debut;
  return Math.max(0, Math.floor(((d.mort || maintenant()) - der) / J));
}
function marge(d) { return Math.max(0, Math.floor((DUREE - jours(d) - pv(d)) / PV_RECHUTE)); }
function enJeu(d) { return !d.mort && !d.survit; }

/** Même calcul que le serveur. */
function points(id) {
  const m = P.membres[id];
  if (!m) return 0;
  let p = 100 + 10 * Object.keys(m.badges).length + 20 * m.stats.dettes;
  p += 100 * P.defis.filter(d => d.qui === id && d.mort).length;
  for (const x of P.paris) if (x.qui === id) p += x.statut === 'gagne' ? x.mise : -x.mise;
  return Math.max(0, p);
}

function relatif(t) {
  const d = maintenant() - t;
  if (d < 60000) return 'à l\'instant';
  if (d < H) return 'il y a ' + Math.floor(d / 60000) + ' min';
  if (d < J) return 'il y a ' + Math.floor(d / H) + ' h';
  const n = Math.floor(d / J);
  return 'il y a ' + n + (n > 1 ? ' jours' : ' jour');
}
function relatifFutur(t) {
  const d = t - maintenant();
  if (d <= 0) return 'maintenant';
  if (d < J) return 'dans ' + Math.ceil(d / H) + ' h';
  const n = Math.ceil(d / J);
  return 'dans ' + n + (n > 1 ? ' jours' : ' jour');
}
function resteTemps(ech) {
  const r = Math.max(0, ech - maintenant());
  const h = Math.floor(r / H), m = Math.floor((r % H) / 60000);
  return h + ' h ' + String(m).padStart(2, '0');
}

function avatar(id, classe = '', attrs = '') {
  const m = (P && P.membres[id]) || { nom: '?', couleur: '#888' };
  return `<div class="avatar ${classe}" style="background:${esc(m.couleur)}" ${attrs}>${esc(m.nom.charAt(0).toUpperCase())}</div>`;
}

/* ================= Serveur ================= */

async function appel(a, params = {}) {
  if (!SERVEUR) throw new Error('Serveur non branché');
  const corps = Object.assign({ a, joueur: L.joueur, secret: L.secret }, params);
  if (P && !corps.partie) corps.partie = P.id;
  let r;
  try { r = await fetch(SERVEUR, { method: 'POST', body: JSON.stringify(corps) }); }
  catch (e) { throw new Error('Pas de réseau. Réessaie.'); }
  let d;
  try { d = await r.json(); } catch (e) { throw new Error('Le serveur ne répond pas correctement.'); }
  if (d.erreur) throw new Error(d.erreur);
  return d;
}

/** Action de jeu : envoie, reçoit la partie à jour, affiche ce qui a changé. */
async function jouer(a, params, texteAttente) {
  const fin = texteAttente ? attente(texteAttente) : null;
  try {
    const d = await appel(a, params);
    if (d.etat) majEtat(d.etat);
    return true;
  } catch (err) {
    banniere('Oups', err.message);
    son('degat');
    return false;
  } finally {
    if (fin) fin();
  }
}

let rafraichissement = null;
async function rafraichir() {
  if (!P || !L.joueur || rafraichissement) return;
  rafraichissement = (async () => {
    try {
      const d = await appel('etat', { partie: P.id, v: P.v });
      if (d.etat) majEtat(d.etat);
    } catch (err) {
      if (/introuvable|ne fais pas partie/.test(err.message)) oublierPartie(P.id);
    } finally { rafraichissement = null; }
  })();
  return rafraichissement;
}

/** Nouvel état reçu : on garde, on met à jour l'écran et on joue les animations de ce qui vient d'arriver. */
function majEtat(etat) {
  const ancien = P && P.id === etat.id ? P : null;
  P = etat;
  const ref = L.parties.find(x => x.id === P.id);
  if (ref) ref.nom = P.nom;
  L.courante = P.id;
  memoriserPartie();
  const dejaVu = L.vus[P.id];
  const nouveaux = dejaVu ? P.fil.filter(e => e.t > dejaVu.t || (e.t === dejaVu.t && !dejaVu.ids.includes(e.id))) : [];
  if (P.fil.length) {
    const t = P.fil[0].t;
    L.vus[P.id] = { t, ids: P.fil.filter(e => e.t === t).map(e => e.id) };
  }
  sauverLocal();
  render();
  if (nouveaux.length) nouveautes(nouveaux.reverse(), ancien);
}

/* ================= Son, vibration, bannières ================= */

let AC = null;
function son(type) {
  if (!L.son) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const motifs = {
      tic: [[900, .035]], bip: [[660, .12]], pop: [[1250, .05], [1650, .05]],
      go: [[523, .11], [659, .11], [784, .11], [1047, .35]],
      honte: [[233, .22], [196, .22], [147, .5]],
      badge: [[784, .09], [988, .09], [1175, .09], [1568, .4]],
      degat: [[300, .05], [180, .08]]
    }[type] || [[440, .1]];
    let t = AC.currentTime;
    for (const [f, d] of motifs) {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type === 'honte' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type === 'honte' ? 0.18 : 0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(AC.destination);
      o.start(t); o.stop(t + d + 0.03);
      t += d * 0.92;
    }
  } catch (e) { /* pas de son */ }
}

function vibrer(motif) {
  try {
    if (window.Android) window.Android.vibrer(motif);
    else if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(motif.split(',').map(Number));
  } catch (e) { /* pas de vibreur */ }
}

function banniere(titre, corps) {
  const zone = $('#bannieres');
  while (zone.children.length > 2) zone.firstChild.remove();
  const b = document.createElement('div');
  b.className = 'banniere';
  b.innerHTML = `<div class="icone">BH</div><div><div class="appli">Bad Habits Can Die · maintenant</div>
    <div class="titre">${esc(titre)}</div><div class="corps">${esc(corps)}</div></div>`;
  zone.appendChild(b);
  setTimeout(() => b.remove(), 4000);
}

/** Écran d'attente pendant un envoi. Renvoie la fonction qui le ferme. */
function attente(texte) {
  const el = ouvrir(`<div class="sablier"></div><p>${esc(texte)}</p>`, { plein: true, fermable: false });
  return () => fermerEl(el);
}

/* ================= Confettis ================= */

function confettis(n = 150) {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confettis'), ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ['#FF5A4E', '#FFC93C', '#3DDC97', '#7AB8FF', '#C99BFF', '#FFF3E6'];
  const parts = Array.from({ length: n }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 4,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 8, c: hasard(cols)
  }));
  const debut = performance.now();
  (function image(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (t - debut < 3200) requestAnimationFrame(image);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(debut);
}

/* ================= Dessins ================= */

function beteSVG(d) {
  const h = HABITUDES[d.habit] || HABITUDES.autre;
  if (d.mort) {
    return `<svg class="bete-svg" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="93" rx="40" ry="6" fill="#140D24"/>
      <path d="M26 92 V44 A24 24 0 0 1 74 44 V92 Z" fill="#6E6390" stroke="#1B1230" stroke-width="3"/>
      <text x="50" y="52" text-anchor="middle" font-family="Bungee, Arial Black" font-size="15" fill="#1B1230">RIP</text>
      <text x="50" y="76" text-anchor="middle" font-size="18">${h.e}</text>
      <circle cx="20" cy="88" r="5" fill="#FF7EC8"/><circle cx="82" cy="88" r="5" fill="#FFC93C"/>
      <path d="M20 88 v6 M82 88 v6" stroke="#3DDC97" stroke-width="2"/>
    </svg>`;
  }
  const r = pv(d) / PV_DEPART;
  const s = (0.62 + 0.38 * Math.min(1.3, r)).toFixed(3);
  const faible = r < 0.4;
  const yeux = faible
    ? `<ellipse cx="38" cy="47" rx="8" ry="4" fill="#fff"/><ellipse cx="62" cy="47" rx="8" ry="4" fill="#fff"/>
       <circle cx="38" cy="48" r="2.6" fill="#1B1230"/><circle cx="62" cy="48" r="2.6" fill="#1B1230"/>
       <path d="M29 38 L45 35 M71 38 L55 35" stroke="#1B1230" stroke-width="3.5" stroke-linecap="round"/>`
    : `<ellipse cx="38" cy="46" rx="9" ry="10" fill="#fff"/><ellipse cx="62" cy="46" rx="9" ry="10" fill="#fff"/>
       <circle cx="40" cy="48" r="4.5" fill="#1B1230"/><circle cx="60" cy="48" r="4.5" fill="#1B1230"/>
       <path d="M27 32 L46 39 M73 32 L54 39" stroke="#1B1230" stroke-width="4.5" stroke-linecap="round"/>`;
  const bouche = faible
    ? `<path d="M36 70 Q42 65 48 70 Q54 75 62 69" stroke="#1B1230" stroke-width="3.5" fill="none" stroke-linecap="round"/>
       <path d="M76 40 q4 7 0 10 q-4 -3 0 -10z" fill="#9BD3FF"/>`
    : `<path d="M32 64 Q50 80 68 64 Z" fill="#1B1230"/>
       <path d="M36 65 l4 6 l4 -5 l4 6 l4 -6 l4 6 l4 -6 l4 4" fill="#fff"/>`;
  const pansement = faible
    ? `<g transform="rotate(-25 66 26)"><rect x="56" y="22" width="22" height="8" rx="3" fill="#F3D3B0"/><path d="M64 26h6M67 23v6" stroke="#C99" stroke-width="1.5"/></g>` : '';
  return `<svg class="bete-svg" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="94" rx="${(30 * s + 6).toFixed(1)}" ry="5" fill="#140D24"/>
    <g class="respire"><g transform="translate(50 92) scale(${s}) translate(-50 -92)">
      <path d="M31 28 L22 6 L42 21 Z M69 28 L78 6 L58 21 Z" fill="#5A1E3A" stroke="#1B1230" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 16 C77 16 92 36 90 62 C88 86 72 93 50 93 C28 93 12 86 10 62 C8 36 23 16 50 16 Z" fill="${h.c}" stroke="#1B1230" stroke-width="3"/>
      <ellipse cx="50" cy="80" rx="20" ry="9" fill="#fff" opacity=".18"/>
      ${yeux}${bouche}${pansement}
      <text x="50" y="89" text-anchor="middle" font-size="11">${h.e}</text>
    </g></g>
  </svg>`;
}

function medaille(b) {
  const gid = 'm-' + b.id;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.c[0]}"/><stop offset="1" stop-color="${b.c[1]}"/></linearGradient></defs>
    <path d="M32 68 L24 97 L37 90 L45 99 L50 74 Z" fill="${b.c[0]}"/>
    <path d="M68 68 L76 97 L63 90 L55 99 L50 74 Z" fill="${b.c[1]}"/>
    <polygon points="50,3 89,25 89,69 50,91 11,69 11,25" fill="url(#${gid})" stroke="#1B1230" stroke-width="3.5" stroke-linejoin="round"/>
    <polygon points="50,14 79,31 79,63 50,80 21,63 21,31" fill="#1B1230" opacity=".28"/>
    <path d="M50 14 L79 31 L79 40 Z" fill="#fff" opacity=".25"/>
    <text x="50" y="58" text-anchor="middle" font-size="30">${b.g}</text>
  </svg>`;
}

/* ================= Médias chiffrés ================= */

const CLES = {};
function b64uVersOctets(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function octetsVersB64u(o) {
  let s = '';
  o.forEach(x => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function nouvelleCle() { return octetsVersB64u(crypto.getRandomValues(new Uint8Array(32))); }

async function clePartie(id) {
  const ref = L.parties.find(x => x.id === id);
  if (!ref || !ref.cle) throw new Error('Clé de la partie absente sur ce téléphone');
  if (!CLES[id]) CLES[id] = crypto.subtle.importKey('raw', b64uVersOctets(ref.cle), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return CLES[id];
}

function blobVersB64(blob) {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] || '');
    r.onerror = () => ko(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(blob);
  });
}

async function chiffrer(media) {
  const cle = await clePartie(P.id);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clair = await media.blob.arrayBuffer();
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, clair));
  const tout = new Blob([iv, ct]);
  return { type: media.type, donnees: await blobVersB64(tout) };
}

async function dechiffrer(b64, type) {
  const cle = await clePartie(P.id);
  const tout = new Uint8Array(await (await fetch('data:application/octet-stream;base64,' + b64)).arrayBuffer());
  const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: tout.slice(0, 12) }, cle, tout.slice(12));
  return URL.createObjectURL(new Blob([clair], { type }));
}

/** Photo réduite en JPEG, ou vidéo vérifiée (15 s, 20 Mo). */
function preparerFichier(f) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(f);
    if (f.type.startsWith('video')) {
      if (f.size > MAX_VIDEO) { resolve({ erreur: 'Vidéo trop lourde (20 Mo maximum). Filme moins longtemps.' }); return; }
      const v = document.createElement('video');
      v.preload = 'metadata'; v.muted = true; v.src = url;
      let fini = false;
      const finir = r => { if (!fini) { fini = true; resolve(r); } };
      v.addEventListener('loadedmetadata', () => {
        if (v.duration && isFinite(v.duration) && v.duration > MAX_DUREE_VIDEO) finir({ erreur: 'Vidéo trop longue : 15 secondes maximum.' });
        else finir({ blob: f, type: f.type || 'video/mp4', url, video: true });
      });
      v.addEventListener('error', () => finir({ blob: f, type: f.type || 'video/mp4', url, video: true }));
      setTimeout(() => finir({ blob: f, type: f.type || 'video/mp4', url, video: true }), 5000);
    } else {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => {
          if (!b) { resolve({ erreur: 'Photo illisible.' }); return; }
          resolve({ blob: b, type: 'image/jpeg', url: URL.createObjectURL(b), video: false });
        }, 'image/jpeg', 0.82);
      };
      img.onerror = () => resolve({ erreur: 'Photo illisible. Essaie une autre.' });
      img.src = url;
    }
  });
}

function mediaHTML(id) {
  if (!id) return '';
  const m = P.medias[id];
  if (!m) return `<div class="evt-media efface"><div class="vide">🔥 Média effacé</div></div>`;
  const video = m.type.startsWith('video');
  if (MEDIAS[id]) {
    return `<div class="evt-media">${video
      ? `<video src="${MEDIAS[id]}" controls playsinline preload="metadata"></video>`
      : `<img src="${MEDIAS[id]}" alt="Preuve">`}</div>`;
  }
  return video
    ? `<div class="evt-media" data-media="${id}"><button class="vide voir-media" data-a="voirMedia" data-id="${id}">▶ Voir la vidéo<span class="discret">Chiffrée, effacée sous 24 h</span></button></div>`
    : `<div class="evt-media" data-media="${id}" data-auto="1"><div class="vide">Déchiffrement…</div></div>`;
}

const enChargement = {};
async function chargerMedia(id) {
  if (MEDIAS[id] || enChargement[id] || !P.medias[id]) return;
  const partie = P.id;
  enChargement[id] = true;
  try {
    const d = await appel('media', { partie, id });
    if (d.efface) { delete P.medias[id]; return; }
    if (!P || P.id !== partie) return;
    MEDIAS[id] = await dechiffrer(d.donnees, d.type);
  } catch (err) {
    document.querySelectorAll(`[data-media="${id}"]`).forEach(el => { el.innerHTML = '<div class="vide">Impossible de déchiffrer ce média</div>'; });
    return;
  } finally { delete enChargement[id]; }
  document.querySelectorAll(`[data-media="${id}"]`).forEach(el => { el.outerHTML = mediaHTML(id); });
}
function chargerMediasVisibles() {
  document.querySelectorAll('[data-media][data-auto]').forEach(el => chargerMedia(el.dataset.media));
}

/* ================= Calques (feuilles, écrans pleins) ================= */

const pile = [];
function ouvrir(html, { plein = false, fermable = true, classe = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'calque';
  el.style.cssText = 'position:absolute;inset:0;';
  el.innerHTML = plein
    ? `<div class="plein ${classe}">${html}</div>`
    : `<div class="voile"></div><div class="feuille ${classe}">${html}</div>`;
  $('#calques').appendChild(el);
  const c = { el, fermable, onClose };
  pile.push(c);
  if (!plein && fermable) el.querySelector('.voile').addEventListener('click', () => fermer(c));
  return el;
}
function fermer(c) {
  const i = c ? pile.indexOf(c) : pile.length - 1;
  if (i < 0) return;
  const [x] = pile.splice(i, 1);
  x.el.remove();
  if (x.onClose) x.onClose();
}
function fermerEl(el) { const c = pile.find(p => p.el === el); if (c) fermer(c); }

window.retourArriere = function () {
  if (pile.length) { const c = pile[pile.length - 1]; if (c.fermable) fermer(c); return true; }
  const mode = modeCourant();
  if (mode === 'jeu' && L.onglet !== 'fil') { L.onglet = 'fil'; render(true); return true; }
  if ((mode === 'creer' || mode === 'rejoindre') && E.etape > 0) { E.etape--; render(true); return true; }
  if (mode === 'creer' || mode === 'rejoindre' || (mode === 'hub' && P)) { quitterEcran(); return true; }
  if (mode === 'accueil' && E.etape > 0) { E.etape--; render(true); return true; }
  return false;
};

function quitterEcran() {
  E = { mode: null, etape: 0, b: null, apercu: null };
  L.invitation = null;
  sauverLocal();
  render(true);
}

/* ================= Fil d'actualité ================= */

function texteEvt(e) {
  const d = e.defi ? defi(e.defi) : null;
  const h = d ? (HABITUDES[d.habit] || HABITUDES.autre) : { e: '' };
  const N = id => `<b>${esc(nom(id))}</b>`;
  const g = e.gage ? P.gages.find(x => x.id === e.gage) : null;
  const boiteGage = g && g.texte ? `<div class="evt-gage">${esc(g.texte)}</div>` : '';
  const bete = d ? `<b>${esc(d.nom)}</b>` : '';
  switch (e.type) {
    case 'rejoint': return d ? `${N(e.qui)} rejoint la partie et affronte ${bete} ${h.e}.` : `${N(e.qui)} rejoint la partie en spectateur.`;
    case 'lancement': return `${N(e.qui)} a appuyé sur GO. <b>365 jours</b>, aucune pitié.`;
    case 'go': return `${N(e.qui)} part en guerre contre ${bete} ${h.e}.`;
    case 'aveu': return e.apres
      ? `${N(e.qui)} a craqué, balancé par ${N(e.apres)} ${h.e}. ${bete} reprend ${PV_RECHUTE} PV.`
      : `${N(e.qui)} a craqué ${h.e}. ${bete} reprend ${PV_RECHUTE} PV.`;
    case 'accuse': return `${N(e.qui)} accuse ${N(e.cible)} d'avoir craqué ${h.e}. Preuve à l'appui.`;
    case 'conteste': return `${N(e.qui)} conteste l'accusation de ${N(e.accusateur)}. La partie vote.`;
    case 'silence': return `${N(e.qui)} n'a pas répondu à l'accusation de ${N(e.accusateur)}. La partie vote.`;
    case 'innocent': return `Verdict : ${N(e.qui)} est <b>innocent</b> (${e.contre} contre ${e.pour}). Fausse alerte.`;
    case 'coupable': return `Verdict : ${N(e.qui)} est <b>coupable</b> (${e.pour} contre ${e.contre}).`;
    case 'tirage': return `Le sort désigne ${N(e.bourreau)} pour choisir le châtiment de ${N(e.qui)}.`;
    case 'gage': return `${N(e.bourreau)} a choisi le châtiment de ${N(e.qui)} :${boiteGage}`;
    case 'delai': return e.bourreau
      ? `${N(e.bourreau)} n'a pas choisi à temps. Le hasard tranche pour ${N(e.qui)} :${boiteGage}`
      : `Personne pour choisir : le hasard tranche pour ${N(e.qui)} :${boiteGage}`;
    case 'preuve': return `${N(e.qui)} a fait son gage. Preuve à l'appui.${boiteGage}`;
    case 'valide': return e.auto ? `Preuve de ${N(e.qui)} validée d'office. Dette payée.` : `${N(e.bourreau)} valide la preuve de ${N(e.qui)}. Dette payée.`;
    case 'refuse': return `${N(e.bourreau)} refuse la preuve de ${N(e.qui)}. À refaire.`;
    case 'badge': { const b = BADGES.find(x => x.id === e.badge); return b ? `${N(e.qui)} débloque le badge <b>${esc(b.nom)}</b> ${b.g}` : ''; }
    case 'palier': return `${N(e.qui)} tient depuis <b>${e.n} jours</b> contre ${bete} ${h.e}.`;
    case 'mort': return `${bete} est morte. ${N(e.qui)} l'a abattue en ${e.n} jours. 🪦`;
    case 'survit': return `${bete} a survécu à l'année de ${N(e.qui)}. Revanche ?`;
    case 'pari': return `${N(e.qui)} parie <b>${e.mise} pts</b> que ${N(e.cible)} tient encore 7 jours.`;
    case 'pari-gagne': return `${N(e.qui)} gagne son pari sur ${N(e.cible)} : <b>+${e.gain} pts</b>.`;
    case 'pari-perdu': return `${N(e.qui)} perd son pari sur ${N(e.cible)}. Les ${e.mise} pts sont partis.`;
    default: return '';
  }
}

function evtHTML(e) {
  const texte = texteEvt(e);
  if (!texte) return '';
  const reac = REACTIONS.map(([k, em]) => {
    const l = e.reac[k] || [];
    return `<button class="reac ${l.includes(L.joueur) ? 'mienne' : ''}" data-a="reagir" data-evt="${e.id}" data-k="${k}">${em} ${l.length || ''}</button>`;
  }).join('');
  return `<article class="carte evt type-${e.type}">
    ${avatar(e.qui)}
    <div style="min-width:0">
      <div class="evt-texte">${texte}</div>
      <div class="evt-heure">${relatif(e.t)}</div>
      ${mediaHTML(e.media)}
      <div class="reactions">${reac}</div>
    </div>
  </article>`;
}

/* ================= Tâches (ce que la partie attend de toi) ================= */

function taches() {
  const t = [], moi = L.joueur;
  for (const a of P.accusations) {
    if (a.cible === moi && a.statut === 'ouverte') t.push({ type: 'accusation', a });
    if (a.statut === 'vote' && a.cible !== moi && !(moi in a.votes)) t.push({ type: 'voter', a });
  }
  for (const g of P.gages) {
    if (g.bourreau === moi && g.statut === 'attente') t.push({ type: 'choisir', g });
    if (g.bourreau === moi && g.statut === 'prouve') t.push({ type: 'juger', g });
    if (g.victime === moi && g.statut === 'choisi') t.push({ type: 'faire', g });
    if (g.victime === moi && g.statut === 'attente') t.push({ type: 'patience', g });
    if (g.victime === moi && g.statut === 'prouve') t.push({ type: 'validation', g });
  }
  return t;
}

function tacheHTML(t) {
  if (t.type === 'accusation') {
    const d = defi(t.a.defi);
    return `<div class="carte-tache"><span class="etiquette">ON T'ACCUSE</span>
      <p>${esc(nom(t.a.qui))} affirme que tu as craqué sur ${esc((HABITUDES[d.habit] || HABITUDES.autre).nom.toLowerCase())}.</p>
      <span class="minuteur" data-ech="${t.a.echeance}">Il te reste ${resteTemps(t.a.echeance)}</span>
      <button class="btn corail" data-a="repondre" data-id="${t.a.id}">Voir la preuve et répondre</button></div>`;
  }
  if (t.type === 'voter') {
    return `<div class="carte-tache"><span class="etiquette">VOTE</span>
      <p>${esc(nom(t.a.cible))} a-t-il craqué ? ${esc(nom(t.a.qui))} l'accuse.</p>
      <span class="minuteur" data-ech="${t.a.echeance}">Il te reste ${resteTemps(t.a.echeance)}</span>
      <button class="btn soleil" data-a="voter" data-id="${t.a.id}">Voir la preuve et voter</button></div>`;
  }
  const g = t.g, v = nom(g.victime), b = nom(g.bourreau);
  switch (t.type) {
    case 'choisir': return `<div class="carte-tache"><span class="etiquette">LE SORT T'A DÉSIGNÉ</span>
      <p>Choisis le châtiment de ${esc(v)}.</p><span class="minuteur" data-ech="${g.echeance}">Il te reste ${resteTemps(g.echeance)}</span>
      <button class="btn soleil" data-a="choisir" data-id="${g.id}">Choisir le gage</button></div>`;
    case 'juger': return `<div class="carte-tache"><span class="etiquette">PREUVE À JUGER</span>
      <p>${esc(v)} dit avoir fait son gage : « ${esc(g.texte)} ».</p>
      <span class="minuteur" data-ech="${g.prouveA + 24 * H}" data-txt="Validée d'office dans ">Validée d'office dans ${resteTemps(g.prouveA + 24 * H)}</span>
      <button class="btn soleil" data-a="juger" data-id="${g.id}">Juger la preuve</button></div>`;
    case 'faire': return `<div class="carte-tache"><span class="etiquette">TON CHÂTIMENT</span>
      <p>${esc(g.texte)}</p><span class="discret">${g.bourreau ? 'Choisi par ' + esc(b) : 'Tiré au hasard'}</span>
      <button class="btn corail" data-a="prouver" data-id="${g.id}">J'envoie ma preuve</button></div>`;
    case 'patience': return `<div class="carte-tache"><span class="etiquette">ÇA SE PRÉPARE…</span>
      <p>${esc(b)} réfléchit à ton châtiment.</p><span class="minuteur" data-ech="${g.echeance}" data-txt="Il lui reste ">Il lui reste ${resteTemps(g.echeance)}</span></div>`;
    case 'validation': return `<div class="carte-tache"><span class="etiquette">EN ATTENTE</span>
      <p>${esc(b)} examine ta preuve. Sans réponse, elle est validée au bout de 24 h.</p></div>`;
  }
  return '';
}

/* ================= Écrans de la partie ================= */

function carteBete(d, grande) {
  const h = HABITUDES[d.habit] || HABITUDES.autre;
  const p = pv(d), r = Math.min(1, p / PV_DEPART);
  const avant = PV_AFFICHE[d.id] != null ? Math.min(1, PV_AFFICHE[d.id] / PV_DEPART) : r;
  const sous = d.mort ? `Abattue au jour ${Math.floor((d.mort - d.debut) / J)}`
    : d.survit ? 'A survécu à l\'année' : d.debut ? `Jour ${jours(d)} / ${DUREE}` : 'En attente du GO';
  return `<div class="bete-carte ${grande ? 'grande' : ''}" data-defi="${d.id}">
    ${beteSVG(d)}
    <div style="min-width:0;width:100%">
      <div class="bete-nom">${esc(d.nom)}</div>
      <div class="bete-sous">${h.e} ${esc(h.nom)} · ${sous}</div>
      ${enJeu(d) ? `<div class="pv"><div class="pv-ligne"><span>Points de vie</span><b>${p}</b></div>
        <div class="barre ${r < 0.4 ? 'faible' : ''}"><i style="width:${(avant * 100).toFixed(1)}%" data-w="${(r * 100).toFixed(1)}"></i></div></div>` : ''}
      <div class="stats-bete">
        <span class="stat flamme"><span class="flamme-ico">🔥</span><b>${serie(d)}</b> j</span>
        <span class="stat">Rechutes <b>${d.rechutes.length}</b></span>
        ${grande && enJeu(d) && d.debut ? `<span class="stat">Marge <b>${marge(d)}</b></span>` : ''}
      </div>
    </div>
  </div>`;
}

function carteNotifs() {
  if (L.appareil && 'Notification' in window && Notification.permission === 'granted') return '';
  if (window.Android) return '';
  if (ios && !autonome()) {
    return `<div class="carte-tache"><span class="etiquette">NOTIFICATIONS</span>
      <p>Sur iPhone, ajoute d'abord l'appli à l'écran d'accueil : bouton <b>Partager</b> puis <b>« Sur l'écran d'accueil »</b>. Ouvre-la ensuite depuis l'icône.</p></div>`;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return '';
  return `<div class="carte-tache"><span class="etiquette">NOTIFICATIONS</span>
    <p>Active-les pour savoir quand quelqu'un craque, et quand le sort te désigne.</p>
    <button class="btn soleil" data-a="activerNotifs">Activer les notifications</button></div>`;
}

function vueFil() {
  const mes = mesDefis().filter(enJeu);
  const t = taches();
  let html = carteNotifs();
  if (mes.length) html += `<div class="titre-section">${mes.length > 1 ? 'Tes bêtes' : 'Ta bête'}</div><div class="pile">${mes.map(d => carteBete(d, false)).join('')}</div>`;
  if (t.length) html += `<div class="titre-section">À faire</div><div class="pile">${t.map(tacheHTML).join('')}</div>`;
  html += `<div class="titre-section">Le fil · ${esc(P.nom)}</div>`;
  const evts = P.fil.map(evtHTML).filter(Boolean);
  html += evts.length ? `<div class="pile">${evts.join('')}</div>` : `<div class="vide">Rien pour l'instant.</div>`;
  return html;
}

function scoreJoueur(id) {
  const ds = P.defis.filter(d => d.qui === id);
  if (!ds.length) return -1;
  return ds.reduce((s, d) => s + (PV_DEPART - pv(d)) / PV_DEPART, 0) / ds.length;
}

function vuePartie() {
  const j = P.debut ? Math.max(0, Math.min(DUREE, Math.floor((maintenant() - P.debut) / J))) : 0;
  const ids = Object.keys(P.membres).sort((a, b) => scoreJoueur(b) - scoreJoueur(a));
  const joueurs = ids.map((id, i) => {
    const ds = P.defis.filter(d => d.qui === id);
    const minis = ds.map(d => {
      const p = pv(d), r = Math.min(1, p / PV_DEPART);
      return `<div class="mini-defi ${d.mort ? 'mort' : ''}">
        <span>${(HABITUDES[d.habit] || HABITUDES.autre).e} ${esc(d.nom)} ${d.mort ? '🪦' : `· <b>${p}</b> PV`}</span>
        <span class="serie">${d.mort ? 'ABATTUE' : '🔥 ' + serie(d) + ' j'}</span>
        ${enJeu(d) ? `<div class="barre ${r < 0.4 ? 'faible' : ''}"><i style="width:${(r * 100).toFixed(1)}%"></i></div>` : ''}
      </div>`;
    }).join('');
    const vivant = ds.find(enJeu);
    const pariEnCours = vivant && P.paris.some(x => x.qui === L.joueur && x.defi === vivant.id && x.statut === 'en cours');
    const actions = id === L.joueur || !vivant ? '' : `<div class="joueur-actions">
        <button class="btn petit corail" data-a="denoncer" data-id="${id}">Dénoncer</button>
        <button class="btn petit fantome" data-a="parier" data-id="${vivant.id}" ${pariEnCours ? 'disabled' : ''}>${pariEnCours ? 'Pari en cours' : 'Parier'}</button>
      </div>`;
    return `<div class="carte joueur">
      <div class="rang ${i === 0 && ds.length ? 'or' : ''}">${i + 1}</div>${avatar(id)}
      <div class="joueur-nom">${esc(nom(id))}${id === L.joueur ? ' <span class="discret">(toi)</span>' : ''}
        <span class="discret">· ${points(id)} pts</span></div>
      <div class="joueur-defis">${minis || '<span class="discret">Spectateur</span>'}</div>${actions}
    </div>`;
  }).join('');
  const paris = P.paris.filter(x => x.qui === L.joueur && x.statut === 'en cours');
  return `<div class="carte partie-tete">
      <div class="partie-nom">${esc(P.nom)}</div>
      <div class="code">CODE ${esc(P.code)}</div>
      <div class="compte-annee"><span class="discret">Jour <b>${j}</b> / ${DUREE}</span>
        <div class="barre"><i style="width:${(j / DUREE * 100).toFixed(1)}%"></i></div></div>
      <button class="btn fantome" data-a="inviter">Inviter quelqu'un</button>
    </div>
    <div class="titre-section">Classement</div>
    <div class="pile">${joueurs}</div>
    ${paris.length ? `<div class="titre-section">Tes paris</div><div class="pile">${paris.map(x => {
      const d = defi(x.defi);
      return `<div class="carte"><b>${x.mise} pts</b> sur ${esc(nom(d.qui))} · résultat ${relatifFutur(x.fin)}</div>`;
    }).join('')}</div>` : ''}`;
}

function vueBadges() {
  const mb = moiMembre().badges;
  const n = Object.keys(mb).length;
  return `<div class="carte" style="display:flex;align-items:center;gap:14px">
      <div class="compteur-badges">${n}<span style="font-size:20px;color:var(--brume)">/${BADGES.length}</span></div>
      <div><b>Badges débloqués</b><div class="discret">Chaque badge rapporte 10 points.</div></div>
    </div>
    <div class="titre-section">Collection</div>
    <div class="grille-badges">${BADGES.map(b => {
      const ok = mb[b.id];
      const neuf = ok && maintenant() - ok < J;
      return `<div class="badge ${ok ? '' : 'verrou'} ${neuf ? 'neuf' : ''}" data-a="voirBadge" data-id="${b.id}">
        ${medaille(b)}<div class="badge-nom">${esc(b.nom)}</div><div class="badge-desc">${esc(b.desc)}</div></div>`;
    }).join('')}</div>`;
}

function listeParties() {
  return L.parties.map(x => `<button class="carte partie-ligne ${P && x.id === P.id ? 'actuelle' : ''}" data-a="ouvrirPartie" data-id="${x.id}">
      <b>${esc(x.nom)}</b><span class="discret">${P && x.id === P.id ? 'affichée' : 'ouvrir'}</span></button>`).join('');
}

function vueMoi() {
  const m = moiMembre();
  const mes = mesDefis();
  const actifs = mes.filter(enJeu).length;
  const notifOk = L.appareil && 'Notification' in window && Notification.permission === 'granted';
  return `<div class="carte" style="display:flex;align-items:center;gap:14px">
      ${avatar(L.joueur, 'grand')}
      <div style="min-width:0"><div class="partie-nom" style="font-size:22px">${esc(m.nom)}</div>
      <div class="discret">${points(L.joueur)} points · ${Object.keys(m.badges).length} badges</div></div>
    </div>
    <div class="titre-section">Tes bêtes</div>
    <div class="pile">${mes.map(d => `${carteBete(d, true)}
      <details class="carte"><summary><b>Tes châtiments possibles</b> (${d.gages.length})</summary>
      <div class="liste-gages" style="margin-top:10px">${d.gages.map(g => `<div class="gage-ligne">${esc(g)}</div>`).join('')}</div></details>`).join('')}
      <button class="btn fantome large" data-a="ajouterDefi" ${actifs >= MAX_DEFIS ? 'disabled' : ''}>
        ${actifs >= MAX_DEFIS ? `${MAX_DEFIS} défis en cours, c'est le maximum` : `Ajouter un défi (${actifs}/${MAX_DEFIS})`}</button>
    </div>
    <div class="titre-section">Tes parties</div>
    <div class="pile">${listeParties()}
      <button class="btn fantome large" data-a="hub">Créer ou rejoindre une autre partie</button></div>
    <div class="titre-section">Réglages</div>
    <div class="pile">
      <div class="carte interrupteur"><span>Sons</span>
        <button class="btn petit ${L.son ? 'menthe' : 'fantome'}" data-a="son">${L.son ? 'Activés' : 'Coupés'}</button></div>
      <div class="carte interrupteur"><span>Notifications</span>
        <button class="btn petit ${notifOk ? 'menthe' : 'soleil'}" data-a="activerNotifs">${notifOk ? 'Activées' : 'Activer'}</button></div>
    </div>
    <p class="discret" style="text-align:center;margin:18px 0 6px">Photos et vidéos chiffrées sur ton téléphone, effacées sous 24 h.</p>`;
}

/* ---------- Avant la partie : accueil, création, invitation, salon ---------- */

function etapes(n, total) { return `<div class="etapes">${Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'fait' : ''}"></i>`).join('')}</div>`; }

function vueAccueil() {
  if (E.etape === 0) {
    return `<div class="plein accueil" style="position:relative;min-height:100%;background:transparent;padding:20px 0">
        <div></div>
        <div style="display:flex;flex-direction:column;gap:22px;align-items:center">
          <div class="logo-geant">BAD<br>HABITS<span>CAN DIE</span></div>
          <p class="accroche">Un an. Tes proches. Aucune pitié.</p>
          <div class="pile" style="text-align:left;max-width:320px">
            <div class="carte"><b>Tu nommes ta mauvaise habitude.</b> Elle devient une bête à 300 points de vie.</div>
            <div class="carte"><b>Chaque jour tenu lui fait mal.</b> Chaque rechute la soigne.</div>
            <div class="carte"><b>Tu craques ? Tu te balances.</b> Le sort désigne un proche qui choisit ton châtiment.</div>
          </div>
        </div>
        <button class="btn corail large" data-a="etapeSuivante">Commencer</button>
      </div>`;
  }
  const b = E.b || (E.b = { pseudo: L.pseudo || '', couleur: L.couleur || COULEURS[0] });
  return `<div class="pile" style="gap:18px">
      <h2 class="partie-nom">Qui es-tu ?</h2>
      <div class="champ"><label for="pseudo">Ton pseudo</label>
        <input id="pseudo" maxlength="16" placeholder="Greg" value="${esc(b.pseudo)}" autocomplete="off"></div>
      <div class="champ"><label>Ta couleur</label><div class="couleurs">${COULEURS.map(c =>
        `<button class="couleur ${c === b.couleur ? 'choisie' : ''}" style="background:${c}" data-a="couleur" data-c="${c}" aria-label="Couleur"></button>`).join('')}</div></div>
      <button class="btn corail large" data-a="inscrire" id="suite" ${b.pseudo.trim() ? '' : 'disabled'}>C'est moi</button>
    </div>`;
}

function vueHub() {
  return `<div class="pile" style="gap:16px">
      <div class="logo-geant" style="font-size:34px;text-align:left">BAD HABITS<span>CAN DIE</span></div>
      <p class="discret" style="margin:0">Salut ${esc(L.pseudo)} ! Lance une partie avec tes proches, ou rejoins la leur.</p>
      <button class="btn corail large" data-a="creer">Créer une partie</button>
      <div class="carte pile">
        <b>Tu as reçu un lien ?</b>
        <div class="ligne-champ champ"><input id="lienColle" placeholder="Colle le lien ici" autocomplete="off">
          <button class="btn soleil petit" data-a="collerLien">OK</button></div>
      </div>
      ${L.parties.length ? `<div class="titre-section">Tes parties</div><div class="pile">${listeParties()}</div>` : ''}
      ${carteNotifs()}
    </div>`;
}

function grilleHabitudes(choix, exclues) {
  return `<div class="grille-habitudes">${Object.entries(HABITUDES).map(([k, h]) =>
    `<button class="habitude ${k === choix ? 'choisie' : ''}" data-a="habit" data-k="${k}" ${exclues.includes(k) ? 'disabled' : ''}>
      <span class="e">${h.e}</span>${esc(h.nom)}</button>`).join('')}</div>`;
}

function editeurGages(liste) {
  const restantes = SUGGESTIONS.filter(s => !liste.includes(s));
  return `<div class="liste-gages">${liste.map((g, i) =>
      `<div class="gage-ligne choisi">${esc(g)}<button class="x" data-a="retirerGage" data-i="${i}" aria-label="Retirer">×</button></div>`).join('')}</div>
    <div class="ligne-champ champ"><input id="nouveauGage" maxlength="100" placeholder="Invente ton châtiment">
      <button class="btn soleil petit" data-a="ajouterGage">Ajouter</button></div>
    <div class="discret">Idées :</div>
    <div class="puces-choix">${restantes.slice(0, 8).map(s => `<button class="puce-choix" data-a="suggestion" data-t="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div>`;
}

/** Étapes communes « ta bête » puis « tes châtiments » (création et invitation). */
function etapeBete(n, total, titreSuite) {
  const b = E.b;
  return `<div class="pile" style="gap:18px">${etapes(n, total)}
      <h2 class="partie-nom">Ta mauvaise habitude</h2>
      ${grilleHabitudes(b.habit, [])}
      ${b.habit === 'autre' ? `<div class="champ"><label for="nomAutre">Nomme ta bête</label>
        <input id="nomAutre" maxlength="24" placeholder="Le Grignotage" value="${esc(b.nomAutre)}"></div>` : ''}
      <button class="btn corail large" data-a="etapeSuivante" ${b.habit && (b.habit !== 'autre' || b.nomAutre.trim()) ? '' : 'disabled'}>Suivant</button>
      <button class="btn fantome" data-a="${titreSuite}">Je ne joue pas, je surveille les autres</button>
    </div>`;
}
function etapeGages(n, total, action, libelle) {
  const b = E.b;
  return `<div class="pile" style="gap:16px">${etapes(n, total)}
      <h2 class="partie-nom">Tes châtiments</h2>
      <p class="discret" style="margin:0">Si tu craques, celui que le sort désigne pourra piocher ici s'il n'a pas d'idée. Au moins 3.</p>
      ${editeurGages(b.gages)}
      <button class="btn corail large" data-a="${action}" ${b.gages.length >= 3 ? '' : 'disabled'}>${libelle} (${b.gages.length}/3)</button>
    </div>`;
}

function vueCreer() {
  const b = E.b || (E.b = { nom: 'Les Potos', habit: null, nomAutre: '', gages: [] });
  if (E.etape === 0) {
    return `<div class="pile" style="gap:18px">${etapes(1, 3)}
        <h2 class="partie-nom">Ta partie</h2>
        <div class="champ"><label for="nomPartie">Nom de la partie</label>
          <input id="nomPartie" maxlength="24" value="${esc(b.nom)}" autocomplete="off"></div>
        <button class="btn corail large" data-a="etapeSuivante">Suivant</button>
        <button class="btn fantome" data-a="annuler">Annuler</button>
      </div>`;
  }
  if (E.etape === 1) return etapeBete(2, 3, 'creerSpectateur');
  return etapeGages(3, 3, 'creerPartie', 'Créer la partie');
}

function vueRejoindre() {
  const a = E.apercu;
  if (!a) return `<div class="vide">Recherche de la partie…</div>`;
  if (a.erreur) {
    return `<div class="pile" style="gap:16px"><h2 class="partie-nom">Lien invalide</h2>
      <p class="discret">${esc(a.erreur)}</p><button class="btn large" data-a="annuler">Retour</button></div>`;
  }
  E.b = E.b || { habit: null, nomAutre: '', gages: [] };
  if (E.etape === 0) {
    const conseilIOS = ios && !autonome() ? `<div class="carte-tache"><span class="etiquette">SUR IPHONE</span>
        <p>Pour recevoir les notifications, rejoins depuis l'appli installée :</p>
        <p>1. Touche <b>Copier le lien</b>. 2. <b>Partager</b> puis <b>« Sur l'écran d'accueil »</b>. 3. Ouvre l'appli et colle le lien.</p>
        <button class="btn soleil" data-a="copierInvitation">Copier le lien</button></div>` : '';
    return `<div class="pile" style="gap:16px">
        <div class="sur-titre" style="color:var(--soleil)">INVITATION</div>
        <h2 class="partie-nom">${esc(a.nom)}</h2>
        <p class="discret" style="margin:0">${a.membres.length} ${a.membres.length > 1 ? 'joueurs' : 'joueur'} : ${a.membres.map(esc).join(', ')}.
          ${a.demarree ? 'La partie a déjà commencé : ton année démarre dès que tu rejoins.' : 'La partie n\'a pas encore commencé.'}</p>
        ${conseilIOS}
        <button class="btn corail large" data-a="etapeSuivante">Rejoindre</button>
        <button class="btn fantome" data-a="annuler">Non merci</button>
      </div>`;
  }
  if (E.etape === 1) return etapeBete(1, 2, 'rejoindreSpectateur');
  return etapeGages(2, 2, 'rejoindrePartie', 'Rejoindre');
}

function vueSalon() {
  const createur = P.createur === L.joueur;
  const n = Object.keys(P.membres).length;
  const membres = Object.keys(P.membres).map(id => {
    const d = P.defis.find(x => x.qui === id);
    const h = d ? (HABITUDES[d.habit] || HABITUDES.autre) : null;
    return `<div class="carte joueur simple">${avatar(id)}
      <div><b>${esc(nom(id))}</b>${id === P.createur ? ' <span class="discret">· créateur</span>' : ''}
      <div class="discret">${d ? `joue contre ${esc(d.nom)} ${h.e}` : 'spectateur'}</div></div></div>`;
  }).join('');
  return `<div class="pile" style="gap:16px">
      <div class="sur-titre" style="color:var(--soleil)">SALLE D'ATTENTE</div>
      <h2 class="partie-nom">${esc(P.nom)}</h2>
      <button class="btn soleil large" data-a="inviter">Envoyer le lien d'invitation</button>
      <p class="discret" style="margin:0">Le lien contient la clé qui chiffre vos photos. Envoie-le seulement aux joueurs.</p>
      ${carteNotifs()}
      <div class="titre-section" style="margin:6px 0 0">Dans la partie (${n})</div>
      <div class="pile">${membres}</div>
      ${createur
        ? `<button class="btn corail large" data-a="go" style="font-family:var(--f-titre);font-size:26px;padding:18px" ${n < 2 ? 'disabled' : ''}>GO</button>
           <p class="discret" style="margin:0;text-align:center">${n < 2 ? 'Il faut au moins une autre personne pour lancer.' : 'Tout le monde sera prévenu. L\'année commence.'}</p>`
        : `<div class="carte" style="text-align:center">En attente du GO de <b>${esc(nom(P.createur))}</b>…</div>`}
      <button class="btn fantome" data-a="hub">Mes parties</button>
    </div>`;
}

/* ================= Rendu ================= */

function modeCourant() {
  if (!L.joueur) return 'accueil';
  if (E.mode) return E.mode;
  if (!P) return 'hub';
  return P.debut ? 'jeu' : 'salon';
}

function render(anim = false) {
  const vue = $('#vue');
  const mode = modeCourant();
  const jeu = mode === 'jeu';
  $('#entete').hidden = !jeu;
  $('#nav').hidden = !jeu;
  const scroll = vue.scrollTop;
  if (!jeu) {
    vue.innerHTML = { accueil: vueAccueil, hub: vueHub, creer: vueCreer, rejoindre: vueRejoindre, salon: vueSalon }[mode]();
  } else {
    const j = Math.floor((maintenant() - P.debut) / J);
    $('#puce-jour').textContent = 'J+' + Math.max(0, j);
    $('#puce-points').textContent = points(L.joueur) + ' pts';
    document.querySelectorAll('.onglet').forEach(b => b.classList.toggle('actif', b.dataset.onglet === L.onglet));
    vue.innerHTML = { fil: vueFil, partie: vuePartie, badges: vueBadges, moi: vueMoi }[L.onglet]();
    animerPV();
  }
  vue.className = anim ? 'vue-entree' : '';
  vue.scrollTop = anim ? 0 : scroll;
  if (P && (jeu || mode === 'salon')) chargerMediasVisibles();
}

function animerPV() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.barre > i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; });
  }));
  for (const d of P.defis) {
    const p = pv(d);
    const avant = PV_AFFICHE[d.id];
    PV_AFFICHE[d.id] = p;
    if (avant == null || avant === p) continue;
    document.querySelectorAll(`.bete-carte[data-defi="${d.id}"]`).forEach(carte => {
      const svg = carte.querySelector('.bete-svg');
      if (svg) { svg.classList.remove('touche'); void svg.getBoundingClientRect(); svg.classList.add('touche'); }
      const x = document.createElement('div');
      x.className = 'degat' + (p > avant ? ' soin' : '');
      x.textContent = (p > avant ? '+' : '−') + Math.abs(p - avant) + ' PV';
      x.style.left = carte.classList.contains('grande') ? '50%' : '60px';
      x.style.top = '24px';
      x.style.transform = 'translateX(-50%)';
      carte.appendChild(x);
      setTimeout(() => x.remove(), 1200);
    });
  }
}

function changerOnglet(o) {
  if (L.onglet === o) { $('#vue').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  L.onglet = o;
  sauverLocal();
  son('tic');
  render(true);
}

/* ================= Ce qui vient d'arriver : animations ================= */

let fileAnim = Promise.resolve();
function nouveautes(evts, ancien) {
  const moi = L.joueur;
  let bannieres = 0;
  const lancement = evts.some(e => e.type === 'lancement');
  for (const e of evts) {
    if (e.type === 'lancement' || (e.type === 'go' && e.qui === moi && !lancement)) enFile(() => compteARebours());
    else if (e.type === 'tirage' && (e.qui === moi || e.bourreau === moi)) {
      const g = P.gages.find(x => x.id === e.gage);
      if (g && g.statut === 'attente') enFile(() => tirage(e));
    }
    else if (e.type === 'badge' && e.qui === moi) enFile(() => montrerBadge(e.badge));
    else if (e.type === 'mort' && e.qui === moi) enFile(() => celebrer(defi(e.defi)));
    else if (e.qui !== moi && bannieres < 2 && !['badge', 'tirage'].includes(e.type) && document.visibilityState === 'visible') {
      const tmp = document.createElement('div');
      tmp.innerHTML = texteEvt(e);
      const texte = tmp.textContent.trim();
      if (texte) { bannieres++; setTimeout(() => { banniere(P.nom, texte); son('pop'); vibrer('40,60,40'); }, bannieres * 900); }
    }
  }
}
function enFile(f) { fileAnim = fileAnim.then(f).catch(() => {}); }

async function compteARebours() {
  const el = ouvrir(`<div class="rebours" id="rb"></div><p id="rb-txt">Préviens tes proches…</p>`, { plein: true, fermable: false });
  const rb = $('#rb', el);
  for (const n of ['3', '2', '1']) {
    rb.className = 'rebours'; rb.textContent = n; void rb.offsetWidth; rb.className = 'rebours anim';
    son('bip'); vibrer('60');
    await attendre(850);
  }
  rb.className = 'rebours go'; rb.textContent = 'GO!'; void rb.offsetWidth; rb.className = 'rebours go anim';
  $('#rb-txt', el).textContent = 'La partie est lancée. 365 jours.';
  son('go'); vibrer('100,50,100,50,300'); confettis(180);
  await attendre(1300);
  fermerEl(el);
}

/** Roue du tirage : le serveur a déjà tiré, on rejoue le suspense. */
async function tirage(e) {
  const victime = e.qui, elu = e.bourreau;
  const cands = Object.keys(P.membres).filter(id => id !== victime);
  if (!cands.includes(elu)) return;
  const n = cands.length, R = 38;
  const avs = cands.map((id, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
    return avatar(id, '', `style="left:calc(${x}% - 31px);top:calc(${y}% - 31px)"`);
  }).join('');
  const titre = victime === L.joueur ? 'Ton châtiment' : `Châtiment de ${nom(victime)}`;
  const el = ouvrir(`<div class="sur-titre">TIRAGE AU SORT</div><h2>${esc(titre)}</h2>
    <div class="roue">${avs}<div class="roue-centre" id="rc">?</div></div>
    <p id="tt">Qui va choisir le châtiment ?</p>`, { plein: true, fermable: false });
  const els = [...el.querySelectorAll('.roue .avatar')];
  const fin = cands.indexOf(elu);
  const tours = 3 * n + fin;
  let delai = 55;
  for (let k = 0; k <= tours; k++) {
    els.forEach(x => x.classList.remove('vise'));
    els[k % n].classList.add('vise');
    son('tic'); vibrer('12');
    await attendre(delai);
    delai = k > tours - 6 ? delai * 1.5 : delai * 1.05;
  }
  els[fin].classList.add('elu');
  $('#rc', el).textContent = elu === L.joueur ? 'TOI' : nom(elu).toUpperCase();
  $('#tt', el).innerHTML = elu === L.joueur ? '<b>C\'est toi qui choisis !</b>' : `<b>${esc(nom(elu))}</b> choisit le châtiment.`;
  son('badge'); vibrer('80,60,200');
  await attendre(2000);
  fermerEl(el);
  if (elu === L.joueur) {
    const g = P.gages.find(x => x.id === e.gage);
    if (g && g.statut === 'attente') feuilleChoisir(g);
  }
}

async function montrerBadge(id) {
  const b = BADGES.find(x => x.id === id);
  if (!b) return;
  await new Promise(fin => {
    ouvrir(`<div class="sur-titre">BADGE DÉBLOQUÉ</div>
      <div class="badge-geant">${medaille(b)}</div>
      <h2>${esc(b.nom)}</h2><p>${esc(b.desc)}</p><p style="color:var(--soleil);font-weight:900">+10 points</p>
      <button class="btn soleil" data-a="fermerCalque">Trop bien</button>`, { plein: true, onClose: fin });
    son('badge'); vibrer('30,40,30,40,120'); confettis(120);
  });
}

async function celebrer(d) {
  if (!d) return;
  await new Promise(fin => {
    ouvrir(`<div class="sur-titre">VICTOIRE</div>${beteSVG(d).replace('class="bete-svg"', 'class="bete-svg" style="width:200px;height:200px"')}
      <h2>${esc(d.nom)} est morte</h2><p>Tu l'as abattue en ${Math.floor((d.mort - d.debut) / J)} jours. Toute la partie est prévenue.</p>
      <p style="color:var(--soleil);font-weight:900">+100 points</p>
      <button class="btn soleil" data-a="fermerCalque">Repose en paix</button>`, { plein: true, onClose: fin });
    son('go'); vibrer('100,60,100,60,400'); confettis(220);
  });
}

async function scenesHonte(d) {
  const flash = document.createElement('div');
  flash.className = 'flash-rouge';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
  son('honte'); vibrer('300,100,300');
  const el = ouvrir(`<div class="tampon">HONTE</div>
    <div class="bete-carte grande" style="background:transparent;border:0">${beteSVG(d)}</div>
    <h2>${esc(d.nom)} reprend des forces</h2><p>+${PV_RECHUTE} points de vie. Ta série repart de zéro.</p>`, { plein: true, fermable: false });
  await attendre(900);
  const svg = el.querySelector('.bete-svg');
  if (svg) svg.classList.add('touche');
  const x = document.createElement('div');
  x.className = 'degat soin'; x.textContent = '+' + PV_RECHUTE + ' PV';
  x.style.left = '50%'; x.style.top = '10px'; x.style.transform = 'translateX(-50%)';
  el.querySelector('.bete-carte').appendChild(x);
  await attendre(1700);
  fermerEl(el);
}

/* ================= Feuilles d'action ================= */

function zoneDepot(id, texte) {
  return `<label class="depot" for="${id}"><span class="e">📸</span>${esc(texte)}<span class="discret" style="font-weight:700">Photo, ou vidéo de 15 s maximum</span></label>
    <input type="file" id="${id}" accept="image/*,video/*" hidden>
    <div class="apercu-preuve" id="${id}-apercu" hidden></div>`;
}

function brancherDepot(el, id, quandPret) {
  const input = $('#' + id, el);
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const m = await preparerFichier(f);
    if (m.erreur) { banniere('Fichier refusé', m.erreur); return; }
    const ap = $('#' + id + '-apercu', el);
    ap.hidden = false;
    ap.innerHTML = m.video
      ? `<video src="${m.url}" controls playsinline autoplay muted loop></video>`
      : `<img src="${m.url}" alt="Aperçu">`;
    el.querySelector('label.depot').innerHTML = '<span class="e">🔁</span>Changer';
    quandPret(m);
  });
}

/** Chiffre puis envoie le média avec l'action. */
async function envoyerAvecMedia(a, params, media, texte) {
  let m;
  const fin = attente('Chiffrement…');
  try { m = await chiffrer(media); }
  catch (err) { fin(); banniere('Chiffrement impossible', err.message); return false; }
  fin();
  const mo = (media.blob.size / 1048576).toFixed(1);
  return jouer(a, Object.assign({ media: m }, params), texte + (media.video ? ` (${mo} Mo)` : ''));
}

function feuilleCraque() {
  if (!P || !P.debut) { banniere('Pas encore', 'La partie n\'a pas commencé.'); return; }
  const vivants = mesDefis().filter(enJeu);
  if (!vivants.length) {
    ouvrir(`<h2>Rien à avouer</h2><p class="discret">Tu n'as aucun défi en cours. Lance-en un depuis l'onglet Moi.</p>
      <button class="btn large" data-a="fermerCalque">OK</button>`);
    return;
  }
  let choix = vivants[0].id, media = null;
  const el = ouvrir(`<h2>Tu as craqué ?</h2>
    <p class="discret" style="margin:0">Balance-toi. Toute la partie sera prévenue et le sort désignera ton bourreau. La photo est effacée au bout de 24 h.</p>
    ${vivants.length > 1 ? `<div class="puces-choix" id="choixDefi">${vivants.map(d => `<button class="puce-choix" data-d="${d.id}">${(HABITUDES[d.habit] || HABITUDES.autre).e} ${esc(d.nom)}</button>`).join('')}</div>` : ''}
    ${zoneDepot('preuveAveu', 'Prends-toi en flagrant délit')}
    <button class="btn corail large" id="envoyerAveu" disabled>Je me balance</button>`);
  const marquer = () => el.querySelectorAll('#choixDefi .puce-choix').forEach(b => {
    b.style.borderColor = b.dataset.d === choix ? 'var(--corail)' : ''; b.style.borderStyle = b.dataset.d === choix ? 'solid' : '';
  });
  marquer();
  el.querySelectorAll('#choixDefi .puce-choix').forEach(b => b.addEventListener('click', () => { choix = b.dataset.d; marquer(); }));
  brancherDepot(el, 'preuveAveu', m => { media = m; $('#envoyerAveu', el).disabled = false; });
  $('#envoyerAveu', el).addEventListener('click', async () => {
    fermerEl(el);
    const d = defi(choix);
    await scenesHonte(d);
    await envoyerAvecMedia('craquer', { defi: d.id }, media, 'Envoi chiffré à la partie…');
  });
}

function feuilleChoisir(g) {
  const d = defi(g.defi);
  let texte = null;
  const el = ouvrir(`<h2>Châtiment de ${esc(nom(g.victime))}</h2>
    <span class="minuteur" data-ech="${g.echeance}">Il te reste ${resteTemps(g.echeance)}</span>
    <div class="discret">Après, le hasard choisira dans sa liste :</div>
    <div class="liste-gages">${d.gages.map(t => `<button class="gage-ligne" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="champ"><label for="gageInvente">Ou invente le tien</label><input id="gageInvente" maxlength="120" placeholder="Ex : chanter du Céline Dion au bureau"></div>
    <button class="btn soleil large" id="validerChoix" disabled>Infliger ce châtiment</button>`);
  const maj = () => {
    el.querySelectorAll('.gage-ligne').forEach(b => b.classList.toggle('choisi', b.dataset.t === texte));
    $('#validerChoix', el).disabled = !texte;
  };
  el.querySelectorAll('.gage-ligne').forEach(b => b.addEventListener('click', () => { texte = b.dataset.t; $('#gageInvente', el).value = ''; son('tic'); maj(); }));
  $('#gageInvente', el).addEventListener('input', e => { texte = e.target.value.trim() || null; maj(); });
  $('#validerChoix', el).addEventListener('click', async () => {
    fermerEl(el);
    if (await jouer('choisir', { gage: g.id, texte }, 'Envoi du châtiment…')) { son('badge'); vibrer('40,40,120'); }
  });
}

function feuilleProuver(g) {
  let media = null;
  const el = ouvrir(`<h2>Prouve-le</h2><div class="evt-gage">${esc(g.texte)}</div>
    ${zoneDepot('preuveGage', 'Montre que tu l\'as fait')}
    <p class="discret" style="margin:0">La preuve est effacée dès qu'elle est jugée.</p>
    <button class="btn corail large" id="envoyerPreuve" disabled>Envoyer${g.bourreau ? ' à ' + esc(nom(g.bourreau)) : ''}</button>`);
  brancherDepot(el, 'preuveGage', m => { media = m; $('#envoyerPreuve', el).disabled = false; });
  $('#envoyerPreuve', el).addEventListener('click', async () => {
    fermerEl(el);
    await envoyerAvecMedia('prouver', { gage: g.id }, media, 'Envoi chiffré de la preuve…');
  });
}

function feuilleJuger(g) {
  const el = ouvrir(`<h2>Gage de ${esc(nom(g.victime))}</h2><div class="evt-gage">${esc(g.texte)}</div>
    ${mediaHTML(g.preuve)}
    <p class="discret" style="margin:0">Quelle que soit ta réponse, la preuve est effacée.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn fantome" id="refuser">À refaire</button>
      <button class="btn menthe" id="valider">Validé</button></div>`);
  chargerMediasVisibles();
  const fin = async ok => {
    fermerEl(el);
    if (await jouer('juger', { gage: g.id, ok }, ok ? 'Validation…' : 'Refus…') && ok) { son('badge'); confettis(70); }
  };
  $('#valider', el).addEventListener('click', () => fin(true));
  $('#refuser', el).addEventListener('click', () => fin(false));
}

function feuilleRepondre(a) {
  const d = defi(a.defi);
  const el = ouvrir(`<h2>${esc(nom(a.qui))} t'accuse</h2>
    <p class="discret" style="margin:0">D'après ${esc(nom(a.qui))}, tu as craqué sur ${esc((HABITUDES[d.habit] || HABITUDES.autre).nom.toLowerCase())}.
      Si tu contestes, la partie vote.</p>
    ${mediaHTML(a.media)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn corail" id="avouer">J'avoue</button>
      <button class="btn fantome" id="contester">Je conteste</button></div>`);
  chargerMediasVisibles();
  $('#avouer', el).addEventListener('click', async () => {
    fermerEl(el);
    await scenesHonte(d);
    await jouer('repondre', { accusation: a.id, avoue: true }, 'Envoi…');
  });
  $('#contester', el).addEventListener('click', async () => {
    fermerEl(el);
    await jouer('repondre', { accusation: a.id, avoue: false }, 'La partie va voter…');
  });
}

function feuilleVoter(a) {
  const el = ouvrir(`<h2>${esc(nom(a.cible))} a-t-il craqué ?</h2>
    <p class="discret" style="margin:0">${esc(nom(a.qui))} l'accuse, ${esc(nom(a.cible))} conteste. À toi de trancher.</p>
    ${mediaHTML(a.media)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn menthe" id="innocent">Innocent</button>
      <button class="btn corail" id="coupable">Coupable</button></div>`);
  chargerMediasVisibles();
  const voter = async coupable => {
    fermerEl(el);
    if (await jouer('voter', { accusation: a.id, coupable }, 'Vote…')) banniere('A voté', coupable ? 'Coupable.' : 'Innocent.');
  };
  $('#innocent', el).addEventListener('click', () => voter(false));
  $('#coupable', el).addEventListener('click', () => voter(true));
}

function feuilleDenoncer(id) {
  const d = P.defis.find(x => x.qui === id && enJeu(x));
  if (!d) return;
  let media = null;
  const el = ouvrir(`<h2>Dénoncer ${esc(nom(id))}</h2>
    <p class="discret" style="margin:0">Tu l'as vu craquer sur ${esc((HABITUDES[d.habit] || HABITUDES.autre).nom.toLowerCase())} ? Il faut une preuve.
      ${esc(nom(id))} pourra avouer ou contester devant la partie.</p>
    ${zoneDepot('preuveDenonce', 'Ta preuve')}
    <button class="btn corail large" id="envoyerDenonce" disabled>Balancer ${esc(nom(id))}</button>`);
  brancherDepot(el, 'preuveDenonce', m => { media = m; $('#envoyerDenonce', el).disabled = false; });
  $('#envoyerDenonce', el).addEventListener('click', async () => {
    fermerEl(el);
    if (await envoyerAvecMedia('denoncer', { defi: d.id }, media, 'Envoi chiffré de la preuve…')) { L.onglet = 'fil'; render(true); }
  });
}

function feuillePari(defiId) {
  const d = defi(defiId);
  const pts = points(L.joueur);
  const el = ouvrir(`<h2>Parier sur ${esc(nom(d.qui))}</h2>
    <p class="discret" style="margin:0">${esc(nom(d.qui))} tient encore 7 jours contre ${esc(d.nom)} ? Si oui, tu doubles ta mise. Points virtuels uniquement.</p>
    <div class="demo-boutons">${[10, 25, 50].map(m => `<button class="btn soleil" data-m="${m}" ${m > pts ? 'disabled' : ''}>${m} pts</button>`).join('')}</div>
    <div class="discret">Tu as ${pts} points.</div>`);
  el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', async () => {
    fermerEl(el);
    if (await jouer('parier', { defi: d.id, mise: Number(b.dataset.m) }, 'Pari…')) {
      son('pop'); banniere('Pari enregistré', `${b.dataset.m} pts sur ${nom(d.qui)}. Réponse dans 7 jours.`);
    }
  }));
}

function feuilleAjouterDefi() {
  const exclues = mesDefis().filter(enJeu).map(d => d.habit).filter(h => h !== 'autre');
  const a = { habit: null, nomAutre: '', gages: [] };
  const el = ouvrir('<div id="ajout" class="pile" style="gap:14px"></div>');
  const zone = $('#ajout', el);
  const etape1 = () => {
    zone.innerHTML = `<h2>Nouveau défi</h2>${grilleHabitudes(a.habit, exclues)}
      ${a.habit === 'autre' ? `<div class="champ"><label for="ajoutAutre">Nomme ta bête</label><input id="ajoutAutre" maxlength="24" value="${esc(a.nomAutre)}"></div>` : ''}
      <button class="btn corail large" id="a1" ${a.habit && (a.habit !== 'autre' || a.nomAutre.trim()) ? '' : 'disabled'}>Suivant</button>`;
    zone.querySelectorAll('.habitude').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); a.habit = b.dataset.k; son('tic'); etape1(); }));
    const ia = $('#ajoutAutre', zone);
    if (ia) ia.addEventListener('input', () => { a.nomAutre = ia.value; $('#a1', zone).disabled = !ia.value.trim(); });
    $('#a1', zone).addEventListener('click', etape2);
  };
  const etape2 = () => {
    zone.innerHTML = `<h2>Tes châtiments</h2>${editeurGages(a.gages)}
      <button class="btn corail large" id="a2" style="font-family:var(--f-titre);font-size:22px" ${a.gages.length >= 3 ? '' : 'disabled'}>GO (${a.gages.length}/3)</button>`;
    zone.querySelectorAll('[data-a="suggestion"]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); a.gages.push(b.dataset.t); etape2(); }));
    zone.querySelectorAll('[data-a="retirerGage"]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); a.gages.splice(Number(b.dataset.i), 1); etape2(); }));
    const ajouter = e => { if (e) e.stopPropagation(); const v = $('#nouveauGage', zone).value.trim(); if (v) { a.gages.push(v); etape2(); } };
    zone.querySelector('[data-a="ajouterGage"]').addEventListener('click', ajouter);
    $('#nouveauGage', zone).addEventListener('keydown', e => { if (e.key === 'Enter') ajouter(e); });
    $('#a2', zone).addEventListener('click', async () => {
      fermerEl(el);
      const def = { habit: a.habit, nom: a.habit === 'autre' ? a.nomAutre.trim() : '', gages: a.gages };
      if (await jouer('ajouterDefi', { defi: def }, 'Création du défi…')) { L.onglet = 'fil'; render(true); }
    });
  };
  etape1();
}

/* ================= Parties : créer, rejoindre, inviter ================= */

function lienInvitation() {
  const ref = L.parties.find(x => x.id === P.id);
  return SITE + '#j=' + P.code + '.' + (ref ? ref.cle : '');
}

function lireLien(texte) {
  const m = String(texte || '').match(/(BH-[A-Z0-9]{5})\.([A-Za-z0-9_-]{43})/);
  return m ? { code: m[1], cle: m[2] } : null;
}

async function ouvrirInvitation(inv) {
  L.invitation = inv;
  sauverLocal();
  const deja = L.parties.find(x => x.cle === inv.cle);
  if (deja) { L.invitation = null; sauverLocal(); await ouvrirPartie(deja.id); return; }
  E = { mode: 'rejoindre', etape: 0, b: null, apercu: null };
  render(true);
  try { E.apercu = await appel('apercu', { code: inv.code }); }
  catch (err) { E.apercu = { erreur: err.message }; }
  if (E.mode === 'rejoindre') render();
}

async function ouvrirPartie(id) {
  const memo = partieMemorisee(id);
  E = { mode: null, etape: 0, b: null, apercu: null };
  if (memo) { P = memo; L.courante = id; sauverLocal(); render(true); }
  else {
    P = null;
    const fin = attente('Chargement de la partie…');
    try {
      const d = await appel('etat', { partie: id });
      if (d.etat) majEtat(d.etat);
    } catch (err) { banniere('Partie inaccessible', err.message); if (/introuvable|ne fais pas partie/.test(err.message)) oublierPartie(id); }
    finally { fin(); }
    return;
  }
  rafraichir();
}

function oublierPartie(id) {
  L.parties = L.parties.filter(x => x.id !== id);
  if (L.courante === id) L.courante = null;
  try { localStorage.removeItem('bhcd-p:' + id); } catch (e) { /* rien */ }
  if (P && P.id === id) P = null;
  sauverLocal();
  render(true);
}

function defiBrouillon() {
  const b = E.b;
  if (!b || !b.habit) return null;
  return { habit: b.habit, nom: b.habit === 'autre' ? b.nomAutre.trim() : '', gages: b.gages };
}

async function creerPartie(spectateur) {
  const b = E.b;
  const cle = nouvelleCle();
  const fin = attente('Création de la partie…');
  try {
    const d = await appel('creer', { nom: b.nom, defi: spectateur ? null : defiBrouillon(), partie: undefined });
    L.parties.push({ id: d.etat.id, nom: d.etat.nom, cle });
    E = { mode: null, etape: 0, b: null, apercu: null };
    majEtat(d.etat);
    son('go'); confettis(80);
  } catch (err) { banniere('Création impossible', err.message); }
  finally { fin(); }
}

async function rejoindrePartie(spectateur) {
  const inv = L.invitation;
  if (!inv) return;
  const fin = attente('Tu rejoins la partie…');
  try {
    const d = await appel('rejoindre', { code: inv.code, defi: spectateur ? null : defiBrouillon(), partie: undefined });
    if (!L.parties.some(x => x.id === d.etat.id)) L.parties.push({ id: d.etat.id, nom: d.etat.nom, cle: inv.cle });
    L.invitation = null;
    E = { mode: null, etape: 0, b: null, apercu: null };
    P = null;
    majEtat(d.etat);
    son('go'); confettis(100);
  } catch (err) { banniere('Impossible de rejoindre', err.message); }
  finally { fin(); }
}

async function partager(texte, lien) {
  try {
    if (window.Android) { window.Android.partager(texte + ' ' + lien); return; }
    if (navigator.share) { await navigator.share({ title: 'Bad Habits Can Die', text: texte, url: lien }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  await copier(lien, 'Lien copié', 'Colle-le dans ta conversation.');
}

async function copier(texte, titre, corps) {
  try { await navigator.clipboard.writeText(texte); banniere(titre, corps); }
  catch (e) {
    ouvrir(`<h2>Copie ce lien</h2><textarea readonly style="width:100%;min-height:90px;border-radius:12px;padding:10px;background:var(--encre-2);color:var(--papier);border:1px solid var(--trait)">${esc(texte)}</textarea>
      <button class="btn large" data-a="fermerCalque">OK</button>`);
  }
}

/* ================= Notifications du téléphone ================= */

async function activerNotifs() {
  if (ios && !autonome()) {
    ouvrir(`<h2>Sur iPhone</h2><p class="discret">Touche <b>Partager</b> puis <b>« Sur l'écran d'accueil »</b>, et ouvre l'appli depuis l'icône. Les notifications marchent seulement comme ça.</p>
      <button class="btn large" data-a="fermerCalque">Compris</button>`);
    return;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) { banniere('Pas de notifications', 'Ce navigateur ne les gère pas. Essaie avec Chrome.'); return; }
  const fin = attente('Activation des notifications…');
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Tu as refusé. Autorise-les dans les réglages du navigateur.');
    const r = await fetch(SERVEUR + '?a=cle');
    const { cle } = await r.json();
    let abo = await reg.pushManager.getSubscription();
    if (abo) await abo.unsubscribe();
    abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uVersOctets(cle) });
    const d = await appel('abonner', { abonnement: abo.toJSON(), appareil: navigator.userAgent, partie: undefined });
    L.appareil = { id: d.id, secret: d.secret };
    sauverLocal();
    try { localStorage.setItem('bhcd-appareil', JSON.stringify(d)); } catch (e) { /* rien */ }
    const c = await caches.open('bhcd-config');
    await c.put('config', new Response(JSON.stringify({ serveur: SERVEUR, id: d.id, secret: d.secret })));
    banniere('Notifications activées', 'Tu seras prévenu à chaque rebondissement.');
    son('badge');
  } catch (err) {
    banniere('Notifications', err.message);
  } finally { fin(); render(); }
}

/* ================= Actions (clics) ================= */

const ACTIONS = {
  etapeSuivante() {
    const b = E.b;
    if (b && E.etape === 1 && b.habit !== 'autre') b.nomAutre = '';
    E.etape++;
    son('tic');
    render(true);
  },
  couleur(ds) { if (!E.b) return; E.b.couleur = ds.c; son('tic'); render(); },
  async inscrire() {
    const b = E.b;
    if (!b || !b.pseudo.trim()) return;
    const fin = attente('Création de ton profil…');
    try {
      const d = await appel('inscrire', { pseudo: b.pseudo.trim(), couleur: b.couleur });
      L.joueur = d.joueur; L.secret = d.secret; L.pseudo = d.pseudo; L.couleur = d.couleur;
      sauverLocal();
      E = { mode: null, etape: 0, b: null, apercu: null };
      son('go');
      if (L.invitation) ouvrirInvitation(L.invitation); else render(true);
    } catch (err) { banniere('Inscription impossible', err.message); }
    finally { fin(); }
  },
  habit(ds) {
    if (!E.b) return;
    E.b.habit = ds.k; son('tic'); render();
    if (ds.k === 'autre') { const i = $('#nomAutre'); if (i) i.focus(); }
  },
  suggestion(ds) { if (!E.b) return; E.b.gages.push(ds.t); son('pop'); render(); },
  retirerGage(ds) { if (!E.b) return; E.b.gages.splice(Number(ds.i), 1); render(); },
  ajouterGage() {
    if (!E.b) return;
    const i = $('#nouveauGage');
    const v = i && i.value.trim();
    if (v) { E.b.gages.push(v); son('pop'); render(); const j = $('#nouveauGage'); if (j) j.focus(); }
  },
  hub() { E = { mode: 'hub', etape: 0, b: null, apercu: null }; render(true); },
  annuler() { quitterEcran(); },
  creer() { E = { mode: 'creer', etape: 0, b: null, apercu: null }; son('tic'); render(true); },
  creerPartie() { creerPartie(false); },
  creerSpectateur() { creerPartie(true); },
  rejoindrePartie() { rejoindrePartie(false); },
  rejoindreSpectateur() { rejoindrePartie(true); },
  collerLien() {
    const inv = lireLien($('#lienColle') && $('#lienColle').value);
    if (!inv) { banniere('Lien non reconnu', 'Colle le lien complet reçu de ton ami.'); return; }
    ouvrirInvitation(inv);
  },
  copierInvitation() {
    const inv = L.invitation;
    if (inv) copier(SITE + '#j=' + inv.code + '.' + inv.cle, 'Lien copié', 'Ajoute l\'appli à l\'écran d\'accueil, ouvre-la et colle-le.');
  },
  ouvrirPartie(ds) { ouvrirPartie(ds.id); },
  inviter() {
    partager(`Rejoins ma partie « ${P.nom} » sur Bad Habits Can Die. Un an pour tuer nos mauvaises habitudes, aucune pitié.`, lienInvitation());
  },
  go() { jouer('go', {}, 'Lancement…'); },
  activerNotifs() { activerNotifs(); },
  reagir(ds, el) {
    const e = P.fil.find(x => x.id === ds.evt);
    if (!e) return;
    const k = ds.k;
    const l = e.reac[k] || (e.reac[k] = []);
    const i = l.indexOf(L.joueur);
    if (i >= 0) l.splice(i, 1);
    else {
      l.push(L.joueur);
      const r = el.getBoundingClientRect();
      const em = REACTIONS.find(x => x[0] === k)[1];
      for (let n = 0; n < 5; n++) {
        const f = document.createElement('div');
        f.className = 'envol'; f.textContent = em;
        f.style.left = (r.left + r.width / 2 - 13) + 'px'; f.style.top = (r.top - 10) + 'px';
        f.style.setProperty('--dx', ((Math.random() - 0.5) * 60) + 'px');
        f.style.animationDelay = (n * 0.06) + 's';
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 1400);
      }
      son('pop'); vibrer('15');
    }
    render();
    jouer('reagir', { evt: e.id, k });
  },
  choisir(ds) { const g = P.gages.find(x => x.id === ds.id); if (g) feuilleChoisir(g); },
  juger(ds) { const g = P.gages.find(x => x.id === ds.id); if (g) feuilleJuger(g); },
  prouver(ds) { const g = P.gages.find(x => x.id === ds.id); if (g) feuilleProuver(g); },
  repondre(ds) { const a = P.accusations.find(x => x.id === ds.id); if (a) feuilleRepondre(a); },
  voter(ds) { const a = P.accusations.find(x => x.id === ds.id); if (a) feuilleVoter(a); },
  denoncer(ds) { feuilleDenoncer(ds.id); },
  parier(ds) { feuillePari(ds.id); },
  ajouterDefi() { feuilleAjouterDefi(); },
  voirMedia(ds, el) { el.innerHTML = 'Déchiffrement…'; chargerMedia(ds.id); },
  son() { L.son = !L.son; sauverLocal(); render(); son('pop'); },
  voirBadge(ds) {
    const b = BADGES.find(x => x.id === ds.id);
    const ok = moiMembre().badges[b.id];
    ouvrir(`<div style="display:grid;justify-items:center;gap:8px;text-align:center">
      <div style="width:120px;height:120px;${ok ? '' : 'filter:grayscale(1) brightness(.5)'}">${medaille(b)}</div>
      <h2>${esc(b.nom)}</h2><p class="discret" style="margin:0">${esc(b.desc)}</p>
      <b style="color:${ok ? 'var(--menthe)' : 'var(--brume)'}">${ok ? 'Débloqué' : 'Pas encore débloqué'}</b></div>
      <button class="btn large" data-a="fermerCalque">Fermer</button>`);
  },
  fermerCalque(ds, el) { const c = el.closest('.calque'); if (c) fermerEl(c); }
};

document.addEventListener('click', e => {
  const o = e.target.closest('.onglet');
  if (o) { changerOnglet(o.dataset.onglet); return; }
  if (e.target.closest('#btn-craque')) { son('tic'); vibrer('30'); feuilleCraque(); return; }
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const f = ACTIONS[b.dataset.a];
  if (f) f(b.dataset, b, e);
});

document.addEventListener('input', e => {
  const t = e.target, b = E.b;
  if (!b) return;
  if (t.id === 'pseudo') { b.pseudo = t.value; const s = $('#suite'); if (s) s.disabled = !t.value.trim(); }
  if (t.id === 'nomAutre') {
    b.nomAutre = t.value;
    const s = document.querySelector('[data-a="etapeSuivante"]'); if (s) s.disabled = !t.value.trim();
  }
  if (t.id === 'nomPartie') b.nom = t.value;
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'nouveauGage' && E.b) ACTIONS.ajouterGage();
  if (e.target.id === 'lienColle') ACTIONS.collerLien();
});

// Minuteurs qui défilent
setInterval(() => {
  document.querySelectorAll('[data-ech]').forEach(m => {
    m.textContent = (m.dataset.txt || 'Il te reste ') + resteTemps(Number(m.dataset.ech));
  });
}, 20000);

// La partie se met à jour toute seule : souvent dans la salle d'attente, régulièrement en jeu.
let dernierRafraichissement = 0;
setInterval(() => {
  if (document.visibilityState !== 'visible' || !P || E.mode || pile.length) return;
  const periode = P.debut ? 20000 : 6000;
  if (Date.now() - dernierRafraichissement < periode) return;
  dernierRafraichissement = Date.now();
  rafraichir();
}, 2000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { dernierRafraichissement = Date.now(); rafraichir(); } });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'maj') rafraichir(); });
}

/* ================= Démarrage ================= */

// Lien d'invitation ouvert alors que l'appli tourne déjà
window.addEventListener('hashchange', () => {
  const inv = lireLien(location.hash);
  if (!inv) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (L.joueur) ouvrirInvitation(inv);
  else { L.invitation = inv; sauverLocal(); }
});

(function demarrer() {
  const inv = lireLien(location.hash);
  if (inv) {
    history.replaceState(null, '', location.pathname + location.search);
    L.invitation = inv;
    sauverLocal();
  }
  if (!SERVEUR) {
    $('#vue').innerHTML = '<div class="vide">Le serveur n\'est pas branché.</div>';
    return;
  }
  if (!L.joueur) { render(true); return; }
  if (L.invitation) { ouvrirInvitation(L.invitation); return; }
  if (L.courante && L.parties.some(x => x.id === L.courante)) { ouvrirPartie(L.courante); return; }
  render(true);
})();
