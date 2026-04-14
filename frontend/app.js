/**
 * Milwaukee Tool Tracker — Main Application Logic
 *
 * Handles authentication, tool listing, transfers, and language switching.
 * Communicates with the Flask back-end at localhost:5000.
 */

const API_BASE = "http://localhost:5000";

// ─── State ──────────────────────────────────────────────────────────

let authToken = null;
let tools = [];
let allTools = [];
let accounts = [];
let selectedTools = new Set();
let viewMode = "warehouse"; // 'warehouse' or 'all'
let accountType = "warehouse"; // 'warehouse' or 'demo'
let accountCountry = "";       // e.g. 'France' (only for demo accounts)
let accountCountryCode = "";   // e.g. 'FR'

// ─── API Helpers ────────────────────────────────────────────────────

async function apiRequest(method, path, body = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}${path}${path.includes("?") ? "&" : "?"}lang=${getLanguage()}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { error: true, message: t("server_error") || "Connection failed. Is the server running?" },
    };
  }
}

// ─── Authentication ─────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();

  const clientId = document.getElementById("client-id").value.trim();
  const clientSecret = document.getElementById("client-secret").value.trim();
  const loginBtn = document.getElementById("btn-login");

  if (!clientId || !clientSecret) return;

  loginBtn.disabled = true;
  loginBtn.innerHTML = `<span class="spinner"></span> ${t("btnLoggingIn")}`;

  const result = await apiRequest("POST", "/auth/token", {
    client_id: clientId,
    client_secret: clientSecret,
  });

  loginBtn.disabled = false;
  loginBtn.textContent = t("btnLogin");

  if (result.ok && result.data.token) {
    authToken = result.data.token;
    accountType = result.data.account_type || "warehouse";
    accountCountry = result.data.country || "";
    accountCountryCode = result.data.country_code || "";
    showAlert("success", result.data.message);
    setTimeout(() => {
      showDashboard();
    }, 500);
  } else {
    showAlert("error", result.data.message);
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────

async function showDashboard() {
  // Hide login, show dashboard
  document.getElementById("login-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
  document.getElementById("btn-logout").classList.remove("hidden");
  document.getElementById("btn-audit").classList.remove("hidden");

  if (accountType === "demo") {
    // Country demo account: hide transfer bar and view toggle
    document.getElementById("transfer-bar").classList.add("hidden");
    document.getElementById("btn-view-toggle").classList.add("hidden");
    document.getElementById("dashboard-title").textContent = `${accountCountry} Demo`;
    document.getElementById("dashboard-subtitle").textContent = t("demoDashboardSubtitle");
  } else {
    // Warehouse account: show everything
    document.getElementById("transfer-bar").classList.remove("hidden");
    document.getElementById("btn-view-toggle").classList.remove("hidden");
    document.getElementById("dashboard-title").textContent = t("dashboardTitle");
    document.getElementById("dashboard-subtitle").textContent = t("dashboardSubtitle");
  }

  await loadTools();
  if (accountType === "warehouse") {
    await loadAccounts();
  }
}

async function loadTools() {
  const endpoint = viewMode === "all" ? "/tools/all" : "/tools";
  const result = await apiRequest("GET", endpoint);

  if (result.ok) {
    tools = result.data.tools;
    selectedTools.clear();
    renderToolTable();
    updateTransferBar();
  } else {
    if (result.status === 401) {
      handleLogout();
      showAlert("error", result.data.message);
    }
  }
}

async function loadAccounts() {
  const result = await apiRequest("GET", "/accounts");

  if (result.ok) {
    accounts = result.data.accounts;
    renderAccountDropdown();
  }
}

function renderToolTable() {
  const tbody = document.getElementById("tools-tbody");
  const tableSection = document.getElementById("table-section");
  const emptyState = document.getElementById("empty-state");

  if (tools.length === 0) {
    tableSection.classList.add("hidden");
    emptyState.classList.remove("hidden");
    document.getElementById("empty-text").textContent = 
      accountType === "demo" ? t("noToolsReceivedMessage") : t("noToolsMessage");
    return;
  }

  tableSection.classList.remove("hidden");
  emptyState.classList.add("hidden");

  tbody.innerHTML = tools
    .map(
      (tool) => {
        const isAvailable = tool.status === "available";
        const isInUse = tool.status === "in_use";
        
        let badgeClass, statusText;
        if (isInUse) {
          badgeClass = "badge-in-use";
          statusText = t("statusInUse");
        } else if (isAvailable) {
          badgeClass = "badge-available";
          statusText = t("statusAvailable");
        } else {
          badgeClass = "badge-transferred";
          statusText = t("statusTransferred");
        }
        
        const locationText = tool.location && !isInUse ? ` → ${tool.location}` : "";
        const showCheckbox = isAvailable && accountType === "warehouse";

        return `
    <tr class="${!isAvailable && !isInUse ? 'row-transferred' : ''}">
      <td>
        ${showCheckbox 
          ? `<input type="checkbox" id="tool-${tool.id}" value="${tool.id}"
              ${selectedTools.has(tool.id) ? "checked" : ""}
              onchange="toggleTool('${tool.id}')" />`
          : accountType === "demo" 
            ? '' 
            : `<span class="checkbox-placeholder">—</span>`
        }
      </td>
      <td>${tool.id}</td>
      <td><strong>${tool.name}</strong></td>
      <td>${tool.model}</td>
      <td>${tool.category}</td>
      <td><span class="badge ${badgeClass}">${statusText}${locationText}</span></td>
      <td>${tool.serial_number}</td>
    </tr>
  `;
      }
    )
    .join("");
}

function renderAccountDropdown() {
  const select = document.getElementById("target-account");
  select.innerHTML = `<option value="">${t("placeholderSelectCountry")}</option>`;

  accounts.forEach((acc) => {
    select.innerHTML += `<option value="${acc.code}">${acc.country} (${acc.name})</option>`;
  });
}

// ─── Tool Selection ─────────────────────────────────────────────────

function toggleTool(toolId) {
  if (selectedTools.has(toolId)) {
    selectedTools.delete(toolId);
  } else {
    selectedTools.add(toolId);
  }
  updateTransferBar();
}

function toggleSelectAll() {
  const allCheckbox = document.getElementById("select-all");
  if (allCheckbox.checked) {
    tools.filter((t) => t.status === "available").forEach((t) => selectedTools.add(t.id));
  } else {
    selectedTools.clear();
  }
  renderToolTable();
  updateTransferBar();

  // Re-set the select-all checkbox state after re-render
  document.getElementById("select-all").checked = allCheckbox.checked;
}

function updateTransferBar() {
  const count = selectedTools.size;
  const countEl = document.getElementById("selected-count");
  const transferBtn = document.getElementById("btn-transfer");
  const targetAccount = document.getElementById("target-account").value;

  countEl.innerHTML = t("toolsSelected", { count: `<strong>${count}</strong>` });
  transferBtn.disabled = count === 0 || !targetAccount;
}

// ─── Transfer ───────────────────────────────────────────────────────

async function handleTransfer() {
  const targetAccount = document.getElementById("target-account").value;
  const transferBtn = document.getElementById("btn-transfer");

  if (selectedTools.size === 0 || !targetAccount) return;

  // Find country name for confirmation
  const account = accounts.find((a) => a.code === targetAccount);
  const countryName = account ? account.country : targetAccount;

  transferBtn.disabled = true;
  transferBtn.innerHTML = `<span class="spinner"></span> ${t("btnTransferring")}`;

  const result = await apiRequest("POST", "/transfer", {
    tool_ids: Array.from(selectedTools),
    target_account: targetAccount,
  });

  transferBtn.disabled = false;
  transferBtn.textContent = t("btnTransfer");

  if (result.ok) {
    showAlert("success", result.data.message);
    await loadTools();
  } else if (result.status === 207) {
    showAlert("warning", result.data.message);
    await loadTools();
  } else {
    showAlert("error", result.data.message);
  }
}

// ─── Audit Trail ─────────────────────────────────────────────────────

let auditEntries = [];

async function showAuditLog() {
  const result = await apiRequest("GET", "/audit");
  if (!result.ok) return;

  auditEntries = result.data.entries;
  renderAuditLog();

  document.getElementById("audit-modal").classList.remove("hidden");
}

function renderAuditLog() {
  const tbody = document.getElementById("audit-tbody");
  if (!tbody) return;

  if (auditEntries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400)">${t("auditEmpty")}</td></tr>`;
  } else {
    // Reverse a fresh copy
    const displayEntries = [...auditEntries].reverse();
    tbody.innerHTML = displayEntries
      .map(
        (e) => `
      <tr>
        <td>${new Date(e.timestamp).toLocaleString()}</td>
        <td>${translateAuditAction(e.action)}</td>
        <td>${e.user}</td>
        <td>${translateAuditDetails(e.details)}</td>
        <td><span class="badge ${e.success ? "badge-available" : "badge-transferred"}">${e.success ? t("auditSuccess") : t("auditFailed")}</span></td>
      </tr>
    `
      )
      .join("");
  }
}

function translateAuditAction(action) {
  const lang = getLanguage();
  if (lang !== "de") return action;
  
  const map = {
    "login": "Anmeldung",
    "auth_check": "Auth-Prüfung",
    "fetch_tools": "Bestand abrufen",
    "fetch_all_tools": "Gesamtbestand abrufen",
    "fetch_accounts": "Konten abrufen",
    "transfer": "Übertragung"
  };
  return map[action] || action;
}

function translateAuditDetails(details) {
  const lang = getLanguage();
  if (lang !== "de") return details;

  let d = details;
  d = d.replaceAll("Login successful", "Anmeldung erfolgreich");
  d = d.replaceAll("warehouse account", "Lagerkonto");
  d = d.replaceAll("demo account", "Demokonto");
  d = d.replaceAll("Listed all", "Gelistet (alle)");
  d = d.replaceAll("Listed", "Gelistet");
  d = d.replaceAll("available tools", "verfügbare Werkzeuge");
  d = d.replaceAll("tools in", "Werkzeuge in");
  d = d.replaceAll("tools (full inventory)", "Werkzeuge (Gesamtbestand)");
  d = d.replaceAll("accounts", "Konten");
  d = d.replaceAll("Tool", "Werkzeug");
  d = d.replaceAll("transfer_success", "Erfolgreiche Übertragung");
  d = d.replaceAll("transfer_partial", "Teilweise erfolgreich");
  d = d.replaceAll("No tools selected", "Keine Werkzeuge ausgewählt");
  d = d.replaceAll("Invalid credentials", "Ungültige Anmeldedaten");
  d = d.replaceAll("Missing or malformed token", "Fehlendes oder ungültiges Token");
  d = d.replaceAll("Token expired", "Token abgelaufen");
  d = d.replaceAll("Invalid token", "Ungültiges Token");
  d = d.replaceAll("Missing credentials", "Fehlende Anmeldedaten");
  d = d.replaceAll("No target account specified", "Kein Zielkonto angegeben");
  d = d.replaceAll("tool_not_available", "Werkzeug nicht verfügbar");
  
  return d;
}

function closeAuditLog() {
  document.getElementById("audit-modal").classList.add("hidden");
}

// ─── Language Switching ──────────────────────────────────────────────

function switchLanguage(lang) {
  setLanguage(lang);

  // Update language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Update all translatable elements
  updateUI();
}

function updateUI() {
  // Header
  document.getElementById("header-title").textContent = t("pageTitle");
  document.getElementById("header-subtitle").textContent = t("pageSubtitle");

  // Login
  document.getElementById("login-title").textContent = t("loginTitle");
  document.getElementById("login-subtitle").textContent = t("loginSubtitle");
  document.getElementById("label-client-id").textContent = t("labelClientId");
  document.getElementById("label-client-secret").textContent = t("labelClientSecret");
  document.getElementById("client-id").placeholder = t("placeholderClientId");
  document.getElementById("client-secret").placeholder = t("placeholderClientSecret");
  document.getElementById("btn-login").textContent = t("btnLogin");
  document.getElementById("demo-hint").textContent = t("demoHint");

  // Dashboard
  document.getElementById("dashboard-title").textContent = t("dashboardTitle");
  document.getElementById("dashboard-subtitle").textContent = t("dashboardSubtitle");
  document.getElementById("label-target").textContent = t("labelTargetAccount");
  document.getElementById("btn-transfer").textContent = t("btnTransfer");
  document.getElementById("btn-logout").textContent = t("btnLogout");
  document.getElementById("btn-audit").textContent = t("btnAudit");
  document.getElementById("btn-view-toggle").textContent = viewMode === "all" ? t("btnViewWarehouse") : t("btnViewAll");

  // Table headers
  document.getElementById("th-id").textContent = t("colId");
  document.getElementById("th-name").textContent = t("colName");
  document.getElementById("th-model").textContent = t("colModel");
  document.getElementById("th-category").textContent = t("colCategory");
  document.getElementById("th-status").textContent = t("colStatus");
  document.getElementById("th-serial").textContent = t("colSerial");
  document.getElementById("label-select-all").textContent = t("selectAll");

  // Audit modal
  document.getElementById("audit-modal-title").textContent = t("auditTitle");
  document.getElementById("btn-close-audit").textContent = t("btnCloseAudit");
  document.getElementById("th-audit-time").textContent = t("auditTimestamp");
  document.getElementById("th-audit-action").textContent = t("auditAction");
  document.getElementById("th-audit-user").textContent = t("auditUser");
  document.getElementById("th-audit-details").textContent = t("auditDetails");
  document.getElementById("th-audit-status").textContent = t("auditStatus");

  // Footer
  document.getElementById("footer-text").textContent = t("footerText");

  // Re-render dynamic content
  if (tools.length > 0) {
    renderToolTable();
    renderAccountDropdown();
    updateTransferBar();
  }

  // Update select-all label if visible
  const emptyState = document.getElementById("empty-state");
  if (!emptyState.classList.contains("hidden")) {
    document.getElementById("empty-text").textContent = t("noToolsMessage");
  }

  // Reload audit modal strings if open (using cached entries)
  const auditModal = document.getElementById("audit-modal");
  if (auditModal && !auditModal.classList.contains("hidden")) {
    renderAuditLog();
  }
}

// ─── View Toggle ─────────────────────────────────────────────────────

async function toggleViewMode() {
  viewMode = viewMode === "warehouse" ? "all" : "warehouse";
  const btn = document.getElementById("btn-view-toggle");
  btn.textContent = viewMode === "all" ? t("btnViewWarehouse") : t("btnViewAll");
  await loadTools();
}

// ─── Logout ──────────────────────────────────────────────────────────

function handleLogout() {
  authToken = null;
  tools = [];
  accounts = [];
  selectedTools.clear();
  viewMode = "warehouse";
  accountType = "warehouse";
  accountCountry = "";
  accountCountryCode = "";

  document.getElementById("dashboard-view").classList.add("hidden");
  document.getElementById("login-view").classList.remove("hidden");
  document.getElementById("btn-logout").classList.add("hidden");
  document.getElementById("btn-audit").classList.add("hidden");
  document.getElementById("btn-view-toggle").classList.add("hidden");
  document.getElementById("transfer-bar").classList.remove("hidden");
  document.getElementById("alert-container").innerHTML = "";

  // Clear form
  document.getElementById("client-id").value = "";
  document.getElementById("client-secret").value = "";
}

// ─── Alerts ──────────────────────────────────────────────────────────

function showAlert(type, message) {
  const container = document.getElementById("alert-container");
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
  };

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<span>${icons[type]}</span> ${message}`;

  container.innerHTML = "";
  container.appendChild(alert);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.style.opacity = "0";
      alert.style.transform = "translateY(-8px)";
      setTimeout(() => alert.remove(), 300);
    }
  }, 5000);
}

// ─── Init ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Set up event listeners
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("btn-transfer").addEventListener("click", handleTransfer);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);
  document.getElementById("btn-audit").addEventListener("click", showAuditLog);
  document.getElementById("btn-view-toggle").addEventListener("click", toggleViewMode);
  document.getElementById("btn-close-audit").addEventListener("click", closeAuditLog);
  document.getElementById("select-all").addEventListener("change", toggleSelectAll);
  document.getElementById("target-account").addEventListener("change", updateTransferBar);

  // Language buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });

  // Close modal on overlay click
  document.getElementById("audit-modal").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeAuditLog();
    }
  });

  // Initialize UI text
  updateUI();
});
