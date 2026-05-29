// ============================================================
// DEVORA NISSENBAUM — CRM
// ============================================================

const DB_KEY = 'devora_crm';
const SESSION_KEY = 'devora_session';
const DEFAULT_PASSWORD = 'admin2026';

// ===== INITIAL CATALOGUE =====
const CATALOGUE_DEFAUT = [
  { id: 'nat-1', nom: 'Perruque Naturelle Lisse', categorie: 'naturelle', prix: 250, actif: true },
  { id: 'nat-2', nom: 'Perruque Naturelle Bouclée', categorie: 'naturelle', prix: 280, actif: true },
  { id: 'nat-3', nom: 'Perruque Naturelle Ondulée', categorie: 'naturelle', prix: 260, actif: true },
  { id: 'nat-4', nom: 'Perruque Naturelle Longue', categorie: 'naturelle', prix: 320, actif: true },
  { id: 'syn-1', nom: 'Perruque Synthétique Longue', categorie: 'synthetique', prix: 120, actif: true },
  { id: 'syn-2', nom: 'Perruque Synthétique Mi-Longue', categorie: 'synthetique', prix: 95, actif: true },
  { id: 'syn-3', nom: 'Perruque Synthétique Lisse', categorie: 'synthetique', prix: 85, actif: true },
  { id: 'mil-1', nom: 'Perruque Mi-Longue Ondulée', categorie: 'mi_longue', prix: 175, actif: true },
  { id: 'mil-2', nom: 'Perruque Mi-Longue Lisse', categorie: 'mi_longue', prix: 155, actif: true },
  { id: 'mil-3', nom: 'Perruque Mi-Longue Bouclée', categorie: 'mi_longue', prix: 185, actif: true },
  { id: 'cou-1', nom: 'Perruque Courte Chic', categorie: 'courte', prix: 150, actif: true },
  { id: 'cou-2', nom: 'Perruque Courte Pixie', categorie: 'courte', prix: 135, actif: true },
  { id: 'svc-1', nom: 'Nettoyage Simple', categorie: 'service', prix: 25, actif: true },
  { id: 'svc-2', nom: 'Nettoyage + Brushing', categorie: 'service', prix: 45, actif: true },
  { id: 'svc-3', nom: 'Nettoyage + Traitement Complet', categorie: 'service', prix: 65, actif: true },
];

// DEMO DATA pour test
const DEMO_CLIENTS = [
  { id: 'cl-001', nom: 'Martin', prenom: 'Sophie', telephone: '+33612345678', email: 'sophie.martin@gmail.com', adresse: '12 rue de la Paix, 75001 Paris, France', notes: 'Cliente VIP', dateCreation: '2026-01-15T10:00:00Z', actif: true },
  { id: 'cl-002', nom: 'Koné', prenom: 'Aminata', telephone: '+33698765432', email: 'aminata.kone@hotmail.fr', adresse: '45 avenue Jean Jaurès, 69007 Lyon, France', notes: '', dateCreation: '2026-02-20T14:00:00Z', actif: true },
  { id: 'cl-003', nom: 'Benali', prenom: 'Nadia', telephone: '+33756789012', email: 'nadia.benali@outlook.com', adresse: '8 bd Michelet, 13008 Marseille, France', notes: 'Préfère WhatsApp', dateCreation: '2026-03-10T09:30:00Z', actif: true },
];

const DEMO_COMMANDES = [
  {
    id: 'cmd-001', numero: 'CMD-2026-001', clientId: 'cl-001',
    clientInfo: { prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@gmail.com', telephone: '+33612345678', adresse: '12 rue de la Paix, 75001 Paris, France' },
    produits: [{ id:'nat-1', nom:'Perruque Naturelle Lisse', categorie:'naturelle', prix:250, quantite:1, note:'' }],
    montantTotal: 250, montantPaye: 250,
    statutPaiement: 'paye', modePaiement: 'virement',
    statutCommande: 'livree', lienPaiement: '', notes: '',
    dateCreation: '2026-01-20T11:00:00Z', dateValidation: '2026-01-20T12:00:00Z', source: 'direct'
  },
  {
    id: 'cmd-002', numero: 'CMD-2026-002', clientId: 'cl-002',
    clientInfo: { prenom: 'Aminata', nom: 'Koné', email: 'aminata.kone@hotmail.fr', telephone: '+33698765432', adresse: '45 avenue Jean Jaurès, 69007 Lyon, France' },
    produits: [
      { id:'mil-1', nom:'Perruque Mi-Longue Ondulée', categorie:'mi_longue', prix:175, quantite:1, note:'couleur noire' },
      { id:'svc-2', nom:'Nettoyage + Brushing', categorie:'service', prix:45, quantite:1, note:'' }
    ],
    montantTotal: 220, montantPaye: 100,
    statutPaiement: 'partiel', modePaiement: 'paypal',
    statutCommande: 'validee', lienPaiement: 'https://paypal.me/example/120', notes: 'Acompte reçu',
    dateCreation: '2026-03-05T15:00:00Z', dateValidation: '2026-03-05T16:30:00Z', source: 'formulaire'
  },
  {
    id: 'cmd-003', numero: 'CMD-2026-003', clientId: null,
    clientInfo: { prenom: 'Nadia', nom: 'Benali', email: 'nadia.benali@outlook.com', telephone: '+33756789012', adresse: '8 bd Michelet, 13008 Marseille, France' },
    produits: [{ id:'cou-1', nom:'Perruque Courte Chic', categorie:'courte', prix:150, quantite:2, note:'une noire, une marron' }],
    montantTotal: 300, montantPaye: 0,
    statutPaiement: 'en_attente', modePaiement: '',
    statutCommande: 'en_attente', lienPaiement: '', notes: 'Via formulaire site',
    dateCreation: '2026-05-28T09:00:00Z', dateValidation: null, source: 'formulaire'
  },
];

// ===== DATA LAYER =====
function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return initDb();
    const db = JSON.parse(raw);
    if (!db.clients) db.clients = [];
    if (!db.commandes) db.commandes = [];
    if (!db.produits || db.produits.length === 0) db.produits = CATALOGUE_DEFAUT;
    if (!db.parametres) db.parametres = {};
    let needsSave = false;
    if (!db.parametres.motDePasse) { db.parametres.motDePasse = DEFAULT_PASSWORD; needsSave = true; }
    if (!db.lastCommandeNum) { db.lastCommandeNum = db.commandes.length; needsSave = true; }
    if (needsSave) localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  } catch(e) { return initDb(); }
}

