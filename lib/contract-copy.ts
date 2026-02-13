export const LOCALES = [
  'hu',
  'en',
  'de',
  'ro',
  'fr',
  'es',
  'it',
  'sk',
  'cz',
  'se',
  'no',
  'dk',
  'pl',
] as const;

export type ContractLocale = (typeof LOCALES)[number];

type ContractDetailLabels = {
  bookingId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  vehicle: string;
  period: string;
  pickupLocation: string;
  pickupAddress: string;
};

type ContractBodyCopy = {
  lessorHeading: string;
  companyLabel: string;
  addressLabel: string;
  registrationLabel: string;
  renterHeading: string;
  renterLabel: string;
  birthLabel: string;
  idNumberLabel: string;
  idExpiryLabel: string;
  licenseLabel: string;
  phoneLabel: string;
  vehicleDetailsHeading: string;
  carTypeLabel: string;
  licensePlateLabel: string;
  rentalFeesHeading: string;
  rentalFeeLabel: string;
  depositLabel: string;
  insuranceLabel: string;
  depositParagraph: string;
  insuranceParagraph: string;
  rentalPeriodHeading: string;
  rentalStartLabel: string;
  rentalEndLabel: string;
  rentalTermsHeading: string;
  rentalTermsLines: string[];
  section1Heading: string;
  section1DriverLine: string;
  section1DocumentsLine: string;
  section1PaymentHeading: string;
  section1CashLine: string;
  section1CardLine: string;
  section1DepositLine: string;
  section1FullInsuranceLine: string;
  section2Heading: string;
  section2Intro: string;
  section2WrongFuel: string;
  section2Keys: string;
  section2OffRoad: string;
  section2Alcohol: string;
  section2Fines: string;
  section2UnauthorizedIsland: string;
  section3Heading: string;
  section3Island: string;
  section3Fuel: string;
  section3Cancellation: string;
  declarationHeading: string;
  declarationParagraph1: string;
  declarationParagraph2: string;
  declarationParagraph3: string;
  dateLine: string;
  cityLine: string;
};

export type ContractCopy = {
  title: string;
  intro: string;
  detailLabels: ContractDetailLabels;
  rentalDaysUnit: string;
  rentalFeePerDaySuffix: string;
  terms: string[];
  footer: string;
  body: ContractBodyCopy;
};

const EN_COPY: ContractCopy = {
  title: 'CAR RENTAL AGREEMENT',
  intro:
    'This rental agreement is concluded between ZODIACS Rent a Car (Lessor) and the Renter.',
  detailLabels: {
    bookingId: 'Booking ID',
    renterName: 'Renter name',
    renterEmail: 'Renter email',
    renterPhone: 'Renter phone',
    vehicle: 'Rented vehicle',
    period: 'Rental period',
    pickupLocation: 'Pickup location',
    pickupAddress: 'Pickup address',
  },
  rentalDaysUnit: 'days',
  rentalFeePerDaySuffix: 'EUR/day',
  terms: [
    'The Renter shall use the vehicle properly and comply with traffic rules.',
    'The Renter must promptly report any damage to the vehicle.',
    'The vehicle must be returned at the agreed location at the end of the rental period.',
    'Rental fees, deposit and other charges are settled according to the booking terms.',
    'This agreement is valid with an electronic signature as well.',
  ],
  footer:
    'By signing, the Renter confirms that they have inspected the vehicle and accept the conditions.',
  body: {
    lessorHeading: 'Lessor (Rental Company):',
    companyLabel: 'Company:',
    addressLabel: 'Address:',
    registrationLabel: 'Registration number:',
    renterHeading: 'Renter:',
    renterLabel: 'Renter:',
    birthLabel: 'Place and date of birth:',
    idNumberLabel: 'ID number:',
    idExpiryLabel: 'ID card expiry date:',
    licenseLabel: "Driver's license number:",
    phoneLabel: 'Phone number:',
    vehicleDetailsHeading: 'Vehicle details:',
    carTypeLabel: 'Car type:',
    licensePlateLabel: 'License plate number:',
    rentalFeesHeading: 'Rental fees',
    rentalFeeLabel: 'Rental fee:',
    depositLabel: 'Deposit:',
    insuranceLabel: 'Insurance:',
    depositParagraph:
      'The deposit is an optional alternative to Full Insurance. The deposit is fully refunded at the end of the rental if the vehicle is returned in flawless condition. In case of any damage to the vehicle, the deposit will not be refunded.',
    insuranceParagraph:
      'Insurance is the deductible, which covers the costs of any vehicle damage. It is non-refundable.',
    rentalPeriodHeading: 'Rental period',
    rentalStartLabel: 'Rental start date:',
    rentalEndLabel: 'Rental end date:',
    rentalTermsHeading: 'Rental terms and conditions:',
    rentalTermsLines: [
      'The rental period applies to the period stated in this agreement. Extension is possible if notified 48 hours before expiry; a new contract will be sent to the Renter. Physical or online presentation of the car is required to start the new contract.',
      'By signing, the Renter accepts the terms and declares that their data is accurate.',
      'The Renter is reminded of the importance of complying with traffic regulations and safe driving.',
      'All legal liability and monetary penalties arising from violations of traffic rules are borne by the Renter.',
      'If the vehicle is returned in an extremely dirty condition, the Lessor will charge a 50 € cleaning fee.',
    ],
    section1Heading: '1. BASIC REQUIREMENTS',
    section1DriverLine:
      '· Driver minimum requirements: The Renter/Driver is over 25 years old and has held a valid category B driving license for at least 2 years.',
    section1DocumentsLine:
      '· Document validity: The Renter’s documents and driving license must be valid for the entire rental period and accepted within the EU.',
    section1PaymentHeading:
      '· Payment: At vehicle pickup the payment methods can be:',
    section1CashLine: '· Cash',
    section1CardLine: '· Bank card (VISA, Mastercard, Revolut, etc.)',
    section1DepositLine: '· Deposit: a 500 € deposit is required.',
    section1FullInsuranceLine:
      '· Full insurance according to the offer; the insurance fully replaces the deposit.',
    section2Heading: '2. INSURANCE EXCLUSIONS',
    section2Intro:
      'Insurance does not cover the following incidents; the costs are fully borne by the Renter, who is obliged to compensate. This obligation also remains after the rental ends.',
    section2WrongFuel: '· Damage caused by refueling with the wrong fuel.',
    section2Keys: '· Loss, breakage or damage of vehicle keys.',
    section2OffRoad:
      '· Damage, puncture, towing and repair costs resulting from off-road driving (non-paved roads).',
    section2Alcohol:
      '· Accident/damage caused or suffered under the influence of alcohol, drugs, or any substance that impairs driving abilities.',
    section2Fines: '· Traffic fines and their administration fees.',
    section2UnauthorizedIsland:
      '· Any damage resulting from using the vehicle on an unauthorized island.',
    section3Heading: '3. USE AND RETURN RULES',
    section3Island:
      '· Leaving the island is PROHIBITED: The vehicle may not leave the island where it was rented (only by separate agreement).',
    section3Fuel:
      '· Fuel: The vehicle must be returned with the same fuel level as at pickup. The range indicator based on the current fuel level is authoritative.',
    section3Cancellation:
      '· Cancellation / Refund: No pro-rated refund is possible in case of early termination of the rental.',
    declarationHeading: 'III. DECLARATION AND SIGNATURE',
    declarationParagraph1:
      'This agreement is an integral and inseparable part of the General Terms and Conditions (GTC) annex, available on our website www.zodiacsrentacar.com, or directly at: link.',
    declarationParagraph2:
      "Reviewing the GTC is in the Renter's interest; not reviewing it is the Renter's decision and does not exempt them from its applicability.",
    declarationParagraph3:
      'The Renter declares that they have read and accept the terms of this agreement and the GTC annex. They acknowledge that Spanish law applies to this agreement. Jurisdiction: the Canary',
    dateLine: 'Date: ..................................................... (Date)',
    cityLine: 'City name, <<Custom.Today>> Caleta de Fuste',
  },
};

