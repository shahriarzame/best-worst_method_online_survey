const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwQY8QgnAWkv4uwrh4ZwFX2d9GE9UWlEWTa9xLfIl9BaEYcYHSu4FDoDNW5eXLVnBjU/exec";

const SURVEY_SCHEMA = {
  schemaVersion: 2,
  surveyId: "bw_online_survey",
  surveyVersion: "2026-02",
  introContent: {
    title: "Road Freight Electrification & Automation Barriers Survey",
    welcome: "Thank you for participating in this research on barriers to road freight electrification and automation.",
    purposeTitle: "Purpose of This Study",
    purposeText:
      "This study evaluates and ranks barriers to electric and automated freight implementation. Barriers are organized into six categories and related sub-barriers.",
    methodologyTitle: "Survey Methodology",
    methodologySteps: [
      "Select the most challenging barrier in each category.",
      "Select the least challenging barrier in each category.",
      "Compare the most challenging barrier to each other barrier.",
      "Compare each remaining barrier to the least challenging barrier."
    ],
    scaleTitle: "For all comparisons, use this scale",
    estimatedTime: "20-30 minutes",
    confidentialityText:
      "This survey is anonymous and responses are used only for academic research.",
    contactText:
      "For questions, contact Shahriar Iqbal Zame (shahriar.zame@tum.de), Dr.-Ing. Mohammad Sadrani (m.sadrani@utwente.nl), or Prof. Dr. Constantinos Antoniou (c.antoniou(at)tum.de).",
    figureCaption: "Figure 1: Barrier categories and sub-barriers"
  },
  scaleOptions: [
    { id: "slightly_more", label: "Slightly more challenging", helpText: "minor difference in impact" },
    { id: "moderately_more", label: "Moderately more challenging", helpText: "noticeable difference in impact" },
    { id: "significantly_more", label: "Significantly more challenging", helpText: "substantial difference in impact" },
    { id: "extremely_more", label: "Extremely more challenging", helpText: "very large difference in impact" }
  ],
  sections: [
    {
      key: "mainCategories",
      title: "Main Category Barriers",
      kind: "main",
      items: [
        { id: "economic", label: "Economic" },
        { id: "environmental", label: "Environmental" },
        { id: "technological", label: "Technological" },
        { id: "operational", label: "Operational" },
        { id: "social", label: "Social" },
        { id: "policy", label: "Policy" },
        { id: "new", label: "New" }
      ]
    },
    {
      key: "economic",
      title: "Economic Barriers",
      kind: "sub",
      items: [
        { id: "high_total_cost_fleet_ownership", label: "High total cost of fleet ownership", description: "High ownership costs reduce economic viability." },
        { id: "high_infrastructure_cost", label: "High infrastructure cost", description: "Charging and grid investment costs are substantial." },
        { id: "high_financial_risk", label: "High financial risk", description: "Utilization and demand uncertainty increase risk." },
        { id: "complex_business_models", label: "Complex business models", description: "Unclear business models delay scaling decisions." }
      ]
    },
    {
      key: "environmental",
      title: "Environmental Barriers",
      kind: "sub",
      items: [
        { id: "battery_lifecycle_issues", label: "Battery lifecycle issues", description: "Battery sourcing, production, and disposal create impacts." },
        { id: "emissions_from_electricity_generation", label: "Emissions from electricity generation", description: "Grid carbon intensity affects total emissions outcomes." },
        { id: "ecological_impact_charging_infrastructure", label: "Ecological impact of charging infrastructure", description: "Large infrastructure footprint can increase ecological burden." },
        { id: "emissions_from_induced_demand_automation", label: "Emissions from induced demand with automation", description: "Automation can induce demand and offset gains." }
      ]
    },
    {
      key: "technological",
      title: "Technological Barriers",
      kind: "sub",
      items: [
        { id: "limited_battery_range", label: "Limited battery range", description: "Range limits can constrain heavy-duty operations." },
        { id: "limited_charging_network_coverage", label: "Limited charging-network coverage", description: "Sparse charging coverage reduces operational flexibility." },
        { id: "delay_power_grid_upgrade", label: "Delay in power-grid upgrade", description: "Grid constraints delay reliable large-scale charging." },
        { id: "uncertainty_technology_maturity", label: "Uncertainty in technology maturity", description: "Uncertain readiness delays long-term commitments." }
      ]
    },
    {
      key: "operational",
      title: "Operational Barriers",
      kind: "sub",
      items: [
        { id: "charging_time_issues", label: "Charging time issues", description: "Charging duration can disrupt tight schedules." },
        { id: "scheduling_synchronisation_complexity", label: "Scheduling/synchronisation complexity", description: "Routing and charging synchronization is complex." },
        { id: "uncertainty_traffic_weather_conditions", label: "Uncertainty in traffic and weather conditions", description: "Traffic and weather variability reduce reliability." },
        { id: "lack_stakeholder_collaboration", label: "Lack of stakeholder collaboration", description: "Misalignment among actors slows coordinated rollout." }
      ]
    },
    {
      key: "social",
      title: "Social Barriers",
      kind: "sub",
      items: [
        { id: "lack_public_acceptance", label: "Lack of public acceptance", description: "Public trust and acceptance remain limited." },
        { id: "job_losses_workforce_transition_concerns", label: "Job losses & workforce-transition concerns", description: "Workforce impacts and reskilling gaps create resistance." },
        { id: "inability_maintain_required_service_levels", label: "Inability to maintain required service levels", description: "Service-level reliability concerns reduce confidence." },
        { id: "safety_risks", label: "Safety risks", description: "Safety and cybersecurity concerns remain significant." }
      ]
    },
    {
      key: "policy",
      title: "Policy Barriers",
      kind: "sub",
      items: [
        { id: "lack_supportive_policies", label: "Lack of supportive policies", description: "Insufficient policy support slows investment." },
        { id: "lack_regulations_standardizations", label: "Lack of regulations and standardizations", description: "Regulatory and standards fragmentation creates uncertainty." },
        { id: "data_governance_challenges", label: "Data governance challenges", description: "Data governance and privacy issues hinder collaboration." },
        { id: "difference_political_prioritization", label: "Difference in political prioritization", description: "Political priorities vary across regions." }
      ]
    }
  ]
};

