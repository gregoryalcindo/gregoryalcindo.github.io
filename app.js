'use strict';
/* Bad Habits Can Die — prototype jouable (mode démo, données sur le téléphone).
   Règle proposée : chaque mauvaise habitude est une « bête » à 300 points de vie.
   Chaque jour tenu lui retire 1 PV, chaque rechute lui en rend 10. La partie dure 365 jours :
   il faut l'abattre avant la fin. */

const J = 86400000, H = 3600000;
const PV_DEPART = 300, PV_RECHUTE = 10, DUREE = 365, MAX_DEFIS = 3, DELAI_GAGE = 12 * H;
const CLE = 'bhcd-etat-v1';

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

const GAGES_INVENTES = [
  'Imiter une poule pendant 20 secondes, en vidéo',
  'Appeler ta mère et lui chanter une chanson',
  'Faire 100 squats',
  'Parler en rimes pendant une heure',
  'Envoyer un vocal d\'une minute de compliments à quelqu\'un de la partie',
  'Faire un selfie avec un inconnu qui sourit',
  'Manger un piment entier'
];

const BOTS = [
  { id: 'sarah', nom: 'Sarah', couleur: '#7AB8FF', habit: 'reseaux', gages: ['Supprimer Instagram 48 h', 'Poster une story sans filtre', 'Faire 30 burpees'] },
  { id: 'tom',   nom: 'Tom',   couleur: '#FFC93C', habit: 'sucre',   gages: ['Manger un citron entier', 'Faire 50 pompes', 'Payer les croissants à tout le monde'] },
  { id: 'nadia', nom: 'Nadia', couleur: '#3DDC97', habit: 'ongles',  gages: ['Vernis rose fluo pendant une semaine', 'Gainage 3 minutes', 'Ranger le garage de Tom'] },
  { id: 'max',   nom: 'Max',   couleur: '#FF9F6B', habit: 'retard',  gages: ['Arriver 30 min en avance au prochain rendez-vous', 'Payer l\'apéro', 'Courir 5 km'] }
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
  { id: 'juge',      nom: 'Juge',          desc: 'Valider une preuve',               g: '⚖️', c: ['#B6A8D8', '#7AB8FF'] },
  { id: 'balance',   nom: 'Balance',       desc: 'Dénonciation confirmée',           g: '🐀', c: ['#A8988A', '#FF7EC8'] },
  { id: 'phenix',    nom: 'Phénix',        desc: '7 jours tenus après une rechute',  g: '🌅', c: ['#FF7A3D', '#FF5A4E'] },
  { id: 'flair',     nom: 'Flair',         desc: 'Gagner un pari',                   g: '🎯', c: ['#3DDC97', '#7AB8FF'] },
  { id: 'supporter', nom: 'Supporter',     desc: 'Donner 10 réactions',              g: '📣', c: ['#FF7EC8', '#C99BFF'] },
  { id: 'multi',     nom: 'Multitâche',    desc: '3 défis en même temps',            g: '🎪', c: ['#FFC93C', '#FF5A4E'] },
  { id: 'innocent',  nom: 'Innocenté',     desc: 'Gagner un vote de contestation',   g: '😇', c: ['#E8F0FF', '#7AB8FF'] },
  { id: 'riche',     nom: 'Pactole',       desc: 'Atteindre 500 points',             g: '💰', c: ['#FFC93C', '#3DDC97'] }
];

/* ================= État ================= */

function etatNeuf() {
  return {
    v: 1, pret: false, onglet: 'fil', decalage: 0, son: true, ids: 1,
    onb: { etape: 0, pseudo: '', couleur: COULEURS[0], habit: null, nomAutre: '', gages: [], nomPartie: 'Les Potos', rejoints: 0 },
    membres: {}, partie: null, defis: [], fil: [], gages: [], accusations: [], paris: [], badges: {},
    stats: { aveux: 0, dettes: 0, bourreau: 0, juge: 0, balance: 0, paris: 0, innocent: 0, reacs: 0 }
  };
}

let S = charger();
const MEDIAS = {};            // vidéos de la session (URL locales)
const PV_AFFICHE = {};        // derniers PV affichés, pour animer les dégâts
let enSimulation = false;
let notifsSim = [];

function charger() {
  try {
    const t = localStorage.getItem(CLE);
    if (t) { const e = JSON.parse(t); if (e && e.v === 1) return Object.assign(etatNeuf(), e); }
  } catch (e) { /* stockage indisponible : on repart de zéro */ }
  return etatNeuf();
}

function sauver() {
  // Médias éphémères : seuls les 40 derniers événements gardent leur photo, les gages réglés la perdent.
  S.fil.forEach((ev, i) => { if (i >= 40) ev.media = null; });
  S.gages.forEach(g => { if (g.statut === 'valide') g.preuve = null; });
  try { localStorage.setItem(CLE, JSON.stringify(S)); }
  catch (e) {
    // Trop lourd : on retire les médias des vieux événements puis on réessaie.
    S.fil.forEach((ev, i) => { if (i > 15) ev.media = null; });
    try { localStorage.setItem(CLE, JSON.stringify(S)); } catch (e2) { /* tant pis */ }
  }
}

/* ================= Outils ================= */

const $ = (s, r = document) => r.querySelector(s);
const attendre = ms => new Promise(r => setTimeout(r, ms));
const hasard = a => a[Math.floor(Math.random() * a.length)];
const uid = () => 'x' + (S.ids++);
const maintenant = () => Date.now() + S.decalage;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const nom = id => (S.membres[id] ? S.membres[id].nom : '?');
const moi = () => S.membres.moi;
const defi = id => S.defis.find(d => d.id === id);
const mesDefis = () => S.defis.filter(d => d.qui === 'moi');

function jours(d) { return Math.max(0, Math.min(DUREE, Math.floor((maintenant() - d.debut) / J))); }
function pv(d) {
  if (d.mort) return 0;
  return Math.max(0, PV_DEPART - jours(d) + PV_RECHUTE * d.rechutes.length);
}
function serie(d) {
  const der = d.rechutes.length ? Math.max(d.debut, d.rechutes[d.rechutes.length - 1]) : d.debut;
  const fin = d.mort || maintenant();
  return Math.max(0, Math.floor((fin - der) / J));
}
function marge(d) {
  const restants = DUREE - jours(d);
  return Math.max(0, Math.floor((restants - pv(d)) / PV_RECHUTE));
}
function enJeu(d) { return !d.mort && !d.survit; }

function relatif(t) {
  const d = maintenant() - t;
  if (d < 60000) return 'à l\'instant';
  if (d < H) return 'il y a ' + Math.floor(d / 60000) + ' min';
  if (d < J) return 'il y a ' + Math.floor(d / H) + ' h';
  const n = Math.floor(d / J);
  return 'il y a ' + n + (n > 1 ? ' jours' : ' jour');
}
function resteTemps(ech) {
  const r = Math.max(0, ech - maintenant());
  const h = Math.floor(r / H), m = Math.floor((r % H) / 60000);
  return h + ' h ' + String(m).padStart(2, '0');
}

function avatar(id, classe = '', attrs = '') {
  const m = S.membres[id] || { nom: '?', couleur: '#888' };
  return `<div class="avatar ${classe}" style="background:${m.couleur}" ${attrs}>${esc(m.nom.charAt(0).toUpperCase())}</div>`;
}

/* ================= Son, vibration, notifications ================= */

let AC = null;
function son(type) {
  if (!S.son) return;
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
    else if (navigator.vibrate) navigator.vibrate(motif.split(',').map(Number));
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
  setTimeout(() => b.remove(), 3500);
}

