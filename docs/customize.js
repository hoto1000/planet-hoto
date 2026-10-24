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
    sound: ["off", "on"],
    accent: ["default", "blue", "purple", "green", "rose"],
    links: ["default", "underline"],
    width: ["default", "narrow", "wide"],
    radius: ["default", "square", "round"],
    columns: ["default", "single"],
    focus: ["default", "thick"],
    ruler: ["off", "on"],
    letter: ["default", "wide", "wider"],
    word: ["default", "wide", "wider"],
    para: ["default", "wide"]
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
    ["font", "spacing", "motion", "density", "sound", "accent", "links", "width", "radius", "columns", "focus", "ruler", "letter", "word", "para"].forEach(function (k) {
      if (p[k] === OPTIONS[k][0]) el.removeAttribute("data-ph-" + k);
      else el.setAttribute("data-ph-" + k, p[k]);
    });
    if (p.size === "100") el.style.removeProperty("--ph-ts");
    else el.style.setProperty("--ph-ts", String(Number(p.size) / 100));
    return p;
  }

  // Returns sanitized prefs from an exported file's text, or null if it is not one of ours.
  function parseImport(text) {
    try {
      var o = JSON.parse(text);
      if (!o || o.app !== "planet-hoto" || !o.settings || typeof o.settings !== "object") return null;
      return sanitize(o.settings);
    } catch (e) { return null; }
  }

  var api = {
    KEY: KEY, OPTIONS: OPTIONS, defaults: defaults, sanitize: sanitize, isDefault: isDefault,
    load: load, save: save, reset: reset, apply: apply, parseImport: parseImport
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

  // Strings for the extra options. Option labels fall back to the shared opt_* keys below.
  var MORE = {
    en: {
      sec_color: "Colors", sec_text: "Text", sec_layout: "Layout", sec_read: "Reading and motion", sec_file: "Save or move your settings",
      accent: "Accent color", links: "Links", width: "Page width", radius: "Corners", columns: "Columns", focus: "Keyboard focus outline", ruler: "Reading ruler",
      letter: "Letter spacing", word: "Word spacing", para: "Paragraph spacing",
      opt_default: "Default", opt_off: "Off", opt_on: "On", opt_narrow: "Narrow", opt_wide: "Wide", opt_wider: "Wider", opt_square: "Square", opt_round: "Round",
      opt_thick: "Thicker", opt_underline: "Always underlined", opt_single: "Single column",
      accent_blue: "Blue", accent_purple: "Purple", accent_green: "Green", accent_rose: "Rose",
      ruler_help: "A soft band follows your pointer or the item you tab to, to help you keep your place.",
      file_help: "Your settings can be saved to a file on this device and loaded again later, for example on another browser. Nothing is uploaded.",
      export: "Save settings to a file", import: "Load settings from a file", imported: "Settings loaded.", import_bad: "That file is not a Project Hoto settings file."
    },
    es: {
      sec_color: "Colores", sec_text: "Texto", sec_layout: "Diseño", sec_read: "Lectura y movimiento", sec_file: "Guardar o mover tus ajustes",
      accent: "Color de acento", links: "Enlaces", width: "Ancho de página", radius: "Esquinas", columns: "Columnas", focus: "Contorno de foco del teclado", ruler: "Regla de lectura",
      letter: "Espaciado entre letras", word: "Espaciado entre palabras", para: "Espaciado entre párrafos",
      opt_default: "Predeterminado", opt_off: "Desactivado", opt_on: "Activado", opt_narrow: "Estrecho", opt_wide: "Ancho", opt_wider: "Más ancho", opt_square: "Cuadradas", opt_round: "Redondeadas",
      opt_thick: "Más grueso", opt_underline: "Siempre subrayados", opt_single: "Una columna",
      accent_blue: "Azul", accent_purple: "Morado", accent_green: "Verde", accent_rose: "Rosa",
      ruler_help: "Una banda suave sigue el puntero o el elemento al que llegas con el tabulador, para ayudarte a no perder el lugar.",
      file_help: "Tus ajustes se pueden guardar en un archivo en este dispositivo y cargarse más tarde, por ejemplo en otro navegador. No se sube nada.",
      export: "Guardar ajustes en un archivo", import: "Cargar ajustes desde un archivo", imported: "Ajustes cargados.", import_bad: "Ese archivo no es un archivo de ajustes de Project Hoto."
    },
    pt: {
      sec_color: "Cores", sec_text: "Texto", sec_layout: "Layout", sec_read: "Leitura e movimento", sec_file: "Salvar ou levar suas configurações",
      accent: "Cor de destaque", links: "Links", width: "Largura da página", radius: "Cantos", columns: "Colunas", focus: "Contorno de foco do teclado", ruler: "Régua de leitura",
      letter: "Espaçamento entre letras", word: "Espaçamento entre palavras", para: "Espaçamento entre parágrafos",
      opt_default: "Padrão", opt_off: "Desligado", opt_on: "Ligado", opt_narrow: "Estreita", opt_wide: "Larga", opt_wider: "Mais larga", opt_square: "Quadrados", opt_round: "Arredondados",
      opt_thick: "Mais grosso", opt_underline: "Sempre sublinhados", opt_single: "Uma coluna",
      accent_blue: "Azul", accent_purple: "Roxo", accent_green: "Verde", accent_rose: "Rosa",
      ruler_help: "Uma faixa suave acompanha o ponteiro ou o item que você alcança com a tecla Tab, para ajudar a não perder o lugar.",
      file_help: "Suas configurações podem ser salvas em um arquivo neste dispositivo e carregadas depois, por exemplo em outro navegador. Nada é enviado.",
      export: "Salvar configurações em arquivo", import: "Carregar configurações de arquivo", imported: "Configurações carregadas.", import_bad: "Esse arquivo não é um arquivo de configurações do Project Hoto."
    },
    fr: {
      sec_color: "Couleurs", sec_text: "Texte", sec_layout: "Mise en page", sec_read: "Lecture et animations", sec_file: "Enregistrer ou déplacer vos réglages",
      accent: "Couleur d'accent", links: "Liens", width: "Largeur de la page", radius: "Coins", columns: "Colonnes", focus: "Contour du focus clavier", ruler: "Règle de lecture",
      letter: "Espacement des lettres", word: "Espacement des mots", para: "Espacement des paragraphes",
      opt_default: "Par défaut", opt_off: "Désactivé", opt_on: "Activé", opt_narrow: "Étroite", opt_wide: "Large", opt_wider: "Plus large", opt_square: "Carrés", opt_round: "Arrondis",
      opt_thick: "Plus épais", opt_underline: "Toujours soulignés", opt_single: "Une colonne",
      accent_blue: "Bleu", accent_purple: "Violet", accent_green: "Vert", accent_rose: "Rose",
      ruler_help: "Une bande douce suit le pointeur ou l'élément atteint avec la touche Tab, pour vous aider à garder votre place.",
      file_help: "Vos réglages peuvent être enregistrés dans un fichier sur cet appareil et rechargés plus tard, par exemple dans un autre navigateur. Rien n'est envoyé.",
      export: "Enregistrer les réglages dans un fichier", import: "Charger les réglages depuis un fichier", imported: "Réglages chargés.", import_bad: "Ce fichier n'est pas un fichier de réglages Project Hoto."
    },
    de: {
      sec_color: "Farben", sec_text: "Text", sec_layout: "Layout", sec_read: "Lesen und Bewegung", sec_file: "Einstellungen sichern oder mitnehmen",
      accent: "Akzentfarbe", links: "Links", width: "Seitenbreite", radius: "Ecken", columns: "Spalten", focus: "Tastatur-Fokusrahmen", ruler: "Leselineal",
      letter: "Buchstabenabstand", word: "Wortabstand", para: "Absatzabstand",
      opt_default: "Standard", opt_off: "Aus", opt_on: "An", opt_narrow: "Schmal", opt_wide: "Breit", opt_wider: "Breiter", opt_square: "Eckig", opt_round: "Rund",
      opt_thick: "Dicker", opt_underline: "Immer unterstrichen", opt_single: "Eine Spalte",
      accent_blue: "Blau", accent_purple: "Violett", accent_green: "Grün", accent_rose: "Rosa",
      ruler_help: "Ein weiches Band folgt dem Zeiger oder dem Element, zu dem du mit Tab springst, damit du nicht die Zeile verlierst.",
      file_help: "Deine Einstellungen lassen sich in einer Datei auf diesem Gerät sichern und später wieder laden, zum Beispiel in einem anderen Browser. Es wird nichts hochgeladen.",
      export: "Einstellungen in Datei speichern", import: "Einstellungen aus Datei laden", imported: "Einstellungen geladen.", import_bad: "Diese Datei ist keine Project-Hoto-Einstellungsdatei."
    },
    hi: {
      sec_color: "रंग", sec_text: "टेक्स्ट", sec_layout: "लेआउट", sec_read: "पढ़ना और गति", sec_file: "अपनी सेटिंग सहेजें या साथ ले जाएँ",
      accent: "एक्सेंट रंग", links: "लिंक", width: "पेज की चौड़ाई", radius: "कोने", columns: "कॉलम", focus: "कीबोर्ड फ़ोकस की रेखा", ruler: "पढ़ने की पट्टी",
      letter: "अक्षरों के बीच की जगह", word: "शब्दों के बीच की जगह", para: "अनुच्छेदों के बीच की जगह",
      opt_default: "डिफ़ॉल्ट", opt_off: "बंद", opt_on: "चालू", opt_narrow: "संकरा", opt_wide: "चौड़ा", opt_wider: "और चौड़ा", opt_square: "चौकोर", opt_round: "गोल",
      opt_thick: "और मोटी", opt_underline: "हमेशा रेखांकित", opt_single: "एक कॉलम",
      accent_blue: "नीला", accent_purple: "बैंगनी", accent_green: "हरा", accent_rose: "गुलाबी",
      ruler_help: "एक हल्की पट्टी आपके पॉइंटर या Tab से चुने गए हिस्से के साथ चलती है, ताकि आप अपनी जगह न खोएँ।",
      file_help: "आपकी सेटिंग इस डिवाइस पर एक फ़ाइल में सहेजी जा सकती है और बाद में दोबारा लोड की जा सकती है, जैसे किसी दूसरे ब्राउज़र में। कुछ भी अपलोड नहीं होता।",
      export: "सेटिंग फ़ाइल में सहेजें", import: "फ़ाइल से सेटिंग लोड करें", imported: "सेटिंग लोड हो गईं।", import_bad: "यह Project Hoto की सेटिंग फ़ाइल नहीं है।"
    },
    ja: {
      sec_color: "色", sec_text: "文字", sec_layout: "レイアウト", sec_read: "読みやすさと動き", sec_file: "設定の保存と移行",
      accent: "アクセントカラー", links: "リンク", width: "ページの幅", radius: "角", columns: "段組み", focus: "キーボードフォーカスの枠", ruler: "読み取りルーラー",
      letter: "文字間隔", word: "単語の間隔", para: "段落の間隔",
      opt_default: "標準", opt_off: "オフ", opt_on: "オン", opt_narrow: "狭い", opt_wide: "広い", opt_wider: "さらに広い", opt_square: "四角", opt_round: "丸み",
      opt_thick: "太く", opt_underline: "常に下線", opt_single: "1列",
      accent_blue: "青", accent_purple: "紫", accent_green: "緑", accent_rose: "ピンク",
      ruler_help: "ポインターやTabキーで移動した項目に合わせて淡い帯が動き、読んでいる位置を見失わないようにします。",
      file_help: "設定はこの端末のファイルに保存し、あとで別のブラウザなどで読み込めます。何もアップロードされません。",
      export: "設定をファイルに保存", import: "ファイルから設定を読み込む", imported: "設定を読み込みました。", import_bad: "Project Hotoの設定ファイルではありません。"
    }
  };
  Object.keys(MORE).forEach(function (l) { Object.keys(MORE[l]).forEach(function (k) { S[l][k] = MORE[l][k]; }); });
  api.strings = S;

  if (typeof document === "undefined") return api;

  /* ---------- Browser half ---------- */
  var store = null;
  try { store = window.localStorage; store.getItem(KEY); } catch (e) { store = null; }
  var prefs = load(store);
  apply(document.documentElement, prefs);
  document.documentElement.classList.add("ph-js");

  api.get = function () { return sanitize(prefs); };
  api.soundOn = function () { return prefs.sound === "on"; };


  function lang() {
    var l = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
    return S[l] ? l : "en";
  }
  function tr(k) { return S[lang()][k] || S.en[k] || k; }
  // Option label: the group's own key (theme_dark) or the shared one (opt_default).
  function optLabel(group, val) { var k = group + "_" + val; return S.en[k] ? tr(k) : tr("opt_" + val); }

  // Panel sections: each is a <details> holding labelled radio groups.
  var SECTIONS = [
    { key: "sec_color", open: true, groups: [{ key: "theme" }, { key: "accent" }] },
    { key: "sec_text", open: true, groups: [{ key: "size" }, { key: "font" }, { key: "spacing" }, { key: "letter" }, { key: "word" }, { key: "para" }] },
    { key: "sec_layout", groups: [{ key: "density" }, { key: "width" }, { key: "columns" }, { key: "radius" }] },
    { key: "sec_read", groups: [{ key: "ruler", help: "ruler_help" }, { key: "links" }, { key: "focus" }, { key: "motion" }, { key: "sound", help: "sound_help" }] }
  ];

  var openBtn, panel, built = false, status;

  // Reading ruler: a soft band that follows the pointer, or the focused element when you tab. Purely visual.
  var ruler = null;
  function moveRuler(y) { if (ruler) ruler.style.transform = "translateY(" + Math.round(y) + "px)"; }
  function syncRuler() {
    if (prefs.ruler === "on" && !ruler) {
      ruler = document.createElement("div");
      ruler.className = "ph-ruler"; ruler.setAttribute("aria-hidden", "true");
      ruler.style.transform = "translateY(-9999px)"; // parked until the first pointer or focus move, so it never tints the 988/911 bar at load
      document.documentElement.appendChild(ruler);
    } else if (prefs.ruler !== "on" && ruler) { ruler.parentNode.removeChild(ruler); ruler = null; }
  }
  document.addEventListener("pointermove", function (e) { if (ruler) moveRuler(e.clientY - ruler.offsetHeight / 2); }, { passive: true });
  document.addEventListener("focusin", function (e) { if (ruler && e.target.getBoundingClientRect) { var r = e.target.getBoundingClientRect(); moveRuler(r.top + r.height / 2 - ruler.offsetHeight / 2); } });
  window.addEventListener("ph:customize", syncRuler);
  document.addEventListener("DOMContentLoaded", syncRuler);

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

  function exportFile() {
    var data = { app: "planet-hoto", version: 1, settings: sanitize(prefs) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "planet-hoto-settings.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Reads a settings file the visitor picked. Parsed locally; only known keys and values are kept.
  function importFile(input) {
    var f = input.files && input.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      var parsed = parseImport(String(rd.result));
      if (!parsed) { setStatus(tr("import_bad")); return; }
      prefs = parsed;
      apply(document.documentElement, prefs);
      persist();
      build();
      setStatus(tr("imported"));
      try { window.dispatchEvent(new CustomEvent("ph:customize", { detail: sanitize(prefs) })); } catch (e) { /* old browser */ }
    };
    rd.onerror = function () { setStatus(tr("import_bad")); };
    rd.readAsText(f.size > 20000 ? f.slice(0, 20000) : f);
  }

  function build() {
    panel.textContent = "";
    var inner = el("div", { "class": "ph-inner" });
    var head = el("div", { "class": "ph-head" });
    var h = el("h2", { id: "phTitle", tabindex: "-1" }, tr("title"));
    head.appendChild(h);
    inner.appendChild(head);
    inner.appendChild(el("p", { "class": "ph-note" }, tr("note")));

    SECTIONS.forEach(function (sec) {
      var det = el("details", { "class": "ph-sec" });
      if (sec.open) det.setAttribute("open", "");
      det.appendChild(el("summary", {}, tr(sec.key)));
      sec.groups.forEach(function (g) {
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
          lab.appendChild(el("span", {}, optLabel(g.key, val)));
          row.appendChild(lab);
        });
        fs.appendChild(row);
        if (g.help) {
          var hid = "ph-" + g.key + "-help";
          fs.appendChild(el("p", { "class": "ph-help", id: hid }, tr(g.help)));
          fs.setAttribute("aria-describedby", hid);
        }
        det.appendChild(fs);
      });
      inner.appendChild(det);
    });

    // Save / load settings as a local file. Nothing leaves the device.
    var fsec = el("details", { "class": "ph-sec" });
    fsec.appendChild(el("summary", {}, tr("sec_file")));
    fsec.appendChild(el("p", { "class": "ph-help" }, tr("file_help")));
    var frow = el("div", { "class": "ph-actions" });
    var ex = el("button", { type: "button", "class": "ph-btn", id: "phExport" }, tr("export"));
    ex.addEventListener("click", exportFile);
    var im = el("button", { type: "button", "class": "ph-btn", id: "phImport" }, tr("import"));
    var file = el("input", { type: "file", accept: ".json,application/json", id: "phFile", "class": "ph-file", tabindex: "-1", "aria-hidden": "true" });
    im.addEventListener("click", function () { file.click(); });
    file.addEventListener("change", function () { importFile(file); });
    frow.appendChild(ex); frow.appendChild(im); frow.appendChild(file);
    fsec.appendChild(frow);
    inner.appendChild(fsec);

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
