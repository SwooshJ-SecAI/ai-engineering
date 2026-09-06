/* ============================================================
   SIMPLE MODE + ENHANCED RECOMMENDATIONS  (extension module)
   Appended last. Adds a plain-language Home view, a Simple/Advanced
   toggle, and four new reasoning layers on top of the existing engine:
   one-number guidance, effort ranking, dollarized do-nothing cost,
   and milestone framing. Removes nothing; every existing view,
   formula, and control is preserved.
   ============================================================ */
'use strict';

/* ---------- mode state ---------- */
App.mode = (function(){ try{ return localStorage.getItem('fdp::mode')||'simple'; }catch(e){ return 'simple'; } })();
/* ---- Simple Mode configurable thresholds (math unchanged; only when colors/verdict flip) ---- */
(function initSimpleThresholds(){
  const s=Store.db.settings;
  if(!s.simple){
    s.simple={ margin_thin_pct:5, reserve_stable_months:3, reserve_min_months:1, coverage_floor:1.0 };
    Store.save();
  }
})();
function ST(){ return Store.db.settings.simple; }
function setMode(m){ App.mode=m; try{ localStorage.setItem('fdp::mode',m); }catch(e){}
  RecoUI2.reshapeNav();
  App.go(m==='simple'?'home':(App.cur==='home'?'overview':App.cur));
}

/* ---------- plain-language label map (same math, human words) ---------- */
const PLAIN = {
  'Free cash flow':'Money left over each month',
  'Total monthly expenses':'What you spend each month',
  'Net monthly income':'Money coming in',
  'Savings rate':'Share of income you save',
  'Emergency-fund months':'Months you could cover with no income',
  'Total debt':'Everything you owe',
  'Debt-to-income':'Share of income going to debt',
  'Net worth':'What you own minus what you owe',
  'Budget utilization':'How much of your budget you used'
};

/* ============================================================
   ENHANCEMENT LAYER — enrich each recommendation
   ============================================================ */
