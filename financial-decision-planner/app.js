/* ============================================================
   Financial Decision Planner  —  private, user-scoped prototype
   All data is SYNTHETIC and stored locally (localStorage),
   scoped per user_id. No shared storage is used.
   ============================================================ */

'use strict';

/* ---------- User scope & storage ---------- */
const USER_ID = 'local-user-001';                 // user-scoped key namespace
const STORE_KEY = 'fdp::' + USER_ID + '::v1';
const nowISO = () => new Date().toISOString();
const fmtMoney = (n) => (n<0?'-':'') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtMoney2 = (n) => (n<0?'-':'') + '$' + Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtPct = (n,d=1) => (n>=0?'':'') + n.toFixed(d) + '%';
const fmtDate = (iso) => { if(!iso) return '\u2014'; const d=new Date(iso); return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); };
const uid = (p='id') => p+'-'+Math.random().toString(36).slice(2,9);
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- Synthetic seed data (clearly labelled) ---------- */
function seedData(){
  const audit = [];
  const stamp = (o)=>Object.assign({created_at:nowISO(),updated_at:nowISO(),source:'synthetic-seed',verification_status:'verified',user_id:USER_ID},o);
  return {
    meta:{ synthetic:true, created_at:nowISO(), user_id:USER_ID, schema:'v1' },
    settings:{
      user_id:USER_ID,
      display_name:'Alex Rivera (synthetic)',
      currency:'USD',
      thresholds:{ green:5, amber:10 },      // % unfavorable bands; >amber = red; cashflow<0 = critical
      assumptions:{
        default_return:0.06,                  // annual expected return for goals
        inflation:0.03,
        emergency_fund_target_months:6,
        maintenance_reserve_pct:0.01,         // % of home price / yr
        default_rate:0.0675,                  // mortgage APR
        default_term_years:30,
        pmi_annual_pct:0.0075,                // if down payment < 20%
        front_end_max:0.28,
        back_end_max:0.36,
        conservative_back_end:0.28,
        balanced_back_end:0.33
      },
      created_at:nowISO(), updated_at:nowISO(), source:'synthetic-seed', verification_status:'verified'
    },
    income:[
      stamp({id:uid('inc'), name:'Primary salary (net)', gross:7200, amount:5450, cadence:'monthly'}),
      stamp({id:uid('inc'), name:'Freelance (net)', gross:900, amount:720, cadence:'monthly'})
    ],
    budget:[
      // type: fixed | variable | debt | savings | sinking
      stamp({id:uid('cat'), name:'Rent', type:'fixed', budgeted:1850}),
      stamp({id:uid('cat'), name:'Utilities', type:'fixed', budgeted:240}),
      stamp({id:uid('cat'), name:'Insurance (auto+health)', type:'fixed', budgeted:310}),
      stamp({id:uid('cat'), name:'Phone & internet', type:'fixed', budgeted:145}),
      stamp({id:uid('cat'), name:'Groceries', type:'variable', budgeted:620}),
      stamp({id:uid('cat'), name:'Dining & takeout', type:'variable', budgeted:280}),
      stamp({id:uid('cat'), name:'Transportation & fuel', type:'variable', budgeted:210}),
      stamp({id:uid('cat'), name:'Entertainment', type:'variable', budgeted:160}),
      stamp({id:uid('cat'), name:'Shopping & personal', type:'variable', budgeted:190}),
      stamp({id:uid('cat'), name:'Student loan', type:'debt', budgeted:380, balance:14200, apr:5.5, minimum:280}),
      stamp({id:uid('cat'), name:'Auto loan', type:'debt', budgeted:410, balance:12800, apr:6.9, minimum:410}),
      stamp({id:uid('cat'), name:'Credit card', type:'debt', budgeted:250, balance:3600, apr:22.9, minimum:110}),
      stamp({id:uid('cat'), name:'Emergency fund', type:'savings', budgeted:400}),
      stamp({id:uid('cat'), name:'Retirement (Roth)', type:'savings', budgeted:500}),
      stamp({id:uid('cat'), name:'Home down-payment fund', type:'sinking', budgeted:600}),
      stamp({id:uid('cat'), name:'Car maintenance sinking', type:'sinking', budgeted:90}),
      stamp({id:uid('cat'), name:'Annual gifts sinking', type:'sinking', budgeted:75})
    ],
    // actuals keyed by month (YYYY-MM) -> {catId: actual}
    actuals:{},
    transactions:[],   // filled below
    accounts:[
      stamp({id:uid('acct'), name:'Checking (synthetic)', mask:'****4821', type:'checking', balance:4180}),
      stamp({id:uid('acct'), name:'Savings (synthetic)', mask:'****9930', type:'savings', balance:11400}),
      stamp({id:uid('acct'), name:'Brokerage (synthetic)', mask:'****2277', type:'investment', balance:23850}),
      stamp({id:uid('acct'), name:'Down-payment fund', mask:'****6644', type:'savings', balance:9600})
    ],
    goals:[
      stamp({id:uid('goal'), name:'6-month emergency fund', target:22800, current:11400, target_date:addMonths(6), priority:'High', exp_return:0.03}),
      stamp({id:uid('goal'), name:'Home down payment', target:60000, current:9600, target_date:addMonths(30), priority:'High', exp_return:0.04}),
      stamp({id:uid('goal'), name:'New car fund', target:12000, current:2100, target_date:addMonths(20), priority:'Medium', exp_return:0.03}),
      stamp({id:uid('goal'), name:'Vacation 2027', target:5000, current:900, target_date:addMonths(11), priority:'Low', exp_return:0.02})
    ],
    mortgage:{
      gross_monthly:8100, net_monthly:6170, existing_debt:1040,
      rate:0.0675, term_years:30,
      property_tax_annual:5400, insurance_annual:1560, hoa_monthly:0, pmi_annual_pct:0.0075,
      down_payment:60000, closing_pct:0.03, maintenance_pct:0.01, emergency_required:13600,
      home_price:340000,
      created_at:nowISO(), updated_at:nowISO(), source:'synthetic-seed', verification_status:'verified'
    },
    scenarios:[],   // user-created; baseline computed live
    documents:[],   // populated with synthetic pending-review records
    reconcile:[],   // review queue
    audit:[]
  };
}

