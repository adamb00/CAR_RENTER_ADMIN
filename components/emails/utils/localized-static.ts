export const LOCALIZED_STATIC: Record<
  string,
  {
    rentalFeeLabel: string;
    originalPriceLabel: string;
    discountedPriceLabel: string;
    depositLabel: string;
    insuranceLabel: string;
    insuranceNote: string;
    fallbackLink: string;
    adminTitle: string;
    slogans: string[];
    extrasNote: string;
    extrasLabel: string;
    deliveryFeeLabel: string;
    deliveryLocationLabel: string;
    extrasFeeLabel: string;
    daysSuffix: string;
    deliveryNote: string;
    carImagesLabel: string;
    offerLabel: string;
    priceAppliesToCarsText: (count: number) => string;
  }
> = {
  en: {
    rentalFeeLabel: 'Rental fee',
    originalPriceLabel: 'Original price',
    discountedPriceLabel: 'Discounted price',
    depositLabel: 'Deposit',
    insuranceLabel: 'Full coverage insurance',
    insuranceNote: 'If you choose full coverage, no deposit is required.',
    fallbackLink: 'If the button above does not work, open this link:',
    adminTitle: 'Rental Operations Advisor',
    slogans: ['Freedom leads.', 'Comfort follows.'],
    extrasNote: 'Selecting extras may incur additional costs.',
    extrasLabel: 'Other costs',
    deliveryFeeLabel: 'Delivery fee',
    deliveryLocationLabel: 'Delivery location',
    extrasFeeLabel: 'Extras fee',
    daysSuffix: 'days',
    deliveryNote:
      'You can request delivery to your preferred location (e.g. airport or hotel).',
    carImagesLabel: 'Car photos',
    offerLabel: 'Offer',
    priceAppliesToCarsText: (count) =>
      `The displayed price applies to ${count} ${count === 1 ? 'car' : 'cars'}.`,
  },
  hu: {
    rentalFeeLabel: 'Bérleti díj',
    originalPriceLabel: 'Eredeti ár',
    discountedPriceLabel: 'Kedvezményes ár',
    depositLabel: 'Kaució',
    insuranceLabel: 'Teljes körű biztosítás',
    insuranceNote:
      'Ha teljes körű biztosítással szeretné az autót, nincs szükség kaucióra.',
    fallbackLink: 'Ha a fenti gomb nem működik, nyisd meg ezt a linket:',
    adminTitle: 'Autóbérlési tanácsadó',
    slogans: ['A szabadság vezet.', 'A kényelem elkísér.'],
    extrasNote: 'Az extrák kiválasztásakor további költségek merülhetnek fel.',
    extrasLabel: 'Egyéb költségek',
    deliveryFeeLabel: 'Kiszállítás díja',
    deliveryLocationLabel: 'Kiszállítás ide',
    extrasFeeLabel: 'Extrák díja',
    daysSuffix: 'napra',
    deliveryNote:
      'Kérheted az autó kiszállítását a választott helyszínre (pl. reptérre vagy szállásra).',
    carImagesLabel: 'Autó fotói',
    offerLabel: 'Ajánlat',
    priceAppliesToCarsText: (count) =>
      `A feltüntetett ár ${count} autóra vonatkozik.`,
  },
  de: {
    rentalFeeLabel: 'Mietpreis',
    originalPriceLabel: 'Originalpreis',
    discountedPriceLabel: 'Aktionspreis',
    depositLabel: 'Kaution',
    insuranceLabel: 'Vollkaskoversicherung',
    insuranceNote: 'Wenn Sie Vollkasko wählen, ist keine Kaution nötig.',
    fallbackLink:
      'Wenn die Schaltfläche nicht funktioniert, öffnen Sie diesen Link:',
    adminTitle: 'Mietwagenberater',
    slogans: ['Freiheit führt.', 'Komfort begleitet.'],
    extrasNote:
      'Bei der Auswahl von Extras können zusätzliche Kosten anfallen.',
    extrasLabel: 'Weitere Kosten',
    deliveryFeeLabel: 'Liefergebühr',
    deliveryLocationLabel: 'Lieferort',
    extrasFeeLabel: 'Aufpreis für Extras',
    daysSuffix: 'Tage',
    deliveryNote:
      'Du kannst das Auto an deinen Wunschort liefern lassen (z. B. Flughafen oder Unterkunft).',
    carImagesLabel: 'Fahrzeugfotos',
    offerLabel: 'Angebot',
    priceAppliesToCarsText: (count) =>
      `Der angezeigte Preis gilt für ${count} ${count === 1 ? 'Auto' : 'Autos'}.`,
  },
  ro: {
    rentalFeeLabel: 'Taxă de închiriere',
    originalPriceLabel: 'Preț original',
    discountedPriceLabel: 'Preț redus',
    depositLabel: 'Depozit',
    insuranceLabel: 'Asigurare completă',
    insuranceNote:
      'Dacă alegeți asigurare completă, nu este necesară garanție.',
    fallbackLink: 'Dacă butonul nu funcționează, deschideți acest link:',
    adminTitle: 'Consilier operațiuni închirieri',
    slogans: ['Libertatea te conduce.', 'Confortul te însoțește.'],
    extrasNote:
      'La selectarea extraopțiunilor pot apărea costuri suplimentare.',
    extrasLabel: 'Costuri suplimentare',
    deliveryFeeLabel: 'Taxă de livrare',
    deliveryLocationLabel: 'Loc livrare',
    extrasFeeLabel: 'Taxă pentru extraopțiuni',
    daysSuffix: 'zile',
    deliveryNote:
      'Poți solicita livrarea mașinii la locația dorită (de ex. aeroport sau cazare).',
    carImagesLabel: 'Fotografii ale mașinii',
    offerLabel: 'Ofertă',
    priceAppliesToCarsText: (count) =>
      `Prețul afișat se aplică pentru ${count} ${count === 1 ? 'mașină' : 'mașini'}.`,
  },
  fr: {
    rentalFeeLabel: 'Frais de location',
    originalPriceLabel: 'Prix original',
    discountedPriceLabel: 'Prix remisé',
    depositLabel: 'Caution',
    insuranceLabel: 'Assurance tous risques',
    insuranceNote:
      "Si vous choisissez l'assurance complète, aucune caution n'est requise.",
    fallbackLink: 'Si le bouton ne fonctionne pas, ouvrez ce lien :',
    adminTitle: 'Conseiller opérations de location',
    slogans: ['La liberté vous conduit.', 'Le confort vous accompagne.'],
    extrasNote:
      'Le choix des options peut entraîner des coûts supplémentaires.',
    extrasLabel: 'Autres coûts',
    deliveryFeeLabel: 'Frais de livraison',
    deliveryLocationLabel: 'Lieu de livraison',
    extrasFeeLabel: 'Frais des options',
    daysSuffix: 'jours',
    deliveryNote:
      "Vous pouvez demander la livraison de la voiture à l'endroit de votre choix (ex. aéroport ou hébergement).",
    carImagesLabel: 'Photos du véhicule',
    offerLabel: 'Offre',
    priceAppliesToCarsText: (count) =>
      `Le prix indiqué s'applique à ${count} ${count === 1 ? 'voiture' : 'voitures'}.`,
  },
  es: {
    rentalFeeLabel: 'Tarifa de alquiler',
    originalPriceLabel: 'Precio original',
    discountedPriceLabel: 'Precio con descuento',
    depositLabel: 'Depósito',
    insuranceLabel: 'Seguro a todo riesgo',
    insuranceNote: 'Si eliges cobertura total, no se requiere depósito.',
    fallbackLink: 'Si el botón no funciona, abre este enlace:',
    adminTitle: 'Asesor de operaciones de alquiler',
    slogans: ['La libertad te conduce.', 'La comodidad te acompaña.'],
    extrasNote: 'Elegir extras puede generar costes adicionales.',
    extrasLabel: 'Costes adicionales',
    deliveryFeeLabel: 'Tarifa de entrega',
    deliveryLocationLabel: 'Lugar de entrega',
    extrasFeeLabel: 'Coste de extras',
    daysSuffix: 'días',
    deliveryNote:
      'Puedes solicitar la entrega del coche en el lugar que prefieras (p. ej., aeropuerto o alojamiento).',
    carImagesLabel: 'Fotos del vehículo',
    offerLabel: 'Oferta',
    priceAppliesToCarsText: (count) =>
      `El precio mostrado corresponde a ${count} ${count === 1 ? 'coche' : 'coches'}.`,
  },
  it: {
    rentalFeeLabel: 'Tariffa di noleggio',
    originalPriceLabel: 'Prezzo originale',
    discountedPriceLabel: 'Prezzo scontato',
    depositLabel: 'Deposito',
    insuranceLabel: 'Assicurazione completa',
    insuranceNote: 'Se scegli la copertura completa, non è richiesto deposito.',
    fallbackLink: 'Se il pulsante non funziona, apri questo link:',
    adminTitle: 'Consulente operazioni di noleggio',
    slogans: ['La libertà ti guida.', 'Il comfort ti accompagna.'],
    extrasNote: 'La scelta di extra può comportare costi aggiuntivi.',
    extrasLabel: 'Altri costi',
    deliveryFeeLabel: 'Costo consegna',
    deliveryLocationLabel: 'Località consegna',
    extrasFeeLabel: 'Costo extra',
    daysSuffix: 'giorni',
    deliveryNote:
      "Puoi richiedere la consegna dell'auto nel luogo che preferisci (es. aeroporto o alloggio).",
    carImagesLabel: "Foto dell'auto",
    offerLabel: 'Offerta',
    priceAppliesToCarsText: (count) =>
      `Il prezzo indicato si riferisce a ${count} ${count === 1 ? 'auto' : 'auto'}.`,
  },
  sk: {
    rentalFeeLabel: 'Prenájomné',
    originalPriceLabel: 'Pôvodná cena',
    discountedPriceLabel: 'Zľavnená cena',
    depositLabel: 'Kaucia',
    insuranceLabel: 'Komplexné poistenie',
    insuranceNote: 'Ak zvolíte komplexné poistenie, kaucia nie je potrebná.',
    fallbackLink: 'Ak tlačidlo nefunguje, otvor tento odkaz:',
    adminTitle: 'Poradca pre prevádzku prenájmu',
    slogans: ['Sloboda vedie.', 'Komfort sprevádza.'],
    extrasNote: 'Výber extra služieb môže priniesť dodatočné náklady.',
    extrasLabel: 'Ďalšie náklady',
    deliveryFeeLabel: 'Poplatok za doručenie',
    deliveryLocationLabel: 'Miesto doručenia',
    extrasFeeLabel: 'Poplatok za extra služby',
    daysSuffix: 'dní',
    deliveryNote:
      'Môžeš si vyžiadať doručenie auta na zvolené miesto (napr. letisko alebo ubytovanie).',
    carImagesLabel: 'Fotky vozidla',
    offerLabel: 'Ponuka',
    priceAppliesToCarsText: (count) =>
      `Uvedená cena platí pre ${count} ${count === 1 ? 'auto' : 'autá'}.`,
  },
  cz: {
    rentalFeeLabel: 'Nájemné',
    originalPriceLabel: 'Původní cena',
    discountedPriceLabel: 'Zvýhodněná cena',
    depositLabel: 'Kauce',
    insuranceLabel: 'Komplexní pojištění',
    insuranceNote: 'Pokud zvolíte plné pojištění, kauce není potřeba.',
    fallbackLink: 'Pokud tlačítko nefunguje, otevřete tento odkaz:',
    adminTitle: 'Poradce pro provoz půjčoven',
    slogans: ['Svoboda vede.', 'Komfort provází.'],
    extrasNote: 'Výběr doplňků může znamenat další náklady.',
    extrasLabel: 'Další náklady',
    deliveryFeeLabel: 'Poplatek za doručení',
    deliveryLocationLabel: 'Místo doručení',
    extrasFeeLabel: 'Poplatek za doplňky',
    daysSuffix: 'dní',
    deliveryNote:
      'Auto si můžete nechat doručit na vámi zvolené místo (např. letiště nebo ubytování).',
    carImagesLabel: 'Fotografie vozu',
    offerLabel: 'Nabídka',
    priceAppliesToCarsText: (count) =>
      `Uvedená cena platí pro ${count} ${count === 1 ? 'auto' : 'auta'}.`,
  },
  se: {
    rentalFeeLabel: 'Hyresavgift',
    originalPriceLabel: 'Ordinarie pris',
    discountedPriceLabel: 'Rabatterat pris',
    depositLabel: 'Deposition',
    insuranceLabel: 'Heltäckande försäkring',
    insuranceNote: 'Väljer du heltäckande försäkring behövs ingen deposition.',
    fallbackLink: 'Om knappen inte fungerar, öppna denna länk:',
    adminTitle: 'Rådgivare för uthyrningsverksamhet',
    slogans: ['Friheten leder.', 'Komforten följer med.'],
    extrasNote: 'Val av extra kan medföra ytterligare kostnader.',
    extrasLabel: 'Övriga kostnader',
    deliveryFeeLabel: 'Leveranskostnad',
    deliveryLocationLabel: 'Leveransplats',
    extrasFeeLabel: 'Kostnad för tillval',
    daysSuffix: 'dagar',
    deliveryNote:
      'Du kan be om leverans till valfri plats (t.ex. flygplats eller boende).',
    carImagesLabel: 'Bilfoton',
    offerLabel: 'Erbjudande',
    priceAppliesToCarsText: (count) =>
      `Det angivna priset gäller för ${count} ${count === 1 ? 'bil' : 'bilar'}.`,
  },
  no: {
    rentalFeeLabel: 'Leiepris',
    originalPriceLabel: 'Opprinnelig pris',
    discountedPriceLabel: 'Rabattert pris',
    depositLabel: 'Depositum',
    insuranceLabel: 'Full kaskoforsikring',
    insuranceNote: 'Velger du full dekning, trengs ikke depositum.',
    fallbackLink: 'Hvis knappen ikke virker, åpne denne lenken:',
    adminTitle: 'Rådgiver for leieoperasjoner',
    slogans: ['Frihet leder.', 'Komfort følger med.'],
    extrasNote: 'Valg av ekstrautstyr kan medføre ekstra kostnader.',
    extrasLabel: 'Andre kostnader',
    deliveryFeeLabel: 'Leveringsgebyr',
    deliveryLocationLabel: 'Leveringssted',
    extrasFeeLabel: 'Kostnad for ekstrautstyr',
    daysSuffix: 'dager',
    deliveryNote:
      'Du kan be om levering til ønsket sted (f.eks. flyplass eller overnatting).',
    carImagesLabel: 'Bilbilder',
    offerLabel: 'Tilbud',
    priceAppliesToCarsText: (count) =>
      `Prisen som er oppgitt gjelder for ${count} ${count === 1 ? 'bil' : 'biler'}.`,
  },
  dk: {
    rentalFeeLabel: 'Lejepris',
    originalPriceLabel: 'Oprindelig pris',
    discountedPriceLabel: 'Rabatpris',
    depositLabel: 'Depositum',
    insuranceLabel: 'Fuld kaskoforsikring',
    insuranceNote:
      'Hvis du vælger fuld dækning, er der ikke behov for depositum.',
    fallbackLink: 'Hvis knappen ikke virker, åbne dette link:',
    adminTitle: 'Rådgiver for udlejningsdrift',
    slogans: ['Frihed leder.', 'Komfort følger med.'],
    extrasNote: 'Valg af ekstraudstyr kan medføre ekstra omkostninger.',
    extrasLabel: 'Andre omkostninger',
    deliveryFeeLabel: 'Leveringsgebyr',
    deliveryLocationLabel: 'Leveringssted',
    extrasFeeLabel: 'Pris for ekstraudstyr',
    daysSuffix: 'dage',
    deliveryNote:
      'Du kan bede om levering til det ønskede sted (f.eks. lufthavn eller overnatning).',
    carImagesLabel: 'Bilfotos',
    offerLabel: 'Tilbud',
    priceAppliesToCarsText: (count) =>
      `Den viste pris gælder for ${count} ${count === 1 ? 'bil' : 'biler'}.`,
  },
  pl: {
    rentalFeeLabel: 'Opłata za wynajem',
    originalPriceLabel: 'Cena pierwotna',
    discountedPriceLabel: 'Cena promocyjna',
    depositLabel: 'Kaucja',
    insuranceLabel: 'Pełne ubezpieczenie',
    insuranceNote:
      'Jeśli wybierzesz pełne ubezpieczenie, kaucja nie jest wymagana.',
    fallbackLink: 'Jeśli przycisk nie działa, otwórz ten link:',
    adminTitle: 'Doradca ds. operacji wynajmu',
    slogans: ['Wolność prowadzi.', 'Komfort towarzyszy.'],
    extrasNote: 'Wybranie dodatków może wiązać się z dodatkowymi kosztami.',
    extrasLabel: 'Inne koszty',
    deliveryFeeLabel: 'Opłata za dostawę',
    deliveryLocationLabel: 'Miejsce dostawy',
    extrasFeeLabel: 'Opłata za dodatki',
    daysSuffix: 'dni',
    deliveryNote:
      'Możesz poprosić o dostawę auta pod wskazany adres (np. lotnisko lub nocleg).',
    carImagesLabel: 'Zdjęcia samochodu',
    offerLabel: 'Oferta',
    priceAppliesToCarsText: (count) =>
      `Podana cena dotyczy ${count} ${count === 1 ? 'samochodu' : 'samochodów'}.`,
  },
};