const STORAGE_KEY = "survey_progress_v2";
const LEGACY_STORAGE_KEY = "survey_progress";
var respondentInfo = {};
var responses = {};
var lockedSections = {};
var currentPage = 0;
var pageCompletionStatus = {};
var tourSuppressed = false;
var tourActive = false;

const sectionByKey = {};
const itemBySection = {};
const scaleById = {};
const scaleByLabel = {};
SURVEY_SCHEMA.sections.forEach(s => {
  sectionByKey[s.key] = s;
  itemBySection[s.key] = {};
  s.items.forEach(i => {
    itemBySection[s.key][i.id] = i;
  });
});
SURVEY_SCHEMA.scaleOptions.forEach(s => {
  scaleById[s.id] = s;
  scaleByLabel[s.label.trim().toLowerCase()] = s.id;
});

function escapeHtml(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message, type = "info") {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 60);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 260);
  }, 3200);
}

function totalPages() {
  return 2 + SURVEY_SCHEMA.sections.length;
}

function clampPage(i) {
  return Math.max(0, Math.min(i, totalPages() - 1));
}

function getPageMeta(i) {
  if (i === 0) return { index: 0, title: "Introduction", className: "intro-pages" };
  if (i === 1) return { index: 1, title: "Demographics", className: "intro-pages" };
  const s = SURVEY_SCHEMA.sections[i - 2];
  if (!s) return null;
  return { index: i, title: s.title, className: s.kind === "main" ? "main-page" : "sub-pages", sectionKey: s.key };
}

function ensureSectionState(key) {
  if (!responses[key] || typeof responses[key] !== "object") responses[key] = {};
  const s = responses[key];
  if (!s.comparisonsMostVsOther || typeof s.comparisonsMostVsOther !== "object") s.comparisonsMostVsOther = {};
  if (!s.comparisonsOtherVsLeast || typeof s.comparisonsOtherVsLeast !== "object") s.comparisonsOtherVsLeast = {};
  if (!Array.isArray(s.othersForMost)) s.othersForMost = [];
  if (!Array.isArray(s.othersForLeast)) s.othersForLeast = [];
  return s;
}

function item(sectionKey, itemId) {
  return itemBySection[sectionKey] ? itemBySection[sectionKey][itemId] : null;
}

function itemLabel(sectionKey, itemId) {
  const it = item(sectionKey, itemId);
  return it ? it.label : "N/A";
}

function scaleId(raw) {
  if (!raw) return "";
  if (scaleById[raw]) return raw;
  return scaleByLabel[String(raw).trim().toLowerCase()] || "";
}

function resolveItemId(section, raw) {
  if (!raw) return "";
  if (itemBySection[section.key][raw]) return raw;
  const n = String(raw).trim().toLowerCase();
  const found = section.items.find(i => i.label.trim().toLowerCase() === n);
  return found ? found.id : "";
}

function renderIntro() {
  const root = document.getElementById("intro-page");
  if (!root) return;
  const c = SURVEY_SCHEMA.introContent;
  const meth = c.methodologySteps.map(s => `<li>${escapeHtml(s)}</li>`).join("");
  const scale = SURVEY_SCHEMA.scaleOptions
    .map(s => `<li><strong>${escapeHtml(s.label)}</strong> (${escapeHtml(s.helpText || "")})</li>`)
    .join("");
  root.innerHTML = `
    <h1>${escapeHtml(c.title)}</h1>
    <p>${escapeHtml(c.welcome)}</p>
    <div class="intro-highlight"><strong>${escapeHtml(c.purposeTitle)}</strong><p style="margin-bottom:0; margin-top:10px;">${escapeHtml(c.purposeText)}</p></div>
    <p><strong>${escapeHtml(c.methodologyTitle)}:</strong></p>
    <ol style="line-height:1.8;">${meth}</ol>
    <p>${escapeHtml(c.scaleTitle)}:</p>
    <ul style="line-height:1.8;">${scale}</ul>
    <div class="intro-time"><span style="font-size:1.5rem;">⏱️</span><span><strong>Estimated time:</strong> ${escapeHtml(c.estimatedTime)}</span></div>
    <div style="text-align:center; margin:25px 0;"><img src="Barriers_RF.png" alt="Barriers Framework" style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px; padding:10px; background:white;"><p style="font-size:0.9em; color:#666; margin-top:8px;"><em>${escapeHtml(c.figureCaption)}</em></p></div>
    <p><strong>Confidentiality:</strong> ${escapeHtml(c.confidentialityText)}</p>
    <p style="font-size:0.95em; color:#555;">${escapeHtml(c.contactText)}</p>
    <button class="btn btn-start" onclick="tourSuppressed = false; navigateToPage(1);">Begin Survey →</button>
  `;
}

function renderIndicators() {
  const el = document.getElementById("page-indicators");
  if (!el) return;
  let html = "";
  for (let i = 0; i < totalPages(); i++) {
    const p = getPageMeta(i);
    html += `<div class="page-indicator ${p.className}${i === currentPage ? " current-page" : ""}" data-page="${i}" onclick="navigateToPage(${i})" title="${escapeHtml(p.title)}">${i + 1}</div>`;
  }
  el.innerHTML = html;
}