function initDb() {
  const db = {
    clients: DEMO_CLIENTS,
    commandes: DEMO_COMMANDES,
    produits: CATALOGUE_DEFAUT,
    parametres: {
      nomBoutique: 'Devora Nissenbaum',
      whatsapp: '',
      email: '',
      motDePasse: DEFAULT_PASSWORD,
      lienPaiementBase: '',
      devise: '€'
    },
    lastCommandeNum: 3
  };
  saveDb(db);
  return db;
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function genId() {
  return Math.random().toString(36).substr(2,9).toUpperCase();
}

// ===== STATE =====
let db = loadDb();
let currentView = 'dashboard';
let currentClientId = null;
let currentCommandeId = null;
let searchQuery = '';
let filterStatut = 'all';
let editingClientId = null;

// ===== AUTH =====
function checkAuth() {
  return sessionStorage.getItem(SESSION_KEY) === 'ok';
}
function login(password) {
  if (password === db.parametres.motDePasse) {
    sessionStorage.setItem(SESSION_KEY, 'ok');
    return true;
  }
  return false;
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
}

// ===== LABELS =====
const STATUT_COMMANDE = {
  en_attente:  { label:'En attente',    color:'#B8860B', bg:'rgba(184,134,11,0.1)' },
  validee:     { label:'Validée',       color:'#2D7D4F', bg:'rgba(45,125,79,0.1)' },
  en_cours:    { label:'En préparation',color:'#1A5EA8', bg:'rgba(26,94,168,0.1)' },
  livree:      { label:'Livrée',        color:'#2D7D4F', bg:'rgba(45,125,79,0.12)' },
  annulee:     { label:'Annulée',       color:'#9B2335', bg:'rgba(155,35,53,0.1)' }
};
const STATUT_PAIEMENT = {
  en_attente: { label:'Non payé',    color:'#9B2335', bg:'rgba(155,35,53,0.1)' },
  partiel:    { label:'Partiel',     color:'#B8860B', bg:'rgba(184,134,11,0.1)' },
  paye:       { label:'Payé',        color:'#2D7D4F', bg:'rgba(45,125,79,0.1)' },
  annule:     { label:'Annulé',      color:'#666',    bg:'rgba(0,0,0,0.07)' }
};
const CAT_LABELS = {
  naturelle:'Naturelle', synthetique:'Synthétique', mi_longue:'Mi-longue',
  courte:'Courte', service:'Service'
};
const MODE_PAIEMENT = { '':'—', virement:'Virement', carte:'Carte', especes:'Espèces', cheque:'Chèque', paypal:'PayPal', lydia:'Lydia' };

function badge(text, color, bg) {
  return `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:50px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;color:${color};background:${bg}">${text}</span>`;
}
function cmdBadge(statut) {
  const s = STATUT_COMMANDE[statut] || STATUT_COMMANDE.en_attente;
  return badge(s.label, s.color, s.bg);
}
function payBadge(statut) {
  const s = STATUT_PAIEMENT[statut] || STATUT_PAIEMENT.en_attente;
  return badge(s.label, s.color, s.bg);
}

// ===== VIEWS =====
function showView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.view === view || (view.startsWith('client') && l.dataset.view === 'clients') || (view.startsWith('commande') && l.dataset.view === 'commandes'));
  });
}