/** Notification reçue (venant d'un autre joueur) : bannière + vraie notification Android. */
function notifier(titre, corps) {
  if (enSimulation) { notifsSim.push([titre, corps]); return; }
  banniere(titre, corps);
  son('pop');
  vibrer('40,60,40');
  try { if (window.Android) window.Android.notifier(titre, corps); } catch (e) { /* rien */ }
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
  const h = HABITUDES[d.habit];
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
  const s = (0.62 + 0.38 * r).toFixed(3);
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

/** Image de preuve fabriquée pour les amis fictifs. */
function imageFictive(texte, couleur, emoji, tampon) {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 480;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 480, 480);
  g.addColorStop(0, couleur); g.addColorStop(1, '#1B1230');
  x.fillStyle = g; x.fillRect(0, 0, 480, 480);
  x.font = '170px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 240, 205);
  x.fillStyle = 'rgba(255,243,230,.95)'; x.fillRect(0, 360, 480, 120);
  x.fillStyle = '#1B1230'; x.font = '800 24px Nunito, sans-serif';
  const mots = texte.split(' '); let ligne = '', lignes = [];
  for (const m of mots) { if (x.measureText(ligne + m).width > 430) { lignes.push(ligne); ligne = ''; } ligne += m + ' '; }
  lignes.push(ligne);
  lignes.slice(0, 3).forEach((l, i, t) => x.fillText(l.trim(), 240, 420 + (i - (t.length - 1) / 2) * 30));
  x.save(); x.translate(110, 60); x.rotate(-0.2);
  x.strokeStyle = '#FF5A4E'; x.lineWidth = 6; x.strokeRect(-90, -28, 180, 56);
  x.fillStyle = '#FF5A4E'; x.font = '28px Bungee, Impact, sans-serif'; x.fillText(tampon, 0, 2);
  x.restore();
  return { id: uid(), src: c.toDataURL('image/jpeg', 0.7), video: false };
}

/** Photo ou vidéo choisie par le joueur : image réduite, ou vignette + vidéo gardée pour la session. */
function traiterFichier(f) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(f);
    const id = uid();
    const dessiner = (src, w, h) => {
      const k = Math.min(1, 720 / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.72);
    };
    if (f.type.startsWith('video')) {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
      let fait = false;
      const finir = src => { if (fait) return; fait = true; MEDIAS[id] = url; resolve({ id, src, video: true }); };
      v.addEventListener('loadeddata', () => { try { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); } catch (e) { finir(null); } });
      v.addEventListener('seeked', () => { try { finir(dessiner(v, v.videoWidth, v.videoHeight)); } catch (e) { finir(null); } });
      v.addEventListener('error', () => finir(null));
      setTimeout(() => finir(null), 4000);
    } else {
      const img = new Image();
      img.onload = () => { const src = dessiner(img, img.naturalWidth, img.naturalHeight); URL.revokeObjectURL(url); resolve({ id, src, video: false }); };
      img.onerror = () => resolve(null);
      img.src = url;
    }
  });
}

function mediaHTML(m) {
  if (!m) return '';
  if (m.video && MEDIAS[m.id]) {
    return `<div class="evt-media"><video src="${MEDIAS[m.id]}" ${m.src ? `poster="${m.src}"` : ''} controls playsinline preload="metadata"></video></div>`;
  }
  if (!m.src) return m.video ? `<div class="evt-media"><div class="vide">Vidéo envoyée</div></div>` : '';
  return `<div class="evt-media"><img src="${m.src}" alt="Preuve">${m.video ? '<div class="lecture">▶</div>' : ''}</div>`;
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
  if (S.pret && S.onglet !== 'fil') { S.onglet = 'fil'; render(true); return true; }
  if (!S.pret && S.onb.etape > 0) { S.onb.etape--; render(true); return true; }
  return false;
};

/* ================= Fil d'actualité ================= */

function evt(type, donnees) {
  const e = Object.assign({ id: uid(), t: maintenant(), type, reac: { respect: 0, honte: 0, force: 0, mdr: 0 }, mes: {} }, donnees);
  if (e.qui && e.qui !== 'moi') {
    // les autres réagissent déjà un peu
    for (const [k] of REACTIONS) if (Math.random() < 0.35) e.reac[k] = 1 + Math.floor(Math.random() * 3);
  }
  S.fil.unshift(e);
  if (S.fil.length > 120) S.fil.length = 120;
  return e;
}

/** Les amis fictifs réagissent à ce que tu publies, en direct. */
function reactionsDesAmis(e, types) {
  if (enSimulation) { types.forEach(k => { e.reac[k] += 1 + Math.floor(Math.random() * 2); }); return; }
  let n = 0;
  for (const b of BOTS) {
    if (Math.random() < 0.75) {
      n++;
      setTimeout(() => {
        const k = hasard(types);
        e.reac[k]++;
        sauver();
        if (S.onglet === 'fil') render();
      }, 900 + n * 900 + Math.random() * 600);
    }
  }
}

function texteEvt(e) {
  const d = e.defi ? defi(e.defi) : null;
  const h = d ? HABITUDES[d.habit] : null;
  const N = id => `<b>${esc(id === 'moi' ? moi().nom : nom(id))}</b>`;
  const g = e.gage ? S.gages.find(x => x.id === e.gage) : null;
  const boiteGage = g && g.texte ? `<div class="evt-gage">${esc(g.texte)}</div>` : '';
  switch (e.type) {
    case 'go': return `${N(e.qui)} lance sa partie contre <b>${esc(d.nom)}</b> ${h.e}. 365 jours, aucune pitié.`;
    case 'aveu': return e.apres
      ? `${N(e.qui)} avoue après la dénonciation de ${N(e.apres)}. <b>${esc(d.nom)}</b> reprend ${PV_RECHUTE} PV.`
      : `${N(e.qui)} a craqué ${h.e}. <b>${esc(d.nom)}</b> reprend ${PV_RECHUTE} PV.`;
    case 'accuse': return `${N(e.qui)} accuse ${N(e.cible)} d'avoir craqué ${h.e}. Preuve à l'appui.`;
    case 'conteste': return `${N(e.qui)} conteste. La partie vote…`;
    case 'innocent': return `Le vote innocente ${N(e.qui)}. Fausse alerte.`;
    case 'coupable': return `Le vote déclare ${N(e.qui)} coupable. Rechute comptée.`;
    case 'tirage': return `Le sort désigne ${N(e.bourreau)} pour choisir le châtiment de ${N(e.qui)}.`;
    case 'gage': return `${N(e.bourreau)} a choisi le châtiment de ${N(e.qui)} :${boiteGage}`;
    case 'delai': return `${N(e.bourreau)} n'a pas choisi à temps. Le hasard tranche pour ${N(e.qui)} :${boiteGage}`;
    case 'preuve': return `${N(e.qui)} a fait son gage. Preuve à l'appui.${boiteGage}`;
    case 'valide': return `${N(e.bourreau)} valide la preuve de ${N(e.qui)}. Dette payée.`;
    case 'refuse': return `${N(e.bourreau)} refuse la preuve de ${N(e.qui)}. À refaire.`;
    case 'badge': { const b = BADGES.find(x => x.id === e.badge); return `${N(e.qui)} débloque le badge <b>${esc(b.nom)}</b> ${b.g}`; }
    case 'palier': return `${N(e.qui)} tient depuis <b>${e.n} jours</b> ${h.e}.`;
    case 'mort': return `<b>${esc(d.nom)}</b> est morte. ${N(e.qui)} l'a abattue après ${e.n} jours. 🪦`;
    case 'survit': return `<b>${esc(d.nom)}</b> a survécu à l'année de ${N(e.qui)}. Revanche ?`;
    case 'pari': return `${N('moi')} parie <b>${e.mise} pts</b> que ${N(e.qui)} tient encore 7 jours.`;
    case 'pari-gagne': return `${N('moi')} gagne son pari sur ${N(e.qui)} : <b>+${e.gain} pts</b>.`;
    case 'pari-perdu': return `${N('moi')} perd son pari sur ${N(e.qui)}. Les ${e.mise} pts sont partis.`;
    default: return '';
  }
}

function evtHTML(e) {
  const reac = REACTIONS.map(([k, em]) =>
    `<button class="reac ${e.mes[k] ? 'mienne' : ''}" data-a="reagir" data-evt="${e.id}" data-k="${k}">${em} ${e.reac[k] || ''}</button>`).join('');
  return `<article class="carte evt type-${e.type}">
    ${avatar(e.qui)}
    <div style="min-width:0">
      <div class="evt-texte">${texteEvt(e)}</div>
      <div class="evt-heure">${relatif(e.t)}</div>
      ${mediaHTML(e.media)}
      <div class="reactions">${reac}</div>
    </div>
  </article>`;
}

/* ================= Tâches (ce que la partie attend de toi) ================= */

