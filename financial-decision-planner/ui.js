/* ============================================================
   UI LAYER  — router, views, assistant
   Appended after app.js (shares globals: Store, Calc, helpers)
   ============================================================ */

const NAV = [
  {id:'overview', label:'Overview', sub:'Your financial position at a glance', ico:'M3 12h4l3-9 4 18 3-9h4'},
  {id:'budget', label:'Budget', sub:'Income and category planning', ico:'M4 5h16M4 12h16M4 19h10'},
  {id:'transactions', label:'Transactions', sub:'Actual spending and anomaly flags', ico:'M4 6h16v12H4z M4 10h16'},
  {id:'reconciliation', label:'Reconciliation', sub:'Review queue for extracted records', ico:'M9 11l3 3 8-8 M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9'},
  {id:'goals', label:'Goals', sub:'Targets and required contributions', ico:'M12 2v20 M2 12h20'},
  {id:'mortgage', label:'Mortgage Readiness', sub:'Affordability planning estimates', ico:'M3 11l9-8 9 8 M5 10v10h14V10'},
  {id:'scenario', label:'Scenario Lab', sub:'Compare futures against baseline', ico:'M4 17l6-6 4 4 6-8'},
  {id:'recommendations', label:'Recommendation Center', sub:'Prioritized quantitative action plan', ico:'M9 11l3 3 8-8 M4 12a8 8 0 108-8'},
  {id:'documents', label:'Document Review', sub:'External extraction results', ico:'M6 2h9l5 5v15H6z M14 2v6h6'},
  {id:'settings', label:'Settings & Assumptions', sub:'Thresholds and planning inputs', ico:'M12 15a3 3 0 100-6 3 3 0 000 6z M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.3 1a7 7 0 00-1.7-1L14 2h-4l-.9 2.9a7 7 0 00-1.7 1l-2.3-1-2 3.5L3 11a7 7 0 000 2l-2 1.5 2 3.5 2.3-1a7 7 0 001.7 1L10 22h4l.9-2.9a7 7 0 001.7-1l2.3 1 2-3.5-2-1.5a7 7 0 00.1-1z'}
];

const App = {
  cur:'overview',
  budgetPeriod:'monthly',
  varMonth:ymNow(0),
  scenario:null,
  init(){
    document.getElementById('userLabel').textContent = Store.db.settings.display_name;
    const nav=document.getElementById('nav');
    nav.innerHTML=NAV.map(n=>`<button data-v="${n.id}" onclick="App.go('${n.id}')">
      <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${n.ico}"/></svg>
      <span>${n.label}</span></button>`).join('');
    this.go('overview');
    Assistant.init();
  },
  go(id){
    this.cur=id;
    const n=NAV.find(x=>x.id===id);
    document.getElementById('viewTitle').textContent=n.label;
    document.getElementById('viewSub').textContent=n.sub;
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.v===id));
    document.getElementById('sidebar').classList.remove('open');
    this.render();
    window.scrollTo(0,0);
  },
  render(){
    const c=document.getElementById('content');
    c.innerHTML = Views[this.cur] ? Views[this.cur]() : '<div class="empty">Not found</div>';
    if(Views['_after_'+this.cur]) Views['_after_'+this.cur]();
  }
};

/* ---------- shared render helpers ---------- */
const typeLabel={fixed:'Fixed',variable:'Variable',debt:'Debt',savings:'Savings',sinking:'Sinking fund'};
const badge=(status,text)=>`<span class="badge ${status}">${text||status}</span>`;
const syntheticNote='<div class="banner"><span class="b-badge">Synthetic</span> All records are synthetic demonstration data generated locally. No real financial data is present.</div>';

/* ============================================================
   VIEWS
   ============================================================ */
const Views={};