function addMonths(m){ const d=new Date(); d.setMonth(d.getMonth()+m); return d.toISOString(); }
function ymNow(off=0){ const d=new Date(); d.setMonth(d.getMonth()+off); return d.toISOString().slice(0,7); }

/* Synthetic transactions across recent months + edge cases for variance flags */
function seedTransactions(db){
  const cats = db.budget;
  const catByName = (n)=>cats.find(c=>c.name===n);
  const months = [ymNow(-2), ymNow(-1), ymNow(0)];
  const tx = [];
  const push = (o)=>tx.push(Object.assign({id:uid('tx'),created_at:nowISO(),updated_at:nowISO(),source:'synthetic-seed',verification_status:'verified',user_id:USER_ID,flags:[]},o));
  const vendors = {
    'Groceries':['Whole Foods','Trader Joes','Safeway','Costco'],
    'Dining & takeout':['Chipotle','Local Bistro','DoorDash','Starbucks'],
    'Transportation & fuel':['Shell','Chevron','Uber','Transit Pass'],
    'Entertainment':['Netflix','AMC Theaters','Spotify','Steam'],
    'Shopping & personal':['Amazon','Target','REI','Nordstrom'],
    'Utilities':['City Power','Water Dept'],
    'Rent':['Maple Grove Apts'],
    'Insurance (auto+health)':['StateWide Insurance'],
    'Phone & internet':['Verizon','Xfinity']
  };
  months.forEach((ym,mi)=>{
    Object.keys(vendors).forEach(cn=>{
      const cat=catByName(cn); if(!cat) return;
      const n = (cn==='Rent'||cn==='Insurance (auto+health)'||cn==='Phone & internet')?1:(cn==='Utilities'?2:3);
      let spent=0;
      for(let i=0;i<n;i++){
        const v=vendors[cn][i%vendors[cn].length];
        let amt = cat.budgeted/n * (0.7+Math.random()*0.7);
        amt = Math.round(amt*100)/100;
        spent+=amt;
        const day = String(2+Math.floor(Math.random()*25)).padStart(2,'0');
        push({date:ym+'-'+day, description:v, merchant:v, amount:amt, catId:cat.id, category:cn, month:ym, type:'debit'});
      }
    });
  });
  // Edge cases (current month) for variance/anomaly flags:
  const g=catByName('Groceries'), d=catByName('Dining & takeout'), e=catByName('Entertainment');
  const cm=ymNow(0);
  // Duplicate pair
  push({date:cm+'-14', description:'Costco', merchant:'Costco', amount:142.88, catId:g.id, category:'Groceries', month:cm, type:'debit', flags:['duplicate']});
  push({date:cm+'-14', description:'Costco', merchant:'Costco', amount:142.88, catId:g.id, category:'Groceries', month:cm, type:'debit', flags:['duplicate']});
  // Unusual large
  push({date:cm+'-19', description:'Best Buy - laptop', merchant:'Best Buy', amount:1284.00, catId:catByName('Shopping & personal').id, category:'Shopping & personal', month:cm, type:'debit', flags:['unusual']});
  // Uncategorized
  push({date:cm+'-20', description:'SQ *UNKNOWN VENDOR', merchant:'Square', amount:64.50, catId:null, category:null, month:cm, type:'debit', flags:['uncategorized']});
  // Recurring subscription flagged
  push({date:cm+'-03', description:'Adobe Creative Cloud', merchant:'Adobe', amount:59.99, catId:e.id, category:'Entertainment', month:cm, type:'debit', flags:['recurring']});
  db.transactions = tx;

  // Build actuals from transactions (verified) per month
  const actuals={};
  months.forEach(ym=>{ actuals[ym]={}; });
  tx.forEach(t=>{ if(!t.catId) return; if(!actuals[t.month]) actuals[t.month]={}; actuals[t.month][t.catId]=(actuals[t.month][t.catId]||0)+t.amount; });
  // Force some deliberate variance signatures in current month
  const cur=actuals[cm];
  cur[catByName('Dining & takeout').id] = 372;     // over budget (red)
  cur[catByName('Groceries').id] = 705;            // over (amber/red)
  cur[catByName('Entertainment').id] = 168;        // slight over (green/amber edge)
  cur[catByName('Transportation & fuel').id] = 196;// under (favorable)
  db.actuals = actuals;
}

