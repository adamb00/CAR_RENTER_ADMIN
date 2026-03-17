import {
  CONTRACT_COPY,
  DATE_LOCALE_MAP,
  type ContractLocale,
  resolveContractLocale,
} from '@/lib/contract-copy';

export const CONTRACT_VERSION = 'v3' as const;

export type ContractData = {
  bookingId: string;
  bookingCode?: string | null;
  locale?: string | null;
  renterName?: string | null;
  renterNationality?: string | null;
  renterEmail?: string | null;
  renterPhone?: string | null;
  renterAddress?: string | null;
  renterBirthPlace?: string | null;
  renterBirthDate?: string | null;
  renterIdCardNumber?: string | null;
  renterIdCardExpireDate?: string | null;
  renterDrivingLicenseNumber?: string | null;
  renterDrivingLicenseValidUntil?: string | null;
  ownerCompanyName?: string | null;
  ownerCompanyAddress?: string | null;
  ownerCompanyFiscal?: string | null;
  carLabel?: string | null;
  plate?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentalDays?: number | null;
  rentalFee?: string | null;
  deposit?: string | null;
  insurance?: string | null;
  pickupLocation?: string | null;
  pickupAddress?: string | null;
};

export type ContractTemplate = {
  title: string;
  intro: string;
  details: { label: string; value: string }[];
  terms: string[];
  footer: string;
  body: string;
};

const formatValue = (value?: string | null) =>
  value && value.trim().length > 0 ? value : '—';

const formatValueOr = (value: string | null | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback;

const formatDateShortLocale = (
  value: string | null | undefined,
  locale: ContractLocale,
) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(DATE_LOCALE_MAP[locale], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const formatDateOr = (
  value: string | null | undefined,
  fallback: string,
  locale: ContractLocale,
) =>
  value && value.trim().length > 0
    ? formatDateShortLocale(value, locale)
    : fallback;

const normalizeFee = (value: string | null | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\s*(€|eur)\s*$/i, '').trim();
};

const joinLabelValue = (label: string, value: string) => `${label} ${value}`;

const isNumericLike = (value: string) => /^[\d.,\s-]+$/.test(value);

const formatMoney = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  const normalized = normalizeFee(trimmed);
  if (!normalized) return fallback;
  if (!isNumericLike(normalized)) return trimmed;
  return `${normalized} EUR`;
};

const FINAL_BILINGUAL_CONTRACT_TEMPLATE = `VEHICLE RENTAL CONTRACT / GÉPJÁRMŰBÉRLETI SZERZŐDÉS

• LESSEE INFORMATION / A BÉRLŐ ADATAI
Name / Név: <<Customer.Name>>
Nationality: <<Customer.Nationality>>
ID or Passport No. / Személyi igazolvány vagy útlevél száma: <<Customer.IdCardNumber>>
Address / Cím: <<Customer.Address>>
Date of Birth / Születési dátum: <<Customer.BirthDate>>
Driving License No. / Jogosítvány száma: <<Customer.DrivingLicenseNumber>>
License Valid Until / Jogosítvány érvényessége: <<Customer.DrivingLicenseValidUntil>>
Tel. Numero: <<Customer.PhoneNumber>>

• VEHICLE INFORMATION / A JÁRMŰ ADATAI
Make and Model / Márka és típus: <<Car.Model>>
License Plate / Rendszám: <<Car.LicensePlate>>
Fuel Level (Pick-up) / Üzemanyagszint (átvételkor): ____________________________________________
Fuel type: 95 PETROL

• RENTAL PERIOD / BÉRLETI IDŐSZAK
From (day/hour/minute) / -tól (nap/óra/perc): <<Rent.From>>
To (day/hour/minute) / -ig (nap/óra/perc): <<Rent.To>>

• GENERAL TERMS AND CONDITIONS / ÁLTALÁNOS FELTÉTELEK
1. Minimum Driver Requirements: The Lessee must be over 25 years old and have held a valid Category B driving license for at least 2 years.
1. Minimális vezetői feltétel: A bérlőnek 25 év felettinek kell lennie, és legalább 2 éve érvényes B kategóriás jogosítvánnyal kell rendelkeznie.
2. Document Validity: All documents and licenses must remain valid during the rental period.
2. Okmányok érvényessége: Az összes okmánynak és jogosítványnak érvényesnek kell lennie a teljes bérleti idő alatt.
3. Payment Methods: Accepted payment methods are cash, bank card (VISA/Mastercard), Bizum, or Revolut.
3. Fizetési módok: Elfogadott fizetési módok: készpénz, bankkártya (VISA/Mastercard), Bizum vagy Revolut.
4. Deposit: A deposit of €500 is required, unless full insurance without deductible is contracted.
4. Letét: 500 € letét fizetendő, kivéve ha a bérlő teljes körű biztosítást köt (önrész nélkül).
5. Insurance Exclusions: Even with full insurance, the Lessee is responsible for damages caused by: wrong fuel, key loss or breakage, off-road driving, traffic fines, alcohol/drug use, or taking the vehicle to unauthorized islands.
5. Biztosítási kizárások: Teljes körű biztosítás mellett is a bérlő felel az alábbi károkért: hibás üzemanyag tankolása, kulcs elvesztése vagy eltörése, terepen való vezetés, közlekedési bírságok, alkohol vagy drog hatása alatti vezetés, illetve a jármű engedély nélküli szigetre vitele.
6. Fuel Policy: The vehicle must be returned with the same fuel level as when it was picked up (Full to Full).
6. Üzemanyag-szabály: Az autót ugyanazzal az üzemanyagszinttel kell visszahozni, mint átvételkor (Tele – Tele).
7. Island Restriction: The vehicle may not leave the island where it was rented, except with written authorization.
7. Sziget elhagyása: A jármű nem hagyhatja el a szigetet a bérbeadó írásos engedélye nélkül.
8. Early Return: No refunds will be made for early return or unused rental days.
8. Korai visszahozás: A bérleti díj idő előtti visszahozás esetén nem jár vissza.
9. Governing Law: This contract is governed by Spanish law.
9. Irányadó jog: A jelen szerződésre a spanyol jog az irányadó.

• DECLARATION AND SIGNATURES / NYILATKOZAT ÉS ALÁÍRÁS
The Lessee declares that they have read, understood, and accepted all terms and conditions stated in this contract.
A bérlő kijelenti, hogy a jelen szerződésben foglalt feltételeket elolvasta, megértette és elfogadta.
Lessee / Bérlő: ____________________________________________
Signature / Aláírás: ____________________________________________
Date / Dátum: <<SIGNED_AT>>
Company / Cég: ZODIACS RENT A CAR – THOMYFUERTEVENTURA S.L. 35610 C/LA MARESIA 26. +34683192422`;

const replaceContractToken = (
  source: string,
  token: string,
  value: string,
) => source.replaceAll(token, value);

const buildFinalBilingualContractLines = ({
  renterName,
  renterNationality,
  renterIdCardNumber,
  renterAddress,
  renterBirthDate,
  renterDrivingLicenseNumber,
  renterDrivingLicenseValidUntil,
  renterPhone,
  carModel,
  carLicensePlate,
  rentFrom,
  rentTo,
  signedAt,
}: {
  renterName: string;
  renterNationality: string;
  renterIdCardNumber: string;
  renterAddress: string;
  renterBirthDate: string;
  renterDrivingLicenseNumber: string;
  renterDrivingLicenseValidUntil: string;
  renterPhone: string;
  carModel: string;
  carLicensePlate: string;
  rentFrom: string;
  rentTo: string;
  signedAt: string;
}) => {
  let content = FINAL_BILINGUAL_CONTRACT_TEMPLATE;
  content = replaceContractToken(content, '<<Customer.Name>>', renterName);
  content = replaceContractToken(
    content,
    '<<Customer.Nationality>>',
    renterNationality,
  );
  content = replaceContractToken(
    content,
    '<<Customer.IdCardNumber>>',
    renterIdCardNumber,
  );
  content = replaceContractToken(content, '<<Customer.Address>>', renterAddress);
  content = replaceContractToken(
    content,
    '<<Customer.BirthDate>>',
    renterBirthDate,
  );
  content = replaceContractToken(
    content,
    '<<Customer.DrivingLicenseNumber>>',
    renterDrivingLicenseNumber,
  );
  content = replaceContractToken(
    content,
    '<<Customer.DrivingLicenseValidUntil>>',
    renterDrivingLicenseValidUntil,
  );
  content = replaceContractToken(
    content,
    '<<Customer.PhoneNumber>>',
    renterPhone,
  );
  content = replaceContractToken(content, '<<Car.Model>>', carModel);
  content = replaceContractToken(
    content,
    '<<Car.LicensePlate>>',
    carLicensePlate,
  );
  content = replaceContractToken(content, '<<Rent.From>>', rentFrom);
  content = replaceContractToken(content, '<<Rent.To>>', rentTo);
  content = replaceContractToken(content, '<<SIGNED_AT>>', signedAt);
  return content.split('\n');
};

const EN_FULL_LEGAL_TEXT = `CAR RENTAL AGREEMENT

1. Parties and Formation of the Agreement
This agreement is concluded between ZODIACSRENTACAR Thomy Fuerteventura SL (hereinafter: Lessor) and the natural or legal person accepting the offer (hereinafter: Renter).
The Parties accept the terms of this Agreement as binding and valid for the entire rental period until the vehicle return is finally recorded and closed.

Lessor details:
Company name: ZODIACSRENTACAR (www.zodiacsrentacar.com)
Registered office: Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spain
Tax ID (CIF): B13702493
Email: info@zodiacsrentacar.es
Central phone: +34 683-192-422

Quote requests and bookings can be made via www.zodiacsrentacar.com and the email address above.
Quote responses, booking confirmations, or booking refusals are sent to the email provided in the data form.
The Lessor reserves the right to refuse a booking request for operational reasons (especially if requested vehicles are unavailable), or if the request is incomplete, inaccurate, or non-compliant with applicable rental conditions and regulations.
The person named in this Agreement, the booking holder, and the primary driver must be the same person. Agreements and bookings are non-transferable.
For security reasons, no bank or financial data is requested via the platform, but the Renter must present such data (especially a credit card) when collecting the vehicle at the office.
The credit card must belong to the Renter and must remain valid in the Canary Islands during the rental period and for an additional three (3) months to cover potential post-rental charges (e.g., fines, damages).
Major credit cards (Visa/MC/Amex/Dinners) and bank-issued cards are accepted. Debit cards are not accepted.
The Lessor accepts a 500 EUR deposit for the rental period, refundable within 15 calendar days after return, provided the vehicle condition complies with this Agreement.
Information regarding personal data processing and other legal conditions is available in the GDPR policy on the Lessor's website; by signing, the Renter declares acceptance.

2. Rental Conditions and Driver Requirements
The Lessor does not rent vehicles to drivers under 25 years of age.
Users may rent a vehicle only if all of the following are met:
a) At least twenty-five (25) years old.
b) Hold a valid EU driving license, at least category B.
c) Hold the above license with at least two (2) years of verified driving experience at the time of booking request.
These requirements are mandatory and cannot be waived.
(*) In accordance with Spanish law... (this paragraph remains unchanged due to prior legal review).
The same requirements apply to additional drivers designated by the Renter.
After booking confirmation, the Lessor may cancel if:
- customer information is incorrect, untrue, or outdated;
- a required document expires during the rental period;
- the Renter breaches rental terms.

3. Conditions Applicable to the Rented Vehicle
The booked vehicle model is indicative only and may be replaced with a vehicle of the same or higher category from the Lessor fleet.

GPS tracking:
By signing this Agreement, the Renter consents to vehicle geolocation for security and contractual compliance monitoring. No image or audio recording is performed.

Restriction of use:
The vehicle may not leave the island where it was rented, unless separately agreed and recorded in the booking system.
If rental is explicitly extended to Lanzarote or return location is Lanzarote, the Parties proceed under those agreed conditions; all other terms remain valid.

Other usage rules:
The Renter accepts all applicable national regulations, including traffic rules.
The vehicle may not be used for illegal purposes.
The vehicle may only be driven on paved public roads.
WARNING: if the vehicle is used on unpaved roads, all resulting puncture, recovery, transport, or on-site repair costs are borne by the Renter.
The vehicle may not be used for commercial or advertising purposes.
Only recommended fuel may be used. In case of wrong fuel, the Lessor must be notified immediately and the vehicle must not be started. All resulting costs are borne by the Renter.
When leaving or parking, the Renter must secure the vehicle fully (windows closed) and prevent unauthorized use. Parking must be done with parking brake and proper gear; on slopes, wheels must be turned toward the curb.
Child seats (if any) are provided at handover, but correct installation is always the Renter's responsibility.
Sports equipment (e.g., surfboards) must not be transported or stored in the cabin. Luggage/surfboards must be properly secured on the roof rack when rented.
In case of malfunction, the vehicle must be stopped safely and the Lessor must be notified immediately.
Before rental start, the Renter must verify mandatory accessories.

Liability:
From handover until validated return, the Renter is responsible for lawful and technically proper operation and condition preservation of the vehicle.
If return is not performed as prescribed by the Lessor (e.g., no personal handover), Renter liability extends until the Lessor records actual takeover and checks technical and cosmetic condition.
The Renter is liable for defects/damages and repair costs.

4. Vehicle Handover and Return Policy
Handover and return take place at the office, dates, and times specified in the booking (as confirmed by the Lessor).
Under no circumstances may the vehicle be returned on an island different from the one stated in this Agreement.
Collection is possible only during opening hours.
Return outside opening hours is possible without extra charge according to booking details.
Airport handover outside opening hours may be free; other locations may involve delivery fees, recorded in the booking system.
Typical office hours are 10:00-13:00 and 16:00-20:00; current schedule can be checked by email, WhatsApp, or phone.

Delay / Cancellation:
If a flight is delayed or cancelled, timely notice is required. Without notice, booking retention cannot be guaranteed.
The Lessor will make reasonable efforts to maintain the booking, but if no longer possible, may cancel without compensation and freely reallocate the vehicle.

The vehicle must be returned in the same condition as received. Otherwise, the Renter must provide supporting documents/reports concerning incidents or damage.
No refund is granted for early return.

Fuel:
At return, fuel level must match the level at handover.
If fuel is lower, the Lessor charges missing fuel and refueling service, payable at return.
If fuel is higher, no refund of the difference is provided.
The Renter must ensure no personal items remain in the vehicle at return. The Lessor is not responsible for items left in the vehicle and cannot store or ship them.

5. Services and Insurance
Final booking price includes:
1) Taxes (IGIC/IVA included).
2) Unlimited kilometers.
3) Free second driver.
4) Service at office location (Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas).
5) Free booking cancellation (see Section 9).
6) Free approved baby seats and child booster seats (non-ISOFIX; optionally rentable). According to Spanish traffic law, minors under 135 cm must use approved child restraint systems.
7) The following insurance (zero deductible):
   a. Collision Damage Waiver (CDW)
   b. Theft Protection (TP)
   c. Third-party liability (TI)
No deductible/deposit pre-authorization is required except the 500 EUR deposit stated in Section 1.

6. Situations Not Covered by Insurance
IMPORTANT: zero-deductible insurance does not cover:
- tire/wheel damage caused on unpaved roads;
- loss/breakage/damage of keys;
- wrong fuel refueling;
- accidents caused by reckless driving or driving under alcohol/drugs/psychotropic substances;
- off-road driving related incidents;
- fines (parking, speeding, traffic violations).
In these cases, the Renter bears full financial liability.

7. Optional Extras
As optional/additional services, the Renter may rent:
a) Roof rack for luggage transport at the price displayed on the website.
   Ropes/straps are not included, only rails and bars.
   Roof racks can carry up to 2 surfboards if properly secured.
   The Lessor is not liable for damage caused by items carried on the roof or damage to third parties; responsibility lies with the Renter.

All base and optional services are available under the general terms agreed with the Lessor.

8. Fuel Policy
The vehicle must be returned with the same fuel quantity as at pickup.
If incorrect fuel type is used, the Renter is responsible for all resulting damage and repairs.

9. Payment and Refund Policy
The Lessor offers online payment for rental fees on the website.
Booking is considered completed when payment is made by credit/debit/bank card.
Online payment provider: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927)

Refund policy:
a) Full refund only if cancellation is made no later than 3 calendar days (72 hours) before rental start.
b) No partial refund for early return.
c) Applicable refunds are made by bank transfer. Renter must contact info@zodiacsrentacar.es or +34 683192422 and provide IBAN and full name. Transfer is processed within 15 working days.

10. Modification of These General Terms
The Lessor may modify these terms at any time, especially to align with regulatory changes or applicable commercial policy.

11. Applicable Law and Jurisdiction
For disputes related to these terms, the Parties waive any other jurisdiction and submit to the competent courts and tribunals of Santa Cruz de Tenerife, in accordance with applicable Spanish law.

Date of signature: <<SIGNED_AT>>`;

