const UV_CONFIG = Object.freeze({
  spreadsheetId: "1QPKjxu96X-v4x-L5k6548JBDjUnGNg-ps8kGUg9li3g",
  demandSheetName: "Demandes",
  activitySheetName: "Activité",
  newsletterSheetName: "Contacts actualités",
  yebelaSheetName: "Inscriptions YEBELA",
  notificationEmail: "kumanehemie@gmail.com",
  timeZone: "Africa/Kinshasa",
  headerRow: 4
});

function autoriserEtInitialiser() {
  const spreadsheet = SpreadsheetApp.openById(UV_CONFIG.spreadsheetId);
  getOrCreateDemandSheet_(spreadsheet);
  getOrCreateActivitySheet_(spreadsheet);
  getOrCreateNewsletterSheet_(spreadsheet);
  getOrCreateYebelaSheet_(spreadsheet);
  MailApp.getRemainingDailyQuota();

  return "Autorisation réussie : le registre, le Dashboard et les notifications sont prêts.";
}
function doGet() {
  return jsonResponse_({ ok: true, service: "Usemi Vizuri Consulting - suivi du site" });
}

function doPost(event) {
  const data = event && event.parameter ? event.parameter : {};
  if (String(data.website || "").trim()) return jsonResponse_({ ok: true, ignored: true });

  const action = cleanValue_(data.action || "contact", 40).toLowerCase();
  const now = new Date();
  const sessionId = cleanValue_(data.sessionId, 120) || "#";
  const page = cleanValue_(data.page, 300) || "/";
  const referrer = cleanValue_(data.referrer, 500) || "Accès direct";
  const device = cleanValue_(data.device, 350) || "#";
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const spreadsheet = SpreadsheetApp.openById(UV_CONFIG.spreadsheetId);

    if (action === "visit") {
      logActivity_(spreadsheet, now, "Visite", sessionId, page, referrer, "Enregistrée", device);
      return jsonResponse_({ ok: true, tracked: "visit", receivedAt: now.toISOString() });
    }

    if (action === "yebela") {
      const nom = cleanValue_(data.nom, 120);
      const email = cleanValue_(data.email, 180).toLowerCase();
      const source = cleanValue_(data.source, 100) || "Page d’inscription YEBELA";

      if (!nom || !email) {
        return jsonResponse_({ ok: false, error: "Le nom complet et l’adresse e-mail sont obligatoires." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse_({ ok: false, error: "Adresse e-mail invalide." });
      }

      const sheet = getOrCreateYebelaSheet_(spreadsheet);
      const reference = createYebelaReference_(now);
      sheet.appendRow([
        reference,
        now,
        safeSheetValue_(nom),
        safeSheetValue_(email),
        "2ᵉ édition — 18 & 19 décembre 2026",
        safeSheetValue_(source),
        safeSheetValue_(page),
        safeSheetValue_(sessionId),
        safeSheetValue_(device),
        "WhatsApp ouvert",
        "À notifier"
      ]);

      let emailSent = false;
      try {
        MailApp.sendEmail({
          to: UV_CONFIG.notificationEmail,
          replyTo: email,
          name: "Site Usemi Vizuri Consulting",
          subject: "Nouvelle inscription YEBELA " + reference + " - " + nom,
          body: [
            "Nouvelle inscription à YEBELA depuis le site.",
            "",
            "Référence : " + reference,
            "Nom complet : " + nom,
            "Adresse e-mail : " + email,
            "Édition : 18 & 19 décembre 2026",
            "Source : " + source,
            "Page : " + page,
            "Appareil : " + device,
            "",
            "Date de Kinshasa : " + Utilities.formatDate(now, UV_CONFIG.timeZone, "dd/MM/yyyy HH:mm:ss")
          ].join("\n")
        });
        emailSent = true;
        sheet.getRange(sheet.getLastRow(), 11).setValue("Envoyée à " + UV_CONFIG.notificationEmail);
      } catch (mailError) {
        sheet.getRange(sheet.getLastRow(), 11).setValue("Échec notification : " + mailError.message);
      }

      logActivity_(spreadsheet, now, "Inscription YEBELA", sessionId, page, referrer, "WhatsApp ouvert", device);
      return jsonResponse_({
        ok: true,
        tracked: "yebela",
        reference: reference,
        receivedAt: now.toISOString(),
        emailSent: emailSent
      });
    }
    if (action !== "contact") {
      return jsonResponse_({ ok: false, error: "Action non reconnue." });
    }

    logActivity_(spreadsheet, now, "Tentative de contact", sessionId, page, referrer, "Soumise", device);

    const nom = cleanValue_(data.nom, 120);
    const email = cleanValue_(data.email, 180).toLowerCase();
    const besoin = cleanValue_(data.besoin, 1200);
    const actualites = String(data.actualites || "").toLowerCase() === "oui" ? "Oui" : "Non";

    if (!nom || !email || !besoin) {
      return jsonResponse_({ ok: false, error: "Les champs nom, email et besoin sont obligatoires." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse_({ ok: false, error: "Adresse e-mail invalide." });
    }

    const sheet = getOrCreateDemandSheet_(spreadsheet);
    const reference = createReference_(now);
    sheet.appendRow([
      reference,
      now,
      safeSheetValue_(nom),
      safeSheetValue_(email),
      safeSheetValue_(besoin),
      "Site web",
      "À notifier",
      actualites
    ]);

    let newsletterAdded = false;
    if (actualites === "Oui") {
      newsletterAdded = addNewsletterContact_(spreadsheet, now, email, nom);
    }

    let emailSent = false;
    try {
      MailApp.sendEmail({
        to: UV_CONFIG.notificationEmail,
        replyTo: email,
        name: "Site Usemi Vizuri Consulting",
        subject: "Nouvelle demande " + reference + " - " + nom,
        body: [
          "Nouvelle demande reçue depuis le site Usemi Vizuri Consulting.",
          "",
          "Référence : " + reference,
          "Nom complet : " + nom,
          "Adresse e-mail : " + email,
          "Besoin : " + besoin,
          "Analyses et actualités : " + actualites,
          "",
          "Date de Kinshasa : " + Utilities.formatDate(now, UV_CONFIG.timeZone, "dd/MM/yyyy HH:mm:ss")
        ].join("\n")
      });
      emailSent = true;
      sheet.getRange(sheet.getLastRow(), 7).setValue("Envoyée à " + UV_CONFIG.notificationEmail);
    } catch (mailError) {
      sheet.getRange(sheet.getLastRow(), 7).setValue("Échec notification : " + mailError.message);
    }

    return jsonResponse_({
      ok: true,
      reference: reference,
      receivedAt: now.toISOString(),
      emailSent: emailSent,
      newsletterAdded: newsletterAdded
    });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || "Enregistrement impossible." });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateDemandSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(UV_CONFIG.demandSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(UV_CONFIG.demandSheetName);
  const headers = [[
    "Référence",
    "Date / heure (Kinshasa)",
    "Nom complet",
    "Adresse e-mail",
    "Description brève du besoin",
    "Source",
    "Notification e-mail",
    "Analyses & actualités"
  ]];
  ensureHeaders_(sheet, headers);
  return sheet;
}

function getOrCreateActivitySheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(UV_CONFIG.activitySheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(UV_CONFIG.activitySheetName);
  const headers = [["Date / heure", "Type", "Session", "Page", "Référent", "Statut", "Appareil"]];
  ensureHeaders_(sheet, headers);
  return sheet;
}

function getOrCreateNewsletterSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(UV_CONFIG.newsletterSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(UV_CONFIG.newsletterSheetName);
  const headers = [["Date d’inscription", "Adresse e-mail", "Nom complet", "Source"]];
  ensureHeaders_(sheet, headers);
  return sheet;
}

function getOrCreateYebelaSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(UV_CONFIG.yebelaSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(UV_CONFIG.yebelaSheetName);
  const headers = [[
    "Référence",
    "Date / heure (Kinshasa)",
    "Nom complet",
    "Adresse e-mail",
    "Édition",
    "Source",
    "Page d’origine",
    "Session",
    "Appareil",
    "Statut WhatsApp",
    "Notification e-mail"
  ]];
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const currentHeader = sheet.getRange(UV_CONFIG.headerRow, 1, 1, headers[0].length).getValues()[0];
  if (!currentHeader.some(String)) {
    sheet.getRange(UV_CONFIG.headerRow, 1, 1, headers[0].length).setValues(headers);
  }
}

function logActivity_(spreadsheet, date, type, sessionId, page, referrer, status, device) {
  const sheet = getOrCreateActivitySheet_(spreadsheet);
  sheet.appendRow([
    date,
    safeSheetValue_(type),
    safeSheetValue_(sessionId),
    safeSheetValue_(page),
    safeSheetValue_(referrer),
    safeSheetValue_(status),
    safeSheetValue_(device)
  ]);
}

function addNewsletterContact_(spreadsheet, date, email, nom) {
  const sheet = getOrCreateNewsletterSheet_(spreadsheet);
  const lastRow = sheet.getLastRow();
  if (lastRow >= UV_CONFIG.headerRow + 1) {
    const existing = sheet
      .getRange(UV_CONFIG.headerRow + 1, 2, lastRow - UV_CONFIG.headerRow, 1)
      .createTextFinder(email)
      .matchEntireCell(true)
      .findNext();
    if (existing) return false;
  }
  sheet.appendRow([date, safeSheetValue_(email), safeSheetValue_(nom), "Formulaire du site"]);
  return true;
}

function createReference_(date) {
  const stamp = Utilities.formatDate(date, UV_CONFIG.timeZone, "yyyyMMdd-HHmmss");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return "UVC-" + stamp + "-" + suffix;
}

function createYebelaReference_(date) {
  const stamp = Utilities.formatDate(date, UV_CONFIG.timeZone, "yyyyMMdd-HHmmss");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return "YEB-" + stamp + "-" + suffix;
}

function cleanValue_(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeSheetValue_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