const HU_COPY: ContractCopy = {
  title: 'BÉRLETI SZERZŐDÉS',
  intro:
    'Jelen bérleti szerződés létrejött a ZODIACS Rent a Car (Bérbeadó) és a Bérlő között.',
  detailLabels: {
    bookingId: 'Foglalás azonosító',
    renterName: 'Bérlő neve',
    renterEmail: 'Bérlő e-mail',
    renterPhone: 'Bérlő telefon',
    vehicle: 'Bérelt jármű',
    period: 'Bérleti időszak',
    pickupLocation: 'Átvétel helye',
    pickupAddress: 'Átvétel címe',
  },
  rentalDaysUnit: 'nap',
  rentalFeePerDaySuffix: 'EUR/nap',
  terms: [
    'A Bérlő a járművet rendeltetésszerűen használja, és köteles betartani a közlekedési szabályokat.',
    'A jármű állapotában bekövetkezett károkat a Bérlő köteles haladéktalanul jelezni.',
    'A járművet a bérleti időszak végén a felek által egyeztetett helyszínen kell visszaszolgáltatni.',
    'A bérleti díj, kaució és egyéb díjak rendezése a foglalásban megadott feltételek szerint történik.',
    'A jelen szerződés elektronikus aláírással is érvényes.',
  ],
  footer:
    'A Bérlő a szerződés aláírásával igazolja, hogy a jármű állapotát megismerte és a feltételeket elfogadja.',
  body: {
    lessorHeading: 'Bérbeadó:',
    companyLabel: 'Cég:',
    addressLabel: 'Cím:',
    registrationLabel: 'Cégjegyzék szám:',
    renterHeading: 'Bérlő:',
    renterLabel: 'Bérlő:',
    birthLabel: 'Születési hely és idő:',
    idNumberLabel: 'Személyi igazolvány szám:',
    idExpiryLabel: 'Személyi igazolvány érvényessége:',
    licenseLabel: 'Jogosítvány száma:',
    phoneLabel: 'Telefonszám:',
    vehicleDetailsHeading: 'Jármű adatok:',
    carTypeLabel: 'Autó típus:',
    licensePlateLabel: 'Rendszám:',
    rentalFeesHeading: 'Bérleti díjak',
    rentalFeeLabel: 'Bérleti díj:',
    depositLabel: 'Letét:',
    insuranceLabel: 'Biztosítás:',
    depositParagraph:
      'Letét opcionális lehetőség a Full biztosítás helyett. A letéti díjat a bérlet végén, hibátlan állapotban történő visszaadás esetén, a bérlő számára teljes mértékben visszaadjuk. Az autó bármilyen sérülése esetén a letéti díj nem kerül visszatérítésre.',
    insuranceParagraph:
      'A biztosítás a biztosítás önrésze, amely bármely járműsérülés esetén fedezi annak költségeit. Nem visszatéríthető összeg.',
    rentalPeriodHeading: 'Bérleti időszak',
    rentalStartLabel: 'Bérlet kezdete:',
    rentalEndLabel: 'Bérlet vége:',
    rentalTermsHeading: 'Bérleti feltételek:',
    rentalTermsLines: [
      'A bérleti időszak a szerződésben megjelölt időszakra értendő. Meghosszabbítása a lejárat előtt jelzett 48 órával lehetséges, melyről új szerződést küldünk a bérlő számára. Az autó fizikai vagy online bemutatása szükséges ebben az esetben az új szerződés elindításához.',
      'A bérlő a szerződés aláírásával elfogadja az abban foglaltakat, valamint nyilatkozik adatai hitelességéről.',
      'Felhívjuk a bérlő figyelmét a KRESZ szabályok betartásának fontosságára és a biztonságos közlekedés fontosságára.',
      'A KRESZ szabályainak megszegéséből adódó minden törvényi felelősség és pénzben kirótt büntetés a bérlőt terheli.',
      'Az autó extrém koszos állapotban történő visszaadása esetén 50 € takarítási díjat számít fel a bérbeadó a bérlőnek.',
    ],
    section1Heading: '1. ALAPVETŐ ELŐFELTÉTELEK',
    section1DriverLine:
      '· Sofőr minimumfeltételei: A bérlő/sofőr 25 évnél idősebb és legalább 2 éve rendelkezik érvényes B kategóriás vezetői engedéllyel.',
    section1DocumentsLine:
      '· Okmányok érvényessége: A bérlő okmányainak és vezetői engedélyének a teljes bérleti idő alatt érvényesnek és az EU területén elfogadottnak kell lennie.',
    section1PaymentHeading:
      '· Fizetés: A jármű átvételekor a fizetés módja lehet:',
    section1CashLine: '· Készpénz',
    section1CardLine: '· Bankkártya (VISA, Mastercard, Revolut, stb.)',
    section1DepositLine: '· Kaució: 500 € kaució (letét) fizetése szükséges.',
    section1FullInsuranceLine:
      '· Teljes körű biztosítás ajánlat szerint, a biztosítás teljes mértékben kiváltja a kauciót.',
    section2Heading: '2. BIZTOSÍTÁSI KIZÁRÁSOK',
    section2Intro:
      'Biztosítás az alábbi káreseményekre nem nyújt fedezetet, ezen károk költségeit teljes mértékben a bérlő viseli. Ezen kötelezettség a bérlet lezárását követően is fennáll a bérlő irányában.',
    section2WrongFuel: '· Rossz üzemanyag tankolása esetén keletkező kár.',
    section2Keys: '· A jármű kulcsainak elvesztése, törése vagy károsodása.',
    section2OffRoad:
      '· Terepvezetés (nem szilárd burkolatú út) következtében felmerülő kár, defekt, mentési és javítási költség.',
    section2Alcohol:
      '· Baleset/kár okozása vagy elszenvedése alkohol, kábítószer vagy bármely bódultságot okozó, a vezetési képességeket befolyásoló szer hatása alatt.',
    section2Fines: '· Közlekedési bírságok és azok ügyintézési díjai.',
    section2UnauthorizedIsland:
      '· Bármely kár, amely a jármű nem engedélyezett szigeten való használatából ered.',
    section3Heading: '3. HASZNÁLATI ÉS VISSZAVÉTELI SZABÁLYOK',
    section3Island:
      '· Szigetelhagyás TILOS: A jármű nem hagyhatja el azt a szigetet, ahol bérelték (csak külön megállapodás alapján).',
    section3Fuel:
      '· Üzemanyag: A járművet az átvételivel megegyező szintű üzemanyaggal kell visszaszolgáltatni. Az autó aktuális üzemanyag mennyiséggel megtehető km jelzése az irányadó.',
    section3Cancellation:
      '· Lemondás / Visszatérítés: Időarányos visszatérítés a bérlet időelőtti befejezése esetén nem lehetséges.',
    declarationHeading: 'III. NYILATKOZAT ÉS ALÁÍRÁS',
    declarationParagraph1:
      'Jelen szerződés szerves és elidegeníthetetlen része az Általános Szerződési Feltételek (ÁSZF) melléklet, mely megismerhető a www.zodiacsrentacar.com weboldalunkon, vagy közvetlenül a: link-en.',
    declarationParagraph2:
      'Az ÁSZF megismerése a bérlő érdeke, annak nem megismerése a bérlő döntése, és nem mentesít annak hatálya alól.',
    declarationParagraph3:
      'A bérlő kijelenti, hogy a jelen szerződésben és az ÁSZF mellékletben foglaltakat megismerte és elfogadja. Tudomásul veszi, hogy a szerződésre a spanyol jog alkalmazandó. Joghatóság: a Kanári',
    dateLine: 'Kelt: ..................................................... (Dátum)',
    cityLine: 'Város, <<Custom.Today>> Caleta de Fuste',
  },
};

const DE_COPY: ContractCopy = {
  title: 'MIETVERTRAG',
  intro:
    'Dieser Mietvertrag wird zwischen ZODIACS Rent a Car (Vermieter) und dem Mieter geschlossen.',
  detailLabels: {
    bookingId: 'Buchungsnummer',
    renterName: 'Name des Mieters',
    renterEmail: 'E-Mail des Mieters',
    renterPhone: 'Telefon des Mieters',
    vehicle: 'Gemietetes Fahrzeug',
    period: 'Mietzeitraum',
    pickupLocation: 'Abholort',
    pickupAddress: 'Abholadresse',
  },
  rentalDaysUnit: 'Tage',
  rentalFeePerDaySuffix: 'EUR/Tag',
  terms: [
    'Der Mieter nutzt das Fahrzeug ordnungsgemäß und hält die Verkehrsregeln ein.',
    'Der Mieter muss Schäden am Fahrzeug unverzüglich melden.',
    'Das Fahrzeug ist am Ende der Mietdauer am vereinbarten Ort zurückzugeben.',
    'Mietpreis, Kaution und weitere Gebühren werden gemäß den Buchungsbedingungen beglichen.',
    'Dieser Vertrag ist auch mit elektronischer Unterschrift gültig.',
  ],
  footer:
    'Mit der Unterschrift bestätigt der Mieter, dass er den Zustand des Fahrzeugs kennt und die Bedingungen akzeptiert.',
  body: {
    lessorHeading: 'Vermieter:',
    companyLabel: 'Firma:',
    addressLabel: 'Adresse:',
    registrationLabel: 'Handelsregisternummer:',
    renterHeading: 'Mieter:',
    renterLabel: 'Mieter:',
    birthLabel: 'Geburtsort und -datum:',
    idNumberLabel: 'Ausweisnummer:',
    idExpiryLabel: 'Gültigkeit des Ausweises:',
    licenseLabel: 'Führerscheinnummer:',
    phoneLabel: 'Telefonnummer:',
    vehicleDetailsHeading: 'Fahrzeugdaten:',
    carTypeLabel: 'Fahrzeugtyp:',
    licensePlateLabel: 'Kennzeichen:',
    rentalFeesHeading: 'Mietgebühren',
    rentalFeeLabel: 'Mietpreis:',
    depositLabel: 'Kaution:',
    insuranceLabel: 'Versicherung:',
    depositParagraph:
      'Die Kaution ist eine optionale Alternative zur Vollversicherung. Die Kaution wird am Ende der Mietzeit vollständig erstattet, wenn das Fahrzeug in einwandfreiem Zustand zurückgegeben wird. Bei jeglichen Schäden wird die Kaution nicht erstattet.',
    insuranceParagraph:
      'Die Versicherung entspricht dem Selbstbehalt und deckt die Kosten bei Fahrzeugschäden. Sie ist nicht erstattungsfähig.',
    rentalPeriodHeading: 'Mietzeitraum',
    rentalStartLabel: 'Mietbeginn:',
    rentalEndLabel: 'Mietende:',
    rentalTermsHeading: 'Mietbedingungen:',
    rentalTermsLines: [
      'Der Mietzeitraum gilt für den im Vertrag angegebenen Zeitraum. Eine Verlängerung ist möglich, wenn 48 Stunden vor Ablauf informiert wird; ein neuer Vertrag wird dem Mieter zugesandt. Eine physische oder Online-Vorstellung des Fahrzeugs ist in diesem Fall erforderlich.',
      'Mit der Unterschrift akzeptiert der Mieter die Bedingungen und bestätigt die Richtigkeit seiner Angaben.',
      'Wir weisen den Mieter auf die Bedeutung der Einhaltung der Verkehrsregeln und der sicheren Fahrweise hin.',
      'Alle rechtlichen Verantwortlichkeiten und Geldstrafen aus Verstößen gegen Verkehrsregeln trägt der Mieter.',
      'Wird das Fahrzeug extrem verschmutzt zurückgegeben, berechnet der Vermieter eine Reinigungsgebühr von 50 €.',
    ],
    section1Heading: '1. GRUNDLEGENDE VORAUSSETZUNGEN',
    section1DriverLine:
      '· Mindestanforderungen an den Fahrer: Der Mieter/Fahrer ist über 25 Jahre alt und besitzt seit mindestens 2 Jahren einen gültigen Führerschein der Klasse B.',
    section1DocumentsLine:
      '· Gültigkeit der Dokumente: Ausweisdokumente und Führerschein des Mieters müssen während der gesamten Mietdauer gültig und in der EU anerkannt sein.',
    section1PaymentHeading:
      '· Zahlung: Bei Fahrzeugübernahme sind folgende Zahlungsmethoden möglich:',
    section1CashLine: '· Barzahlung',
    section1CardLine: '· Bankkarte (VISA, Mastercard, Revolut usw.)',
    section1DepositLine: '· Kaution: Eine Kaution von 500 € ist erforderlich.',
    section1FullInsuranceLine:
      '· Vollversicherung gemäß Angebot; die Versicherung ersetzt die Kaution vollständig.',
    section2Heading: '2. VERSICHERUNGSAUSSCHLÜSSE',
    section2Intro:
      'Die Versicherung deckt die folgenden Schadensfälle nicht ab; die Kosten trägt der Mieter vollständig. Diese Verpflichtung besteht auch nach Ende der Mietzeit.',
    section2WrongFuel: '· Schaden durch Betankung mit falschem Kraftstoff.',
    section2Keys: '· Verlust, Bruch oder Beschädigung der Fahrzeugschlüssel.',
    section2OffRoad:
      '· Schäden, Reifenpannen sowie Bergungs- und Reparaturkosten durch Offroad-Fahrten (unbefestigte Straßen).',
    section2Alcohol:
      '· Unfall/Schaden verursacht oder erlitten unter Alkohol-, Drogen- oder sonstigem Einfluss, der die Fahrtüchtigkeit beeinträchtigt.',
    section2Fines: '· Verkehrsbußgelder und deren Bearbeitungsgebühren.',
    section2UnauthorizedIsland:
      '· Jeglicher Schaden durch Nutzung des Fahrzeugs auf einer nicht genehmigten Insel.',
    section3Heading: '3. NUTZUNGS- UND RÜCKGABEREGELN',
    section3Island:
      '· Verlassen der Insel VERBOTEN: Das Fahrzeug darf die Insel, auf der es gemietet wurde, nicht verlassen (nur nach gesonderter Vereinbarung).',
    section3Fuel:
      '· Kraftstoff: Das Fahrzeug muss mit dem gleichen Kraftstoffstand wie bei der Übernahme zurückgegeben werden. Maßgeblich ist die Reichweitenanzeige bei aktuellem Kraftstoffstand.',
    section3Cancellation:
      '· Stornierung / Rückerstattung: Bei vorzeitiger Beendigung der Miete ist keine anteilige Rückerstattung möglich.',
    declarationHeading: 'III. ERKLÄRUNG UND UNTERSCHRIFT',
    declarationParagraph1:
      'Dieser Vertrag ist ein integraler und untrennbarer Bestandteil der Allgemeinen Geschäftsbedingungen (AGB) als Anhang, einsehbar auf unserer Website www.zodiacsrentacar.com oder direkt unter: link.',
    declarationParagraph2:
      'Die Kenntnisnahme der AGB liegt im Interesse des Mieters; deren Nichtkenntnisnahme ist seine Entscheidung und befreit nicht von ihrer Geltung.',
    declarationParagraph3:
      'Der Mieter erklärt, dass er die Bedingungen dieses Vertrags und den AGB-Anhang gelesen und akzeptiert hat. Er erkennt an, dass spanisches Recht gilt. Gerichtsstand: die Kanaren',
    dateLine: 'Datum: ..................................................... (Datum)',
    cityLine: 'Ort, <<Custom.Today>> Caleta de Fuste',
  },
};