const HU_FULL_LEGAL_TEXT = `BÉRLETI SZERZŐDÉS

1. A Szerződő Felek és a Szerződés Létrejötte
Jelen szerződés létrejön a ZODIACSRENTACAR Thomy Fuerteventura SL. (továbbiakban: Bérbeadó) és az ajánlatot elfogadó természetes vagy jogi személy (továbbiakban: Bérlő) között.
A Felek a Szerződésben foglaltakat a bérleti idő teljes időtartama alatt, a jármű visszavételének végleges rögzített lezárásáig, magukra nézve kötelezőnek és érvényesnek fogadják el.

A Bérbeadó adatai:
Cégnév: ZODIACSRENTACAR (www.zodiacsrentacar.com)
Székhely: Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spanyolország
Adóazonosító szám (CIF): B13702493
E-mail cím: info@zodiacsrentacar.es
Központi Telefonszám: +34 683-192-422

Az ajánlatkérés és a foglalás a www.zodiacsrentacar.com weboldalon keresztül, valamint a fent rögzített e-mail címen lehetséges.
Az ajánlatkérést, annak elfogadását követő foglalás visszaigazolását vagy esetleges visszautasítását az adatközlő űrlapon megadott e-mail címre küldjük.
A Bérbeadó fenntartja a jogot, hogy működési okokból (különösen a kért járművek nem elérhetősége esetén) elutasítson vagy megtagadjon egy adott foglalási kérelmet, ha az hiányos, pontatlan vagy nem felel meg a hatályos bérleti feltételeknek vagy szabályozásoknak.
A Szerződésen megnevezett személynek, a foglalás jogosultjának és az elsőszámú sofőrnek ugyanazon személynek kell lennie. A szerződések és a foglalások más személyre nem ruházhatók át.
Biztonsági okokból a platformon keresztül nem kérünk banki vagy pénzügyi információkat, de a Bérlő köteles azokat (különösen a hitelkártyáját) bemutatni a bérelt jármű irodában történő átvételekor.
A hitelkártyának a Bérlő tulajdonában kell lennie. A bérlet időtartama alatt és azt követően további három (3) hónapig a hitelkártyának érvényesnek és hatályosnak kell lennie a Kanári-szigetek területén az esetleges utólagos költségek (pl. bírságok, károk) fedezetére.
Elfogadjuk a főbb hitelkártyákat (Visa/MC/Amex/Dinners), valamint a pénzintézetek által kibocsátott bankkártyákat. Betéti kártyákat (Debit kártyákat) nem fogadunk el.
A Bérbeadó elfogad 500 EUR kauciót (letétet) a bérlés időtartamára, amelyet a jármű visszaszállítását követő 15 naptári napon belül utal vissza a Bérlő részére, feltéve, hogy a jármű állapota a szerződésnek megfelelő.
Személyes adatainak feldolgozásáról és a platform működésével kapcsolatos egyéb jogi feltételekről a Bérbeadó weboldalán található GDPR adatkezelési szabályzat tájékoztat, melynek megismeréséről és elfogadásáról a Bérlő jelen szerződés aláírásával elfogadóan nyilatkozik.

2. Bérleti Feltételek és Sofőr Követelmények
A Bérbeadó nem ad bérbe járműveket 25 év alatti sofőröknek.
A felhasználók csak akkor bérelhetnek járművet a Bérbeadótól, ha megfelelnek a következő követelményeknek:
a) Legalább huszonöt (25) évesek.
b) Európai Unióban érvényes vezetői engedéllyel rendelkeznek, legalább B kategóriában.
c) A fent említett érvényes jogosítvánnyal legalább két (2) éves, igazolt vezetői tapasztalattal rendelkeznek a foglalási kérelem időpontjában.
Fenti feltételek teljesítése kötelező, azoktól eltekinteni nem lehetséges.
(*) A spanyol jognak megfelelően... (itt a szöveg a spanyol jogszabályokról szóló bekezdést tartalmazza, melyet jogi ellenőrzöttsége miatt változatlanul hagyunk).
Ugyanezek a feltételek és követelmények vonatkoznak a Bérlő által biztosított további sofőrökre is.
A foglalás megerősítése után a Bérbeadó a következő esetekben törölheti azt:
- Ha kiderül, hogy az ügyfél által megadott információk nem helyesek, nem igazak vagy nem naprakészek.
- Ha a bérlet ideje alatt valamely szükséges dokumentum érvényessége lejár.
- Ha a Bérlő megszegi a bérleti feltételeket.

3. A Bérelt járműre vonatkozó feltételek
A lefoglalt jármű modellje csak tájékoztató jellegű, és helyettesíthető a Bérbeadó flottájában található, azonos vagy magasabb kategóriájú járművel.

GPS-nyomkövetés:
A járművek nyomon követéséhez a Bérlő a bérleti szerződés aláírásával hozzájárul. A Bérbeadó munkatársai a geolokációs adatokhoz hozzáférhetnek, kizárólag a jármű biztonságának és a bérleti feltételek betartásának ellenőrzése céljából. Ezen eszközök kép- vagy hangrögzítésre nem alkalmasak.

Használat Korlátozása:
A jármű nem hagyhatja el azt a szigetet, ahol bérelték. Kivétel ez alól az, ha erről egyedi megállapodás születik, mely a Bérbeadó foglalási rendszerében rögzítésre kerül.
Amennyiben Lanzarote szigetre kiterjesztett bérleti szerződés jön létre, vagy a gépjármű leadásának helyszíne Lanzarote, úgy a Felek ezen feltételek szerint járnak el. Ezen esetben a Szerződés minden más pontját Felek magukra nézve hatályosnak ismerik el.

Egyéb használati szabályok:
A Bérlő magára nézve hatályosnak és kötelező érvényűnek fogadja el a vonatkozó nemzeti előírásokat, jogszabályokat, ideértve a Közlekedési szabályokat is.
A gépjármű nem használható jogellenes célokra vagy azok elkövetésének eszközeként.
A jármű csak közutakon (szilárd burkolatú) közlekedhet.
FIGYELEM: Amennyiben a járművet nem burkolt úton használták, az ebből eredő defektek költségei, valamint a jármű mentésének, szállításának vagy helyszíni javításának költségei a Bérlőt terhelik.
Nem használható kereskedelmi vagy reklám célokra.
A járműhöz ajánlott üzemanyagot kell használni. Nem kompatibilis üzemanyag tankolása esetén azonnal értesíteni kell a Bérbeadót, és a járművet tilos elindítani. Az ilyen esetek költségei a Bérlőt terhelik.
A Bérlő köteles meggyőződni arról, hogy a jármű elhagyásakor vagy parkolásakor az teljesen zárt (ablakok felhúzva), és mindent megtett a jármű illetéktelen használatának megakadályozásáért. Parkolásnál a rögzítőféket és a megfelelő sebességi fokozatot használva, lejtőn a kormányzott kerekeket a padka felé forgatva kell a járművet rögzíteni.
A gyermeküléseket (ha vannak) az autó átvételekor biztosítjuk, de azok helyes rögzítése minden esetben a Bérlő feladata és felelőssége.
Sporteszközöket (pl. szörfdeszkákat) az autó utasterében semmilyen módon nem szabad szállítani vagy tárolni. A Bérlő köteles gondoskodni arról, hogy a poggyász vagy a szörfdeszkák megfelelően rögzítve legyenek a tetőcsomagtartóhoz, amennyiben ilyet bérelt.
Meghibásodás észlelése esetén a járművet meg kell állítani a közlekedés szabályainak megfelelően, biztonságosan le kell parkolni, és haladéktalanul értesíteni kell a Bérbeadót.
A kötelező tartozékok meglétéről a Bérlő a bérlet megkezdése előtt köteles meggyőződni.

Felelősség:
A Bérlő a bérleti időszak alatt, azaz a jármű átvételétől kezdve egészen addig a pillanatig felelős a jármű jogszerű és műszakilag megfelelő üzemeltetéséért, valamint állapotának megóvásáért, amíg azt a Bérbeadó munkatársának igazoltan, megfelelő állapotban, átadás-átvételi eljárásban visszaadja.
Ha a visszaadás nem a Bérbeadó által megadott módon történik (pl. nem személyes átvétel), a Bérlő felelőssége meghosszabbodik a jármű tényleges átvételének Bérbeadó általi regisztrációjáig és a jármű műszaki, esztétikai állapotának ellenőrzéséig.
Esetleges hibákért és sérülések javításának költségeiért a Bérlő helytállni köteles.

4. A Jármű Átadási és Visszavételi Szabályzata
A bérelt jármű átadása és visszavétele a foglalásban meghatározott irodában, dátumokon és időpontokban történik (a Bérbeadó által megerősítve).
A járművet semmilyen körülmények között sem lehet a bérleti szerződésben rögzítettől eltérő szigeten visszaadni.
A bérelt járművet csak nyitvatartási időben lehet átvenni.
A kölcsönző iroda szokásos nyitvatartási idején kívül is vissza lehet adni további költségek nélkül, a foglalási folyamat során megadottak szerint.
Nyitvatartási időn túl vagy azt megelőzően reptéren ingyenesen, más helyszínre szállítva szállítási díj ellenében irodánk kérés esetén megszervezi a gépjármű átvételét. Ezen esetek a foglalási rendszerünkben történnek rögzítésre.
Az iroda nyitvatartási ideje általában 10:00 és 13:00 óra, valamint 16:00 és 20:00 óra között van. E-mailben, WhatsApp-on vagy telefonon keresztül érdeklődhet az aktuális időpontról.

Késés/Törlés:
Ha a járat késik vagy törlődik, kérjük, időben értesítsen minket. Ha ezt elmulasztja, nem tudjuk garantálni a foglalás fenntartását.
A Bérbeadó mindent megtesz a fenntartás érdekében, de ha ez már nem lehetséges, fenntartja a jogot, hogy törölje a foglalását, és így kártérítési igény nélkül szabadon rendelkezzen a lefoglalt járművel.
A járművet ugyanolyan állapotban kell visszaadni, mint ahogyan azt átvették. Ellenkező esetben a Bérlőnek dokumentációt, jelentést vagy igazoló dokumentumot kell benyújtania a járműben történt esetleges eseményekről vagy károkról.
A jármű idő előtti visszaszolgáltatásáért a Bérlőnek nem jár visszatérítés.

Üzemanyag:
Visszavételkor a gépjármű üzemanyagszintjének az átvétel szerinti mértékben kell lennie.
Kevesebb üzemanyag mennyiség esetén a Bérbeadó felszámolja a hiányzó üzemanyag és a tankolási szolgáltatás költségét, melyet a Bérlő a visszavételkor köteles megfizetni.
Több üzemanyag esetén nem áll módunkban a különbözetet visszafizetni a Bérlő részére.
Kérjük, győződjön meg arról, hogy a jármű visszaadásakor semmilyen tárgy, érték nem maradt a járműben. A Bérbeadó nem vállal felelősséget a gépjárműben hagyott értékekért és tárgyakért. Megőrizni vagy a Bérlő számára elküldeni nem áll módunkban.

5. Szolgáltatások és Biztosítás
A járműfoglalás végső ára a következő tételeket tartalmazza:
1) Adók (IGIC/IVA benne).
2) Korlátlan kilométer.
3) Ingyenes második sofőr.
4) Szolgáltatás irodánkban (Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas).
5) Ingyenes foglalás lemondása (lásd a 9. pontot).
6) Ingyenesen jóváhagyott babaülések és gyermekülés-magasítók (nem ISOFIX-esek, amelyeket ügyfeleink opcionálisan bérelhetnek). A spanyol közlekedési szabályok szerint a 135 cm-nél alacsonyabb kiskorúaknak jóváhagyott gyermekülést kell használniuk.
7) A következő biztosítások (önrész nélkül / nulla önrésszel):
   a. Töréskár-biztosítás (CDW)
   b. Lopás elleni védelem (TP)
   c. Harmadik félnek okozott károk (TI)
Nem szükséges önrész (letét, készpénzes vagy kártya-előengedélyezés), kivéve az 1. pontban rögzített 500 EUR-os kauciót.

6. A Biztosítás Által Nem Fedezett Helyzetek Vagy Események
FONTOS! A fenti nulla önrészes biztosítás nem fedezi a következő helyzeteket vagy eseményeket:
- Gumiabroncsok és kerekek nem aszfaltozott úton történt sérülése.
- A gépkocsi kulcsainak elvesztése, törése vagy rongálása.
- Rossz üzemanyaggal történő feltöltés.
- Felelőtlen vezetéssel, vagy alkohol, kábítószer, illetve bármilyen más mérgező vagy pszichotróp anyag hatása alatt történő baleset.
- Terepvezetés (nem szilárd burkolaton közlekedés esetén bekövetkező baleseti és/vagy káresemények).
- Bírságok (parkolás, gyorshajtás, közlekedési szabálysértés).
Ezekben az esetekben az ebből eredő károkért és költségekért a Bérlő teljes anyagi felelősséggel tartozik.

7. Opcionális Extrák
Opcionális vagy kiegészítő szolgáltatásként a Bérlők a következő opcionális extrákat bérelhetik:
a) Tetőcsomagtartó poggyász szállítására, a weboldalon feltüntetett áron.
Nem tartalmazza a kötélzetet, csak a járműhöz rögzítő síneket és rudakat.
A tetőcsomagtartók akár 2 szörfdeszkát is képesek szállítani, megfelelően rögzítve.
A Bérbeadó semmilyen esetben sem vállal felelősséget a jármű tetején szállított tárgyak által okozott károkért vagy harmadik feleknek okozott károkért. Az ilyen károkért a Bérlő a felelős.
Minden alap- és opcionális szolgáltatásunk a Bérlő rendelkezésére áll, és a Bérbeadóval kötött általános feltételek szerint garantáljuk azokat.

8. Üzemanyag-politika
A járművet a Bérlőnek ugyanolyan mennyiségű üzemanyaggal kell visszaadnia, mint amilyennel átvette.
Ha a Bérlő nem a megfelelő típusú üzemanyaggal tankolja a járművet, felelős a járműben szükséges károkért és javításokért.

9. Fizetési és Visszatérítési Szabályzat
A Bérbeadó online fizetési lehetőséget kínál a bérleti díj weboldalunkon történő megfizetésére.
A foglalás akkor tekintendő teljesítettnek, amikor a fizetés hitelkártyával/betéti kártyával/bankkártyával megtörtént.
Az online fizetés szolgáltatója: CAIXABANK (Bankszámlaszám: ES60 2100 1512 2602 0067 6927)

Visszatérítési szabályzat:
a) Teljes visszatérítésre csak a bérleti időszak kezdete előtt legkésőbb 3 naptári nappal (72 órával) történő lemondás esetén van lehetőség.
b) A Bérbeadó nem téríti vissza a bérleti díj részleges részét, ha a járművet a bérleti szerződésben meghatározottnál korábban hozzák vissza.
c) A visszatérítés - amennyiben alkalmazandó - banki átutalással történik. A Bérlőnek fel kell vennie a kapcsolatot az info@zodiacsrentacar.es e-mail címen vagy a +34 683192422 telefonszámon, és meg kell adnia az IBAN számot és a teljes nevét a visszatérítéshez. A Bérbeadó 15 munkanapon belül végrehajtja az átutalást.

10. Ezen Általános Feltételek Módosítása
A Bérbeadó ezeket a feltételeket bármikor módosíthatja, különösen a szabályozási változásokhoz vagy az alkalmazandó kereskedelmi politikához való igazodás érdekében.

11. Alkalmazandó Jog és Joghatóság
A jelen feltételek bármelyikével kapcsolatos vita vagy eltérés esetén a Felek lemondanak minden más alkalmazandó joghatóságról, és megállapodnak abban, hogy alávetik magukat a Santa Cruz de Tenerife illetékes bíróságainak és törvényszékeinek, az egyes esetekben alkalmazandó spanyol jogszabályok rendelkezéseivel összhangban.

Aláírás dátuma: <<SIGNED_AT>>`;

