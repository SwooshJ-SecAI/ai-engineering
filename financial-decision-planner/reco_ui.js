/* ============================================================
   RECOMMENDATION CENTER — view + interactions (extension)
   Appended after reco.js. Registers Views.recommendations and
   Views._after_recommendations without altering existing views.
   ============================================================ */
'use strict';

/* live result cache for the current session view */
App.recoResult = null;
App.recoView = 'cards';   // cards | report | plans | history

Views.recommendations = function(){
  const db=Store.db;
  const dq=DataQuality.score(db);
  const dqBadge = dq.score>=90?'green':dq.score>=75?'blue':dq.score>=60?'amber':'red';
  const r=App.recoResult;
  const tabs=(id,lbl)=>`<button class="${App.recoView===id?'active':''}" onclick="App.recoView='${id}';App.render()">${lbl}</button>`;
  return `
  ${syntheticNote}
  <div class="banner info"><span class="b-badge" style="background:#0d2440;color:var(--accent);border-color:var(--accent2)">Advisory</span>
    Recommendations are quantitative planning guidance from your stored data — not guaranteed lending, tax, legal, or investment advice. Nothing here changes a verified record or the baseline until you approve it.</div>

  <div class="section">
    <div class="section-head">
      <div><h3>Recommendation Center</h3><div class="desc">Prioritized action plan regenerated on each financial review</div></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span class="badge ${dqBadge}" title="Data-quality gate">Data quality ${dq.score.toFixed(0)} \u00b7 ${dq.band}</span>
        <button class="btn" onclick="RecoUI.run()">Run Financial Review</button>
      </div>
    </div>
    <div class="stat-inline" style="margin-top:6px">
      <div class="si"><div class="n">${fmtMoney(Calc.monthlySurplus(db))}</div><div class="l">Free cash flow</div></div>
      <div class="si"><div class="n">${RecoData.essentialExpenses(db)?(RecoData.liquidEmergency(db)/RecoData.essentialExpenses(db)).toFixed(1):'0'}</div><div class="l">Emergency months (essentials)</div></div>
      <div class="si"><div class="n">${fmtPct(Calc.dti(db))}</div><div class="l">Debt-to-income</div></div>
      <div class="si"><div class="n">${db.reco_runs.length}</div><div class="l">Saved runs</div></div>
    </div>
  </div>

  ${!r ? `<div class="section"><div class="empty">No review yet this session. Click <strong>Run Financial Review</strong> to generate a prioritized action plan from your current data.${db.reco_runs.length?' Your last saved run is available under History.':''}</div>
    <div class="pill-tabs" style="margin-top:8px">${tabs('history','History')}</div>
    ${App.recoView==='history'?RecoUI.historyHtml():''}</div>`
  : `
  <div class="pill-tabs" style="margin-bottom:14px">
    ${tabs('cards','Action cards')} ${tabs('report','Budget-run report')} ${tabs('plans','Plan bundles')} ${tabs('history','History')}
  </div>
  ${App.recoView==='cards'?RecoUI.cardsHtml(r):''}
  ${App.recoView==='report'?RecoUI.reportHtml(r):''}
  ${App.recoView==='plans'?RecoUI.plansHtml(r):''}
  ${App.recoView==='history'?RecoUI.historyHtml():''}
  `}`;
};
Views._after_recommendations=function(){ /* charts if any later */ };