const RO_COPY: ContractCopy = {
  title: 'CONTRACT DE ÎNCHIRIERE AUTO',
  intro:
    'Prezentul contract de închiriere este încheiat între ZODIACS Rent a Car (Locator) și Chiriaș.',
  detailLabels: {
    bookingId: 'ID rezervare',
    renterName: 'Nume chiriaș',
    renterEmail: 'E-mail chiriaș',
    renterPhone: 'Telefon chiriaș',
    vehicle: 'Vehicul închiriat',
    period: 'Perioada de închiriere',
    pickupLocation: 'Locul preluării',
    pickupAddress: 'Adresa preluării',
  },
  rentalDaysUnit: 'zile',
  rentalFeePerDaySuffix: 'EUR/zi',
  terms: [
    'Chiriașul folosește vehiculul corespunzător și respectă regulile de circulație.',
    'Chiriașul trebuie să raporteze imediat orice daună a vehiculului.',
    'Vehiculul trebuie returnat la locația convenită la sfârșitul perioadei de închiriere.',
    'Taxele de închiriere, garanția și alte costuri se achită conform condițiilor rezervării.',
    'Prezentul contract este valabil și cu semnătură electronică.',
  ],
  footer:
    'Prin semnare, Chiriașul confirmă că a verificat vehiculul și acceptă condițiile.',
  body: {
    lessorHeading: 'Locator:',
    companyLabel: 'Companie:',
    addressLabel: 'Adresă:',
    registrationLabel: 'Număr de înregistrare:',
    renterHeading: 'Chiriaș:',
    renterLabel: 'Chiriaș:',
    birthLabel: 'Locul și data nașterii:',
    idNumberLabel: 'Număr act de identitate:',
    idExpiryLabel: 'Valabilitate act de identitate:',
    licenseLabel: 'Număr permis de conducere:',
    phoneLabel: 'Număr de telefon:',
    vehicleDetailsHeading: 'Detalii vehicul:',
    carTypeLabel: 'Tip vehicul:',
    licensePlateLabel: 'Număr de înmatriculare:',
    rentalFeesHeading: 'Taxe de închiriere',
    rentalFeeLabel: 'Taxă de închiriere:',
    depositLabel: 'Garanție:',
    insuranceLabel: 'Asigurare:',
    depositParagraph:
      'Garanția este o opțiune alternativă la Asigurarea Full. Garanția se returnează integral la finalul închirierii dacă vehiculul este predat în stare impecabilă. În cazul oricărei avarii, garanția nu se restituie.',
    insuranceParagraph:
      'Asigurarea reprezintă franșiza și acoperă costurile oricăror daune ale vehiculului. Este nereturnabilă.',
    rentalPeriodHeading: 'Perioada de închiriere',
    rentalStartLabel: 'Data începerii:',
    rentalEndLabel: 'Data încheierii:',
    rentalTermsHeading: 'Condiții de închiriere:',
    rentalTermsLines: [
      'Perioada de închiriere se referă la intervalul menționat în contract. Prelungirea este posibilă dacă se notifică cu 48 de ore înainte de expirare; se va trimite un nou contract Chiriașului. Prezentarea fizică sau online a vehiculului este necesară în acest caz.',
      'Prin semnare, Chiriașul acceptă condițiile și declară că datele sale sunt corecte.',
      'Atragerea atenției asupra respectării regulilor de circulație și a conducerii în siguranță.',
      'Orice răspundere legală și amendă rezultată din încălcarea regulilor de circulație revine Chiriașului.',
      'Dacă vehiculul este returnat extrem de murdar, Locatorul va percepe o taxă de curățare de 50 €.',
    ],
    section1Heading: '1. CERINȚE DE BAZĂ',
    section1DriverLine:
      '· Cerințe minime pentru șofer: Chiriașul/Șoferul are peste 25 de ani și deține permis categoria B de cel puțin 2 ani.',
    section1DocumentsLine:
      '· Valabilitatea documentelor: Documentele și permisul Chiriașului trebuie să fie valabile pe toată perioada și acceptate în UE.',
    section1PaymentHeading:
      '· Plată: La preluarea vehiculului, metodele de plată pot fi:',
    section1CashLine: '· Numerar',
    section1CardLine: '· Card bancar (VISA, Mastercard, Revolut etc.)',
    section1DepositLine: '· Garanție: este necesară o garanție de 500 €.',
    section1FullInsuranceLine:
      '· Asigurare completă conform ofertei; asigurarea înlocuiește integral garanția.',
    section2Heading: '2. EXCLUDERI ALE ASIGURĂRII',
    section2Intro:
      'Asigurarea nu acoperă următoarele evenimente; costurile sunt suportate integral de Chiriaș, care este obligat să le despăgubească. Această obligație rămâne și după încheierea închirierii.',
    section2WrongFuel:
      '· Daune cauzate de alimentarea cu combustibil greșit.',
    section2Keys:
      '· Pierderea, ruperea sau deteriorarea cheilor vehiculului.',
    section2OffRoad:
      '· Daune, pană, costuri de tractare și reparații rezultate din condus off-road (drumuri neasfaltate).',
    section2Alcohol:
      '· Accident/daună cauzată sau suferită sub influența alcoolului, drogurilor sau a oricărei substanțe care afectează capacitatea de conducere.',
    section2Fines: '· Amenzi de circulație și taxe de administrare.',
    section2UnauthorizedIsland:
      '· Orice daună rezultată din utilizarea vehiculului pe o insulă neautorizată.',
    section3Heading: '3. REGULI DE UTILIZARE ȘI RETURNARE',
    section3Island:
      '· Părăsirea insulei este INTERZISĂ: Vehiculul nu poate părăsi insula unde a fost închiriat (doar cu acord separat).',
    section3Fuel:
      '· Combustibil: Vehiculul trebuie returnat cu același nivel de combustibil ca la preluare. Indicatorul de autonomie este orientativ.',
    section3Cancellation:
      '· Anulare / Rambursare: Nu este posibilă rambursarea proporțională în cazul încheierii anticipate a închirierii.',
    declarationHeading: 'III. DECLARAȚIE ȘI SEMNĂTURĂ',
    declarationParagraph1:
      'Prezentul contract este parte integrantă și inseparabilă a anexei Termenilor și Condițiilor Generale (TCG), disponibilă pe site-ul nostru www.zodiacsrentacar.com sau direct la: link.',
    declarationParagraph2:
      'Cunoașterea TCG este în interesul Chiriașului; necunoașterea este decizia sa și nu îl exonerează de aplicabilitatea acestora.',
    declarationParagraph3:
      'Chiriașul declară că a citit și acceptă condițiile prezentului contract și anexei TCG. Ia act că se aplică legea spaniolă. Jurisdicție: Canare',
    dateLine: 'Data: ..................................................... (Data)',
    cityLine: 'Oraș, <<Custom.Today>> Caleta de Fuste',
  },
};

const FR_COPY: ContractCopy = {
  title: 'CONTRAT DE LOCATION DE VOITURE',
  intro:
    'Le présent contrat de location est conclu entre ZODIACS Rent a Car (Bailleur) et le Locataire.',
  detailLabels: {
    bookingId: 'ID de réservation',
    renterName: 'Nom du locataire',
    renterEmail: 'E-mail du locataire',
    renterPhone: 'Téléphone du locataire',
    vehicle: 'Véhicule loué',
    period: 'Période de location',
    pickupLocation: 'Lieu de prise en charge',
    pickupAddress: 'Adresse de prise en charge',
  },
  rentalDaysUnit: 'jours',
  rentalFeePerDaySuffix: 'EUR/jour',
  terms: [
    'Le Locataire utilise le véhicule correctement et respecte le code de la route.',
    'Le Locataire doit signaler immédiatement tout dommage au véhicule.',
    'Le véhicule doit être restitué au lieu convenu à la fin de la période de location.',
    "Les frais de location, la caution et les autres frais sont réglés selon les conditions de réservation.",
    'Le présent contrat est également valable avec une signature électronique.',
  ],
  footer:
    'En signant, le Locataire confirme avoir inspecté le véhicule et accepte les conditions.',
  body: {
    lessorHeading: 'Bailleur :',
    companyLabel: 'Société :',
    addressLabel: 'Adresse :',
    registrationLabel: "Numéro d'enregistrement :",
    renterHeading: 'Locataire :',
    renterLabel: 'Locataire :',
    birthLabel: 'Lieu et date de naissance :',
    idNumberLabel: "Numéro de pièce d'identité :",
    idExpiryLabel: "Date d'expiration de la pièce d'identité :",
    licenseLabel: 'Numéro de permis de conduire :',
    phoneLabel: 'Numéro de téléphone :',
    vehicleDetailsHeading: 'Détails du véhicule :',
    carTypeLabel: 'Type de voiture :',
    licensePlateLabel: "Numéro d'immatriculation :",
    rentalFeesHeading: 'Frais de location',
    rentalFeeLabel: 'Frais de location :',
    depositLabel: 'Caution :',
    insuranceLabel: 'Assurance :',
    depositParagraph:
      "La caution est une alternative optionnelle à l'assurance Full. La caution est intégralement remboursée à la fin de la location si le véhicule est restitué en parfait état. En cas de dommages, la caution ne sera pas remboursée.",
    insuranceParagraph:
      "L'assurance correspond à la franchise et couvre les coûts de tout dommage du véhicule. Elle n'est pas remboursable.",
    rentalPeriodHeading: 'Période de location',
    rentalStartLabel: 'Date de début :',
    rentalEndLabel: 'Date de fin :',
    rentalTermsHeading: 'Conditions de location :',
    rentalTermsLines: [
      'La période de location s’applique à la période indiquée dans le contrat. Une prolongation est possible si elle est signalée 48 heures avant l’échéance ; un nouveau contrat sera envoyé au Locataire. Une présentation physique ou en ligne du véhicule est requise dans ce cas.',
      'En signant, le Locataire accepte les conditions et déclare l’exactitude de ses données.',
      'Nous rappelons au Locataire l’importance du respect du code de la route et de la conduite en sécurité.',
      'Toute responsabilité légale et amende résultant de violations du code de la route est à la charge du Locataire.',
      'Si le véhicule est rendu dans un état extrêmement sale, le Bailleur facturera 50 € de frais de nettoyage.',
    ],
    section1Heading: '1. CONDITIONS DE BASE',
    section1DriverLine:
      '· Exigences minimales du conducteur : Le Locataire/Conducteur a plus de 25 ans et possède un permis de catégorie B valide depuis au moins 2 ans.',
    section1DocumentsLine:
      '· Validité des documents : Les documents et le permis du Locataire doivent être valides pendant toute la période et acceptés dans l’UE.',
    section1PaymentHeading:
      "· Paiement : À la remise du véhicule, les modes de paiement possibles sont :",
    section1CashLine: '· Espèces',
    section1CardLine: '· Carte bancaire (VISA, Mastercard, Revolut, etc.)',
    section1DepositLine: '· Caution : une caution de 500 € est requise.',
    section1FullInsuranceLine:
      '· Assurance complète selon l’offre ; l’assurance remplace entièrement la caution.',
    section2Heading: '2. EXCLUSIONS D’ASSURANCE',
    section2Intro:
      "L'assurance ne couvre pas les incidents suivants ; les coûts sont entièrement à la charge du Locataire, qui est tenu d'indemniser. Cette obligation demeure après la fin de la location.",
    section2WrongFuel:
      '· Dommages causés par un mauvais carburant.',
    section2Keys:
      '· Perte, casse ou détérioration des clés du véhicule.',
    section2OffRoad:
      '· Dommages, crevaisons, frais de remorquage et de réparation résultant de la conduite hors route (routes non revêtues).',
    section2Alcohol:
      '· Accident/dommage causé ou subi sous l’influence de l’alcool, de drogues ou de toute substance altérant les capacités de conduite.',
    section2Fines: '· Amendes routières et frais de gestion.',
    section2UnauthorizedIsland:
      '· Tout dommage résultant de l’utilisation du véhicule sur une île non autorisée.',
    section3Heading: '3. RÈGLES D’UTILISATION ET DE RETOUR',
    section3Island:
      '· Sortie de l’île INTERDITE : Le véhicule ne peut pas quitter l’île où il a été loué (uniquement sur accord séparé).',
    section3Fuel:
      '· Carburant : Le véhicule doit être restitué avec le même niveau de carburant qu’à la prise en charge. L’indicateur d’autonomie est la référence.',
    section3Cancellation:
      '· Annulation / Remboursement : Aucun remboursement au prorata n’est possible en cas de fin anticipée de la location.',
    declarationHeading: 'III. DÉCLARATION ET SIGNATURE',
    declarationParagraph1:
      'Le présent contrat fait partie intégrante et indissociable de l’annexe des Conditions Générales (CG), consultable sur notre site www.zodiacsrentacar.com ou directement à : link.',
    declarationParagraph2:
      'La prise de connaissance des CG est dans l’intérêt du Locataire ; ne pas les lire est son choix et ne l’exonère pas de leur applicabilité.',
    declarationParagraph3:
      'Le Locataire déclare avoir lu et accepté les termes du présent contrat et de l’annexe CG. Il reconnaît que le droit espagnol s’applique. Juridiction : les Canaries',
    dateLine: 'Date : ..................................................... (Date)',
    cityLine: 'Ville, <<Custom.Today>> Caleta de Fuste',
  },
};