const DE_FULL_LEGAL_TEXT = `MIETVERTRAG

1. Vertragsparteien und Vertragsabschluss
Dieser Vertrag wird zwischen ZODIACSRENTACAR Thomy Fuerteventura SL (nachfolgend: Vermieter) und der natürlichen oder juristischen Person, die das Angebot annimmt (nachfolgend: Mieter), geschlossen.
Die Parteien erkennen die Bedingungen dieses Vertrags für die gesamte Mietdauer bis zur endgültigen protokollierten Rückgabe des Fahrzeugs als verbindlich an.
Vermieter: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spanien, CIF: B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Buchungen erfolgen über www.zodiacsrentacar.com oder per E-Mail.
Der Vermieter kann Buchungsanfragen aus betrieblichen Gründen oder bei unvollständigen/fehlerhaften Angaben ablehnen.
Vertragspartner, Buchungsinhaber und Hauptfahrer müssen identisch sein; Übertragung ist ausgeschlossen.
Zur Fahrzeugübernahme ist eine auf den Mieter ausgestellte, gültige Kreditkarte vorzulegen; Gültigkeit während der Miete und 3 Monate danach (Kanaren) erforderlich.
Akzeptiert: Visa/MC/Amex/Dinners und von Banken ausgegebene Karten. Debitkarten werden nicht akzeptiert.
Kaution: 500 EUR, Rückerstattung innerhalb von 15 Kalendertagen nach ordnungsgemäßer Rückgabe.

2. Mietbedingungen und Fahreranforderungen
Mindestalter: 25 Jahre.
Erforderlich: gültiger EU-Führerschein Kategorie B und mindestens 2 Jahre nachweisbare Fahrpraxis.
Diese Voraussetzungen sind zwingend.
(*) Der rechtlich geprüfte Absatz zum spanischen Recht bleibt unverändert.
Dieselben Anforderungen gelten für Zusatzfahrer.
Nach Bestätigung kann die Buchung storniert werden, wenn Angaben falsch/veraltet sind, Dokumente ablaufen oder Vertragsbedingungen verletzt werden.

3. Bedingungen für das Mietfahrzeug
Das gebuchte Modell ist unverbindlich; Ersatz durch gleichwertige oder höhere Kategorie ist möglich.
GPS-Ortung wird vom Mieter mit Unterschrift zu Sicherheits- und Kontrollzwecken akzeptiert (keine Bild-/Tonaufzeichnung).
Das Fahrzeug darf die Mietinsel nicht verlassen, außer bei gesonderter, im Buchungssystem erfasster Vereinbarung.
Bei vereinbarter Erweiterung nach Lanzarote gelten die gesonderten Bedingungen; alle übrigen Vertragsbestimmungen bleiben in Kraft.
Nutzung nur im Rahmen geltender Gesetze und Verkehrsregeln.
Keine rechtswidrige Nutzung, keine gewerbliche/werbliche Nutzung.
Fahrt nur auf befestigten Straßen.
WARNUNG: Nutzung auf unbefestigten Straßen führt zu voller Kostenpflicht des Mieters (Reifen, Bergung, Transport, Reparatur).
Nur empfohlenen Kraftstoff tanken; bei Fehlbetankung Vermieter sofort informieren und Fahrzeug nicht starten.
Bei Parken/Verlassen ist das Fahrzeug vollständig zu sichern.
Kindersitze werden bereitgestellt, korrekte Befestigung liegt in der Verantwortung des Mieters.
Sportausrüstung darf nicht im Innenraum transportiert werden; Dachladung ist ordnungsgemäß zu sichern.
Bei Störung: sicher anhalten, absichern, Vermieter sofort benachrichtigen.
Der Mieter prüft vor Mietbeginn die vorgeschriebene Fahrzeugausstattung.

Haftung:
Der Mieter haftet von der Übernahme bis zur bestätigten Rückgabe für rechtmäßigen und technisch ordnungsgemäßen Betrieb sowie Zustandserhaltung.
Bei nicht ordnungsgemäßer Rückgabe (z. B. ohne persönliche Übergabe) dauert die Haftung bis zur tatsächlichen Übernahme und Prüfung durch den Vermieter.

4. Übergabe- und Rückgaberegeln
Übergabe und Rücknahme erfolgen zu den bestätigten Terminen am vereinbarten Ort.
Rückgabe auf einer anderen Insel ist ausgeschlossen.
Abholung nur während Öffnungszeiten; Rückgabe außerhalb Öffnungszeiten gemäß Buchung möglich.
Flughafen-/Sonderübergaben außerhalb Zeiten können je nach Fall kostenfrei oder kostenpflichtig sein.
Übliche Öffnungszeiten: 10:00-13:00 und 16:00-20:00 (aktuell per E-Mail/WhatsApp/Telefon).
Bei Flugverspätung/-ausfall ist rechtzeitige Information erforderlich; sonst kann die Reservierung nicht garantiert werden.
Frühere Rückgabe begründet keinen Erstattungsanspruch.
Rückgabezustand muss dem Übernahmezustand entsprechen; andernfalls sind Nachweise/Unterlagen vorzulegen.

Kraftstoff:
Rückgabe mit gleichem Kraftstoffstand wie bei Übernahme.
Bei geringerem Stand: Nachfüllung + Servicekosten zulasten des Mieters.
Mehrkraftstoff wird nicht erstattet.

5. Leistungen und Versicherung
Im Endpreis enthalten:
Steuern (IGIC/IVA), unbegrenzte Kilometer, kostenloser zweiter Fahrer, Service am Bürostandort, kostenlose Stornierung (siehe Punkt 9), zugelassene Kindersitze/Booster.
Versicherung ohne Selbstbehalt: CDW, TP, TI.
Keine Selbstbehalts-Blockierung außer der Kaution von 500 EUR.

6. Nicht versicherte Fälle
Nicht gedeckt sind u. a.: Schäden an Reifen/Felgen auf unbefestigten Straßen, Schlüsselverlust/-schaden, Fehlbetankung, Fahren unter Alkohol/Drogen, Offroad-Schäden, Bußgelder.
Hierfür haftet der Mieter voll.

7. Optionale Extras
Optional buchbar: Dachgepäckträger gemäß Website-Preis.
Befestigungsseile sind nicht enthalten.
Der Mieter haftet für Schäden durch transportierte Gegenstände und gegenüber Dritten.

8. Kraftstoffpolitik
Rückgabe mit gleichem Kraftstoffniveau; bei falschem Kraftstoff haftet der Mieter für sämtliche Schäden und Reparaturen.

9. Zahlung und Erstattung
Online-Zahlung über Website möglich; Buchung gilt nach Kartenzahlung als abgeschlossen.
Zahlungsanbieter: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Volle Erstattung nur bei Stornierung spätestens 72 Stunden vor Mietbeginn.
Keine anteilige Erstattung bei vorzeitiger Rückgabe.
Erstattungen erfolgen per Überweisung nach Kontaktaufnahme und Angabe von IBAN + vollständigem Namen innerhalb von 15 Werktagen.

10. Änderung der Bedingungen
Der Vermieter kann diese Bedingungen jederzeit an gesetzliche oder geschäftliche Änderungen anpassen.

11. Anwendbares Recht und Gerichtsstand
Die Parteien unterwerfen sich den zuständigen Gerichten von Santa Cruz de Tenerife nach spanischem Recht.

Datum der Unterzeichnung: <<SIGNED_AT>>`;