function showLogin() {
  document.getElementById('crm-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}
function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('crm-app').style.display = 'flex';
  renderDashboard();
  showView('dashboard');
}

// ===== DASHBOARD =====
function renderDashboard() {
  db = loadDb();
  const clients = db.clients.filter(c => c.actif !== false);
  const commandes = db.commandes;
  const enAttente = commandes.filter(c => c.statutCommande === 'en_attente');
  const impayees = commandes.filter(c => c.statutPaiement !== 'paye' && c.statutPaiement !== 'annule');
  const totalCA = commandes.filter(c => c.statutPaiement === 'paye').reduce((s,c) => s + c.montantTotal, 0);
  const totalImpaye = impayees.reduce((s,c) => s + (c.montantTotal - c.montantPaye), 0);

  document.getElementById('stat-clients').textContent = clients.length;
  document.getElementById('stat-commandes').textContent = commandes.length;
  document.getElementById('stat-ca').textContent = totalCA.toFixed(0) + '€';
  document.getElementById('stat-impaye').textContent = totalImpaye.toFixed(0) + '€';

  // Pending orders alert
  const alertEl = document.getElementById('pending-alert');
  if (enAttente.length > 0) {
    alertEl.style.display = 'flex';
    document.getElementById('pending-count').textContent = enAttente.length + ' commande' + (enAttente.length > 1 ? 's' : '') + ' en attente de validation';
  } else {
    alertEl.style.display = 'none';
  }

  // Recent orders
  const recent = [...commandes].sort((a,b) => new Date(b.dateCreation) - new Date(a.dateCreation)).slice(0, 5);
  const tbody = document.getElementById('recent-orders-body');
  tbody.innerHTML = recent.map(c => {
    const client = db.clients.find(cl => cl.id === c.clientId);
    const nom = client ? `${client.prenom} ${client.nom}` : `${c.clientInfo?.prenom||''} ${c.clientInfo?.nom||''}`;
    return `<tr onclick="openCommande('${c.id}')" style="cursor:pointer">
      <td><strong>${c.numero}</strong></td>
      <td>${nom}</td>
      <td>${formatDate(c.dateCreation)}</td>
      <td>${c.montantTotal}€</td>
      <td>${cmdBadge(c.statutCommande)}</td>
      <td>${payBadge(c.statutPaiement)}</td>
    </tr>`;
  }).join('');

  // Unpaid amounts
  const unpaidEl = document.getElementById('unpaid-list');
  const unpaidItems = impayees.filter(c => c.montantTotal - c.montantPaye > 0).slice(0, 4);
  unpaidEl.innerHTML = unpaidItems.length ? unpaidItems.map(c => {
    const client = db.clients.find(cl => cl.id === c.clientId);
    const nom = client ? `${client.prenom} ${client.nom}` : `${c.clientInfo?.prenom||''} ${c.clientInfo?.nom||''}`;
    const manquant = c.montantTotal - c.montantPaye;
    return `<div class="unpaid-row" onclick="openCommande('${c.id}')">
      <div><div class="unpaid-name">${nom}</div><div class="unpaid-cmd">${c.numero}</div></div>
      <div style="display:flex;align-items:center;gap:0.75rem">
        <span class="unpaid-amount">${manquant}€</span>
        ${c.clientInfo?.telephone ? `<button class="btn-wa" onclick="event.stopPropagation();sendWhatsAppRappel('${c.id}')" title="Rappel WhatsApp">💬</button>` : ''}
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;color:var(--text-muted);font-size:0.85rem;padding:2rem 0">✅ Aucun impayé</div>';
}

// ===== CLIENTS =====
function renderClientsList() {
  db = loadDb();
  let clients = db.clients.filter(c => c.actif !== false);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    clients = clients.filter(c =>
      c.nom.toLowerCase().includes(q) || c.prenom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) || c.telephone.includes(q)
    );
  }
  clients.sort((a,b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`));

  document.getElementById('clients-count').textContent = clients.length + ' client' + (clients.length !== 1 ? 's' : '');
  const tbody = document.getElementById('clients-tbody');
  if (clients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem">Aucun client trouvé</td></tr>`;
    return;
  }
  tbody.innerHTML = clients.map(c => {
    const cmds = db.commandes.filter(cmd => cmd.clientId === c.id);
    const total = cmds.reduce((s,cmd) => s + cmd.montantTotal, 0);
    return `<tr onclick="openClient('${c.id}')" style="cursor:pointer">
      <td><div class="client-name">${c.prenom} ${c.nom}</div></td>
      <td>${c.telephone}</td>
      <td style="font-size:0.82rem">${c.email}</td>
      <td style="text-align:center">${cmds.length}</td>
      <td style="font-weight:600;color:var(--gold)">${total}€</td>
      <td style="text-align:center">
        <button class="btn-icon" onclick="event.stopPropagation();sendWhatsAppRappel_client('${c.id}')" title="WhatsApp">💬</button>
      </td>
    </tr>`;
  }).join('');
}

function openClient(id) {
  currentClientId = id;
  renderClientDetail(id);
  showView('client-detail');
}

function renderClientDetail(id) {
  db = loadDb();
  const client = db.clients.find(c => c.id === id);
  if (!client) return;
  const cmds = db.commandes.filter(c => c.clientId === id);
  const totalCA = cmds.reduce((s,c) => s + c.montantTotal, 0);
  const totalPaye = cmds.reduce((s,c) => s + c.montantPaye, 0);
  const impaye = totalCA - totalPaye;

  document.getElementById('detail-client-title').textContent = `${client.prenom} ${client.nom}`;
  document.getElementById('detail-client-sub').textContent = client.email + ' · ' + client.telephone;

  document.getElementById('client-detail-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-card-title">Informations personnelles</div>
        <div class="detail-row"><span>Prénom & Nom</span><strong>${client.prenom} ${client.nom}</strong></div>
        <div class="detail-row"><span>Téléphone</span><strong>${client.telephone}</strong></div>
        <div class="detail-row"><span>Email</span><strong>${client.email}</strong></div>
        <div class="detail-row"><span>Adresse</span><strong>${client.adresse || '—'}</strong></div>
        <div class="detail-row"><span>Client depuis</span><strong>${formatDate(client.dateCreation)}</strong></div>
        ${client.notes ? `<div class="detail-row"><span>Notes</span><em style="color:var(--text-muted)">${client.notes}</em></div>` : ''}
      </div>
      <div class="detail-card">
        <div class="detail-card-title">Synthèse financière</div>
        <div class="detail-row"><span>Commandes</span><strong>${cmds.length}</strong></div>
        <div class="detail-row"><span>CA total</span><strong style="color:var(--gold)">${totalCA}€</strong></div>
        <div class="detail-row"><span>Montant payé</span><strong style="color:var(--success)">${totalPaye}€</strong></div>
        <div class="detail-row"><span>Solde dû</span><strong style="color:${impaye > 0 ? 'var(--danger)' : 'var(--success)'}">${impaye}€</strong></div>
      </div>
    </div>
    <div class="detail-actions">
      <button class="btn btn-primary" onclick="openModal('modal-edit-client')">✏️ Modifier</button>
      <button class="btn btn-wa-full" onclick="sendWhatsAppRappel_client('${id}')">💬 Rappel WhatsApp</button>
      <button class="btn btn-secondary" onclick="copyEmailClient('${id}')">📧 Copier email</button>
      <button class="btn btn-secondary" onclick="openNewCommandeForClient('${id}')">+ Nouvelle commande</button>
    </div>
    <div class="detail-card" style="margin-top:1.5rem">
      <div class="detail-card-title">Historique des commandes</div>
      ${cmds.length === 0 ? '<div style="text-align:center;color:var(--text-muted);padding:2rem">Aucune commande</div>' :
        `<table class="crm-table" style="margin-top:0">
          <thead><tr><th>N°</th><th>Date</th><th>Produits</th><th>Montant</th><th>Statut</th><th>Paiement</th><th></th></tr></thead>
          <tbody>${cmds.sort((a,b) => new Date(b.dateCreation)-new Date(a.dateCreation)).map(c => `
            <tr>
              <td><strong>${c.numero}</strong></td>
              <td>${formatDate(c.dateCreation)}</td>
              <td style="font-size:0.82rem">${c.produits.map(p=>p.nom).join(', ')}</td>
              <td><strong>${c.montantTotal}€</strong>${c.montantPaye < c.montantTotal ? `<br><small style="color:var(--danger)">Dû: ${c.montantTotal - c.montantPaye}€</small>` : ''}</td>
              <td>${cmdBadge(c.statutCommande)}</td>
              <td>${payBadge(c.statutPaiement)}</td>
              <td><button class="btn-icon" onclick="openCommande('${c.id}')">→</button></td>
            </tr>`).join('')}
          </tbody>
        </table>`
      }
    </div>`;

  // Fill edit form
  document.getElementById('edit-client-prenom').value = client.prenom;
  document.getElementById('edit-client-nom').value = client.nom;
  document.getElementById('edit-client-tel').value = client.telephone;
  document.getElementById('edit-client-email').value = client.email;
  document.getElementById('edit-client-adresse').value = client.adresse || '';
  document.getElementById('edit-client-notes').value = client.notes || '';
  editingClientId = id;
}

function saveEditClient() {
  if (!editingClientId) return;
  db = loadDb();
  const idx = db.clients.findIndex(c => c.id === editingClientId);
  if (idx < 0) return;
  db.clients[idx] = {
    ...db.clients[idx],
    prenom: document.getElementById('edit-client-prenom').value.trim(),
    nom: document.getElementById('edit-client-nom').value.trim(),
    telephone: document.getElementById('edit-client-tel').value.trim(),
    email: document.getElementById('edit-client-email').value.trim(),
    adresse: document.getElementById('edit-client-adresse').value.trim(),
    notes: document.getElementById('edit-client-notes').value.trim(),
  };
  saveDb(db);
  closeModal('modal-edit-client');
  renderClientDetail(editingClientId);
  showToast('Client mis à jour avec succès');
}

function saveNewClient() {
  const prenom = document.getElementById('new-client-prenom').value.trim();
  const nom = document.getElementById('new-client-nom').value.trim();
  const tel = document.getElementById('new-client-tel').value.trim();
  const email = document.getElementById('new-client-email').value.trim();
  const adresse = document.getElementById('new-client-adresse').value.trim();
  const notes = document.getElementById('new-client-notes').value.trim();
  if (!prenom || !nom || !tel || !email) { showToast('Veuillez remplir tous les champs obligatoires', 'error'); return; }
  db = loadDb();
  const newClient = { id: 'cl-' + genId(), nom, prenom, telephone: tel, email, adresse, notes, dateCreation: new Date().toISOString(), actif: true };
  db.clients.push(newClient);
  saveDb(db);
  closeModal('modal-new-client');
  clearNewClientForm();
  renderClientsList();
  showToast('Nouveau client créé avec succès');
}

function clearNewClientForm() {
  ['new-client-prenom','new-client-nom','new-client-tel','new-client-email','new-client-adresse','new-client-notes'].forEach(id => { document.getElementById(id).value = ''; });
}

// ===== COMMANDES =====
function renderCommandesList() {
  db = loadDb();
  let commandes = [...db.commandes];
  if (filterStatut !== 'all') commandes = commandes.filter(c => c.statutCommande === filterStatut || c.statutPaiement === filterStatut);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    commandes = commandes.filter(c => {
      const client = db.clients.find(cl => cl.id === c.clientId);
      const nom = client ? `${client.prenom} ${client.nom}` : `${c.clientInfo?.prenom||''} ${c.clientInfo?.nom||''}`;
      return c.numero.toLowerCase().includes(q) || nom.toLowerCase().includes(q);
    });
  }
  commandes.sort((a,b) => new Date(b.dateCreation) - new Date(a.dateCreation));

  document.getElementById('commandes-count').textContent = commandes.length + ' commande' + (commandes.length !== 1 ? 's' : '');
  const tbody = document.getElementById('commandes-tbody');
  if (commandes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:3rem">Aucune commande trouvée</td></tr>`;
    return;
  }
  tbody.innerHTML = commandes.map(c => {
    const client = db.clients.find(cl => cl.id === c.clientId);
    const nom = client ? `${client.prenom} ${client.nom}` : `${c.clientInfo?.prenom||''} ${c.clientInfo?.nom||''}`;
    const manquant = c.montantTotal - c.montantPaye;
    return `<tr onclick="openCommande('${c.id}')" style="cursor:pointer">
      <td><strong>${c.numero}</strong>${c.source === 'formulaire' ? ' <span style="font-size:0.65rem;background:rgba(26,94,168,0.1);color:#1A5EA8;padding:2px 6px;border-radius:50px;font-weight:600">WEB</span>' : ''}</td>
      <td>${nom}</td>
      <td style="font-size:0.82rem">${formatDate(c.dateCreation)}</td>
      <td>${c.produits.map(p=>p.nom).join('<br>')}</td>
      <td><strong>${c.montantTotal}€</strong></td>
      <td>${cmdBadge(c.statutCommande)}</td>
      <td>${payBadge(c.statutPaiement)}${manquant > 0 ? `<br><small style="color:var(--danger);font-weight:600">${manquant}€ dû</small>` : ''}</td>
      <td onclick="event.stopPropagation()">
        ${manquant > 0 ? `<button class="btn-icon" title="Rappel WA" onclick="sendWhatsAppRappel('${c.id}')">💬</button>` : ''}
        <button class="btn-icon" title="Ouvrir">→</button>
      </td>
    </tr>`;
  }).join('');
}

function openCommande(id) {
  currentCommandeId = id;
  renderCommandeDetail(id);
  showView('commande-detail');
}

function renderCommandeDetail(id) {
  db = loadDb();
  const cmd = db.commandes.find(c => c.id === id);
  if (!cmd) return;
  const client = db.clients.find(c => c.id === cmd.clientId);
  const info = client || cmd.clientInfo || {};
  const nom = client ? `${client.prenom} ${client.nom}` : `${info.prenom||''} ${info.nom||''}`;
  const tel = client ? client.telephone : info.telephone;
  const email = client ? client.email : info.email;
  const manquant = cmd.montantTotal - cmd.montantPaye;

  document.getElementById('detail-cmd-title').textContent = cmd.numero;
  document.getElementById('detail-cmd-sub').textContent = `${nom} · ${formatDate(cmd.dateCreation)}`;

  // Validation section for pending orders
  let validationHtml = '';
  if (cmd.statutCommande === 'en_attente') {
    const duplicates = findDuplicates(info.email, tel);
    const dupeAlert = duplicates.length > 0 ? `
      <div class="alert alert-warning">
        <strong>⚠️ Client potentiellement existant détecté</strong>
        <p style="margin:0.5rem 0 0">Un ou plusieurs clients correspondent à cet email/téléphone :</p>
        <ul style="margin:0.5rem 0 0;padding-left:1.5rem">
          ${duplicates.map(d => `<li><strong>${d.prenom} ${d.nom}</strong> — ${d.email} · ${d.telephone}
            <button class="btn-small btn-primary" onclick="mergeCommandeToClient('${cmd.id}','${d.id}')" style="margin-left:0.5rem">Fusionner avec ce client</button>
          </li>`).join('')}
        </ul>
      </div>` : `<div class="alert alert-info">Aucun client existant correspondant. Une nouvelle fiche sera créée à la validation.</div>`;
    validationHtml = `
      <div class="detail-card" style="border:2px solid var(--gold)">
        <div class="detail-card-title" style="color:var(--gold)">⏳ Validation requise</div>
        ${dupeAlert}
        <div style="display:flex;gap:1rem;margin-top:1rem;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="validerCommande('${cmd.id}')">✓ Valider & Créer nouveau client</button>
          <button class="btn btn-danger" onclick="annulerCommande('${cmd.id}')">✕ Refuser la commande</button>
        </div>
      </div>`;
  }

  document.getElementById('cmd-detail-body').innerHTML = `
    ${validationHtml}
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-card-title">Client</div>
        <div class="detail-row"><span>Nom</span><strong>${nom}</strong></div>
        <div class="detail-row"><span>Téléphone</span><strong>${tel||'—'}</strong></div>
        <div class="detail-row"><span>Email</span><strong>${email||'—'}</strong></div>
        <div class="detail-row"><span>Adresse</span><strong>${(client ? client.adresse : info.adresse)||'—'}</strong></div>
        ${client ? `<div style="margin-top:1rem"><button class="btn btn-secondary btn-sm" onclick="openClient('${client.id}')">Voir fiche client →</button></div>` : ''}
      </div>
      <div class="detail-card">
        <div class="detail-card-title">Paiement</div>
        <div class="detail-row"><span>Statut paiement</span>${payBadge(cmd.statutPaiement)}</div>
        <div class="detail-row"><span>Statut commande</span>${cmdBadge(cmd.statutCommande)}</div>
        <div class="detail-row"><span>Mode de paiement</span><strong>${MODE_PAIEMENT[cmd.modePaiement]||'—'}</strong></div>
        <div class="detail-row"><span>Total</span><strong style="font-size:1.1rem;color:var(--gold)">${cmd.montantTotal}€</strong></div>
        <div class="detail-row"><span>Payé</span><strong style="color:var(--success)">${cmd.montantPaye}€</strong></div>
        <div class="detail-row"><span>Restant dû</span><strong style="color:${manquant > 0 ? 'var(--danger)' : 'var(--success)'};font-size:1.1rem">${manquant}€</strong></div>
        ${cmd.lienPaiement ? `<div class="detail-row"><span>Lien paiement</span><a href="${cmd.lienPaiement}" target="_blank" style="color:var(--gold);font-size:0.82rem;word-break:break-all">${cmd.lienPaiement}</a></div>` : ''}
      </div>
    </div>

    <div class="detail-card">
      <div class="detail-card-title">Articles commandés</div>
      <table class="crm-table" style="margin-top:0">
        <thead><tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>Prix unitaire</th><th>Total</th><th>Notes</th></tr></thead>
        <tbody>
          ${cmd.produits.map(p => `<tr>
            <td><strong>${p.nom}</strong></td>
            <td>${CAT_LABELS[p.categorie]||p.categorie}</td>
            <td style="text-align:center">${p.quantite}</td>
            <td>${p.prix}€</td>
            <td><strong>${(p.prix*p.quantite)}€</strong></td>
            <td style="font-size:0.82rem;color:var(--text-muted)">${p.note||'—'}</td>
          </tr>`).join('')}
          <tr style="background:var(--bg-2)">
            <td colspan="4" style="text-align:right;font-weight:600">TOTAL</td>
            <td colspan="2"><strong style="color:var(--gold);font-size:1.1rem">${cmd.montantTotal}€</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    ${cmd.notes ? `<div class="detail-card"><div class="detail-card-title">Notes</div><p style="color:var(--text-muted);font-size:0.9rem">${cmd.notes}</p></div>` : ''}

    <div class="detail-actions" style="flex-wrap:wrap">
      ${cmd.statutCommande !== 'en_attente' ? `
        <button class="btn btn-primary" onclick="openModal('modal-update-payment')">💳 Mettre à jour paiement</button>
        <button class="btn btn-wa-full" onclick="sendWhatsAppRappel('${cmd.id}')">💬 Rappel WhatsApp</button>
        <button class="btn btn-secondary" onclick="openModal('modal-generate-link')">🔗 Générer lien paiement</button>
        <button class="btn btn-secondary" onclick="updateStatutCommande('${cmd.id}')">📦 Changer statut</button>
        <button class="btn btn-secondary" onclick="sendConfirmationWA('${cmd.id}')">✓ Confirmation WA</button>
        <button class="btn btn-secondary" onclick="copyEmailConfirmation('${cmd.id}')">📧 Copier email confirm.</button>
      ` : ''}
    </div>
  `;

  // Pre-fill payment modal
  document.getElementById('pay-montant-total').textContent = cmd.montantTotal + '€';
  document.getElementById('pay-montant-paye').value = cmd.montantPaye;
  document.getElementById('pay-mode').value = cmd.modePaiement || '';
  document.getElementById('pay-statut').value = cmd.statutPaiement;
  document.getElementById('link-current').value = cmd.lienPaiement || '';
}

function savePaymentUpdate() {
  if (!currentCommandeId) return;
  db = loadDb();
  const idx = db.commandes.findIndex(c => c.id === currentCommandeId);
  if (idx < 0) return;
  const montantPaye = parseFloat(document.getElementById('pay-montant-paye').value) || 0;
  const mode = document.getElementById('pay-mode').value;
  const statut = document.getElementById('pay-statut').value;
  db.commandes[idx] = { ...db.commandes[idx], montantPaye, modePaiement: mode, statutPaiement: statut };

  // Auto-update statut if fully paid
  if (montantPaye >= db.commandes[idx].montantTotal) {
    db.commandes[idx].statutPaiement = 'paye';
    document.getElementById('pay-statut').value = 'paye';
  }
  saveDb(db);
  closeModal('modal-update-payment');
  renderCommandeDetail(currentCommandeId);
  renderDashboard();
  showToast('Paiement mis à jour ✓');

  // Propose sending confirmation
  if (db.commandes[idx].statutPaiement === 'paye') {
    if (confirm('Paiement complet ! Envoyer une confirmation WhatsApp au client ?')) {
      sendConfirmationWA(currentCommandeId);
    }
  }
}

function saveLienPaiement() {
  if (!currentCommandeId) return;
  db = loadDb();
  const idx = db.commandes.findIndex(c => c.id === currentCommandeId);
  if (idx < 0) return;
  const lien = document.getElementById('link-current').value.trim();
  db.commandes[idx].lienPaiement = lien;
  saveDb(db);
  closeModal('modal-generate-link');
  renderCommandeDetail(currentCommandeId);
  showToast('Lien de paiement enregistré ✓');
  if (confirm('Envoyer ce lien par WhatsApp au client ?')) {
    sendWhatsAppRappel(currentCommandeId);
  }
}

function updateStatutCommande(cmdId) {
  db = loadDb();
  const cmd = db.commandes.find(c => c.id === cmdId);
  if (!cmd) return;
  const statuts = Object.keys(STATUT_COMMANDE);
  const labels = statuts.map(s => STATUT_COMMANDE[s].label);
  const current = statuts.indexOf(cmd.statutCommande);
  const next = (current + 1) % statuts.length;
  if (confirm(`Passer la commande de "${labels[current]}" à "${labels[next]}" ?`)) {
    const idx = db.commandes.findIndex(c => c.id === cmdId);
    db.commandes[idx].statutCommande = statuts[next];
    saveDb(db);
    renderCommandeDetail(cmdId);
    showToast(`Statut mis à jour : ${labels[next]}`);
  }
}

function validerCommande(cmdId) {
  db = loadDb();
  const idx = db.commandes.findIndex(c => c.id === cmdId);
  if (idx < 0) return;
  const cmd = db.commandes[idx];
  const info = cmd.clientInfo || {};

  // Create new client
  const newClient = {
    id: 'cl-' + genId(),
    nom: info.nom || '',
    prenom: info.prenom || '',
    telephone: info.telephone || '',
    email: info.email || '',
    adresse: info.adresse || '',
    notes: 'Client créé automatiquement depuis commande ' + cmd.numero,
    dateCreation: new Date().toISOString(),
    actif: true
  };
  db.clients.push(newClient);
  db.commandes[idx].clientId = newClient.id;
  db.commandes[idx].statutCommande = 'validee';
  db.commandes[idx].dateValidation = new Date().toISOString();
  saveDb(db);
  renderCommandeDetail(cmdId);
  showToast('Commande validée ! Nouvelle fiche client créée.');
  if (confirm('Envoyer une confirmation WhatsApp au client ?')) sendConfirmationWA(cmdId);
}

function mergeCommandeToClient(cmdId, clientId) {
  db = loadDb();
  const cmdIdx = db.commandes.findIndex(c => c.id === cmdId);
  if (cmdIdx < 0) return;
  db.commandes[cmdIdx].clientId = clientId;
  db.commandes[cmdIdx].statutCommande = 'validee';
  db.commandes[cmdIdx].dateValidation = new Date().toISOString();
  saveDb(db);
  renderCommandeDetail(cmdId);
  showToast('Commande fusionnée avec le client existant ✓');
}

function annulerCommande(cmdId) {
  if (!confirm('Refuser cette commande ? Elle sera marquée comme annulée.')) return;
  db = loadDb();
  const idx = db.commandes.findIndex(c => c.id === cmdId);
  if (idx < 0) return;
  db.commandes[idx].statutCommande = 'annulee';
  db.commandes[idx].statutPaiement = 'annule';
  saveDb(db);
  renderCommandeDetail(cmdId);
  showToast('Commande annulée');
}

// ===== DUPLICATE DETECTION =====
function findDuplicates(email, telephone) {
  const norm = t => (t||'').replace(/\D/g,'').slice(-9);
  return db.clients.filter(c =>
    (email && c.email.toLowerCase() === (email||'').toLowerCase()) ||
    (telephone && norm(c.telephone) === norm(telephone))
  );
}

// ===== WHATSAPP =====
function sendWhatsAppRappel(cmdId) {
  db = loadDb();
  const cmd = db.commandes.find(c => c.id === cmdId);
  if (!cmd) return;
  const client = db.clients.find(c => c.id === cmd.clientId) || cmd.clientInfo || {};
  const tel = (client.telephone||'').replace(/\D/g,'');
  if (!tel) { alert('Numéro de téléphone manquant pour ce client.'); return; }
  const manquant = cmd.montantTotal - cmd.montantPaye;
  const nom = db.parametres.nomBoutique || 'Devora Nissenbaum';
  const lien = cmd.lienPaiement ? `\n\n🔗 Lien de paiement : ${cmd.lienPaiement}` : '';
  const message = `Bonjour ${client.prenom || ''},\n\nNous vous rappelons qu'un montant de *${manquant}€* reste à régler pour votre commande *${cmd.numero}*.${lien}\n\nMerci pour votre confiance 🙏\n\n_${nom}_`;
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(message)}`, '_blank');
}

function sendWhatsAppRappel_client(clientId) {
  db = loadDb();
  const client = db.clients.find(c => c.id === clientId);
  if (!client) return;
  const cmdsImpayees = db.commandes.filter(c => c.clientId === clientId && c.statutPaiement !== 'paye' && c.statutPaiement !== 'annule');
  if (cmdsImpayees.length === 0) { showToast('Ce client n\'a aucun impayé', 'info'); return; }
  sendWhatsAppRappel(cmdsImpayees[0].id);
}

function sendConfirmationWA(cmdId) {
  db = loadDb();
  const cmd = db.commandes.find(c => c.id === cmdId);
  if (!cmd) return;
  const client = db.clients.find(c => c.id === cmd.clientId) || cmd.clientInfo || {};
  const tel = (client.telephone||'').replace(/\D/g,'');
  if (!tel) { alert('Numéro de téléphone manquant.'); return; }
  const nom = db.parametres.nomBoutique || 'Devora Nissenbaum';
  const isPaid = cmd.statutPaiement === 'paye';
  const produits = cmd.produits.map(p => `• ${p.nom} ×${p.quantite}`).join('\n');
  const message = isPaid
    ? `✅ Bonjour ${client.prenom||''}, votre paiement de *${cmd.montantTotal}€* pour la commande *${cmd.numero}* a bien été reçu. Merci ! 🙏\n\n_${nom}_`
    : `✅ Bonjour ${client.prenom||''}, votre commande *${cmd.numero}* a bien été confirmée !\n\n📦 Articles :\n${produits}\n\n💰 Total : *${cmd.montantTotal}€*\n\nNous vous contacterons prochainement pour la suite.\n\n_${nom}_`;
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(message)}`, '_blank');
}