const ES_COPY: ContractCopy = {
  title: 'CONTRATO DE ALQUILER DE VEHÍCULO',
  intro:
    'Este contrato de alquiler se celebra entre ZODIACS Rent a Car (Arrendador) y el Arrendatario.',
  detailLabels: {
    bookingId: 'ID de reserva',
    renterName: 'Nombre del arrendatario',
    renterEmail: 'Correo del arrendatario',
    renterPhone: 'Teléfono del arrendatario',
    vehicle: 'Vehículo alquilado',
    period: 'Periodo de alquiler',
    pickupLocation: 'Lugar de recogida',
    pickupAddress: 'Dirección de recogida',
  },
  rentalDaysUnit: 'días',
  rentalFeePerDaySuffix: 'EUR/día',
  terms: [
    'El Arrendatario usará el vehículo correctamente y respetará las normas de tráfico.',
    'El Arrendatario deberá informar inmediatamente cualquier daño del vehículo.',
    'El vehículo debe devolverse en el lugar acordado al final del periodo de alquiler.',
    'Las tarifas de alquiler, la fianza y otros cargos se liquidan según las condiciones de la reserva.',
    'Este contrato es válido también con firma electrónica.',
  ],
  footer:
    'Al firmar, el Arrendatario confirma que ha inspeccionado el vehículo y acepta las condiciones.',
  body: {
    lessorHeading: 'Arrendador:',
    companyLabel: 'Empresa:',
    addressLabel: 'Dirección:',
    registrationLabel: 'Número de registro:',
    renterHeading: 'Arrendatario:',
    renterLabel: 'Arrendatario:',
    birthLabel: 'Lugar y fecha de nacimiento:',
    idNumberLabel: 'Número de identificación:',
    idExpiryLabel: 'Validez del documento de identidad:',
    licenseLabel: 'Número de permiso de conducir:',
    phoneLabel: 'Número de teléfono:',
    vehicleDetailsHeading: 'Datos del vehículo:',
    carTypeLabel: 'Tipo de coche:',
    licensePlateLabel: 'Matrícula:',
    rentalFeesHeading: 'Tarifas de alquiler',
    rentalFeeLabel: 'Tarifa de alquiler:',
    depositLabel: 'Fianza:',
    insuranceLabel: 'Seguro:',
    depositParagraph:
      'La fianza es una alternativa opcional al Seguro Full. La fianza se devuelve íntegramente al final del alquiler si el vehículo se devuelve en perfecto estado. En caso de cualquier daño, la fianza no se reembolsará.',
    insuranceParagraph:
      'El seguro corresponde a la franquicia y cubre los costes de cualquier daño del vehículo. No es reembolsable.',
    rentalPeriodHeading: 'Periodo de alquiler',
    rentalStartLabel: 'Fecha de inicio:',
    rentalEndLabel: 'Fecha de fin:',
    rentalTermsHeading: 'Términos y condiciones:',
    rentalTermsLines: [
      'El periodo de alquiler se refiere al intervalo indicado en el contrato. La extensión es posible si se notifica 48 horas antes del vencimiento; se enviará un nuevo contrato al Arrendatario. Se requiere la presentación física u online del vehículo en ese caso.',
      'Al firmar, el Arrendatario acepta las condiciones y declara la veracidad de sus datos.',
      'Se recuerda al Arrendatario la importancia de respetar las normas de tráfico y conducir con seguridad.',
      'Toda responsabilidad legal y multas derivadas de infracciones de tráfico serán a cargo del Arrendatario.',
      'Si el vehículo se devuelve en un estado extremadamente sucio, el Arrendador cobrará una tarifa de limpieza de 50 €.',
    ],
    section1Heading: '1. REQUISITOS BÁSICOS',
    section1DriverLine:
      '· Requisitos mínimos del conductor: El Arrendatario/Conductor tiene más de 25 años y posee un permiso de categoría B válido desde hace al menos 2 años.',
    section1DocumentsLine:
      '· Validez de documentos: Los documentos y el permiso del Arrendatario deben ser válidos durante todo el periodo y aceptados en la UE.',
    section1PaymentHeading:
      '· Pago: En la entrega del vehículo, los métodos de pago pueden ser:',
    section1CashLine: '· Efectivo',
    section1CardLine: '· Tarjeta bancaria (VISA, Mastercard, Revolut, etc.)',
    section1DepositLine: '· Fianza: se requiere una fianza de 500 €.',
    section1FullInsuranceLine:
      '· Seguro completo según la oferta; el seguro reemplaza totalmente la fianza.',
    section2Heading: '2. EXCLUSIONES DEL SEGURO',
    section2Intro:
      'El seguro no cubre los siguientes incidentes; los costes son íntegramente a cargo del Arrendatario. Esta obligación continúa después de finalizar el alquiler.',
    section2WrongFuel:
      '· Daños causados por repostar con el combustible incorrecto.',
    section2Keys: '· Pérdida, rotura o daño de las llaves del vehículo.',
    section2OffRoad:
      '· Daños, pinchazos y costes de rescate y reparación derivados de conducción fuera de carretera (vías sin asfaltar).',
    section2Alcohol:
      '· Accidente/daño causado o sufrido bajo la influencia de alcohol, drogas o cualquier sustancia que afecte la capacidad de conducción.',
    section2Fines: '· Multas de tráfico y gastos de gestión.',
    section2UnauthorizedIsland:
      '· Cualquier daño derivado del uso del vehículo en una isla no autorizada.',
    section3Heading: '3. NORMAS DE USO Y DEVOLUCIÓN',
    section3Island:
      '· Prohibido salir de la isla: El vehículo no puede salir de la isla donde fue alquilado (solo con acuerdo aparte).',
    section3Fuel:
      '· Combustible: El vehículo debe devolverse con el mismo nivel de combustible que al recogerlo. El indicador de autonomía es la referencia.',
    section3Cancellation:
      '· Cancelación / Reembolso: No es posible un reembolso prorrateado en caso de finalización anticipada del alquiler.',
    declarationHeading: 'III. DECLARACIÓN Y FIRMA',
    declarationParagraph1:
      'Este contrato es parte integral e inseparable del anexo de Términos y Condiciones Generales (TCG), disponible en nuestro sitio web www.zodiacsrentacar.com o directamente en: link.',
    declarationParagraph2:
      'La lectura de los TCG es en interés del Arrendatario; no leerlos es su decisión y no lo exime de su aplicación.',
    declarationParagraph3:
      'El Arrendatario declara haber leído y aceptado los términos de este contrato y del anexo TCG. Reconoce que se aplica la ley española. Jurisdicción: Canarias',
    dateLine: 'Fecha: ..................................................... (Fecha)',
    cityLine: 'Ciudad, <<Custom.Today>> Caleta de Fuste',
  },
};

