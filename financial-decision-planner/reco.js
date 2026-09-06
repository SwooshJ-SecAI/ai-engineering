/* ============================================================
   RECOMMENDATION ENGINE  (extension module)
   Loaded after app.js + ui.js. Reuses Store, Calc, helpers.
   Adds: engine, Recommendation Center view, budget-run report,
   explainability, plan bundles, data-quality gate, history.
   Touches no existing view, formula, or privacy control.
   ============================================================ */
'use strict';

/* ---- lazy settings extensions (non-destructive) ---- */
(function initRecoSettings(){
  const a=Store.db.settings.assumptions;
  const def={
    reserve_target_months:4,          // user-configurable emergency target (NOT auto-6)
    min_cash_reserve:2000,            // protected liquid floor
    credit_apr_threshold:15,          // % APR above which acceleration is evaluated
    variable_income:false,            // triggers conservative assumptions
    tax_rate:null,                    // must be user-provided/approved; null => not assumed
    purchase_within_months:30         // mortgage timeline
  };
  let changed=false;
  for(const k in def){ if(a[k]===undefined){ a[k]=def[k]; changed=true; } }
  if(!Store.db.reco_runs) { Store.db.reco_runs=[]; changed=true; }
  if(!Store.db.reco_status) { Store.db.reco_status={}; changed=true; }   // {recoKey:{status,reason,at}}
  if(!Store.db.reco_plan) { Store.db.reco_plan='balanced'; changed=true; }
  if(changed) Store.save();
})();

/* ============================================================
   Classification helpers (traceable, keyword-based)
   ============================================================ */
const RecoData = {
  essentialKeywords:/rent|mortgage|utilit|insurance|grocer|transport|fuel|phone|internet|medical|health|child|day ?care/i,
  isEssentialCat(c){
    if(c.type==='fixed') return true;
    if(c.type==='variable') return this.essentialKeywords.test(c.name);
    return false;
  },
  essentialExpenses(db){ return db.budget.filter(c=>(c.type==='fixed'||c.type==='variable')&&this.isEssentialCat(c)).reduce((s,c)=>s+(+c.budgeted||0),0); },
  discretionaryExpenses(db){ return db.budget.filter(c=>(c.type==='variable')&&!this.isEssentialCat(c)).reduce((s,c)=>s+(+c.budgeted||0),0); },
  minDebtPayments(db){ return Calc.byType(db,'debt').reduce((s,c)=>s+(+c.minimum||+c.budgeted||0),0); },
  liquidEmergency(db){ return db.accounts.filter(a=>a.type==='savings'||a.type==='checking').reduce((s,a)=>s+(+a.balance||0),0); },
  reducibleCats(db){ // discretionary categories, largest first
    return db.budget.filter(c=>c.type==='variable'&&!this.isEssentialCat(c)).slice().sort((a,b)=>(+b.budgeted)-(+a.budgeted));
  }
};

/* ============================================================
   Data-quality gate
   ============================================================ */
const DataQuality = {
  score(db){
    // completeness: required fields present across income, budget, mortgage, goals, accounts
    let filled=0, total=0;
    const need=(v)=>{ total++; if(v!==undefined&&v!==null&&v!==''&&!(typeof v==='number'&&isNaN(v))) filled++; };
    db.income.forEach(i=>{ need(i.amount); need(i.gross); });
    db.budget.forEach(c=>{ need(c.budgeted); if(c.type==='debt'){ need(c.apr); need(c.balance); need(c.minimum); } });
    ['gross_monthly','net_monthly','existing_debt','rate','home_price','down_payment'].forEach(k=>need(db.mortgage[k]));
    db.goals.forEach(g=>{ need(g.target); need(g.current); need(g.target_date); });
    const completeness = total? filled/total*100 : 0;

    // verification: share of records marked verified
    const recs=[].concat(db.income,db.budget,db.goals,db.accounts,db.documents,db.reconcile);
    const verified=recs.filter(r=>r.verification_status==='verified').length;
    const verification = recs.length? verified/recs.length*100 : 0;

    // recency: newest updated_at across records vs 45-day window
    const times=recs.map(r=>+new Date(r.updated_at||r.created_at||0)).filter(Boolean);
    const newest=times.length?Math.max(...times):0;
    const days=(Date.now()-newest)/86400000;
    const recency = Math.max(0, Math.min(100, 100 - (days/45*100)));

    // reconciliation: share of queue resolved (approved/rejected/corrected)
    const q=db.reconcile; const resolved=q.filter(r=>r.decision!=='pending').length;
    const reconciliation = q.length? resolved/q.length*100 : 100;

    const dq = completeness*0.35 + verification*0.30 + recency*0.20 + reconciliation*0.15;
    return {score:dq, completeness, verification, recency, reconciliation,
      band: dq>=90?'High confidence':dq>=75?'Reliable with minor gaps':dq>=60?'Provisional':'Insufficient for major decisions',
      sufficientForMajor: dq>=60,
      gaps: this.gaps(db,{completeness,verification,recency,reconciliation})};
  },
  gaps(db,d){
    const g=[];
    if(d.verification<80) g.push('Approve pending records in the Verification queue to raise verification coverage.');
    if(d.reconciliation<100) g.push(db.reconcile.filter(r=>r.decision==='pending').length+' reconciliation item(s) still pending.');
    if(d.recency<70) g.push('Some records have not been updated recently — confirm balances are current.');
    const missDebt=Calc.byType(db,'debt').filter(c=>!c.apr||!c.minimum);
    if(missDebt.length) g.push('Missing APR/minimum on debt: '+missDebt.map(c=>c.name).join(', ')+'.');
    return g;
  }
};