function renderItem(sectionKey, id, cls = "") {
  const it = item(sectionKey, id);
  if (!it) return "";
  const info = it.description ? `<button type="button" class="info-btn" onclick="showInfo('${sectionKey}','${id}')">i</button>` : "";
  const className = cls ? `barrier-name ${cls}` : "barrier-name";
  return `<span class="${className}">${escapeHtml(it.label)}</span>${info}`;
}

function sectionHtml(section, idx) {
  const key = section.key;
  const page = idx + 2;
  const next =
    idx < SURVEY_SCHEMA.sections.length - 1
      ? '<button class="btn btn-next" onclick="navigateToPage(currentPage + 1)">Next →</button>'
      : "";
  const optsMost = section.items
    .map(
      i =>
        `<label><input type="radio" name="${key}-most" value="${i.id}" onchange="handleSelection('${key}')">${renderItem(
          key,
          i.id
        )}</label>`
    )
    .join("");
  const optsLeast = section.items
    .map(
      i =>
        `<label><input type="radio" name="${key}-least" value="${i.id}" onchange="handleSelection('${key}')">${renderItem(
          key,
          i.id
        )}</label>`
    )
    .join("");
  return `
  <div class="page-content" id="page-${page}" style="display:none;">
    <div class="section" id="section-${key}">
      <div class="section-header"><h2 style="margin:0; color:white;">${escapeHtml(section.title)}</h2></div>
      <div class="question-block" id="${key}-q1-block"><div class="question-number">Question 1</div><div class="question-text">Which is the <span class="highlight-most">Most challenging</span> barrier among ${escapeHtml(
        section.title
      )}?</div><div class="options" id="${key}-q1-options">${optsMost}</div></div>
      <div class="question-block" id="${key}-q2-block"><div class="question-number">Question 2</div><div class="question-text">Which is the <span class="highlight-least">Least challenging</span> barrier among ${escapeHtml(
        section.title
      )}?</div><div class="options" id="${key}-q2-options">${optsLeast}</div><div class="error-msg" id="${key}-error" style="display:none;">Most and Least challenging cannot be the same.</div></div>
      <button class="btn" id="${key}-continue" disabled onclick="showComparisons('${key}')">Continue to Comparison Questions →</button>
      <button class="btn btn-unlock" id="${key}-unlock" style="display:none;" onclick="unlockSelections('${key}')">🔓 Unlock Questions 1 & 2</button>
      <div class="comparison-section" id="${key}-comparisons"></div>
      <div class="validation-error" id="${key}-validation-error">Please answer all comparison questions before proceeding.</div>
      <div class="page-actions"><button class="btn btn-prev" onclick="navigateToPage(currentPage - 1)">← Previous</button>${next}<button class="btn" onclick="exportData()" style="background:#7f8c8d;">📥 Export Data</button><button class="btn btn-submit" id="submit-btn-page-${page}" onclick="attemptSubmit()">Submit Survey</button><button class="btn btn-reset" onclick="resetSurvey()">🗑️ Start Over</button></div>
    </div>
  </div>`;
}

function initSurvey() {
  const c = document.getElementById("survey-container");
  if (!c) return;
  c.innerHTML = SURVEY_SCHEMA.sections.map((s, i) => sectionHtml(s, i)).join("");
}

function toggleIndustryOther() {
  const select = document.getElementById("demo-industry");
  const group = document.getElementById("fg-industry-other");
  if (!select || !group) return;
  if (select.value === "Other") group.style.display = "block";
  else {
    group.style.display = "none";
    const other = document.getElementById("demo-industry-other");
    if (other) other.value = "";
  }
  updateProgressBar();
}

function toggleEducationOther() {
  const select = document.getElementById("demo-education");
  const group = document.getElementById("fg-education-other");
  if (!select || !group) return;
  if (select.value === "Other") group.style.display = "block";
  else {
    group.style.display = "none";
    const other = document.getElementById("demo-education-other");
    if (other) other.value = "";
  }
  updateProgressBar();
}

function readDemographics() {
  const occupation = (document.getElementById("demo-occupation")?.value || "").trim();
  const industryChoice = document.getElementById("demo-industry")?.value || "";
  const industryOther = (document.getElementById("demo-industry-other")?.value || "").trim();
  const experience = document.getElementById("demo-experience")?.value || "";
  const educationChoice = document.getElementById("demo-education")?.value || "";
  const educationOther = (document.getElementById("demo-education-other")?.value || "").trim();
  const country = (document.getElementById("demo-country")?.value || "").trim();
  const expertise = (document.getElementById("demo-expertise")?.value || "").trim();
  return {
    occupation,
    industryChoice,
    industryOther,
    industry: industryChoice === "Other" ? industryOther : industryChoice,
    experience,
    educationChoice,
    educationOther,
    education: educationChoice === "Other" ? educationOther : educationChoice,
    country,
    expertise
  };
}

function isDemographicsComplete() {
  const d = readDemographics();
  return !!(d.occupation && d.industry && d.experience && d.education && d.country);
}

function captureDemographics() {
  const d = readDemographics();
  respondentInfo = {
    ...respondentInfo,
    occupation: d.occupation,
    industry: d.industry,
    experience: d.experience,
    education: d.education,
    country: d.country,
    expertise: d.expertise,
    startTime: respondentInfo.startTime || new Date().toISOString()
  };
  return d;
}

function addDemographicListeners() {
  [
    "demo-occupation",
    "demo-industry",
    "demo-industry-other",
    "demo-experience",
    "demo-education",
    "demo-education-other",
    "demo-country",
    "demo-expertise"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      updateProgressBar();
      saveProgress();
    });
    el.addEventListener("change", () => {
      updateProgressBar();
      saveProgress();
    });
  });
}

