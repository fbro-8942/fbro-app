# Vereins-Training – Teilnahme per App

Mitglieder registrieren sich mit Handynummer (ohne SMS) und tragen sich für Trainings und Events ein oder aus. Der PIN ist standardmässig **die letzten 6 Ziffern der Handynummer**. Admins legen Trainingstage und Events fest und bestimmen per Zahnrad weitere Admins. Die App läuft im Browser und lässt sich auf dem Handy wie eine App installieren.

- **Oberfläche:** reine HTML/CSS/JavaScript-Dateien, keine Build-Werkzeuge nötig
- **Daten und Anmeldung:** Supabase
- **Veröffentlichung:** GitHub Pages (automatisch bei jedem Speichern im Repository)

## Dateien

| Datei | Zweck |
|---|---|
| `index.html`, `styles.css`, `app.js` | die App |
| `config.js` | **hier trägst du die Supabase-Werte ein** |
| `supabase/schema.sql` | Tabellen und Zugriffsregeln für die Datenbank |
| `manifest.webmanifest`, `sw.js`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | machen die App installierbar (Symbol und Name auf dem Startbildschirm). Der Ordner `icons/` enthält nur noch das kleine Browser-Symbol und Kopien des Logos. |
| `.github/workflows/pages.yml` | veröffentlicht die App automatisch auf GitHub Pages |

## Einrichtung in 6 Schritten

