/* Datos de C.F.C.P Marchica: contacto, horario, textos dinámicos (francés y
   árabe) y preguntas del quiz. Para cambiar un teléfono o el horario, se toca
   aquí y en index.html. */
(function () {
  "use strict";

  // Señales del quiz (SVG). El texto alternativo va en ui["sign.*"].
  var SIGNS = {
    danger: '<svg viewBox="0 0 100 90"><path d="M50 6 95 85H5z" fill="#fff" stroke="#D52B1E" stroke-width="9" stroke-linejoin="round"/><rect x="45" y="32" width="10" height="30" rx="2" fill="#0E1A1C"/><rect x="45" y="67" width="10" height="9" rx="2" fill="#0E1A1C"/></svg>',
    stop: '<svg viewBox="0 0 100 100"><polygon points="29.3,0 70.7,0 100,29.3 100,70.7 70.7,100 29.3,100 0,70.7 0,29.3" fill="#D52B1E"/><polygon points="31,5 69,5 95,31 95,69 69,95 31,95 5,69 5,31" fill="none" stroke="#fff" stroke-width="3"/><text x="50" y="61" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" fill="#fff">STOP</text></svg>',
    noentry: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#D52B1E"/><rect x="18" y="42" width="64" height="16" rx="2" fill="#fff"/></svg>'
  };

  window.__BRAND__ = {
    name: "C.F.C.P Marchica",
    whatsapp: "212755846785",

    titles: {
      fr: "C.F.C.P Marchica · Carte professionnelle à Nador",
      ar: "مركز مارشيكا · البطاقة المهنية بالناظور"
    },

    // Horario del centro en hora de Marruecos.
    // openDays: 0 = domingo, 1 = lunes … 6 = sábado (CONFIRMAR con el centro).
    hours: { open: 9, close: 17, openDays: [1, 2, 3, 4, 5, 6], timeZone: "Africa/Casablanca" },

    signs: SIGNS,

    // Textos que pinta el JavaScript
    ui: {
      "st.open": { fr: "Ouvert · ferme à {h}", ar: "مفتوح الآن · يغلق على {h}" },
      "st.later": { fr: "Fermé · ouvre à {h}", ar: "مغلق · يفتح على {h}" },
      "st.next": { fr: "Fermé · ouvre {d} à {h}", ar: "مغلق · يفتح {d} على {h}" },
      "st.tomorrow": { fr: "demain", ar: "غداً" },
      "days": {
        fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
        ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
      },
      "video.pause": { fr: "Mettre la vidéo en pause", ar: "إيقاف الفيديو مؤقتاً" },
      "video.play": { fr: "Lire la vidéo", ar: "تشغيل الفيديو" },
      "docs.0": { fr: "Liste indicative, confirmée à l'inscription.", ar: "لائحة إرشادية، تُؤكَّد عند التسجيل." },
      "docs.1": { fr: "Un document, c'est un début.", ar: "وثيقة واحدة، بداية جيدة." },
      "docs.2": { fr: "La moitié du chemin.", ar: "نصف الطريق." },
      "docs.3": { fr: "Plus qu'un document.", ar: "بقيت وثيقة واحدة." },
      "docs.4": { fr: "Dossier prêt : passez nous voir.", ar: "ملفك جاهز: مرحباً بك في المركز." },
      "quiz.count": { fr: "6 questions", ar: "6 أسئلة" },
      "quiz.q": { fr: "Question {n} / {t}", ar: "السؤال {n} / {t}" },
      "quiz.done": { fr: "Résultat", ar: "النتيجة" },
      "quiz.right": { fr: "Bonne réponse.", ar: "إجابة صحيحة." },
      "quiz.wrong": { fr: "Pas tout à fait.", ar: "ليس تماماً." },
      "quiz.next": { fr: "Question suivante", ar: "السؤال التالي" },
      "quiz.see": { fr: "Voir mon résultat", ar: "عرض النتيجة" },
      "quiz.again": { fr: "Recommencer", ar: "أعد المحاولة" },
      "quiz.cta": { fr: "Réserver ma place", ar: "احجز مقعدك" },
      "quiz.r3": { fr: "Sans faute. Il ne vous manque que la carte.", ar: "بدون أخطاء. لا ينقصك إلا البطاقة." },
      "quiz.r2": { fr: "Très bien. Quelques réflexes à affiner avec nous.", ar: "جيد جداً. بعض ردود الفعل نصقلها معاً." },
      "quiz.r1": { fr: "La formation est faite pour ça : on reprend tout ensemble.", ar: "التكوين وُجد لهذا: نراجع كل شيء معاً." },
      "keys": { fr: ["A", "B", "C"], ar: ["أ", "ب", "ج"] },
      "sign.danger": { fr: "Panneau triangulaire à bordure rouge avec un point d'exclamation", ar: "علامة مثلثة بإطار أحمر وعلامة تعجب" },
      "sign.stop": { fr: "Panneau octogonal rouge STOP", ar: "علامة قف حمراء مثمنة الأضلاع" },
      "sign.noentry": { fr: "Panneau rond rouge avec une barre blanche horizontale", ar: "علامة دائرية حمراء بخط أبيض أفقي" }
    },

    // Mensaje de WhatsApp
    msg: {
      fr: {
        hello: "Bonjour C.F.C.P Marchica",
        me: ", je m'appelle {n}",
        want: "Je souhaite {o}",
        forma: " pour la formation «\u00a0{f}\u00a0»",
        nsp: " ; je ne sais pas encore quelle formation choisir",
        objets: {
          inscription: "m'inscrire",
          infos: "avoir des informations",
          session: "connaître la date de la prochaine session",
          tarifs: "connaître vos tarifs"
        },
        formations: {
          taxi: "taxi",
          autocar: "autocar (voyageurs)",
          poids: "poids lourd (marchandises)",
          minibus: "transport touristique et du personnel"
        }
      },
      ar: {
        hello: "السلام عليكم مركز مارشيكا",
        me: "، اسمي {n}",
        want: "أرغب في {o}",
        forma: " بخصوص تكوين «{f}»",
        nsp: "، ولم أقرر بعد أي تكوين أختار",
        objets: {
          inscription: "التسجيل",
          infos: "الحصول على معلومات",
          session: "معرفة موعد الدورة القادمة",
          tarifs: "معرفة الأثمنة"
        },
        formations: {
          taxi: "سيارة الأجرة",
          autocar: "الحافلة (نقل المسافرين)",
          poids: "الشاحنة (نقل البضائع)",
          minibus: "النقل السياحي ونقل المستخدمين"
        }
      }
    },

    quiz: [
      {
        sign: "danger", ok: 1,
        fr: { q: "Que vous annonce ce panneau ?", a: ["Une interdiction", "Un danger", "Une obligation"],
          why: "Le triangle à bordure rouge signale un danger : ralentissez et redoublez d'attention." },
        ar: { q: "ماذا تعني هذه العلامة؟", a: ["منع", "خطر", "إلزام"],
          why: "المثلث ذو الإطار الأحمر يشير إلى خطر: خفّف السرعة وضاعف الانتباه." }
      },
      {
        sign: "stop", ok: 1,
        fr: { q: "Face à ce panneau, vous devez…", a: ["Ralentir et passer si la voie est libre", "Marquer un arrêt complet, puis céder le passage", "Klaxonner pour prévenir"],
          why: "STOP veut dire arrêt complet obligatoire, même si la route paraît vide, puis céder le passage." },
        ar: { q: "أمام هذه العلامة يجب عليك…", a: ["تخفيف السرعة والمرور إذا كانت الطريق فارغة", "التوقف التام ثم إعطاء حق الأسبقية", "استعمال المنبه للتنبيه"],
          why: "علامة «قف» تعني التوقف التام الإجباري، حتى لو بدت الطريق فارغة، ثم إعطاء حق الأسبقية." }
      },
      {
        sign: "noentry", ok: 0,
        fr: { q: "Ce panneau signifie…", a: ["Sens interdit", "Fin de toutes les interdictions", "Stationnement interdit"],
          why: "Le disque rouge barré d'un trait blanc horizontal interdit l'accès à tous les véhicules dans ce sens." },
        ar: { q: "هذه العلامة تعني…", a: ["ممنوع الدخول", "نهاية جميع الممنوعات", "ممنوع الوقوف"],
          why: "القرص الأحمر بخط أبيض أفقي يمنع دخول جميع المركبات في هذا الاتجاه." }
      },
      {
        sign: null, ok: 1,
        fr: { q: "Quel écart minimum garder avec le véhicule qui vous précède ?", a: ["1 seconde", "Au moins 2 secondes", "Aucun si l'on reste attentif"],
          why: "Comptez au moins 2 secondes, et davantage avec un poids lourd, une charge ou sous la pluie." },
        ar: { q: "ما هي أدنى مسافة يجب تركها مع المركبة التي أمامك؟", a: ["ثانية واحدة", "ثانيتان على الأقل", "لا شيء إذا بقيتَ منتبهاً"],
          why: "احسب ثانيتين على الأقل، وأكثر مع شاحنة أو حمولة أو تحت المطر." }
      },
      {
        sign: null, ok: 1,
        fr: { q: "Vous ne voyez pas les rétroviseurs du camion devant vous. Son chauffeur vous voit-il ?", a: ["Oui, toujours", "Non, vous êtes sans doute dans son angle mort", "Seulement de nuit"],
          why: "Si vous ne voyez pas ses rétroviseurs, le chauffeur ne vous voit pas : vous êtes dans son angle mort." },
        ar: { q: "لا ترى مرايا الشاحنة التي أمامك. هل يراك سائقها؟", a: ["نعم، دائماً", "لا، أنت على الأرجح في زاويته الميتة", "فقط في الليل"],
          why: "إذا لم ترَ مراياه فهو لا يراك: أنت في زاويته الميتة." }
      },
      {
        sign: null, ok: 2,
        fr: { q: "Témoin d'un accident, dans quel ordre agir ?", a: ["Secourir, alerter, protéger", "Alerter, secourir, protéger", "Protéger, alerter, secourir"],
          why: "D'abord protéger la zone pour éviter un sur-accident, puis alerter les secours (le 15 au Maroc), enfin secourir." },
        ar: { q: "إذا شهدت حادثة سير، بأي ترتيب تتصرف؟", a: ["الإسعاف، الإبلاغ، الحماية", "الإبلاغ، الإسعاف، الحماية", "الحماية، الإبلاغ، الإسعاف"],
          why: "أولاً احمِ المكان لتفادي حادثة ثانية، ثم أبلغ الإسعاف (الرقم 15 في المغرب)، وأخيراً قدّم الإسعاف." }
      }
    ]
  };
})();
