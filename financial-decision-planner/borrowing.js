/* ============================================================
   BORROWING READINESS  (extension module)
   Appended last. Generalizes the loan engine beyond mortgages to
   auto, personal, and student loans. Reuses Calc.pmt. The existing
   Mortgage Readiness view is preserved untouched as the "Mortgage"
   preset (linked, not replaced). Each loan type carries its own
   costs and its own sustainability lens; any modeled loan can be
   added to the budget (confirm-gated) so it flows into the existing
   DTI, cash-flow, and recommendation engine.
   ============================================================ */
'use strict';

/* ---- loan-type presets: what differs between financed purchases ---- */
const LOAN_TYPES = {
  auto: {
    label:'Auto loan', principalLabel:'Vehicle price', termDefault:6, rateDefault:0.079,
    dpLabel:'Down payment / trade-in', lens:'personal',
    carrying:[
      {key:'insurance_annual', label:'Auto insurance (annual)', def:1560},
      {key:'registration_annual', label:'Registration & fees (annual)', def:220},
      {key:'maintenance_annual', label:'Maintenance & repairs (annual)', def:900}
    ],
    note:'Front-end DTI does not apply to a vehicle. Judged by back-end DTI and payment-to-income.'
  },
  personal: {
    label:'Personal loan', principalLabel:'Loan amount', termDefault:4, rateDefault:0.119,
    dpLabel:'Upfront paid (if any)', lens:'personal',
    carrying:[],
    note:'Unsecured — no carrying costs beyond the payment. Judged by back-end DTI.'
  },
  student: {
    label:'Student loan', principalLabel:'Amount borrowed', termDefault:10, rateDefault:0.055,
    dpLabel:'Upfront paid (if any)', lens:'personal',
    carrying:[],
    note:'Judged by back-end DTI. Deferment/subsidy not modeled — planning estimate only.'
  }
};

/* ---- borrowing calc: shared amortization + type-specific costs + lens ---- */
const Borrow = {
  compute(db, type, inp){
    const t=LOAN_TYPES[type];
    const principal=Math.max(0, (+inp.principal||0) - (+inp.down||0));
    const pi=Calc.pmt(principal, +inp.rate, +inp.term_years);
    // carrying costs -> monthly
    let carryMonthly=0; const carryLines=[];
    (t.carrying||[]).forEach(c=>{ const v=+inp[c.key]||0; carryMonthly+=v/12; carryLines.push({label:c.label, monthly:v/12}); });
    const fullMonthly = pi + carryMonthly;
    // total interest over life
    const totalPaid = pi*(+inp.term_years*12);
    const totalInterest = Math.max(0, totalPaid - principal);
    // sustainability lens (personal): impact on existing DTI + cash flow
    const netIncome=Calc.netIncome(db);
    const grossIncome=Calc.grossIncome(db);
    const existingDebt=Calc.debtPayments(db);
    const currentBackNet = netIncome? existingDebt/netIncome*100 : 0;
    const newBackNet = netIncome? (existingDebt+pi)/netIncome*100 : 0;    // loan P&I adds to debt service
    const newBackGross = grossIncome? (existingDebt+pi)/grossIncome*100 : 0;
    const paymentToIncomeNet = netIncome? pi/netIncome*100 : 0;
    const fcfNow = Calc.monthlySurplus(db);
    const fcfAfter = fcfNow - fullMonthly;   // payment + carrying reduce free cash flow
    // affordability: max principal that keeps back-end DTI <= target on NET income
    const targetBack = (db.settings.assumptions.back_end_max||0.36); // reuse existing guide
    const maxPaymentNet = Math.max(0, netIncome*targetBack - existingDebt);
    const maxPrincipal = this.principalForPayment(maxPaymentNet, +inp.rate, +inp.term_years);
    return {type, t, principal, pi, carryMonthly, carryLines, fullMonthly, totalInterest, totalPaid,
      currentBackNet, newBackNet, newBackGross, paymentToIncomeNet, fcfNow, fcfAfter,
      maxPaymentNet, maxPrincipal, targetBack, netIncome, grossIncome, existingDebt};
  },
  // invert amortization: principal affordable for a given payment
  principalForPayment(payment, annualRate, years){
    const r=annualRate/12, n=years*12;
    if(payment<=0) return 0;
    if(r===0) return payment*n;
    return payment * (1-Math.pow(1+r,-n)) / r;
  },
  rateSensitivity(db,type,inp){
    const rates=[-0.02,-0.01,0,0.01,0.02,0.03];
    return rates.map(dr=>{ const c=this.compute(db,type,Object.assign({},inp,{rate:(+inp.rate)+dr})); return {rate:(+inp.rate)+dr, pi:c.pi, full:c.fullMonthly, back:c.newBackNet}; });
  }
};