const RO_FULL_LEGAL_TEXT = `CONTRACT DE ÎNCHIRIERE

1. Părțile contractante și încheierea contractului
Prezentul contract se încheie între ZODIACSRENTACAR Thomy Fuerteventura SL (Locator) și persoana fizică/juridică ce acceptă oferta (Chiriaș).
Părțile acceptă condițiile ca fiind obligatorii pe întreaga durată a închirierii, până la înregistrarea finală a returului vehiculului.
Date Locator: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spania, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Solicitarea ofertei și rezervarea se fac pe www.zodiacsrentacar.com sau prin e-mail.
Locatorul poate refuza rezervări din motive operaționale ori pentru date incomplete/inexacte.
Titularul rezervării și șoferul principal trebuie să fie aceeași persoană; transferul rezervării nu este permis.
La preluare, Chiriașul trebuie să prezinte card de credit pe numele său, valabil pe durata închirierii și încă 3 luni în Insulele Canare.
Se acceptă carduri principale (Visa/MC/Amex/Dinners) și carduri bancare emise de instituții financiare; cardurile de debit nu sunt acceptate.
Garanție: 500 EUR, rambursabilă în 15 zile calendaristice după retur, dacă vehiculul este conform contractului.

2. Condiții de închiriere și cerințe șofer
Vârsta minimă: 25 ani.
Permis UE valabil categoria B, cu minimum 2 ani experiență dovedită la data cererii.
Condițiile sunt obligatorii.
(*) Paragraful privind dreptul spaniol rămâne nemodificat (text verificat juridic).
Aceleași condiții se aplică și șoferilor suplimentari.
După confirmare, rezervarea poate fi anulată dacă datele sunt incorecte/neactualizate, expiră documente necesare sau sunt încălcate condițiile.

3. Condiții privind vehiculul închiriat
Modelul rezervat este orientativ; poate fi înlocuit cu vehicul de categorie identică/superioară.
Prin semnare, Chiriașul acceptă geolocalizarea vehiculului pentru securitate și verificarea respectării condițiilor (fără înregistrare audio/video).
Vehiculul nu poate părăsi insula unde a fost închiriat, cu excepția acordului explicit înregistrat în sistem.
Dacă există extindere spre Lanzarote/predare în Lanzarote, se aplică condițiile speciale convenite; restul clauzelor rămân valabile.
Vehiculul se utilizează doar legal, conform regulilor de circulație, numai pe drumuri asfaltate.
Conducerea off-road, utilizarea ilegală/comercială, alimentarea greșită și neasigurarea vehiculului la parcare atrag răspunderea integrală a Chiriașului.
Scaunele pentru copii sunt puse la dispoziție; montarea corectă este responsabilitatea Chiriașului.
Echipamentele sportive nu se transportă în habitaclu; pe plafon se fixează corespunzător.
În caz de defectare: oprire în siguranță și notificare imediată a Locatorului.

Răspundere:
Chiriașul răspunde de la predare până la returul validat pentru exploatarea legală/tehnică și conservarea stării vehiculului.
Dacă returul nu are loc conform procedurii Locatorului, răspunderea se prelungește până la preluarea și verificarea efectivă.

4. Predare și preluare
Predarea/returul se fac la datele, orele și locația confirmate.
Retur pe altă insulă este interzis.
Preluarea se face în program; returul în afara programului este posibil conform rezervării.
Program orientativ: 10:00-13:00 și 16:00-20:00.
În caz de întârziere/anulare zbor, Chiriașul trebuie să anunțe la timp; altfel menținerea rezervării nu este garantată.
Returul anticipat nu dă drept la rambursare.
Vehiculul se returnează în starea de la predare; altfel se prezintă documente justificative.

Combustibil:
Nivelul la retur trebuie să fie același ca la predare.
Dacă este mai mic, se facturează diferența + serviciul de alimentare.
Dacă este mai mare, diferența nu se restituie.

5. Servicii și asigurare
Prețul final include: taxe (IGIC/IVA), kilometri nelimitați, al doilea șofer gratuit, servicii la sediu, anulare gratuită (pct. 9), scaune copii omologate.
Asigurări fără franșiză: CDW, TP, TI.
Nu se solicită preautorizare suplimentară, cu excepția garanției de 500 EUR.

6. Situații neacoperite de asigurare
Nu sunt acoperite: daune anvelope/jante pe drumuri neasfaltate, chei pierdute/deteriorate, alimentare greșită, conducere sub alcool/droguri, incidente off-road, amenzi.
Costurile aferente sunt suportate integral de Chiriaș.

7. Extra-opționale
Portbagaj de plafon, conform prețurilor de pe site; corzile nu sunt incluse.
Locatorul nu răspunde pentru daunele provocate de obiectele transportate pe plafon; răspunde Chiriașul.

8. Politica de combustibil
Vehiculul se returnează cu același nivel de combustibil.
În caz de combustibil necorespunzător, Chiriașul suportă integral daunele și reparațiile.

9. Plată și rambursare
Plata online este disponibilă; rezervarea este finalizată după plata cu cardul.
Furnizor: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Rambursare integrală doar la anulare cu min. 72 ore înainte de începerea perioadei.
Nu se acordă rambursare parțială la retur anticipat.
Rambursările aplicabile se fac prin transfer bancar în 15 zile lucrătoare.

10. Modificarea condițiilor
Locatorul poate modifica aceste condiții oricând, în special pentru conformare legală/comercială.

11. Legea aplicabilă și jurisdicția
Litigiile se soluționează de instanțele competente din Santa Cruz de Tenerife, conform dreptului spaniol.

Data semnării: <<SIGNED_AT>>`;

const FR_FULL_LEGAL_TEXT = `CONTRAT DE LOCATION

1. Parties et formation du contrat
Le présent contrat est conclu entre ZODIACSRENTACAR Thomy Fuerteventura SL (Loueur) et la personne physique ou morale qui accepte l'offre (Locataire).
Les Parties reconnaissent les présentes conditions comme obligatoires pendant toute la durée de location, jusqu'à l'enregistrement définitif de la restitution.
Données du Loueur: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Espagne, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Les demandes et réservations sont possibles via www.zodiacsrentacar.com et par e-mail.
Le Loueur peut refuser une réservation pour raisons opérationnelles ou en cas d'informations incomplètes/inexactes.
Le titulaire de réservation et le conducteur principal doivent être la même personne; aucune cession n'est autorisée.
Le Locataire doit présenter une carte de crédit à son nom, valable pendant la location et 3 mois supplémentaires aux Canaries.
Cartes acceptées: Visa/MC/Amex/Dinners et cartes bancaires émises par établissement financier. Les cartes de débit ne sont pas acceptées.
Caution: 500 EUR, remboursée sous 15 jours calendaires après retour conforme.

2. Conditions de location et exigences conducteur
Âge minimum: 25 ans.
Permis UE valide catégorie B et au moins 2 ans d'expérience de conduite justifiée.
Ces conditions sont obligatoires.
(*) Le paragraphe relatif au droit espagnol reste inchangé (contrôle juridique).
Les mêmes exigences s'appliquent aux conducteurs supplémentaires.
Après confirmation, la réservation peut être annulée si les informations sont fausses/non à jour, en cas d'expiration de documents requis ou de violation des conditions.

3. Conditions d'utilisation du véhicule
Le modèle réservé est indicatif et peut être remplacé par un véhicule de catégorie équivalente ou supérieure.
Le Locataire consent à la géolocalisation du véhicule à des fins de sécurité et de contrôle contractuel (sans enregistrement audio/vidéo).
Le véhicule ne peut pas quitter l'île de location sauf accord spécifique enregistré.
En cas d'extension vers Lanzarote/retour à Lanzarote, les conditions convenues s'appliquent, le reste du contrat demeure valable.
Utilisation légale uniquement, sur routes revêtues.
Interdiction d'usage illégal/commercial, de conduite hors route, et d'alimentation carburant inadapté.
Le Locataire doit sécuriser le véhicule lors du stationnement et prévenir tout usage non autorisé.
Sièges enfants fournis; montage correct sous responsabilité du Locataire.
Le matériel sportif ne doit pas être transporté dans l'habitacle; fixation correcte sur galerie obligatoire.
En cas de panne: arrêt en sécurité et information immédiate du Loueur.

Responsabilité:
Le Locataire est responsable de l'état et de l'usage légal/technique du véhicule de la remise jusqu'à la restitution validée.
Si la restitution n'est pas effectuée selon la procédure, la responsabilité se prolonge jusqu'à la prise en charge et au contrôle effectifs par le Loueur.

4. Remise et restitution
La remise et la restitution ont lieu aux dates/heures/lieux confirmés.
La restitution sur une autre île est interdite.
Prise en charge pendant horaires d'ouverture; restitution hors horaires selon réservation.
Horaires indicatifs: 10:00-13:00 et 16:00-20:00.
En cas de retard/annulation de vol, le Locataire doit prévenir à temps, sinon le maintien de la réservation n'est pas garanti.
Restitution anticipée: aucun remboursement.
Le véhicule doit être rendu dans l'état de départ, sinon justificatifs requis.

Carburant:
Niveau identique à la remise.
Si inférieur: carburant manquant + service de ravitaillement facturés.
Si supérieur: aucun remboursement de différence.

5. Services et assurances
Prix final inclut: taxes (IGIC/IVA), kilométrage illimité, 2e conducteur gratuit, service en agence, annulation gratuite (voir point 9), sièges enfants homologués.
Assurances sans franchise: CDW, TP, TI.
Aucune autre préautorisation requise hors caution de 500 EUR.

6. Situations non couvertes
Non couvert: dommages pneus/jantes sur routes non asphaltées, perte/casse clés, mauvais carburant, conduite sous alcool/drogues, dommages off-road, amendes.
Ces coûts restent entièrement à la charge du Locataire.

7. Options
Galerie de toit en option selon tarif site; sangles non incluses.
Le Locataire est responsable des dommages causés par les objets transportés et des dommages à des tiers.

8. Politique carburant
Le véhicule doit être restitué avec le même niveau.
En cas de carburant incorrect, le Locataire supporte tous les dommages/réparations.

9. Paiement et remboursement
Paiement en ligne disponible; réservation finalisée après paiement carte.
Prestataire: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Remboursement intégral uniquement en cas d'annulation au plus tard 72 h avant le début.
Pas de remboursement partiel en cas de retour anticipé.
Remboursements applicables par virement sous 15 jours ouvrables.

10. Modification des conditions
Le Loueur peut modifier ces conditions à tout moment en fonction des exigences légales/commerciales.

11. Droit applicable et juridiction
Compétence des tribunaux de Santa Cruz de Tenerife, conformément au droit espagnol.

Date de signature: <<SIGNED_AT>>`;