function setSelectWithOther(selectId, otherId, wrapperId, value) {
  const s = document.getElementById(selectId);
  const o = document.getElementById(otherId);
  const w = document.getElementById(wrapperId);
  if (!s) return;
  if (!value) {
    s.value = "";
    if (o) o.value = "";
    if (w) w.style.display = "none";
    return;
  }
  const has = Array.from(s.options).some(opt => opt.value === value);
  if (has) {
    s.value = value;
    if (o) o.value = "";
    if (w) w.style.display = "none";
  } else {
    s.value = "Other";
    if (o) o.value = value;
    if (w) w.style.display = "block";
  }
}

function restoreDemographics() {
  if (respondentInfo.occupation) document.getElementById("demo-occupation").value = respondentInfo.occupation;
  if (respondentInfo.experience) document.getElementById("demo-experience").value = respondentInfo.experience;
  if (respondentInfo.country) document.getElementById("demo-country").value = respondentInfo.country;
  if (respondentInfo.expertise) document.getElementById("demo-expertise").value = respondentInfo.expertise;
  setSelectWithOther("demo-industry", "demo-industry-other", "fg-industry-other", respondentInfo.industry || "");
  setSelectWithOther("demo-education", "demo-education-other", "fg-education-other", respondentInfo.education || "");
}

