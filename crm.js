/* ============================================================
   DEVORA NISSENBAUM — CRM v2
   Clients · Commandes · Entretien · Stock · Marketing · Rappels
   Données locales (localStorage) + backup JSON
   ============================================================ */

const DB_KEY = 'devora_crm';
const SESS = 'devora_session';
const DEFAULT_PWD = 'admin2026';

/* ---------- CATALOGUE / DEMO ---------- */
const CATALOGUE = [
  { id:'nat-1', nom:'Perruque Naturelle Lisse', categorie:'naturelle', prix:250, cout:120, stock:5, stockMin:2, actif:true },
  { id:'nat-2', nom:'Perruque Naturelle Bouclée', categorie:'naturelle', prix:280, cout:140, stock:3, stockMin:2, actif:true },
  { id:'nat-3', nom:'Perruque Naturelle Ondulée', categorie:'naturelle', prix:260, cout:130, stock:4, stockMin:2, actif:true },
  { id:'nat-4', nom:'Perruque Naturelle Longue', categorie:'naturelle', prix:320, cout:160, stock:2, stockMin:2, actif:true },
  { id:'syn-1', nom:'Perruque Synthétique Longue', categorie:'synthetique', prix:120, cout:45, stock:8, stockMin:3, actif:true },
  { id:'syn-2', nom:'Perruque Synthétique Mi-Longue', categorie:'synthetique', prix:95, cout:38, stock:6, stockMin:3, actif:true },
  { id:'syn-3', nom:'Perruque Synthétique Lisse', categorie:'synthetique', prix:85, cout:32, stock:10, stockMin:3, actif:true },
  { id:'mil-1', nom:'Perruque Mi-Longue Ondulée', categorie:'mi_longue', prix:175, cout:80, stock:4, stockMin:2, actif:true },
  { id:'mil-2', nom:'Perruque Mi-Longue Lisse', categorie:'mi_longue', prix:155, cout:70, stock:5, stockMin:2, actif:true },
  { id:'mil-3', nom:'Perruque Mi-Longue Bouclée', categorie:'mi_longue', prix:185, cout:85, stock:1, stockMin:2, actif:true },
  { id:'cou-1', nom:'Perruque Courte Chic', categorie:'courte', prix:150, cout:65, stock:3, stockMin:2, actif:true },
  { id:'cou-2', nom:'Perruque Courte Pixie', categorie:'courte', prix:135, cout:58, stock:4, stockMin:2, actif:true },
  { id:'svc-1', nom:'Nettoyage Simple', categorie:'service', prix:25, cout:5, stock:999, stockMin:0, actif:true },
  { id:'svc-2', nom:'Nettoyage + Brushing', categorie:'service', prix:45, cout:8, stock:999, stockMin:0, actif:true },
  { id:'svc-3', nom:'Nettoyage + Traitement Complet', categorie:'service', prix:65, cout:12, stock:999, stockMin:0, actif:true },
];

const TAGS = {
  vip:      { label:'VIP', cls:'chip-gold' },
  medical:  { label:'Médical', cls:'chip-blue' },
  sheitel:  { label:'Sheitel', cls:'chip-purple' },
  mariee:   { label:'Mariée', cls:'chip-red' },
  grossiste:{ label:'Grossiste', cls:'chip-green' },
  nouveau:  { label:'Nouveau', cls:'chip-gray' },
};

const DEMO_CLIENTS = [
  { id:'cl-001', prenom:'Sophie', nom:'Martin', telephone:'+33612345678', email:'sophie.martin@gmail.com', adresse:'12 rue de la Paix, 75001 Paris', notes:'Préfère le châtain', tags:['vip'], dateNaissance:'1985-06-09', tourTete:'', couleurPref:'Châtain', source:'instagram', points:120, parrainPar:'', dateCreation:'2025-01-15T10:00:00Z', actif:true },
  { id:'cl-002', prenom:'Aminata', nom:'Koné', telephone:'+33698765432', email:'aminata.kone@hotmail.fr', adresse:'45 avenue Jean Jaurès, 69007 Lyon', notes:'', tags:['mariee'], dateNaissance:'1992-11-22', tourTete:'56cm', couleurPref:'Noir', source:'bouche', points:40, parrainPar:'cl-001', dateCreation:'2025-08-20T14:00:00Z', actif:true },
  { id:'cl-003', prenom:'Nadia', nom:'Benali', telephone:'+33756789012', email:'nadia.benali@outlook.com', adresse:'8 bd Michelet, 13008 Marseille', notes:'Suivi médical', tags:['medical'], dateNaissance:'1978-06-04', tourTete:'54cm', couleurPref:'Brun', source:'google', points:0, parrainPar:'', dateCreation:'2026-03-10T09:30:00Z', actif:true },
];

const now = () => new Date().toISOString();
const DEMO_COMMANDES = [
  { id:'cmd-001', numero:'CMD-2025-001', clientId:'cl-001', clientInfo:demoInfo('cl-001'),
    produits:[{id:'nat-1',nom:'Perruque Naturelle Lisse',categorie:'naturelle',prix:250,quantite:1,note:''}],
    montantTotal:250, montantPaye:250, statutPaiement:'paye', modePaiement:'virement',
    statutCommande:'livree', lienPaiement:'', notes:'', avisDemande:true,
    dateCreation:'2025-09-20T11:00:00Z', dateValidation:'2025-09-20T12:00:00Z', source:'direct' },
  { id:'cmd-002', numero:'CMD-2026-002', clientId:'cl-002', clientInfo:demoInfo('cl-002'),
    produits:[{id:'mil-1',nom:'Perruque Mi-Longue Ondulée',categorie:'mi_longue',prix:175,quantite:1,note:'couleur noire'},{id:'svc-2',nom:'Nettoyage + Brushing',categorie:'service',prix:45,quantite:1,note:''}],
    montantTotal:220, montantPaye:100, statutPaiement:'partiel', modePaiement:'paypal',
    statutCommande:'validee', lienPaiement:'https://paypal.me/exemple/120', notes:'Acompte reçu', avisDemande:false,
    dateCreation:'2026-04-05T15:00:00Z', dateValidation:'2026-04-05T16:30:00Z', source:'formulaire' },
  { id:'cmd-003', numero:'CMD-2026-003', clientId:null, clientInfo:demoInfo('cl-003'),
    produits:[{id:'cou-1',nom:'Perruque Courte Chic',categorie:'courte',prix:150,quantite:2,note:'une noire, une marron'}],
    montantTotal:300, montantPaye:0, statutPaiement:'en_attente', modePaiement:'',
    statutCommande:'en_attente', lienPaiement:'', notes:'Via formulaire site', avisDemande:false,
    dateCreation:'2026-05-28T09:00:00Z', dateValidation:null, source:'formulaire' },
];
function demoInfo(id){ const c=DEMO_CLIENTS.find(x=>x.id===id); return {prenom:c.prenom,nom:c.nom,email:c.email,telephone:c.telephone,adresse:c.adresse}; }

const DEMO_ENTRETIENS = [
  { id:'ent-001', clientId:'cl-001', description:'Perruque naturelle lisse châtain', prix:45, statut:'en_cours', dateRecu:'2026-05-29T10:00:00Z', datePrevu:'2026-06-03', notes:'Brushing demandé' },
  { id:'ent-002', clientId:'cl-003', description:'Perruque courte noire', prix:25, statut:'recu', dateRecu:'2026-06-01T14:00:00Z', datePrevu:'2026-06-04', notes:'' },
];

/* ---------- DATA LAYER ---------- */
function loadDb(){
  let db;
  try{ db = JSON.parse(localStorage.getItem(DB_KEY)); }catch(e){ db=null; }
  if(!db) return initDb();
  // migration / defaults
  db.clients = db.clients || [];
  db.commandes = db.commandes || [];
  db.produits = (db.produits && db.produits.length) ? db.produits : CATALOGUE;
  db.entretiens = db.entretiens || [];
  db.parametres = db.parametres || {};
  const p = db.parametres;
  if(!p.motDePasse) p.motDePasse = DEFAULT_PWD;
  if(!p.nomBoutique) p.nomBoutique = 'Devora Nissenbaum';
  if(p.whatsapp===undefined) p.whatsapp='';
  if(p.email===undefined) p.email='';
  if(p.lienPaiementBase===undefined) p.lienPaiementBase='';
  if(p.devise===undefined) p.devise='€';
  if(p.pointsParEuro===undefined) p.pointsParEuro=1;
  if(p.delaiEntretien===undefined) p.delaiEntretien=90;     // jours
  if(p.delaiRenouvellement===undefined) p.delaiRenouvellement=365;
  if(p.remiseParrainage===undefined) p.remiseParrainage=10; // %
  if(!db.lastCommandeNum) db.lastCommandeNum = db.commandes.length;
  // ensure client fields
  db.clients.forEach(c=>{ if(!c.tags)c.tags=[]; if(c.points===undefined)c.points=0; });
  // ensure produit fields
  db.produits.forEach(p=>{ if(p.cout===undefined)p.cout=0; if(p.stock===undefined)p.stock=0; if(p.stockMin===undefined)p.stockMin=2; });
  saveDb(db);
  return db;
}
function initDb(){
  const db = {
    clients: JSON.parse(JSON.stringify(DEMO_CLIENTS)),
    commandes: JSON.parse(JSON.stringify(DEMO_COMMANDES)),
    produits: JSON.parse(JSON.stringify(CATALOGUE)),
    entretiens: JSON.parse(JSON.stringify(DEMO_ENTRETIENS)),
    parametres:{ nomBoutique:'Devora Nissenbaum', whatsapp:'', email:'', motDePasse:DEFAULT_PWD, lienPaiementBase:'', devise:'€', pointsParEuro:1, delaiEntretien:90, delaiRenouvellement:365, remiseParrainage:10 },
    lastCommandeNum:3
  };
  saveDb(db); return db;
}
function saveDb(d){ localStorage.setItem(DB_KEY, JSON.stringify(d)); }
function gid(p){ return (p||'id')+'-'+Math.random().toString(36).slice(2,9); }

/* ---------- STATE ---------- */
let db = loadDb();
let view = 'dashboard';
let q = '';
let clientFilter = 'all';
let cmdFilter = 'all';
let curClient=null, curCmd=null;
let modalTagsTmp=[];

/* ---------- LABELS ---------- */
const SC = {
  en_attente:{l:'En attente',c:'chip-amber'}, validee:{l:'Validée',c:'chip-green'},
  en_cours:{l:'En préparation',c:'chip-blue'}, livree:{l:'Livrée',c:'chip-green'}, annulee:{l:'Annulée',c:'chip-red'}
};
const SP = {
  en_attente:{l:'Non payé',c:'chip-red'}, partiel:{l:'Partiel',c:'chip-amber'},
  paye:{l:'Payé',c:'chip-green'}, annule:{l:'Annulé',c:'chip-gray'}
};
const SE = {
  recu:{l:'Reçu',c:'chip-gray'}, en_cours:{l:'En cours',c:'chip-blue'},
  pret:{l:'Prêt',c:'chip-green'}, recupere:{l:'Récupéré',c:'chip-gold'}
};
const CAT = { naturelle:'Naturelle', synthetique:'Synthétique', mi_longue:'Mi-longue', courte:'Courte', service:'Service' };
const MP = { '':'—', virement:'Virement', carte:'Carte', especes:'Espèces', cheque:'Chèque', paypal:'PayPal', lydia:'Lydia/Sumeria' };
const SRC = { '':'—', instagram:'Instagram', facebook:'Facebook', tiktok:'TikTok', google:'Google', bouche:'Bouche-à-oreille', parrainage:'Parrainage', boutique:'Boutique', autre:'Autre' };