const ES_FULL_LEGAL_TEXT = `CONTRATO DE ALQUILER

1. Partes y celebración del contrato
El presente contrato se celebra entre ZODIACSRENTACAR Thomy Fuerteventura SL (Arrendador) y la persona física o jurídica que acepta la oferta (Arrendatario).
Las Partes aceptan estas condiciones como vinculantes durante todo el periodo de alquiler hasta el cierre final registrado de la devolución.
Datos del Arrendador: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, España, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Las solicitudes y reservas se realizan por www.zodiacsrentacar.com y por e-mail.
El Arrendador puede rechazar reservas por motivos operativos o por datos incompletos/inexactos.
El titular de la reserva y el conductor principal deben ser la misma persona; no se permite cesión.
El Arrendatario debe presentar tarjeta de crédito a su nombre, válida durante el alquiler y 3 meses adicionales en Canarias.
Se aceptan Visa/MC/Amex/Dinners y tarjetas emitidas por entidades financieras. No se aceptan tarjetas de débito.
Fianza: 500 EUR, reembolsable en 15 días naturales tras devolución conforme.

2. Condiciones de alquiler y requisitos del conductor
Edad mínima: 25 años.
Permiso UE categoría B válido y al menos 2 años de experiencia acreditada.
Requisitos obligatorios.
(*) El párrafo sobre normativa española se mantiene sin cambios por revisión legal.
Las mismas exigencias aplican a conductores adicionales.
Tras la confirmación, puede cancelarse la reserva por datos falsos/no actualizados, caducidad documental o incumplimiento contractual.

3. Condiciones del vehículo alquilado
El modelo reservado es orientativo; puede sustituirse por categoría igual o superior.
Con la firma, el Arrendatario acepta geolocalización del vehículo para seguridad y control de cumplimiento (sin grabación de imagen/audio).
El vehículo no puede salir de la isla donde se alquiló, salvo acuerdo específico registrado.
Si existe extensión a Lanzarote/devolución en Lanzarote, rigen las condiciones acordadas y el resto del contrato permanece vigente.
Uso exclusivamente legal, en vías pavimentadas.
Prohibido uso ilegal/comercial, conducción off-road y repostaje incorrecto.
El Arrendatario debe asegurar correctamente el vehículo al aparcar.
Sillas infantiles se entregan, pero su correcta instalación es responsabilidad del Arrendatario.
No transportar tablas/equipo deportivo en el habitáculo; en baca deben ir correctamente fijados.
En caso de avería: detener con seguridad y avisar inmediatamente al Arrendador.

Responsabilidad:
El Arrendatario responde desde la entrega hasta la devolución validada por uso legal/técnico y conservación del vehículo.
Si la devolución no se realiza según procedimiento, la responsabilidad se extiende hasta recepción y revisión efectiva por el Arrendador.

4. Entrega y devolución
Entrega/devolución según fechas, horas y lugar confirmados.
No se permite devolver en isla distinta.
Recogida en horario de oficina; devolución fuera de horario según reserva.
Horario habitual: 10:00-13:00 y 16:00-20:00.
En caso de retraso/cancelación de vuelo, debe avisarse a tiempo; de lo contrario no se garantiza mantenimiento de reserva.
No hay reembolso por devolución anticipada.
El vehículo debe devolverse en estado equivalente al de entrega.

Combustible:
Debe devolverse con el mismo nivel.
Si es inferior: se cobra combustible faltante + servicio de repostaje.
Si es superior: no se devuelve diferencia.

5. Servicios y seguros
Incluye: impuestos (IGIC/IVA), kilómetros ilimitados, segundo conductor gratuito, servicio en oficina, cancelación gratuita (ver punto 9), sillas infantiles homologadas.
Seguros sin franquicia: CDW, TP, TI.
No se requiere otra retención salvo la fianza de 500 EUR.

6. Exclusiones del seguro
No cubre: daños en neumáticos/llantas por vías no asfaltadas, pérdida/daño de llaves, repostaje incorrecto, conducción bajo alcohol/drogas, daños off-road, multas.
Estos costes son responsabilidad total del Arrendatario.

7. Extras opcionales
Baca de techo opcional según tarifa web; cuerdas no incluidas.
El Arrendatario responde por daños causados por objetos transportados y frente a terceros.

8. Política de combustible
Mismo nivel de combustible a la devolución.
Si se usa combustible incorrecto, el Arrendatario asume todos los daños y reparaciones.

9. Pago y devoluciones
Pago online disponible; la reserva queda completada tras pago con tarjeta.
Proveedor: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Reembolso total solo si se cancela con al menos 72 horas de antelación.
No hay reembolso parcial por devolución anticipada.
Reembolsos aplicables por transferencia en 15 días hábiles.

10. Modificación de condiciones
El Arrendador puede modificar estas condiciones en cualquier momento por cambios normativos o comerciales.

11. Ley aplicable y jurisdicción
Jurisdicción de los juzgados y tribunales de Santa Cruz de Tenerife, conforme a la legislación española.

Fecha de firma: <<SIGNED_AT>>`;

const IT_FULL_LEGAL_TEXT = `CONTRATTO DI NOLEGGIO

1. Parti e conclusione del contratto
Il presente contratto è stipulato tra ZODIACSRENTACAR Thomy Fuerteventura SL (Locatore) e la persona fisica/giuridica che accetta l'offerta (Noleggiatore).
Le Parti accettano le condizioni come vincolanti per tutta la durata del noleggio fino alla registrazione definitiva della riconsegna.
Dati del Locatore: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spagna, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Richieste e prenotazioni tramite www.zodiacsrentacar.com o e-mail.
Il Locatore può rifiutare prenotazioni per motivi operativi o dati incompleti/inesatti.
Intestatario prenotazione e conducente principale devono coincidere; non è ammessa cessione.
Alla consegna il Noleggiatore deve presentare carta di credito intestata a sé, valida per il noleggio e 3 mesi successivi nelle Canarie.
Accettate Visa/MC/Amex/Dinners e carte bancarie; carte di debito non accettate.
Deposito cauzionale: 500 EUR, rimborsabile entro 15 giorni di calendario dopo riconsegna conforme.

2. Condizioni di noleggio e requisiti conducente
Età minima: 25 anni.
Patente UE categoria B valida e almeno 2 anni di esperienza documentata.
Requisiti obbligatori.
(*) Il paragrafo sulla normativa spagnola resta invariato (già verificato legalmente).
Stessi requisiti per conducenti aggiuntivi.
Dopo la conferma, la prenotazione può essere annullata per dati errati/non aggiornati, documenti scaduti o violazioni contrattuali.

3. Condizioni del veicolo noleggiato
Il modello prenotato è indicativo; può essere sostituito con categoria uguale/superiore.
Con la firma, il Noleggiatore acconsente alla geolocalizzazione per sicurezza e verifica del rispetto contrattuale (nessuna registrazione audio/video).
Il veicolo non può lasciare l'isola di noleggio salvo accordo specifico registrato.
In caso di estensione/consegna a Lanzarote, si applicano le condizioni specifiche concordate; il resto del contratto resta valido.
Uso solo legale, su strade asfaltate.
Vietato uso illecito/commerciale, guida off-road e rifornimento carburante errato.
Il Noleggiatore deve mettere in sicurezza il veicolo in sosta.
Seggiolini forniti alla consegna; corretto montaggio responsabilità del Noleggiatore.
Attrezzatura sportiva non nel vano interno; su portapacchi deve essere fissata correttamente.
In caso di guasto: fermarsi in sicurezza e avvisare subito il Locatore.

Responsabilità:
Il Noleggiatore risponde dalla consegna fino alla riconsegna validata per uso legale/tecnico e conservazione del veicolo.
Se la riconsegna non avviene secondo procedura, la responsabilità si estende fino a presa in carico e controllo effettivo del Locatore.

4. Consegna e restituzione
Consegna/restituzione alle date, ore e luogo confermati.
Vietata restituzione su isola diversa.
Ritiro in orario d'ufficio; restituzione fuori orario secondo prenotazione.
Orario indicativo: 10:00-13:00 e 16:00-20:00.
In caso di ritardo/cancellazione volo, è obbligatorio avvisare in tempo; altrimenti mantenimento prenotazione non garantito.
Nessun rimborso per restituzione anticipata.
Veicolo da restituire nelle stesse condizioni iniziali.

Carburante:
Livello carburante uguale alla consegna.
Se inferiore: addebito carburante mancante + servizio rifornimento.
Se superiore: nessun rimborso differenza.

5. Servizi e assicurazione
Inclusi: imposte (IGIC/IVA), km illimitati, secondo conducente gratuito, servizio in ufficio, cancellazione gratuita (punto 9), seggiolini omologati.
Assicurazioni senza franchigia: CDW, TP, TI.
Nessuna ulteriore preautorizzazione oltre al deposito cauzionale di 500 EUR.

6. Casi non coperti da assicurazione
Non coperti: danni pneumatici/cerchi su strade non asfaltate, perdita/danno chiavi, carburante errato, guida sotto alcool/droghe, danni off-road, multe.
Tali costi sono a totale carico del Noleggiatore.

7. Extra opzionali
Portapacchi opzionale secondo tariffa web; corde non incluse.
Il Noleggiatore risponde dei danni causati dagli oggetti trasportati e verso terzi.

8. Politica carburante
Restituzione con lo stesso livello carburante.
In caso di carburante non conforme, il Noleggiatore risponde integralmente di danni e riparazioni.

9. Pagamento e rimborsi
Pagamento online disponibile; prenotazione perfezionata dopo pagamento con carta.
Provider: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Rimborso totale solo con cancellazione entro 72 ore prima dell'inizio.
Nessun rimborso parziale per restituzione anticipata.
Rimborsi applicabili tramite bonifico entro 15 giorni lavorativi.

10. Modifica condizioni
Il Locatore può modificare queste condizioni in qualsiasi momento per adeguamenti normativi/commerciali.

11. Legge applicabile e foro competente
Competenza dei tribunali di Santa Cruz de Tenerife ai sensi della normativa spagnola.

Data di firma: <<SIGNED_AT>>`;

const SK_FULL_LEGAL_TEXT = `ZMLUVA O PRENÁJME

1. Zmluvné strany a vznik zmluvy
Táto zmluva sa uzatvára medzi ZODIACSRENTACAR Thomy Fuerteventura SL (Prenajímateľ) a fyzickou/právnickou osobou, ktorá prijala ponuku (Nájomca).
Podmienky sú záväzné počas celej doby prenájmu až do finálne zaznamenaného prevzatia vozidla pri vrátení.
Prenajímateľ: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Španielsko, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Rezervácie: www.zodiacsrentacar.com alebo e-mail.
Prenajímateľ môže rezerváciu odmietnuť z prevádzkových dôvodov alebo pri neúplných/nepresných údajoch.
Držiteľ rezervácie a hlavný vodič musia byť tá istá osoba; prevod nie je možný.
Nájomca musí pri prevzatí predložiť kreditnú kartu na svoje meno, platnú počas prenájmu a 3 mesiace po ňom na Kanárskych ostrovoch.
Akceptované karty: Visa/MC/Amex/Dinners a bankové karty vydané finančnými inštitúciami. Debetné karty nie sú akceptované.
Záloha: 500 EUR, vrátenie do 15 kalendárnych dní po riadnom vrátení vozidla.

2. Podmienky prenájmu a požiadavky na vodiča
Minimálny vek: 25 rokov.
Platný vodičský preukaz EÚ kategórie B a minimálne 2 roky preukázanej praxe.
Tieto podmienky sú povinné.
(*) Odsek o španielskej legislatíve zostáva bez zmeny (právne overený text).
Rovnaké podmienky platia pre ďalších vodičov.
Po potvrdení môže byť rezervácia zrušená pri nepravdivých/neaktuálnych údajoch, expirácii dokumentov alebo porušení podmienok.

3. Podmienky používania vozidla
Model vozidla je orientačný; môže byť nahradený rovnakou alebo vyššou kategóriou.
Podpisom Nájomca súhlasí s GPS lokalizáciou na bezpečnostné a kontrolné účely (bez audio/video záznamu).
Vozidlo nesmie opustiť ostrov prenájmu bez osobitnej dohody zaznamenanej v systéme.
Pri rozšírení na Lanzarote/odovzdaní v Lanzarote platia osobitné dohodnuté podmienky; ostatné body zostávajú účinné.
Vozidlo sa smie používať len legálne a na spevnených cestách.
Zakázané je nelegálne/komerčné použitie, jazda off-road a tankovanie nesprávneho paliva.
Nájomca je povinný vozidlo pri parkovaní riadne zabezpečiť.
Detské sedačky sú poskytnuté, správna montáž je zodpovednosť Nájomcu.
Športové vybavenie nesmie byť v interiéri; na strešnom nosiči musí byť správne upevnené.
Pri poruche: bezpečne zastaviť a okamžite informovať Prenajímateľa.

Zodpovednosť:
Nájomca zodpovedá od prevzatia po potvrdené vrátenie za zákonné a technicky správne používanie a stav vozidla.
Ak vrátenie neprebehne podľa postupu Prenajímateľa, zodpovednosť trvá až do reálneho prevzatia a kontroly.

4. Odovzdanie a vrátenie vozidla
Odovzdanie a vrátenie prebieha podľa potvrdeného času, dátumu a miesta.
Vrátenie na inom ostrove nie je povolené.
Prevzatie počas otváracích hodín; vrátenie mimo hodín podľa rezervácie.
Orientačné hodiny: 10:00-13:00 a 16:00-20:00.
Pri meškaní/zrušení letu je nutné včas informovať; inak držanie rezervácie nie je garantované.
Predčasné vrátenie nezakladá nárok na refundáciu.
Vozidlo musí byť vrátené v stave zodpovedajúcom prevzatiu.

Palivo:
Rovnaká úroveň pri vrátení ako pri prevzatí.
Pri nižšej úrovni sa účtuje chýbajúce palivo + servis tankovania.
Vyššia úroveň sa neprepláca.

5. Služby a poistenie
Cena zahŕňa: dane (IGIC/IVA), neobmedzené kilometre, bezplatný druhý vodič, servis v kancelárii, bezplatné zrušenie (bod 9), schválené detské sedačky.
Poistenie bez spoluúčasti: CDW, TP, TI.
Okrem zálohy 500 EUR sa nevyžaduje ďalšia preautorizácia.

6. Situácie nekryté poistením
Nekryté: poškodenie pneumatík/diskov na nespevnených cestách, strata/poškodenie kľúčov, nesprávne palivo, jazda pod vplyvom alkoholu/drog, off-road škody, pokuty.
Tieto náklady znáša Nájomca v plnom rozsahu.

7. Voliteľné doplnky
Voliteľne: strešný nosič podľa cien na webe; upevňovacie laná nie sú súčasťou.
Nájomca zodpovedá za škody spôsobené prepravovanými predmetmi a voči tretím osobám.

8. Palivová politika
Vozidlo sa vracia s rovnakou úrovňou paliva.
Pri nesprávnom palive znáša Nájomca všetky škody a opravy.

9. Platba a vrátenie peňazí
Online platba je dostupná; rezervácia je dokončená po úhrade kartou.
Poskytovateľ: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Plná refundácia len pri zrušení najneskôr 72 hodín pred začiatkom.
Pri predčasnom vrátení nie je pomerná refundácia.
Refundácie sa realizujú bankovým prevodom do 15 pracovných dní.

10. Zmena podmienok
Prenajímateľ môže podmienky kedykoľvek upraviť z legislatívnych alebo obchodných dôvodov.

11. Rozhodné právo a jurisdikcia
Príslušné súdy: Santa Cruz de Tenerife, podľa španielskeho práva.

Dátum podpisu: <<SIGNED_AT>>`;