function navigateToPage(pageIndex, opts = {}) {
  const target = clampPage(pageIndex);
  const currentEl = document.getElementById(`page-${currentPage}`);
  if (currentEl) {
    currentEl.classList.remove("active");
    currentEl.style.display = "none";
  }
  const targetEl = document.getElementById(`page-${target}`);
  if (targetEl) {
    targetEl.classList.add("active");
    targetEl.style.display = "block";
  }
  currentPage = target;
  updateProgressBar();
  if (!opts.skipScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  if (!opts.skipSave) saveProgress();
}

function checkPageCompletion(i) {
  if (i === 0) return true;
  if (i === 1) return isDemographicsComplete();
  const sec = SURVEY_SCHEMA.sections[i - 2];
  if (!sec) return false;
  const st = ensureSectionState(sec.key);
  if (!st.mostItemId || !st.leastItemId || st.mostItemId === st.leastItemId) return false;
  const comp = document.getElementById(`${sec.key}-comparisons`);
  if (!comp || comp.children.length === 0 || comp.style.display === "none") return false;
  const m = st.othersForMost.length
    ? st.othersForMost
    : sec.items.map(x => x.id).filter(id => id !== st.mostItemId);
  const l = st.othersForLeast.length
    ? st.othersForLeast
    : sec.items.map(x => x.id).filter(id => id !== st.leastItemId && id !== st.mostItemId);
  return m.every(id => !!st.comparisonsMostVsOther[id]) && l.every(id => !!st.comparisonsOtherVsLeast[id]);
}

function updateProgressBar() {
  for (let i = 0; i < totalPages(); i++) pageCompletionStatus[i] = checkPageCompletion(i);
  document.querySelectorAll(".page-indicator").forEach((ind, idx) => {
    ind.classList.remove("current-page", "completed-page");
    if (idx === currentPage) ind.classList.add("current-page");
    if (pageCompletionStatus[idx]) ind.classList.add("completed-page");
  });
  const allComplete = Array.from({ length: totalPages() - 1 }, (_, k) => k + 1).every(i => pageCompletionStatus[i]);
  document.querySelectorAll("[id^='submit-btn']").forEach(btn => (btn.style.opacity = allComplete ? "1" : "0.6"));
}

function handleSelection(key, suppressSave = false) {
  if (lockedSections[`${key}-selection`]) return;
  const st = ensureSectionState(key);
  const m = document.querySelector(`input[name="${key}-most"]:checked`);
  const l = document.querySelector(`input[name="${key}-least"]:checked`);
  st.mostItemId = m ? m.value : "";
  st.leastItemId = l ? l.value : "";
  const b = document.getElementById(`${key}-continue`);
  const e = document.getElementById(`${key}-error`);
  if (st.mostItemId && st.leastItemId && st.mostItemId === st.leastItemId) {
    if (e) e.style.display = "block";
    if (b) b.disabled = true;
  } else {
    if (e) e.style.display = "none";
    if (b) b.disabled = !(st.mostItemId && st.leastItemId);
  }
  updateProgressBar();
  if (!suppressSave) saveProgress();
}

function lockSelectionQuestions(key) {
  lockedSections[`${key}-selection`] = true;
  document.getElementById(`${key}-q1-block`)?.classList.add("locked");
  document.getElementById(`${key}-q2-block`)?.classList.add("locked");
  document.querySelectorAll(`input[name="${key}-most"]`).forEach(i => (i.disabled = true));
  document.querySelectorAll(`input[name="${key}-least"]`).forEach(i => (i.disabled = true));
}

function unlockSelections(key) {
  const st = ensureSectionState(key);
  st._unlockMode = true;
  st._oldMostItemId = st.mostItemId || "";
  st._oldLeastItemId = st.leastItemId || "";
  lockedSections[`${key}-selection`] = false;
  document.getElementById(`${key}-q1-block`)?.classList.remove("locked");
  document.getElementById(`${key}-q2-block`)?.classList.remove("locked");
  document.querySelectorAll(`input[name="${key}-most"]`).forEach(i => (i.disabled = false));
  document.querySelectorAll(`input[name="${key}-least"]`).forEach(i => (i.disabled = false));
  const c = document.getElementById(`${key}-comparisons`);
  if (c) c.style.display = "none";
  const cont = document.getElementById(`${key}-continue`);
  const unl = document.getElementById(`${key}-unlock`);
  if (cont) {
    cont.style.display = "inline-block";
    cont.disabled = !(st.mostItemId && st.leastItemId);
  }
  if (unl) unl.style.display = "none";
  updateProgressBar();
  saveProgress();
}

function clearAllComparisonAnswers(key) {
  const st = ensureSectionState(key);
  st.comparisonsMostVsOther = {};
  st.comparisonsOtherVsLeast = {};
  st.othersForMost = [];
  st.othersForLeast = [];
}

function clearMostComparisonAnswers(key) {
  const st = ensureSectionState(key);
  st.comparisonsMostVsOther = {};
  st.othersForMost = [];
}

function clearLeastComparisonAnswers(key) {
  const st = ensureSectionState(key);
  st.comparisonsOtherVsLeast = {};
  st.othersForLeast = [];
}

function restoreComparisonSelections(key) {
  const st = ensureSectionState(key);
  Object.entries(st.comparisonsMostVsOther).forEach(([otherId, sid]) => {
    const i = document.querySelector(`input[name="${key}-comp-most-${otherId}"][value="${sid}"]`);
    if (i) i.checked = true;
  });
  Object.entries(st.comparisonsOtherVsLeast).forEach(([otherId, sid]) => {
    const i = document.querySelector(`input[name="${key}-comp-least-${otherId}"][value="${sid}"]`);
    if (i) i.checked = true;
  });
}

function showComparisons(key, options = {}) {
  const opts = options && typeof options === "object" ? options : {};
  const section = sectionByKey[key];
  if (!section) return;
  const st = ensureSectionState(key);
  if (!st.mostItemId || !st.leastItemId || st.mostItemId === st.leastItemId) return;

  if (st._unlockMode && !opts.isRestore) {
    const mChanged = st._oldMostItemId !== st.mostItemId;
    const lChanged = st._oldLeastItemId !== st.leastItemId;
    if (mChanged && lChanged) clearAllComparisonAnswers(key);
    else if (mChanged) clearMostComparisonAnswers(key);
    else if (lChanged) clearLeastComparisonAnswers(key);
  }
  delete st._unlockMode;
  delete st._oldMostItemId;
  delete st._oldLeastItemId;

  lockSelectionQuestions(key);
  st.othersForMost = section.items.map(i => i.id).filter(id => id !== st.mostItemId);
  st.othersForLeast = section.items.map(i => i.id).filter(id => id !== st.leastItemId && id !== st.mostItemId);
  const mostLabel = itemLabel(key, st.mostItemId);
  const leastLabel = itemLabel(key, st.leastItemId);
  const c = document.getElementById(`${key}-comparisons`);
  if (!c) return;

  let html = '<h3>Comparison Questions</h3>';
  html += '<div class="locked-notice">Your Most/Least selections (Questions 1 and 2) are now locked. Unlocking them resets comparison answers for this page only.</div>';
  let q = 3;
  html += `<div class="comparison-set-title">Comparing <span class="highlight-most">${escapeHtml(mostLabel)}</span> (Most Challenging) to all other barriers:</div>`;
  st.othersForMost.forEach(otherId => {
    const otherLabel = itemLabel(key, otherId);
    const labelHtml =
      otherId === st.leastItemId
        ? `<span class="highlight-least">${escapeHtml(otherLabel)}</span> (Least Challenging)`
        : renderItem(key, otherId);
    html += `<div class="question-block" id="${key}-comp-most-${otherId}-block"><div class="question-number">Question ${q}</div><div class="question-text">How much more challenging is <span class="highlight-most">${escapeHtml(mostLabel)}</span> compared to ${labelHtml}?</div><div class="options">`;
    html += SURVEY_SCHEMA.scaleOptions
      .map(s => `<label><input type="radio" name="${key}-comp-most-${otherId}" value="${s.id}" onchange="storeComparison('${key}','most','${otherId}',this.value)"><span>${escapeHtml(s.label)}</span></label>`)
      .join("");
    html += "</div></div>";
    q++;
  });
  html += `<div class="comparison-set-title">Comparing all other barriers to <span class="highlight-least">${escapeHtml(leastLabel)}</span> (Least Challenging):</div>`;
  st.othersForLeast.forEach(otherId => {
    const otherLabel = itemLabel(key, otherId);
    const labelHtml =
      otherId === st.mostItemId
        ? `<span class="highlight-most">${escapeHtml(otherLabel)}</span> (Most Challenging)`
        : renderItem(key, otherId);
    html += `<div class="question-block" id="${key}-comp-least-${otherId}-block"><div class="question-number">Question ${q}</div><div class="question-text">How much more challenging is ${labelHtml} compared to <span class="highlight-least">${escapeHtml(leastLabel)}</span> (Least Challenging)?</div><div class="options">`;
    html += SURVEY_SCHEMA.scaleOptions
      .map(s => `<label><input type="radio" name="${key}-comp-least-${otherId}" value="${s.id}" onchange="storeComparison('${key}','least','${otherId}',this.value)"><span>${escapeHtml(s.label)}</span></label>`)
      .join("");
    html += "</div></div>";
    q++;
  });
  c.innerHTML = html;
  c.style.display = "block";
  document.getElementById(`${key}-continue`).style.display = "none";
  document.getElementById(`${key}-unlock`).style.display = "inline-block";
  if (opts.isRestore) restoreComparisonSelections(key);
  if (!opts.skipScroll) c.scrollIntoView({ behavior: "smooth" });
  updateProgressBar();
  if (!opts.skipSave) saveProgress();
}

function storeComparison(key, dir, otherId, sid) {
  const st = ensureSectionState(key);
  if (dir === "most") st.comparisonsMostVsOther[otherId] = sid;
  else st.comparisonsOtherVsLeast[otherId] = sid;
  const bid = dir === "most" ? `${key}-comp-most-${otherId}-block` : `${key}-comp-least-${otherId}-block`;
  document.getElementById(bid)?.classList.remove("unanswered");
  updateProgressBar();
  saveProgress();
}

function scrollToFirstIncomplete(pageIdx) {
  let target = null;
  if (pageIdx === 1) {
    const fields = [
      { id: "demo-occupation", wrap: "fg-occupation" },
      { id: "demo-industry", wrap: "fg-industry", other: "demo-industry-other", otherWrap: "fg-industry-other" },
      { id: "demo-experience", wrap: "fg-experience" },
      { id: "demo-education", wrap: "fg-education", other: "demo-education-other", otherWrap: "fg-education-other" },
      { id: "demo-country", wrap: "fg-country" }
    ];
    for (const f of fields) {
      const el = document.getElementById(f.id);
      if (!el) continue;
      let v = (el.value || "").trim();
      if (v === "Other" && f.other) {
        const o = document.getElementById(f.other);
        v = o ? (o.value || "").trim() : "";
        if (!v) {
          target = document.getElementById(f.otherWrap) || o;
          break;
        }
      }
      if (!v) {
        target = document.getElementById(f.wrap) || el;
        break;
      }
    }
  } else if (pageIdx >= 2) {
    const sec = SURVEY_SCHEMA.sections[pageIdx - 2];
    const st = ensureSectionState(sec.key);
    if (!st.mostItemId) target = document.getElementById(`${sec.key}-q1-block`);
    else if (!st.leastItemId) target = document.getElementById(`${sec.key}-q2-block`);
    else {
      const comp = document.getElementById(`${sec.key}-comparisons`);
      if (!comp || comp.children.length === 0 || comp.style.display === "none") target = document.getElementById(`${sec.key}-continue`);
      else {
        for (const id of st.othersForMost) {
          if (!st.comparisonsMostVsOther[id]) {
            target = document.getElementById(`${sec.key}-comp-most-${id}-block`);
            break;
          }
        }
        if (!target) {
          for (const id of st.othersForLeast) {
            if (!st.comparisonsOtherVsLeast[id]) {
              target = document.getElementById(`${sec.key}-comp-least-${id}-block`);
              break;
            }
          }
        }
      }
    }
  }
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.style.outline = "3px solid #e74c3c";
    target.style.outlineOffset = "4px";
    setTimeout(() => {
      target.style.outline = "";
      target.style.outlineOffset = "";
    }, 2000);
  }
}

