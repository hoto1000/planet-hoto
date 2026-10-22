/* Planet Hoto "Customize" panel.
   Choices live in localStorage only (key "ph-customize"). No cookies, no accounts, no network calls.
   Loaded in <head> without defer so the saved choices are on <html> before first paint (no flash).
   The logic half is plain functions so tests can run it in Node with a fake storage and root. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PHCustomize = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var KEY = "ph-customize";

  // First value in each list is the default. "auto" means "follow the device".
  var OPTIONS = {
    theme: ["auto", "light", "dark", "contrast", "calm"],
    size: ["100", "115", "130", "150"],
    font: ["default", "dyslexia", "system"],
    spacing: ["normal", "relaxed", "loose"],
    motion: ["auto", "reduce"],
    density: ["comfortable", "compact", "roomy"],
    sound: ["off", "on"]
  };
  var KEYS = Object.keys(OPTIONS);

  function defaults() {
    var d = {};
    KEYS.forEach(function (k) { d[k] = OPTIONS[k][0]; });
    return d;
  }

  // Unknown keys and unknown values fall back to the default, so a hand-edited or old value can never break the page.
  function sanitize(obj) {
    var out = defaults();
    if (obj && typeof obj === "object") {
      KEYS.forEach(function (k) {
        if (typeof obj[k] === "string" && OPTIONS[k].indexOf(obj[k]) > -1) out[k] = obj[k];
      });
    }
    return out;
  }

  function isDefault(prefs) {
    return KEYS.every(function (k) { return prefs[k] === OPTIONS[k][0]; });
  }

  function load(storage) {
    try {
      var raw = storage && storage.getItem(KEY);
      return sanitize(raw ? JSON.parse(raw) : null);
    } catch (e) { return defaults(); }
  }

  // Returns true if the choice was written (false when storage is blocked, e.g. some private modes).
  function save(storage, prefs) {
    try {
      if (isDefault(prefs)) storage.removeItem(KEY);
      else storage.setItem(KEY, JSON.stringify(sanitize(prefs)));
      return true;
    } catch (e) { return false; }
  }

  function reset(storage) {
    try { storage.removeItem(KEY); } catch (e) { /* nothing stored, nothing to clear */ }
    return defaults();
  }

  // Writes the choices onto <html> as data attributes and one CSS variable. customize.css does the rest.
  function apply(el, prefs) {
    var p = sanitize(prefs);
    // data-theme is the switch the pages already use for light/dark. Setting it for every explicit choice also
    // stops the prefers-color-scheme rule from fighting a visitor who picked a theme.
    var base = { light: "light", dark: "dark", contrast: "dark", calm: "light" }[p.theme];
    if (base) { el.setAttribute("data-theme", base); el.setAttribute("data-ph-theme", p.theme); }
    else { el.removeAttribute("data-theme"); el.removeAttribute("data-ph-theme"); }
    ["font", "spacing", "motion", "density", "sound"].forEach(function (k) {
      if (p[k] === OPTIONS[k][0]) el.removeAttribute("data-ph-" + k);
      else el.setAttribute("data-ph-" + k, p[k]);
    });
    if (p.size === "100") el.style.removeProperty("--ph-ts");
    else el.style.setProperty("--ph-ts", String(Number(p.size) / 100));
    return p;
  }

  var api = {
    KEY: KEY, OPTIONS: OPTIONS, defaults: defaults, sanitize: sanitize, isDefault: isDefault,
    load: load, save: save, reset: reset, apply: apply
  };

  // Panel text. English first; the others follow the page language and are drafts, like the site's other translations.
  var S = {
    en: {
      btn: "Customize", title: "Customize this site", close: "Close", reset: "Reset to default",
      note: "Saved only on this device, in this browser. Nothing is sent anywhere, and nothing here needs an account.",
      theme: "Color theme", theme_auto: "Match my device", theme_light: "Light", theme_dark: "Dark", theme_contrast: "High contrast", theme_calm: "Calm (softer colors)",
      size: "Text size", size_100: "Default", size_115: "Large", size_130: "Larger", size_150: "Largest",
      font: "Font", font_default: "Default", font_dyslexia: "Dyslexia-friendly", font_system: "System font",
      spacing: "Line spacing", spacing_normal: "Default", spacing_relaxed: "Relaxed", spacing_loose: "Extra roomy",
      density: "Layout density", density_comfortable: "Comfortable", density_compact: "Compact", density_roomy: "Easy-read (extra space)",
      motion: "Motion", motion_auto: "Match my device", motion_reduce: "Always reduce motion",
      sound: "Sound", sound_off: "Off", sound_on: "On",
      sound_help: "There are no sounds on this site right now. If games are added, they stay silent unless you turn this on.",
      saved: "Saved on this device.", reset_done: "Back to default settings.", nostore: "Your browser blocked saving, so these choices last until you close this page."
    },
    es: {
      btn: "Personalizar", title: "Personalizar este sitio", close: "Cerrar", reset: "Restablecer",
      note: "Se guarda solo en este dispositivo y navegador. No se envía nada a ningún sitio y no hace falta una cuenta.",
      theme: "Tema de color", theme_auto: "Según mi dispositivo", theme_light: "Claro", theme_dark: "Oscuro", theme_contrast: "Alto contraste", theme_calm: "Calmado (colores suaves)",
      size: "Tamaño del texto", size_100: "Predeterminado", size_115: "Grande", size_130: "Más grande", size_150: "El más grande",
      font: "Fuente", font_default: "Predeterminada", font_dyslexia: "Apta para dislexia", font_system: "Fuente del sistema",
      spacing: "Interlineado", spacing_normal: "Predeterminado", spacing_relaxed: "Amplio", spacing_loose: "Muy amplio",
      density: "Densidad del diseño", density_comfortable: "Cómoda", density_compact: "Compacta", density_roomy: "Lectura fácil (más espacio)",
      motion: "Movimiento", motion_auto: "Según mi dispositivo", motion_reduce: "Reducir siempre el movimiento",
      sound: "Sonido", sound_off: "Desactivado", sound_on: "Activado",
      sound_help: "Ahora mismo este sitio no tiene sonidos. Si se añaden juegos, seguirán en silencio salvo que lo actives.",
      saved: "Guardado en este dispositivo.", reset_done: "Se restablecieron los valores predeterminados.", nostore: "Tu navegador bloqueó el guardado; estas opciones duran hasta que cierres la página."
    },
    pt: {
      btn: "Personalizar", title: "Personalizar este site", close: "Fechar", reset: "Restaurar padrão",
      note: "Salvo apenas neste dispositivo e navegador. Nada é enviado a lugar nenhum e não é preciso ter conta.",
      theme: "Tema de cores", theme_auto: "Seguir meu dispositivo", theme_light: "Claro", theme_dark: "Escuro", theme_contrast: "Alto contraste", theme_calm: "Calmo (cores suaves)",
      size: "Tamanho do texto", size_100: "Padrão", size_115: "Grande", size_130: "Maior", size_150: "Maior possível",
      font: "Fonte", font_default: "Padrão", font_dyslexia: "Amigável para dislexia", font_system: "Fonte do sistema",
      spacing: "Espaçamento entre linhas", spacing_normal: "Padrão", spacing_relaxed: "Amplo", spacing_loose: "Bem amplo",
      density: "Densidade do layout", density_comfortable: "Confortável", density_compact: "Compacta", density_roomy: "Leitura fácil (mais espaço)",
      motion: "Movimento", motion_auto: "Seguir meu dispositivo", motion_reduce: "Sempre reduzir o movimento",
      sound: "Som", sound_off: "Desligado", sound_on: "Ligado",
      sound_help: "No momento este site não tem sons. Se jogos forem adicionados, ficarão em silêncio a menos que você ative.",
      saved: "Salvo neste dispositivo.", reset_done: "Voltou às configurações padrão.", nostore: "Seu navegador bloqueou o salvamento; estas escolhas valem até você fechar a página."
    },
    fr: {
      btn: "Personnaliser", title: "Personnaliser ce site", close: "Fermer", reset: "Réinitialiser",
      note: "Enregistré uniquement sur cet appareil, dans ce navigateur. Rien n'est envoyé ailleurs et aucun compte n'est nécessaire.",
      theme: "Thème de couleurs", theme_auto: "Selon mon appareil", theme_light: "Clair", theme_dark: "Sombre", theme_contrast: "Contraste élevé", theme_calm: "Calme (couleurs douces)",
      size: "Taille du texte", size_100: "Par défaut", size_115: "Grande", size_130: "Plus grande", size_150: "La plus grande",
      font: "Police", font_default: "Par défaut", font_dyslexia: "Adaptée à la dyslexie", font_system: "Police du système",
      spacing: "Interligne", spacing_normal: "Par défaut", spacing_relaxed: "Aéré", spacing_loose: "Très aéré",
      density: "Densité de la mise en page", density_comfortable: "Confortable", density_compact: "Compacte", density_roomy: "Lecture facile (plus d'espace)",
      motion: "Animations", motion_auto: "Selon mon appareil", motion_reduce: "Toujours réduire les animations",
      sound: "Son", sound_off: "Désactivé", sound_on: "Activé",
      sound_help: "Ce site n'a aucun son pour l'instant. Si des jeux sont ajoutés, ils resteront silencieux sauf si vous l'activez.",
      saved: "Enregistré sur cet appareil.", reset_done: "Retour aux réglages par défaut.", nostore: "Votre navigateur a bloqué l'enregistrement ; ces choix durent jusqu'à la fermeture de la page."
    },
    de: {
      btn: "Anpassen", title: "Diese Seite anpassen", close: "Schließen", reset: "Zurücksetzen",
      note: "Wird nur auf diesem Gerät in diesem Browser gespeichert. Es wird nichts versendet und es ist kein Konto nötig.",
      theme: "Farbschema", theme_auto: "Wie mein Gerät", theme_light: "Hell", theme_dark: "Dunkel", theme_contrast: "Hoher Kontrast", theme_calm: "Ruhig (sanftere Farben)",
      size: "Textgröße", size_100: "Standard", size_115: "Groß", size_130: "Größer", size_150: "Am größten",
      font: "Schrift", font_default: "Standard", font_dyslexia: "Legasthenie-freundlich", font_system: "Systemschrift",
      spacing: "Zeilenabstand", spacing_normal: "Standard", spacing_relaxed: "Locker", spacing_loose: "Sehr locker",
      density: "Layout-Dichte", density_comfortable: "Komfortabel", density_compact: "Kompakt", density_roomy: "Leicht lesbar (mehr Platz)",
      motion: "Bewegung", motion_auto: "Wie mein Gerät", motion_reduce: "Bewegung immer reduzieren",
      sound: "Ton", sound_off: "Aus", sound_on: "An",
      sound_help: "Diese Seite hat im Moment keine Töne. Falls Spiele dazukommen, bleiben sie stumm, bis du den Ton einschaltest.",
      saved: "Auf diesem Gerät gespeichert.", reset_done: "Zurück auf Standardeinstellungen.", nostore: "Dein Browser hat das Speichern blockiert; die Auswahl gilt, bis du die Seite schließt."
    },
    hi: {
      btn: "अनुकूलित करें", title: "इस साइट को अनुकूलित करें", close: "बंद करें", reset: "डिफ़ॉल्ट पर लौटें",
      note: "यह केवल इसी डिवाइस और ब्राउज़र में सहेजा जाता है। कुछ भी कहीं नहीं भेजा जाता और खाते की ज़रूरत नहीं है।",
      theme: "रंग थीम", theme_auto: "मेरे डिवाइस के अनुसार", theme_light: "हल्का", theme_dark: "गहरा", theme_contrast: "उच्च कंट्रास्ट", theme_calm: "शांत (हल्के रंग)",
      size: "टेक्स्ट का आकार", size_100: "डिफ़ॉल्ट", size_115: "बड़ा", size_130: "और बड़ा", size_150: "सबसे बड़ा",
      font: "फ़ॉन्ट", font_default: "डिफ़ॉल्ट", font_dyslexia: "डिस्लेक्सिया के अनुकूल", font_system: "सिस्टम फ़ॉन्ट",
      spacing: "पंक्तियों के बीच की जगह", spacing_normal: "डिफ़ॉल्ट", spacing_relaxed: "खुला", spacing_loose: "बहुत खुला",
      density: "लेआउट घनत्व", density_comfortable: "आरामदायक", density_compact: "सघन", density_roomy: "आसान पढ़ाई (ज़्यादा जगह)",
      motion: "गति", motion_auto: "मेरे डिवाइस के अनुसार", motion_reduce: "हमेशा गति कम रखें",
      sound: "आवाज़", sound_off: "बंद", sound_on: "चालू",
      sound_help: "अभी इस साइट पर कोई आवाज़ नहीं है। अगर गेम जुड़ते हैं, तो आपके चालू करने तक वे शांत रहेंगे।",
      saved: "इस डिवाइस पर सहेजा गया।", reset_done: "डिफ़ॉल्ट सेटिंग पर लौट आए।", nostore: "आपके ब्राउज़र ने सहेजना रोक दिया; ये चुनाव पेज बंद होने तक रहेंगे।"
    },
    ja: {
      btn: "表示の設定", title: "このサイトの表示を設定", close: "閉じる", reset: "初期設定に戻す",
      note: "この端末のこのブラウザにのみ保存されます。何も送信されず、アカウントも不要です。",
      theme: "配色", theme_auto: "端末の設定に合わせる", theme_light: "ライト", theme_dark: "ダーク", theme_contrast: "ハイコントラスト", theme_calm: "落ち着いた色",
      size: "文字サイズ", size_100: "標準", size_115: "大", size_130: "より大きく", size_150: "最大",
      font: "フォント", font_default: "標準", font_dyslexia: "読みやすさ重視（ディスレクシア向け）", font_system: "システムフォント",
      spacing: "行間", spacing_normal: "標準", spacing_relaxed: "ゆったり", spacing_loose: "とてもゆったり",
      density: "レイアウトの密度", density_comfortable: "標準", density_compact: "コンパクト", density_roomy: "読みやすさ重視（余白を広く）",
      motion: "動き", motion_auto: "端末の設定に合わせる", motion_reduce: "常に動きを減らす",
      sound: "音", sound_off: "オフ", sound_on: "オン",
      sound_help: "現在、このサイトに音はありません。ゲームが追加されても、オンにするまで無音です。",
      saved: "この端末に保存しました。", reset_done: "初期設定に戻しました。", nostore: "ブラウザが保存をブロックしたため、この設定はページを閉じるまで有効です。"
    }
  };
  api.strings = S;

  if (typeof document === "undefined") return api;

  /* ---------- Browser half ---------- */
  var store = null;
  try { store = window.localStorage; store.getItem(KEY); } catch (e) { store = null; }
  var prefs = load(store);
  apply(document.documentElement, prefs);

  api.get = function () { return sanitize(prefs); };
  api.soundOn = function () { return prefs.sound === "on"; };


  function lang() {
    var l = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
    return S[l] ? l : "en";
  }
  function tr(k) { return S[lang()][k] || S.en[k] || k; }

  var GROUPS = [
    { key: "theme", type: "radio" }, { key: "size", type: "radio" }, { key: "font", type: "radio" },
    { key: "spacing", type: "radio" }, { key: "density", type: "radio" }, { key: "motion", type: "radio" },
    { key: "sound", type: "radio", help: "sound_help" }
  ];

  var openBtn, panel, built = false, status;

  function persist() {
    // When storage is blocked the choices still apply for this visit; they just are not kept.
    return store ? save(store, prefs) : false;
  }

  function setStatus(msg) {
    if (!status) return;
    // Clear first so repeated identical messages are still announced.
    status.textContent = "";
    setTimeout(function () { status.textContent = msg; }, 30);
  }

  function change(k, v) {
    prefs[k] = v;
    apply(document.documentElement, prefs);
    var ok = persist();
    setStatus(ok ? tr("saved") : tr("nostore"));
    try { window.dispatchEvent(new CustomEvent("ph:customize", { detail: sanitize(prefs) })); } catch (e) { /* old browser */ }
  }

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (a) { n.setAttribute(a, attrs[a]); });
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    panel.textContent = "";
    var inner = el("div", { "class": "ph-inner" });
    var head = el("div", { "class": "ph-head" });
    var h = el("h2", { id: "phTitle", tabindex: "-1" }, tr("title"));
    head.appendChild(h);
    inner.appendChild(head);
    inner.appendChild(el("p", { "class": "ph-note" }, tr("note")));

    GROUPS.forEach(function (g) {
      var fs = el("fieldset", { "class": "ph-group" });
      fs.appendChild(el("legend", {}, tr(g.key)));
      var row = el("div", { "class": "ph-opts" });
      OPTIONS[g.key].forEach(function (val) {
        var id = "ph-" + g.key + "-" + val;
        var lab = el("label", { "class": "ph-opt", "for": id });
        var inp = el("input", { type: "radio", name: "ph-" + g.key, id: id, value: val });
        if (prefs[g.key] === val) inp.checked = true;
        inp.addEventListener("change", function () { if (inp.checked) change(g.key, val); });
        lab.appendChild(inp);
        lab.appendChild(el("span", {}, tr(g.key + "_" + val)));
        row.appendChild(lab);
      });
      fs.appendChild(row);
      if (g.help) {
        var hid = "ph-" + g.key + "-help";
        fs.appendChild(el("p", { "class": "ph-help", id: hid }, tr(g.help)));
        fs.setAttribute("aria-describedby", hid);
      }
      inner.appendChild(fs);
    });

    var actions = el("div", { "class": "ph-actions" });
    var rs = el("button", { type: "button", "class": "ph-btn", id: "phReset" }, tr("reset"));
    rs.addEventListener("click", function () {
      prefs = reset(store);
      apply(document.documentElement, prefs);
      build();
      var first = panel.querySelector("#phReset");
      if (first) first.focus();
      setStatus(tr("reset_done"));
      try { window.dispatchEvent(new CustomEvent("ph:customize", { detail: sanitize(prefs) })); } catch (e) { /* old browser */ }
    });
    var cl = el("button", { type: "button", "class": "ph-btn ph-close", id: "phClose" }, tr("close"));
    cl.addEventListener("click", function () { setOpen(false, true); });
    actions.appendChild(rs);
    actions.appendChild(cl);
    inner.appendChild(actions);

    status = el("p", { "class": "ph-status", id: "phStatus", role: "status", "aria-live": "polite" });
    inner.appendChild(status);
    panel.appendChild(inner);
    built = true;
  }

  function label() {
    if (!openBtn) return;
    var t = openBtn.querySelector(".ph-open-label");
    if (t) t.textContent = tr("btn");
  }

  function setOpen(open, returnFocus) {
    if (!panel || !openBtn) return;
    if (open && !built) build();
    panel.hidden = !open;
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var h = panel.querySelector("#phTitle");
      if (h) h.focus();
    } else if (returnFocus) {
      openBtn.focus();
    }
  }

  function init() {
    openBtn = document.getElementById("phOpen");
    panel = document.getElementById("phPanel");
    if (!openBtn || !panel) return;
    label();
    openBtn.addEventListener("click", function () { setOpen(panel.hidden, false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false, true); }
    });
    // Keep the panel in the page language when the visitor switches language.
    new MutationObserver(function () { label(); if (built) { var wasOpen = !panel.hidden; var f = document.activeElement && document.activeElement.id; build(); if (wasOpen) { var again = f && document.getElementById(f); if (again) again.focus(); } } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return api;
});