### 1. Supabase-Projekt anlegen
1. Auf [supabase.com](https://supabase.com) ein Konto erstellen und **New project** wählen.
2. Als Region **Zurich (eu-central-2)** oder Frankfurt wählen, damit die Daten in Europa liegen.
3. Datenbank-Passwort vergeben und sicher aufbewahren.

### 2. Anmeldung einstellen
Unter **Authentication → Sign In / Providers → Email**:
- **Enable Email provider:** an
- **Confirm email:** **aus** (sonst kann sich niemand ohne echte E-Mail-Adresse registrieren)
- **Minimum password length:** 6

Die App verwendet die Handynummer intern als Login-Namen. Es werden keine E-Mails und keine SMS verschickt.

### 3. Datenbank einrichten
1. Im Supabase-Dashboard **SQL Editor → New query** öffnen.
2. Den kompletten Inhalt von `supabase/schema.sql` einfügen und **Run** klicken.
3. Danach diese zwei Befehle einzeln ausführen (Werte anpassen):
   ```sql
   -- Vereinscode: ohne ihn kann sich niemand registrieren
   insert into public.app_settings (key, value) values ('club_code', 'MEIN-VEREINSCODE')
   on conflict (key) do update set value = excluded.value;

   -- Erstes Training: Montag 19:00
   insert into public.training_rules (weekday, start_time, place)
   values (1, '19:00', 'Turnhalle Schulhaus Nord');
   ```

### 4. App mit Supabase verbinden
1. In Supabase unter **Project Settings → API** die **Project URL** und den Schlüssel **anon public** kopieren.
2. Beides in `config.js` eintragen. Bei `CLUB_NAME` den Vereinsnamen setzen.

Der `anon`-Schlüssel darf öffentlich sein. Geschützt sind die Daten durch die Zugriffsregeln aus dem Schema. Den `service_role`-Schlüssel niemals eintragen oder weitergeben.

### 5. Auf GitHub veröffentlichen
1. Auf [github.com](https://github.com) ein neues Repository anlegen, z. B. `verein-training`.
2. Alle Dateien dieses Ordners hochladen (Button **Add file → Upload files**, den Ordner `.github` nicht vergessen), oder per Git:
   ```bash
   git init
   git add .
   git commit -m "Erste Version"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/verein-training.git
   git push -u origin main
   ```
3. Im Repository **Settings → Pages → Source: GitHub Actions** wählen.
4. Unter dem Reiter **Actions** siehst du die Veröffentlichung laufen. Danach ist die App erreichbar unter `https://DEIN-NAME.github.io/verein-training/`.

Jede weitere Änderung an den Dateien wird automatisch veröffentlicht.

### 6. Ersten Admin festlegen
1. Die App öffnen und mit Name, Handynummer und Vereinscode ein Konto erstellen. Der PIN wird automatisch aus den letzten 6 Ziffern deiner Handynummer gebildet.
2. Im SQL Editor diesen Befehl ausführen (deine Nummer im Format `+41791234567`):
   ```sql
   update public.profiles set is_admin = true where phone = '+41791234567';
   ```
3. App neu laden. Es erscheint der Bereich **Verwalten**. Unter «Mitglieder» kannst du mit dem Zahnrad jedes Mitglied zum Admin machen oder die Rechte wieder entziehen. Die eigenen Rechte kann man sich nicht selbst entziehen, damit es immer mindestens einen Admin gibt.

## App auf dem Handy installieren
Link (oder QR-Code) an die Mitglieder verteilen, z. B. per WhatsApp.
- **iPhone:** in **Safari** öffnen (nicht in Chrome oder in einer anderen App), unten auf **Teilen** tippen, dann **Zum Home-Bildschirm**. Der Name lautet «FBRO».
- **Android:** in Chrome öffnen, im Menü **App installieren** wählen. Alternativ zeigt die App unter «Profil» einen Installations-Knopf.

Auf dem Startbildschirm erscheint das FBRO-Wappen mit dem Namen «FBRO». Auf dem iPhone kommt das Symbol aus `apple-touch-icon.png`, auf Android aus `icon-192.png`, `icon-512.png` und `icon-maskable-512.png`. Der Name kommt aus `index.html` (iPhone) beziehungsweise `manifest.webmanifest` (Android). Wer die App schon vor dem Logo-Update installiert hat, muss das Symbol einmal entfernen und die App neu zum Startbildschirm hinzufügen. Daten gehen dabei nicht verloren.

**PWA-Installation auf Android: Voraussetzungen und Hinweise**
Damit der Installations-Banner erscheint und die App als eigenstaendige App startet, muessen folgende Bedingungen erfuellt sein:
- Android 8 (Oreo) oder neuer mit Chrome 68 oder neuer (empfohlen: Chrome aktuell)
- Die Seite muss mindestens 30 Sekunden offen sein und einmal beruehrt werden (Engagement-Kriterium)
- Bei Android 6/7 erscheint kein automatischer Banner; Installation manuell ueber Chrome-Menue (drei Punkte) moeglich

| Android | Chrome (mind.) | PWA-Verhalten |
|---|---|---|
| 4/5 | - | Kein Install-Prompt, nur Lesezeichen moeglich |
| 6-7 | 57 | Manuell ueber Chrome-Menue; kein automatischer Banner |
| **8-9** | **68** | **Erster zuverlaessiger WebAPK-Install** |
| **10-12** | **73** | **Maskable Icons und Splash Screen** |
| **13+** | **105** | **Voller Support** |

Falls der Banner schon mal erschienen und weggeklickt wurde: Chrome-Menue (drei Punkte oben rechts) Pfeil-nach-oben-Symbol oder **App installieren**.

**Auf Android erscheint ein Buchstabe oder ein falsches Symbol statt des Wappens?**
1. Öffne im Chrome von Android `https://DEIN-NAME.github.io/REPOSITORY/icon-512.png` und `.../manifest.webmanifest`. Das Wappen muss erscheinen, und das Manifest muss als Text mit «FBRO» erscheinen. Bei «404» fehlt die Datei auf GitHub. Lade `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` und `manifest.webmanifest` direkt ins Hauptverzeichnis des Repositorys hoch.
2. Chrome speichert das Symbol beim Installieren. Entferne die alte App vom Startbildschirm (lange drücken, «Deinstallieren» beziehungsweise «Entfernen») und installiere sie neu über das Chrome-Menü. Eine bereits installierte App aktualisiert ihr Symbol oft erst nach ein bis zwei Tagen von selbst.
3. Falls die Veröffentlichung über «GitHub Actions» läuft, ersetze auch `.github/workflows/pages.yml`. Einfacher ist es, unter Settings → Pages **«Deploy from a branch»** (Branch `main`, Ordner `/ (root)`) zu wählen. Dann wird alles veröffentlicht, was im Hauptverzeichnis liegt, und die Datei `.github/workflows/pages.yml` wird nicht mehr gebraucht.

**Auf dem iPhone erscheint eine schwarze Kachel mit «T» statt des Wappens?** Dann konnte das iPhone die Bilddatei nicht laden. Das passiert, wenn die Datei auf GitHub fehlt oder die Seite noch die alte Version zeigt.
1. Öffne in Safari `https://DEIN-NAME.github.io/REPOSITORY/apple-touch-icon.png`. Es muss das Wappen auf weissem Grund erscheinen. Bei «404» fehlt die Datei auf GitHub. Lade `apple-touch-icon.png` (liegt im Hauptordner des ZIP) direkt in das Repository hoch, ins Hauptverzeichnis neben `index.html`.
2. Prüfe, dass `index.html` neu ist: In der Datei muss `apple-touch-icon.png?v=3` stehen.
3. Wenn unter Settings → Pages «GitHub Actions» gewählt ist, ersetze auch `.github/workflows/pages.yml`, damit die neue Datei veröffentlicht wird. Bei «Deploy from a branch» ist das nicht nötig.
4. Warte, bis die Veröffentlichung fertig ist (Reiter Actions: grüner Haken), und entferne das alte Symbol vom Home-Bildschirm.
5. Öffne die App in einem **privaten Tab** von Safari und lege das Symbol dort neu an. So holt das iPhone alles frisch und nimmt nichts aus dem Zwischenspeicher.

## Aufbau der App (Stand jetzt)
- **Einheitliches Design:** Trainings- und Event-Karten sowie die Abschnitte unter «Admin» sehen jetzt aus wie C&C und Jass: helle blaue Kopfzeile mit dem Titel, Teilnehmerzahl als runde Pille, und bei «Admin» ein Drei-Punkte-Menü statt mehrerer einzelner Symbole (Info/«+» stecken jetzt dort drin). Das sorgt für ein einheitliches Bild über die ganze App.
- **Seitentitel:** Jeder Bereich hat oben einen einheitlich formatierten Titel: Trainings «Trainingsplan», Events «Vereinsanlässe», C&C «Chilbi & Chränzli», Jass «Jass-Masters», Admin «Admin Console», Profil «Mein Profil». Diese Titel sind bewusst feststehende Bezeichnungen (wie «C&C») und werden nicht pro Sprache übersetzt; sie erscheinen in jeder der zehn Sprachen gleich. Willst du sie übersetzt haben, trage die gewünschten Texte in `app.js` im Abschnitt «Sprachen (Übersetzungen)» bei den Schlüsseln `titleTrainings`, `titleEvents`, `titleCC`, `titleJass`, `adminTitle`, `profileTitle` ein. Die Schrift wird automatisch verkleinert, bis der Titel auf einer Zeile Platz hat, auch bei langen Übersetzungen oder schmalen Bildschirmen. Der Login-Bildschirm mit dem Wappen und dem Namen aus `config.js` (z. B. «FBRO») bleibt davon unberührt.
- **Login-Bildschirm:** Zeigt oben rechts statt der Sprachauswahl das FBRO-Wappen (`icons/logo.png`), daneben links der Titel «{Vereinsname}» / «App» auf zwei Zeilen. Die Sprache wird weiterhin automatisch anhand der Gerätesprache erkannt (siehe Abschnitt «Sprachen») und lässt sich nach der Anmeldung im Profil ändern.
- **Farben bei Trainings und Events:** Die Datum-Kachel ist dunkelblau, die positive Antwort («Dabei» bzw. «Allein»/«Zu zweit») ist hellblau, die negative («Nicht dabei») ist rosa, die Teilnehmerzahl-Kachel ist leicht grau abgesetzt. Nur bei Trainings ist zusätzlich die Teilnehmerzahl eingefärbt: rot bei weniger als 8, grün bei 8 bis 12, und wieder rot ab 13 (so sieht man auf einen Blick, ob die Gruppe für eine normale Trainingseinheit passt). Bei Events gibt es diese Ampel nicht, da es dort keine feste Zielgrösse gibt. Die Namen in den aufgeklappten Teilnehmerlisten zeigen dieselben farbigen Marken wie bei C&C und Jass (blau für Mitglieder, weiss mit blauem Rand für Gäste), ohne Krone oder anderes Symbol.
- **FBRO-Trainings:** Die nächsten 20 Termine stehen direkt sichtbar da, nach Monaten gruppiert. Alle weiteren Termine (bis 12 Monate im Voraus) sind unter «Weitere Termine» eingeklappt. Vergangene Termine erscheinen nicht mehr. Die Anzahl änderst du in `config.js` bei `TRAININGS_VISIBLE`.
- **FBRO-Events:** Alle kommenden Events, nach Monaten gruppiert. Es gibt keine Obergrenze. Der Kurzname «FBRO» steht in `config.js` bei `CLUB_SHORT`.
- **Admin** (früher «Verwalten», Titel «Admin Console»): Die Bereiche «Standard Training» (früher «Montag Trainings»), «Extra Training» (früher «Weitere Trainings»), «Trainingsplan verwalten» (früher «Kommende Trainings»), «Events» und «Gruppen» sind einklappbar und anfangs zu. Die Erklärungstexte sind ebenfalls verborgen. Sie erscheinen erst, wenn du in der Kopfzeile des Bereichs auf das **Info-Symbol** tippst. Es steht links neben dem «+». Nochmals tippen blendet den Text wieder aus.
  - Bei «Standard Training Setup», «Events» und «Gruppen» steht neben dem Bereichsnamen ein **«+»**. Erst nach dem Tippen darauf erscheint das Erfassungsformular. Nach dem Speichern schliesst es sich wieder.
  - «Extra Training Setup» enthält die zusätzlichen Termine (Turniere, Zusatztrainings) mit Liste und Formular. «Trainingsplan verwalten» zeigt die Termine der Montag-Serie, die du einzeln ändern oder absagen kannst.
  - Extra Training Setup und Events sind nicht begrenzt (getestet mit über 150 Einträgen).
  - **Gruppen** (früher «Mitglieder»): enthält die vier einklappbaren Untergruppen **Aktivmitglieder**, **Passivmitglieder**, **Supporter** und **Gäste**, alle anfangs zu. Alle Mitglieder-Funktionen (Rollen, PIN zurücksetzen, Name/Nummer ändern, löschen) findest du dort unverändert hinter den drei Punkten bei jeder Person.
- **Handynummern:** Eingegeben werden dürfen `079 123 45 67`, `+41 79 123 45 67` oder `0041 79 …`. Leerschläge spielen keine Rolle. Im Feld und in allen Listen erscheint die Nummer im Schweizer Format `079 123 45 67`. Gespeichert wird intern das internationale Format.
- **Mitglieder hinzufügen:** Name und Handynummer eingeben. Das Mitglied meldet sich danach nur mit der Handynummer an, der PIN sind die letzten 6 Ziffern. Einen Vereinscode braucht es dafür nicht.
- **Mitglied entfernen:** Der Knopf «Entfernen» löscht das Konto samt Antworten. Das lässt sich nicht rückgängig machen.

**Update einer bestehenden Installation:** Ersetze `app.js`, `styles.css` und `sw.js`. Deine `config.js` kannst du behalten. Falls darin `TRAININGS_VISIBLE: 12` steht, ändere den Wert auf 20. Führe zusätzlich `supabase/schema.sql` im SQL Editor erneut aus. Sie fügt die Spalten für Sprache, Gast, Aktiv/Passiv, Supporter, PIN-Status, Event-Manager, Chilbi Manager, Chränzli Manager und Jass Manager, die Tabellen für C&C und Jass hinzu, stellt die Event-Manager-Rolle wieder her (jetzt losgelöst von Chilbi/Chränzli Manager) und erlaubt alle zehn Sprachen. Ohne diesen Schritt funktionieren die Rollen, C&C, Jass, das Bearbeiten von Events und das Ändern von Name und Handynummer nicht.

## Neu in diesem Update (funfte Runde)
- **Bug-Fix Training absagen:** Admins konnten Trainings ueber die Schaltflaeche Absagen in der Trainingsplanung nicht absagen (der Klick blieb ohne Wirkung). Der Fehler war im globalen Click-Handler: Der `cancel`-Befehl wurde nur fuer Events abgefangen, nicht fuer Trainings. Behoben in `app.js` (v84).
- **Android-Installation Manifest-Fix:** Das Feld `id: "/"` im `manifest.webmanifest` verursachte auf GitHub Pages Installations- und Startprobleme (App startete auf der 404-Seite statt der echten URL). Das Feld wurde entfernt; Chrome verwendet jetzt automatisch `start_url` als eindeutige App-ID.
- **Service Worker:** Cache-Version auf `training-v84` erhoeht.

## Neu in diesem Update (vierte Runde)
- **Dritter Ordner «Ewige Rangliste»** unter Jass, neben «Anstehendes Jassmaster» und «Vergangene Jassmasters». Zeigt eine Gesamtrangliste über die **letzten 10 abgeschlossenen Runden** (nicht alle jemals gespielten): Punkte pro Person werden über diese Runden summiert – bei historisch erfassten Runden die eingetragenen Punkte, bei regulär gespielten die berechneten Rangpunkte (32, 28, 24 … bis 4). Angezeigt werden Rang, Name, Anzahl der dabei gezählten Runden und die Gesamtpunktzahl; bei Gleichstand teilen sich mehrere Personen denselben Rang. Sobald mehr als 10 Runden abgeschlossen sind, fällt automatisch die jeweils älteste aus der Wertung.
- Standardmässig zugeklappt, wie «Vergangene Jassmasters».

## Neu in diesem Update (dritte Runde)
- **Teilnehmer frei bearbeiten:** Beim Zuweisen eines Teilnehmer-Platzes gibt es jetzt immer auch ein Freitext-Feld «Andere Person». Ist der Platz bereits mit einem frei eingetippten Namen belegt, ist das Feld damit vorausgefüllt und lässt sich direkt bearbeiten (nicht nur neu vergeben).
- **Runde abschliessen:** Über die drei Punkte eines anstehenden Jasstags («Jassmaster abschliessen», mit Bestätigung) wandert die Runde sofort nach «Vergangene Jassmasters» – im gleichen Stil wie die bisherigen vergangenen Runden (nur Monat/Jahr, nur die Tagesrangliste, keine Teilnehmer/Spielplan-Unteransicht mehr).
- **Sichtbarkeit anstehender Runden:** Ein Häkchen bei jedem anstehenden Jasstag (wie bei Chränzli/Chilbi) steuert, ob er für alle sichtbar ist. Ohne Haken sehen nur Admin und Jass Manager die Runde – neu angelegte Runden starten ohne Haken, bis sie bereit zur Veröffentlichung sind. Einmal abgeschlossene Runden bleiben unabhängig vom Haken für alle sichtbar.
- **Spielplan aktualisiert sich automatisch**, sobald sich ein Teilnehmer ändert – das war technisch schon vorher der Fall und wurde nochmals geprüft.

## Neu in diesem Update (zweite Runde)
- **C&C:** Der Name eines Tages (z. B. «Aufbau») steht jetzt im gleichen Stil wie das Datum, mit einem « - » verbunden («14.01.2027 - Aufbau» statt Datum fett und Name daneben in Grau). Das «+1» bei Schichten über Mitternacht ist weg (die Schicht wird intern weiterhin korrekt nach Mitternacht einsortiert).
- **Events:** «Im Kalender speichern» ist nicht mehr fett. Jede Event-Karte hat jetzt rechts im blauen Balken **drei Punkte** – sichtbar für alle, nutzbar nur für Admin und **Event-Manager**. Das Menü bietet: Event ändern (Name, Datum, Zeit, Ort), Teilnehmer verwalten (für jede Aktiv-/Passivperson Allein/Zu-zweit/Nicht-dabei direkt setzen oder die Antwort löschen), Absagen/Reaktivieren, Löschen.
- **Events-Zugriff:** Nur **Aktiv- und Passivmitglieder** sehen den Bereich Events überhaupt; Gäste und die neue Gruppe Supporter sehen ihn nicht.
- **Rolle Event-Manager** ist zurück, jetzt aber unabhängig von Chilbi/Chränzli Manager: Nur Admin und Event-Manager dürfen Events bearbeiten.
- **Neue Gruppe Supporter** unter Admin → Gruppen, gleich dargestellt wie Gäste (weisse Krone, blauer Rand), aber eine eigene, vierte Gruppe.
- **PIN-Ampel:** In der Mitgliederliste zeigt ein kleiner Punkt vor jedem Namen, ob die Person ihren PIN schon selbst geändert hat (grün) oder noch den Standard-PIN nutzt (rot) – unabhängig von der Gruppe.

## Neu in diesem Update (erste Runde)
Diese Runde hat das Design weiter vereinheitlicht und drei Rollen umgebaut:

- **Kein «FBRO» mehr in den Seitentiteln** (Trainingsplan, Vereinsanlässe, Jass-Masters, Admin Console). Der Login-Bildschirm mit dem Wappen bleibt unverändert.
- **Trainings:** Datum voll ausgeschrieben («Montag, 05.10.2026»), «Dabei», «Nicht dabei» und die Teilnehmerzahl stehen gleich geformt nebeneinander. Ein abgesagtes Training zeigt nur noch einen grauen Balken mit «(abgesagt)».
- **Events:** Datum und Eventname stehen zusammen im blauen Balken. «Im Kalender speichern» steht jetzt neben Zeit/Ort, rechtsbündig. Die Antwort-Knöpfe und die Teilnehmerzahl sind vier gleich geformte Felder.
- **Jass:** Datum ebenfalls voll ausgeschrieben, mit optionalem Namen in Klammern («Freitag, 16.10.2026 (32. Jassmasters)») – beim Anlegen oder Ändern eines Jasstags einfach mit eintragen. Im Spielplan stehen keine «Tisch»- und «Team»-Beschriftungen mehr. Die Tagesrangliste zeigt statt der Anzahl Spiele feste Rangpunkte (32, 28, 24 … bis 4 für den Letzten).
- **Admin:** «Standard Training» und «Extra Training» heissen neu ohne den Zusatz «Setup».
- **Gruppen:** «Mitglieder» heisst neu **Aktivmitglieder**, dazu kommt eine zweite, leere Gruppe **Passivmitglieder**. Admins verschieben jemanden über das Drei-Punkte-Menü («Zum Passivmitglied machen»).
- **Neue Rollen:** Der bisherige **Event-Manager** ist durch zwei eigene Rollen ersetzt: **Chilbi Manager** und **Chränzli Manager** (gleiches Glas-Symbol, beide dürfen Events und C&C bearbeiten). Jass-Master heisst neu **Jass Manager** – unverändert in der Funktion, nur der Name ist neu.
- **PDF teilen:** Bei jedem Chränzli- und Chilbi-Anlass steht neben den drei Punkten jetzt ein Drucker-Symbol. Es erstellt direkt im Browser ein A4-PDF im Querformat (gleiche Vorlage wie die zuvor gezeigten Entwürfe) und öffnet auf dem Handy die native Teilen-Funktion, mit der man es z. B. direkt per WhatsApp oder E-Mail verschicken kann. Unterstützt das Gerät das nicht, wird die PDF-Datei stattdessen heruntergeladen. Im Kopf des PDFs steht automatisch der zuständige Chilbi- bzw. Chränzli Manager (Admins werden dort bewusst nicht aufgeführt, auch wenn sie dieselben Rechte haben).

## Jass
Der Bereich **Jass** in der Fussleiste (Pokal-Symbol) ist für **alle** sichtbar, auch für Mitglieder und Gäste. Bearbeiten dürfen nur **Admins und die Rolle Jass Manager**; alle anderen sehen die Spielpläne und Ranglisten nur lesend.

- **Zwei feste Ordner:** **«Anstehendes Jassmaster»** (standardmässig aufgeklappt) und **«Vergangene Jassmasters»** (standardmässig zugeklappt), beide einklappbar, nach Datum sortiert. Ob ein Jasstag anstehend oder vergangen ist, wird **nicht** mehr automatisch anhand des Datums bestimmt, sondern durch den Status «abgeschlossen» (siehe unten). Es gibt keine frei benennbaren Serien; das «+» zum Anlegen eines neuen Jasstags steht in der Kopfzeile von «Anstehendes Jassmaster».
- **Anstehendes Jassmaster** zeigt pro Tag die Unterbereiche **Spielplan** und **Tagesrangliste** für alle, dazu **Teilnehmer** nur für Admins und Jass Manager – alle einzeln auf- und zuklappbar.
  - **Teilnehmer:** 8 Plätze, jeweils per Tippen aus Mitgliedern und Gästen gewählt (mit Suche) oder als frei eingetippter Name («Andere Person») – auch nachträglich editierbar. Eine Person kann nicht doppelt gewählt werden; «Platz freigeben» leert einen Platz wieder. Dieser Unterbereich ist für alle anderen unsichtbar. Der Spielplan übernimmt jede Änderung sofort.
  - **Sichtbarkeit:** Ein Häkchen bei jedem anstehenden Jasstag (wie bei Chränzli/Chilbi) steuert, ob ihn alle sehen oder nur Admin/Jass Manager. Neu angelegte Runden starten unsichtbar.
  - **Spielplan:** fester Plan mit 4 Runden zu je 2 Tischen, die Paarungen sind fix hinterlegt. Die Namen der Teilnehmer erscheinen automatisch an der richtigen Stelle. Der Erklärungstext dazu steckt hinter einem **Info-Symbol** und ist nur für Admins/Jass Manager sichtbar (dort einklappbar).
  - **Punkte:** Pro Spiel wird nur die Punktzahl von **Team I** eingetragen. **Team II** erhält automatisch denselben Betrag negativ. Ein leeres Feld löscht die Punktzahl wieder.
  - **Abschliessen:** Über die drei Punkte eines Jasstags («Jassmaster abschliessen», mit Bestätigung) wandert er in «Vergangene Jassmasters». Von dort lässt er sich in dieser Version nicht mehr automatisch zurückholen.
- **Vergangene Jassmasters** zeigen pro Tag nur die **Tagesrangliste**, direkt sichtbar ohne Unterbereiche.
  - **Datum:** Hier wird nur **Monat und Jahr** angezeigt (z. B. «Oktober 2025»), ohne Wochentag oder Tag – passend für länger zurückliegende, von Hand erfasste Runden.
  - **Rangliste von Hand pflegen:** Über die drei Punkte → **«Rangliste bearbeiten»** lässt sich für jeden Jasstag (anstehend oder vergangen) eine Liste aus Name und Punktzahl frei erfassen. Ist eine solche Liste vorhanden, hat sie **Vorrang** vor der aus den Spielpunkten berechneten Rangliste – gedacht für historische Runden ohne Einzelspiel-Daten. Beim Namen schlägt die App Mitglieder vor, akzeptiert aber auch frei eingetippte Namen (z. B. für Personen, die nicht mehr in der App erfasst sind).
  - **Historischer Import:** Die Datei `supabase/jassmasters_historie.sql` legt die zehn überlieferten Runden (27 bis 36, April 2014 bis Oktober 2025) mit ihren Ranglisten an. Im SQL Editor einfügen und ausführen, nachdem `schema.sql` aktuell ist. Das Skript kann gefahrlos mehrfach ausgeführt werden – bereits vorhandene Runden werden nicht doppelt angelegt. **Wichtiger Hinweis:** Diese Zahlen stammen aus einer von Hand eingetippten Tabelle; bei ein paar Zeilen (insbesondere «Mäke Notz») war die Spaltenzuordnung nicht eindeutig. Bitte einmal gegenkontrollieren und über «Rangliste bearbeiten» korrigieren, falls nötig.
- **Tagesrangliste (berechnet):** Für jeden der 8 Teilnehmer werden die Punkte aus allen seinen Spielen zusammengezählt, dazu feste Rangpunkte (1. Platz 32, danach je 4 weniger, mindestens 4). Gleiche Punktzahlen teilen sich den Rang.
- **Drei Punkte / Pfeil:** Auf jedem Jasstag öffnen die drei Punkte ein Fenster mit Ändern, Rangliste bearbeiten, ggf. Abschliessen, und Löschen; der Pfeil daneben klappt den Tag ein oder aus.
- **Rolle Jass Manager:** Admins vergeben sie unter «Admin → Gruppen» im Drei-Punkte-Menü einer Person («Zum Jass Manager machen»). Jass Manager erscheinen in der Mitgliederliste mit einem lila **Pokal-Abzeichen**. Nur Admins und Jass Manager dürfen etwas an Jassmasters ändern – anstehende wie vergangene.
- **Schutz in der Datenbank:** Jede angemeldete Person darf lesen, nur Admins und Jass Manager dürfen schreiben.

## C&C: Chränzli und Chilbi
Der Bereich **C&C** in der Fussleiste (Lorbeerkranz-Symbol) ist standardmässig nur für **Admins, Chilbi Manager und Chränzli Manager** sichtbar. Diese drei können ihn aber über ein Kontrollkästchen oben auf der Seite («Für alle Mitglieder und Gäste sichtbar») für alle anderen öffnen – dann sehen auch Mitglieder und Gäste den Bereich, allerdings **nur lesend**: keine Checkbox, keine Drei-Punkte-Menüs, nur der Druck-Knopf bleibt für alle verfügbar. Schreiben dürfen weiterhin ausschliesslich Admin, Chilbi Manager und Chränzli Manager, auch das ist in der Datenbank abgesichert.

- **Aufbau:** Anlass (z. B. «Chränzli 2027») → Tage (Datum und optionaler Name) → Schichten (Start, Ende, optionaler Name) → Rollen (Name und Verantwortliche). Endet eine Schicht vor ihrem Start, gilt sie bis zum Folgetag und zeigt «+1».
- **Aktiv:** Das Häkchen beim Anlass schaltet ihn aktiv oder inaktiv. Inaktive Anlässe sind blass und starten eingeklappt.
- **Drei Punkte:** Auf jeder Stufe öffnen sie ein Fenster mit **Ändern**, **Kopieren**, **Löschen** und dem Hinzufügen der nächsten Stufe. Im Fenster eines Anlasses steht zusätzlich «Anlass hinzufügen».
- **Ein- und ausklappen:** Bei jedem Anlass und jedem Tag mit dem Pfeil rechts neben den drei Punkten oder durch Tippen auf den Namen. Eingeklappte Tage zeigen «x Schichten · y Rollen».
- **Kopieren:** Ein Tag wird mit allen Schichten, Rollen und Verantwortlichen kopiert, als Datum ist der Folgetag vorgeschlagen. Ein Anlass wird als neuer, zunächst inaktiver Anlass kopiert, das Jahr im Namen wird hochgezählt und alle Tage werden um 52 Wochen verschoben, damit die Wochentage gleich bleiben. Schichten und Rollen werden direkt daneben kopiert.
- **Verantwortliche:** Auswahl aus Mitgliedern und Gästen mit Suche oder als «Andere Person» per Freitext. Bei ähnlichen Namen schlägt die App das passende Mitglied vor, z. B. «Meinst du Dani Oetterli?».
- **Farben:** Blau mit Krone = Mitglied, weiss mit blauem Rand = Gast, gelb = Andere (nicht in der App). Freitext-Namen werden automatisch blau oder weiss, sobald eine Person mit genau diesem Namen in der App ist.
- **Andere als Gast übernehmen:** Admins tippen auf einen gelben Namen und geben die Handynummer ein. Die Person wird als Gast angelegt und überall blau-weiss angezeigt.
- **Vorschlag Chilbi 2027:** Die Datei `supabase/chilbi_2027.sql` füllt «Chilbi 2027» mit dem Einsatzplan des Chilbistands 2026, um 52 Wochen verschoben (Mi 01.09. bis Mo 06.09.2027). Im SQL Editor einfügen und ausführen. Hat «Chilbi 2027» schon Tage, ändert die Datei nichts.
- **Startinhalt:** Beim ersten Ausführen des Schemas werden «Chränzli 2027» mit den Tagen 14. bis 17.01.2027 und «Chilbi 2027» (inaktiv, leer) angelegt. Das geschieht nur einmal. Gelöschte Einträge kommen beim erneuten Ausführen nicht zurück.
- **PDF teilen:** Neben den drei Punkten eines Anlasses steht ein **Drucker-Symbol**. Es erstellt im Browser ein A4-PDF im Querformat mit allen Tagen, Schichten und Rollen dieses Anlasses (gleiche Vorlage wie die zuvor besprochenen Entwürfe), im Kopf mit Anlass-Name, dem zuständigen Chilbi- oder Chränzli Manager (erkannt am Wort «Chilbi» bzw. «Chränzli» im Anlass-Namen; Admins werden hier bewusst nicht aufgeführt) sowie «Version» und dem Erstellungsdatum. Unterstützt das Gerät die native Teilen-Funktion (die meisten Smartphones), öffnet sich direkt das Teilen-Menü, worüber sich das PDF z. B. per WhatsApp oder E-Mail verschicken lässt; sonst wird es heruntergeladen. Dieses Symbol ist für **alle** sichtbar, nicht nur für Admins und Manager, da es nur eine Ansicht erzeugt und nichts verändert. Die PDF-Bibliothek (`jsPDF`) wird über ein CDN geladen (bereits in `index.html` eingetragen).

## Rollen und Mitgliederverwaltung
Unter «Admin → Gruppen» ist die Liste in **Aktivmitglieder**, **Passivmitglieder**, **Supporter** und **Gäste** aufgeteilt. Alle vier Gruppen lassen sich einklappen. Supporter werden optisch gleich wie Gäste dargestellt (weisse Krone mit blauem Rand), sind aber eine eigene Gruppe. Hinter dem Namen zeigt ein goldenes **Zahnrad** Admins, ein blauer **Stern** Event-Manager, ein blaues **Glas** Chilbi Manager oder Chränzli Manager (gleiches Symbol für beide) und ein lila **Pokal** Jass Manager an. Ganz links steht bei jeder Person ausserdem ein kleiner Punkt: **grün**, wenn sie ihren PIN schon selbst geändert hat, **rot**, wenn sie noch den Standard-PIN verwendet – unabhängig davon, in welcher Gruppe sie ist.

Die **drei Punkte** bei jeder Person öffnen ein Fenster mit allen Aktionen. **Nur Admins** sehen diesen Bereich.

| Aktion | Hinweis |
|---|---|
| Zum Admin machen / Admin-Rechte entziehen | nur bei Mitgliedern |
| Zum Event-Manager machen / Rechte entziehen | nur bei Mitgliedern. Darf im Bereich Events Name, Datum, Zeit, Ort und Teilnehmer direkt bearbeiten |
| Zum Chilbi Manager machen / Rechte entziehen | nur bei Mitgliedern. Darf C&C bearbeiten |
| Zum Chränzli Manager machen / Rechte entziehen | nur bei Mitgliedern. Darf C&C bearbeiten |
| Zum Jass Manager machen / Rechte entziehen | nur bei Mitgliedern. Darf den Bereich Jass bearbeiten |
| Zum Passivmitglied / Supporter / Aktivmitglied machen | reine Einordnung, ändert keine anderen Rechte |
| Zum Gast machen / Zum Mitglied machen | wer Gast wird, verliert Admin-, Manager- und Jass-Manager-Rechte, die App fragt vorher nach |
| PIN zurücksetzen | setzt den PIN auf die letzten 6 Ziffern der Handynummer, mit Bestätigung, und setzt die PIN-Ampel wieder auf Rot |
| Name und Handynummer ändern | bei einer neuen Nummer ändert sich die Anmeldung, es gilt wieder der Standard-PIN der neuen Nummer, und die PIN-Ampel springt auf Rot |
| Mitglied löschen | löscht das Konto samt Antworten, mit Bestätigung |

- **Gäste und Supporter** sehen nur die Trainings und ihr Profil, keine Events, kein Jass und keinen Bereich «Admin». Bei Trainings können sie sich ein- und austragen.
- **Event-Manager** ist wieder eine eigene Rolle, losgelöst von Chilbi/Chränzli Manager: Nur Admin und Event-Manager dürfen Events bearbeiten, Chilbi/Chränzli Manager haben dort keinen Zugriff mehr (sie verwalten ausschliesslich C&C).
- **Chilbi Manager und Chränzli Manager** dürfen gleichermassen den gesamten Bereich C&C (also sowohl Chränzli- als auch Chilbi-Anlässe) bearbeiten – die Trennung ist organisatorisch gedacht (wer ist für welchen Anlass zuständig), nicht technisch eingeschränkt. Im PDF-Export (siehe unten) wird automatisch nur der zum jeweiligen Anlass passende Manager angezeigt.
- **Sicherung:** Bei sich selbst kann man weder die Admin-Rechte entziehen noch sich zum Gast machen oder sich löschen. So gibt es immer mindestens einen Admin.
- **Neue Mitglieder:** mit dem «+» beim Bereich Gruppen. Dort gibt es die Option «Als Gast hinzufügen». Neue Mitglieder sind zunächst aktiv.
- **Schutz in der Datenbank:** Alle Regeln gelten nicht nur in der App. Supabase liefert Gästen keine Events und keine Jass-Daten aus, Event-Manager dürfen nur Events ändern, Chilbi Manager und Chränzli Manager nur C&C, Jass Manager nur Jass, alles andere nur Admins.

## Sprachen
Die App gibt es auf **Deutsch, Französisch, Englisch, Italienisch, Züridütsch, Appezöllerisch (Appenzeller Dialekt), Ukrainisch, Boarisch (Bayerisch), Tschechisch und Niederländisch**.
- **Auswahl:** Jede Person wählt ihre Sprache im Profil unter «Sprache». Auf der Anmeldeseite selbst steht keine Auswahl mehr (dort steht stattdessen das FBRO-Wappen), die Sprache wird dort automatisch anhand der Gerätesprache erkannt.
- **Speicherung:** Die Sprache wird im Profil bei Supabase gespeichert und gilt deshalb auf allen Geräten. Beim ersten Login wird die Sprache des Handys übernommen (Deutsch, Französisch, Englisch, Italienisch, Ukrainisch, Tschechisch oder Niederländisch, sonst Deutsch). Züridütsch, Appezöllerisch und Boarisch muss man selbst wählen.
- **Datum:** Wochentage und Monate erscheinen in der gewählten Sprache. Bei Züridütsch («Mäntig», «Septämber») und Boarisch («Mondog», «Septemba») sind sie von Hand hinterlegt.
- **Texte ändern:** Alle Texte stehen am Anfang von `app.js` im Abschnitt «Sprachen (Übersetzungen)», pro Sprache ein Block mit denselben Schlüsseln. Dort kannst du Formulierungen anpassen. Die Übersetzungen sind maschinell erstellt und sollten von Muttersprachlern gegengelesen werden, besonders Züridütsch, Boarisch, Ukrainisch und Tschechisch. Für Mundarten gibt es keine einheitliche Schreibweise. Verwendet wurde eine Zürcher beziehungsweise eine allgemein bairische Schreibweise.
- **Neue Sprache:** Einen weiteren Block im Wörterbuch ergänzen und die Sprache in den Listen `LANGS`, `LANG_NAMES`, `LANG_LOCALE` und `LANG_HTML` eintragen (bei Mundarten ohne Intl-Sprache zusätzlich in `CUSTOM_DATES`). In `supabase/schema.sql` muss die Sprache ausserdem im `check`-Befehl bei `profiles_language_check` und im Trigger `handle_new_user` stehen. Danach das Schema erneut ausführen.
- **Nicht übersetzt:** Bezeichnungen, die Admins selbst erfassen (Titel, Ort von Trainings und Events), und die Namen der Mitglieder.

## Termin im Handy-Kalender speichern
Bei jedem Event gibt es den Knopf **Im Kalender speichern**. Die App erstellt eine Kalenderdatei (.ics) mit Titel, Ort, Datum, Uhrzeit und einer Erinnerung eine Stunde vorher.
- **iPhone:** Es öffnet sich das Teilen-Menü, dort «Zum Kalender hinzufügen» wählen. Falls das Teilen-Menü nicht erscheint, wird die Datei geladen und lässt sich in «Dateien» oder im Safari-Download öffnen.
- **Android:** Die Datei wird geladen. In der Download-Meldung auf «Öffnen» tippen und den Kalender wählen.

Events haben keine Endzeit, deshalb dauert der Kalendereintrag standardmässig 2 Stunden. Die Dauer kannst du in `config.js` bei `EVENT_DURATION_MIN` ändern. Später verschobene Events werden im Kalender nicht automatisch aktualisiert. Wer den Termin schon gespeichert hat, muss ihn bei einer Änderung erneut speichern.

## Anmeldung und PIN
- **Registrierung:** Name, Handynummer und Vereinscode. Einen PIN muss niemand wählen.
- **Anmeldung:** Handynummer eingeben und anmelden. Das PIN-Feld bleibt leer, solange das Mitglied seinen PIN nicht geändert hat.
- **PIN ändern:** Im Profil kann jede Person einen eigenen 6-stelligen PIN festlegen und muss ihn dann bei der Anmeldung eintragen. Mit «Auf Standard-PIN zurücksetzen» gilt wieder die Regel mit den letzten 6 Ziffern.
- **PIN vergessen:** Ein Admin tippt unter «Verwalten → Mitglieder» auf «PIN zurücksetzen». Danach gilt für dieses Mitglied wieder der Standard-PIN.
- **Bereits registrierte Mitglieder:** Wenn du eine frühere Version verwendet hast, in der Mitglieder ihren PIN selbst gewählt haben, führe den einmaligen Befehl unter Punkt 3 am Ende von `supabase/schema.sql` aus. Er setzt bei allen Mitgliedern den PIN auf die letzten 6 Ziffern.

## Betrieb

**Update einer bestehenden Installation (v84):** `app.js`, `sw.js` und `manifest.webmanifest` ersetzen (kein `schema.sql`-Update noetig). Das Schema kannst du im SQL Editor erneut ausfuehren, es ueberschreibt keine Daten.

**Mitglied entfernen:** Supabase → Authentication → Users → Person auswählen und löschen. Ihre Antworten werden mitgelöscht.

**Vereinscode ändern:** den `insert`-Befehl aus Schritt 3 mit neuem Wert erneut ausführen.

**Kosten:** Der kostenlose Supabase-Plan reicht für einen Verein. Beachte, dass kostenlose Projekte nach etwa einer Woche ohne Aktivität pausiert werden. Bei wöchentlichem Training passiert das nicht. Eine pausierte Datenbank lässt sich im Dashboard mit einem Klick wieder aktivieren.

## Sicherheit und Datenschutz
- **Wichtig:** Der Standard-PIN ergibt sich aus der Handynummer. Wer die Nummer eines Mitglieds kennt, kann sich damit anmelden und in dessen Namen antworten. Bei Admins könnte er sogar Trainings, Events und Admin-Rechte ändern. Der Vereinscode schützt nur die Registrierung, nicht die Anmeldung. **Admins sollten deshalb im Profil einen eigenen PIN festlegen**, den niemand erraten kann. Supabase begrenzt zusätzlich die Anmeldeversuche.
- Alle angemeldeten Mitglieder sehen die Namen der anderen Mitglieder und ihre Antworten. Handynummern zeigt die App nur den Admins an. Technisch sind sie für angemeldete Mitglieder über die Datenbank-Schnittstelle abrufbar. Wenn das nicht gewünscht ist, sollte die Nummer in eine separate, nur für Admins lesbare Tabelle ausgelagert werden.
- Wenn ihr später doch eine Bestätigung per SMS möchtet, lässt sich die Anmeldung auf Supabase Phone Auth mit einem SMS-Anbieter umstellen.
- Informiere die Mitglieder kurz, welche Daten (Name, Handynummer, Antworten) gespeichert werden und wo.

## Fehlersuche
| Meldung in der App | Ursache |
|---|---|
| «Einrichtung nötig» | `config.js` enthält noch die Platzhalter |
| «Die Daten konnten nicht geladen werden» | `schema.sql` wurde nicht (vollständig) ausgeführt |
| «Bitte schalte in Supabase Confirm email aus» | Schritt 2 fehlt |
| «Registrierung nicht möglich» | Vereinscode falsch oder in Schritt 3 nicht gesetzt |
| Registrierung wird wegen der Adresse abgelehnt | In `config.js` bei `EMAIL_DOMAIN` eine andere Domain eintragen, z. B. deine Vereins-Domain |
| Registrierung oder PIN-Änderung wird als «unsicher» abgelehnt | In Supabase unter Authentication → Sign In / Providers → Email «Prevent use of leaked passwords» ausschalten (nur im Pro-Plan vorhanden) |
| Änderungen erscheinen nicht auf dem Handy | Seite neu laden. Die App holt sich neue Dateien beim nächsten Start. |