function taches() {
  const t = [];
  for (const a of S.accusations) if (a.cible === 'moi' && a.statut === 'ouverte') t.push({ type: 'accusation', a });
  for (const g of S.gages) {
    if (g.bourreau === 'moi' && g.statut === 'attente') t.push({ type: 'choisir', g });
    if (g.bourreau === 'moi' && g.statut === 'prouve') t.push({ type: 'juger', g });
    if (g.victime === 'moi' && g.statut === 'choisi') t.push({ type: 'faire', g });
    if (g.victime === 'moi' && g.statut === 'attente') t.push({ type: 'patience', g });
    if (g.victime === 'moi' && g.statut === 'prouve') t.push({ type: 'validation', g });
  }
  return t;
}

function tacheHTML(t) {
  if (t.type === 'accusation') {
    return `<div class="carte-tache"><span class="etiquette">ON T'ACCUSE</span>
      <p>${esc(nom(t.a.qui))} affirme que tu as craqué sur ${esc(HABITUDES[defi(t.a.defi).habit].nom.toLowerCase())}.</p>
      <button class="btn corail" data-a="repondre" data-id="${t.a.id}">Voir la preuve et répondre</button></div>`;
  }
  const g = t.g, v = nom(g.victime), b = nom(g.bourreau);
  switch (t.type) {
    case 'choisir': return `<div class="carte-tache"><span class="etiquette">LE SORT T'A DÉSIGNÉ</span>
      <p>Choisis le châtiment de ${esc(v)}.</p><span class="minuteur" data-ech="${g.echeance}">Il te reste ${resteTemps(g.echeance)}</span>
      <button class="btn soleil" data-a="choisir" data-id="${g.id}">Choisir le gage</button></div>`;
    case 'juger': return `<div class="carte-tache"><span class="etiquette">PREUVE À JUGER</span>
      <p>${esc(v)} dit avoir fait son gage : « ${esc(g.texte)} ».</p>
      <button class="btn soleil" data-a="juger" data-id="${g.id}">Juger la preuve</button></div>`;
    case 'faire': return `<div class="carte-tache"><span class="etiquette">TON CHÂTIMENT</span>
      <p>${esc(g.texte)}</p><span class="discret">Choisi par ${esc(b)}</span>
      <button class="btn corail" data-a="prouver" data-id="${g.id}">J'envoie ma preuve</button></div>`;
    case 'patience': return `<div class="carte-tache"><span class="etiquette">ÇA SE PRÉPARE…</span>
      <p>${esc(b)} réfléchit à ton châtiment.</p><span class="minuteur" data-ech="${g.echeance}">Il lui reste ${resteTemps(g.echeance)}</span></div>`;
    case 'validation': return `<div class="carte-tache"><span class="etiquette">EN ATTENTE</span>
      <p>${esc(b)} examine ta preuve.</p></div>`;
  }
  return '';
}

/* ================= Écrans ================= */

function carteBete(d, grande) {
  const h = HABITUDES[d.habit];
  const p = pv(d), r = p / PV_DEPART;
  const avant = PV_AFFICHE[d.id] != null ? PV_AFFICHE[d.id] / PV_DEPART : r;
  const sous = d.mort ? `Abattue au jour ${Math.floor((d.mort - d.debut) / J)}`
    : d.survit ? 'A survécu à l\'année' : `Jour ${jours(d)} / ${DUREE}`;
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
        ${grande && enJeu(d) ? `<span class="stat">Marge <b>${marge(d)}</b></span>` : ''}
      </div>
    </div>
  </div>`;
}

function vueFil() {
  const mes = mesDefis().filter(enJeu);
  const t = taches();
  let html = '';
  if (mes.length) {
    html += `<div class="titre-section">Ta bête</div><div class="pile">${mes.map(d => carteBete(d, false)).join('')}</div>`;
  }
  if (t.length) html += `<div class="titre-section">À faire</div><div class="pile">${t.map(tacheHTML).join('')}</div>`;
  html += `<div class="titre-section">Le fil · ${esc(S.partie.nom)}</div>`;
  html += S.fil.length ? `<div class="pile">${S.fil.map(evtHTML).join('')}</div>` : `<div class="vide">Rien pour l'instant.</div>`;
  return html;
}

function scoreJoueur(id) {
  const ds = S.defis.filter(d => d.qui === id);
  if (!ds.length) return 0;
  return ds.reduce((s, d) => s + (PV_DEPART - pv(d)) / PV_DEPART, 0) / ds.length;
}

function vuePartie() {
  const j = Math.max(0, Math.min(DUREE, Math.floor((maintenant() - S.partie.debut) / J)));
  const ids = Object.keys(S.membres).sort((a, b) => scoreJoueur(b) - scoreJoueur(a));
  const joueurs = ids.map((id, i) => {
    const ds = S.defis.filter(d => d.qui === id);
    const minis = ds.map(d => {
      const p = pv(d), r = p / PV_DEPART;
      return `<div class="mini-defi ${d.mort ? 'mort' : ''}">
        <span>${HABITUDES[d.habit].e} ${esc(d.nom)} ${d.mort ? '🪦' : `· <b>${p}</b> PV`}</span>
        <span class="serie">${d.mort ? 'ABATTUE' : '🔥 ' + serie(d) + ' j'}</span>
        ${enJeu(d) ? `<div class="barre ${r < 0.4 ? 'faible' : ''}"><i style="width:${(r * 100).toFixed(1)}%"></i></div>` : ''}
      </div>`;
    }).join('');
    const vivant = ds.find(enJeu);
    const pariEnCours = vivant && S.paris.some(p => p.defi === vivant.id && p.statut === 'en cours');
    const actions = id === 'moi' ? '' : `<div class="joueur-actions">
        ${vivant ? `<button class="btn petit corail" data-a="denoncer" data-id="${id}">Dénoncer</button>` : ''}
        ${vivant ? `<button class="btn petit fantome" data-a="parier" data-id="${vivant.id}" ${pariEnCours ? 'disabled' : ''}>${pariEnCours ? 'Pari en cours' : 'Parier'}</button>` : ''}
      </div>`;
    return `<div class="carte joueur">
      <div class="rang ${i === 0 ? 'or' : ''}">${i + 1}</div>${avatar(id)}
      <div class="joueur-nom">${esc(nom(id))}${id === 'moi' ? ' <span class="discret">(toi)</span>' : ''}</div>
      <div class="joueur-defis">${minis || '<span class="discret">Aucun défi</span>'}</div>${actions}
    </div>`;
  }).join('');
  const paris = S.paris.filter(p => p.statut === 'en cours');
  return `<div class="carte partie-tete">
      <div class="partie-nom">${esc(S.partie.nom)}</div>
      <div class="code">CODE ${S.partie.code}</div>
      <div class="compte-annee"><span class="discret">Jour <b>${j}</b> / ${DUREE}</span>
        <div class="barre"><i style="width:${(j / DUREE * 100).toFixed(1)}%"></i></div></div>
      <button class="btn fantome" data-a="inviter">Inviter quelqu'un</button>
    </div>
    <div class="titre-section">Classement</div>
    <div class="pile">${joueurs}</div>
    ${paris.length ? `<div class="titre-section">Tes paris</div><div class="pile">${paris.map(p => {
      const d = defi(p.defi);
      return `<div class="carte"><b>${p.mise} pts</b> sur ${esc(nom(d.qui))} · fin ${relatifFutur(p.fin)}</div>`;
    }).join('')}</div>` : ''}`;
}

function relatifFutur(t) {
  const d = t - maintenant();
  if (d <= 0) return 'maintenant';
  const n = Math.ceil(d / J);
  return 'dans ' + n + (n > 1 ? ' jours' : ' jour');
}

function vueBadges() {
  const n = Object.keys(S.badges).length;
  return `<div class="carte" style="display:flex;align-items:center;gap:14px">
      <div class="compteur-badges">${n}<span style="font-size:20px;color:var(--brume)">/${BADGES.length}</span></div>
      <div><b>Badges débloqués</b><div class="discret">Chaque badge rapporte 10 points.</div></div>
    </div>
    <div class="titre-section">Collection</div>
    <div class="grille-badges">${BADGES.map(b => {
      const ok = S.badges[b.id];
      const neuf = ok && maintenant() - ok < J;
      return `<div class="badge ${ok ? '' : 'verrou'} ${neuf ? 'neuf' : ''}" data-a="voirBadge" data-id="${b.id}">
        ${medaille(b)}<div class="badge-nom">${esc(b.nom)}</div><div class="badge-desc">${esc(b.desc)}</div></div>`;
    }).join('')}</div>`;
}