function validateAllPages() {
  for (let i = 0; i < totalPages(); i++) pageCompletionStatus[i] = checkPageCompletion(i);
  const incomplete = [];
  for (let i = 1; i < totalPages(); i++) if (!pageCompletionStatus[i]) incomplete.push(i);
  if (incomplete.length) {
    document.querySelectorAll(".page-indicator").forEach(i => i.classList.remove("incomplete-page"));
    incomplete.forEach(i => document.querySelector(`.page-indicator[data-page="${i}"]`)?.classList.add("incomplete-page"));
    const names = incomplete.map(i => getPageMeta(i)?.title || `Page ${i + 1}`).join(", ");
    showToast(`Please complete: ${names}`, "error");
    navigateToPage(incomplete[0], { skipSave: true });
    setTimeout(() => scrollToFirstIncomplete(incomplete[0]), 350);
    return false;
  }
  document.querySelectorAll(".page-indicator").forEach(i => i.classList.remove("incomplete-page"));
  return true;
}

function schemaSnapshot() {
  return {
    schemaVersion: SURVEY_SCHEMA.schemaVersion,
    surveyId: SURVEY_SCHEMA.surveyId,
    surveyVersion: SURVEY_SCHEMA.surveyVersion,
    sections: SURVEY_SCHEMA.sections.map(s => ({
      key: s.key,
      title: s.title,
      kind: s.kind,
      items: s.items.map(i => ({ id: i.id, label: i.label }))
    })),
    scaleOptions: SURVEY_SCHEMA.scaleOptions.map(s => ({ id: s.id, label: s.label }))
  };
}

function sanitizedResponses() {
  const out = {};
  SURVEY_SCHEMA.sections.forEach(sec => {
    const st = ensureSectionState(sec.key);
    const ids = new Set(sec.items.map(i => i.id));
    const m = ids.has(st.mostItemId) ? st.mostItemId : "";
    const l = ids.has(st.leastItemId) ? st.leastItemId : "";
    const mComp = {};
    Object.entries(st.comparisonsMostVsOther || {}).forEach(([other, sid]) => {
      if (ids.has(other) && scaleById[sid]) mComp[other] = sid;
    });
    const lComp = {};
    Object.entries(st.comparisonsOtherVsLeast || {}).forEach(([other, sid]) => {
      if (ids.has(other) && scaleById[sid]) lComp[other] = sid;
    });
    out[sec.key] = {
      mostItemId: m,
      leastItemId: l,
      comparisonsMostVsOther: mComp,
      comparisonsOtherVsLeast: lComp,
      othersForMost: (st.othersForMost || []).filter(id => ids.has(id)),
      othersForLeast: (st.othersForLeast || []).filter(id => ids.has(id))
    };
  });
  return out;
}

function submissionPayload() {
  captureDemographics();
  return {
    schemaVersion: SURVEY_SCHEMA.schemaVersion,
    surveyId: SURVEY_SCHEMA.surveyId,
    surveyVersion: SURVEY_SCHEMA.surveyVersion,
    submittedAt: new Date().toISOString(),
    respondent: { ...respondentInfo, endTime: respondentInfo.endTime || "" },
    responses: sanitizedResponses(),
    schemaSnapshot: schemaSnapshot(),
    clientMeta: {
      userAgent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      pageUrl: location.href
    }
  };
}

async function submitSurvey() {
  const overlay = document.getElementById("submit-overlay");
  if (overlay) overlay.classList.add("active");
  const payload = submissionPayload();
  try {
    if (GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      throw new Error("Google Apps Script URL not configured. Please update GOOGLE_SCRIPT_URL in index.html.");
    }
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (overlay) overlay.classList.remove("active");
    document.getElementById("results").style.display = "block";
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
    generateSummary();
  } catch (err) {
    if (overlay) overlay.classList.remove("active");
    document.getElementById("results").style.display = "block";
    document.getElementById("submit-error").style.display = "block";
    document.getElementById("error-message").textContent = err.message;
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
    generateSummary();
    localStorage.setItem(`survey_backup_${Date.now()}`, JSON.stringify(payload));
  }
}