const Enhance = {
  // effort: 0 (trivial) .. 100 (hard). Derived from feasibility + action nature.
  effort(x){
    let e = 100 - x.dims.feasibility;                 // low feasibility => more effort
    if(/subscription|recurring|cancel/i.test(x.action)) e = Math.min(e, 15);   // one click
    if(/autopay|automate|move \$|reduce .* by/i.test(x.firstAction||'')) e = Math.min(e, 30);
    if(/income|negotiate|refinanc|renegotiat/i.test(x.action)) e = Math.max(e, 65); // slow/external
    if(/verify|reconcile|approve/i.test(x.action)) e = Math.min(e, 25);
    return Math.max(5, Math.min(100, Math.round(e)));
  },
  effortLabel(e){ return e<=25?'Easy':e<=55?'Moderate':'Takes effort'; },

  // dollarized monthly cost of doing nothing
  doNothingCost(db,x){
    const a=db.settings.assumptions;
    if(/high-interest debt|debt-highapr/i.test(x.area+ x.key)){
      // interest accruing this month on the targeted balance
      const d=Calc.byType(db,'debt').find(c=>x.key.includes(c.id)) || Calc.byType(db,'debt').slice().sort((p,q)=>(+q.apr)-(+p.apr))[0];
      if(d) return {amt:(+d.balance)*(+d.apr)/100/12, note:`~${fmtMoney2((+d.balance)*(+d.apr)/100/12)} in interest accrues this month on ${d.name}.`};
    }
    if(/cash-flow|essential/i.test(x.area)) return {amt:Math.abs(x.monthly), note:`The ${fmtMoney(Math.abs(x.monthly))} monthly shortfall keeps draining savings.`};
    if(/emergency/i.test(x.area)) return {amt:0, note:`You stay exposed — one surprise could force high-interest borrowing.`};
    if(/recurring/i.test(x.area)) return {amt:Math.abs(x.monthly), note:`You keep paying ${fmtMoney2(Math.abs(x.monthly))}/mo for services you may not use.`};
    if(/goal/i.test(x.area)) return {amt:0, note:`The goal slips past its target date at today's pace.`};
    if(/mortgage/i.test(x.area)) return {amt:0, note:`Home qualification and safety margin stay below guide.`};
    return {amt:0, note:`The issue carries into next month unchanged.`};
  },

  // milestone framing — a felt target instead of a ratio
  milestone(db,x){
    const ess=RecoData.essentialExpenses(db), liquid=RecoData.liquidEmergency(db);
    if(/emergency/i.test(x.area)){
      const oneMonth=ess; const toNext=Math.max(0, oneMonth*Math.ceil(liquid/oneMonth+0.0001) - liquid);
      const fcf=Calc.monthlySurplus(db);
      const weeks = fcf>0? Math.ceil(toNext/ (fcf/4.33)) : null;
      return `You're ${fmtMoney(toNext)} from your next full month of safety${weeks?` — about ${weeks} weeks at your current pace`:''}.`;
    }
    if(/debt-highapr|high-interest/i.test(x.area+x.key)){
      const d=Calc.byType(db,'debt').find(c=>x.key.includes(c.id)) || Calc.byType(db,'debt').slice().sort((p,q)=>(+q.apr)-(+p.apr))[0];
      if(d) return `Clearing ${d.name} frees ${fmtMoney(d.minimum||d.budgeted)}/mo you can then send anywhere.`;
    }
    if(/goal/i.test(x.area)){
      const g=db.goals.find(gg=>x.key.includes(gg.id));
      if(g){ const gc=Calc.goalCompute(db,g); return `${gc.progress.toFixed(0)}% of the way to “${g.name}.” Next milestone: ${fmtMoney(g.current+ (g.target-g.current)*0.25)}.`; }
    }
    return null;
  },

  // the single plain instruction — one number, one move
  oneNumber(db,x){
    if(/cash-flow|essential/i.test(x.area)){
      const cut=RecoData.reducibleCats(db)[0];
      if(cut) return `Move ${fmtMoney(Math.min(Math.abs(x.monthly),(+cut.budgeted)*0.5))} out of ${cut.name} to close your shortfall.`;
      return `Free up ${fmtMoney(Math.abs(x.monthly))} this month to get back to positive.`;
    }
    if(/high-interest debt|debt-highapr/i.test(x.area+x.key)){
      const extra=Math.max(0, Math.round(-x.monthly));
      const d=Calc.byType(db,'debt').find(c=>x.key.includes(c.id)) || Calc.byType(db,'debt').slice().sort((p,q)=>(+q.apr)-(+p.apr))[0];
      if(d && extra>0) return `Put an extra ${fmtMoney(extra)} on ${d.name} this month — it's your highest-return move.`;
      if(d) return `Keep paying ${d.name}'s minimum until your reserve is rebuilt, then attack it.`;
    }
    if(/emergency/i.test(x.area)) return `Auto-transfer ${fmtMoney(Math.abs(x.monthly))} to savings on payday.`;
    if(/recurring/i.test(x.area)) return `Cancel one unused subscription to recover ${fmtMoney2(Math.abs(x.monthly))}/mo.`;
    if(/goal/i.test(x.area)) return `Add ${fmtMoney(Math.abs(x.monthly))}/mo, or push the date out — your choice.`;
    if(/mortgage/i.test(x.area)) return `Focus on one lever: lower the target price or clear a debt before buying.`;
    if(/variance/i.test(x.area)) return `Cap the over-budget category next month and watch it once.`;
    if(/data quality|data-quality/i.test(x.area)) return `Approve your pending records so the numbers can be trusted.`;
    return x.firstAction||'Take the first step listed on the card.';
  },

  enrich(db,r){
    r.all.forEach(x=>{
      x.effort=this.effort(x);
      x.effortLabel=this.effortLabel(x.effort);
      x.doNothing=this.doNothingCost(db,x);
      x.milestone=this.milestone(db,x);
      x.oneNumber=this.oneNumber(db,x);
      // easy-win score: high impact per unit effort
      x.easyWin = (x.dims.impact) / Math.max(10,x.effort);
    });
    return r;
  }
};

/* ============================================================
   SIMPLE MODE — Home view
   ============================================================ */