/* ---------- OVERVIEW ---------- */
Views.overview=function(){
  const db=Store.db, ym=App.varMonth;
  const ni=Calc.netIncome(db), exp=Calc.totalExpenses(db), debt=Calc.debtPayments(db);
  const fcf=Calc.freeCashFlow(db), sr=Calc.savingsRate(db), em=Calc.emergencyMonths(db);
  const td=Calc.totalDebt(db), dti=Calc.dti(db), nw=Calc.netWorth(db);
  const util=Calc.budgetUtilization(db,ym);
  const top=Calc.topUnfavorable(db,ym,3);
  const mtg=Calc.mortgage(db);
  const mReady = mtg.back<=db.settings.assumptions.back_end_max*100 && mtg.front<=db.settings.assumptions.front_end_max*100 && mtg.reserves_after>=mtg.emergency_required;
  const mStatus = mReady?'green':(mtg.back<=40?'amber':'red');
  const card=(lbl,val,cls,meta)=>`<div class="card"><div class="lbl">${lbl}</div><div class="val ${cls||''}">${val}</div>${meta?`<div class="meta">${meta}</div>`:''}</div>`;
  const goalsHtml = db.goals.map(g=>{const gc=Calc.goalCompute(db,g);const st=gc.progress>=75?'green':gc.progress>=40?'amber':'red';
    return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${g.name}</span><span class="mono">${fmtMoney(g.current)} / ${fmtMoney(g.target)}</span></div><div class="bar-track"><div class="bar-fill ${st}" style="width:${gc.progress}%"></div></div></div>`;}).join('');
  return `
  ${syntheticNote}
  <div class="grid cards" style="margin-bottom:18px">
    ${card('Net monthly income',fmtMoney(ni),'','Credit lines never counted')}
    ${card('Total monthly expenses',fmtMoney(exp),'','Fixed + variable')}
    ${card('Free cash flow',fmtMoney(fcf),fcf>=0?'pos':'neg','After expenses, debt &amp; savings')}
    ${card('Savings rate',fmtPct(sr),sr>=15?'pos':'', 'Of net income')}
    ${card('Emergency-fund months',em.toFixed(1),em>=6?'pos':em>=3?'':'neg','Target '+db.settings.assumptions.emergency_fund_target_months+' months')}
    ${card('Total debt',fmtMoney(td),'','Across '+Calc.byType(db,'debt').length+' accounts')}
    ${card('Debt-to-income',fmtPct(dti),dti<=15?'pos':dti<=25?'':'neg','Payments / net income')}
    ${card('Net worth',fmtMoney(nw),nw>=0?'pos':'neg','Assets - debt')}
    ${card('Budget utilization',fmtPct(util),util<=100?'':'neg',fmtDate(ym+'-01').replace(/,.*/,''))}
  </div>
  <div class="two-col">
    <div class="section">
      <h3>Top three unfavorable variances</h3>
      <div class="desc">Largest overspend against budget this month</div>
      ${top.length? top.map(r=>`<div class="kv"><span class="k">${r.category} ${badge(r.status)}</span><span class="v">+${fmtMoney(r.variance_amount)} (${fmtPct(r.variance_percentage)})</span></div>`).join('') : '<div class="empty">No unfavorable variances</div>'}
    </div>
    <div class="section">
      <h3>Goal progress</h3>
      <div class="desc">${db.goals.length} active goals</div>
      ${goalsHtml}
    </div>
  </div>
  <div class="section">
    <div class="section-head"><div><h3>Mortgage-readiness status ${badge(mStatus, mReady?'On track':'Needs work')}</h3>
    <div class="desc">Planning estimate only \u2014 not a lender approval</div></div></div>
    <div class="stat-inline">
      <div class="si"><div class="n">${fmtPct(mtg.front)}</div><div class="l">Front-end DTI (max ${(db.settings.assumptions.front_end_max*100)}%)</div></div>
      <div class="si"><div class="n">${fmtPct(mtg.back)}</div><div class="l">Back-end DTI (max ${(db.settings.assumptions.back_end_max*100)}%)</div></div>
      <div class="si"><div class="n">${fmtMoney(mtg.housing_payment)}</div><div class="l">Est. housing payment</div></div>
      <div class="si"><div class="n">${fmtMoney(mtg.reserves_after)}</div><div class="l">Reserves after closing</div></div>
    </div>
  </div>`;
};

/* ---------- BUDGET ---------- */
Views.budget=function(){
  const db=Store.db, p=App.budgetPeriod, f=(n)=>p==='weekly'? n*12/52 : n;
  const ni=Calc.netIncome(db), exp=Calc.totalExpenses(db), debt=Calc.debtPayments(db), sav=Calc.plannedSavings(db);
  const surplus=Calc.monthlySurplus(db);
  const grp=(t)=>Calc.byType(db,t).map(c=>`<tr>
      <td>${c.name}</td><td>${badge('gray',typeLabel[c.type])}</td>
      <td class="num">${fmtMoney(f(c.budgeted))}</td>
      ${c.type==='debt'?`<td class="num">${fmtMoney(c.balance||0)}</td><td class="num">${(c.apr||0)}%</td>`:'<td></td><td></td>'}
      <td><button class="btn ghost sm" onclick="Actions.editCat('${c.id}')">Edit</button></td></tr>`).join('');
  return `
  ${syntheticNote}
  <div class="section">
    <div class="section-head">
      <div><h3>Monthly income</h3><div class="desc">Available credit is never counted as income</div></div>
      <button class="btn sm" onclick="Actions.editIncome()">Edit income</button>
    </div>
    <div class="tbl-wrap"><table><thead><tr><th>Source</th><th class="num">Gross</th><th class="num">Net</th><th>Cadence</th></tr></thead><tbody>
      ${db.income.map(i=>`<tr><td>${i.name}</td><td class="num">${fmtMoney(i.gross||0)}</td><td class="num">${fmtMoney(i.amount)}</td><td>${i.cadence}</td></tr>`).join('')}
      <tr style="font-weight:600"><td>Total net income</td><td class="num"></td><td class="num">${fmtMoney(ni)}</td><td></td></tr>
    </tbody></table></div>
  </div>
  <div class="section">
    <div class="section-head">
      <div><h3>Budget categories</h3><div class="desc">Fixed, variable, debt, savings and sinking-fund lines</div></div>
      <div style="display:flex;gap:10px;align-items:center">
        <div class="pill-tabs"><button class="${p==='monthly'?'active':''}" onclick="App.budgetPeriod='monthly';App.render()">Monthly</button><button class="${p==='weekly'?'active':''}" onclick="App.budgetPeriod='weekly';App.render()">Weekly</button></div>
        <button class="btn sm" onclick="Actions.addCat()">Add category</button>
      </div>
    </div>
    <div class="tbl-wrap"><table><thead><tr><th>Category</th><th>Type</th><th class="num">${p==='weekly'?'Weekly':'Monthly'} budget</th><th class="num">Balance</th><th class="num">APR</th><th></th></tr></thead>
    <tbody>${grp('fixed')}${grp('variable')}${grp('debt')}${grp('savings')}${grp('sinking')}</tbody></table></div>
  </div>
  <div class="section">
    <h3>Monthly surplus</h3>
    <div class="desc">net_income &minus; total_expenses &minus; debt_payments &minus; planned_savings</div>
    <div class="tbl-wrap"><table><tbody>
      <tr><td>Net income</td><td class="num">${fmtMoney(f(ni))}</td></tr>
      <tr><td>Total expenses (fixed + variable)</td><td class="num">&minus;${fmtMoney(f(exp))}</td></tr>
      <tr><td>Debt payments</td><td class="num">&minus;${fmtMoney(f(debt))}</td></tr>
      <tr><td>Planned savings + sinking</td><td class="num">&minus;${fmtMoney(f(sav))}</td></tr>
      <tr style="font-weight:600"><td>${p==='weekly'?'Weekly':'Monthly'} surplus</td><td class="num" style="color:${surplus>=0?'var(--green)':'var(--red)'}">${fmtMoney(f(surplus))}</td></tr>
    </tbody></table></div>
  </div>`;
};

/* ---------- TRANSACTIONS / VARIANCE ---------- */
Views.transactions=function(){
  const db=Store.db, ym=App.varMonth;
  const months=Object.keys(db.actuals).sort();
  const rows=Calc.varianceRows(db,ym).filter(r=>r.type!=='sinking');
  const flagged=db.transactions.filter(t=>t.month===ym && t.flags && t.flags.length);
  const flagColor={duplicate:'red',missing:'amber',unusual:'amber',recurring:'blue',uncategorized:'gray'};
  return `
  ${syntheticNote}
  <div class="section">
    <div class="section-head">
      <div><h3>Budget vs actual by category</h3><div class="desc">variance_amount = actual &minus; budgeted &nbsp;&middot;&nbsp; variance_% = variance / budgeted &times; 100</div></div>
      <select style="width:auto" onchange="App.varMonth=this.value;App.render()">${months.map(m=>`<option ${m===ym?'selected':''} value="${m}">${m}</option>`).join('')}</select>
    </div>
    <div class="tbl-wrap"><table><thead><tr><th>Category</th><th>Type</th><th class="num">Budgeted</th><th class="num">Actual</th><th class="num">Variance</th><th class="num">Variance %</th><th>Status</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${r.category}</td><td>${badge('gray',typeLabel[r.type])}</td>
      <td class="num">${fmtMoney(r.budgeted)}</td><td class="num">${fmtMoney(r.actual)}</td>
      <td class="num" style="color:${r.variance_amount>0?'var(--red)':'var(--green)'}">${r.variance_amount>0?'+':''}${fmtMoney(r.variance_amount)}</td>
      <td class="num">${fmtPct(r.variance_percentage)}</td><td>${badge(r.status)}</td></tr>`).join('')}</tbody></table></div>
    <div class="mini" style="margin-top:10px">Thresholds: green within ${db.settings.thresholds.green}% &middot; amber ${db.settings.thresholds.green}\u2013${db.settings.thresholds.amber}% unfavorable &middot; red over ${db.settings.thresholds.amber}% &middot; critical if projected cash flow below zero</div>
  </div>
  <div class="section">
    <h3>Flagged transactions</h3>
    <div class="desc">Duplicate, missing, unusual, recurring and uncategorized items for ${ym}</div>
    ${flagged.length? `<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th><th>Flags</th></tr></thead>
    <tbody>${flagged.map(t=>`<tr><td>${t.date}</td><td>${t.description}</td><td>${t.category||'\u2014'}</td><td class="num">${fmtMoney2(t.amount)}</td><td>${t.flags.map(f=>badge(flagColor[f]||'gray',f)).join(' ')}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">No flagged transactions this month</div>'}
    <div class="mini" style="margin-top:10px">A "missing" flag would surface when a recurring category has no matching transaction in the period.</div>
  </div>`;
};

/* ---------- RECONCILIATION ---------- */
Views.reconciliation=function(){
  const db=Store.db;
  const q=db.reconcile;
  const decisionBadge=(d)=>({pending:'gray',approved:'green',rejected:'red',corrected:'amber'}[d]||'gray');
  return `
  ${syntheticNote}
  <div class="banner info"><span class="b-badge" style="background:#0d2440;color:var(--accent);border-color:var(--accent2)">Verify</span>
   Extracted (OCR) records are not made official until you approve them. Nothing here has modified your verified budget.</div>
  <div class="section">
    <div class="section-head"><div><h3>Review queue</h3><div class="desc">${q.filter(r=>r.decision==='pending').length} pending of ${q.length}</div></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Transaction</th><th>Source</th><th class="num">Extracted</th><th class="num">Confidence</th><th>Proposed category</th><th>Duplicate</th><th>Decision</th><th></th></tr></thead>
    <tbody>${q.map(r=>`<tr>
      <td>${r.transaction}</td><td>${r.source}</td>
      <td class="num">${fmtMoney2(r.extracted_value)}</td>
      <td class="num">${badge(r.confidence>=0.85?'green':r.confidence>=0.7?'amber':'red',(r.confidence*100).toFixed(0)+'%')}</td>
      <td>${r.proposed_category}</td>
      <td>${r.duplicate?badge('red','Duplicate'):badge('gray','No')}</td>
      <td>${badge(decisionBadge(r.decision),r.decision)}</td>
      <td><div class="btnrow">
        <button class="btn sm" ${r.decision==='approved'?'disabled':''} onclick="Actions.reconcile('${r.id}','approved')">Approve</button>
        <button class="btn sec sm" onclick="Actions.reconcileCorrect('${r.id}')">Correct</button>
        <button class="btn danger sm" ${r.decision==='rejected'?'disabled':''} onclick="Actions.reconcile('${r.id}','rejected')">Reject</button>
      </div></td></tr>`).join('')}</tbody></table></div>
  </div>`;
};

/* ---------- GOALS ---------- */
Views.goals=function(){
  const db=Store.db;
  return `
  ${syntheticNote}
  <div class="section">
    <div class="section-head"><div><h3>Financial goals</h3><div class="desc">required_monthly = (target &minus; current &minus; expected_growth) / months_remaining</div></div>
    <button class="btn sm" onclick="Actions.addGoal()">Add goal</button></div>
  </div>
  ${db.goals.map(g=>{const gc=Calc.goalCompute(db,g);const st=gc.progress>=75?'green':gc.progress>=40?'amber':'red';
    const incomeEffect=gc.gap>0?gc.gap:0;
    return `<div class="section">
      <div class="section-head">
        <div><h3>${g.name} ${badge(g.priority==='High'?'red':g.priority==='Medium'?'amber':'gray',g.priority)}</h3>
        <div class="desc">Target ${fmtMoney(g.target)} by ${fmtDate(g.target_date)} &middot; expected return ${(g.exp_return*100).toFixed(1)}%</div></div>
        <button class="btn ghost sm" onclick="Actions.editGoal('${g.id}')">Edit</button>
      </div>
      <div class="bar-track" style="margin-bottom:14px"><div class="bar-fill ${st}" style="width:${gc.progress}%"></div></div>
      <div class="three-col">
        <div><div class="kv"><span class="k">Required monthly</span><span class="v">${fmtMoney2(gc.required_monthly)}</span></div>
          <div class="kv"><span class="k">Weekly equivalent</span><span class="v">${fmtMoney2(gc.weekly)}</span></div>
          <div class="kv"><span class="k">Current contribution</span><span class="v">${fmtMoney2(gc.current_contribution)}</span></div></div>
        <div><div class="kv"><span class="k">Contribution gap</span><span class="v" style="color:${gc.gap>0?'var(--red)':'var(--green)'}">${fmtMoney2(gc.gap)}</span></div>
          <div class="kv"><span class="k">Projected completion</span><span class="v">${gc.projected?fmtDate(gc.projected):'\u2014'}</span></div>
          <div class="kv"><span class="k">Expected growth</span><span class="v">${fmtMoney2(gc.expected_growth)}</span></div></div>
        <div><div class="mini" style="margin-bottom:6px">What-if levers</div>
          <div class="kv"><span class="k">+ $250 income &rarr; contribution</span><span class="v">${fmtMoney2(Math.max(0,gc.required_monthly-250))}/mo need</span></div>
          <div class="kv"><span class="k">Cut $150 expenses</span><span class="v">closes ${Math.min(100,(150/(gc.gap||1)*100)).toFixed(0)}% of gap</span></div>
          <div class="kv"><span class="k">Extend deadline +6 mo</span><span class="v">${fmtMoney2((g.target-g.current-gc.expected_growth)/(gc.months+6))}/mo</span></div></div>
      </div>
    </div>`;}).join('')}`;
};

/* ---------- MORTGAGE ---------- */
Views.mortgage=function(){
  const db=Store.db, m=Calc.mortgage(db);
  const cons=Calc.affordableForDTI(db, db.settings.assumptions.conservative_back_end);
  const bal=Calc.affordableForDTI(db, db.settings.assumptions.balanced_back_end);
  const max=Calc.affordableForDTI(db, db.settings.assumptions.back_end_max);
  const sens=Calc.rateSensitivity(db);
  const kv=(k,v,c)=>`<div class="kv"><span class="k">${k}</span><span class="v" ${c?`style="color:${c}"`:''}>${v}</span></div>`;
  return `
  ${syntheticNote}
  <div class="banner"><span class="b-badge">Estimate</span> All mortgage figures are planning estimates, not a lender pre-approval or credit decision.</div>
  <div class="section-head" style="margin-bottom:14px">
    <div></div><button class="btn sm" onclick="Actions.editMortgage()">Edit inputs</button>
  </div>
  <div class="two-col">
    <div class="section"><h3>Full ownership cost (monthly)</h3>
      ${kv('Principal &amp; interest',fmtMoney(m.pi))}
      ${kv('Property taxes',fmtMoney(m.tax))}
      ${kv('Homeowners insurance',fmtMoney(m.ins))}
      ${kv('HOA',fmtMoney(m.hoa))}
      ${kv('Mortgage insurance (PMI)',fmtMoney(m.pmi))}
      ${kv('Maintenance reserve',fmtMoney(m.maint))}
      ${kv('Total full ownership cost',fmtMoney(m.full_ownership),'var(--accent)')}
      <hr class="sep">
      ${kv('Lender housing payment (PITI+HOA+PMI)',fmtMoney(m.housing_payment))}
    </div>
    <div class="section"><h3>Debt-to-income</h3>
      ${kv('Front-end DTI',fmtPct(m.front), m.front<=28?'var(--green)':m.front<=32?'var(--amber)':'var(--red)')}
      <div class="mini">housing_payment / gross_monthly_income</div>
      ${kv('Back-end DTI',fmtPct(m.back), m.back<=36?'var(--green)':m.back<=43?'var(--amber)':'var(--red)')}
      <div class="mini">(housing_payment + existing_debt) / gross_monthly_income</div>
      <hr class="sep">
      ${kv('Cash needed at closing',fmtMoney(m.cash_needed))}
      <div class="mini">down payment ${fmtMoney(m.dp)} + closing ${fmtMoney(m.closing)}</div>
      ${kv('Reserves remaining after closing',fmtMoney(m.reserves_after), m.reserves_after>=m.emergency_required?'var(--green)':'var(--red)')}
      <div class="mini">emergency-fund requirement: ${fmtMoney(m.emergency_required)}</div>
    </div>
  </div>
  <div class="section"><h3>Affordability tiers</h3>
    <div class="desc">Based on target back-end DTI ratios. Estimates only.</div>
    <div class="tbl-wrap"><table><thead><tr><th>Tier</th><th class="num">Target back-end DTI</th><th class="num">Affordable home price</th><th class="num">Est. housing payment</th></tr></thead>
    <tbody>
      <tr><td>Conservative ${badge('green')}</td><td class="num">${(db.settings.assumptions.conservative_back_end*100)}%</td><td class="num">${fmtMoney(cons.price)}</td><td class="num">${fmtMoney(cons.housing)}</td></tr>
      <tr><td>Balanced ${badge('amber')}</td><td class="num">${(db.settings.assumptions.balanced_back_end*100)}%</td><td class="num">${fmtMoney(bal.price)}</td><td class="num">${fmtMoney(bal.housing)}</td></tr>
      <tr><td>Est. maximum lender qualification ${badge('red')}</td><td class="num">${(db.settings.assumptions.back_end_max*100)}%</td><td class="num">${fmtMoney(max.price)}</td><td class="num">${fmtMoney(max.housing)}</td></tr>
    </tbody></table></div>
  </div>
  <div class="two-col">
    <div class="section"><h3>Payment sensitivity by rate</h3><div id="rateChart" class="chart-box"></div></div>
    <div class="section"><h3>Affordability improvement opportunities</h3>
      <div class="kv"><span class="k">Reach 20% down (avoid PMI)</span><span class="v">saves ${fmtMoney(m.pmi)}/mo</span></div>
      <div class="kv"><span class="k">Reduce existing debt by $300/mo</span><span class="v">back-end &rarr; ${fmtPct(((m.housing_payment+Math.max(0,m.existing_debt-300))/m.gross*100))}</span></div>
      <div class="kv"><span class="k">Rate 0.5% lower</span><span class="v">P&amp;I &rarr; ${fmtMoney(Calc.mortgage(db,{rate:m.rate-0.005}).pi)}</span></div>
      <div class="kv"><span class="k">Increase gross income $500/mo</span><span class="v">back-end &rarr; ${fmtPct(((m.housing_payment+m.existing_debt)/(m.gross+500)*100))}</span></div>
    </div>
  </div>`;
};
Views._after_mortgage=function(){
  const db=Store.db, sens=Calc.rateSensitivity(db);
  const g=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  if(!window.Highcharts) return;
  Highcharts.chart('rateChart',{
    chart:{type:'column',backgroundColor:'transparent',style:{fontFamily:'var(--sans)'}},
    title:{text:null}, credits:{enabled:false},
    xAxis:{categories:sens.map(s=>(s.rate*100).toFixed(2)+'%'),labels:{style:{color:'#adbac7'}},lineColor:'#30363d'},
    yAxis:{title:{text:'Monthly P&I ($)',style:{color:'#768390'}},labels:{style:{color:'#adbac7'}},gridLineColor:'#21262d'},
    legend:{enabled:false},
    tooltip:{backgroundColor:'#161b22',borderColor:'#30363d',style:{color:'#e6edf3'},valuePrefix:'$'},
    series:[{name:'P&I',data:sens.map(s=>Math.round(s.pi)),color:'#2f81f7'}]
  });
};

/* ---------- SCENARIO LAB ---------- */
Views.scenario=function(){
  const db=Store.db, base=Calc.baseline(db);
  if(!App.scenario) App.scenario={income_delta:0,expense_delta:0,debt_delta:0,home_price:db.mortgage.home_price,rate:db.mortgage.rate,down_payment:db.mortgage.down_payment,target_delta:0,savings_delta:0,inflation:db.settings.assumptions.inflation,onetime:0};
  const s=App.scenario;
  // compute scenario
  const ni=base.net_income+ +s.income_delta;
  const exp=base.expenses+ +s.expense_delta;
  const debt=base.debt+ +s.debt_delta;
  const sav=base.savings+ +s.savings_delta;
  const surplus=ni-exp-debt-sav - (+s.onetime)/12;
  const mtg=Calc.mortgage(db,{home_price:+s.home_price,rate:+s.rate,down_payment:+s.down_payment});
  const em=(db.accounts.reduce((a,x)=>a+(+x.balance||0),0) - (+s.onetime))/((exp+debt)||1);
  const dti=ni?debt/ni*100:0;
  const row=(lbl,b,v,fmt,better)=>{const d=v-b;const good=better==='up'?d>=0:d<=0;
    return `<tr><td>${lbl}</td><td class="num">${fmt(b)}</td><td class="num">${fmt(v)}</td><td class="num" style="color:${d===0?'var(--muted)':good?'var(--green)':'var(--red)'}">${d>0?'+':''}${fmt(d)}</td></tr>`;};
  const sl=(lbl,key,min,max,step,val,fmt)=>`<div class="field"><label class="fld">${lbl}: <span style="color:var(--text)">${fmt(val)}</span></label><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="App.scenario.${key}=+this.value;App.render()"></div>`;
  return `
  ${syntheticNote}
  <div class="banner info"><span class="b-badge" style="background:#0d2440;color:var(--accent);border-color:var(--accent2)">Baseline locked</span> The baseline is immutable. Adjust the levers below to compare scenarios against it.</div>
  <div class="section">
    <div class="section-head"><div><h3>Scenario levers</h3><div class="desc">Adjust and compare instantly</div></div>
    <button class="btn sec sm" onclick="App.scenario=null;App.render()">Reset to baseline</button></div>
    <div class="form-grid">
      ${sl('Income change (monthly)','income_delta',-3000,3000,50,s.income_delta,fmtMoney)}
      ${sl('Expense change (monthly)','expense_delta',-2000,2000,50,s.expense_delta,fmtMoney)}
      ${sl('Debt payment change','debt_delta',-1500,1500,50,s.debt_delta,fmtMoney)}
      ${sl('Savings contribution change','savings_delta',-1500,1500,50,s.savings_delta,fmtMoney)}
      ${sl('Home price','home_price',150000,900000,5000,s.home_price,fmtMoney)}
      ${sl('Interest rate','rate',0.03,0.10,0.00125,s.rate,(v)=>(v*100).toFixed(3)+'%')}
      ${sl('Down payment','down_payment',0,200000,2500,s.down_payment,fmtMoney)}
      ${sl('One-time expense','onetime',0,50000,500,s.onetime,fmtMoney)}
      ${sl('Inflation assumption','inflation',0,0.08,0.0025,s.inflation,(v)=>(v*100).toFixed(2)+'%')}
    </div>
  </div>
  <div class="section">
    <h3>Baseline vs scenario</h3>
    <div class="tbl-wrap"><table><thead><tr><th>Metric</th><th class="num">Baseline</th><th class="num">Scenario</th><th class="num">Change</th></tr></thead><tbody>
      ${row('Monthly cash flow',base.surplus,surplus,fmtMoney,'up')}
      ${row('Debt-to-income',base.dti,dti,(v)=>fmtPct(v),'down')}
      ${row('Emergency reserves (months)',base.emergency_months,em,(v)=>v.toFixed(1),'up')}
      ${row('Housing payment',base.housing,mtg.housing_payment,fmtMoney,'down')}
      ${row('Back-end DTI (housing)',base.back_end,mtg.back,(v)=>fmtPct(v),'down')}
      ${row('Affordable home price',base.home_price,mtg.price,fmtMoney,'up')}
    </tbody></table></div>
    <hr class="sep">
    <h3>Recommended actions</h3>
    ${scenarioAdvice(base,{surplus,dti,em,mtg}).map(a=>`<div class="kv"><span class="k">${badge(a.level)} ${a.text}</span><span class="v"></span></div>`).join('')}
    <div class="btnrow" style="margin-top:14px"><button class="btn sm" onclick="Actions.saveScenario()">Save this scenario</button></div>
  </div>`;
};
function scenarioAdvice(b,s){
  const out=[];
  if(s.surplus<0) out.push({level:'red',text:'Scenario runs a monthly deficit \u2014 reduce expenses or debt before proceeding.'});
  else if(s.surplus<b.surplus) out.push({level:'amber',text:'Cash flow drops versus baseline; confirm the trade-off is intentional.'});
  else out.push({level:'green',text:'Cash flow improves or holds versus baseline.'});
  if(s.mtg.back>36) out.push({level:'red',text:'Back-end DTI exceeds 36% \u2014 lenders may decline; lower price or debt.'});
  else if(s.mtg.back>28) out.push({level:'amber',text:'Back-end DTI in caution range (28\u201336%).'});
  if(s.em<3) out.push({level:'red',text:'Emergency reserves fall below 3 months.'});
  else if(s.em<6) out.push({level:'amber',text:'Emergency reserves below the 6-month target.'});
  return out;
}

/* ---------- DOCUMENT REVIEW (disabled external integration) ---------- */
Views.documents=function(){
  const db=Store.db;
  const st=(s)=>({pending_review:'amber',approved:'green',rejected:'red',reprocessing:'blue'}[s]||'gray');
  return `
  ${syntheticNote}
  <div class="disabled-panel" style="margin-bottom:18px">
    <div class="ico">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
    </div>
    <h4>Document processing is disabled</h4>
    <p><strong>External AWS integration required.</strong> Live document ingestion, OCR and sanitization are not connected in this prototype.</p>
    <p>The interface below renders <em>synthetic</em> results in the exact shape an external processing API would return, so review workflows can be validated. No real OCR or sanitization is performed, and no successful extraction is simulated.</p>
    <div class="btnrow" style="justify-content:center;margin-top:14px"><button class="btn" disabled>Connect processing API</button><button class="btn sec" disabled>Upload document</button></div>
  </div>
  <div class="section">
    <h3>Extraction results (synthetic preview)</h3>
    <div class="desc">Complete account numbers, SSNs and credentials are never exposed. Approve, correct, reject or reprocess each record.</div>
    ${db.documents.map(d=>`<div style="border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:14px">
      <div class="section-head">
        <div><h3 style="font-size:13.5px">${d.type} ${badge(st(d.processing_status),d.processing_status.replace('_',' '))} ${badge('gray',d.redaction_status)}</h3>
        <div class="desc">${d.institution} &middot; ${d.period_start} to ${d.period_end}</div></div>
      </div>
      <div class="two-col">
        <div>
          <div class="mini" style="margin-bottom:6px">Accounts (masked)</div>
          ${d.accounts.map(a=>`<div class="kv"><span class="k">${a.type} ${a.mask}</span><span class="v">${a.balance!=null?fmtMoney2(a.balance):'\u2014'}</span></div>`).join('')}
          <div class="kv"><span class="k">Income detected</span><span class="v">${d.income_detected?fmtMoney(d.income_detected):'\u2014'}</span></div>
          <div class="kv"><span class="k">Transactions</span><span class="v">${d.tx_count}</span></div>
          ${d.validation_errors.length?`<div class="kv"><span class="k">Validation</span><span class="v" style="color:var(--amber)">${d.validation_errors.length} issue(s)</span></div>`+d.validation_errors.map(e=>`<div class="mini" style="color:var(--amber)">&bull; ${e}</div>`).join(''):'<div class="kv"><span class="k">Validation</span><span class="v" style="color:var(--green)">Clean</span></div>'}
        </div>
        <div>
          <div class="mini" style="margin-bottom:6px">Extracted fields &amp; confidence</div>
          ${d.fields.map(f=>`<div class="kv"><span class="k">${f.label}${f.masked?' '+badge('gray','masked'):''}</span><span class="v">${f.value} ${badge(f.confidence>=0.85?'green':f.confidence>=0.7?'amber':'red',(f.confidence*100).toFixed(0)+'%')}</span></div>`).join('')}
        </div>
      </div>
      <div class="btnrow" style="margin-top:12px">
        <button class="btn sm" onclick="Actions.docAction('${d.id}','approved')">Approve</button>
        <button class="btn sec sm" onclick="Actions.docAction('${d.id}','corrected')">Correct</button>
        <button class="btn danger sm" onclick="Actions.docAction('${d.id}','rejected')">Reject</button>
        <button class="btn ghost sm" onclick="Actions.docAction('${d.id}','reprocessing')">Reprocess</button>
      </div>
    </div>`).join('')}
  </div>`;
};

/* ---------- SETTINGS & ASSUMPTIONS ---------- */
Views.settings=function(){
  const db=Store.db, a=db.settings.assumptions, t=db.settings.thresholds;
  const audit=db.audit.slice(0,40);
  const num=(lbl,path,val,step)=>`<div class="field"><label class="fld">${lbl}</label><input type="number" step="${step||1}" value="${val}" onchange="Actions.setSetting('${path}',this.value)"></div>`;
  return `
  ${syntheticNote}
  <div class="section">
    <h3>Variance thresholds</h3><div class="desc">Configurable status bands (percent unfavorable)</div>
    <div class="form-grid">
      ${num('Green within (%)','thresholds.green',t.green)}
      ${num('Amber up to (%)','thresholds.amber',t.amber)}
    </div>
    <div class="mini" style="margin-top:8px">Over the amber ceiling is red. A projected cash flow below zero is always critical.</div>
  </div>
  <div class="section">
    <h3>Simple Mode thresholds</h3><div class="desc">When the plain-language Home shows green, amber, or red (math unchanged)</div>
    <div class="form-grid">
      ${num('Thin-margin warning below (% of income)','simple.margin_thin_pct',(db.settings.simple||{}).margin_thin_pct)}
      ${num('Safety cushion "stable" at (months)','simple.reserve_stable_months',(db.settings.simple||{}).reserve_stable_months,0.5)}
      ${num('Safety cushion "critical" below (months)','simple.reserve_min_months',(db.settings.simple||{}).reserve_min_months,0.5)}
      ${num('Essential-coverage floor','simple.coverage_floor',(db.settings.simple||{}).coverage_floor,0.05)}
    </div>
  </div>
  <div class="section">
    <h3>Planning assumptions</h3><div class="desc">Used across goals, mortgage and scenarios</div>
    <div class="form-grid">
      ${num('Default expected return','assumptions.default_return',a.default_return,0.005)}
      ${num('Inflation','assumptions.inflation',a.inflation,0.0025)}
      ${num('Emergency-fund target (months)','assumptions.emergency_fund_target_months',a.emergency_fund_target_months)}
      ${num('Default mortgage rate','assumptions.default_rate',a.default_rate,0.00125)}
      ${num('Default term (years)','assumptions.default_term_years',a.default_term_years)}
      ${num('PMI annual %','assumptions.pmi_annual_pct',a.pmi_annual_pct,0.0005)}
      ${num('Front-end DTI max','assumptions.front_end_max',a.front_end_max,0.01)}
      ${num('Back-end DTI max','assumptions.back_end_max',a.back_end_max,0.01)}
      ${num('Conservative back-end','assumptions.conservative_back_end',a.conservative_back_end,0.01)}
      ${num('Balanced back-end','assumptions.balanced_back_end',a.balanced_back_end,0.01)}
      ${num('Maintenance reserve %/yr','assumptions.maintenance_reserve_pct',a.maintenance_reserve_pct,0.0025)}
    </div>
  </div>
  <div class="section">
    <h3>Data &amp; privacy</h3>
    <div class="kv"><span class="k">Storage scope</span><span class="v">Private &middot; user_id ${USER_ID}</span></div>
    <div class="kv"><span class="k">Storage location</span><span class="v">Local device only (no shared space)</span></div>
    <div class="kv"><span class="k">Dataset</span><span class="v">Synthetic demonstration</span></div>
    <div class="btnrow" style="margin-top:12px">
      <button class="btn sec sm" onclick="Actions.exportData()">Export my data (JSON)</button>
      <button class="btn danger sm" onclick="Actions.resetData()">Reset synthetic dataset</button>
    </div>
  </div>
  <div class="section">
    <h3>Audit history</h3><div class="desc">Approvals, corrections, calculations and scenario changes</div>
    ${audit.length?`<div class="tbl-wrap"><table><thead><tr><th>When</th><th>Type</th><th>Detail</th></tr></thead>
    <tbody>${audit.map(x=>`<tr><td>${new Date(x.at).toLocaleString()}</td><td>${badge('gray',x.kind)}</td><td>${x.detail}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No audit entries yet</div>'}
  </div>`;
};

/* ============================================================
   ACTIONS  (mutations — all confirm-gated where they touch verified data)
   ============================================================ */
const Actions={
  reconcile(id,decision){
    const r=Store.db.reconcile.find(x=>x.id===id); if(!r)return;
    if(decision==='approved' && !confirm('Approve this extracted record? It will be marked verified. Confirm to modify verified data.')) return;
    r.decision=decision; r.updated_at=nowISO(); r.verification_status = decision==='approved'?'verified':'rejected';
    Store.log('reconcile','Record "'+r.transaction+'" '+decision); Store.save(); toast('Record '+decision, decision==='approved'?'green':'red'); App.render();
  },
  reconcileCorrect(id){
    const r=Store.db.reconcile.find(x=>x.id===id); if(!r)return;
    const v=prompt('Corrected category for "'+r.transaction+'":', r.proposed_category); if(v===null)return;
    r.proposed_category=v; r.decision='corrected'; r.verification_status='verified'; r.updated_at=nowISO();
    Store.log('correction','Corrected "'+r.transaction+'" category to '+v); Store.save(); toast('Correction saved','amber'); App.render();
  },
  docAction(id,action){
    const d=Store.db.documents.find(x=>x.id===id); if(!d)return;
    if(action==='approved' && !confirm('Approve this document? Extracted values become verified records. Confirm to proceed.')) return;
    d.processing_status = action==='reprocessing'?'reprocessing':action; d.updated_at=nowISO();
    if(action==='approved'){ d.verification_status='verified'; d.fields.forEach(f=>f.verified=true); }
    Store.log('document', d.type+' '+action); Store.save(); toast('Document '+action, action==='approved'?'green':action==='rejected'?'red':'amber'); App.render();
  },
  setSetting(path,val){
    const parts=path.split('.'); let o=Store.db.settings; for(let i=0;i<parts.length-1;i++)o=o[parts[i]];
    o[parts[parts.length-1]] = parseFloat(val);
    Store.db.settings.updated_at=nowISO();
    Store.log('settings','Changed '+path+' to '+val); Store.save(); toast('Setting updated','green'); App.render();
  },
  editIncome(){
    const db=Store.db;
    modal('Edit income', db.income.map((i,idx)=>`
      <div class="form-grid" style="margin-bottom:12px">
        <div class="field"><label class="fld">Source</label><input value="${i.name}" data-i="${idx}" data-k="name"></div>
        <div class="field"><label class="fld">Gross</label><input type="number" value="${i.gross||0}" data-i="${idx}" data-k="gross"></div>
        <div class="field"><label class="fld">Net</label><input type="number" value="${i.amount}" data-i="${idx}" data-k="amount"></div>
      </div>`).join('')+'<div class="mini">Available credit is never counted as income.</div>',
      ()=>{ document.querySelectorAll('#modal input[data-i]').forEach(el=>{const i=+el.dataset.i,k=el.dataset.k;db.income[i][k]=k==='name'?el.value:parseFloat(el.value)||0;db.income[i].updated_at=nowISO();});
        Store.log('income','Edited income sources'); Store.save(); toast('Income updated','green'); App.render(); });
  },
  addCat(){ this._catForm(null); },
  editCat(id){ this._catForm(id); },
  _catForm(id){
    const db=Store.db; const c=id?db.budget.find(x=>x.id===id):{name:'',type:'variable',budgeted:0};
    modal(id?'Edit category':'Add category',`
      <div class="form-grid">
        <div class="field"><label class="fld">Name</label><input id="c-name" value="${c.name}"></div>
        <div class="field"><label class="fld">Type</label><select id="c-type">${['fixed','variable','debt','savings','sinking'].map(t=>`<option ${c.type===t?'selected':''} value="${t}">${typeLabel[t]}</option>`).join('')}</select></div>
        <div class="field"><label class="fld">Monthly budget</label><input id="c-bud" type="number" value="${c.budgeted||0}"></div>
        <div class="field"><label class="fld">Balance (debt)</label><input id="c-bal" type="number" value="${c.balance||0}"></div>
        <div class="field"><label class="fld">APR % (debt)</label><input id="c-apr" type="number" step="0.1" value="${c.apr||0}"></div>
      </div>`,
      ()=>{ const o={name:val('c-name'),type:val('c-type'),budgeted:+val('c-bud'),balance:+val('c-bal'),apr:+val('c-apr')};
        if(id){ Object.assign(c,o); c.updated_at=nowISO(); Store.log('budget','Edited category '+o.name); }
        else { db.budget.push(Object.assign({id:uid('cat'),created_at:nowISO(),updated_at:nowISO(),source:'user',verification_status:'verified',user_id:USER_ID},o)); Store.log('budget','Added category '+o.name); }
        Store.save(); toast('Category saved','green'); App.render(); },
      id?[{label:'Delete',cls:'danger',fn:()=>{if(confirm('Delete this category?')){Store.db.budget=db.budget.filter(x=>x.id!==id);Store.log('budget','Deleted category '+c.name);Store.save();closeModal();toast('Deleted','red');App.render();}}}]:[]);
  },
  addGoal(){ this._goalForm(null); },
  editGoal(id){ this._goalForm(id); },
  _goalForm(id){
    const db=Store.db; const g=id?db.goals.find(x=>x.id===id):{name:'',target:0,current:0,target_date:addMonths(12),priority:'Medium',exp_return:db.settings.assumptions.default_return};
    modal(id?'Edit goal':'Add goal',`
      <div class="form-grid">
        <div class="field"><label class="fld">Target name</label><input id="g-name" value="${g.name}"></div>
        <div class="field"><label class="fld">Target amount</label><input id="g-target" type="number" value="${g.target}"></div>
        <div class="field"><label class="fld">Current amount</label><input id="g-current" type="number" value="${g.current}"></div>
        <div class="field"><label class="fld">Target date</label><input id="g-date" type="date" value="${(g.target_date||'').slice(0,10)}"></div>
        <div class="field"><label class="fld">Priority</label><select id="g-pri">${['High','Medium','Low'].map(p=>`<option ${g.priority===p?'selected':''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label class="fld">Expected return</label><input id="g-ret" type="number" step="0.005" value="${g.exp_return}"></div>
      </div>`,
      ()=>{ const o={name:val('g-name'),target:+val('g-target'),current:+val('g-current'),target_date:new Date(val('g-date')).toISOString(),priority:val('g-pri'),exp_return:+val('g-ret')};
        if(id){ Object.assign(g,o); g.updated_at=nowISO(); Store.log('goal','Edited goal '+o.name); }
        else { db.goals.push(Object.assign({id:uid('goal'),created_at:nowISO(),updated_at:nowISO(),source:'user',verification_status:'verified',user_id:USER_ID},o)); Store.log('goal','Added goal '+o.name); }
        Store.save(); toast('Goal saved','green'); App.render(); },
      id?[{label:'Delete',cls:'danger',fn:()=>{if(confirm('Delete this goal?')){Store.db.goals=db.goals.filter(x=>x.id!==id);Store.log('goal','Deleted goal '+g.name);Store.save();closeModal();toast('Deleted','red');App.render();}}}]:[]);
  },
  editMortgage(){
    const db=Store.db,m=db.mortgage;
    const f=[['home_price','Home price'],['down_payment','Down payment'],['rate','Interest rate'],['term_years','Term (years)'],['gross_monthly','Gross monthly income'],['net_monthly','Net monthly income'],['existing_debt','Existing debt payments'],['property_tax_annual','Property taxes (annual)'],['insurance_annual','Insurance (annual)'],['hoa_monthly','HOA (monthly)'],['pmi_annual_pct','PMI annual %'],['closing_pct','Closing cost %'],['maintenance_pct','Maintenance %/yr'],['emergency_required','Emergency-fund requirement']];
    modal('Edit mortgage inputs','<div class="form-grid">'+f.map(([k,l])=>`<div class="field"><label class="fld">${l}</label><input id="m-${k}" type="number" step="any" value="${m[k]}"></div>`).join('')+'</div>',
      ()=>{ f.forEach(([k])=>{m[k]=parseFloat(val('m-'+k))||0;}); m.updated_at=nowISO(); Store.log('mortgage','Updated mortgage inputs'); Store.save(); toast('Mortgage inputs saved','green'); App.render(); });
  },
  saveScenario(){
    const s=clone(App.scenario); s.id=uid('scn'); s.saved_at=nowISO();
    Store.db.scenarios.push(s); Store.log('scenario','Saved a scenario comparison'); Store.save(); toast('Scenario saved','green');
  },
  exportData(){
    const blob=new Blob([JSON.stringify(Store.db,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='financial_planner_synthetic_export.json'; a.click();
    Store.log('data','Exported data as JSON'); toast('Export started','green');
  },
  resetData(){ if(confirm('Reset to the synthetic demonstration dataset? This clears local changes.')){ Store.reset(); toast('Dataset reset','amber'); App.render(); } }
};
const val=(id)=>document.getElementById(id).value;

/* ---------- modal + toast ---------- */
function modal(title, body, onSave, extraBtns){
  const mb=document.getElementById('modalBg'), m=document.getElementById('modal');
  const extra=(extraBtns||[]).map((b,i)=>`<button class="btn ${b.cls||'sec'} sm" data-x="${i}">${b.label}</button>`).join('');
  m.innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="x-btn" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-foot">${extra}<button class="btn sec" onclick="closeModal()">Cancel</button><button class="btn" id="modalSave">Save</button></div>`;
  mb.classList.add('open');
  document.getElementById('modalSave').onclick=()=>{ onSave&&onSave(); closeModal(); };
  (extraBtns||[]).forEach((b,i)=>{ m.querySelector(`[data-x="${i}"]`).onclick=b.fn; });
}
function closeModal(){ document.getElementById('modalBg').classList.remove('open'); }
document.getElementById('modalBg').addEventListener('click',e=>{ if(e.target.id==='modalBg') closeModal(); });
function toast(msg,cls){ const t=document.getElementById('toast'); t.className='toast '+(cls||''); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }

/* ============================================================
   AI FINANCIAL ASSISTANT  (grounded only in stored data)
   ============================================================ */
const Assistant={
  open:false,
  init(){
    this.suggest();
    this.push('bot', "I answer only from your stored data, approved records, the selected scenario, and your documented assumptions. I show my calculations, separate <span class='tag v'>verified</span> values from <span class='tag e'>estimates</span>, and I will ask for anything missing rather than invent it.");
  },
  toggle(){ this.open=!this.open; document.getElementById('assistant').classList.toggle('open',this.open); document.getElementById('fab').style.display=this.open?'none':'flex'; if(this.open) document.getElementById('asstInput').focus(); },
  suggest(){
    const qs=['What is my free cash flow?','Can I afford a home?','How am I tracking to my goals?','What is my highest-impact move?','What is my emergency fund status?'];
    document.getElementById('asstSuggest').innerHTML=qs.map(q=>`<button onclick="Assistant.ask('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('');
  },
  push(who,html){ const b=document.getElementById('asstBody'); const d=document.createElement('div'); d.className='msg '+who; d.innerHTML=html; b.appendChild(d); b.scrollTop=b.scrollHeight; },
  send(){ const i=document.getElementById('asstInput'); const q=i.value.trim(); if(!q)return; i.value=''; this.ask(q); },
  ask(q){ this.push('user', q.replace(/</g,'&lt;')); const ans=this.answer(q); setTimeout(()=>this.push('bot',ans),140); Store.log('assistant','Q: '+q); },
  answer(q){
    const db=Store.db; const s=q.toLowerCase();
    const V="<span class='tag v'>verified</span>", E="<span class='tag e'>estimate</span>";
    const calc=(t)=>`<div class='calc'>${t}</div>`;
    // free cash flow / surplus
    if(/(cash flow|surplus|free cash|left over|leftover)/.test(s)){
      const ni=Calc.netIncome(db),ex=Calc.totalExpenses(db),d=Calc.debtPayments(db),sv=Calc.plannedSavings(db),fcf=Calc.monthlySurplus(db);
      return `${V} Your monthly free cash flow is <b>${fmtMoney(fcf)}</b>.`+calc(`monthly_surplus = net_income - expenses - debt - savings\n= ${fmtMoney(ni)} - ${fmtMoney(ex)} - ${fmtMoney(d)} - ${fmtMoney(sv)}\n= ${fmtMoney(fcf)}`)+(fcf<0?'This is a deficit \u2014 reducing variable spending is the fastest lever.':'This surplus is available for goals or debt.');
    }
    // afford home / mortgage
    if(/(afford|mortgage|house|home|buy)/.test(s)){
      const m=Calc.mortgage(db); const ready=m.back<=36&&m.front<=28&&m.reserves_after>=m.emergency_required;
      return `${E} Planning estimate only \u2014 not a lender decision. At a ${fmtMoney(m.price)} home price your housing payment is about <b>${fmtMoney(m.housing_payment)}</b>.`+
        calc(`front_end_DTI = housing / gross = ${fmtMoney(m.housing_payment)} / ${fmtMoney(m.gross)} = ${fmtPct(m.front)}\nback_end_DTI = (housing + debt) / gross = (${fmtMoney(m.housing_payment)} + ${fmtMoney(m.existing_debt)}) / ${fmtMoney(m.gross)} = ${fmtPct(m.back)}\nreserves after closing = ${fmtMoney(m.reserves_after)} (need ${fmtMoney(m.emergency_required)})`)+
        (ready?'You meet conservative front/back-end and reserve thresholds.':'One or more thresholds are exceeded \u2014 see Mortgage Readiness for improvement levers.');
    }
    // goals
    if(/(goal|save|target|contribut)/.test(s)){
      const lines=db.goals.map(g=>{const gc=Calc.goalCompute(db,g);return `\u2022 ${g.name}: ${gc.progress.toFixed(0)}% funded, needs ${fmtMoney2(gc.required_monthly)}/mo (gap ${fmtMoney2(gc.gap)})`;}).join('<br>');
      return `${V+E} Goal tracking (targets verified, growth estimated):<br>${lines}`;
    }
    // emergency fund
    if(/(emergency|reserve|rainy)/.test(s)){
      const em=Calc.emergencyMonths(db);
      return `${V} You have <b>${em.toFixed(1)} months</b> of emergency coverage (target ${db.settings.assumptions.emergency_fund_target_months}).`+(em<3?' Below the 3-month floor \u2014 prioritize this.':em<6?' Building toward the 6-month target.':' Fully funded.');
    }
    // debt
    if(/(debt|owe|loan|credit card|dti|income ratio)/.test(s)){
      const td=Calc.totalDebt(db),dti=Calc.dti(db);
      const hi=Calc.byType(db,'debt').slice().sort((a,b)=>(b.apr||0)-(a.apr||0))[0];
      return `${V} Total debt is <b>${fmtMoney(td)}</b>; debt-to-income is <b>${fmtPct(dti)}</b>.`+calc(`DTI = debt_payments / net_income = ${fmtMoney(Calc.debtPayments(db))} / ${fmtMoney(Calc.netIncome(db))} = ${fmtPct(dti)}`)+(hi?`Highest-rate balance: ${hi.name} at ${hi.apr}% \u2014 target it first (avalanche).`:'');
    }
    // net worth
    if(/(net worth|networth|wealth)/.test(s)){
      const nw=Calc.netWorth(db);
      return `${V} Estimated net worth is <b>${fmtMoney(nw)}</b>.`+calc(`net_worth = assets - debt = ${fmtMoney(db.accounts.reduce((a,x)=>a+(+x.balance||0),0))} - ${fmtMoney(Calc.totalDebt(db))} = ${fmtMoney(nw)}`);
    }
    // highest impact
    if(/(impact|priorit|recommend|advice|should i|best move|focus)/.test(s)){
      return this.recommendation();
    }
    // variance
    if(/(variance|over budget|overspend|spend)/.test(s)){
      const top=Calc.topUnfavorable(db,App.varMonth,3);
      if(!top.length) return `${V} No unfavorable variances this month \u2014 spending is within budget.`;
      return `${V} Top overspend this month:<br>`+top.map(r=>`\u2022 ${r.category}: +${fmtMoney(r.variance_amount)} (${fmtPct(r.variance_percentage)})`).join('<br>');
    }
    // unknown / missing data
    return `I can only answer from your stored data, approved records, the selected scenario, and documented assumptions \u2014 and I won't guess. I can cover cash flow, budget variance, goals, debt, emergency fund, net worth, mortgage affordability, or your highest-impact move. Could you rephrase toward one of those, or tell me which value you'd like me to use if something's missing?`;
  },
  recommendation(){
    const db=Store.db; const cand=[];
    const fcf=Calc.monthlySurplus(db); const em=Calc.emergencyMonths(db); const dti=Calc.dti(db);
    const hi=Calc.byType(db,'debt').slice().sort((a,b)=>(b.apr||0)-(a.apr||0))[0];
    if(fcf<0) cand.push({score:100,text:`Close the monthly deficit of ${fmtMoney(-fcf)} first \u2014 trim the largest variable categories.`});
    if(em<3) cand.push({score:90,text:`Build emergency reserves to 3 months; you're at ${em.toFixed(1)}. This protects every other plan.`});
    if(hi&&hi.apr>=18) cand.push({score:85,text:`Attack the ${hi.name} at ${hi.apr}% APR \u2014 highest guaranteed return via avalanche.`});
    if(dti>25) cand.push({score:70,text:`Lower debt-to-income (now ${fmtPct(dti)}) before taking on a mortgage.`});
    if(!cand.length) cand.push({score:50,text:`Cash flow, reserves and debt look healthy \u2014 direct surplus (${fmtMoney(fcf)}) to your highest-priority goal.`});
    cand.sort((a,b)=>b.score-a.score); const top=cand[0];
    return `<span class='tag v'>verified</span> Highest-impact recommendation: <b>${top.text}</b><br><span class='mini'>Ranked from your current stored figures; this is planning guidance, not investment, tax or legal advice.</span>`;
  }
};

/* ---------- boot ---------- */
App.init();