/* Synthetic pending document-review records (NOT auto-approved) */
function seedDocuments(db){
  const stamp=(o)=>Object.assign({created_at:nowISO(),updated_at:nowISO(),source:'synthetic-external-api',verification_status:'pending',user_id:USER_ID},o);
  db.documents=[
    stamp({id:uid('doc'), type:'Bank Statement', institution:'Northgate Bank (synthetic)', period_start:ymNow(-1)+'-01', period_end:ymNow(-1)+'-28',
      accounts:[{mask:'****4821', type:'Checking', balance:4180.22}], processing_status:'pending_review', redaction_status:'redacted',
      income_detected:6170, tx_count:34, validation_errors:[],
      fields:[
        {label:'Statement period', value:ymNow(-1)+' (full month)', confidence:0.99, verified:false},
        {label:'Ending balance', value:'$4,180.22', confidence:0.97, verified:false},
        {label:'Total deposits', value:'$6,170.00', confidence:0.93, verified:false},
        {label:'Total withdrawals', value:'$5,932.10', confidence:0.9, verified:false}
      ]}),
    stamp({id:uid('doc'), type:'Pay Stub', institution:'Employer Payroll (synthetic)', period_start:ymNow(0)+'-01', period_end:ymNow(0)+'-15',
      accounts:[{mask:'****4821', type:'Direct Deposit', balance:null}], processing_status:'pending_review', redaction_status:'redacted',
      income_detected:2725, tx_count:0, validation_errors:['Net pay differs from prior period by >8%'],
      fields:[
        {label:'Gross pay', value:'$3,600.00', confidence:0.95, verified:false},
        {label:'Net pay', value:'$2,725.00', confidence:0.88, verified:false},
        {label:'Federal withholding', value:'$540.00', confidence:0.82, verified:false},
        {label:'SSN', value:'***-**-1234', confidence:0.99, verified:false, masked:true}
      ]}),
    stamp({id:uid('doc'), type:'Brokerage Statement', institution:'Vista Investments (synthetic)', period_start:ymNow(-1)+'-01', period_end:ymNow(-1)+'-28',
      accounts:[{mask:'****2277', type:'Brokerage', balance:23850.44}], processing_status:'pending_review', redaction_status:'redacted',
      income_detected:0, tx_count:6, validation_errors:['Low OCR confidence on 2 line items'],
      fields:[
        {label:'Portfolio value', value:'$23,850.44', confidence:0.94, verified:false},
        {label:'Dividends (period)', value:'$78.20', confidence:0.71, verified:false},
        {label:'Contributions', value:'$500.00', confidence:0.86, verified:false}
      ]})
  ];
  // Reconciliation queue derived from unverified extractions + uncategorized tx
  db.reconcile=[
    stamp({id:uid('rec'), transaction:'SQ *UNKNOWN VENDOR', source:'Bank Statement (synthetic)', extracted_value:64.50, confidence:0.62, proposed_category:'Shopping & personal', duplicate:false, decision:'pending'}),
    stamp({id:uid('rec'), transaction:'Costco (possible dup)', source:'Bank Statement (synthetic)', extracted_value:142.88, confidence:0.9, proposed_category:'Groceries', duplicate:true, decision:'pending'}),
    stamp({id:uid('rec'), transaction:'Dividend credit', source:'Brokerage Statement (synthetic)', extracted_value:78.20, confidence:0.71, proposed_category:'Investment income', duplicate:false, decision:'pending'}),
    stamp({id:uid('rec'), transaction:'ATM withdrawal', source:'Bank Statement (synthetic)', extracted_value:200.00, confidence:0.83, proposed_category:'Uncategorized', duplicate:false, decision:'pending'})
  ];
}