Views.home = function(){
  const db=Store.db;
  const ni=Calc.netIncome(db), out=Calc.totalBudgetedOutflow(db), left=Calc.monthlySurplus(db);
  const ess=RecoData.essentialExpenses(db), liquid=RecoData.liquidEmergency(db);
  const em = ess? liquid/ess : 0;
  const ecr = (ess+RecoData.minDebtPayments(db))? ni/(ess+RecoData.minDebtPayments(db)) : 9;
  // health verdict
  const st=ST();
  let verdict, vclass, vwhy;
  if(left<0 || ecr<st.coverage_floor){ verdict='Needs attention'; vclass='red'; vwhy='You are spending more than you bring in.'; }
  else if(em<st.reserve_stable_months || left/ni<st.margin_thin_pct/100){ verdict='Doing okay, one thing to watch'; vclass='amber'; vwhy='Your day-to-day is covered, but your safety cushion is thin.'; }
  else { verdict='You are stable'; vclass='green'; vwhy='Income covers your life with room to spare.'; }

  // top opportunity (run engine silently for the home card)
  let r=App.recoResult;
  if(!r){ r=Enhance.enrich(db, Reco.build(db)); }
  else if(!r.all[0] || r.all[0].effort===undefined){ Enhance.enrich(db,r); }
  const top = r.all.slice().sort((a,b)=>(a.rankTier-b.rankTier)||(b.score-a.score))[0];
  const easy = r.all.slice().filter(x=>x.effort<=30 && x!==top).sort((a,b)=>b.easyWin-a.easyWin).slice(0,2);

  const bar=(label,amt,color,pct)=>`<div style="margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${label}</span><span class="mono" style="font-family:var(--mono)">${fmtMoney(amt)}</span></div>
    <div class="bar-track" style="height:12px"><div class="bar-fill ${color}" style="width:${Math.max(3,Math.min(100,pct))}%"></div></div></div>`;
  const maxv=Math.max(ni,out,Math.abs(left),1);

  const dq=DataQuality.score(db);

  return `
  ${syntheticNote}
  <div class="section" style="border-left:3px solid var(--${vclass}-bd)">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span class="badge ${vclass}" style="font-size:13px;padding:6px 14px">${verdict}</span>
      <div style="font-size:15px;color:var(--text)">${vwhy}</div>
    </div>
    <div class="mini" style="margin-top:8px">Plain-language view. Want the full detail and every ratio? <a href="#" onclick="setMode('advanced');return false" style="color:var(--accent)">Switch to Advanced</a>.</div>
  </div>

  <div class="two-col">
    <div class="section">
      <h3>Money in, out, and left</h3>
      <div class="desc">The whole picture in three bars</div>
      ${bar('Money coming in', ni, 'green', ni/maxv*100)}
      ${bar('Money going out', out, 'amber', out/maxv*100)}
      ${bar(left>=0?'Money left over':'Shortfall', left, left>=0?'green':'red', Math.abs(left)/maxv*100)}
      <button class="btn ghost sm" onclick="RecoUI2.showMath()" style="margin-top:6px">Show the math</button>
    </div>

    <div class="section" style="border:1px solid var(--accent2)">
      <h3>Do this next</h3>
      <div class="desc">Your single highest-impact move right now</div>
      ${top? `
      <div style="font-size:16px;color:var(--text);font-weight:600;margin:6px 0 10px">${top.oneNumber}</div>
      <div class="kv"><span class="k">Why</span><span class="v" style="text-align:right;max-width:60%">${top.why}</span></div>
      <div class="kv"><span class="k">If you do nothing</span><span class="v" style="color:var(--amber)">${top.doNothing.note}</span></div>
      <div class="kv"><span class="k">Effort</span><span class="v">${badge(top.effort<=25?'green':top.effort<=55?'amber':'red',top.effortLabel)}</span></div>
      ${top.milestone?`<div class="kv"><span class="k">Milestone</span><span class="v" style="text-align:right;max-width:60%">${top.milestone}</span></div>`:''}
      <div class="btnrow" style="margin-top:12px">
        <button class="btn sm" onclick="setMode('advanced');App.go('recommendations');RecoUI.run&&RecoUI.run()">See full plan</button>
        <button class="btn ghost sm" onclick="Assistant.toggle();Assistant.ask('What is my highest-impact recommendation?')">Ask why</button>
      </div>` : '<div class="empty">Nothing urgent — you are on track.</div>'}
    </div>
  </div>

  ${easy.length?`<div class="section">
    <h3>Quick wins</h3>
    <div class="desc">Small moves, low effort, real payback</div>
    ${easy.map(x=>`<div class="kv"><span class="k">${badge('green',x.effortLabel)} ${x.oneNumber}</span><span class="v">${x.annual?fmtMoney(Math.abs(x.annual))+'/yr':''}</span></div>`).join('')}
  </div>`:''}

  <div class="section">
    <h3>Your safety cushion</h3>
    <div class="desc">${PLAIN['Emergency-fund months']}</div>
    <div style="display:flex;align-items:baseline;gap:10px"><div style="font-family:var(--mono);font-size:30px;font-weight:600;color:${em>=ST().reserve_stable_months?'var(--green)':em>=ST().reserve_min_months?'var(--amber)':'var(--red)'}">${em.toFixed(1)}</div><div style="color:var(--text2)">months covered</div></div>
    <div class="bar-track" style="margin-top:8px"><div class="bar-fill ${em>=ST().reserve_stable_months?'green':em>=ST().reserve_min_months?'amber':'red'}" style="width:${Math.min(100,em/Math.max(1,ST().reserve_stable_months*2)*100)}%"></div></div>
    <div class="mini" style="margin-top:6px">${Enhance.milestone(db,{area:'emergency',key:'em'})||''}</div>
  </div>

  ${dq.score<75?`<div class="banner"><span class="b-badge">Heads up</span> Some figures still need checking (data quality ${dq.score.toFixed(0)}). ${dq.gaps[0]||''} <a href="#" onclick="setMode('advanced');App.go('recommendations');return false" style="color:var(--accent)">Review</a></div>`:''}

  <div class="section">
    <button class="btn sec" onclick="RecoUI2.walkthrough()">Walk me through my money</button>
    <button class="btn ghost" onclick="RecoUI2.editThresholds()" style="margin-left:8px">Adjust my thresholds</button>
    <span class="mini" style="margin-left:10px">A guided review, or set what counts as green/amber/red for you.</span>
  </div>`;
};
Views._after_home=function(){};