function copyEmailConfirmation(cmdId) {
  db = loadDb();
  const cmd = db.commandes.find(c => c.id === cmdId);
  if (!cmd) return;
  const client = db.clients.find(c => c.id === cmd.clientId) || cmd.clientInfo || {};
  const nom = db.parametres.nomBoutique || 'Devora Nissenbaum';
  const produits = cmd.produits.map(p => `- ${p.nom} ×${p.quantite} : ${p.prix * p.quantite}€`).join('\n');
  const text = `Objet: Confirmation de commande ${cmd.numero}\n\nBonjour ${client.prenom||''},\n\nNous confirmons la réception de votre commande ${cmd.numero}.\n\nDétail :\n${produits}\n\nTotal : ${cmd.montantTotal}€\nMontant payé : ${cmd.montantPaye}€\nRestant dû : ${cmd.montantTotal - cmd.montantPaye}€\n\nMerci pour votre confiance.\nCordialement,\n${nom}`;
  navigator.clipboard.writeText(text).then(() => showToast('Email copié dans le presse-papiers 📋'));
}

function copyEmailClient(clientId) {
  db = loadDb();
  const client = db.clients.find(c => c.id === clientId);
  if (!client) return;
  navigator.clipboard.writeText(client.email).then(() => showToast('Email copié : ' + client.email));
}

