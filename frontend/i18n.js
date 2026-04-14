/**
 * Internationalization (i18n) module for the Milwaukee Tool Tracking UI.
 * Supports English (en) and German (de).
 * All visible UI strings are stored here — nothing is hard-coded in the HTML/JS.
 */

const translations = {
  en: {
    pageTitle: "Milwaukee Tool Tracker",
    pageSubtitle: "ONE-KEY EMEA — Tool Sample Management",

    loginTitle: "Sign In",
    loginSubtitle: "Enter your credentials to access the system",
    labelClientId: "Client ID",
    labelClientSecret: "Client Secret",
    placeholderClientId: "Enter your client ID",
    placeholderClientSecret: "Enter your client secret",
    btnLogin: "Sign In",
    btnLoggingIn: "Signing in...",

    dashboardTitle: "Warehouse Tools",
    dashboardSubtitle: "Select tools below and transfer them to a demo account",
    colSelect: "",
    colId: "ID",
    colName: "Tool Name",
    colModel: "Model",
    colCategory: "Category",
    colStatus: "Status",
    colSerial: "Serial Number",
    statusAvailable: "Available",
    statusTransferred: "Transferred",
    statusInUse: "In Use",

    labelTargetAccount: "Target Demo Account",
    placeholderSelectCountry: "Select a country...",
    btnTransfer: "Transfer Selected Tools",
    btnTransferring: "Transferring...",
    selectAll: "Select All",

    noToolsMessage: "All tools have been transferred. The warehouse is empty.",
    noToolsReceivedMessage: "No tools have been received at this demo account yet.",
    demoDashboardSubtitle: "Tools currently received at this demo account",
    transferConfirm: "Transfer {count} tool(s) to {country}?",

    btnAudit: "View Activity Log",
    auditTitle: "Activity Log",
    auditTimestamp: "When",
    auditAction: "Action",
    auditUser: "Who",
    auditDetails: "Details",
    auditStatus: "Status",
    auditSuccess: "Success",
    auditFailed: "Failed",
    auditEmpty: "No activity recorded yet.",
    btnCloseAudit: "Close",

    demoHint: "Demo credentials:",
    toolsSelected: "{count} tool(s) selected",

    btnLogout: "Sign Out",
    btnViewAll: "Show Full Inventory",
    btnViewWarehouse: "Show Warehouse Only",
    loading: "Loading...",
    footerText: "Milwaukee Tool — ONE-KEY EMEA Digital Product Challenge",
  },

  de: {
    pageTitle: "Milwaukee Werkzeug-Tracker",
    pageSubtitle: "ONE-KEY EMEA — Werkzeugmuster-Verwaltung",

    loginTitle: "Anmelden",
    loginSubtitle: "Geben Sie Ihre Zugangsdaten ein",
    labelClientId: "Benutzer-ID",
    labelClientSecret: "Passwort",
    placeholderClientId: "Geben Sie Ihre Benutzer-ID ein",
    placeholderClientSecret: "Geben Sie Ihr Passwort ein",
    btnLogin: "Anmelden",
    btnLoggingIn: "Wird angemeldet...",

    dashboardTitle: "Lagerwerkzeuge",
    dashboardSubtitle: "Wählen Sie Werkzeuge aus und übertragen Sie sie auf ein Demokonto",
    colSelect: "",
    colId: "ID",
    colName: "Werkzeugname",
    colModel: "Modell",
    colCategory: "Kategorie",
    colStatus: "Status",
    colSerial: "Seriennummer",
    statusAvailable: "Verfügbar",
    statusTransferred: "Übertragen",
    statusInUse: "In Benutzung",

    labelTargetAccount: "Ziel-Demokonto",
    placeholderSelectCountry: "Wählen Sie ein Land aus...",
    btnTransfer: "Ausgewählte Werkzeuge übertragen",
    btnTransferring: "Wird übertragen...",
    selectAll: "Alles auswählen",

    noToolsMessage: "Alle Werkzeuge wurden übertragen. Das Lager ist leer.",
    noToolsReceivedMessage: "Es wurden noch keine Werkzeuge an dieses Demokonto gesendet.",
    demoDashboardSubtitle: "Werkzeuge, die derzeit an diesem Demokonto eingegangen sind",
    transferConfirm: "{count} Werkzeug(e) nach {country} übertragen?",

    btnAudit: "Aktivitätsprotokoll anzeigen",
    auditTitle: "Aktivitätsprotokoll",
    auditTimestamp: "Wann",
    auditAction: "Aktion",
    auditUser: "Wer",
    auditDetails: "Details",
    auditStatus: "Status",
    auditSuccess: "Erfolgreich",
    auditFailed: "Fehlgeschlagen",
    auditEmpty: "Noch keine Aktivität aufgezeichnet.",
    btnCloseAudit: "Schließen",

    demoHint: "Demo-Zugangsdaten:",
    toolsSelected: "{count} Werkzeug(e) ausgewählt",

    btnLogout: "Abmelden",
    btnViewAll: "Gesamtbestand anzeigen",
    btnViewWarehouse: "Nur Lager anzeigen",
    loading: "Laden...",
    footerText: "Milwaukee Tool — ONE-KEY EMEA Digital Product Challenge",
  },
};

let currentLang = "en";

/**
 * Get a translated string by key.
 * Supports simple placeholder replacement: {key} → value
 */
function t(key, params = {}) {
  const lang = translations[currentLang] || translations.en;
  let text = lang[key] || translations.en[key] || key;

  Object.keys(params).forEach((k) => {
    text = text.replace(`{${k}}`, params[k]);
  });

  return text;
}

/** Set the active language. */
function setLanguage(lang) {
  currentLang = lang in translations ? lang : "en";
  return currentLang;
}

/** Get the current language code. */
function getLanguage() {
  return currentLang;
}