function attemptSubmit() {
  const d = captureDemographics();
  if (d.industryChoice === "Other" && !d.industryOther) {
    document.getElementById("demo-error").style.display = "block";
    document.getElementById("demo-error").textContent = "Please specify your industry sector.";
    navigateToPage(1, { skipSave: true });
    return;
  }
  if (d.educationChoice === "Other" && !d.educationOther) {
    document.getElementById("demo-error").style.display = "block";
    document.getElementById("demo-error").textContent = "Please specify your education level.";
    navigateToPage(1, { skipSave: true });
    return;
  }
  if (!validateAllPages()) return;
  respondentInfo.endTime = new Date().toISOString();
  submitSurvey();
}

function saveProgress() {
  try {
    captureDemographics();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SURVEY_SCHEMA.schemaVersion,
        surveyId: SURVEY_SCHEMA.surveyId,
        surveyVersion: SURVEY_SCHEMA.surveyVersion,
        respondentInfo,
        responses: sanitizedResponses(),
        currentPage,
        timestamp: new Date().toISOString()
      })
    );
    return true;
  } catch (_) {
    return false;
  }
}

function normalizeLoadedResponses(raw) {
  const out = {};
  const warnings = [];
  SURVEY_SCHEMA.sections.forEach(sec => {
    const legacy = raw && typeof raw[sec.key] === "object" ? raw[sec.key] : {};
    const st = {
      mostItemId: "",
      leastItemId: "",
      comparisonsMostVsOther: {},
      comparisonsOtherVsLeast: {},
      othersForMost: [],
      othersForLeast: []
    };
    const lm = legacy.mostItemId || legacy.most || "";
    const ll = legacy.leastItemId || legacy.least || "";
    st.mostItemId = resolveItemId(sec, lm);
    st.leastItemId = resolveItemId(sec, ll);
    if (lm && !st.mostItemId) warnings.push(`Could not map previous 'most' in ${sec.title}.`);
    if (ll && !st.leastItemId) warnings.push(`Could not map previous 'least' in ${sec.title}.`);
    const all = sec.items.map(i => i.id);
    st.othersForMost = st.mostItemId ? all.filter(id => id !== st.mostItemId) : [];
    st.othersForLeast =
      st.leastItemId && st.mostItemId ? all.filter(id => id !== st.leastItemId && id !== st.mostItemId) : [];
    if (Array.isArray(legacy.othersForMost)) {
      const m = legacy.othersForMost.map(v => resolveItemId(sec, v)).filter(Boolean);
      if (m.length) st.othersForMost = m;
    }
    if (Array.isArray(legacy.othersForLeast)) {
      const m = legacy.othersForLeast.map(v => resolveItemId(sec, v)).filter(Boolean);
      if (m.length) st.othersForLeast = m;
    }
    if (legacy.comparisonsMostVsOther && typeof legacy.comparisonsMostVsOther === "object") {
      Object.entries(legacy.comparisonsMostVsOther).forEach(([o, v]) => {
        const id = resolveItemId(sec, o);
        const sid = scaleId(v);
        if (id && sid) st.comparisonsMostVsOther[id] = sid;
      });
    }
    if (legacy.comparisonsOtherVsLeast && typeof legacy.comparisonsOtherVsLeast === "object") {
      Object.entries(legacy.comparisonsOtherVsLeast).forEach(([o, v]) => {
        const id = resolveItemId(sec, o);
        const sid = scaleId(v);
        if (id && sid) st.comparisonsOtherVsLeast[id] = sid;
      });
    }
    st.othersForMost.forEach((id, idx) => {
      const sid = scaleId(legacy[`comp_most_${idx}`]);
      if (sid && !st.comparisonsMostVsOther[id]) st.comparisonsMostVsOther[id] = sid;
    });
    st.othersForLeast.forEach((id, idx) => {
      const sid = scaleId(legacy[`comp_least_${idx}`]);
      if (sid && !st.comparisonsOtherVsLeast[id]) st.comparisonsOtherVsLeast[id] = sid;
    });
    out[sec.key] = st;
  });
  return { responses: out, warnings };
}

function restoreSectionResponses() {
  SURVEY_SCHEMA.sections.forEach(sec => {
    const key = sec.key;
    const st = ensureSectionState(key);
    if (st.mostItemId) {
      const i = document.querySelector(`input[name="${key}-most"][value="${st.mostItemId}"]`);
      if (i) i.checked = true;
    }
    if (st.leastItemId) {
      const i = document.querySelector(`input[name="${key}-least"][value="${st.leastItemId}"]`);
      if (i) i.checked = true;
    }
    handleSelection(key, true);
    const hasComp =
      Object.keys(st.comparisonsMostVsOther || {}).length > 0 ||
      Object.keys(st.comparisonsOtherVsLeast || {}).length > 0;
    if (hasComp && st.mostItemId && st.leastItemId) {
      showComparisons(key, { isRestore: true, skipScroll: true, skipSave: true });
    }
  });
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return false;
    const payload = JSON.parse(raw);
    respondentInfo = payload.respondentInfo || payload.respondent || {};
    const normalized = normalizeLoadedResponses(payload.responses || {});
    responses = normalized.responses;
    restoreDemographics();
    restoreSectionResponses();
    currentPage = clampPage(typeof payload.currentPage === "number" ? payload.currentPage : 0);
    navigateToPage(currentPage, { skipSave: true, skipScroll: true });
    updateProgressBar();
    if (normalized.warnings.length) showToast("Some saved answers could not be mapped to the current schema.", "info");
    return true;
  } catch (_) {
    showToast("Failed to load saved progress", "error");
    return false;
  }
}