const IT_COPY: ContractCopy = {
  title: 'CONTRATTO DI NOLEGGIO AUTO',
  intro:
    'Il presente contratto di noleggio è stipulato tra ZODIACS Rent a Car (Locatore) e il Noleggiatore.',
  detailLabels: {
    bookingId: 'ID prenotazione',
    renterName: 'Nome del noleggiatore',
    renterEmail: 'Email del noleggiatore',
    renterPhone: 'Telefono del noleggiatore',
    vehicle: 'Veicolo noleggiato',
    period: 'Periodo di noleggio',
    pickupLocation: 'Luogo di ritiro',
    pickupAddress: 'Indirizzo di ritiro',
  },
  rentalDaysUnit: 'giorni',
  rentalFeePerDaySuffix: 'EUR/giorno',
  terms: [
    'Il Noleggiatore utilizza il veicolo correttamente e rispetta le norme stradali.',
    'Il Noleggiatore deve segnalare immediatamente qualsiasi danno al veicolo.',
    'Il veicolo deve essere restituito nel luogo concordato al termine del periodo di noleggio.',
    'Le tariffe di noleggio, il deposito e gli altri costi sono regolati secondo le condizioni di prenotazione.',
    'Il presente contratto è valido anche con firma elettronica.',
  ],
  footer:
    'Firmando, il Noleggiatore conferma di aver ispezionato il veicolo e accetta le condizioni.',
  body: {
    lessorHeading: 'Locatore:',
    companyLabel: 'Società:',
    addressLabel: 'Indirizzo:',
    registrationLabel: 'Numero di registrazione:',
    renterHeading: 'Noleggiatore:',
    renterLabel: 'Noleggiatore:',
    birthLabel: 'Luogo e data di nascita:',
    idNumberLabel: "Numero documento d'identità:",
    idExpiryLabel: "Scadenza del documento d'identità:",
    licenseLabel: 'Numero patente:',
    phoneLabel: 'Numero di telefono:',
    vehicleDetailsHeading: 'Dettagli del veicolo:',
    carTypeLabel: 'Tipo di auto:',
    licensePlateLabel: 'Targa:',
    rentalFeesHeading: 'Tariffe di noleggio',
    rentalFeeLabel: 'Tariffa di noleggio:',
    depositLabel: 'Deposito:',
    insuranceLabel: 'Assicurazione:',
    depositParagraph:
      "Il deposito è un'alternativa opzionale all'assicurazione Full. Il deposito viene restituito integralmente a fine noleggio se il veicolo viene riconsegnato in condizioni perfette. In caso di danni, il deposito non sarà rimborsato.",
    insuranceParagraph:
      "L'assicurazione corrisponde alla franchigia e copre i costi di eventuali danni al veicolo. Non è rimborsabile.",
    rentalPeriodHeading: 'Periodo di noleggio',
    rentalStartLabel: 'Data di inizio:',
    rentalEndLabel: 'Data di fine:',
    rentalTermsHeading: 'Termini e condizioni:',
    rentalTermsLines: [
      'Il periodo di noleggio si riferisce all’intervallo indicato nel contratto. È possibile una proroga se comunicata 48 ore prima della scadenza; verrà inviato un nuovo contratto al Noleggiatore. È richiesta la presentazione fisica o online del veicolo.',
      'Con la firma, il Noleggiatore accetta i termini e dichiara la veridicità dei propri dati.',
      'Si richiama l’attenzione del Noleggiatore sull’importanza del rispetto delle norme stradali e della guida sicura.',
      'Ogni responsabilità legale e sanzione pecuniaria derivante da violazioni del codice della strada è a carico del Noleggiatore.',
      'Se il veicolo viene restituito in condizioni estremamente sporche, il Locatore addebiterà una tariffa di pulizia di 50 €.',
    ],
    section1Heading: '1. REQUISITI DI BASE',
    section1DriverLine:
      '· Requisiti minimi del conducente: Il Noleggiatore/Conducente ha più di 25 anni e possiede una patente di categoria B valida da almeno 2 anni.',
    section1DocumentsLine:
      '· Validità dei documenti: I documenti e la patente del Noleggiatore devono essere validi per tutta la durata e accettati nell’UE.',
    section1PaymentHeading:
      '· Pagamento: Al ritiro del veicolo, i metodi di pagamento possono essere:',
    section1CashLine: '· Contanti',
    section1CardLine: '· Carta bancaria (VISA, Mastercard, Revolut, ecc.)',
    section1DepositLine: '· Deposito: è richiesto un deposito di 500 €.',
    section1FullInsuranceLine:
      "· Assicurazione completa secondo l'offerta; l'assicurazione sostituisce interamente il deposito.",
    section2Heading: '2. ESCLUSIONI DELL’ASSICURAZIONE',
    section2Intro:
      "L'assicurazione non copre i seguenti eventi; i costi sono interamente a carico del Noleggiatore. Questo obbligo permane anche dopo la fine del noleggio.",
    section2WrongFuel:
      '· Danni causati da rifornimento con carburante errato.',
    section2Keys:
      '· Smarrimento, rottura o danneggiamento delle chiavi del veicolo.',
    section2OffRoad:
      '· Danni, forature e costi di recupero e riparazione derivanti da guida fuori strada (strade non asfaltate).',
    section2Alcohol:
      '· Incidente/danno causato o subito sotto l’influenza di alcol, droghe o qualsiasi sostanza che comprometta le capacità di guida.',
    section2Fines: '· Multe stradali e relative spese di gestione.',
    section2UnauthorizedIsland:
      '· Qualsiasi danno derivante dall’uso del veicolo su un’isola non autorizzata.',
    section3Heading: '3. REGOLE DI UTILIZZO E RESTITUZIONE',
    section3Island:
      '· È VIETATO lasciare l’isola: il veicolo non può lasciare l’isola in cui è stato noleggiato (solo con accordo separato).',
    section3Fuel:
      '· Carburante: Il veicolo deve essere restituito con lo stesso livello di carburante del ritiro. Fa fede l’indicatore di autonomia.',
    section3Cancellation:
      '· Annullamento / Rimborso: Non è possibile alcun rimborso proporzionale in caso di terminazione anticipata del noleggio.',
    declarationHeading: 'III. DICHIARAZIONE E FIRMA',
    declarationParagraph1:
      'Il presente contratto è parte integrante e inscindibile dell’allegato alle Condizioni Generali (CG), consultabile sul nostro sito www.zodiacsrentacar.com o direttamente a: link.',
    declarationParagraph2:
      'La conoscenza delle CG è nell’interesse del Noleggiatore; la mancata lettura è una sua decisione e non lo esonera dalla loro applicabilità.',
    declarationParagraph3:
      'Il Noleggiatore dichiara di aver letto e accettato i termini del presente contratto e dell’allegato CG. Prende atto che si applica la legge spagnola. Giurisdizione: Canarie',
    dateLine: 'Data: ..................................................... (Data)',
    cityLine: 'Città, <<Custom.Today>> Caleta de Fuste',
  },
};

const SK_COPY: ContractCopy = {
  title: 'ZMLUVA O PRENÁJME VOZIDLA',
  intro:
    'Táto zmluva o prenájme sa uzatvára medzi ZODIACS Rent a Car (Prenajímateľ) a Nájomcom.',
  detailLabels: {
    bookingId: 'ID rezervácie',
    renterName: 'Meno nájomcu',
    renterEmail: 'E-mail nájomcu',
    renterPhone: 'Telefón nájomcu',
    vehicle: 'Prenajaté vozidlo',
    period: 'Doba prenájmu',
    pickupLocation: 'Miesto prevzatia',
    pickupAddress: 'Adresa prevzatia',
  },
  rentalDaysUnit: 'dní',
  rentalFeePerDaySuffix: 'EUR/deň',
  terms: [
    'Nájomca používa vozidlo riadne a dodržiava pravidlá cestnej premávky.',
    'Nájomca musí bezodkladne nahlásiť akékoľvek poškodenie vozidla.',
    'Vozidlo musí byť vrátené na dohodnutom mieste po skončení doby prenájmu.',
    'Nájomné, kaucia a ďalšie poplatky sa uhrádzajú podľa podmienok rezervácie.',
    'Táto zmluva je platná aj s elektronickým podpisom.',
  ],
  footer:
    'Podpisom nájomca potvrdzuje, že vozidlo skontroloval a akceptuje podmienky.',
  body: {
    lessorHeading: 'Prenajímateľ:',
    companyLabel: 'Spoločnosť:',
    addressLabel: 'Adresa:',
    registrationLabel: 'Registračné číslo:',
    renterHeading: 'Nájomca:',
    renterLabel: 'Nájomca:',
    birthLabel: 'Miesto a dátum narodenia:',
    idNumberLabel: 'Číslo dokladu:',
    idExpiryLabel: 'Platnosť dokladu:',
    licenseLabel: 'Číslo vodičského preukazu:',
    phoneLabel: 'Telefónne číslo:',
    vehicleDetailsHeading: 'Údaje o vozidle:',
    carTypeLabel: 'Typ vozidla:',
    licensePlateLabel: 'ŠPZ:',
    rentalFeesHeading: 'Poplatky za prenájom',
    rentalFeeLabel: 'Nájomné:',
    depositLabel: 'Kaucia:',
    insuranceLabel: 'Poistenie:',
    depositParagraph:
      'Kaucia je voliteľnou alternatívou k plnému poisteniu. Kaucia sa vráti v plnej výške po skončení prenájmu, ak je vozidlo v bezchybnom stave. V prípade akéhokoľvek poškodenia sa kaucia nevracia.',
    insuranceParagraph:
      'Poistenie predstavuje spoluúčasť a kryje náklady na poškodenie vozidla. Nie je vratné.',
    rentalPeriodHeading: 'Doba prenájmu',
    rentalStartLabel: 'Začiatok prenájmu:',
    rentalEndLabel: 'Koniec prenájmu:',
    rentalTermsHeading: 'Podmienky prenájmu:',
    rentalTermsLines: [
      'Doba prenájmu sa vzťahuje na obdobie uvedené v zmluve. Predĺženie je možné pri oznámení 48 hodín pred uplynutím; nájomcovi bude zaslaná nová zmluva. V takom prípade je potrebné fyzické alebo online predstavenie vozidla.',
      'Podpisom nájomca akceptuje podmienky a vyhlasuje pravdivosť svojich údajov.',
      'Upozorňujeme nájomcu na dôležitosť dodržiavania pravidiel cestnej premávky a bezpečnej jazdy.',
      'Všetka právna zodpovednosť a peňažné pokuty vyplývajúce z porušenia pravidiel cestnej premávky znáša nájomca.',
      'Ak je vozidlo vrátené v extrémne znečistenom stave, prenajímateľ účtuje čistiaci poplatok 50 €.',
    ],
    section1Heading: '1. ZÁKLADNÉ PODMIENKY',
    section1DriverLine:
      '· Minimálne požiadavky na vodiča: Nájomca/vodič je starší ako 25 rokov a vlastní platný vodičský preukaz skupiny B aspoň 2 roky.',
    section1DocumentsLine:
      '· Platnosť dokladov: Doklady a vodičský preukaz nájomcu musia byť platné počas celej doby prenájmu a uznávané v EÚ.',
    section1PaymentHeading:
      '· Platba: Pri prevzatí vozidla sú možné tieto spôsoby platby:',
    section1CashLine: '· Hotovosť',
    section1CardLine: '· Platobná karta (VISA, Mastercard, Revolut atď.)',
    section1DepositLine: '· Kaucia: vyžaduje sa kaucia 500 €.',
    section1FullInsuranceLine:
      '· Plné poistenie podľa ponuky; poistenie úplne nahrádza kauciu.',
    section2Heading: '2. VÝLUKY Z POISTENIA',
    section2Intro:
      'Poistenie nepokrýva nasledujúce udalosti; náklady znáša v plnej výške nájomca. Táto povinnosť pretrváva aj po skončení prenájmu.',
    section2WrongFuel: '· Škoda spôsobená natankovaním nesprávneho paliva.',
    section2Keys: '· Strata, zlomenie alebo poškodenie kľúčov vozidla.',
    section2OffRoad:
      '· Škody, defekty, náklady na odťah a opravy v dôsledku jazdy v teréne (nespevnené cesty).',
    section2Alcohol:
      '· Nehoda/škoda spôsobená alebo utrpená pod vplyvom alkoholu, drog alebo iných látok ovplyvňujúcich schopnosť viesť vozidlo.',
    section2Fines: '· Dopravné pokuty a ich administratívne poplatky.',
    section2UnauthorizedIsland:
      '· Akákoľvek škoda vzniknutá používaním vozidla na nepovolenej ostrove.',
    section3Heading: '3. PRAVIDLÁ POUŽÍVANIA A VRÁTENIA',
    section3Island:
      '· Opustenie ostrova je ZAKÁZANÉ: Vozidlo nesmie opustiť ostrov, kde bolo prenajaté (iba na základe osobitnej dohody).',
    section3Fuel:
      '· Palivo: Vozidlo musí byť vrátené s rovnakou hladinou paliva ako pri prevzatí. Rozhodujúci je ukazovateľ dojazdu.',
    section3Cancellation:
      '· Zrušenie / Vrátenie peňazí: Pri predčasnom ukončení prenájmu nie je možná pomerná refundácia.',
    declarationHeading: 'III. VYHLÁSENIE A PODPIS',
    declarationParagraph1:
      'Táto zmluva je neoddeliteľnou súčasťou prílohy Všeobecných zmluvných podmienok (VZP), dostupnej na našej stránke www.zodiacsrentacar.com alebo priamo na: link.',
    declarationParagraph2:
      'Oboznámenie sa s VZP je v záujme nájomcu; neoboznámenie sa je jeho rozhodnutie a neoslobodzuje ho od ich platnosti.',
    declarationParagraph3:
      'Nájomca vyhlasuje, že sa oboznámil s podmienkami tejto zmluvy a prílohou VZP a prijíma ich. Berie na vedomie, že sa uplatňuje španielske právo. Jurisdikcia: Kanárske ostrovy',
    dateLine: 'Dátum: ..................................................... (Dátum)',
    cityLine: 'Mesto, <<Custom.Today>> Caleta de Fuste',
  },
};

