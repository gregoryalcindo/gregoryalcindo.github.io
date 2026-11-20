'use strict';
/* Page de test : abonne le téléphone aux notifications du serveur Apps Script et en demande une. */

const SERVEUR = window.BHCD_SERVEUR;
const CLE_LOCALE = 'bhcd-appareil';
const $ = s => document.querySelector(s);

function journal(m) { $('#journal').textContent = new Date().toLocaleTimeString() + '  ' + m + '\n' + $('#journal').textContent; }
function etat(texte, ok) {
  const e = $('#etat');
  e.textContent = texte;
  e.classList.toggle('etat-ok', ok === true);
  e.classList.toggle('etat-ko', ok === false);
}

function deB64u(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function appel(params, post) {
  const r = post
    ? await fetch(SERVEUR, { method: 'POST', body: JSON.stringify(params) })
    : await fetch(SERVEUR + '?' + new URLSearchParams(params));
  const d = await r.json();
  if (d.erreur) throw new Error(d.erreur);
  return d;
}

function appareil() {
  try { return JSON.parse(localStorage.getItem(CLE_LOCALE)); } catch (e) { return null; }
}

async function demarrer() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const autonome = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (!SERVEUR) { etat('Le serveur n\'est pas encore branché.', false); $('#activer').disabled = true; return; }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (ios && !autonome) { $('#ios').hidden = false; etat('Ajoute d\'abord l\'appli à l\'écran d\'accueil.', false); }
    else etat('Ce navigateur ne gère pas les notifications. Essaie avec Chrome.', false);
    $('#activer').disabled = true;
    return;
  }
  const a = appareil();
  if (a && Notification.permission === 'granted') {
    etat('Notifications activées sur ce téléphone.', true);
    $('#maintenant').disabled = false;
    $('#differe').disabled = false;
  } else {
    etat('Les notifications ne sont pas encore activées.', null);
  }
}

$('#activer').addEventListener('click', async () => {
  const b = $('#activer');
  b.disabled = true;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { etat('Tu as refusé les notifications. Autorise-les dans les réglages du navigateur.', false); return; }
    const { cle } = await appel({ a: 'cle' });
    let abo = await reg.pushManager.getSubscription();
    if (abo) await abo.unsubscribe();
    abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: deB64u(cle) });
    const r = await appel({ a: 'abonner', abonnement: abo.toJSON(), appareil: navigator.userAgent }, true);
    localStorage.setItem(CLE_LOCALE, JSON.stringify(r));
    const c = await caches.open('bhcd-config');
    await c.put('config', new Response(JSON.stringify({ serveur: SERVEUR, id: r.id, secret: r.secret })));
    journal('Abonné au serveur.');
    etat('Notifications activées sur ce téléphone.', true);
    $('#maintenant').disabled = false;
    $('#differe').disabled = false;
  } catch (err) {
    etat('Échec : ' + err.message, false);
    journal('Erreur : ' + err.message);
  } finally {
    b.disabled = false;
  }
});

async function tester(delai) {
  const a = appareil();
  if (!a) return;
  try {
    const r = await appel({ a: 'tester', id: a.id, secret: a.secret, delai }, true);
    if (delai) journal('Prévue dans environ 1 minute. Ferme l\'appli et attends (ça peut prendre jusqu\'à 2 ou 3 minutes).');
    else journal('Envoyée. Réponse du service de notification : ' + (r.codes || []).join(', ') + ' (201 = accepté).');
  } catch (err) {
    journal('Erreur : ' + err.message);
  }
}

$('#maintenant').addEventListener('click', () => tester(0));
$('#differe').addEventListener('click', () => tester(60));

demarrer();