/* ---------- Store ---------- */
const Store = {
  db:null,
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw){ this.db = JSON.parse(raw); return; }
    }catch(e){ console.warn('load failed',e); }
    this.reset(false);
  },
  save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(this.db)); }catch(e){ console.warn('save failed',e); } },
  reset(save=true){
    const db = seedData();
    seedTransactions(db);
    seedDocuments(db);
    db.audit=[];
    this.db=db;
    this.log('system','Initialized synthetic demonstration dataset');
    if(save) this.save();
  },
  log(kind, detail, extra){
    this.db.audit.unshift({id:uid('aud'), at:nowISO(), kind, detail, extra:extra||null, user_id:USER_ID});
    if(this.db.audit.length>500) this.db.audit.length=500;
  }
};

/* ============================================================
   CALCULATION ENGINE  (pure functions; the single source of truth)
   ============================================================ */
const Calc = {
  netIncome(db){ return db.income.reduce((s,i)=>s+(+i.amount||0),0); },      // NEVER counts available credit
  grossIncome(db){ return db.income.reduce((s,i)=>s+(+i.gross||i.amount||0),0); },
  byType(db,t){ return db.budget.filter(c=>c.type===t); },
  sumType(db,t){ return this.byType(db,t).reduce((s,c)=>s+(+c.budgeted||0),0); },
  totalExpenses(db){ return this.sumType(db,'fixed')+this.sumType(db,'variable'); },   // living expenses
  debtPayments(db){ return this.sumType(db,'debt'); },
  plannedSavings(db){ return this.sumType(db,'savings')+this.sumType(db,'sinking'); },
  monthlySurplus(db){
    return this.netIncome(db) - this.totalExpenses(db) - this.debtPayments(db) - this.plannedSavings(db);
  },
  totalBudgetedOutflow(db){ return this.totalExpenses(db)+this.debtPayments(db)+this.plannedSavings(db); },
  freeCashFlow(db){ return this.monthlySurplus(db); },
  savingsRate(db){ const ni=this.netIncome(db); return ni?((this.plannedSavings(db))/ni*100):0; },
  totalDebt(db){ return this.byType(db,'debt').reduce((s,c)=>s+(+c.balance||0),0); },
  dti(db){ const ni=this.netIncome(db); return ni?(this.debtPayments(db)/ni*100):0; },
  emergencyMonths(db){
    const ef = db.accounts.filter(a=>/emergency|savings/i.test(a.name)||a.type==='savings').reduce((s,a)=>s+(+a.balance||0),0);
    const need = this.totalExpenses(db)+this.debtPayments(db);
    return need? ef/need : 0;
  },
  netWorth(db){
    const assets = db.accounts.reduce((s,a)=>s+(+a.balance||0),0);
    return assets - this.totalDebt(db);
  },
  actualsForMonth(db,ym){ return db.actuals[ym]||{}; },
  budgetUtilization(db,ym){
    const a=this.actualsForMonth(db,ym); const spentCats=this.byType(db,'fixed').concat(this.byType(db,'variable'));
    const bud=spentCats.reduce((s,c)=>s+(+c.budgeted||0),0);
    const act=spentCats.reduce((s,c)=>s+(+a[c.id]||0),0);
    return bud? act/bud*100 : 0;
  },
  variance(cat, actual){
    const b=+cat.budgeted||0; const va=actual-b; const vp = b? (va/b*100):0;
    return {budgeted:b, actual, variance_amount:va, variance_percentage:vp};
  },
  varianceStatus(db, cat, actual, projectedCashFlow){
    const {variance_percentage} = this.variance(cat, actual);
    const th=db.settings.thresholds;
    // Unfavorable = spending over budget for expense/debt; under target for savings is unfavorable too
    const isSpend = (cat.type==='fixed'||cat.type==='variable'||cat.type==='debt');
    let unfav; // signed unfavorable %
    if(isSpend) unfav = variance_percentage;          // positive = over spend = bad
    else unfav = -variance_percentage;                // savings: under target = positive unfav
    if(projectedCashFlow!==undefined && projectedCashFlow<0) return 'critical';
    if(unfav<=th.green) return 'green';
    if(unfav<=th.amber) return 'amber';
    return 'red';
  },
  varianceRows(db,ym){
    const a=this.actualsForMonth(db,ym);
    return db.budget.filter(c=>c.type!=='savings'||true).map(c=>{
      const act = +a[c.id]||0;
      const v=this.variance(c,act);
      const status=this.varianceStatus(db,c,act);
      return Object.assign({cat:c, category:c.name, type:c.type}, v, {status});
    });
  },
  topUnfavorable(db,ym,n=3){
    return this.varianceRows(db,ym)
      .filter(r=>(r.type==='fixed'||r.type==='variable'||r.type==='debt') && r.variance_amount>0)
      .sort((x,y)=>y.variance_amount-x.variance_amount).slice(0,n);
  },

  /* Goals */
  monthsBetween(fromISO,toISO){
    const a=new Date(fromISO||nowISO()), b=new Date(toISO);
    return Math.max(1, (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()));
  },
  goalCompute(db, g){
    const months=this.monthsBetween(nowISO(), g.target_date);
    const r=(+g.exp_return||0)/12;
    // expected growth on current balance over the horizon (simple compounding of current only)
    const fvCurrent = r? (+g.current)*Math.pow(1+r,months) : (+g.current);
    const expected_growth = fvCurrent - (+g.current);
    const remaining = Math.max(0, (+g.target) - (+g.current) - expected_growth);
    const required_monthly = remaining / months;
    const weekly = required_monthly*12/52;
    // current contribution: infer from a savings/sinking budget line matching by name, else 0
    const match = db.budget.find(c=>(c.type==='savings'||c.type==='sinking') && namesMatch(c.name,g.name));
    const current_contribution = match? (+match.budgeted||0) : 0;
    const gap = required_monthly - current_contribution;
    // projected completion at current contribution
    let proj=null;
    if(current_contribution>0){
      const need=(+g.target)-(+g.current);
      const m=Math.ceil(need/ (current_contribution + (r? (+g.current)*r : 0)));
      const dt=new Date(); dt.setMonth(dt.getMonth()+Math.max(1,m)); proj=dt.toISOString();
    }
    const progress = Math.min(100, (+g.current)/(+g.target)*100);
    return {months, required_monthly, weekly, current_contribution, gap, projected:proj, progress, expected_growth};
  },

  /* Mortgage */
  pmt(principal, annualRate, years){
    const r=annualRate/12, n=years*12;
    if(r===0) return principal/n;
    return principal * r / (1-Math.pow(1+r,-n));
  },
  mortgage(db, override){
    const m=Object.assign({}, db.mortgage, override||{});
    const price=+m.home_price, dp=+m.down_payment;
    const loan=Math.max(0, price-dp);
    const pi=this.pmt(loan, +m.rate, +m.term_years);
    const tax=(+m.property_tax_annual)/12;
    const ins=(+m.insurance_annual)/12;
    const hoa=(+m.hoa_monthly)||0;
    const ltv = price? loan/price : 0;
    const pmi = (ltv>0.8) ? (loan*(+m.pmi_annual_pct))/12 : 0;
    const maint = (price*(+m.maintenance_pct))/12;
    const housing_payment = pi+tax+ins+hoa+pmi;         // PITI+HOA+PMI (lender housing ratio)
    const full_ownership = pi+tax+ins+hoa+pmi+maint;    // + maintenance reserve
    const gross=+m.gross_monthly;
    const front = gross? housing_payment/gross*100 : 0;
    const back = gross? (housing_payment + (+m.existing_debt))/gross*100 : 0;
    const closing = price*(+m.closing_pct);
    const cash_needed = dp + closing;
    const reserves_after = (db.accounts.reduce((s,a)=>s+(+a.balance||0),0)) - cash_needed;
    return {loan,pi,tax,ins,hoa,pmi,maint,housing_payment,full_ownership,front,back,closing,cash_needed,reserves_after,ltv,price,dp,
            emergency_required:+m.emergency_required, gross, existing_debt:+m.existing_debt, rate:+m.rate, term:+m.term_years};
  },
  // affordable home price for a target back-end DTI
  affordableForDTI(db, targetBackPct){
    const m=db.mortgage; const gross=+m.gross_monthly;
    const maxHousing = gross*targetBackPct - (+m.existing_debt);
    if(maxHousing<=0) return {price:0,housing:0};
    // solve iteratively for price where housing_payment == maxHousing
    let lo=0, hi=2000000;
    for(let i=0;i<60;i++){
      const mid=(lo+hi)/2;
      const r=this.mortgage(db,{home_price:mid});
      if(r.housing_payment>maxHousing) hi=mid; else lo=mid;
    }
    const price=(lo+hi)/2; const r=this.mortgage(db,{home_price:price});
    return {price, housing:r.housing_payment, dti:targetBackPct*100};
  },
  rateSensitivity(db){
    const rates=[-0.01,-0.005,0,0.005,0.01,0.02];
    return rates.map(dr=>{ const r=this.mortgage(db,{rate:(+db.mortgage.rate)+dr}); return {rate:(+db.mortgage.rate)+dr, pi:r.pi, housing:r.housing_payment, back:r.back}; });
  },

  /* Scenario baseline snapshot */
  baseline(db){
    const ym=ymNow(0);
    const mtg=this.mortgage(db);
    return {
      label:'Baseline (immutable)',
      net_income:this.netIncome(db), expenses:this.totalExpenses(db), debt:this.debtPayments(db),
      savings:this.plannedSavings(db), surplus:this.monthlySurplus(db),
      dti:this.dti(db), emergency_months:this.emergencyMonths(db),
      housing:mtg.housing_payment, back_end:mtg.back, front_end:mtg.front,
      home_price:mtg.price, net_worth:this.netWorth(db)
    };
  }
};
function namesMatch(a,b){ a=a.toLowerCase(); b=b.toLowerCase();
  const key=(s)=>s.replace(/[^a-z]/g,''); const A=key(a),B=key(b);
  if(A.includes('emergency')&&B.includes('emergency'))return true;
  if(A.includes('down')&&B.includes('down'))return true;
  if((A.includes('car')||A.includes('auto'))&&(B.includes('car')||B.includes('vehicle')))return true;
  if(A.includes('vacation')&&B.includes('vacation'))return true;
  return false;
}

/* boot store immediately */
Store.load();