const CZ_COPY: ContractCopy = {
  title: 'NÁJEMNÍ SMLOUVA',
  intro:
    'Tato nájemní smlouva se uzavírá mezi ZODIACS Rent a Car (Pronajímatel) a Nájemcem.',
  detailLabels: {
    bookingId: 'ID rezervace',
    renterName: 'Jméno nájemce',
    renterEmail: 'E-mail nájemce',
    renterPhone: 'Telefon nájemce',
    vehicle: 'Pronajaté vozidlo',
    period: 'Doba pronájmu',
    pickupLocation: 'Místo převzetí',
    pickupAddress: 'Adresa převzetí',
  },
  rentalDaysUnit: 'dní',
  rentalFeePerDaySuffix: 'EUR/den',
  terms: [
    'Nájemce používá vozidlo řádně a dodržuje pravidla silničního provozu.',
    'Nájemce musí neprodleně nahlásit jakékoli poškození vozidla.',
    'Vozidlo musí být vráceno na dohodnutém místě na konci doby pronájmu.',
    'Nájemné, kauce a další poplatky se hradí podle podmínek rezervace.',
    'Tato smlouva je platná i s elektronickým podpisem.',
  ],
  footer:
    'Podpisem nájemce potvrzuje, že vozidlo zkontroloval a souhlasí s podmínkami.',
  body: {
    lessorHeading: 'Pronajímatel:',
    companyLabel: 'Společnost:',
    addressLabel: 'Adresa:',
    registrationLabel: 'Registrační číslo:',
    renterHeading: 'Nájemce:',
    renterLabel: 'Nájemce:',
    birthLabel: 'Místo a datum narození:',
    idNumberLabel: 'Číslo dokladu:',
    idExpiryLabel: 'Platnost dokladu:',
    licenseLabel: 'Číslo řidičského průkazu:',
    phoneLabel: 'Telefonní číslo:',
    vehicleDetailsHeading: 'Údaje o vozidle:',
    carTypeLabel: 'Typ vozidla:',
    licensePlateLabel: 'SPZ:',
    rentalFeesHeading: 'Poplatky za pronájem',
    rentalFeeLabel: 'Nájemné:',
    depositLabel: 'Kauce:',
    insuranceLabel: 'Pojištění:',
    depositParagraph:
      'Kauce je volitelnou alternativou k plnému pojištění. Kauce bude na konci pronájmu vrácena v plné výši, pokud je vozidlo vráceno v bezvadném stavu. V případě jakéhokoli poškození se kauce nevrací.',
    insuranceParagraph:
      'Pojištění představuje spoluúčast a kryje náklady na poškození vozidla. Není vratné.',
    rentalPeriodHeading: 'Doba pronájmu',
    rentalStartLabel: 'Začátek pronájmu:',
    rentalEndLabel: 'Konec pronájmu:',
    rentalTermsHeading: 'Podmínky pronájmu:',
    rentalTermsLines: [
      'Doba pronájmu se vztahuje na období uvedené ve smlouvě. Prodloužení je možné při oznámení 48 hodin před vypršením; nájemci bude zaslána nová smlouva. V takovém případě je nutné fyzické nebo online předvedení vozidla.',
      'Podpisem nájemce přijímá podmínky a prohlašuje pravdivost svých údajů.',
      'Upozorňujeme nájemce na důležitost dodržování pravidel silničního provozu a bezpečné jízdy.',
      'Veškerou právní odpovědnost a peněžité pokuty vyplývající z porušení pravidel silničního provozu nese nájemce.',
      'Pokud je vozidlo vráceno ve velmi špinavém stavu, pronajímatel účtuje poplatek za čištění 50 €.',
    ],
    section1Heading: '1. ZÁKLADNÍ PODMÍNKY',
    section1DriverLine:
      '· Minimální požadavky na řidiče: Nájemce/řidič je starší 25 let a drží platný řidičský průkaz skupiny B alespoň 2 roky.',
    section1DocumentsLine:
      '· Platnost dokumentů: Doklady a řidičský průkaz nájemce musí být platné po celou dobu a uznávané v EU.',
    section1PaymentHeading:
      '· Platba: Při převzetí vozidla jsou možné tyto způsoby platby:',
    section1CashLine: '· Hotově',
    section1CardLine: '· Platební karta (VISA, Mastercard, Revolut apod.)',
    section1DepositLine: '· Kauce: je požadována kauce 500 €.',
    section1FullInsuranceLine:
      '· Plné pojištění dle nabídky; pojištění zcela nahrazuje kauci.',
    section2Heading: '2. VÝLUKY POJIŠTĚNÍ',
    section2Intro:
      'Pojištění nekryje následující události; náklady nese v plné výši nájemce. Tato povinnost trvá i po skončení pronájmu.',
    section2WrongFuel:
      '· Škoda způsobená natankováním nesprávného paliva.',
    section2Keys: '· Ztráta, zlomení nebo poškození klíčů vozidla.',
    section2OffRoad:
      '· Škody, defekty, odtah a opravy v důsledku jízdy v terénu (nezpevněné cesty).',
    section2Alcohol:
      '· Nehoda/škoda způsobená či utrpěná pod vlivem alkoholu, drog nebo jiné látky ovlivňující schopnost řídit.',
    section2Fines: '· Dopravní pokuty a administrativní poplatky.',
    section2UnauthorizedIsland:
      '· Jakákoliv škoda vzniklá používáním vozidla na nepovoleném ostrově.',
    section3Heading: '3. PRAVIDLA POUŽÍVÁNÍ A VRÁCENÍ',
    section3Island:
      '· Opustit ostrov je ZAKÁZÁNO: Vozidlo nesmí opustit ostrov, kde bylo pronajato (pouze na základě zvláštní dohody).',
    section3Fuel:
      '· Palivo: Vozidlo musí být vráceno se stejnou hladinou paliva jako při převzetí. Směrodatný je ukazatel dojezdu.',
    section3Cancellation:
      '· Zrušení / Vrácení peněz: Při předčasném ukončení pronájmu není možné poměrné vrácení.',
    declarationHeading: 'III. PROHLÁŠENÍ A PODPIS',
    declarationParagraph1:
      'Tato smlouva je nedílnou a neoddělitelnou součástí přílohy Všeobecných obchodních podmínek (VOP), dostupné na našem webu www.zodiacsrentacar.com nebo přímo na: link.',
    declarationParagraph2:
      'Seznámení se s VOP je v zájmu nájemce; neseznámení je jeho rozhodnutí a nezbavuje ho jejich platnosti.',
    declarationParagraph3:
      'Nájemce prohlašuje, že se seznámil s podmínkami této smlouvy a přílohy VOP a souhlasí s nimi. Bere na vědomí, že se uplatňuje španělské právo. Příslušnost: Kanárské ostrovy',
    dateLine: 'Datum: ..................................................... (Datum)',
    cityLine: 'Město, <<Custom.Today>> Caleta de Fuste',
  },
};

const SE_COPY: ContractCopy = {
  title: 'HYRESAVTAL',
  intro:
    'Detta hyresavtal ingås mellan ZODIACS Rent a Car (Uthyrare) och Hyrestagaren.',
  detailLabels: {
    bookingId: 'Boknings-ID',
    renterName: 'Hyrestagarens namn',
    renterEmail: 'Hyrestagarens e-post',
    renterPhone: 'Hyrestagarens telefon',
    vehicle: 'Hyrt fordon',
    period: 'Hyresperiod',
    pickupLocation: 'Utlämningsplats',
    pickupAddress: 'Utlämningsadress',
  },
  rentalDaysUnit: 'dagar',
  rentalFeePerDaySuffix: 'EUR/dag',
  terms: [
    'Hyrestagaren använder fordonet korrekt och följer trafikreglerna.',
    'Hyrestagaren ska omedelbart rapportera skador på fordonet.',
    'Fordonet ska återlämnas på överenskommen plats vid hyresperiodens slut.',
    'Hyresavgift, deposition och andra avgifter regleras enligt bokningsvillkoren.',
    'Detta avtal är giltigt även med elektronisk signatur.',
  ],
  footer:
    'Genom att underteckna bekräftar Hyrestagaren att fordonet har kontrollerats och att villkoren accepteras.',
  body: {
    lessorHeading: 'Uthyrare:',
    companyLabel: 'Företag:',
    addressLabel: 'Adress:',
    registrationLabel: 'Registreringsnummer:',
    renterHeading: 'Hyrestagare:',
    renterLabel: 'Hyrestagare:',
    birthLabel: 'Födelseort och datum:',
    idNumberLabel: 'ID-nummer:',
    idExpiryLabel: 'ID-handlingens giltighet:',
    licenseLabel: 'Körkortsnummer:',
    phoneLabel: 'Telefonnummer:',
    vehicleDetailsHeading: 'Fordonets uppgifter:',
    carTypeLabel: 'Biltyp:',
    licensePlateLabel: 'Registreringsnummer:',
    rentalFeesHeading: 'Hyresavgifter',
    rentalFeeLabel: 'Hyresavgift:',
    depositLabel: 'Deposition:',
    insuranceLabel: 'Försäkring:',
    depositParagraph:
      'Depositionen är ett valfritt alternativ till Fullförsäkring. Depositionen återbetalas fullt ut vid hyresperiodens slut om fordonet återlämnas i felfritt skick. Vid skador återbetalas depositionen inte.',
    insuranceParagraph:
      'Försäkringen motsvarar självrisken och täcker kostnader för eventuella skador på fordonet. Den är inte återbetalningsbar.',
    rentalPeriodHeading: 'Hyresperiod',
    rentalStartLabel: 'Hyresstart:',
    rentalEndLabel: 'Hyresslut:',
    rentalTermsHeading: 'Hyresvillkor:',
    rentalTermsLines: [
      'Hyresperioden gäller den period som anges i avtalet. Förlängning är möjlig om den meddelas 48 timmar före slutdatum; ett nytt avtal skickas till Hyrestagaren. Fysisk eller online visning av bilen krävs i detta fall.',
      'Genom att underteckna accepterar Hyrestagaren villkoren och intygar att uppgifterna är korrekta.',
      'Hyrestagaren påminns om vikten av att följa trafikreglerna och köra säkert.',
      'Allt juridiskt ansvar och böter som uppstår vid trafikförseelser bärs av Hyrestagaren.',
      'Om fordonet återlämnas i mycket smutsigt skick debiterar Uthyraren en rengöringsavgift på 50 €.',
    ],
    section1Heading: '1. GRUNDLÄGGANDE KRAV',
    section1DriverLine:
      '· Minimikrav för förare: Hyrestagaren/Föraren är över 25 år och har haft giltigt körkort klass B i minst 2 år.',
    section1DocumentsLine:
      '· Dokumentens giltighet: Hyrestagarens dokument och körkort måste vara giltiga under hela perioden och erkända inom EU.',
    section1PaymentHeading:
      '· Betalning: Vid utlämning av fordonet kan betalningssätten vara:',
    section1CashLine: '· Kontant',
    section1CardLine: '· Bankkort (VISA, Mastercard, Revolut m.m.)',
    section1DepositLine: '· Deposition: en deposition på 500 € krävs.',
    section1FullInsuranceLine:
      '· Fullförsäkring enligt erbjudandet; försäkringen ersätter depositionen helt.',
    section2Heading: '2. FÖRSÄKRINGSUNDANTAG',
    section2Intro:
      'Försäkringen täcker inte följande händelser; kostnaderna bärs fullt ut av Hyrestagaren. Denna skyldighet kvarstår även efter hyresperiodens slut.',
    section2WrongFuel:
      '· Skador orsakade av felaktig bränsletankning.',
    section2Keys: '· Förlust, brott eller skada på fordonsnycklar.',
    section2OffRoad:
      '· Skador, punktering samt bärgning och reparationskostnader vid terrängkörning (ogrusade vägar).',
    section2Alcohol:
      '· Olycka/skada orsakad eller drabbad under påverkan av alkohol, droger eller annan substans som påverkar körförmågan.',
    section2Fines: '· Trafikböter och administrationsavgifter.',
    section2UnauthorizedIsland:
      '· Alla skador som uppstår vid användning av fordonet på en obehörig ö.',
    section3Heading: '3. ANVÄNDNINGS- OCH ÅTERLÄMNINGSREGLER',
    section3Island:
      '· Det är FÖRBJUDET att lämna ön: Fordonet får inte lämna ön där det hyrdes (endast genom separat överenskommelse).',
    section3Fuel:
      '· Bränsle: Fordonet ska återlämnas med samma bränslenivå som vid utlämning. Räckviddsindikatorn är vägledande.',
    section3Cancellation:
      '· Avbokning / Återbetalning: Ingen proportionell återbetalning är möjlig vid förtida avslut av hyran.',
    declarationHeading: 'III. FÖRKLARING OCH UNDERSKRIFT',
    declarationParagraph1:
      'Detta avtal är en integrerad och oskiljaktig del av bilagan Allmänna villkor (AV), som finns på vår webbplats www.zodiacsrentacar.com eller direkt på: link.',
    declarationParagraph2:
      'Att ta del av AV ligger i Hyrestagarens intresse; att inte göra det är Hyrestagarens beslut och befriar inte från dess tillämplighet.',
    declarationParagraph3:
      'Hyrestagaren intygar att hen har läst och accepterat villkoren i detta avtal och AV-bilagan. Hen är medveten om att spansk lag gäller. Jurisdiktion: Kanarieöarna',
    dateLine: 'Datum: ..................................................... (Datum)',
    cityLine: 'Stad, <<Custom.Today>> Caleta de Fuste',
  },
};