/* ---- default draft per type ---- */
App.borrowType = App.borrowType || 'auto';
App.borrowDraft = App.borrowDraft || {};
function borrowDefaults(type){
  const t=LOAN_TYPES[type];
  const d={ principal: type==='auto'?32000:type==='personal'?12000:28000, down: type==='auto'?4000:0,
            rate:t.rateDefault, term_years:t.termDefault };
  (t.carrying||[]).forEach(c=> d[c.key]=c.def);
  return d;
}

/* ============================================================
   VIEW
   ============================================================ */
Views.borrowing=function(){
  const db=Store.db;
  const type=App.borrowType;
  if(!App.borrowDraft[type]) App.borrowDraft[type]=borrowDefaults(type);
  const inp=App.borrowDraft[type];
  const t=LOAN_TYPES[type];
  const c=Borrow.compute(db,type,inp);
  const backStatus=(v)=>v<=36?'green':v<=43?'amber':'red';
  const fld=(key,label,step,val)=>`<div class="field"><label class="fld">${label}</label><input type="number" step="${step||1}" value="${val}" oninput="App.borrowDraft['${type}']['${key}']=parseFloat(this.value)||0;App.render()"></div>`;
  const kv=(k,v,color)=>`<div class="kv"><span class="k">${k}</span><span class="v" ${color?`style="color:${color}"`:''}>${v}</span></div>`;

  const typeTabs=Object.keys(LOAN_TYPES).map(k=>`<button class="${type===k?'active':''}" onclick="App.borrowType='${k}';App.render()">${LOAN_TYPES[k].label}</button>`).join('');

  return `
  ${syntheticNote}
  <div class="banner"><span class="b-badge">Estimate</span> Borrowing figures are planning estimates, not a lender approval or credit decision. Adding a loan to your budget requires your confirmation.</div>

  <div class="section">
    <div class="section-head">
      <div><h3>What are you financing?</h3><div class="desc">Each loan type uses the same payment math but its own costs and the right way to judge it</div></div>
      <div class="pill-tabs">${typeTabs}</div>
    </div>
    <div class="banner info" style="margin:6px 0 0"><span class="b-badge" style="background:#0d2440;color:var(--accent);border-color:var(--accent2)">Mortgage</span>
      Buying a home? The dedicated <a href="#" onclick="App.go('mortgage');return false" style="color:var(--accent)">Mortgage Readiness</a> screen models property tax, insurance, HOA, PMI, maintenance, and closing reserves in full.</div>
  </div>

  <div class="two-col">
    <div class="section">
      <h3>${t.label} inputs</h3>
      <div class="form-grid">
        ${fld('principal',t.principalLabel,500,inp.principal)}
        ${fld('down',t.dpLabel,250,inp.down)}
        ${fld('rate','Interest rate (e.g. 0.079)',0.001,inp.rate)}
        ${fld('term_years','Term (years)',1,inp.term_years)}
        ${(t.carrying||[]).map(cc=>fld(cc.key,cc.label,50,inp[cc.key])).join('')}
      </div>
      <div class="mini" style="margin-top:8px">${t.note}</div>
    </div>

    <div class="section">
      <h3>Monthly cost</h3>
      ${kv('Principal &amp; interest',fmtMoney2(c.pi))}
      ${c.carryLines.map(l=>kv(l.label,fmtMoney2(l.monthly))).join('')}
      ${kv('Total monthly cost',fmtMoney2(c.fullMonthly),'var(--accent)')}
      <hr class="sep">
      ${kv('Total interest over life',fmtMoney(c.totalInterest))}
      ${kv('Total of payments',fmtMoney(c.totalPaid))}
      ${kv('Amount financed',fmtMoney(c.principal))}
    </div>
  </div>

  <div class="two-col">
    <div class="section">
      <h3>Can you sustain it?</h3>
      <div class="desc">Personal lens: effect on your debt load and cash flow</div>
      ${kv('Debt-to-income now (net)',fmtPct(c.currentBackNet), backStatus(c.currentBackNet)==='green'?'var(--green)':backStatus(c.currentBackNet)==='amber'?'var(--amber)':'var(--red)')}
      ${kv('Debt-to-income with this loan',fmtPct(c.newBackNet), backStatus(c.newBackNet)==='green'?'var(--green)':backStatus(c.newBackNet)==='amber'?'var(--amber)':'var(--red)')}
      <div class="mini">(existing debt + new payment) / net income</div>
      ${kv('Payment-to-income',fmtPct(c.paymentToIncomeNet))}
      <hr class="sep">
      ${kv('Free cash flow now',fmtMoney(c.fcfNow))}
      ${kv('Free cash flow after this loan',fmtMoney(c.fcfAfter), c.fcfAfter>=0?'var(--green)':'var(--red)')}
      ${c.fcfAfter<0?'<div class="mini" style="color:var(--red)">This loan would push your monthly cash flow negative.</div>':''}
    </div>
    <div class="section">
      <h3>How much could you afford?</h3>
      <div class="desc">Keeping back-end DTI at or under ${(c.targetBack*100).toFixed(0)}% on net income</div>
      ${kv('Max sustainable payment',fmtMoney2(c.maxPaymentNet))}
      ${kv('Max amount financed',fmtMoney(c.maxPrincipal),'var(--accent)')}
      <div class="mini">at ${(inp.rate*100).toFixed(2)}% over ${inp.term_years} years</div>
      <hr class="sep">
      <h3 style="font-size:12.5px;margin-top:6px">Payment by rate</h3>
      <div id="borrowRateChart" style="height:180px"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-head">
      <div><h3>Add this loan to your plan</h3><div class="desc">Creates a debt line in your budget so it flows into your DTI, cash flow, goals, and recommendations</div></div>
      <button class="btn" onclick="Borrow.addToBudget('${type}')">Add to budget</button>
    </div>
    <div class="mini">Requires confirmation. Nothing changes until you approve — consistent with every other verified-data change in the app.</div>
  </div>`;
};