/* ============================================================
   Scoring
   ============================================================ */
function score(impact,urgency,risk,feasibility,confidence){
  const s = impact*0.30 + urgency*0.25 + risk*0.20 + feasibility*0.15 + confidence*0.10;
  return Math.max(0,Math.min(100,Math.round(s)));
}
function classify(sc){ return sc>=80?'Immediate priority':sc>=65?'High priority':sc>=45?'Moderate priority':'Monitor or optional'; }
function classBadge(sc){ return sc>=80?'red':sc>=65?'amber':sc>=45?'blue':'gray'; }

/* ============================================================
   Core engine — evaluate 10 areas, emit recommendation objects
   Each reco: {key, area, rankTier, action, why, current, proposed,
     monthly, annual, goalEffect, debtEffect, mortgageEffect, risk,
     dims:{impact,urgency,risk,feasibility,confidence}, score, calc[],
     dataUsed[], firstAction, reviewDate, provisional}
   ============================================================ */
const Reco = {
  build(db){
    const dq=DataQuality.score(db);
    const conf = Math.round(dq.score);              // confidence tied to data quality
    const provisional = conf<60;
    const ni=Calc.netIncome(db);
    const ess=RecoData.essentialExpenses(db);
    const disc=RecoData.discretionaryExpenses(db);
    const minDebt=RecoData.minDebtPayments(db);
    const savings=Calc.plannedSavings(db);
    const fcf = ni - ess - disc - minDebt - savings;                 // spec free_cash_flow
    const ecr = (ess+minDebt)? ni/(ess+minDebt) : 99;                // essential coverage ratio
    const liquid=RecoData.liquidEmergency(db);
    const em = ess? liquid/ess : 0;                                  // months on ESSENTIAL expenses
    const a=db.settings.assumptions;
    const list=[];
    const reviewDate = addMonths(1).slice(0,10);
    const src=(arr)=>arr;

    /* ---- 1 & 3. Cash-flow stability / negative cash flow ---- */
    if(fcf < 0){
      const shortfall=-fcf;
      const grossNeeded = a.tax_rate!=null ? shortfall/(1-a.tax_rate) : null;
      const cuts=RecoData.reducibleCats(db);
      const cutPlan=[]; let acc=0; for(const c of cuts){ if(acc>=shortfall)break; const take=Math.min(+c.budgeted*0.5, shortfall-acc); cutPlan.push({name:c.name,amt:take}); acc+=take; }
      list.push(this.mk({
        key:'cashflow-deficit', area:'Cash-flow stability', rankTier:3,
        action:`Close the ${fmtMoney(shortfall)}/mo cash-flow deficit`,
        why:'Spending plus minimum obligations exceed net income; every month adds to fragility.',
        current:`Free cash flow ${fmtMoney(fcf)}/mo (negative).`,
        proposed:`Expense-only: cut ${fmtMoney(shortfall)}. Income-only: ${grossNeeded!=null?('+'+fmtMoney(grossNeeded)+' gross'):'gross figure needs an approved tax rate'}. Blended: split across both.`,
        monthly:shortfall, annual:shortfall*12,
        goalEffect:'Deficit currently blocks all discretionary goal funding.',
        debtEffect:'Prevents building beyond minimum payments.',
        mortgageEffect:'A negative cash flow disqualifies sustainable affordability regardless of DTI.',
        risk:'Expense cuts affect lifestyle; income changes take time to realize.',
        dims:{impact:95,urgency:98,risk:90,feasibility:cuts.length?70:45,confidence:conf},
        calc:[
          `free_cash_flow = net_income − essential − discretionary − min_debt − savings`,
          `= ${fmtMoney(ni)} − ${fmtMoney(ess)} − ${fmtMoney(disc)} − ${fmtMoney(minDebt)} − ${fmtMoney(savings)} = ${fmtMoney(fcf)}`,
          grossNeeded!=null? `income_needed = shortfall / (1 − tax_rate) = ${fmtMoney(shortfall)} / (1 − ${a.tax_rate}) = ${fmtMoney(grossNeeded)}` : `income route: no tax rate approved — gross requirement withheld (Rule: do not assume a tax rate).`,
          cutPlan.length? `expense route (top discretionary): ${cutPlan.map(x=>x.name+' −'+fmtMoney(x.amt)).join(', ')}` : ''
        ].filter(Boolean),
        dataUsed:['Income','Budget categories','Debt minimums'],
        firstAction: cutPlan.length? `Reduce ${cutPlan[0].name} by ${fmtMoney(cutPlan[0].amt)} this week.` : 'Identify one discretionary category to cut.',
        reviewDate, provisional
      }));
    } else if(ni>0 && fcf/ni < 0.05){
      list.push(this.mk({
        key:'cashflow-thin', area:'Cash-flow stability', rankTier:4,
        action:`Widen the thin ${fmtPct(fcf/ni*100)} cash-flow margin`,
        why:'A margin under 5% leaves no buffer for variance or surprises.',
        current:`Free cash flow ${fmtMoney(fcf)}/mo = ${fmtPct(fcf/ni*100)} of net income.`,
        proposed:`Target a 10% margin (${fmtMoney(ni*0.10)}/mo) by trimming discretionary spend ${fmtMoney(Math.max(0,ni*0.10-fcf))}.`,
        monthly:Math.max(0,ni*0.10-fcf), annual:Math.max(0,ni*0.10-fcf)*12,
        goalEffect:'Frees room to fund goals steadily.', debtEffect:'Creates capacity above minimums.',
        mortgageEffect:'Improves sustainable affordability buffer.',
        risk:'Requires trimming discretionary categories.',
        dims:{impact:60,urgency:55,risk:55,feasibility:75,confidence:conf},
        calc:[`margin = free_cash_flow / net_income = ${fmtMoney(fcf)} / ${fmtMoney(ni)} = ${fmtPct(fcf/ni*100)}`],
        dataUsed:['Income','Budget categories'], firstAction:'Pick one discretionary line to reduce 10%.', reviewDate, provisional
      }));
    }

    /* ---- 2. Essential coverage (protect essentials) ---- */
    if(ecr < 1.0){
      list.push(this.mk({
        key:'essential-coverage', area:'Essential coverage', rankTier:2,
        action:'Restore essential-expense coverage above 1.0',
        why:'Net income does not fully cover essentials plus minimum debt — the most urgent structural risk.',
        current:`essential_coverage_ratio = ${ecr.toFixed(2)} (below 1.0).`,
        proposed:`Increase income or cut essentials/min-debt so coverage ≥ 1.0. Gap ≈ ${fmtMoney((ess+minDebt)-ni)}/mo.`,
        monthly:Math.max(0,(ess+minDebt)-ni), annual:Math.max(0,(ess+minDebt)-ni)*12,
        goalEffect:'All goal funding suspended until covered.', debtEffect:'Risk of missed minimums.',
        mortgageEffect:'Home purchase not sustainable at this coverage.',
        risk:'May require renegotiating fixed costs or debt terms.',
        dims:{impact:98,urgency:99,risk:95,feasibility:55,confidence:conf},
        calc:[`essential_coverage_ratio = net_income / (essential + min_debt) = ${fmtMoney(ni)} / (${fmtMoney(ess)} + ${fmtMoney(minDebt)}) = ${ecr.toFixed(2)}`],
        dataUsed:['Income','Fixed & essential categories','Debt minimums'],
        firstAction:'Contact lenders about hardship/minimum options; list negotiable fixed costs.', reviewDate, provisional
      }));
    }

    /* ---- 5 (rank), Emergency reserves ---- */
    const targetM=a.reserve_target_months;
    const targetFund=ess*targetM;
    const gap=targetFund-liquid;
    const band = em<1?'Critical':em<3?'Vulnerable':em<6?'Stable':'Strong';
    if(gap>0 && fcf>=0){
      const reqContribution=gap/targetM;
      list.push(this.mk({
        key:'emergency-fund', area:'Emergency reserves', rankTier:4,
        action:`Build emergency reserves toward ${targetM} months`,
        why:`Reserves are ${em.toFixed(1)} months of essentials (${band}); the configured target is ${targetM}.`,
        current:`Liquid reserves ${fmtMoney(liquid)} = ${em.toFixed(1)} months.`,
        proposed:`Contribute ${fmtMoney(reqContribution)}/mo to close the ${fmtMoney(gap)} gap over ${targetM} months.`,
        monthly:reqContribution, annual:reqContribution*12,
        goalEffect:'Competes with discretionary goals until minimum band reached.',
        debtEffect:'Protects against debt-financed emergencies.',
        mortgageEffect:'Higher reserves strengthen post-closing safety.',
        risk:`Directing ${fmtMoney(reqContribution)}/mo here slows other goals.`,
        dims:{impact:70,urgency:em<1?92:em<3?75:45,risk:80,feasibility:fcf>=reqContribution?80:40,confidence:conf},
        calc:[
          `target_emergency_fund = essential × target_months = ${fmtMoney(ess)} × ${targetM} = ${fmtMoney(targetFund)}`,
          `emergency_fund_gap = target − current = ${fmtMoney(targetFund)} − ${fmtMoney(liquid)} = ${fmtMoney(gap)}`,
          `required_monthly = gap / target_months = ${fmtMoney(gap)} / ${targetM} = ${fmtMoney(reqContribution)}`
        ],
        dataUsed:['Savings/checking balances','Essential expenses','Reserve target (Settings)'],
        firstAction:`Automate ${fmtMoney(reqContribution)} to the emergency account on payday.`, reviewDate, provisional
      }));
    }

    /* ---- 5. High-interest debt (protect reserve first) ---- */
    const debts=Calc.byType(db,'debt').slice();
    const hi=debts.filter(c=>(+c.apr||0)>=a.credit_apr_threshold).sort((x,y)=>(+y.apr)-(+x.apr))[0];
    const reserveProtected = liquid>=a.min_cash_reserve && em>=1;
    if(hi){
      const extra = fcf>0? Math.min(fcf, Math.max(50, fcf*0.5)) : 0;
      const payoff=this.payoff(+hi.balance,+hi.apr, (+hi.minimum||+hi.budgeted)+extra);
      const base=this.payoff(+hi.balance,+hi.apr,(+hi.minimum||+hi.budgeted));
      const saved=base.interest-payoff.interest;
      list.push(this.mk({
        key:'debt-highapr-'+hi.id, area:'High-interest debt', rankTier: reserveProtected?5:9,
        action:`Accelerate payoff of ${hi.name} (${(+hi.apr).toFixed(1)}% APR)`,
        why:`Highest-cost balance; paying it early is a guaranteed ${(+hi.apr).toFixed(1)}% return.`,
        current:`Balance ${fmtMoney(hi.balance)}, min ${fmtMoney(hi.minimum||hi.budgeted)}/mo, payoff ${base.months} mo, interest ${fmtMoney(base.interest)}.`,
        proposed: reserveProtected? `Add ${fmtMoney(extra)}/mo → payoff ${payoff.months} mo, interest ${fmtMoney(payoff.interest)}.` : `Reserves below floor — pay minimum only until the ${fmtMoney(a.min_cash_reserve)} reserve is restored, then accelerate.`,
        monthly: reserveProtected? -extra : 0, annual: reserveProtected? saved : 0,
        goalEffect: reserveProtected? `Delays discretionary goals by the reallocated ${fmtMoney(extra)}/mo.` : 'No goal impact while paying minimum.',
        debtEffect:`Interest saved ≈ ${fmtMoney(saved)}; releases ${fmtMoney(hi.minimum||hi.budgeted)}/mo after payoff.`,
        mortgageEffect:`Removing this payment lowers back-end DTI.`,
        risk: reserveProtected? 'Ties up cash that could serve emergencies.' : 'Acceleration deferred to protect liquidity (Rule: preserve minimum reserve).',
        dims:{impact:82,urgency:(+hi.apr>=22?85:70),risk:75,feasibility:reserveProtected&&fcf>0?80:35,confidence:conf},
        calc:[
          `interest_saved = interest(min) − interest(min+extra)`,
          `= ${fmtMoney(base.interest)} − ${fmtMoney(payoff.interest)} = ${fmtMoney(saved)}`,
          `payoff_months(min+extra) via amortization at ${(+hi.apr).toFixed(1)}% = ${payoff.months} months`
        ],
        dataUsed:[`Debt: ${hi.name}`,'Free cash flow','Reserve floor (Settings)'],
        firstAction: reserveProtected? `Increase ${hi.name} autopay by ${fmtMoney(extra)}.` : 'Restore minimum reserve first.', reviewDate, provisional
      }));
    }

    /* ---- 4. Budget variance (behavioral vs structural) ---- */
    const months=Object.keys(db.actuals).sort();
    const overStreak=this.consecutiveOver(db);
    if(overStreak.count>=1){
      const cat=overStreak.cat;
      const kind = overStreak.count>=3? 'persistent (structural or unrealistic budget)' : 'recent';
      list.push(this.mk({
        key:'variance-'+ (cat?cat.id:'gen'), area:'Budget variance', rankTier:7,
        action: cat? `Resolve ${overStreak.count}-period overspend in ${cat.name}` : 'Resolve repeated budget overspend',
        why:`Actual exceeded budget for ${overStreak.count} period(s) — ${kind}.`,
        current: cat? `${cat.name}: budget ${fmtMoney(cat.budgeted)}, latest actual ${fmtMoney(overStreak.actual)} (+${fmtPct(overStreak.pct)}).` : 'Multiple categories over budget.',
        proposed: overStreak.count>=3? `Rebase the budget to ${fmtMoney(overStreak.actual)} if the spend is legitimate, or set a hard cap.` : `Cap next period at budget; review drivers.`,
        monthly: cat? Math.max(0,overStreak.actual-cat.budgeted):0, annual: cat? Math.max(0,overStreak.actual-cat.budgeted)*12:0,
        goalEffect:'Overspend diverts money from goals.', debtEffect:'Reduces payoff capacity.',
        mortgageEffect:'Distorts sustainable-affordability estimate.',
        risk:'Rebasing upward reduces surplus; a hard cap requires behavior change.',
        dims:{impact:55,urgency:overStreak.count>=3?70:45,risk:50,feasibility:70,confidence:conf},
        calc: cat?[`variance = actual − budget = ${fmtMoney(overStreak.actual)} − ${fmtMoney(cat.budgeted)} = ${fmtMoney(overStreak.actual-cat.budgeted)} (${fmtPct(overStreak.pct)})`]:[],
        dataUsed:['Budget vs actual history'], firstAction:'Classify the overspend: one-time, seasonal, structural, or behavioral.', reviewDate, provisional
      }));
    }

    /* ---- 7. Goal funding ---- */
    db.goals.forEach(g=>{
      const gc=Calc.goalCompute(db,g);
      const ratio = gc.required_monthly>0? gc.current_contribution/gc.required_monthly : 1;
      if(ratio<1 && fcf>=0){
        const cls = ratio>=0.8?'Slight adjustment required':ratio>=0.5?'At risk':'Off track';
        // 4 alternatives
        const need=g.target-g.current-gc.expected_growth;
        const altExtend=need/(gc.months+6);
        const altReduce=(gc.current_contribution*gc.months)+g.current+gc.expected_growth;
        list.push(this.mk({
          key:'goal-'+g.id, area:'Goal funding', rankTier:7,
          action:`Close the funding gap on “${g.name}”`,
          why:`Funding ratio ${(ratio*100).toFixed(0)}% (${cls}).`,
          current:`Contributing ${fmtMoney(gc.current_contribution)}/mo vs required ${fmtMoney(gc.required_monthly)}.`,
          proposed:`Four options below — none divert essentials, minimum debt, or protected reserves.`,
          monthly:gc.gap, annual:gc.gap*12,
          goalEffect:`On-time completion needs +${fmtMoney(gc.gap)}/mo.`,
          debtEffect:'Neutral.', mortgageEffect: /down/i.test(g.name)?'Directly affects down-payment readiness.':'Neutral.',
          risk:'Increasing contribution reduces other slack.',
          dims:{impact:50,urgency: this.monthsTo(g.target_date)<=12?70:45,risk:40,feasibility:fcf>=gc.gap?75:45,confidence:conf},
          calc:[
            `required_monthly = (target − current − expected_growth) / months`,
            `= (${fmtMoney(g.target)} − ${fmtMoney(g.current)} − ${fmtMoney(gc.expected_growth)}) / ${gc.months} = ${fmtMoney(gc.required_monthly)}`,
            `goal_funding_ratio = current_contribution / required = ${fmtMoney(gc.current_contribution)} / ${fmtMoney(gc.required_monthly)} = ${(ratio*100).toFixed(0)}%`,
            `Alt 1 increase: +${fmtMoney(gc.gap)}/mo`,
            `Alt 2 extend +6mo: required → ${fmtMoney(altExtend)}/mo`,
            `Alt 3 reduce target: reachable ≈ ${fmtMoney(altReduce)} at current pace`,
            `Alt 4 blended: e.g. +${fmtMoney(gc.gap/2)}/mo and +3mo deadline`
          ],
          dataUsed:[`Goal: ${g.name}`,'Contribution budget line'],
          firstAction:'Choose one of the four alternatives in the What-if panel.', reviewDate, provisional
        }));
      }
    });

    /* ---- 6. Mortgage readiness ---- */
    const m=Calc.mortgage(db);
    const backMax=a.back_end_max*100;
    if(m.back>backMax || m.reserves_after<m.emergency_required){
      const improvements=this.mortgageImprovements(db,m);
      const top=improvements[0];
      list.push(this.mk({
        key:'mortgage-readiness', area:'Mortgage readiness', rankTier:8,
        action:'Improve mortgage readiness before purchase',
        why: m.back>backMax? `Back-end DTI ${fmtPct(m.back)} exceeds the ${backMax}% guide.` : `Post-closing reserves ${fmtMoney(m.reserves_after)} fall short of the ${fmtMoney(m.emergency_required)} requirement.`,
        current:`Front-end ${fmtPct(m.front)}, back-end ${fmtPct(m.back)}, reserves after closing ${fmtMoney(m.reserves_after)}.`,
        proposed:`Highest-impact: ${top.text}`,
        monthly: top.monthly||0, annual:(top.monthly||0)*12,
        goalEffect:'May compete with the down-payment goal.', debtEffect: top.debtEffect||'Varies by action.',
        mortgageEffect: top.mortgageEffect,
        risk:'The largest qualification gain may deplete reserves — not automatically best.',
        dims:{impact:65,urgency: this.monthsTo(addMonths(a.purchase_within_months))<=12?75:45,risk:60,feasibility:60,confidence:conf},
        calc:[
          `back_end_DTI = (housing + existing_debt) / gross = (${fmtMoney(m.housing_payment)} + ${fmtMoney(m.existing_debt)}) / ${fmtMoney(m.gross)} = ${fmtPct(m.back)}`,
          `post_closing_reserves = liquid − down − closing = ${fmtMoney(m.reserves_after)}`
        ].concat(improvements.slice(0,5).map((x,i)=>`#${i+1} ${x.text}`)),
        dataUsed:['Mortgage inputs','Debts','Accounts'],
        firstAction: top.first||'Review the five ranked improvements in Mortgage Readiness.', reviewDate, provisional
      }));
    }

    /* ---- 8. Recurring expenses ---- */
    const recurTx=db.transactions.filter(t=>t.flags&&t.flags.includes('recurring'));
    if(recurTx.length){
      const monthlyRecur=recurTx.reduce((s,t)=>s+t.amount,0);
      list.push(this.mk({
        key:'recurring', area:'Recurring expenses', rankTier:10,
        action:'Audit recurring subscriptions',
        why:`${recurTx.length} recurring charge(s) detected totalling ${fmtMoney(monthlyRecur)}/mo.`,
        current:recurTx.map(t=>t.description+' '+fmtMoney(t.amount)).join(', ')+'.',
        proposed:`Cancel or downgrade unused services; even one at ${fmtMoney(monthlyRecur)}/mo = ${fmtMoney(monthlyRecur*12)}/yr.`,
        monthly:monthlyRecur, annual:monthlyRecur*12,
        goalEffect:'Recovered cash can fund goals.', debtEffect:'Or accelerate debt.', mortgageEffect:'Improves cash-flow buffer.',
        risk:'Loss of service utility.',
        dims:{impact:40,urgency:35,risk:30,feasibility:90,confidence:Math.min(conf,70)},
        calc:[`annualized = monthly_recurring × 12 = ${fmtMoney(monthlyRecur)} × 12 = ${fmtMoney(monthlyRecur*12)}`],
        dataUsed:['Flagged recurring transactions'], firstAction:'Review the recurring list and cancel one unused service.', reviewDate,
        provisional: provisional||true  // flagged tx are unverified estimates
      }));
    }

    /* ---- 10. Data quality ---- */
    if(!dq.sufficientForMajor){
      list.push(this.mk({
        key:'data-quality', area:'Financial-data quality', rankTier:1,
        action:'Verify source data before major decisions',
        why:`Data-quality score ${dq.score.toFixed(0)} is below 60 — insufficient for mortgage, consolidation, or long-term forecasts.`,
        current:`Completeness ${dq.completeness.toFixed(0)}, verification ${dq.verification.toFixed(0)}, recency ${dq.recency.toFixed(0)}, reconciliation ${dq.reconciliation.toFixed(0)}.`,
        proposed:'Resolve the listed gaps, then re-run the review.',
        monthly:0, annual:0, goalEffect:'—', debtEffect:'—', mortgageEffect:'Definitive mortgage advice withheld until ≥60.',
        risk:'Acting on low-quality data can mislead.',
        dims:{impact:60,urgency:80,risk:85,feasibility:85,confidence:100},
        calc:[`data_quality = completeness×0.35 + verification×0.30 + recency×0.20 + reconciliation×0.15 = ${dq.score.toFixed(0)}`].concat(dq.gaps.map(g=>'• '+g)),
        dataUsed:['All record metadata'], firstAction: dq.gaps[0]||'Approve pending records.', reviewDate, provisional:false
      }));
    }

    // Rank: primary tier first, then score desc; cap at 5 primary
    list.sort((x,y)=> (x.rankTier-y.rankTier) || (y.score-x.score));
    const primary=list.slice(0,5);
    return {generated_at:nowISO(), dq, metrics:{ni,ess,disc,minDebt,savings,fcf,ecr,liquid,em,band,targetM}, primary, all:list};
  },

  mk(o){
    o.score=score(o.dims.impact,o.dims.urgency,o.dims.risk,o.dims.feasibility,o.dims.confidence);
    o.class=classify(o.score);
    o.confidenceLabel = o.dims.confidence>=60? (o.dims.confidence>=80?'High':'Moderate') : 'Low';
    if(o.provisional || o.dims.confidence<60){ o.provisional=true; }
    return o;
  },

  /* amortization payoff: returns {months, interest} */
  payoff(balance, apr, payment){
    const r=apr/100/12; let bal=balance, interest=0, months=0;
    if(payment<=bal*r) return {months:Infinity, interest:Infinity}; // never pays off
    while(bal>0 && months<600){ const i=bal*r; interest+=i; bal=bal+i-payment; months++; }
    return {months, interest:Math.max(0,interest)};
  },
  monthsTo(iso){ return Calc.monthsBetween(nowISO(), iso); },

  consecutiveOver(db){
    const months=Object.keys(db.actuals).sort();
    let best={count:0,cat:null,actual:0,pct:0};
    Calc.byType(db,'variable').concat(Calc.byType(db,'fixed')).forEach(c=>{
      let streak=0, lastActual=0, lastPct=0;
      months.forEach(ym=>{ const act=+(db.actuals[ym]||{})[c.id]||0; if(act>c.budgeted){ streak++; lastActual=act; lastPct=(act-c.budgeted)/c.budgeted*100; } else streak=0; });
      if(streak>best.count) best={count:streak,cat:c,actual:lastActual,pct:lastPct};
    });
    return best;
  },

  mortgageImprovements(db,m){
    const out=[];
    // pay off a specific debt (largest payment)
    const debts=Calc.byType(db,'debt').slice().sort((a,b)=>(+b.budgeted)-(+a.budgeted));
    if(debts[0]){ const d=debts[0]; const newBack=(m.housing_payment + Math.max(0,m.existing_debt-(+d.budgeted)))/m.gross*100;
      out.push({text:`Pay off ${d.name}: releases ${fmtMoney(d.budgeted)}/mo, back-end ${fmtPct(m.back)} → ${fmtPct(newBack)} (consumes ${fmtMoney(d.balance)} cash).`, monthly:0, mortgageEffect:`Back-end → ${fmtPct(newBack)}`, debtEffect:`−${fmtMoney(d.balance)} balance`, first:`Model the ${d.name} payoff in Scenario Lab.`, gain:m.back-newBack}); }
    // increase down payment to 20%
    const need20=m.price*0.2; if(m.dp<need20){ const add=need20-m.dp; const r=Calc.mortgage(db,{down_payment:need20}); out.push({text:`Raise down payment to 20% (+${fmtMoney(add)}): removes PMI ${fmtMoney(m.pmi)}/mo, housing → ${fmtMoney(r.housing_payment)}.`, monthly:0, mortgageEffect:`Housing → ${fmtMoney(r.housing_payment)}`, first:'Increase down-payment fund contributions.', gain:(m.housing_payment-r.housing_payment)}); }
    // reduce home price 10%
    const r10=Calc.mortgage(db,{home_price:m.price*0.9}); out.push({text:`Reduce target price 10% (${fmtMoney(m.price*0.9)}): back-end → ${fmtPct(r10.back)}, housing → ${fmtMoney(r10.housing_payment)}.`, monthly:0, mortgageEffect:`Back-end → ${fmtPct(r10.back)}`, first:'Adjust target price in Mortgage Readiness.', gain:m.back-r10.back});
    // increase income
    const rInc=(m.housing_payment+m.existing_debt)/(m.gross+500)*100; out.push({text:`Increase verified gross income +$500: back-end → ${fmtPct(rInc)}.`, monthly:0, mortgageEffect:`Back-end → ${fmtPct(rInc)}`, first:'Document additional income.', gain:m.back-rInc});
    // extend timeline / preserve reserves
    out.push({text:`Extend timeline to save more: each ${fmtMoney(500)}/mo for 12 mo adds ${fmtMoney(6000)} reserves/down payment.`, monthly:500, mortgageEffect:'Higher post-closing reserves', first:'Push purchase date out in Settings.', gain:0.1});
    return out.sort((a,b)=>(b.gain||0)-(a.gain||0));
  },

  /* ---- Conditional rules (returns list of {level,text}) ---- */
  conditions(db,r){
    const a=db.settings.assumptions, out=[], mx=r.metrics;
    if(mx.fcf<0) out.push({level:'red',text:'Projected cash flow < 0 → cash-flow stabilization prioritized above all optional actions.'});
    if(mx.em<a.reserve_target_months) out.push({level:'amber',text:`Emergency reserves (${mx.em.toFixed(1)} mo) below target (${a.reserve_target_months}) → recommendations that consume liquid savings are restricted.`});
    const hiapr=Calc.byType(db,'debt').find(c=>(+c.apr)>a.credit_apr_threshold);
    if(hiapr && mx.liquid>=a.min_cash_reserve && mx.em>=1) out.push({level:'blue',text:`${hiapr.name} APR ${(+hiapr.apr).toFixed(1)}% > threshold ${a.credit_apr_threshold}% and reserves protected → accelerated payoff evaluated.`});
    const streak=this.consecutiveOver(db); if(streak.count>=3) out.push({level:'amber',text:`${streak.cat.name} over budget ${streak.count} periods → classify as behavioral, structural, seasonal, or unrealistic budget.`});
    if(this.monthsTo(addMonths(a.purchase_within_months))<=12) out.push({level:'blue',text:'Mortgage purchase within 12 months → liquidity, DTI, payment history, and closing reserves prioritized.'});
    if(a.variable_income) out.push({level:'amber',text:'Variable income flagged → conservative income and expense assumptions applied.'});
    const unrec=db.reconcile.filter(x=>x.decision==='pending'); if(unrec.length) out.push({level:'amber',text:`${unrec.length} account item(s) not reconciled → recommendations relying materially on them are suppressed.`});
    const lowOCR=db.documents.some(d=>d.fields.some(f=>f.confidence<0.7 && !f.verified)); if(lowOCR) out.push({level:'red',text:'OCR confidence below threshold on unverified fields → manual validation required before use.'});
    // promo APR expiry — synthetic none, keep rule visible
    // goal conflict: two High goals both underfunded
    const highUnder=db.goals.filter(g=>{const gc=Calc.goalCompute(db,g);return g.priority==='High'&&gc.gap>0;});
    if(highUnder.length>=2 && mx.fcf < highUnder.reduce((s,g)=>s+Calc.goalCompute(db,g).gap,0)) out.push({level:'amber',text:`Goals conflict: ${highUnder.map(g=>g.name).join(' & ')} both underfunded and cash flow can't cover both → a priority decision is requested.`});
    return out;
  },

  /* ---- Plan bundles ---- */
  bundles(db,r){
    const mx=r.metrics; const surplus=Math.max(0,mx.fcf);
    const debts=Calc.byType(db,'debt').slice().sort((x,y)=>(+y.apr)-(+x.apr));
    const topDebt=debts[0];
    const efGap=Math.max(0, mx.ess*mx.targetM - mx.liquid);
    const goalGap=db.goals.reduce((s,g)=>s+Math.max(0,Calc.goalCompute(db,g).gap),0);
    const mk=(name,alloc,risks,behavior,note)=>({name,alloc,risks,behavior,note,
      weekly:alloc.reduce((s,x)=>s+x.amt,0)*12/52, monthly:alloc.reduce((s,x)=>s+x.amt,0)});
    const stability=mk('Stability',
      [{k:'Essentials + minimums (protected)',amt:0},{k:'Emergency fund',amt:Math.min(surplus,efGap/mx.targetM||surplus)},{k:'Hold discretionary flat',amt:0}],
      'Slowest debt/goal progress.', 'Freeze discretionary increases; automate reserve transfer.',
      'Prioritizes positive cash flow, minimum payments, and reserves before anything optional.');
    const balAlloc=[]; let rem=surplus;
    const efPart=Math.min(rem, (efGap/mx.targetM)||0); balAlloc.push({k:'Emergency fund',amt:efPart}); rem-=efPart;
    const debtPart=Math.min(rem, topDebt?rem*0.6:0); if(topDebt) balAlloc.push({k:'Extra to '+topDebt.name,amt:debtPart}); rem-=debtPart;
    balAlloc.push({k:'Goals',amt:Math.max(0,rem)});
    const balanced=mk('Balanced', balAlloc, 'Moderate progress on all fronts.', 'Maintain current lifestyle; small discretionary trims.',
      'Splits surplus across reserves, debt reduction, and goal funding.');
    const accAlloc=[]; let rem2=surplus + mx.disc*0.3; // pull 30% discretionary
    const efA=Math.min(rem2,(efGap/Math.max(1,mx.targetM))||0); accAlloc.push({k:'Emergency (fast)',amt:efA}); rem2-=efA;
    if(topDebt){ const dA=Math.min(rem2, rem2*0.8); accAlloc.push({k:'Aggressive '+topDebt.name,amt:dA}); rem2-=dA; }
    accAlloc.push({k:'Goals (stretch)',amt:Math.max(0,rem2)});
    const accelerated=mk('Accelerated', accAlloc, 'High execution pressure; thin lifestyle slack.', 'Cut ~30% discretionary; strict tracking.',
      'Maximizes payoff/goal speed by reducing discretionary spending.');
    return {stability,balanced,accelerated};
  }
};