const CZ_FULL_LEGAL_TEXT = `NÁJEMNÍ SMLOUVA

1. Smluvní strany a vznik smlouvy
Tato smlouva je uzavřena mezi ZODIACSRENTACAR Thomy Fuerteventura SL (Pronajímatel) a fyzickou/právnickou osobou, která přijímá nabídku (Nájemce).
Podmínky jsou závazné po celou dobu nájmu až do finálně zaznamenaného převzetí vozu při vrácení.
Pronajímatel: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Španělsko, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Rezervace: www.zodiacsrentacar.com nebo e-mail.
Pronajímatel může rezervaci odmítnout z provozních důvodů nebo při neúplných/nepřesných údajích.
Držitel rezervace a hlavní řidič musí být stejná osoba; převod není možný.
Při převzetí je nutné předložit kreditní kartu na jméno Nájemce, platnou po dobu nájmu a další 3 měsíce na Kanárských ostrovech.
Akceptované karty: Visa/MC/Amex/Dinners a bankovní karty vydané finančními institucemi. Debetní karty nejsou akceptovány.
Kauce: 500 EUR, vrácení do 15 kalendářních dnů po řádném vrácení vozu.

2. Podmínky nájmu a požadavky na řidiče
Minimální věk: 25 let.
Platný řidičský průkaz EU skupiny B a minimálně 2 roky prokazatelné praxe.
Podmínky jsou povinné.
(*) Odstavec o španělské právní úpravě zůstává beze změny (právně ověřeno).
Stejné podmínky platí pro další řidiče.
Po potvrzení může být rezervace zrušena při nepravdivých/neaktuálních údajích, expiraci dokladů nebo porušení podmínek.

3. Podmínky užívání vozidla
Model je orientační; může být nahrazen stejnou nebo vyšší kategorií.
Podpisem Nájemce souhlasí s GPS lokalizací pro bezpečnost a kontrolu dodržování podmínek (bez audio/video záznamu).
Vozidlo nesmí opustit ostrov pronájmu bez zvláštní dohody zapsané v systému.
Při rozšíření na Lanzarote/předání v Lanzarote platí zvláštní dohodnuté podmínky; ostatní ustanovení zůstávají v platnosti.
Užívání pouze legálně a na zpevněných komunikacích.
Zakázáno nelegální/komerční užití, jízda off-road a tankování nesprávného paliva.
Nájemce musí vozidlo při parkování řádně zabezpečit.
Dětské sedačky jsou poskytnuty, správná montáž je odpovědností Nájemce.
Sportovní vybavení nesmí být v interiéru; na střešním nosiči musí být řádně upevněno.
Při poruše: bezpečně zastavit a ihned kontaktovat Pronajímatele.

Odpovědnost:
Nájemce odpovídá od převzetí do potvrzeného vrácení za zákonné a technicky správné užívání a stav vozidla.
Pokud vrácení neproběhne dle postupu Pronajímatele, odpovědnost trvá až do skutečného převzetí a kontroly.

4. Předání a vrácení
Předání a vrácení dle potvrzeného místa, data a času.
Vrácení na jiném ostrově není povoleno.
Převzetí během otevírací doby; vrácení mimo otevírací dobu dle rezervace.
Orientační provozní doba: 10:00-13:00 a 16:00-20:00.
Při zpoždění/zrušení letu je nutné včas informovat; jinak není držení rezervace garantováno.
Předčasné vrácení nezakládá nárok na refundaci.
Vůz musí být vrácen ve stavu odpovídajícím převzetí.

Palivo:
Stejná hladina při vrácení jako při převzetí.
Při nižší hladině se účtuje chybějící palivo + servis dotankování.
Vyšší hladina se neproplácí.

5. Služby a pojištění
Cena zahrnuje: daně (IGIC/IVA), neomezené km, druhého řidiče zdarma, servis v kanceláři, bezplatné zrušení (bod 9), schválené dětské sedačky.
Pojištění bez spoluúčasti: CDW, TP, TI.
Kromě kauce 500 EUR se nevyžaduje další předautorizace.

6. Situace nekryté pojištěním
Nekryto: poškození pneumatik/disků na nezpevněných cestách, ztráta/poškození klíčů, nesprávné palivo, řízení pod vlivem alkoholu/drog, off-road škody, pokuty.
Tyto náklady hradí Nájemce v plné výši.

7. Volitelné doplňky
Volitelně střešní nosič dle cen na webu; upevňovací lana nejsou součástí.
Nájemce odpovídá za škody způsobené přepravovanými předměty a vůči třetím osobám.

8. Palivová politika
Vozidlo se vrací se stejnou úrovní paliva.
Při nesprávném palivu nese Nájemce veškeré škody a opravy.

9. Platba a vrácení
Online platba dostupná; rezervace je dokončena po úhradě kartou.
Poskytovatel: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Plná refundace pouze při zrušení nejpozději 72 hodin před začátkem.
Při předčasném vrácení není poměrná refundace.
Refundace se provádí bankovním převodem do 15 pracovních dnů.

10. Změna podmínek
Pronajímatel může podmínky kdykoliv upravit z právních nebo obchodních důvodů.

11. Rozhodné právo a jurisdikce
Příslušné soudy: Santa Cruz de Tenerife, dle španělského práva.

Datum podpisu: <<SIGNED_AT>>`;

const SE_FULL_LEGAL_TEXT = `HYRESAVTAL

1. Avtalsparter och avtalets ingående
Detta avtal ingås mellan ZODIACSRENTACAR Thomy Fuerteventura SL (Uthyrare) och den fysiska/juridiska person som accepterar erbjudandet (Hyrestagare).
Villkoren är bindande under hela hyresperioden tills fordonets återlämning är slutligt registrerad.
Uthyrare: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spanien, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Bokning via www.zodiacsrentacar.com eller e-post.
Uthyrare kan neka bokning av driftskäl eller vid ofullständiga/felaktiga uppgifter.
Bokningsinnehavare och huvudförare måste vara samma person; överlåtelse är inte tillåten.
Vid utlämning ska Hyrestagaren visa kreditkort i eget namn, giltigt under hyrestiden och ytterligare 3 månader på Kanarieöarna.
Accepterade kort: Visa/MC/Amex/Dinners samt bankkort utfärdade av finansinstitut. Debetkort accepteras inte.
Deposition: 500 EUR, återbetalas inom 15 kalenderdagar efter korrekt återlämning.

2. Hyresvillkor och förarkrav
Minimiålder: 25 år.
Giltigt EU-körkort klass B och minst 2 års dokumenterad körerfarenhet.
Kraven är obligatoriska.
(*) Stycket om spansk lagstiftning lämnas oförändrat (juridiskt granskat).
Samma krav gäller för extra förare.
Efter bekräftelse kan bokning avbokas vid felaktiga/inaktuella uppgifter, utgångna dokument eller avtalsbrott.

3. Villkor för hyrfordonet
Bokad modell är vägledande och kan ersättas med likvärdig eller högre kategori.
Genom underskrift samtycker Hyrestagaren till GPS-spårning för säkerhet och avtalsefterlevnad (ingen ljud-/videoinspelning).
Fordonet får inte lämna hyresön utan särskild överenskommelse registrerad i bokningssystemet.
Vid överenskommen utökning till Lanzarote/återlämning i Lanzarote gäller särskilda villkor; övriga punkter kvarstår.
Användning endast lagligt och på asfalterade vägar.
Olaglig/kommersiell användning, off-road-körning och felaktig tankning är förbjudet.
Hyrestagaren ska säkra fordonet korrekt vid parkering.
Barnstolar tillhandahålls; korrekt montering är Hyrestagarens ansvar.
Sportutrustning får inte transporteras i kupén; på takräcke ska den vara korrekt fastsatt.
Vid fel: stanna säkert och kontakta Uthyrare omedelbart.

Ansvar:
Hyrestagaren ansvarar från utlämning till verifierad återlämning för laglig/tekniskt korrekt användning och fordonets skick.
Om återlämning inte sker enligt rutin kvarstår ansvaret tills faktisk mottagning och kontroll av Uthyrare.

4. Utlämning och återlämning
Sker enligt bekräftad plats, datum och tid.
Återlämning på annan ö är inte tillåten.
Uthämtning under öppettider; återlämning utanför öppettider enligt bokning.
Normala öppettider: 10:00-13:00 och 16:00-20:00.
Vid flygförsening/inställt flyg ska Hyrestagaren meddela i tid, annars kan bokning inte garanteras.
Ingen återbetalning vid tidigare återlämning.
Fordonet ska lämnas i motsvarande skick som vid utlämning.

Bränsle:
Samma nivå vid återlämning som vid utlämning.
Vid lägre nivå debiteras saknat bränsle + tankningsservice.
Högre nivå återbetalas inte.

5. Tjänster och försäkring
Priset inkluderar: skatter (IGIC/IVA), obegränsad km, gratis andraförare, service på kontor, gratis avbokning (punkt 9), godkända barnstolar.
Försäkring utan självrisk: CDW, TP, TI.
Ingen ytterligare förhandsauktorisering krävs utöver deposition 500 EUR.

6. Händelser som inte täcks
Täcks inte: skador på däck/fälg på oasfalterad väg, förlust/skada av nycklar, fel bränsle, körning under alkohol/droger, off-road-skador, böter.
Dessa kostnader bärs fullt ut av Hyrestagaren.

7. Tillval
Takräcke som tillval enligt prislista på webbplatsen; fästlinor ingår ej.
Hyrestagaren ansvarar för skador orsakade av transporterade föremål och mot tredje man.

8. Bränslepolicy
Fordonet återlämnas med samma bränslenivå.
Vid felaktigt bränsle bär Hyrestagaren alla skador och reparationer.

9. Betalning och återbetalning
Onlinebetalning tillgänglig; bokningen är slutförd efter kortbetalning.
Betalleverantör: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Full återbetalning endast vid avbokning senast 72 timmar före start.
Ingen proportionell återbetalning vid förtida återlämning.
Tillämpliga återbetalningar sker via banköverföring inom 15 arbetsdagar.

10. Ändring av villkor
Uthyrare kan ändra villkoren när som helst p.g.a. rättsliga eller kommersiella skäl.

11. Tillämplig lag och jurisdiktion
Behörig domstol: Santa Cruz de Tenerife enligt spansk lag.

Signeringsdatum: <<SIGNED_AT>>`;

const NO_FULL_LEGAL_TEXT = `LEIEAVTALE

1. Avtalepartene og avtaleinngåelse
Denne avtalen inngås mellom ZODIACSRENTACAR Thomy Fuerteventura SL (Utleier) og fysisk/juridisk person som aksepterer tilbudet (Leietaker).
Vilkårene er bindende gjennom hele leieperioden frem til endelig registrert tilbakelevering.
Utleier: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spania, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Bestilling via www.zodiacsrentacar.com eller e-post.
Utleier kan avslå bestilling av driftsmessige årsaker eller ved ufullstendige/feil opplysninger.
Bestiller og hovedfører må være samme person; overføring er ikke tillatt.
Ved utlevering må Leietaker fremvise kredittkort i eget navn, gyldig under leieperioden og 3 måneder etterpå på Kanariøyene.
Aksepterte kort: Visa/MC/Amex/Dinners og bankkort utstedt av finansinstitusjoner. Debetkort aksepteres ikke.
Depositum: 500 EUR, tilbakebetales innen 15 kalenderdager etter korrekt tilbakelevering.

2. Leievilkår og førerkrav
Minimumsalder: 25 år.
Gyldig EU-førerkort klasse B og minst 2 års dokumentert kjøreerfaring.
Kravene er obligatoriske.
(*) Avsnittet om spansk lovgivning forblir uendret (juridisk kontrollert).
Samme krav gjelder for ekstraførere.
Etter bekreftelse kan bestilling kanselleres ved uriktige/utdaterte opplysninger, utløpte dokumenter eller brudd på vilkår.

3. Vilkår for leiebilen
Bestilt modell er veiledende og kan erstattes med tilsvarende eller høyere kategori.
Ved signering samtykker Leietaker til GPS-sporing for sikkerhet og kontroll av avtaleetterlevelse (ingen lyd-/bildeopptak).
Kjøretøyet kan ikke forlate leieøya uten særskilt registrert avtale.
Ved avtalt utvidelse til Lanzarote/retur i Lanzarote gjelder særvilkår; øvrige punkter står ved lag.
Bruk kun lovlig og på asfalterte veier.
Ulovlig/kommersiell bruk, off-road-kjøring og feilfylling av drivstoff er forbudt.
Leietaker skal sikre bilen forsvarlig ved parkering.
Barneseter leveres ved utlevering; korrekt montering er Leietakers ansvar.
Sportsutstyr skal ikke transporteres i kupeen; på takstativ må det festes korrekt.
Ved feil: stopp trygt og kontakt Utleier umiddelbart.

Ansvar:
Leietaker er ansvarlig fra utlevering til verifisert tilbakelevering for lovlig/teknisk korrekt bruk og bevaring av bilens tilstand.
Hvis tilbakelevering ikke skjer etter prosedyre, varer ansvaret til faktisk overtakelse og kontroll av Utleier.

4. Utlevering og tilbakelevering
Skjer etter bekreftet sted, dato og tid.
Tilbakelevering på annen øy er ikke tillatt.
Henting i åpningstid; levering utenfor åpningstid etter bestilling.
Normale åpningstider: 10:00-13:00 og 16:00-20:00.
Ved flyforsinkelse/kansellering må Leietaker varsle i tide, ellers kan bestillingen ikke garanteres.
Ingen refusjon ved tidlig tilbakelevering.
Bilen skal tilbakeleveres i tilsvarende stand som ved utlevering.

Drivstoff:
Samme nivå ved retur som ved utlevering.
Ved lavere nivå belastes manglende drivstoff + fylleservice.
Høyere nivå refunderes ikke.

5. Tjenester og forsikring
Prisen inkluderer: avgifter (IGIC/IVA), ubegrenset km, gratis andrefører, service på kontor, gratis avbestilling (punkt 9), godkjente barneseter.
Forsikring uten egenandel: CDW, TP, TI.
Ingen ekstra forhåndsautorisasjon utover depositum 500 EUR.

6. Situasjoner ikke dekket av forsikring
Ikke dekket: skade på dekk/felg på uasfalterte veier, tap/skade av nøkler, feil drivstoff, kjøring under alkohol/rusmidler, off-road-skader, bøter.
Disse kostnadene bæres fullt ut av Leietaker.

7. Valgfrie tillegg
Takstativ som tilvalg etter pris på nettsiden; festeliner inngår ikke.
Leietaker er ansvarlig for skader forårsaket av transporterte gjenstander og overfor tredjepart.

8. Drivstoffpolicy
Bilen skal returneres med samme drivstoffnivå.
Ved feil drivstoff bærer Leietaker alle skader og reparasjoner.

9. Betaling og refusjon
Online betaling tilgjengelig; bestilling fullføres etter kortbetaling.
Betalingsleverandør: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Full refusjon kun ved avbestilling senest 72 timer før start.
Ingen forholdsmessig refusjon ved tidlig retur.
Aktuelle refusjoner skjer via bankoverføring innen 15 virkedager.

10. Endring av vilkår
Utleier kan endre vilkårene når som helst av juridiske eller kommersielle hensyn.

11. Gjeldende rett og jurisdiksjon
Kompetent domstol: Santa Cruz de Tenerife etter spansk rett.

Signeringsdato: <<SIGNED_AT>>`;

