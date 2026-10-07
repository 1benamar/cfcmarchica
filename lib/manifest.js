(function () {
  "use strict";

  var SIGN_DANGER = '<svg viewBox="0 0 100 90" role="img" aria-label="Panneau triangulaire à bordure rouge avec un point d\'exclamation"><path d="M50 6 95 85H5z" fill="#fff" stroke="#e10600" stroke-width="9" stroke-linejoin="round"/><rect x="45" y="33" width="10" height="29" fill="#0b0b0b"/><rect x="45" y="67" width="10" height="9" fill="#0b0b0b"/></svg>';
  var SIGN_STOP = '<svg viewBox="0 0 100 100" role="img" aria-label="Panneau octogonal rouge STOP"><polygon points="29.3,0 70.7,0 100,29.3 100,70.7 70.7,100 29.3,100 0,70.7 0,29.3" fill="#e10600"/><polygon points="31,5 69,5 95,31 95,69 69,95 31,95 5,69 5,31" fill="none" stroke="#fff" stroke-width="3"/><text x="50" y="61" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="30" fill="#fff">STOP</text></svg>';
  var SIGN_NO_ENTRY = '<svg viewBox="0 0 100 100" role="img" aria-label="Panneau rond rouge avec une barre blanche horizontale"><circle cx="50" cy="50" r="47" fill="#e10600"/><rect x="18" y="42" width="64" height="16" fill="#fff"/></svg>';

  window.__BRAND__ = {
    name: "CFC Marchica",
    whatsapp: "212661214201",
    phone: "+212 6 61 21 42 01",
    instagram: "cfcmarchica",

    // Horario del centro (hora de Marruecos).
    // openDays: 0 = domingo, 1 = lunes … 6 = sábado. CONFIRMAR con el centro.
    hours: { open: 9, close: 17, openDays: [1, 2, 3, 4, 5, 6], timeZone: "Africa/Casablanca" },

    waTopics: {
      inscription: "je souhaite m'inscrire à la formation carte professionnelle.",
      infos: "je voudrais des informations sur la carte professionnelle.",
      session: "je voudrais connaître la date de la prochaine session.",
      tarifs: "je voudrais connaître vos tarifs pour la carte professionnelle."
    },

    quiz: [
      {
        sign: SIGN_DANGER,
        q: "Que vous annonce ce panneau ?",
        a: ["Une interdiction", "Un danger", "Une obligation"],
        ok: 1,
        why: "Le triangle à bordure rouge signale un danger : ralentissez et redoublez d'attention."
      },
      {
        sign: SIGN_STOP,
        q: "Face à ce panneau, vous devez…",
        a: ["Ralentir et passer si la voie est libre", "Marquer un arrêt complet, puis céder le passage", "Klaxonner pour prévenir"],
        ok: 1,
        why: "STOP veut dire arrêt complet obligatoire, même si la route paraît vide, puis céder le passage."
      },
      {
        sign: SIGN_NO_ENTRY,
        q: "Ce panneau signifie…",
        a: ["Sens interdit", "Fin de toutes les interdictions", "Stationnement interdit"],
        ok: 0,
        why: "Le disque rouge barré d'un trait blanc horizontal interdit l'accès à tous les véhicules dans ce sens."
      },
      {
        sign: null,
        q: "Quel écart minimum garder avec le véhicule qui vous précède ?",
        a: ["1 seconde", "Au moins 2 secondes", "Aucun si l'on reste attentif"],
        ok: 1,
        why: "Comptez au moins 2 secondes, et davantage avec un poids lourd, une charge ou sous la pluie."
      },
      {
        sign: null,
        q: "Un piéton ou un deux-roues est-il visible par un conducteur de poids lourd s'il ne voit pas ses rétroviseurs ?",
        a: ["Oui, toujours", "Non, il est probablement dans un angle mort", "Seulement de nuit"],
        ok: 1,
        why: "Si l'on ne voit pas les rétroviseurs du camion, le conducteur ne nous voit pas : on est dans son angle mort."
      },
      {
        sign: null,
        q: "Témoin d'un accident, dans quel ordre agir ?",
        a: ["Secourir, alerter, protéger", "Alerter, secourir, protéger", "Protéger, alerter, secourir"],
        ok: 2,
        why: "D'abord protéger la zone pour éviter un sur-accident, puis alerter les secours (le 15 au Maroc), enfin secourir."
      }
    ]
  };
})();
