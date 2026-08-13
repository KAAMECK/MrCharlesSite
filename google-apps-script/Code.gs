const UV_CONFIG = Object.freeze({
  spreadsheetId: "1QPKjxu96X-v4x-L5k6548JBDjUnGNg-ps8kGUg9li3g",
  sheetName: "Demandes",
  notificationEmail: "kumanehemie@gmail.com",
  timeZone: "Africa/Kinshasa",
  headerRow: 4
});

function doGet() {
  return jsonResponse_({ ok: true, service: "Usemi Vizuri Consulting - registre de demandes" });
}

function doPost(event) {
  const data = event && event.parameter ? event.parameter : {};
  if (String(data.website || "").trim()) return jsonResponse_({ ok: true, ignored: true });

  const nom = cleanValue_(data.nom, 120);
  const email = cleanValue_(data.email, 180).toLowerCase();
  const besoin = cleanValue_(data.besoin, 1200);

  if (!nom || !email || !besoin) {
    return jsonResponse_({ ok: false, error: "Les champs nom, email et besoin sont obligatoires." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse_({ ok: false, error: "Adresse e-mail invalide." });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const spreadsheet = SpreadsheetApp.openById(UV_CONFIG.spreadsheetId);
    const sheet = getOrCreateSheet_(spreadsheet);
    const now = new Date();
    const reference = createReference_(now);
    sheet.appendRow([reference, now, safeSheetValue_(nom), safeSheetValue_(email), safeSheetValue_(besoin), "Site web", "À notifier"]);

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
          "",
          "Date de Kinshasa : " + Utilities.formatDate(now, UV_CONFIG.timeZone, "dd/MM/yyyy HH:mm:ss")
        ].join("\n")
      });
      emailSent = true;
      sheet.getRange(sheet.getLastRow(), 7).setValue("Envoyée à " + UV_CONFIG.notificationEmail);
    } catch (mailError) {
      sheet.getRange(sheet.getLastRow(), 7).setValue("Échec notification : " + mailError.message);
    }

    return jsonResponse_({ ok: true, reference: reference, receivedAt: now.toISOString(), emailSent: emailSent });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || "Enregistrement impossible." });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(UV_CONFIG.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(UV_CONFIG.sheetName);
  const headers = [["Référence", "Date / heure (Kinshasa)", "Nom complet", "Adresse e-mail", "Description brève du besoin", "Source", "Notification e-mail"]];
  const currentHeader = sheet.getRange(UV_CONFIG.headerRow, 1, 1, headers[0].length).getValues()[0];
  if (!currentHeader.some(String)) sheet.getRange(UV_CONFIG.headerRow, 1, 1, headers[0].length).setValues(headers);
  return sheet;
}

function createReference_(date) {
  const stamp = Utilities.formatDate(date, UV_CONFIG.timeZone, "yyyyMMdd-HHmmss");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return "UVC-" + stamp + "-" + suffix;
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