Views._after_borrowing=function(){
  const db=Store.db, type=App.borrowType, inp=App.borrowDraft[type];
  if(!inp||!window.Highcharts) return;
  const sens=Borrow.rateSensitivity(db,type,inp);
  Highcharts.chart('borrowRateChart',{
    chart:{type:'column',backgroundColor:'transparent',style:{fontFamily:'var(--sans)'}},
    title:{text:null},credits:{enabled:false},
    xAxis:{categories:sens.map(s=>(s.rate*100).toFixed(2)+'%'),labels:{style:{color:'#adbac7'}},lineColor:'#30363d'},
    yAxis:{title:{text:null},labels:{style:{color:'#adbac7'}},gridLineColor:'#21262d'},
    legend:{enabled:false},
    tooltip:{backgroundColor:'#161b22',borderColor:'#30363d',style:{color:'#e6edf3'},valuePrefix:'$'},
    series:[{name:'Payment',data:sens.map(s=>Math.round(s.pi)),color:'#2f81f7'}]
  });
};

/* ---- add modeled loan to budget as a debt category (confirm-gated) ---- */
Borrow.addToBudget=function(type){
  const db=Store.db, inp=App.borrowDraft[type], t=LOAN_TYPES[type];
  const c=Borrow.compute(db,type,inp);
  const name=t.label+' (modeled)';
  if(!confirm(`Add "${name}" to your budget as a debt line of ${fmtMoney2(c.pi)}/mo (balance ${fmtMoney(c.principal)}, ${(inp.rate*100).toFixed(2)}% APR)? This changes your verified budget and will affect DTI, cash flow, and recommendations.`)) return;
  db.budget.push({ id:uid('cat'), name, type:'debt', budgeted:Math.round(c.pi), balance:Math.round(c.principal),
    apr:+(inp.rate*100).toFixed(2), minimum:Math.round(c.pi),
    created_at:nowISO(), updated_at:nowISO(), source:'user', verification_status:'verified', user_id:USER_ID });
  Store.log('borrowing', `Added ${name}: ${fmtMoney2(c.pi)}/mo, balance ${fmtMoney(c.principal)}, ${(inp.rate*100).toFixed(2)}% APR`);
  Store.save();
  toast(t.label+' added to budget','green');
  // refresh recommendation result if one exists so the new debt is reflected
  if(App.recoResult && typeof Reco!=='undefined'){ App.recoResult=Reco.build(db); if(typeof Enhance!=='undefined') Enhance.enrich(db,App.recoResult); }
  App.render();
};

/* ============================================================
   Wire into nav (both Simple and Advanced) — after Mortgage
   ============================================================ */
(function wireBorrowingNav(){
  if(!NAV.find(n=>n.id==='borrowing')){
    const idx=NAV.findIndex(n=>n.id==='mortgage');
    const entry={id:'borrowing', label:'Borrowing Readiness', sub:'Loans of any kind — can you sustain it?', ico:'M3 10h18 M5 10v8h14v-8 M9 21V14h6v7 M12 3l7 5H5z'};
    if(idx>=0) NAV.splice(idx+1,0,entry); else NAV.push(entry);
  }
  // include in simple-mode nav set if present
  try{ if(typeof SIMPLE_NAV_IDS!=='undefined' && !SIMPLE_NAV_IDS.includes('borrowing')) SIMPLE_NAV_IDS.push('borrowing'); }catch(e){}
  try{ if(typeof RecoUI2!=='undefined' && RecoUI2.reshapeNav) RecoUI2.reshapeNav(); else if(App.init) { /* fallback: rebuild base nav */ } }catch(e){}
  // rebuild the base nav DOM if reshapeNav isn't controlling it
  try{
    const nav=document.getElementById('nav');
    if(nav && (typeof App.mode==='undefined')){
      nav.innerHTML=NAV.map(n=>`<button data-v="${n.id}" onclick="App.go('${n.id}')">
        <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${n.ico}"/></svg>
        <span>${n.label}</span></button>`).join('');
    }
  }catch(e){}
})();