function exportData() {
  try {
    const payload = {
      schemaVersion: SURVEY_SCHEMA.schemaVersion,
      surveyId: SURVEY_SCHEMA.surveyId,
      surveyVersion: SURVEY_SCHEMA.surveyVersion,
      respondentInfo: { ...respondentInfo, ...captureDemographics() },
      responses: sanitizedResponses(),
      currentPage,
      exported: new Date().toISOString(),
      schemaSnapshot: schemaSnapshot()
    };
    const data = JSON.stringify(payload, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Survey data exported successfully", "success");
    return true;
  } catch (_) {
    showToast("Failed to export data", "error");
    return false;
  }
}

function resetSurvey() {
  if (!confirm("Are you sure you want to delete all progress and start over? This cannot be undone.")) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem("survey_tour_1");
  localStorage.removeItem("survey_tour_2");
  localStorage.removeItem("survey_tour_3");
  location.reload();
}

function generateSummary() {
  const sum = document.getElementById("summary");
  if (!sum) return;
  let html = "<h3>Your Responses Summary</h3>";
  html += '<div style="margin-bottom:18px;">';
  html += `<p style="margin:4px 0;"><strong>Job Title:</strong> ${escapeHtml(respondentInfo.occupation || "N/A")}</p>`;
  html += `<p style="margin:4px 0;"><strong>Industry:</strong> ${escapeHtml(respondentInfo.industry || "N/A")}</p>`;
  html += `<p style="margin:4px 0;"><strong>Experience:</strong> ${escapeHtml(respondentInfo.experience || "N/A")}</p>`;
  html += `<p style="margin:4px 0;"><strong>Education:</strong> ${escapeHtml(respondentInfo.education || "N/A")}</p>`;
  html += `<p style="margin:4px 0;"><strong>Country:</strong> ${escapeHtml(respondentInfo.country || "N/A")}</p>`;
  html += `<p style="margin:4px 0;"><strong>Expertise:</strong> ${escapeHtml(respondentInfo.expertise || "N/A")}</p>`;
  html += "</div>";
  SURVEY_SCHEMA.sections.forEach(sec => {
    const st = ensureSectionState(sec.key);
    if (!st.mostItemId && !st.leastItemId) return;
    const m = itemLabel(sec.key, st.mostItemId);
    const l = itemLabel(sec.key, st.leastItemId);
    const om = st.othersForMost.length ? st.othersForMost : Object.keys(st.comparisonsMostVsOther || {});
    const ol = st.othersForLeast.length ? st.othersForLeast : Object.keys(st.comparisonsOtherVsLeast || {});
    html += '<div style="margin-bottom:18px; padding:12px; background:#eafaf1; border-radius:6px;">';
    html += `<h4 style="margin:0 0 8px 0;">${escapeHtml(sec.title)}</h4>`;
    html += `<p style="margin:4px 0;"><strong>Most Challenging:</strong> ${escapeHtml(m)}</p>`;
    html += `<p style="margin:4px 0;"><strong>Least Challenging:</strong> ${escapeHtml(l)}</p>`;
    if (om.length) {
      html += `<p style="margin:10px 0 4px 0;"><strong>Comparisons - ${escapeHtml(m)} (Most) vs others:</strong></p>`;
      html += '<table style="border-collapse:collapse; width:100%; margin-bottom:8px; font-size:0.9rem;">';
      html += '<tr style="background:#d5f5e3;"><th style="text-align:left; padding:4px 8px; border:1px solid #b2dfdb;">Compared to</th><th style="text-align:left; padding:4px 8px; border:1px solid #b2dfdb;">Rating</th></tr>';
      om.forEach(id => {
        html += `<tr><td style="padding:4px 8px; border:1px solid #b2dfdb;">${escapeHtml(itemLabel(sec.key, id))}</td><td style="padding:4px 8px; border:1px solid #b2dfdb;">${escapeHtml(scaleById[st.comparisonsMostVsOther[id]]?.label || "N/A")}</td></tr>`;
      });
      html += "</table>";
    }
    if (ol.length) {
      html += `<p style="margin:10px 0 4px 0;"><strong>Comparisons - others vs ${escapeHtml(l)} (Least):</strong></p>`;
      html += '<table style="border-collapse:collapse; width:100%; font-size:0.9rem;">';
      html += '<tr style="background:#d5f5e3;"><th style="text-align:left; padding:4px 8px; border:1px solid #b2dfdb;">Barrier</th><th style="text-align:left; padding:4px 8px; border:1px solid #b2dfdb;">Rating</th></tr>';
      ol.forEach(id => {
        html += `<tr><td style="padding:4px 8px; border:1px solid #b2dfdb;">${escapeHtml(itemLabel(sec.key, id))}</td><td style="padding:4px 8px; border:1px solid #b2dfdb;">${escapeHtml(scaleById[st.comparisonsOtherVsLeast[id]]?.label || "N/A")}</td></tr>`;
      });
      html += "</table>";
    }
    html += "</div>";
  });
  sum.innerHTML = html;
}

function showInfo(sectionKey, itemId) {
  const it = item(sectionKey, itemId);
  if (!it) return;
  document.getElementById("modal-title").textContent = it.label;
  document.getElementById("modal-description").textContent = it.description || "No description available.";
  document.getElementById("modal-overlay").classList.add("active");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("active");
}

function endTour() {
  tourActive = false;
  const el = document.getElementById("tour-container");
  if (el) el.style.display = "none";
}

function advanceTour() {
  endTour();
}

window.addEventListener("DOMContentLoaded", function() {
  renderIntro();
  initSurvey();
  renderIndicators();
  addDemographicListeners();
  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", function(e) {
      if (e.target === this) closeModal();
    });
  }
  loadProgress();
  navigateToPage(currentPage, { skipSave: true, skipScroll: true });
  updateProgressBar();
});