function vueMoi() {
  const m = moi();
  const mes = mesDefis();
  const actifs = mes.filter(enJeu).length;
  return `<div class="carte" style="display:flex;align-items:center;gap:14px">
      ${avatar('moi', 'grand')}
      <div style="min-width:0"><div class="partie-nom" style="font-size:22px">${esc(m.nom)}</div>
      <div class="discret">${m.points} points · ${Object.keys(S.badges).length} badges</div></div>
    </div>
    <div class="titre-section">Tes bêtes</div>
    <div class="pile">${mes.map(d => `${carteBete(d, true)}
      <details class="carte"><summary><b>Tes châtiments possibles</b> (${d.gages.length})</summary>
      <div class="liste-gages" style="margin-top:10px">${d.gages.map(g => `<div class="gage-ligne">${esc(g)}</div>`).join('')}</div></details>`).join('')}
      <button class="btn fantome large" data-a="ajouterDefi" ${actifs >= MAX_DEFIS ? 'disabled' : ''}>
        ${actifs >= MAX_DEFIS ? `${MAX_DEFIS} défis en cours, c'est le maximum` : `Ajouter un défi (${actifs}/${MAX_DEFIS})`}</button>
    </div>
    <div class="titre-section">Réglages</div>
    <div class="carte interrupteur"><span>Sons</span>
      <button class="btn petit ${S.son ? 'menthe' : 'fantome'}" data-a="son">${S.son ? 'Activés' : 'Coupés'}</button></div>
    <div class="titre-section">Mode démo</div>
    <div class="carte demo pile">
      <div class="discret">Sarah, Tom, Nadia et Max sont des amis fictifs pour tester le jeu seul. Avance le temps pour voir la bête perdre ses PV, les badges tomber et les amis craquer.</div>
      <div class="demo-boutons">
        <button class="btn petit soleil" data-a="avancer" data-n="1">+1 jour</button>
        <button class="btn petit soleil" data-a="avancer" data-n="7">+7 jours</button>
        <button class="btn petit soleil" data-a="avancer" data-n="30">+30 jours</button>
      </div>
      <button class="btn petit fantome" data-a="reinitialiser">Tout recommencer</button>
    </div>`;
}

/* ---------- Accueil et création ---------- */

function etapes(n) { return `<div class="etapes">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'fait' : ''}"></i>`).join('')}</div>`; }