const DK_FULL_LEGAL_TEXT = `LEJEAFTALE

1. Aftaleparter og indgåelse
Denne aftale indgås mellem ZODIACSRENTACAR Thomy Fuerteventura SL (Udlejer) og den fysiske/juridiske person, der accepterer tilbuddet (Lejer).
Vilkårene er bindende i hele lejeperioden indtil endelig registreret tilbagelevering.
Udlejer: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Spanien, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Reservation via www.zodiacsrentacar.com eller e-mail.
Udlejer kan afvise reservationer af driftsmæssige årsager eller ved ufuldstændige/ukorrekte oplysninger.
Reservationsindehaver og primær fører skal være samme person; overdragelse er ikke tilladt.
Ved udlevering skal Lejer fremvise kreditkort i eget navn, gyldigt under lejen og 3 måneder efter på De Kanariske Øer.
Accepterede kort: Visa/MC/Amex/Dinners og bankkort udstedt af finansielle institutioner. Debetkort accepteres ikke.
Depositum: 500 EUR, tilbagebetales inden 15 kalenderdage efter korrekt tilbagelevering.

2. Lejebetingelser og førerkrav
Minimumsalder: 25 år.
Gyldigt EU-kørekort kategori B og mindst 2 års dokumenteret køreerfaring.
Kravene er obligatoriske.
(*) Afsnittet om spansk lovgivning forbliver uændret (juridisk godkendt).
Samme krav gælder for ekstra førere.
Efter bekræftelse kan reservation annulleres ved forkerte/forældede oplysninger, udløbne dokumenter eller brud på vilkår.

3. Betingelser for lejebil
Reserveret model er vejledende og kan erstattes af samme eller højere kategori.
Ved underskrift accepterer Lejer GPS-sporing til sikkerhed og kontraktkontrol (ingen lyd-/videooptagelse).
Bilen må ikke forlade lejeøen uden særskilt registreret aftale.
Ved aftalt udvidelse til Lanzarote/aflevering i Lanzarote gælder særvilkår; øvrige vilkår forbliver gældende.
Brug kun lovligt og på asfalterede veje.
Ulovlig/kommerciel brug, off-road kørsel og forkert brændstof er forbudt.
Lejer skal sikre bilen korrekt ved parkering.
Børnesæder udleveres; korrekt montering er Lejers ansvar.
Sportsudstyr må ikke transporteres i kabinen; på tagbøjler skal det fastgøres korrekt.
Ved fejl: stands sikkert og kontakt Udlejer straks.

Ansvar:
Lejer er ansvarlig fra udlevering til verificeret aflevering for lovlig/teknisk korrekt brug og bilens stand.
Hvis aflevering ikke sker efter procedure, fortsætter ansvaret indtil faktisk overtagelse og kontrol af Udlejer.

4. Udlevering og aflevering
Sker efter bekræftet sted, dato og tid.
Aflevering på anden ø er ikke tilladt.
Afhentning i åbningstid; aflevering uden for åbningstid efter reservation.
Typiske åbningstider: 10:00-13:00 og 16:00-20:00.
Ved flyforsinkelse/aflysning skal Lejer give besked i tide, ellers kan reservation ikke garanteres.
Ingen tilbagebetaling ved tidlig aflevering.
Bilen skal afleveres i samme stand som ved udlevering.

Brændstof:
Samme niveau ved aflevering som ved udlevering.
Ved lavere niveau opkræves manglende brændstof + tankservice.
Højere niveau refunderes ikke.

5. Ydelser og forsikring
Prisen inkluderer: afgifter (IGIC/IVA), ubegrænset km, gratis anden fører, service på kontor, gratis afbestilling (pkt. 9), godkendte børnesæder.
Forsikring uden selvrisiko: CDW, TP, TI.
Ingen yderligere forhåndsgodkendelse udover depositum 500 EUR.

6. Situationer ikke dækket af forsikring
Ikke dækket: skade på dæk/fælge på ikke-asfalterede veje, tab/skade af nøgler, forkert brændstof, kørsel under alkohol/rusmidler, off-road skader, bøder.
Disse omkostninger bæres fuldt ud af Lejer.

7. Valgfrie ekstraydelser
Tagbøjler som tilvalg efter priser på hjemmesiden; fastgørelsesliner medfølger ikke.
Lejer er ansvarlig for skader forårsaget af transporterede genstande og over for tredjemand.

8. Brændstofpolitik
Bilen returneres med samme brændstofniveau.
Ved forkert brændstof bærer Lejer alle skader og reparationer.

9. Betaling og tilbagebetaling
Online betaling tilgængelig; reservation fuldføres efter kortbetaling.
Udbyder: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Fuld tilbagebetaling kun ved afbestilling senest 72 timer før start.
Ingen forholdsmæssig tilbagebetaling ved tidlig aflevering.
Tilbagebetalinger sker via bankoverførsel inden 15 arbejdsdage.

10. Ændring af vilkår
Udlejer kan til enhver tid ændre vilkårene af juridiske eller kommercielle årsager.

11. Gældende ret og værneting
Kompetente domstole: Santa Cruz de Tenerife efter spansk ret.

Underskriftsdato: <<SIGNED_AT>>`;

const PL_FULL_LEGAL_TEXT = `UMOWA NAJMU

1. Strony umowy i zawarcie umowy
Niniejsza umowa zostaje zawarta pomiędzy ZODIACSRENTACAR Thomy Fuerteventura SL (Wynajmujący) a osobą fizyczną/prawną akceptującą ofertę (Najemca).
Warunki są wiążące przez cały okres najmu do czasu ostatecznego, zarejestrowanego zwrotu pojazdu.
Wynajmujący: ZODIACSRENTACAR, Calle Juan de Austria 111, 35600 Puerto de Rosario, Las Palmas, Hiszpania, CIF B13702493, info@zodiacsrentacar.es, +34 683-192-422.
Rezerwacje przez www.zodiacsrentacar.com lub e-mail.
Wynajmujący może odmówić rezerwacji z przyczyn operacyjnych albo przy niepełnych/nieprawidłowych danych.
Posiadacz rezerwacji i główny kierowca muszą być tą samą osobą; cesja nie jest dozwolona.
Przy odbiorze Najemca okazuje kartę kredytową na swoje nazwisko, ważną w czasie najmu i 3 miesiące po nim na Wyspach Kanaryjskich.
Akceptowane: Visa/MC/Amex/Dinners i karty bankowe wydane przez instytucje finansowe. Karty debetowe nie są akceptowane.
Kaucja: 500 EUR, zwrot do 15 dni kalendarzowych po prawidłowym zwrocie pojazdu.

2. Warunki najmu i wymagania kierowcy
Wiek minimalny: 25 lat.
Ważne prawo jazdy UE kat. B i minimum 2 lata udokumentowanego doświadczenia.
Wymagania są obowiązkowe.
(*) Fragment dotyczący prawa hiszpańskiego pozostaje bez zmian (zweryfikowany prawnie).
Te same wymagania dotyczą dodatkowych kierowców.
Po potwierdzeniu rezerwacja może zostać anulowana przy błędnych/nieaktualnych danych, wygaśnięciu dokumentów lub naruszeniu warunków.

3. Warunki użytkowania pojazdu
Model z rezerwacji jest orientacyjny; może być zastąpiony klasą równą lub wyższą.
Podpisując umowę, Najemca akceptuje lokalizację GPS w celach bezpieczeństwa i kontroli warunków (bez nagrań audio/wideo).
Pojazd nie może opuścić wyspy wynajmu bez odrębnej, zarejestrowanej zgody.
W przypadku uzgodnionego rozszerzenia na Lanzarote/zwrotu w Lanzarote obowiązują warunki szczególne; pozostałe postanowienia pozostają ważne.
Dozwolone wyłącznie legalne użytkowanie i jazda po drogach utwardzonych.
Zakazane: użycie nielegalne/komercyjne, jazda off-road i tankowanie niewłaściwego paliwa.
Najemca musi odpowiednio zabezpieczyć pojazd podczas parkowania.
Foteliki dziecięce są wydawane, prawidłowy montaż należy do Najemcy.
Sprzętu sportowego nie wolno przewozić w kabinie; na bagażniku dachowym musi być prawidłowo zamocowany.
W razie awarii: bezpiecznie zatrzymać pojazd i natychmiast powiadomić Wynajmującego.

Odpowiedzialność:
Najemca odpowiada od wydania do potwierdzonego zwrotu za legalną i technicznie prawidłową eksploatację oraz stan pojazdu.
Jeżeli zwrot nie nastąpi zgodnie z procedurą, odpowiedzialność trwa do faktycznego odbioru i kontroli przez Wynajmującego.

4. Wydanie i zwrot pojazdu
Wydanie i zwrot odbywają się zgodnie z potwierdzonym miejscem, datą i godziną.
Zwrot na innej wyspie jest niedozwolony.
Odbiór w godzinach pracy; zwrot poza godzinami zgodnie z rezerwacją.
Typowe godziny: 10:00-13:00 i 16:00-20:00.
Przy opóźnieniu/odwołaniu lotu Najemca ma obowiązek poinformować odpowiednio wcześnie; w przeciwnym razie utrzymanie rezerwacji nie jest gwarantowane.
Brak zwrotu kosztów przy wcześniejszym zwrocie.
Pojazd należy oddać w stanie odpowiadającym wydaniu.

Paliwo:
Przy zwrocie poziom paliwa jak przy odbiorze.
Przy niższym poziomie naliczane jest brakujące paliwo + usługa tankowania.
Wyższy poziom paliwa nie podlega zwrotowi.

5. Usługi i ubezpieczenie
Cena obejmuje: podatki (IGIC/IVA), nielimitowany przebieg, bezpłatnego drugiego kierowcę, obsługę w biurze, bezpłatne anulowanie (pkt 9), homologowane foteliki dziecięce.
Ubezpieczenia bez udziału własnego: CDW, TP, TI.
Brak dodatkowej preautoryzacji poza kaucją 500 EUR.

6. Sytuacje nieobjęte ubezpieczeniem
Nieobjęte: uszkodzenia opon/felg na drogach nieutwardzonych, utrata/uszkodzenie kluczy, złe paliwo, jazda pod wpływem alkoholu/narkotyków, szkody off-road, mandaty.
Koszty te ponosi Najemca w całości.

7. Dodatki opcjonalne
Bagażnik dachowy jako opcja wg cen na stronie; liny mocujące nie są w zestawie.
Najemca odpowiada za szkody spowodowane przewożonymi przedmiotami oraz wobec osób trzecich.

8. Polityka paliwowa
Pojazd należy zwrócić z takim samym poziomem paliwa.
W przypadku niewłaściwego paliwa Najemca ponosi wszystkie koszty szkód i napraw.

9. Płatność i zwroty
Płatność online dostępna; rezerwacja jest ukończona po opłacie kartą.
Dostawca: CAIXABANK (IBAN: ES60 2100 1512 2602 0067 6927).
Pełny zwrot tylko przy anulowaniu najpóźniej 72 godziny przed rozpoczęciem.
Brak proporcjonalnego zwrotu przy wcześniejszym zwrocie.
Zwroty realizowane przelewem bankowym w ciągu 15 dni roboczych.

10. Zmiana warunków
Wynajmujący może zmieniać warunki w każdym czasie z przyczyn prawnych lub handlowych.

11. Prawo właściwe i jurysdykcja
Właściwe są sądy Santa Cruz de Tenerife zgodnie z prawem hiszpańskim.

Data podpisu: <<SIGNED_AT>>`;

