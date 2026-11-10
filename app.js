(function () {
  'use strict';
  // Version dieser App: bei jeder Auslieferung zusammen mit sw.js (CACHE = 'training-vNNN') erhöhen; steht im Profil oben rechts
  var APP_VERSION = 'v141';

  /* ---------- Konfiguration & Supabase ---------- */
  var cfg = window.APP_CONFIG || {};
  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_URL.indexOf('DEIN-PROJEKT') === -1);
  var sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  // Gemeinsames Supabase-Projekt (lata-lab): Tabellen und Funktionen dieser App tragen den Präfix aus config.js (fbro_)
  var TP = cfg.TABLE_PREFIX || '', FP = cfg.FUNCTION_PREFIX || '';
  if (sb && (TP || FP)) {
    var rawFrom = sb.from.bind(sb), rawRpc = sb.rpc.bind(sb);
    sb.from = function (t) { return rawFrom(TP + t); };
    sb.rpc = function (f, args, opts) { return rawRpc(FP + f, args, opts); };
  }

  /* ---------- Hilfsfunktionen ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseIso = function (s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  var hhmm = function (t) { return String(t || '').slice(0, 5); };
  var WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
  var wdName = function (v) { return L('wd' + v); };

  /* ---------- Sprachen (Übersetzungen) ---------- */
  var LANGS = ['de', 'en', 'gsw', 'uk'];
  var LANG_NAMES = { de: 'Deutsch', en: 'English', gsw: 'Züridütsch', uk: 'Українська' };
  var LANG_LOCALE = { de: 'de-CH', en: 'en-GB', uk: 'uk-UA' };
  var LANG_HTML = { de: 'de-CH', en: 'en', gsw: 'gsw', uk: 'uk' };

  var DICT = {
    de: {
      gvPdf: 'Als PDF (A4)', gvEditOn: 'Inhalte bearbeiten', gvEditOff: 'Bearbeiten beenden', gvVisSec: 'Generalversammlung', gvVisInfo: 'Legt fest, wer die GV sieht: niemand (auch Admins nicht), nur Admins, Vorstand (und Admins) oder alle Aktiv- und Passivmitglieder. Gäste, Kandidaten und Supporter sehen die GV nie.', trLogTitle: 'Letzte Transaktionen', trLogInfo: 'Festgehalten werden alle An- und Abmeldungen in den letzten 48 Stunden vor dem Training, oder ab dem Zeitpunkt, an dem 14 Personen angemeldet sind, wenn das früher ist.', trLogIn: 'angemeldet #{n}', trLogOut: 'abgemeldet', trLogByAdmin: 'durch Admin', appVersion: 'Version der App', gvStateF: 'Zustand', gvStateFinal: 'Final', gvStateDraft: 'Draft (in Arbeit)', gvStateProtocol: 'Protokoll (grau hinterlegt)', gvStateDraftSfx: ' (in Arbeit)', gvStateHint: 'Final: normal. Draft: Titel rot mit dem Zusatz «(in Arbeit)». Protokoll: abgedunkelt dargestellt.', gvVisAdmin: 'sichtbar für Admin', gvVisAdminNote: 'Nur für Admins sichtbar.', gvVisNone: 'sichtbar für niemanden', gvVisBoard: 'sichtbar für Vorstand', gvVisMembers: 'sichtbar für alle (Aktiv & Passiv)', gvVisNoneNote: 'Für niemanden sichtbar, nur Admins sehen diese GV.', gvVisEmpty: 'Es gibt noch keine GV.', gvVisHint: 'Aktuell: {v}. Das ändert nur der Admin in der Admin-Konsole.', gvTextTitle: 'Als Text: 52 Wochen ab {from} bis {to}', gvTextCopy: 'Text kopieren', gvTextCopied: 'Text kopiert', gvTextNone: 'Keine Termine in diesen 52 Wochen.', gvChapterF: 'Traktandum', gvChapterEdit: 'Traktandum bearbeiten', gvProtocol: 'Als Protokoll kennzeichnen', gvProtocolHint: 'Das Protokoll wird leicht abgedunkelt dargestellt und hebt sich so von den übrigen Unterlagen ab.', gvProtoTag: 'Protokoll', gvPhotoAdd: 'Foto hinzufügen', gvPhotoDel: 'Foto entfernen', gvPhotoMoveL: 'Nach vorne', gvPhotoMoveR: 'Nach hinten', gvUploading: 'Wird hochgeladen …', gvUploadFail: 'Das Foto konnte nicht hochgeladen werden.', gvMigrate: 'Fotos in den geschützten Speicher übernehmen', gvMigrateAsk: '{n} Fotos dieser GV werden aus dem App-Ordner in den geschützten Speicher kopiert. Danach kannst du die Dateien gv26-….jpg im Repo löschen. Fortfahren?', gvMigrated: 'Fotos übernommen: {n}', gvPhotosHint: 'Fotos werden verkleinert und geschützt gespeichert. Nur angemeldete Mitglieder sehen sie.',
      pushTitle: 'Mitteilungen', pushHint: 'Wähle, wofür du Push-Nachrichten auf diesem Gerät willst. Standard: keine Mitteilungen.', pushEvents: 'Events: neue Events und Absagen', pushTrainings: 'Trainings: Absagen und Verschiebungen sowie Zu- und Absagen (ab der 14. Zusage)', pushHoursLbl: 'Zusätzlich alle Zu- und Absagen in den letzten', pushH24: '24 Std.', pushH48: '48 Std.', pushDenied: 'Mitteilungen sind im Browser blockiert. Erlaube sie in den Einstellungen des Geräts oder der Website.', pushIos: 'Auf dem iPhone: Lege die App zuerst auf den Home-Bildschirm (Teilen, dann «Zum Home-Bildschirm») und wähle die Mitteilungen danach hier.', pushUnsupported: 'Dieses Gerät oder dieser Browser unterstützt keine Push-Mitteilungen.', pushEnabledToast: 'Mitteilungen gespeichert', pushDisabledToast: 'Mitteilungen ausgeschaltet', pushFail: 'Mitteilungen konnten nicht gespeichert werden.',
      boTag: 'Vorstand', mMakeBo: 'Zum Vorstand machen', mRevokeBo: 'Vorstand-Rechte entziehen', boGranted: 'Als Vorstand festgelegt', boRevoked: 'Vorstand-Rechte entzogen', gvEditMode: 'Inhalte bearbeiten', gvEditHint: 'Bearbeiten ist aktiv: Tippe auf einen Inhalt, um ihn zu ändern.', gvCopy: 'GV kopieren', gvCopyAsk: 'Die GV {y} wird als GV {n} kopiert, mit allen Traktanden, Berichten und Fotos, aber ohne Reaktionen und Kommentare. Das Datum verschiebt sich um 52 Wochen. Die Kopie ist ein Entwurf.', gvCopied: 'Kopiert. Die neue GV ist ein Entwurf.', gvExists: 'Für das nächste Jahr gibt es schon eine GV.', gvDelete: 'GV löschen', gvDeleteAsk: 'Die GV {y} mit allen Berichten, Reaktionen und Kommentaren endgültig löschen?', gvDeleteRep: 'Diesen Bericht endgültig löschen?', gvAddReport: 'Bericht hinzufügen', gvMetaEdit: 'Titel, Datum und Ort', gvTitleF: 'Titel', gvSubtitle: 'Untertitel', gvSummary: 'Kurzinfo (sichtbar, wenn zugeklappt)', gvBody: 'Text', gvIntro: 'Einladungstext', gvPublished: 'Veröffentlicht (für alle Mitglieder sichtbar)', gvProgUntil: 'Jahresprogramm bis', gvAuthor: 'Autor (Aktivmitglied)', gvNoAuthor: 'Kein Mitglied', gvAuthorName: 'Autor als Text (nur wenn kein Mitglied)', gvPhotos: 'Fotos', gvPhotoBad: 'Fotos: nur Dateinamen wie gv26-jass-1.jpg (Buchstaben, Ziffern, - _ .)', gvFormat: 'Format: «## Zwischentitel», «> Zeile unter dem Titel», «! Hinweis», «Name | Wert». Eine Leerzeile beginnt einen neuen Absatz.', gvFinKpi: 'Kennzahlen (Name | Wert, am Ende | - für negativ)', gvFinCols: 'Spalten (mit | getrennt)', gvFinRows: 'Tabelle («## Abschnitt» oder Name | Zahl | Zahl | Zahl, am Ende | * für Zwischensumme)', gvNeedTitle: 'Bitte Titel (und bei Berichten den Text) ausfüllen.',
      navGv: 'GV', gvTitle: 'GV {y}', gvDraft: 'Entwurf, nur für den Vorstand sichtbar', gvInvite: 'Einladung', gvRsvp: 'An- oder abmelden im Dialog «Events», bis eine Woche im Voraus ({date}). Das gilt für alle Teilnehmer, auch für das Znacht.', gvToEvents: 'Zu den Events', gvToJass: 'Zum Dialog «Jass»', gvProgramHint: 'Die Termine stammen aus dem Dialog «Events», dort meldest du dich an. Das Kalendersymbol speichert den Termin in deinem Kalender.', gvNoProgram: 'Im Zeitraum sind keine Events eingetragen.', gvMore: 'Weiterlesen', gvLess: 'Weniger anzeigen', gvPrev: 'Voriges Foto', gvNext: 'Nächstes Foto', gvClose: 'Schliessen', gvPhotoAlt: 'Foto {i} von {n}: {t}', gvComment: 'Kommentieren', gvComments1: '1 Kommentar', gvCommentsN: '{n} Kommentare', gvWrite: 'Kommentar schreiben …', gvSend: 'Senden', gvNoComments: 'Noch keine Kommentare.', gvReactAria: 'Reaktion {e}',
      wd0: 'Sonntag', wd1: 'Montag', wd2: 'Dienstag', wd3: 'Mittwoch', wd4: 'Donnerstag', wd5: 'Freitag', wd6: 'Samstag',
      navTrainings: 'Trainings', navEvents: 'Events', navAdmin: 'Admin', navProfile: 'Profil',
      titleTrainings: 'Trainingsplan', titleEvents: 'Vereinsanlässe',
      subTrainings: 'Die nächsten {n} Termine', subEvents: 'Folgende Vereinsanlässe sind geplant', moreDates: 'Weitere Termine ({n})',
      emptyTrTitle: 'Noch keine Trainings geplant.', emptyTrAdmin: 'Lege im Bereich «Verwalten» einen Trainingstag fest.', emptyTrMember: 'Die Admins legen die Trainingstage fest.',
      emptyEvTitle: 'Aktuell sind keine Events geplant.', emptyEvAdmin: 'Lege im Bereich «Verwalten» einen Event an.', emptyEvMember: 'Die Event Manager legen neue Events an.',
      trainingWord: 'Training', trCancelled: 'Training abgesagt', yes: 'Dabei', no: 'Nicht dabei', participants: 'Teilnehmer',
      ariaTr: '{yes} Teilnehmer, {no} nicht dabei. Teilnehmerliste {action}', ariaEv: '{n} Teilnehmer. Teilnehmerliste {action}',
      listOpen: 'öffnen', listClose: 'schliessen',
      hYes: 'Dabei ({n})', hNo: 'Nicht dabei ({n})', hOpen: 'Noch keine Antwort ({n})', hSolo: 'Allein dabei ({n})', hDuo: 'Zu zweit dabei ({n} Mitglieder, {p} Personen)',
      nobody: 'Niemand', you: '(du)', cancelledTag: 'Abgesagt', cancelledLow: 'abgesagt', changedLow: 'geändert',
      timePlace: '{time} Uhr, {place}', atTime: '{time} Uhr', calAdd: 'Im Kalender speichern', solo: 'Allein', duo: 'Zu zweit',
      secRules: 'Standard Training', secExtra: 'Extra Training', secUpcoming: 'Trainingsplan verwalten', secEvents: 'Events', secMembers: 'Rollen',
      addNew: 'Neu erfassen', addClose: 'Erfassung schliessen',
      adminTitle: 'Admin Console', titleCC: 'Chilbi & Chränzli', titleJass: 'Jass-Masters', adminSub: 'Nur für Admins sichtbar', rulesIntro: 'Standard-Trainings pro Woche',
      weekday: 'Wochentag', time: 'Uhrzeit', place: 'Ort', date: 'Datum', label: 'Bezeichnung',
      phPlaceTraining: 'z. B. Turnhalle Schulhaus Nord', addRule: 'Trainingstag hinzufügen',
      edit: 'Bearbeiten', remove: 'Entfernen', cancel: 'Absagen', reactivate: 'Reaktivieren', del: 'Löschen', save: 'Speichern', dismiss: 'Abbrechen', reset: 'Zurücksetzen',
      editNote: 'Gilt nur für diesen Termin. Die Antworten der Mitglieder bleiben erhalten.',
      rulesEmpty: 'Noch kein fester Trainingstag. Tippe auf «+», um einen zu erfassen.',
      extraIntro: 'Folgende zusätzliche Trainings sind geplant', extraEmpty: 'Keine zusätzlichen Trainings geplant.', extraDefaultTitle: 'Zusatztraining',
      phPlaceExtra: 'z. B. Sportanlage Süd', addExtra: 'Weiteres Training hinzufügen', upcomingEmpty: 'Keine kommenden Trainings.',
      phEventTitle: 'z. B. Fondue-Plausch', phEventPlace: 'z. B. Vereinshaus', addEvent: 'Event hinzufügen', rsvpRequired: 'Anmeldung erforderlich',
      eventsEmpty: 'Noch keine Events. Tippe auf «+», um den ersten zu erfassen.',
      membersIntro: 'Tippe bei einer Person auf die drei Punkte, um Rollen, Gruppe, PIN, Name oder Handynummer zu ändern oder sie zu löschen. Zahnrad = Admin, Stern = Event Manager, Glas = Chilbi/Chränzli Manager, Pokal = Jass Manager. Gäste und Friends & Family sehen nur eingeschränkt Inhalte (siehe Gruppen unten).',
      memberAdd: 'Mitglied hinzufügen', fullName: 'Vor- und Nachname', phone: 'Handynummer',
      memberAddNote: 'Das Mitglied meldet sich nur mit der Handynummer an. Der PIN sind die letzten 6 Ziffern.',
      selfAdmin: 'Du bist Admin. Du kannst dir die Rechte nicht selbst entziehen.', revokeAdmin: 'Admin-Rechte entziehen: {name}', makeAdmin: 'Zum Admin machen: {name}',
      adminTag: 'Admin', resetPin: 'PIN zurücksetzen',
      profileTitle: 'Mein Profil', nameLabel: 'Name',
      installTitle: 'App installieren', installHint: 'Lege die App auf deinen Startbildschirm, dann öffnet sie sich im Vollbild.', installBtn: 'Auf dem Startbildschirm speichern',
      installIos: 'Tippe unten in Safari auf «Teilen» und dann auf «Zum Home-Bildschirm». Danach öffnet sich die App im Vollbild.',
      nameChange: 'Name ändern', nameSave: 'Name speichern',
      pinChange: 'PIN ändern', pinIntro: 'Standardmässig sind es die letzten 6 Ziffern deiner Handynummer. Wenn du den PIN änderst, musst du ihn bei der Anmeldung eintragen.',
      pinNew: 'Neuer PIN (6 Ziffern)', pinSave: 'PIN speichern', pinDefault: 'Auf Standard-PIN zurücksetzen', logout: 'Abmelden',
      language: 'Sprache', languageHint: 'Wähle die Sprache, in der du die App nutzen möchtest.', themeTitle: 'Darstellung', themeHint: 'Wähle, wie die App aussehen soll.', themeLight: 'Hell', themeDark: 'Dunkel', themeAuto: 'Automatisch',
      loginSub: 'App',
      loginLeadReg: 'Erstelle dein Konto mit Name, Handynummer und Vereinscode. Dein PIN sind die letzten 6 Ziffern deiner Handynummer.',
      loginLead: 'Melde dich mit deiner Handynummer an.', pinOptional: 'PIN (nur nötig, wenn du ihn geändert hast)', clubCode: 'Vereinscode',
      register: 'Konto erstellen', signIn: 'Anmelden', haveAccount: 'Ich habe schon ein Konto', firstTime: 'Zum ersten Mal hier? Konto erstellen',
      setupTitle: 'Einrichtung nötig', setupLead: 'Die App ist noch nicht mit Supabase verbunden.',
      setupStep1: 'Öffne die Datei <code>config.js</code>.', setupStep2: 'Trage <code>SUPABASE_URL</code> und <code>SUPABASE_ANON_KEY</code> aus deinem Supabase-Projekt ein.',
      setupStep3: 'Lade die Seite neu.', setupNote: 'Die genaue Anleitung steht in der Datei README.md.',
      loading: 'Lade …',
      errFailed: 'Das hat nicht geklappt', respWithdrawn: 'Antwort zurückgezogen', youIn: 'Du bist dabei', youOut: 'Du bist nicht dabei', youSolo: 'Du kommst allein', youDuo: 'Du kommst zu zweit',
      phoneCountry: 'Land', phoneOther: 'Andere', phoneInvalid: 'Bitte gib eine gültige Handynummer ein, z. B. 079 123 45 67.', alreadyReg: 'Diese Nummer ist schon registriert.',
      memberAdded: '{name} wurde hinzugefügt.', addFailed: 'Hinzufügen nicht möglich: {reason}', unknownError: 'Unbekannter Fehler',
      authInvalid: 'Handynummer oder PIN stimmt nicht. Falls du deinen PIN geändert hast, trage ihn im Feld PIN ein.',
      authAlready: 'Diese Nummer ist bereits registriert. Bitte melde dich an.', authCode: 'Registrierung nicht möglich. Bitte prüfe den Vereinscode.',
      authRate: 'Zu viele Versuche. Bitte warte einen Moment.', authPin: 'Der PIN muss aus 6 Ziffern bestehen.', authFail: 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.',
      pinExact: 'Der PIN muss aus genau 6 Ziffern bestehen.', pinWeak: 'Dieser PIN ist zu einfach (z. B. 111111 oder 123456) oder entspricht dem Standard-PIN. Bitte wähle einen anderen.', confirmEmailOff: 'Bitte schalte in Supabase «Confirm email» aus (siehe README).',
      loadFail: 'Die Daten konnten nicht geladen werden. Wurde das Datenbank-Schema ausgeführt?',
      calFile: 'Öffne die Datei «{name}», um den Termin im Kalender zu speichern.', calFail: 'Der Kalendereintrag konnte nicht erstellt werden.',
      pinResetOk: 'PIN auf Standard zurückgesetzt', pinResetFail: 'PIN konnte nicht zurückgesetzt werden.',
      confirmDelRule: 'Diesen Trainingstag entfernen? Alle kommenden Termine der Serie verschwinden.', ruleRemoved: 'Trainingstag entfernt',
      confirmDelExtra: 'Dieses Training löschen?', extraDeleted: 'Training gelöscht',
      confirmDelEvent: 'Diesen Event löschen? Auch alle Antworten werden gelöscht.', eventDeleted: 'Event gelöscht',
      trReactivated: 'Training wieder aktiv', trCancelledMsg: 'Training abgesagt', evReactivated: 'Event wieder aktiv', evCancelledMsg: 'Event abgesagt',
      changeReset: 'Änderung zurückgesetzt', confirmResetPin: 'PIN von {name} auf die letzten 6 Ziffern der Handynummer zurücksetzen?', thisMemberDat: 'diesem Mitglied',
      pinReset: 'PIN zurückgesetzt', confirmRemove: '{name} entfernen? Das Konto und alle Antworten werden gelöscht.', thisMember: 'Dieses Mitglied', memberRemoved: 'Mitglied entfernt',
      adminGranted: 'Admin-Rechte vergeben', adminRevoked: 'Admin-Rechte entzogen', nameSaved: 'Name gespeichert', pinChanged: 'PIN geändert', pinChangeFail: 'PIN konnte nicht geändert werden.',
      ruleAdded: 'Trainingstag hinzugefügt', extraAdded: 'Training hinzugefügt', eventAdded: 'Event hinzugefügt',
      ruleChanged: 'Trainingstag geändert', trChanged: 'Training geändert', eventChanged: 'Event geändert', langSaved: 'Sprache gespeichert',
      guestTag: 'Gast', makeGuest: 'Als Gast festlegen: {name}', revokeGuest: 'Gast-Status entfernen: {name}', guestGranted: 'Als Gast festgelegt', guestRevoked: 'Gast-Status entfernt',
      guestCheck: 'Als Gast hinzufügen (sieht nur Trainings und Profil)', guestInfo: 'Du hast Gast-Zugang. Du siehst die Trainings und dein Profil.', supporterInfo: 'Du bist bei Friends & Family. Du siehst die Trainings, Jass, C&C und dein Profil.',
      memberTag: 'Mitglied', emTag: 'Event Manager', makeEm: 'Zum Event Manager machen: {name}', revokeEm: 'Event Manager-Rechte entziehen: {name}', emGranted: 'Als Event Manager festgelegt', emRevoked: 'Event Manager-Rechte entzogen', confirmGuestLoses: '{name} hat Admin-, Event Manager-, Chilbi Manager-, Chränzli Manager- oder Jass Manager-Rechte. Diese Änderung entzieht diese Rechte. Fortfahren?', selfMember: 'Du bist Mitglied. Du kannst dich nicht selbst zum Gast machen.', rolesTitle: 'Rollen', emSub: 'Hier verwaltest du die Events.', ccManagerSub: 'C&C verwaltest du im Reiter «C&C».',
      infoShow: 'Erklärung anzeigen', infoHide: 'Erklärung ausblenden',
      ok: 'OK',
      navCC: 'C&C', ccMembers: 'Mitglieder', ccGuests: 'Gäste', ccOthers: 'Andere', ccEmpty: 'Noch keine Anlässe erfasst.', ccNoDays: 'Noch keine Tage erfasst.', ccSummary: '{s} Schichten · {r} Rollen', ccLvlAll: 'Chränzli und Chilbi', ccLvlEvent: 'Anlass', ccLvlDay: 'Tag', ccLvlShift: 'Schicht', ccLvlRole: 'Rolle', ccActions: 'Aktionen', ccAddEvent: 'Anlass hinzufügen', ccAddDay: 'Tag hinzufügen', ccAddShift: 'Schicht hinzufügen', ccAddRole: 'Rolle hinzufügen', ccChange: 'Ändern', ccCopy: 'Kopieren', ccClose: 'Schliessen', ccNameOpt: 'Name (optional)', ccStart: 'Start', ccEnd: 'Ende', ccActive: 'Aktiv', ccPersons: 'Verantwortliche', ccSearch: 'Namen suchen', ccOtherPerson: 'Andere Person (nicht in der App)', ccAdd: 'Hinzufügen', ccDidYouMean: 'Meinst du {name}?', ccNobody: 'Noch niemand', ccConfirmDel: '«{name}» löschen? Alles, was darunter erfasst ist, wird ebenfalls gelöscht.', ccConfirmDelRole: '«{name}» löschen?', ccCopyEventNote: 'Die Kopie ist zuerst inaktiv. Alle Tage werden um 52 Wochen verschoben, damit die Wochentage gleich bleiben.', ccCopyDayNote: 'Schichten und Rollen werden mit den Verantwortlichen kopiert.', ccSaved: 'Gespeichert', ccCopied: 'Kopiert', ccDeleted: 'Gelöscht', ccNotInApp: '{name} ist noch nicht in der App. Mit der Handynummer kannst du die Person als Gast hinzufügen.', ccAsGuest: 'Als Gast hinzufügen', ccNeedName: 'Gib einen Namen ein.', ccSetup: 'Für C&C muss das Datenbank-Schema aktualisiert werden (supabase/schema.sql).', grpCandidate: 'Kandidaten', candidateTitle: 'Besten Dank für Dein Interesse', candidateMsg: 'Deine Anfrage wird durch unsere Administratoren geprüft.', mGroupActive: 'Zu Aktivmitglied machen', mGroupPassive: 'Zu Passivmitglied machen', mGroupGuest: 'Zu Gast machen', mGroupOther: 'Zu Friends & Family machen', mGroupCandidate: 'Zu Kandidat machen', groupChanged: 'Gruppe geändert', jsEternal: 'Ewige Rangliste', jsEternalHint: 'Über die letzten {n} abgeschlossenen Runden', jsEternalRounds: '{n} Runden', jsEternalRound: '1 Runde', jsVisibleHint: 'Ohne Haken sehen nur Admin und Jass Manager diese Runde', evEdit: 'Event bearbeiten', evTitleLbl: 'Titel', evFrom: 'Von', evTo: 'Bis', evEndBefore: 'Das Ende liegt vor dem Start.', evMissing: 'Titel, Datum und Zeit angeben.', designTitle: 'Design', designHint: 'Wähle die Farben der App.', design_light: 'Weiss', design_standard: 'Blue', design_petrol: 'Petrol', design_holland: 'Orange', evManagePeople: 'Teilnehmer verwalten', grpSupporter: 'Friends & Family', mMakeSupporter: 'Zu Friends & Family machen', supporterSet: 'Als Friends & Family eingeordnet', pinLampOk: 'Hat den PIN schon geändert', pinLampNo: 'Nutzt noch den Standard-PIN', pinBannerMsg: 'Bitte setze deinen persönlichen PIN-Code, um alle Funktionen freizuschalten.', pinBannerBtn: 'PIN jetzt setzen', ccPublicLabel: 'Für alle Aktiv- und Passivmitglieder sichtbar', ccPublicOn: 'C&C ist jetzt für alle sichtbar (nur lesend)', ccPublicOff: 'C&C ist jetzt wieder nur für Admin, Chilbi Manager und Chränzli Manager sichtbar', ccCopySuffix: 'Kopie', ccLegendMe: 'Ich', ccPrint: 'PDF teilen', jsPrint: 'Jassmasters-Übersicht als PDF', ccPdfBuilding: 'PDF wird erstellt…', ccPdfFailed: 'PDF konnte nicht erstellt werden.',
      mMakeAdmin: 'Zum Admin machen', mRevokeAdmin: 'Admin-Rechte entziehen', mMakeEm: 'Zum Event Manager machen', mRevokeEm: 'Event Manager-Rechte entziehen', mMakeGuest: 'Zum Gast machen', mMakeMember: 'Zum Mitglied machen', mEdit: 'Name und Handynummer ändern', mEditNote: 'Bei einer neuen Handynummer gilt wieder der Standard-PIN: die letzten 6 Ziffern der neuen Nummer.', mSaved: 'Gespeichert', mDelete: 'Mitglied löschen', mPhoneTaken: 'Diese Handynummer gehört bereits einer anderen Person.',
      jsLocked: 'Gesperrt – tippen zum Entsperren', jsUnlocked: 'Entsperrt – tippen zum Sperren', jsEditRow: 'Eintrag bearbeiten', jsRankDiff: 'Differenz',
      navJass: 'Jass', jsParticipants: 'Teilnehmer', jsSchedule: 'Spielplan', jsRanking: 'Tagesrangliste', jsRound: 'Runde {n}', jsTable: 'Tisch {t}', jsTeam1: 'Team I', jsTeam2: 'Team II', jsPlayer: 'Spieler {n}', jsFree: 'frei', jsEmpty: 'Noch kein Jassmasters erfasst.', jsNoDays: 'Noch kein Datum erfasst.', jsAddSeries: 'Jassmasters hinzufügen', jsAddDay: 'Datum hinzufügen', jsLvlSeries: 'Jassmasters', jsLvlDay: 'Jasstag', jsPick: 'Spieler {n} wählen', jsClear: 'Platz freigeben', jsAlready: 'bereits Spieler {n}', jsPoints: 'Punkte', jsGames: '{n} Spiele', jsPtsAbbr: 'Pkt.', jsGame: '{n} Spiel', jsNoPoints: 'Noch keine Punkte erfasst.', jsHint: 'Trage die Punkte beim Siegerteam ein. Das andere Team erhält sie automatisch negativ.', jsSetup: 'Für Jass muss das Datenbank-Schema aktualisiert werden (supabase/schema.sql).', jsFinish: 'Jassmaster abschliessen', jsConfirmFinish: '«{name}» abschliessen? Es wird unter Vergangene Jassmasters verschoben und ist danach nur noch als Rangliste sichtbar. Fortfahren?', jsFinished: 'Als abgeschlossen markiert', jsEditRanking: 'Rangliste bearbeiten', jsRankName: 'Name', jsRankPoints: 'Punkte', jsAddRow: 'Zeile hinzufügen', jsNoRows: 'Noch niemand erfasst.',
      shPlay: 'Hier abspielen', shPlayStop: 'Player schliessen',
      shHint: 'Hinweis', shHintCheck: 'Als Hinweis kennzeichnen (steht vor den Akten)',
      shVideo: 'Video', shYoutube: 'YouTube-Link', shOpenYoutube: 'Auf YouTube öffnen', shVideoBad: 'Bitte einen YouTube-Link angeben (https://www.youtube.com/… oder https://youtu.be/…).',
      shMusic: 'Musik', shSpotify: 'Spotify-Link', shOpenSpotify: 'In Spotify öffnen', shMusicBad: 'Bitte einen Spotify-Link angeben (https://open.spotify.com/…).',
      navShow: 'Show', titleShow: 'Chränzli Drehbuch', dirTag: 'Regisseur', actTag: 'Schauspieler', mMakeDir: 'Zum Regisseur machen', mRevokeDir: 'Regisseur-Rechte entziehen', mMakeActor: 'Zum Schauspieler machen', mRevokeActor: 'Schauspieler-Rolle entziehen', dirGranted: 'Als Regisseur festgelegt', dirRevoked: 'Regisseur-Rechte entzogen', actorGranted: 'Als Schauspieler festgelegt', actorRevoked: 'Schauspieler-Rolle entzogen', shEmpty: 'Noch kein Akt erfasst.', shSetup: 'Die Show-Tabellen fehlen. Bitte PRD_v97_show.sql im SQL Editor ausführen.', shAddAct: 'Akt hinzufügen', shAddScene: 'Szene hinzufügen', shAddPart: 'Rolle hinzufügen', shLvlAll: 'Show', shLvlAct: 'Akt', shLvlScene: 'Szene', shLvlPart: 'Rolle', shDesc: 'Beschreibung', shNoScenes: 'Noch keine Szenen erfasst.', shSummary: '{r} Rollen', shVisible: 'Planung für Schauspieler sichtbar',
      jmTag: 'Jass Manager', mMakeJm: 'Zum Jass Manager machen', mRevokeJm: 'Jass Manager-Rechte entziehen', jmGranted: 'Als Jass Manager festgelegt', jmRevoked: 'Jass Manager-Rechte entzogen', cmTag: 'Chilbi Manager', crmTag: 'Chränzli Manager', mMakeCm: 'Zum Chilbi Manager machen', mRevokeCm: 'Chilbi Manager-Rechte entziehen', mMakeCrm: 'Zum Chränzli Manager machen', mRevokeCrm: 'Chränzli Manager-Rechte entziehen', cmGranted: 'Als Chilbi Manager festgelegt', cmRevoked: 'Chilbi Manager-Rechte entzogen', crmGranted: 'Als Chränzli Manager festgelegt', crmRevoked: 'Chränzli Manager-Rechte entzogen', grpActive: 'Aktivmitglieder', grpPassive: 'Passivmitglieder', mMakePassive: 'Zum Passivmitglied machen', mMakeActive: 'Zum Aktivmitglied machen', passiveSet: 'Als Passivmitglied festgelegt', activeSet: 'Als Aktivmitglied festgelegt', jsUpcoming: 'Anstehendes Jassmaster', jsPast: 'Vergangene Jassmasters'
    },

    en: {
      gvPdf: 'As PDF (A4)', gvEditOn: 'Edit content', gvEditOff: 'Stop editing', gvVisSec: 'General meeting', gvVisInfo: 'Sets who sees the AGM: nobody (not even admins), admins only, the board (and admins) or all active and passive members. Guests, candidates and supporters never see it.', trLogTitle: 'Latest transactions', trLogInfo: 'All sign-ups and withdrawals are recorded during the last 48 hours before training, or from the moment 14 people are signed up if that comes earlier.', trLogIn: 'signed up #{n}', trLogOut: 'withdrawn', trLogByAdmin: 'by admin', appVersion: 'App version', gvStateF: 'Status', gvStateFinal: 'Final', gvStateDraft: 'Draft (in progress)', gvStateProtocol: 'Minutes (grey background)', gvStateDraftSfx: ' (in progress)', gvStateHint: 'Final: normal. Draft: title in red with “(in progress)”. Minutes: shown dimmed.', gvVisAdmin: 'visible to admin', gvVisAdminNote: 'Visible to admins only.', gvVisNone: 'visible to nobody', gvVisBoard: 'visible to board', gvVisMembers: 'visible to all (active & passive)', gvVisNoneNote: 'Visible to nobody, only admins see this AGM.', gvVisEmpty: 'There is no AGM yet.', gvVisHint: 'Currently: {v}. Only the admin changes this in the admin console.', gvTextTitle: 'As text: 52 weeks from {from} to {to}', gvTextCopy: 'Copy text', gvTextCopied: 'Text copied', gvTextNone: 'No dates in these 52 weeks.', gvChapterF: 'Agenda item', gvChapterEdit: 'Edit agenda item', gvProtocol: 'Mark as minutes', gvProtocolHint: 'The minutes are shown slightly dimmed so they stand out from the rest of the documents.', gvProtoTag: 'Minutes', gvPhotoAdd: 'Add photo', gvPhotoDel: 'Remove photo', gvPhotoMoveL: 'Move forward', gvPhotoMoveR: 'Move back', gvUploading: 'Uploading …', gvUploadFail: 'The photo could not be uploaded.', gvMigrate: 'Move photos to protected storage', gvMigrateAsk: '{n} photos of this AGM will be copied from the app folder to protected storage. Afterwards you can delete the gv26-….jpg files from the repository. Continue?', gvMigrated: 'Photos moved: {n}', gvPhotosHint: 'Photos are resized and stored protected. Only signed-in members can see them.',
      pushTitle: 'Notifications', pushHint: 'Choose what you want push notifications for on this device. Default: none.', pushEvents: 'Events: new events and cancellations', pushTrainings: 'Trainings: cancellations and changes, plus sign-ups and withdrawals (from the 14th sign-up)', pushHoursLbl: 'Additionally all sign-ups and withdrawals in the last', pushH24: '24 h', pushH48: '48 h', pushDenied: 'Notifications are blocked in the browser. Allow them in the settings of your device or the website.', pushIos: 'On iPhone: first add the app to your Home Screen (Share, then "Add to Home Screen"), then choose your notifications here.', pushUnsupported: 'This device or browser does not support push notifications.', pushEnabledToast: 'Notifications saved', pushDisabledToast: 'Notifications turned off', pushFail: 'Notifications could not be saved.',
      boTag: 'Board', mMakeBo: 'Make board member', mRevokeBo: 'Remove board rights', boGranted: 'Set as board member', boRevoked: 'Board rights removed', gvEditMode: 'Edit content', gvEditHint: 'Editing is on: tap any content to change it.', gvCopy: 'Copy AGM', gvCopyAsk: 'The AGM {y} will be copied as AGM {n}, with all agenda items, reports and photos, but without reactions and comments. The date moves by 52 weeks. The copy is a draft.', gvCopied: 'Copied. The new AGM is a draft.', gvExists: 'There is already an AGM for the next year.', gvDelete: 'Delete AGM', gvDeleteAsk: 'Permanently delete the AGM {y} with all reports, reactions and comments?', gvDeleteRep: 'Permanently delete this report?', gvAddReport: 'Add report', gvMetaEdit: 'Title, date and place', gvTitleF: 'Title', gvSubtitle: 'Subtitle', gvSummary: 'Short info (shown when collapsed)', gvBody: 'Text', gvIntro: 'Invitation text', gvPublished: 'Published (visible to all members)', gvProgUntil: 'Annual programme until', gvAuthor: 'Author (active member)', gvNoAuthor: 'No member', gvAuthorName: 'Author as text (only if not a member)', gvPhotos: 'Photos', gvPhotoBad: 'Photos: file names only, like gv26-jass-1.jpg (letters, digits, - _ .)', gvFormat: 'Format: “## Subheading”, “> Line below the title”, “! Note”, “Name | Value”. A blank line starts a new paragraph.', gvFinKpi: 'Key figures (Name | Value, add | - for negative)', gvFinCols: 'Columns (separated by |)', gvFinRows: 'Table (“## Section” or Name | number | number | number, add | * for subtotal)', gvNeedTitle: 'Please fill in the title (and the text for reports).',
      navGv: 'AGM', gvTitle: 'AGM {y}', gvDraft: 'Draft, visible to the board only', gvInvite: 'Invitation', gvRsvp: 'Sign up or cancel in the “Events” tab, one week in advance at the latest ({date}). This applies to all participants, including the dinner.', gvToEvents: 'Go to Events', gvToJass: 'Go to “Jass”', gvProgramHint: 'The dates come from the “Events” tab, where you sign up. The calendar icon saves the date to your calendar.', gvNoProgram: 'No events are entered for this period.', gvMore: 'Read more', gvLess: 'Show less', gvPrev: 'Previous photo', gvNext: 'Next photo', gvClose: 'Close', gvPhotoAlt: 'Photo {i} of {n}: {t}', gvComment: 'Comment', gvComments1: '1 comment', gvCommentsN: '{n} comments', gvWrite: 'Write a comment …', gvSend: 'Send', gvNoComments: 'No comments yet.', gvReactAria: 'Reaction {e}',
      wd0: 'Sunday', wd1: 'Monday', wd2: 'Tuesday', wd3: 'Wednesday', wd4: 'Thursday', wd5: 'Friday', wd6: 'Saturday',
      navTrainings: 'Trainings', navEvents: 'Events', navAdmin: 'Admin', navProfile: 'Profile',
      titleTrainings: 'Trainingsplan', titleEvents: 'Vereinsanlässe',
      subTrainings: 'The next {n} sessions', subEvents: 'The following club events are planned', moreDates: 'More dates ({n})',
      emptyTrTitle: 'No trainings planned yet.', emptyTrAdmin: 'Set a training day in the “Manage” section.', emptyTrMember: 'The admins set the training days.',
      emptyEvTitle: 'No events planned at the moment.', emptyEvAdmin: 'Create an event in the “Manage” section.', emptyEvMember: 'The Event Managers create new events.',
      trainingWord: 'Training', trCancelled: 'Training cancelled', yes: 'Attending', no: 'Not attending', participants: 'Participants',
      ariaTr: '{yes} participants, {no} not attending. {action} participant list', ariaEv: '{n} participants. {action} participant list',
      listOpen: 'Open', listClose: 'Close',
      hYes: 'Attending ({n})', hNo: 'Not attending ({n})', hOpen: 'No reply yet ({n})', hSolo: 'Attending alone ({n})', hDuo: 'Attending as a pair ({n} members, {p} people)',
      nobody: 'Nobody', you: '(you)', cancelledTag: 'Cancelled', cancelledLow: 'cancelled', changedLow: 'changed',
      timePlace: '{time}, {place}', atTime: '{time}', calAdd: 'Add to calendar', solo: 'Alone', duo: 'As a pair',
      secRules: 'Standard training', secExtra: 'Extra training', secUpcoming: 'Manage training schedule', secEvents: 'Events', secMembers: 'Roles',
      addNew: 'Add new', addClose: 'Close form',
      adminTitle: 'Admin Console', titleCC: 'Chilbi & Chränzli', titleJass: 'Jass-Masters', adminSub: 'Visible to admins only', rulesIntro: 'Standard trainings per week',
      weekday: 'Weekday', time: 'Time', place: 'Place', date: 'Date', label: 'Title',
      phPlaceTraining: 'e.g. North School gym', addRule: 'Add training day',
      edit: 'Edit', remove: 'Remove', cancel: 'Cancel', reactivate: 'Reactivate', del: 'Delete', save: 'Save', dismiss: 'Discard', reset: 'Reset',
      editNote: 'Applies to this date only. Members’ replies are kept.',
      rulesEmpty: 'No fixed training day yet. Tap “+” to add one.',
      extraIntro: 'The following additional trainings are planned', extraEmpty: 'No additional trainings planned.', extraDefaultTitle: 'Extra training',
      phPlaceExtra: 'e.g. South sports ground', addExtra: 'Add another training', upcomingEmpty: 'No upcoming trainings.',
      phEventTitle: 'e.g. Fondue evening', phEventPlace: 'e.g. Club house', addEvent: 'Add event', rsvpRequired: 'Registration required',
      eventsEmpty: 'No events yet. Tap “+” to add the first one.',
      membersIntro: 'Tap the three dots next to a person to change roles, group, PIN, name or mobile number, or to delete them. Gear = admin, star = event manager, glass = Chilbi/Chränzli manager, trophy = Jass manager. Guests and Friends & Family only see limited content (see groups below).',
      memberAdd: 'Add member', fullName: 'First and last name', phone: 'Mobile number',
      memberAddNote: 'The member signs in with the mobile number only. The PIN is the last 6 digits.',
      selfAdmin: 'You are an admin. You cannot remove your own rights.', revokeAdmin: 'Remove admin rights: {name}', makeAdmin: 'Make admin: {name}',
      adminTag: 'Admin', resetPin: 'Reset PIN',
      profileTitle: 'Mein Profil', nameLabel: 'Name',
      installTitle: 'Install app', installHint: 'Add the app to your home screen and it opens in full screen.', installBtn: 'Add to home screen',
      installIos: 'In Safari, tap “Share” at the bottom, then “Add to Home Screen”. The app then opens in full screen.',
      nameChange: 'Change name', nameSave: 'Save name',
      pinChange: 'Change PIN', pinIntro: 'By default it is the last 6 digits of your mobile number. If you change the PIN, you must enter it when signing in.',
      pinNew: 'New PIN (6 digits)', pinSave: 'Save PIN', pinDefault: 'Reset to default PIN', logout: 'Sign out',
      language: 'Language', languageHint: 'Choose the language you would like to use the app in.', themeTitle: 'Appearance', themeHint: 'Choose how the app should look.', themeLight: 'Light', themeDark: 'Dark', themeAuto: 'Automatic',
      loginSub: 'App',
      loginLeadReg: 'Create your account with your name, mobile number and club code. Your PIN is the last 6 digits of your mobile number.',
      loginLead: 'Sign in with your mobile number.', pinOptional: 'PIN (only needed if you changed it)', clubCode: 'Club code',
      register: 'Create account', signIn: 'Sign in', haveAccount: 'I already have an account', firstTime: 'First time here? Create an account',
      setupTitle: 'Setup required', setupLead: 'The app is not connected to Supabase yet.',
      setupStep1: 'Open the file <code>config.js</code>.', setupStep2: 'Enter <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> from your Supabase project.',
      setupStep3: 'Reload the page.', setupNote: 'Detailed instructions are in the file README.md.',
      loading: 'Loading …',
      errFailed: 'That did not work', respWithdrawn: 'Reply withdrawn', youIn: 'You are attending', youOut: 'You are not attending', youSolo: 'You are coming alone', youDuo: 'You are coming as a pair',
      phoneCountry: 'Country', phoneOther: 'Other', phoneInvalid: 'Please enter a valid mobile number, e.g. 079 123 45 67.', alreadyReg: 'This number is already registered.',
      memberAdded: '{name} has been added.', addFailed: 'Could not add: {reason}', unknownError: 'Unknown error',
      authInvalid: 'Mobile number or PIN is incorrect. If you changed your PIN, enter it in the PIN field.',
      authAlready: 'This number is already registered. Please sign in.', authCode: 'Registration not possible. Please check the club code.',
      authRate: 'Too many attempts. Please wait a moment.', authPin: 'The PIN must consist of 6 digits.', authFail: 'Sign-in failed. Please try again.',
      pinExact: 'The PIN must consist of exactly 6 digits.', pinWeak: 'This PIN is too simple (e.g. 111111 or 123456) or the same as the default PIN. Please choose another one.', confirmEmailOff: 'Please turn off “Confirm email” in Supabase (see README).',
      loadFail: 'The data could not be loaded. Was the database schema executed?',
      calFile: 'Open the file “{name}” to save the event to your calendar.', calFail: 'The calendar entry could not be created.',
      pinResetOk: 'PIN reset to default', pinResetFail: 'The PIN could not be reset.',
      confirmDelRule: 'Remove this training day? All upcoming dates of the series will disappear.', ruleRemoved: 'Training day removed',
      confirmDelExtra: 'Delete this training?', extraDeleted: 'Training deleted',
      confirmDelEvent: 'Delete this event? All replies will be deleted as well.', eventDeleted: 'Event deleted',
      trReactivated: 'Training active again', trCancelledMsg: 'Training cancelled', evReactivated: 'Event active again', evCancelledMsg: 'Event cancelled',
      changeReset: 'Change reset', confirmResetPin: 'Reset the PIN of {name} to the last 6 digits of the mobile number?', thisMemberDat: 'this member',
      pinReset: 'PIN reset', confirmRemove: 'Remove {name}? The account and all replies will be deleted.', thisMember: 'This member', memberRemoved: 'Member removed',
      adminGranted: 'Admin rights granted', adminRevoked: 'Admin rights removed', nameSaved: 'Name saved', pinChanged: 'PIN changed', pinChangeFail: 'The PIN could not be changed.',
      ruleAdded: 'Training day added', extraAdded: 'Training added', eventAdded: 'Event added',
      ruleChanged: 'Training day changed', trChanged: 'Training changed', eventChanged: 'Event changed', langSaved: 'Language saved',
      guestTag: 'Guest', makeGuest: 'Set as guest: {name}', revokeGuest: 'Remove guest status: {name}', guestGranted: 'Set as guest', guestRevoked: 'Guest status removed',
      guestCheck: 'Add as guest (sees only trainings and profile)', guestInfo: 'You have guest access. You can see the trainings and your profile.', supporterInfo: 'You\'re part of Friends & Family. You see trainings, Jass, C&C and your profile.',
      memberTag: 'Member', emTag: 'Event manager', makeEm: 'Make event manager: {name}', revokeEm: 'Remove event manager rights: {name}', emGranted: 'Set as event manager', emRevoked: 'Event manager rights removed', confirmGuestLoses: '{name} has Admin, Event Manager, Chilbi Manager, Chränzli Manager or Jass Manager rights. This change removes those rights. Continue?', selfMember: 'You are a member. You cannot set yourself as a guest.', rolesTitle: 'Roles', emSub: 'Here you manage the events.', ccManagerSub: 'You manage C&C in the "C&C" tab.',
      infoShow: 'Show explanation', infoHide: 'Hide explanation',
      ok: 'OK',
      navCC: 'C&C', ccMembers: 'Members', ccGuests: 'Guests', ccOthers: 'Others', ccEmpty: 'No occasions yet.', ccNoDays: 'No days yet.', ccSummary: '{s} shifts · {r} roles', ccLvlAll: 'Chränzli and Chilbi', ccLvlEvent: 'Occasion', ccLvlDay: 'Day', ccLvlShift: 'Shift', ccLvlRole: 'Role', ccActions: 'Actions', ccAddEvent: 'Add occasion', ccAddDay: 'Add day', ccAddShift: 'Add shift', ccAddRole: 'Add role', ccChange: 'Edit', ccCopy: 'Copy', ccClose: 'Close', ccNameOpt: 'Name (optional)', ccStart: 'Start', ccEnd: 'End', ccActive: 'Active', ccPersons: 'Responsible', ccSearch: 'Search names', ccOtherPerson: 'Other person (not in the app)', ccAdd: 'Add', ccDidYouMean: 'Did you mean {name}?', ccNobody: 'Nobody yet', ccConfirmDel: 'Delete “{name}”? Everything under it will be deleted too.', ccConfirmDelRole: 'Delete “{name}”?', ccCopyEventNote: 'The copy starts inactive. All days move by 52 weeks so the weekdays stay the same.', ccCopyDayNote: 'Shifts and roles are copied with the people responsible.', ccSaved: 'Saved', ccCopied: 'Copied', ccDeleted: 'Deleted', ccNotInApp: '{name} is not in the app yet. With a mobile number you can add them as a guest.', ccAsGuest: 'Add as guest', ccNeedName: 'Enter a name.', ccSetup: 'C&C needs an updated database schema (supabase/schema.sql).', grpCandidate: 'Candidates', candidateTitle: 'Thank you for your interest', candidateMsg: 'Your request is being reviewed by our administrators.', mGroupActive: 'Make active member', mGroupPassive: 'Make passive member', mGroupGuest: 'Make guest', mGroupOther: 'Make Friends & Family', mGroupCandidate: 'Make candidate', groupChanged: 'Group changed', jsEternal: 'All-time ranking', jsEternalHint: 'Over the last {n} completed rounds', jsEternalRounds: '{n} rounds', jsEternalRound: '1 round', jsVisibleHint: 'Without the tick, only Admin and Jass Manager see this round', evEdit: 'Edit event', evTitleLbl: 'Title', evFrom: 'From', evTo: 'To', evEndBefore: 'The end is before the start.', evMissing: 'Enter title, date and time.', designTitle: 'Design', designHint: 'Choose the colours of the app.', design_light: 'White', design_standard: 'Blue', design_petrol: 'Petrol', design_holland: 'Orange', evManagePeople: 'Manage participants', grpSupporter: 'Friends & Family', mMakeSupporter: 'Make Friends & Family', supporterSet: 'Set to Friends & Family', pinLampOk: 'Has already changed their PIN', pinLampNo: 'Still using the default PIN', pinBannerMsg: 'Please set your personal PIN code to unlock all features.', pinBannerBtn: 'Set PIN now', ccPublicLabel: 'Visible to all active and passive members', ccPublicOn: 'C&C is now visible to everyone (read-only)', ccPublicOff: 'C&C is now visible only to Admin, Chilbi Manager and Chränzli Manager again', ccCopySuffix: 'copy', ccLegendMe: 'Me', ccPrint: 'Share as PDF', jsPrint: 'Jassmasters overview as PDF', ccPdfBuilding: 'Creating PDF…', ccPdfFailed: 'The PDF could not be created.',
      mMakeAdmin: 'Make admin', mRevokeAdmin: 'Remove admin rights', mMakeEm: 'Make event manager', mRevokeEm: 'Remove event manager rights', mMakeGuest: 'Set as guest', mMakeMember: 'Set as member', mEdit: 'Change name and mobile number', mEditNote: 'With a new number the default PIN applies again: the last 6 digits of the new number.', mSaved: 'Saved', mDelete: 'Delete member', mPhoneTaken: 'This mobile number already belongs to someone else.',
      jsLocked: 'Locked – tap to unlock', jsUnlocked: 'Unlocked – tap to lock', jsEditRow: 'Edit entry', jsRankDiff: 'Difference',
      navJass: 'Jass', jsParticipants: 'Players', jsSchedule: 'Schedule', jsRanking: 'Daily ranking', jsRound: 'Round {n}', jsTable: 'Table {t}', jsTeam1: 'Team I', jsTeam2: 'Team II', jsPlayer: 'Player {n}', jsFree: 'open', jsEmpty: 'No Jassmasters yet.', jsNoDays: 'No date yet.', jsAddSeries: 'Add Jassmasters', jsAddDay: 'Add date', jsLvlSeries: 'Jassmasters', jsLvlDay: 'Jass day', jsPick: 'Choose player {n}', jsClear: 'Clear seat', jsAlready: 'already player {n}', jsPoints: 'Points', jsGames: '{n} games', jsPtsAbbr: 'pts', jsGame: '{n} game', jsNoPoints: 'No points entered yet.', jsHint: 'Enter the points for the winning team. The other team automatically gets them as negative points.', jsSetup: 'Jass needs an updated database schema (supabase/schema.sql).', jsFinish: 'Finish Jassmaster', jsConfirmFinish: 'Finish "{name}"? It will move to Past Jassmasters and will only be visible as a ranking afterwards. Continue?', jsFinished: 'Marked as finished', jsEditRanking: 'Edit ranking', jsRankName: 'Name', jsRankPoints: 'Points', jsAddRow: 'Add row', jsNoRows: 'Nobody entered yet.',
      shPlay: 'Play here', shPlayStop: 'Close player',
      shHint: 'Note', shHintCheck: 'Mark as note (listed before the acts)',
      shVideo: 'Video', shYoutube: 'YouTube link', shOpenYoutube: 'Open on YouTube', shVideoBad: 'Please enter a YouTube link (https://www.youtube.com/… or https://youtu.be/…).',
      shMusic: 'Music', shSpotify: 'Spotify link', shOpenSpotify: 'Open in Spotify', shMusicBad: 'Please enter a Spotify link (https://open.spotify.com/…).',
      navShow: 'Show', titleShow: 'Chränzli Drehbuch', dirTag: 'Director', actTag: 'Actor', mMakeDir: 'Make director', mRevokeDir: 'Revoke director rights', mMakeActor: 'Make actor', mRevokeActor: 'Revoke actor role', dirGranted: 'Set as director', dirRevoked: 'Director rights revoked', actorGranted: 'Set as actor', actorRevoked: 'Actor role revoked', shEmpty: 'No acts yet.', shSetup: 'The Show tables are missing. Please run PRD_v97_show.sql in the SQL Editor.', shAddAct: 'Add act', shAddScene: 'Add scene', shAddPart: 'Add role', shLvlAll: 'Show', shLvlAct: 'Act', shLvlScene: 'Scene', shLvlPart: 'Role', shDesc: 'Description', shNoScenes: 'No scenes yet.', shSummary: '{r} roles', shVisible: 'Plan visible to actors',
      jmTag: 'Jass Manager', mMakeJm: 'Make Jass Manager', mRevokeJm: 'Revoke Jass Manager rights', jmGranted: 'Set as Jass Manager', jmRevoked: 'Jass Manager rights revoked', cmTag: 'Chilbi Manager', crmTag: 'Chränzli Manager', mMakeCm: 'Make Chilbi Manager', mRevokeCm: 'Revoke Chilbi Manager rights', mMakeCrm: 'Make Chränzli Manager', mRevokeCrm: 'Revoke Chränzli Manager rights', cmGranted: 'Set as Chilbi Manager', cmRevoked: 'Chilbi Manager rights revoked', crmGranted: 'Set as Chränzli Manager', crmRevoked: 'Chränzli Manager rights revoked', grpActive: 'Active members', grpPassive: 'Passive members', mMakePassive: 'Make passive member', mMakeActive: 'Make active member', passiveSet: 'Set as passive member', activeSet: 'Set as active member', jsUpcoming: 'Upcoming Jassmaster', jsPast: 'Past Jassmasters'
    },

    gsw: {
      gvPdf: 'Als PDF (A4)', gvEditOn: 'Inhalt bearbeite', gvEditOff: 'Bearbeite beände', gvVisSec: 'Generalversammlig', gvVisInfo: 'Leit fescht, wär d GV gseht: niemer (au d Admins nöd), nume d Admins, de Vorstand (und d Admins) oder alli Aktiv- und Passivmitglieder. Gäscht, Kandidate und Supporter gsehnd d GV nie.', trLogTitle: 'Letschti Transaktione', trLogInfo: 'Alli Aamäldige und Abmäldige i de letschte 48 Stund vor em Training werded festghalte, oder ab em Momänt, wo 14 Lüüt aagmäldet sind, wänn das früecher isch.', trLogIn: 'aagmäldet #{n}', trLogOut: 'abgmäldet', trLogByAdmin: 'dur Admin', appVersion: 'Version vo de App', gvStateF: 'Zuestand', gvStateFinal: 'Final', gvStateDraft: 'Draft (i Arbeit)', gvStateProtocol: 'Protokoll (grau hinterlegt)', gvStateDraftSfx: ' (i Arbeit)', gvStateHint: 'Final: normal. Draft: Titel rot mit «(i Arbeit)». Protokoll: abdunklet aazeigt.', gvVisAdmin: 'sichtbar für Admin', gvVisAdminNote: 'Nume für Admins sichtbar.', gvVisNone: 'sichtbar für niemer', gvVisBoard: 'sichtbar für de Vorstand', gvVisMembers: 'sichtbar für alli (Aktiv & Passiv)', gvVisNoneNote: 'Für niemer sichtbar, nume Admins gsehnd die GV.', gvVisEmpty: 'Es gits no kei GV.', gvVisHint: 'Jetzt: {v}. Das ändered nume d Admins i de Admin-Konsole.', gvTextTitle: 'Als Text: 52 Wuche ab {from} bis {to}', gvTextCopy: 'Text kopiere', gvTextCopied: 'Text kopiert', gvTextNone: 'Kei Termin i dene 52 Wuche.', gvChapterF: 'Traktandum', gvChapterEdit: 'Traktandum bearbeite', gvProtocol: 'Als Protokoll kennzeichne', gvProtocolHint: 'S Protokoll wird liecht abdunklet aazeigt und hebt sich so vo de andere Underlage ab.', gvProtoTag: 'Protokoll', gvPhotoAdd: 'Foti hinzuefüege', gvPhotoDel: 'Foti entfärne', gvPhotoMoveL: 'Nach vorne', gvPhotoMoveR: 'Nach hinde', gvUploading: 'Wird ufeglade …', gvUploadFail: 'S Foti het nöd chöne ufeglade wärde.', gvMigrate: 'Foti is gschützt Spychere übernäh', gvMigrateAsk: '{n} Foti vo dere GV werded us em App-Ordner is gschützt Spychere kopiert. Nachhär chasch d Dateie gv26-….jpg im Repo lösche. Wiiter?', gvMigrated: 'Foti übernoo: {n}', gvPhotosHint: 'D Foti werded verchleineret und gschützt gspycheret. Nume aagmäldeti Mitglieder gsehnd si.',
      pushTitle: 'Mitteilige', pushHint: 'Wähl, für was du Push-Nachrichte uf dem Gerät wotsch. Standard: kei Mitteilige.', pushEvents: 'Events: neui Events und Absage', pushTrainings: 'Trainings: Absage und Verschiebige sowie Zue- und Absage (ab de 14. Zuesag)', pushHoursLbl: 'Zuesätzlich alli Zue- und Absage i de letschte', pushH24: '24 Std.', pushH48: '48 Std.', pushDenied: 'D Mitteilige sind im Browser blockiert. Erlaub si i de Iistellige vom Gerät oder vo de Website.', pushIos: 'Uf em iPhone: Leg d App zerscht uf de Home-Bildschirm (Teile, denn «Zum Home-Bildschirm») und wähl d Mitteilige danach do.', pushUnsupported: 'Das Gerät oder dä Browser understützt kei Push-Mitteilige.', pushEnabledToast: 'Mitteilige gspeicheret', pushDisabledToast: 'Mitteilige usgschaltet', pushFail: 'D Mitteilige hend nöd chöne gspeicheret werde.',
      boTag: 'Vorstand', mMakeBo: 'Zum Vorstand mache', mRevokeBo: 'Vorstand-Rächt entzieh', boGranted: 'Als Vorstand festgleit', boRevoked: 'Vorstand-Rächt entzoge', gvEditMode: 'Inhält bearbeite', gvEditHint: 'Bearbeite isch aktiv: Tipp uf en Inhalt, zum en ändere.', gvCopy: 'GV kopiere', gvCopyAsk: 'D GV {y} wird als GV {n} kopiert, mit allne Traktande, Bricht und Foti, aber ohni Reaktione und Kommentär. S Datum rutscht um 52 Wuche wiiter. D Kopie isch en Entwurf.', gvCopied: 'Kopiert. D neu GV isch en Entwurf.', gvExists: 'Fürs nächscht Jahr gits scho e GV.', gvDelete: 'GV lösche', gvDeleteAsk: 'D GV {y} mit allne Bricht, Reaktione und Kommentär ändgültig lösche?', gvDeleteRep: 'Dä Bricht ändgültig lösche?', gvAddReport: 'Bricht hinzuefüege', gvMetaEdit: 'Titel, Datum und Ort', gvTitleF: 'Titel', gvSubtitle: 'Untertitel', gvSummary: 'Churzinfo (gsehsch, wänn zuegchlappt)', gvBody: 'Text', gvIntro: 'Iladigstext', gvPublished: 'Veröffentlicht (für alli Mitglieder sichtbar)', gvProgUntil: 'Jahresprogramm bis', gvAuthor: 'Autor (Aktivmitglied)', gvNoAuthor: 'Kei Mitglied', gvAuthorName: 'Autor als Text (nume wänn kei Mitglied)', gvPhotos: 'Foti', gvPhotoBad: 'Foti: nume Dateinäme wie gv26-jass-1.jpg (Buechstabe, Ziffere, - _ .)', gvFormat: 'Format: «## Zwüschetitel», «> Zile under em Titel», «! Hiwis», «Name | Wert». E Leerzile fangt en neue Abschnitt aa.', gvFinKpi: 'Kennzahle (Name | Wert, am Schluss | - für negativ)', gvFinCols: 'Spalte (mit | trennt)', gvFinRows: 'Tabälle («## Abschnitt» oder Name | Zahl | Zahl | Zahl, am Schluss | * für Zwüschesumme)', gvNeedTitle: 'Bitte Titel (und bi Bricht de Text) usfülle.',
      navGv: 'GV', gvTitle: 'GV {y}', gvDraft: 'Entwurf, nume für de Vorstand sichtbar', gvInvite: 'Iladig', gvRsvp: 'Aa- oder abmälde im Dialog «Events», bis ei Wuche vorher ({date}). Das gilt für alli Teilnähmer, au fürs Znacht.', gvToEvents: 'Zu de Events', gvToJass: 'Zum Dialog «Jass»', gvProgramHint: 'D Termin chömed us em Dialog «Events», det mäldisch dich aa. S Kaländer-Symbol speicheret de Termin i dim Kaländer.', gvNoProgram: 'Im Ziitruum sind kei Events igtrait.', gvMore: 'Wiiterlääse', gvLess: 'Weniger aazeige', gvPrev: 'Vorigs Foti', gvNext: 'Nächschts Foti', gvClose: 'Zuemache', gvPhotoAlt: 'Foti {i} vo {n}: {t}', gvComment: 'Kommentiere', gvComments1: '1 Kommentar', gvCommentsN: '{n} Kommentär', gvWrite: 'Kommentar schriibe …', gvSend: 'Sände', gvNoComments: 'Na kei Kommentär.', gvReactAria: 'Reaktion {e}',
      wd0: 'Sunntig', wd1: 'Mäntig', wd2: 'Ziischtig', wd3: 'Mittwuch', wd4: 'Dunnschtig', wd5: 'Fritig', wd6: 'Samschtig',
      navTrainings: 'Trainings', navEvents: 'Events', navAdmin: 'Admin', navProfile: 'Profil',
      titleTrainings: 'Trainingsplan', titleEvents: 'Vereinsanlässe',
      subTrainings: 'Di nächschte {n} Termin', subEvents: 'Die Vereinsaalässe sind planet', moreDates: 'Wiitere Termin ({n})',
      emptyTrTitle: 'Es sind no kei Trainings planet.', emptyTrAdmin: 'Leg im Bereich «Verwalte» en Trainingstag fescht.', emptyTrMember: 'D Admins leged d Trainingstäg fescht.',
      emptyEvTitle: 'Im Momänt sind kei Events planet.', emptyEvAdmin: 'Leg im Bereich «Verwalte» en Event aa.', emptyEvMember: 'D Event Manager leged neui Events aa.',
      trainingWord: 'Training', trCancelled: 'Training abgsait', yes: 'Debii', no: 'Nöd debii', participants: 'Teilnehmer',
      ariaTr: '{yes} Teilnehmer, {no} nöd debii. Teilnehmerlischte {action}', ariaEv: '{n} Teilnehmer. Teilnehmerlischte {action}',
      listOpen: 'ufmache', listClose: 'zuemache',
      hYes: 'Debii ({n})', hNo: 'Nöd debii ({n})', hOpen: 'No kei Antwort ({n})', hSolo: 'Elei debii ({n})', hDuo: 'Zu zwöit debii ({n} Mitglieder, {p} Persone)',
      nobody: 'Niemer', you: '(du)', cancelledTag: 'Abgsait', cancelledLow: 'abgsait', changedLow: 'gänderet',
      timePlace: '{time} Uhr, {place}', atTime: '{time} Uhr', calAdd: 'Im Kaländer spichere', solo: 'Elei', duo: 'Zu zwöit',
      secRules: 'Standard Training', secExtra: 'Extra Training', secUpcoming: 'Trainingsplan verwalte', secEvents: 'Events', secMembers: 'Rolle',
      addNew: 'Neu erfasse', addClose: 'Erfassig zuemache',
      adminTitle: 'Admin Console', titleCC: 'Chilbi & Chränzli', titleJass: 'Jass-Masters', adminSub: 'Nur für Admins sichtbar', rulesIntro: 'Standard-Trainings pro Wuche',
      weekday: 'Wuchetag', time: 'Uhrziit', place: 'Ort', date: 'Datum', label: 'Bezeichnig',
      phPlaceTraining: 'z. B. Turnhalle Schuelhuus Nord', addRule: 'Trainingstag hinzuefüege',
      edit: 'Bearbeite', remove: 'Entferne', cancel: 'Absäge', reactivate: 'Reaktivierä', del: 'Lösche', save: 'Spichere', dismiss: 'Abbräche', reset: 'Zruggsetze',
      editNote: 'Gilt nur für dä Termin. D Antworte vo de Mitglieder bliibed erhalte.',
      rulesEmpty: 'No kein fester Trainingstag. Tipp uf «+», zum eine z erfasse.',
      extraIntro: 'Die zuesätzliche Trainings sind planet', extraEmpty: 'Kei zuesätzlichi Trainings planet.', extraDefaultTitle: 'Zuesatztraining',
      phPlaceExtra: 'z. B. Sportaalag Süd', addExtra: 'Es wiiters Training hinzuefüege', upcomingEmpty: 'Kei kommendi Trainings.',
      phEventTitle: 'z. B. Fondue-Plausch', phEventPlace: 'z. B. Vereinshuus', addEvent: 'Event hinzuefüege', rsvpRequired: 'Aamäldig erforderlich',
      eventsEmpty: 'No kei Events. Tipp uf «+», zum de erscht z erfasse.',
      membersIntro: 'Tipp bi enere Person uf di drei Pünkt, zum Rolle, Gruppe, PIN, Name oder Handynummere z ändere oder si z lösche. Zahnrad = Admin, Stern = Event Manager, Glas = Chilbi/Chränzli Manager, Pokal = Jass Manager. Gescht und Friends & Family gseehnd nur igschränkti Inhalt (lueg Gruppe unde).',
      memberAdd: 'Mitglied hinzuefüege', fullName: 'Vor- und Nachname', phone: 'Handynummere',
      memberAddNote: 'S Mitglied meldet sich nur mit de Handynummere aa. De PIN sind di letschte 6 Ziffere.',
      selfAdmin: 'Du bisch Admin. Du chasch dir d Rächt nöd säber entzieh.', revokeAdmin: 'Admin-Rächt entzieh: {name}', makeAdmin: 'Zum Admin mache: {name}',
      adminTag: 'Admin', resetPin: 'PIN zruggsetze',
      profileTitle: 'Mein Profil', nameLabel: 'Name',
      installTitle: 'App installiere', installHint: 'Leg d App uf dä Startbildschirm, denn öffnet si sich im Vollbild.', installBtn: 'Uf em Startbildschirm spichere',
      installIos: 'Tipp z underscht i Safari uf «Teile» und denn uf «Zum Home-Bildschirm». Danach öffnet sich d App im Vollbild.',
      nameChange: 'Name ändere', nameSave: 'Name spichere',
      pinChange: 'PIN ändere', pinIntro: 'Standardmässig sind es di letschte 6 Ziffere vo dinere Handynummere. Wenn du de PIN änderisch, muesch en bim Aamälde igäh.',
      pinNew: 'Neue PIN (6 Ziffere)', pinSave: 'PIN spichere', pinDefault: 'Uf Standard-PIN zruggsetze', logout: 'Abmälde',
      language: 'Sprach', languageHint: 'Wähl d Sprach, i dere du d App bruuche wottsch.', themeTitle: 'Dorstellig', themeHint: 'Wähl, wie d App usgseh söll.', themeLight: 'Häll', themeDark: 'Dunkel', themeAuto: 'Automatisch',
      loginSub: 'App',
      loginLeadReg: 'Erstell dis Konto mit Name, Handynummere und Vereinscode. Din PIN sind di letschte 6 Ziffere vo dinere Handynummere.',
      loginLead: 'Mäld di mit dinere Handynummere aa.', pinOptional: 'PIN (nur nötig, wenn du en gänderet hesch)', clubCode: 'Vereinscode',
      register: 'Konto erstelle', signIn: 'Aamälde', haveAccount: 'Ich han scho es Konto', firstTime: 'Zum erschte Mal da? Konto erstelle',
      setupTitle: 'Iirichtig nötig', setupLead: 'D App isch no nöd mit Supabase verbunde.',
      setupStep1: 'Öffne d Datei <code>config.js</code>.', setupStep2: 'Träg <code>SUPABASE_URL</code> und <code>SUPABASE_ANON_KEY</code> us dim Supabase-Projekt ii.',
      setupStep3: 'Lad d Site neu.', setupNote: 'D genau Aaleitig staht i de Datei README.md.',
      loading: 'Am Lade …',
      errFailed: 'Das hät nöd klappt', respWithdrawn: 'Antwort zruggzoge', youIn: 'Du bisch debii', youOut: 'Du bisch nöd debii', youSolo: 'Du chunsch elei', youDuo: 'Du chunsch zu zwöit',
      phoneCountry: 'Land', phoneOther: 'Anderi', phoneInvalid: 'Bitte gib e gültigi Handynummere ii, z. B. 079 123 45 67.', alreadyReg: 'Die Nummere isch scho registriert.',
      memberAdded: '{name} isch hinzuegfüegt worde.', addFailed: 'Hinzuefüege nöd möglich: {reason}', unknownError: 'Unbekannte Fähler',
      authInvalid: 'Handynummere oder PIN stimmt nöd. Wenn du din PIN gänderet hesch, träg en im Fäld PIN ii.',
      authAlready: 'Die Nummere isch scho registriert. Bitte mäld di aa.', authCode: 'Registrierig nöd möglich. Bitte prüef de Vereinscode.',
      authRate: 'Zviel Versüech. Bitte wart en Momänt.', authPin: 'De PIN muess us 6 Ziffere bestah.', authFail: 'Aamäldig fählgschlage. Bitte probier s nomal.',
      pinExact: 'De PIN muess us gnau 6 Ziffere bestah.', pinWeak: 'De PIN isch z eifach (z. B. 111111 oder 123456) oder gliich wie dr Standard-PIN. Bitte wähl en andere.', confirmEmailOff: 'Bitte schalt i Supabase «Confirm email» ab (gsehsch README).',
      loadFail: 'D Date hend nöd chöne glade werde. Isch s Datebank-Schema uusgfüehrt worde?',
      calFile: 'Öffne d Datei «{name}», zum de Termin im Kaländer z spichere.', calFail: 'De Kaländereintrag hät nöd chöne erstellt werde.',
      pinResetOk: 'PIN uf Standard zruggsetzt', pinResetFail: 'De PIN hät nöd chöne zruggsetzt werde.',
      confirmDelRule: 'Dä Trainingstag entferne? Alli kommende Termin vo dere Serie verschwindet.', ruleRemoved: 'Trainingstag entfernt',
      confirmDelExtra: 'Das Training lösche?', extraDeleted: 'Training glöscht',
      confirmDelEvent: 'Dä Event lösche? Au alli Antworte wärded glöscht.', eventDeleted: 'Event glöscht',
      trReactivated: 'Training wieder aktiv', trCancelledMsg: 'Training abgsait', evReactivated: 'Event wieder aktiv', evCancelledMsg: 'Event abgsait',
      changeReset: 'Änderig zruggsetzt', confirmResetPin: 'De PIN vo {name} uf di letschte 6 Ziffere vo de Handynummere zruggsetze?', thisMemberDat: 'däm Mitglied',
      pinReset: 'PIN zruggsetzt', confirmRemove: '{name} entferne? S Konto und alli Antworte wärded glöscht.', thisMember: 'Das Mitglied', memberRemoved: 'Mitglied entfernt',
      adminGranted: 'Admin-Rächt vergäh', adminRevoked: 'Admin-Rächt entzoge', nameSaved: 'Name gspeicheret', pinChanged: 'PIN gänderet', pinChangeFail: 'De PIN hät nöd chöne gänderet werde.',
      ruleAdded: 'Trainingstag hinzuegfüegt', extraAdded: 'Training hinzuegfüegt', eventAdded: 'Event hinzuegfüegt',
      ruleChanged: 'Trainingstag gänderet', trChanged: 'Training gänderet', eventChanged: 'Event gänderet', langSaved: 'Sprach gspeicheret',
      guestTag: 'Gascht', makeGuest: 'Als Gascht festlege: {name}', revokeGuest: 'Gascht-Status entferne: {name}', guestGranted: 'Als Gascht festgleit', guestRevoked: 'Gascht-Status entfernt',
      guestCheck: 'Als Gascht hinzuefüege (gseht nur Trainings und Profil)', guestInfo: 'Du hesch en Gascht-Zuegang. Du gsehsch d Trainings und dis Profil.', supporterInfo: 'Du bisch bi Friends & Family. Du gsehsch d Trainings, de Jass, C&C und dis Profil.',
      memberTag: 'Mitglied', emTag: 'Event Manager', makeEm: 'Zum Event Manager mache: {name}', revokeEm: 'Event Manager-Rächt entzieh: {name}', emGranted: 'Als Event Manager festgleit', emRevoked: 'Event Manager-Rächt entzoge', confirmGuestLoses: '{name} het Admin-, Event Manager-, Chilbi Manager-, Chränzli Manager- oder Jass Manager-Rächt. Die Änderig nimmt die Rächt wäg. Wiitermache?', selfMember: 'Du bisch Mitglied. Du chasch di nöd säber zum Gascht mache.', rolesTitle: 'Rolle', emSub: 'Do verwaltisch du d Events.', ccManagerSub: 'C&C verwaltisch im Reiter «C&C».',
      infoShow: 'Erklärig aazeige', infoHide: 'Erklärig verstecke',
      ok: 'OK',
      navCC: 'C&C', ccMembers: 'Mitglieder', ccGuests: 'Gäscht', ccOthers: 'Anderi', ccEmpty: 'No kei Aalässe erfasst.', ccNoDays: 'No kei Täg erfasst.', ccSummary: '{s} Schichte · {r} Rolle', ccLvlAll: 'Chränzli und Chilbi', ccLvlEvent: 'Aalass', ccLvlDay: 'Tag', ccLvlShift: 'Schicht', ccLvlRole: 'Rolle', ccActions: 'Aktione', ccAddEvent: 'Aalass hinzuefüege', ccAddDay: 'Tag hinzuefüege', ccAddShift: 'Schicht hinzuefüege', ccAddRole: 'Rolle hinzuefüege', ccChange: 'Ändere', ccCopy: 'Kopiere', ccClose: 'Schliesse', ccNameOpt: 'Name (freiwillig)', ccStart: 'Start', ccEnd: 'Änd', ccActive: 'Aktiv', ccPersons: 'Verantwortlichi', ccSearch: 'Näme sueche', ccOtherPerson: 'Anderi Person (nöd i de App)', ccAdd: 'Hinzuefüege', ccDidYouMean: 'Meinsch {name}?', ccNobody: 'No niemer', ccConfirmDel: '«{name}» lösche? Alles, wo drunder erfasst isch, wird au glöscht.', ccConfirmDelRole: '«{name}» lösche?', ccCopyEventNote: 'D Kopie isch zerscht inaktiv. Alli Täg wärded um 52 Wuche verschobe, damit d Wuchetäg glich bliibed.', ccCopyDayNote: 'Schichte und Rolle wärded mit de Verantwortliche kopiert.', ccSaved: 'Gspeicheret', ccCopied: 'Kopiert', ccDeleted: 'Glöscht', ccNotInApp: '{name} isch no nöd i de App. Mit de Handynummere chasch d Person als Gascht hinzuefüege.', ccAsGuest: 'Als Gascht hinzuefüege', ccNeedName: 'Gib en Name ii.', ccSetup: 'Für C&C muess s Datebank-Schema aktualisiert wärde (supabase/schema.sql).', grpCandidate: 'Kandidate', candidateTitle: 'Merci vielmal für dis Interässe', candidateMsg: 'Dini Aafrog wird vo üsne Administratore prüeft.', mGroupActive: 'Zum Aktivmitglied mache', mGroupPassive: 'Zum Passivmitglied mache', mGroupGuest: 'Zum Gascht mache', mGroupOther: 'Zu Friends & Family mache', mGroupCandidate: 'Zum Kandidat mache', groupChanged: 'Gruppe gänderet', jsEternal: 'Ewigi Rangliste', jsEternalHint: 'Über di letschte {n} fertige Runde', jsEternalRounds: '{n} Runde', jsEternalRound: '1 Rundi', jsVisibleHint: 'Ohni Häkli gseht nur de Admin und de Jass Manager di Rundi', evEdit: 'Event bearbeite', evTitleLbl: 'Titel', evFrom: 'Vo', evTo: 'Bis', evEndBefore: 'S Änd isch vor em Start.', evMissing: 'Titel, Datum und Zyt aagäh.', designTitle: 'Design', designHint: 'Wähl d Farbe vo de App.', design_light: 'Wiiss', design_standard: 'Blue', design_petrol: 'Petrol', design_holland: 'Orange', evManagePeople: 'Teilnehmer verwalte', grpSupporter: 'Friends & Family', mMakeSupporter: 'Zu Friends & Family mache', supporterSet: 'Als Friends & Family iigordnet', pinLampOk: 'Het de PIN scho gänderet', pinLampNo: 'Bruucht no de Standard-PIN', pinBannerMsg: 'Setz din persönlich PIN-Code, zum alli Funktione freizschalte.', pinBannerBtn: 'PIN jetzt setze', ccPublicLabel: 'Sichtbar für alli Aktiv- und Passivmitglieder', ccPublicOn: 'C&C isch jetzt für alli sichtbar (nur zum Lääse)', ccPublicOff: 'C&C isch jetzt wieder nur für Admin, Chilbi Manager und Chränzli Manager sichtbar', ccCopySuffix: 'Kopie', ccLegendMe: 'Ich', ccPrint: 'PDF teile', jsPrint: 'Jassmasters-Überblick als PDF', ccPdfBuilding: 'PDF wird erstellt…', ccPdfFailed: 'PDF het nöd chönne erstellt werde.',
      mMakeAdmin: 'Zum Admin mache', mRevokeAdmin: 'Admin-Rächt entzieh', mMakeEm: 'Zum Event Manager mache', mRevokeEm: 'Event Manager-Rächt entzieh', mMakeGuest: 'Zum Gascht mache', mMakeMember: 'Zum Mitglied mache', mEdit: 'Name und Handynummere ändere', mEditNote: 'Mit enere neue Handynummere gilt wieder de Standard-PIN: di letschte 6 Ziffere vo de neue Nummere.', mSaved: 'Gspeicheret', mDelete: 'Mitglied lösche', mPhoneTaken: 'Die Handynummere ghört scho öpper anderem.',
      jsLocked: 'Gsperrt – tippe zum Entsperre', jsUnlocked: 'Entsperrt – tippe zum Sperre', jsEditRow: 'Iitrag bearbeite', jsRankDiff: 'Differänz',
      navJass: 'Jass', jsParticipants: 'Teilnehmer', jsSchedule: 'Spielplan', jsRanking: 'Tagesrangliste', jsRound: 'Rundi {n}', jsTable: 'Tisch {t}', jsTeam1: 'Team I', jsTeam2: 'Team II', jsPlayer: 'Spieler {n}', jsFree: 'frei', jsEmpty: 'No kei Jassmasters erfasst.', jsNoDays: 'No kei Datum erfasst.', jsAddSeries: 'Jassmasters hinzuefüege', jsAddDay: 'Datum hinzuefüege', jsLvlSeries: 'Jassmasters', jsLvlDay: 'Jasstag', jsPick: 'Spieler {n} uswähle', jsClear: 'Platz freigäh', jsAlready: 'scho Spieler {n}', jsPoints: 'Pünkt', jsGames: '{n} Spiel', jsPtsAbbr: 'Pkt.', jsGame: '{n} Spiel', jsNoPoints: 'No kei Pünkt erfasst.', jsHint: 'Träg d Pünkt bim Siegerteam ii. S ander Team überchunnt si automatisch negativ.', jsSetup: 'Für Jass muess s Datebank-Schema aktualisiert wärde (supabase/schema.sql).', jsFinish: 'Jassmaster abschliesse', jsConfirmFinish: '«{name}» abschliesse? Chunt under Vergangeni Jassmasters und isch denn nur no als Rangliste sichtbar. Wiitermache?', jsFinished: 'Als abgschlosse markiert', jsEditRanking: 'Rangliste bearbeite', jsRankName: 'Name', jsRankPoints: 'Pünkt', jsAddRow: 'Zile dezuefüege', jsNoRows: 'No niemer erfasst.',
      shPlay: 'Do abspile', shPlayStop: 'Player zuemache',
      shHint: 'Hiwis', shHintCheck: 'Als Hiwis markiere (staht vor de Akt)',
      shVideo: 'Video', shYoutube: 'YouTube-Link', shOpenYoutube: 'Uf YouTube uuftue', shVideoBad: 'Bitte en YouTube-Link aagäh (https://www.youtube.com/… oder https://youtu.be/…).',
      shMusic: 'Musig', shSpotify: 'Spotify-Link', shOpenSpotify: 'In Spotify uuftue', shMusicBad: 'Bitte en Spotify-Link aagäh (https://open.spotify.com/…).',
      navShow: 'Show', titleShow: 'Chränzli Drehbuch', dirTag: 'Regisseur', actTag: 'Schauspiler', mMakeDir: 'Zum Regisseur mache', mRevokeDir: 'Regisseur-Rächt wäg nää', mMakeActor: 'Zum Schauspiler mache', mRevokeActor: 'Schauspiler-Rolle wäg nää', dirGranted: 'Als Regisseur festgleit', dirRevoked: 'Regisseur-Rächt wäggnoh', actorGranted: 'Als Schauspiler festgleit', actorRevoked: 'Schauspiler-Rolle wäggnoh', shEmpty: 'No kei Akt erfasst.', shSetup: 'D Show-Tabälle fehle. Bitte PRD_v97_show.sql im SQL Editor usfüehre.', shAddAct: 'Akt hinzuefüege', shAddScene: 'Szene hinzuefüege', shAddPart: 'Rolle hinzuefüege', shLvlAll: 'Show', shLvlAct: 'Akt', shLvlScene: 'Szene', shLvlPart: 'Rolle', shDesc: 'Beschrybig', shNoScenes: 'No kei Szene erfasst.', shSummary: '{r} Rolle', shVisible: 'Planig für Schauspiler sichtbar',
      jmTag: 'Jass Manager', mMakeJm: 'Zum Jass Manager mache', mRevokeJm: 'Jass Manager-Rächt wäg nää', jmGranted: 'Als Jass Manager festgleit', jmRevoked: 'Jass Manager-Rächt wäggnoh', cmTag: 'Chilbi Manager', crmTag: 'Chränzli Manager', mMakeCm: 'Zum Chilbi Manager mache', mRevokeCm: 'Chilbi Manager-Rächt wäg nää', mMakeCrm: 'Zum Chränzli Manager mache', mRevokeCrm: 'Chränzli Manager-Rächt wäg nää', cmGranted: 'Als Chilbi Manager festgleit', cmRevoked: 'Chilbi Manager-Rächt wäggnoh', crmGranted: 'Als Chränzli Manager festgleit', crmRevoked: 'Chränzli Manager-Rächt wäggnoh', grpActive: 'Aktivmitglieder', grpPassive: 'Passivmitglieder', mMakePassive: 'Zum Passivmitglied mache', mMakeActive: 'Zum Aktivmitglied mache', passiveSet: 'Als Passivmitglied festgleit', activeSet: 'Als Aktivmitglied festgleit', jsUpcoming: 'Aastaahts Jassmaster', jsPast: 'Vergangeni Jassmasters'
    },


    uk: {
      gvPdf: 'У форматі PDF (A4)', gvEditOn: 'Редагувати вміст', gvEditOff: 'Завершити редагування', gvVisSec: 'Загальні збори', gvVisInfo: 'Визначає, хто бачить збори: ніхто (навіть адміністратори), лише адміністратори, правління (й адміністратори) або всі активні та пасивні члени. Гості, кандидати й прихильники ніколи їх не бачать.', trLogTitle: 'Останні операції', trLogInfo: 'Фіксуються всі записи й відмови протягом останніх 48 годин перед тренуванням або з моменту, коли записано 14 осіб, якщо це раніше.', trLogIn: 'записався #{n}', trLogOut: 'відмовився', trLogByAdmin: 'адміністратором', appVersion: 'Версія застосунку', gvStateF: 'Стан', gvStateFinal: 'Остаточний', gvStateDraft: 'Чернетка (у роботі)', gvStateProtocol: 'Протокол (сірий фон)', gvStateDraftSfx: ' (у роботі)', gvStateHint: 'Остаточний: звичайно. Чернетка: заголовок червоним із «(у роботі)». Протокол: показано затемненим.', gvVisAdmin: 'видно адміністратору', gvVisAdminNote: 'Видно лише адміністраторам.', gvVisNone: 'нікому не видно', gvVisBoard: 'видно правлінню', gvVisMembers: 'видно всім (активним і пасивним)', gvVisNoneNote: 'Нікому не видно, ці збори бачать лише адміністратори.', gvVisEmpty: 'Загальних зборів ще немає.', gvVisHint: 'Зараз: {v}. Змінює це лише адміністратор у консолі адміністратора.', gvTextTitle: 'Текстом: 52 тижні з {from} до {to}', gvTextCopy: 'Копіювати текст', gvTextCopied: 'Текст скопійовано', gvTextNone: 'У ці 52 тижні подій немає.', gvChapterF: 'Пункт порядку денного', gvChapterEdit: 'Редагувати пункт', gvProtocol: 'Позначити як протокол', gvProtocolHint: 'Протокол відображається трохи затемненим і відрізняється від решти документів.', gvProtoTag: 'Протокол', gvPhotoAdd: 'Додати фото', gvPhotoDel: 'Видалити фото', gvPhotoMoveL: 'Ближче до початку', gvPhotoMoveR: 'Ближче до кінця', gvUploading: 'Завантаження …', gvUploadFail: 'Не вдалося завантажити фото.', gvMigrate: 'Перенести фото в захищене сховище', gvMigrateAsk: '{n} фото цих ЗЗ буде скопійовано з теки застосунку в захищене сховище. Після цього можна видалити файли gv26-….jpg з репозиторію. Продовжити?', gvMigrated: 'Фото перенесено: {n}', gvPhotosHint: 'Фото зменшуються й зберігаються захищено. Їх бачать лише авторизовані члени.',
      pushTitle: 'Сповіщення', pushHint: 'Виберіть, про що ви хочете отримувати push-сповіщення на цьому пристрої. За замовчуванням: жодних.', pushEvents: 'Події: нові події та скасування', pushTrainings: 'Тренування: скасування та перенесення, а також записи й відмови (від 14-го запису)', pushHoursLbl: 'Додатково всі записи та відмови протягом останніх', pushH24: '24 год', pushH48: '48 год', pushDenied: 'Сповіщення заблоковано в браузері. Дозвольте їх у налаштуваннях пристрою або вебсайту.', pushIos: 'На iPhone: спершу додайте застосунок на головний екран (Поділитися, потім «На початковий екран»), а потім виберіть сповіщення тут.', pushUnsupported: 'Цей пристрій або браузер не підтримує push-сповіщень.', pushEnabledToast: 'Сповіщення збережено', pushDisabledToast: 'Сповіщення вимкнено', pushFail: 'Не вдалося зберегти сповіщення.',
      boTag: 'Правління', mMakeBo: 'Призначити членом правління', mRevokeBo: 'Забрати права правління', boGranted: 'Призначено членом правління', boRevoked: 'Права правління забрано', gvEditMode: 'Редагувати вміст', gvEditHint: 'Редагування активне: торкніться вмісту, щоб змінити його.', gvCopy: 'Копіювати ЗЗ', gvCopyAsk: 'ЗЗ {y} буде скопійовано як ЗЗ {n}, з усіма пунктами, звітами та фото, але без реакцій і коментарів. Дата зміститься на 52 тижні. Копія є чернеткою.', gvCopied: 'Скопійовано. Нові ЗЗ є чернеткою.', gvExists: 'На наступний рік уже є ЗЗ.', gvDelete: 'Видалити ЗЗ', gvDeleteAsk: 'Остаточно видалити ЗЗ {y} з усіма звітами, реакціями та коментарями?', gvDeleteRep: 'Остаточно видалити цей звіт?', gvAddReport: 'Додати звіт', gvMetaEdit: 'Назва, дата й місце', gvTitleF: 'Назва', gvSubtitle: 'Підзаголовок', gvSummary: 'Коротко (видно у згорнутому вигляді)', gvBody: 'Текст', gvIntro: 'Текст запрошення', gvPublished: 'Опубліковано (видно всім членам)', gvProgUntil: 'Річна програма до', gvAuthor: 'Автор (активний член)', gvNoAuthor: 'Не член клубу', gvAuthorName: 'Автор текстом (лише якщо не член)', gvPhotos: 'Фото', gvPhotoBad: 'Фото: лише імена файлів, як gv26-jass-1.jpg (літери, цифри, - _ .)', gvFormat: 'Формат: «## Підзаголовок», «> Рядок під заголовком», «! Примітка», «Ім’я | Значення». Порожній рядок починає новий абзац.', gvFinKpi: 'Ключові показники (Назва | Значення, в кінці | - для від’ємного)', gvFinCols: 'Стовпці (розділені |)', gvFinRows: 'Таблиця («## Розділ» або Назва | число | число | число, в кінці | * для проміжної суми)', gvNeedTitle: 'Заповніть назву (і текст для звітів).',
      navGv: 'ЗЗ', gvTitle: 'ЗЗ {y}', gvDraft: 'Чернетка, видима лише правлінню', gvInvite: 'Запрошення', gvRsvp: 'Записатися або відмовитися можна в розділі «Події» не пізніше ніж за тиждень ({date}). Це стосується всіх учасників, також вечері.', gvToEvents: 'До подій', gvToJass: 'До розділу «Джас»', gvProgramHint: 'Дати беруться з розділу «Події», там ви й записуєтеся. Значок календаря зберігає подію у вашому календарі.', gvNoProgram: 'На цей період подій немає.', gvMore: 'Читати далі', gvLess: 'Показати менше', gvPrev: 'Попереднє фото', gvNext: 'Наступне фото', gvClose: 'Закрити', gvPhotoAlt: 'Фото {i} з {n}: {t}', gvComment: 'Коментувати', gvComments1: '1 коментар', gvCommentsN: '{n} коментарів', gvWrite: 'Написати коментар …', gvSend: 'Надіслати', gvNoComments: 'Коментарів ще немає.', gvReactAria: 'Реакція {e}',
      wd0: 'Неділя', wd1: 'Понеділок', wd2: 'Вівторок', wd3: 'Середа', wd4: 'Четвер', wd5: 'П’ятниця', wd6: 'Субота',
      navTrainings: 'Тренування', navEvents: 'Події', navAdmin: 'Admin', navProfile: 'Профіль',
      titleTrainings: 'Trainingsplan', titleEvents: 'Vereinsanlässe',
      subTrainings: 'Найближчі {n} занять', subEvents: 'Заплановані заходи клубу', moreDates: 'Інші дати ({n})',
      emptyTrTitle: 'Тренувань поки не заплановано.', emptyTrAdmin: 'Встановіть день тренування в розділі «Керування».', emptyTrMember: 'Дні тренувань визначають адміністратори.',
      emptyEvTitle: 'Наразі подій не заплановано.', emptyEvAdmin: 'Створіть подію в розділі «Керування».', emptyEvMember: 'Нові події створюють Event Manager.',
      trainingWord: 'Тренування', trCancelled: 'Тренування скасовано', yes: 'Буду', no: 'Не буду', participants: 'Учасники',
      ariaTr: '{yes} учасників, {no} не буде. {action} список учасників', ariaEv: '{n} учасників. {action} список учасників',
      listOpen: 'Відкрити', listClose: 'Закрити',
      hYes: 'Будуть ({n})', hNo: 'Не будуть ({n})', hOpen: 'Ще немає відповіді ({n})', hSolo: 'Самі ({n})', hDuo: 'Удвох ({n} учасників, {p} осіб)',
      nobody: 'Нікого', you: '(ви)', cancelledTag: 'Скасовано', cancelledLow: 'скасовано', changedLow: 'змінено',
      timePlace: '{time}, {place}', atTime: '{time}', calAdd: 'Додати до календаря', solo: 'Сам(а)', duo: 'Удвох',
      secRules: 'Стандартне тренування', secExtra: 'Додаткове тренування', secUpcoming: 'Керувати розкладом тренувань', secEvents: 'Події', secMembers: 'Ролі',
      addNew: 'Додати', addClose: 'Закрити форму',
      adminTitle: 'Admin Console', titleCC: 'Chilbi & Chränzli', titleJass: 'Jass-Masters', adminSub: 'Видно лише адміністраторам', rulesIntro: 'Стандартні тренування щотижня',
      weekday: 'День тижня', time: 'Час', place: 'Місце', date: 'Дата', label: 'Назва',
      phPlaceTraining: 'напр. спортзал школи «Північ»', addRule: 'Додати день тренування',
      edit: 'Редагувати', remove: 'Прибрати', cancel: 'Скасувати', reactivate: 'Відновити', del: 'Видалити', save: 'Зберегти', dismiss: 'Відміна', reset: 'Скинути',
      editNote: 'Діє лише для цієї дати. Відповіді учасників зберігаються.',
      rulesEmpty: 'Постійного дня тренування ще немає. Натисніть «+», щоб додати.',
      extraIntro: 'Заплановані додаткові тренування', extraEmpty: 'Додаткових тренувань не заплановано.', extraDefaultTitle: 'Додаткове тренування',
      phPlaceExtra: 'напр. спортивний комплекс «Південь»', addExtra: 'Додати тренування', upcomingEmpty: 'Найближчих тренувань немає.',
      phEventTitle: 'напр. вечір фондю', phEventPlace: 'напр. клубний будинок', addEvent: 'Додати подію', rsvpRequired: 'Реєстрація обов’язкова',
      eventsEmpty: 'Подій ще немає. Натисніть «+», щоб додати першу.',
      membersIntro: 'Натисніть три крапки біля людини, щоб змінити ролі, групу, PIN, ім’я чи номер, або видалити її. Шестерня = адмін, зірка = Event Manager, келих = Chilbi/Chränzli Manager, кубок = Jass Manager. Гості та Friends & Family бачать лише обмежений вміст (див. групи нижче).',
      memberAdd: 'Додати учасника', fullName: 'Ім’я та прізвище', phone: 'Номер мобільного',
      memberAddNote: 'Учасник входить лише за номером мобільного. PIN — останні 6 цифр.',
      selfAdmin: 'Ви адміністратор. Ви не можете забрати права в себе самі.', revokeAdmin: 'Забрати права адміністратора: {name}', makeAdmin: 'Призначити адміністратором: {name}',
      adminTag: 'Адмін', resetPin: 'Скинути PIN',
      profileTitle: 'Mein Profil', nameLabel: 'Ім’я',
      installTitle: 'Встановити застосунок', installHint: 'Додайте застосунок на головний екран, і він відкриватиметься на весь екран.', installBtn: 'Додати на головний екран',
      installIos: 'У Safari натисніть внизу «Поділитися», потім «На початковий екран». Після цього застосунок відкриватиметься на весь екран.',
      nameChange: 'Змінити ім’я', nameSave: 'Зберегти ім’я',
      pinChange: 'Змінити PIN', pinIntro: 'За замовчуванням це останні 6 цифр вашого номера мобільного. Якщо ви змінюєте PIN, його потрібно вводити під час входу.',
      pinNew: 'Новий PIN (6 цифр)', pinSave: 'Зберегти PIN', pinDefault: 'Повернути PIN за замовчуванням', logout: 'Вийти',
      language: 'Мова', languageHint: 'Оберіть мову, якою ви хочете користуватися застосунком.', themeTitle: 'Вигляд', themeHint: 'Виберіть, як має виглядати застосунок.', themeLight: 'Світла', themeDark: 'Темна', themeAuto: 'Автоматично',
      loginSub: 'App',
      loginLeadReg: 'Створіть обліковий запис, вказавши ім’я, номер мобільного та код клубу. Ваш PIN — останні 6 цифр номера мобільного.',
      loginLead: 'Увійдіть за номером мобільного.', pinOptional: 'PIN (потрібен, лише якщо ви його змінювали)', clubCode: 'Код клубу',
      register: 'Створити обліковий запис', signIn: 'Увійти', haveAccount: 'У мене вже є обліковий запис', firstTime: 'Вперше тут? Створіть обліковий запис',
      setupTitle: 'Потрібне налаштування', setupLead: 'Застосунок ще не підключено до Supabase.',
      setupStep1: 'Відкрийте файл <code>config.js</code>.', setupStep2: 'Внесіть <code>SUPABASE_URL</code> і <code>SUPABASE_ANON_KEY</code> зі свого проєкту Supabase.',
      setupStep3: 'Оновіть сторінку.', setupNote: 'Детальна інструкція є у файлі README.md.',
      loading: 'Завантаження …',
      errFailed: 'Не вдалося', respWithdrawn: 'Відповідь скасовано', youIn: 'Ви будете', youOut: 'Ви не будете', youSolo: 'Ви прийдете самі', youDuo: 'Ви прийдете удвох',
      phoneCountry: 'Країна', phoneOther: 'Інша', phoneInvalid: 'Введіть дійсний номер мобільного, напр. 079 123 45 67.', alreadyReg: 'Цей номер уже зареєстровано.',
      memberAdded: '{name} додано.', addFailed: 'Не вдалося додати: {reason}', unknownError: 'Невідома помилка',
      authInvalid: 'Номер мобільного або PIN неправильні. Якщо ви змінювали PIN, введіть його в полі PIN.',
      authAlready: 'Цей номер уже зареєстровано. Будь ласка, увійдіть.', authCode: 'Реєстрація неможлива. Перевірте код клубу.',
      authRate: 'Забагато спроб. Зачекайте хвилинку.', authPin: 'PIN має складатися з 6 цифр.', authFail: 'Не вдалося увійти. Спробуйте ще раз.',
      pinExact: 'PIN має складатися рівно з 6 цифр.', pinWeak: 'Цей PIN надто простий (наприклад, 111111 або 123456) або збігається зі стандартним. Оберіть інший.', confirmEmailOff: 'Вимкніть у Supabase «Confirm email» (див. README).',
      loadFail: 'Не вдалося завантажити дані. Чи було виконано схему бази даних?',
      calFile: 'Відкрийте файл «{name}», щоб зберегти подію в календарі.', calFail: 'Не вдалося створити запис у календарі.',
      pinResetOk: 'PIN повернено до значення за замовчуванням', pinResetFail: 'Не вдалося скинути PIN.',
      confirmDelRule: 'Прибрати цей день тренування? Усі майбутні дати серії зникнуть.', ruleRemoved: 'День тренування прибрано',
      confirmDelExtra: 'Видалити це тренування?', extraDeleted: 'Тренування видалено',
      confirmDelEvent: 'Видалити цю подію? Усі відповіді також буде видалено.', eventDeleted: 'Подію видалено',
      trReactivated: 'Тренування знову активне', trCancelledMsg: 'Тренування скасовано', evReactivated: 'Подія знову активна', evCancelledMsg: 'Подію скасовано',
      changeReset: 'Зміну скинуто', confirmResetPin: 'Повернути PIN користувача {name} до останніх 6 цифр номера мобільного?', thisMemberDat: 'цього учасника',
      pinReset: 'PIN скинуто', confirmRemove: 'Видалити {name}? Обліковий запис і всі відповіді буде видалено.', thisMember: 'Цей учасник', memberRemoved: 'Учасника видалено',
      adminGranted: 'Права адміністратора надано', adminRevoked: 'Права адміністратора забрано', nameSaved: 'Ім’я збережено', pinChanged: 'PIN змінено', pinChangeFail: 'Не вдалося змінити PIN.',
      ruleAdded: 'День тренування додано', extraAdded: 'Тренування додано', eventAdded: 'Подію додано',
      ruleChanged: 'День тренування змінено', trChanged: 'Тренування змінено', eventChanged: 'Подію змінено', langSaved: 'Мову збережено',
      guestTag: 'Гість', makeGuest: 'Призначити гостем: {name}', revokeGuest: 'Забрати статус гостя: {name}', guestGranted: 'Призначено гостем', guestRevoked: 'Статус гостя знято',
      guestCheck: 'Додати як гостя (бачить лише тренування та профіль)', guestInfo: 'У вас гостьовий доступ. Ви бачите тренування та свій профіль.', supporterInfo: 'Ви в групі Friends & Family. Ви бачите тренування, Джас, C&C і свій профіль.',
      memberTag: 'Член клубу', emTag: 'Менеджер подій', makeEm: 'Призначити менеджером подій: {name}', revokeEm: 'Забрати права менеджера подій: {name}', emGranted: 'Призначено менеджером подій', emRevoked: 'Права менеджера подій забрано', confirmGuestLoses: '{name} має права Admin, Event Manager, Chilbi Manager, Chränzli Manager або Jass Manager. Ця зміна забере ці права. Продовжити?', selfMember: 'Ви член клубу. Ви не можете призначити себе гостем.', rolesTitle: 'Ролі', emSub: 'Тут ви керуєте подіями.', ccManagerSub: 'C&C ви керуєте у вкладці «C&C».',
      infoShow: 'Показати пояснення', infoHide: 'Сховати пояснення',
      ok: 'OK',
      navCC: 'C&C', ccMembers: 'Члени клубу', ccGuests: 'Гості', ccOthers: 'Інші', ccEmpty: 'Заходів ще немає.', ccNoDays: 'Днів ще немає.', ccSummary: 'Змін: {s} · ролей: {r}', ccLvlAll: 'Chränzli і Chilbi', ccLvlEvent: 'Захід', ccLvlDay: 'День', ccLvlShift: 'Зміна', ccLvlRole: 'Роль', ccActions: 'Дії', ccAddEvent: 'Додати захід', ccAddDay: 'Додати день', ccAddShift: 'Додати зміну', ccAddRole: 'Додати роль', ccChange: 'Змінити', ccCopy: 'Копіювати', ccClose: 'Закрити', ccNameOpt: 'Назва (необов’язково)', ccStart: 'Початок', ccEnd: 'Кінець', ccActive: 'Активний', ccPersons: 'Відповідальні', ccSearch: 'Пошук імен', ccOtherPerson: 'Інша особа (не в застосунку)', ccAdd: 'Додати', ccDidYouMean: 'Можливо, {name}?', ccNobody: 'Ще нікого', ccConfirmDel: 'Видалити «{name}»? Усе, що в ньому, також буде видалено.', ccConfirmDelRole: 'Видалити «{name}»?', ccCopyEventNote: 'Копія спочатку неактивна. Усі дні зсуваються на 52 тижні, щоб дні тижня збігалися.', ccCopyDayNote: 'Зміни й ролі копіюються разом із відповідальними.', ccSaved: 'Збережено', ccCopied: 'Скопійовано', ccDeleted: 'Видалено', ccNotInApp: '{name} ще немає в застосунку. За номером мобільного можна додати цю особу як гостя.', ccAsGuest: 'Додати як гостя', ccNeedName: 'Введіть ім’я.', ccSetup: 'Для C&C потрібно оновити схему бази даних (supabase/schema.sql).', grpCandidate: 'Кандидати', candidateTitle: 'Щиро дякуємо за ваш інтерес', candidateMsg: 'Ваш запит розглядають наші адміністратори.', mGroupActive: 'Зробити активним членом', mGroupPassive: 'Зробити пасивним членом', mGroupGuest: 'Зробити гостем', mGroupOther: 'Перевести у Friends & Family', mGroupCandidate: 'Зробити кандидатом', groupChanged: 'Групу змінено', jsEternal: 'Вічний рейтинг', jsEternalHint: 'За останні {n} завершених раундів', jsEternalRounds: '{n} раундів', jsEternalRound: '1 раунд', jsVisibleHint: 'Без позначки цей раунд бачать лише Admin і Jass Manager', evEdit: 'Змінити подію', evTitleLbl: 'Назва', evFrom: 'З', evTo: 'До', evEndBefore: 'Кінець раніше за початок.', evMissing: 'Вкажіть назву, дату й час.', designTitle: 'Дизайн', designHint: 'Оберіть кольори застосунку.', design_light: 'Білий', design_standard: 'Блакитний', design_petrol: 'Петроль', design_holland: 'Помаранчевий', evManagePeople: 'Керувати учасниками', grpSupporter: 'Friends & Family', mMakeSupporter: 'Перевести у Friends & Family', supporterSet: 'Віднесено до Friends & Family', pinLampOk: 'Вже змінив(ла) PIN-код', pinLampNo: 'Ще користується стандартним PIN-кодом', pinBannerMsg: 'Будь ласка, встановіть свій особистий PIN-код, щоб розблокувати всі функції.', pinBannerBtn: 'Встановити PIN', ccPublicLabel: 'Видно всім активним і пасивним членам', ccPublicOn: 'C&C тепер видно всім (лише перегляд)', ccPublicOff: 'C&C знову видно лише Admin, Chilbi Manager і Chränzli Manager', ccCopySuffix: 'копія', ccLegendMe: 'Я', ccPrint: 'Поділитися PDF', jsPrint: 'Огляд Jassmasters як PDF', ccPdfBuilding: 'Створення PDF…', ccPdfFailed: 'Не вдалося створити PDF.',
      mMakeAdmin: 'Призначити адміністратором', mRevokeAdmin: 'Забрати права адміністратора', mMakeEm: 'Призначити менеджером подій', mRevokeEm: 'Забрати права менеджера подій', mMakeGuest: 'Зробити гостем', mMakeMember: 'Зробити членом клубу', mEdit: 'Змінити ім’я та номер мобільного', mEditNote: 'З новим номером знову діє PIN за замовчуванням: останні 6 цифр нового номера.', mSaved: 'Збережено', mDelete: 'Видалити учасника', mPhoneTaken: 'Цей номер мобільного вже належить іншій особі.',
      jsLocked: 'Заблоковано – торкніться, щоб розблокувати', jsUnlocked: 'Розблоковано – торкніться, щоб заблокувати', jsEditRow: 'Редагувати запис', jsRankDiff: 'Різниця',
      navJass: 'Джас', jsParticipants: 'Учасники', jsSchedule: 'Розклад ігор', jsRanking: 'Рейтинг дня', jsRound: 'Раунд {n}', jsTable: 'Стіл {t}', jsTeam1: 'Команда I', jsTeam2: 'Команда II', jsPlayer: 'Гравець {n}', jsFree: 'вільно', jsEmpty: 'Jassmasters ще немає.', jsNoDays: 'Дати ще немає.', jsAddSeries: 'Додати Jassmasters', jsAddDay: 'Додати дату', jsLvlSeries: 'Jassmasters', jsLvlDay: 'День джасу', jsPick: 'Вибрати гравця {n}', jsClear: 'Звільнити місце', jsAlready: 'уже гравець {n}', jsPoints: 'Очки', jsGames: 'Ігор: {n}', jsPtsAbbr: 'очк.', jsGame: 'Ігор: {n}', jsNoPoints: 'Очок ще немає.', jsHint: 'Вкажіть очки команди-переможця. Інша команда автоматично отримує їх зі знаком мінус.', jsSetup: 'Для джасу потрібно оновити схему бази даних (supabase/schema.sql).', jsFinish: 'Завершити Jassmaster', jsConfirmFinish: 'Завершити «{name}»? Його буде переміщено до минулих Jassmasters і надалі буде видно лише рейтинг. Продовжити?', jsFinished: 'Позначено як завершене', jsEditRanking: 'Редагувати рейтинг', jsRankName: 'Ім’я', jsRankPoints: 'Очки', jsAddRow: 'Додати рядок', jsNoRows: 'Ще нікого не додано.',
      shPlay: 'Відтворити тут', shPlayStop: 'Закрити плеєр',
      shHint: 'Примітка', shHintCheck: 'Позначити як примітку (перед діями)',
      shVideo: 'Відео', shYoutube: 'Посилання YouTube', shOpenYoutube: 'Відкрити на YouTube', shVideoBad: 'Вкажіть посилання YouTube (https://www.youtube.com/… або https://youtu.be/…).',
      shMusic: 'Музика', shSpotify: 'Посилання Spotify', shOpenSpotify: 'Відкрити в Spotify', shMusicBad: 'Вкажіть посилання Spotify (https://open.spotify.com/…).',
      navShow: 'Show', titleShow: 'Chränzli Drehbuch', dirTag: 'Режисер', actTag: 'Актор', mMakeDir: 'Призначити режисером', mRevokeDir: 'Скасувати права режисера', mMakeActor: 'Призначити актором', mRevokeActor: 'Скасувати роль актора', dirGranted: 'Призначено режисером', dirRevoked: 'Права режисера скасовано', actorGranted: 'Призначено актором', actorRevoked: 'Роль актора скасовано', shEmpty: 'Дій ще немає.', shSetup: 'Таблиці Show відсутні. Виконайте PRD_v97_show.sql у SQL Editor.', shAddAct: 'Додати дію', shAddScene: 'Додати сцену', shAddPart: 'Додати роль', shLvlAll: 'Show', shLvlAct: 'Дія', shLvlScene: 'Сцена', shLvlPart: 'Роль', shDesc: 'Опис', shNoScenes: 'Сцен ще немає.', shSummary: '{r} ролей', shVisible: 'План видимий для акторів',
      jmTag: 'Менеджер Jass', mMakeJm: 'Призначити менеджером Jass', mRevokeJm: 'Скасувати права менеджера Jass', jmGranted: 'Призначено менеджером Jass', jmRevoked: 'Права менеджера Jass скасовано', cmTag: 'Менеджер Chilbi', crmTag: 'Менеджер Chränzli', mMakeCm: 'Призначити менеджером Chilbi', mRevokeCm: 'Скасувати права менеджера Chilbi', mMakeCrm: 'Призначити менеджером Chränzli', mRevokeCrm: 'Скасувати права менеджера Chränzli', cmGranted: 'Призначено менеджером Chilbi', cmRevoked: 'Права менеджера Chilbi скасовано', crmGranted: 'Призначено менеджером Chränzli', crmRevoked: 'Права менеджера Chränzli скасовано', grpActive: 'Активні члени', grpPassive: 'Пасивні члени', mMakePassive: 'Зробити пасивним членом', mMakeActive: 'Зробити активним членом', passiveSet: 'Призначено пасивним членом', activeSet: 'Призначено активним членом', jsUpcoming: 'Майбутній Jassmaster', jsPast: 'Минулі Jassmasters'
    }
  };

  var lang = detectLang();

  function detectLang() {
    try { var s = localStorage.getItem('fbro-lang'); if (s && LANGS.indexOf(s) > -1) return s; } catch (e) { /* ignorieren */ }
    var n = String(navigator.language || 'de').toLowerCase().slice(0, 2);
    return ['de', 'en', 'uk'].indexOf(n) > -1 ? n : 'de';
  }
  function L(key, p) {
    var s = (DICT[lang] && DICT[lang][key]) || DICT.de[key] || key;
    if (p) s = s.replace(/\{(\w+)\}/g, function (m, k) { return p[k] != null ? p[k] : m; });
    return s;
  }
  function setLang(l) {
    if (LANGS.indexOf(l) === -1) return;
    lang = l;
    try { localStorage.setItem('fbro-lang', l); } catch (e) { /* ignorieren */ }
    document.documentElement.lang = LANG_HTML[l];
  }

  /* ---------- Darstellung: Hell / Dunkel / Automatisch ---------- */
  // '' bedeutet automatisch (folgt der Geräteeinstellung); so früh wie möglich angewendet,
  // damit die Seite nicht kurz im falschen Modus aufblitzt.
  function detectTheme() {
    try { var t = localStorage.getItem('fbro-theme'); if (t === 'light' || t === 'dark') return t; } catch (e) { /* ignorieren */ }
    return '';
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  var theme = detectTheme();
  applyTheme(theme);
  function setTheme(t) {
    theme = (t === 'light' || t === 'dark') ? t : '';
    try { if (theme) localStorage.setItem('fbro-theme', theme); else localStorage.removeItem('fbro-theme'); } catch (e) { /* ignorieren */ }
    applyTheme(theme);
  }
  /* ---------- Design pro Person: White, Blue, Petrol, Orange (wie Family-App) ---------- */
  var DESIGNS = ['light', 'standard', 'petrol', 'holland'];
  var design = 'standard';
  function applyDesign(d) {
    if (DESIGNS.indexOf(d) < 0) d = 'standard';
    design = d; document.documentElement.setAttribute('data-design', d);
    try { localStorage.setItem('fbro-design', d); } catch (e) { /* ignorieren */ }
  }
  try { applyDesign(localStorage.getItem('fbro-design')); } catch (e) { applyDesign('standard'); }
  function designSelect() {
    return '<div class="segctl" role="group" aria-label="' + esc(L('designTitle')) + '">' + DESIGNS.map(function (d) {
      return '<button type="button" class="segbtn' + (design === d ? ' on' : '') + '" data-act="set-design" data-val="' + d + '" aria-pressed="' + (design === d) + '"><span>' + esc(L('design_' + d)) + '</span></button>';
    }).join('') + '</div>';
  }
  function saveTheme() {
    if (!sb || !S.me) return;
    try { sb.from('profiles').update({ theme: theme || null }).eq('id', S.me.id).then(function () {}, function () {}); } catch (e) { /* ignorieren */ }
  }
  function themeSelect() {
    var opts = [
      { v: 'light', label: L('themeLight'), icon: ICON.sun },
      { v: 'dark', label: L('themeDark'), icon: ICON.moon },
      { v: '', label: L('themeAuto'), icon: ICON.auto }
    ];
    return '<div class="segctl" role="group" aria-label="' + esc(L('themeTitle')) + '">' + opts.map(function (o) {
      return '<button type="button" class="segbtn' + (theme === o.v ? ' on' : '') + '" data-act="set-theme" data-val="' + o.v + '" aria-pressed="' + (theme === o.v) + '">' + o.icon + '<span>' + o.label + '</span></button>';
    }).join('') + '</div>';
  }
  function langSelect() {
    return '<select class="input langsel" data-lang aria-label="Sprache / Language">' + LANGS.map(function (l) {
      return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(LANG_NAMES[l]) + '</option>';
    }).join('') + '</select>';
  }

  // Datumsformat: Für die Mundarten gibt es keine Intl-Sprache, daher eigene Namen
  var CUSTOM_DATES = {
    gsw: {
      // Fix 2: longDays für fullDate (weekday:'long')
      longDays: ['Sunntig', 'Mäntig', 'Zischtig', 'Mittwuch', 'Dunnschtig', 'Friitig', 'Samschtig'],
      days: ['Su', 'Mä', 'Zi', 'Mi', 'Du', 'Fr', 'Sa'],
      // Fix 3: Monatskürzel mit Punkt (wie de: «Okt.»)
      months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'Auguscht', 'Septämber', 'Oktober', 'Novämber', 'Dezämber'],
      short: ['Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.']
    }
  };
  function fmt(d, o) {
    var c = CUSTOM_DATES[lang];
    if (c) {
      var dm = [];
      if (o.day) dm.push(d.getDate() + '.');
      if (o.month) dm.push(o.month === 'long' ? c.months[d.getMonth()] : c.short[d.getMonth()]);
      if (o.year) dm.push(d.getFullYear());
      var main = dm.join(' ');
      // Fix 2: weekday:'long' → Langname; weekday:'short' → Kurzname
      var wd = o.weekday ? (o.weekday === 'long' ? c.longDays[d.getDay()] : c.days[d.getDay()]) : null;
      return wd ? wd + (main ? ', ' + main : '') : main;
    }
    return d.toLocaleDateString(LANG_LOCALE[lang] || 'de-CH', o);
  }

  // Akzeptiert 079 123 45 67, +41 79 123 45 67, 0041 79 …; Leerschläge werden ignoriert.
  // Intern gespeichert wird immer das internationale Format (+41791234567).
  function normPhone(raw) {
    var d = String(raw).replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
    if (d.indexOf('00') === 0) d = '+' + d.slice(2);
    else if (d.indexOf('0') === 0) d = '+41' + d.slice(1);
    else if (d.indexOf('+') !== 0) d = '+' + d;
    return /^\+\d{9,15}$/.test(d) ? d : null;
  }
  // Anzeige: Schweizer Nummern immer als 079 123 45 67
  function fmtPhone(p) {
    if (/^\+41\d{9}$/.test(p)) return '0' + p.slice(3, 5) + ' ' + p.slice(5, 8) + ' ' + p.slice(8, 10) + ' ' + p.slice(10);
    if (/^\+49\d{10,11}$/.test(p)) return '+49 ' + p.slice(3, 6) + ' ' + p.slice(6);
    return p;
  }
  // Zu einfache PINs: gleiche Ziffern (111111), auf-/absteigende Folgen (123456, 654321) und der Standard-PIN
  function pinWeak(pin, phone) {
    if (!/^\d{6}$/.test(pin)) return false;
    if (/^(\d)\1{5}$/.test(pin)) return true;
    var d = pin.split('').map(Number), up = true, down = true;
    for (var i = 1; i < 6; i++) { if (d[i] !== d[i - 1] + 1) up = false; if (d[i] !== d[i - 1] - 1) down = false; }
    if (up || down) return true;
    return !!phone && pin === defaultPin(phone);
  }
  function defaultPin(p) { return String(p).replace(/\D/g, '').slice(-6); }

  /* Handynummer-Eingabe: Länderauswahl (CH/DE/Andere) + Nummer ohne führende Null.
     Gespeichert wird weiterhin das internationale Format (+41791234567). */
  var PHONE_CC = [{ c: '41', l: 'CH +41', ph: '79 123 45 67' }, { c: '49', l: 'DE +49', ph: '176 12345678' }];
  function ccInfo(c) { return PHONE_CC.filter(function (x) { return x.c === c; })[0] || null; }
  function fmtNational(cc, n) {
    n = String(n).replace(/\D/g, '');
    if (cc === '41') return [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean).join(' ');
    if (cc === '49') return [n.slice(0, 3), n.slice(3)].filter(Boolean).join(' ');
    return n;
  }
  // '+41796232345' → { cc: '41', nat: '79 623 23 45' }; unbekanntes Land → { cc: '', nat: '+43…' }
  function phoneParts(intl) {
    var raw = String(intl || '');
    var d = raw.replace(/\D/g, '');
    if (/^\+\d/.test(raw.replace(/\s/g, ''))) {
      for (var i = 0; i < PHONE_CC.length; i++) {
        if (d.indexOf(PHONE_CC[i].c) === 0) return { cc: PHONE_CC[i].c, nat: fmtNational(PHONE_CC[i].c, d.slice(PHONE_CC[i].c.length)) };
      }
      return { cc: '', nat: raw.replace(/\s/g, '') };
    }
    return { cc: '41', nat: fmtNational('41', d.replace(/^0+/, '')) };
  }
  // Länderwahl + Eingabe → Nummer für normPhone(). Eine vollständig internationale Eingabe (+… / 00…) gilt immer.
  function composePhone(cc, raw) {
    raw = String(raw || '').trim();
    if (/^(\+|00)/.test(raw.replace(/\s/g, ''))) return raw;
    if (!cc) return raw;
    var d = raw.replace(/\(0\)/g, '').replace(/\D/g, '');
    if (cc === '41' && d.length === 11 && d.indexOf('41') === 0) d = d.slice(2);   // «41 79 …» ohne +
    d = d.replace(/^0+/, '');
    return d ? '+' + cc + d : '';
  }
  function phoneField(intl, autoc) {
    var pp = phoneParts(intl), info = ccInfo(pp.cc);
    return '<div class="phonerow">' +
      '<select class="input phonecc" name="phonecc" aria-label="' + esc(L('phoneCountry')) + '">' +
      PHONE_CC.map(function (x) { return '<option value="' + x.c + '"' + (pp.cc === x.c ? ' selected' : '') + '>' + x.l + '</option>'; }).join('') +
      '<option value=""' + (pp.cc === '' ? ' selected' : '') + '>' + esc(L('phoneOther')) + '</option></select>' +
      '<input class="input" name="phone" type="tel" inputmode="tel" autocomplete="' + (autoc || 'off') + '" placeholder="' + esc(info ? info.ph : '+43 …') + '" value="' + esc(pp.nat) + '" required></div>';
  }
  function phoneToEmail(p) { return p.replace('+', '') + '@' + (cfg.EMAIL_DOMAIN || 'phone-login.app'); }

  /* ---------- Zustand ---------- */
  function freshState() {
    return {
      step: 'loading', mode: 'login', tab: 'trainings', phone: '', err: '', info: '',
      session: null, me: null, members: [],
      rules: [], extras: [], overrides: {}, cancelled: {}, events: [],
      tr: {}, ev: {}, open: {}, edit: null, busy: false, sec: {}, add: {}, info: {}, play: {}, showMore: false,
      cc: { events: [], days: [], shifts: [], roles: [] }, ccErr: false, ccFold: {}, ccLegend: false,
      js: { series: [], days: [] }, jsErr: false, jsFold: {}, jsUnlock: {},
      gv: { cur: null, all: [], items: [], reports: [], reactions: [], comments: [] }, gvOpen: {}, gvMore: {}, gvCom: {}, gvUrls: {}, gvSel: null, gvEdit: false, trLog: {}, trLogClosed: {}, trLogInfo: {}, trGrp: {}
    };
  }
  var S = freshState();
  var installPrompt = null;

  /* ---------- Daten laden ---------- */
  async function loadAll() {
    var tables = ['profiles', 'training_rules', 'training_extras', 'training_overrides', 'training_cancellations', 'events', 'training_responses', 'event_responses'];
    var res = await Promise.all(tables.map(function (t) { return sb.from(t).select('*'); }));
    var bad = res.filter(function (r) { return r.error; })[0];
    if (bad) throw bad.error;
    var d = res.map(function (r) { return r.data || []; });

    S.members = d[0].map(function (r) { return { id: r.id, name: r.name, phone: r.phone, isAdmin: r.is_admin, isGuest: r.is_guest === true, isPassive: r.is_passive === true, isSupporter: r.is_supporter === true, isCandidate: r.is_candidate === true, isEventManager: r.is_event_manager === true, isChilbiManager: r.is_chilbi_manager === true, isChraenzliManager: r.is_chraenzli_manager === true, isJassMaster: r.is_jass_master === true, isDirector: r.is_director === true, isActor: r.is_actor === true, isBoard: r.is_board === true, pinChanged: r.pin_changed === true, language: r.language || null, theme: r.theme || null, design: r.design || null }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    S.rules = d[1].map(function (r) { return { id: r.id, wd: r.weekday, time: hhmm(r.start_time), place: r.place }; })
      .sort(function (a, b) { return ((a.wd + 6) % 7) - ((b.wd + 6) % 7) || (a.time < b.time ? -1 : 1); });
    S.extras = d[2].map(function (r) { return { id: r.id, title: r.title, date: r.event_date, time: hhmm(r.start_time), place: r.place }; });
    S.overrides = {};
    d[3].forEach(function (r) { S.overrides[r.training_key] = { date: r.new_date, time: hhmm(r.new_time), place: r.new_place }; });
    S.cancelled = {};
    d[4].forEach(function (r) { S.cancelled[r.training_key] = true; });
    S.events = d[5].map(function (r) { return { id: r.id, title: r.title, date: r.event_date, time: hhmm(r.start_time), place: r.place, cancelled: r.cancelled, rsvp: r.rsvp_required === true, endDate: r.end_date || '', endTime: hhmm(r.end_time) }; });
    S.tr = {};
    d[6].forEach(function (r) { (S.tr[r.training_key] = S.tr[r.training_key] || {})[r.user_id] = r.status; });
    S.ev = {};
    d[7].forEach(function (r) { (S.ev[r.event_id] = S.ev[r.event_id] || {})[r.user_id] = r.status; });
    // Protokoll der An- und Abmeldungen (Tabelle training_log); fehlt sie noch, läuft die App ohne
    S.trLog = {};
    try {
      var lg = await sb.from('training_log').select('*').order('at', { ascending: true });
      if (!lg.error) (lg.data || []).forEach(function (r) { (S.trLog[r.training_key] = S.trLog[r.training_key] || []).push(r); });
    } catch (e) { console.error(e); }
    if (S.session) S.me = S.members.filter(function (m) { return m.id === S.session.user.id; })[0] || null;

    // Jass separat laden (für alle angemeldeten Personen sichtbar)
    S.js = { series: [], days: [] };
    S.jsErr = false;
    if (S.me) {
      var jr = await Promise.all(['jass_series', 'jass_days'].map(function (t) { return sb.from(t).select('*'); }));
      if (jr.some(function (r) { return r.error; })) S.jsErr = true;
      else { S.js.series = jr[0].data || []; S.js.days = jr[1].data || []; }
    }

    // C&C separat laden: ein fehlendes Schema soll den Rest der App nicht blockieren
    S.cc = { events: [], days: [], shifts: [], roles: [], acts: [], scenes: [], parts: [] };
    S.showErr = false;
    S.ccErr = false;
    S.ccPublic = false;   // wird nach dem Laden gesetzt: true wenn mind. 1 Anlass aktiv ist
    if (canCC()) {
      // Admins und Manager laden immer alle C&C-Daten (aktiv + inaktiv)
      var cr = await Promise.all(['cc_events', 'cc_days', 'cc_shifts', 'cc_roles'].map(function (t) { return sb.from(t).select('*'); }));
      if (cr.some(function (r) { return r.error; })) S.ccErr = true;
      else {
        S.cc.events = cr[0].data || [];
        S.cc.days = cr[1].data || [];
        S.cc.shifts = (cr[2].data || []).map(function (x) { x.start_time = hhmm(x.start_time); x.end_time = hhmm(x.end_time); return x; });
        S.cc.roles = cr[3].data || [];
      }
      // C&C-Tab für normale Mitglieder sichtbar, wenn mind. 1 Anlass aktiv ist
      S.ccPublic = S.cc.events.some(function (e) { return e.active; });
    } else {
      // Normales Mitglied: nur laden wenn mind. 1 aktiver Anlass existiert (Lesezugriff via RLS)
      var evR = await sb.from('cc_events').select('*').eq('active', true);
      if (!evR.error && evR.data && evR.data.length > 0) {
        S.ccPublic = true;
        var cr2 = await Promise.all(['cc_days', 'cc_shifts', 'cc_roles'].map(function (t) { return sb.from(t).select('*'); }));
        S.cc.events = evR.data;
        if (!cr2.some(function (r) { return r.error; })) {
          S.cc.days = cr2[0].data || [];
          S.cc.shifts = (cr2[1].data || []).map(function (x) { x.start_time = hhmm(x.start_time); x.end_time = hhmm(x.end_time); return x; });
          S.cc.roles = cr2[2].data || [];
        }
      }
    }
    await loadShow();
    await loadGv();
  }

  /* ---------- Show: Akte, Szenen, Rollen laden (nur Regisseur und Schauspieler) ---------- */
  async function loadShow() {
    if (!canShow()) return;
    var sr = await Promise.all(['show_acts', 'show_scenes', 'show_parts'].map(function (t) { return sb.from(t).select('*'); }));
    if (sr.some(function (r) { return r.error; })) { S.showErr = true; return; }
    S.cc.acts = sr[0].data || [];
    S.cc.scenes = sr[1].data || [];
    S.cc.parts = sr[2].data || [];
  }

  /* ---------- Trainings berechnen ---------- */
  function prefix() { return cfg.CLUB_SHORT || 'FBRO'; }

  // Alle künftigen Termine: Serien-Termine für die nächsten 12 Monate, Spezial-Trainings ohne Zeitgrenze
  function getTrainings() {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var todayIso = iso(today);
    var nowT = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var months = cfg.TRAININGS_HORIZON_MONTHS || 12;
    var last = new Date(today.getFullYear(), today.getMonth() + months + 1, 0);
    var span = Math.round((last - today) / 864e5);
    var list = [];
    var add = function (t) {
      var ov = S.overrides[t.key];
      if (ov) { t.iso = ov.date; t.time = ov.time; t.place = ov.place; t.changed = true; }
      t.date = parseIso(t.iso);
      if (t.iso < todayIso) return;                       // erst am Anfang des nächsten Tages ausblenden (heute bleibt sichtbar, auch nach Trainingsbeginn)
      list.push(t);
    };
    for (var i = 0; i <= span; i++) {
      var d = new Date(today); d.setDate(today.getDate() + i);
      var di = iso(d);
      S.rules.forEach(function (r) {
        if (r.wd === d.getDay()) add({ key: di + '#' + r.id, iso: di, time: r.time, place: r.place, title: L('trainingWord'), ruleId: r.id });
      });
    }
    S.extras.forEach(function (x) {
      add({ key: 'x#' + x.id, iso: x.date, time: x.time, place: x.place, title: x.title, extraId: x.id });
    });
    list.sort(function (a, b) { return (a.iso + a.time) < (b.iso + b.time) ? -1 : 1; });
    return list;
  }

  // Ende eines Events (Datum + Zeit) oder null; Enddatum ohne Zeit = bis Tagesende
  function evEndOf(e) {
    if (e.endDate) return { date: e.endDate, time: e.endTime || '23:59' };
    if (e.endTime) return { date: e.date, time: e.endTime };
    return null;
  }
  // Zeitangabe für die Anzeige: 19:00–21:00 (am selben Tag) oder 19:00 – So., 22. Nov., 12:00
  function evTimeText(e) {
    var en = evEndOf(e);
    if (!en) return e.time;
    if (en.date === e.date) return e.time + '\u2013' + en.time;
    return e.time + ' \u2013 ' + fmt(parseIso(en.date), { weekday: 'short', day: 'numeric', month: 'short' }) + (e.endTime ? ', ' + e.endTime : '');
  }
  function getEvents() {
    var now = new Date();
    var todayIso = iso(now);
    var nowT = pad(now.getHours()) + ':' + pad(now.getMinutes());
    return S.events.filter(function (e) { var en = evEndOf(e); return e.date > todayIso || (e.date === todayIso && e.time >= nowT) || (en && (en.date > todayIso || (en.date === todayIso && en.time >= nowT))); })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
  }

  /* ---------- Icons ---------- */
  var ICON = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01"/><path d="M11 12h1v4h1"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.3c.4-1.8 2.9-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.4 1.8 2.9 0 3.4a1.7 1.7 0 0 0-1 2.6c.9 1.5-.8 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.8-2.9 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.8-.4-1.8-2.9 0-3.4a1.7 1.7 0 0 0 1-2.5c-.9-1.6.8-3.3 2.4-2.4c1 .6 2.3 0 2.6-1.1z"/><circle class="hole" cx="12" cy="12" r="3"/></svg>',
    laurel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 20.5C5.4 19.2 3.2 15.9 3.2 12c0-2.3.7-4.4 2-6.1"/><path d="M15 20.5c3.6-1.3 5.8-4.6 5.8-8.5 0-2.3-.7-4.4-2-6.1"/><path d="M5.2 5.9C4.9 4.5 5.6 3.2 6.9 2.8c.3 1.4-.4 2.7-1.7 3.1z"/><path d="M3.4 10.1C2.5 9 2.6 7.5 3.6 6.6c.9 1.1.8 2.6-.2 3.5z"/><path d="M3.6 14.6c-1.2-.5-1.9-1.9-1.5-3.2 1.3.4 2 1.8 1.5 3.2z"/><path d="M5.6 18.3c-1.3-.1-2.3-1.2-2.3-2.5 1.4 0 2.4 1.1 2.3 2.5z"/><path d="M18.8 5.9c.3-1.4-.4-2.7-1.7-3.1-.3 1.4.4 2.7 1.7 3.1z"/><path d="M20.6 10.1c.9-1.1.8-2.6-.2-3.5-.9 1.1-.8 2.6.2 3.5z"/><path d="M20.4 14.6c1.2-.5 1.9-1.9 1.5-3.2-1.3.4-2 1.8-1.5 3.2z"/><path d="M18.4 18.3c1.3-.1 2.3-1.2 2.3-2.5-1.4 0-2.4 1.1-2.3 2.5z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4"/><path d="M13.5 6.5l4 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6l4 6l5-4l-2 10H5L3 8l5 4z"/><circle cx="12" cy="4" r="1"/><circle cx="3" cy="6" r="1"/><circle cx="21" cy="6" r="1"/></svg>',
    candidate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5"/><path d="M12 17h.01"/></svg>',
    groupA: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" font-family="sans-serif" fill="#fff" stroke="none">A</text></svg>',
    groupP: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">P</text></svg>',
    groupG: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.2 2.2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none" stroke-dasharray="0">G</text></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.6-9.5 9-9.5 9z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    stage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.2 10c.8-1.6 2.4-1.6 3.2 0M13.6 10c.8-1.6 2.4-1.6 3.2 0"/><path d="M6.8 13.5h10.4a5.2 5.2 0 0 1-10.4 0z"/></svg>',
    glass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="liq" d="M6.3 10.6a5 5 0 0 1 5.7-.6a5 5 0 0 0 5.7.6c-.4 2.6-2.8 4.4-5.7 4.4s-5.3-1.8-5.7-4.4z" stroke="none"/><path d="M8 21h8"/><path d="M12 15v6"/><path d="M17 3l1 7c0 3-2.7 5-6 5s-6-2-6-5l1-7z"/><path d="M6.2 10a5 5 0 0 1 5.8 0a5 5 0 0 0 5.8 0"/></svg>',
    dialpad: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="6" cy="4" r="1.8"/><circle cx="12" cy="4" r="1.8"/><circle cx="18" cy="4" r="1.8"/><circle cx="6" cy="10" r="1.8"/><circle cx="12" cy="10" r="1.8"/><circle cx="18" cy="10" r="1.8"/><circle cx="6" cy="16" r="1.8"/><circle cx="12" cy="16" r="1.8"/><circle cx="18" cy="16" r="1.8"/><circle cx="12" cy="21.5" r="1.8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>',
    one: '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6"/></svg>',
    two: '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2 20c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5M15 15c3.5 0 7 1.5 7 5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    gv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M8.5 12h7M8.5 16h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    calplus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    calcard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="2" fill="currentColor" stroke="none"/></svg>',
    dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="8" width="3" height="8" rx="1"/><rect x="5.5" y="6" width="2.5" height="12" rx="1"/><path d="M8 12h8"/><rect x="16" y="6" width="2.5" height="12" rx="1"/><rect x="18.5" y="8" width="3" height="8" rx="1"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
  };

  /* ---------- Formular-Bausteine ---------- */
  function fld(label, inner) { return '<label class="field"><span>' + label + '</span>' + inner + '</label>'; }
  function grid(a, b) { return '<div class="grid2">' + a + b + '</div>'; }
  function wdOptions(sel) {
    return WEEKDAYS.map(function (w) { return '<option value="' + w + '"' + (w === sel ? ' selected' : '') + '>' + wdName(w) + '</option>'; }).join('');
  }
  var inTime = function (v) { return '<input class="input" type="time" name="time" value="' + esc(v) + '" required>'; };
  var inPlace = function (v, ph) { return '<input class="input" name="place" value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' required>'; };
  var inDate = function (v) { return '<input class="input" type="date" name="date" value="' + esc(v) + '" required>'; };
  var inTitle = function (v, ph) { return '<input class="input" name="title" value="' + esc(v) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' required>'; };
  function editRow(kind, id, body, note, extraBtn) {
    return '<li class="editrow"><form class="editform" data-form="' + kind + '" data-id="' + esc(id) + '">' + body +
      (note ? '<p class="small muted" style="margin:-4px 0 12px">' + note + '</p>' : '') +
      '<div class="editbtns"><button class="btn inline" type="submit">' + L('save') + '</button>' +
      '<button class="btn ghost inline" type="button" data-act="edit-cancel">' + L('dismiss') + '</button>' + (extraBtn || '') +
      '</div></form></li>';
  }

  /* ---------- Kalender-Export (.ics) ---------- */
  function icsText(t) {
    return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  // Ende für den Kalender: eingetragenes Ende, sonst Start + Standarddauer
  function evEndDt(e, start) {
    var en = evEndOf(e);
    if (en) {
      var q = en.date.split('-').map(Number), t = en.time.split(':').map(Number);
      var d = new Date(q[0], q[1] - 1, q[2], t[0], t[1]);
      if (d > start) return d;
    }
    return new Date(start.getTime() + (cfg.EVENT_DURATION_MIN || 120) * 60000);
  }
  function icsLocal(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }
  // UTC-Zeit (YYYYMMDDTHHMMSSZ): Start/Ende sind Ortszeit des Geräts, so stimmt die Zeit in jedem Kalender (auch iPhone)
  function icsUtc(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function buildGoogleCalUrl(e) {
    var p = e.date.split('-').map(Number), tm = e.time.split(':').map(Number);
    var start = new Date(p[0], p[1] - 1, p[2], tm[0], tm[1]);
    var end = new Date(start.getTime() + (cfg.EVENT_DURATION_MIN || 120) * 60000);
    function fmt(d) {
      return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
    }
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(e.title) +
      '&dates=' + fmt(start) + '/' + fmt(end) +
      '&location=' + encodeURIComponent(e.place || '') +
      '&details=' + encodeURIComponent((cfg.CLUB_NAME ? cfg.CLUB_NAME + ': ' : '') + e.title);
  }
  function buildIcs(e) {
    var p = e.date.split('-').map(Number), tm = e.time.split(':').map(Number);
    var start = new Date(p[0], p[1] - 1, p[2], tm[0], tm[1]);
    var end = evEndDt(e, start);
    var n = new Date();
    var stamp = n.getUTCFullYear() + pad(n.getUTCMonth() + 1) + pad(n.getUTCDate()) + 'T' + pad(n.getUTCHours()) + pad(n.getUTCMinutes()) + pad(n.getUTCSeconds()) + 'Z';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vereins-Training//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + e.id + '@vereins-training',
      'DTSTAMP:' + stamp,
      'DTSTART:' + icsUtc(start),
      'DTEND:' + icsUtc(end),
      'SUMMARY:' + icsText(e.title),
      'LOCATION:' + icsText(e.place),
      'DESCRIPTION:' + icsText((cfg.CLUB_NAME ? cfg.CLUB_NAME + ': ' : '') + e.title),
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsText(e.title),
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n') + '\r\n';
  }
  // Adresse der Edge-Function fbro-ics: Zeiten in UTC (aus der Ortszeit des Geräts berechnet)
  function icsUrl(e) {
    var p = e.date.split('-').map(Number), tm = e.time.split(':').map(Number);
    var start = new Date(p[0], p[1] - 1, p[2], tm[0], tm[1]);
    var end = evEndDt(e, start);
    var q = { t: e.title, s: icsUtc(start), e: icsUtc(end), u: e.id, d: (cfg.CLUB_NAME ? cfg.CLUB_NAME + ': ' : '') + e.title };
    if (e.place) q.l = e.place;
    return cfg.SUPABASE_URL.replace(/\/$/, '') + '/functions/v1/fbro-ics?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
  }
  async function addToCalendar(e) {
    var ics = buildIcs(e);
    var name = (e.title.replace(/[^\w\-äöüÄÖÜéèà ]+/g, '').trim().replace(/\s+/g, '-') || 'Event') + '.ics';
    var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // iPhone / iPad: data:-, Blob- und Teilen-Links führen nicht in den Kalender – eine https-Adresse mit text/calendar
    // (Edge-Function fbro-ics, liest nichts aus der DB, alles steht in der Adresse) öffnet «Zum Kalender hinzufügen»
    if (isIos) {
      var da = document.createElement('a');
      da.href = icsUrl(e); da.target = '_blank'; da.rel = 'noopener';
      document.body.appendChild(da); da.click(); da.remove();
      return;
    }

    // Installierte Android-App: Teilen-Dialog (dort «Kalender»)
    var file = new File([ics], name, { type: 'text/calendar' });
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    if (standalone && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: e.title }); return; }
      catch (err) { if (err && err.name === 'AbortError') return; console.error(err); }
    }

    // Chrome / Firefox / Edge und alle anderen: Blob-URL + download-Attribut.
    // Chrome öffnet .ics-Dateien nach dem Download nicht automatisch — deshalb
    // zusätzlich den webcal:-Link als Alternative anbieten (öffnet direkt Kalender-App).
    // Zuerst versuchen wir den Blob-Download:
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a2 = document.createElement('a');
    a2.href = url; a2.download = name;
    document.body.appendChild(a2); a2.click(); a2.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    toast(L('calFile', { name: name }));
  }

  /* ---------- Views ---------- */
  function viewSetup() {
    return '<div class="login"><div class="langbar">' + langSelect() + '</div><h1>' + L('setupTitle') + '</h1>' +
      '<p class="lead">' + L('setupLead') + '</p>' +
      '<ol class="steps"><li>' + L('setupStep1') + '</li><li>' + L('setupStep2') + '</li><li>' + L('setupStep3') + '</li></ol>' +
      '<p class="small muted">' + L('setupNote') + '</p></div>';
  }

  function viewCandidate() {
    return '<div class="login candidatescreen">' +
      '<img class="loginlogo" src="icons/logo.png" alt="' + esc(cfg.CLUB_NAME || 'FBRO') + '">' +
      '<p class="lead">' + L('candidateTitle') + '</p>' +
      '<p class="lead">' + L('candidateMsg') + '</p></div>';
  }

  function viewLogin() {
    var reg = S.mode === 'register';
    var needCode = reg && cfg.CLUB_CODE_REQUIRED !== false;
    return '<div class="login"><div class="loginhead"><h1>' + esc(cfg.CLUB_NAME || 'Training') + '<br>' + L('loginSub') + '</h1>' +
      '<img class="loginlogo" src="icons/logo.png" alt="' + esc(cfg.CLUB_NAME || 'FBRO') + '"></div>' +
      '<p class="lead">' + (reg ? L('loginLeadReg') : L('loginLead')) + '</p>' +
      '<form data-form="auth">' +
      (reg ? fld(L('fullName'), '<input class="input" name="name" autocomplete="name" required>') : '') +
      fld(L('phone'), phoneField(S.phone, 'tel')) +
      (reg ? '' : fld(L('pinOptional'), '<input class="input pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="current-password" placeholder="······">')) +
      (needCode ? fld(L('clubCode'), '<input class="input" name="code" autocomplete="off" required>') : '') +
      (S.err ? '<p class="err">' + esc(S.err) + '</p>' : '') +
      '<button class="btn" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (reg ? L('register') : L('signIn')) + '</button>' +
      '</form>' +
      '<button type="button" class="linkbtn" data-act="mode" style="margin-top:12px">' + (reg ? L('haveAccount') : L('firstTime')) + '</button>' +
      '</div>';
  }

  function monthList(items, cardFn) {
    var html = '', last = '';
    items.forEach(function (t) {
      var label = fmt(t.date, { month: 'long', year: 'numeric' });
      if (label !== last) { html += '<div class="week">' + esc(label) + '</div>'; last = label; }
      html += cardFn(t);
    });
    return html;
  }

  function viewTrainings() {
    var list = getTrainings();
    var n = cfg.TRAININGS_VISIBLE || 20;
    var first = list.slice(0, n), rest = list.slice(n);
    var html = '<div class="top"><div><h1 class="pagetitle">' + L('titleTrainings') + '</h1></div></div>';
    if (!list.length) {
      return html + '<div class="empty"><p><b>' + L('emptyTrTitle') + '</b></p><p>' + (S.me.isAdmin ? L('emptyTrAdmin') : L('emptyTrMember')) + '</p></div>';
    }
    html += monthList(first, cardHtml);
    if (rest.length) {
      html += '<button type="button" class="morebtn" data-act="more-tr" aria-expanded="' + S.showMore + '"><span>' + L('moreDates', { n: rest.length }) + '</span>' + ICON.chev + '</button>';
      if (S.showMore) html += monthList(rest, cardHtml);
    }
    return html;
  }

  // «Noch nicht geantwortet» sehen nur Aktiv- und Passivmitglieder (nicht Gast, Friends & Family, Kandidat)
  function seesOpen() { return !!(S.me && !S.me.isGuest && !S.me.isSupporter && !S.me.isCandidate); }
  // Teilnehmer bei Trainings und Events bearbeiten: Admin (Events zusätzlich Event Manager)
  function canEditPeople() { return !!(S.me && S.me.isAdmin); }
  function canEditEvPeople() { return !!(S.me && (S.me.isEventManager || S.me.isAdmin)); }

  // Kopfzeile einer Trainingskarte: Datum; bei einem Extra-Training zusätzlich « - Bezeichnung»
  function trDateLabel(t) {
    return fullDate(t.date) + (t.extraId && t.title ? ' - ' + esc(t.title) : '');
  }

  // Teilnehmer eines Trainings: zwei auf- und zuklappbare Gruppen. Standard: «Dabei» aufgeklappt, «Nicht dabei» zugeklappt
  function trGrpOpen(key, g) {
    var v = S.trGrp[key + '|' + g];
    return v === undefined ? g === 'yes' : !!v;
  }
  function trGrp(key, g, label, arr) {
    var open = trGrpOpen(key, g);
    return '<div class="grp"><button type="button" class="grph" data-act="tr-grp" data-key="' + esc(key) + '" data-g="' + g + '" aria-expanded="' + open + '">' +
      '<span class="tlchev' + (open ? ' open' : '') + '">' + ICON.chev + '</span><span>' + label + '</span></button>' +
      (open ? '<div class="chips">' + chips(arr, false) + '</div>' : '') + '</div>';
  }
  function trWho(key, yes, no) {
    return '<div class="who">' + trGrp(key, 'yes', L('hYes', { n: yes.length }), yes) + trGrp(key, 'no', L('hNo', { n: no.length }), no) + '</div>';
  }

  // Protokoll «Letzte Transaktionen» eines Trainings: eine Zeile pro An- oder Abmeldung («DD.MM. / HH:MM - Person - angemeldet #15»)
  function trLogLine(r) {
    var m = S.members.filter(function (x) { return x.id === r.user_id; })[0] || { id: null, name: '?' };
    var d = new Date(r.at);
    var when = z2(d.getDate()) + '.' + z2(d.getMonth() + 1) + '. / ' + z2(d.getHours()) + ':' + z2(d.getMinutes());
    var act = r.action === 'in' ? '<span class="tlin">' + esc(L('trLogIn', { n: r.pos })) + '</span>' : '<span class="tlout">' + esc(L('trLogOut')) + '</span>';
    var by = r.actor_id && r.actor_id !== r.user_id ? ' <span class="tlby">(' + esc(L('trLogByAdmin')) + ')</span>' : '';
    return '<div class="tlln"><span class="tlt">' + when + '</span> - ' + chips([m]) + ' - ' + act + by + '</div>';
  }
  function trLogBlock(key) {
    var rows = S.trLog[key] || [];
    if (!rows.length) return '';
    var closed = !!S.trLogClosed[key], info = !!S.trLogInfo[key];
    return '<div class="tlog"><div class="tlh"><button type="button" class="tltg" data-act="tl-fold" data-key="' + esc(key) + '" aria-expanded="' + !closed + '"><span class="tlchev' + (closed ? '' : ' open') + '">' + ICON.chev + '</span><span>' + esc(L('trLogTitle')) + '</span></button>' +
      (closed ? '' : hico('tl-info', ICON.info, info ? L('infoHide') : L('infoShow'), { on: info, data: { key: key } })) + '</div>' +
      (closed ? '' : (info ? '<p class="tlnote">' + esc(L('trLogInfo')) + '</p>' : '') + rows.map(trLogLine).join('')) + '</div>';
  }
  function cardHtml(t) {
    var r = S.tr[t.key] || {};
    var off = !!S.cancelled[t.key];
    var yes = [], no = [], open = [];
    S.members.forEach(function (m) { (r[m.id] === 'yes' ? yes : r[m.id] === 'no' ? no : open).push(m); });
    var mine = r[S.me.id];
    var isOpen = !!S.open[t.key];
    var cls = yes.length < 8 ? 'low' : yes.length < 13 ? 'ok' : 'high';
    if (off) {
      return '<article class="ccel off" title="' + esc(t.title) + '">' +
        '<div class="cceh grey"><b>' + trDateLabel(t) + ' (' + L('cancelledLow') + ')</b></div>' +
      '</article>';
    }
    return '<article class="ccel" title="' + esc(t.title + ', ' + L('timePlace', { time: t.time, place: t.place })) + '">' +
      '<div class="cceh"><b>' + trDateLabel(t) + '</b>' +
      (canEditPeople() ? hico('tr-people', ICON.pencil, L('evManagePeople'), { data: { key: t.key } }) : '') +
      '</div>' +
      '<div class="ccbody">' +
        '<div class="actrow3">' +
          '<button type="button" class="resp yes" data-act="resp" data-val="yes" data-key="' + esc(t.key) + '" aria-pressed="' + (mine === 'yes') + '">' + ICON.check + L('yes') + '</button>' +
          '<button type="button" class="resp no" data-act="resp" data-val="no" data-key="' + esc(t.key) + '" aria-pressed="' + (mine === 'no') + '">' + ICON.x + L('no') + '</button>' +
          '<button type="button" class="resp cntbtn ' + cls + (isOpen ? ' is-open' : '') + '" data-act="who" data-key="' + esc(t.key) + '" aria-expanded="' + isOpen + '" aria-label="' + esc(L('ariaTr', { yes: yes.length, no: no.length, action: isOpen ? L('listClose') : L('listOpen') })) + '"><b>' + yes.length + '</b>&nbsp;' + L('participants') + ICON.chev + '</button>' +
        '</div>' +
        (isOpen ? trWho(t.key, yes, no) + trLogBlock(t.key) : '') +
      '</div>' +
    '</article>';
  }

  function shortDate(d) {
    // Punkt nach Tageszahl nur für Sprachen, die ihn grammatisch verwenden (de, gsw, bar)
    var dayDot = (lang === 'de' || lang === 'gsw') ? '. ' : ' ';
    // Wochentag-Kurzname: trailing Punkt entfernen (de liefert «Mo.», custom-Sprachen brauchen keinen)
    var wd = fmt(d, { weekday: 'short' }).replace(/\.$/, '');
    // Monatsname: Punkt BEHALTEN für alle Sprachen (de=«Okt.», gsw/bar=«Okt.», fix 3)
    var mo = fmt(d, { month: 'short' });
    return esc(wd) + ' ' + d.getDate() + dayDot + esc(mo);
  }
  function z2(n) { return n < 10 ? '0' + n : '' + n; }
  function fullDate(d) {
    return esc(fmt(d, { weekday: 'long' })) + ', ' + z2(d.getDate()) + '.' + z2(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function fullDateIso(iso) { return fullDate(parseIso(iso)); }
  function monthYear(isoDay) {
    var d = parseIso(isoDay);
    return esc(fmt(d, { month: 'long' })) + ' ' + d.getFullYear();
  }
  function whoBlock(items) {
    return '<div class="who">' + items.map(function (it) {
      return '<div><h4>' + it.label + '</h4><div class="chips">' + chips(it.arr, !!it.plus) + '</div></div>';
    }).join('') + '</div>';
  }
  function openSimpleMenu(items) {
    closeSimpleMenu();
    var wrap = document.createElement('div');
    wrap.id = 'simplemenu';
    wrap.className = 'ccsheet';
    wrap.innerHTML = '<div class="ccsheetcard">' + items.map(function (it, i) {
      return '<button type="button" class="ccact" data-smi="' + i + '">' + it.icon + '<span>' + it.label + '</span></button>';
    }).join('') + '<button type="button" class="ccact close" data-smi="close">' + L('ccClose') + '</button></div>';
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) { closeSimpleMenu(); return; }
      var b = e.target.closest('[data-smi]');
      if (!b) return;
      if (b.dataset.smi === 'close') { closeSimpleMenu(); return; }
      var it = items[Number(b.dataset.smi)];
      closeSimpleMenu();
      if (it && it.onClick) it.onClick();
    });
    document.addEventListener('keydown', simpleMenuKey, true);
    document.body.appendChild(wrap);
    var first = wrap.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
  }
  function simpleMenuKey(e) { if (e.key === 'Escape') { e.preventDefault(); closeSimpleMenu(); } }
  function closeSimpleMenu() {
    var el = document.getElementById('simplemenu');
    if (el) el.remove();
    document.removeEventListener('keydown', simpleMenuKey, true);
  }
  function chips(arr, plus) {
    return arr.length ? arr.map(function (m) {
      var me = m.id === S.me.id, k = m.isGuest ? 'g' : 'm';
      return '<span class="ccp cc-' + k + (me ? ' ccme' : '') + '">' + esc(m.name) + (plus ? ' +1' : '') + (me ? ' ' + L('you') : '') + '</span>';
    }).join('') : '<span class="small muted">' + L('nobody') + '</span>';
  }

  function viewEvents() {
    var list = getEvents();
    var html = '<div class="top"><div><h1 class="pagetitle">' + L('titleEvents') + '</h1></div>' +
      (canManageEvents() ? hico('ev-new', ICON.plus, L('addEvent'), { cls: 'plus' }) : '') + '</div>';
    if (!list.length) {
      return html + '<div class="empty"><p><b>' + L('emptyEvTitle') + '</b></p><p>' + (canManageEvents() ? L('emptyEvAdmin') : L('emptyEvMember')) + '</p></div>';
    }
    html += monthList(list.map(function (e) { return { e: e, date: parseIso(e.date) }; }), function (w) { return eventCardHtml(w.e); });
    return html;
  }

  function eventCardHtml(e) {
    var r = S.ev[e.id] || {};
    var solo = [], duo = [], no = [], open = [];
    S.members.forEach(function (m) {
      (r[m.id] === 'solo' ? solo : r[m.id] === 'duo' ? duo : r[m.id] === 'no' ? no : open).push(m);
    });
    var persons = solo.length + 2 * duo.length;
    var mine = r[S.me.id];
    var isOpen = !!S.open['ev:' + e.id];
    var btn = function (val, cls, icon, label) {
      return '<button type="button" class="resp ' + cls + '" data-act="resp-ev" data-val="' + val + '" data-id="' + e.id + '" aria-pressed="' + (mine === val) + '">' + icon + label + '</button>';
    };
    if (e.cancelled) {
      return '<article class="ccel off" title="' + esc(e.title) + '">' +
        '<div class="cceh grey"><b>' + fullDate(parseIso(e.date)) + ' \u2013 ' + esc(e.title) + ' (' + L('cancelledLow') + ')</b></div>' +
      '</article>';
    }
    return '<article class="ccel">' +
      '<div class="cceh"><b>' + fullDate(parseIso(e.date)) + ' \u2013 ' + esc(e.title) + '</b>' +
      (canEditEvPeople() ? '<button type="button" class="hico" data-act="ev-menu" data-id="' + e.id + '" aria-label="' + esc(L('ccActions') + ': ' + e.title) + '" title="' + esc(L('ccActions')) + '">' + ICON.dots + '</button>' : '') +
      '</div>' +
      '<div class="ccbody">' +
        '<div class="evline"><p class="muted small evinfo">' + esc(L('timePlace', { time: evTimeText(e), place: e.place })) + '</p>' +
        '<button type="button" class="hico calbtn" data-act="cal" data-id="' + e.id + '" aria-label="' + esc(L('calAdd')) + '" title="' + esc(L('calAdd')) + '">' + ICON.calplus + '</button></div>' +
        (e.rsvp ? (
          '<div class="actrow4">' +
            btn('solo', 'yes', ICON.one, L('solo')) + btn('duo', 'yes', ICON.two, L('duo')) + btn('no', 'no', '', L('no')) +
            '<button type="button" class="resp cntbtn' + (isOpen ? ' is-open' : '') + '" data-act="who-ev" data-id="' + e.id + '" aria-expanded="' + isOpen + '" aria-label="' + esc(L('ariaEv', { n: persons, action: isOpen ? L('listClose') : L('listOpen') })) + '"><b>' + persons + '</b>&nbsp;' + L('participants') + ICON.chev + '</button>' +
          '</div>' +
          (isOpen ? whoBlock([
            { label: L('hSolo', { n: solo.length }), arr: solo },
            { label: L('hDuo', { n: duo.length, p: duo.length * 2 }), arr: duo, plus: true },
            { label: L('hNo', { n: no.length }), arr: no }
          ].concat(seesOpen() ? [{ label: L('hOpen', { n: open.length }), arr: open }] : [])) : '')
        ) : '') +
      '</div>' +
    '</article>';
  }

  function accordion(id, title, count, body, canAdd, info) {
    var open = !!S.sec[id], showInfo = !!S.info[id], showAdd = !!S.add[id];
    // Einheitlich wie bei C&C und Jass: Titel links (klappt auf/zu), «+» und Info direkt als Icons, Pfeil ganz rechts
    return '<section class="ccel"><div class="cceh">' +
      '<button type="button" class="cct" data-act="sec" data-id="' + id + '" aria-expanded="' + open + '">' +
      title + (count != null ? ' <span class="cnt">(' + count + ')</span>' : '') + '</button>' +
      (canAdd ? hico('add-toggle', ICON.plus, showAdd ? L('addClose') : L('addNew'), { on: showAdd, cls: 'plus', data: { id: id } }) : '') +
      (info ? hico('info-toggle', ICON.info, showInfo ? L('infoHide') : L('infoShow'), { on: showInfo, data: { id: id } }) : '') +
      '<button type="button" class="ccfold' + (open ? ' open' : '') + '" data-act="sec" data-id="' + id + '" aria-hidden="true" tabindex="-1">' + ICON.chev + '</button>' +
      '</div>' + (info && showInfo ? '<p class="infobar">' + info + '</p>' : '') + (open ? '<div class="ccbody">' + body + '</div>' : '') + '</section>';
  }

  // Zeile (oder Bearbeiten-Formular) für einen einzelnen Trainingstermin
  function trRow(t) {
    var off = !!S.cancelled[t.key];
    if (S.edit === 'tr:' + t.key) {
      var body = (t.extraId ? fld(L('label'), inTitle(t.title)) : '') + grid(fld(L('date'), inDate(t.iso)), fld(L('time'), inTime(t.time))) + fld(L('place'), inPlace(t.place));
      var reset = S.overrides[t.key] ? '<button class="btn ghost inline" type="button" data-act="reset-tr" data-key="' + esc(t.key) + '">' + L('reset') + '</button>' : '';
      return editRow('edit-tr', t.key, body, t.extraId ? '' : L('editNote'), reset);
    }
    return '<li' + (off ? ' class="offrow"' : '') + '><div class="l"><b>' + esc(fmt(t.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) + ', ' + esc(t.time) + '</b>' +
      '<span>' + esc(t.title) + ', ' + esc(t.place) + (t.changed ? ' · ' + L('changedLow') : '') + '</span></div>' +
      '<div class="btnrow"><button type="button" class="mini" data-act="edit" data-target="tr:' + esc(t.key) + '">' + L('edit') + '</button>' +
      '<button type="button" class="mini ' + (off ? 'react' : 'cancelbtn') + '" data-act="cancel" data-key="' + esc(t.key) + '">' + (off ? L('reactivate') : L('cancel')) + '</button>' +
      (t.extraId ? '<button type="button" class="mini del" data-act="del-extra" data-id="' + t.extraId + '">' + L('del') + '</button>' : '') + '</div></li>';
  }

  function viewAdmin() {
    var all = getTrainings();
    var series = all.filter(function (t) { return !t.extraId; });
    var extras = all.filter(function (t) { return !!t.extraId; });
    var isAdm = S.me.isAdmin;
    var html = '<div class="top"><div><h1 class="pagetitle">' + L('adminTitle') + '</h1></div></div>';
    var b;

    /* Montag Trainings */
    b = '';
    if (S.add.rules) {
      b += '<form class="addform" data-form="rule">' + grid(fld(L('weekday'), '<select class="input" name="wd">' + wdOptions(1) + '</select>'), fld(L('time'), inTime('19:00'))) +
        fld(L('place'), inPlace('', L('phPlaceTraining'))) +
        '<button class="btn" type="submit">' + L('addRule') + '</button></form>';
    }
    b += S.rules.length ? '<ul class="list">' + S.rules.map(function (r) {
      if (S.edit === 'rule:' + r.id) {
        return editRow('edit-rule', r.id, grid(fld(L('weekday'), '<select class="input" name="wd">' + wdOptions(r.wd) + '</select>'), fld(L('time'), inTime(r.time))) + fld(L('place'), inPlace(r.place)));
      }
      return '<li><div class="l"><b>' + wdName(r.wd) + ', ' + esc(L('atTime', { time: r.time })) + '</b><span>' + esc(r.place) + '</span></div>' +
        '<div class="btnrow"><button type="button" class="mini" data-act="edit" data-target="rule:' + r.id + '">' + L('edit') + '</button>' +
        '<button type="button" class="mini del" data-act="del-rule" data-id="' + r.id + '">' + L('remove') + '</button></div></li>';
    }).join('') + '</ul>' : '<p class="muted">' + L('rulesEmpty') + '</p>';
    if (isAdm) html += accordion('rules', L('secRules'), S.rules.length, b, true);

    /* Weitere Trainings (zusätzliche Termine) */
    b = '';
    b += extras.length ? '<ul class="list scroll" data-sc="extras">' + extras.map(trRow).join('') + '</ul>' : '<p class="muted">' + L('extraEmpty') + '</p>';
    b += '<form class="addbox" data-form="extra">' + fld(L('label'), inTitle(L('extraDefaultTitle'))) +
      grid(fld(L('date'), '<input class="input" type="date" name="date" required>'), fld(L('time'), inTime('18:00'))) +
      fld(L('place'), inPlace('', L('phPlaceExtra'))) +
      '<button class="btn" type="submit">' + L('addExtra') + '</button></form>';
    if (isAdm) html += accordion('extra', L('secExtra'), extras.length, b, false);

    /* Kommende Trainings (Termine der Serie) */
    b = series.length ? '<ul class="list scroll" data-sc="upcoming">' + series.map(trRow).join('') + '</ul>' : '<p class="muted">' + L('upcomingEmpty') + '</p>';
    if (isAdm) html += accordion('upcoming', L('secUpcoming'), series.length, b);

    /* Events */
    var evs = getEvents();
    b = '';
    b += evs.length ? '<ul class="list scroll" data-sc="events">' + evs.map(function (e) {
      return '<li><div class="l"><b>' + esc(e.title) + '</b><span>' + esc(fmt(parseIso(e.date), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })) + ', ' + esc(evTimeText(e)) + ', ' + esc(e.place) + (e.cancelled ? ' · ' + L('cancelledLow') : '') + '</span></div>' +
        '<div class="btnrow"><button type="button" class="mini" data-act="ev-edit" data-id="' + e.id + '">' + L('edit') + '</button>' +
        '<button type="button" class="mini" data-act="cancel-ev" data-id="' + e.id + '">' + (e.cancelled ? L('reactivate') : L('cancel')) + '</button>' +
        '<button type="button" class="mini del" data-act="del-ev" data-id="' + e.id + '">' + L('del') + '</button></div></li>';
    }).join('') + '</ul>' : '<p class="muted">' + L('eventsEmpty') + '</p>';
    if (S.me.isEventManager) html += accordion('events', L('secEvents'), evs.length, b, true);

    /* Generalversammlung: Sichtbarkeit (nur Admin) */
    var gvList = S.gvAdmin || (S.gv && S.gv.all);
    if (isAdm && gvList) {
      b = gvList.length ? '<ul class="list">' + gvList.map(function (g) {
        return '<li><div class="l"><b>' + esc(g.title) + '</b><span>' + esc(g.year) + '</span></div>' +
          '<select class="input gvvis" data-gvvis="' + esc(g.id) + '" aria-label="' + esc(L('gvVisSec') + ' ' + g.year) + '">' +
          GV_VIS.map(function (v) { return '<option value="' + v + '"' + (g.visibility === v ? ' selected' : '') + '>' + esc(L(gvVisLabel(v))) + '</option>'; }).join('') +
          '</select></li>';
      }).join('') + '</ul>' : '<p class="muted">' + L('gvVisEmpty') + '</p>';
      html += accordion('gvvis', L('gvVisSec'), null, b, false);
    }

    /* Mitglieder */
    b = '';
    if (S.add.members) {
      b += '<form class="addform" data-form="member"><h3 style="margin-bottom:10px">' + L('memberAdd') + '</h3>' +
        fld(L('fullName'), '<input class="input" name="name" autocomplete="off" required>') +
        fld(L('phone'), phoneField('')) +
        '<p class="small muted" style="margin:-4px 0 12px">' + L('memberAddNote') + '</p>' +
        '<label class="check"><input type="checkbox" name="guest" value="1"><span>' + L('guestCheck') + '</span></label>' +
        '<button class="btn" type="submit">' + L('memberAdd') + '</button></form>';
    }
    var mbRow = function (m) {
      var self = m.id === S.me.id;
      return '<li class="mbrow">' +
        '<div class="l"><b>' + esc(m.name) + ' <span class="pinlamp ' + (m.pinChanged ? 'ok' : 'no') + '" title="' + esc(m.pinChanged ? L('pinLampOk') : L('pinLampNo')) + '" aria-label="' + esc(m.pinChanged ? L('pinLampOk') : L('pinLampNo')) + '"></span>' + (self ? ' <span class="mbyou">' + L('you') + '</span>' : '') + '</b><span>' + esc(fmtPhone(m.phone)) + '</span></div>' +
        '<span class="mbicons">' +
          (m.isAdmin ? '<span class="mbic adm" title="' + esc(L('adminTag')) + '" aria-label="' + esc(L('adminTag')) + '">' + ICON.gear + '</span>' : '') +
          (m.isEventManager ? '<span class="mbic em" title="' + esc(L('emTag')) + '" aria-label="' + esc(L('emTag')) + '">' + ICON.star + '</span>' : '') +
          (m.isChilbiManager ? '<span class="mbic em" title="' + esc(L('cmTag')) + '" aria-label="' + esc(L('cmTag')) + '">' + ICON.glass + '</span>' : '') +
          (m.isChraenzliManager ? '<span class="mbic em" title="' + esc(L('crmTag')) + '" aria-label="' + esc(L('crmTag')) + '">' + ICON.glass + '</span>' : '') +
          (m.isDirector ? '<span class="mbic em" title="' + esc(L('dirTag')) + '" aria-label="' + esc(L('dirTag')) + '">' + ICON.stage + '</span>' : '') +
          (m.isActor ? '<span class="mbic em" title="' + esc(L('actTag')) + '" aria-label="' + esc(L('actTag')) + '">' + ICON.stage + '</span>' : '') +
          (m.isJassMaster ? '<span class="mbic jm" title="' + esc(L('jmTag')) + '" aria-label="' + esc(L('jmTag')) + '">' + ICON.trophy + '</span>' : '') +
          (m.isBoard ? '<span class="mbic em" title="' + esc(L('boTag')) + '" aria-label="' + esc(L('boTag')) + '">' + ICON.gv + '</span>' : '') +
        '</span>' +
        '<button type="button" class="hico" data-act="mb-menu" data-id="' + esc(m.id) + '" aria-label="' + esc(L('ccActions') + ': ' + m.name) + '" title="' + esc(L('ccActions')) + '">' + ICON.dots + '</button></li>';
    };
    var mbGroup = function (key, label, list, guestStyle, icon) {
      var open = S.sec[key] === true;
      return '<div class="mbgrp"><button type="button" class="mbgh" data-act="mb-grp" data-id="' + key + '" aria-expanded="' + open + '">' +
        '<span class="mbcrown' + (guestStyle ? ' g' : '') + '">' + (icon || ICON.crown) + '</span><span>' + label + ' <span class="cnt">(' + list.length + ')</span></span>' +
        '<span class="sp"></span><span class="ccfold' + (open ? ' open' : '') + '">' + ICON.chev + '</span></button>' +
        (open ? (list.length ? '<ul class="list">' + list.map(mbRow).join('') + '</ul>' : '<p class="ccsum" style="padding:6px 0 10px">' + L('nobody') + '</p>') : '') + '</div>';
    };
    // Fünf sich gegenseitig ausschliessende Gruppen; Reihenfolge der Prüfung = Priorität
    b += mbGroup('mg-a', L('grpActive'), S.members.filter(function (m) { return !m.isGuest && !m.isCandidate && !m.isPassive && !m.isSupporter; }), false, ICON.groupA) +
         mbGroup('mg-p', L('grpPassive'), S.members.filter(function (m) { return !m.isGuest && !m.isCandidate && m.isPassive && !m.isSupporter; }), false, ICON.groupP) +
         mbGroup('mg-s', L('grpSupporter'), S.members.filter(function (m) { return !m.isGuest && !m.isCandidate && m.isSupporter; }), true, ICON.heart) +
         mbGroup('mg-g', L('ccGuests'), S.members.filter(function (m) { return m.isGuest && !m.isCandidate; }), true, ICON.groupG) +
         mbGroup('mg-c', L('grpCandidate'), S.members.filter(function (m) { return m.isCandidate; }), true, ICON.candidate);
    if (isAdm) html += accordion('members', L('secMembers'), S.members.length, b, true, L('membersIntro'));
    return html;
  }

  // Eigene Gruppe (Aktiv/Passiv/Friends & Family/Gast/Kandidat) mit demselben Icon/Text wie
  // in der Admin-Mitgliederliste, damit die Profilseite immer zur echten Einordnung passt.
  function meGroupIcon() {
    return S.me.isCandidate ? ICON.candidate : S.me.isGuest ? ICON.groupG : S.me.isSupporter ? ICON.heart : S.me.isPassive ? ICON.groupP : ICON.groupA;
  }
  function meGroupLabel() {
    return L(S.me.isCandidate ? 'grpCandidate' : S.me.isGuest ? 'ccGuests' : S.me.isSupporter ? 'grpSupporter' : S.me.isPassive ? 'grpPassive' : 'grpActive');
  }

  /* ---------- Push-Mitteilungen (pro Gerät; Standard: keine) ---------- */
  function pushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }
  function b64uToBytes(s) {
    var b = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    var a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  // Einstellung dieses Geräts: ev = Events, tr = Trainings, h = Stunden vor dem Training (24 oder 48)
  function pushPrefs() { return S.pp || { ev: false, tr: false, h: 48 }; }
  async function pushRefresh() {
    var on = false, pp = { ev: false, tr: false, h: (S.pp && S.pp.h) || 48 };
    try {
      if (pushSupported() && S.me) {
        var reg = await navigator.serviceWorker.getRegistration();
        var sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub) {
          var r = await sb.from('push_subscriptions').select('pref_events,pref_trainings,train_hours').eq('endpoint', sub.endpoint).limit(1);
          if (r.data && r.data.length) {
            on = true;
            pp = { ev: !!r.data[0].pref_events, tr: !!r.data[0].pref_trainings, h: r.data[0].train_hours === 24 ? 24 : 48 };
          }
        }
      }
    } catch (e) { console.error(e); }
    if (!!S.pushOn !== on || JSON.stringify(pushPrefs()) !== JSON.stringify(pp)) { S.pushOn = on; S.pp = pp; render(); }
  }
  // Abo anlegen bzw. Einstellungen speichern; false = Erlaubnis verweigert
  async function pushSave(np) {
    if (Notification.permission !== 'granted') {
      var perm = await Notification.requestPermission();
      if (perm !== 'granted') return false;
    }
    var reg = await navigator.serviceWorker.ready;
    var key = await sb.rpc('push_public_key');
    if (key.error || !key.data) throw (key.error || new Error('kein Schluessel'));
    for (var attempt = 0; attempt < 2; attempt++) {
      var sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key.data) });
      var j = sub.toJSON();
      var up = await sb.from('push_subscriptions').upsert({ user_id: S.me.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, pref_events: !!np.ev, pref_trainings: !!np.tr, train_hours: np.h === 24 ? 24 : 48 }, { onConflict: 'endpoint' });
      if (!up.error) return true;
      // Das Abo gehoert noch einer anderen Person (gemeinsames Geraet): neues Abo erzeugen
      console.error(up.error);
      await sub.unsubscribe();
    }
    throw new Error('push subscribe');
  }
  async function pushDisable() {
    var reg = await navigator.serviceWorker.getRegistration();
    var sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  }
  function pushPanel() {
    if (!S.me || S.me.isGuest || S.me.isCandidate || S.me.isSupporter) return '';
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    var h = '<section class="panel"><h2>' + L('pushTitle') + '</h2><p>' + L('pushHint') + '</p>';
    if (!pushSupported()) {
      h += '<p class="small muted">' + L(ios && !standalone ? 'pushIos' : 'pushUnsupported') + '</p>';
    } else if (window.Notification && Notification.permission === 'denied') {
      h += '<p class="small muted">' + L('pushDenied') + '</p>';
    } else {
      if (S.pushChk === undefined) { S.pushChk = true; pushRefresh(); }
      var pp = pushPrefs();
      h += '<label class="check"><input type="checkbox" data-act="push-pref" data-k="ev"' + (pp.ev ? ' checked' : '') + '><span>' + L('pushEvents') + '</span></label>' +
        '<label class="check"><input type="checkbox" data-act="push-pref" data-k="tr"' + (pp.tr ? ' checked' : '') + '><span>' + L('pushTrainings') + '</span></label>';
      if (pp.tr) {
        h += '<p class="small muted" style="margin:10px 0 6px">' + L('pushHoursLbl') + '</p><div class="segctl" role="group">' +
          [24, 48].map(function (n) { return '<button type="button" class="segbtn' + (pp.h === n ? ' on' : '') + '" data-act="push-hours" data-val="' + n + '" aria-pressed="' + (pp.h === n) + '"><span>' + L(n === 24 ? 'pushH24' : 'pushH48') + '</span></button>'; }).join('') + '</div>';
      }
    }
    return h + '</section>';
  }

  function viewProfile() {
    var iosHint = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    var install = '';
    if (!standalone) {
      if (installPrompt) install = '<section class="panel"><h2>' + L('installTitle') + '</h2><p>' + L('installHint') + '</p><button type="button" class="btn" data-act="install">' + L('installBtn') + '</button></section>';
      else if (iosHint) install = '<section class="panel"><h2>' + L('installTitle') + '</h2><p>' + L('installIos') + '</p></section>';
    }
    return '<div class="top" style="align-items:center"><div><h1 class="pagetitle">' + L('profileTitle') + '</h1></div><span class="appver" title="' + esc(L('appVersion')) + '">' + esc(APP_VERSION) + '</span></div>' +
      '<section class="panel"><div class="profile-row"><span class="muted">' + L('nameLabel') + '</span><b>' + esc(S.me.name) + '</b></div>' +
      '<div class="profile-row"><span class="muted">' + L('phone') + '</span><b>' + esc(fmtPhone(S.me.phone)) + '</b></div></section>' +
      '<section class="panel"><h2>' + L('rolesTitle') + '</h2>' +
        '<div class="rolerow"><span class="mbcrown" style="width:40px;height:40px">' + meGroupIcon() + '</span><span>' + meGroupLabel() + '</span></div>' +
        (S.me.isAdmin ? '<div class="rolerow"><span class="rolebtn star on">' + ICON.gear + '</span><span>' + L('adminTag') + '</span></div>' : '') +
        (S.me.isEventManager ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.star + '</span><span>' + L('emTag') + '</span></div>' : '') +
        (S.me.isChilbiManager ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.glass + '</span><span>' + L('cmTag') + '</span></div>' : '') +
        (S.me.isChraenzliManager ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.glass + '</span><span>' + L('crmTag') + '</span></div>' : '') +
        (S.me.isDirector ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.stage + '</span><span>' + L('dirTag') + '</span></div>' : '') +
        (S.me.isActor ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.stage + '</span><span>' + L('actTag') + '</span></div>' : '') +
        (S.me.isJassMaster ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.trophy + '</span><span>' + L('jmTag') + '</span></div>' : '') +
        (S.me.isBoard ? '<div class="rolerow"><span class="rolebtn glass on">' + ICON.gv + '</span><span>' + L('boTag') + '</span></div>' : '') +
        (S.me.isGuest ? '<p class="small muted" style="margin:10px 0 0">' + L('guestInfo') + '</p>' : '') +
        (S.me.isSupporter ? '<p class="small muted" style="margin:10px 0 0">' + L('supporterInfo') + '</p>' : '') +
      '</section>' +
      '<section class="panel"><h2>' + L('language') + '</h2><p>' + L('languageHint') + '</p>' + langSelect() + '</section>' +
      pushPanel() +
      '<section class="panel"><h2>' + L('themeTitle') + '</h2><p>' + L('themeHint') + '</p>' + themeSelect() + '</section>' +
      '<section class="panel"><h2>' + L('designTitle') + '</h2><p>' + L('designHint') + '</p>' + designSelect() + '</section>' +
      install +
      '<section class="panel"><h2>' + L('nameChange') + '</h2><form data-form="name">' + fld(L('fullName'), '<input class="input" name="name" value="' + esc(S.me.name) + '" required>') +
      '<button class="btn" type="submit">' + L('nameSave') + '</button></form></section>' +
      '<section class="panel"><h2>' + L('pinChange') + '</h2><p>' + L('pinIntro') + '</p><form data-form="pin">' +
      fld(L('pinNew'), '<input class="input pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="new-password" required>') +
      '<button class="btn" type="submit">' + L('pinSave') + '</button></form>' +
      '<button type="button" class="linkbtn" data-act="pin-default" style="margin-top:10px">' + L('pinDefault') + '</button></section>' +
      '<button type="button" class="btn dangerbtn" data-act="logout">' + ICON.logout + L('logout') + '</button>';
  }

  function renderNav() {
    var nav = document.getElementById('nav');
    if (S.step !== 'app' || (S.me && S.me.isCandidate)) { nav.hidden = true; document.body.classList.remove('hasnav'); return; }
    nav.hidden = false;
    // Mit Fussleiste ist jede Seite mindestens so hoch wie der Bildschirm bei eingeklappter Browserleiste (siehe .hasnav .shell):
    // sonst hängt die Fussleiste bei kurzen Seiten (Jass, C&C, Admin) höher als bei langen
    document.body.classList.add('hasnav');
    // Admin ist immer von der Einschränkung ausgenommen (z. B. falls ein Admin zusätzlich bei
    // Gast/Friends and Family eingeteilt ist). Gast & Friends and Family: nur Trainings und Profil.
    var restricted = (S.me.isGuest || S.me.isSupporter) && !S.me.isAdmin;
    var noJass = S.me.isGuest && !S.me.isAdmin;   // Jass bleibt für Friends and Family zusätzlich sichtbar
    var tabs = [{ id: 'trainings', label: L('navTrainings'), icon: ICON.dumbbell }];
    if (!restricted) tabs.push({ id: 'events', label: L('navEvents'), icon: ICON.star });
    if (!noJass) tabs.push({ id: 'jass', label: L('navJass'), icon: ICON.trophy });
    if ((canCC() || S.ccPublic) && !noJass) tabs.push({ id: 'cc', label: L('navCC'), icon: ICON.glass });
    if (canShow()) tabs.push({ id: 'show', label: L('navShow'), icon: ICON.stage });
    if (gvVisible()) tabs.push({ id: 'gv', label: L('navGv'), icon: ICON.gv });
    if (S.me.isAdmin || canManageEvents()) tabs.push({ id: 'admin', label: L('navAdmin'), icon: ICON.gear });
    tabs.push({ id: 'profile', label: L('navProfile'), icon: ICON.user });
    nav.innerHTML = '<div class="in">' + tabs.map(function (t) {
      return '<button type="button" class="tab" data-act="tab" data-tab="' + t.id + '"' + (S.tab === t.id ? ' aria-current="page"' : '') + '>' + t.icon + '<span>' + t.label + '</span></button>';
    }).join('') + '</div>';
  }

  function render() {
    var app = document.getElementById('app');
    var y = window.scrollY;
    var lts = {};
    document.querySelectorAll('.list.scroll').forEach(function (x) { lts[x.dataset.sc] = x.scrollTop; });
    if (S.step === 'setup') app.innerHTML = viewSetup();
    else if (S.step === 'loading') app.innerHTML = '<div class="login"><p class="muted">' + L('loading') + '</p></div>';
    else if (S.step === 'login') app.innerHTML = viewLogin();
    else if (S.me && S.me.isCandidate) {
      app.innerHTML = viewCandidate();
      renderNav();
      window.scrollTo(0, y);
      return;
    }
    else {
      if (S.tab === 'admin' && !S.me.isAdmin && !canManageEvents()) S.tab = 'trainings';
      if (S.tab === 'events' && (S.me.isGuest || S.me.isSupporter) && !S.me.isAdmin) S.tab = 'trainings';
      if (S.tab === 'cc' && S.me.isGuest && !S.me.isAdmin) S.tab = 'trainings';
      if (S.tab === 'jass' && S.me.isGuest && !S.me.isAdmin) S.tab = 'trainings';
      if (S.tab === 'cc' && !(canCC() || S.ccPublic)) S.tab = 'trainings';
      if (S.tab === 'show' && !canShow()) S.tab = 'trainings';
      if (S.tab === 'gv' && !gvVisible()) S.tab = 'trainings';
      var pageHtml = S.tab === 'gv' ? viewGv() : S.tab === 'show' ? viewShow() : S.tab === 'jass' ? viewJass() : S.tab === 'cc' ? viewCC() : S.tab === 'admin' ? viewAdmin() : S.tab === 'events' ? viewEvents() : S.tab === 'profile' ? viewProfile() : viewTrainings();
      // PIN-Banner: nur für Aktiv-/Passivmitglieder (nicht Gast, Supporter, Kandidat, Admin) ohne gesetzten PIN
      var pinBanner = '';
      if (S.me && !S.me.pinChanged && !S.me.isAdmin && !S.me.isCandidate) {
        pinBanner = '<div class="pinbanner" role="alert">' +
          '<span>' + esc(L('pinBannerMsg')) + '</span>' +
          '<button type="button" class="btn inline" data-act="tab" data-tab="profile">' + esc(L('pinBannerBtn')) + '</button>' +
          '</div>';
      }
      app.innerHTML = pinBanner + pageHtml;
    }
    renderNav();
    fitTitles();
    window.scrollTo(0, y);
    document.querySelectorAll('.list.scroll').forEach(function (x) { if (lts[x.dataset.sc]) x.scrollTop = lts[x.dataset.sc]; });
  }

  // Seitentitel verkleinern, bis sie auf einer Zeile Platz haben (statt umzubrechen)
  function fitTitles() {
    document.querySelectorAll('.pagetitle').forEach(function (el) {
      el.style.fontSize = '';
      var max = parseFloat(getComputedStyle(el).fontSize);
      var min = 15;   // Minimalgrösse in px, darunter lieber nicht weiter schrumpfen
      var size = max;
      while (el.scrollWidth > el.clientWidth + 1 && size > min) {
        size -= 1;
        el.style.fontSize = size + 'px';
      }
    });
  }

  // Aktualisiert im Hintergrund, ohne eine laufende Eingabe zu stören
  function softRender() {
    var a = document.activeElement;
    if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && document.getElementById('app').contains(a)) return;
    render();
  }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('nonav', S.step !== 'app');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  /* ---------- C&C: Chränzli und Chilbi ---------- */
  // Anlass > Tag > Schicht > Rolle. Sichtbar für Admins und Event Manager.
  function canCC() { return !!(S.me && (S.me.isChilbiManager || S.me.isChraenzliManager)); }   // Admin nur, wenn er sich die Rolle selbst gibt
  function canShow() { return !!(S.me && (S.me.isDirector || S.me.isActor)); }   // Tab «Show»: nur Regisseur und Schauspieler (Admin nur mit Rolle)
  function shEdit() { return !!(S.me && S.me.isDirector); }   // bearbeiten: nur Regisseur
  function canManageEvents() { return !!(S.me && S.me.isEventManager); }   // Admin nur, wenn er sich die Rolle selbst gibt
  function ccNorm(n) { return String(n || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function ccMap() { var m = {}; S.members.forEach(function (p) { m[ccNorm(p.name)] = p; }); return m; }
  function ccMember(id) { return S.members.filter(function (x) { return x.id === id; })[0] || null; }

  // Person auflösen: über die ID oder den Namen einem Mitglied/Gast zuordnen, sonst «Andere»
  function ccResolve(pe, map) {
    var p = pe.id ? ccMember(pe.id) : null;
    if (!p && pe.name) p = map[ccNorm(pe.name)] || null;
    // kind = aktuelle Gruppe: a Aktiv, p Passiv, f Friends & Family, g Gast/Kandidat, x nicht in der App
    if (p) return { name: p.name, kind: (p.isGuest || p.isCandidate) ? 'g' : p.isSupporter ? 'f' : p.isPassive ? 'p' : 'a', id: p.id };
    return { name: pe.name || '?', kind: 'x', id: null };
  }
  function ccKindLabel(k) { return k === 'a' ? L('grpActive') : k === 'p' ? L('grpPassive') : k === 'f' ? L('grpSupporter') : k === 'g' ? L('ccGuests') : L('ccOthers'); }
  // Legende der Farben (Gruppen) und «ich»
  // Seitentitel mit Info-Icon rechts; der Klick blendet die Farblegende darunter ein/aus
  function pageTopLegend(titleKey, id, extra) {
    var on = !!S.info[id];
    return '<div class="top" style="align-items:center"><div><h1 class="pagetitle">' + L(titleKey) + '</h1></div>' +
      hico('info-toggle', ICON.info, on ? L('infoHide') : L('infoShow'), { on: on, data: { id: id } }) + (extra || '') + '</div>' +
      (on ? '<div class="infobar">' + ccLegend() + '</div>' : '');
  }
  function ccLegend() {
    var chip = function (cls, label) { return '<span class="ccp ' + cls + '">' + esc(label) + '</span>'; };
    return '<div class="cclegend">' + chip('cc-a', ccKindLabel('a')) + chip('cc-p', ccKindLabel('p')) + chip('cc-f', ccKindLabel('f')) +
      chip('cc-g', ccKindLabel('g')) + chip('cc-x', ccKindLabel('x')) + chip('ccme', L('ccLegendMe')) + '</div>';
  }
  function ccChip(pe, map) {
    var r = ccResolve(pe, map);
    var tap = r.kind === 'x' && S.me.isAdmin;   // Admins können «Andere» als Gast übernehmen
    var me = !!(S.me && r.id && r.id === S.me.id);
    var inner = esc(r.name);
    var title = esc(r.name + ' · ' + ccKindLabel(r.kind));
    return tap
      ? '<button type="button" class="ccp cc-x" data-act="cc-guest" data-name="' + esc(r.name) + '" title="' + title + '">' + inner + '</button>'
      : '<span class="ccp cc-' + r.kind + (me ? ' ccme' : '') + '" title="' + title + '">' + inner + '</span>';
  }
  function ccDate(isoDay) {
    var d = parseIso(isoDay);
    return fmt(d, { weekday: 'short' }).replace(/\.$/, '') + ' ' + pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function ccOvernight(s) { return s.end_time <= s.start_time; }
  function ccEndKey(s) { return (ccOvernight(s) ? '1' : '0') + s.end_time; }   // Ende am Folgetag kommt nach allen Enden am selben Tag
  function ccTimePlain(s) { return s.start_time + ' – ' + s.end_time; }
  function ccTime(s) { return esc(ccTimePlain(s)); }
  function ccAddDays(isoDay, n) { var d = parseIso(isoDay); d.setDate(d.getDate() + n); return iso(d); }
  function ccByCreated(a, b) { return String(a.created_at || '') < String(b.created_at || '') ? -1 : String(a.created_at || '') > String(b.created_at || '') ? 1 : 0; }

  function ccTree() {
    var C = S.cc;
    return C.events.slice().sort(ccByCreated).map(function (e) {
      var days = C.days.filter(function (d) { return d.event_id === e.id; })
        .sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : ccByCreated(a, b); })
        .map(function (d) {
          var shifts = C.shifts.filter(function (s) { return s.day_id === d.id; })
            .sort(function (a, b) { var ea = ccEndKey(a), eb = ccEndKey(b); return a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : (ea < eb ? -1 : ea > eb ? 1 : ccByCreated(a, b)); })
            .map(function (s) {
              return { s: s, roles: C.roles.filter(function (r) { return r.shift_id === s.id; }).sort(function (a, b) { return (a.sort - b.sort) || ccByCreated(a, b); }) };
            });
          return { d: d, shifts: shifts };
        });
      return { e: e, days: days };
    });
  }
  function ccIsFolded(id) {
    if (S.ccFold[id] != null) return S.ccFold[id];
    var e = S.cc.events.filter(function (x) { return x.id === id; })[0];
    return e ? !e.active : false;   // inaktive Anlässe starten eingeklappt
  }
  function ccDots(lvl, id, label) {
    return '<button type="button" class="hico" data-act="cc-menu" data-lvl="' + lvl + '"' + (id ? ' data-id="' + esc(id) + '"' : '') +
      ' aria-label="' + esc(L('ccActions') + (label ? ': ' + label : '')) + '" title="' + esc(L('ccActions')) + '">' + ICON.dots + '</button>';
  }

  /* ---------- C&C: Einsatzplan als PDF teilen ---------- */
  var LOGO_DATAURL = null;
  async function ensureLogoDataUrl() {
    if (LOGO_DATAURL) return LOGO_DATAURL;
    try {
      var resp = await fetch('icons/logo.png');
      var blob = await resp.blob();
      LOGO_DATAURL = await new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () { res(fr.result); };
        fr.onerror = rej;
        fr.readAsDataURL(blob);
      });
    } catch (e) { LOGO_DATAURL = null; }
    return LOGO_DATAURL;
  }

  async function ccExportPdf(eventId) {
    var ev = S.cc.events.filter(function (x) { return x.id === eventId; })[0];
    if (!ev || !window.jspdf) { toast(L('ccPdfFailed')); return; }
    toast(L('ccPdfBuilding'));

    var days = S.cc.days.filter(function (d) { return d.event_id === eventId; })
      .sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
    var dayData = days.map(function (d) {
      var shifts = S.cc.shifts.filter(function (s) { return s.day_id === d.id; })
        .sort(function (a, b) { return a.start_time < b.start_time ? -1 : a.start_time > b.start_time ? 1 : 0; })
        .map(function (s) {
          var roles = S.cc.roles.filter(function (r) { return r.shift_id === s.id; })
            .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
          return { s: s, roles: roles };
        });
      return { d: d, shifts: shifts };
    });

    // Chilbi- bzw. Chränzli Manager ermitteln
    var nameLower = (ev.name || '').toLowerCase();
    var wantChilbi = nameLower.indexOf('chilbi') > -1;
    var wantChraenzli = nameLower.indexOf('chränzli') > -1 || nameLower.indexOf('chraenzli') > -1;
    var mgrs = S.members.filter(function (m) {
      if (wantChilbi && m.isChilbiManager) return true;
      if (wantChraenzli && m.isChraenzliManager) return true;
      if (!wantChilbi && !wantChraenzli && (m.isChilbiManager || m.isChraenzliManager)) return true;
      return false;
    }).map(function (m) { return m.name; });
    var mgrLabel = (wantChilbi ? L('cmTag') : wantChraenzli ? L('crmTag') : L('ccActions')) + ': ' + (mgrs.length ? mgrs.join(', ') : '\u2013');

    var jsPDFCtor = window.jspdf.jsPDF;
    var doc = new jsPDFCtor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var PAGE_W = doc.internal.pageSize.getWidth(), PAGE_H = doc.internal.pageSize.getHeight();
    var MARGIN = 12, GAP = 8, COLW = (PAGE_W - 2 * MARGIN - GAP) / 2;
    var BLUE = [48, 124, 192], BLUE_DARK = [11, 47, 94], BLUE_SOFT = [227, 239, 249], GREY = [93, 103, 122], INK = [22, 35, 59], LINE = [218, 222, 214];

    function wrap(text, size, maxW, style) {
      doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size);
      return doc.splitTextToSize(String(text), maxW);
    }
    function dateLabel(isoDay, name) {
      var d = parseIso(isoDay);
      var wd = fmt(d, { weekday: 'long' });
      var s = wd + ', ' + z2(d.getDate()) + '.' + z2(d.getMonth() + 1) + '.' + d.getFullYear();
      return name ? s + ' (' + name + ')' : s;
    }
    function measureCard(day, w) {
      var titleLines = wrap(dateLabel(day.d.day, day.d.name), 12.5, w - 10, 'bold');
      var h = 9.5 + (titleLines.length - 1) * 5 + 3;
      var valueW = w - 44;
      day.shifts.forEach(function (sh) {
        var t = sh.s.start_time + '\u2013' + sh.s.end_time + (sh.s.name ? '  \u2013  ' + sh.s.name : '');
        h += wrap(t, 9.3, w - 8, 'bold').length * 4.8;
        sh.roles.forEach(function (r) {
          var nm = (r.persons || []).map(function (p) { return p.name; }).join(', ') || '\u2013';
          h += Math.max(wrap(nm, 9.3, valueW, 'normal').length, 1) * 4.3;
        });
        h += 2;
      });
      return h + 3.5;
    }
    function drawCard(day, x, yTop, w) {
      // jsPDF zählt Y nach unten (0 = oben); die Karte wächst daher von yTop aus nach unten.
      var h = measureCard(day, w), yBottom = yTop + h;
      doc.setFillColor(255, 255, 255); doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.3);
      doc.roundedRect(x, yTop, w, h, 3, 3, 'FD');
      var titleLines = wrap(dateLabel(day.d.day, day.d.name), 12.5, w - 10, 'bold');
      var headH = 9.5 + (titleLines.length - 1) * 5;
      doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]);
      doc.roundedRect(x, yTop, w, headH, 3, 3, 'F');
      doc.rect(x, yTop + headH / 2, w, headH / 2, 'F');
      doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);
      var ty = yTop + 5.5;
      titleLines.forEach(function (ln) { doc.text(ln, x + 5, ty); ty += 5; });
      var cy = yTop + headH + 5, valueW = w - 44;
      day.shifts.forEach(function (sh) {
        var t = sh.s.start_time + '\u2013' + sh.s.end_time + (sh.s.name ? '  \u2013  ' + sh.s.name : '');
        doc.setTextColor(INK[0], INK[1], INK[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.3);
        wrap(t, 9.3, w - 8, 'bold').forEach(function (ln) { doc.text(ln, x + 5, cy); cy += 4.8; });
        sh.roles.forEach(function (r) {
          var nm = (r.persons || []).map(function (p) { return p.name; }).join(', ') || '\u2013';
          doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6);
          doc.text(String(r.name) + ':', x + 8, cy);
          doc.setTextColor(INK[0], INK[1], INK[2]); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.3);
          var ty2 = cy;
          wrap(nm, 9.3, valueW, 'normal').forEach(function (ln) { doc.text(ln, x + 44, ty2); ty2 += 4.3; });
          cy = ty2;
        });
        cy += 2;
      });
      return yBottom;
    }

    // Spalten chronologisch ausbalanciert befüllen
    var heights = dayData.map(function (d) { return measureCard(d, COLW); });
    var total = heights.reduce(function (a, b) { return a + b; }, 0) + dayData.length * 6;
    var target = total / 2, cols = [[], []], curH = 0, curCol = 0;
    dayData.forEach(function (d, i) {
      if (curCol === 0 && curH > target && cols[0].length) { curCol = 1; curH = 0; }
      cols[curCol].push(d); curH += heights[i] + 6;
    });

    var logo = await ensureLogoDataUrl();
    function drawHeader() {
      doc.setFillColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
      doc.rect(0, 0, PAGE_W, 24, 'F');
      if (logo) { try { doc.addImage(logo, 'PNG', MARGIN, 4, 13.5, 15.5); } catch (e) { /* Logo optional */ } }
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
      doc.text('Einsatzplan \u00b7 ' + ev.name, MARGIN + 18, 11.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(207, 224, 242);
      doc.text(mgrLabel, MARGIN + 18, 17);
      doc.text('Version', PAGE_W - MARGIN, 9.5, { align: 'right' });
      doc.text(fullDate(new Date()).split(', ')[1] || '', PAGE_W - MARGIN, 14, { align: 'right' });
    }
    function drawFooter() {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(ev.name, MARGIN, PAGE_H - 6);
      doc.text('Seite 1', PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    }

    drawHeader();
    if (!dayData.length) {
      doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(L('ccNoDays'), MARGIN, PAGE_H / 2);
    } else {
      var colX = [MARGIN, MARGIN + COLW + GAP];
      var colY = [30, 30];
      for (var ci = 0; ci < 2; ci++) {
        cols[ci].forEach(function (day) { colY[ci] = drawCard(day, colX[ci], colY[ci], COLW) + 6; });
      }
    }
    drawFooter();

    var fname = 'Einsatzplan_' + String(ev.name).replace(/[^\w\u00C0-\u017F]+/g, '_') + '.pdf';
    var blob = doc.output('blob');
    try {
      var file = new File([blob], fname, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Einsatzplan ' + ev.name });
        return;
      }
    } catch (e) { /* Teilen abgebrochen oder nicht verfügbar: als Download anbieten */ }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function viewCC() {
    var map = ccMap(), ed = canCC();
    var html = pageTopLegend('titleCC', 'cclegend');
    // ccPublic-Toggle entfernt auf Wunsch (war: «Für alle Aktiv- und Passivmitglieder sichtbar»)
    if (S.ccErr) return html + '<div class="empty"><p>' + L('ccSetup') + '</p></div>';
    var tree = ccTree();
    if (!tree.length) return html + '<div class="empty"><p>' + L('ccEmpty') + '</p>' + (ed ? '<button type="button" class="btn inline" data-act="cc-addevent" style="margin-top:12px">' + L('ccAddEvent') + '</button>' : '') + '</div>';
    tree.forEach(function (E) {
      var e = E.e, folded = ccIsFolded(e.id);
      html += '<section class="ccel' + (e.active ? '' : ' ccoff') + '"><div class="cceh">' +
        (ed ? '<input type="checkbox" class="ccck" data-ccactive="' + esc(e.id) + '"' + (e.active ? ' checked' : '') + ' aria-label="' + esc(e.name + ': ' + L('ccActive')) + '" title="' + esc(L('ccActive')) + '">' : '') +
        '<button type="button" class="cct" data-act="cc-fold" data-id="' + esc(e.id) + '" aria-expanded="' + !folded + '">' + esc(e.name) + '</button>' +
        (ed ? ccDots('event', e.id, e.name) : '') +
        (ed ? hico('cc-print', ICON.print, L('ccPrint'), { aria: L('ccPrint') + ': ' + e.name, data: { id: e.id } }) : '') +
        '<button type="button" class="ccfold' + (folded ? '' : ' open') + '" data-act="cc-fold" data-id="' + esc(e.id) + '" aria-expanded="' + !folded + '" aria-label="' + esc(e.name) + '">' + ICON.chev + '</button></div>';
      if (!folded) {
        html += '<div class="ccbody">';
        if (!E.days.length) html += '<p class="ccsum" style="padding-top:10px">' + L('ccNoDays') + '</p>';
        E.days.forEach(function (D) {
          var d = D.d, df = !!S.ccFold[d.id];
          var nRoles = D.shifts.reduce(function (n, x) { return n + x.roles.length; }, 0);
          var dayLabel = ccDate(d.day) + (d.name ? ' – ' + d.name : '');
          html += '<div class="ccday"><div class="ccdh">' +
            '<button type="button" class="ccdt" data-act="cc-fold" data-id="' + esc(d.id) + '" aria-expanded="' + !df + '"><b>' + esc(ccDate(d.day)) + (d.name ? ' - ' + esc(d.name) : '') + '</b></button>' +
            (ed ? ccDots('day', d.id, dayLabel) : '') +
            '<button type="button" class="ccfold ccfold-day' + (df ? '' : ' open') + '" data-act="cc-fold" data-id="' + esc(d.id) + '" aria-expanded="' + !df + '" aria-label="' + esc(dayLabel) + '">' + ICON.chev + '</button></div>';
          if (df) {
            html += '<div class="ccsum">' + L('ccSummary', { s: D.shifts.length, r: nRoles }) + '</div>';
          } else {
            D.shifts.forEach(function (Sh) {
              var s = Sh.s;
              html += '<div class="ccsh"><div class="ccshh">' + ICON.clock + '<span class="cctm">' + ccTime(s) + '</span>' +
                (s.name ? '<span class="ccsn">' + esc(s.name) + '</span>' : '') + '<span class="sp"></span>' +
                (ed ? ccDots('shift', s.id, ccTimePlain(s)) : '') + '</div>';
              Sh.roles.forEach(function (r) {
                var ps = Array.isArray(r.persons) ? r.persons : [];
                html += '<div class="ccro"><span class="ccrn">' + esc(r.name) + '</span><span class="ccps">' +
                  (ps.length ? ps.map(function (p) { return ccChip(p, map); }).join('') : '<span class="ccsum">' + L('ccNobody') + '</span>') +
                  '</span>' + (ed ? ccDots('role', r.id, r.name) : '') + '</div>';
              });
              html += '</div>';
            });
          }
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</section>';
    });
    return html;
  }

  /* ---------- Show: Einsatzplan als PDF (alle Akte, nur Regisseur) ---------- */
  async function showExportPdf() {
    if (!window.jspdf) { toast(L('ccPdfFailed')); return; }
    toast(L('ccPdfBuilding'));
    var tree = shTree(), map = ccMap();
    var dirs = S.members.filter(function (m) { return m.isDirector; }).map(function (m) { return m.name; });
    var dirLabel = L('dirTag') + ': ' + (dirs.length ? dirs.join(', ') : '–');

    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var PAGE_W = doc.internal.pageSize.getWidth(), PAGE_H = doc.internal.pageSize.getHeight();
    var MARGIN = 12, GAP = 6, COLW = PAGE_W - 2 * MARGIN, TOP = 30, BOTTOM = PAGE_H - 12;
    var BLUE = [48, 124, 192], BLUE_DARK = [11, 47, 94], BLUE_SOFT = [227, 239, 249], GREY = [93, 103, 122], INK = [22, 35, 59], LINE = [218, 222, 214];
    var logo = await ensureLogoDataUrl();

    function wrap(text, size, maxW, style) {
      doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size);
      return doc.splitTextToSize(String(text), maxW);
    }
    function drawHeader() {
      doc.setFillColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
      doc.rect(0, 0, PAGE_W, 24, 'F');
      if (logo) { try { doc.addImage(logo, 'PNG', MARGIN, 4, 13.5, 15.5); } catch (e) { /* Logo optional */ } }
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
      doc.text(L('titleShow'), MARGIN + 18, 11.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(207, 224, 242);
      doc.text(dirLabel, MARGIN + 18, 17);
      doc.text('Version', PAGE_W - MARGIN, 9.5, { align: 'right' });
      doc.text(fullDate(new Date()).split(', ')[1] || '', PAGE_W - MARGIN, 14, { align: 'right' });
    }
    var colY = [TOP, TOP];
    function newPage() { doc.addPage(); drawHeader(); colY = [TOP, TOP]; }

    // Zeilen einer Szene: Beschreibung, Musik, Video, Rollen mit Personen
    function sceneLines(Sc, w) {
      var sc = Sc.s, items = [], valueW = w - 44;
      if (sc.description) items.push({ t: 'desc', lines: wrap(sc.description, 8.8, w - 10, 'normal') });
      if (sc.music_name || sc.music_url) items.push({ t: 'media', label: L('shMusic'), text: sc.music_name || '', url: shSpotifyOk(sc.music_url) ? sc.music_url : '', lines: wrap(sc.music_name || '–', 9.3, valueW, 'normal') });
      if (sc.video_desc || sc.video_url) items.push({ t: 'media', label: L('shVideo'), text: sc.video_desc || '', url: shYoutubeOk(sc.video_url) ? sc.video_url : '', lines: wrap(sc.video_desc || '–', 9.3, valueW, 'normal') });
      Sc.parts.forEach(function (r) {
        var nm = (Array.isArray(r.persons) ? r.persons : []).map(function (pe) { return ccResolve(pe, map).name; }).join(', ') || '–';
        items.push({ t: 'part', label: String(r.name), lines: wrap(nm, 9.3, valueW, 'normal') });
      });
      return items;
    }
    function sceneHeight(Sc, w) {
      var titleLines = wrap(Sc.s.name, 11.5, w - 10, 'bold');
      var h = 9 + (titleLines.length - 1) * 4.8 + 3;
      sceneLines(Sc, w).forEach(function (it) { h += Math.max(it.lines.length, 1) * (it.t === 'desc' ? 4 : 4.3) + (it.t === 'desc' ? 1.5 : 0); });
      return h + 3;
    }
    function drawScene(Sc, x, yTop, w) {
      var h = sceneHeight(Sc, w), valueW = w - 44;
      doc.setFillColor(255, 255, 255); doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.3);
      doc.roundedRect(x, yTop, w, h, 3, 3, 'FD');
      var titleLines = wrap(Sc.s.name, 11.5, w - 10, 'bold');
      var headH = 9 + (titleLines.length - 1) * 4.8;
      doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]);
      doc.roundedRect(x, yTop, w, headH, 3, 3, 'F'); doc.rect(x, yTop + headH / 2, w, headH / 2, 'F');
      doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
      var ty = yTop + 5.8;
      titleLines.forEach(function (ln) { doc.text(ln, x + 5, ty); ty += 4.8; });
      var cy = yTop + headH + 5;
      sceneLines(Sc, w).forEach(function (it) {
        if (it.t === 'desc') {
          doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8);
          it.lines.forEach(function (ln) { doc.text(ln, x + 5, cy); cy += 4; });
          cy += 1.5; return;
        }
        doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6);
        doc.text(it.label + ':', x + 5, cy);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.3);
        var ly = cy;
        it.lines.forEach(function (ln) {
          if (it.t === 'media' && it.url) { doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]); try { doc.textWithLink(ln, x + 31, ly, { url: it.url }); } catch (e) { doc.text(ln, x + 31, ly); } }
          else { doc.setTextColor(INK[0], INK[1], INK[2]); doc.text(ln, x + 31, ly); }
          ly += 4.3;
        });
        cy = ly;
      });
      return yTop + h;
    }

    drawHeader();
    if (!tree.length) {
      doc.setTextColor(GREY[0], GREY[1], GREY[2]); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(L('shEmpty'), MARGIN, PAGE_H / 2);
    }
    tree.forEach(function (A) {
      var a = A.a, fullW = PAGE_W - 2 * MARGIN;
      var title = a.name + (a.active ? '' : '   (nicht sichtbar)');
      var dLines = a.description ? wrap(a.description, 9, fullW - 10, 'normal') : [];
      var media = [];
      if (a.music_name || a.music_url) media.push({ label: L('shMusic'), text: a.music_name || '–', url: shSpotifyOk(a.music_url) ? a.music_url : '' });
      if (a.video_desc || a.video_url) media.push({ label: L('shVideo'), text: a.video_desc || '–', url: shYoutubeOk(a.video_url) ? a.video_url : '' });
      var bandH = 9.5 + dLines.length * 4 + (dLines.length ? 1.5 : 0) + media.length * 4.6;
      var firstH = A.scenes.length ? sceneHeight(A.scenes[0], COLW) : 0;
      var y0 = Math.max(colY[0], colY[1]);
      if (y0 + bandH + 4 + Math.min(firstH, 60) > BOTTOM) { newPage(); y0 = TOP; }
      if (a.is_hint) doc.setFillColor(84, 98, 120); else doc.setFillColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
      doc.roundedRect(MARGIN, y0, fullW, bandH, 3, 3, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text(title, MARGIN + 5, y0 + 6.3);
      if (dLines.length) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(207, 224, 242);
        dLines.forEach(function (ln, i) { doc.text(ln, MARGIN + 5, y0 + 11.2 + i * 4); });
      }
      media.forEach(function (m, i) {
        var my = y0 + 11.2 + dLines.length * 4 + (dLines.length ? 1.5 : 0) + i * 4.6;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); doc.setTextColor(207, 224, 242);
        doc.text(m.label + ':', MARGIN + 5, my);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.3); doc.setTextColor(255, 255, 255);
        try { if (m.url) doc.textWithLink(m.text, MARGIN + 31, my, { url: m.url }); else doc.text(m.text, MARGIN + 31, my); } catch (e) { doc.text(m.text, MARGIN + 31, my); }
      });
      colY = [y0 + bandH + 4, y0 + bandH + 4];
      A.scenes.forEach(function (Sc) {
        var h = sceneHeight(Sc, COLW);
        var c = 0;
        if (colY[c] + h > BOTTOM) { newPage(); }
        var x = MARGIN;
        colY[c] = drawScene(Sc, x, colY[c], COLW) + 5;
      });
      colY = [Math.max(colY[0], colY[1]) + 2, Math.max(colY[0], colY[1]) + 2];
    });

    var pages = doc.getNumberOfPages();
    for (var pi = 1; pi <= pages; pi++) {
      doc.setPage(pi);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(L('titleShow'), MARGIN, PAGE_H - 6);
      doc.text('Seite ' + pi + ' / ' + pages, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    }

    var fname = 'Chraenzli-Drehbuch.pdf';
    var blob = doc.output('blob');
    try {
      var file = new File([blob], fname, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: L('titleShow') });
        return;
      }
    } catch (e) { /* Teilen abgebrochen oder nicht verfügbar: als Download anbieten */ }
    var url = URL.createObjectURL(blob);
    var a2 = document.createElement('a'); a2.href = url; a2.download = fname;
    document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- Show: Chränzli Drehbuch (Akt > Szene > Rolle) ---------- */
  function shTree() {
    var C = S.cc;
    return C.acts.slice().sort(function (x, y) { return ((y.is_hint ? 1 : 0) - (x.is_hint ? 1 : 0)) || ccByCreated(x, y); }).map(function (a) {
      return {
        a: a,
        scenes: C.scenes.filter(function (x) { return x.act_id === a.id; }).sort(function (x, y) { return String(x.name).localeCompare(String(y.name), 'de', { numeric: true, sensitivity: 'base' }) || ccByCreated(x, y); }).map(function (sc) {
          return { s: sc, parts: C.parts.filter(function (r) { return r.scene_id === sc.id; }).sort(function (x, y) { return ((x.sort || 0) - (y.sort || 0)) || ccByCreated(x, y); }) };
        })
      };
    });
  }
  function shIsFolded(id) {
    if (S.ccFold[id] != null) return S.ccFold[id];
    var a = S.cc.acts.filter(function (x) { return x.id === id; })[0];
    return a ? !a.active : false;   // unsichtbare (in Planung befindliche) Akte starten eingeklappt
  }
  function shDots(lvl, id, label) {
    return '<button type="button" class="hico" data-act="sh-menu" data-lvl="' + lvl + '"' + (id ? ' data-id="' + esc(id) + '"' : '') +
      ' aria-label="' + esc(L('ccActions') + (label ? ': ' + label : '')) + '" title="' + esc(L('ccActions')) + '">' + ICON.dots + '</button>';
  }
  // Nur Spotify-Links zulassen (https), damit kein anderer Link oder Code eingeschleust werden kann
  function shSpotifyOk(u) { return /^https:\/\/(open\.spotify\.com|play\.spotify\.com|spotify\.link)\/\S+$/i.test(String(u || '').trim()); }
  // Icon als Play-Schalter: mit Einbettung ein Button (öffnet/schliesst den Player), sonst ausgegrautes Icon ohne Link
  function shIconBtn(img, emb, id, playing) {
    if (!emb || !id) return '<span class="shsp off" aria-hidden="true">' + img + '</span>';
    var lbl = esc(L(playing ? 'shPlayStop' : 'shPlay'));
    return '<button type="button" class="shsp shspbtn' + (playing ? ' on' : '') + '" data-act="sh-play" data-id="' + esc(id) + '" aria-pressed="' + playing + '" aria-label="' + lbl + '" title="' + lbl + '">' + img + '</button>';
  }
  function shMusicRow(a) {
    if (!a.music_name && !a.music_url) return '';
    var ok = a.music_url && shSpotifyOk(a.music_url);
    var emb = ok ? shEmbedUrl(a.music_url) : '', playing = !!(emb && a.id && S.play[a.id]);
    var ic = shIconBtn('<img src="icons/spotify.png" alt="" width="21" height="21">', emb, a.id, playing);
    var pl = playing ? '<div class="shplayer"><iframe src="' + esc(emb) + '" width="100%" height="152" frameborder="0" loading="lazy" allow="encrypted-media" title="Spotify"></iframe></div>' : '';
    return '<div class="shmusic"><span class="shml">' + L('shMusic') + '</span><span class="shmn">' + (a.music_name ? esc(a.music_name) : '') + '</span>' + ic + pl + '</div>';
  }
  // Einbettungs-URL nur für Spotify-Inhalte (Track, Album, Playlist, Episode, Show, Artist); spotify.link lässt sich nicht einbetten
  function shEmbedUrl(u) {
    var m = String(u || '').trim().match(/^https:\/\/(?:open|play)\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
    return m ? 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] : '';
  }
  // Video-Zeile (YouTube): Beschriftung links, Text, rechts das YouTube-Icon als Link
  function shYoutubeOk(u) { return /^https:\/\/\S+$/i.test(String(u || '').trim()); }   // bewusst locker: nur https (youtube.com, youtu.be, shorts …)
  function shVideoRow(a) {
    if (!a.video_desc && !a.video_url) return '';
    var img = '<img src="icons/youtube.png" alt="" width="21" height="21">';
    var emb = a.video_url && shYoutubeOk(a.video_url) ? shYoutubeEmbed(a.video_url) : '', pid = 'v:' + a.id, playing = !!(emb && a.id && S.play[pid]);
    var ic = shIconBtn(img, emb, pid, playing);
    var pl = playing ? '<div class="shplayer shvplayer"><iframe src="' + esc(emb) + '" width="100%" frameborder="0" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="YouTube"></iframe></div>' : '';
    return '<div class="shmusic shvideo"><span class="shml">' + L('shVideo') + '</span><span class="shmn">' + (a.video_desc ? esc(a.video_desc) : '') + '</span>' + ic + pl + '</div>';
  }
  // Einbettungs-URL (datenschutzfreundlich: youtube-nocookie.com) für Video- oder Playlist-Links
  function shYoutubeEmbed(u) {
    var url; try { url = new URL(String(u).trim()); } catch (e) { return ''; }
    var id = '', host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else { id = url.searchParams.get('v') || ''; var m = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/); if (!id && m) id = m[1]; }
    var list = url.searchParams.get('list') || '';
    if (/^[A-Za-z0-9_-]{6,}$/.test(id)) return 'https://www.youtube-nocookie.com/embed/' + id + (/^[A-Za-z0-9_-]+$/.test(list) ? '?list=' + list : '');
    if (/^[A-Za-z0-9_-]+$/.test(list) && url.pathname === '/playlist') return 'https://www.youtube-nocookie.com/embed/videoseries?list=' + list;
    return '';
  }
  // Vorgabe für den Namen eines neuen Akts / einer neuen Szene: «1. Akt - ...», «2. Szene - ...» (nächste freie Nummer)
  function shDefaultName(kind) {
    var n = kind === 'act' ? S.cc.acts.filter(function (x) { return !x.is_hint; }).length + 1 : S.cc.scenes.filter(function (x) { return ccSheet && x.act_id === ccSheet.id; }).length + 1;
    return n + '. ' + (kind === 'act' ? 'Akt' : 'Szene') + ' - ...';
  }
  // Beschreibung von Akt/Szene: immer sichtbar, solange der Abschnitt aufgeklappt ist (kein Info-Icon)
  function shDescText(o, open) {
    return o.description && open ? '<div class="infobar shdesc">' + esc(o.description) + '</div>' : '';
  }
  function viewShow() {
    var map = ccMap(), ed = shEdit();
    var html = pageTopLegend('titleShow', 'shlegend', ed ? hico('sh-print', ICON.print, L('ccPrint'), { aria: L('ccPrint') + ': ' + L('titleShow') }) : '');
    if (S.showErr) return html + '<div class="empty"><p>' + L('shSetup') + '</p></div>';
    var tree = shTree();
    if (!tree.length) return html + '<div class="empty"><p>' + L('shEmpty') + '</p>' + (ed ? '<button type="button" class="btn inline" data-act="sh-addact" style="margin-top:12px">' + L('shAddAct') + '</button>' : '') + '</div>';
    tree.forEach(function (A) {
      var a = A.a, folded = shIsFolded(a.id);
      html += '<section class="ccel' + (a.is_hint ? ' hint' : '') + (a.active ? '' : ' ccoff') + '"><div class="cceh">' +
        (ed ? '<input type="checkbox" class="ccck" data-shactive="' + esc(a.id) + '"' + (a.active ? ' checked' : '') + ' aria-label="' + esc(a.name + ': ' + L('shVisible')) + '" title="' + esc(L('shVisible')) + '">' : '') +
        '<button type="button" class="cct" data-act="sh-fold" data-id="' + esc(a.id) + '" aria-expanded="' + !folded + '">' + esc(a.name) + '</button>' +
        (ed ? shDots('act', a.id, a.name) : '') +
        '<button type="button" class="ccfold' + (folded ? '' : ' open') + '" data-act="sh-fold" data-id="' + esc(a.id) + '" aria-expanded="' + !folded + '" aria-label="' + esc(a.name) + '">' + ICON.chev + '</button></div>' +
        shDescText(a, !folded) + (folded ? '' : shMusicRow(a) + shVideoRow(a));
      if (!folded) {
        html += '<div class="ccbody">';
        if (!A.scenes.length) html += '<p class="ccsum" style="padding-top:10px">' + L('shNoScenes') + '</p>';
        A.scenes.forEach(function (Sc) {
          var sc = Sc.s, sf = !!S.ccFold[sc.id];
          html += '<div class="ccday"><div class="ccdh">' +
            '<button type="button" class="ccdt" data-act="sh-fold" data-id="' + esc(sc.id) + '" aria-expanded="' + !sf + '"><b>' + esc(sc.name) + '</b></button>' +
            (ed ? hico('sh-scene-add', ICON.plus, L('shAddPart'), { aria: L('shAddPart') + ': ' + sc.name, data: { id: sc.id } }) + hico('sh-scene-edit', ICON.pencil, L('ccChange'), { aria: L('ccChange') + ': ' + sc.name, data: { id: sc.id } }) : '') +
            '<button type="button" class="ccfold ccfold-day' + (sf ? '' : ' open') + '" data-act="sh-fold" data-id="' + esc(sc.id) + '" aria-expanded="' + !sf + '" aria-label="' + esc(sc.name) + '">' + ICON.chev + '</button></div>' +
            (sf ? '' : shMusicRow(sc) + shVideoRow(sc)) + shDescText(sc, !sf);
          if (sf) html += '<div class="ccsum">' + L('shSummary', { r: Sc.parts.length }) + '</div>';
          else {
            html += '<div class="ccsh">';
            Sc.parts.forEach(function (r) {
              var ps = Array.isArray(r.persons) ? r.persons : [];
              html += '<div class="ccro"><span class="ccrn">' + esc(r.name) + '</span><span class="ccps">' +
                (ps.length ? ps.map(function (p) { return ccChip(p, map); }).join('') : '<span class="ccsum">' + L('ccNobody') + '</span>') +
                '</span>' + (ed ? shDots('part', r.id, r.name) : '') + '</div>';
            });
            html += '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</section>';
    });
    return html;
  }

  /* ---------- C&C: Aktionsfenster ---------- */
  var ccSheet = null;   // { lvl, id, mode, persons, name }
  var CC_TABLE = { event: 'cc_events', day: 'cc_days', shift: 'cc_shifts', role: 'cc_roles', act: 'show_acts', scene: 'show_scenes', part: 'show_parts' };
  var CC_SUB = { root: 'event', event: 'day', day: 'shift', shift: 'role', shroot: 'act', act: 'scene', scene: 'part' };
  var CC_LVL = { root: 'ccLvlAll', event: 'ccLvlEvent', day: 'ccLvlDay', shift: 'ccLvlShift', role: 'ccLvlRole', shroot: 'shLvlAll', act: 'shLvlAct', scene: 'shLvlScene', part: 'shLvlPart' };
  var CC_ADD = { event: 'ccAddEvent', day: 'ccAddDay', shift: 'ccAddShift', role: 'ccAddRole', act: 'shAddAct', scene: 'shAddScene', part: 'shAddPart' };
  var CC_LIST = { event: 'events', day: 'days', shift: 'shifts', role: 'roles', act: 'acts', scene: 'scenes', part: 'parts' };
  function ccIsPersonLvl(l) { return l === 'role' || l === 'part'; }   // Ebenen mit Personenauswahl
  function ccIsRootLvl(l) { return l === 'root' || l === 'shroot'; }

  function ccObj(lvl, id) {
    var list = CC_LIST[lvl] ? S.cc[CC_LIST[lvl]] : null;
    return list ? list.filter(function (x) { return x.id === id; })[0] || null : null;
  }
  function ccTitle(lvl, o) {
    if (lvl === 'root') return L('ccLvlAll');
    if (lvl === 'shroot') return L('shLvlAll');
    if (!o) return '';
    if (lvl === 'event' || lvl === 'act' || lvl === 'scene') return o.name;
    if (lvl === 'day') return ccDate(o.day) + (o.name ? ' – ' + o.name : '');
    if (lvl === 'shift') return ccTimePlain(o) + (o.name ? ' – ' + o.name : '');
    return o.name;
  }
  function ccOpen(lvl, id, mode, extra) {
    ccSheet = { lvl: lvl, id: id || null, mode: mode || 'menu' };
    if (extra) for (var k in extra) ccSheet[k] = extra[k];
    ccDrawSheet();
  }
  function ccKey(e) { if (e.key === 'Escape' && !document.getElementById('dlg')) { e.preventDefault(); ccCloseSheet(); } }
  function ccCloseSheet() {
    var el = document.getElementById('ccsheet');
    if (el) el.remove();
    ccSheet = null;
    document.removeEventListener('keydown', ccKey, true);
  }
  function ccActBtn(a, icon, label, cls) {
    return '<button type="button" class="ccact' + (cls ? ' ' + cls : '') + '" data-cca="' + a + '">' + icon + '<span>' + label + '</span></button>';
  }
  function ccBtns(saveLabel, withDel) {
    return '<p class="err" data-ccerr hidden></p><div class="dlgbtns">' +
      (withDel ? '<button type="button" class="btn ghost inline" data-cca="del" style="margin-right:auto;color:var(--danger,#c0392b)">' + L('del') + '</button>' : '') +
      '<button type="button" class="btn ghost inline" data-cca="close">' + L('dismiss') + '</button>' +
      '<button type="submit" class="btn inline">' + (saveLabel || L('save')) + '</button></div>';
  }

  // Zeile Musik/Video im Szenen-Formular: Textfeld mit Icon rechts; hinter dem Icon verbirgt sich das Link-Feld (leer lassen = löschen)
  function shMediaField(label, nameF, nameV, namePh, urlF, urlV, urlPh, img, iconLabel) {
    return '<div class="field"><span>' + label + '</span><div class="shfm">' +
      '<input class="input" name="' + nameF + '" value="' + esc(nameV || '') + '" placeholder="' + esc(namePh) + '">' +
      '<button type="button" class="shficon' + (urlV ? ' on' : '') + '" data-cca="tog" data-t="' + urlF + '" aria-pressed="false" aria-label="' + esc(iconLabel) + '" title="' + esc(iconLabel) + '"><img src="' + img + '" alt="" width="24" height="24"></button></div>' +
      '<input class="input shfmu" name="' + urlF + '" inputmode="url" value="' + esc(urlV || '') + '" placeholder="' + esc(urlPh) + '" hidden></div>';
  }
  function shReveal(n) { var f = document.querySelector('#ccsheet [name="' + n + '"]'), bt = document.querySelector('#ccsheet [data-t="' + n + '"]'); if (f) { f.hidden = false; if (bt) bt.setAttribute('aria-pressed', 'true'); f.focus(); } }
  function shGrow(t) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }
  function ccForm(kind, o, isNew) {
    var h = '<p class="cck">' + L(CC_LVL[kind]) + '</p><h3>' + esc(isNew ? L(CC_ADD[kind]) : ccTitle(kind, o)) + '</h3>' +
      '<form data-ccform="' + kind + '" novalidate>';
    if (kind === 'event') {
      h += fld(L('nameLabel'), '<input class="input" name="name" value="' + esc(o ? o.name : '') + '" placeholder="Chilbi 2028" required>') +
        '<label class="check"><input type="checkbox" name="active"' + (!o || o.active ? ' checked' : '') + '><span>' + L('ccActive') + '</span></label>';
    } else if (kind === 'day') {
      h += grid(fld(L('date'), '<input class="input" type="date" name="date" value="' + esc(o ? o.day : '') + '" required>'),
                fld(L('ccNameOpt'), '<input class="input" name="name" value="' + esc(o && o.name ? o.name : '') + '" placeholder="Premiere">'));
    } else if (kind === 'shift') {
      h += grid(fld(L('ccStart'), '<input class="input" type="time" name="start" value="' + esc(o ? o.start_time : '') + '" required>'),
                fld(L('ccEnd'), '<input class="input" type="time" name="end" value="' + esc(o ? o.end_time : '') + '" required>')) +
        fld(L('ccNameOpt'), '<input class="input" name="name" value="' + esc(o && o.name ? o.name : '') + '" placeholder="Abendschicht">');
    } else if (kind === 'act' || kind === 'scene') {
      h += fld(L('nameLabel'), '<input class="input" name="name" value="' + esc(o ? o.name : shDefaultName(kind)) + '" required>') +
        fld(L('shDesc'), '<textarea class="input shgrow" name="desc" rows="1">' + esc(o && o.description ? o.description : '') + '</textarea>') +
        ((kind === 'scene' || kind === 'act') ? shMediaField(L('shMusic'), 'music_name', o && o.music_name, 'Titel / Interpret', 'music_url', o && o.music_url, 'https://open.spotify.com/…', 'icons/spotify.png', L('shSpotify')) +
          shMediaField(L('shVideo'), 'video_desc', o && o.video_desc, 'Beschreibung', 'video_url', o && o.video_url, 'https://www.youtube.com/watch?v=…', 'icons/youtube.png', L('shYoutube')) : '') +
        (kind === 'act' ? '<label class="check"><input type="checkbox" name="is_hint"' + (o && o.is_hint ? ' checked' : '') + '><span>' + L('shHintCheck') + '</span></label>' : '') +
        (kind === 'act' ? '<label class="check"><input type="checkbox" name="active"' + (o && o.active ? ' checked' : '') + '><span>' + L('shVisible') + '</span></label>' : '');
    } else if (ccIsPersonLvl(kind)) {
      h += fld(L('nameLabel'), '<input class="input" name="name" value="' + esc(o ? o.name : '') + '" placeholder="Bar" required>') +
        '<span class="cclabel">' + L('ccPersons') + '</span><div class="ccsel" id="ccsel"></div>' +
        '<input class="input" name="q" placeholder="' + esc(L('ccSearch')) + '" autocomplete="off">' +
        '<div class="ccplist" id="ccplist"></div>' +
        '<span class="cclabel">' + L('ccOtherPerson') + '</span>' +
        '<div class="ccother"><input class="input" name="other" autocomplete="off"><button type="button" class="btn ghost inline" data-cca="other">' + L('ccAdd') + '</button></div>' +
        '<div class="ccsug" id="ccsug"></div><div style="height:14px"></div>';
    }
    return h + ccBtns(null, kind === 'scene' && !isNew ? 'del' : '') + '</form>';
  }
  function ccCopyForm(lvl, o) {
    var h = '<p class="cck">' + L(CC_LVL[lvl]) + '</p><h3>' + L('ccCopy') + ': ' + esc(ccTitle(lvl, o)) + '</h3><form data-ccform="copy-' + lvl + '" novalidate>';
    if (lvl === 'event') {
      var nn = /\b(19|20)\d{2}\b/.test(o.name) ? o.name.replace(/\b((19|20)\d{2})\b/, function (y) { return String(Number(y) + 1); }) : o.name + ' (' + L('ccCopySuffix') + ')';
      h += fld(L('nameLabel'), '<input class="input" name="name" value="' + esc(nn) + '" required>') + '<p class="ccnote">' + L('ccCopyEventNote') + '</p>';
    } else {
      h += grid(fld(L('date'), '<input class="input" type="date" name="date" value="' + esc(ccAddDays(o.day, 1)) + '" required>'),
                fld(L('ccNameOpt'), '<input class="input" name="name" value="' + esc(o.name || '') + '">')) + '<p class="ccnote">' + L('ccCopyDayNote') + '</p>';
    }
    return h + ccBtns(L('ccCopy')) + '</form>';
  }
  function ccGuestForm(name) {
    return '<p class="cck">' + L('ccOthers') + '</p><h3>' + esc(name) + '</h3><p class="ccnote" style="margin-top:0">' + L('ccNotInApp', { name: name }) + '</p>' +
      '<form data-ccform="guest" novalidate>' +
      fld(L('fullName'), '<input class="input" name="name" value="' + esc(name) + '" required>') +
      fld(L('phone'), phoneField('')) +
      ccBtns(L('ccAsGuest')) + '</form>';
  }

  function ccDrawSheet() {
    var st = ccSheet;
    if (!st) return;
    var o = ccIsRootLvl(st.lvl) || st.lvl === 'guest' ? null : ccObj(st.lvl, st.id);
    if (!ccIsRootLvl(st.lvl) && st.lvl !== 'guest' && !o) { ccCloseSheet(); return; }   // inzwischen gelöscht
    var body;
    if (st.mode === 'menu') {
      var sub = CC_SUB[st.lvl];
      body = '<p class="cck">' + L(CC_LVL[st.lvl]) + '</p><h3>' + esc(ccTitle(st.lvl, o)) + '</h3>' +
        (!ccIsRootLvl(st.lvl) ? ccActBtn('edit', ICON.pencil, L('ccChange')) : '') +
        (!ccIsRootLvl(st.lvl) && CC_TABLE[st.lvl].indexOf('cc_') === 0 ? ccActBtn('copy', ICON.copy, L('ccCopy')) : '') +
        (sub ? ccActBtn('add', ICON.plus, L(CC_ADD[sub])) : '') +
        (st.lvl === 'event' ? ccActBtn('addevent', ICON.plus, L('ccAddEvent')) : '') +
        (st.lvl === 'act' ? ccActBtn('addact', ICON.plus, L('shAddAct')) : '') +
        (!ccIsRootLvl(st.lvl) ? ccActBtn('del', ICON.trash, L('del'), 'del') : '') +
        '<button type="button" class="ccact close" data-cca="close">' + L('ccClose') + '</button>';
    } else if (st.mode === 'edit') body = ccForm(st.lvl, o, false);
    else if (st.mode === 'add') body = ccForm(CC_SUB[st.lvl], null, true);
    else if (st.mode === 'copy') body = ccCopyForm(st.lvl, o);
    else body = ccGuestForm(st.name || '');

    var wrap = document.getElementById('ccsheet');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ccsheet';
      wrap.className = 'ccsheet';
      wrap.addEventListener('click', ccSheetClick);
      wrap.addEventListener('submit', ccSheetSubmit);
      wrap.addEventListener('input', ccSheetInput);
      wrap.addEventListener('change', ccSheetChange);
      document.body.appendChild(wrap);
      document.addEventListener('keydown', ccKey, true);
    }
    wrap.innerHTML = '<div class="ccsheetcard" role="dialog" aria-modal="true" aria-label="' + esc(L(CC_LVL[st.lvl] || 'ccOthers')) + '">' + body + '</div>';
    Array.prototype.forEach.call(wrap.querySelectorAll('textarea.shgrow'), shGrow);
    if (st.mode === 'edit' && ccIsPersonLvl(st.lvl) || st.mode === 'add' && ccIsPersonLvl(CC_SUB[st.lvl])) { ccDrawSel(); ccDrawList(); }
    var first = wrap.querySelector('form .input');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    else { var b = wrap.querySelector('button'); if (b) b.focus(); }
  }

  /* Personen-Auswahl in einer Rolle */
  function ccChosenIds() {
    var map = ccMap();
    return ccSheet.persons.map(function (p) { return ccResolve(p, map).id; }).filter(Boolean);
  }
  function ccDrawSel() {
    var box = document.getElementById('ccsel');
    if (!box) return;
    var map = ccMap();
    box.innerHTML = ccSheet.persons.length ? ccSheet.persons.map(function (p, i) {
      var r = ccResolve(p, map);
      return '<span class="ccp cc-' + r.kind + '">' + esc(r.name) +
        '<button type="button" class="ccx" data-cca="rm" data-i="' + i + '" aria-label="' + esc(L('remove') + ': ' + r.name) + '">×</button></span>';
    }).join('') : '<span class="ccsum">' + L('ccNobody') + '</span>';
  }
  function ccDrawList() {
    var box = document.getElementById('ccplist');
    if (!box) return;
    var q = ccNorm(ccSheet.q || '');
    var chosen = ccChosenIds();
    var list = S.members.filter(function (m) { return !m.isCandidate && (!q || ccNorm(m.name).indexOf(q) > -1); });
    box.innerHTML = list.length ? list.map(function (m) {
      var k = m.isGuest ? 'g' : 'm';
      return '<label class="ccpick"><span class="ccp cc-' + k + '">' + esc(m.name) + '</span>' +
        '<input type="checkbox" data-ccpick="' + esc(m.id) + '"' + (chosen.indexOf(m.id) > -1 ? ' checked' : '') + ' aria-label="' + esc(m.name) + '"></label>';
    }).join('') : '<p class="ccsum" style="padding:10px 12px;margin:0">' + L('nobody') + '</p>';
  }
  // Ähnliche Namen finden, z. B. «Dani» und «Daniel Oetterli» oder «Ruedi» und «Ruedi Bachmann»
  function ccSimilar(a, b) {
    var x = ccNorm(a).split(' '), y = ccNorm(b).split(' ');
    if (!x[0] || ccNorm(a) === ccNorm(b)) return false;
    if (x.length > 1 && y.length > 1 && x[x.length - 1] === y[y.length - 1]) return x[0].slice(0, 3) === y[0].slice(0, 3);
    if (x.length === 1) return y[0] === x[0];
    return false;
  }
  function ccDrawSug(val) {
    var box = document.getElementById('ccsug');
    if (!box) return;
    var v = String(val || '').trim();
    var hits = v.length < 2 ? [] : S.members.filter(function (m) { return ccSimilar(v, m.name); }).slice(0, 3);
    box.innerHTML = hits.map(function (m) {
      return '<div>' + esc(L('ccDidYouMean', { name: m.name })) + '<button type="button" class="btn ghost inline" data-cca="usesug" data-id="' + esc(m.id) + '">' + L('ccAdd') + '</button></div>';
    }).join('');
  }
  function ccAddPerson(pe) {
    var map = ccMap(), r = ccResolve(pe, map);
    var dup = ccSheet.persons.some(function (p) { var q = ccResolve(p, map); return r.id ? q.id === r.id : ccNorm(q.name) === ccNorm(r.name); });
    if (!dup) ccSheet.persons.push(r.id ? { id: r.id, name: r.name } : { name: r.name });
  }

  function ccSheetInput(e) {
    var t = e.target;
    if (t.name === 'q') { ccSheet.q = t.value; ccDrawList(); }
    else if (t.name === 'other') ccDrawSug(t.value);
    else if (t.name === 'desc') shGrow(t);
    else if (t.name === 'music_url' || t.name === 'video_url') { var ib = document.querySelector('#ccsheet [data-t="' + t.name + '"]'); if (ib) ib.classList.toggle('on', !!t.value.trim()); }
  }
  function ccSheetChange(e) {
    var t = e.target;
    if (!t.dataset || !t.dataset.ccpick) return;
    var id = t.dataset.ccpick, m = ccMember(id), map = ccMap();
    if (t.checked && m) ccAddPerson({ id: id, name: m.name });
    else ccSheet.persons = ccSheet.persons.filter(function (p) { return ccResolve(p, map).id !== id; });
    ccDrawSel();
  }
  async function ccSheetClick(e) {
    var wrap = document.getElementById('ccsheet');
    if (e.target === wrap) { ccCloseSheet(); return; }
    var b = e.target.closest('[data-cca]');
    if (!b) return;
    var a = b.dataset.cca, st = ccSheet;
    if (!st) return;
    var o = ccObj(st.lvl, st.id);
    if (a === 'close') { ccCloseSheet(); return; }
    if (a === 'tog') { var tf = wrap.querySelector('[name="' + b.dataset.t + '"]'); if (tf) { tf.hidden = !tf.hidden; b.setAttribute('aria-pressed', String(!tf.hidden)); if (!tf.hidden) tf.focus(); } return; }
    if (a === 'edit') {
      st.mode = 'edit';
      if (ccIsPersonLvl(st.lvl)) { st.persons = (o.persons || []).map(function (p) { return { id: p.id, name: p.name }; }); st.q = ''; }
      ccDrawSheet(); return;
    }
    if (a === 'addevent') { st.lvl = 'root'; st.id = null; st.mode = 'add'; ccDrawSheet(); return; }
    if (a === 'addact') { st.lvl = 'shroot'; st.id = null; st.mode = 'add'; ccDrawSheet(); return; }
    if (a === 'add') {
      st.mode = 'add';
      if (ccIsPersonLvl(CC_SUB[st.lvl])) { st.persons = []; st.q = ''; }
      ccDrawSheet(); return;
    }
    if (a === 'copy') {
      if (st.lvl === 'event' || st.lvl === 'day') { st.mode = 'copy'; ccDrawSheet(); return; }
      ccCloseSheet();
      if (st.lvl === 'shift') return act(function () { return ccCopyShift(o, o.day_id); }, L('ccCopied'));
      return act(function () { return ccInsertRoles([o], o.shift_id, ccNextSort(o.shift_id)); }, L('ccCopied'));
    }
    if (a === 'del') {
      var title = ccTitle(st.lvl, o), table = CC_TABLE[st.lvl], id = o.id;
      ccCloseSheet();
      if (!(await askConfirm(L('del'), L(ccIsPersonLvl(st.lvl) ? 'ccConfirmDelRole' : 'ccConfirmDel', { name: title }), true))) return;
      return act(function () { return sb.from(table).delete().eq('id', id); }, L('ccDeleted'));
    }
    if (a === 'rm') { st.persons.splice(Number(b.dataset.i), 1); ccDrawSel(); ccDrawList(); return; }
    if (a === 'usesug') {
      var m = ccMember(b.dataset.id);
      if (m) ccAddPerson({ id: m.id, name: m.name });
      var oi = wrap.querySelector('input[name="other"]'); if (oi) oi.value = '';
      ccDrawSug(''); ccDrawSel(); ccDrawList(); return;
    }
    if (a === 'other') {
      var inp = wrap.querySelector('input[name="other"]');
      var v = inp ? inp.value.trim() : '';
      if (!v) { ccErr(L('ccNeedName')); if (inp) inp.focus(); return; }
      ccErr('');
      ccAddPerson({ name: v });
      inp.value = ''; ccDrawSug(''); ccDrawSel(); ccDrawList(); inp.focus();
    }
  }
  function ccErr(msg) {
    var el = document.querySelector('#ccsheet [data-ccerr]');
    if (!el) return;
    el.textContent = msg; el.hidden = !msg;
  }

  /* ---------- C&C: Speichern und Kopieren ---------- */
  function ccNextSort(shiftId) {
    return S.cc.roles.filter(function (r) { return r.shift_id === shiftId; }).reduce(function (n, r) { return Math.max(n, r.sort || 0); }, -1) + 1;
  }
  async function ccIns(table, row) {
    var r = await sb.from(table).insert(row).select('id').single();
    if (r.error) throw r.error;
    return r.data.id;
  }
  async function ccInsertRoles(roles, toShift, startSort) {
    if (!roles.length) return;
    var r = await sb.from('cc_roles').insert(roles.map(function (x, i) {
      return { shift_id: toShift, name: x.name, persons: x.persons || [], sort: startSort == null ? (x.sort || 0) : startSort + i };
    }));
    if (r.error) throw r.error;
  }
  async function ccCopyShift(s, toDay) {
    var id = await ccIns('cc_shifts', { day_id: toDay, start_time: s.start_time, end_time: s.end_time, name: s.name || null });
    await ccInsertRoles(S.cc.roles.filter(function (r) { return r.shift_id === s.id; }), id, null);
  }
  async function ccCopyDay(d, toEvent, newDate, newName) {
    var id = await ccIns('cc_days', { event_id: toEvent, day: newDate, name: newName || null });
    var shifts = S.cc.shifts.filter(function (s) { return s.day_id === d.id; });
    for (var i = 0; i < shifts.length; i++) await ccCopyShift(shifts[i], id);
  }
  async function ccCopyEvent(e, newName) {
    var id = await ccIns('cc_events', { name: newName, active: false });
    var days = S.cc.days.filter(function (d) { return d.event_id === e.id; });
    // 52 Wochen = 364 Tage: der Wochentag bleibt gleich
    for (var i = 0; i < days.length; i++) await ccCopyDay(days[i], id, ccAddDays(days[i].day, 364), days[i].name);
  }

  async function ccSheetSubmit(e) {
    e.preventDefault();
    var f = e.target, st = ccSheet;
    if (!st || !f.dataset.ccform) return;
    var kind = f.dataset.ccform;
    var fd = new FormData(f);
    var g = function (k) { if (k === 'phone' && fd.has('phonecc')) return composePhone(fd.get('phonecc'), fd.get('phone')); return String(fd.get(k) || '').trim(); };
    var o = ccObj(st.lvl, st.id);
    var isNew = st.mode === 'add';
    var ok = false;

    if (kind === 'guest') {
      if (!g('name')) { ccErr(L('ccNeedName')); return; }
      if (!normPhone(g('phone'))) { ccErr(L('phoneInvalid')); return; }
      S.busy = true;
      ok = await addMember(g('name'), g('phone'), true);
      S.busy = false;
      if (ok) ccCloseSheet();
      return;
    }
    if ((kind === 'event' || kind === 'role' || kind === 'act' || kind === 'scene' || kind === 'part' || kind === 'copy-event') && !g('name')) { ccErr(L('ccNeedName')); return; }
    if ((kind === 'day' || kind === 'copy-day') && !g('date')) { ccErr(L('date') + '?'); return; }
    if (kind === 'shift' && (!g('start') || !g('end'))) { ccErr(L('time') + '?'); return; }
    if ((kind === 'scene' || kind === 'act') && g('music_url') && !shSpotifyOk(g('music_url'))) { shReveal('music_url'); ccErr(L('shMusicBad')); return; }
    if ((kind === 'scene' || kind === 'act') && g('video_url') && !shYoutubeOk(g('video_url'))) { shReveal('video_url'); ccErr(L('shVideoBad')); return; }
    ccCloseSheet();

    if (kind === 'event') {
      var ev = { name: g('name'), active: !!fd.get('active') };
      ok = await act(function () { return isNew ? sb.from('cc_events').insert(ev) : sb.from('cc_events').update(ev).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'day') {
      var dy = { day: g('date'), name: g('name') || null };
      if (isNew) dy.event_id = st.id;
      ok = await act(function () { return isNew ? sb.from('cc_days').insert(dy) : sb.from('cc_days').update(dy).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'shift') {
      var sh = { start_time: g('start'), end_time: g('end'), name: g('name') || null };
      if (isNew) sh.day_id = st.id;
      ok = await act(function () { return isNew ? sb.from('cc_shifts').insert(sh) : sb.from('cc_shifts').update(sh).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'role') {
      var ro = { name: g('name'), persons: st.persons || [] };
      if (isNew) { ro.shift_id = st.id; ro.sort = ccNextSort(st.id); }
      ok = await act(function () { return isNew ? sb.from('cc_roles').insert(ro) : sb.from('cc_roles').update(ro).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'act') {
      var ac = { name: g('name'), description: g('desc') || null, active: !!fd.get('active'), is_hint: !!fd.get('is_hint'), music_name: g('music_name') || null, music_url: g('music_url') || null, video_desc: g('video_desc') || null, video_url: g('video_url') || null };
      ok = await act(function () { return isNew ? sb.from('show_acts').insert(ac) : sb.from('show_acts').update(ac).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'scene') {
      var sc = { name: g('name'), description: g('desc') || null, music_name: g('music_name') || null, music_url: g('music_url') || null, video_desc: g('video_desc') || null, video_url: g('video_url') || null };
      if (isNew) sc.act_id = st.id;
      ok = await act(function () { return isNew ? sb.from('show_scenes').insert(sc) : sb.from('show_scenes').update(sc).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'part') {
      var pa = { name: g('name'), persons: st.persons || [] };
      if (isNew) { pa.scene_id = st.id; pa.sort = S.cc.parts.filter(function (x) { return x.scene_id === st.id; }).reduce(function (n, x) { return Math.max(n, x.sort || 0); }, -1) + 1; }
      ok = await act(function () { return isNew ? sb.from('show_parts').insert(pa) : sb.from('show_parts').update(pa).eq('id', o.id); }, L('ccSaved'));
    } else if (kind === 'copy-event') {
      var nm = g('name');
      ok = await act(function () { return ccCopyEvent(o, nm); }, L('ccCopied'));
    } else if (kind === 'copy-day') {
      var nd = g('date'), nn = g('name');
      ok = await act(function () { return ccCopyDay(o, o.event_id, nd, nn); }, L('ccCopied'));
    }
    return ok;
  }

  /* ---------- Jass: Jassmasters mit Teilnehmern, Spielplan und Tagesrangliste ---------- */
  // Fester Spielplan für 8 Spieler: 4 Runden, je 2 Tische. Zahlen = Platz in der Teilnehmerliste.
  var JS_PLAN = [
    [['A', [1, 2], [7, 8]], ['B', [3, 4], [5, 6]]],
    [['A', [5, 7], [6, 8]], ['B', [1, 3], [2, 4]]],
    [['A', [1, 6], [2, 5]], ['B', [3, 8], [4, 7]]],
    [['A', [2, 7], [4, 5]], ['B', [1, 8], [3, 6]]]
  ];
  function jsEdit() { return !!(S.me && S.me.isJassMaster); }   // nur Jass Manager (Admin nur, wenn er sich die Rolle selbst gibt)
  function jsPlayers(d) {
    var a = Array.isArray(d.players) ? d.players.slice(0, 8) : [];
    while (a.length < 8) a.push(null);
    return a.map(function (p) { return p && (p.id || p.name) ? p : null; });
  }
  function jsScores(d) { return d.scores && typeof d.scores === 'object' ? d.scores : {}; }
  function jsName(P, slot, map) {
    var p = P[slot - 1];
    return p ? ccResolve(p, map).name : L('jsPlayer', { n: slot });
  }
  function jsFmt(v) { return v == null ? '–' : (v > 0 ? '+' + v : String(v)); }
  function jsCls(v) { return v == null || v === 0 ? '' : v > 0 ? ' pos' : ' neg'; }
  function jsDots(lvl, id, label) {
    return '<button type="button" class="hico" data-act="js-menu" data-lvl="' + lvl + '" data-id="' + esc(id) + '" aria-label="' + esc(L('ccActions') + ': ' + label) + '" title="' + esc(L('ccActions')) + '">' + ICON.dots + '</button>';
  }
  function jsFoldBtn(id, folded, label, small) {
    return '<button type="button" class="ccfold' + (small ? ' ccfold-day' : '') + (folded ? '' : ' open') + '" data-act="js-fold" data-id="' + esc(id) + '" aria-expanded="' + !folded + '" aria-label="' + esc(label) + '">' + ICON.chev + '</button>';
  }

  // Einheitlicher Icon-Button für Kopfzeilen (Info, Plus, Drucken, Menü «…»), steht links vom Auf-/Zuklapp-Pfeil
  function hico(act, icon, label, o) {
    o = o || {};
    var attrs = ' data-act="' + act + '"';
    Object.keys(o.data || {}).forEach(function (k) { attrs += ' data-' + k + '="' + esc(o.data[k]) + '"'; });
    return '<button type="button" class="hico' + (o.cls ? ' ' + o.cls : '') + (o.on ? ' on' : '') + '"' + attrs +
      (o.on != null ? ' aria-pressed="' + !!o.on + '"' : '') +
      ' aria-label="' + esc(o.aria || label) + '" title="' + esc(label) + '">' + icon + '</button>';
  }

  // Tagesrangliste: jeder Spieler erhält die Punkte seines Teams aus jedem Spiel
  function jsRanking(d) {
    var sc = jsScores(d), tot = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    JS_PLAN.forEach(function (round, ri) {
      round.forEach(function (g) {
        var v = sc[(ri + 1) + g[0]];
        if (typeof v !== 'number') return;
        g[1].forEach(function (s) { tot[s] += v; });
        g[2].forEach(function (s) { tot[s] -= v; });
      });
    });
    var rows = [1, 2, 3, 4, 5, 6, 7, 8].map(function (s) { return { slot: s, pts: tot[s] }; });
    rows.sort(function (a, b) { return b.pts - a.pts || a.slot - b.slot; });
    var rank = 0, last = null;
    rows.forEach(function (r, i) { if (r.pts !== last) { rank = i + 1; last = r.pts; } r.rank = rank; });
    // Rangpunkte: 1. Platz 32, danach je 4 weniger, mindestens 4
    rows.forEach(function (r) { r.standing = Math.max(4, 32 - 4 * (r.rank - 1)); });
    return rows;
  }

  function viewJass() {
    var topHtml = pageTopLegend('titleJass', 'jslegend');
    if (S.jsErr) return topHtml + '<div class="empty"><p>' + L('jsSetup') + '</p></div>';
    var ed = jsEdit(), map = ccMap(), html = topHtml;
    var all = S.js.days.slice().sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : ccByCreated(a, b); });
    var upcoming = all.filter(function (d) { return !d.closed; });
    var past = all.filter(function (d) { return d.closed; }).reverse();   // neuste zuerst
    html += jsFolder('jsUp', L('jsUpcoming'), upcoming, true, ed, map);
    html += jsFolder('jsPast', L('jsPast'), past, false, ed, map);
    html += jsEternalFolder(past);
    return html;
  }

  // Punkte einer Person in einer abgeschlossenen Runde ermitteln (für die ewige Rangliste):
  // bei von Hand gepflegten Ranglisten direkt die eingetragenen Punkte, sonst die berechneten
  // Rangpunkte (32, 28, 24 … bis 4). Der Schlüssel ist die Profil-ID, sonst der normierte Name.
  function jsEternalEntries(d, map) {
    if (Array.isArray(d.manual_ranking) && d.manual_ranking.length) {
      return d.manual_ranking.map(function (r) {
        var nm = r.id && ccMember(r.id) ? ccMember(r.id).name : r.name;
        return { key: r.id || ('n:' + ccNorm(r.name || '')), name: nm, points: r.points || 0 };
      });
    }
    var sc = jsScores(d);
    if (!Object.keys(sc).some(function (k) { return typeof sc[k] === 'number'; })) return [];
    var P = jsPlayers(d);
    return jsRanking(d).map(function (r) {
      var nm = jsName(P, r.slot, map), p = P[r.slot - 1];
      var rid = p ? ccResolve(p, map).id : null;
      return { key: rid || ('n:' + ccNorm(nm)), name: nm, points: r.standing };
    });
  }

  // Ewige Rangliste über die letzten 10 abgeschlossenen Runden (neuste zuerst, dann summiert)
  function jsEternalRows(past, map) {
    var last10 = past.slice(0, 10);   // past ist bereits neuste zuerst sortiert
    var totals = {};
    last10.forEach(function (d) {
      jsEternalEntries(d, map).forEach(function (e) {
        if (!totals[e.key]) totals[e.key] = { name: e.name, points: 0, rounds: 0 };
        totals[e.key].points += e.points;
        totals[e.key].rounds += 1;
      });
    });
    var rows = Object.keys(totals).map(function (k) { return totals[k]; });
    rows.sort(function (a, b) { return b.points - a.points; });
    var rank = 0, last = null;
    rows.forEach(function (r, i) { if (r.points !== last) { rank = i + 1; last = r.points; } r.rank = rank; });
    return { rows: rows, n: last10.length };
  }

  async function jsPrintMatrix() {
    toast(L('ccPdfBuilding'));
    var map = ccMap();
    var all = S.js.days.slice().sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
    var past = all.filter(function (d) { return d.closed; });
    if (!past.length) { toast('Keine abgeschlossenen Runden.'); return; }
    var rounds = past; // chronologisch älteste zuerst

    // Spieler aus ALLEN Runden – «Uralt Spieler» (nur in Runde 20) herausfiltern:
    // Einträge ohne echtes Profil (id = null, key beginnt mit 'n:') die NUR in einer
    // einzigen Runde auftauchen und keiner App-Person zugeordnet sind, werden ausgeblendet.
    var totals = {};
    past.forEach(function (d) {
      jsEternalEntries(d, map).forEach(function (e) {
        if (!totals[e.key]) totals[e.key] = { name: e.name, total: 0, rounds: 0, hasProfile: e.key.charAt(0) !== 'n' };
        totals[e.key].total += e.points;
        totals[e.key].rounds += 1;
      });
    });
    var players = Object.keys(totals)
      .filter(function (k) {
        // Einträge ohne App-Profil, die nur in einer Runde vorkommen: ausblenden
        return totals[k].hasProfile || totals[k].rounds > 1;
      })
      .map(function (k) { return { key: k, name: totals[k].name, total: totals[k].total }; });
    players.sort(function (a, b) { return b.total - a.total; });

    var logo = await ensureLogoDataUrl();
    var jsPDFCtor = window.jspdf.jsPDF;
    var doc = new jsPDFCtor({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight();
    var M = 12;
    var BLUE = [48, 124, 192], BLUE_DARK = [11, 47, 94], BLUE_SOFT = [227, 239, 249];
    var INK = [22, 35, 59], LINE = [218, 222, 214], WHITE = [255, 255, 255];
    var GOLD_FILL = [212, 170, 40], SILVER = [130, 138, 148];

    // Layout
    var RANK_COL = 8;    // Rang
    var NAME_COL = 34;   // Spielername
    var TOTAL_COL = 14;  // Total rechts
    var nRounds = rounds.length;
    var available = PW - 2 * M - RANK_COL - NAME_COL - TOTAL_COL;
    var COL = Math.max(8, Math.min(18, available / Math.max(nRounds, 1)));
    var tableW = RANK_COL + NAME_COL + nRounds * COL + TOTAL_COL;
    var ROW_H = 7;
    var HDR_H1 = 5.5;  // erste Kopfzeile (Runde/Titel)
    var HDR_H2 = 5.5;  // zweite Kopfzeile (Nummer)
    var HDR_H = HDR_H1 + HDR_H2;
    var FS = 6.5;     // Schriftgrösse in Zellen
    function cellTextY(midY) { return midY + FS * 0.132; }

    function drawCell(cx, cy, pts2) {
      var midY = cy + ROW_H / 2;
      var ty = cellTextY(midY);
      if (pts2 === 32) {
        // Schwarz, fett, in Klammern
        doc.setTextColor.apply(doc, [0, 0, 0]); doc.setFont('helvetica', 'bold'); doc.setFontSize(FS);
        doc.text('(' + pts2 + ')', cx, ty, { align: 'center' });
      } else if (pts2 === 28) {
        // Schwarz, normal, in Klammern
        doc.setTextColor.apply(doc, [0, 0, 0]); doc.setFont('helvetica', 'normal'); doc.setFontSize(FS);
        doc.text('(' + pts2 + ')', cx, ty, { align: 'center' });
      } else if (pts2 === 24) {
        // Dunkelblau, normal, in Klammern
        doc.setTextColor.apply(doc, INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(FS);
        doc.text('(' + pts2 + ')', cx, ty, { align: 'center' });
      } else {
        // 4–20: dunkelblau, normal, ohne Klammern
        doc.setTextColor.apply(doc, INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(FS);
        doc.text(String(pts2), cx, ty, { align: 'center' });
      }
    }

    // Seitenkopf (identisches Layout zum Chilbi-Plan)
    var HDR_PAGE = 24;
    function drawHeader() {
      doc.setFillColor.apply(doc, BLUE_DARK); doc.rect(0, 0, PW, HDR_PAGE, 'F');
      if (logo) { try { doc.addImage(logo, 'PNG', M, 4, 13.5, 15.5); } catch (e) {} }
      doc.setTextColor.apply(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
      doc.text('Jassmasters Übersicht', M + 18, 11.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(207, 224, 242);
      doc.text(rounds.length + ' Runden · ' + players.length + ' Spieler', M + 18, 17);
      doc.text(new Date().toLocaleDateString('de-CH'), PW - M, 14, { align: 'right' });
    }
    function drawFooter(page) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(93, 103, 122);
      doc.text('Jassmasters Übersicht', M, PH - 6);
      doc.text('Seite ' + page, PW - M, PH - 6, { align: 'right' });
    }

    // Tabellen-Kopf: zweizeilig (Zeile 1: «Runde X», Zeile 2: Rundennummer/Jahr)
    function drawTableHeader(yy) {
      // Hintergrund
      doc.setFillColor.apply(doc, BLUE_DARK); doc.rect(M, yy, tableW, HDR_H, 'F');
      doc.setDrawColor.apply(doc, BLUE); doc.setLineWidth(0.1);

      // Rang + Spieler-Header
      doc.setTextColor.apply(doc, WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('#', M + RANK_COL / 2, yy + HDR_H1 + HDR_H2 / 2 + 6 * 0.132, { align: 'center' });
      doc.text('Spieler', M + RANK_COL + 2, yy + HDR_H1 + HDR_H2 / 2 + 6 * 0.132);

      // Runden-Spalten: Zeile 1 = «Runde X», Zeile 2 = Jahr/Kurzname
      rounds.forEach(function (d, ci) {
        var cx = M + RANK_COL + NAME_COL + ci * COL + COL / 2;
        // Zeile 1: Rundenname (z. B. «Runde 36»)
        var lbl1 = d.name ? d.name.split(' ')[0] : 'Runde';
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
        doc.text(lbl1, cx, yy + HDR_H1 / 2 + 6.5 * 0.132, { align: 'center', maxWidth: COL - 0.5 });
        // Zeile 2: Nummer oder Jahr
        var lbl2 = d.name ? (d.name.split(' ')[1] || '') : monthYear(d.day).split(' ')[1] || '';
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
        doc.text(lbl2, cx, yy + HDR_H1 + HDR_H2 / 2 + 6.5 * 0.132, { align: 'center', maxWidth: COL - 0.5 });
        // Trennlinie
        doc.line(M + RANK_COL + NAME_COL + ci * COL, yy, M + RANK_COL + NAME_COL + ci * COL, yy + HDR_H);
      });

      // Total-Header
      var tx = M + RANK_COL + NAME_COL + nRounds * COL + TOTAL_COL / 2;
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('Total', tx, yy + HDR_H1 / 2 + 6.5 * 0.132, { align: 'center' });
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('Pkt', tx, yy + HDR_H1 + HDR_H2 / 2 + 6.5 * 0.132, { align: 'center' });
    }

    drawHeader();
    var y = HDR_PAGE + 2;
    var page = 1;
    drawTableHeader(y);
    y += HDR_H;

    // Rang berechnen (ex aequo)
    var rank = 0, lastTotal = null;
    players.forEach(function (pl, ri) { if (pl.total !== lastTotal) { rank = ri + 1; lastTotal = pl.total; } pl.rank = rank; });

    // Spieler-Zeilen
    players.forEach(function (pl, ri) {
      if (y + ROW_H > PH - 14) {
        drawFooter(page); doc.addPage(); page++;
        drawHeader(); y = HDR_PAGE + 2;
        drawTableHeader(y); y += HDR_H;
      }
      var bg = ri % 2 === 0 ? WHITE : BLUE_SOFT;
      doc.setFillColor.apply(doc, bg); doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.12);
      doc.rect(M, y, tableW, ROW_H, 'FD');

      var midY = y + ROW_H / 2;

      // Rang
      doc.setTextColor.apply(doc, [130, 138, 148]); doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.text(String(pl.rank), M + RANK_COL / 2, midY + 6 * 0.132, { align: 'center' });

      // Trennlinie Rang/Name
      doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.2);
      doc.line(M + RANK_COL, y, M + RANK_COL, y + ROW_H);

      // Spielername
      doc.setTextColor.apply(doc, INK);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text(pl.name, M + RANK_COL + 2, midY + 7 * 0.132, { maxWidth: NAME_COL - 3 });

      // Trennlinie Name/Runden
      doc.setLineWidth(0.2);
      doc.line(M + RANK_COL + NAME_COL, y, M + RANK_COL + NAME_COL, y + ROW_H);

      // Runden-Zellen
      var rowTotal = 0;
      rounds.forEach(function (d, ci) {
        var entries = jsEternalEntries(d, map);
        var byKey = {};
        entries.forEach(function (e) { byKey[e.key] = e.points; });
        var pts2 = byKey[pl.key];
        var cx = M + RANK_COL + NAME_COL + ci * COL + COL / 2;
        if (pts2 != null) {
          rowTotal += pts2;
          drawCell(cx, y, pts2);
        } else {
          doc.setTextColor.apply(doc, LINE); doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
          doc.text('–', cx, midY + FS * 0.132, { align: 'center' });
        }
        doc.setDrawColor.apply(doc, LINE); doc.setLineWidth(0.1);
        doc.line(M + RANK_COL + NAME_COL + (ci + 1) * COL, y, M + RANK_COL + NAME_COL + (ci + 1) * COL, y + ROW_H);
      });

      // Total
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor.apply(doc, BLUE);
      doc.text(String(pl.total), M + RANK_COL + NAME_COL + nRounds * COL + TOTAL_COL / 2, midY + 7.5 * 0.132, { align: 'center' });
      y += ROW_H;
    });

    drawFooter(page);

    // Teilen/Speichern
    var blob = doc.output('blob');
    var fname = 'Jassmasters-' + new Date().getFullYear() + '.pdf';
    try {
      var file = new File([blob], fname, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Jassmasters Übersicht' }); return;
      }
    } catch (e) {}
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function jsEternalFolder(past) {
    var key = 'jsEternal', folded = S.jsFold[key] !== true;   // Standard: zugeklappt
    var map = ccMap(), res = jsEternalRows(past, map);
    var showInfo = !!S.info['jsh:' + key], hasRows = res.rows.length > 0;
    var html = '<section class="ccel"><div class="cceh">' +
      '<button type="button" class="cct" data-act="js-fold" data-id="' + key + '" aria-expanded="' + !folded + '">' + esc(L('jsEternal')) + '</button>' +
      (hasRows ? hico('js-hint', ICON.info, showInfo ? L('infoHide') : L('infoShow'), { on: showInfo, data: { id: key } }) : '') +
      jsFoldBtn(key, folded, L('jsEternal'), false) + '</div>' +
      (showInfo && hasRows ? '<p class="infobar">' + L('jsEternalHint', { n: res.n }) + '</p>' : '');
    if (!folded) {
      html += '<div class="ccbody">';
      if (!res.rows.length) {
        html += '<p class="ccsum" style="padding-top:10px">' + L('jsNoPoints') + '</p>';
      } else {
        html += '<ol class="jsrank">' + res.rows.map(function (r) {
            return '<li><span class="jsrk">' + r.rank + '.</span><span class="jsrn">' + esc(r.name) + '</span><span class="jsstp">' + L(r.rounds === 1 ? 'jsEternalRound' : 'jsEternalRounds', { n: r.rounds }) + '</span><span class="jsrp">' + r.points + '</span></li>';
          }).join('') + '</ol>';
      }
      html += '</div>';
    }
    html += '</section>';
    return html;
  }

  // Ein fester Ordner (Anstehend/Vergangen) mit eigenem Auf-/Zuklapp-Zustand
  function jsFolder(key, title, days, isUpcoming, ed, map) {
    // Anstehend ist standardmässig offen, Vergangen standardmässig zu.
    var folded = isUpcoming ? (S.jsFold[key] === true) : (S.jsFold[key] !== true);
    var html = '<section class="ccel"><div class="cceh">' +
      '<button type="button" class="cct" data-act="js-fold" data-id="' + key + '" aria-expanded="' + !folded + '">' + esc(title) + ' <span class="cnt">(' + days.length + ')</span></button>' +
      (isUpcoming && ed ? hico('js-addday', ICON.plus, L('jsAddDay')) : '') +
      (!isUpcoming && days.length && ed ? hico('js-print-past', ICON.print, L('jsPrint')) : '') +
      jsFoldBtn(key, folded, title, false) + '</div>';
    if (!folded) {
      html += '<div class="ccbody">';
      if (!days.length) html += '<p class="ccsum" style="padding-top:10px">' + L('jsNoDays') + '</p>';
      days.forEach(function (d) { html += jsDayHtml(d, ed, map, isUpcoming); });
      html += '</div>';
    }
    html += '</section>';
    return html;
  }

  // opts.info = { id, text }: Info-Icon in der Kopfzeile (links vom Pfeil), der Text steht erst nach dem Antippen im Abschnitt
  function jsSub(key, title, body, opts) {
    var folded = !!S.jsFold[key], inf = opts && opts.info, showInfo = inf && !!S.info['jsh:' + inf.id];
    var infoBtn = inf ? hico('js-hint', ICON.info, showInfo ? L('infoHide') : L('infoShow'), { on: showInfo, data: { id: inf.id } }) : '';
    return '<div class="jssub"><div class="jssh"><button type="button" class="jsst" data-act="js-fold" data-id="' + esc(key) + '" aria-expanded="' + !folded + '">' + title + '</button>' +
      infoBtn + jsFoldBtn(key, folded, title, true) + '</div>' +
      (showInfo ? '<p class="infobar">' + inf.text + '</p>' : '') +
      (folded ? '' : '<div class="jssb">' + body + '</div>') + '</div>';
  }

  // Rangliste darstellen: entweder die von Hand gepflegte (manual_ranking) oder die aus den
  // Spiel-Punkten berechnete. Die von Hand gepflegte zeigt nur einen Punktewert pro Person.
  function jsRowBtn(d, i, nm) {
    return '<button type="button" class="hico jsrowedit" data-act="js-row-edit" data-id="' + esc(d.id) + '" data-idx="' + i + '" aria-label="' + esc(L('jsEditRow') + ': ' + nm) + '" title="' + esc(L('jsEditRow')) + '">' + ICON.dots + '</button>';
  }
  // Rangliste einer Runde als Zeilenliste {id, name, points, gamePts} in der angezeigten Reihenfolge (auch für berechnete Ranglisten)
  function jsMaterialize(d) {
    var map = ccMap();
    if (Array.isArray(d.manual_ranking) && d.manual_ranking.length) {
      return d.manual_ranking.map(function (r, i) { return { _i: i, id: r.id || null, name: r.name, points: r.points, gamePts: r.gamePts }; }).sort(function (a, b) { return (b.points || 0) - (a.points || 0) || a._i - b._i; })
        .map(function (r) { return { id: r.id, name: r.id && ccMember(r.id) ? ccMember(r.id).name : r.name, points: r.points, gamePts: r.gamePts }; });
    }
    var P = jsPlayers(d);
    return jsRanking(d).map(function (r) { var p = P[r.slot - 1]; return { id: p && p.id ? p.id : null, name: jsName(P, r.slot, map), points: r.standing, gamePts: r.pts }; });
  }
  function jsRankingHtml(d, P, map, editable) {
    if (Array.isArray(d.manual_ranking) && d.manual_ranking.length) {
      var rows = d.manual_ranking.slice().sort(function (a, b) { return (b.points || 0) - (a.points || 0); });
      var rank = 0, last = null;
      rows.forEach(function (r, i) { if (r.points !== last) { rank = i + 1; last = r.points; } r.rank = rank; });
      return '<ol class="jsrank">' + rows.map(function (r, mi) {
        var nm = r.id ? (ccMember(r.id) ? ccMember(r.id).name : r.name) : r.name;
        var diff = r.gamePts != null ? (r.gamePts >= 0 ? '(+' + r.gamePts + ')' : '(' + r.gamePts + ')') : '';
      return '<li><span class="jsrk">' + r.rank + '.</span><span class="jsrn">' + esc(nm) + '</span>' + (diff ? '<span class="jsdiff">' + diff + '</span>' : '') + '<span class="jsrp">' + (r.points == null ? '\u2013' : r.points) + '</span>' + (editable ? jsRowBtn(d, mi, nm) : '') + '</li>';
      }).join('') + '</ol>';
    }
    var sc = jsScores(d), any = Object.keys(sc).some(function (k) { return typeof sc[k] === 'number'; });
    if (!any) return '<p class="ccsum">' + L('jsNoPoints') + '</p>';
    var rows2 = jsRanking(d);
    return '<ol class="jsrank">' + rows2.map(function (r, ri) {
      var diff = jsFmt(r.pts);   // z. B. "+157" oder "-23"
      return '<li><span class="jsrk">' + r.rank + '.</span><span class="jsrn">' + esc(jsName(P, r.slot, map)) + '</span><span class="jsdiff' + jsCls(r.pts) + '">(' + diff + ')</span><span class="jsrpn">' + r.standing + '</span>' + (editable ? jsRowBtn(d, ri, jsName(P, r.slot, map)) : '') + '</li>';
    }).join('') + '</ol>';
  }

  function jsDayHtml(d, ed, map, isUpcoming) {
    var df = !!S.jsFold[d.id], P = jsPlayers(d), sc = jsScores(d);
    var label = (isUpcoming ? fullDateIso(d.day) : monthYear(d.day)) + (d.name ? ' (' + esc(d.name) + ')' : '');
    var h = '<div class="ccday"><div class="ccdh">' +
      (isUpcoming && ed ? '<input type="checkbox" class="ccck" data-jsactive="' + esc(d.id) + '"' + (d.active !== false ? ' checked' : '') + ' aria-label="' + esc(label + ': ' + L('ccActive')) + '" title="' + esc(L('jsVisibleHint')) + '">' : '') +
      '<button type="button" class="ccdt" data-act="js-fold" data-id="' + esc(d.id) + '" aria-expanded="' + !df + '"><b>' + label + '</b></button>' +
      (ed ? (d.closed ? hico('js-lock', d.id && S.jsUnlock[d.id] ? ICON.unlock : ICON.lock, S.jsUnlock[d.id] ? L('jsUnlocked') : L('jsLocked'), { on: !!S.jsUnlock[d.id], aria: (S.jsUnlock[d.id] ? L('jsUnlocked') : L('jsLocked')) + ': ' + label, data: { id: d.id } }) + (S.jsUnlock[d.id] ? jsDots('day', d.id, label) : '') : jsDots('day', d.id, label)) : '') + jsFoldBtn(d.id, df, label, true) + '</div>';
    if (df) return h + '</div>';

    // Teilnehmer 1–8: nur für Jass Manager und Admin sichtbar
    var tp = ed ? P.map(function (p, i) {
      var inner = '<span class="jsnr">' + (i + 1) + '</span>' + (p ? ccChip(p, map) : '<span class="ccsum">' + L('jsFree') + '</span>');
      return '<button type="button" class="jsp" data-act="js-pick" data-id="' + esc(d.id) + '" data-slot="' + (i + 1) + '" aria-label="' + esc(L('jsPick', { n: i + 1 })) + '">' + inner + '<span class="sp"></span>' + ICON.pencil + '</button>';
    }).join('') : '';

    // Spielplan (der Hinweistext steckt hinter dem Info-Symbol in der Kopfzeile)
    var sp = '';
    JS_PLAN.forEach(function (round, ri) {
      sp += '<div class="jsround">' + L('jsRound', { n: ri + 1 }) + '</div>';
      round.forEach(function (g) {
        var key = (ri + 1) + g[0], v = typeof sc[key] === 'number' ? sc[key] : null;
        var team = function (nr, slots, val) {
          var names = slots.map(function (s) { return '<span class="jsnm">' + esc(jsName(P, s, map)) + '</span>'; }).join('<span class="jsamp">&amp;</span>');
          var cell = ed
            ? '<input class="jspts' + jsCls(val) + '" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" data-jsscore="' + esc(d.id) + '" data-game="' + key + '" data-team="' + nr + '" value="' + (val == null ? '' : val) + '" aria-label="' + esc(L('jsRound', { n: ri + 1 }) + ' ' + g[0] + ', ' + L('jsPoints')) + '">'
            : '<span class="jspv' + jsCls(val) + '">' + jsFmt(val) + '</span>';
          return '<div class="jsteam"><span class="jsnames">' + names + '</span>' + cell + '</div>';
        };
        sp += '<div class="jsgame">' + team(1, g[1], v) + team(2, g[2], v == null ? null : -v) + '</div>';
      });
    });

    var rk = jsRankingHtml(d, P, map, !!(ed && d.closed && S.jsUnlock[d.id]));

    h += isUpcoming
      ? (ed ? jsSub(d.id + ':p', L('jsParticipants'), '<div class="jsplist">' + tp + '</div>') : '') +
        jsSub(d.id + ':s', L('jsSchedule'), sp, ed ? { info: { id: d.id, text: L('jsHint') } } : null) +
        jsSub(d.id + ':r', L('jsRanking'), rk)
      : rk;   // Vergangene Jassmasters: nur die Tagesrangliste, direkt sichtbar
    return h + '</div>';
  }

  /* Punkte speichern: Team I erhält v, Team II −v */
  async function jsSaveScore(inp) {
    var raw = String(inp.value || '').trim().replace(/[^\d-]/g, '');
    var n = raw === '' || raw === '-' ? null : parseInt(raw, 10);
    if (n != null && isNaN(n)) n = null;
    var v = n == null ? null : (inp.dataset.team === '2' ? -n : n);
    var d = S.js.days.filter(function (x) { return x.id === inp.dataset.jsscore; })[0];
    if (!d) return;
    var sc = Object.assign({}, jsScores(d));
    if (v == null) delete sc[inp.dataset.game]; else sc[inp.dataset.game] = v;
    d.scores = sc;   // sofort anzeigen
    render();
    var r = await sb.rpc('jass_set_score', { p_day: d.id, p_game: inp.dataset.game, p_pts: v });
    if (r.error) { console.error(r.error); toast(L('errFailed') + ': ' + String(r.error.message || '').slice(0, 100)); }
    try { await loadAll(); softRender(); } catch (e) { console.error(e); }
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.dataset && t.dataset.jsscore && jsEdit()) jsSaveScore(t);
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key === 'Enter' && t && t.dataset && t.dataset.jsscore) { e.preventDefault(); t.blur(); }
  });

  /* ---------- Jass: Aktionsfenster ---------- */
  var jsSheet = null;   // { lvl, id, mode, slot, q }
  function jsKey(e) { if (e.key === 'Escape' && !document.getElementById('dlg')) { e.preventDefault(); jsClose(); } }
  function jsClose() {
    var el = document.getElementById('jssheet');
    if (el) el.remove();
    jsSheet = null;
    document.removeEventListener('keydown', jsKey, true);
  }
  function jsOpen(o) { jsSheet = o; jsDraw(); }
  function jsFind(lvl, id) {
    return S.js.days.filter(function (x) { return x.id === id; })[0] || null;
  }
  // Liefert die ID einer (impliziten) Jass-Serie, legt bei Bedarf eine an. Die Serie ist
  // in der Oberfläche nicht sichtbar, wird aber als Fremdschlüssel für jass_days gebraucht.
  async function jsEnsureSeries() {
    if (S.js.series.length) return S.js.series[0].id;
    var r = await sb.from('jass_series').insert({ name: 'Jassmasters' }).select('id').single();
    if (r.error) throw r.error;
    return r.data.id;
  }
  function jsDraw() {
    var st = jsSheet;
    if (!st) return;
    var o = st.id ? jsFind(st.lvl, st.id) : null;
    if (st.id && !o) { jsClose(); return; }
    var body = '';
    var btn = function (a, icon, label, cls) { return '<button type="button" class="ccact' + (cls ? ' ' + cls : '') + '" data-jsa="' + a + '">' + icon + '<span>' + label + '</span></button>'; };
    var formEnd = '<p class="err" data-jserr hidden></p><div class="dlgbtns"><button type="button" class="btn ghost inline" data-jsa="close">' + L('dismiss') + '</button><button type="submit" class="btn inline">' + L('save') + '</button></div></form>';
    if (st.mode === 'menu') {
      var dLabel = (o.closed ? monthYear(o.day) : fullDateIso(o.day)) + (o.name ? ' (' + esc(o.name) + ')' : '');
      body = '<p class="cck">' + L('jsLvlDay') + '</p><h3>' + dLabel + '</h3>' +
        btn('edit', ICON.pencil, L('ccChange')) +
        btn('edit-ranking', ICON.pencil, L('jsEditRanking')) +
        (!o.closed ? btn('finish', ICON.check, L('jsFinish')) : '') +
        btn('del', ICON.trash, L('del'), 'del') +
        '<button type="button" class="ccact close" data-jsa="close">' + L('ccClose') + '</button>';
    } else if (st.mode === 'day-form') {
      body = '<p class="cck">' + L('jsLvlDay') + '</p><h3>' + esc(o ? (o.closed ? monthYear(o.day) : fullDateIso(o.day)) : L('jsAddDay')) + '</h3><form data-jsform="day" novalidate>' +
        fld(L('date'), '<input class="input" type="date" name="date" value="' + esc(o ? o.day : '') + '" required>') +
        fld(L('ccNameOpt'), '<input class="input" name="name" value="' + esc(o && o.name ? o.name : '') + '" placeholder="32. Jassmasters">') + formEnd;
    } else if (st.mode === 'rank-form') {
      if (!st.rows) st.rows = (o.manual_ranking || []).map(function (r) { return { name: r.name, points: r.points, id: r.id || null, gamePts: r.gamePts }; });
      body = '<p class="cck">' + L('jsRanking') + '</p><h3>' + esc((o.closed ? monthYear(o.day) : fullDateIso(o.day)) + (o.name ? ' (' + o.name + ')' : '')) + '</h3>' +
        '<form data-jsform="rank" novalidate><div id="jsrankrows">' + jsRankRowsHtml(st.rows) + '</div>' +
        '<button type="button" class="btn ghost inline" data-jsa="rank-add" style="margin:4px 0 10px">' + ICON.plus + ' ' + L('jsAddRow') + '</button>' +
        formEnd;
    } else if (st.mode === 'row-form') {
      if (!st.base) st.base = jsMaterialize(o);
      var rw = st.base[st.idx] || { name: '', points: '', gamePts: '' };
      body = '<p class="cck">' + L('jsRanking') + '</p><h3>' + esc(rw.name || L('jsEditRow')) + '</h3>' +
        '<form data-jsform="row" novalidate>' +
        fld(L('jsRankName'), '<input class="input" list="jsmemberlist" name="rn" value="' + esc(rw.name || '') + '">') +
        grid(fld(L('jsRankPoints'), '<input class="input" type="text" inputmode="numeric" pattern="-?[0-9]*" name="rp" value="' + (rw.points == null ? '' : rw.points) + '">'),
             fld(L('jsRankDiff'), '<input class="input" type="text" inputmode="numeric" pattern="-?[0-9]*" name="rg" value="' + (rw.gamePts == null ? '' : rw.gamePts) + '">')) +
        '<datalist id="jsmemberlist">' + S.members.filter(function (m) { return !m.isGuest && !m.isCandidate; }).map(function (m) { return '<option value="' + esc(m.name) + '">'; }).join('') + '</datalist>' + formEnd;
    } else if (st.mode === 'pick') {
      var P = jsPlayers(o), cur = P[st.slot - 1];
      var curFree = cur && !cur.id ? cur.name : '';
      body = '<p class="cck">' + L('jsParticipants') + '</p><h3>' + esc(L('jsPick', { n: st.slot })) + '</h3>' +
        '<input class="input" name="q" placeholder="' + esc(L('ccSearch')) + '" autocomplete="off" value="' + esc(st.q || '') + '">' +
        '<div class="ccplist" id="jsplist"></div>' +

        (cur ? btn('clear', ICON.trash, L('jsClear'), 'del') : '') +
        '<button type="button" class="ccact close" data-jsa="close">' + L('ccClose') + '</button>';
    }
    var wrap = document.getElementById('jssheet');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'jssheet';
      wrap.className = 'ccsheet';
      wrap.addEventListener('click', jsClick);
      wrap.addEventListener('submit', jsSubmit);
      wrap.addEventListener('input', function (e) { if (e.target.name === 'q' && jsSheet) { jsSheet.q = e.target.value; jsDrawPick(); } });
      document.body.appendChild(wrap);
      document.addEventListener('keydown', jsKey, true);
    }
    wrap.innerHTML = '<div class="ccsheetcard" role="dialog" aria-modal="true" aria-label="' + esc(L('navJass')) + '">' + body + '</div>';
    if (st.mode === 'pick') jsDrawPick();
    var first = wrap.querySelector('.input') || wrap.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
  }
  function jsRankRowsHtml(rows) {
    if (!rows.length) rows = [{ name: '', points: '' }];
    var html = rows.map(function (r, i) {
      return '<div class="jsrankrow"><input class="input" list="jsmemberlist" name="rn' + i + '" value="' + esc(r.name || '') + '" placeholder="' + esc(L('jsRankName')) + '">' +
        '<input class="input jsrankpts" type="text" inputmode="numeric" pattern="-?[0-9]*" name="rp' + i + '" value="' + (r.points == null || r.points === '' ? '' : r.points) + '" placeholder="' + esc(L('jsRankPoints')) + '">' +
        '<button type="button" class="ccx" data-jsa="rank-remove" data-idx="' + i + '" aria-label="' + esc(L('remove')) + '">\u00d7</button></div>';
    }).join('');
    html += '<datalist id="jsmemberlist">' + S.members.filter(function (m) { return !m.isGuest && !m.isCandidate; }).map(function (m) { return '<option value="' + esc(m.name) + '">'; }).join('') + '</datalist>';
    return html;
  }
  function jsDrawPick() {
    var box = document.getElementById('jsplist');
    if (!box || !jsSheet) return;
    var d = jsFind('day', jsSheet.id), P = jsPlayers(d), map = ccMap();
    var used = {};
    P.forEach(function (p, i) { if (p && i !== jsSheet.slot - 1) { var r = ccResolve(p, map); if (r.id) used[r.id] = i + 1; } });
    var q = ccNorm(jsSheet.q || '');
    var list = S.members.filter(function (m) { return !m.isCandidate && (!q || ccNorm(m.name).indexOf(q) > -1); });
    var avail = list.filter(function (m) { return !used[m.id]; });
    box.innerHTML = avail.length ? avail.map(function (m) {
      var k = m.isGuest ? 'g' : 'm';
      return '<button type="button" class="ccpick jspick" data-jsa="choose" data-pid="' + esc(m.id) + '">' +
        '<span class="ccp cc-' + k + '">' + esc(m.name) + '</span></button>';
    }).join('') : '<p class="ccsum" style="padding:10px 12px;margin:0">' + L('nobody') + '</p>';
  }
  async function jsSetPlayer(dayId, slot, person) {
    var d = jsFind('day', dayId);
    if (!d) return;
    var P = jsPlayers(d);
    P[slot - 1] = person;
    jsClose();
    await act(function () { return sb.from('jass_days').update({ players: P }).eq('id', dayId); }, L('ccSaved'));
  }
  function jsSyncRankRows() {
    var st = jsSheet, wrap = document.getElementById('jssheet');
    if (!st || !st.rows || !wrap) return;
    st.rows.forEach(function (r, i) {
      var ni = wrap.querySelector('[name="rn' + i + '"]'), pi = wrap.querySelector('[name="rp' + i + '"]');
      if (ni) r.name = ni.value;
      if (pi) r.points = pi.value;
    });
  }
  async function jsClick(e) {
    var wrap = document.getElementById('jssheet');
    if (e.target === wrap) { jsClose(); return; }
    var b = e.target.closest('[data-jsa]');
    if (!b || !jsSheet) return;
    var a = b.dataset.jsa, st = jsSheet, o = st.id ? jsFind(st.lvl, st.id) : null;
    if (a === 'close') { jsClose(); return; }
    if (a === 'edit') { st.mode = 'day-form'; jsDraw(); return; }
    if (a === 'edit-ranking') { st.mode = 'rank-form'; st.rows = null; jsDraw(); return; }
    if (a === 'finish') {
      var flabel = (o.closed ? monthYear(o.day) : fullDateIso(o.day)) + (o.name ? ' (' + o.name + ')' : '');
      jsClose();
      if (!(await askConfirm(L('jsFinish'), L('jsConfirmFinish', { name: flabel }), false))) return;
      return act(function () { return sb.from('jass_days').update({ closed: true }).eq('id', o.id); }, L('jsFinished'));
    }
    if (a === 'rank-add') { jsSyncRankRows(); st.rows.push({ name: '', points: '', id: null }); jsDraw(); return; }
    if (a === 'rank-remove') { jsSyncRankRows(); st.rows.splice(Number(b.dataset.idx), 1); jsDraw(); return; }
    if (a === 'del') {
      var title = ccDate(o.day), id = o.id;
      jsClose();
      if (!(await askConfirm(L('del'), L('ccConfirmDel', { name: title }), true))) return;
      return act(function () { return sb.from('jass_days').delete().eq('id', id); }, L('ccDeleted'));
    }
    if (a === 'clear') return jsSetPlayer(st.id, st.slot, null);
    if (a === 'choose') {
      var m = ccMember(b.dataset.pid);
      if (m) return jsSetPlayer(st.id, st.slot, { id: m.id, name: m.name });
    }
    if (a === 'other') {
      var inp = wrap.querySelector('input[name="other"]');
      var v = inp ? inp.value.trim() : '';
      if (!v) { return; }
      return jsSetPlayer(st.id, st.slot, { name: v });
    }
  }
  async function jsSubmit(e) {
    e.preventDefault();
    var f = e.target, st = jsSheet;
    if (!st || !f.dataset.jsform) return;
    var fd = new FormData(f), g = function (k) { return String(fd.get(k) || '').trim(); };
    var err = function (m) { var el = f.querySelector('[data-jserr]'); if (el) { el.textContent = m; el.hidden = false; } };
    if (f.dataset.jsform === 'day') {
      if (!g('date')) { err(L('date') + '?'); return; }
      var dt = g('date'), nm = g('name') || null, isEdit = st.id != null, id = st.id;
      jsClose();
      if (isEdit) return act(function () { return sb.from('jass_days').update({ day: dt, name: nm }).eq('id', id); }, L('ccSaved'));
      return act(async function () {
        var sid = await jsEnsureSeries();
        return sb.from('jass_days').insert({ series_id: sid, day: dt, name: nm, active: false, players: [null, null, null, null, null, null, null, null], scores: {} });
      }, L('ccSaved'));
    }
    if (f.dataset.jsform === 'row') {
      if (!jsEdit()) return;
      var rn = g('rn'), rp = g('rp'), rg = g('rg');
      if (!rn) { err(L('jsRankName') + '?'); return; }
      if (rp !== '' && isNaN(parseInt(rp, 10))) { err(L('jsRankPoints') + '?'); return; }
      if (rg !== '' && isNaN(parseInt(rg, 10))) { err(L('jsRankDiff') + '?'); return; }
      var mem = S.members.filter(function (m) { return !m.isGuest && ccNorm(m.name) === ccNorm(rn); })[0];
      var base = (st.base || []).map(function (r) { return { name: r.name, id: r.id || null, points: r.points, gamePts: r.gamePts }; });
      var upd = { name: mem ? mem.name : rn, id: mem ? mem.id : null, points: rp === '' ? null : parseInt(rp, 10) };
      if (rg !== '') upd.gamePts = parseInt(rg, 10);
      base[st.idx] = upd;
      base = base.map(function (r) { var o2 = { name: r.name, id: r.id, points: r.points }; if (r.gamePts != null && r.gamePts !== '') o2.gamePts = r.gamePts; return o2; });
      var rdayId = st.id;
      jsClose();
      return act(function () { return sb.from('jass_days').update({ manual_ranking: base }).eq('id', rdayId); }, L('ccSaved'));
    }
    if (f.dataset.jsform === 'rank') {
      var byName = {};
      S.members.forEach(function (m) { if (!m.isGuest) byName[ccNorm(m.name)] = m; });
      var out = [];
      (st.rows || []).forEach(function (r, i) {
        var nm2 = String(fd.get('rn' + i) || '').trim();
        var ptsRaw = String(fd.get('rp' + i) || '').trim();
        if (!nm2 || ptsRaw === '') return;   // leere Zeilen überspringen
        var pts = parseInt(ptsRaw, 10);
        if (isNaN(pts)) return;
        var match = byName[ccNorm(nm2)];
        var orow = { name: match ? match.name : nm2, id: match ? match.id : null, points: pts }; if (r.gamePts != null && r.gamePts !== '') orow.gamePts = r.gamePts; out.push(orow);
      });
      var dayId = st.id;
      jsClose();
      return act(function () { return sb.from('jass_days').update({ manual_ranking: out }).eq('id', dayId); }, L('ccSaved'));
    }
  }

  /* ---------- Aktionsfenster Mitglied (Verwaltung) ---------- */
  var mbSheet = null;
  function mbKey(e) { if (e.key === 'Escape' && !document.getElementById('dlg')) { e.preventDefault(); mbClose(); } }
  function mbClose() {
    var el = document.getElementById('mbsheet');
    if (el) el.remove();
    mbSheet = null;
    document.removeEventListener('keydown', mbKey, true);
  }
  function mbOpen(id, mode) { mbSheet = { id: id, mode: mode || 'menu' }; mbDraw(); }
  function mbBtn(act, id, val, icon, label, cls) {
    return '<button type="button" class="ccact' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-id="' + esc(id) + '"' + (val !== '' ? ' data-val="' + val + '"' : '') + '>' + icon + '<span>' + label + '</span></button>';
  }
  function mbDraw() {
    var m = mbSheet ? ccMember(mbSheet.id) : null;
    if (!m) { mbClose(); return; }
    var self = m.id === S.me.id, body;
    var grp = m.isCandidate ? 'candidate' : m.isGuest ? 'guest' : m.isSupporter ? 'other' : m.isPassive ? 'passive' : 'active';
    var member = grp === 'active' || grp === 'passive' || grp === 'other';   // nur diese drei dürfen Rollen tragen
    var grpTagKey = { active: 'grpActive', passive: 'grpPassive', other: 'grpSupporter', guest: 'ccGuests', candidate: 'grpCandidate' }[grp];
    var GROUPS = [
      { key: 'active', label: 'mGroupActive', icon: ICON.groupA },
      { key: 'passive', label: 'mGroupPassive', icon: ICON.groupP },
      { key: 'other', label: 'mGroupOther', icon: ICON.heart },
      { key: 'guest', label: 'mGroupGuest', icon: ICON.groupG, noSelf: true },
      { key: 'candidate', label: 'mGroupCandidate', icon: ICON.candidate, noSelf: true },
    ];
    if (mbSheet.mode === 'menu') {
      body = '<p class="cck">' + L(grpTagKey) + ' · ' + esc(fmtPhone(m.phone)) + '</p><h3>' + esc(m.name) + '</h3>' +
        (member && !self ? mbBtn('set-admin', m.id, m.isAdmin ? '0' : '1', ICON.gear, L(m.isAdmin ? 'mRevokeAdmin' : 'mMakeAdmin'), 'cat-admin') : '') +
        (member ? mbBtn('set-em', m.id, m.isEventManager ? '0' : '1', ICON.star, L(m.isEventManager ? 'mRevokeEm' : 'mMakeEm'), 'cat-manager') : '') +
        (member ? mbBtn('set-cm', m.id, m.isChilbiManager ? '0' : '1', ICON.glass, L(m.isChilbiManager ? 'mRevokeCm' : 'mMakeCm'), 'cat-manager') : '') +
        (member ? mbBtn('set-crm', m.id, m.isChraenzliManager ? '0' : '1', ICON.glass, L(m.isChraenzliManager ? 'mRevokeCrm' : 'mMakeCrm'), 'cat-manager') : '') +
        (member ? mbBtn('set-dir', m.id, m.isDirector ? '0' : '1', ICON.stage, L(m.isDirector ? 'mRevokeDir' : 'mMakeDir'), 'cat-manager') : '') +
        (member ? mbBtn('set-actor', m.id, m.isActor ? '0' : '1', ICON.stage, L(m.isActor ? 'mRevokeActor' : 'mMakeActor'), 'cat-manager') : '') +
        (member ? mbBtn('set-jm', m.id, m.isJassMaster ? '0' : '1', ICON.trophy, L(m.isJassMaster ? 'mRevokeJm' : 'mMakeJm'), 'cat-manager') : '') +
        (member ? mbBtn('set-bo', m.id, m.isBoard ? '0' : '1', ICON.gv, L(m.isBoard ? 'mRevokeBo' : 'mMakeBo'), 'cat-manager') : '') +
        GROUPS.filter(function (g) { return g.key !== grp && !(g.noSelf && self); })
          .map(function (g) { return mbBtn('set-group', m.id, g.key, g.icon, L(g.label), 'cat-role'); }).join('') +
        (!self ? mbBtn('reset-pin', m.id, '', ICON.dialpad, L('resetPin'), 'cat-other') : '') +
        '<button type="button" class="ccact cat-other" data-mb="edit">' + ICON.pencil + '<span>' + L('mEdit') + '</span></button>' +
        (!self ? mbBtn('remove-member', m.id, '', ICON.trash, L('mDelete'), 'del') : '') +
        '<button type="button" class="ccact close" data-mb="close">' + L('ccClose') + '</button>';
    } else {
      body = '<p class="cck">' + L('mEdit') + '</p><h3>' + esc(m.name) + '</h3>' +
        '<form data-form="member-edit" data-id="' + esc(m.id) + '" novalidate>' +
        fld(L('fullName'), '<input class="input" name="name" value="' + esc(m.name) + '" autocomplete="off" required>') +
        fld(L('phone'), phoneField(m.phone)) +
        '<p class="ccnote">' + L('mEditNote') + '</p>' +
        '<div class="dlgbtns"><button type="button" class="btn ghost inline" data-mb="close">' + L('dismiss') + '</button><button type="submit" class="btn inline">' + L('save') + '</button></div></form>';
    }
    var wrap = document.getElementById('mbsheet');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'mbsheet';
      wrap.className = 'ccsheet';
      wrap.addEventListener('click', function (e) {
        if (e.target === wrap) { mbClose(); return; }
        var b = e.target.closest('[data-mb]');
        if (b) {
          if (b.dataset.mb === 'edit') { mbSheet.mode = 'edit'; mbDraw(); }
          else mbClose();
          return;
        }
        // Aktionen mit data-act laufen über den allgemeinen Klick-Handler weiter; das Fenster schliesst sich vorher
        if (e.target.closest('[data-act]')) mbClose();
      });
      document.body.appendChild(wrap);
      document.addEventListener('keydown', mbKey, true);
    }
    wrap.innerHTML = '<div class="ccsheetcard" role="dialog" aria-modal="true" aria-label="' + esc(m.name) + '">' + body + '</div>';
    var first = wrap.querySelector('form .input') || wrap.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
  }

  /* ---------- Bestätigungsdialog ---------- */
  // Zeigt eine Rückfrage mit «Abbrechen» und «OK». Liefert true, wenn mit OK bestätigt wurde.
  function askConfirm(title, message, danger) {
    return new Promise(function (resolve) {
      var old = document.getElementById('dlg');
      if (old) old.remove();
      var prevFocus = document.activeElement;
      var wrap = document.createElement('div');
      wrap.id = 'dlg';
      wrap.className = 'dlg';
      wrap.innerHTML =
        '<div class="dlgcard" role="alertdialog" aria-modal="true" aria-labelledby="dlgT" aria-describedby="dlgM">' +
          '<h3 id="dlgT">' + esc(title) + '</h3>' +
          '<p id="dlgM">' + esc(message) + '</p>' +
          '<div class="dlgbtns">' +
            '<button type="button" class="btn ghost inline" data-dlg="0">' + L('dismiss') + '</button>' +
            '<button type="button" class="btn inline' + (danger ? ' dangerbtn' : '') + '" data-dlg="1">' + L('ok') + '</button>' +
          '</div>' +
        '</div>';
      var done = function (v) {
        document.removeEventListener('keydown', onKey, true);
        wrap.remove();
        try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) { /* ignorieren */ }
        resolve(v);
      };
      var onKey = function (e) {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        if (e.key === 'Tab') {   // Fokus im Dialog halten
          var b = wrap.querySelectorAll('button');
          if (e.shiftKey && document.activeElement === b[0]) { e.preventDefault(); b[b.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === b[b.length - 1]) { e.preventDefault(); b[0].focus(); }
        }
      };
      wrap.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = e.target.closest('[data-dlg]');
        if (t) done(t.dataset.dlg === '1');
        else if (e.target === wrap) done(false);
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(wrap);
      wrap.querySelector('[data-dlg="0"]').focus();   // Sicherer Standard: Abbrechen hat den Fokus
    });
  }

  /* ---------- Speichern ---------- */
  async function act(fn, okMsg) {
    try {
      var res = await fn();
      if (res && res.error) throw res.error;
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) {
      console.error(e);
      toast(L('errFailed') + (e && e.message ? ': ' + String(e.message).slice(0, 100) : '') + '.');
      return false;
    } finally {
      try { await loadAll(); render(); } catch (e2) { console.error(e2); }
    }
  }

  async function setResponse(table, keyCol, keyVal, val, msg) {
    var store = table === 'training_responses' ? S.tr : S.ev;
    var mine = (store[keyVal] || {})[S.me.id];
    store[keyVal] = store[keyVal] || {};
    var row = { user_id: S.me.id, status: val, updated_at: new Date().toISOString() };
    row[keyCol] = keyVal;
    if (mine === val) {
      delete store[keyVal][S.me.id];
      render();
      await act(function () { return sb.from(table).delete().eq(keyCol, keyVal).eq('user_id', S.me.id); }, L('respWithdrawn'));
    } else {
      store[keyVal][S.me.id] = val;
      render();
      await act(function () { return sb.from(table).upsert(row); }, msg);
    }
  }

  /* ---------- Events: Bearbeiten im Drei-Punkte-Menü (nur Event Manager/Admin) ---------- */
  var evSheet = null;   // { id, mode: 'menu' | 'edit' | 'people', q }
  // Dialog «Event hinzufügen» / «Event bearbeiten» (wie in der Family-App): Titel, Von (Datum | Zeit), Bis (Datum | Zeit), Labels links
  function evFormHtml(ev) {
    var d, t, ed, et, now = new Date();
    if (ev) {
      var en = evEndOf(ev);
      d = ev.date; t = ev.time; ed = en ? en.date : ev.date; et = ev.endTime || '';
    } else {   // Vorgaben: heute, nächste halbe Stunde (höchstens 22:30), Dauer 1 Stunde, Bis = Von
      var sm = Math.min(Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30, 22 * 60 + 30), hm = function (m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
      d = iso(now); t = hm(sm); ed = d; et = hm(sm + 60);
    }
    var irow = function (lbl, inner) { return '<div class="irow"><span class="irl">' + lbl + '</span>' + inner + '</div>'; };
    var dt = function (n1, v1, n2, v2) { return '<input class="input" type="date" name="' + n1 + '" value="' + esc(v1) + '"><input class="input" type="time" name="' + n2 + '" step="1800" value="' + esc(v2) + '">'; };
    return '<form data-form="edit-ev" data-id="' + (ev ? esc(ev.id) : '') + '" novalidate>' +
      irow(L('evTitleLbl'), '<input class="input" name="title" value="' + esc(ev ? ev.title : '') + '" placeholder="' + esc(L('phEventTitle')) + '">') +
      irow(L('evFrom'), dt('date', d, 'time', t)) +
      irow(L('evTo'), dt('end_date', ed, 'end_time', et)) +
      irow(L('place'), '<input class="input" name="place" value="' + esc(ev ? ev.place : '') + '" placeholder="' + esc(L('phEventPlace')) + '">') +
      '<label class="check"><input type="checkbox" name="rsvp"' + (ev && ev.rsvp ? ' checked' : '') + '><span>' + L('rsvpRequired') + '</span></label>' +
      '<div class="dlgbtns"><button type="button" class="btn ghost inline" data-eva="close">' + L('dismiss') + '</button><button type="button" class="btn inline" data-eva="save-ev">' + L('save') + '</button></div></form>';
  }
  // «Bis» folgt «Von» (Datum, und Zeit +1 Stunde), solange es nicht von Hand geändert wurde
  function evFormSetup(form) {
    if (!form) return;
    var d = form.elements.date, t = form.elements.time, ed = form.elements.end_date, et = form.elements.end_time, pd = d.value, pt = t.value;
    var toMin = function (v) { var p = String(v || '').split(':'); return p.length > 1 ? Number(p[0]) * 60 + Number(p[1]) : -1; };
    d.addEventListener('change', function () { if (!ed.value || ed.value === pd || ed.value < d.value) ed.value = d.value; pd = d.value; });
    t.addEventListener('change', function () {
      var m = toMin(t.value);
      if (m >= 0 && m + 60 < 24 * 60 && (!et.value || toMin(et.value) === toMin(pt) + 60)) et.value = pad(Math.floor((m + 60) / 60)) + ':' + pad((m + 60) % 60);
      pt = t.value;
    });
  }
  function evKey(e) { if (e.key === 'Escape' && !document.getElementById('dlg')) { e.preventDefault(); evClose(); } }
  function evClose() {
    var el = document.getElementById('evsheet');
    if (el) el.remove();
    evSheet = null;
    document.removeEventListener('keydown', evKey, true);
  }
  function evOpen(id, mode) { evSheet = { id: id, mode: mode || 'menu', q: '' }; evDraw(); }

  // Antwort einer beliebigen Person setzen (für Event Manager/Admin). Im Unterschied zu
  // setResponse() betrifft dies nicht zwingend die eigene Antwort.
  async function setResponseFor(eventId, userId, val) {
    var cur = (S.ev[eventId] || {})[userId];
    S.ev[eventId] = S.ev[eventId] || {};
    if (cur === val) {
      delete S.ev[eventId][userId];
      render(); if (evSheet) evDraw();
      return act(function () { return sb.from('event_responses').delete().eq('event_id', eventId).eq('user_id', userId); }, L('ccSaved'));
    }
    S.ev[eventId][userId] = val;
    render(); if (evSheet) evDraw();
    return act(function () {
      return sb.from('event_responses').upsert({ event_id: eventId, user_id: userId, status: val, updated_at: new Date().toISOString() });
    }, L('ccSaved'));
  }

  // Training: Antwort einer beliebigen Person setzen (nur Admin; RLS: training_responses_admin_write)
  async function setTrainingResponseFor(key, userId, val) {
    var cur = (S.tr[key] || {})[userId];
    S.tr[key] = S.tr[key] || {};
    if (cur === val) {
      delete S.tr[key][userId];
      render(); if (evSheet) evDraw();
      return act(function () { return sb.from('training_responses').delete().eq('training_key', key).eq('user_id', userId); }, L('ccSaved'));
    }
    S.tr[key][userId] = val;
    render(); if (evSheet) evDraw();
    return act(function () {
      return sb.from('training_responses').upsert({ training_key: key, user_id: userId, status: val, updated_at: new Date().toISOString() });
    }, L('ccSaved'));
  }

  function trPeopleList(tr) {
    var q = ccNorm(evSheet.q || '');
    var pool = S.members.filter(function (m) { return !m.isCandidate; });
    if (q) pool = pool.filter(function (m) { return ccNorm(m.name).indexOf(q) > -1; });
    var r = S.tr[tr.id] || {};
    var rows = pool.map(function (m) {
      var val = r[m.id];
      var b = function (v, cls, label) {
        return '<button type="button" class="resp ' + cls + (val === v ? ' on' : '') + '" data-eva="setresp" data-uid="' + esc(m.id) + '" data-val="' + v + '">' + label + '</button>';
      };
      return '<div class="evprow"><span class="evpn">' + esc(m.name) + '</span><div class="evpbtns">' + b('yes', 'yes', L('yes')) + b('no', 'no', L('no')) + '</div></div>';
    }).join('');
    return rows ? '<div class="evpeople">' + rows + '</div>' : '<p class="ccsum" style="padding:10px 0">' + L('nobody') + '</p>';
  }

  function evPeopleList(ev) {
    if (evSheet && evSheet.mode === 'trpeople') return trPeopleList(ev);
    var q = ccNorm(evSheet.q || '');
    var pool = S.members.filter(function (m) { return !m.isGuest && !m.isSupporter && !m.isCandidate; });
    if (q) pool = pool.filter(function (m) { return ccNorm(m.name).indexOf(q) > -1; });
    var r = S.ev[ev.id] || {};
    var rows = pool.map(function (m) {
      var val = r[m.id];
      var b = function (v, cls, label) {
        return '<button type="button" class="resp ' + cls + (val === v ? ' on' : '') + '" data-eva="setresp" data-uid="' + esc(m.id) + '" data-val="' + v + '">' + label + '</button>';
      };
      return '<div class="evprow"><span class="evpn">' + esc(m.name) + '</span><div class="evpbtns">' +
        b('solo', 'yes', L('solo')) + b('duo', 'yes', L('duo')) + b('no', 'no', L('no')) + '</div></div>';
    }).join('');
    // Nicht-Mitglieder: bestehende Freitext-Einträge + ein leeres Feld zum Hinzufügen
    var extras = Object.keys(r).filter(function (k) { return k.startsWith('x:'); }).map(function (k) {
      var nm = k.slice(2), val = r[k];
      var b = function (v, cls, label) {
        return '<button type="button" class="resp ' + cls + (val === v ? ' on' : '') + '" data-eva="setresp" data-uid="' + esc(k) + '" data-val="' + v + '">' + label + '</button>';
      };
      return '<div class="evprow"><span class="evpn evpext">' + esc(nm) + '</span><div class="evpbtns">' +
        b('solo', 'yes', L('solo')) + b('duo', 'yes', L('duo')) + b('no', 'no', L('no')) + '</div></div>';
    }).join('');
    var addExtra = '<div class="evprow evpaddrow"><input class="input evpextra" name="evpextra" placeholder="' + esc(L('ccOtherPerson')) + '" autocomplete="off"><button type="button" class="btn inline" data-eva="addextra">' + L('ccAdd') + '</button></div>';
    if (!rows && !extras) return '<p class="ccsum" style="padding:10px 0">' + L('nobody') + '</p>' + addExtra;
    return '<div class="evpeople">' + rows + extras + '</div>' + addExtra;
  }

  function evDraw() {
    var st = evSheet;
    if (!st) return;
    var ev;
    if (st.mode === 'trpeople') {
      var trn = getTrainings().filter(function (x) { return x.key === st.id; })[0];
      ev = trn ? { id: trn.key, title: fmt(trn.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) } : null;
    } else if (st.mode === 'new') ev = null;
    else ev = S.events.filter(function (x) { return x.id === st.id; })[0];
    if (!ev && st.mode !== 'new') { evClose(); return; }
    var body;
    if (st.mode === 'menu') {
      body = '<h3>' + esc(ev.title) + '</h3>' +
        '<button type="button" class="ccact" data-eva="edit">' + ICON.pencil + '<span>' + L('evEdit') + '</span></button>' +
        '<button type="button" class="ccact" data-eva="people">' + ICON.two + '<span>' + L('evManagePeople') + '</span></button>' +
        '<button type="button" class="ccact" data-eva="cancel">' + ICON.trash + '<span>' + (ev.cancelled ? L('reactivate') : L('cancel')) + '</span></button>' +
        '<button type="button" class="ccact del" data-eva="del">' + ICON.trash + '<span>' + L('del') + '</span></button>' +
        '<button type="button" class="ccact close" data-eva="close">' + L('ccClose') + '</button>';
    } else if (st.mode === 'edit' || st.mode === 'new') {
      body = evFormHtml(ev);
    } else if (st.mode === 'people' || st.mode === 'trpeople') {
      body = '<p class="cck">' + L('evManagePeople') + '</p><h3>' + esc(ev.title) + '</h3>' +
        '<input class="input" name="q" placeholder="' + esc(L('ccSearch')) + '" autocomplete="off" value="' + esc(st.q || '') + '" style="margin-bottom:10px">' +
        '<div id="evpeoplebox">' + evPeopleList(ev) + '</div>' +
        '<div class="dlgbtns" style="margin-top:12px"><button type="button" class="btn inline" data-eva="close">' + L('ccClose') + '</button></div>';
    }
    var wrap = document.getElementById('evsheet');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'evsheet';
      wrap.className = 'ccsheet';
      wrap.addEventListener('click', evClick);
      wrap.addEventListener('input', function (e) {
        if (e.target.name === 'q' && evSheet) {
          evSheet.q = e.target.value;
          var box = document.getElementById('evpeoplebox');
          if (box) box.innerHTML = evPeopleList(ev);
        }
      });
      document.body.appendChild(wrap);
      document.addEventListener('keydown', evKey, true);
    }
    wrap.innerHTML = '<div class="ccsheetcard" role="dialog" aria-modal="true" aria-label="' + esc(ev ? ev.title : L('addEvent')) + '">' + body + '</div>';
    if (st.mode === 'edit' || st.mode === 'new') evFormSetup(wrap.querySelector('[data-form="edit-ev"]'));
    var first = wrap.querySelector('.input') || wrap.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
  }

  async function evClick(e) {
    var wrap = document.getElementById('evsheet');
    if (e.target === wrap) { evClose(); return; }
    var b = e.target.closest('[data-eva]');
    if (b) {
      var a = b.dataset.eva, st = evSheet;
      if (a === 'close') { evClose(); return; }
      if ((a === 'edit' || a === 'save-ev' || a === 'cancel' || a === 'del') && !canManageEvents()) return;
      if ((a === 'setresp' || a === 'addextra' || a === 'people') && !canEditEvPeople() && !canEditPeople()) return;
      if (a === 'edit') { st.mode = 'edit'; evDraw(); return; }
      if (a === 'people') { st.mode = 'people'; evDraw(); return; }
      if (a === 'setresp') { return st.mode === 'trpeople' ? setTrainingResponseFor(st.id, b.dataset.uid, b.dataset.val) : setResponseFor(st.id, b.dataset.uid, b.dataset.val); }
      // Speichern-Knopf im Edit-Sheet: Formular direkt hier abhandeln
      if (a === 'save-ev') {
        var form = wrap.querySelector('[data-form="edit-ev"]');
        if (!form) return;
        var g2 = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
        var title = g2('title'), date = g2('date'), time = g2('time'), endD = g2('end_date'), endT = g2('end_time');
        if (!title || !date || !time) { toast(L('evMissing')); return; }
        if (!endD && endT) endD = date;
        if (endD && (endD < date || (endD === date && endT && endT < time))) { toast(L('evEndBefore')); return; }
        if (endD === date && !endT) endD = '';
        var row = { title: title, event_date: date, start_time: time, place: g2('place'), rsvp_required: !!(form.querySelector('[name=rsvp]') && form.querySelector('[name=rsvp]').checked), end_date: endD || null, end_time: endT || null };
        var evId = form.dataset.id;
        evClose();
        await act(function () { return evId ? sb.from('events').update(row).eq('id', evId) : sb.from('events').insert(row); }, evId ? L('eventChanged') : L('eventAdded'));
        try { await loadAll(); } catch (e2) { console.error(e2); }
        render();
        return;
      }
      if (a === 'addextra') {
        var inp = document.querySelector('#evsheet .evpextra');
        var nm = (inp ? inp.value : '').trim();
        if (!nm) { toast(L('ccNeedName')); return; }
        var key = 'x:' + nm;
        return setResponseFor(st.id, key, 'solo');
      }
      if (a === 'cancel') {
        var ev1 = S.events.filter(function (x) { return x.id === st.id; })[0];
        evClose();
        return act(function () { return sb.from('events').update({ cancelled: !ev1.cancelled }).eq('id', ev1.id); }, ev1.cancelled ? L('evReactivated') : L('evCancelledMsg'));
      }
      if (a === 'del') {
        var id = st.id, title = (S.events.filter(function (x) { return x.id === id; })[0] || {}).title || '';
        evClose();
        if (!(await askConfirm(L('del'), L('confirmDelEvent'), true))) return;
        return act(function () { return sb.from('events').delete().eq('id', id); }, L('eventDeleted'));
      }
      return;
    }
  }

  async function addMember(name, phoneRaw, asGuest) {
    var phone = normPhone(phoneRaw);
    if (!phone) { toast(L('phoneInvalid')); return false; }
    if (S.members.some(function (m) { return m.phone === phone; })) { toast(L('alreadyReg')); return false; }
    try {
      // Login wird serverseitig angelegt (kein E-Mail-Versand => kein Â«email rate limit exceededÂ»)
      var r = await sb.rpc('admin_create_member', { p_name: name, p_phone: phone, p_guest: !!asGuest });
      if (r.error) throw r.error;
      toast(L('memberAdded', { name: name }));
      return true;
    } catch (e) {
      console.error(e);
      toast(L('addFailed', { reason: /already|PHONE_TAKEN/i.test(String(e.message)) ? L('alreadyReg') : String(e.message || L('unknownError')).slice(0, 100) }));
      return false;
    } finally {
      try { await loadAll(); render(); } catch (e2) { console.error(e2); }
    }
  }

  /* ---------- Anmeldung ---------- */
  function authError(e) {
    var m = String((e && e.message) || '');
    if (/invalid login/i.test(m)) return L('authInvalid');
    if (/already registered|already been registered/i.test(m)) return L('authAlready');
    if (/database error|Ungültiger Vereinscode/i.test(m)) return L('authCode');
    if (/rate limit|too many/i.test(m)) return L('authRate');
    if (/password/i.test(m)) return L('authPin');
    return L('authFail');
  }

  async function handleAuth(g) {
    var phone = normPhone(g('phone'));
    S.phone = g('phone');
    if (!phone) { S.err = L('phoneInvalid'); render(); return; }
    var custom = g('pin');
    if (custom && !/^\d{6}$/.test(custom)) { S.err = L('pinExact'); render(); return; }
    var pin = (S.mode === 'login' && custom) ? custom : defaultPin(phone);
    S.busy = true; S.err = ''; render();
    try {
      var res;
      if (S.mode === 'register') {
        res = await sb.auth.signUp({
          email: phoneToEmail(phone), password: pin,
          options: { data: { name: g('name'), phone: phone, club_code: g('code'), language: lang } }
        });
        if (!res.error && !res.data.session) {
          throw new Error('CONFIRM_EMAIL');
        }
      } else {
        res = await sb.auth.signInWithPassword({ email: phoneToEmail(phone), password: pin });
      }
      if (res.error) throw res.error;
      S.busy = false;
      await enter(res.data.session);
    } catch (e) {
      console.error(e);
      S.busy = false;
      S.err = e.message === 'CONFIRM_EMAIL' ? L('confirmEmailOff') : authError(e);
      S.step = 'login';
      render();
    }
  }

  async function enter(session) {
    S.session = session;
    S.step = 'loading'; render();
    try {
      await loadAll();
      if (!S.me) throw new Error('Kein Profil gefunden');
      if (S.me.language && LANGS.indexOf(S.me.language) > -1) setLang(S.me.language);
      else saveLang();   // Sprache dieses Geräts im Profil merken
      if (S.me.theme === 'light' || S.me.theme === 'dark') setTheme(S.me.theme);
      else if (theme) saveTheme();   // Darstellung dieses Geräts im Profil merken
      if (S.me.design && DESIGNS.indexOf(S.me.design) > -1) applyDesign(S.me.design);
      else if (design !== 'standard') { try { sb.from('profiles').update({ design: design }).eq('id', S.me.id).then(function () {}, function (e3) { console.error(e3); }); } catch (e4) { console.error(e4); } }
      S.step = 'app'; S.tab = 'trainings'; S.err = '';
      subscribe();
      render();
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
      S.step = 'login';
      S.err = L('loadFail');
      render();
    }
  }

  // Gewählte Sprache im Profil speichern (schlägt still fehl, falls die Datenbank noch nicht aktualisiert wurde)
  function saveLang() {
    if (!sb || !S.me) return;
    try { sb.from('profiles').update({ language: lang }).eq('id', S.me.id).then(function () {}, function () {}); } catch (e) { /* ignorieren */ }
  }
  document.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb && cb.dataset && cb.dataset.ccactive) {
      var cid = cb.dataset.ccactive, on = cb.checked;
      delete S.ccFold[cid];
      act(function () { return sb.from('cc_events').update({ active: on }).eq('id', cid); }, L('ccSaved'));
      return;
    }
    if (cb && cb.dataset && cb.dataset.act === 'cc-toggle-public') {
      var pub = cb.checked;
      act(function () { return sb.rpc('set_cc_public', { make_public: pub }); }, pub ? L('ccPublicOn') : L('ccPublicOff'));
      return;
    }
    if (cb && cb.dataset && cb.dataset.shactive) {
      var sid = cb.dataset.shactive, son = cb.checked;
      delete S.ccFold[sid];
      act(function () { return sb.from('show_acts').update({ active: son }).eq('id', sid); }, L('ccSaved'));
      return;
    }
    if (cb && cb.dataset && cb.dataset.jsactive) {
      var jid = cb.dataset.jsactive, jon = cb.checked;
      act(function () { return sb.from('jass_days').update({ active: jon }).eq('id', jid); }, L('ccSaved'));
      return;
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute('data-lang')) return;
    setLang(el.value);
    if (S.step === 'app' && S.me) { S.me.language = lang; saveLang(); render(); toast(L('langSaved')); }
    else render();
  });

  /* ---------- GV: Generalversammlung (Traktanden, Jahresberichte, Reaktionen, Kommentare) ---------- */
  // Inhalte stehen in den Tabellen gv, gv_items, gv_reports; Reaktionen und Kommentare in gv_reactions, gv_comments.
  // Autoren der Jahresberichte sind Aktivmitglieder (author_id → Profil, der Name kommt immer aus dem Profil).
  // Ändern darf nur die Rolle «Vorstand» (S.me.isBoard, serverseitig fbro_is_board()): Stift-Symbol, dann Inhalt antippen.
  var GV_REACT = ['up', 'heart', 'laugh', 'clap'];
  var GV_EMOJI = { up: '👍', heart: '❤️', laugh: '😂', clap: '👏' };
  var gvSheet = null;   // { kind: 'menu' | 'meta' | 'intro' | 'item' | 'report' | 'newreport', id, photos, added, ... }
  // Fotos: neue liegen im privaten Speicher «fbro-gv» (Pfad <gv-id>/<zufall>.jpg, Anzeige über signierte Adressen);
  // ältere Einträge ohne «/» sind Dateien im App-Ordner und lassen sich im GV-Menü in den Speicher übernehmen.
  var GV_BUCKET = 'fbro-gv';
  var GV_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[\w-]{8,64}\.(jpe?g|png|webp)$/i;
  function gvIsStored(f) { return String(f).indexOf('/') > 0; }
  function gvPhotoSrc(f) { if (!gvIsStored(f)) return f; var u = S.gvUrls[f]; return u && u.exp > Date.now() ? u.url : ''; }
  function gvUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }

  function gvAllowed() { return !!(S.me && !S.me.isCandidate && !((S.me.isGuest || S.me.isSupporter) && !S.me.isAdmin)); }
  function canGvEdit() { return !!(S.me && S.me.isBoard && !S.me.isGuest && !S.me.isCandidate); }
  function gvEditing() { return canGvEdit() && !!S.gvEdit; }
  function gvVisible() { return !!(gvAllowed() && S.gv && S.gv.cur); }
  // Sichtbarkeit der GV (setzt nur der Admin, Admin-Konsole): none = niemand (auch Admin nicht), admin = nur Admins,
  // board = Vorstand (und Admins), members = alle (Aktiv- und Passivmitglieder)
  var GV_VIS = ['none', 'admin', 'board', 'members'];
  var GV_VIS_KEY = { none: 'gvVisNone', admin: 'gvVisAdmin', board: 'gvVisBoard', members: 'gvVisMembers' };
  function gvVisLabel(v) { return GV_VIS_KEY[v] || 'gvVisBoard'; }
  function gvVisNote(v) { return v === 'none' ? 'gvVisNoneNote' : v === 'admin' ? 'gvVisAdminNote' : 'gvDraft'; }
  async function gvSetVisibility(id, v) {
    if (!S.me || !S.me.isAdmin || GV_VIS.indexOf(v) < 0) return;
    await act(function () { return sb.rpc('gv_set_visibility', { p_id: id, p_vis: v }); }, L('ccSaved'));
  }
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.dataset && t.dataset.gvvis) gvSetVisibility(t.dataset.gvvis, t.value);
  });
  function gvIsOpen(id) { var v = S.gvOpen[id]; return v == null ? (id === 'inv' || id === 'i4') : !!v; }

  async function loadGv() {
    S.gv = { cur: null, all: [], items: [], reports: [], reactions: [], comments: [] };
    // Admin-Konsole: alle GVs mit Stufe (auch die auf «niemand» gestellten, die der Admin sonst nicht sieht)
    S.gvAdmin = null;
    if (S.me && S.me.isAdmin) {
      try { var al = await sb.rpc('gv_admin_list'); if (!al.error) S.gvAdmin = al.data || []; } catch (e) { console.error(e); }
    }
    if (!gvAllowed()) return;
    try {
      var g = await sb.from('gv').select('*').order('year', { ascending: false });
      if (g.error) throw g.error;
      var all = g.data || [];
      if (!all.length) return;
      var keep = S.gvSel;
      // Vorgabe: neueste für alle Mitglieder sichtbare GV; gewählt wird über die Jahreszahlen
      var cur = all.filter(function (x) { return x.id === keep; })[0] || all.filter(function (x) { return x.visibility === 'members'; })[0] || all[0];
      S.gvSel = cur.id;
      var r = await Promise.all([
        sb.from('gv_items').select('*').eq('gv_id', cur.id),
        sb.from('gv_reports').select('*').eq('gv_id', cur.id),
        sb.from('gv_reactions').select('*'),
        sb.from('gv_comments').select('*').order('created_at', { ascending: true })
      ]);
      var bad = r.filter(function (x) { return x.error; })[0];
      if (bad) throw bad.error;
      S.gv = {
        cur: cur, all: all,
        items: (r[0].data || []).sort(function (a, b) { return a.nr - b.nr; }),
        reports: (r[1].data || []).sort(function (a, b) { return a.sort - b.sort; }),
        reactions: r[2].data || [],
        comments: r[3].data || []
      };
      await gvSignUrls();
    } catch (e) { console.error(e); }   // fehlendes Schema blockiert die App nicht: dann gibt es einfach keinen GV-Tab
  }

  // Signierte Adressen für die Fotos im Speicher (1 Stunde gültig, wiederverwendet bis kurz vor Ablauf)
  async function gvSignUrls() {
    var need = [];
    S.gv.reports.forEach(function (r) {
      (r.photos || []).forEach(function (f) {
        var u = S.gvUrls[f];
        if (gvIsStored(f) && GV_PATH.test(f) && (!u || u.exp < Date.now() + 600000) && need.indexOf(f) < 0) need.push(f);
      });
    });
    if (!need.length) return;
    try {
      var r = await sb.storage.from(GV_BUCKET).createSignedUrls(need, 3600);
      if (r.error) throw r.error;
      (r.data || []).forEach(function (x) { if (x.signedUrl) S.gvUrls[x.path] = { url: x.signedUrl, exp: Date.now() + 3500 * 1000 }; });
    } catch (e) { console.error(e); }
  }

  // Einfache Auszeichnung: «## Titel», «> Zeile unter dem Titel», «! Hinweis», «Name | Wert», sonst Absatz
  function gvMarkup(t) {
    var out = '';
    String(t || '').split(/\n\s*\n/).forEach(function (blk) {
      var rows = [], par = [];
      var flush = function () {
        if (rows.length) out += '<div class="gvrows">' + rows.join('') + '</div>';
        if (par.length) out += '<p>' + par.join('<br>') + '</p>';
        rows = []; par = [];
      };
      blk.split('\n').forEach(function (raw) {
        var x = raw.trim();
        if (!x) return;
        if (x.indexOf('## ') === 0) { flush(); out += '<h4 class="gvh">' + esc(x.slice(3)) + '</h4>'; }
        else if (x.indexOf('> ') === 0) { flush(); out += '<p class="gvby">' + esc(x.slice(2)) + '</p>'; }
        else if (x.indexOf('! ') === 0) { flush(); out += '<div class="gvnote">' + esc(x.slice(2)) + '</div>'; }
        else if (x.indexOf(' | ') > 0) {
          if (par.length) flush();
          var p = x.split(' | ');
          rows.push('<div class="gvrow"><b>' + esc(p[0]) + '</b><span>' + esc(p.slice(1).join(' | ')) + '</span></div>');
        } else { if (rows.length) flush(); par.push(esc(x)); }
      });
      flush();
    });
    return out;
  }
  // Im Bearbeiten-Modus wird ein Inhalt antippbar (gestrichelter Rahmen); leere Inhalte zeigen einen Platzhalter
  function gvX(kind, id, inner, ph) {
    if (!gvEditing()) return inner;
    return '<div class="gvx" role="button" tabindex="0" data-act="gv-edit" data-k="' + kind + '" data-id="' + esc(id || '') + '">' + (inner || '<p class="gvph">' + esc(ph || L('gvBody')) + '</p>') + '</div>';
  }

  function gvNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); }
  function gvFinance(it) {
    var d = it.data || {}, h = '';
    if (d.kpis && d.kpis.length) {
      h += '<div class="gvkpis">' + d.kpis.map(function (k) { return '<div class="gvkpi' + (k[2] ? ' neg' : '') + '"><small>' + esc(k[0]) + '</small><b>' + esc(k[1]) + '</b></div>'; }).join('') + '</div>';
    }
    if (d.rows && d.rows.length) {
      h += '<div class="gvtable"><table><thead><tr>' + (d.cols || []).map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        d.rows.map(function (r) {
          if (r.length === 1) return '<tr class="sub"><td colspan="' + ((d.cols || []).length || 4) + '">' + esc(r[0]) + '</td></tr>';
          return '<tr' + (r[4] ? ' class="sub"' : '') + '><td>' + esc(r[0]) + '</td>' + r.slice(1, 4).map(function (v) { return '<td>' + gvNum(v) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h + gvMarkup(it.body);
  }
  // Zahlen der Jahresrechnung als Text bearbeiten: Kennzahlen, Spalten, Zeilen («## Abschnitt», «Name | Zahl | Zahl | Zahl», am Ende « | *» = Zwischensumme)
  function gvFinToText(d) {
    d = d || {};
    return {
      kpis: (d.kpis || []).map(function (k) { return k[0] + ' | ' + k[1] + (k[2] ? ' | -' : ''); }).join('\n'),
      cols: (d.cols || []).join(' | '),
      rows: (d.rows || []).map(function (r) { return r.length === 1 ? '## ' + r[0] : r.slice(0, 4).join(' | ') + (r[4] ? ' | *' : ''); }).join('\n')
    };
  }
  function gvFinFromText(kt, ct, rt) {
    var tr = function (s) { return String(s).trim(); };
    var num = function (v) { var s = String(v).replace(/[’'\s]/g, '').replace('–', '-'); return s !== '' && !isNaN(Number(s)) ? Number(s) : tr(v); };
    return {
      kpis: kt.split('\n').map(tr).filter(Boolean).map(function (l) { var p = l.split('|').map(tr); return [p[0], p[1] || '', p[2] === '-' ? 1 : 0]; }),
      cols: ct.split('|').map(tr).filter(Boolean),
      rows: rt.split('\n').map(tr).filter(Boolean).map(function (l) {
        if (l.indexOf('## ') === 0) return [tr(l.slice(3))];
        var p = l.split('|').map(tr), sub = p[p.length - 1] === '*';
        if (sub) p.pop();
        var r = [p[0]].concat(p.slice(1, 4).map(num));
        while (r.length < 4) r.push(0);
        if (sub) r.push(1);
        return r;
      })
    };
  }

  // Jahresprogramm: die Events des Dialogs «Events» im Zeitraum der GV, wie dort dargestellt
  function gvProgram(cur) {
    var to = cur.program_until || '9999-12-31';
    var list = S.events.filter(function (e) { return e.date >= cur.meeting_date && e.date <= to; })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    var h = '<p class="ccnote gvhint">' + esc(L('gvProgramHint')) + '</p>';
    if (!list.length) return h + '<p class="ccsum">' + esc(L('gvNoProgram')) + '</p>';
    var last = '';
    list.forEach(function (e) {
      var m = monthYear(e.date);
      if (m !== last) { h += '<div class="week gvweek">' + m + '</div>'; last = m; }
      var title = fullDate(parseIso(e.date)) + ' – ' + esc(e.title);
      if (e.cancelled) { h += '<article class="ccel ccoff"><div class="cceh"><b>' + title + ' (' + esc(L('cancelledLow')) + ')</b></div></article>'; return; }
      h += '<article class="ccel"><div class="cceh"><button type="button" class="gvev" data-act="gv-event" data-id="' + esc(e.id) + '">' + title + '</button></div>' +
        '<div class="ccbody"><div class="evline"><p class="muted small evinfo">' + esc(e.place ? L('timePlace', { time: evTimeText(e), place: e.place }) : L('atTime', { time: evTimeText(e) })) + '</p>' +
        '<button type="button" class="hico calbtn" data-act="cal" data-id="' + esc(e.id) + '" aria-label="' + esc(L('calAdd')) + '" title="' + esc(L('calAdd')) + '">' + ICON.calplus + '</button></div></div></article>';
    });
    return h;
  }
  // Jahresprogramm als reiner Text: die 52 Wochen ab dem GV-Datum («Fr 08.05.2026, 19:00 – Anlass (Ort)»), zum Kopieren
  function gvProgramEvents(cur) {
    var to = ccAddDays(cur.meeting_date, 52 * 7 - 1);
    return {
      to: to,
      list: S.events.filter(function (e) { return e.date >= cur.meeting_date && e.date <= to; })
        .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; })
    };
  }
  function gvProgramText(cur) {
    var pe = gvProgramEvents(cur), to = pe.to, list = pe.list;
    var lines = list.map(function (e) {
      var multi = e.endDate && e.endDate !== e.date;
      var when = multi ? ccDate(e.date) + '–' + ccDate(e.endDate) : ccDate(e.date) + (e.time ? ', ' + evTimeText(e) : '');
      return when + ' – ' + e.title + (e.place ? ' (' + e.place + ')' : '') + (e.cancelled ? ' [' + L('cancelledLow') + ']' : '');
    });
    return { from: cur.meeting_date, to: to, text: lines.join('\n'), n: lines.length };
  }
  function gvProgramTextBlock(cur) {
    var t = gvProgramText(cur);
    return '<h4 class="gvh">' + esc(L('gvTextTitle', { from: ccDate(t.from), to: ccDate(t.to) })) + '</h4>' +
      (t.n ? '<pre class="gvplain">' + esc(t.text) + '</pre><button type="button" class="resp gvgo" data-act="gv-copytext">' + esc(L('gvTextCopy')) + '</button>'
        : '<p class="ccsum">' + esc(L('gvTextNone')) + '</p>');
  }
  async function gvCopyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        ta.remove();
        if (!ok) throw new Error('copy');
      }
      toast(L('gvTextCopied'));
    } catch (e) { console.error(e); toast(L('errFailed') + '.'); }
  }
  /* ---------- GV als PDF (A4, zweispaltig wie die gedruckte GV-Unterlage; Inhalt und Beschriftung deutsch) ---------- */
  function gvPdfClean(s) {
    return String(s == null ? '' : s).replace(/[^\u0009\u000A -~ -ÿ–—‘’‚“”„•…€]/g, '');
  }
  function gvBlocks(t) {
    var out = [];
    String(t || '').split(/\n\s*\n/).forEach(function (blk) {
      var rows = [], par = [];
      var flush = function () {
        if (rows.length) out.push({ t: 'rows', rows: rows });
        if (par.length) out.push({ t: 'p', lines: par });
        rows = []; par = [];
      };
      blk.split('\n').forEach(function (raw) {
        var x = raw.trim();
        if (!x) return;
        if (x.indexOf('## ') === 0) { flush(); out.push({ t: 'h', x: x.slice(3) }); }
        else if (x.indexOf('> ') === 0) { flush(); out.push({ t: 'by', x: x.slice(2) }); }
        else if (x.indexOf('! ') === 0) { flush(); out.push({ t: 'note', x: x.slice(2) }); }
        else if (x.indexOf(' | ') > 0) { if (par.length) flush(); var p = x.split(' | '); rows.push([p[0], p.slice(1).join(' | ')]); }
        else { if (rows.length) flush(); par.push(x); }
      });
      flush();
    });
    return out;
  }
  async function gvPdfImage(src) {
    try {
      var r = await fetch(src);
      if (!r.ok) return null;
      var blob = await r.blob();
      var url = await new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(blob); });
      if (!/^data:image\/(jpeg|png)/.test(url)) return null;
      var dim = await new Promise(function (res) { var im = new Image(); im.onload = function () { res({ w: im.naturalWidth, h: im.naturalHeight }); }; im.onerror = function () { res(null); }; im.src = url; });
      if (!dim || !dim.w || !dim.h) return null;
      return { url: url, w: dim.w, h: dim.h, fmt: /^data:image\/png/.test(url) ? 'PNG' : 'JPEG' };
    } catch (e) { return null; }
  }

  async function gvExportPdf() {
    var G = S.gv, cur = G && G.cur;
    if (!cur) return;
    if (!window.jspdf) { toast(L('ccPdfFailed')); return; }
    toast(L('ccPdfBuilding'));
    try {
      await gvSignUrls();
      var logo = await ensureLogoDataUrl();
      var photos = {}, jobs = [];
      G.reports.forEach(function (r) {
        (r.photos || []).filter(gvPhotoOk).forEach(function (f) {
          var s = gvPhotoSrc(f);
          if (s && !(f in photos)) { photos[f] = null; jobs.push(gvPdfImage(s).then(function (im) { photos[f] = im; })); }
        });
      });
      await Promise.all(jobs);

      var real = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      var doc = real;
      // Zum Ausmessen der Spaltenhöhe (ohne zu zeichnen) wird «doc» kurz durch diese Attrappe ersetzt
      var NOOP = {};
      ['text', 'rect', 'roundedRect', 'line', 'addImage', 'setFillColor', 'setDrawColor', 'setLineWidth', 'setTextColor', 'addPage'].forEach(function (k) { NOOP[k] = function () {}; });
      ['setFont', 'setFontSize', 'splitTextToSize'].forEach(function (k) { NOOP[k] = real[k].bind(real); });
      var W = real.internal.pageSize.getWidth(), H = real.internal.pageSize.getHeight();
      var M = 14, GAP = 8, CW = (W - 2 * M - GAP) / 2, TOP = 16, BOT = H - 17, FULL = W - 2 * M, BAND = 11, BANDGAP = 6;
      var BLUE = [48, 124, 192], BLUE_DARK = [11, 47, 94], BLUE_SOFT = [227, 239, 249], GREY = [93, 103, 122], INK = [22, 35, 59], LINE = [218, 222, 214];
      var DIM = [112, 119, 132], DIM_SOFT = [235, 237, 240];
      // Spaltenzustand: aktuelle Spalte, Y je Spalte, Oberkante, Untergrenze je Spalte (für ausgewogene Spalten), Untergrenze ab der nächsten Seite
      var col = 0, cy = [TOP, TOP], secTop = TOP, dim = false, lim = [BOT, BOT], pagesLeft = 0, lastLim = [BOT, BOT], pending = null;
      var P = gvPdfClean;
      var ink = function () { return dim ? DIM : INK; };
      var setT = function (c) { doc.setTextColor(c[0], c[1], c[2]); };
      var font = function (st, sz) { doc.setFont('helvetica', st); doc.setFontSize(sz); };
      var wrapF = function (t, w, st, sz) { font(st, sz); return doc.splitTextToSize(P(t), w); };
      var used = function () { return Math.max(cy[0], cy[1]); };
      var colX = function () { return M + col * (CW + GAP); };
      var newPage = function () {
        doc.addPage(); col = 0; cy = [TOP, TOP]; secTop = TOP;
        // Mehrseitiger Block: alle Seiten voll, nur die letzte Seite wird ausgewogen
        if (pagesLeft > 0) { pagesLeft--; lim = pagesLeft === 0 ? lastLim.slice() : [BOT, BOT]; } else lim = [BOT, BOT];
      };
      // Platz in der aktuellen Spalte schaffen: erst zweite Spalte, dann neue Seite
      var room = function (h) {
        if (cy[col] + h <= lim[col]) return;
        if (col === 0) { col = 1; if (cy[1] + h <= lim[1]) return; }
        newPage();
      };
      var long = function (iso, o) { return parseIso(iso).toLocaleDateString('de-CH', o); };
      var dateLong = function (iso) { return long(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
      var dateShort = function (iso) { return long(iso, { weekday: 'short' }).replace(/\.$/, '') + ' ' + long(iso, { day: '2-digit', month: '2-digit', year: 'numeric' }); };
      var text = function (lines, size, style, color, lh) {
        font(style, size); setT(color);
        lines.forEach(function (ln) { room(lh); doc.text(ln, colX(), cy[col] + lh * 0.75); cy[col] += lh; });
      };
      var gap = function (h) { cy[col] += h; };

      var drawBlocks = function (blocks) {
        blocks.forEach(function (b) {
          if (b.t === 'h') {
            if (cy[col] > secTop + 1) gap(2.4);
            room(15);
            text(wrapF(b.x, CW, 'bold', 10), 10, 'bold', dim ? DIM : BLUE, 4.7); gap(1);
          } else if (b.t === 'by') {
            text(wrapF(b.x, CW, 'italic', 8.6), 8.6, 'italic', GREY, 4); gap(1.4);
          } else if (b.t === 'note') {
            var nl = wrapF(b.x, CW - 6, 'bold', 8.8), nh = nl.length * 4.1 + 4;
            room(nh + 1);
            doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(colX(), cy[col], CW, nh, 'F');
            doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(colX(), cy[col], 1, nh, 'F');
            font('bold', 8.8); setT(BLUE_DARK);
            nl.forEach(function (ln, i) { doc.text(ln, colX() + 4, cy[col] + 5.2 + i * 4.1); });
            cy[col] += nh + 2;
          } else if (b.t === 'rows') {
            b.rows.forEach(function (r) {
              var vl = wrapF(r[1], CW - 36, 'normal', 9), h = Math.max(vl.length, 1) * 4.1 + 1.2;
              room(h);
              font('bold', 8.8); setT(dim ? DIM : GREY); doc.text(P(r[0]), colX(), cy[col] + 3.6, { maxWidth: 33 });
              font('normal', 9); setT(ink());
              vl.forEach(function (ln, i) { doc.text(ln, colX() + 35, cy[col] + 3.6 + i * 4.1); });
              cy[col] += h;
            });
            gap(1.6);
          } else if (b.t === 'p') {
            b.lines.forEach(function (ln, i) {
              var pl = wrapF(ln, CW, 'normal', 9);
              if (i === 0) room(Math.min(pl.length, 2) * 4.1);
              text(pl, 9, 'normal', ink(), 4.1);
            });
            gap(2);
          }
        });
      };

      // Fotos eines Berichts: Zeilen mit je einem oder zwei Fotos, gleich hoch und bündig über die Spaltenbreite
      var drawPhotos = function (ims) {
        var rows = [], i0 = 0;
        if (ims.length % 2 === 1) { rows.push([ims[0]]); i0 = 1; }
        for (var q = i0; q < ims.length; q += 2) rows.push(ims.slice(q, q + 2));
        rows.forEach(function (row) {
          var ar = row.map(function (im) { return im.w / im.h; });
          var sum = ar.reduce(function (a, b) { return a + b; }, 0);
          var rh = Math.min(row.length === 1 ? 62 : 58, (CW - (row.length - 1) * 2) / sum);
          var tw = rh * sum + (row.length - 1) * 2;
          room(rh + 2);
          var x = colX() + (CW - tw) / 2;
          row.forEach(function (im, k) {
            var dw = rh * ar[k];
            try { doc.addImage(im.url, im.fmt, x, cy[col], dw, rh); } catch (e) { console.error(e); }
            x += dw + 2;
          });
          cy[col] += rh + 2;
        });
      };
      var drawReports = function () {
        G.reports.forEach(function (r, ri) {
          room(38);
          if (cy[col] > secTop + 1) {
            gap(2);
            doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.25); doc.line(colX(), cy[col], colX() + CW, cy[col]);
            gap(3.5);
          }
          text(wrapF(r.title, CW, 'bold', 12), 12, 'bold', BLUE, 5.4);
          var mm = r.author_id ? ccMember(r.author_id) : null, an = (mm && mm.name) || r.author_name || '';
          var meta = [an, r.subtitle].filter(Boolean).join(' · ');
          if (meta) text(wrapF(meta, CW, 'italic', 8.6), 8.6, 'italic', GREY, 4);
          gap(1.8);
          drawPhotos((r.photos || []).filter(gvPhotoOk).map(function (f) { return photos[f]; }).filter(Boolean));
          drawBlocks(gvBlocks(r.body));
          gap(1.5);
        });
      };

      // Kapitelband über die ganze Breite (wird erst mit dem ersten Inhalt gezeichnet, damit es nie allein am Seitenende steht)
      var drawBand = function (p, y0) {
        doc.setFillColor(p.dim ? DIM_SOFT[0] : BLUE_SOFT[0], p.dim ? DIM_SOFT[1] : BLUE_SOFT[1], p.dim ? DIM_SOFT[2] : BLUE_SOFT[2]); doc.rect(M, y0, FULL, BAND, 'F');
        var bc = p.dim ? DIM : p.draft ? [176, 48, 48] : BLUE; doc.setDrawColor(bc[0], bc[1], bc[2]); doc.setLineWidth(0.5); doc.line(M, y0 + BAND, M + FULL, y0 + BAND);
        font('bold', 15); setT(bc); doc.text(P(p.title), M + 3, y0 + 7.6);
        if (p.tag) { font('bold', 8.5); doc.text(P(p.tag), M + FULL - 3, y0 + 7.2, { align: 'right' }); }
      };
      var placeBand = function (minContent) {
        if (!pending) return;
        var y0 = used();
        if (y0 + BAND + BANDGAP + minContent > BOT) { newPage(); y0 = TOP; }
        drawBand(pending, y0);
        dim = !!pending.dim; pending = null;
        col = 0; cy = [y0 + BAND + BANDGAP, y0 + BAND + BANDGAP]; secTop = cy[0];
      };
      var section = function (title, o) {
        if (pending) placeBand(0);
        pending = { title: title, dim: !!(o && o.dim), draft: !!(o && o.draft), tag: (o && o.tag) || '' };
      };
      // Höhe eines Inhalts als einzelne lange Spalte, ohne zu zeichnen
      var measure = function (fn, d) {
        var sv = { col: col, cy: cy.slice(), secTop: secTop, lim: lim.slice(), pagesLeft: pagesLeft, dim: dim };
        doc = NOOP; col = 0; cy = [0, 0]; secTop = 0; lim = [1e9, 1e9]; pagesLeft = 0; dim = d;
        var T = 0;
        try { fn(); T = cy[0]; } finally { doc = real; col = sv.col; cy = sv.cy; secTop = sv.secTop; lim = sv.lim; pagesLeft = sv.pagesLeft; dim = sv.dim; }
        return T;
      };
      // Zweispaltiger Block mit ausgewogenen Spalten (auch über mehrere Seiten gleichmässig verteilt)
      var cols = function (fn) {
        var bh = pending ? BAND + BANDGAP : 0, d = pending ? pending.dim : dim;
        var T = measure(fn, d);
        if (T < 1) return;
        var y0 = used();
        var availHere = BOT - (y0 + bh), fullAvail = BOT - TOP - bh, half = T / 2 + 9;
        var startNew = false;
        if (half > availHere) startNew = availHere < fullAvail * 0.55 || half <= fullAvail;
        if (startNew) { newPage(); y0 = TOP; }
        if (pending) { drawBand(pending, y0); dim = !!pending.dim; pending = null; y0 += BAND + BANDGAP; }
        col = 0; cy = [y0, y0]; secTop = y0; pagesLeft = 0;
        var availNow = BOT - y0;
        if (half <= availNow) { lim = [y0 + half, BOT]; }
        else {
          // Mehrere Seiten: erste und mittlere Seiten voll, die letzte Seite ausgewogen
          var capF = 2 * availNow * 0.94, capP = 2 * (BOT - TOP) * 0.94;
          var rem = T - capF, nx = Math.max(1, Math.ceil(rem / capP)), remLast = Math.max(0, rem - (nx - 1) * capP);
          var ch = Math.min(BOT - TOP, remLast / (2 * 0.94) + 9);
          lastLim = [TOP + ch, Math.min(BOT, TOP + ch + 8)]; pagesLeft = nx; lim = [BOT, BOT];
        }
        fn();
        var endY = used();
        col = 0; cy = [endY + 3, endY + 3]; secTop = cy[0]; lim = [BOT, BOT]; pagesLeft = 0;
      };
      // Tabelle über die ganze Breite: rows = { c: [Zellen], k: 'n' | 'sec' | 'sub' }
      var table = function (widths, head, rows, aligns) {
        placeBand(26);
        var y0 = used(), x0 = M;
        if (y0 + 20 > BOT) { newPage(); y0 = TOP; }
        var y = y0;
        var drawHead = function () {
          doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(x0, y, FULL, 5.6, 'F');
          font('bold', 8.6); setT(BLUE_DARK);
          var x = x0;
          head.forEach(function (h, i) { var tx = aligns[i] === 'r' ? x + widths[i] - 1.5 : x + 1.5; doc.text(P(h), tx, y + 3.9, { align: aligns[i] === 'r' ? 'right' : 'left' }); x += widths[i]; });
          y += 5.6;
        };
        drawHead();
        rows.forEach(function (r) {
          var lines = [], h;
          if (r.k === 'sec') { h = 5.4; }
          else {
            lines = r.c.map(function (c, i) { return wrapF(c, widths[i] - 3, r.k === 'sub' ? 'bold' : 'normal', 8.8); });
            h = Math.max.apply(null, lines.map(function (l) { return Math.max(l.length, 1); })) * 4 + 1.6;
          }
          if (y + h > BOT) { newPage(); y = TOP; drawHead(); }
          if (r.k === 'sec') {
            doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(x0, y, FULL, h, 'F');
            font('bold', 8.8); setT(BLUE); doc.text(P(r.c[0]), x0 + 1.5, y + 3.9);
          } else {
            if (r.k === 'sub') { doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(x0, y, FULL, h, 'F'); }
            font(r.k === 'sub' ? 'bold' : 'normal', 8.8); setT(r.k === 'sub' ? BLUE_DARK : INK);
            var x = x0;
            lines.forEach(function (ls, i) {
              ls.forEach(function (ln, j) { doc.text(ln, aligns[i] === 'r' ? x + widths[i] - 1.5 : x + 1.5, y + 3.7 + j * 4, { align: aligns[i] === 'r' ? 'right' : 'left' }); });
              x += widths[i];
            });
            doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.15); doc.line(x0, y + h, x0 + FULL, y + h);
          }
          y += h;
        });
        y += 3; col = 0; cy = [y, y]; secTop = y;
      };

      /* ----- Titelseite ----- */
      var ty = TOP;
      doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(M, ty, FULL, 26, 'F');
      doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]); doc.setLineWidth(0.6); doc.line(M, ty + 26, M + FULL, ty + 26);
      if (logo) { try { doc.addImage(logo, 'PNG', M + 4, ty + 3, 16, 20); doc.addImage(logo, 'PNG', M + FULL - 20, ty + 3, 16, 20); } catch (e) { /* Logo optional */ } }
      font('bold', 24); setT(BLUE_DARK);
      var titleLines = doc.splitTextToSize(P(cur.title), FULL - 50);
      titleLines.forEach(function (ln, i) { doc.text(ln, W / 2, ty + 12.5 + i * 9 - (titleLines.length - 1) * 3, { align: 'center' }); });
      font('normal', 10); setT(GREY);
      doc.text(P(dateLong(cur.meeting_date)), W / 2, ty + 22.3, { align: 'center' });
      col = 0; cy = [ty + 26 + 8, ty + 26 + 8]; secTop = cy[0];
      // Rechte Spalte: Traktandenliste im Kasten
      var tlWrapped = G.items.map(function (it) { return wrapF(it.nr + '. ' + it.title + (it.state === 'draft' ? ' (in Arbeit)' : ''), CW - 8, 'normal', 9); });
      var boxH = 13 + tlWrapped.reduce(function (n, l) { return n + l.length * 4.5; }, 0) + 2;
      var bx = M + CW + GAP, by0 = secTop;
      doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]); doc.setLineWidth(0.3); doc.rect(bx, by0, CW, boxH, 'FD');
      font('bold', 11); setT(BLUE_DARK); doc.text('Traktandenliste', bx + 4, by0 + 7);
      font('normal', 9); setT(INK);
      var tly = by0 + 13.5;
      tlWrapped.forEach(function (ls) { ls.forEach(function (ln, i) { doc.text(ln, bx + 4 + (i ? 4 : 0), tly); tly += 4.5; }); });
      cy[1] = by0 + boxH + 4;
      // Linke Spalte: Einladung, dann Zeit und Ort
      var introDraft = cur.intro_state === 'draft', introProto = cur.intro_state === 'protocol';
      text(wrapF((cur.intro_title || 'Einladung') + (introDraft ? ' (in Arbeit)' : ''), CW, 'bold', 12), 12, 'bold', introDraft ? [176, 48, 48] : introProto ? DIM : BLUE, 5.6); gap(1.5);
      dim = introProto;
      drawBlocks(gvBlocks(cur.intro));
      dim = false;
      gap(1);
      text(wrapF('am ' + dateLong(cur.meeting_date) + (cur.meeting_time ? ' um ' + hhmm(cur.meeting_time).replace(':', '.') + ' Uhr' : ''), CW, 'bold', 9.5), 9.5, 'bold', INK, 4.4);
      if (cur.place) text(wrapF(cur.place, CW, 'bold', 9.5), 9.5, 'bold', INK, 4.4);
      col = 0; cy = [used() + 3, used() + 3]; secTop = cy[0];

      /* ----- Traktanden ----- */
      for (var ii = 0; ii < G.items.length; ii++) {
        var it = G.items[ii], proto = it.state === 'protocol', draftSt = it.state === 'draft';
        dim = false;
        section('Traktandum ' + it.nr + ': ' + it.title + (draftSt ? ' (in Arbeit)' : ''), { dim: proto, draft: draftSt, tag: proto ? 'Protokoll' : '' });
        if (it.kind === 'reports') {
          cols(function () { drawBlocks(gvBlocks(it.body)); drawReports(); });
        } else if (it.kind === 'finance') {
          var fd = it.data || {};
          if (fd.kpis && fd.kpis.length) {
            placeBand(75);   // Band, Kennzahlen und Tabellenanfang bleiben zusammen
            var kn = fd.kpis.length, kw = (FULL - (kn - 1) * 3) / kn, ky = used();
            if (ky + 17 > BOT) { newPage(); ky = TOP; }
            fd.kpis.forEach(function (k, i) {
              var kx = M + i * (kw + 3);
              doc.setFillColor(BLUE_SOFT[0], BLUE_SOFT[1], BLUE_SOFT[2]); doc.rect(kx, ky, kw, 14, 'F');
              font('normal', 7.8); setT(GREY); doc.text(P(k[0]), kx + 3, ky + 4.6, { maxWidth: kw - 5 });
              font('bold', 12); setT(k[2] ? [176, 48, 48] : BLUE_DARK); doc.text(P(k[1]), kx + 3, ky + 11);
            });
            col = 0; cy = [ky + 17, ky + 17]; secTop = cy[0];
          }
          if (fd.rows && fd.rows.length) {
            var fc = fd.cols || [], nc = fc.length || 4, lw = FULL - (nc - 1) * 26, fw = [lw];
            for (var q = 1; q < nc; q++) fw.push(26);
            table(fw, fc, fd.rows.map(function (r) {
              if (r.length === 1) return { k: 'sec', c: [r[0]] };
              return { k: r[4] ? 'sub' : 'n', c: [r[0]].concat(r.slice(1, 4).map(function (v) { return typeof v === 'number' ? gvNum(v) : String(v); })) };
            }), fw.map(function (w, i) { return i ? 'r' : 'l'; }));
          }
          cols(function () { drawBlocks(gvBlocks(it.body)); });
        } else if (it.kind === 'program') {
          cols(function () { drawBlocks(gvBlocks(it.body)); });
          var pe = gvProgramEvents(cur);
          if (pe.list.length) {
            table([42, FULL - 42 - 52, 52], ['Datum', 'Anlass', 'Zeit / Ort'], pe.list.map(function (e) {
              var multi = e.endDate && e.endDate !== e.date;
              var dt = multi ? dateShort(e.date) + ' – ' + dateShort(e.endDate) : dateShort(e.date);
              var sameEnd = e.endTime && (!e.endDate || e.endDate === e.date);
              var zo = [multi ? '' : (e.time ? e.time + (sameEnd ? '–' + e.endTime : '') : ''), e.place].filter(Boolean).join(', ');
              return { k: 'n', c: [dt, e.title + (e.cancelled ? ' (abgesagt)' : ''), zo] };
            }), ['l', 'l', 'l']);
          }
        } else if (it.kind === 'jass') {
          cols(function () { drawBlocks(gvBlocks(it.body)); });
          if (!S.jsErr) {
            var all = S.js.days.slice().sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : ccByCreated(a, b); });
            var past = all.filter(function (d) { return d.closed; }).reverse();
            var res = jsEternalRows(past, ccMap());
            if (res.rows.length) {
              table([14, FULL - 14 - 40 - 24, 40, 24], ['Rang', 'Ewige Rangliste Jassmasters', 'Runden', 'Punkte'], res.rows.map(function (r) {
                return { k: 'n', c: [r.rank + '.', r.name, String(r.rounds), String(r.points)] };
              }), ['l', 'l', 'r', 'r']);
            }
          }
        } else {
          cols(function () { drawBlocks(gvBlocks(it.body)); });
        }
        if (pending) placeBand(0);
        dim = false;
      }

      /* ----- Fusszeilen: wie in der gedruckten Unterlage abwechselnd links/rechts ----- */
      var pages = doc.getNumberOfPages(), dShort = P(long(cur.meeting_date, { day: 'numeric', month: 'long', year: 'numeric' }));
      for (var pn = 1; pn <= pages; pn++) {
        doc.setPage(pn);
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]); doc.setLineWidth(0.2); doc.line(M, H - 13, W - M, H - 13);
        font('normal', 8); setT(GREY);
        var odd = pn % 2 === 1;
        doc.text(odd ? dShort : 'Seite ' + pn, M, H - 8.5);
        doc.text(P(cur.title), W / 2, H - 8.5, { align: 'center' });
        doc.text(odd ? 'Seite ' + pn : dShort, W - M, H - 8.5, { align: 'right' });
      }

      var fname = 'FBRO-GV-' + cur.year + '.pdf';
      var blob = doc.output('blob');
      try {
        var file = new File([blob], fname, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: cur.title });
          return;
        }
      } catch (e) { /* Teilen abgebrochen oder nicht verfügbar: als Download anbieten */ }
      var url = URL.createObjectURL(blob);
      var a2 = document.createElement('a'); a2.href = url; a2.download = fname;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (err) { console.error(err); toast(L('ccPdfFailed')); }
  }

  // Link auf den Dialog «Events»: zum Termin springen, falls er dort noch angezeigt wird
  function gvGoEvent(id) {
    S.tab = 'events'; S.edit = null; render();
    var b = document.querySelector('[data-act="cal"][data-id="' + String(id).replace(/[^\w-]/g, '') + '"]');
    var card = b && b.closest('.ccel');
    if (card) card.scrollIntoView({ block: 'center' }); else window.scrollTo(0, 0);
  }

  // Ewige Rangliste aus dem Dialog «Jass» (letzte 10 abgeschlossene Runden)
  function gvJass() {
    if (S.jsErr) return '';
    var all = S.js.days.slice().sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : ccByCreated(a, b); });
    var past = all.filter(function (d) { return d.closed; }).reverse();
    var res = jsEternalRows(past, ccMap());
    var h = '<h4 class="gvh">' + esc(L('jsEternal')) + '</h4>';
    if (!res.rows.length) return h + '<p class="ccsum">' + esc(L('jsNoPoints')) + '</p>';
    h += '<p class="ccnote gvhint">' + esc(L('jsEternalHint', { n: res.n })) + '</p><ol class="jsrank">' + res.rows.map(function (r) {
      return '<li><span class="jsrk">' + r.rank + '.</span><span class="jsrn">' + esc(r.name) + '</span><span class="jsstp">' + esc(L(r.rounds === 1 ? 'jsEternalRound' : 'jsEternalRounds', { n: r.rounds })) + '</span><span class="jsrp">' + r.points + '</span></li>';
    }).join('') + '</ol>';
    return h + '<button type="button" class="resp gvgo" data-act="tab" data-tab="jass">' + esc(L('gvToJass')) + '</button>';
  }

  function gvPhotoOk(f) { return gvIsStored(f) ? GV_PATH.test(f) : (/^[\w][\w.\-]*\.(jpe?g|png|webp)$/i.test(f) && f.indexOf('..') < 0); }
  function gvGallery(r) {
    var ph = (r.photos || []).filter(gvPhotoOk).filter(function (f) { return !!gvPhotoSrc(f); });
    if (!ph.length) return '';
    return '<div class="gvgal"><div class="gvstrip" tabindex="0" aria-label="' + esc(r.title) + '">' + ph.map(function (f, i) {
      return '<img src="' + esc(gvPhotoSrc(f)) + '" loading="lazy" data-act="gv-photo" alt="' + esc(L('gvPhotoAlt', { i: i + 1, n: ph.length, t: r.title })) + '">';
    }).join('') + '</div>' + (ph.length > 1
      ? '<button type="button" class="gvgb p" data-act="gv-gal" data-dir="-1" aria-label="' + esc(L('gvPrev')) + '" disabled>‹</button><button type="button" class="gvgb n" data-act="gv-gal" data-dir="1" aria-label="' + esc(L('gvNext')) + '">›</button><span class="gvgn">1 / ' + ph.length + '</span>'
      : '') + '</div>';
  }

  function gvWhen(ts) {
    var d = new Date(ts);
    return esc(fmt(d, { day: 'numeric', month: 'short' })) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  // Reaktionen und Kommentare zu einem Abschnitt (post_key: inv:<gv>, item:<id>, rep:<id>)
  function gvSocial(key) {
    var cnt = {}, mine = null;
    S.gv.reactions.forEach(function (r) {
      if (r.post_key !== key) return;
      cnt[r.emoji] = (cnt[r.emoji] || 0) + 1;
      if (S.me && r.user_id === S.me.id) mine = r.emoji;
    });
    var cs = S.gv.comments.filter(function (c) { return c.post_key === key; });
    var open = !!S.gvCom[key], kid = 'gvi-' + key.replace(/[^\w-]/g, '_');
    var h = '<div class="gvsoc"><div class="gvreacts">' + GV_REACT.map(function (k) {
      return '<button type="button" class="gvrb" data-act="gv-react" data-key="' + esc(key) + '" data-e="' + k + '" aria-pressed="' + (mine === k) + '" aria-label="' + esc(L('gvReactAria', { e: GV_EMOJI[k] })) + '">' + GV_EMOJI[k] + (cnt[k] ? ' <span>' + cnt[k] + '</span>' : '') + '</button>';
    }).join('') + '<button type="button" class="gvcb" data-act="gv-com" data-key="' + esc(key) + '" aria-expanded="' + open + '">' + esc(cs.length ? (cs.length === 1 ? L('gvComments1') : L('gvCommentsN', { n: cs.length })) : L('gvComment')) + '</button></div>';
    if (open) {
      h += '<div class="gvcwrap">' + (cs.length ? cs.map(function (c) {
        var m = ccMember(c.user_id), own = !!(S.me && c.user_id === S.me.id);
        return '<div class="gvcm' + (own ? ' mine' : '') + '"><div class="gvcn"><b>' + esc(m ? m.name : '?') + '</b><small>' + gvWhen(c.created_at) + '</small>' +
          ((own || canGvEdit() || (S.me && S.me.isAdmin)) ? '<button type="button" class="gvcx" data-act="gv-cdel" data-id="' + esc(c.id) + '">' + esc(L('del')) + '</button>' : '') + '</div><div class="gvct">' + esc(c.body) + '</div></div>';
      }).join('') : '<p class="ccsum">' + esc(L('gvNoComments')) + '</p>') +
        '<form class="gvcform" data-form="gvc" data-key="' + esc(key) + '"><input class="input" id="' + kid + '" name="body" maxlength="500" autocomplete="off" placeholder="' + esc(L('gvWrite')) + '" aria-label="' + esc(L('gvWrite')) + '" required><button class="btn inline" type="submit">' + esc(L('gvSend')) + '</button></form></div>';
    }
    return h + '</div>';
  }

  function gvPost(r, map) {
    var more = !!S.gvMore[r.id];
    return '<article class="ccel gvpost"><div class="cceh">' + gvX('report', r.id, '<b>' + esc(r.title) + '</b>') + '</div><div class="gvpbody">' +
      '<div class="gvauth">' + ccChip({ id: r.author_id, name: r.author_name }, map) + (r.subtitle ? '<span class="muted small">' + esc(r.subtitle) + '</span>' : '') + '</div>' +
      gvGallery(r) +
      (gvEditing()
        ? gvX('report', r.id, '<div class="gvtext">' + gvMarkup(r.body) + '</div>')
        : '<div class="gvtext' + (more ? '' : ' clamp') + '">' + gvMarkup(r.body) + '</div>' +
          '<button type="button" class="linkbtn gvmore" data-act="gv-more" data-id="' + esc(r.id) + '">' + esc(L(more ? 'gvLess' : 'gvMore')) + '</button>') +
      gvSocial('rep:' + r.id) + '</div></article>';
  }

  // o.k/o.id: Traktandum im Bearbeiten-Modus antippbar (Stift); o.proto: Zustand Protokoll (abgedunkelt); o.draft: Zustand in Arbeit (Titel rot mit Zusatz)
  function gvSection(id, nr, title, summary, bodyFn, o) {
    o = o || {};
    var open = gvIsOpen(id);
    return '<section class="ccel' + (o.proto ? ' gvproto' : '') + (o.draft ? ' gvdrafts' : '') + '"><div class="cceh"><button type="button" class="cct" data-act="gv-fold" data-id="' + id + '" aria-expanded="' + open + '">' +
      (nr ? '<span class="gvnr">' + nr + '</span>' : '') + esc(title) + (o.draft ? esc(L('gvStateDraftSfx')) : '') + '</button>' +
      (o.proto ? '<span class="gvtag">' + esc(L('gvProtoTag')) + '</span>' : '') +
      (o.k && gvEditing() ? '<button type="button" class="hico gvtedit" data-act="gv-edit" data-k="' + o.k + '" data-id="' + esc(o.id || '') + '" aria-label="' + esc(L('gvChapterEdit')) + '" title="' + esc(L('gvChapterEdit')) + '">' + ICON.pencil + '</button>' : '') +
      '<button type="button" class="ccfold' + (open ? ' open' : '') + '" data-act="gv-fold" data-id="' + id + '" aria-hidden="true" tabindex="-1">' + ICON.chev + '</button></div>' +
      (summary && !open ? '<p class="ccsum gvsum">' + esc(summary) + '</p>' : '') +
      (open ? '<div class="gvbody">' + bodyFn() + '</div>' : '') + '</section>';
  }

  function viewGv() {
    var G = S.gv, cur = G.cur, map = ccMap(), d = parseIso(cur.meeting_date), edit = gvEditing();
    // Vorstand: Stift öffnet direkt die Aktionen (Bearbeiten ein/aus und PDF stehen dort); alle anderen: PDF-Symbol
    var tools = canGvEdit() ? hico('gv-menu', ICON.pencil, L('gvEditMode'), { on: !!S.gvEdit }) : hico('gv-pdf', ICON.print, L('gvPdf'));
    var html = '<div class="top" style="align-items:center"><div><h1 class="pagetitle">' + esc(cur.title) + '</h1></div>' + tools + '</div>';
    if (G.all.length > 1) {
      html += '<div class="gvyears" role="group">' + G.all.map(function (x) {
        return '<button type="button" class="gvyr" data-act="gv-year" data-id="' + esc(x.id) + '" aria-pressed="' + (x.id === cur.id) + '"' + (x.visibility === 'members' ? '' : ' title="' + esc(L(gvVisNote(x.visibility))) + '"') + '>' + x.year + (x.visibility === 'members' ? '' : '<span class="gvdot" aria-hidden="true"></span>') + '</button>';
      }).join('') + '</div>';
    }
    html += '<section class="gvhero' + (edit ? ' gvx' : '') + '"' + (edit ? ' role="button" tabindex="0" data-act="gv-edit" data-k="meta" data-id="' + esc(cur.id) + '"' : '') + '><h2>' + esc(fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</h2><div class="gvfacts">' +
      (cur.meeting_time ? '<div class="gvfact"><b>' + esc(L('time')) + '</b><span>' + esc(L('atTime', { time: hhmm(cur.meeting_time) })) + '</span></div>' : '') +
      (cur.place ? '<div class="gvfact"><b>' + esc(L('place')) + '</b><span>' + esc(cur.place) + '</span></div>' : '') + '</div></section>';
    html += gvSection('inv', null, cur.intro_title || L('gvInvite'), '', function () {
      return gvX('intro', cur.id, gvMarkup(cur.intro)) +
        '<div class="gvnote">' + esc(L('gvRsvp', { date: ccDate(ccAddDays(cur.meeting_date, -7)) })) + '</div>' +
        '<button type="button" class="resp gvgo" data-act="tab" data-tab="events">' + esc(L('gvToEvents')) + '</button>' + gvSocial('inv:' + cur.id);
    }, { k: 'intro', id: cur.id, proto: cur.intro_state === 'protocol', draft: cur.intro_state === 'draft' });
    G.items.forEach(function (it) {
      html += gvSection('i' + it.nr, it.nr, it.title, it.summary, function () {
        var b = '';
        if (it.kind === 'reports') {
          b = gvX('item', it.id, gvMarkup(it.body)) + G.reports.map(function (r) { return gvPost(r, map); }).join('') +
            (edit ? '<button type="button" class="resp gvgo" data-act="gv-edit" data-k="newreport" data-id="">+ ' + esc(L('gvAddReport')) + '</button>' : '');
        }
        else if (it.kind === 'finance') b = gvX('item', it.id, gvFinance(it));
        else if (it.kind === 'program') b = gvX('item', it.id, gvMarkup(it.body)) + gvProgram(cur) + gvProgramTextBlock(cur);
        else if (it.kind === 'jass') b = gvX('item', it.id, gvMarkup(it.body)) + gvJass();
        else b = gvX('item', it.id, gvMarkup(it.body));
        return b + (it.kind === 'reports' ? '' : gvSocial('item:' + it.id));
      }, { k: 'item', id: it.id, proto: it.state === 'protocol', draft: it.state === 'draft' });
    });
    return html;
  }

  /* ----- Bearbeiten (nur Vorstand): Fenster von oben wie bei den Events ----- */
  function gvKey(e) { if (e.key === 'Escape' && !document.getElementById('dlg')) { e.preventDefault(); gvCloseSheet(); } }
  function gvCloseSheet() {
    var st = gvSheet;
    // Neu hochgeladene, nicht gespeicherte Fotos wieder entfernen
    if (st && st.added && st.added.length && !st.saved) gvPurge(st.added, true);
    if (st && st.prev) Object.keys(st.prev).forEach(function (k) { try { URL.revokeObjectURL(st.prev[k]); } catch (e) { /* ignorieren */ } });
    var el = document.getElementById('gvsheet');
    if (el) el.remove();
    gvSheet = null;
    document.removeEventListener('keydown', gvKey, true);
  }
  function gvPhotoState() {
    var st = gvSheet;
    if (!st || (st.kind !== 'report' && st.kind !== 'newreport')) return;
    var rp = st.kind === 'report' ? S.gv.reports.filter(function (x) { return x.id === st.id; })[0] : null;
    st.photos = rp ? (rp.photos || []).slice() : [];
    st.orig = st.photos.slice(); st.added = []; st.prev = {}; st.busy = false; st.saved = false;
  }
  function gvOpenSheet(kind, id) { if (!canGvEdit()) return; gvSheet = { kind: kind, id: id || null }; gvPhotoState(); gvDrawSheet(); }

  // Fotos verwalten (im Bericht-Fenster): verkleinern, in den privaten Speicher laden, ordnen, entfernen
  async function gvResize(file) {
    var bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) {
      bmp = await new Promise(function (res, rej) {
        var im = new Image(), u = URL.createObjectURL(file);
        im.onload = function () { URL.revokeObjectURL(u); res(im); };
        im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Bild nicht lesbar')); };
        im.src = u;
      });
    }
    var w = bmp.width, h = bmp.height, sc = Math.min(1, 1600 / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    var blob = await new Promise(function (res) { c.toBlob(res, 'image/jpeg', 0.82); });
    if (!blob) throw new Error('Bild konnte nicht umgewandelt werden');
    return blob;
  }
  function gvPhotoGrid() {
    var st = gvSheet, h = '';
    (st.photos || []).forEach(function (f, i) {
      var src = st.prev[f] || gvPhotoSrc(f);
      h += '<div class="gvpt"><img src="' + esc(src) + '" alt="">' +
        '<div class="gvptb">' +
        (i > 0 ? '<button type="button" data-gva="pmove" data-i="' + i + '" data-d="-1" aria-label="' + esc(L('gvPhotoMoveL')) + '">‹</button>' : '') +
        (i < st.photos.length - 1 ? '<button type="button" data-gva="pmove" data-i="' + i + '" data-d="1" aria-label="' + esc(L('gvPhotoMoveR')) + '">›</button>' : '') +
        '<button type="button" data-gva="pdel" data-i="' + i + '" aria-label="' + esc(L('gvPhotoDel')) + '">✕</button></div></div>';
    });
    h += '<label class="gvpadd' + (st.busy ? ' busy' : '') + '"><input type="file" id="gvpfile" accept="image/*" multiple hidden><span>' + (st.busy ? esc(L('gvUploading')) : '+ ' + esc(L('gvPhotoAdd'))) + '</span></label>';
    return h + '<p class="small muted gvfmt" style="grid-column:1/-1;margin:0">' + esc(L('gvPhotosHint')) + '</p>';
  }
  function gvRedrawPhotos() { var box = document.getElementById('gvphotos'); if (box && gvSheet) box.innerHTML = gvPhotoGrid(); }
  async function gvAddPhotos(files) {
    var st = gvSheet, cur = S.gv.cur;
    if (!st || !st.photos || !files || !files.length || !canGvEdit() || !cur) return;
    st.busy = true; gvRedrawPhotos();
    try {
      for (var i = 0; i < files.length && i < 12; i++) {
        var blob = await gvResize(files[i]);
        var path = cur.id + '/' + gvUuid() + '.jpg';
        var r = await sb.storage.from(GV_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (r.error) throw r.error;
        if (gvSheet !== st) { gvPurge([path], true); return; }   // Fenster wurde inzwischen geschlossen
        st.photos.push(path); st.added.push(path); st.prev[path] = URL.createObjectURL(blob);
        gvRedrawPhotos();
      }
    } catch (e) { console.error(e); toast(L('gvUploadFail')); }
    if (gvSheet === st) { st.busy = false; gvRedrawPhotos(); }
  }
  // Dateien im Speicher löschen; ohne force nur, wenn kein Bericht (z. B. einer kopierten GV) sie noch verwendet
  async function gvPurge(paths, force) {
    try {
      var del = [];
      for (var i = 0; i < paths.length; i++) {
        var p = paths[i];
        if (!gvIsStored(p) || !GV_PATH.test(p)) continue;
        if (!force) {
          var q = await sb.from('gv_reports').select('id').contains('photos', [p]).limit(1);
          if (q.error) throw q.error;
          if (q.data && q.data.length) continue;
        }
        del.push(p);
      }
      if (del.length) { var r = await sb.storage.from(GV_BUCKET).remove(del); if (r.error) throw r.error; }
    } catch (e) { console.error(e); }
  }
  // Fotos aus dem App-Ordner (alte Einträge ohne «/») in den geschützten Speicher übernehmen
  function gvLegacy() {
    var l = [];
    S.gv.reports.forEach(function (r) { (r.photos || []).forEach(function (f) { if (!gvIsStored(f) && gvPhotoOk(f)) l.push([r, f]); }); });
    return l;
  }
  async function gvMigrate() {
    var cur = S.gv.cur, list = gvLegacy(), n = 0, fail = 0, map = {};
    if (!cur || !list.length || !canGvEdit()) return;
    if (!(await askConfirm(L('gvMigrate'), L('gvMigrateAsk', { n: list.length }), false))) return;
    toast(L('gvUploading'));
    for (var i = 0; i < list.length; i++) {
      var r = list[i][0], f = list[i][1];
      try {
        var resp = await fetch(f, { cache: 'no-store' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var blob = await resp.blob();
        var ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
        var path = cur.id + '/' + gvUuid() + '.' + ext;
        var up = await sb.storage.from(GV_BUCKET).upload(path, blob, { contentType: ext === 'jpg' ? 'image/jpeg' : blob.type, upsert: false });
        if (up.error) throw up.error;
        (map[r.id] = map[r.id] || {})[f] = path; n++;
      } catch (e) { console.error(e); fail++; }
    }
    for (var k = 0; k < S.gv.reports.length; k++) {
      var rp = S.gv.reports[k], m = map[rp.id];
      if (!m) continue;
      try {
        var res = await sb.from('gv_reports').update({ photos: (rp.photos || []).map(function (x) { return m[x] || x; }) }).eq('id', rp.id);
        if (res.error) throw res.error;
      } catch (e2) { console.error(e2); fail++; }
    }
    toast(L('gvMigrated', { n: n }) + (fail ? ' · ' + L('errFailed') + ': ' + fail : ''));
    try { await loadAll(); render(); } catch (e3) { console.error(e3); }
  }
  function gvFormat() { return '<p class="small muted gvfmt">' + esc(L('gvFormat')) + '</p>'; }
  // Zustand eines Traktandums oder des Einladungstexts: Final, Draft (in Arbeit) oder Protokoll (grau hinterlegt)
  function gvStateField(cur) {
    var opts = ['final', 'draft', 'protocol'].map(function (sv) {
      return '<option value="' + sv + '"' + ((cur || 'final') === sv ? ' selected' : '') + '>' + esc(L(sv === 'draft' ? 'gvStateDraft' : sv === 'protocol' ? 'gvStateProtocol' : 'gvStateFinal')) + '</option>';
    }).join('');
    return fld(esc(L('gvStateF')), '<select class="input" name="state">' + opts + '</select>') + '<p class="small muted gvfmt">' + esc(L('gvStateHint')) + '</p>';
  }
  function gvDrawSheet() {
    var st = gvSheet, cur = S.gv && S.gv.cur;
    if (!st || !cur) { gvCloseSheet(); return; }
    var ta = function (name, val, rows) { return '<textarea class="input gvta" name="' + name + '" rows="' + rows + '">' + esc(val || '') + '</textarea>'; };
    var inp = function (name, val, max) { return '<input class="input" name="' + name + '" value="' + esc(val || '') + '" maxlength="' + (max || 200) + '" autocomplete="off">'; };
    var btns = function (del) {
      return '<div class="dlgbtns">' + (del ? '<button type="button" class="btn ghost inline dangerbtn" data-gva="del">' + esc(L('del')) + '</button>' : '') +
        '<button type="button" class="btn ghost inline" data-gva="close">' + esc(L('dismiss')) + '</button><button type="button" class="btn inline" data-gva="save">' + esc(L('save')) + '</button></div>';
    };
    var body = '', label = cur.title;
    if (st.kind === 'menu') {
      body = '<h3>' + esc(cur.title) + '</h3>' +
        '<button type="button" class="ccact" data-gva="toggle">' + ICON.pencil + '<span>' + esc(L(S.gvEdit ? 'gvEditOff' : 'gvEditOn')) + '</span></button>' +
        '<button type="button" class="ccact" data-gva="pdf">' + ICON.print + '<span>' + esc(L('gvPdf')) + '</span></button>' +
        '<button type="button" class="ccact" data-gva="meta">' + ICON.pencil + '<span>' + esc(L('gvMetaEdit')) + '</span></button>' +
        '<button type="button" class="ccact" data-gva="addreport">' + ICON.plus + '<span>' + esc(L('gvAddReport')) + '</span></button>' +
        '<button type="button" class="ccact" data-gva="copy">' + ICON.copy + '<span>' + esc(L('gvCopy')) + '</span></button>' +
        (gvLegacy().length ? '<button type="button" class="ccact" data-gva="migrate">' + ICON.copy + '<span>' + esc(L('gvMigrate')) + '</span></button>' : '') +
        '<button type="button" class="ccact del" data-gva="delgv">' + ICON.trash + '<span>' + esc(L('gvDelete')) + '</span></button>' +
        '<button type="button" class="ccact close" data-gva="close">' + esc(L('ccClose')) + '</button>';
    } else if (st.kind === 'meta') {
      body = '<p class="cck">' + esc(L('gvMetaEdit')) + '</p><h3>' + esc(cur.title) + '</h3><form data-gvform="meta" novalidate>' +
        fld(esc(L('gvTitleF')), inp('title', cur.title, 120)) +
        grid(fld(esc(L('date')), '<input class="input" type="date" name="meeting_date" value="' + esc(cur.meeting_date) + '">'), fld(esc(L('time')), '<input class="input" type="time" name="meeting_time" value="' + esc(hhmm(cur.meeting_time)) + '">')) +
        fld(esc(L('place')), inp('place', cur.place, 120)) +
        fld(esc(L('gvProgUntil')), '<input class="input" type="date" name="program_until" value="' + esc(cur.program_until || '') + '">') +
        '<p class="small muted gvfmt">' + esc(L('gvVisHint', { v: L(gvVisLabel(cur.visibility)) })) + '</p>' + btns(false) + '</form>';
    } else if (st.kind === 'intro') {
      body = '<p class="cck">' + esc(cur.intro_title || L('gvInvite')) + '</p><h3>' + esc(cur.title) + '</h3><form data-gvform="intro" novalidate>' +
        fld(esc(L('gvTitleF')), inp('intro_title', cur.intro_title || L('gvInvite'), 60)) +
        gvStateField(cur.intro_state) +
        fld(esc(L('gvIntro')), ta('intro', cur.intro, 14)) + gvFormat() + btns(false) + '</form>';
    } else if (st.kind === 'item') {
      var it = S.gv.items.filter(function (x) { return x.id === st.id; })[0];
      if (!it) { gvCloseSheet(); return; }
      var ft = it.kind === 'finance' ? gvFinToText(it.data) : null;
      body = '<p class="cck">' + it.nr + '</p><h3>' + esc(it.title) + '</h3><form data-gvform="item" novalidate>' +
        fld(esc(L('gvChapterF')), inp('title', it.title, 120)) + fld(esc(L('gvSummary')), inp('summary', it.summary, 160)) +
        gvStateField(it.state) +
        (ft ? fld(esc(L('gvFinKpi')), ta('kpis', ft.kpis, 4)) + fld(esc(L('gvFinCols')), inp('cols', ft.cols, 200)) + fld(esc(L('gvFinRows')), ta('rows', ft.rows, 12)) : '') +
        fld(esc(L('gvBody')), ta('body', it.body, it.kind === 'reports' || it.kind === 'finance' ? 8 : 12)) + gvFormat() + btns(false) + '</form>';
    } else if (st.kind === 'report' || st.kind === 'newreport') {
      var rp = st.kind === 'report' ? S.gv.reports.filter(function (x) { return x.id === st.id; })[0] : null;
      if (st.kind === 'report' && !rp) { gvCloseSheet(); return; }
      var authors = S.members.filter(function (m) { return !m.isGuest && !m.isCandidate && !m.isPassive && !m.isSupporter; });
      var opts = '<option value="">' + esc(L('gvNoAuthor')) + '</option>' + authors.map(function (m) {
        return '<option value="' + esc(m.id) + '"' + (rp && rp.author_id === m.id ? ' selected' : '') + '>' + esc(m.name) + '</option>';
      }).join('');
      label = rp ? rp.title : L('gvAddReport');
      body = '<p class="cck">' + esc(L('gvAddReport')) + '</p><h3>' + esc(rp ? rp.title : L('gvAddReport')) + '</h3><form data-gvform="report" novalidate>' +
        fld(esc(L('gvTitleF')), inp('title', rp && rp.title, 120)) + fld(esc(L('gvSubtitle')), inp('subtitle', rp && rp.subtitle, 160)) +
        fld(esc(L('gvAuthor')), '<select class="input" name="author_id">' + opts + '</select>') +
        fld(esc(L('gvAuthorName')), inp('author_name', rp && rp.author_name, 80)) +
        fld(esc(L('gvBody')), ta('body', rp && rp.body, 14)) + gvFormat() +
        '<div class="field"><span>' + esc(L('gvPhotos')) + '</span><div id="gvphotos" class="gvphotos">' + gvPhotoGrid() + '</div></div>' + btns(!!rp) + '</form>';
    }
    var wrap = document.getElementById('gvsheet');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'gvsheet';
      wrap.className = 'ccsheet';
      wrap.addEventListener('click', gvSheetClick);
      wrap.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'gvpfile') { var fl = Array.prototype.slice.call(e.target.files || []); e.target.value = ''; gvAddPhotos(fl); }
      });
      document.body.appendChild(wrap);
      document.addEventListener('keydown', gvKey, true);
    }
    wrap.innerHTML = '<div class="ccsheetcard" role="dialog" aria-modal="true" aria-label="' + esc(label) + '">' + body + '</div>';
    var first = wrap.querySelector('.input') || wrap.querySelector('button');
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
  }

  async function gvSheetClick(e) {
    var wrap = document.getElementById('gvsheet');
    if (e.target === wrap) { gvCloseSheet(); return; }
    var b = e.target.closest('[data-gva]');
    if (!b || !canGvEdit() || !gvSheet) return;
    var a = b.dataset.gva, st = gvSheet;
    if (a === 'close') { gvCloseSheet(); return; }
    if (a === 'toggle') { gvCloseSheet(); S.gvEdit = !S.gvEdit; render(); return; }
    if (a === 'pdf') { gvCloseSheet(); return gvExportPdf(); }
    if (a === 'meta') { gvSheet = { kind: 'meta', id: null }; gvDrawSheet(); return; }
    if (a === 'addreport') { gvSheet = { kind: 'newreport', id: null }; gvPhotoState(); gvDrawSheet(); return; }
    if (a === 'copy') { gvCloseSheet(); return gvCopy(); }
    if (a === 'migrate') { gvCloseSheet(); return gvMigrate(); }
    if (a === 'delgv') { gvCloseSheet(); return gvDeleteGv(); }
    if (a === 'pmove' && st.photos) {
      var pi = Number(b.dataset.i), pj = pi + Number(b.dataset.d);
      if (pj >= 0 && pj < st.photos.length) { var tmp = st.photos[pi]; st.photos[pi] = st.photos[pj]; st.photos[pj] = tmp; gvRedrawPhotos(); }
      return;
    }
    if (a === 'pdel' && st.photos) {
      var gone = st.photos.splice(Number(b.dataset.i), 1)[0];
      var ai = st.added.indexOf(gone);
      if (ai > -1) { st.added.splice(ai, 1); gvPurge([gone], true); }   // in diesem Fenster neu hochgeladen: gleich wieder löschen
      gvRedrawPhotos();
      return;
    }
    if (a === 'del' && st.kind === 'report') {
      if (!(await askConfirm(L('del'), L('gvDeleteRep'), true))) return;
      var rp0 = S.gv.reports.filter(function (x) { return x.id === st.id; })[0];
      var rm0 = rp0 ? (rp0.photos || []).slice() : [];
      gvCloseSheet();
      return act(function () { return sb.from('gv_reports').delete().eq('id', st.id); }, L('ccSaved')).then(function (ok) { if (ok) gvPurge(rm0); return ok; });
    }
    if (a === 'save') {
      var form = wrap.querySelector('[data-gvform]');
      if (form) return gvSave(form, st);
    }
  }

  function gvSave(form, st) {
    var cur = S.gv.cur, kind = form.dataset.gvform;
    var v = function (k) { var el = form.elements[k]; return el ? String(el.value).replace(/\r\n?/g, '\n').trim() : ''; };
    if (kind === 'meta') {
      if (!v('title') || !v('meeting_date')) { toast(L('gvNeedTitle')); return; }
      var row = { title: v('title'), meeting_date: v('meeting_date'), meeting_time: v('meeting_time') || null, place: v('place') || null, program_until: v('program_until') || null };
      gvCloseSheet();
      return act(function () { return sb.from('gv').update(row).eq('id', cur.id); }, L('ccSaved'));
    }
    if (kind === 'intro') {
      var intro = v('intro') || null;
      var ititle = v('intro_title');
      if (ititle === L('gvInvite')) ititle = '';   // Standardname: bleibt sprachabhängig
      gvCloseSheet();
      var istate = ['final', 'draft', 'protocol'].indexOf(v('state')) < 0 ? 'final' : v('state');
      return act(function () { return sb.from('gv').update({ intro: intro, intro_title: ititle || null, intro_state: istate }).eq('id', cur.id); }, L('ccSaved'));
    }
    if (kind === 'item') {
      var it = S.gv.items.filter(function (x) { return x.id === st.id; })[0];
      if (!it || !v('title')) { toast(L('gvNeedTitle')); return; }
      var irow = { title: v('title'), summary: v('summary') || null, body: v('body') || null, state: ['final', 'draft', 'protocol'].indexOf(v('state')) < 0 ? 'final' : v('state') };
      if (it.kind === 'finance') irow.data = gvFinFromText(v('kpis'), v('cols'), v('rows'));
      gvCloseSheet();
      return act(function () { return sb.from('gv_items').update(irow).eq('id', it.id); }, L('ccSaved'));
    }
    if (kind === 'report') {
      var ph = (st.photos || []).slice();
      if (st.busy) return;   // Foto wird noch hochgeladen
      if (!v('title') || !v('body')) { toast(L('gvNeedTitle')); return; }
      if (!ph.every(gvPhotoOk)) { toast(L('gvPhotoBad')); return; }
      var rrow = { title: v('title'), subtitle: v('subtitle') || null, author_id: v('author_id') || null, author_name: v('author_name') || null, body: v('body'), photos: ph };
      var removed = (st.orig || []).filter(function (f) { return ph.indexOf(f) < 0; });
      st.saved = true;
      gvCloseSheet();
      var after = function (ok) { if (ok && removed.length) gvPurge(removed); return ok; };
      if (st.kind === 'newreport') {
        rrow.gv_id = cur.id;
        rrow.sort = S.gv.reports.reduce(function (n, x) { return Math.max(n, x.sort || 0); }, 0) + 1;
        return act(function () { return sb.from('gv_reports').insert(rrow); }, L('ccSaved')).then(after);
      }
      return act(function () { return sb.from('gv_reports').update(rrow).eq('id', st.id); }, L('ccSaved')).then(after);
    }
  }

  // GV für das nächste Jahr als Entwurf kopieren (Datenbankfunktion gv_copy, nur Vorstand)
  async function gvCopy() {
    var cur = S.gv.cur;
    if (!cur || !canGvEdit()) return;
    if (!(await askConfirm(L('gvCopy'), L('gvCopyAsk', { y: cur.year, n: cur.year + 1 }), false))) return;
    try {
      var r = await sb.rpc('gv_copy', { p_from: cur.id });
      if (r.error) throw r.error;
      S.gvSel = r.data; S.gvOpen = {}; S.gvMore = {}; S.gvCom = {};
      toast(L('gvCopied'));
    } catch (e) {
      console.error(e);
      toast(/GV_EXISTS/.test(String(e && e.message)) ? L('gvExists') : L('errFailed') + (e && e.message ? ': ' + String(e.message).slice(0, 100) : '') + '.');
    }
    try { await loadAll(); render(); window.scrollTo(0, 0); } catch (e2) { console.error(e2); }
  }
  async function gvDeleteGv() {
    var cur = S.gv.cur;
    if (!cur || !canGvEdit()) return;
    if (!(await askConfirm(L('gvDelete'), L('gvDeleteAsk', { y: cur.year }), true))) return;
    var rm = [];
    S.gv.reports.forEach(function (r) { (r.photos || []).forEach(function (f) { rm.push(f); }); });
    S.gvSel = null; S.gvEdit = false;
    var okDel = await act(function () { return sb.from('gv').delete().eq('id', cur.id); }, L('ccSaved'));
    if (okDel && rm.length) gvPurge(rm);
    if (!S.gv.cur) { S.tab = 'trainings'; render(); }
  }

  async function gvReact(key, e) {
    if (!S.me || !key || GV_REACT.indexOf(e) < 0) return;
    var mine = S.gv.reactions.filter(function (r) { return r.post_key === key && r.user_id === S.me.id; })[0];
    if (mine && mine.emoji === e) {
      S.gv.reactions = S.gv.reactions.filter(function (r) { return r !== mine; });
      render();
      await act(function () { return sb.from('gv_reactions').delete().eq('post_key', key).eq('user_id', S.me.id); });
    } else {
      if (mine) mine.emoji = e; else S.gv.reactions.push({ post_key: key, user_id: S.me.id, emoji: e });
      render();
      await act(function () { return sb.from('gv_reactions').upsert({ post_key: key, user_id: S.me.id, emoji: e }, { onConflict: 'post_key,user_id' }); });
    }
  }
  async function gvSend(form) {
    var key = form.dataset.key, inp = form.querySelector('input[name="body"]');
    var txt = String(inp ? inp.value : '').trim().slice(0, 500);
    if (!txt || !key || !S.me) return;
    inp.value = '';
    S.gvCom[key] = true;
    await act(function () { return sb.from('gv_comments').insert({ post_key: key, user_id: S.me.id, body: txt }); });
  }

  // Foto im Vollbild; Tippen oder Esc schliesst
  function gvLightbox(src, alt) {
    var old = document.querySelector('.gvlb'); if (old) old.remove();
    var lb = document.createElement('div');
    lb.className = 'gvlb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    var im = document.createElement('img'); im.src = src; im.alt = alt || '';
    var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = '✕'; bt.setAttribute('aria-label', L('gvClose'));
    lb.appendChild(im); lb.appendChild(bt);
    var onKey = function (ev) { if (ev.key === 'Escape') close(); };
    var close = function () { lb.remove(); document.removeEventListener('keydown', onKey, true); };
    lb.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(lb);
    bt.focus();
  }
  // Foto-Zähler und Pfeile beim Wischen (scroll bubbelt nicht: im Capture-Modus abfangen)
  document.addEventListener('scroll', function (e) {
    var s = e.target;
    if (!s || !s.classList || !s.classList.contains('gvstrip') || !s.firstElementChild) return;
    var w = s.firstElementChild.getBoundingClientRect().width + 6, g = s.parentNode;
    var n = g.querySelector('.gvgn'), p = g.querySelector('.gvgb.p'), nx = g.querySelector('.gvgb.n');
    if (n) n.textContent = (Math.min(s.children.length - 1, Math.round(s.scrollLeft / w)) + 1) + ' / ' + s.children.length;
    if (p) p.disabled = s.scrollLeft < 4;
    if (nx) nx.disabled = s.scrollLeft + s.clientWidth >= s.scrollWidth - 4;
  }, true);
  // Antippbare Inhalte auch per Tastatur (Enter/Leertaste)
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('gvx')) { e.preventDefault(); e.target.click(); }
  });

  /* ---------- Live-Aktualisierung ---------- */
  var channel = null, reloadTimer;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async function () {
      if (S.step !== 'app') return;
      try { await loadAll(); softRender(); if (ccSheet && ccSheet.mode === 'menu') ccDrawSheet(); } catch (e) { console.error(e); }
    }, 400);
  }
  function subscribe() {
    if (channel || !sb) return;
    try {
      channel = sb.channel('vereins-daten').on('postgres_changes', { event: '*', schema: 'public' }, function (p) { if (!TP || (p && p.table && p.table.indexOf(TP) === 0)) scheduleReload(); }).subscribe();
    } catch (e) { console.error(e); }
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') scheduleReload(); });

  /* ---------- Klicks ---------- */
  document.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act_ = el.dataset.act;
    var D = el.dataset;

    if (act_ === 'mode') { S.mode = S.mode === 'login' ? 'register' : 'login'; S.err = ''; render(); return; }
    if (act_ === 'tab') { S.tab = D.tab; S.edit = null; render(); window.scrollTo(0, 0); return; }
    if (act_ === 'who') { S.open[D.key] = !S.open[D.key]; render(); return; }
    if (act_ === 'js-fold') { S.jsFold[D.id] = !S.jsFold[D.id]; delete S.info['jsh:' + D.id]; delete S.info['jsh:' + String(D.id).replace(/:s$/, '')]; render(); return; }   // Auf-/Zuklappen blendet den Infotext immer aus; Info nur über das Info-Icon
    if (act_ === 'js-print-past') { if (!jsEdit()) return; try { await jsPrintMatrix(); } catch (err) { console.error(err); toast(L('ccPdfFailed')); } return; }
    if (act_ === 'js-hint') { S.info['jsh:' + D.id] = !S.info['jsh:' + D.id]; render(); return; }   // nur den Text ein-/ausblenden
    if (act_ === 'js-lock') { if (!jsEdit()) return; S.jsUnlock[D.id] = !S.jsUnlock[D.id]; render(); return; }
    if (act_ === 'js-row-edit') { if (jsEdit() && S.jsUnlock[D.id]) jsOpen({ lvl: 'day', id: D.id, mode: 'row-form', idx: Number(D.idx) }); return; }
    if (act_ === 'js-menu') { if (jsEdit()) jsOpen({ lvl: D.lvl, id: D.id, mode: 'menu' }); return; }
    if (act_ === 'js-pick') { if (jsEdit()) jsOpen({ lvl: 'day', id: D.id, mode: 'pick', slot: Number(D.slot), q: '' }); return; }
    if (act_ === 'js-addday') { if (jsEdit()) jsOpen({ lvl: 'day', id: null, mode: 'day-form' }); return; }
    if (act_ === 'mb-menu') { if (S.me && S.me.isAdmin) mbOpen(D.id); return; }
    if (act_ === 'mb-grp') { S.sec[D.id] = S.sec[D.id] !== true; render(); return; }
    if (act_ === 'cc-addevent') { if (canCC()) ccOpen('root', null, 'add'); return; }
    if (act_ === 'sh-fold') { S.ccFold[D.id] = !shIsFolded(D.id); render(); return; }
    if (act_ === 'sh-scene-add') { if (shEdit()) ccOpen('scene', D.id, 'add', { persons: [], q: '' }); return; }
    if (act_ === 'sh-scene-edit') { if (shEdit()) ccOpen('scene', D.id, 'edit'); return; }
    if (act_ === 'sh-play') { S.play[D.id] = !S.play[D.id]; render(); return; }
    if (act_ === 'sh-print') { if (shEdit()) { try { await showExportPdf(); } catch (err) { console.error(err); toast(L('ccPdfFailed')); } } return; }
    if (act_ === 'sh-addact') { if (shEdit()) ccOpen('shroot', null, 'add'); return; }
    if (act_ === 'sh-menu') { if (shEdit()) ccOpen(D.lvl, D.id || null, 'menu'); return; }
    if (act_ === 'cc-fold') { S.ccFold[D.id] = !ccIsFolded(D.id); render(); return; }
    if (act_ === 'cc-menu') { if (canCC()) ccOpen(D.lvl, D.id || null, 'menu'); return; }
    if (act_ === 'cc-print') { if (canCC()) ccExportPdf(D.id); return; }
    if (act_ === 'ev-menu') { if (canManageEvents()) evOpen(D.id, 'menu'); else if (canEditEvPeople()) evOpen(D.id, 'people'); return; }
    if (act_ === 'tr-people') { if (canEditPeople()) evOpen(D.key, 'trpeople'); return; }
    if (act_ === 'cc-guest') { if (S.me && S.me.isAdmin) ccOpen('guest', null, 'guest', { name: D.name }); return; }
    if (act_ === 'who-ev') { S.open['ev:' + D.id] = !S.open['ev:' + D.id]; render(); return; }
    if (act_ === 'gv-pdf') { if (S.gv && S.gv.cur) await gvExportPdf(); return; }
    if (act_ === 'gv-menu') { gvOpenSheet('menu'); return; }
    if (act_ === 'gv-edit') { gvOpenSheet(D.k, D.id); return; }
    if (act_ === 'gv-year') { S.gvSel = D.id; S.gvOpen = {}; S.gvMore = {}; S.gvCom = {}; await loadGv(); render(); window.scrollTo(0, 0); return; }
    if (act_ === 'gv-fold') { S.gvOpen[D.id] = !gvIsOpen(D.id); render(); return; }
    if (act_ === 'gv-copytext') { if (S.gv && S.gv.cur) gvCopyText(gvProgramText(S.gv.cur).text); return; }
    if (act_ === 'tr-grp') { S.trGrp[D.key + '|' + D.g] = !trGrpOpen(D.key, D.g); render(); return; }
    if (act_ === 'tl-fold') { S.trLogClosed[D.key] = !S.trLogClosed[D.key]; render(); return; }
    if (act_ === 'tl-info') { S.trLogInfo[D.key] = !S.trLogInfo[D.key]; render(); return; }
    if (act_ === 'gv-more') { S.gvMore[D.id] = !S.gvMore[D.id]; render(); return; }
    if (act_ === 'gv-gal') { var gs = el.parentNode.querySelector('.gvstrip'); if (gs && gs.firstElementChild) gs.scrollBy({ left: Number(D.dir) * (gs.firstElementChild.getBoundingClientRect().width + 6), behavior: 'smooth' }); return; }
    if (act_ === 'gv-photo') { gvLightbox(el.getAttribute('src'), el.getAttribute('alt')); return; }
    if (act_ === 'gv-react') { await gvReact(D.key, D.e); return; }
    if (act_ === 'gv-com') { S.gvCom[D.key] = !S.gvCom[D.key]; render(); if (S.gvCom[D.key]) { var gi = document.getElementById('gvi-' + D.key.replace(/[^\w-]/g, '_')); if (gi) gi.focus(); } return; }
    if (act_ === 'gv-cdel') { await act(function () { return sb.from('gv_comments').delete().eq('id', D.id); }); return; }
    if (act_ === 'gv-event') { gvGoEvent(D.id); return; }
    if (act_ === 'sec') { S.sec[D.id] = !S.sec[D.id]; render(); return; }
    if (act_ === 'info-toggle') { S.info[D.id] = !S.info[D.id]; render(); return; }   // nur den Text ein-/ausblenden, Auf-/Zuklappen bleibt unabhängig
    if (act_ === 'ev-new') { if (canManageEvents()) evOpen(null, 'new'); return; }
    if (act_ === 'ev-edit') { if (canManageEvents()) evOpen(D.id, 'edit'); return; }
    if (act_ === 'add-toggle') {
      if (D.id === 'events') { if (canManageEvents()) evOpen(null, 'new'); return; }
      S.add[D.id] = !S.add[D.id];
      if (S.add[D.id]) S.sec[D.id] = true;
      render();
      var af = document.querySelector('.addform');
      if (S.add[D.id] && af) af.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (act_ === 'more-tr') { S.showMore = !S.showMore; render(); return; }
    if (act_ === 'edit') {
      S.edit = D.target;
      S.sec[D.target.indexOf('rule:') === 0 ? 'rules' : D.target.indexOf('ev:') === 0 ? 'events' : D.target.indexOf('tr:x#') === 0 ? 'extra' : 'upcoming'] = true;
      render();
      var ef = document.querySelector('.editform');
      if (ef) ef.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (act_ === 'edit-cancel') { S.edit = null; render(); return; }
    if (act_ === 'push-pref' || act_ === 'push-hours') {
      try {
        var cur = pushPrefs(), np = { ev: cur.ev, tr: cur.tr, h: cur.h };
        if (act_ === 'push-pref') np[D.k] = !!el.checked; else np.h = D.val === '24' ? 24 : 48;
        if (!np.ev && !np.tr) {
          await pushDisable();
          S.pushOn = false; S.pp = np;
          toast(L('pushDisabledToast'));
        } else if (act_ === 'push-hours' && !S.pushOn) {
          S.pp = np;
        } else if (await pushSave(np)) {
          S.pushOn = true; S.pp = np;
          toast(L('pushEnabledToast'));
        }
      } catch (err) { console.error(err); toast(L('pushFail')); }
      render();
      return;
    }
    if (act_ === 'install') {
      if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; render(); }
      return;
    }
    if (act_ === 'logout') {
      ccCloseSheet();
      mbClose();
      jsClose();
      closeSimpleMenu();
      evClose();
      try { await sb.auth.signOut(); } catch (err) { console.error(err); }
      if (channel) { try { sb.removeChannel(channel); } catch (err2) { /* ignorieren */ } channel = null; }
      S = freshState(); S.step = 'login'; render(); window.scrollTo(0, 0);
      return;
    }

    if (act_ === 'resp') return setResponse('training_responses', 'training_key', D.key, D.val, D.val === 'yes' ? L('youIn') : L('youOut'));
    if (act_ === 'resp-ev') return setResponse('event_responses', 'event_id', D.id, D.val, D.val === 'solo' ? L('youSolo') : D.val === 'duo' ? L('youDuo') : L('youOut'));

    if (act_ === 'cal') {
      var ce = S.events.filter(function (x) { return x.id === D.id; })[0];
      if (ce) { try { await addToCalendar(ce); } catch (err) { console.error(err); toast(L('calFail')); } }
      return;
    }
    if (act_ === 'set-design') {
      applyDesign(D.val);
      S.me.design = design;
      try { sb.from('profiles').update({ design: design }).eq('id', S.me.id).then(function (r) { if (r && r.error) console.error(r.error); }, function (e5) { console.error(e5); }); } catch (e6) { console.error(e6); }
      render();
      return;
    }
    if (act_ === 'set-theme') {
      setTheme(D.val);
      S.me.theme = theme || null;
      saveTheme();
      render();
      return;
    }
    if (act_ === 'pin-default') {
      try {
        var pr = await sb.auth.updateUser({ password: defaultPin(S.me.phone) });
        if (pr.error) throw pr.error;
        toast(L('pinResetOk'));
        S.me.pinChanged = false;
        try { await sb.from('profiles').update({ pin_changed: false }).eq('id', S.me.id); } catch (e3) { console.error(e3); }
      } catch (err) { console.error(err); toast(L('pinResetFail')); }
      return;
    }

    /* Event-Aktionen: Admins und Event Manager */
    if (canManageEvents()) {
      if (act_ === 'del-ev') {
        if (!(await askConfirm(L('del'), L('confirmDelEvent'), true))) return;
        return act(function () { return sb.from('events').delete().eq('id', D.id); }, L('eventDeleted'));
      }
      if (act_ === 'cancel-ev') {
        var evx = S.events.filter(function (x) { return x.id === D.id; })[0];
        if (!evx) return;
        return act(function () { return sb.from('events').update({ cancelled: !evx.cancelled }).eq('id', D.id); }, evx.cancelled ? L('evReactivated') : L('evCancelledMsg'));
      }
    }

    /* Training absagen / reaktivieren (nur Admin) */
    if (act_ === 'cancel') {
      if (!S.me || !S.me.isAdmin) return;
      var off = !!S.cancelled[D.key];
      if (off) {
        return act(function () { return sb.from('training_cancellations').delete().eq('training_key', D.key); }, L('trReactivated'));
      } else {
        return act(function () { return sb.from('training_cancellations').insert({ training_key: D.key }); }, L('trCancelledMsg'));
      }
    }

    /* Admin-Aktionen */
    if (!S.me || !S.me.isAdmin) return;
    if (act_ === 'del-rule') {
      if (!(await askConfirm(L('remove'), L('confirmDelRule'), true))) return;
      return act(function () { return sb.from('training_rules').delete().eq('id', D.id); }, L('ruleRemoved'));
    }
    if (act_ === 'del-extra') {
      if (!(await askConfirm(L('del'), L('confirmDelExtra'), true))) return;
      return act(function () { return sb.from('training_extras').delete().eq('id', D.id); }, L('extraDeleted'));
    }
    if (act_ === 'reset-tr') {
      S.edit = null;
      return act(function () { return sb.from('training_overrides').delete().eq('training_key', D.key); }, L('changeReset'));
    }
    if (act_ === 'reset-pin') {
      var who = S.members.filter(function (m) { return m.id === D.id; })[0];
      if (!(await askConfirm(L('resetPin'), L('confirmResetPin', { name: who ? who.name : L('thisMemberDat') }), false))) return;
      return act(function () { return sb.rpc('reset_pin', { target: D.id }); }, L('pinReset'));
    }
    if (act_ === 'remove-member') {
      var rm = S.members.filter(function (m) { return m.id === D.id; })[0];
      if (!(await askConfirm(L('remove'), L('confirmRemove', { name: rm ? rm.name : L('thisMember') }), true))) return;
      return act(function () { return sb.rpc('remove_member', { target: D.id }); }, L('memberRemoved'));
    }
    if (act_ === 'set-group') {
      var tg = S.members.filter(function (m) { return m.id === D.id; })[0];
      if ((D.val === 'guest' || D.val === 'candidate') && tg && (tg.isAdmin || tg.isEventManager || tg.isChilbiManager || tg.isChraenzliManager || tg.isJassMaster || tg.isDirector || tg.isActor || tg.isBoard) &&
          !(await askConfirm(L(D.val === 'guest' ? 'guestTag' : 'grpCandidate'), L('confirmGuestLoses', { name: tg.name }), false))) return;
      return act(function () { return sb.rpc('set_member_group', { target: D.id, grp: D.val }); }, L('groupChanged'));
    }
    if (act_ === 'set-em') {
      return act(function () { return sb.rpc('set_event_manager', { target: D.id, make_manager: D.val === '1' }); }, D.val === '1' ? L('emGranted') : L('emRevoked'));
    }
    if (act_ === 'set-dir') {
      return act(function () { return sb.rpc('set_director', { target: D.id, make_director: D.val === '1' }); }, D.val === '1' ? L('dirGranted') : L('dirRevoked'));
    }
    if (act_ === 'set-actor') {
      return act(function () { return sb.rpc('set_actor', { target: D.id, make_actor: D.val === '1' }); }, D.val === '1' ? L('actorGranted') : L('actorRevoked'));
    }
    if (act_ === 'set-bo') {
      if (!S.me || !S.me.isAdmin) return;
      return act(function () { return sb.rpc('set_board', { target: D.id, make_board: D.val === '1' }); }, D.val === '1' ? L('boGranted') : L('boRevoked'));
    }
    if (act_ === 'set-jm') {
      return act(function () { return sb.rpc('set_jass_master', { target: D.id, make_master: D.val === '1' }); }, D.val === '1' ? L('jmGranted') : L('jmRevoked'));
    }
    if (act_ === 'set-cm') {
      return act(function () { return sb.rpc('set_chilbi_manager', { target: D.id, make_manager: D.val === '1' }); }, D.val === '1' ? L('cmGranted') : L('cmRevoked'));
    }
    if (act_ === 'set-crm') {
      return act(function () { return sb.rpc('set_chraenzli_manager', { target: D.id, make_manager: D.val === '1' }); }, D.val === '1' ? L('crmGranted') : L('crmRevoked'));
    }
    if (act_ === 'set-admin') {
      return act(function () { return sb.rpc('set_admin', { target: D.id, make_admin: D.val === '1' }); }, D.val === '1' ? L('adminGranted') : L('adminRevoked'));
    }
  });

  /* ---------- Formulare ---------- */
  document.addEventListener('submit', async function (e) {
    var form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    if (S.busy) return;
    var f = new FormData(form);
    var kind = form.dataset.form;
    var id = form.dataset.id;
    var g = function (k) { if (k === 'phone' && f.has('phonecc')) return composePhone(f.get('phonecc'), f.get('phone')); return String(f.get(k) || '').trim(); };
    var ok;

    if (kind === 'auth') return handleAuth(g);
    if (!S.me) return;
    if (kind === 'gvc') return gvSend(form);

    if (kind === 'name') {
      return act(function () { return sb.from('profiles').update({ name: g('name') }).eq('id', S.me.id); }, L('nameSaved'));
    }
    if (kind === 'pin') {
      if (!/^\d{6}$/.test(g('pin'))) { toast(L('pinExact')); return; }
      if (pinWeak(g('pin'), S.me.phone)) { toast(L('pinWeak')); return; }
      try {
        var r = await sb.auth.updateUser({ password: g('pin') });
        if (r.error) throw r.error;
        form.reset(); toast(L('pinChanged'));
        S.me.pinChanged = true;
        try { await sb.from('profiles').update({ pin_changed: true }).eq('id', S.me.id); } catch (e2) { console.error(e2); }
      } catch (err) { console.error(err); toast(L('pinChangeFail')); }
      return;
    }
    // Event-Formulare nur für Event Manager, alle anderen Formulare nur für Admins
    if ((kind === 'event' || kind === 'edit-ev' || kind === 'ev-resp') ? !S.me.isEventManager : !S.me.isAdmin) return;

    if (kind === 'member-edit') {
      var nph = normPhone(g('phone'));
      if (!g('name')) { toast(L('ccNeedName')); return; }
      if (!nph) { toast(L('phoneInvalid')); return; }
      S.busy = true;
      var ur = await sb.rpc('admin_update_member', { target: form.dataset.id, new_name: g('name'), new_phone: nph });
      S.busy = false;
      if (ur.error) {
        console.error(ur.error);
        toast(/PHONE_TAKEN|duplicate|unique/i.test(ur.error.message || '') ? L('mPhoneTaken') : L('errFailed') + ': ' + String(ur.error.message || '').slice(0, 100));
        return;
      }
      mbClose();
      toast(L('mSaved'));
      try { await loadAll(); render(); } catch (x) { console.error(x); }
      return;
    }
    if (kind === 'member') {
      S.busy = true;
      var added = await addMember(g('name'), g('phone'), !!f.get('guest'));
      S.busy = false;
      if (added) { S.add.members = false; render(); }
      return;
    }
    if (kind === 'rule') {
      ok = await act(function () { return sb.from('training_rules').insert({ weekday: Number(g('wd')), start_time: g('time'), place: g('place') }); }, L('ruleAdded'));
    } else if (kind === 'extra') {
      ok = await act(function () { return sb.from('training_extras').insert({ title: g('title'), event_date: g('date'), start_time: g('time'), place: g('place') }); }, L('extraAdded'));
    } else if (kind === 'event') {
      var rsvpNew = !!(form.querySelector('[name=rsvp]') && form.querySelector('[name=rsvp]').checked);
      ok = await act(function () { return sb.from('events').insert({ title: g('title'), event_date: g('date'), start_time: g('time'), place: g('place'), rsvp_required: rsvpNew }); }, L('eventAdded'));
    } else if (kind === 'edit-rule') {
      ok = await act(function () { return sb.from('training_rules').update({ weekday: Number(g('wd')), start_time: g('time'), place: g('place') }).eq('id', id); }, L('ruleChanged'));
      if (ok) S.edit = null;
    } else if (kind === 'edit-tr') {
      if (id.indexOf('x#') === 0) {
        ok = await act(function () { return sb.from('training_extras').update({ title: g('title'), event_date: g('date'), start_time: g('time'), place: g('place') }).eq('id', id.slice(2)); }, L('trChanged'));
      } else {
        ok = await act(function () { return sb.from('training_overrides').upsert({ training_key: id, new_date: g('date'), new_time: g('time'), new_place: g('place') }); }, L('trChanged'));
      }
      if (ok) S.edit = null;
    } else if (kind === 'edit-ev') {
      var rsvpEdit = !!(form.querySelector('[name=rsvp]') && form.querySelector('[name=rsvp]').checked);
      ok = await act(function () { return sb.from('events').update({ title: g('title'), event_date: g('date'), start_time: g('time'), place: g('place'), rsvp_required: rsvpEdit }).eq('id', id); }, L('eventChanged'));
      if (ok) { S.edit = null; if (evSheet && evSheet.id === id) evClose(); }
    }
    if (ok && kind === 'rule') S.add.rules = false;
    if (ok && kind === 'event') S.add.events = false;
    if (ok) {
      // Nach Event anlegen/bearbeiten: Daten neu laden damit rsvp_required sofort korrekt ist.
      if (kind === 'event' || kind === 'edit-ev') {
        try { await loadAll(); } catch (e2) { console.error(e2); }
      }
      render();
      if (/^(extra)$/.test(kind)) { var nf = document.querySelector('[data-form="' + kind + '"]'); if (nf) nf.reset(); }
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || (t.name !== 'phone' && t.name !== 'phonecc') || !t.closest('[data-form="auth"],[data-form="member"],[data-ccform="guest"],[data-form="member-edit"]')) return;
    var row = t.closest('.phonerow');
    if (!row) return;
    var sel = row.querySelector('select'), inp = row.querySelector('input');
    var pos = inp.selectionStart, atEnd = pos === inp.value.length;
    var before = inp.value.slice(0, pos).replace(/\D/g, '').length;
    var v = inp.value;
    // Vollständig internationale Eingabe (+49 … / 0041 …): Land automatisch wählen
    var m = v.replace(/\s/g, '').match(/^(?:\+|00)(\d+)/);
    if (m) {
      var hit = PHONE_CC.filter(function (x) { return m[1].indexOf(x.c) === 0; })[0];
      if (hit) { sel.value = hit.c; v = fmtNational(hit.c, m[1].slice(hit.c.length)); atEnd = true; }
      else { sel.value = ''; v = '+' + m[1]; }
    } else if (sel.value) {
      v = fmtNational(sel.value, v.replace(/\D/g, '').replace(/^0+/, ''));
    }
    var info = ccInfo(sel.value);
    inp.placeholder = info ? info.ph : '+43 …';
    if (v === inp.value) return;
    inp.value = v;
    if (atEnd) pos = v.length;
    else { var c = 0; pos = 0; while (pos < v.length && c < before) { if (/\d/.test(v.charAt(pos))) c++; pos++; } }
    try { inp.setSelectionRange(pos, pos); } catch (x) { /* ignorieren */ }
  });

  /* ---------- Installation & Start ---------- */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); installPrompt = e;
    if (S.step === 'app' && S.tab === 'profile') softRender();
  });

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* ignorieren */ }); });
  }

  async function init() {
    document.documentElement.lang = LANG_HTML[lang];
    if (!sb) { S.step = 'setup'; render(); return; }
    render();
    try {
      var res = await sb.auth.getSession();
      if (res.data && res.data.session) { await enter(res.data.session); }
      else { S.step = 'login'; render(); }
    } catch (e) { console.error(e); S.step = 'login'; render(); }
    sb.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_OUT' && S.step === 'app') { S = freshState(); S.step = 'login'; render(); }
    });
  }
  init();
})();