/* ============================================================
   Simple-mode plumbing: nav reshape, toggle, math modal, walkthrough
   ============================================================ */
const SIMPLE_NAV_IDS = ['home','budget','goals','recommendations'];

const RecoUI2 = {
  reshapeNav(){
    // rebuild nav honoring mode; add Home + toggle. Never destroys NAV data.
    if(!NAV.find(n=>n.id==='home')){
      NAV.unshift({id:'home', label:'Home', sub:'Your money in plain language', ico:'M3 11l9-8 9 8 M5 10v10h14V10'});
    }
    const nav=document.getElementById('nav');
    const items = App.mode==='simple' ? NAV.filter(n=>SIMPLE_NAV_IDS.includes(n.id)) : NAV;
    nav.innerHTML = items.map(n=>`<button data-v="${n.id}" onclick="App.go('${n.id}')">
      <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${n.ico}"/></svg>
      <span>${n.label}</span></button>`).join('')
      + `<div style="padding:10px 12px;margin-top:8px;border-top:1px solid var(--border)">
           <div class="mini" style="margin-bottom:6px">View</div>
           <div class="pill-tabs" style="width:100%">
             <button class="${App.mode==='simple'?'active':''}" style="flex:1" onclick="setMode('simple')">Simple</button>
             <button class="${App.mode==='advanced'?'active':''}" style="flex:1" onclick="setMode('advanced')">Advanced</button>
           </div>
         </div>`;
    // re-highlight
    document.querySelectorAll('#nav button[data-v]').forEach(b=>b.classList.toggle('active',b.dataset.v===App.cur));
  },

  editThresholds(){
    const st=ST();
    const body=`
      <div class="mini" style="margin-bottom:10px">These set only when Simple Mode shows green, amber, or red. Your actual numbers and formulas never change.</div>
      <div class="form-grid">
        <div class="field"><label class="fld">"Thin margin" warning below (% of income)</label><input id="st-margin" type="number" step="1" value="${st.margin_thin_pct}"></div>
        <div class="field"><label class="fld">Safety cushion "stable" at (months)</label><input id="st-stable" type="number" step="0.5" value="${st.reserve_stable_months}"></div>
        <div class="field"><label class="fld">Safety cushion "critical" below (months)</label><input id="st-min" type="number" step="0.5" value="${st.reserve_min_months}"></div>
        <div class="field"><label class="fld">Essential-coverage floor (1.0 = income just covers essentials)</label><input id="st-cov" type="number" step="0.05" value="${st.coverage_floor}"></div>
      </div>`;
    modal('Adjust my thresholds', body, ()=>{
      st.margin_thin_pct=parseFloat(val('st-margin'))||st.margin_thin_pct;
      st.reserve_stable_months=parseFloat(val('st-stable'))||st.reserve_stable_months;
      st.reserve_min_months=parseFloat(val('st-min'))||st.reserve_min_months;
      st.coverage_floor=parseFloat(val('st-cov'))||st.coverage_floor;
      Store.db.settings.updated_at=nowISO();
      Store.log('settings','Adjusted Simple Mode thresholds');
      Store.save(); toast('Thresholds updated','green'); App.render();
    }, [{label:'Reset defaults',cls:'sec',fn:()=>{ Store.db.settings.simple={margin_thin_pct:5,reserve_stable_months:3,reserve_min_months:1,coverage_floor:1.0}; Store.log('settings','Reset Simple Mode thresholds'); Store.save(); closeModal(); toast('Reset to defaults','amber'); App.render(); }}]);
  },

  showMath(){
    const db=Store.db;
    const ni=Calc.netIncome(db), ex=Calc.totalExpenses(db), d=Calc.debtPayments(db), sv=Calc.plannedSavings(db), left=Calc.monthlySurplus(db);
    modal('Show the math', `
      <div class="calc" style="font-family:var(--mono);font-size:12px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:12px;white-space:pre-wrap;color:var(--text2)">money_left = income − expenses − debt − savings
= ${fmtMoney(ni)} − ${fmtMoney(ex)} − ${fmtMoney(d)} − ${fmtMoney(sv)}
= ${fmtMoney(left)}</div>
      <div class="mini" style="margin-top:8px">These are your verified budget figures. Available credit is never counted as income.</div>`, null, []);
  },

  walkthrough(){
    const db=Store.db; const r=App.recoResult||Enhance.enrich(db,Reco.build(db));
    const ni=Calc.netIncome(db), left=Calc.monthlySurplus(db), ess=RecoData.essentialExpenses(db), liquid=RecoData.liquidEmergency(db);
    const em=ess?liquid/ess:0;
    const top=r.all.slice().sort((a,b)=>(a.rankTier-b.rankTier)||(b.score-a.score))[0];
    const steps=[
      {q:'First, are you living within your means?', a: left>=0? `Yes. You keep ${fmtMoney(left)} after everything each month.` : `Not yet. You're short ${fmtMoney(-left)} a month.`, ok:left>=0},
      {q:'Do you have a safety cushion?', a: em>=3? `Yes — about ${em.toFixed(1)} months covered.` : `Partly — ${em.toFixed(1)} months. Aim for at least 3.`, ok:em>=3},
      {q:'Is expensive debt under control?', a: (()=>{const hi=Calc.byType(db,'debt').slice().sort((x,y)=>(+y.apr)-(+x.apr))[0]; return hi&&+hi.apr>=15? `Watch ${hi.name} at ${(+hi.apr).toFixed(1)}% — it's your costliest.` : 'No high-rate debt flagged.';})(), ok:!(Calc.byType(db,'debt').some(c=>+c.apr>=15))},
      {q:'So what should you do next?', a: top? top.oneNumber : 'Keep going — nothing urgent.', ok:true, final:true}
    ];
    const body=steps.map((s,i)=>`<div style="margin-bottom:14px">
      <div style="font-weight:600;color:var(--text)">${i+1}. ${s.q}</div>
      <div style="color:var(--text2);margin-top:3px">${badge(s.final?'blue':s.ok?'green':'amber',s.final?'Next step':s.ok?'Good':'Watch')} ${s.a}</div>
    </div>`).join('');
    modal('Walk me through my money', body, null, [{label:'See full plan',cls:'sec',fn:()=>{closeModal();setMode('advanced');App.go('recommendations');}}]);
  }
};