const RecoUI = {
  run(){
    const db=Store.db;
    const r=Reco.build(db);
    App.recoResult=r; App.recoView='cards';
    // persist a versioned run
    const prev=db.reco_runs[db.reco_runs.length-1]||null;
    const runRec={ id:uid('run'), at:nowISO(), user_id:USER_ID,
      metrics:r.metrics, dq:{score:r.dq.score,band:r.dq.band},
      recos:r.primary.map(x=>({key:x.key,action:x.action,score:x.score,class:x.class,monthly:x.monthly,annual:x.annual,provisional:x.provisional})),
      conditions:Reco.conditions(db,r).length };
    db.reco_runs.push(runRec);
    if(db.reco_runs.length>60) db.reco_runs.shift();
    Store.log('review','Ran financial review — '+r.primary.length+' recommendations, DQ '+r.dq.score.toFixed(0));
    Store.save();
    App._prevRun=prev;
    toast('Financial review complete','green'); App.render();
  },

  statusOf(key){ return (Store.db.reco_status[key]||{}).status||'new'; },
  setStatus(key,status,reason){
    Store.db.reco_status[key]={status,reason:reason||null,at:nowISO()};
    Store.log('recommendation', key+' → '+status+(reason?(' ('+reason+')'):''));
    Store.save(); App.render();
  },
  act(key,status){
    if(status==='dismissed'){ const reason=prompt('Reason for dismissing this recommendation (recorded in audit):',''); if(reason===null) return; this.setStatus(key,'dismissed',reason); toast('Recommendation dismissed','amber'); return; }
    this.setStatus(key,status); toast('Marked '+status,'green');
  },

  cardsHtml(r){
    if(!r.primary.length) return '<div class="section"><div class="empty">No action needed — cash flow, reserves, debt, goals, and mortgage readiness are within thresholds on current data.</div></div>';
    const cond=Reco.conditions(Store.db,r);
    const condHtml = cond.length? `<div class="section"><h3>Conditions requiring attention</h3><div class="desc">Rule-based gates applied to this run</div>${cond.map(c=>`<div class="kv"><span class="k">${badge(c.level)} ${c.text}</span><span class="v"></span></div>`).join('')}</div>`:'';
    const cards=r.primary.map((x,i)=>this.card(x,i+1)).join('');
    const awaiting=r.dq.gaps.length? `<div class="section"><h3>Items awaiting verification</h3>${r.dq.gaps.map(g=>`<div class="kv"><span class="k">${badge('amber')} ${g}</span><span class="v"></span></div>`).join('')}</div>`:'';
    return condHtml+cards+awaiting;
  },

  card(x,rank){
    const st=this.statusOf(x.key);
    const stBadge={new:'gray',accepted:'green',deferred:'amber',dismissed:'red',completed:'blue'}[st]||'gray';
    const eff=(lbl,v)=>`<div class="kv"><span class="k">${lbl}</span><span class="v">${v}</span></div>`;
    const money=(n)=> n===0?'\u2014':(n>0?'+':'')+fmtMoney2(Math.abs(n)*(n<0?-1:1)).replace('$-','-$');
    return `<div class="section" style="border-left:3px solid var(--${classBadge(x.score)}-bd,var(--border))">
      <div class="section-head">
        <div>
          <h3>#${rank} \u00b7 ${x.action} ${badge(classBadge(x.score),x.class)} ${x.provisional?badge('amber','Provisional \u2014 verify source data'):''}</h3>
          <div class="desc">${x.area} \u00b7 score ${x.score}/100 \u00b7 confidence ${x.confidenceLabel} (${x.dims.confidence}) \u00b7 status ${badge(stBadge,st)}</div>
        </div>
        <div style="text-align:right;min-width:120px">
          <div class="mini">Priority score</div>
          <div style="font-family:var(--mono);font-size:22px;font-weight:600;color:var(--${classBadge(x.score)},var(--text))">${x.score}</div>
        </div>
      </div>
      <div class="two-col">
        <div>
          ${eff('Why it matters',x.why)}
          ${eff('Current state',x.current)}
          ${eff('Proposed adjustment',x.proposed)}
          ${eff('Next step',x.firstAction)}
          ${eff('Review date',fmtDate(x.reviewDate))}
        </div>
        <div>
          ${eff('Monthly effect',money(x.monthly))}
          ${eff('Annual effect',money(x.annual))}
          ${eff('Goal effect',x.goalEffect)}
          ${eff('Debt / interest effect',x.debtEffect)}
          ${eff('Mortgage-readiness effect',x.mortgageEffect)}
          ${eff('Risk / tradeoff',x.risk)}
          ${eff('Data used',x.dataUsed.join(', '))}
        </div>
      </div>
      <div class="btnrow" style="margin-top:12px">
        <button class="btn ghost sm" onclick="RecoUI.why('${x.key}')">Why this recommendation?</button>
        <button class="btn ghost sm" onclick="RecoUI.whatIf('${x.key}')">What if I accept this?</button>
        <button class="btn ghost sm" onclick="App.go('scenario')">Compare with baseline</button>
        <span style="flex:1"></span>
        <button class="btn sm" onclick="RecoUI.act('${x.key}','accepted')">Accept</button>
        <button class="btn sec sm" onclick="RecoUI.act('${x.key}','deferred')">Defer</button>
        <button class="btn sec sm" onclick="RecoUI.act('${x.key}','completed')">Complete</button>
        <button class="btn danger sm" onclick="RecoUI.act('${x.key}','dismissed')">Dismiss</button>
      </div>
    </div>`;
  },

  why(key){
    const r=App.recoResult; const x=r.all.find(z=>z.key===key); if(!x) return;
    const a=Store.db.settings.assumptions;
    const body=`
      <div class="mini" style="margin-bottom:6px">FORMULA & INPUTS</div>
      <div class="calc" style="font-family:var(--mono);font-size:11.5px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:10px;white-space:pre-wrap;color:var(--text2)">${x.calc.join('\n')}</div>
      <div class="kv"><span class="k">Data sources</span><span class="v">${x.dataUsed.join(', ')}</span></div>
      <div class="kv"><span class="k">Key assumptions</span><span class="v">return ${(a.default_return*100).toFixed(1)}%, inflation ${(a.inflation*100).toFixed(1)}%, reserve target ${a.reserve_target_months} mo${a.tax_rate!=null?(', tax '+(a.tax_rate*100).toFixed(0)+'%'):', tax rate: not assumed'}</span></div>
      <div class="kv"><span class="k">Most sensitive assumption</span><span class="v">${this.sensitiveNote(x)}</span></div>
      <div class="kv"><span class="k">Confidence limitation</span><span class="v">${x.provisional?'Below 60 — provisional; verify source data before acting definitively.':'Confidence '+x.dims.confidence+' — acceptable for planning.'}</span></div>
      <div class="kv"><span class="k">What would invalidate this</span><span class="v">${this.invalidator(x)}</span></div>
      <div class="kv"><span class="k">If you do nothing</span><span class="v">${this.doNothing(x)}</span></div>`;
    modal('Why this recommendation? \u2014 '+x.action, body, null, []);
  },
  sensitiveNote(x){
    if(/debt/i.test(x.area)) return 'APR and extra-payment amount drive interest saved.';
    if(/emergency/i.test(x.area)) return 'Reserve-target months changes the required contribution proportionally.';
    if(/mortgage/i.test(x.area)) return 'Interest rate and existing debt move DTI the most.';
    if(/goal/i.test(x.area)) return 'Target date and expected return dominate the required monthly figure.';
    if(/cash/i.test(x.area)) return 'The tax rate (if used) changes the gross-income requirement.';
    return 'Income and essential-expense estimates.';
  },
  invalidator(x){
    if(/debt/i.test(x.area)) return 'A lower verified APR, a prepayment penalty, or reserves dropping below the floor.';
    if(/mortgage/i.test(x.area)) return 'Updated rate quote, changed home price, or verified income change.';
    if(/goal/i.test(x.area)) return 'A change to target amount, date, or contribution capacity.';
    if(/cash/i.test(x.area)) return 'Corrected income or a reclassified one-time expense.';
    return 'Any correction to the underlying records or assumptions.';
  },
  doNothing(x){
    if(/cash/i.test(x.area)) return 'The monthly deficit continues to erode reserves.';
    if(/emergency/i.test(x.area)) return 'You remain exposed to a shock with limited buffer.';
    if(/debt/i.test(x.area)) return 'Interest keeps accruing at the current APR.';
    if(/mortgage/i.test(x.area)) return 'Qualification and post-closing safety stay below guides.';
    if(/goal/i.test(x.area)) return 'The goal misses its target date at the current pace.';
    return 'The condition persists into the next review.';
  },

  whatIf(key){
    const db=Store.db, r=App.recoResult; const x=r.all.find(z=>z.key===key); if(!x) return;
    const base=Calc.baseline(db);
    // Approximate accepted-state deltas (does NOT mutate baseline)
    let deltaCash=0, note='';
    if(/cash|essential/i.test(x.area)){ deltaCash=Math.abs(x.monthly); note='Applying the adjustment restores/adds this to monthly cash flow.'; }
    else if(/debt/i.test(x.area)){ deltaCash=x.monthly; note='Extra payment reduces monthly free cash now, but releases the payment and saves interest after payoff.'; }
    else if(/emergency|goal|recurring/i.test(x.area)){ deltaCash=/recurring/i.test(x.area)?Math.abs(x.monthly):-Math.abs(x.monthly); note=/recurring/i.test(x.area)?'Cancelling frees this monthly.':'Directing this to the target reduces free cash now.'; }
    const projected=base.surplus+deltaCash;
    const body=`
      <div class="kv"><span class="k">Recommendation</span><span class="v">${x.action}</span></div>
      <div class="kv"><span class="k">Baseline free cash flow</span><span class="v">${fmtMoney(base.surplus)}/mo</span></div>
      <div class="kv"><span class="k">Estimated after accepting</span><span class="v" style="color:${projected>=base.surplus?'var(--green)':'var(--amber)'}">${fmtMoney(projected)}/mo</span></div>
      <div class="kv"><span class="k">Annualized effect</span><span class="v">${fmtMoney(Math.abs(x.annual))}/yr</span></div>
      <div class="mini" style="margin-top:8px">${note} This is a projection only; the immutable baseline is unchanged. Use Scenario Lab to model it in full, then approve there if you want to adopt it.</div>`;
    modal('What if I accept this? \u2014 '+x.action, body, ()=>{ App.go('scenario'); }, [{label:'Open in Scenario Lab',cls:'sec',fn:()=>{closeModal();App.go('scenario');}}]);
  },

  reportHtml(r){
    const db=Store.db, mx=r.metrics; const prev=App._prevRun;
    const cmp=(cur,prevVal,fmt,better)=>{ if(prevVal===undefined||prevVal===null) return '<span class="mini">no prior</span>'; const d=cur-prevVal; const good=better==='up'?d>=0:d<=0; return `<span style="color:${d===0?'var(--muted)':good?'var(--green)':'var(--red)'}">${d>0?'+':''}${fmt(d)}</span>`; };
    const rows=this.trendRows(db);
    return `
    <div class="section"><h3>1 \u00b7 Executive summary</h3>
      <p style="font-size:13px;color:var(--text2)">This run produced <strong>${r.primary.length}</strong> ranked recommendation(s). Free cash flow is <strong>${fmtMoney(mx.fcf)}/mo</strong>, essential coverage <strong>${mx.ecr.toFixed(2)}</strong>, emergency reserves <strong>${mx.em.toFixed(1)} months</strong> (${mx.band}), and data quality <strong>${r.dq.score.toFixed(0)} (${r.dq.band})</strong>. ${mx.fcf<0?'Cash-flow stabilization is the top priority.':r.dq.score<60?'Definitive major-decision advice is withheld until data quality reaches 60.':'Position is stable enough to pursue prioritized improvements.'}</p>
    </div>
    <div class="section"><h3>2 \u00b7 Changes since previous run</h3>
      ${prev? `<div class="kv"><span class="k">Free cash flow</span><span class="v">${fmtMoney(mx.fcf)} &nbsp; ${cmp(mx.fcf,prev.metrics.fcf,fmtMoney,'up')}</span></div>
      <div class="kv"><span class="k">Emergency months</span><span class="v">${mx.em.toFixed(1)} &nbsp; ${cmp(mx.em,prev.metrics.em,(v)=>v.toFixed(1),'up')}</span></div>
      <div class="kv"><span class="k">Data quality</span><span class="v">${r.dq.score.toFixed(0)} &nbsp; ${cmp(r.dq.score,prev.dq.score,(v)=>v.toFixed(0),'up')}</span></div>`
      : '<div class="empty">No previous run this session to compare against.</div>'}
    </div>
    <div class="section"><h3>3 \u00b7 Budget vs actual variance</h3>
      <div class="desc">Current month top movements (see Transactions for the full table)</div>
      ${Calc.topUnfavorable(db,App.varMonth,3).map(v=>`<div class="kv"><span class="k">${v.category} ${badge(v.status)}</span><span class="v">+${fmtMoney(v.variance_amount)} (${fmtPct(v.variance_percentage)})</span></div>`).join('')||'<div class="mini">No unfavorable variance.</div>'}
    </div>
    <div class="section"><h3>4\u20138 \u00b7 Updated trajectories</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Metric</th><th class="num">Now</th><th class="num">Prev month</th><th class="num">3-mo avg</th><th class="num">6-mo avg</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="mini" style="margin-top:8px">A single one-time expense is not treated as a trend unless it persists across periods.</div>
    </div>
    <div class="section"><h3>9 \u00b7 Top five ranked recommendations</h3>
      ${r.primary.map((x,i)=>`<div class="kv"><span class="k">#${i+1} ${badge(classBadge(x.score),x.score+'')} ${x.action}${x.provisional?' '+badge('amber','provisional'):''}</span><span class="v">${x.monthly?((x.monthly>0?'+':'')+fmtMoney(x.monthly)+'/mo'):''}</span></div>`).join('')}
    </div>
    <div class="section"><h3>10 \u00b7 Conditions requiring attention</h3>
      ${Reco.conditions(db,r).map(c=>`<div class="kv"><span class="k">${badge(c.level)} ${c.text}</span><span class="v"></span></div>`).join('')||'<div class="mini">None.</div>'}
    </div>
    <div class="section"><h3>11 \u00b7 Items awaiting verification</h3>
      ${r.dq.gaps.map(g=>`<div class="kv"><span class="k">${badge('amber')} ${g}</span><span class="v"></span></div>`).join('')||'<div class="mini">None.</div>'}
    </div>
    <div class="section"><h3>12 \u00b7 Recommended actions before next run</h3>
      ${r.primary.slice(0,3).map(x=>`<div class="kv"><span class="k">${x.firstAction}</span><span class="v">by ${fmtDate(x.reviewDate)}</span></div>`).join('')}
    </div>`;
  },
  trendRows(db){
    const months=Object.keys(db.actuals).sort();
    const cm=months[months.length-1], pm=months[months.length-2];
    const spendCats=Calc.byType(db,'fixed').concat(Calc.byType(db,'variable'));
    const spendFor=(ym)=>spendCats.reduce((s,c)=>s+(+(db.actuals[ym]||{})[c.id]||0),0);
    const avg=(n)=>{ const sel=months.slice(-n); return sel.length? sel.reduce((s,m)=>s+spendFor(m),0)/sel.length : 0; };
    const row=(lbl,now,prev,a3,a6,fmt)=>`<tr><td>${lbl}</td><td class="num">${fmt(now)}</td><td class="num">${prev!=null?fmt(prev):'\u2014'}</td><td class="num">${fmt(a3)}</td><td class="num">${fmt(a6)}</td></tr>`;
    return [
      row('Actual spend',spendFor(cm), pm?spendFor(pm):null, avg(3), avg(6), fmtMoney),
      row('Free cash flow',Calc.monthlySurplus(db), null, Calc.monthlySurplus(db), Calc.monthlySurplus(db), fmtMoney),
      row('Emergency months', RecoData.essentialExpenses(db)?RecoData.liquidEmergency(db)/RecoData.essentialExpenses(db):0, null, 0,0,(v)=>v.toFixed(1)),
      row('Debt-to-income', Calc.dti(db), null, Calc.dti(db), Calc.dti(db), (v)=>fmtPct(v))
    ].join('');
  },

  plansHtml(r){
    const db=Store.db; const b=Reco.bundles(db,r); const sel=db.reco_plan;
    const card=(p,key,desc)=>{
      const active=sel===key;
      return `<div class="section" style="${active?'border-color:var(--accent)':''}">
        <div class="section-head"><div><h3>${p.name} plan ${active?badge('blue','Selected'):''}</h3><div class="desc">${desc}</div></div>
        <button class="btn ${active?'':'sec'} sm" onclick="RecoUI.selectPlan('${key}')">${active?'Selected':'Select plan'}</button></div>
        <div class="kv"><span class="k">Monthly allocation</span><span class="v">${fmtMoney(p.monthly)}</span></div>
        <div class="kv"><span class="k">Weekly equivalent</span><span class="v">${fmtMoney2(p.weekly)}</span></div>
        ${p.alloc.map(a=>`<div class="kv"><span class="k" style="padding-left:10px">\u2022 ${a.k}</span><span class="v">${fmtMoney(a.amt)}</span></div>`).join('')}
        <hr class="sep">
        <div class="kv"><span class="k">12-month outcome</span><span class="v">${fmtMoney(p.monthly*12)} directed</span></div>
        <div class="kv"><span class="k">Main risks</span><span class="v">${p.risks}</span></div>
        <div class="kv"><span class="k">Required behavior</span><span class="v">${p.behavior}</span></div>
      </div>`;
    };
    return `<div class="banner"><span class="b-badge">Note</span> The most aggressive plan is not labelled “best.” Choose the plan that matches your risk tolerance and execution capacity.</div>
      ${card(b.stability,'stability',b.stability.note)}
      ${card(b.balanced,'balanced',b.balanced.note)}
      ${card(b.accelerated,'accelerated',b.accelerated.note)}`;
  },
  selectPlan(k){ Store.db.reco_plan=k; Store.log('plan','Selected '+k+' plan'); Store.save(); toast(k.charAt(0).toUpperCase()+k.slice(1)+' plan selected','green'); App.render(); },

  historyHtml(){
    const runs=Store.db.reco_runs.slice().reverse();
    if(!runs.length) return '<div class="section"><div class="empty">No saved runs yet.</div></div>';
    return `<div class="section"><h3>Recommendation history</h3><div class="desc">Versioned record of finalized reviews (${runs.length})</div>
      <div class="tbl-wrap"><table><thead><tr><th>When</th><th class="num">Free cash flow</th><th class="num">Emerg. mo</th><th class="num">Data quality</th><th class="num">Recos</th><th>Top action</th></tr></thead>
      <tbody>${runs.map(x=>`<tr><td>${new Date(x.at).toLocaleString()}</td><td class="num">${fmtMoney(x.metrics.fcf)}</td><td class="num">${x.metrics.em.toFixed(1)}</td><td class="num">${x.dq.score.toFixed(0)}</td><td class="num">${x.recos.length}</td><td>${x.recos[0]?x.recos[0].action:'\u2014'}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }
};

/* ---- Assistant grounding extension: answer explainability questions from the last run ---- */
(function extendAssistant(){
  if(typeof Assistant==='undefined') return;
  const baseAnswer=Assistant.answer.bind(Assistant);
  Assistant.answer=function(q){
    const s=q.toLowerCase();
    const r=App.recoResult;
    if(/(recommend|action plan|what should i do|priorit|highest impact|top move)/.test(s)){
      if(!r) return "Run a Financial Review in the Recommendation Center first — I answer these from the generated, data-traceable plan rather than guessing.";
      const top=r.primary[0];
      if(!top) return "The last review found no action needed — cash flow, reserves, debt, goals, and mortgage readiness were within thresholds.";
      const V="<span class='tag v'>verified</span>", E="<span class='tag e'>estimate</span>";
      return `${top.provisional?E:V} Highest priority (score ${top.score}/100): <b>${top.action}</b>.<div class='calc'>${top.calc.join('\n')}</div>Why it's first: ${top.why} Next step: ${top.firstAction}${top.provisional?" <b>Provisional — verify source data first.</b>":""}`;
    }
    if(/(data quality|verify|verified|confidence|data gate)/.test(s)){
      const dq=DataQuality.score(Store.db);
      return `<span class='tag v'>verified</span> Data-quality score is <b>${dq.score.toFixed(0)} (${dq.band})</b>.<div class='calc'>data_quality = completeness×0.35 + verification×0.30 + recency×0.20 + reconciliation×0.15\n= ${dq.completeness.toFixed(0)}×.35 + ${dq.verification.toFixed(0)}×.30 + ${dq.recency.toFixed(0)}×.20 + ${dq.reconciliation.toFixed(0)}×.15 = ${dq.score.toFixed(0)}</div>${dq.sufficientForMajor?'Sufficient for major decisions.':'Below 60 — definitive mortgage/consolidation/forecast advice is withheld until you: '+dq.gaps.join(' ')}`;
    }
    if(/(what changed|since last|previous run)/.test(s)){
      const runs=Store.db.reco_runs; if(runs.length<2) return "I need at least two saved reviews to compare. Run another Financial Review after your next change.";
      const cur=runs[runs.length-1], prev=runs[runs.length-2];
      return `<span class='tag v'>verified</span> Since the previous run: free cash flow ${fmtMoney(prev.metrics.fcf)} → <b>${fmtMoney(cur.metrics.fcf)}</b>, emergency months ${prev.metrics.em.toFixed(1)} → <b>${cur.metrics.em.toFixed(1)}</b>, data quality ${prev.dq.score.toFixed(0)} → <b>${cur.dq.score.toFixed(0)}</b>.`;
    }
    return baseAnswer(q);
  };
  // add a suggestion chip
  const oldSuggest=Assistant.suggest.bind(Assistant);
  Assistant.suggest=function(){ oldSuggest();
    const el=document.getElementById('asstSuggest'); if(el && !/highest-impact recommendation/.test(el.innerHTML)){ const b=document.createElement('button'); b.textContent='Explain my top recommendation'; b.onclick=()=>Assistant.ask('What is my highest-impact recommendation?'); el.appendChild(b); }
  };
})();