function vueAccueil() {
  const o = S.onb;
  switch (o.etape) {
    case 0: return `<div class="plein accueil" style="position:relative;min-height:100%;background:transparent;padding:20px 0">
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
        <button class="btn corail large" data-a="onbSuivant">Commencer</button>
      </div>`;
    case 1: return `<div class="pile" style="gap:18px">${etapes(1)}
        <h2 class="partie-nom">Qui es-tu ?</h2>
        <div class="champ"><label for="pseudo">Ton pseudo</label>
          <input id="pseudo" maxlength="16" placeholder="Greg" value="${esc(o.pseudo)}" autocomplete="off"></div>
        <div class="champ"><label>Ta couleur</label><div class="couleurs">${COULEURS.map(c =>
          `<button class="couleur ${c === o.couleur ? 'choisie' : ''}" style="background:${c}" data-a="couleur" data-c="${c}" aria-label="Couleur"></button>`).join('')}</div></div>
        <button class="btn corail large" data-a="onbSuivant" id="suite1" ${o.pseudo.trim() ? '' : 'disabled'}>Suivant</button>
      </div>`;
    case 2: return `<div class="pile" style="gap:18px">${etapes(2)}
        <h2 class="partie-nom">Ta mauvaise habitude</h2>
        ${grilleHabitudes(o.habit, [])}
        ${o.habit === 'autre' ? `<div class="champ"><label for="nomAutre">Nomme ta bête</label>
          <input id="nomAutre" maxlength="24" placeholder="Le Grignotage" value="${esc(o.nomAutre)}"></div>` : ''}
        <button class="btn corail large" data-a="onbSuivant" ${o.habit && (o.habit !== 'autre' || o.nomAutre.trim()) ? '' : 'disabled'}>Suivant</button>
      </div>`;
    case 3: return `<div class="pile" style="gap:16px">${etapes(3)}
        <h2 class="partie-nom">Tes châtiments</h2>
        <p class="discret" style="margin:0">Si tu craques, celui qui est tiré au sort pourra piocher ici s'il n'a pas d'idée. Au moins 3.</p>
        ${editeurGages(o.gages)}
        <button class="btn corail large" data-a="onbSuivant" ${o.gages.length >= 3 ? '' : 'disabled'}>Suivant (${o.gages.length}/3)</button>
      </div>`;
    case 4: return `<div class="pile" style="gap:16px">${etapes(4)}
        <h2 class="partie-nom">Ta partie</h2>
        <div class="champ"><label for="nomPartie">Nom de la partie</label>
          <input id="nomPartie" maxlength="24" value="${esc(o.nomPartie)}"></div>
        <button class="btn fantome" data-a="inviter">Envoyer le lien d'invitation</button>
        <div class="titre-section" style="margin:6px 0 0">Ils ont rejoint</div>
        <div class="pile" id="rejoints">${BOTS.slice(0, o.rejoints).map(carteRejoint).join('')}</div>
        <div class="discret" id="attente" ${o.rejoints < BOTS.length ? '' : 'hidden'}>En attente des amis… (démo : 4 amis fictifs)</div>
        <button class="btn corail large" id="btnGo" data-a="go" style="font-family:var(--f-titre);font-size:26px;padding:18px" ${o.rejoints < 1 ? 'disabled' : ''}>GO</button>
      </div>`;
  }
  return '';
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
    <div class="ligne-champ champ"><input id="nouveauGage" maxlength="80" placeholder="Invente ton châtiment">
      <button class="btn soleil petit" data-a="ajouterGage">Ajouter</button></div>
    <div class="discret">Idées :</div>
    <div class="puces-choix">${restantes.slice(0, 8).map(s => `<button class="puce-choix" data-a="suggestion" data-t="${esc(s)}">+ ${esc(s)}</button>`).join('')}</div>`;
}

/* ================= Rendu ================= */

function render(anim = false) {
  const vue = $('#vue');
  const pret = S.pret;
  $('#entete').hidden = !pret;
  $('#nav').hidden = !pret;
  if (!pret) {
    vue.innerHTML = vueAccueil();
    vue.className = anim ? 'vue-entree' : '';
    if (S.onb.etape === 4) faireRejoindre();
    sauver();
    return;
  }
  const j = Math.floor((maintenant() - S.partie.debut) / J);
  $('#puce-jour').textContent = 'J+' + Math.max(0, j);
  $('#puce-points').textContent = moi().points + ' pts';
  document.querySelectorAll('.onglet').forEach(b => b.classList.toggle('actif', b.dataset.onglet === S.onglet));
  const scroll = vue.scrollTop;
  vue.innerHTML = { fil: vueFil, partie: vuePartie, badges: vueBadges, moi: vueMoi }[S.onglet]();
  vue.className = anim ? 'vue-entree' : '';
  vue.scrollTop = anim ? 0 : scroll;
  animerPV();
  sauver();
}

/** Anime les barres de vie et fait sauter les dégâts au-dessus de la bête. */
function animerPV() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.barre > i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%'; });
  }));
  for (const d of S.defis) {
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
  if (S.onglet === o) { $('#vue').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  S.onglet = o;
  son('tic');
  render(true);
}

/* ================= Badges et points ================= */

const fileBadges = [];
let affichageBadges = false;

function gagnerPoints(n) {
  moi().points = Math.max(0, moi().points + n);
  const p = $('#puce-points');
  if (p) { p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
}

function verifierBadges() {
  const mes = mesDefis();
  const serieMax = mes.reduce((m, d) => Math.max(m, enJeu(d) ? serie(d) : 0), 0);
  const conds = {
    go: mes.length > 0,
    j1: serieMax >= 1, j7: serieMax >= 7, j30: serieMax >= 30, j100: serieMax >= 100,
    j182: mes.some(d => jours(d) >= 182),
    rip: mes.some(d => d.mort),
    honnete: S.stats.aveux > 0, dette: S.stats.dettes > 0, bourreau: S.stats.bourreau > 0,
    juge: S.stats.juge > 0, balance: S.stats.balance > 0,
    phenix: mes.some(d => enJeu(d) && d.rechutes.length > 0 && serie(d) >= 7),
    flair: S.stats.paris > 0, supporter: S.stats.reacs >= 10,
    multi: mes.filter(enJeu).length >= 3, innocent: S.stats.innocent > 0,
    riche: moi().points >= 500
  };
  for (const b of BADGES) {
    if (S.badges[b.id] || !conds[b.id]) continue;
    S.badges[b.id] = maintenant();
    gagnerPoints(10);
    evt('badge', { qui: 'moi', badge: b.id });
    fileBadges.push(b);
  }
  montrerBadges();
}

async function montrerBadges() {
  if (affichageBadges || enSimulation) return;
  affichageBadges = true;
  while (fileBadges.length) {
    const b = fileBadges.shift();
    await new Promise(fin => {
      const el = ouvrir(`<div class="sur-titre">BADGE DÉBLOQUÉ</div>
        <div class="badge-geant">${medaille(b)}</div>
        <h2>${esc(b.nom)}</h2><p>${esc(b.desc)}</p><p style="color:var(--soleil);font-weight:900">+10 points</p>
        <button class="btn soleil" data-a="fermerCalque">Trop bien</button>`, { plein: true, onClose: fin });
      el.dataset.badge = b.id;
      son('badge'); vibrer('30,40,30,40,120'); confettis(120);
    });
  }
  affichageBadges = false;
  render();
}

/* ================= Le jeu ================= */

function creerDefi(qui, habit, nomBete, gages) {
  const d = { id: uid(), qui, habit, nom: nomBete || HABITUDES[habit].bete, gages: gages.slice(), debut: maintenant(), rechutes: [], mort: null, survit: false, paliers: {} };
  S.defis.push(d);
  return d;
}

async function lancerGO() {
  const o = S.onb;
  const nomPartie = (o.nomPartie || '').trim() || 'Les Potos';
  S.membres = { moi: { id: 'moi', nom: o.pseudo.trim(), couleur: o.couleur, points: 100, bot: false } };
  BOTS.slice(0, o.rejoints).forEach(b => { S.membres[b.id] = { id: b.id, nom: b.nom, couleur: b.couleur, bot: true }; });
  S.partie = { nom: nomPartie, code: o.code || codeInvitation(), debut: maintenant() };
  BOTS.slice(0, o.rejoints).forEach(b => creerDefi(b.id, b.habit, null, b.gages));
  const d = creerDefi('moi', o.habit, o.habit === 'autre' ? o.nomAutre.trim() : null, o.gages);
  await compteARebours();
  S.pret = true;
  S.onglet = 'fil';
  S.defis.filter(x => x.qui !== 'moi').forEach(x => { const e = evt('go', { qui: x.qui, defi: x.id }); e.t -= 60000; });
  const e = evt('go', { qui: 'moi', defi: d.id });
  reactionsDesAmis(e, ['respect', 'force']);
  render(true);
  annonceEnvoyee(`${moi().nom} lance sa partie contre ${d.nom}`, 'Un an pour l\'abattre. Vous serez prévenus à chaque rechute.');
  setTimeout(verifierBadges, 2600);
}

function codeInvitation() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'BH-' + Array.from({ length: 4 }, () => hasard(a.split(''))).join('');
}

/** Ce que tes amis reçoivent quand tu agis : on te montre la notification envoyée. */
function annonceEnvoyee(titre, corps) {
  const n = Object.keys(S.membres).length - 1;
  banniere(titre, corps);
  setTimeout(() => banniere(`Notification envoyée à ${n} ${n > 1 ? 'amis' : 'ami'}`, 'Ils viennent de la recevoir sur leur téléphone.'), 1300);
}

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
  await attendre(1100);
  fermerEl(el);
}

/** Roue du tirage au sort parmi les membres (sauf la victime). */
async function tirage(victime, titre) {
  const cands = Object.keys(S.membres).filter(id => id !== victime);
  const elu = hasard(cands);
  if (enSimulation) return elu;
  const n = cands.length, R = 38;
  const avs = cands.map((id, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const x = 50 + R * Math.cos(a), y = 50 + R * Math.sin(a);
    return avatar(id, '', `style="left:calc(${x}% - 31px);top:calc(${y}% - 31px)"`);
  }).join('');
  const el = ouvrir(`<div class="sur-titre">TIRAGE AU SORT</div><h2>${esc(titre)}</h2>
    <div class="roue">${avs}<div class="roue-centre" id="rc">?</div></div>
    <p id="tt">Qui va choisir le châtiment ?</p>`, { plein: true, fermable: false });
  const els = [...el.querySelectorAll('.roue .avatar')];
  const fin = cands.indexOf(elu);
  const tours = 3 * n + fin;
  let delai = 55;
  for (let k = 0; k <= tours; k++) {
    els.forEach(e => e.classList.remove('vise'));
    els[k % n].classList.add('vise');
    son('tic'); vibrer('12');
    await attendre(delai);
    delai = k > tours - 6 ? delai * 1.5 : delai * 1.05;
  }
  els[fin].classList.add('elu');
  $('#rc', el).textContent = elu === 'moi' ? 'TOI' : nom(elu).toUpperCase();
  $('#tt', el).innerHTML = elu === 'moi' ? '<b>C\'est toi qui choisis !</b>' : `<b>${esc(nom(elu))}</b> choisit le châtiment.`;
  son('badge'); vibrer('80,60,200');
  await attendre(1900);
  fermerEl(el);
  return elu;
}

/** Une rechute est comptée : PV rendus à la bête, paris perdus, tirage du bourreau. */
async function rechute(d, { media, apres, accusationMedia } = {}) {
  d.rechutes.push(maintenant());
  const e = evt('aveu', { qui: d.qui, defi: d.id, media: media || accusationMedia || null, apres: apres || null });
  if (d.qui === 'moi') reactionsDesAmis(e, ['honte', 'mdr', 'force']);
  for (const p of S.paris) {
    if (p.defi === d.id && p.statut === 'en cours') {
      p.statut = 'perdu';
      evt('pari-perdu', { qui: d.qui, defi: d.id, mise: p.mise });
    }
  }
  const titre = d.qui === 'moi' ? 'Ton châtiment' : `Châtiment de ${nom(d.qui)}`;
  const bourreau = await tirage(d.qui, titre);
  const g = { id: uid(), defi: d.id, victime: d.qui, bourreau, texte: null, statut: 'attente', echeance: maintenant() + DELAI_GAGE, preuve: null };
  S.gages.push(g);
  evt('tirage', { qui: d.qui, defi: d.id, bourreau, gage: g.id });
  if (bourreau === 'moi') {
    notifier('Le sort t\'a désigné', `Tu as 12 h pour choisir le châtiment de ${nom(d.qui)}.`);
    if (!enSimulation) { render(); feuilleChoisir(g); }
  } else if (enSimulation) {
    botChoisit(g);
  } else {
    render();
    setTimeout(() => { botChoisit(g); render(); }, 4500 + Math.random() * 2500);
  }
  return g;
}

function botChoisit(g) {
  if (g.statut !== 'attente') return;
  const d = defi(g.defi);
  g.texte = Math.random() < 0.6 ? hasard(d.gages) : hasard(GAGES_INVENTES);
  g.statut = 'choisi';
  evt('gage', { qui: g.victime, defi: g.defi, bourreau: g.bourreau, gage: g.id });
  if (g.victime === 'moi') notifier(`${nom(g.bourreau)} a choisi ton châtiment`, g.texte);
  else if (!enSimulation) setTimeout(() => { botProuve(g); render(); }, 7000 + Math.random() * 4000);
}

function botProuve(g) {
  if (g.statut !== 'choisi') return;
  const v = S.membres[g.victime];
  g.preuve = imageFictive(g.texte, v.couleur, '😤', 'PREUVE');
  g.statut = 'prouve';
  evt('preuve', { qui: g.victime, defi: g.defi, gage: g.id, media: g.preuve });
  if (g.bourreau === 'moi') notifier(`${v.nom} a envoyé sa preuve`, 'À toi de juger si le gage est fait.');
  else validerGage(g, true);
}

function validerGage(g, ok) {
  if (g.statut !== 'prouve') return;
  if (ok) {
    g.statut = 'valide';
    evt('valide', { qui: g.victime, defi: g.defi, bourreau: g.bourreau, gage: g.id });
    if (g.victime === 'moi') { S.stats.dettes++; gagnerPoints(20); notifier(`${nom(g.bourreau)} valide ta preuve`, 'Dette payée. +20 points.'); }
  } else {
    g.statut = 'choisi';
    evt('refuse', { qui: g.victime, defi: g.defi, bourreau: g.bourreau, gage: g.id });
    if (g.victime === 'moi') notifier(`${nom(g.bourreau)} refuse ta preuve`, 'Pas convaincant. Refais ton gage.');
    else if (!enSimulation) setTimeout(() => { botProuve(g); render(); }, 8000);
  }
}

/* ---------- Simulation du temps (mode démo) ---------- */

async function avancer(n) {
  enSimulation = true;
  notifsSim = [];
  for (let i = 0; i < n; i++) {
    S.decalage += J;
    for (const d of S.defis.filter(x => x.qui !== 'moi' && enJeu(x))) {
      if (Math.random() < 0.03) await rechute(d);
    }
    const mien = mesDefis().find(enJeu);
    if (mien && Math.random() < 0.015 && !S.accusations.some(a => a.statut === 'ouverte')) botAccuse(mien);
    for (const g of S.gages) {
      if (g.statut === 'attente' && g.bourreau !== 'moi') botChoisit(g);
      else if (g.statut === 'attente' && g.bourreau === 'moi' && g.echeance < maintenant()) {
        g.texte = hasard(defi(g.defi).gages);
        g.statut = 'choisi';
        evt('delai', { qui: g.victime, defi: g.defi, bourreau: 'moi', gage: g.id });
      } else if (g.statut === 'choisi' && g.victime !== 'moi' && Math.random() < 0.7) botProuve(g);
      else if (g.statut === 'prouve' && g.victime === 'moi') validerGage(g, true);
    }
    for (const p of S.paris) {
      if (p.statut === 'en cours' && p.fin <= maintenant()) {
        p.statut = 'gagne';
        const gain = p.mise * 2;
        gagnerPoints(gain);
        S.stats.paris++;
        evt('pari-gagne', { qui: defi(p.defi).qui, defi: p.defi, gain });
      }
    }
    for (const d of S.defis) {
      if (!enJeu(d)) continue;
      if (d.qui === 'moi' && serie(d) > 0) gagnerPoints(2);
      if (pv(d) <= 0) {
        d.mort = maintenant();
        evt('mort', { qui: d.qui, defi: d.id, n: jours(d) });
        if (d.qui === 'moi') { gagnerPoints(100); fileCelebration.push(d); }
        else notifier(`${nom(d.qui)} a abattu ${d.nom}`, 'Sa bête est morte. Respect.');
      } else if (jours(d) >= DUREE) {
        d.survit = true;
        evt('survit', { qui: d.qui, defi: d.id });
      } else if (d.qui !== 'moi') {
        const s = serie(d);
        for (const p of [30, 100, 200]) {
          if (s >= p && !d.paliers[p]) { d.paliers[p] = 1; evt('palier', { qui: d.qui, defi: d.id, n: p }); }
        }
      }
    }
  }
  enSimulation = false;
  const notifs = notifsSim;
  notifsSim = [];
  render();
  notifs.slice(0, 3).forEach(([t, c], i) => setTimeout(() => notifier(t, c), i * 900));
  if (notifs.length > 3) setTimeout(() => banniere(`Et ${notifs.length - 3} autres notifications`, 'Regarde le fil.'), 2900);
  verifierBadges();
  celebrer();
}

const fileCelebration = [];
async function celebrer() {
  while (fileCelebration.length) {
    const d = fileCelebration.shift();
    await new Promise(fin => {
      ouvrir(`<div class="sur-titre">VICTOIRE</div>${beteSVG(d).replace('class="bete-svg"', 'class="bete-svg" style="width:200px;height:200px"')}
        <h2>${esc(d.nom)} est morte</h2><p>Tu l'as abattue en ${Math.floor((d.mort - d.debut) / J)} jours. Toute la partie est prévenue.</p>
        <p style="color:var(--soleil);font-weight:900">+100 points</p>
        <button class="btn soleil" data-a="fermerCalque">Repose en paix</button>`, { plein: true, onClose: fin });
      son('go'); vibrer('100,60,100,60,400'); confettis(220);
    });
  }
}

function botAccuse(d) {
  const accusateur = hasard(Object.keys(S.membres).filter(id => id !== 'moi'));
  const media = imageFictive('Je t\'ai vu…', S.membres[accusateur].couleur, HABITUDES[d.habit].e, 'PRIS !');
  const a = { id: uid(), qui: accusateur, cible: 'moi', defi: d.id, media, statut: 'ouverte' };
  S.accusations.push(a);
  evt('accuse', { qui: accusateur, cible: 'moi', defi: d.id, media });
  notifier(`${nom(accusateur)} t'accuse`, 'Preuve à l\'appui. Avoue ou conteste.');
}