/* ---------- HELPERS ---------- */
const cur = () => db.parametres.devise || '€';
const money = n => (Math.round(n*100)/100).toLocaleString('fr-FR') + cur();
function chip(o){ return `<span class="chip ${o.c}">${o.l}</span>`; }
function scChip(s){ return chip(SC[s]||SC.en_attente); }
function spChip(s){ return chip(SP[s]||SP.en_attente); }
function seChip(s){ return chip(SE[s]||SE.recu); }
function tagPills(tags){ return (tags||[]).map(t=>TAGS[t]?`<span class="chip ${TAGS[t].cls}">${TAGS[t].label}</span>`:'').join(' '); }
function fdate(iso){ if(!iso)return '—'; const d=new Date(iso); return isNaN(d)?'—':d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}); }
function fdateLong(iso){ const d=new Date(iso); return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
function daysSince(iso){ if(!iso)return null; return Math.floor((Date.now()-new Date(iso))/864e5); }
function initials(c){ return ((c.prenom?.[0]||'')+(c.nom?.[0]||'')).toUpperCase()||'?'; }
function clientName(c){ return c?`${c.prenom} ${c.nom}`:'—'; }
function cmdClientName(cmd){ const c=db.clients.find(x=>x.id===cmd.clientId); return c?clientName(c):`${cmd.clientInfo?.prenom||''} ${cmd.clientInfo?.nom||''}`.trim()||'Client inconnu'; }
function el(id){ return document.getElementById(id); }
function esc(s){ return (s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

/* ---------- ANALYTICS ---------- */
function clientStats(id){
  const cmds = db.commandes.filter(c=>c.clientId===id && c.statutCommande!=='annulee');
  const ca = cmds.reduce((s,c)=>s+c.montantTotal,0);
  const paye = cmds.reduce((s,c)=>s+c.montantPaye,0);
  const last = cmds.map(c=>c.dateCreation).sort().pop();
  return { nb:cmds.length, ca, paye, du:ca-paye, last };
}
function rfm(id){
  const s = clientStats(id);
  if(s.nb===0) return { label:'Prospect', cls:'chip-gray' };
  const rec = daysSince(s.last);
  if(s.ca>=400 && s.nb>=2) return { label:'Fidèle premium', cls:'chip-gold' };
  if(rec!==null && rec>365) return { label:'À réactiver', cls:'chip-red' };
  if(s.nb>=2) return { label:'Récurrente', cls:'chip-green' };
  return { label:'Nouvelle', cls:'chip-blue' };
}
function caParMois(nMois=6){
  const out=[]; const base=new Date(); base.setDate(1);
  for(let i=nMois-1;i>=0;i--){
    const d=new Date(base.getFullYear(),base.getMonth()-i,1);
    const key=d.getFullYear()+'-'+(d.getMonth());
    const total=db.commandes.filter(c=>{ const cd=new Date(c.dateCreation); return cd.getFullYear()===d.getFullYear()&&cd.getMonth()===d.getMonth()&&c.statutCommande!=='annulee'; }).reduce((s,c)=>s+c.montantTotal,0);
    out.push({ label:d.toLocaleDateString('fr-FR',{month:'short'}), total });
  }
  return out;
}
function bestSellers(n=5){
  const map={};
  db.commandes.filter(c=>c.statutCommande!=='annulee').forEach(c=>c.produits.forEach(p=>{
    if(!map[p.id]) map[p.id]={nom:p.nom,qte:0,ca:0,cat:p.categorie};
    map[p.id].qte+=p.quantite; map[p.id].ca+=p.prix*p.quantite;
  }));
  return Object.values(map).sort((a,b)=>b.qte-a.qte).slice(0,n);
}
function globalStats(){
  const active = db.commandes.filter(c=>c.statutCommande!=='annulee');
  const ca = active.filter(c=>c.statutPaiement==='paye').reduce((s,c)=>s+c.montantTotal,0);
  const caTotal = active.reduce((s,c)=>s+c.montantTotal,0);
  const du = active.reduce((s,c)=>s+(c.montantTotal-c.montantPaye),0);
  const panier = active.length? caTotal/active.length : 0;
  return {
    clients: db.clients.filter(c=>c.actif!==false).length,
    commandes: active.length,
    ca, du, panier,
    enAttente: db.commandes.filter(c=>c.statutCommande==='en_attente').length,
  };
}

/* ---------- REMINDERS (auto) ---------- */
function getRappels(){
  const out=[];
  const today=new Date();
  // anniversaires (7 jours)
  db.clients.forEach(c=>{
    if(c.dateNaissance){
      const dn=new Date(c.dateNaissance);
      const next=new Date(today.getFullYear(),dn.getMonth(),dn.getDate());
      let diff=Math.ceil((next-today)/864e5);
      if(diff<0){ next.setFullYear(today.getFullYear()+1); diff=Math.ceil((next-today)/864e5); }
      if(diff<=14) out.push({type:'anniversaire',clientId:c.id,client:c,jours:diff,date:next.toISOString(),
        label:`Anniversaire de ${clientName(c)}`, sub:diff===0?"Aujourd'hui 🎂":`Dans ${diff} jour(s)`, ic:'🎂', cls:'chip-purple'});
    }
  });
  // entretien & renouvellement basés sur dernière commande perruque
  db.clients.forEach(c=>{
    const cmds=db.commandes.filter(x=>x.clientId===c.id && x.statutCommande!=='annulee' && x.produits.some(p=>p.categorie!=='service'));
    if(!cmds.length) return;
    const last=cmds.map(x=>x.dateCreation).sort().pop();
    const dj=daysSince(last);
    // a-t-il un entretien récent ?
    const entRecent=db.entretiens.some(e=>e.clientId===c.id && daysSince(e.dateRecu)<db.parametres.delaiEntretien);
    if(dj>=db.parametres.delaiEntretien && dj<db.parametres.delaiRenouvellement && !entRecent){
      out.push({type:'entretien',clientId:c.id,client:c,jours:-dj,date:last,
        label:`Entretien conseillé — ${clientName(c)}`, sub:`Dernier achat il y a ${dj} jours`, ic:'🫧', cls:'chip-blue'});
    }
    if(dj>=db.parametres.delaiRenouvellement){
      out.push({type:'renouvellement',clientId:c.id,client:c,jours:-dj,date:last,
        label:`Renouvellement — ${clientName(c)}`, sub:`Dernier achat il y a ${Math.floor(dj/30)} mois`, ic:'♻️', cls:'chip-gold'});
    }
  });
  // entretiens prêts à récupérer
  db.entretiens.filter(e=>e.statut==='pret').forEach(e=>{
    const c=db.clients.find(x=>x.id===e.clientId);
    out.push({type:'recup',clientId:e.clientId,client:c,jours:0,date:e.datePrevu,
      label:`Entretien prêt — ${clientName(c)}`, sub:'À récupérer', ic:'📦', cls:'chip-green'});
  });
  return out.sort((a,b)=>a.jours-b.jours);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const NAV = [
  { id:'dashboard', label:'Accueil', grp:'principal', icon:icoHome() },
  { id:'clients', label:'Clients', grp:'principal', icon:icoUsers() },
  { id:'commandes', label:'Commandes', grp:'principal', icon:icoBag() },
  { id:'entretien', label:'Entretien', grp:'principal', icon:icoSparkle() },
  { id:'rappels', label:'Rappels', grp:'pilotage', icon:icoBell() },
  { id:'marketing', label:'Marketing', grp:'pilotage', icon:icoMega() },
  { id:'stock', label:'Stock & Produits', grp:'pilotage', icon:icoBox() },
  { id:'reglages', label:'Réglages', grp:'pilotage', icon:icoGear() },
];
const MOBILE_PRIMARY = ['dashboard','clients','commandes','entretien'];

function buildNav(){
  // sidebar
  const groups={};
  NAV.forEach(n=>{ (groups[n.grp]=groups[n.grp]||[]).push(n); });
  let h='';
  const gl={principal:'Principal',pilotage:'Pilotage'};
  Object.keys(groups).forEach(g=>{
    h+=`<div class="side-group">${gl[g]||g}</div>`;
    groups[g].forEach(n=> h+=`<button class="nav-item" data-nav="${n.id}" onclick="go('${n.id}')">${n.icon}<span>${n.label}</span><span class="nav-badge" data-badge="${n.id}" style="display:none"></span></button>`);
  });
  el('side-nav').innerHTML=h;
  // mobile bottom
  let m='';
  MOBILE_PRIMARY.forEach(id=>{ const n=NAV.find(x=>x.id===id); m+=`<button class="mnav" data-mnav="${id}" onclick="go('${id}')">${n.icon}<span>${n.label}</span><span class="nav-badge" data-mbadge="${id}" style="display:none"></span></button>`; });
  m+=`<button class="mnav" onclick="openMore()">${icoMore()}<span>Plus</span></button>`;
  el('mobile-nav').innerHTML=m;
  // more sheet
  let mm='';
  NAV.filter(n=>!MOBILE_PRIMARY.includes(n.id)).forEach(n=> mm+=`<button class="mm-item" onclick="closeMore();go('${n.id}')">${n.icon}<span>${n.label}</span></button>`);
  mm+=`<a class="mm-item" href="index.html"><span>🌐</span><span>Voir le site</span></a>`;
  mm+=`<button class="mm-item" onclick="logout()"><span>↩︎</span><span>Déconnexion</span></button>`;
  el('mm-grid').innerHTML=mm;
}
function updateBadges(){
  const s=globalStats();
  const rapps=getRappels().filter(r=>r.jours<=0 || r.type==='anniversaire'&&r.jours<=7).length;
  setBadge('commandes', s.enAttente);
  setBadge('rappels', rapps);
}
function setBadge(id,n){
  document.querySelectorAll(`[data-badge="${id}"],[data-mbadge="${id}"]`).forEach(b=>{
    if(n>0){ b.textContent=n; b.style.display=''; } else b.style.display='none';
  });
}
function go(v){
  view=v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
  el('v-'+v)?.classList.add('on');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===v));
  document.querySelectorAll('[data-mnav]').forEach(b=>b.classList.toggle('on',b.dataset.mnav===v));
  render(v);
  window.scrollTo(0,0);
}
function render(v){
  db=loadDb();
  ({dashboard:renderDashboard,clients:renderClients,client:renderClient,commandes:renderCommandes,
    commande:renderCommande,entretien:renderEntretien,stock:renderStock,marketing:renderMarketing,
    rappels:renderRappels,reglages:renderReglages}[v]||(()=>{}))();
  updateBadges();
}
function openMore(){ el('mobile-more').classList.add('show'); }
function closeMore(){ el('mobile-more').classList.remove('show'); }

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const s=globalStats();
  const cm=caParMois(6);
  const maxCa=Math.max(...cm.map(m=>m.total),1);
  const best=bestSellers(5);
  const rapps=getRappels().filter(r=>r.jours<=7).slice(0,5);
  const impayes=db.commandes.filter(c=>c.statutCommande!=='annulee' && (c.montantTotal-c.montantPaye)>0)
    .sort((a,b)=>(b.montantTotal-b.montantPaye)-(a.montantTotal-a.montantPaye)).slice(0,4);
  const recent=[...db.commandes].sort((a,b)=>new Date(b.dateCreation)-new Date(a.dateCreation)).slice(0,5);

  el('v-dashboard').innerHTML=`
    <div class="page-head">
      <div><div class="page-title">Tableau de bord</div><div class="page-sub">${fdateLong(now())}</div></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-soft btn-sm" onclick="exportBackup()">⬇︎ Sauvegarde</button>
      </div>
    </div>

    ${s.enAttente>0?`<div class="alert alert-amber">⚠️ <span>${s.enAttente} commande(s) en attente de validation.</span><b style="margin-left:auto" onclick="cmdFilter='en_attente';go('commandes')">Traiter →</b></div>`:''}

    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">${icoUsers(14)} Clients</div><div class="stat-val">${s.clients}</div></div>
      <div class="stat"><div class="stat-lbl">${icoBag(14)} Commandes</div><div class="stat-val">${s.commandes}</div></div>
      <div class="stat"><div class="stat-lbl">💰 CA encaissé</div><div class="stat-val" style="color:var(--accent-d)">${money(s.ca)}</div></div>
      <div class="stat"><div class="stat-lbl">🧾 Panier moyen</div><div class="stat-val">${money(s.panier)}</div><div class="stat-sub">Impayés : ${money(s.du)}</div></div>
    </div>

    <div class="grid-2-1">
      <div class="card">
        <div class="card-h"><span class="card-t">Chiffre d'affaires — 6 mois</span></div>
        <div class="card-b">
          <div class="bars">
            ${cm.map(m=>`<div class="bar-col"><div class="bar-val">${m.total?money(m.total).replace(cur(),''):''}</div><div class="bar" style="height:${m.total/maxCa*100}%"></div><div class="bar-lbl">${m.label}</div></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><span class="card-t">Meilleures ventes</span></div>
        <div class="card-b">
          ${best.length?best.map((b,i)=>`<div class="lrow"><div class="avatar" style="background:var(--surface-2);color:var(--accent-d)">${i+1}</div><div class="lrow-main"><div class="lrow-name">${esc(b.nom)}</div><div class="lrow-sub">${b.qte} vendus · ${money(b.ca)}</div></div></div>`).join(''):'<div class="empty">Pas encore de ventes</div>'}
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:1.2rem">
      <div class="card">
        <div class="card-h"><span class="card-t">Rappels à venir</span><button class="btn btn-soft btn-sm" onclick="go('rappels')">Tout voir</button></div>
        <div class="card-b">
          ${rapps.length?rapps.map(r=>`<div class="lrow" style="cursor:pointer" onclick="openClient('${r.clientId}')"><div class="avatar">${r.ic}</div><div class="lrow-main"><div class="lrow-name">${esc(r.label)}</div><div class="lrow-sub">${r.sub}</div></div><span class="chip ${r.cls}">${({anniversaire:'Anniv.',entretien:'Entretien',renouvellement:'Renouv.',recup:'Prêt'})[r.type]}</span></div>`).join(''):'<div class="empty">Aucun rappel cette semaine ✨</div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-h"><span class="card-t">Impayés prioritaires</span></div>
        <div class="card-b">
          ${impayes.length?impayes.map(c=>`<div class="lrow" style="cursor:pointer" onclick="openCommande('${c.id}')"><div class="avatar" style="background:var(--red-soft);color:var(--red)">!</div><div class="lrow-main"><div class="lrow-name">${esc(cmdClientName(c))}</div><div class="lrow-sub">${c.numero}</div></div><div style="text-align:right"><div style="font-weight:700;color:var(--red)">${money(c.montantTotal-c.montantPaye)}</div><button class="btn btn-green btn-sm" style="margin-top:.2rem;padding:.2rem .5rem" onclick="event.stopPropagation();waRappel('${c.id}')">WhatsApp</button></div></div>`).join(''):'<div class="empty">Aucun impayé ✅</div>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:1.2rem">
      <div class="card-h"><span class="card-t">Commandes récentes</span><button class="btn btn-soft btn-sm" onclick="go('commandes')">Tout voir</button></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th><th>Paiement</th></tr></thead>
        <tbody>${recent.map(c=>`<tr class="clk" onclick="openCommande('${c.id}')"><td class="cell-strong">${c.numero}</td><td>${esc(cmdClientName(c))}</td><td class="cell-sub">${fdate(c.dateCreation)}</td><td class="cell-strong">${money(c.montantTotal)}</td><td>${scChip(c.statutCommande)}</td><td>${spChip(c.statutPaiement)}</td></tr>`).join('')}</tbody>
      </table></div>
    </div>
  `;
}

/* ============================================================
   CLIENTS
   ============================================================ */
function renderClients(){
  let list=db.clients.filter(c=>c.actif!==false);
  if(clientFilter!=='all') list=list.filter(c=>(c.tags||[]).includes(clientFilter));
  if(q){ const s=q.toLowerCase(); list=list.filter(c=>`${c.prenom} ${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(s)); }
  list.sort((a,b)=>`${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`));

  el('v-clients').innerHTML=`
    <div class="page-head">
      <div><div class="page-title">Clients</div><div class="page-sub">${list.length} client(s)</div></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-soft btn-sm" onclick="exportCSV('clients')">⬇︎ CSV</button>
        <button class="btn btn-primary" onclick="openClientModal()">+ Nouveau client</button>
      </div>
    </div>
    <div class="filters">
      <button class="filt ${clientFilter==='all'?'on':''}" onclick="clientFilter='all';renderClients()">Tous</button>
      ${Object.entries(TAGS).map(([k,v])=>`<button class="filt ${clientFilter===k?'on':''}" onclick="clientFilter='${k}';renderClients()">${v.label}</button>`).join('')}
    </div>
    <div class="card"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Client</th><th>Contact</th><th>Segment</th><th>Cmds</th><th>CA</th><th>Points</th><th></th></tr></thead>
      <tbody>
      ${list.length?list.map(c=>{ const s=clientStats(c.id); const r=rfm(c.id); return `<tr class="clk" onclick="openClient('${c.id}')">
        <td><div style="display:flex;align-items:center;gap:.6rem"><div class="avatar">${initials(c)}</div><div><div class="cell-strong">${esc(clientName(c))}</div><div>${tagPills(c.tags)}</div></div></div></td>
        <td class="cell-sub">${esc(c.telephone)}<br>${esc(c.email)}</td>
        <td><span class="chip ${r.cls}">${r.label}</span></td>
        <td>${s.nb}</td>
        <td class="cell-strong">${money(s.ca)}${s.du>0?`<br><span class="cell-sub" style="color:var(--red)">dû ${money(s.du)}</span>`:''}</td>
        <td>${c.points||0}</td>
        <td onclick="event.stopPropagation()"><button class="icon-btn" title="WhatsApp" onclick="waClient('${c.id}')">💬</button></td>
      </tr>`;}).join(''):`<tr><td colspan="7"><div class="empty"><div class="empty-ic">👥</div>Aucun client</div></td></tr>`}
      </tbody>
    </table></div></div>
  `;
}

function openClient(id){ curClient=id; go('client'); }
function renderClient(){
  const c=db.clients.find(x=>x.id===curClient); if(!c){ go('clients'); return; }
  const s=clientStats(c.id); const r=rfm(c.id);
  const cmds=db.commandes.filter(x=>x.clientId===c.id).sort((a,b)=>new Date(b.dateCreation)-new Date(a.dateCreation));
  const ents=db.entretiens.filter(e=>e.clientId===c.id);
  const parrain=c.parrainPar?db.clients.find(x=>x.id===c.parrainPar):null;
  const filleuls=db.clients.filter(x=>x.parrainPar===c.id);

  el('v-client').innerHTML=`
    <button class="back" onclick="go('clients')">← Retour aux clients</button>
    <div class="page-head">
      <div style="display:flex;align-items:center;gap:.9rem">
        <div class="avatar" style="width:52px;height:52px;font-size:1.1rem">${initials(c)}</div>
        <div><div class="page-title">${esc(clientName(c))}</div><div style="margin-top:.3rem">${tagPills(c.tags)} <span class="chip ${r.cls}">${r.label}</span></div></div>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-green" onclick="waClient('${c.id}')">💬 WhatsApp</button>
        <button class="btn btn-ghost" onclick="openClientModal('${c.id}')">✏︎ Modifier</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Commandes</div><div class="stat-val">${s.nb}</div></div>
      <div class="stat"><div class="stat-lbl">CA total</div><div class="stat-val" style="color:var(--accent-d)">${money(s.ca)}</div></div>
      <div class="stat"><div class="stat-lbl">Solde dû</div><div class="stat-val" style="color:${s.du>0?'var(--red)':'var(--green)'}">${money(s.du)}</div></div>
      <div class="stat"><div class="stat-lbl">Points fidélité</div><div class="stat-val">${c.points||0}</div><div class="stat-sub">≈ ${money((c.points||0)/10)} de remise</div></div>
    </div>

    <div class="grid-2">
      <div class="card"><div class="card-h"><span class="card-t">Coordonnées</span></div><div class="card-b">
        <div class="drow"><span class="k">Téléphone</span><span class="v">${esc(c.telephone||'—')}</span></div>
        <div class="drow"><span class="k">Email</span><span class="v">${esc(c.email||'—')}</span></div>
        <div class="drow"><span class="k">Adresse</span><span class="v">${esc(c.adresse||'—')}</span></div>
        <div class="drow"><span class="k">Anniversaire</span><span class="v">${c.dateNaissance?fdate(c.dateNaissance):'—'}</span></div>
        <div class="drow"><span class="k">Source</span><span class="v">${SRC[c.source]||'—'}</span></div>
        <div class="drow"><span class="k">Client depuis</span><span class="v">${fdate(c.dateCreation)}</span></div>
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">Préférences & Parrainage</span></div><div class="card-b">
        <div class="drow"><span class="k">Tour de tête</span><span class="v">${esc(c.tourTete||'—')}</span></div>
        <div class="drow"><span class="k">Couleur préférée</span><span class="v">${esc(c.couleurPref||'—')}</span></div>
        <div class="drow"><span class="k">Parrainée par</span><span class="v">${parrain?`<a onclick="openClient('${parrain.id}')" style="color:var(--accent-d);cursor:pointer">${esc(clientName(parrain))}</a>`:'—'}</span></div>
        <div class="drow"><span class="k">A parrainé</span><span class="v">${filleuls.length?filleuls.map(f=>esc(clientName(f))).join(', '):'—'}</span></div>
        <div class="drow"><span class="k">Notes</span><span class="v">${esc(c.notes||'—')}</span></div>
      </div></div>
    </div>

    <div class="detail-actions">
      <button class="btn btn-primary" onclick="openCommandeModal('${c.id}')">+ Nouvelle commande</button>
      <button class="btn btn-ghost" onclick="openEntretienModal(null,'${c.id}')">+ Déposer un entretien</button>
      <button class="btn btn-soft" onclick="adjustPoints('${c.id}')">★ Ajuster points</button>
      <button class="btn btn-soft" onclick="copyTxt('${esc(c.email)}','Email copié')">📧 Copier email</button>
    </div>

    <div class="card"><div class="card-h"><span class="card-t">Historique des commandes (${cmds.length})</span></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>N°</th><th>Date</th><th>Articles</th><th>Montant</th><th>Cmd</th><th>Paiement</th></tr></thead>
        <tbody>${cmds.length?cmds.map(x=>`<tr class="clk" onclick="openCommande('${x.id}')"><td class="cell-strong">${x.numero}</td><td class="cell-sub">${fdate(x.dateCreation)}</td><td class="cell-sub">${x.produits.map(p=>esc(p.nom)).join(', ')}</td><td class="cell-strong">${money(x.montantTotal)}</td><td>${scChip(x.statutCommande)}</td><td>${spChip(x.statutPaiement)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty">Aucune commande</div></td></tr>`}</tbody>
      </table></div>
    </div>

    ${ents.length?`<div class="card" style="margin-top:1.2rem"><div class="card-h"><span class="card-t">Entretiens (${ents.length})</span></div><div class="card-b">
      ${ents.map(e=>`<div class="lrow"><div class="avatar">🫧</div><div class="lrow-main"><div class="lrow-name">${esc(e.description)}</div><div class="lrow-sub">Reçu le ${fdate(e.dateRecu)} · ${money(e.prix)}</div></div>${seChip(e.statut)}</div>`).join('')}
    </div></div>`:''}
  `;
}

/* ============================================================
   COMMANDES
   ============================================================ */
function renderCommandes(){
  let list=[...db.commandes];
  if(cmdFilter!=='all') list=list.filter(c=>c.statutCommande===cmdFilter||c.statutPaiement===cmdFilter);
  if(q){ const s=q.toLowerCase(); list=list.filter(c=>(c.numero+' '+cmdClientName(c)).toLowerCase().includes(s)); }
  list.sort((a,b)=>new Date(b.dateCreation)-new Date(a.dateCreation));

  el('v-commandes').innerHTML=`
    <div class="page-head">
      <div><div class="page-title">Commandes</div><div class="page-sub">${list.length} commande(s)</div></div>
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-soft btn-sm" onclick="exportCSV('commandes')">⬇︎ CSV</button>
        <button class="btn btn-primary" onclick="openCommandeModal()">+ Nouvelle commande</button>
      </div>
    </div>
    <div class="filters">
      ${[['all','Toutes'],['en_attente','⏳ En attente'],['validee','✓ Validées'],['en_cours','🔧 Préparation'],['livree','📦 Livrées'],['partiel','💳 Partiel']].map(([k,l])=>`<button class="filt ${cmdFilter===k?'on':''}" onclick="cmdFilter='${k}';renderCommandes()">${l}</button>`).join('')}
    </div>
    <div class="card"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>N°</th><th>Client</th><th>Date</th><th>Articles</th><th>Montant</th><th>Cmd</th><th>Paiement</th><th></th></tr></thead>
      <tbody>${list.length?list.map(c=>{ const du=c.montantTotal-c.montantPaye; return `<tr class="clk" onclick="openCommande('${c.id}')">
        <td class="cell-strong">${c.numero}${c.source==='formulaire'?' <span class="chip chip-blue" style="font-size:.6rem">WEB</span>':''}</td>
        <td>${esc(cmdClientName(c))}</td><td class="cell-sub">${fdate(c.dateCreation)}</td>
        <td class="cell-sub">${c.produits.map(p=>esc(p.nom)).join('<br>')}</td>
        <td class="cell-strong">${money(c.montantTotal)}</td><td>${scChip(c.statutCommande)}</td>
        <td>${spChip(c.statutPaiement)}${du>0?`<br><span class="cell-sub" style="color:var(--red)">dû ${money(du)}</span>`:''}</td>
        <td onclick="event.stopPropagation()">${du>0?`<button class="icon-btn" onclick="waRappel('${c.id}')" title="Rappel WhatsApp">💬</button>`:''}</td>
      </tr>`;}).join(''):`<tr><td colspan="8"><div class="empty"><div class="empty-ic">📦</div>Aucune commande</div></td></tr>`}</tbody>
    </table></div></div>
  `;
}

function openCommande(id){ curCmd=id; go('commande'); }
function renderCommande(){
  const c=db.commandes.find(x=>x.id===curCmd); if(!c){ go('commandes'); return; }
  const client=db.clients.find(x=>x.id===c.clientId);
  const info=client||c.clientInfo||{};
  const du=c.montantTotal-c.montantPaye;
  const tel=client?client.telephone:info.telephone;

  let validation='';
  if(c.statutCommande==='en_attente'){
    const dup=findDuplicates(info.email,tel);
    validation=`<div class="card" style="border:2px solid var(--accent);margin-bottom:1.2rem"><div class="card-h"><span class="card-t" style="color:var(--accent-d)">⏳ Validation requise</span></div><div class="card-b">
      ${dup.length?`<div class="alert alert-amber" style="margin:0 0 1rem">⚠️ <span>Client existant détecté</span></div>
        ${dup.map(d=>`<div class="lrow"><div class="avatar">${initials(d)}</div><div class="lrow-main"><div class="lrow-name">${esc(clientName(d))}</div><div class="lrow-sub">${esc(d.email)} · ${esc(d.telephone)}</div></div><button class="btn btn-primary btn-sm" onclick="mergeCmd('${c.id}','${d.id}')">Fusionner</button></div>`).join('')}`
        :`<div class="alert alert-info" style="margin:0 0 1rem">Aucun client existant. Une nouvelle fiche sera créée.</div>`}
      <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">
        <button class="btn btn-primary" onclick="validerCmd('${c.id}')">✓ Valider & créer client</button>
        <button class="btn btn-danger" onclick="annulerCmd('${c.id}')">✕ Refuser</button>
      </div></div></div>`;
  }

  el('v-commande').innerHTML=`
    <button class="back" onclick="go('commandes')">← Retour aux commandes</button>
    <div class="page-head"><div><div class="page-title">${c.numero}</div><div class="page-sub">${esc(cmdClientName(c))} · ${fdate(c.dateCreation)} · ${c.source==='formulaire'?'Commande web':'Saisie directe'}</div></div></div>
    ${validation}
    <div class="grid-2">
      <div class="card"><div class="card-h"><span class="card-t">Client</span>${client?`<button class="btn btn-soft btn-sm" onclick="openClient('${client.id}')">Fiche →</button>`:''}</div><div class="card-b">
        <div class="drow"><span class="k">Nom</span><span class="v">${esc(cmdClientName(c))}</span></div>
        <div class="drow"><span class="k">Téléphone</span><span class="v">${esc(tel||'—')}</span></div>
        <div class="drow"><span class="k">Email</span><span class="v">${esc(info.email||'—')}</span></div>
        <div class="drow"><span class="k">Adresse</span><span class="v">${esc((client?client.adresse:info.adresse)||'—')}</span></div>
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">Paiement</span></div><div class="card-b">
        <div class="drow"><span class="k">Statut commande</span><span class="v">${scChip(c.statutCommande)}</span></div>
        <div class="drow"><span class="k">Statut paiement</span><span class="v">${spChip(c.statutPaiement)}</span></div>
        <div class="drow"><span class="k">Mode</span><span class="v">${MP[c.modePaiement]||'—'}</span></div>
        <div class="drow"><span class="k">Total</span><span class="v" style="color:var(--accent-d);font-weight:700">${money(c.montantTotal)}</span></div>
        <div class="drow"><span class="k">Payé</span><span class="v" style="color:var(--green)">${money(c.montantPaye)}</span></div>
        <div class="drow"><span class="k">Restant dû</span><span class="v" style="color:${du>0?'var(--red)':'var(--green)'};font-weight:700">${money(du)}</span></div>
        ${c.lienPaiement?`<div class="drow"><span class="k">Lien</span><span class="v"><a href="${esc(c.lienPaiement)}" target="_blank" style="color:var(--accent-d);font-size:.78rem;word-break:break-all">${esc(c.lienPaiement)}</a></span></div>`:''}
        ${c.montantTotal>0?`<div style="margin-top:.7rem"><div class="prog"><div class="prog-fill" style="width:${Math.min(100,c.montantPaye/c.montantTotal*100)}%"></div></div></div>`:''}
      </div></div>
    </div>

    <div class="card" style="margin-top:1.2rem"><div class="card-h"><span class="card-t">Articles</span></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Produit</th><th>Catégorie</th><th>Qté</th><th>P.U.</th><th>Total</th><th>Note</th></tr></thead>
        <tbody>${c.produits.map(p=>`<tr><td class="cell-strong">${esc(p.nom)}</td><td>${CAT[p.categorie]||p.categorie}</td><td>${p.quantite}</td><td>${money(p.prix)}</td><td class="cell-strong">${money(p.prix*p.quantite)}</td><td class="cell-sub">${esc(p.note||'—')}</td></tr>`).join('')}
        <tr><td colspan="4" style="text-align:right;font-weight:600">TOTAL</td><td colspan="2" class="cell-strong" style="color:var(--accent-d)">${money(c.montantTotal)}</td></tr></tbody>
      </table></div>
    </div>
    ${c.notes?`<div class="card" style="margin-top:1.2rem"><div class="card-b"><span class="card-t">Notes</span><p style="margin-top:.5rem;color:var(--muted)">${esc(c.notes)}</p></div></div>`:''}

    ${c.statutCommande!=='en_attente'?`<div class="detail-actions">
      <button class="btn btn-primary" onclick="openPaymentModal('${c.id}')">💳 Paiement</button>
      <button class="btn btn-green" onclick="waRappel('${c.id}')">💬 Rappel WhatsApp</button>
      <button class="btn btn-ghost" onclick="openLinkModal('${c.id}')">🔗 Lien paiement</button>
      <button class="btn btn-soft" onclick="cycleStatut('${c.id}')">📦 Statut suivant</button>
      <button class="btn btn-soft" onclick="waConfirm('${c.id}')">✓ Confirmation WA</button>
      <button class="btn btn-soft" onclick="copyFacture('${c.id}')">🧾 Facture</button>
      ${c.statutCommande==='livree'&&!c.avisDemande?`<button class="btn btn-soft" onclick="waAvis('${c.id}')">⭐ Demander un avis</button>`:''}
    </div>`:''}
  `;
}

/* ============================================================
   ENTRETIEN (kanban)
   ============================================================ */
function renderEntretien(){
  const cols=[['recu','Reçu'],['en_cours','En cours'],['pret','Prêt'],['recupere','Récupéré']];
  el('v-entretien').innerHTML=`
    <div class="page-head"><div><div class="page-title">Service Entretien</div><div class="page-sub">${db.entretiens.length} entretien(s) · suivi atelier</div></div>
      <button class="btn btn-primary" onclick="openEntretienModal()">+ Déposer un entretien</button></div>
    <div class="kanban">
      ${cols.map(([k,l])=>{ const items=db.entretiens.filter(e=>e.statut===k); return `<div class="kcol"><div class="kcol-h">${l}<span class="chip chip-gray">${items.length}</span></div>
        ${items.map(e=>{ const c=db.clients.find(x=>x.id===e.clientId); return `<div class="kcard" onclick="openEntretienModal('${e.id}')"><div class="kcard-name">${esc(clientName(c))}</div><div class="kcard-sub">${esc(e.description)}</div><div class="kcard-sub" style="margin-top:.3rem">${money(e.prix)} · prévu ${fdate(e.datePrevu)}</div></div>`;}).join('')||'<div class="empty" style="padding:1rem;font-size:.75rem">Vide</div>'}
      </div>`;}).join('')}
    </div>
    <div class="alert alert-info" style="margin-top:1.2rem">💡 Cliquez sur une carte pour changer son statut, ou prévenir le client par WhatsApp quand c'est prêt.</div>
  `;
}

/* ============================================================
   STOCK & PRODUITS
   ============================================================ */
function renderStock(){
  const prods=db.produits;
  const lowStock=prods.filter(p=>p.categorie!=='service'&&p.stock<=p.stockMin);
  const valStock=prods.filter(p=>p.categorie!=='service').reduce((s,p)=>s+p.stock*p.cout,0);
  const margeMoy=(()=>{ const ps=prods.filter(p=>p.prix>0); if(!ps.length)return 0; return ps.reduce((s,p)=>s+(p.prix-p.cout)/p.prix*100,0)/ps.length; })();

  el('v-stock').innerHTML=`
    <div class="page-head"><div><div class="page-title">Stock & Produits</div><div class="page-sub">${prods.length} produits au catalogue</div></div>
      <button class="btn btn-primary" onclick="openProduitModal()">+ Ajouter un produit</button></div>
    <div class="stat-grid">
      <div class="stat"><div class="stat-lbl">Produits actifs</div><div class="stat-val">${prods.filter(p=>p.actif).length}</div></div>
      <div class="stat"><div class="stat-lbl">Valeur du stock</div><div class="stat-val">${money(valStock)}</div></div>
      <div class="stat"><div class="stat-lbl">Marge moyenne</div><div class="stat-val">${Math.round(margeMoy)}%</div></div>
      <div class="stat ${lowStock.length?'':''}"><div class="stat-lbl">Alertes stock</div><div class="stat-val" style="color:${lowStock.length?'var(--red)':'var(--green)'}">${lowStock.length}</div></div>
    </div>
    ${lowStock.length?`<div class="alert alert-amber">⚠️ <span>Stock bas : ${lowStock.map(p=>esc(p.nom)).join(', ')}</span></div>`:''}
    <div class="card"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Coût</th><th>Marge</th><th>Stock</th><th></th></tr></thead>
      <tbody>${prods.map(p=>{ const marge=p.prix?Math.round((p.prix-p.cout)/p.prix*100):0; const low=p.categorie!=='service'&&p.stock<=p.stockMin; return `<tr class="clk" onclick="openProduitModal('${p.id}')">
        <td class="cell-strong">${esc(p.nom)}${!p.actif?' <span class="chip chip-gray">inactif</span>':''}</td>
        <td>${CAT[p.categorie]||p.categorie}</td><td class="cell-strong">${money(p.prix)}</td><td class="cell-sub">${money(p.cout)}</td>
        <td><span class="chip ${marge>50?'chip-green':marge>25?'chip-amber':'chip-red'}">${marge}%</span></td>
        <td>${p.categorie==='service'?'∞':`<span style="color:${low?'var(--red)':'inherit'};font-weight:${low?'700':'400'}">${p.stock}</span>`}</td>
        <td onclick="event.stopPropagation()"><button class="icon-btn" onclick="openProduitModal('${p.id}')" title="Modifier">✏︎</button></td>
      </tr>`;}).join('')}</tbody>
    </table></div></div>
  `;
}

/* ============================================================
   MARKETING
   ============================================================ */
function renderMarketing(){
  const segments=[
    {k:'all',l:'Tous les clients',n:db.clients.filter(c=>c.actif!==false).length},
    {k:'vip',l:'VIP',n:db.clients.filter(c=>(c.tags||[]).includes('vip')).length},
    {k:'medical',l:'Médical',n:db.clients.filter(c=>(c.tags||[]).includes('medical')).length},
    {k:'sheitel',l:'Sheitel',n:db.clients.filter(c=>(c.tags||[]).includes('sheitel')).length},
    {k:'mariee',l:'Mariée',n:db.clients.filter(c=>(c.tags||[]).includes('mariee')).length},
    {k:'inactif',l:'À réactiver (>1 an)',n:db.clients.filter(c=>{const s=clientStats(c.id);return s.last&&daysSince(s.last)>365;}).length},
  ];
  const avisALD=db.commandes.filter(c=>c.statutCommande==='livree'&&!c.avisDemande);

  el('v-marketing').innerHTML=`
    <div class="page-head"><div><div class="page-title">Marketing</div><div class="page-sub">Campagnes, parrainage & avis</div></div></div>

    <div class="card"><div class="card-h"><span class="card-t">📣 Campagne WhatsApp groupée</span></div><div class="card-b">
      <div class="fg-hint">Choisissez un segment, rédigez votre message, puis ouvrez WhatsApp pour chaque cliente (ouverture une par une — conforme WhatsApp).</div>
      <div class="fg"><label>Segment ciblé</label>
        <select id="camp-seg">${segments.map(s=>`<option value="${s.k}">${s.l} (${s.n})</option>`).join('')}</select></div>
      <div class="fg"><label>Message</label><textarea id="camp-msg" rows="4">Bonjour [prénom] ✨ Découvrez notre nouvelle collection chez ${esc(db.parametres.nomBoutique)} ! Contactez-nous pour plus d'infos 💛</textarea></div>
      <button class="btn btn-green" onclick="launchCampaign()">💬 Lancer la campagne</button>
    </div></div>

    <div class="grid-2" style="margin-top:1.2rem">
      <div class="card"><div class="card-h"><span class="card-t">🎁 Parrainage</span></div><div class="card-b">
        <div class="fg-hint">Remise parrainage actuelle : <b>${db.parametres.remiseParrainage}%</b>. Modifiable dans Réglages.</div>
        ${(()=>{ const top=db.clients.map(c=>({c,n:db.clients.filter(x=>x.parrainPar===c.id).length})).filter(o=>o.n>0).sort((a,b)=>b.n-a.n).slice(0,5);
          return top.length?top.map(o=>`<div class="lrow"><div class="avatar">${initials(o.c)}</div><div class="lrow-main"><div class="lrow-name">${esc(clientName(o.c))}</div><div class="lrow-sub">${o.n} filleul(s)</div></div><span class="chip chip-green">Ambassadrice</span></div>`).join(''):'<div class="empty">Aucun parrainage pour l\'instant.<br>Ajoutez "parrainé par" sur une fiche client.</div>';})()}
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">⭐ Avis à solliciter</span></div><div class="card-b">
        ${avisALD.length?avisALD.slice(0,6).map(c=>`<div class="lrow"><div class="avatar">⭐</div><div class="lrow-main"><div class="lrow-name">${esc(cmdClientName(c))}</div><div class="lrow-sub">${c.numero} · livrée</div></div><button class="btn btn-soft btn-sm" onclick="waAvis('${c.id}')">Demander</button></div>`).join(''):'<div class="empty">Aucun avis en attente ✅</div>'}
      </div></div>
    </div>
  `;
}

/* ============================================================
   RAPPELS
   ============================================================ */
function renderRappels(){
  const rapps=getRappels();
  const groups={ retard:[], semaine:[], plus:[] };
  rapps.forEach(r=>{ if(r.jours<=0)groups.retard.push(r); else if(r.jours<=7)groups.semaine.push(r); else groups.plus.push(r); });
  const block=(title,arr,empty)=>`<div class="card" style="margin-bottom:1.2rem"><div class="card-h"><span class="card-t">${title} (${arr.length})</span></div><div class="card-b">
    ${arr.length?arr.map(r=>`<div class="lrow" style="cursor:pointer" onclick="openClient('${r.clientId}')"><div class="avatar">${r.ic}</div><div class="lrow-main"><div class="lrow-name">${esc(r.label)}</div><div class="lrow-sub">${r.sub}</div></div><div style="display:flex;gap:.4rem;align-items:center"><span class="chip ${r.cls}">${({anniversaire:'Anniv.',entretien:'Entretien',renouvellement:'Renouv.',recup:'Prêt'})[r.type]}</span><button class="btn btn-green btn-sm" onclick="event.stopPropagation();waCustom('${r.clientId}','${r.type}')">💬</button></div></div>`).join(''):`<div class="empty">${empty}</div>`}
  </div></div>`;
  el('v-rappels').innerHTML=`
    <div class="page-head"><div><div class="page-title">Rappels intelligents</div><div class="page-sub">Anniversaires · entretien · renouvellement · récupération</div></div></div>
    ${block('🔴 À traiter maintenant',groups.retard,'Rien à traiter ✨')}
    ${block('🟡 Cette semaine',groups.semaine,'Rien cette semaine')}
    ${block('⚪️ À venir',groups.plus,'Rien à venir')}
  `;
}

/* ============================================================
   RÉGLAGES
   ============================================================ */
function renderReglages(){
  const p=db.parametres;
  el('v-reglages').innerHTML=`
    <div class="page-head"><div><div class="page-title">Réglages</div><div class="page-sub">Boutique, fidélité, sécurité & données</div></div></div>
    <div class="grid-2">
      <div class="card"><div class="card-h"><span class="card-t">Boutique</span></div><div class="card-b">
        <div class="fg"><label>Nom de la boutique</label><input id="r-nom" value="${esc(p.nomBoutique)}"></div>
        <div class="fg"><label>Email professionnel</label><input id="r-email" value="${esc(p.email)}"></div>
        <div class="fg"><label>WhatsApp (+33…)</label><input id="r-wa" value="${esc(p.whatsapp)}"></div>
        <div class="fg-2"><div class="fg"><label>Devise</label><select id="r-dev"><option ${p.devise==='€'?'selected':''}>€</option><option ${p.devise==='$'?'selected':''}>$</option><option ${p.devise==='£'?'selected':''}>£</option></select></div>
          <div class="fg"><label>Lien paiement base</label><input id="r-lien" value="${esc(p.lienPaiementBase)}" placeholder="paypal.me/..."></div></div>
        <button class="btn btn-primary btn-block" onclick="saveReglages()">Sauvegarder</button>
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">Fidélité & Rappels</span></div><div class="card-b">
        <div class="fg"><label>Points par € dépensé</label><input type="number" id="r-pts" value="${p.pointsParEuro}"></div>
        <div class="fg"><label>Remise parrainage (%)</label><input type="number" id="r-parr" value="${p.remiseParrainage}"></div>
        <div class="fg"><label>Rappel entretien après (jours)</label><input type="number" id="r-ent" value="${p.delaiEntretien}"></div>
        <div class="fg"><label>Rappel renouvellement après (jours)</label><input type="number" id="r-ren" value="${p.delaiRenouvellement}"></div>
        <button class="btn btn-primary btn-block" onclick="saveReglages()">Sauvegarder</button>
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">Sécurité</span></div><div class="card-b">
        <div class="fg"><label>Mot de passe actuel</label><input type="password" id="r-pc"></div>
        <div class="fg"><label>Nouveau mot de passe</label><input type="password" id="r-pn"></div>
        <div class="fg"><label>Confirmer</label><input type="password" id="r-pf"></div>
        <button class="btn btn-primary btn-block" onclick="changePwd()">Changer le mot de passe</button>
      </div></div>
      <div class="card"><div class="card-h"><span class="card-t">Données (sauvegarde)</span></div><div class="card-b">
        <div class="fg-hint">⚠️ Les données sont stockées dans ce navigateur. Exportez régulièrement une sauvegarde complète pour ne rien perdre, et importez-la sur un autre appareil.</div>
        <button class="btn btn-ghost btn-block" style="margin-bottom:.6rem" onclick="exportBackup()">⬇︎ Télécharger sauvegarde (.json)</button>
        <button class="btn btn-ghost btn-block" style="margin-bottom:.6rem" onclick="el('import-file').click()">⬆︎ Importer une sauvegarde</button>
        <input type="file" id="import-file" accept="application/json" style="display:none" onchange="importBackup(this)">
        <button class="btn btn-soft btn-block" style="margin-bottom:.6rem" onclick="exportCSV('clients')">Export clients CSV</button>
        <button class="btn btn-soft btn-block" style="margin-bottom:.6rem" onclick="exportCSV('commandes')">Export commandes CSV</button>
        <button class="btn btn-danger btn-block" onclick="resetData()">🗑️ Réinitialiser toutes les données</button>
      </div></div>
    </div>
  `;
}

/* ============================================================
   MODALS
   ============================================================ */
function showModal(html){ el('modal').innerHTML=html; el('modal-bg').classList.add('show'); }
function closeModal(){ el('modal-bg').classList.remove('show'); }

/* --- Client modal --- */
function openClientModal(id){
  const c=id?db.clients.find(x=>x.id===id):null;
  modalTagsTmp=c?[...(c.tags||[])]:[];
  const others=db.clients.filter(x=>!c||x.id!==c.id);
  showModal(`
    <div class="modal-h"><div class="modal-t">${c?'Modifier le client':'Nouveau client'}</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg-2"><div class="fg"><label>Prénom *</label><input id="m-prenom" value="${esc(c?.prenom||'')}"></div><div class="fg"><label>Nom *</label><input id="m-nom" value="${esc(c?.nom||'')}"></div></div>
      <div class="fg-2"><div class="fg"><label>Téléphone *</label><input id="m-tel" value="${esc(c?.telephone||'')}" placeholder="+33 6…"></div><div class="fg"><label>Email *</label><input id="m-email" value="${esc(c?.email||'')}"></div></div>
      <div class="fg"><label>Adresse postale</label><input id="m-adr" value="${esc(c?.adresse||'')}"></div>
      <div class="fg-2"><div class="fg"><label>Date de naissance</label><input type="date" id="m-naiss" value="${c?.dateNaissance||''}"></div><div class="fg"><label>Source</label><select id="m-src">${Object.entries(SRC).map(([k,v])=>`<option value="${k}" ${c?.source===k?'selected':''}>${v}</option>`).join('')}</select></div></div>
      <div class="fg-2"><div class="fg"><label>Tour de tête</label><input id="m-tour" value="${esc(c?.tourTete||'')}" placeholder="ex: 56cm"></div><div class="fg"><label>Couleur préférée</label><input id="m-coul" value="${esc(c?.couleurPref||'')}"></div></div>
      <div class="fg"><label>Segments / Tags</label><div class="tag-select" id="m-tags">${Object.entries(TAGS).map(([k,v])=>`<button type="button" class="tag-opt ${modalTagsTmp.includes(k)?'on '+v.cls:''}" data-tag="${k}" onclick="toggleTag('${k}',this)">${v.label}</button>`).join('')}</div></div>
      <div class="fg"><label>Parrainée par</label><select id="m-parr"><option value="">— Personne —</option>${others.map(o=>`<option value="${o.id}" ${c?.parrainPar===o.id?'selected':''}>${esc(clientName(o))}</option>`).join('')}</select></div>
      <div class="fg"><label>Notes internes</label><textarea id="m-notes">${esc(c?.notes||'')}</textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-soft" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveClient(${c?`'${c.id}'`:'null'})">${c?'Enregistrer':'Créer'}</button></div>
  `);
}
function toggleTag(k,btn){
  const i=modalTagsTmp.indexOf(k);
  if(i>=0){ modalTagsTmp.splice(i,1); btn.className='tag-opt'; }
  else { modalTagsTmp.push(k); btn.className='tag-opt on '+TAGS[k].cls; }
}
function saveClient(id){
  const get=x=>el('m-'+x).value.trim();
  if(!get('prenom')||!get('nom')||!get('tel')||!get('email')){ toast('Champs obligatoires manquants','err'); return; }
  db=loadDb();
  const data={ prenom:get('prenom'),nom:get('nom'),telephone:get('tel'),email:get('email'),adresse:get('adr'),
    dateNaissance:el('m-naiss').value,source:el('m-src').value,tourTete:get('tour'),couleurPref:get('coul'),
    tags:[...modalTagsTmp],parrainPar:el('m-parr').value,notes:get('notes') };
  if(id){ const i=db.clients.findIndex(c=>c.id===id); db.clients[i]={...db.clients[i],...data}; }
  else { db.clients.push({ id:gid('cl'),...data,points:0,dateCreation:now(),actif:true }); }
  saveDb(db); closeModal(); toast(id?'Client mis à jour':'Client créé','ok');
  render(view);
}

/* --- Commande modal --- */
let cmdCart=[];
function openCommandeModal(clientId){
  cmdCart=[];
  const clients=db.clients.filter(c=>c.actif!==false);
  showModal(`
    <div class="modal-h"><div class="modal-t">Nouvelle commande</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg"><label>Client</label><select id="cm-client"><option value="">— Nouveau client (saisir infos) —</option>${clients.map(c=>`<option value="${c.id}" ${clientId===c.id?'selected':''}>${esc(clientName(c))} · ${esc(c.telephone)}</option>`).join('')}</select></div>
      <div id="cm-newclient" style="display:${clientId?'none':'block'}">
        <div class="fg-2"><div class="fg"><label>Prénom</label><input id="cm-prenom"></div><div class="fg"><label>Nom</label><input id="cm-nom"></div></div>
        <div class="fg-2"><div class="fg"><label>Téléphone</label><input id="cm-tel"></div><div class="fg"><label>Email</label><input id="cm-email"></div></div>
      </div>
      <div class="fg" style="border-top:1px solid var(--line);padding-top:1rem"><label>Ajouter un produit</label>
        <div style="display:flex;gap:.5rem"><select id="cm-prod" style="flex:1">${db.produits.filter(p=>p.actif).map(p=>`<option value="${p.id}">${esc(p.nom)} — ${money(p.prix)}</option>`).join('')}</select>
        <input type="number" id="cm-qty" value="1" min="1" style="width:60px;text-align:center"><button class="btn btn-soft" onclick="addCartItem()">+</button></div>
      </div>
      <div id="cm-cart"></div>
      <div class="fg"><label>Notes</label><textarea id="cm-notes" rows="2"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-soft" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveCommande()">Créer la commande</button></div>
  `);
  el('cm-client').addEventListener('change',e=>{ el('cm-newclient').style.display=e.target.value?'none':'block'; });
  renderCart();
}
function addCartItem(){
  const pid=el('cm-prod').value; const qty=parseInt(el('cm-qty').value)||1;
  const p=db.produits.find(x=>x.id===pid); if(!p)return;
  cmdCart.push({ id:p.id,nom:p.nom,categorie:p.categorie,prix:p.prix,quantite:qty,note:'' });
  renderCart();
}
function removeCartItem(i){ cmdCart.splice(i,1); renderCart(); }
function renderCart(){
  const t=cmdCart.reduce((s,p)=>s+p.prix*p.quantite,0);
  el('cm-cart').innerHTML=cmdCart.length?`<div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:.7rem;margin-bottom:1rem">
    ${cmdCart.map((p,i)=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0"><span style="flex:1;font-size:.82rem">${esc(p.nom)} ×${p.quantite}</span><b>${money(p.prix*p.quantite)}</b><button class="modal-x" style="font-size:1rem;width:24px;height:24px" onclick="removeCartItem(${i})">×</button></div>`).join('')}
    <div style="display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:.5rem;margin-top:.3rem"><b>Total</b><b style="color:var(--accent-d)">${money(t)}</b></div></div>`:'<div class="fg-hint">Aucun produit ajouté.</div>';
}
function saveCommande(){
  if(!cmdCart.length){ toast('Ajoutez au moins un produit','err'); return; }
  db=loadDb();
  let clientId=el('cm-client').value, clientInfo;
  if(clientId){ const c=db.clients.find(x=>x.id===clientId); clientInfo={prenom:c.prenom,nom:c.nom,email:c.email,telephone:c.telephone,adresse:c.adresse}; }
  else {
    const pr=el('cm-prenom').value.trim(),nm=el('cm-nom').value.trim();
    if(!pr||!nm){ toast('Renseignez le client','err'); return; }
    clientInfo={prenom:pr,nom:nm,email:el('cm-email').value.trim(),telephone:el('cm-tel').value.trim(),adresse:''};
    clientId=null;
  }
  const total=cmdCart.reduce((s,p)=>s+p.prix*p.quantite,0);
  db.lastCommandeNum=(db.lastCommandeNum||0)+1;
  const numero=`CMD-${new Date().getFullYear()}-${String(db.lastCommandeNum).padStart(3,'0')}`;
  db.commandes.push({ id:gid('cmd'),numero,clientId,clientInfo,produits:[...cmdCart],montantTotal:total,montantPaye:0,
    statutPaiement:'en_attente',modePaiement:'',statutCommande:clientId?'validee':'en_attente',lienPaiement:'',
    notes:el('cm-notes').value.trim(),avisDemande:false,dateCreation:now(),dateValidation:clientId?now():null,source:'direct' });
  saveDb(db); closeModal(); toast('Commande créée','ok'); go('commandes');
}

/* --- Payment modal --- */
function openPaymentModal(id){
  const c=db.commandes.find(x=>x.id===id);
  showModal(`
    <div class="modal-h"><div class="modal-t">Mettre à jour le paiement</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg-hint">Total commande : <b>${money(c.montantTotal)}</b> · Restant dû : <b>${money(c.montantTotal-c.montantPaye)}</b></div>
      <div class="fg"><label>Montant payé (${cur()})</label><input type="number" id="p-paye" value="${c.montantPaye}" step="0.01"></div>
      <div class="fg"><label>Mode de paiement</label><select id="p-mode">${Object.entries(MP).map(([k,v])=>`<option value="${k}" ${c.modePaiement===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="fg"><label>Statut</label><select id="p-stat">${Object.entries(SP).map(([k,v])=>`<option value="${k}" ${c.statutPaiement===k?'selected':''}>${v.l}</option>`).join('')}</select></div>
    </div>
    <div class="modal-f"><button class="btn btn-soft" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="savePayment('${id}')">Enregistrer</button></div>
  `);
}
function savePayment(id){
  db=loadDb(); const i=db.commandes.findIndex(x=>x.id===id); const c=db.commandes[i];
  const paye=parseFloat(el('p-paye').value)||0;
  const before=c.montantPaye;
  c.montantPaye=paye; c.modePaiement=el('p-mode').value; c.statutPaiement=el('p-stat').value;
  if(paye>=c.montantTotal && c.montantTotal>0){ c.statutPaiement='paye'; }
  // award loyalty points on full payment (newly paid amount)
  if(c.statutPaiement==='paye' && before<c.montantTotal && c.clientId){
    const cl=db.clients.find(x=>x.id===c.clientId);
    if(cl){ cl.points=(cl.points||0)+Math.round(c.montantTotal*(db.parametres.pointsParEuro||1)); }
  }
  saveDb(db); closeModal(); toast('Paiement mis à jour','ok'); render('commande');
  if(c.statutPaiement==='paye' && confirm('Paiement complet ! Envoyer une confirmation WhatsApp ?')) waConfirm(id);
}

/* --- Link modal --- */
function openLinkModal(id){
  const c=db.commandes.find(x=>x.id===id);
  showModal(`
    <div class="modal-h"><div class="modal-t">Lien de paiement</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg-hint">Collez le lien généré par votre application bancaire (PayPal, Lydia, Sumeria, Stripe…).${db.parametres.lienPaiementBase?` Base : <b>${esc(db.parametres.lienPaiementBase)}</b>`:''}</div>
      <div class="fg"><label>Lien</label><input id="l-link" value="${esc(c.lienPaiement||db.parametres.lienPaiementBase||'')}" placeholder="https://..."></div>
    </div>
    <div class="modal-f"><button class="btn btn-soft" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveLink('${id}')">Enregistrer & envoyer</button></div>
  `);
}
function saveLink(id){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); c.lienPaiement=el('l-link').value.trim();
  saveDb(db); closeModal(); toast('Lien enregistré','ok'); render('commande');
  if(confirm('Envoyer ce lien par WhatsApp ?')) waRappel(id);
}

/* --- Entretien modal --- */
function openEntretienModal(id,clientId){
  const e=id?db.entretiens.find(x=>x.id===id):null;
  const clients=db.clients.filter(c=>c.actif!==false);
  showModal(`
    <div class="modal-h"><div class="modal-t">${e?'Entretien':'Déposer un entretien'}</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg"><label>Client</label><select id="e-client" ${e?'disabled':''}>${clients.map(c=>`<option value="${c.id}" ${(e?.clientId||clientId)===c.id?'selected':''}>${esc(clientName(c))}</option>`).join('')}</select></div>
      <div class="fg"><label>Description (perruque déposée)</label><input id="e-desc" value="${esc(e?.description||'')}" placeholder="ex: Perruque naturelle châtain"></div>
      <div class="fg-2"><div class="fg"><label>Prix (${cur()})</label><input type="number" id="e-prix" value="${e?.prix||45}"></div><div class="fg"><label>Date prévue</label><input type="date" id="e-prevu" value="${e?.datePrevu||''}"></div></div>
      ${e?`<div class="fg"><label>Statut</label><select id="e-stat">${Object.entries(SE).map(([k,v])=>`<option value="${k}" ${e.statut===k?'selected':''}>${v.l}</option>`).join('')}</select></div>`:''}
      <div class="fg"><label>Notes</label><textarea id="e-notes">${esc(e?.notes||'')}</textarea></div>
    </div>
    <div class="modal-f">
      ${e?`<button class="btn btn-danger" onclick="deleteEntretien('${e.id}')">Supprimer</button>${e.statut==='pret'?`<button class="btn btn-green" onclick="waEntretienPret('${e.id}')">💬 Prévenir</button>`:''}`:''}
      <button class="btn btn-soft" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveEntretien(${e?`'${e.id}'`:'null'})">${e?'Enregistrer':'Déposer'}</button>
    </div>
  `);
}
function saveEntretien(id){
  db=loadDb();
  const data={ clientId:el('e-client').value,description:el('e-desc').value.trim(),prix:parseFloat(el('e-prix').value)||0,
    datePrevu:el('e-prevu').value,notes:el('e-notes').value.trim() };
  if(!data.description){ toast('Ajoutez une description','err'); return; }
  if(id){ const i=db.entretiens.findIndex(x=>x.id===id); data.statut=el('e-stat').value; db.entretiens[i]={...db.entretiens[i],...data}; }
  else { db.entretiens.push({ id:gid('ent'),...data,statut:'recu',dateRecu:now() }); }
  saveDb(db); closeModal(); toast('Entretien enregistré','ok'); render(view);
}
function deleteEntretien(id){ if(!confirm('Supprimer cet entretien ?'))return; db=loadDb(); db.entretiens=db.entretiens.filter(x=>x.id!==id); saveDb(db); closeModal(); toast('Supprimé','ok'); render(view); }

/* --- Produit modal --- */
function openProduitModal(id){
  const p=id?db.produits.find(x=>x.id===id):null;
  showModal(`
    <div class="modal-h"><div class="modal-t">${p?'Modifier le produit':'Nouveau produit'}</div><button class="modal-x" onclick="closeModal()">×</button></div>
    <div class="modal-b">
      <div class="fg"><label>Nom</label><input id="pr-nom" value="${esc(p?.nom||'')}"></div>
      <div class="fg"><label>Catégorie</label><select id="pr-cat">${Object.entries(CAT).map(([k,v])=>`<option value="${k}" ${p?.categorie===k?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="fg-2"><div class="fg"><label>Prix de vente (${cur()})</label><input type="number" id="pr-prix" value="${p?.prix||0}"></div><div class="fg"><label>Coût d'achat (${cur()})</label><input type="number" id="pr-cout" value="${p?.cout||0}"></div></div>
      <div class="fg-2"><div class="fg"><label>Stock</label><input type="number" id="pr-stock" value="${p?.stock||0}"></div><div class="fg"><label>Alerte stock min</label><input type="number" id="pr-min" value="${p?.stockMin||2}"></div></div>
      <div class="fg"><label><input type="checkbox" id="pr-actif" ${(!p||p.actif)?'checked':''}> Produit actif (visible)</label></div>
    </div>
    <div class="modal-f">${p?`<button class="btn btn-danger" onclick="deleteProduit('${p.id}')">Supprimer</button>`:''}<button class="btn btn-soft" onclick="closeModal()">Annuler</button><button class="btn btn-primary" onclick="saveProduit(${p?`'${p.id}'`:'null'})">${p?'Enregistrer':'Créer'}</button></div>
  `);
}
function saveProduit(id){
  db=loadDb();
  const data={ nom:el('pr-nom').value.trim(),categorie:el('pr-cat').value,prix:parseFloat(el('pr-prix').value)||0,
    cout:parseFloat(el('pr-cout').value)||0,stock:parseInt(el('pr-stock').value)||0,stockMin:parseInt(el('pr-min').value)||0,actif:el('pr-actif').checked };
  if(!data.nom){ toast('Nom requis','err'); return; }
  if(id){ const i=db.produits.findIndex(x=>x.id===id); db.produits[i]={...db.produits[i],...data}; }
  else { db.produits.push({ id:gid('prod'),...data }); }
  saveDb(db); closeModal(); toast('Produit enregistré','ok'); render('stock');
}
function deleteProduit(id){ if(!confirm('Supprimer ce produit ?'))return; db=loadDb(); db.produits=db.produits.filter(x=>x.id!==id); saveDb(db); closeModal(); toast('Supprimé','ok'); render('stock'); }

/* --- Adjust points --- */
function adjustPoints(id){
  const c=db.clients.find(x=>x.id===id);
  const v=prompt(`Points actuels de ${clientName(c)} : ${c.points||0}\nNouveau total de points :`, c.points||0);
  if(v===null)return; db=loadDb(); const cl=db.clients.find(x=>x.id===id); cl.points=parseInt(v)||0; saveDb(db); toast('Points mis à jour','ok'); render('client');
}

/* ============================================================
   ACTIONS — validation, statuts
   ============================================================ */
function findDuplicates(email,tel){
  const n=t=>(t||'').replace(/\D/g,'').slice(-9);
  return db.clients.filter(c=>(email&&c.email.toLowerCase()===(email||'').toLowerCase())||(tel&&n(c.telephone)===n(tel)));
}
function validerCmd(id){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); const info=c.clientInfo||{};
  const cl={ id:gid('cl'),prenom:info.prenom||'',nom:info.nom||'',telephone:info.telephone||'',email:info.email||'',
    adresse:info.adresse||'',notes:'Créé depuis '+c.numero,tags:['nouveau'],points:0,source:'formulaire',dateCreation:now(),actif:true };
  db.clients.push(cl); c.clientId=cl.id; c.statutCommande='validee'; c.dateValidation=now();
  saveDb(db); toast('Commande validée · client créé','ok'); render('commande');
  if(confirm('Envoyer une confirmation WhatsApp ?')) waConfirm(id);
}
function mergeCmd(id,clientId){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); c.clientId=clientId; c.statutCommande='validee'; c.dateValidation=now();
  saveDb(db); toast('Fusionnée avec le client existant','ok'); render('commande');
}
function annulerCmd(id){ if(!confirm('Refuser cette commande ?'))return; db=loadDb(); const c=db.commandes.find(x=>x.id===id); c.statutCommande='annulee'; c.statutPaiement='annule'; saveDb(db); toast('Commande annulée','ok'); render('commande'); }
function cycleStatut(id){
  const order=['en_attente','validee','en_cours','livree'];
  db=loadDb(); const c=db.commandes.find(x=>x.id===id);
  const i=order.indexOf(c.statutCommande); const next=order[(i+1)%order.length];
  if(confirm(`Passer de "${SC[c.statutCommande].l}" à "${SC[next].l}" ?`)){ c.statutCommande=next; saveDb(db); toast('Statut : '+SC[next].l,'ok'); render('commande'); }
}

/* ============================================================
   WHATSAPP
   ============================================================ */
function waOpen(tel,msg){ const n=(tel||'').replace(/\D/g,''); if(!n){ toast('Téléphone manquant','err'); return; } window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank'); }
function shopName(){ return db.parametres.nomBoutique||'Devora Nissenbaum'; }
function waRappel(id){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); const cl=db.clients.find(x=>x.id===c.clientId)||c.clientInfo||{};
  const du=c.montantTotal-c.montantPaye;
  const lien=c.lienPaiement?`\n\n🔗 Lien de paiement : ${c.lienPaiement}`:'';
  waOpen(cl.telephone,`Bonjour ${cl.prenom||''},\n\nUn montant de *${money(du)}* reste à régler pour votre commande *${c.numero}*.${lien}\n\nMerci pour votre confiance 🙏\n\n_${shopName()}_`);
}
function waConfirm(id){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); const cl=db.clients.find(x=>x.id===c.clientId)||c.clientInfo||{};
  const paid=c.statutPaiement==='paye';
  const prods=c.produits.map(p=>`• ${p.nom} ×${p.quantite}`).join('\n');
  const msg=paid?`✅ Bonjour ${cl.prenom||''}, votre paiement de *${money(c.montantTotal)}* (commande *${c.numero}*) est bien reçu. Merci ! 🙏\n\n_${shopName()}_`
    :`✅ Bonjour ${cl.prenom||''}, votre commande *${c.numero}* est confirmée !\n\n📦 ${prods}\n\n💰 Total : *${money(c.montantTotal)}*\n\nNous revenons vers vous très vite.\n\n_${shopName()}_`;
  waOpen(cl.telephone,msg);
}
function waAvis(id){
  db=loadDb(); const c=db.commandes.find(x=>x.id===id); const cl=db.clients.find(x=>x.id===c.clientId)||c.clientInfo||{};
  c.avisDemande=true; saveDb(db);
  waOpen(cl.telephone,`Bonjour ${cl.prenom||''} 💛 Nous espérons que vous adorez votre commande *${c.numero}* ! Votre avis compte énormément pour nous — pourriez-vous nous laisser quelques mots ? Merci infiniment 🌟\n\n_${shopName()}_`);
  render(view);
}
function waClient(id){
  const c=db.clients.find(x=>x.id===id);
  const cmds=db.commandes.filter(x=>x.clientId===id && (x.montantTotal-x.montantPaye)>0 && x.statutCommande!=='annulee');
  if(cmds.length){ waRappel(cmds[0].id); return; }
  waOpen(c.telephone,`Bonjour ${c.prenom} 💛\n\n_${shopName()}_`);
}
function waCustom(clientId,type){
  const c=db.clients.find(x=>x.id===clientId);
  const msgs={
    anniversaire:`🎂 Joyeux anniversaire ${c.prenom} ! Toute l'équipe de ${shopName()} vous souhaite une merveilleuse journée. Profitez d'une attention spéciale chez nous 💛`,
    entretien:`Bonjour ${c.prenom} 🫧 Il est temps de chouchouter votre perruque ! Pensez à notre service d'entretien pour qu'elle reste comme neuve. Sur RDV chez ${shopName()}.`,
    renouvellement:`Bonjour ${c.prenom} ✨ Cela fait un moment ! Découvrez nos nouveautés — c'est peut-être le moment de renouveler votre perruque. À très vite chez ${shopName()} 💛`,
    recup:`Bonjour ${c.prenom} 📦 Votre perruque est prête à être récupérée ! Nous vous attendons chez ${shopName()}.`
  };
  waOpen(c.telephone,msgs[type]||`Bonjour ${c.prenom} 💛`);
}
function waEntretienPret(id){
  db=loadDb(); const e=db.entretiens.find(x=>x.id===id); const c=db.clients.find(x=>x.id===e.clientId);
  waOpen(c.telephone,`Bonjour ${c.prenom} 📦 Votre perruque (${e.description}) est prête ! Vous pouvez venir la récupérer chez ${shopName()}. À bientôt 💛`);
}
function launchCampaign(){
  const seg=el('camp-seg').value; const tmpl=el('camp-msg').value;
  let targets=db.clients.filter(c=>c.actif!==false);
  if(seg==='inactif') targets=targets.filter(c=>{const s=clientStats(c.id);return s.last&&daysSince(s.last)>365;});
  else if(seg!=='all') targets=targets.filter(c=>(c.tags||[]).includes(seg));
  if(!targets.length){ toast('Aucun client dans ce segment','err'); return; }
  if(!confirm(`Ouvrir WhatsApp pour ${targets.length} client(s) ? (un onglet par client)`))return;
  targets.forEach((c,i)=>{ setTimeout(()=>waOpen(c.telephone,tmpl.replace(/\[prénom\]/gi,c.prenom)),i*600); });
  toast(`Campagne lancée — ${targets.length} client(s)`,'ok');
}

/* ============================================================
   FACTURE / COPY
   ============================================================ */
function copyFacture(id){
  const c=db.commandes.find(x=>x.id===id); const cl=db.clients.find(x=>x.id===c.clientId)||c.clientInfo||{};
  const lines=c.produits.map(p=>`- ${p.nom} ×${p.quantite} : ${money(p.prix*p.quantite)}`).join('\n');
  const txt=`FACTURE — ${shopName()}\nN° ${c.numero} · ${fdate(c.dateCreation)}\n\nClient : ${cl.prenom} ${cl.nom}\n${cl.email||''} ${cl.telephone||''}\n\n${lines}\n\nTOTAL : ${money(c.montantTotal)}\nPayé : ${money(c.montantPaye)}\nRestant dû : ${money(c.montantTotal-c.montantPaye)}\n\nMerci pour votre confiance.\n${shopName()}`;
  copyTxt(txt,'Facture copiée');
}
function copyTxt(t,msg){ navigator.clipboard.writeText(t).then(()=>toast(msg||'Copié','ok')).catch(()=>toast('Copie impossible','err')); }

/* ============================================================
   SETTINGS / DATA
   ============================================================ */
function saveReglages(){
  db=loadDb(); const p=db.parametres;
  if(el('r-nom'))p.nomBoutique=el('r-nom').value.trim();
  if(el('r-email'))p.email=el('r-email').value.trim();
  if(el('r-wa'))p.whatsapp=el('r-wa').value.trim();
  if(el('r-dev'))p.devise=el('r-dev').value;
  if(el('r-lien'))p.lienPaiementBase=el('r-lien').value.trim();
  if(el('r-pts'))p.pointsParEuro=parseFloat(el('r-pts').value)||1;
  if(el('r-parr'))p.remiseParrainage=parseInt(el('r-parr').value)||0;
  if(el('r-ent'))p.delaiEntretien=parseInt(el('r-ent').value)||90;
  if(el('r-ren'))p.delaiRenouvellement=parseInt(el('r-ren').value)||365;
  saveDb(db); toast('Réglages sauvegardés','ok'); render('reglages');
}
function changePwd(){
  db=loadDb();
  if(el('r-pc').value!==db.parametres.motDePasse){ toast('Mot de passe actuel incorrect','err'); return; }
  if(el('r-pn').value.length<4){ toast('Min. 4 caractères','err'); return; }
  if(el('r-pn').value!==el('r-pf').value){ toast('Les mots de passe ne correspondent pas','err'); return; }
  db.parametres.motDePasse=el('r-pn').value; saveDb(db); toast('Mot de passe modifié','ok'); render('reglages');
}
function exportBackup(){
  const blob=new Blob([JSON.stringify(loadDb(),null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`sauvegarde_devora_${new Date().toISOString().slice(0,10)}.json`; a.click();
  toast('Sauvegarde téléchargée','ok');
}
function importBackup(input){
  const f=input.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{ try{ const data=JSON.parse(e.target.result); if(!data.clients||!data.commandes)throw 0;
    if(confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')){ saveDb(data); db=loadDb(); toast('Sauvegarde importée','ok'); render(view); } }
    catch(err){ toast('Fichier invalide','err'); } };
  r.readAsText(f); input.value='';
}
function exportCSV(type){
  db=loadDb(); let rows,name;
  if(type==='clients'){ name='clients';
    rows=[['Prénom','Nom','Téléphone','Email','Adresse','Tags','Points','CA','Créé le']];
    db.clients.forEach(c=>{ const s=clientStats(c.id); rows.push([c.prenom,c.nom,c.telephone,c.email,c.adresse||'',(c.tags||[]).join('|'),c.points||0,s.ca,fdate(c.dateCreation)]); });
  } else { name='commandes';
    rows=[['N°','Client','Date','Articles','Total','Payé','Statut','Paiement']];
    db.commandes.forEach(c=>rows.push([c.numero,cmdClientName(c),fdate(c.dateCreation),c.produits.map(p=>p.nom).join('; '),c.montantTotal,c.montantPaye,SC[c.statutCommande]?.l,SP[c.statutPaiement]?.l]));
  }
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name+'_devora.csv'; a.click();
  toast('Export CSV téléchargé','ok');
}
function resetData(){ if(!confirm('Réinitialiser TOUTES les données ? Irréversible.'))return; if(!confirm('Vraiment sûr ? Pensez à exporter une sauvegarde avant.'))return; localStorage.removeItem(DB_KEY); db=loadDb(); toast('Données réinitialisées','ok'); render(view); }

/* ============================================================
   TOAST / AUTH / INIT
   ============================================================ */
function toast(msg,type){ const t=el('toast'); t.textContent=msg; t.className='toast show '+(type||''); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2800); }
function logout(){ sessionStorage.removeItem(SESS); location.reload(); }

function boot(){
  buildNav();
  go('dashboard');
}
document.addEventListener('DOMContentLoaded',()=>{
  // login
  if(sessionStorage.getItem(SESS)==='ok'){ el('login').style.display='none'; el('app').style.display='block'; boot(); }
  el('login-form').addEventListener('submit',e=>{ e.preventDefault();
    if(el('login-pwd').value===db.parametres.motDePasse){ sessionStorage.setItem(SESS,'ok'); el('login').style.display='none'; el('app').style.display='block'; boot(); }
    else { el('login-err').style.display='block'; el('login-pwd').value=''; }
  });
  // search (desktop + mobile)
  ['search','msearch'].forEach(id=>{ const e=el(id); if(e)e.addEventListener('input',ev=>{ q=ev.target.value; if(view==='clients')renderClients(); else if(view==='commandes')renderCommandes(); else { go('clients'); } }); });
});

/* ============================================================
   ICONS (inline SVG)
   ============================================================ */
function svg(p,s){ return `<svg class="nav-ic" width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`; }
function icoHome(s){ return svg('<path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',s); }
function icoUsers(s){ return svg('<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8"/><path d="M18 14.2a6 6 0 0 1 3.5 5.8"/>',s); }
function icoBag(s){ return svg('<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',s); }
function icoSparkle(s){ return svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',s); }
function icoBell(s){ return svg('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',s); }
function icoMega(s){ return svg('<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6"/>',s); }
function icoBox(s){ return svg('<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',s); }
function icoGear(s){ return svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',s); }
function icoMore(s){ return svg('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',s); }