function openNewCommandeForClient(clientId) {
  showView('commandes');
  renderCommandesList();
  showToast('Fonctionnalité "nouvelle commande directe" — utilisez le formulaire de commande', 'info');
}

// ===== SETTINGS =====
function renderSettings() {
  db = loadDb();
  const p = db.parametres;
  document.getElementById('set-nom').value = p.nomBoutique || '';
  document.getElementById('set-whatsapp').value = p.whatsapp || '';
  document.getElementById('set-email').value = p.email || '';
  document.getElementById('set-lien-paiement').value = p.lienPaiementBase || '';
  document.getElementById('set-devise').value = p.devise || '€';
}

function saveSettings() {
  db = loadDb();
  db.parametres.nomBoutique = document.getElementById('set-nom').value.trim();
  db.parametres.whatsapp = document.getElementById('set-whatsapp').value.trim();
  db.parametres.email = document.getElementById('set-email').value.trim();
  db.parametres.lienPaiementBase = document.getElementById('set-lien-paiement').value.trim();
  db.parametres.devise = document.getElementById('set-devise').value;
  saveDb(db);
  showToast('Paramètres sauvegardés ✓');
}

function changePassword() {
  const current = document.getElementById('set-pwd-current').value;
  const newPwd = document.getElementById('set-pwd-new').value;
  const confirm = document.getElementById('set-pwd-confirm').value;
  db = loadDb();
  if (current !== db.parametres.motDePasse) { showToast('Mot de passe actuel incorrect', 'error'); return; }
  if (newPwd.length < 4) { showToast('Le nouveau mot de passe doit contenir au moins 4 caractères', 'error'); return; }
  if (newPwd !== confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return; }
  db.parametres.motDePasse = newPwd;
  saveDb(db);
  document.getElementById('set-pwd-current').value = '';
  document.getElementById('set-pwd-new').value = '';
  document.getElementById('set-pwd-confirm').value = '';
  showToast('Mot de passe modifié ✓');
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.addEventListener('click', e => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    if (e.target === m) m.style.display = 'none';
  });
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast toast-' + type + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== SEARCH =====
function handleSearch(q) {
  searchQuery = q;
  if (currentView === 'clients') renderClientsList();
  else if (currentView === 'commandes') renderCommandesList();
}