const NO_COPY: ContractCopy = {
  title: 'LEIEAVTALE',
  intro:
    'Denne leieavtalen inngås mellom ZODIACS Rent a Car (Utleier) og Leietaker.',
  detailLabels: {
    bookingId: 'Bestillings-ID',
    renterName: 'Leietakers navn',
    renterEmail: 'Leietakers e-post',
    renterPhone: 'Leietakers telefon',
    vehicle: 'Leid kjøretøy',
    period: 'Leieperiode',
    pickupLocation: 'Utleveringssted',
    pickupAddress: 'Utleveringsadresse',
  },
  rentalDaysUnit: 'dager',
  rentalFeePerDaySuffix: 'EUR/dag',
  terms: [
    'Leietakeren skal bruke kjøretøyet på korrekt måte og følge trafikkreglene.',
    'Leietakeren må umiddelbart rapportere eventuelle skader på kjøretøyet.',
    'Kjøretøyet skal returneres på avtalt sted ved slutten av leieperioden.',
    'Leiepris, depositum og andre kostnader gjøres opp i henhold til bestillingsvilkårene.',
    'Denne avtalen er også gyldig med elektronisk signatur.',
  ],
  footer:
    'Ved å signere bekrefter Leietakeren at kjøretøyet er inspisert og at vilkårene aksepteres.',
  body: {
    lessorHeading: 'Utleier:',
    companyLabel: 'Selskap:',
    addressLabel: 'Adresse:',
    registrationLabel: 'Registreringsnummer:',
    renterHeading: 'Leietaker:',
    renterLabel: 'Leietaker:',
    birthLabel: 'Fødselssted og -dato:',
    idNumberLabel: 'ID-nummer:',
    idExpiryLabel: 'Gyldighet på ID:',
    licenseLabel: 'Førerkortnummer:',
    phoneLabel: 'Telefonnummer:',
    vehicleDetailsHeading: 'Kjøretøydetaljer:',
    carTypeLabel: 'Biltype:',
    licensePlateLabel: 'Registreringsnummer:',
    rentalFeesHeading: 'Leiegebyrer',
    rentalFeeLabel: 'Leiepris:',
    depositLabel: 'Depositum:',
    insuranceLabel: 'Forsikring:',
    depositParagraph:
      'Depositumet er et valgfritt alternativ til Fullforsikring. Depositumet tilbakebetales fullt ut ved slutten av leieperioden dersom kjøretøyet returneres i feilfri stand. Ved skade blir depositumet ikke tilbakebetalt.',
    insuranceParagraph:
      'Forsikringen tilsvarer egenandelen og dekker kostnadene for skader på kjøretøyet. Den er ikke refunderbar.',
    rentalPeriodHeading: 'Leieperiode',
    rentalStartLabel: 'Startdato:',
    rentalEndLabel: 'Sluttdato:',
    rentalTermsHeading: 'Leievilkår:',
    rentalTermsLines: [
      'Leieperioden gjelder perioden angitt i avtalen. Forlengelse er mulig hvis det varsles 48 timer før utløp; en ny avtale sendes til Leietaker. Fysisk eller online presentasjon av bilen er nødvendig i dette tilfellet.',
      'Ved signering aksepterer Leietaker vilkårene og erklærer at opplysningene er korrekte.',
      'Leietaker gjøres oppmerksom på viktigheten av å følge trafikkreglene og kjøre sikkert.',
      'Alt juridisk ansvar og bøter som følger av brudd på trafikkreglene bæres av Leietaker.',
      'Hvis kjøretøyet returneres i svært skitten tilstand, vil Utleier kreve et rengjøringsgebyr på 50 €.',
    ],
    section1Heading: '1. GRUNNLEGGENDE KRAV',
    section1DriverLine:
      '· Minstekrav til sjåfør: Leietaker/sjåfør er over 25 år og har hatt gyldig førerkort klasse B i minst 2 år.',
    section1DocumentsLine:
      '· Dokumenters gyldighet: Leietakers dokumenter og førerkort må være gyldige i hele perioden og godkjent i EU.',
    section1PaymentHeading:
      '· Betaling: Ved utlevering av kjøretøyet kan betalingsmåtene være:',
    section1CashLine: '· Kontant',
    section1CardLine: '· Bankkort (VISA, Mastercard, Revolut osv.)',
    section1DepositLine: '· Depositum: et depositum på 500 € kreves.',
    section1FullInsuranceLine:
      '· Fullforsikring i henhold til tilbudet; forsikringen erstatter depositumet fullt ut.',
    section2Heading: '2. UNNTAK FRA FORSIKRING',
    section2Intro:
      'Forsikringen dekker ikke følgende hendelser; kostnadene bæres fullt ut av Leietaker. Denne forpliktelsen gjelder også etter at leieperioden er avsluttet.',
    section2WrongFuel:
      '· Skade forårsaket av feil drivstoff.',
    section2Keys: '· Tap, brudd eller skade på kjøretøyets nøkler.',
    section2OffRoad:
      '· Skader, punktering og bergings- og reparasjonskostnader som følge av terrengkjøring (ikke-asfalterte veier).',
    section2Alcohol:
      '· Ulykke/skade forårsaket eller pådratt under påvirkning av alkohol, rusmidler eller andre stoffer som påvirker kjøreevnen.',
    section2Fines: '· Trafikkbøter og administrasjonsgebyrer.',
    section2UnauthorizedIsland:
      '· Enhver skade som oppstår ved bruk av kjøretøyet på en ikke-autorisert øy.',
    section3Heading: '3. BRUKS- OG RETURREGLER',
    section3Island:
      '· Det er FORBUDT å forlate øya: Kjøretøyet kan ikke forlate øya der det ble leid (kun etter separat avtale).',
    section3Fuel:
      '· Drivstoff: Kjøretøyet skal returneres med samme drivstoffnivå som ved utlevering. Rekkeviddeindikatoren er veiledende.',
    section3Cancellation:
      '· Avbestilling / Refusjon: Ingen forholdsmessig refusjon er mulig ved tidlig avslutning av leien.',
    declarationHeading: 'III. ERKLÆRING OG SIGNATUR',
    declarationParagraph1:
      'Denne avtalen er en integrert og uatskillelig del av vedlegget Generelle vilkår (GV), tilgjengelig på vår nettside www.zodiacsrentacar.com eller direkte på: link.',
    declarationParagraph2:
      'Å gjøre seg kjent med GV er i Leietakers interesse; å ikke gjøre det er Leietakers beslutning og fritar ikke fra deres anvendelse.',
    declarationParagraph3:
      'Leietaker erklærer at de har lest og akseptert vilkårene i denne avtalen og GV-vedlegget. De erkjenner at spansk lov gjelder. Jurisdiksjon: Kanariøyene',
    dateLine: 'Dato: ..................................................... (Dato)',
    cityLine: 'By, <<Custom.Today>> Caleta de Fuste',
  },
};

const DK_COPY: ContractCopy = {
  title: 'LEJEKONTRAKT',
  intro:
    'Denne lejekontrakt indgås mellem ZODIACS Rent a Car (Udlejer) og Lejeren.',
  detailLabels: {
    bookingId: 'Booking-ID',
    renterName: 'Lejers navn',
    renterEmail: 'Lejers e-mail',
    renterPhone: 'Lejers telefon',
    vehicle: 'Lejet køretøj',
    period: 'Lejeperiode',
    pickupLocation: 'Udleveringssted',
    pickupAddress: 'Udleveringsadresse',
  },
  rentalDaysUnit: 'dage',
  rentalFeePerDaySuffix: 'EUR/dag',
  terms: [
    'Lejeren bruger køretøjet korrekt og overholder færdselsreglerne.',
    'Lejeren skal straks rapportere enhver skade på køretøjet.',
    'Køretøjet skal returneres på det aftalte sted ved lejeperiodens afslutning.',
    'Lejepris, depositum og andre gebyrer afregnes i henhold til bookingbetingelserne.',
    'Denne aftale er også gyldig med elektronisk underskrift.',
  ],
  footer:
    'Ved underskrift bekræfter Lejeren, at køretøjet er inspiceret og at betingelserne accepteres.',
  body: {
    lessorHeading: 'Udlejer:',
    companyLabel: 'Selskab:',
    addressLabel: 'Adresse:',
    registrationLabel: 'Registreringsnummer:',
    renterHeading: 'Lejer:',
    renterLabel: 'Lejer:',
    birthLabel: 'Fødested og -dato:',
    idNumberLabel: 'ID-nummer:',
    idExpiryLabel: 'ID-dokumentets gyldighed:',
    licenseLabel: 'Kørekortnummer:',
    phoneLabel: 'Telefonnummer:',
    vehicleDetailsHeading: 'Køretøjsdetaljer:',
    carTypeLabel: 'Biltype:',
    licensePlateLabel: 'Nummerplade:',
    rentalFeesHeading: 'Lejegebyrer',
    rentalFeeLabel: 'Lejepris:',
    depositLabel: 'Depositum:',
    insuranceLabel: 'Forsikring:',
    depositParagraph:
      'Depositummet er et valgfrit alternativ til Full-forsikring. Depositummet tilbagebetales fuldt ud ved lejeperiodens afslutning, hvis køretøjet returneres i fejlfri stand. Ved skade tilbagebetales depositummet ikke.',
    insuranceParagraph:
      'Forsikringen svarer til selvrisikoen og dækker omkostningerne ved eventuelle skader på køretøjet. Den er ikke refunderbar.',
    rentalPeriodHeading: 'Lejeperiode',
    rentalStartLabel: 'Startdato:',
    rentalEndLabel: 'Slutdato:',
    rentalTermsHeading: 'Lejebetingelser:',
    rentalTermsLines: [
      'Lejeperioden gælder den periode, der er angivet i kontrakten. Forlængelse er mulig, hvis der gives besked 48 timer før udløb; en ny kontrakt sendes til Lejeren. Fysisk eller online fremvisning af bilen er nødvendig i dette tilfælde.',
      'Ved underskrift accepterer Lejeren betingelserne og erklærer, at oplysningerne er korrekte.',
      'Lejeren gøres opmærksom på vigtigheden af at overholde færdselsreglerne og køre sikkert.',
      'Al juridisk ansvar og bøder som følge af overtrædelser af færdselsreglerne bæres af Lejeren.',
      'Hvis køretøjet returneres i meget snavset tilstand, vil Udlejeren opkræve et rengøringsgebyr på 50 €.',
    ],
    section1Heading: '1. GRUNDLÆGGENDE KRAV',
    section1DriverLine:
      '· Minimumskrav til fører: Lejeren/Føreren er over 25 år og har haft gyldigt kørekort kategori B i mindst 2 år.',
    section1DocumentsLine:
      '· Dokumenternes gyldighed: Lejerens dokumenter og kørekort skal være gyldige under hele perioden og anerkendt i EU.',
    section1PaymentHeading:
      '· Betaling: Ved udlevering af køretøjet kan betalingsmetoderne være:',
    section1CashLine: '· Kontant',
    section1CardLine: '· Bankkort (VISA, Mastercard, Revolut osv.)',
    section1DepositLine: '· Depositum: et depositum på 500 € er påkrævet.',
    section1FullInsuranceLine:
      '· Full-forsikring i henhold til tilbuddet; forsikringen erstatter depositummet fuldt ud.',
    section2Heading: '2. FORSIKRINGSUNDTAGELSER',
    section2Intro:
      'Forsikringen dækker ikke følgende hændelser; omkostningerne bæres fuldt ud af Lejeren. Denne forpligtelse gælder også efter lejeperiodens afslutning.',
    section2WrongFuel:
      '· Skade forårsaget af forkert brændstof.',
    section2Keys: '· Tab, brud eller skade på køretøjets nøgler.',
    section2OffRoad:
      '· Skader, punkteringer samt bugserings- og reparationsomkostninger som følge af kørsel off-road (ikke-asfalterede veje).',
    section2Alcohol:
      '· Ulykke/skade forårsaget eller pådraget under påvirkning af alkohol, narkotika eller andre stoffer, der påvirker køreevnen.',
    section2Fines: '· Trafikbøder og administrationsgebyrer.',
    section2UnauthorizedIsland:
      '· Enhver skade, der opstår ved brug af køretøjet på en ikke-godkendt ø.',
    section3Heading: '3. BRUGS- OG RETURNERINGSREGLER',
    section3Island:
      '· Det er FORBUDT at forlade øen: Køretøjet må ikke forlade den ø, hvor det blev lejet (kun efter særskilt aftale).',
    section3Fuel:
      '· Brændstof: Køretøjet skal returneres med samme brændstofniveau som ved udlevering. Rækkeviddeindikatoren er vejledende.',
    section3Cancellation:
      '· Afbestilling / Refusion: Ingen forholdsmæssig refusion er mulig ved tidlig afslutning af lejen.',
    declarationHeading: 'III. ERKLÆRING OG UNDERSKRIFT',
    declarationParagraph1:
      'Denne kontrakt er en integreret og uadskillelig del af bilaget Generelle Vilkår (GV), som kan findes på vores hjemmeside www.zodiacsrentacar.com eller direkte på: link.',
    declarationParagraph2:
      'Det er i Lejerens interesse at gennemgå GV; at undlade dette er Lejerens beslutning og fritager ikke for deres anvendelse.',
    declarationParagraph3:
      'Lejeren erklærer, at han/hun har læst og accepteret vilkårene i denne kontrakt og GV-bilaget. Lejeren anerkender, at spansk lov gælder. Jurisdiktion: De Kanariske Øer',
    dateLine: 'Dato: ..................................................... (Dato)',
    cityLine: 'By, <<Custom.Today>> Caleta de Fuste',
  },
};