/** Vote des autres membres quand une accusation est contestée. */
async function vote(accuse, accusateur) {
  const votants = Object.keys(S.membres).filter(id => id !== accuse);
  const votes = votants.map(id => id === accusateur || id === 'moi' ? true : Math.random() < 0.55);
  const coupable = votes.filter(Boolean).length > votants.length / 2;
  if (enSimulation) return coupable;
  const el = ouvrir(`<div class="sur-titre">VOTE DE LA PARTIE</div><h2>${esc(nom(accuse))} a-t-il craqué ?</h2>
    <div class="pile" style="width:100%;max-width:320px">${votants.map((id, i) => `<div class="carte" style="display:flex;align-items:center;gap:10px">
      ${avatar(id)}<b style="flex:1;text-align:left">${esc(nom(id))}</b><span class="vote" data-i="${i}" style="font-family:var(--f-titre)">…</span></div>`).join('')}</div>
    <p id="verdict"> </p>`, { plein: true, fermable: false });
  for (let i = 0; i < votants.length; i++) {
    await attendre(700);
    const v = el.querySelector(`.vote[data-i="${i}"]`);
    v.textContent = votes[i] ? 'COUPABLE' : 'INNOCENT';
    v.style.color = votes[i] ? 'var(--corail)' : 'var(--menthe)';
    son('tic'); vibrer('20');
  }
  await attendre(600);
  $('#verdict', el).innerHTML = `<span class="tampon" style="display:inline-block;font-size:34px;${coupable ? '' : 'color:var(--menthe);border-color:var(--menthe)'}">${coupable ? 'COUPABLE' : 'INNOCENT'}</span>`;
  son(coupable ? 'honte' : 'badge'); vibrer('80,60,200');
  await attendre(2000);
  fermerEl(el);
  return coupable;
}

/* ================= Feuilles d'action ================= */

function zoneDepot(id, texte) {
  return `<label class="depot" for="${id}"><span class="e">📸</span>${esc(texte)}<span class="discret" style="font-weight:700">Photo ou vidéo de 15 s maximum</span></label>
    <input type="file" id="${id}" accept="image/*,video/*" hidden>
    <div class="apercu-preuve" id="${id}-apercu" hidden></div>`;
}

function brancherDepot(el, id, quandPret) {
  const input = $('#' + id, el);
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const m = await traiterFichier(f);
    if (!m) { banniere('Fichier illisible', 'Essaie une autre photo ou vidéo.'); return; }
    const ap = $('#' + id + '-apercu', el);
    ap.hidden = false;
    ap.innerHTML = m.video && MEDIAS[m.id]
      ? `<video src="${MEDIAS[m.id]}" controls playsinline autoplay muted loop></video>`
      : `<img src="${m.src}" alt="Aperçu">`;
    el.querySelector('label.depot').innerHTML = '<span class="e">🔁</span>Changer';
    quandPret(m);
  });
}

