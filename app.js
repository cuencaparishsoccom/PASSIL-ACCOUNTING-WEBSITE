/* SocCom Finance Portal - vanilla JavaScript client */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PARISH = "Parish and Archdiocesan Shrine of San Isidro Labrador";
const DEFAULT_CATEGORIES = ["General Cash Donations", "Camera Donations", "Microphone Donations", "Laptop Donations", "Computer Equipment Donations", "Other Equipment Donations"];
const DEFAULT_INCOME_CATEGORIES = ["Sales", "Social Media Monetization", "Parish Allowance", "Collections", "Other Income"];
const MODULES = [
  { group: "OVERVIEW", items: [{ id: "dashboard", label: "Dashboard", icon: "⌂" }] },
  { group: "TRANSACTIONS", items: [
    { id: "cash_donation", label: "Cash Donations", icon: "＋", write: true },
    { id: "in_kind_donation", label: "In-Kind Donations", icon: "▣", write: true },
    { id: "income", label: "Income / Collections", icon: "↗", write: true },
    { id: "disbursement", label: "Disbursements", icon: "↗", write: true },
    { id: "expense", label: "Expenses", icon: "−", write: true },
    { id: "cash_return", label: "Cash Returns", icon: "↩", write: true },
    { id: "reimbursement", label: "Reimbursements", icon: "↩", write: true }
  ] },
  { group: "REPORTS & HISTORY", items: [
    { id: "reports", label: "Financial Reports", icon: "▥" },
    { id: "history", label: "Transaction History", icon: "◷" },
    { id: "document_history", label: "Documents History", icon: "▤" }
  ] },
  { group: "ADMINISTRATION", items: [
    { id: "categories", label: "Donation Categories", icon: "◇", admin: true },
    { id: "income_categories", label: "Income Categories", icon: "◇", admin: true },
    { id: "templates", label: "Receipt Templates", icon: "▤", admin: true },
    { id: "users", label: "User Management", icon: "♙", admin: true }
  ] }
];
const TYPE_INFO = {
  cash_donation: { title: "Cash Donation Receipt", prefix: "CDR", badge: "Cash donation", amountLabel: "Amount", inflow: true, fields: [
    ["donor_name", "Received From", "text", true], ["amount", "Amount Donated (PHP)", "number", true],
    ["donation_purpose", "Purpose / Intended Use", "category_select", true],
    ["payment_method", "Mode of Donation", "select", true, ["Cash", "Bank transfer", "E-wallet", "Check", "Other"]],
    ["reference_number", "Reference / Transaction No. (optional)", "text", false],
    ["received_by", "Received by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false], ["remarks", "Remarks", "textarea", false]
  ] },
  in_kind_donation: { title: "In-Kind Donation Receipt", prefix: "IDR", badge: "In-kind donation", fields: [
    ["donor_name", "Received From", "text", true], ["purpose", "Purpose / Intended Use", "text", true],
    ["items", "Donation Details:", "item_rows", true],
    ["received_by", "Received by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false]
  ] },
  income: { title: "Income / Collection Receipt", prefix: "IR", badge: "Income", inflow: true, fields: [
    ["received_from", "Received From", "text", true],
    ["category", "Income Source / Category", "income_category_select", true],
    ["payment_method", "Mode of Payment", "select", true, ["Cash", "Bank transfer", "E-wallet", "Check", "Other"]],
    ["amount", "Amount Received (PHP)", "number", true],
    ["reference_number", "Reference/Transactions (optional)", "text", false],
    ["particulars", "Particulars", "textarea", true],
    ["prepared_by", "Prepared by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false]
  ] },
  disbursement: { title: "Disbursement Voucher", prefix: "DV", badge: "Disbursement", fields: [
    ["payee", "Payee/Recipient", "text", true], ["funding_source", "Funding source", "fund", true],
    ["purpose", "Purpose of Payment", "textarea", true], ["particulars", "Particulars", "amount_rows", true],
    ["payment_method", "Payment Method", "select", true, ["Cash", "Bank transfer", "E-wallet", "Check", "Other"]],
    ["prepared_by", "Prepared by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false], ["received_by", "Received by — Finance Officer", "text", true],
    ["date_received", "Date Received", "date", true]
  ] },
  expense: { title: "Expense Record", prefix: "ER", badge: "Expense", outflow: true, fields: [
    ["supplier", "Payee/Recipient", "text", true], ["expense_category", "Event / Activity / Project", "text", true],
    ["funding_source", "Funding source", "fund", true], ["items", "Expense Details", "expense_rows", true],
    ["receipt_file", "Supporting document (optional)", "file", false],
    ["prepared_by", "Prepared by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false], ["received_by", "Received by — Finance Officer", "text", true],
    ["date_received", "Date Received", "date", true]
  ] },
  cash_return: { title: "Cash Return Record", prefix: "CR", badge: "Cash return", fields: [
    ["person_involved", "Name of Person", "text", true], ["funding_source", "Funding Source", "fund", true],
    ["total_funds_received", "Total Funds Received (PHP)", "number", true],
    ["actual_expenses", "Less: Actual Expenses (PHP)", "number", true],
    ["unused_funds_return", "Unused Funds Return (PHP)", "calculated_amount", true],
    ["returned_through", "Returned Through", "select", true, ["Cash on Hand", "E-wallet", "Bank"]],
    ["received_by", "Received by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false]
  ] },
  reimbursement: { title: "Reimbursement", prefix: "RB", badge: "Reimbursement", fields: [
    ["person_involved", "Name of the Person", "text", true], ["funding_source", "Funding Source", "fund", true],
    ["items", "Particulars", "amount_rows", true],
    ["returned_through", "Returned Through", "select", true, ["Cash on Hand", "E-wallet", "Bank"]],
    ["received_by", "Received by — Finance Officer", "text", true], ["checked_by", "Checked by — Audit Officer", "text", true],
    ["approved_by", "Approved by (optional)", "text", false], ["requested_by", "Requested by", "text", true],
    ["date_paid", "Date Paid", "date", true]
  ] },
  liquidation: { title: "Liquidation Report", prefix: "LR", badge: "Liquidation", fields: [
    ["related_disbursement", "Related disbursement", "text", true], ["funding_source", "Funding source", "fund", true],
    ["cash_released", "Cash released (PHP)", "number", true], ["actual_expenses", "Actual expenses (PHP)", "number", true],
    ["cash_returned", "Cash returned (PHP)", "number", true], ["accountable_person", "Accountable person", "text", true],
    ["receipt_file", "Supporting receipts (optional)", "file", false], ["remarks", "Remarks", "textarea", false]
  ] }
};
const TEMPLATE_DEFINITIONS = {
  cash_donation: { label: "Cash Donation Receipt", title: "CASH/MONETARY DONATION RECEIPT", footer: "Your generous donation is a great help to our Social Communications Team in supporting its activities, projects, and mission of serving the Church through communication and media.\nMay God bless your kindness and generosity. Thank you for being part of our mission!", labels: {
    receipt_no: "Receipt No.:", date: "Date Received:", received_from: "Received From:", amount: "Amount Donated:", amount_words: "Amount in Words:", mode: "Mode of Donation:", reference: "Reference/Transaction No.:", purpose: "Purpose/Intended Use:", remarks: "Remarks:", received_by: "Received by:", checked_by: "Checked by:", approved_by: "Approved by (optional):", thank_you_heading: "Thank You for Your Donation!"
  } },
  in_kind_donation: { label: "In-Kind Donation Receipt", title: "IN-KIND DONATION RECEIPT", footer: "Your generous donation is a great help to our Social Communications Team in supporting its activities, projects, and mission of serving the Church through communication and media.\nMay God bless your kindness and generosity. Thank you for being part of our mission!", labels: {
    receipt_no: "Receipt No.:", date: "Date Received:", received_from: "Received From:", purpose: "Purpose/Intended Use:", details: "Donation Details:", quantity: "Quantity", unit: "Unit", description: "Description of Item", estimated_value: "Estimated Value", received_by: "Received by:", checked_by: "Checked by:", approved_by: "Approved by (optional):", thank_you_heading: "Thank You for Your Donation!"
  } },
  income: { label: "Income Receipt", title: "OFFICIAL RECEIPT", labels: {
    receipt_no: "Receipt No.:", date: "Date Received:", received_from: "Received From:", category: "Income Source/Category:", mode: "Mode of Payment:", reference: "Reference/Transactions:", amount: "Amount Received:", amount_words: "Amount in Words:", particulars: "Particulars:", prepared_by: "Prepared by:", checked_by: "Checked by:", approved_by: "Approved by (optional):"
  } },
  disbursement: { label: "Disbursement Voucher", title: "DISBURSEMENT VOUCHER", labels: {
    voucher_no: "Voucher No.:", date: "Date:", payee: "Payee/Recipient:", purpose: "Purpose of Payment:", particulars: "Particulars", amount: "Amount", total: "Total Amount", payment_method: "Payment Method:", prepared_by: "Prepared by:", checked_by: "Checked by:", approved_by: "Approved by (optional):", received_by: "Received by:", date_received: "Date Received:"
  } },
  expense: { label: "Expense Record", title: "EXPENSE RECORD", labels: {
    record_no: "Expense Record No.:", date: "Date:", payee: "Payee/Recipient:", activity: "Event / Activity / Project:", line_date: "Date", particulars: "Particulars", receipt_no: "OR/Receipt No.", amount: "Amount", total: "Total Amount Expenses", prepared_by: "Prepared by:", checked_by: "Checked by:", approved_by: "Approved by (optional):", received_by: "Received by:", date_received: "Date Received:"
  } },
  cash_return: { label: "Cash Return", title: "CASH RETURN RECORD (UNUSED FUNDS)", labels: {
    record_no: "Record No.:", date: "Date:", person: "Name of Person:", funding_source: "Funding Source:", total_received: "Total Funds Received:", actual_expenses: "Less: Actual Expenses:", unused_return: "Unused Funds Returned:", returned_through: "Returned Through:", received_by: "Received by:", checked_by: "Checked by:", approved_by: "Approved by (optional):"
  } },
  reimbursement: { label: "Reimbursement", title: "REIMBURSEMENT (PERSONAL FUNDS USED)", labels: {
    record_no: "Record No.:", date: "Date:", person: "Name of the Person:", particulars: "Particulars", amount: "Amount", total: "Total Amount", returned_through: "Returned Through:", received_by: "Received by:", checked_by: "Checked by:", approved_by: "Approved by (optional):", requested_by: "Requested by:", date_paid: "Date Paid:"
  } }
};
const DEFAULT_TEMPLATES = Object.fromEntries(Object.entries(TEMPLATE_DEFINITIONS).map(([id, definition]) => [id, {
  title: definition.title,
  footer: definition.footer || "",
  labels: { ...definition.labels }
}]));
const DEFAULT_SYSTEM_SETTINGS = { organizationLogo: "", financeOfficer: "", auditOfficer: "" };
const state = {
  page: "dashboard", transactions: [], categories: [...DEFAULT_CATEGORIES], incomeCategories: [...DEFAULT_INCOME_CATEGORIES], profiles: [],
  systemSettings: { ...DEFAULT_SYSTEM_SETTINGS }, templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES)), templateEditorKind: "cash_donation",
  templateSelectedBlock: null, templateDrag: null,
  auditLogs: [], client: null, channel: null, user: null, role: "pending", cloud: false, pendingAccess: false,
  passwordRecovery: new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
};

function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function normalizeSystemSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  const logo = typeof source.organizationLogo === "string" && /^data:image\/(?:webp|png|jpeg);base64,/.test(source.organizationLogo) && source.organizationLogo.length <= 350000
    ? source.organizationLogo : "";
  return {
    organizationLogo: logo,
    financeOfficer: typeof source.financeOfficer === "string" ? source.financeOfficer.slice(0, 100) : "",
    auditOfficer: typeof source.auditOfficer === "string" ? source.auditOfficer.slice(0, 100) : ""
  };
}
function normalizeTemplateFontSizes(value) {
  const source=value&&typeof value==="object"?value:{};
  return Object.fromEntries(Object.entries(source).flatMap(([key,size])=>{
    const parsed=Number(size);
    return /^[a-z0-9_-]{1,60}$/i.test(key)&&Number.isFinite(parsed)&&parsed>=6&&parsed<=48?[[key,Math.round(parsed*2)/2]]:[];
  }));
}
function normalizeTemplatePositions(value) {
  const source=value&&typeof value==="object"?value:{};
  return Object.fromEntries(Object.entries(source).flatMap(([key,position])=>{
    if(!/^[a-z0-9_-]{1,60}$/i.test(key)||!position||typeof position!=="object") return [];
    const x=Number(position.x), y=Number(position.y);
    if(!Number.isFinite(x)||!Number.isFinite(y)) return [];
    return [[key,{x:Math.max(-200,Math.min(200,Math.round(x))),y:Math.max(-200,Math.min(200,Math.round(y)))}]];
  }));
}
function normalizeTemplates(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(Object.entries(TEMPLATE_DEFINITIONS).map(([id, definition]) => {
    const saved = source[id] && typeof source[id] === "object" ? source[id] : {};
    const labels = saved.labels && typeof saved.labels === "object" ? saved.labels : {};
    return [id, {
      title: typeof saved.title === "string" ? saved.title.slice(0, 120) : definition.title,
      footer: typeof saved.footer === "string" ? saved.footer.slice(0, 1200) : (definition.footer || ""),
      labels: Object.fromEntries(Object.entries(definition.labels).map(([key, defaultValue]) => [
        key, typeof labels[key] === "string" ? labels[key].slice(0, 100) : defaultValue
      ])),
      layout: Array.isArray(saved.layout)
        ? [...new Set(saved.layout.filter(key => typeof key === "string" && /^[a-z0-9_-]{1,60}$/i.test(key)))].slice(0, 60)
        : [],
      fontSizes: normalizeTemplateFontSizes(saved.fontSizes),
      positions: normalizeTemplatePositions(saved.positions)
    }];
  }));
}
function templateForTransaction(tx) {
  return tx.kind === "cash_return" && getPayload(tx).record_type === "Reimbursement paid" ? "reimbursement" : tx.kind;
}
function templateSettings(id) {
  return state.templates[id] || DEFAULT_TEMPLATES[id] || { title: "Financial Record", footer: "", labels: {} };
}
function templateLabel(id, key) {
  const definition = TEMPLATE_DEFINITIONS[id];
  return templateSettings(id).labels[key] || definition?.labels[key] || "";
}
function receiptHeaderMarkup() {
  const orgLogo = state.systemSettings.organizationLogo || "assets/soccom-logo.png";
  const orgAlt = state.systemSettings.organizationLogo ? "Organization logo" : "SocCom logo";
  return `<header class="cash-receipt-header">
    <img src="assets/parish-logo.png" alt="Parish emblem">
    <img src="${escapeHtml(orgLogo)}" alt="${orgAlt}">
    <div><p data-template-block="parish-name">PARISH AND ARCHDIOCESAN SHRINE OF SAN ISIDRO LABRADOR - CUENCA, BATANGAS</p><h2 data-template-block="office-name">COMMITTEE ON SOCIAL COMMUNICATIONS</h2></div>
  </header>`;
}
function formatTemplateText(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}
function money(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(Number(value || 0));
}
function isoDate(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function prettyDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${String(date).slice(0, 10)}T00:00:00`));
}
function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}
function getPayload(tx) {
  return tx.payload && typeof tx.payload === "object" ? tx.payload : {};
}
function transactionKind(tx) {
  if (tx.kind === "cash_return" && getPayload(tx).record_type === "Reimbursement paid") return "reimbursement";
  return tx.kind;
}
function displayKind(tx) {
  if(transactionKind(tx)==="reimbursement") return "Reimbursement";
  if(tx.kind==="cash_return") return "Cash return";
  return TYPE_INFO[tx.kind]?.badge || titleCase(tx.kind);
}
function txAmount(tx) {
  return Number(tx.amount ?? 0);
}
function sourceKey(tx) {
  if (tx.funding_source) return tx.funding_source;
  const p = getPayload(tx);
  if (tx.kind === "cash_donation") return `donation:${p.donation_purpose || "General Cash Donations"}`;
  if (tx.kind === "income") return "income";
  return "";
}
function computeSummary(transactions = state.transactions) {
  let income = 0, donations = 0, expenses = 0, returns = 0, reimbursements = 0;
  const pools = { income: 0 }, incomeByCategory = {}, donationByCategory = {}, expenseByFund = {};
  for (const tx of transactions) {
    const p = getPayload(tx), amount = txAmount(tx), fund = sourceKey(tx);
    if (tx.kind === "income") {
      income += amount; incomeByCategory[p.category || p.income_source || "Other Income"] = (incomeByCategory[p.category || p.income_source || "Other Income"] || 0) + amount;
      pools.income = (pools.income || 0) + amount;
    } else if (tx.kind === "cash_donation") {
      donations += amount; const purpose = p.donation_purpose || "Other";
      donationByCategory[purpose] = (donationByCategory[purpose] || 0) + amount;
      pools[`donation:${purpose}`] = (pools[`donation:${purpose}`] || 0) + amount;
    } else if (tx.kind === "expense") {
      expenses += amount; pools[fund] = (pools[fund] || 0) - amount; expenseByFund[fund] = (expenseByFund[fund] || 0) + amount;
    } else if (tx.kind === "cash_return" && p.record_type !== "Reimbursement paid") {
      returns += amount; pools[fund] = (pools[fund] || 0) + amount;
    } else if (tx.kind === "cash_return" && p.record_type === "Reimbursement paid") {
      reimbursements += amount; pools[fund] = (pools[fund] || 0) - amount; expenseByFund[fund] = (expenseByFund[fund] || 0) + amount;
    }
  }
  const available = income + donations;
  return { income, donations, available, expenses, returns, reimbursements, balance: available - expenses + returns - reimbursements, pools, incomeByCategory, donationByCategory, expenseByFund };
}
function toast(message, error = false) {
  const item = document.createElement("div");
  item.className = `toast${error ? " error" : ""}`; item.textContent = message;
  $("#toast-region").append(item); setTimeout(() => item.remove(), 3700);
}
function setIdentity() {
  const label = state.user?.user_metadata?.full_name || state.user?.email || "Not signed in";
  $("#user-name").textContent = label;
  $("#user-role").textContent = titleCase(state.role);
  $("#user-avatar").textContent = label.trim().charAt(0).toUpperCase();
  $("#connection-label").textContent = state.cloud ? "Supabase connected" : "Supabase required";
  $(".status-dot").classList.toggle("online", state.cloud);
  $("#quick-add").disabled = !canWrite();
  if ($("#navigation")) renderNavigation();
}
function renderNavigation() {
  $("#navigation").innerHTML = MODULES.map(group => {
    const items = group.items.filter(item => {
      if (item.admin && !canManage()) return false;
      if (item.write && !canWrite()) return false;
      return true;
    });
    if (!items.length) return "";
    return `<div class="nav-section"><div class="nav-section-label">${group.group}</div>${items.map(item =>
      `<button type="button" class="nav-link${state.page === item.id ? " active" : ""}" data-page="${item.id}" ${state.page === item.id ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`
    ).join("")}</div>`;
  }).join("");
}
function navigate(page) {
  if (page === "SocCom Finance Portal home") page = "dashboard";
  const target = MODULES.flatMap(group => group.items).find(item => item.id === page)
    || (page === "settings" ? { label: "Settings" } : null);
  if (!target) return;
  state.page = page;
  $("#page-title").textContent = target.label;
  $("#sidebar").classList.remove("open");
  $("#sidebar-close").setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $$(".sidebar-bottom [data-page]").forEach(button => {
    const active = button.dataset.page === page;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  renderNavigation();
  renderPage();
}
function canWrite() { return state.cloud && ["admin", "staff", "finance_officer", "treasurer", "approver"].includes(state.role); }
function canManage() { return state.cloud && state.role === "admin"; }
function syncBrandLogo() {
  const logo=$(".brand-mark-logo");
  if(!logo) return;
  logo.src=state.systemSettings.organizationLogo||"assets/soccom-logo.png";
  logo.alt=state.systemSettings.organizationLogo?"Organization logo":"SocCom logo";
}

function buildModuleNav() {
  $("#today-label").textContent = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());
  renderNavigation();
  $("#quick-add").addEventListener("click", () => openTransactionForm());
  const savedSidebarState = localStorage.getItem("soccom-sidebar-collapsed") === "true";
  const setSidebarCollapsed = collapsed => {
    if (window.innerWidth <= 760) return;
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    const collapseButton = $("#sidebar-collapse");
    collapseButton.setAttribute("aria-expanded", String(!collapsed));
    collapseButton.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    collapseButton.textContent = "=";
    localStorage.setItem("soccom-sidebar-collapsed", String(collapsed));
  };
  setSidebarCollapsed(savedSidebarState);
  $("#sidebar-collapse").addEventListener("click", () => {
    setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  });
  const setSidebarOpen = open => {
    $("#sidebar").classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    $("#menu-toggle").setAttribute("aria-expanded", String(open));
    $("#menu-toggle").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };
  $("#menu-toggle").setAttribute("aria-controls", "sidebar");
  $("#menu-toggle").setAttribute("aria-expanded", "false");
  $("#menu-toggle").addEventListener("click", () => setSidebarOpen(!$("#sidebar").classList.contains("open")));
  $("#sidebar-close").addEventListener("click", () => setSidebarOpen(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("#sidebar").classList.contains("open")) setSidebarOpen(false);
  });
  document.addEventListener("pointerdown", event => {
    if (
      $("#sidebar").classList.contains("open") &&
      !event.target.closest("#sidebar") &&
      !event.target.closest("#menu-toggle")
    ) setSidebarOpen(false);
  });
  $(".app-shell").addEventListener("click", handlePageClick);
  window.addEventListener("beforeprint", () => {
    const dialog=$("#document-dialog");
    if(dialog.open) prepareDocumentForPrint(dialog);
  });
  renderPage();
}

function summaryCard(label, value, foot, emphasis = false) {
  return `<div class="summary-card${emphasis ? " emphasis" : ""}"><div class="card-label">${escapeHtml(label)}</div><div class="card-value">${value}</div><div class="card-foot">${escapeHtml(foot)}</div></div>`;
}
function recentRows(rows) {
  if (!rows.length) return `<tr><td colspan="5"><div class="empty-state">No transactions recorded yet.</div></td></tr>`;
  return rows.slice(0, 8).map(tx => {
    const p = getPayload(tx);
    return `<tr><td><button class="doc-link" data-doc="${escapeHtml(tx.id)}">${escapeHtml(tx.document_no || "—")}</button></td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td><td>${escapeHtml(p.donor_name || p.received_from || p.payee || p.income_source || p.supplier || p.person_involved || p.accountable_person || p.item_description || p.purpose || p.particulars || tx.description || displayKind(tx))}</td><td><span class="badge${tx.kind === "expense" ? " gold" : ""}">${escapeHtml(displayKind(tx))}</span></td><td class="amount">${money(tx.amount || p.estimated_value || 0)}</td></tr>`;
  }).join("");
}
function renderDashboard() {
  const s = computeSummary();
  const latest = [...state.transactions].sort((a,b) => String(b.transaction_date).localeCompare(String(a.transaction_date)) || String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const donationEntries = Object.entries(s.donationByCategory).sort((a,b) => b[1] - a[1]);
  const donationRows = donationEntries.length ? donationEntries : DEFAULT_CATEGORIES.map(name => [name, 0]);
  const maxDonation = Math.max(1, ...donationRows.map(([, value]) => value));
  const incomeDetails = [...new Set([...state.incomeCategories, ...Object.keys(s.incomeByCategory)])].map(name => [name, s.incomeByCategory[name] || 0]).sort((a,b) => b[1] - a[1]);
  const monthBars = monthlyMovement();
  return `<div class="welcome-row"><div><h2>Financial overview</h2><p>Live summary of recorded SocCom funds and activity.</p></div><button class="button button-outline" data-page="reports">View reports&nbsp; →</button></div>
    <div class="summary-grid">
      ${summaryCard("Overall total funds", money(s.available), "Income plus cash donations")}
      ${summaryCard("Total income", money(s.income), "Recorded income and collections")}
      ${summaryCard("Total cash donations", money(s.donations), "Cash only · in-kind excluded")}
      ${summaryCard("Total expenses", money(s.expenses + s.reimbursements), "Expenses and reimbursements paid")}
      ${summaryCard("Remaining cash balance", money(s.balance), "Available funds − outflows + cash returns", true)}
    </div>
    <div class="dashboard-grid">
      <div class="panel chart-panel"><div class="chart-heading"><div><h3>Financial movement</h3><p>Income, cash donations and recorded outflows by month</p></div><span class="badge">Last 6 months</span></div><div class="chart-wrap"><canvas id="movement-chart" aria-label="Monthly financial movements" role="img"></canvas></div><div class="legend"><span style="--legend-color:#2d745c">Income</span><span style="--legend-color:#c9a65a">Cash donations</span><span style="--legend-color:#c67d6b">Expenses</span></div></div>
      <div class="panel"><div class="chart-heading"><div><h3>Cash donation purposes</h3><p>Balances are maintained separately by purpose</p></div></div>
        <div class="breakdown-list">${donationRows.slice(0, 8).map(([name,value]) => `<button type="button" class="breakdown-row" data-page="cash_donation" aria-label="View cash donations for ${escapeHtml(name)}"><span class="breakdown-top"><span>${escapeHtml(name)}</span><strong>${money(value)}</strong></span><span class="progress-track"><span class="progress-fill" style="width:${Math.max(value ? 2 : 0, value / maxDonation * 100)}%"></span></span></button>`).join("")}</div>
      </div>
    </div>
    <div class="three-column">
      <div><div class="section-heading"><div><h2>Income summary</h2><p>By recorded category</p></div>${canManage() ? `<button class="button button-outline" data-page="income_categories">Manage categories</button>` : ""}</div><div class="panel">${incomeDetails.length ? `<div class="breakdown-list">${incomeDetails.slice(0, 6).map(([name,value]) => `<div class="breakdown-top"><span>${escapeHtml(name)}</span><strong>${money(value)}</strong></div>`).join("")}</div>` : `<div class="empty-state">No income recorded yet.</div>`}</div></div>
      <div><div class="section-heading"><div><h2>Expense summary</h2><p>Actual outflows by assigned fund</p></div><button class="button button-outline" data-page="expense">Manage</button></div><div class="panel"><div class="breakdown-list">${Object.entries(s.expenseByFund).sort((a,b)=>b[1]-a[1]).map(([fund,value]) => `<div class="breakdown-top"><span>${escapeHtml(fund === "income" ? "Income fund" : fund.replace(/^donation:/, ""))}</span><strong>${money(value)}</strong></div>`).join("") || `<div class="empty-state">No expenses recorded.</div>`}</div></div></div>
      <div><div class="section-heading"><div><h2>Remaining by fund</h2><p>Expenses and cash returns assigned to their funding source</p></div></div><div class="panel"><div class="breakdown-list">${Object.entries(s.pools).sort((a,b) => b[1]-a[1]).slice(0, 6).map(([fund,balance]) => `<div class="breakdown-top"><span>${escapeHtml(fund === "income" ? "Income fund" : fund.replace(/^donation:/, ""))}</span><strong>${money(balance)}</strong></div>`).join("") || `<div class="empty-state">No cash funds recorded.</div>`}</div></div></div>
    </div>
    <div class="section-heading"><div><h2>Recent transactions</h2><p>Most recent records across all modules</p></div><button class="button button-outline" data-page="history">View history</button></div>
    <div class="panel table-wrap"><table><thead><tr><th>Document no.</th><th>Date</th><th>Details</th><th>Type</th><th>Amount</th></tr></thead><tbody>${recentRows(latest)}</tbody></table></div>`;
}
function monthlyMovement() {
  const result = [];
  const today = new Date();
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const item = { key, label: d.toLocaleDateString("en-PH", { month: "short" }), income: 0, donations: 0, expenses: 0 };
    for (const tx of state.transactions) {
      if (String(tx.transaction_date || "").slice(0,7) !== key) continue;
      if (tx.kind === "income") item.income += txAmount(tx);
      if (tx.kind === "cash_donation") item.donations += txAmount(tx);
      if (tx.kind === "expense" || transactionKind(tx) === "reimbursement") item.expenses += txAmount(tx);
    }
    result.push(item);
  }
  return result;
}
function drawMovementChart() {
  const canvas = $("#movement-chart");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, rect.width * ratio); canvas.height = Math.max(1, rect.height * ratio);
  const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
  const width = rect.width, height = rect.height, data = monthlyMovement();
  const max = Math.max(1, ...data.flatMap(item => [item.income,item.donations,item.expenses])) * 1.18;
  const top = 12, bottom = 25, left = 37, chartH = height - top - bottom, chartW = width - left - 7;
  ctx.clearRect(0,0,width,height); ctx.font = "9px Helvetica, 'Helvetica Neue', Arial, sans-serif"; ctx.fillStyle = "#97a29b"; ctx.strokeStyle = "#edf0ee"; ctx.lineWidth = 1;
  for (let i=0;i<4;i++) {
    const y = top + chartH * i / 3;
    ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(width-4,y); ctx.stroke();
    ctx.fillText(money(max * (1-i/3)).replace("PHP","₱").slice(0,-3), 0, y+3);
  }
  const colors = ["#2d745c","#c9a65a","#c67d6b"], keys = ["income","donations","expenses"], groupW = chartW / data.length, barW = Math.min(13, groupW * .19);
  data.forEach((item,index) => {
    const center = left + groupW * (index+.5);
    keys.forEach((key, j) => {
      const barH = item[key] / max * chartH;
      ctx.fillStyle = colors[j]; ctx.beginPath(); ctx.roundRect(center + (j-1)*barW - barW*.42, top + chartH - barH, barW*.84, Math.max(barH, item[key] ? 1 : 0), 2); ctx.fill();
    });
    ctx.fillStyle = "#88948d"; ctx.textAlign = "center"; ctx.fillText(item.label, center, height-7);
  });
  canvas._chartData = { data, left, top, chartH, chartW, groupW };
  canvas.onmousemove = event => {
    const chart = canvas._chartData, x = event.offsetX;
    if (!chart || x < chart.left) { canvas.title = "Monthly financial movements"; return; }
    const index = Math.floor((x-chart.left)/chart.groupW), item = chart.data[index];
    canvas.title = item ? `${item.label}: Income ${money(item.income)} · Donations ${money(item.donations)} · Outflows ${money(item.expenses)}` : "Monthly financial movements";
  };
}

function moduleTransactions(kind) {
  return [...state.transactions].filter(tx => {
    if (kind === "history") return true;
    if (kind === "reimbursement") return transactionKind(tx) === "reimbursement";
    if (kind === "cash_return") return tx.kind === "cash_return" && transactionKind(tx) !== "reimbursement";
    return tx.kind === kind;
  })
    .sort((a,b) => String(b.transaction_date).localeCompare(String(a.transaction_date)) || String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
function renderTransactionList(kind) {
  const info = TYPE_INFO[kind];
  const rows = moduleTransactions(kind);
  const heading = kind === "cash_return" ? "Cash Return Records" : kind === "reimbursement" ? "Reimbursements" : `${info.title}s`;
  const subtitle = kind === "cash_return" ? "Search, review, and print unused-funds return records." : kind === "reimbursement" ? "Search, review, and print reimbursed payment records." : `Search, review, and print ${info.badge.toLowerCase()} records.`;
  const createButtons = kind === "cash_return"
    ? `<button class="button button-primary" data-create="cash_return" ${canWrite() ? "" : "disabled"}>＋ New cash return</button>`
    : kind === "reimbursement"
    ? `<button class="button button-primary" data-create="reimbursement" ${canWrite() ? "" : "disabled"}>＋ New reimbursement</button>`
    : `<button class="button button-primary" data-create="${kind}" ${canWrite() ? "" : "disabled"}>＋ New record</button>`;
  return `<div class="welcome-row"><div><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(subtitle)}</p></div>${createButtons}</div>
    <div class="toolbar"><div class="toolbar-group"><input class="field-control search-control" id="table-search" type="search" placeholder="Search document, name, or details…"></div><div class="toolbar-group"><input class="field-control" id="date-from" type="date" aria-label="From date"><input class="field-control" id="date-to" type="date" aria-label="To date"><button class="button button-outline" data-clear-filters>Clear filters</button></div></div>
    <div class="panel table-wrap"><table><thead><tr><th>Document no.</th><th>Date</th><th>Details</th><th>Funding / category</th><th>Amount</th><th></th></tr></thead><tbody id="transaction-table-body">${transactionRows(rows)}</tbody></table></div>`;
}
function transactionRows(rows) {
  if (!rows.length) return `<tr><td colspan="6"><div class="empty-state">No records match this view. Create a record to get started.</div></td></tr>`;
  return rows.map(tx => {
    const p = getPayload(tx), source = p.donation_purpose || p.purpose || p.category || p.funding_source || tx.funding_source || "—";
    const detail = p.donor_name || p.received_from || p.payee || p.income_source || p.supplier || p.person_involved || p.accountable_person || p.item_description || p.expense_category || p.purpose || p.particulars || p.description || displayKind(tx);
    const amount = tx.amount || p.estimated_value || p.actual_expenses || 0;
    return `<tr data-row-search="${escapeHtml(`${tx.document_no} ${detail} ${source} ${displayKind(tx)}`.toLowerCase())}" data-row-date="${escapeHtml(tx.transaction_date || "")}"><td><button class="doc-link" data-doc="${escapeHtml(tx.id)}">${escapeHtml(tx.document_no || "—")}</button></td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td><td>${escapeHtml(detail)}</td><td>${escapeHtml(source)}</td><td class="amount">${money(amount)}</td><td><button class="button button-outline" data-doc="${escapeHtml(tx.id)}">View</button></td></tr>`;
  }).join("");
}
function renderHistory() {
  const rows = moduleTransactions("history");
  const audit = state.cloud && ["admin","audit"].includes(state.role) ? `<div class="section-heading"><div><h2>Audit log</h2><p>Recent database-recorded create, update, and delete events</p></div></div><div class="panel table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Transaction</th><th>Actor ID</th></tr></thead><tbody>${state.auditLogs.length ? state.auditLogs.map(log=>`<tr><td>${escapeHtml(new Date(log.occurred_at).toLocaleString("en-PH"))}</td><td><span class="badge">${escapeHtml(log.action)}</span></td><td>${escapeHtml(log.transaction_id)}</td><td>${escapeHtml(log.actor_id||"System")}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty-state">No audit events are recorded yet.</div></td></tr>`}</tbody></table></div>` : "";
  return `<div class="welcome-row"><div><h2>Transaction history</h2><p>Complete chronological ledger with generated document references.</p></div><button class="button button-outline" data-export="transactions">Export Excel</button></div>
    <div class="toolbar"><div class="toolbar-group"><input class="field-control search-control" id="table-search" type="search" placeholder="Search across transaction history…"></div><div class="toolbar-group"><input class="field-control" id="date-from" type="date" aria-label="From date"><input class="field-control" id="date-to" type="date" aria-label="To date"></div></div>
    <div class="panel table-wrap"><table><thead><tr><th>Document no.</th><th>Date</th><th>Details</th><th>Type</th><th>Funding source</th><th>Amount</th></tr></thead><tbody id="transaction-table-body">${rows.length ? rows.map(tx=>{const p=getPayload(tx);return `<tr data-row-search="${escapeHtml(`${tx.document_no} ${JSON.stringify(p)} ${displayKind(tx)}`.toLowerCase())}" data-row-date="${escapeHtml(tx.transaction_date||"")}"><td><button class="doc-link" data-doc="${escapeHtml(tx.id)}">${escapeHtml(tx.document_no||"—")}</button></td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td><td>${escapeHtml(p.donor_name||p.received_from||p.payee||p.income_source||p.supplier||p.person_involved||p.item_description||p.purpose||p.particulars||p.description||displayKind(tx))}</td><td><span class="badge">${escapeHtml(displayKind(tx))}</span></td><td>${escapeHtml(sourceKey(tx).replace(/^donation:/,"")||"—")}</td><td class="amount">${money(tx.amount||p.estimated_value||0)}</td></tr>`}).join(""):`<tr><td colspan="6"><div class="empty-state">No transactions have been recorded.</div></td></tr>`}</tbody></table></div>${audit}`;
}
function renderDocumentHistory() {
  const rows = moduleTransactions("history");
  const types = ["expense","cash_donation","in_kind_donation","income","disbursement","cash_return","reimbursement"];
  return `<div class="welcome-row"><div><h2>Documents history</h2><p>Find previously recorded transactions and print their receipts or supporting documents again.</p></div></div>
    <div class="toolbar"><div class="toolbar-group"><input class="field-control search-control" id="table-search" type="search" placeholder="Search document, name, or details…"></div><div class="toolbar-group"><select class="field-control" id="document-type" aria-label="Filter by document type"><option value="all">All document types</option>${types.map(type=>`<option value="${type}">${escapeHtml(TYPE_INFO[type]?.badge||titleCase(type))}</option>`).join("")}</select><input class="field-control" id="date-from" type="date" aria-label="From date"><input class="field-control" id="date-to" type="date" aria-label="To date"><button class="button button-outline" data-clear-filters>Clear filters</button></div></div>
    <div class="panel table-wrap"><table><thead><tr><th>Document no.</th><th>Date</th><th>Type</th><th>Details</th><th>Amount</th><th>Actions</th></tr></thead><tbody id="transaction-table-body">${rows.length ? rows.map(tx=>{const p=getPayload(tx),detail=p.donor_name||p.received_from||p.payee||p.income_source||p.supplier||p.person_involved||p.item_description||p.expense_category||p.purpose||p.particulars||p.description||displayKind(tx);return `<tr data-row-search="${escapeHtml(`${tx.document_no} ${detail} ${JSON.stringify(p)} ${displayKind(tx)}`.toLowerCase())}" data-row-date="${escapeHtml(tx.transaction_date||"")}" data-row-type="${escapeHtml(transactionKind(tx))}"><td>${escapeHtml(tx.document_no||"—")}</td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td><td><span class="badge">${escapeHtml(displayKind(tx))}</span></td><td>${escapeHtml(detail)}</td><td class="amount">${money(tx.amount||p.estimated_value||p.actual_expenses||0)}</td><td><div class="toolbar-group"><button class="button button-outline" data-doc="${escapeHtml(tx.id)}">View</button><button class="button button-primary" data-print-document="${escapeHtml(tx.id)}">Print</button></div></td></tr>`}).join(""):`<tr><td colspan="6"><div class="empty-state">No documents have been recorded yet.</div></td></tr>`}</tbody></table></div>`;
}
function renderReports() {
  const now = new Date(), monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = filterReportTransactions("month", isoDate(monthStart), isoDate(now));
  return `<div class="welcome-row"><div><h2>Financial reports</h2><p>Daily, monthly, annual, or custom-range summaries. Filter by transaction type to review or download specific records.</p></div><div class="toolbar-group"><button class="button button-outline" data-export="report">Download summary Excel</button><button class="button button-outline" data-export="report-transactions">Download transactions</button><button class="button button-primary" data-print-report>Print / PDF</button></div></div>
    <div class="panel"><div class="report-filter"><div><label for="report-period">Report period</label><select class="field-control" id="report-period"><option value="day">Daily</option><option value="month" selected>Monthly</option><option value="year">Annual</option><option value="custom">Custom date range</option></select></div><div><label for="report-type">Transaction type</label><select class="field-control" id="report-type"><option value="all">All transaction types</option><option value="expense">Expenses</option><option value="cash_donation">Cash donations</option><option value="in_kind_donation">In-kind donations</option><option value="income">Income / collections</option><option value="disbursement">Disbursements</option><option value="cash_return">Cash returns</option><option value="reimbursement">Reimbursements</option></select></div><div id="report-date-start-wrap"><label for="report-start">Start date</label><input class="field-control" id="report-start" type="date" value="${isoDate(monthStart)}"></div><div id="report-date-end-wrap"><label for="report-end">End date</label><input class="field-control" id="report-end" type="date" value="${isoDate(now)}"></div><button class="button button-primary" data-run-report>Generate report</button></div><div class="form-field report-introduction-input"><label for="report-introduction">Introduction narrative (optional)</label><textarea class="field-control" id="report-introduction" rows="3" maxlength="2000" placeholder="Add a brief introduction to this summary report."></textarea></div></div>
    <div id="report-result" class="report-result" data-period="month" data-start="${isoDate(monthStart)}" data-end="${isoDate(now)}" data-type="all" data-introduction="">${reportMarkup(rows, "Monthly report", isoDate(now), "", "all")}</div>`;
}
function filterReportTransactions(period, start, end, type = "all") {
  const today = isoDate();
  let from = start || today, to = end || today;
  if (period === "day") from = to = today;
  if (period === "month") { const d = new Date(); from = isoDate(new Date(d.getFullYear(), d.getMonth(), 1)); to = today; }
  if (period === "year") { from = `${new Date().getFullYear()}-01-01`; to = today; }
  return state.transactions.filter(tx => tx.transaction_date >= from && tx.transaction_date <= to &&
    (type === "all" || transactionKind(tx) === type));
}
function reportMarkup(rows, title, asOfDate, introduction = "", type = "all") {
  const s = computeSummary(rows);
  const balancesAtEnd = computeSummary(state.transactions.filter(tx => !asOfDate || tx.transaction_date <= asOfDate));
  const byType = { income: 0, donations: 0, expenses: 0, disbursements: 0, cashReturns: 0, reimbursements: 0, inKind: 0 };
  for (const tx of rows) {
    const p = getPayload(tx);
    if (tx.kind === "income") byType.income += txAmount(tx);
    if (tx.kind === "cash_donation") byType.donations += txAmount(tx);
    if (tx.kind === "expense") byType.expenses += txAmount(tx);
    if (tx.kind === "disbursement") byType.disbursements += txAmount(tx);
    if (tx.kind === "cash_return" && p.record_type !== "Reimbursement paid") byType.cashReturns += txAmount(tx);
    if (transactionKind(tx) === "reimbursement") byType.reimbursements += txAmount(tx);
    if (tx.kind === "in_kind_donation") byType.inKind += Number(p.estimated_value || 0);
  }
  const categories = Object.entries(s.donationByCategory).sort((a,b)=>a[0].localeCompare(b[0]));
  const start = rows.map(tx=>tx.transaction_date).filter(Boolean).sort()[0] || "—";
  const end = rows.map(tx=>tx.transaction_date).filter(Boolean).sort().slice(-1)[0] || "—";
  const typeLabels = { all: "All transaction types", expense: "Expenses", cash_donation: "Cash donations", in_kind_donation: "In-kind donations", income: "Income / collections", disbursement: "Disbursements", cash_return: "Cash returns", reimbursement: "Reimbursements" };
  return `<div class="section-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(start)} to ${escapeHtml(end)} · ${rows.length} transaction${rows.length===1?"":"s"}${type!=="all" ? ` · ${escapeHtml(typeLabels[type]||type)}` : ""}</p></div></div>
    ${introduction ? `<section class="report-introduction"><h3>Introduction</h3><p>${escapeHtml(introduction)}</p></section>` : ""}
    <div class="summary-grid">
      ${summaryCard("Income", money(byType.income), "Income and collections")}
      ${summaryCard("Cash donations", money(byType.donations), "By donation purpose")}
      ${summaryCard("Expenses", money(byType.expenses), "Recorded expense entries")}
      ${summaryCard("Disbursements", money(byType.disbursements), "Authorization only; not deducted")}
      ${summaryCard("Cash returns", money(byType.cashReturns), "Added back to assigned fund")}
      ${summaryCard("Reimbursements paid", money(byType.reimbursements), "Outflow")}
      ${summaryCard("Remaining cash balance", money(balancesAtEnd.balance), `Cumulative balance as of ${asOfDate || "selected period end"}`, true)}
      ${summaryCard("In-kind estimated value", money(byType.inKind), "Non-cash; excluded from balance")}
    </div>
    <div class="two-column"><div class="panel"><h3>Cash donation category breakdown</h3>${categories.length ? `<div class="breakdown-list">${categories.map(([name,value])=>`<div class="breakdown-top"><span>${escapeHtml(name)}</span><strong>${money(value)}</strong></div>`).join("")}</div>`:`<div class="empty-state">No cash donations in this period.</div>`}</div>
    <div class="panel"><h3>Remaining balance by fund</h3>${Object.entries(balancesAtEnd.pools).length ? `<div class="breakdown-list">${Object.entries(balancesAtEnd.pools).map(([key,value])=>`<div class="breakdown-top"><span>${escapeHtml(key==="income"?"Income fund":key.replace(/^donation:/,""))}</span><strong>${money(value)}</strong></div>`).join("")}</div>`:`<div class="empty-state">No funds recorded by this date.</div>`}</div></div>
    <div class="section-heading"><div><h2>Transactions in period</h2><p>Individual records included in this report</p></div></div><div class="panel table-wrap"><table><thead><tr><th>Document</th><th>Date</th><th>Type</th><th>Details</th><th>Amount</th></tr></thead><tbody>${rows.length ? rows.sort((a,b)=>String(a.transaction_date).localeCompare(String(b.transaction_date))).map(tx=>{const p=getPayload(tx);return `<tr><td>${escapeHtml(tx.document_no||"—")}</td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td><td>${escapeHtml(displayKind(tx))}</td><td>${escapeHtml(p.donor_name||p.received_from||p.payee||p.income_source||p.supplier||p.item_description||p.purpose||p.particulars||p.description||"—")}</td><td class="amount">${money(tx.amount||p.estimated_value||0)}</td></tr>`}).join(""):`<tr><td colspan="5"><div class="empty-state">No transactions in this period.</div></td></tr>`}</tbody></table></div>`;
}
function renderCategories() {
  const canEdit = canManage();
  const categories = [...new Set(state.categories)].sort((a,b)=>a.localeCompare(b));
  return `<div class="welcome-row"><div><h2>Donation categories</h2><p>Purpose-specific cash donation pools are tracked independently. New purposes are added automatically when recorded.</p></div></div>
    <div class="notice">Donation categories identify restricted cash funds. Editing or removing a label does not reclassify past transactions or change historical balances.</div>
    ${canEdit ? `<div class="panel"><form id="category-form" class="toolbar"><div class="toolbar-group" style="flex:1"><input class="field-control" name="category" required maxlength="80" placeholder="Add a donation purpose or equipment category"></div><button class="button button-primary">Add category</button></form></div>` : ""}
    <div class="section-heading"><div><h2>Configured purposes</h2><p>${categories.length} categories</p></div></div>
    <div class="panel table-wrap"><table><thead><tr><th>Category / purpose</th><th>Cash donations recorded</th><th>Remaining fund balance</th><th>Actions</th></tr></thead><tbody>${categories.map(name=>{const s=computeSummary(), key=`donation:${name}`;return `<tr><td>${escapeHtml(name)}</td><td>${money(s.donationByCategory[name]||0)}</td><td>${money(s.pools[key]||0)}</td><td>${canEdit?`<div class="toolbar-group"><button class="button button-outline" data-edit-category="${escapeHtml(name)}">Edit</button>${!DEFAULT_CATEGORIES.includes(name)?`<button class="button button-danger" data-delete-category="${escapeHtml(name)}">Remove</button>`:""}</div>`:""}</td></tr>`}).join("")}</tbody></table></div>`;
}
function renderIncomeCategories() {
  const canEdit = canManage();
  const summary = computeSummary();
  const categories = [...new Set([...state.incomeCategories, ...Object.keys(summary.incomeByCategory)])].sort((a,b)=>a.localeCompare(b));
  return `<div class="welcome-row"><div><h2>Income / collections categories</h2><p>Manage the categories available on Income / Collections receipts and the dashboard.</p></div></div>
    ${canEdit ? `<div class="panel"><form id="income-category-form" class="toolbar"><div class="toolbar-group" style="flex:1"><input class="field-control" name="category" required maxlength="80" placeholder="Add an income or collections category"></div><button class="button button-primary">Add category</button></form></div>` : ""}
    <div class="section-heading"><div><h2>Configured categories</h2><p>${categories.length} categories</p></div></div>
    <div class="panel table-wrap"><table><thead><tr><th>Category</th><th>Income recorded</th><th>Actions</th></tr></thead><tbody>${categories.map(name=>`<tr><td>${escapeHtml(name)}</td><td>${money(summary.incomeByCategory[name]||0)}</td><td>${canEdit?`<div class="toolbar-group"><button class="button button-outline" data-edit-income-category="${escapeHtml(name)}">Edit</button>${!DEFAULT_INCOME_CATEGORIES.includes(name)?`<button class="button button-danger" data-delete-income-category="${escapeHtml(name)}">Remove</button>`:""}</div>`:""}</td></tr>`).join("") || `<tr><td colspan="3"><div class="empty-state">No income categories configured.</div></td></tr>`}</tbody></table></div>`;
}
function renderTemplates() {
  if (!canManage()) return `<div class="notice warning">Only an administrator can edit receipt templates.</div>`;
  const kind = TEMPLATE_DEFINITIONS[state.templateEditorKind] ? state.templateEditorKind : "cash_donation";
  const definition = TEMPLATE_DEFINITIONS[kind], template = templateSettings(kind);
  const sampleCode=`${TYPE_INFO[kind].prefix}-${new Date().getFullYear()}-001`;
  return `<div class="welcome-row"><div><h2>Receipt templates</h2><p>Customize printed titles, field labels, footer text, font sizes, and text positions for each transaction document.</p></div></div>
    <div class="notice">Select a receipt block to adjust its font size or position. Drag it to move it; changes apply to printed documents when you save the template.</div>
    <div class="template-workspace"><div class="panel template-editor"><form id="template-form" data-template-kind="${kind}">
      <div class="template-editor-top"><div class="form-field"><label for="template-kind">Receipt type</label><select class="field-control" id="template-kind" name="kind">${Object.entries(TEMPLATE_DEFINITIONS).map(([id,item])=>`<option value="${id}" ${id===kind?"selected":""}>${escapeHtml(item.label)} (${TYPE_INFO[id].prefix})</option>`).join("")}</select></div><div class="form-field"><label>Document code</label><div class="field-control template-code">${sampleCode}</div></div></div>
      <div class="form-field"><label for="template-title">Printed receipt title</label><input class="field-control" id="template-title" name="title" maxlength="120" required value="${escapeHtml(template.title)}"></div>
      <div class="template-label-grid">${Object.entries(definition.labels).map(([key,label])=>`<div class="form-field"><label for="template-label-${key}">${escapeHtml(titleCase(key.replace(/_/g," ")))} label</label><input class="field-control" id="template-label-${key}" name="label_${key}" maxlength="100" required value="${escapeHtml(template.labels[key]||label)}"></div>`).join("")}</div>
      <div class="form-field"><label for="template-footer">Footer text (optional)</label><textarea class="field-control" id="template-footer" name="footer" rows="4" maxlength="1200">${escapeHtml(template.footer)}</textarea></div>
      <div class="dialog-actions"><button class="button button-primary" type="submit">Save template</button></div>
    </form></div>
    <section class="panel template-preview-panel" aria-labelledby="template-preview-title"><div class="template-preview-heading"><div><h3 id="template-preview-title">Actual receipt preview</h3><p>Click a text block to select it, then drag or use the controls to position it.</p></div><button class="button button-outline" type="button" data-reset-template-layout>Reset layout and text styles</button></div>
      <div class="template-preview-canvas" id="template-receipt-preview" data-template-kind="${kind}" aria-label="Selectable receipt preview">${receiptTemplateMarkup(kind, templatePreviewTransaction(kind), true)}</div>
      <div class="template-layout-controls" id="template-text-controls">
        <div class="form-field"><label>Selected receipt text</label><div class="template-selected-text" id="template-selected-text" aria-live="polite">Select a block in the preview</div></div>
        <div class="form-field"><label for="template-font-size">Font size (pt)</label><input class="field-control" id="template-font-size" type="number" min="6" max="48" step="0.5" placeholder="Default" disabled></div>
        <div class="form-field"><label for="template-offset-x">Horizontal offset (mm)</label><input class="field-control" id="template-offset-x" type="number" min="-200" max="200" step="1" value="0" disabled></div>
        <div class="form-field"><label for="template-offset-y">Vertical offset (mm)</label><input class="field-control" id="template-offset-y" type="number" min="-200" max="200" step="1" value="0" disabled></div>
        <div class="template-order-controls"><button class="button button-outline" type="button" data-template-order="earlier" disabled>Move earlier</button><button class="button button-outline" type="button" data-template-order="later" disabled>Move later</button></div>
        <button class="button button-outline" type="button" data-reset-template-style disabled>Reset selected</button>
      </div>
    </section></div>`;
}
function renderUsers() {
  if (!canManage()) return `<div class="notice warning">Only an administrator can manage user roles. Contact the portal administrator.</div>`;
  const roles = [["pending","Pending approval"],["admin","Admin"],["staff","Staff"],["audit","Audit"],["finance_officer","Finance Officer"],["viewer","Viewer (legacy)"],["treasurer","Treasurer (legacy)"],["approver","Approver (legacy)"]];
  return `<div class="welcome-row"><div><h2>User management</h2><p>Manage sign-in usernames and assign financial roles to authorized Supabase accounts.</p></div></div>
    <div class="notice">New sign-ups remain pending and cannot access financial records. To approve a request, assign a unique username, choose an authorized role, and save the account. Users sign in with that username and their Supabase Auth password. Passwords are never stored in this portal.</div>
    ${state.cloud ? `<div class="panel table-wrap user-table"><table><thead><tr><th>User / email</th><th>Username</th><th>Role</th><th>Joined</th><th></th></tr></thead><tbody>${state.profiles.length ? state.profiles.map(profile=>`<tr><td>${escapeHtml(profile.full_name||profile.email||profile.id)}<br><small>${escapeHtml(profile.email||"")}</small></td><td><input class="field-control" data-username-input="${escapeHtml(profile.id)}" value="${escapeHtml(profile.username||"")}" minlength="3" maxlength="32" pattern="[a-zA-Z0-9._-]{3,32}" autocomplete="off" aria-label="Username for ${escapeHtml(profile.email||profile.id)}" required></td><td><select class="field-control" data-role-select="${escapeHtml(profile.id)}">${roles.map(([value,label])=>`<option value="${value}" ${profile.role===value?"selected":""}>${label}</option>`).join("")}</select></td><td>${escapeHtml(prettyDate(String(profile.created_at||"").slice(0,10)))}</td><td><button class="button button-outline" data-save-role="${escapeHtml(profile.id)}">${profile.role==="pending"?"Approve & save":"Save account"}</button></td></tr>`).join(""):`<tr><td colspan="5"><div class="empty-state">No user profiles are available.</div></td></tr>`}</tbody></table></div>` : `<div class="panel empty-state">Connect Supabase to manage authorized users.</div>`}`;
}
function renderSettings() {
  const deploymentConfig = getDeploymentConfig();
  const deploymentConfigured = Boolean(deploymentConfig.url && deploymentConfig.key);
  const system = state.systemSettings;
  const logo = system.organizationLogo || "assets/soccom-logo.png";
  return `<div class="welcome-row"><div><h2>Portal settings</h2><p>Configure shared cloud storage, account access, and application details.</p></div></div>
    <div class="panel setting-card system-settings-card"><h3>System identity and signatories</h3><p>These names prefill Finance Officer and Audit Officer signatures on new receipts. The organization logo appears beside the parish logo on receipts.</p>
      <form id="system-settings-form">
        <div class="system-settings-layout"><div><img class="organization-logo-preview" src="${escapeHtml(logo)}" alt="Organization logo preview"><label class="form-field"><span class="field-label">Organization logo</span><input class="field-control" type="file" name="organization_logo" accept="image/png,image/jpeg,image/webp"></label><label class="checkbox-field"><input type="checkbox" name="clear_logo"> Use the default SocCom logo</label></div>
          <div class="system-officer-fields"><div class="form-field"><label for="system-finance-officer">Finance Officer name</label><input class="field-control" id="system-finance-officer" name="finance_officer" maxlength="100" value="${escapeHtml(system.financeOfficer)}"></div>
          <div class="form-field"><label for="system-audit-officer">Audit Officer name</label><input class="field-control" id="system-audit-officer" name="audit_officer" maxlength="100" value="${escapeHtml(system.auditOfficer)}"></div></div></div>
        ${canManage() ? `<button class="button button-primary" type="submit">Save system settings</button>` : `<div class="notice warning">Only an administrator can change system identity and signatories.</div>`}
      </form>
    </div>
    <div class="settings-grid">
      <div class="panel setting-card"><h3>Database connection</h3><div class="notice ${deploymentConfigured ? "" : "warning"}">${deploymentConfigured ? "This portal requires Supabase. Its project URL and public anon/publishable key are deployment-managed in supabase-config.js." : "Supabase is not configured. Ask the portal administrator to configure supabase-config.js before signing in."}</div>
        <p>Never put a Supabase service-role or secret key in browser configuration. Keep server secrets in Supabase's trusted function environment.</p>
        ${state.cloud ? `<button class="button button-outline" type="button" data-sign-out>Sign out</button>` : ""}
      </div>
      <div class="panel setting-card"><h3>Portal account</h3><p>Use your authorized portal username and Supabase Auth password to access shared financial records.</p>
        <div class="notice">Signed in as ${escapeHtml(state.user?.email||"authenticated user")} · role: ${escapeHtml(state.role)}.</div>
        <p class="form-note">Your password is sent to Supabase Auth for sign-in and is not saved in portal settings.</p>
      </div>
      <div class="panel setting-card"><h3>Database setup</h3><p>Run the provided <strong>supabase.sql</strong> in your Supabase project's SQL Editor. It creates the schema, document-number generator, audit trail, role policies, balance checks, and private receipt storage bucket.</p>
        <div class="notice warning">For live operations, use a dedicated Supabase project, enable email confirmation, configure backups and recovery, invite only authorized staff, and test with sample records before entering parish financial data.</div>
        <h3>Accounting rules</h3><p>Disbursement vouchers authorize a release but do not reduce balances. Expenses and reimbursements paid reduce their assigned fund; cash returns increase it. In-kind donations are tracked separately and never count as cash. Previously recorded liquidation reports remain supporting documents, not second expense entries.</p>
      </div>
    </div>`;
}

function renderPage() {
  syncBrandLogo();
  const content = $("#page-content");
  switch (state.page) {
    case "dashboard": content.innerHTML = renderDashboard(); requestAnimationFrame(drawMovementChart); break;
    case "reports": content.innerHTML = renderReports(); syncReportPeriod(); break;
    case "history": content.innerHTML = renderHistory(); bindFilters(); break;
    case "document_history": content.innerHTML = renderDocumentHistory(); bindFilters(); break;
    case "categories": content.innerHTML = renderCategories(); break;
    case "income_categories": content.innerHTML = renderIncomeCategories(); break;
    case "templates": content.innerHTML = renderTemplates(); break;
    case "users": content.innerHTML = renderUsers(); break;
    case "settings": content.innerHTML = renderSettings(); break;
    default: content.innerHTML = renderTransactionList(state.page); bindFilters();
  }
}
function bindFilters() {
  const apply = () => {
    const search = ($("#table-search")?.value || "").trim().toLowerCase();
    const from = $("#date-from")?.value || "", to = $("#date-to")?.value || "";
    const type = $("#document-type")?.value || "all";
    $$("#transaction-table-body tr[data-row-search]").forEach(row => {
      const date = row.dataset.rowDate;
      row.classList.toggle("hidden", !(row.dataset.rowSearch.includes(search) && (!from || date >= from) && (!to || date <= to) && (type === "all" || row.dataset.rowType === type)));
    });
  };
  $("#table-search")?.addEventListener("input", apply);
  $("#date-from")?.addEventListener("change", apply);
  $("#date-to")?.addEventListener("change", apply);
  $("#document-type")?.addEventListener("change", apply);
}
function handlePageClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const page = target.closest("[data-page]");
  if (page) {
    event.preventDefault();
    navigate(page.dataset.page);
    return;
  }
  const create = target.closest("[data-create]");
  if (create) { openTransactionForm(create.dataset.create); return; }
  const printDocumentButton = target.closest("[data-print-document]");
  if (printDocumentButton) {
    const tx = state.transactions.find(item => item.id === printDocumentButton.dataset.printDocument);
    if (tx) openDocument(tx, true);
    return;
  }
  const doc = target.closest("[data-doc]");
  if (doc) { const tx = state.transactions.find(item => item.id === doc.dataset.doc); if (tx) openDocument(tx); return; }
  if (target.closest("[data-clear-filters]")) {
    ["#table-search", "#date-from", "#date-to"].forEach(sel => { if ($(sel)) $(sel).value = ""; });
    $$("#transaction-table-body tr").forEach(row => row.classList.remove("hidden")); return;
  }
  if (target.closest("[data-run-report]")) { runReport(); return; }
  if (target.closest("[data-export]")) { downloadExcel(target.closest("[data-export]").dataset.export); return; }
  if (target.closest("[data-print-report]")) {
    document.body.classList.add("print-report");
    window.addEventListener("afterprint", () => document.body.classList.remove("print-report"), { once: true });
    window.print(); return;
  }
  if (target.closest("[data-sign-out]")) { signOut(); return; }
  const deleteCategory = target.closest("[data-delete-category]");
  if (deleteCategory) { removeCategory(deleteCategory.dataset.deleteCategory); return; }
  const editCategory = target.closest("[data-edit-category]");
  if (editCategory) { openCategoryEdit(editCategory.dataset.editCategory); return; }
  const deleteIncomeCategory = target.closest("[data-delete-income-category]");
  if (deleteIncomeCategory) { removeIncomeCategory(deleteIncomeCategory.dataset.deleteIncomeCategory); return; }
  const editIncomeCategory = target.closest("[data-edit-income-category]");
  if (editIncomeCategory) { openIncomeCategoryEdit(editIncomeCategory.dataset.editIncomeCategory); return; }
  const saveRole = target.closest("[data-save-role]");
  if (saveRole) { saveUserRole(saveRole.dataset.saveRole); }
}
function openCategoryEdit(name) {
  if (!canManage()) { toast("Only administrators can edit donation categories.", true); return; }
  const dialog = $("#transaction-dialog");
  dialog.innerHTML = `<div class="dialog-head"><div><h2>Edit donation category</h2><p>Renaming a purpose keeps its recorded donations and fund references together.</p></div><button class="dialog-close" type="button" aria-label="Close">×</button></div>
    <form id="category-edit-form"><div class="form-field"><label for="category-edit-name">Category / purpose</label><input class="field-control" id="category-edit-name" name="name" maxlength="80" required value="${escapeHtml(name)}"></div>
    <div class="dialog-actions"><button class="button button-outline dialog-close" type="button">Cancel</button><button class="button button-primary" type="submit">Save changes</button></div></form>`;
  dialog.showModal();
  $$(".dialog-close", dialog).forEach(button => button.addEventListener("click", () => dialog.close()));
  $("#category-edit-form", dialog).addEventListener("submit", event => renameCategory(event, name));
}
function openIncomeCategoryEdit(name) {
  if (!canManage()) { toast("Only administrators can edit income categories.", true); return; }
  const dialog = $("#transaction-dialog");
  dialog.innerHTML = `<div class="dialog-head"><div><h2>Edit income category</h2><p>Renaming also updates matching historical income records.</p></div><button class="dialog-close" type="button" aria-label="Close">×</button></div>
    <form id="income-category-edit-form"><div class="form-field"><label for="income-category-edit-name">Category</label><input class="field-control" id="income-category-edit-name" name="name" maxlength="80" required value="${escapeHtml(name)}"></div>
    <div class="dialog-actions"><button class="button button-outline dialog-close" type="button">Cancel</button><button class="button button-primary" type="submit">Save changes</button></div></form>`;
  dialog.showModal();
  $$(".dialog-close", dialog).forEach(button => button.addEventListener("click", () => dialog.close()));
  $("#income-category-edit-form", dialog).addEventListener("submit", event => renameIncomeCategory(event, name));
}
async function renameIncomeCategory(event, oldName) {
  event.preventDefault();
  const form = event.currentTarget, submit = $('button[type="submit"]', form);
  const newName = new FormData(form).get("name").trim();
  if (!newName || newName.length > 80) { toast("Enter a category name between 1 and 80 characters.", true); return; }
  if (incomeCategoryOptions().some(name => name.toLocaleLowerCase() === newName.toLocaleLowerCase() && name !== oldName)) {
    toast("An income category with that name already exists.", true); return;
  }
  if (newName === oldName) { $("#transaction-dialog").close(); return; }
  submit.disabled = true;
  try {
    const { error } = await state.client.rpc("rename_income_category", { p_old_name: oldName, p_new_name: newName });
    if (error) throw error;
    await refreshCloudData();
    $("#transaction-dialog").close();
    toast("Income category updated.");
  } catch (error) {
    console.error("Income category could not be renamed", error);
    toast(error.message || "Could not update this income category.", true);
  } finally { submit.disabled = false; }
}
async function renameCategory(event, oldName) {
  event.preventDefault();
  const form = event.currentTarget, submit = $('button[type="submit"]', form);
  const newName = new FormData(form).get("name").trim();
  if (!newName || newName.length > 80) { toast("Enter a category name between 1 and 80 characters.", true); return; }
  if (state.categories.some(name => name.toLocaleLowerCase() === newName.toLocaleLowerCase() && name !== oldName)) {
    toast("A donation category with that name already exists.", true); return;
  }
  if (newName === oldName) { $("#transaction-dialog").close(); return; }
  submit.disabled = true;
  try {
    const { error } = await state.client.rpc("rename_donation_category", { p_old_name: oldName, p_new_name: newName });
    if (error) throw error;
    await refreshCloudData();
    $("#transaction-dialog").close();
    toast("Donation category updated.");
  } catch (error) {
    console.error("Donation category could not be renamed", error);
    toast(error.message || "Could not update this donation category.", true);
  } finally { submit.disabled = false; }
}
function runReport() {
  const period = $("#report-period").value;
  const start = $("#report-start").value, end = $("#report-end").value;
  if (period === "custom" && (!start || !end || start > end)) { toast("Choose a valid custom date range.", true); return; }
  const type = $("#report-type").value;
  const introduction = $("#report-introduction").value.trim();
  const rows = filterReportTransactions(period, start, end, type);
  const labels = { day: "Daily report", month: "Monthly report", year: "Annual report", custom: "Custom date-range report" };
  const asOfDate = period === "custom" ? end : isoDate();
  $("#report-result").innerHTML = reportMarkup(rows, labels[period], asOfDate, introduction, type);
  $("#report-result").dataset.period = period; $("#report-result").dataset.start = start; $("#report-result").dataset.end = end;
  $("#report-result").dataset.type = type; $("#report-result").dataset.introduction = introduction;
}

function categoryOptions() {
  return [...new Set([...state.categories, ...Object.keys(computeSummary().donationByCategory)])].sort((a,b)=>a.localeCompare(b));
}
function incomeCategoryOptions() {
  return [...new Set([...state.incomeCategories, ...Object.keys(computeSummary().incomeByCategory)])].sort((a,b)=>a.localeCompare(b));
}
function fundOptions() {
  const summary = computeSummary();
  const funds = [{ value: "income", label: `Income fund (${money(summary.pools.income||0)})` }];
  const names = new Set([...categoryOptions(), ...Object.keys(summary.pools).filter(key=>key.startsWith("donation:")).map(key=>key.slice(9))]);
  for (const name of names) funds.push({ value: `donation:${name}`, label: `${name} (${money(summary.pools[`donation:${name}`]||0)})` });
  return funds;
}
function renderInKindItemRow(index) {
  const id = `in-kind-item-${index}`;
  return `<div class="in-kind-entry-row" data-in-kind-item>
    <div><label for="${id}-quantity">Quantity *</label><input class="field-control" id="${id}-quantity" data-item-quantity type="number" min="1" step="1" required></div>
    <div><label for="${id}-unit">Unit *</label><select class="field-control" id="${id}-unit" data-item-unit required><option value="">Select…</option><option value="pcs">pcs</option><option value="box">box</option><option value="pack">pack</option></select></div>
    <div class="in-kind-item-description"><label for="${id}-description">Description of Item *</label><input class="field-control" id="${id}-description" data-item-description type="text" required></div>
    <div><label for="${id}-value">Estimated Value (optional)</label><input class="field-control" id="${id}-value" data-item-value type="number" min="0" step="0.01"></div>
    <button class="button button-outline in-kind-item-remove" type="button" data-item-remove aria-label="Remove supply">Remove</button>
  </div>`;
}
function renderDisbursementItemRow(index) {
  const id = `disbursement-item-${index}`;
  return `<div class="disbursement-entry-row" data-disbursement-item>
    <div><label for="${id}-particulars">Particulars *</label><input class="field-control" id="${id}-particulars" data-disbursement-particulars type="text" required></div>
    <div><label for="${id}-amount">Amount (PHP) *</label><input class="field-control" id="${id}-amount" data-disbursement-amount type="number" min="0.01" step="0.01" required></div>
    <button class="button button-outline disbursement-item-remove" type="button" data-disbursement-remove aria-label="Remove particulars line">Remove</button>
  </div>`;
}
function renderExpenseItemRow(index) {
  const id = `expense-item-${index}`;
  return `<div class="expense-entry-row" data-expense-item>
    <div><label for="${id}-date">Date *</label><input class="field-control" id="${id}-date" data-expense-date type="date" value="${isoDate()}" required></div>
    <div><label for="${id}-particulars">Particulars *</label><input class="field-control" id="${id}-particulars" data-expense-particulars type="text" required></div>
    <div><label for="${id}-receipt">OR/Receipt No. (optional)</label><input class="field-control" id="${id}-receipt" data-expense-receipt type="text"></div>
    <div><label for="${id}-amount">Amount (PHP) *</label><input class="field-control" id="${id}-amount" data-expense-amount type="number" min="0.01" step="0.01" required></div>
    <button class="button button-outline expense-item-remove" type="button" data-expense-remove aria-label="Remove expense line">Remove</button>
  </div>`;
}
function renderField(field, kind) {
  const [name, label, type, required, options] = field;
  const id = `tx-${name}`, req = required ? "required" : "";
  let input;
  if (type === "heading") return `<div class="form-section-label">${escapeHtml(label)}</div>`;
  if (type === "item_rows") return `<div class="form-field full"><div class="in-kind-details-form-heading">${escapeHtml(label)}</div><div class="in-kind-entry-list" data-in-kind-items data-next-index="1">${renderInKindItemRow(0)}</div><button class="button button-outline in-kind-item-add" type="button" data-item-add>＋ Add another supply</button></div>`;
  if (type === "amount_rows") return `<div class="form-field full"><div class="in-kind-details-form-heading">${escapeHtml(label)}</div><div class="disbursement-entry-list" data-disbursement-items data-next-index="1">${renderDisbursementItemRow(0)}</div><button class="button button-outline in-kind-item-add" type="button" data-disbursement-add>＋ Add particulars</button><div class="disbursement-total"><label for="tx-disbursement-total">Total Amount (PHP)</label><input class="field-control" id="tx-disbursement-total" name="amount" type="number" value="0.00" readonly></div></div>`;
  if (type === "expense_rows") return `<div class="form-field full"><div class="in-kind-details-form-heading">${escapeHtml(label)}</div><div class="expense-entry-list" data-expense-items data-next-index="1">${renderExpenseItemRow(0)}</div><button class="button button-outline in-kind-item-add" type="button" data-expense-add>＋ Add expense line</button><div class="disbursement-total"><label for="tx-expense-total">Total Amount Expenses (PHP)</label><input class="field-control" id="tx-expense-total" name="amount" type="number" value="0.00" readonly></div></div>`;
  else if (type === "textarea") input = `<textarea class="field-control" id="${id}" name="${name}" ${req}></textarea>`;
  else if (type === "calculated_amount") input = `<input class="field-control" id="${id}" name="${name}" type="number" value="0.00" readonly>`;
  else if (type === "select") input = `<select class="field-control" id="${id}" name="${name}" ${req}><option value="">Select…</option>${options.map(value=>`<option>${escapeHtml(value)}</option>`).join("")}</select>`;
  else if (type === "income_category_select") input = `<select class="field-control" id="${id}" name="${name}" ${req}><option value="">Select…</option>${incomeCategoryOptions().map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select>`;
  else if (type === "category") input = `<input class="field-control" id="${id}" name="${name}" list="donation-category-options" ${req} maxlength="80"><datalist id="donation-category-options">${categoryOptions().map(value=>`<option value="${escapeHtml(value)}">`).join("")}</datalist>`;
  else if (type === "category_select") input = `<select class="field-control" id="${id}" name="${name}" ${req}><option value="">Choose a donation category…</option>${categoryOptions().map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}</select>`;
  else if (type === "fund") input = `<select class="field-control" id="${id}" name="${name}" ${req}><option value="">Select fund…</option>${fundOptions().map(item=>`<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}</select>`;
  else if (type === "file") input = `<input class="field-control" id="${id}" name="${name}" type="file" accept="image/*,.pdf">`;
  else {
    const allowsZero = ["estimated_value","cash_released","actual_expenses","cash_returned"].includes(name);
    const min = type === "number" && name === "quantity" ? "1" : type === "number" && allowsZero ? "0" : type === "number" ? "0.01" : "";
    const step = type === "number" && name === "quantity" ? "1" : type === "number" ? "0.01" : "";
    input = `<input class="field-control" id="${id}" name="${name}" type="${type}" ${min ? `min="${min}"` : ""} ${step ? `step="${step}"` : ""} ${req}>`;
  }
  const amountWords = name === "amount" && ["cash_donation","income"].includes(kind) ? `<p class="form-note" data-amount-words>Amount in words will appear here.</p>` : "";
  const fullWidth = type === "textarea" || type === "category";
  return `<div class="form-field${fullWidth?" full":""}"><label for="${id}">${escapeHtml(label)}${required ? " *" : ""}</label>${input}${amountWords}</div>`;
}
function openTransactionForm(kind = null) {
  if (!canWrite()) { toast("Your account is read-only. Ask an administrator for a role with entry permissions.", true); return; }
  const selectedKind = kind || (["cash_donation","in_kind_donation","income","disbursement","expense","cash_return","reimbursement"].includes(state.page) ? state.page : "cash_donation");
  const info = TYPE_INFO[selectedKind];
  const isReceipt = ["cash_donation","in_kind_donation","income"].includes(selectedKind);
  const dateLabel = ["disbursement","expense","cash_return","reimbursement"].includes(selectedKind) ? "Date" : isReceipt ? "Date Received" : "Transaction date";
  const documentHint = selectedKind === "disbursement" ? "Voucher number is generated automatically when saved." : selectedKind === "expense" ? "Expense record number is generated automatically when saved." : ["cash_return","reimbursement"].includes(selectedKind) ? "Record number is generated automatically when saved." : isReceipt ? "Receipt number is generated automatically when saved." : "Document number is generated by the database when saved.";
  const formNote = selectedKind === "disbursement" ? "Vouchers document funds released but are not deducted from the balance. Record actual spending separately under Expenses." : selectedKind === "liquidation" ? "Liquidations are supporting documents only. Record actual expenses and cash returns as separate transactions so they are not double-counted." : selectedKind === "cash_return" ? "Enter actual expenses separately in Expenses; this record posts only the unused-funds return to the selected fund." : selectedKind === "reimbursement" ? "This reimbursement is recorded as one fund outflow. Do not enter the same payment again as an expense." : "";
  const dialog = $("#transaction-dialog");
  dialog.innerHTML = `<div class="dialog-head"><div><h2>New ${escapeHtml(info.title)}</h2><p>${documentHint}</p></div><button class="dialog-close" type="button" aria-label="Close">×</button></div>
    <form id="transaction-form"><div class="form-grid"><div class="form-field"><label for="tx-date">${dateLabel} *</label><input class="field-control" type="date" id="tx-date" name="transaction_date" value="${isoDate()}" required></div>
    ${info.fields.map(field => renderField(field, selectedKind)).join("")}
    ${formNote ? `<div class="form-field full"><p class="form-note">${escapeHtml(formNote)}</p></div>` : ""}</div>
    <div class="dialog-actions"><button class="button button-outline dialog-close" type="button">Cancel</button><button class="button button-primary" type="submit">Save and generate document</button></div></form>`;
  dialog.showModal();
  $$(".dialog-close", dialog).forEach(button => button.addEventListener("click", () => dialog.close()));
  const defaultFinanceOfficer=state.systemSettings.financeOfficer || state.user?.user_metadata?.full_name || state.user?.email || "";
  const preparedBy=$("#tx-prepared_by",dialog);
  if(preparedBy) preparedBy.value=defaultFinanceOfficer;
  const receivedBy=$("#tx-received_by",dialog);
  if(receivedBy) receivedBy.value=state.systemSettings.financeOfficer||"";
  const checkedBy=$("#tx-checked_by",dialog);
  if(checkedBy) checkedBy.value=state.systemSettings.auditOfficer||"";
  const receivedDate = $("#tx-date_received", dialog);
  if (receivedDate) receivedDate.value = isoDate();
  const paidDate = $("#tx-date_paid", dialog);
  if (paidDate) paidDate.value = isoDate();
  const itemList = $("[data-in-kind-items]", dialog);
  if (itemList) {
    $("[data-item-add]", dialog).addEventListener("click", () => {
      const index = Number(itemList.dataset.nextIndex);
      itemList.dataset.nextIndex = String(index + 1);
      itemList.insertAdjacentHTML("beforeend", renderInKindItemRow(index));
    });
    itemList.addEventListener("click", event => {
      const removeButton = event.target.closest("[data-item-remove]");
      if (removeButton && itemList.children.length > 1) removeButton.closest("[data-in-kind-item]").remove();
    });
  }
  const disbursementList = $("[data-disbursement-items]", dialog);
  if (disbursementList) {
    const updateTotal = () => {
      const total = [...disbursementList.querySelectorAll("[data-disbursement-amount]")].reduce((sum, field) => sum + Number(field.value || 0), 0);
      $("#tx-disbursement-total", dialog).value = (Math.round(total * 100) / 100).toFixed(2);
    };
    $("[data-disbursement-add]", dialog).addEventListener("click", () => {
      const index = Number(disbursementList.dataset.nextIndex);
      disbursementList.dataset.nextIndex = String(index + 1);
      disbursementList.insertAdjacentHTML("beforeend", renderDisbursementItemRow(index));
    });
    disbursementList.addEventListener("input", event => {
      if (event.target.matches("[data-disbursement-amount]")) updateTotal();
    });
    disbursementList.addEventListener("click", event => {
      const removeButton = event.target.closest("[data-disbursement-remove]");
      if (removeButton && disbursementList.children.length > 1) {
        removeButton.closest("[data-disbursement-item]").remove();
        updateTotal();
      }
    });
  }
  const expenseList = $("[data-expense-items]", dialog);
  if (expenseList) {
    const updateTotal = () => {
      const total = [...expenseList.querySelectorAll("[data-expense-amount]")].reduce((sum, field) => sum + Number(field.value || 0), 0);
      $("#tx-expense-total", dialog).value = (Math.round(total * 100) / 100).toFixed(2);
    };
    $("[data-expense-add]", dialog).addEventListener("click", () => {
      const index = Number(expenseList.dataset.nextIndex);
      expenseList.dataset.nextIndex = String(index + 1);
      expenseList.insertAdjacentHTML("beforeend", renderExpenseItemRow(index));
    });
    expenseList.addEventListener("input", event => {
      if (event.target.matches("[data-expense-amount]")) updateTotal();
    });
    expenseList.addEventListener("click", event => {
      const removeButton = event.target.closest("[data-expense-remove]");
      if (removeButton && expenseList.children.length > 1) {
        removeButton.closest("[data-expense-item]").remove();
        updateTotal();
      }
    });
  }
  if (selectedKind === "cash_return") {
    const totalFunds = $("#tx-total_funds_received", dialog), actualExpenses = $("#tx-actual_expenses", dialog), unusedFunds = $("#tx-unused_funds_return", dialog);
    const updateReturn = () => {
      const received = Number(totalFunds.value || 0), expenses = Number(actualExpenses.value || 0);
      unusedFunds.value = (Math.round(Math.max(0, received - expenses) * 100) / 100).toFixed(2);
      const error = expenses > received ? "Actual expenses cannot exceed total funds received." : "";
      totalFunds.setCustomValidity(error);
      actualExpenses.setCustomValidity(error);
    };
    totalFunds.addEventListener("input", updateReturn);
    actualExpenses.addEventListener("input", updateReturn);
  }
  $("#transaction-form", dialog).addEventListener("submit", event => saveTransaction(event, selectedKind));
  if(["cash_donation","income"].includes(selectedKind)) {
    $("#tx-amount", dialog).addEventListener("input", event => {
      const amount=Number(event.currentTarget.value);
      $("[data-amount-words]",dialog).textContent=amount>0 ? `Amount in words: ${amountInWords(amount)}` : "Amount in words will appear here.";
    });
  }
}
async function saveTransaction(event, kind) {
  event.preventDefault();
  const form = event.currentTarget, submit = $('button[type="submit"]', form);
  submit.disabled = true; submit.textContent = "Saving…";
  try {
    if (!state.cloud || !state.client || !state.user) throw new Error("A signed-in Supabase account is required to save transactions.");
    const transactionType = kind === "reimbursement" ? "cash_return" : kind;
    const formData = new FormData(form), payload = {};
    for (const field of TYPE_INFO[kind].fields) {
      const [name,,type] = field;
      const value = formData.get(name);
      if (type === "file" || type === "heading" || ["item_rows","amount_rows","expense_rows"].includes(type)) continue;
      payload[name] = value == null ? "" : String(value).trim();
      if (type === "number" && payload[name] !== "") payload[name] = Number(payload[name]);
    }
    if (kind === "income") payload.description = payload.particulars;
    if (kind === "disbursement") {
      payload.items = [...form.querySelectorAll("[data-disbursement-item]")].map(row => ({
        particulars: row.querySelector("[data-disbursement-particulars]").value.trim(),
        amount: Number(row.querySelector("[data-disbursement-amount]").value)
      }));
      payload.particulars = payload.items.map(item => item.particulars).join("; ");
      payload.total_amount = Math.round(payload.items.reduce((total, item) => total + item.amount, 0) * 100) / 100;
      payload.amount = payload.total_amount;
    }
    if (kind === "cash_return") {
      payload.record_type = "Cash return";
      payload.unused_funds_return = Math.round((Number(payload.total_funds_received) - Number(payload.actual_expenses)) * 100) / 100;
      if (payload.unused_funds_return <= 0) throw new Error("Unused funds returned must be greater than zero.");
      payload.amount = payload.unused_funds_return;
    }
    if (kind === "reimbursement") {
      payload.record_type = "Reimbursement paid";
      payload.items = [...form.querySelectorAll("[data-disbursement-item]")].map(row => ({
        particulars: row.querySelector("[data-disbursement-particulars]").value.trim(),
        amount: Number(row.querySelector("[data-disbursement-amount]").value)
      }));
      payload.particulars = payload.items.map(item => item.particulars).join("; ");
      payload.total_amount = Math.round(payload.items.reduce((total, item) => total + item.amount, 0) * 100) / 100;
      payload.amount = payload.total_amount;
    }
    if (kind === "expense") {
      payload.items = [...form.querySelectorAll("[data-expense-item]")].map(row => ({
        date: row.querySelector("[data-expense-date]").value,
        particulars: row.querySelector("[data-expense-particulars]").value.trim(),
        receipt_number: row.querySelector("[data-expense-receipt]").value.trim(),
        amount: Number(row.querySelector("[data-expense-amount]").value)
      }));
      payload.description = payload.items.map(item => `${item.particulars}${item.receipt_number ? ` (OR/Receipt No. ${item.receipt_number})` : ""}`).join("; ");
      payload.total_amount = Math.round(payload.items.reduce((total, item) => total + item.amount, 0) * 100) / 100;
      payload.amount = payload.total_amount;
    }
    if (kind === "in_kind_donation") {
      payload.items = [...form.querySelectorAll("[data-in-kind-item]")].map(row => {
        const value = row.querySelector("[data-item-value]").value;
        return {
          quantity: Number(row.querySelector("[data-item-quantity]").value),
          unit: row.querySelector("[data-item-unit]").value,
          description: row.querySelector("[data-item-description]").value.trim(),
          estimated_value: value === "" ? null : Number(value)
        };
      });
      payload.quantity = payload.items[0].quantity;
      payload.unit = payload.items[0].unit;
      payload.item_description = payload.items.map(item => `${item.quantity} ${item.unit} ${item.description}`).join("; ");
      payload.estimated_value = Math.round(payload.items.reduce((total, item) => total + (item.estimated_value || 0), 0) * 100) / 100;
    }
    let amount = Number(payload.amount || 0);
    if (kind === "in_kind_donation" || kind === "liquidation") amount = 0;
    let fundingSource = payload.funding_source || (kind === "income" ? "income" : kind === "cash_donation" ? `donation:${payload.donation_purpose}` : null);
    if (kind === "cash_donation" && payload.donation_purpose) await maybeAddCategory(payload.donation_purpose);
    if (kind === "liquidation" && Number(payload.cash_returned) > 0) payload.return_note = "Record this cash return separately to update the fund balance.";
    if (transactionType === "cash_return" && payload.record_type === "Reimbursement paid") payload.reimbursement_note = "Recorded as an outflow; do not enter the same reimbursed amount again as an expense.";
    if (kind === "expense" || (transactionType === "cash_return" && payload.record_type === "Reimbursement paid")) {
      const current = computeSummary(), available = Number(current.pools[fundingSource] || 0);
      if (amount > available + 0.0001 && !["admin","finance_officer","approver"].includes(state.role)) throw new Error("This transaction exceeds the selected fund balance. A Finance Officer or administrator must record an approved exception.");
    }
    const file = formData.get("receipt_file");
    if (file instanceof File && file.size) payload.receipt_file = await uploadReceipt(file);
    payload.prepared_by = payload.prepared_by || state.systemSettings.financeOfficer || state.user?.user_metadata?.full_name || state.user?.email || "Demo User";
    const transactionDate = formData.get("transaction_date");
    const { data, error } = await state.client.rpc("create_transaction", {
      p_kind: transactionType, p_transaction_date: transactionDate, p_amount: amount, p_funding_source: fundingSource, p_payload: payload
    });
    if (error) throw error;
    const tx = Array.isArray(data) ? data[0] : data;
    await refreshCloudData();
    $("#transaction-dialog").close();
    toast(`Saved ${tx?.document_no || "transaction"} successfully.`);
    if (tx) openDocument(tx);
  } catch (error) {
    console.error("Transaction could not be saved", error);
    toast(error.message || "Could not save this transaction.", true);
  } finally { submit.disabled = false; submit.textContent = "Save and generate document"; }
}
async function uploadReceipt(file) {
  if (!state.cloud || !state.client || !state.user) throw new Error("A signed-in Supabase account is required to upload receipts.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${state.user.id}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await state.client.storage.from("finance-receipts").upload(path, file, { upsert: false });
  if (error) throw error;
  return { bucket: "finance-receipts", path: data.path, name: file.name };
}
async function maybeAddCategory(name) {
  if (!name || state.categories.includes(name)) return;
  if (!state.cloud || !state.client || !state.user) throw new Error("A signed-in Supabase account is required to add donation categories.");
  const { error } = await state.client.from("donation_categories").upsert({ name, created_by: state.user.id }, { onConflict: "name", ignoreDuplicates: true });
  if (error) throw error;
  state.categories.push(name);
}

const SMALL_NUMBERS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function numberWords(number) {
  number = Math.floor(number);
  if (number < 20) return SMALL_NUMBERS[number];
  if (number < 100) return `${TENS[Math.floor(number/10)]}${number%10 ? `-${SMALL_NUMBERS[number%10]}` : ""}`;
  if (number < 1000) return `${SMALL_NUMBERS[Math.floor(number/100)]} hundred${number%100 ? ` ${numberWords(number%100)}` : ""}`;
  for (const [value,name] of [[1e9,"billion"],[1e6,"million"],[1e3,"thousand"]]) if (number >= value) return `${numberWords(Math.floor(number/value))} ${name}${number%value ? ` ${numberWords(number%value)}` : ""}`;
  return String(number);
}
function amountInWords(value) {
  const amount = Math.max(0, Number(value || 0)), pesos = Math.floor(amount), centavos = Math.round((amount-pesos)*100);
  return `${numberWords(pesos)} peso${pesos===1?"":"s"}${centavos ? ` and ${numberWords(centavos)} centavo${centavos===1?"":"s"}` : ""} only`.replace(/^./, c=>c.toUpperCase());
}
function documentDetails(tx) {
  const p = getPayload(tx), skip = new Set(["receipt_file","return_note","reimbursement_note","prepared_by"]);
  const labels = Object.fromEntries(TYPE_INFO[tx.kind]?.fields.map(([name,label])=>[name,label.replace(/\s*\(PHP\)|\s*\(optional\)/g,"")]) || []);
  const details = [];
  for (const [key,value] of Object.entries(p)) {
    if (skip.has(key) || (tx.kind === "cash_return" && key === "record_type") || value === "" || value == null) continue;
    const label = labels[key] || titleCase(key);
    const formatted = typeof value === "number" && /amount|value|expenses|released|returned/i.test(key) ? money(value) : String(value);
    details.push([label, formatted]);
  }
  if (tx.kind === "cash_return") details.unshift(["Record type", p.record_type || "Cash return"]);
  return details;
}
function documentTitle(tx) {
  const kind=templateForTransaction(tx);
  return (TEMPLATE_DEFINITIONS[kind] ? templateSettings(kind).title : "") || TYPE_INFO[tx.kind]?.title || "Financial Record";
}
function receiptSignature(label,value,role,key) {
  const roleName=role==="finance" ? state.systemSettings.financeOfficer : role==="audit" ? state.systemSettings.auditOfficer : "";
  const roleLabel=role==="finance" ? "Finance Officer" : role==="audit" ? "Audit Officer" : "";
  return `<div class="cash-receipt-signature" data-template-block="signature-${key}"><strong data-template-block="signature-name-${key}">${escapeHtml(value||roleName||"")}</strong><span data-template-block="signature-label-${key}">${escapeHtml(label)}</span>${roleLabel?`<small data-template-block="signature-role-${key}">${roleLabel}</small>`:""}</div>`;
}
function cashDonationReceiptMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("cash_donation",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("cash_donation",key),value,role,key);
  const footer=templateSettings("cash_donation").footer;
  return `<article class="receipt receipt-cash-donation">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("cash_donation").title)}</h3>
    <div class="cash-receipt-row">${field("receipt_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("received_from",p.donor_name)}
    ${field("amount",money(tx.amount))}
    ${field("amount_words",amountInWords(tx.amount))}
    <div class="cash-receipt-row">${field("mode",p.payment_method)}${field("reference",p.reference_number||"")}</div>
    ${field("purpose",p.donation_purpose)}
    ${p.remarks?field("remarks",p.remarks):""}
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures">${signature("received_by",p.received_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}</div>
      ${footer?`<p class="cash-receipt-thanks" data-template-block="footer-note"><strong data-template-block="footer-note-heading">${escapeHtml(templateLabel("cash_donation","thank_you_heading"))}</strong><br><span data-template-block="footer-note-body">${formatTemplateText(footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function incomeCollectionReceiptMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("income",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("income",key),value,role,key);
  return `<article class="receipt receipt-income">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("income").title)}</h3>
    <div class="cash-receipt-row">${field("receipt_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("received_from",p.received_from)}
    ${field("category",p.category)}
    <div class="cash-receipt-row">${field("mode",p.payment_method)}${field("reference",p.reference_number||"")}</div>
    ${field("amount",money(tx.amount))}
    ${field("amount_words",amountInWords(tx.amount))}
    <div class="income-receipt-particulars" data-template-block="particulars"><strong data-template-block="particulars-label">${escapeHtml(templateLabel("income","particulars"))}</strong><div data-template-block="particulars-value">${escapeHtml(p.particulars||"")}</div></div>
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures">${signature("prepared_by",p.prepared_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}</div>
      ${templateSettings("income").footer?`<p class="template-footer" data-template-block="footer-note"><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("income").footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function disbursementVoucherMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("disbursement",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("disbursement",key),value,role,key);
  const items=Array.isArray(p.items) ? p.items : [{ particulars:p.particulars||p.purpose, amount:tx.amount }];
  const rows=items.map(item=>`<tr><td>${escapeHtml(item.particulars)}</td><td>${escapeHtml(money(item.amount))}</td></tr>`).join("");
  return `<article class="receipt receipt-disbursement">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("disbursement").title)}</h3>
    <div class="cash-receipt-row">${field("voucher_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("payee",p.payee)}
    ${field("purpose",p.purpose)}
    <table class="disbursement-details"><thead><tr><th>${escapeHtml(templateLabel("disbursement","particulars"))}</th><th>${escapeHtml(templateLabel("disbursement","amount"))}</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><th>${escapeHtml(templateLabel("disbursement","total"))}</th><th>${escapeHtml(money(p.total_amount ?? tx.amount))}</th></tr></tfoot></table>
    ${field("payment_method",p.payment_method)}
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures disbursement-signatures">${signature("prepared_by",p.prepared_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}${signature("received_by",p.received_by,"finance")}</div>
      <div class="disbursement-received-date">${field("date_received",prettyDate(p.date_received||tx.transaction_date))}</div>
      ${templateSettings("disbursement").footer?`<p class="template-footer" data-template-block="footer-note"><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("disbursement").footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function expenseRecordMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("expense",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("expense",key),value,role,key);
  const items=Array.isArray(p.items) ? p.items : [{ date:tx.transaction_date, particulars:p.description, receipt_number:p.receipt_number, amount:tx.amount }];
  const rows=items.map(item=>`<tr><td>${escapeHtml(prettyDate(item.date||tx.transaction_date))}</td><td>${escapeHtml(item.particulars)}</td><td>${escapeHtml(item.receipt_number||"")}</td><td>${escapeHtml(money(item.amount))}</td></tr>`).join("");
  return `<article class="receipt receipt-expense">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("expense").title)}</h3>
    <div class="cash-receipt-row">${field("record_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("payee",p.supplier)}
    ${field("activity",p.expense_category)}
    <table class="expense-details"><thead><tr><th>${escapeHtml(templateLabel("expense","line_date"))}</th><th>${escapeHtml(templateLabel("expense","particulars"))}</th><th>${escapeHtml(templateLabel("expense","receipt_no"))}</th><th>${escapeHtml(templateLabel("expense","amount"))}</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><th colspan="3">${escapeHtml(templateLabel("expense","total"))}</th><th>${escapeHtml(money(p.total_amount ?? tx.amount))}</th></tr></tfoot></table>
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures expense-signatures">${signature("prepared_by",p.prepared_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}${signature("received_by",p.received_by,"finance")}</div>
      <div class="expense-received-date">${field("date_received",prettyDate(p.date_received||tx.transaction_date))}</div>
      ${templateSettings("expense").footer?`<p class="template-footer" data-template-block="footer-note"><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("expense").footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function cashReturnRecordMarkup(tx) {
  const p=getPayload(tx);
  const fundingSource=p.funding_source||tx.funding_source||"";
  const fundingLabel=fundingSource==="income" ? "Income fund" : fundingSource.replace(/^donation:/,"");
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("cash_return",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("cash_return",key),value,role,key);
  return `<article class="receipt receipt-cash-return">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("cash_return").title)}</h3>
    <div class="cash-receipt-row">${field("record_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("person",p.person_involved)}
    ${field("funding_source",fundingLabel)}
    <div class="return-funds-breakdown">
      ${field("total_received",money(p.total_funds_received??tx.amount))}
      ${field("actual_expenses",money(p.actual_expenses||0))}
      ${field("unused_return",money(p.unused_funds_return??tx.amount))}
    </div>
    ${field("returned_through",p.returned_through)}
    <footer class="cash-receipt-footer"><div class="cash-receipt-signatures">${signature("received_by",p.received_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}</div>
      ${templateSettings("cash_return").footer?`<p class="template-footer" data-template-block="footer-note"><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("cash_return").footer)}</span></p>`:""}</footer>
  </article>`;
}
function reimbursementRecordMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("reimbursement",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("reimbursement",key),value,role,key);
  const items=Array.isArray(p.items) ? p.items : [{ particulars:p.particulars||p.remarks||"", amount:tx.amount }];
  const rows=items.map(item=>`<tr><td>${escapeHtml(item.particulars)}</td><td>${escapeHtml(money(item.amount))}</td></tr>`).join("");
  return `<article class="receipt receipt-reimbursement">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("reimbursement").title)}</h3>
    <div class="cash-receipt-row">${field("record_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("person",p.person_involved)}
    <table class="reimbursement-details"><thead><tr><th>${escapeHtml(templateLabel("reimbursement","particulars"))}</th><th>${escapeHtml(templateLabel("reimbursement","amount"))}</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><th>${escapeHtml(templateLabel("reimbursement","total"))}</th><th>${escapeHtml(money(p.total_amount??tx.amount))}</th></tr></tfoot></table>
    ${field("returned_through",p.returned_through)}
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures reimbursement-signatures">${signature("received_by",p.received_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}${signature("requested_by",p.requested_by)}</div>
      <div class="reimbursement-paid-date">${field("date_paid",prettyDate(p.date_paid||tx.transaction_date))}</div>
      ${templateSettings("reimbursement").footer?`<p class="template-footer" data-template-block="footer-note"><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("reimbursement").footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function inKindDonationReceiptMarkup(tx) {
  const p=getPayload(tx);
  const receiptValue=(key,label,value)=>`<div class="cash-receipt-field" data-template-block="field-${key}"><span data-template-block="label-${key}">${escapeHtml(label)}</span><strong data-template-block="value-${key}">${escapeHtml(value||"")}</strong></div>`;
  const field=(key,value)=>receiptValue(key,templateLabel("in_kind_donation",key),value);
  const signature=(key,value,role)=>receiptSignature(templateLabel("in_kind_donation",key),value,role,key);
  const items=Array.isArray(p.items) ? p.items : [{ quantity:p.quantity, unit:p.unit||"", description:p.item_description, estimated_value:p.estimated_value }];
  const itemRows=items.map(item=>{
    const estimatedValue=item.estimated_value==="" || item.estimated_value==null ? "" : money(item.estimated_value);
    return `<tr><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.unit||"")}</td><td>${escapeHtml(item.description)}</td><td>${escapeHtml(estimatedValue)}</td></tr>`;
  }).join("");
  return `<article class="receipt receipt-in-kind">
    ${receiptHeaderMarkup()}
    <h3 class="cash-receipt-title">${escapeHtml(templateSettings("in_kind_donation").title)}</h3>
    <div class="cash-receipt-row">${field("receipt_no",tx.document_no)}${field("date",prettyDate(tx.transaction_date))}</div>
    ${field("received_from",p.donor_name)}
    ${field("purpose",p.purpose)}
    <h4 class="in-kind-details-heading">${escapeHtml(templateLabel("in_kind_donation","details"))}</h4>
    <table class="in-kind-details"><thead><tr><th>${escapeHtml(templateLabel("in_kind_donation","quantity"))}</th><th>${escapeHtml(templateLabel("in_kind_donation","unit"))}</th><th>${escapeHtml(templateLabel("in_kind_donation","description"))}</th><th>${escapeHtml(templateLabel("in_kind_donation","estimated_value"))}</th></tr></thead>
      <tbody>${itemRows}</tbody></table>
    <footer class="cash-receipt-footer">
      <div class="cash-receipt-signatures">${signature("received_by",p.received_by,"finance")}${signature("checked_by",p.checked_by,"audit")}${signature("approved_by",p.approved_by)}</div>
      ${templateSettings("in_kind_donation").footer?`<p class="cash-receipt-thanks" data-template-block="footer-note"><strong data-template-block="footer-note-heading">${escapeHtml(templateLabel("in_kind_donation","thank_you_heading"))}</strong><br><span data-template-block="footer-note-body">${formatTemplateText(templateSettings("in_kind_donation").footer)}</span></p>`:""}
    </footer>
  </article>`;
}
function templatePreviewTransaction(kind) {
  const now=new Date(), date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const code=`${TYPE_INFO[kind].prefix}-${now.getFullYear()}-001`;
  const tx={kind:kind==="reimbursement"?"cash_return":kind,document_no:code,transaction_date:date,amount:1500,payload:{}};
  if(kind==="cash_donation") Object.assign(tx.payload,{donor_name:"Sample Donor",donation_purpose:"General Cash Donations",payment_method:"Cash",reference_number:"",received_by:"",checked_by:"",approved_by:"",remarks:"Sample receipt note"});
  if(kind==="in_kind_donation") Object.assign(tx.payload,{donor_name:"Sample Donor",purpose:"Parish media ministry",items:[{quantity:2,unit:"pcs",description:"Wireless microphone",estimated_value:2500}],received_by:"",checked_by:"",approved_by:""});
  if(kind==="income") Object.assign(tx.payload,{received_from:"Sample Contributor",category:"Collections",payment_method:"Cash",reference_number:"",particulars:"Sunday collection",prepared_by:"",checked_by:"",approved_by:""});
  if(kind==="disbursement") Object.assign(tx.payload,{payee:"Sample Supplier",purpose:"Media equipment",items:[{particulars:"Tripod",amount:900},{particulars:"Cables",amount:600}],total_amount:1500,payment_method:"Cash",prepared_by:"",checked_by:"",approved_by:"",received_by:"",date_received:date});
  if(kind==="expense") Object.assign(tx.payload,{supplier:"Sample Supplier",expense_category:"Parish media activity",items:[{date,particulars:"Printing and supplies",receipt_number:"OR-001",amount:1500}],total_amount:1500,prepared_by:"",checked_by:"",approved_by:"",received_by:"",date_received:date});
  if(kind==="cash_return") Object.assign(tx.payload,{record_type:"Cash return",funding_source:"income",person_involved:"Sample Accountable Person",total_funds_received:2000,actual_expenses:500,unused_funds_return:1500,returned_through:"Cash on Hand",received_by:"",checked_by:"",approved_by:""});
  if(kind==="reimbursement") Object.assign(tx.payload,{record_type:"Reimbursement paid",funding_source:"income",person_involved:"Sample Accountable Person",items:[{particulars:"Transportation",amount:900},{particulars:"Supplies",amount:600}],total_amount:1500,returned_through:"Bank",received_by:"",checked_by:"",approved_by:"",requested_by:"Sample Requester",date_paid:date});
  return tx;
}
function receiptTemplateMarkup(kind,tx,draggable=false) {
  const renderers={
    cash_donation:cashDonationReceiptMarkup,
    in_kind_donation:inKindDonationReceiptMarkup,
    income:incomeCollectionReceiptMarkup,
    disbursement:disbursementVoucherMarkup,
    expense:expenseRecordMarkup,
    cash_return:cashReturnRecordMarkup,
    reimbursement:reimbursementRecordMarkup
  };
  const renderer=renderers[kind];
  return renderer ? applyReceiptLayout(renderer(tx),kind,draggable) : "";
}
function receiptBlockKey(element,kind,index,rowCounts) {
  const classes=element.classList;
  if(element.dataset.templateBlock) return element.dataset.templateBlock;
  if(classes.contains("cash-receipt-header")) return "header";
  if(classes.contains("cash-receipt-title")) return "title";
  if(classes.contains("cash-receipt-row")) return `row-${++rowCounts.row}`;
  if(classes.contains("cash-receipt-field")) {
    return `field-${index+1}`;
  }
  if(classes.contains("return-funds-breakdown")) return "return-breakdown";
  if(classes.contains("income-receipt-particulars")) return "particulars";
  if(classes.contains("in-kind-details-heading")) return "details-heading";
  if(classes.contains("cash-receipt-footer")) return "footer";
  const tableClass=["disbursement-details","expense-details","in-kind-details","reimbursement-details"].find(name=>classes.contains(name));
  if(tableClass) return `table-${tableClass.replace("-details","")}`;
  return `block-${index+1}`;
}
function applyTemplateBlockStyles(element,kind,interactive=false) {
  const key=element.dataset.templateBlock;
  if(!key) return;
  const template=templateSettings(kind);
  const fontSize=Number(template.fontSizes?.[key]);
  const position=template.positions?.[key]||{x:0,y:0};
  if(Number.isFinite(fontSize)&&fontSize>=6&&fontSize<=48) {
    element.dataset.templateFontAdjusted="true";
    element.style.setProperty("--template-font-size",`${fontSize}pt`);
  } else {
    delete element.dataset.templateFontAdjusted;
    element.style.removeProperty("--template-font-size");
  }
  if(position.x||position.y) {
    element.dataset.templatePositioned="true";
    element.style.setProperty("--template-offset-x",`${position.x}mm`);
    element.style.setProperty("--template-offset-y",`${position.y}mm`);
  } else {
    delete element.dataset.templatePositioned;
    element.style.removeProperty("--template-offset-x");
    element.style.removeProperty("--template-offset-y");
  }
  if(interactive) {
    element.dataset.templateMovable="true";
    element.setAttribute("aria-label",`Select or drag ${key.replace(/[-_]/g," ")}`);
    element.classList.toggle("template-block-selected",state.templateSelectedBlock?.kind===kind&&state.templateSelectedBlock.key===key);
  }
}
function applyReceiptLayout(markup,kind,draggable=false) {
  if(!TEMPLATE_DEFINITIONS[kind]) return markup;
  const wrapper=document.createElement("template");
  wrapper.innerHTML=markup;
  const receipt=wrapper.content.querySelector("article.receipt");
  if(!receipt) return markup;
  const blocks=Array.from(receipt.children);
  const rowCounts={row:0};
  blocks.forEach((element,index)=>{
    element.dataset.templateBlock=receiptBlockKey(element,kind,index,rowCounts);
  });
  const layout=templateSettings(kind).layout||[];
  if(layout.length) {
    const order=new Map(layout.map((key,index)=>[key,index]));
    blocks.sort((a,b)=>{
      const aOrder=order.has(a.dataset.templateBlock)?order.get(a.dataset.templateBlock):Number.MAX_SAFE_INTEGER;
      const bOrder=order.has(b.dataset.templateBlock)?order.get(b.dataset.templateBlock):Number.MAX_SAFE_INTEGER;
      return aOrder-bOrder || Array.from(receipt.children).indexOf(a)-Array.from(receipt.children).indexOf(b);
    });
    receipt.dataset.templateCustomLayout="true";
    receipt.dataset.templateFooterLast=blocks[blocks.length-1]?.dataset.templateBlock==="footer"?"true":"false";
  }
  blocks.forEach(element=>receipt.appendChild(element));
  [receipt,...receipt.querySelectorAll("[data-template-block]")].forEach(element=>applyTemplateBlockStyles(element,kind,draggable));
  return wrapper.innerHTML;
}
function updateTemplateControls() {
  const preview=$("#template-receipt-preview");
  const selected=state.templateSelectedBlock;
  const kind=preview?.dataset.templateKind;
  const key=selected?.kind===kind?selected.key:"";
  const element=key?Array.from(preview.querySelectorAll("[data-template-block]")).find(item=>item.dataset.templateBlock===key):null;
  const font=$("#template-font-size"), offsetX=$("#template-offset-x"), offsetY=$("#template-offset-y"), reset=$("[data-reset-template-style]");
  const earlier=$('[data-template-order="earlier"]'), later=$('[data-template-order="later"]');
  const selectedText=$("#template-selected-text");
  if(!font||!offsetX||!offsetY||!reset||!earlier||!later||!selectedText) return;
  [font,offsetX,offsetY].forEach(input=>{input.disabled=!element;});
  reset.disabled=!element;
  if(!element) {
    selectedText.textContent="Select a block in the preview";
    font.value=""; offsetX.value="0"; offsetY.value="0";
    earlier.disabled=true; later.disabled=true;
    return;
  }
  const receipt=$(".receipt",preview);
  const topLevel=Array.from(receipt.children).find(child=>child===element||child.contains(element));
  const blockIndex=Array.from(receipt.children).indexOf(topLevel);
  earlier.disabled=blockIndex<=0;
  later.disabled=blockIndex<0||blockIndex>=receipt.children.length-1;
  const readableText=element.textContent.replace(/\s+/g," ").trim();
  selectedText.textContent=readableText.slice(0,100)||key.replace(/[-_]/g," ");
  const template=templateSettings(kind);
  font.value=template.fontSizes?.[key]??"";
  offsetX.value=template.positions?.[key]?.x??0;
  offsetY.value=template.positions?.[key]?.y??0;
}
function setSelectedTemplateStyle() {
  const preview=$("#template-receipt-preview"), selection=state.templateSelectedBlock;
  if(!preview||!selection||selection.kind!==preview.dataset.templateKind) return false;
  const key=selection.key;
  const block=Array.from(preview.querySelectorAll("[data-template-block]")).find(element=>element.dataset.templateBlock===key);
  const font=$("#template-font-size"), offsetX=$("#template-offset-x"), offsetY=$("#template-offset-y");
  if(!block||!font||!offsetX||!offsetY) return false;
  const rawFont=font.value.trim(), rawX=offsetX.value.trim(), rawY=offsetY.value.trim();
  const fontSize=rawFont===""?null:Number(rawFont), x=rawX===""?0:Number(rawX), y=rawY===""?0:Number(rawY);
  if((fontSize!==null&&(!Number.isFinite(fontSize)||fontSize<6||fontSize>48))||!Number.isFinite(x)||!Number.isFinite(y)||x < -200||x > 200||y < -200||y > 200) return false;
  const current=templateSettings(selection.kind);
  const fontSizes={...current.fontSizes}, positions={...current.positions};
  if(fontSize===null) delete fontSizes[key];
  else fontSizes[key]=Math.round(fontSize*2)/2;
  if(x===0&&y===0) delete positions[key];
  else positions[key]={x:Math.round(x),y:Math.round(y)};
  state.templates={...state.templates,[selection.kind]:{...current,fontSizes,positions}};
  [font,offsetX,offsetY].forEach(input=>input.setCustomValidity(""));
  applyTemplateBlockStyles(block,selection.kind,true);
  updateTemplateControls();
  return true;
}
function selectTemplateBlock(block) {
  const preview=$("#template-receipt-preview");
  if(!preview||!block?.dataset.templateBlock) return;
  state.templateSelectedBlock={kind:preview.dataset.templateKind,key:block.dataset.templateBlock};
  $$("[data-template-block]",preview).forEach(element=>element.classList.toggle("template-block-selected",element===block));
  updateTemplateControls();
}
function syncTemplateDraft(form) {
  const kind=form.dataset.templateKind, definition=TEMPLATE_DEFINITIONS[kind];
  if(!definition) return;
  const values=new FormData(form), current=templateSettings(kind);
  const labels=Object.fromEntries(Object.keys(definition.labels).map(key=>[key,String(values.get(`label_${key}`)??current.labels[key])]));
  state.templates={...state.templates,[kind]:{
    ...current,
    title:String(values.get("title")??current.title),
    footer:String(values.get("footer")??current.footer),
    labels
  }};
}
function refreshTemplatePreview() {
  const preview=$("#template-receipt-preview");
  if(!preview) return;
  const kind=preview.dataset.templateKind;
  preview.innerHTML=receiptTemplateMarkup(kind,templatePreviewTransaction(kind),true);
  updateTemplateControls();
}
function prepareDocumentForPrint(dialog) {
  const receipt=$(".receipt",dialog);
  if (!receipt) return;
  receipt.classList.toggle("receipt-full-page",receipt.scrollHeight>450);
}
function openDocument(tx, autoPrint = false) {
  const dialog = $("#document-dialog"), details = documentDetails(tx), p = getPayload(tx);
  const amount = Number(tx.amount || p.estimated_value || p.actual_expenses || p.cash_released || 0);
  const receipt = p.receipt_file?.name ? `<tr><td>Supporting receipt</td><td><button class="doc-link" type="button" data-receipt="${escapeHtml(p.receipt_file.path||"")}">${escapeHtml(p.receipt_file.name)}</button></td></tr>` : "";
  const templateMarkup=receiptTemplateMarkup(templateForTransaction(tx),tx);
  const documentMarkup = templateMarkup || `<article class="receipt"><header class="receipt-header"><div class="seal">S</div><h2>${escapeHtml(PARISH)}</h2><p>Cuenca, Batangas</p><p>COMMITTEE ON SOCIAL COMMUNICATIONS</p></header>
    <div class="receipt-title"><h3>${escapeHtml(documentTitle(tx))}</h3><strong>${escapeHtml(tx.document_no || "DOCUMENT")}</strong></div>
    <table class="receipt-details"><tbody><tr><td>Transaction date</td><td>${escapeHtml(prettyDate(tx.transaction_date))}</td></tr>${details.map(([label,value])=>`<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}${receipt}</tbody></table>
    ${amount ? `<div class="receipt-amount"><strong>${money(amount)}</strong><p>${escapeHtml(amountInWords(amount))}</p></div>` : ""}
    ${p.return_note ? `<p class="form-note">${escapeHtml(p.return_note)}</p>` : ""}
    ${p.reimbursement_note ? `<p class="form-note">${escapeHtml(p.reimbursement_note)}</p>` : ""}
    <div class="signature-grid"><div class="signature-line"><strong>${escapeHtml(p.prepared_by || state.user?.email || "")}</strong><span>Prepared by</span><small>Finance Officer</small></div><div class="signature-line"><strong>${escapeHtml(p.received_by || p.person_involved || p.donor_name || "")}</strong><span>Received by</span><small>Finance Officer</small></div><div class="signature-line"><strong>${escapeHtml(p.checked_by || "")}</strong><span>Checked by</span><small>Audit Officer</small></div><div class="signature-line"><strong>${escapeHtml(p.approved_by || "")}</strong><span>Approved by (optional)</span></div></div></article>`;
  dialog.innerHTML = `<div class="document-actions"><button class="button button-outline" type="button" data-download-doc>Download PDF</button><button class="button button-primary" type="button" data-print-doc>Print</button><button class="dialog-close" type="button" aria-label="Close">×</button></div>
    ${documentMarkup}`;
  dialog.showModal();
  $$(".dialog-close", dialog).forEach(button=>button.addEventListener("click",()=>dialog.close()));
  const printDocument=()=>{prepareDocumentForPrint(dialog);window.print();};
  $("[data-print-doc]", dialog).addEventListener("click",printDocument);
  $("[data-download-doc]", dialog).addEventListener("click",printDocument);
  if(autoPrint) printDocument();
  $("[data-receipt]", dialog)?.addEventListener("click", async event => {
    const path = event.currentTarget.dataset.receipt;
    if (!state.cloud || !path) { toast("This receipt is not available in cloud storage.", true); return; }
    try {
      const {data,error}=await state.client.storage.from("finance-receipts").createSignedUrl(path,60);
      if(error) throw error;
      window.open(data.signedUrl,"_blank","noopener,noreferrer");
    } catch(error) { toast(error.message||"Could not open supporting receipt.",true); }
  });
}

function downloadExcel(scope) {
  let rows, filename, headings, includePayload = false;
  if (scope === "report" || scope === "report-transactions") {
    const period = $("#report-result")?.dataset.period || "month";
    const type = $("#report-result")?.dataset.type || "all";
    rows = filterReportTransactions(period, $("#report-result")?.dataset.start, $("#report-result")?.dataset.end, type);
    filename = `soccom-${period}-${type === "all" ? "all-transactions" : type}-${scope === "report" ? "financial-report" : "transactions"}`;
    headings = scope === "report"
      ? ["Document number","Date","Type","Details","Funding source","Amount (PHP)","Payload"]
      : ["Document number","Date","Type","Details","Funding source","Amount (PHP)"];
    includePayload = scope === "report";
  } else {
    rows = state.transactions; filename = "soccom-transactions";
    headings = ["Document number","Date","Type","Details","Funding source","Amount (PHP)","Payload"];
    includePayload = true;
  }
  const tableRows = rows.map(tx => {
    const p=getPayload(tx);
    const row = [tx.document_no,tx.transaction_date,displayKind(tx),p.donor_name||p.received_from||p.payee||p.income_source||p.supplier||p.person_involved||p.item_description||p.purpose||p.particulars||p.description||"",sourceKey(tx),tx.amount||p.estimated_value||p.actual_expenses||0];
    if(includePayload) row.push(JSON.stringify(p));
    return row;
  });
  const escapeCell = value => {
    let text=String(value ?? "");
    if(/^\s*[=+\-@]/.test(text)) text=`'${text}`;
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  };
  const html = `<html><head><meta charset="utf-8"></head><body><table><thead><tr>${headings.map(h=>`<th>${escapeCell(h)}</th>`).join("")}</tr></thead><tbody>${tableRows.map(row=>`<tr>${row.map(cell=>`<td>${escapeCell(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }), link = document.createElement("a");
  link.style.position = "fixed"; link.style.left = "-10000px"; link.href = URL.createObjectURL(blob); link.download = `${filename}.xls`;
  document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

async function removeCategory(name) {
  if(state.transactions.some(tx=>tx.kind==="cash_donation" && getPayload(tx).donation_purpose===name)) {
    toast("This purpose is used by existing cash donations, so it cannot be removed.",true);
    return;
  }
  if (!window.confirm(`Remove "${name}" from the category list? Existing transactions and balances will be preserved.`)) return;
  try {
    const {error}=await state.client.from("donation_categories").delete().eq("name",name); if(error) throw error;
    state.categories=state.categories.filter(item=>item!==name); renderPage(); toast("Category removed.");
  } catch(error) { toast(error.message||"Could not remove category.",true); }
}
async function removeIncomeCategory(name) {
  if(state.transactions.some(tx=>tx.kind==="income" && getPayload(tx).category===name)) {
    toast("This category is used by existing income records, so it cannot be removed.",true);
    return;
  }
  if (!window.confirm(`Remove "${name}" from the income category list?`)) return;
  try {
    const {error}=await state.client.from("income_categories").delete().eq("name",name); if(error) throw error;
    state.incomeCategories=state.incomeCategories.filter(item=>item!==name); renderPage(); toast("Income category removed.");
  } catch(error) { toast(error.message||"Could not remove income category.",true); }
}
async function saveUserRole(id) {
  const select = $(`[data-role-select="${CSS.escape(id)}"]`);
  const usernameInput = $(`[data-username-input="${CSS.escape(id)}"]`);
  if (!usernameInput.checkValidity()) { usernameInput.reportValidity(); return; }
  const username = usernameInput.value.trim().toLowerCase();
  try {
    const {error}=await state.client.from("profiles").update({role:select.value,username}).eq("id",id);
    if(error) throw error;
    await refreshCloudData(); toast("User account updated.");
  } catch(error) { console.error("User account could not be updated",error); toast(error.message||"Could not update user account. Usernames must be unique.",true); }
}

function loadConfig() {
  return getDeploymentConfig();
}
function getDeploymentConfig() {
  const config = window.SOCComPortalConfig || {};
  return {
    url: typeof config.supabaseUrl === "string" ? config.supabaseUrl.trim() : "",
    key: typeof config.supabaseAnonKey === "string" ? config.supabaseAnonKey.trim() : ""
  };
}
async function optimizeOrganizationLogo(file) {
  if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) throw new Error("Choose an image no larger than 12 MB.");
  let bitmap;
  try { bitmap=await createImageBitmap(file); }
  catch { throw new Error("The selected logo could not be opened as an image."); }
  try {
    let edge=640, quality=0.82, dataUrl="";
    while (edge >= 128) {
      const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));
      canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext("2d");
      if(!context) throw new Error("Could not prepare the organization logo.");
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      dataUrl=canvas.toDataURL("image/webp",quality);
      if(dataUrl.length<=300000) return dataUrl;
      if(quality>0.52) quality-=0.1;
      else { edge=Math.floor(edge*0.8); quality=0.82; }
    }
    throw new Error("The optimized logo is still too large. Choose a simpler or smaller image.");
  } finally { bitmap.close(); }
}
async function persistPortalSettings(systemSettings, templates) {
  const nextSystemSettings=normalizeSystemSettings(systemSettings);
  const nextTemplates=normalizeTemplates(templates);
  if(!state.cloud||!state.client||!state.user) throw new Error("A signed-in Supabase account is required to save portal settings.");
  const {error}=await state.client.from("portal_settings").upsert({
    id:"default",
    system_settings:nextSystemSettings,
    templates:nextTemplates,
    updated_by:state.user.id,
    updated_at:new Date().toISOString()
  },{onConflict:"id"});
  if(error) throw error;
  state.systemSettings=nextSystemSettings;
  state.templates=nextTemplates;
}
async function connectSupabase(url, key, openLogin = true) {
  if (!url || typeof key !== "string" || !key) throw new Error("Enter both the Supabase project URL and public anon key.");
  if (isServerSupabaseKey(key)) {
    throw new Error("This looks like a Supabase secret or service_role key. Use the public anon/publishable key here; keep secret keys in server-side Supabase secrets.");
  }
  let createClient;
  try { ({createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")); }
  catch(error) { throw new Error(`Could not load the Supabase client. Check your internet connection and try again. ${error.message}`); }
  const client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session},error}=await client.auth.getSession();
  if(error) throw error;
  state.client=client;
  if(state.passwordRecovery) {
    if(!session) {
      state.passwordRecovery=false;
      throw new Error("This password reset link is invalid or expired. Request a new one.");
    }
    state.user=session.user;
    state.cloud=false;
    state.pendingAccess=false;
    return;
  }
  if (!session) {
    state.cloud=false; state.user=null; state.pendingAccess=false; setIdentity();
    if(openLogin) openAuthDialog();
    return;
  }
  state.user=session.user;
  await loadCloudData();
  if(state.role==="pending") {
    const {error:signOutError}=await client.auth.signOut();
    if(signOutError) throw signOutError;
    state.user=null; state.cloud=false; state.pendingAccess=true;
    setIdentity();
    return;
  }
  state.pendingAccess=false;
  state.cloud=true;
  await loadProfiles();
  subscribeRealtime();
  document.body.classList.remove("auth-required");
  setIdentity(); renderPage();
}
function isServerSupabaseKey(key) {
  if (typeof key !== "string") return false;
  if (/^sb_secret_/i.test(key)) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded).role === "service_role";
  } catch {
    return false;
  }
}
async function loadCloudData() {
  const {data:profile,error:profileError}=await state.client.from("profiles").select("role,full_name,username").eq("id",state.user.id).maybeSingle();
  if(profileError) throw profileError;
  state.role=profile?.role||"pending";
  if(state.role==="pending") {
    state.transactions=[]; state.categories=[...DEFAULT_CATEGORIES]; state.incomeCategories=[...DEFAULT_INCOME_CATEGORIES];
    state.systemSettings={...DEFAULT_SYSTEM_SETTINGS}; state.templates=normalizeTemplates(DEFAULT_TEMPLATES);
    state.profiles=[]; state.auditLogs=[];
    return;
  }
  const [txResult, categoryResult, incomeCategoryResult, portalSettingsResult] = await Promise.all([
    state.client.from("transactions").select("*").order("transaction_date",{ascending:false}).limit(5000),
    state.client.from("donation_categories").select("name").order("name"),
    state.client.from("income_categories").select("name").order("name"),
    state.client.from("portal_settings").select("system_settings,templates").eq("id","default").maybeSingle()
  ]);
  if(txResult.error) throw txResult.error;
  if(categoryResult.error) throw categoryResult.error;
  if(incomeCategoryResult.error) throw incomeCategoryResult.error;
  if(portalSettingsResult.error) throw portalSettingsResult.error;
  state.transactions=txResult.data||[];
  state.categories=[...new Set([...(categoryResult.data||[]).map(row=>row.name),...state.transactions.filter(tx=>tx.kind==="cash_donation").map(tx=>getPayload(tx).donation_purpose).filter(Boolean)])];
  state.incomeCategories=[...new Set([...(incomeCategoryResult.data||[]).map(row=>row.name),...state.transactions.filter(tx=>tx.kind==="income").map(tx=>getPayload(tx).category).filter(Boolean)])];
  state.systemSettings=normalizeSystemSettings(portalSettingsResult.data?.system_settings);
  state.templates=normalizeTemplates(portalSettingsResult.data?.templates);
  if(state.role!=="admin") state.profiles=[];
  state.auditLogs=[];
  if(["admin","audit"].includes(state.role)) {
    const {data,error}=await state.client.from("audit_logs").select("id,transaction_id,action,actor_id,occurred_at").order("occurred_at",{ascending:false}).limit(1000);
    if(error) throw error;
    state.auditLogs=data||[];
  }
  if(profile?.full_name && !state.user.user_metadata?.full_name) state.user.user_metadata.full_name=profile.full_name;
}
async function refreshCloudData() {
  if(!state.client||!state.user) return;
  await loadCloudData(); await loadProfiles(); setIdentity(); renderPage();
}
async function loadProfiles() {
  if(!state.client||state.role!=="admin") return;
  const {data,error}=await state.client.from("profiles").select("id,email,full_name,username,role,created_at").order("created_at",{ascending:true});
  if(error) throw error;
  state.profiles=data||[];
}
function subscribeRealtime() {
  if(state.channel) state.client.removeChannel(state.channel);
  state.channel=state.client.channel("soccom-finance-live")
    .on("postgres_changes",{event:"*",schema:"public",table:"transactions"},()=>refreshCloudData().catch(error=>toast(error.message,true)))
    .on("postgres_changes",{event:"*",schema:"public",table:"donation_categories"},()=>refreshCloudData().catch(error=>toast(error.message,true)))
    .on("postgres_changes",{event:"*",schema:"public",table:"income_categories"},()=>refreshCloudData().catch(error=>toast(error.message,true)))
    .on("postgres_changes",{event:"*",schema:"public",table:"portal_settings"},()=>refreshCloudData().catch(error=>toast(error.message,true)))
    .on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>refreshCloudData().catch(error=>toast(error.message,true)))
    .subscribe(status=>{if(status==="CHANNEL_ERROR")toast("Realtime sync disconnected. Refresh or reconnect to restore updates.",true);});
}
function openAuthDialog() {
  const dialog=$("#auth-dialog");
  const config=loadConfig(), hasConnection=Boolean(config.url&&config.key&&!isServerSupabaseKey(config.key));
  document.body.classList.add("auth-required");
  dialog.innerHTML=`<div class="login-page"><div class="login-brand"><span class="brand-mark"><img class="brand-mark-logo" src="assets/soccom-logo.png" alt=""></span><div><strong>SocCom</strong><small>FINANCE PORTAL</small></div></div>
    <section class="panel login-card" aria-labelledby="login-title"><div class="login-heading"><p class="eyebrow">COMMITTEE ON SOCIAL COMMUNICATIONS</p><h1 id="login-title">${state.passwordRecovery?"Set a new password":"Sign in"}</h1><p>${state.passwordRecovery?"Choose a new password for your portal account.":"Use your authorized portal username and password. New here? Request an account with your email address."}</p></div>
      <div id="pending-notice" class="notice warning login-pending-notice" role="status" ${state.pendingAccess&&!state.passwordRecovery?"":"hidden"}>Your account is awaiting administrator approval. Once approved, you can sign in with the username assigned by the administrator.</div>
      <form id="auth-form" ${state.passwordRecovery?"hidden":""}><div class="form-field"><label for="auth-username">Username</label><input class="field-control" type="text" name="username" id="auth-username" autocomplete="username" minlength="3" maxlength="32" pattern="[a-zA-Z0-9._-]{3,32}" required></div><div class="form-field"><label for="auth-password">Password</label><input class="field-control" type="password" name="password" id="auth-password" autocomplete="current-password" required></div><button class="button button-primary login-submit" type="submit" ${hasConnection?"":"disabled"}>Sign in securely</button><button class="login-text-button login-back-button" type="button" id="show-password-reset" ${hasConnection?"":"disabled"}>Forgot password?</button></form>
      <div class="login-signup-toggle" ${hasConnection&&!state.passwordRecovery?"":"hidden"}><span>Need portal access?</span><button class="login-text-button" type="button" id="show-signup">Request an account</button></div>
      <form id="password-reset-form" hidden><h2>Reset password</h2><p class="form-note">Enter the email address on your portal account. If it exists, Supabase will email a reset link.</p><div class="form-field"><label for="reset-email">Email address</label><input class="field-control" id="reset-email" name="email" type="email" autocomplete="email" maxlength="254" required></div><button class="button button-primary login-submit" type="submit" ${hasConnection?"":"disabled"}>Send reset link</button><button class="login-text-button login-back-button" type="button" id="reset-back-to-login">Back to sign in</button></form>
      <div id="password-reset-sent" class="login-signup-confirmation" role="status" aria-live="polite" hidden><h2>Check your email</h2><p>If an account matches that email, Supabase will send a password-reset link. Open it using the same browser origin allowed in Supabase URL Configuration.</p><button class="button button-outline login-submit" type="button" id="reset-done">Back to sign in</button></div>
      <form id="password-update-form" ${state.passwordRecovery?"":"hidden"}><div class="form-field"><label for="new-password">New password</label><input class="field-control" id="new-password" name="password" type="password" autocomplete="new-password" required></div><div class="form-field"><label for="confirm-new-password">Confirm new password</label><input class="field-control" id="confirm-new-password" name="confirm_password" type="password" autocomplete="new-password" required></div><button class="button button-primary login-submit" type="submit">Update password</button></form>
      <form id="signup-form" hidden><h2>Request portal access</h2><p class="form-note">An administrator must approve your account and assign a sign-in username.</p>
        <div class="form-field"><label for="signup-name">Full name</label><input class="field-control" type="text" name="full_name" id="signup-name" autocomplete="name" maxlength="100" required></div>
        <div class="form-field"><label for="signup-email">Email address</label><input class="field-control" type="email" name="email" id="signup-email" autocomplete="email" maxlength="254" required></div>
        <div class="form-field"><label for="signup-password">Password</label><input class="field-control" type="password" name="password" id="signup-password" autocomplete="new-password" required></div>
        <div class="form-field"><label for="signup-confirm-password">Confirm password</label><input class="field-control" type="password" name="confirm_password" id="signup-confirm-password" autocomplete="new-password" required></div>
        <button class="button button-primary login-submit" type="submit" ${hasConnection?"":"disabled"}>Submit access request</button>
        <button class="login-text-button login-back-button" type="button" id="back-to-login">Back to sign in</button>
      </form>
      <div id="signup-confirmation" class="login-signup-confirmation" role="status" aria-live="polite" hidden><h2>Request submitted</h2><p>Your request is awaiting administrator approval. Please verify your email if Supabase requires it. After approval, an administrator will assign your username; sign in using that username and your password.</p><button class="button button-outline login-submit" type="button" id="signup-done">Back to sign in</button></div>
      ${hasConnection?"":`<div class="notice warning login-config-notice" role="status">This browser is not configured for portal access. Please contact your administrator.</div>`}
    </section></div>`;
  dialog.showModal();
  dialog.oncancel=event=>event.preventDefault();
  if(state.passwordRecovery) $("#new-password",dialog).focus();
  else $("#auth-username",dialog).focus();
  $("#auth-form",dialog).addEventListener("submit",async event=>{
    event.preventDefault(); const form=event.currentTarget, button=$('button[type="submit"]',form); button.disabled=true;
    try {
      const values=new FormData(form), username=String(values.get("username")||"").trim().toLowerCase();
      const savedConfig=loadConfig();
      if(!savedConfig.url||!savedConfig.key) throw new Error("Set up the database connection before signing in.");
      if(isServerSupabaseKey(savedConfig.key)) throw new Error("This browser needs to be configured by an administrator.");
      if(!state.client) await connectSupabase(savedConfig.url,savedConfig.key,false);
      const {data,error}=await state.client.functions.invoke("username-login",{body:{username,password:values.get("password")}});
      if(error) {
        const status=error.context?.status;
        throw new Error(status===401||status===400 ? "Invalid username or password." : `Username sign-in is unavailable: ${error.message}`);
      }
      if(!data?.access_token||!data?.refresh_token) throw new Error("The username sign-in service returned an invalid session.");
      const {error:sessionError}=await state.client.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token});
      if(sessionError) throw sessionError;
      await connectSupabase(savedConfig.url,savedConfig.key,false);
      if(!state.cloud) throw new Error(state.pendingAccess ? "Your account is awaiting administrator approval." : "Could not establish a portal session.");
      dialog.close(); document.body.classList.remove("auth-required"); toast("Signed in successfully.");
    }
    catch(error){console.error("Portal sign-in failed",error);toast(error.message||"Sign-in failed.",true);}
    finally{button.disabled=false;}
  });
  $("#show-password-reset",dialog).addEventListener("click",()=>{
    $("#auth-form",dialog).hidden=true;
    $(".login-signup-toggle",dialog).hidden=true;
    $("#password-reset-form",dialog).hidden=false;
    $("#reset-email",dialog).focus();
  });
  $("#reset-back-to-login",dialog).addEventListener("click",()=>{
    $("#password-reset-form",dialog).hidden=true;
    $("#auth-form",dialog).hidden=false;
    $(".login-signup-toggle",dialog).hidden=!hasConnection;
    $("#auth-username",dialog).focus();
  });
  $("#reset-done",dialog).addEventListener("click",()=>{
    $("#password-reset-sent",dialog).hidden=true;
    $("#auth-form",dialog).hidden=false;
    $(".login-signup-toggle",dialog).hidden=!hasConnection;
    $("#auth-username",dialog).focus();
  });
  $("#password-reset-form",dialog).addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=$('button[type="submit"]',form);
    button.disabled=true;
    try {
      const email=String(new FormData(form).get("email")||"").trim().toLowerCase();
      const config=loadConfig();
      if(!config.url||!config.key) throw new Error("Portal sign-in is not configured. Please contact your administrator.");
      if(!state.client) await connectSupabase(config.url,config.key,false);
      const {error}=await state.client.auth.resetPasswordForEmail(email,{redirectTo:getAuthRedirectUrl()});
      if(error) throw error;
      form.hidden=true;
      $("#password-reset-sent",dialog).hidden=false;
      $("#reset-done",dialog).focus();
    } catch(error) {
      console.error("Password reset request failed",error);
      toast(error.message||"Could not request a password reset.",true);
    } finally { button.disabled=false; }
  });
  $("#password-update-form",dialog).addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=$('button[type="submit"]',form);
    button.disabled=true;
    try {
      if(!state.passwordRecovery||!state.client||!state.user) throw new Error("Open a valid password-reset link before setting a new password.");
      const values=new FormData(form);
      const password=String(values.get("password")||"");
      const confirmation=String(values.get("confirm_password")||"");
      if(password!==confirmation) throw new Error("The passwords do not match.");
      const {error}=await state.client.auth.updateUser({password});
      if(error) throw error;
      const {error:signOutError}=await state.client.auth.signOut();
      if(signOutError) throw signOutError;
      state.passwordRecovery=false;
      state.user=null; state.cloud=false; state.role="pending"; state.pendingAccess=false;
      const currentUrl=new URL(window.location.href);
      currentUrl.searchParams.delete("code");
      currentUrl.hash="";
      window.history.replaceState(null,"",`${currentUrl.pathname}${currentUrl.search}`);
      dialog.close();
      openAuthDialog();
      toast("Password updated. Sign in with your new password.");
    } catch(error) {
      console.error("Password update failed",error);
      toast(error.message||"Could not update the password.",true);
    } finally { button.disabled=false; }
  });
  $("#show-signup",dialog)?.addEventListener("click",()=>{
    $("#auth-form",dialog).hidden=true;
    $(".login-signup-toggle",dialog).hidden=true;
    $("#signup-form",dialog).hidden=false;
    $("#signup-name",dialog).focus();
  });
  $("#back-to-login",dialog)?.addEventListener("click",()=>{
    $("#signup-form",dialog).hidden=true;
    $("#auth-form",dialog).hidden=false;
    $(".login-signup-toggle",dialog).hidden=false;
    $("#auth-username",dialog).focus();
  });
  $("#signup-done",dialog)?.addEventListener("click",()=>{
    $("#signup-confirmation",dialog).hidden=true;
    $("#pending-notice",dialog).hidden=false;
    $("#auth-form",dialog).hidden=false;
    $(".login-signup-toggle",dialog).hidden=false;
    $("#auth-username",dialog).focus();
  });
  $("#signup-form",dialog).addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=$('button[type="submit"]',form);
    button.disabled=true;
    try {
      const values=new FormData(form), fullName=String(values.get("full_name")||"").trim();
      const email=String(values.get("email")||"").trim().toLowerCase();
      const password=String(values.get("password")||""), confirmation=String(values.get("confirm_password")||"");
      if(!fullName) throw new Error("Enter your full name.");
      if(password!==confirmation) throw new Error("The passwords do not match.");
      const savedConfig=loadConfig();
      if(!savedConfig.url||!savedConfig.key||isServerSupabaseKey(savedConfig.key)) throw new Error("Portal sign-up is not configured. Please contact your administrator.");
      if(!state.client) await connectSupabase(savedConfig.url,savedConfig.key,false);
      const {data,error}=await state.client.auth.signUp({
        email,
        password,
        options:{data:{full_name:fullName},emailRedirectTo:getAuthRedirectUrl()}
      });
      if(error) throw error;
      if(!data.user) throw new Error("Supabase did not create an account. Please try again or contact your administrator.");
      if(data.session) {
        const {error:signOutError}=await state.client.auth.signOut();
        if(signOutError) throw signOutError;
      }
      state.pendingAccess=true;
      $("#signup-form",dialog).hidden=true;
      $("#auth-form",dialog).hidden=true;
      $(".login-signup-toggle",dialog).hidden=true;
      $("#signup-confirmation",dialog).hidden=false;
      $("#signup-done",dialog).focus();
    } catch(error) {
      console.error("Portal access request failed",error);
      toast(error.message||"Could not submit the access request.",true);
    } finally { button.disabled=false; }
  });
}
async function signOut() {
  if(!state.client) return;
  const {error}=await state.client.auth.signOut();
  if(error){toast(error.message,true);return;}
  if(state.channel) state.client.removeChannel(state.channel);
  state.channel=null; state.user=null; state.cloud=false; state.role="pending";
  state.pendingAccess=false; state.transactions=[]; state.categories=[...DEFAULT_CATEGORIES];
  state.incomeCategories=[...DEFAULT_INCOME_CATEGORIES]; state.profiles=[]; state.auditLogs=[];
  state.systemSettings={...DEFAULT_SYSTEM_SETTINGS}; state.templates=normalizeTemplates(DEFAULT_TEMPLATES);
  document.body.classList.add("auth-required");
  setIdentity(); renderPage(); openAuthDialog(); toast("Signed out.");
}

function bindSettings() {
  const content=$("#page-content");
  content.addEventListener("input",event=>{
    if(event.target.closest("#template-text-controls")) {
      if(!setSelectedTemplateStyle()) event.target.setCustomValidity("Use a font size from 6 to 48 pt and offsets from -200 to 200 mm.");
      return;
    }
    const form=event.target.closest("#template-form");
    if(form) { syncTemplateDraft(form); refreshTemplatePreview(); }
  });
  content.addEventListener("change",event=>{
    if(!event.target.closest("#template-text-controls")) return;
    if(!setSelectedTemplateStyle()) event.target.reportValidity();
  });
  content.addEventListener("click",event=>{
    const orderButton=event.target.closest("[data-template-order]");
    if(orderButton) {
      const preview=$("#template-receipt-preview"), receipt=$(".receipt",preview), selected=state.templateSelectedBlock;
      if(!preview||!receipt||!selected||selected.kind!==preview.dataset.templateKind) return;
      const element=Array.from(receipt.children).find(child=>child.dataset.templateBlock===selected.key||Array.from(child.querySelectorAll("[data-template-block]")).some(nested=>nested.dataset.templateBlock===selected.key));
      const index=Array.from(receipt.children).indexOf(element);
      if(index<0) return;
      if(orderButton.dataset.templateOrder==="earlier"&&index>0) receipt.insertBefore(element,receipt.children[index-1]);
      else if(orderButton.dataset.templateOrder==="later"&&index<receipt.children.length-1) receipt.insertBefore(element,receipt.children[index+2]||null);
      else return;
      const kind=preview.dataset.templateKind, current=templateSettings(kind);
      state.templates={...state.templates,[kind]:{...current,layout:Array.from(receipt.children).map(child=>child.dataset.templateBlock).filter(Boolean)}};
      refreshTemplatePreview();
      return;
    }
    if(event.target.closest("[data-reset-template-style]")) {
      const selected=state.templateSelectedBlock, preview=$("#template-receipt-preview");
      if(!selected||selected.kind!==preview?.dataset.templateKind) return;
      const current=templateSettings(selected.kind), fontSizes={...current.fontSizes}, positions={...current.positions};
      delete fontSizes[selected.key]; delete positions[selected.key];
      state.templates={...state.templates,[selected.kind]:{...current,fontSizes,positions}};
      refreshTemplatePreview();
      toast("Selected text styles reset. Save the template to keep this change.");
      return;
    }
    if(!event.target.closest("[data-reset-template-layout]")) return;
    const preview=$("#template-receipt-preview"), kind=preview?.dataset.templateKind;
    if(!kind || !TEMPLATE_DEFINITIONS[kind]) return;
    state.templateSelectedBlock=null;
    state.templates={...state.templates,[kind]:{...templateSettings(kind),layout:[],fontSizes:{},positions:{}}};
    refreshTemplatePreview();
    toast("Template layout and text styles reset. Save the template to keep this change.");
  });
  content.addEventListener("pointerdown",event=>{
    const preview=$("#template-receipt-preview");
    const block=event.target.closest("#template-receipt-preview [data-template-block]");
    if(!preview||!block||event.button!==0) return;
    selectTemplateBlock(block);
    const kind=preview.dataset.templateKind, key=block.dataset.templateBlock;
    const position=templateSettings(kind).positions?.[key]||{x:0,y:0};
    const pageWidth=kind==="expense"?190.5:203.2;
    state.templateDrag={pointerId:event.pointerId,block,kind,key,startX:event.clientX,startY:event.clientY,baseX:position.x,baseY:position.y,mmPerPixel:pageWidth/Math.max(1,$(".receipt",preview).getBoundingClientRect().width),moved:false};
  });
  content.addEventListener("pointermove",event=>{
    const drag=state.templateDrag;
    if(!drag||drag.pointerId!==event.pointerId) return;
    const dx=event.clientX-drag.startX, dy=event.clientY-drag.startY;
    if(!drag.moved&&Math.hypot(dx,dy)<2) return;
    if(!drag.moved) $("#template-receipt-preview").setPointerCapture(event.pointerId);
    drag.moved=true;
    const x=Math.max(-200,Math.min(200,Math.round(drag.baseX+dx*drag.mmPerPixel)));
    const y=Math.max(-200,Math.min(200,Math.round(drag.baseY+dy*drag.mmPerPixel)));
    const current=templateSettings(drag.kind), positions={...current.positions};
    if(x===0&&y===0) delete positions[drag.key]; else positions[drag.key]={x,y};
    state.templates={...state.templates,[drag.kind]:{...current,positions}};
    drag.block.classList.add("template-block-moving");
    applyTemplateBlockStyles(drag.block,drag.kind,true);
    updateTemplateControls();
  });
  const finishTemplateDrag=event=>{
    const drag=state.templateDrag;
    if(!drag||drag.pointerId!==event.pointerId) return;
    drag.block.classList.remove("template-block-moving");
    state.templateDrag=null;
    updateTemplateControls();
  };
  content.addEventListener("pointerup",finishTemplateDrag);
  content.addEventListener("pointercancel",finishTemplateDrag);
  content.addEventListener("submit",async event=>{
    if(event.target.id==="system-settings-form") {
      event.preventDefault();
      if(!canManage()){toast("Only administrators can change system settings.",true);return;}
      const formData=new FormData(event.target);
      const nextSystemSettings={
        ...state.systemSettings,
        financeOfficer:String(formData.get("finance_officer")||"").trim(),
        auditOfficer:String(formData.get("audit_officer")||"").trim()
      };
      const logoFile=formData.get("organization_logo");
      try {
        if(logoFile instanceof File && logoFile.size) nextSystemSettings.organizationLogo=await optimizeOrganizationLogo(logoFile);
        else if(formData.get("clear_logo")==="on") nextSystemSettings.organizationLogo="";
        await persistPortalSettings(nextSystemSettings,state.templates);
        renderPage(); toast("System settings saved.");
      } catch(error) { console.error("System settings could not be saved",error); toast(error.message||"Could not save system settings.",true); }
    }
    if(event.target.id==="template-form") {
      event.preventDefault();
      if(!canManage()){toast("Only administrators can edit receipt templates.",true);return;}
      const form=event.target, kind=form.dataset.templateKind, definition=TEMPLATE_DEFINITIONS[kind];
      if(!definition){toast("Choose a valid receipt template.",true);return;}
      const formData=new FormData(form), labels={};
      for(const [key,defaultValue] of Object.entries(definition.labels)) {
        const label=String(formData.get(`label_${key}`)||"").trim();
        if(!label){toast("Receipt labels cannot be blank.",true);return;}
        labels[key]=label;
      }
      const title=String(formData.get("title")||"").trim();
      if(!title){toast("Enter a printed receipt title.",true);return;}
      const templates={...state.templates,[kind]:{
        ...templateSettings(kind), title, labels, footer:String(formData.get("footer")||"").trim()
      }};
      const submit=$('button[type="submit"]',form); submit.disabled=true;
      try {
        await persistPortalSettings(state.systemSettings,templates);
        renderPage(); toast(`${definition.label} template saved.`);
      } catch(error) { console.error("Receipt template could not be saved",error); toast(error.message||"Could not save this template.",true); }
      finally { submit.disabled=false; }
    }
    if(event.target.id==="category-form") {
      event.preventDefault();
      if(!canManage()){toast("Only administrators can add categories.",true);return;}
      const value=new FormData(event.target).get("category").trim();
      if(!value) return;
      try { await maybeAddCategory(value); renderPage(); toast("Category added."); }
      catch(error){toast(error.message||"Could not add category.",true);}
    }
    if(event.target.id==="income-category-form") {
      event.preventDefault();
      if(!canManage()){toast("Only administrators can add income categories.",true);return;}
      const value=new FormData(event.target).get("category").trim();
      if(!value) return;
      if(incomeCategoryOptions().some(name=>name.toLocaleLowerCase()===value.toLocaleLowerCase())) {
        toast("An income category with that name already exists.",true); return;
      }
      try {
        const {error}=await state.client.from("income_categories").insert({name:value,created_by:state.user.id});
        if(error) throw error;
        state.incomeCategories.push(value);
        renderPage(); toast("Income category added.");
      } catch(error){toast(error.message||"Could not add income category.",true);}
    }
  });
}

function bindReportPeriod() {
  $("#page-content").addEventListener("change",event=>{
    if(event.target.id==="report-period") syncReportPeriod();
    if(event.target.id==="template-kind" && TEMPLATE_DEFINITIONS[event.target.value]) {
      state.templateEditorKind=event.target.value;
      state.templateSelectedBlock=null;
      state.templateDrag=null;
      renderPage();
    }
  });
}
function syncReportPeriod() {
  const show = $("#report-period")?.value === "custom";
  $("#report-date-start-wrap")?.classList.toggle("hidden", !show);
  $("#report-date-end-wrap")?.classList.toggle("hidden", !show);
}
function init() {
  buildModuleNav(); bindSettings(); bindReportPeriod();
  const config=loadConfig();
  if(config.url&&config.key) {
    connectSupabase(config.url,config.key,false)
      .then(()=>{if(!state.cloud)openAuthDialog();})
      .catch(error=>{console.warn("Supabase auto-connect failed",error);toast(`Cloud connection unavailable: ${error.message}`,true);openAuthDialog();});
  } else openAuthDialog();
  window.addEventListener("resize",()=>{if(state.page==="dashboard")drawMovementChart();});
}
init();