const PL_COPY: ContractCopy = {
  title: 'UMOWA NAJMU SAMOCHODU',
  intro:
    'Niniejsza umowa najmu zostaje zawarta między ZODIACS Rent a Car (Wynajmującym) a Najemcą.',
  detailLabels: {
    bookingId: 'ID rezerwacji',
    renterName: 'Imię i nazwisko najemcy',
    renterEmail: 'E-mail najemcy',
    renterPhone: 'Telefon najemcy',
    vehicle: 'Wynajęty pojazd',
    period: 'Okres wynajmu',
    pickupLocation: 'Miejsce odbioru',
    pickupAddress: 'Adres odbioru',
  },
  rentalDaysUnit: 'dni',
  rentalFeePerDaySuffix: 'EUR/dzień',
  terms: [
    'Najemca używa pojazdu zgodnie z przeznaczeniem i przestrzega przepisów ruchu drogowego.',
    'Najemca musi niezwłocznie zgłosić wszelkie uszkodzenia pojazdu.',
    'Pojazd należy zwrócić w uzgodnionym miejscu po zakończeniu okresu najmu.',
    'Opłaty najmu, kaucja i inne koszty są regulowane zgodnie z warunkami rezerwacji.',
    'Niniejsza umowa jest ważna także z podpisem elektronicznym.',
  ],
  footer:
    'Podpisując, Najemca potwierdza, że zapoznał się ze stanem pojazdu i akceptuje warunki.',
  body: {
    lessorHeading: 'Wynajmujący:',
    companyLabel: 'Firma:',
    addressLabel: 'Adres:',
    registrationLabel: 'Numer rejestracyjny:',
    renterHeading: 'Najemca:',
    renterLabel: 'Najemca:',
    birthLabel: 'Miejsce i data urodzenia:',
    idNumberLabel: 'Numer dokumentu:',
    idExpiryLabel: 'Ważność dokumentu:',
    licenseLabel: 'Numer prawa jazdy:',
    phoneLabel: 'Numer telefonu:',
    vehicleDetailsHeading: 'Dane pojazdu:',
    carTypeLabel: 'Typ samochodu:',
    licensePlateLabel: 'Numer rejestracyjny:',
    rentalFeesHeading: 'Opłaty najmu',
    rentalFeeLabel: 'Opłata za najem:',
    depositLabel: 'Kaucja:',
    insuranceLabel: 'Ubezpieczenie:',
    depositParagraph:
      'Kaucja jest opcjonalną alternatywą dla pełnego ubezpieczenia. Kaucja jest w całości zwracana po zakończeniu najmu, jeśli pojazd zostanie zwrócony w nienagannym stanie. W przypadku jakichkolwiek uszkodzeń kaucja nie podlega zwrotowi.',
    insuranceParagraph:
      'Ubezpieczenie stanowi udział własny i pokrywa koszty wszelkich szkód pojazdu. Jest bezzwrotne.',
    rentalPeriodHeading: 'Okres najmu',
    rentalStartLabel: 'Data rozpoczęcia:',
    rentalEndLabel: 'Data zakończenia:',
    rentalTermsHeading: 'Warunki najmu:',
    rentalTermsLines: [
      'Okres najmu dotyczy przedziału wskazanego w umowie. Przedłużenie jest możliwe przy zgłoszeniu 48 godzin przed upływem; nowa umowa zostanie wysłana Najemcy. W takim przypadku wymagane jest fizyczne lub online przedstawienie pojazdu.',
      'Podpisując, Najemca akceptuje warunki i oświadcza prawdziwość swoich danych.',
      'Zwracamy uwagę Najemcy na konieczność przestrzegania przepisów ruchu drogowego i bezpiecznej jazdy.',
      'Wszelka odpowiedzialność prawna i kary pieniężne wynikające z naruszeń przepisów ruchu drogowego obciążają Najemcę.',
      'Jeśli pojazd zostanie zwrócony w skrajnie brudnym stanie, Wynajmujący naliczy opłatę za sprzątanie w wysokości 50 €.',
    ],
    section1Heading: '1. PODSTAWOWE WYMAGANIA',
    section1DriverLine:
      '· Minimalne wymagania kierowcy: Najemca/Kierowca ma ponad 25 lat i posiada ważne prawo jazdy kategorii B od co najmniej 2 lat.',
    section1DocumentsLine:
      '· Ważność dokumentów: Dokumenty i prawo jazdy Najemcy muszą być ważne przez cały okres i akceptowane w UE.',
    section1PaymentHeading:
      '· Płatność: Przy odbiorze pojazdu możliwe są następujące metody płatności:',
    section1CashLine: '· Gotówka',
    section1CardLine: '· Karta płatnicza (VISA, Mastercard, Revolut itp.)',
    section1DepositLine: '· Kaucja: wymagana jest kaucja 500 €.',
    section1FullInsuranceLine:
      '· Pełne ubezpieczenie zgodnie z ofertą; ubezpieczenie w pełni zastępuje kaucję.',
    section2Heading: '2. WYŁĄCZENIA UBEZPIECZENIA',
    section2Intro:
      'Ubezpieczenie nie obejmuje następujących zdarzeń; koszty ponosi w całości Najemca. Obowiązek ten pozostaje także po zakończeniu najmu.',
    section2WrongFuel: '· Szkoda spowodowana zatankowaniem niewłaściwego paliwa.',
    section2Keys: '· Utrata, złamanie lub uszkodzenie kluczy pojazdu.',
    section2OffRoad:
      '· Szkody, przebicie opony, koszty holowania i napraw wynikające z jazdy w terenie (drogi nieutwardzone).',
    section2Alcohol:
      '· Wypadek/szkoda spowodowana lub poniesiona pod wpływem alkoholu, narkotyków lub innych substancji wpływających na zdolność prowadzenia pojazdu.',
    section2Fines: '· Mandaty drogowe i opłaty administracyjne.',
    section2UnauthorizedIsland:
      '· Jakakolwiek szkoda wynikająca z używania pojazdu na nieautoryzowanej wyspie.',
    section3Heading: '3. ZASADY UŻYTKOWANIA I ZWROTU',
    section3Island:
      '· Zakaz opuszczania wyspy: Pojazd nie może opuścić wyspy, na której został wynajęty (tylko na podstawie odrębnej umowy).',
    section3Fuel:
      '· Paliwo: Pojazd należy zwrócić z takim samym poziomem paliwa jak przy odbiorze. Wskaźnik zasięgu jest miarodajny.',
    section3Cancellation:
      '· Anulowanie / Zwrot: Zwrot proporcjonalny nie jest możliwy w przypadku wcześniejszego zakończenia najmu.',
    declarationHeading: 'III. OŚWIADCZENIE I PODPIS',
    declarationParagraph1:
      'Niniejsza umowa stanowi integralną i nieodłączną część załącznika Ogólnych Warunków (OW), dostępnego na naszej stronie www.zodiacsrentacar.com lub bezpośrednio pod: link.',
    declarationParagraph2:
      'Zapoznanie się z OW leży w interesie Najemcy; brak zapoznania to decyzja Najemcy i nie zwalnia go z ich stosowania.',
    declarationParagraph3:
      'Najemca oświadcza, że zapoznał się i akceptuje warunki niniejszej umowy oraz załącznika OW. Przyjmuje do wiadomości, że obowiązuje prawo hiszpańskie. Jurysdykcja: Wyspy Kanaryjskie',
    dateLine: 'Data: ..................................................... (Data)',
    cityLine: 'Miasto, <<Custom.Today>> Caleta de Fuste',
  },
};

export const CONTRACT_COPY: Record<ContractLocale, ContractCopy> = {
  en: EN_COPY,
  hu: HU_COPY,
  de: DE_COPY,
  ro: RO_COPY,
  fr: FR_COPY,
  es: ES_COPY,
  it: IT_COPY,
  sk: SK_COPY,
  cz: CZ_COPY,
  se: SE_COPY,
  no: NO_COPY,
  dk: DK_COPY,
  pl: PL_COPY,
};

const normalizeLocale = (value?: string | null) => {
  if (!value) return '';
  return value.toLowerCase().replace('_', '-');
};

export const resolveContractLocale = (
  locale?: string | null,
): ContractLocale => {
  const normalized = normalizeLocale(locale);
  if (!normalized) return 'en';
  const base = normalized.split('-')[0];
  if (base === 'cs') return 'cz';
  if (base === 'sv') return 'se';
  if (base === 'nb' || base === 'nn') return 'no';
  if (base === 'da') return 'dk';
  if ((LOCALES as readonly string[]).includes(base)) {
    return base as ContractLocale;
  }
  return 'en';
};

export const DATE_LOCALE_MAP: Record<ContractLocale, string> = {
  hu: 'hu-HU',
  en: 'en-GB',
  de: 'de-DE',
  ro: 'ro-RO',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  sk: 'sk-SK',
  cz: 'cs-CZ',
  se: 'sv-SE',
  no: 'nb-NO',
  dk: 'da-DK',
  pl: 'pl-PL',
};