function feuilleCraque() {
  const vivants = mesDefis().filter(enJeu);
  if (!vivants.length) {
    ouvrir(`<h2>Rien à avouer</h2><p class="discret">Tu n'as aucun défi en cours. Lance-en un depuis l'onglet Moi.</p>
      <button class="btn large" data-a="fermerCalque">OK</button>`);
    return;
  }
  let choix = vivants[0].id, media = null;
  const el = ouvrir(`<h2>Tu as craqué ?</h2>
    <p class="discret" style="margin:0">Balance-toi. Toute la partie sera prévenue et le sort désignera ton bourreau.</p>
    ${vivants.length > 1 ? `<div class="puces-choix" id="choixDefi">${vivants.map(d => `<button class="puce-choix" data-d="${d.id}">${HABITUDES[d.habit].e} ${esc(d.nom)}</button>`).join('')}</div>` : ''}
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
    S.stats.aveux++;
    annonceEnvoyee(`${moi().nom} a craqué ${HABITUDES[d.habit].e}`, `${d.nom} reprend des forces. Regarde la preuve.`);
    await attendre(600);
    await rechute(d, { media });
    render();
    verifierBadges();
  });
}

async function scenesHonte(d) {
  const flash = document.createElement('div');
  flash.className = 'flash-rouge';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
  son('honte'); vibrer('300,100,300');
  const avant = beteSVG(d);
  const el = ouvrir(`<div class="tampon">HONTE</div>
    <div class="bete-carte grande" style="background:transparent;border:0">${avant}</div>
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

function feuilleChoisir(g) {
  const d = defi(g.defi);
  let texte = null;
  const el = ouvrir(`<h2>Châtiment de ${esc(nom(g.victime))}</h2>
    <span class="minuteur">Il te reste ${resteTemps(g.echeance)}. Après, le hasard choisira dans sa liste.</span>
    <div class="discret">Sa liste :</div>
    <div class="liste-gages">${d.gages.map(t => `<button class="gage-ligne" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="champ"><label for="gageInvente">Ou invente le tien</label><input id="gageInvente" maxlength="80" placeholder="Ex : chanter du Céline Dion au bureau"></div>
    <button class="btn soleil large" id="validerChoix" disabled>Infliger ce châtiment</button>`);
  const maj = () => {
    el.querySelectorAll('.gage-ligne').forEach(b => b.classList.toggle('choisi', b.dataset.t === texte));
    $('#validerChoix', el).disabled = !texte;
  };
  el.querySelectorAll('.gage-ligne').forEach(b => b.addEventListener('click', () => { texte = b.dataset.t; $('#gageInvente', el).value = ''; son('tic'); maj(); }));
  $('#gageInvente', el).addEventListener('input', e => { texte = e.target.value.trim() || null; maj(); });
  $('#validerChoix', el).addEventListener('click', () => {
    if (g.statut !== 'attente') { fermerEl(el); return; }
    g.texte = texte; g.statut = 'choisi';
    S.stats.bourreau++;
    const e = evt('gage', { qui: g.victime, defi: g.defi, bourreau: 'moi', gage: g.id });
    reactionsDesAmis(e, ['mdr', 'respect']);
    fermerEl(el);
    annonceEnvoyee(`${moi().nom} a choisi le châtiment de ${nom(g.victime)}`, texte);
    son('badge'); vibrer('40,40,120');
    render();
    verifierBadges();
    setTimeout(() => { botProuve(g); render(); }, 6000 + Math.random() * 3000);
  });
}

function feuilleProuver(g) {
  let media = null;
  const el = ouvrir(`<h2>Prouve-le</h2><div class="evt-gage">${esc(g.texte)}</div>
    ${zoneDepot('preuveGage', 'Montre que tu l\'as fait')}
    <button class="btn corail large" id="envoyerPreuve" disabled>Envoyer à ${esc(nom(g.bourreau))}</button>`);
  brancherDepot(el, 'preuveGage', m => { media = m; $('#envoyerPreuve', el).disabled = false; });
  $('#envoyerPreuve', el).addEventListener('click', () => {
    g.preuve = media; g.statut = 'prouve';
    const e = evt('preuve', { qui: 'moi', defi: g.defi, gage: g.id, media });
    reactionsDesAmis(e, ['respect', 'mdr']);
    fermerEl(el);
    annonceEnvoyee('Preuve envoyée', `${nom(g.bourreau)} va juger si ton gage est fait.`);
    render();
    setTimeout(() => { validerGage(g, Math.random() < 0.88); render(); verifierBadges(); }, 4500 + Math.random() * 2000);
  });
}

function feuilleJuger(g) {
  const el = ouvrir(`<h2>Gage de ${esc(nom(g.victime))}</h2><div class="evt-gage">${esc(g.texte)}</div>
    ${mediaHTML(g.preuve)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn fantome" id="refuser">À refaire</button>
      <button class="btn menthe" id="valider">Validé</button></div>`);
  const fin = ok => {
    S.stats.juge++;
    validerGage(g, ok);
    fermerEl(el);
    annonceEnvoyee(ok ? 'Preuve validée' : 'Preuve refusée', ok ? `${nom(g.victime)} a payé sa dette.` : `${nom(g.victime)} doit refaire son gage.`);
    if (ok) { son('badge'); confettis(70); }
    render();
    verifierBadges();
  };
  $('#valider', el).addEventListener('click', () => fin(true));
  $('#refuser', el).addEventListener('click', () => fin(false));
}

function feuilleRepondre(a) {
  const d = defi(a.defi);
  const el = ouvrir(`<h2>${esc(nom(a.qui))} t'accuse</h2>
    <p class="discret" style="margin:0">D'après ${esc(nom(a.qui))}, tu as craqué sur ${esc(HABITUDES[d.habit].nom.toLowerCase())}.</p>
    ${mediaHTML(a.media)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn corail" id="avouer">J'avoue</button>
      <button class="btn fantome" id="contester">Je conteste</button></div>`);
  $('#avouer', el).addEventListener('click', async () => {
    a.statut = 'avoue';
    fermerEl(el);
    await scenesHonte(d);
    await rechute(d, { apres: a.qui, accusationMedia: a.media });
    render(); verifierBadges();
  });
  $('#contester', el).addEventListener('click', async () => {
    fermerEl(el);
    evt('conteste', { qui: 'moi', defi: d.id });
    render();
    const coupable = await vote('moi', a.qui);
    a.statut = coupable ? 'coupable' : 'innocent';
    if (coupable) {
      evt('coupable', { qui: 'moi', defi: d.id });
      await scenesHonte(d);
      await rechute(d, { apres: a.qui, accusationMedia: a.media });
    } else {
      S.stats.innocent++;
      evt('innocent', { qui: 'moi', defi: d.id });
    }
    render(); verifierBadges();
  });
}

function feuilleDenoncer(id) {
  const d = S.defis.find(x => x.qui === id && enJeu(x));
  if (!d) return;
  let media = null;
  const el = ouvrir(`<h2>Dénoncer ${esc(nom(id))}</h2>
    <p class="discret" style="margin:0">Tu l'as vu craquer sur ${esc(HABITUDES[d.habit].nom.toLowerCase())} ? Il faut une preuve. ${esc(nom(id))} pourra avouer ou contester devant la partie.</p>
    ${zoneDepot('preuveDenonce', 'Ta preuve')}
    <button class="btn corail large" id="envoyerDenonce" disabled>Balancer ${esc(nom(id))}</button>`);
  brancherDepot(el, 'preuveDenonce', m => { media = m; $('#envoyerDenonce', el).disabled = false; });
  $('#envoyerDenonce', el).addEventListener('click', async () => {
    fermerEl(el);
    const a = { id: uid(), qui: 'moi', cible: id, defi: d.id, media, statut: 'ouverte' };
    S.accusations.push(a);
    evt('accuse', { qui: 'moi', cible: id, defi: d.id, media });
    annonceEnvoyee(`${moi().nom} accuse ${nom(id)}`, 'Preuve envoyée à toute la partie.');
    S.onglet = 'fil';
    render(true);
    await attendre(3500);
    if (Math.random() < 0.7) {
      a.statut = 'avoue';
      S.stats.balance++;
      notifier(`${nom(id)} avoue`, `Bien vu. ${d.nom} reprend ${PV_RECHUTE} PV.`);
      await attendre(800);
      await rechute(d, { apres: 'moi', accusationMedia: media });
    } else {
      notifier(`${nom(id)} conteste`, 'La partie va voter.');
      evt('conteste', { qui: id, defi: d.id });
      render();
      await attendre(900);
      const coupable = await vote(id, 'moi');
      a.statut = coupable ? 'coupable' : 'innocent';
      if (coupable) {
        S.stats.balance++;
        evt('coupable', { qui: id, defi: d.id });
        await rechute(d, { apres: 'moi', accusationMedia: media });
      } else {
        evt('innocent', { qui: id, defi: d.id });
      }
    }
    render(); verifierBadges();
  });
}

function feuillePari(defiId) {
  const d = defi(defiId);
  const pts = moi().points;
  const el = ouvrir(`<h2>Parier sur ${esc(nom(d.qui))}</h2>
    <p class="discret" style="margin:0">${esc(nom(d.qui))} tient encore 7 jours contre ${esc(d.nom)} ? Si oui, tu doubles ta mise. Points virtuels uniquement.</p>
    <div class="demo-boutons">${[10, 25, 50].map(m => `<button class="btn soleil" data-m="${m}" ${m > pts ? 'disabled' : ''}>${m} pts</button>`).join('')}</div>
    <div class="discret">Tu as ${pts} points.</div>`);
  el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
    const mise = Number(b.dataset.m);
    gagnerPoints(-mise);
    S.paris.push({ id: uid(), defi: d.id, mise, fin: maintenant() + 7 * J, statut: 'en cours' });
    evt('pari', { qui: d.qui, defi: d.id, mise });
    fermerEl(el);
    son('pop'); vibrer('30');
    banniere('Pari enregistré', `${mise} pts sur ${nom(d.qui)}. Réponse dans 7 jours.`);
    render();
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
    zone.querySelectorAll('.habitude').forEach(b => b.addEventListener('click', () => { a.habit = b.dataset.k; son('tic'); etape1(); }));
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
      const d = creerDefi('moi', a.habit, a.habit === 'autre' ? a.nomAutre.trim() : null, a.gages);
      await compteARebours();
      const e = evt('go', { qui: 'moi', defi: d.id });
      reactionsDesAmis(e, ['respect', 'force']);
      S.onglet = 'fil';
      render(true);
      annonceEnvoyee(`${moi().nom} lance un nouveau défi contre ${d.nom}`, 'Un an pour l\'abattre.');
      setTimeout(verifierBadges, 2600);
    });
  };
  etape1();
}

/* ================= Actions (clics) ================= */

const ACTIONS = {
  onbSuivant() {
    const o = S.onb;
    if (o.etape === 2 && o.habit !== 'autre') o.nomAutre = '';
    if (o.etape === 3 && !o.code) o.code = codeInvitation();
    o.etape++;
    son('tic');
    render(true);
  },
  couleur(ds) { S.onb.couleur = ds.c; son('tic'); render(); },
  habit(ds) {
    if (S.pret) return; // l'ajout de défi gère ses propres clics
    S.onb.habit = ds.k; son('tic'); render();
    if (ds.k === 'autre') { const i = $('#nomAutre'); if (i) i.focus(); }
  },
  suggestion(ds) { if (S.pret) return; S.onb.gages.push(ds.t); son('pop'); render(); },
  retirerGage(ds) { if (S.pret) return; S.onb.gages.splice(Number(ds.i), 1); render(); },
  ajouterGage() {
    if (S.pret) return;
    const i = $('#nouveauGage');
    const v = i && i.value.trim();
    if (v) { S.onb.gages.push(v); son('pop'); render(); }
  },
  inviter() {
    const code = S.partie ? S.partie.code : (S.onb.code || (S.onb.code = codeInvitation()));
    const nomP = S.partie ? S.partie.nom : S.onb.nomPartie;
    const texte = `Rejoins ma partie « ${nomP} » sur Bad Habits Can Die. On a un an pour tuer nos mauvaises habitudes. Code : ${code}`;
    try {
      if (window.Android) { window.Android.partager(texte); return; }
      if (navigator.share) { navigator.share({ text: texte }).catch(() => {}); return; }
    } catch (e) { /* rien */ }
    banniere('Code d\'invitation', code);
  },
  go() { son('tic'); lancerGO(); },
  reagir(ds, el) {
    const e = S.fil.find(x => x.id === ds.evt);
    if (!e) return;
    const k = ds.k;
    if (e.mes[k]) { e.mes[k] = false; e.reac[k] = Math.max(0, e.reac[k] - 1); }
    else {
      e.mes[k] = true; e.reac[k]++; S.stats.reacs++;
      const r = el.getBoundingClientRect();
      const em = REACTIONS.find(x => x[0] === k)[1];
      for (let i = 0; i < 5; i++) {
        const f = document.createElement('div');
        f.className = 'envol'; f.textContent = em;
        f.style.left = (r.left + r.width / 2 - 13) + 'px'; f.style.top = (r.top - 10) + 'px';
        f.style.setProperty('--dx', ((Math.random() - 0.5) * 60) + 'px');
        f.style.animationDelay = (i * 0.06) + 's';
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 1400);
      }
      son('pop'); vibrer('15');
    }
    render();
    if (S.stats.reacs >= 10) verifierBadges();
  },
  choisir(ds) { const g = S.gages.find(x => x.id === ds.id); if (g) feuilleChoisir(g); },
  juger(ds) { const g = S.gages.find(x => x.id === ds.id); if (g) feuilleJuger(g); },
  prouver(ds) { const g = S.gages.find(x => x.id === ds.id); if (g) feuilleProuver(g); },
  repondre(ds) { const a = S.accusations.find(x => x.id === ds.id); if (a) feuilleRepondre(a); },
  denoncer(ds) { feuilleDenoncer(ds.id); },
  parier(ds) { feuillePari(ds.id); },
  ajouterDefi() { feuilleAjouterDefi(); },
  son() { S.son = !S.son; render(); son('pop'); },
  avancer(ds, el) {
    el.disabled = true;
    avancer(Number(ds.n)).finally(() => { el.disabled = false; });
  },
  reinitialiser() {
    const el = ouvrir(`<h2>Tout recommencer ?</h2><p class="discret" style="margin:0">La partie, les bêtes, les badges et les points de ce téléphone seront effacés.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="btn fantome" data-a="fermerCalque">Annuler</button>
        <button class="btn corail" id="effacer">Effacer</button></div>`);
    $('#effacer', el).addEventListener('click', () => {
      try { localStorage.removeItem(CLE); } catch (e) { /* rien */ }
      S = etatNeuf();
      for (const k in PV_AFFICHE) delete PV_AFFICHE[k];
      fermerEl(el);
      render(true);
    });
  },
  voirBadge(ds) {
    const b = BADGES.find(x => x.id === ds.id);
    const ok = S.badges[b.id];
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
  if (S.pret) return;
  const t = e.target;
  if (t.id === 'pseudo') { S.onb.pseudo = t.value; const s = $('#suite1'); if (s) s.disabled = !t.value.trim(); sauver(); }
  if (t.id === 'nomAutre') {
    S.onb.nomAutre = t.value; sauver();
    const s = document.querySelector('[data-a="onbSuivant"]'); if (s) s.disabled = !t.value.trim();
  }
  if (t.id === 'nomPartie') { S.onb.nomPartie = t.value; sauver(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'nouveauGage' && !S.pret) ACTIONS.ajouterGage();
});

/** Étape 4 de la démo : les amis fictifs rejoignent un par un. */
let rejointEnCours = false;
function faireRejoindre() {
  if (rejointEnCours || S.onb.rejoints >= BOTS.length) return;
  rejointEnCours = true;
  setTimeout(() => {
    rejointEnCours = false;
    if (S.pret || S.onb.etape !== 4) return;
    S.onb.rejoints++;
    const b = BOTS[S.onb.rejoints - 1];
    banniere(`${b.nom} a rejoint ta partie`, `Et joue contre ${HABITUDES[b.habit].bete}.`);
    son('pop'); vibrer('25');
    const liste = $('#rejoints');
    if (liste) liste.insertAdjacentHTML('beforeend', carteRejoint(b).replace('joueur simple', 'joueur simple arrive'));
    const go = $('#btnGo'); if (go) go.disabled = false;
    const att = $('#attente'); if (att) att.hidden = S.onb.rejoints >= BOTS.length;
    sauver();
    faireRejoindre();
  }, 1300 + Math.random() * 900);
}

function carteRejoint(b) {
  return `<div class="carte joueur simple">
    <div class="avatar" style="background:${b.couleur}">${b.nom[0]}</div>
    <div><b>${b.nom}</b><div class="discret">joue contre ${HABITUDES[b.habit].bete} ${HABITUDES[b.habit].e}</div></div></div>`;
}

// Minuteurs qui défilent
setInterval(() => {
  document.querySelectorAll('[data-ech]').forEach(m => {
    const avant = m.textContent.startsWith('Il lui') ? 'Il lui reste ' : 'Il te reste ';
    m.textContent = avant + resteTemps(Number(m.dataset.ech));
  });
}, 20000);

render(true);