// ===== UTILS =====
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function exportClients() {
  db = loadDb();
  const rows = [['Prénom','Nom','Téléphone','Email','Adresse','Date création']];
  db.clients.forEach(c => rows.push([c.prenom, c.nom, c.telephone, c.email, c.adresse||'', formatDate(c.dateCreation)]));
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'clients_devora.csv'; a.click();
  showToast('Export CSV téléchargé');
}

function exportCommandes() {
  db = loadDb();
  const rows = [['N°','Client','Date','Produits','Total','Payé','Statut commande','Statut paiement']];
  db.commandes.forEach(c => {
    const client = db.clients.find(cl => cl.id === c.clientId);
    const nom = client ? `${client.prenom} ${client.nom}` : `${c.clientInfo?.prenom||''} ${c.clientInfo?.nom||''}`;
    rows.push([c.numero, nom, formatDate(c.dateCreation), c.produits.map(p=>p.nom).join('; '), c.montantTotal, c.montantPaye, STATUT_COMMANDE[c.statutCommande]?.label||c.statutCommande, STATUT_PAIEMENT[c.statutPaiement]?.label||c.statutPaiement]);
  });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'commandes_devora.csv'; a.click();
  showToast('Export CSV téléchargé');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    showApp();
  } else {
    showLogin();
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const pwd = document.getElementById('login-password').value;
    if (login(pwd)) {
      showApp();
    } else {
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-password').value = '';
    }
  });

  // Search
  document.getElementById('global-search').addEventListener('input', e => handleSearch(e.target.value));

  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const view = link.dataset.view;
      db = loadDb();
      if (view === 'dashboard') renderDashboard();
      else if (view === 'clients') { renderClientsList(); }
      else if (view === 'commandes') { renderCommandesList(); }
      else if (view === 'settings') renderSettings();
      showView(view);
      document.getElementById('mobile-sidebar').classList.remove('open');
    });
  });

  // Mobile sidebar
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('mobile-sidebar').classList.toggle('open');
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatut = btn.dataset.filter;
      renderCommandesList();
    });
  });
});