const buildLongFormLegalLines = (
  locale: ContractLocale,
  signedAt: Date | undefined,
) => {
  const signedAtText = signedAt
    ? formatDateShortLocale(signedAt.toISOString(), locale)
    : '<<Custom.Today>>';
  const sources: Partial<Record<ContractLocale, string>> = {
    en: EN_FULL_LEGAL_TEXT,
    hu: HU_FULL_LEGAL_TEXT,
    de: DE_FULL_LEGAL_TEXT,
    ro: RO_FULL_LEGAL_TEXT,
    fr: FR_FULL_LEGAL_TEXT,
    es: ES_FULL_LEGAL_TEXT,
    it: IT_FULL_LEGAL_TEXT,
    sk: SK_FULL_LEGAL_TEXT,
    cz: CZ_FULL_LEGAL_TEXT,
    se: SE_FULL_LEGAL_TEXT,
    no: NO_FULL_LEGAL_TEXT,
    dk: DK_FULL_LEGAL_TEXT,
    pl: PL_FULL_LEGAL_TEXT,
  };
  const source = sources[locale] ?? EN_FULL_LEGAL_TEXT;
  return source.replace('<<SIGNED_AT>>', signedAtText).split('\n');
};

export const buildContractTemplate = (
  data: ContractData,
  options?: { signedAt?: Date; locale?: string | null },
): ContractTemplate => {
  const locale = resolveContractLocale(options?.locale ?? data.locale ?? 'en');
  const copy = CONTRACT_COPY[locale];
  const englishCopy = CONTRACT_COPY.en;

  const period = [
    formatDateShortLocale(data.rentalStart ?? undefined, locale),
    formatDateShortLocale(data.rentalEnd ?? undefined, locale),
  ].join(' – ');
  const rentalDays =
    typeof data.rentalDays === 'number'
      ? `${data.rentalDays} ${copy.rentalDaysUnit}`
      : '—';
  const pickupLocation = formatValue(data.pickupLocation);
  const pickupAddress = formatValue(data.pickupAddress);
  const carLabel = formatValue(data.carLabel);
  const plate = formatValue(data.plate);
  const ownerCompanyName = formatValueOr(
    data.ownerCompanyName,
    '<<OwnerCompany.Name>>',
  );
  const ownerCompanyAddress = formatValueOr(
    data.ownerCompanyAddress,
    '<<OwnerCompany.Address>>',
  );
  const ownerCompanyFiscal = formatValueOr(
    data.ownerCompanyFiscal,
    '<<OwnerCompany.Fiscal>>',
  );
  const renterName = formatValueOr(data.renterName, '<<Customer.Name>>');
  const renterNationality = formatValueOr(
    data.renterNationality,
    '<<Customer.Nationality>>',
  );
  const renterAddress = formatValueOr(
    data.renterAddress,
    '<<Customer.Address>>',
  );
  const renterBirthPlace = formatValueOr(
    data.renterBirthPlace,
    '<<Customer.BirthPlace>>',
  );
  const renterIdCardNumber = formatValueOr(
    data.renterIdCardNumber,
    '<<Customer.IdCardNumber>>',
  );
  const renterDrivingLicenseNumber = formatValueOr(
    data.renterDrivingLicenseNumber,
    '<<Customer.DrivingLicenseNumber>>',
  );
  const renterDrivingLicenseValidUntil = formatDateOr(
    data.renterDrivingLicenseValidUntil ?? data.renterIdCardExpireDate,
    '<<Customer.DrivingLicenseValidUntil>>',
    locale,
  );
  const renterPhone = formatValueOr(
    data.renterPhone,
    '<<Customer.PhoneNumber>>',
  );
  const carModel = formatValueOr(data.carLabel, '<<Car.Model>>');
  const carLicensePlate = formatValueOr(data.plate, '<<Car.LicensePlate>>');
  const renterBirthDate = formatDateOr(
    data.renterBirthDate,
    '<<Customer.BirthDate>>',
    locale,
  );
  const rentFrom = formatDateOr(data.rentalStart, '<<Rent.From>>', locale);
  const rentTo = formatDateOr(data.rentalEnd, '<<Rent.To>>', locale);
  const rentFee = normalizeFee(data.rentalFee);
  const rentFeeOnlyLine = rentFee ?? '<<Rent.Fee>>';
  const signedAt = options?.signedAt;
  const signedAtLine = signedAt
    ? formatDateShortLocale(signedAt.toISOString(), locale)
    : '<<Custom.Today>>';
  const depositLine = formatMoney(data.deposit, '<<Deposit>>');
  const insuranceLine = formatMoney(data.insurance, '<<Insurance>>');

  const buildLegacyBodyLines = (
    bodyCopy: typeof copy.body,
    bodyLocale: ContractLocale,
  ) => {
    const renterBirthDate = formatDateOr(
      data.renterBirthDate,
      '<<Customer.BirthDate>>',
      bodyLocale,
    );
    const renterIdCardExpireDate = formatDateOr(
      data.renterIdCardExpireDate,
      '<<Customer.IdCardExpireDate>>',
      bodyLocale,
    );
    const rentFrom = formatDateOr(data.rentalStart, '<<Rent.From>>', bodyLocale);
    const rentTo = formatDateOr(data.rentalEnd, '<<Rent.To>>', bodyLocale);
    const rentalFeeSuffix = CONTRACT_COPY[bodyLocale].rentalFeePerDaySuffix;
    const rentFeePerDayLine = rentFee
      ? `${rentFee} ${rentalFeeSuffix}`
      : `<<Rent.Fee>> ${rentalFeeSuffix}`;
    const customToday = signedAt
      ? formatDateShortLocale(signedAt.toISOString(), bodyLocale)
      : '<<Custom.Today>>';
    const renterBirthLine = `${renterBirthPlace}, ${renterBirthDate}`;

    return [
    bodyCopy.lessorHeading,
    '',
    joinLabelValue(bodyCopy.companyLabel, ownerCompanyName),
    joinLabelValue(bodyCopy.addressLabel, ownerCompanyAddress),
    joinLabelValue(bodyCopy.registrationLabel, ownerCompanyFiscal),
    '',
    bodyCopy.renterHeading,
    '',
    joinLabelValue(bodyCopy.renterLabel, renterName),
    joinLabelValue(bodyCopy.addressLabel, renterAddress),
    joinLabelValue(bodyCopy.birthLabel, renterBirthLine),
    joinLabelValue(bodyCopy.idNumberLabel, renterIdCardNumber),
    joinLabelValue(bodyCopy.idExpiryLabel, renterIdCardExpireDate),
    joinLabelValue(bodyCopy.licenseLabel, renterDrivingLicenseNumber),
    joinLabelValue(bodyCopy.phoneLabel, renterPhone),
    '',
    bodyCopy.vehicleDetailsHeading,
    '',
    joinLabelValue(bodyCopy.carTypeLabel, carModel),
    joinLabelValue(bodyCopy.licensePlateLabel, carLicensePlate),
    '',
    bodyCopy.rentalFeesHeading,
    '',
    joinLabelValue(bodyCopy.rentalFeeLabel, rentFeePerDayLine),
    joinLabelValue(bodyCopy.depositLabel, depositLine),
    joinLabelValue(bodyCopy.insuranceLabel, insuranceLine),
    joinLabelValue(bodyCopy.rentalFeeLabel, rentFeeOnlyLine),
    '',
    bodyCopy.depositParagraph,
    bodyCopy.insuranceParagraph,
    '',
    bodyCopy.rentalPeriodHeading,
    '',
    joinLabelValue(bodyCopy.rentalStartLabel, rentFrom),
    joinLabelValue(bodyCopy.rentalEndLabel, rentTo),
    '',
    bodyCopy.rentalTermsHeading,
    ...bodyCopy.rentalTermsLines,
    '',
    '',
    bodyCopy.section1Heading,
    '',
    bodyCopy.section1DriverLine,
    '',
    bodyCopy.section1DocumentsLine,
    '',
    bodyCopy.section1PaymentHeading,
    '',
    bodyCopy.section1CashLine,
    '',
    bodyCopy.section1CardLine,
    '',
    bodyCopy.section1DepositLine,
    '',
    bodyCopy.section1FullInsuranceLine,
    '',
    '',
    bodyCopy.section2Heading,
    '',
    bodyCopy.section2Intro,
    '',
    bodyCopy.section2WrongFuel,
    '',
    bodyCopy.section2Keys,
    '',
    bodyCopy.section2OffRoad,
    '',
    bodyCopy.section2Alcohol,
    '',
    bodyCopy.section2Fines,
    '',
    bodyCopy.section2UnauthorizedIsland,
    '',
    '',
    bodyCopy.section3Heading,
    '',
    bodyCopy.section3Island,
    '',
    bodyCopy.section3Fuel,
    '',
    bodyCopy.section3Cancellation,
    '',
    '',
    bodyCopy.declarationHeading,
    '',
    bodyCopy.declarationParagraph1,
    '',
    bodyCopy.declarationParagraph2,
    '',
    bodyCopy.declarationParagraph3,
    '',
    '',
    bodyCopy.dateLine,
    bodyCopy.cityLine.replace('<<Custom.Today>>', customToday),
  ];
  };

  const useFinalBilingualContract = locale === 'en' || locale === 'hu';
  const body = useFinalBilingualContract
    ? buildFinalBilingualContractLines({
        renterName,
        renterNationality,
        renterIdCardNumber,
        renterAddress,
        renterBirthDate,
        renterDrivingLicenseNumber,
        renterDrivingLicenseValidUntil,
        renterPhone,
        carModel,
        carLicensePlate,
        rentFrom,
        rentTo,
        signedAt: signedAtLine,
      }).join('\n')
    : (() => {
        const englishBody = [
          '=== ENGLISH VERSION ===',
          '',
          ...buildLongFormLegalLines('en', signedAt),
        ].join('\n');

        const hasLocalizedLongForm = [
          'en',
          'hu',
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
        ].includes(locale);
        const localizedBodyLines = hasLocalizedLongForm
          ? buildLongFormLegalLines(locale, signedAt)
          : buildLegacyBodyLines(copy.body, locale);

        const localizedBody = [
          `=== LOCAL LANGUAGE VERSION (${copy.title}) ===`,
          '',
          ...localizedBodyLines,
        ].join('\n');
        return [englishBody, '', localizedBody].join('\n');
      })();

  return {
    title:
      locale === 'en'
        ? englishCopy.title
        : `${englishCopy.title} / ${copy.title}`,
    intro:
      locale === 'en'
        ? englishCopy.intro
        : `${englishCopy.intro} / ${copy.intro}`,
    details: [
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.bookingId
            : `${englishCopy.detailLabels.bookingId} / ${copy.detailLabels.bookingId}`,
        value: formatValue(data.bookingCode ?? data.bookingId),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterName
            : `${englishCopy.detailLabels.renterName} / ${copy.detailLabels.renterName}`,
        value: formatValue(data.renterName),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterEmail
            : `${englishCopy.detailLabels.renterEmail} / ${copy.detailLabels.renterEmail}`,
        value: formatValue(data.renterEmail),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.renterPhone
            : `${englishCopy.detailLabels.renterPhone} / ${copy.detailLabels.renterPhone}`,
        value: formatValue(data.renterPhone),
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.vehicle
            : `${englishCopy.detailLabels.vehicle} / ${copy.detailLabels.vehicle}`,
        value: `${carLabel} (${plate})`,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.period
            : `${englishCopy.detailLabels.period} / ${copy.detailLabels.period}`,
        value: `${period} (${rentalDays})`,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.pickupLocation
            : `${englishCopy.detailLabels.pickupLocation} / ${copy.detailLabels.pickupLocation}`,
        value: pickupLocation,
      },
      {
        label:
          locale === 'en'
            ? englishCopy.detailLabels.pickupAddress
            : `${englishCopy.detailLabels.pickupAddress} / ${copy.detailLabels.pickupAddress}`,
        value: pickupAddress,
      },
    ],
    terms:
      locale === 'en'
        ? englishCopy.terms
        : englishCopy.terms.map(
            (term, index) => `${term} / ${copy.terms[index] ?? ''}`,
          ),
    footer:
      locale === 'en'
        ? englishCopy.footer
        : `${englishCopy.footer} / ${copy.footer}`,
    body,
  };
};

export const formatContractText = (
  template: ContractTemplate,
  options?: { includeTitle?: boolean },
) => {
  const includeTitle = options?.includeTitle ?? true;
  const detailLines = template.details.map(
    (item) => `${item.label}: ${item.value}`,
  );
  const termLines = template.terms.map(
    (term, index) => `${index + 1}. ${term}`,
  );

  const lines = [
    template.intro,
    '',
    ...detailLines,
    '',
    ...termLines,
    '',
    template.footer,
  ];

  if (template.body) {
    lines.push('', template.body);
  }

  return (includeTitle ? [template.title, '', ...lines] : lines).join('\n');
};