/* ---------- hook engine run to enrich results ---------- */
(function hookRun(){
  if(typeof RecoUI==='undefined'||!RecoUI.run) return;
  const origRun=RecoUI.run.bind(RecoUI);
  RecoUI.run=function(){ origRun(); if(App.recoResult) Enhance.enrich(Store.db,App.recoResult); App.render(); };
})();

/* ---------- enrich the advanced action cards with the new fields ---------- */
(function extendCards(){
  if(typeof RecoUI==='undefined'||!RecoUI.card) return;
  const origCard=RecoUI.card.bind(RecoUI);
  RecoUI.card=function(x,rank){
    if(x.effort===undefined) Enhance.enrich(Store.db, App.recoResult||{all:[x]});
    let html=origCard(x,rank);
    // inject a plain-language strip right after the opening section div
    const strip=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 12px">
      ${badge(x.effort<=25?'green':x.effort<=55?'amber':'red','Effort: '+x.effortLabel)}
      ${x.doNothing&&x.doNothing.amt>0?badge('amber','Do nothing: '+fmtMoney2(x.doNothing.amt)+'/mo lost'):''}
      ${x.easyWin>=6?badge('green','Quick win'):''}
    </div>
    <div class="kv"><span class="k">In plain terms</span><span class="v" style="text-align:right;max-width:65%">${x.oneNumber}</span></div>`;
    // place strip after first </div> following the section-head close — simplest: after the h3 desc block.
    html=html.replace('</div>\n      </div>', '</div>\n      </div>'+strip);
    return html;
  };
})();

/* ---------- boot the simple layer ---------- */
(function bootSimple(){
  try{ RecoUI2.reshapeNav(); }catch(e){}
  if(App.mode==='simple'){ try{ App.go('home'); }catch(e){} }
})();
