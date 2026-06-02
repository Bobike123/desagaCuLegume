import type { LegalDocumentData } from '$lib/components/LegalDocument.svelte';

const updated = 'Ultima actualizare: 2 iunie 2026';

export const privacyPolicy: LegalDocumentData = {
  title: 'Politica de confidențialitate',
  eyebrow: 'Protecția datelor',
  updated,
  metaDescription:
    'Politica de confidențialitate GDPR pentru magazinul online DeSaga cu Legume, cu informații despre date, scopuri, temeiuri, retenție și drepturi.',
  intro:
    'Acest document explică modul în care DeSaga cu Legume prelucrează datele cu caracter personal ale clienților și vizitatorilor website-ului, în conformitate cu Regulamentul (UE) 2016/679 privind protecția datelor (GDPR) și legislația română aplicabilă.',
  sections: [
    {
      title: 'Operatorul de date',
      paragraphs: [
        '[DENUMIRE_COMPANIE], cu sediul social în [ADRESA], înregistrată la Registrul Comerțului sub nr. [NUMAR_REGISTRUL_COMERTULUI], având CUI/TVA [CUI], este operatorul datelor cu caracter personal prelucrate prin intermediul acestui website.',
        'Pentru întrebări privind această politică sau pentru exercitarea drepturilor privind datele personale, ne puteți contacta la [EMAIL] sau la [TELEFON].',
      ],
    },
    {
      title: 'Categorii de date personale prelucrate',
      paragraphs: [
        'Prelucrăm numai datele necesare pentru funcționarea website-ului, administrarea conturilor de client, gestionarea comenzilor, livrării sau ridicării produselor și respectarea obligațiilor legale.',
      ],
      bullets: [
        'Date de identificare și contact: nume, prenume, adresă de e-mail, număr de telefon.',
        'Date de cont: nume de utilizator, identificatori de cont, parole sau credențiale stocate în formă securizată, istoricul autentificărilor și setările contului.',
        'Date de comandă: produsele comandate, cantități, preferințe privind livrarea sau ridicarea, observații transmise de client, istoricul comenzilor.',
        'Date de livrare: adresă de livrare, localitate, județ, cod poștal, instrucțiuni pentru livrare și date necesare pentru contactarea clientului.',
        'Date tehnice și de securitate: adresă IP, identificatori cookie, tip browser, dispozitiv, pagini accesate, jurnale de securitate, erori tehnice și activități necesare prevenirii abuzurilor.',
        'Date de comunicare: mesaje transmise prin formulare, e-mail, telefon sau conversații legate de comenzi, reclamații sau disponibilitatea produselor.',
      ],
      callout:
        'Website-ul nu procesează plăți online și nu colectează date de card bancar. Orice plată, dacă este disponibilă, se realizează la livrare, la ridicare sau printr-o modalitate convenită direct cu DeSaga cu Legume.',
    },
    {
      title: 'Scopurile prelucrării',
      bullets: [
        'Crearea, administrarea și securizarea conturilor de client.',
        'Autentificarea utilizatorilor și menținerea sesiunilor active.',
        'Afișarea produselor, gestionarea coșului și procesarea comenzilor.',
        'Confirmarea disponibilității produselor, pregătirea comenzii și organizarea livrării sau ridicării.',
        'Comunicarea cu clienții despre comenzi, stoc, reclamații, retururi, înlocuiri sau informații administrative.',
        'Îndeplinirea obligațiilor fiscale, contabile, comerciale, de protecție a consumatorilor și de siguranță alimentară.',
        'Prevenirea fraudelor, protejarea website-ului, investigarea incidentelor tehnice și păstrarea securității sistemelor.',
        'Realizarea de statistici și analiză a utilizării website-ului, numai în condițiile stabilite în Politica de cookie-uri și, unde este cazul, pe baza consimțământului.',
        'Transmiterea de comunicări comerciale sau marketing, numai dacă utilizatorul și-a exprimat consimțământul sau dacă legea permite o comunicare similară cu drept de opoziție.',
      ],
    },
    {
      title: 'Temeiurile juridice ale prelucrării',
      table: {
        headers: ['Activitate', 'Temei juridic GDPR'],
        rows: [
          ['Crearea contului, autentificare, gestionarea comenzii, livrare sau ridicare', 'Executarea contractului sau efectuarea demersurilor la cererea persoanei vizate înainte de încheierea contractului, art. 6 alin. (1) lit. b) GDPR.'],
          ['Păstrarea documentelor comerciale, fiscale și contabile', 'Îndeplinirea unei obligații legale, art. 6 alin. (1) lit. c) GDPR.'],
          ['Răspuns la întrebări, reclamații și cereri ale clienților', 'Executarea contractului, obligație legală sau interes legitim, după caz.'],
          ['Securitatea website-ului, prevenirea abuzurilor, păstrarea jurnalelor tehnice', 'Interes legitim, art. 6 alin. (1) lit. f) GDPR, constând în protejarea serviciului, a clienților și a infrastructurii.'],
          ['Cookie-uri de analiză, marketing și comunicări promoționale opționale', 'Consimțământ, art. 6 alin. (1) lit. a) GDPR, coroborat cu normele ePrivacy aplicabile.'],
          ['Constatarea, exercitarea sau apărarea unor drepturi', 'Interes legitim sau obligație legală, în funcție de situație.'],
        ],
      },
    },
    {
      title: 'Durate de păstrare',
      paragraphs: [
        'Datele sunt păstrate numai atât timp cât este necesar pentru scopurile indicate mai sus, cu respectarea termenelor legale aplicabile și a principiului limitării stocării.',
      ],
      table: {
        headers: ['Categorie de date', 'Perioadă orientativă de păstrare'],
        rows: [
          ['Date de cont', 'Pe durata existenței contului și, după închidere, până la 3 ani, dacă sunt necesare pentru apărarea drepturilor sau soluționarea unor reclamații.'],
          ['Credențiale și date de autentificare', 'Pe durata existenței contului sau până la schimbarea/parolarea credențialelor, în formă securizată.'],
          ['Comenzi, livrare, ridicare și comunicări contractuale', 'Pe durata executării comenzii și până la 3 ani după finalizare, cu excepția documentelor fiscale sau contabile care se păstrează conform legii aplicabile.'],
          ['Documente fiscale, contabile și comerciale', 'Conform termenelor prevăzute de legislația fiscală și contabilă din România, de regulă 5 ani sau o perioadă mai lungă dacă legea impune.'],
          ['Reclamații și solicitări de suport', 'Până la soluționare și, după caz, până la 3 ani pentru dovedirea modului de soluționare.'],
          ['Jurnale tehnice, IP și securitate', 'De regulă între 6 și 12 luni, cu posibilitatea păstrării mai îndelungate dacă există un incident, o investigație sau o obligație legală.'],
          ['Consimțăminte cookie și preferințe', 'Pe durata indicată în Politica de cookie-uri, de regulă până la 6 luni, apoi se solicită reînnoirea preferinței.'],
          ['Date de marketing', 'Până la retragerea consimțământului sau opoziția utilizatorului, dar nu mai mult decât este necesar pentru scopul comunicării.'],
        ],
      },
    },
    {
      title: 'Furnizori și destinatari ai datelor',
      paragraphs: [
        'Putem transmite date personale către furnizori care acționează în numele nostru sau către destinatari independenți atunci când este necesar pentru operarea website-ului, onorarea comenzilor sau respectarea legii.',
      ],
      bullets: [
        'Furnizori de găzduire, infrastructură, baze de date, autentificare și securitate informatică.',
        'Furnizori de servicii de e-mail, mesagerie, formulare de contact și notificări administrative.',
        'Furnizori de analiză web, numai conform preferințelor cookie exprimate de utilizator.',
        'Servicii de hartă, localizare sau social media integrate în website, acolo unde sunt utilizate.',
        'Parteneri de livrare, curieri sau persoane autorizate pentru transportul comenzilor.',
        'Consultanți fiscali, contabili, juridici și auditori, în limitele necesare.',
        'Autorități publice, instanțe sau instituții competente, atunci când legea impune sau permite acest lucru.',
      ],
      callout:
        'În cazul în care un furnizor prelucrează date în afara Spațiului Economic European, vom folosi garanții adecvate, cum ar fi decizii de adecvare, clauze contractuale standard sau alte mecanisme prevăzute de GDPR.',
    },
    {
      title: 'Drepturile persoanelor vizate',
      paragraphs: [
        'În condițiile GDPR, beneficiați de următoarele drepturi cu privire la datele personale care vă privesc:',
      ],
      bullets: [
        'Dreptul de acces la datele personale și la informații despre prelucrare.',
        'Dreptul la rectificarea datelor inexacte sau completarea datelor incomplete.',
        'Dreptul la ștergere, în cazurile prevăzute de lege.',
        'Dreptul la restricționarea prelucrării.',
        'Dreptul la portabilitatea datelor, atunci când prelucrarea se bazează pe consimțământ sau contract și este realizată prin mijloace automate.',
        'Dreptul de opoziție față de prelucrările întemeiate pe interes legitim sau față de marketing direct.',
        'Dreptul de a retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate anterior retragerii.',
        'Dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP) sau la o altă autoritate de supraveghere competentă din UE.',
      ],
    },
    {
      title: 'Exercitarea drepturilor',
      paragraphs: [
        'Pentru exercitarea drepturilor, ne puteți transmite o cerere la [EMAIL], indicând dreptul exercitat, datele de identificare necesare și informațiile care ne ajută să identificăm contul sau comanda vizată.',
        'Putem solicita informații suplimentare rezonabile pentru confirmarea identității, în special atunci când cererea privește accesul, ștergerea sau transmiterea datelor. Răspundem fără întârzieri nejustificate și, în orice caz, în termenul prevăzut de GDPR.',
        'Dacă o cerere este complexă sau există un număr mare de cereri, termenul de răspuns poate fi prelungit conform legii, cu informarea persoanei vizate.',
      ],
    },
    {
      title: 'Ștergerea contului de către utilizator',
      paragraphs: [
        'Utilizatorul autentificat poate solicita închiderea contului direct din pagina „Contul meu”, secțiunea „Ștergere cont”, prin introducerea parolei curente și a textului de confirmare afișat în interfață.',
        'După confirmare, contul este dezactivat, sesiunile active sunt închise, iar datele de profil care nu mai sunt necesare sunt șterse sau anonimizate. Datele care trebuie păstrate pentru executarea comenzilor, obligații fiscale, contabile, comerciale, protecția consumatorilor, siguranța alimentară sau apărarea drepturilor pot fi păstrate pe durata permisă ori impusă de lege.',
        'Ștergerea contului nu anulează automat comenzile deja plasate. Pentru anularea unei comenzi în curs, utilizatorul trebuie să contacteze [DENUMIRE_COMPANIE] la [EMAIL] sau [TELEFON], înainte de pregătirea ori livrarea produselor.',
      ],
    },
    {
      title: 'Securitatea datelor',
      paragraphs: [
        'DeSaga cu Legume aplică măsuri tehnice și organizatorice rezonabile pentru protejarea datelor personale împotriva accesului neautorizat, pierderii, modificării, divulgării sau distrugerii. Aceste măsuri includ, după caz, controlul accesului, jurnalizare, parole securizate, actualizări tehnice, backup și limitarea accesului intern la date.',
        'Nicio transmisie pe internet și niciun sistem informatic nu poate fi garantat ca fiind absolut sigur. În cazul unui incident de securitate care implică date personale, vom lua măsurile prevăzute de lege și vom notifica autoritățile sau persoanele vizate atunci când este necesar.',
      ],
    },
    {
      title: 'Contact pentru confidențialitate',
      paragraphs: [
        'Pentru orice solicitare privind protecția datelor, vă rugăm să utilizați următoarele date de contact: [DENUMIRE_COMPANIE], [ADRESA], e-mail: [EMAIL], telefon: [TELEFON].',
      ],
    },
  ],
};

export const cookiePolicy: LegalDocumentData = {
  title: 'Politica de cookie-uri',
  eyebrow: 'Cookie-uri și preferințe',
  updated,
  metaDescription:
    'Politica de cookie-uri pentru DeSaga cu Legume, cu informații despre cookie-uri necesare, analiză, marketing, durată și gestionarea preferințelor.',
  intro:
    'Această politică explică modul în care DeSaga cu Legume utilizează cookie-uri și tehnologii similare pe website, în conformitate cu GDPR, normele ePrivacy și legislația română aplicabilă.',
  sections: [
    {
      title: 'Ce sunt cookie-urile',
      paragraphs: [
        'Cookie-urile sunt fișiere mici sau identificatori stocați pe dispozitivul utilizatorului atunci când acesta accesează un website. Tehnologii similare includ local storage, session storage, pixeli, SDK-uri și identificatori tehnici folosiți pentru funcționare, securitate, analiză sau marketing.',
        'Cookie-urile pot fi de sesiune, șterse la închiderea browserului, sau persistente, păstrate pentru o perioadă determinată. Pot fi plasate de operatorul website-ului sau de terți integrați în website.',
      ],
    },
    {
      title: 'Cookie-uri strict necesare',
      paragraphs: [
        'Cookie-urile strict necesare permit funcționarea website-ului și nu pot fi dezactivate din sistemele noastre fără a afecta serviciul solicitat de utilizator. Acestea sunt folosite pentru autentificare, sesiuni, coș, securitate, prevenirea fraudelor, echilibrarea traficului și păstrarea preferințelor de confidențialitate.',
      ],
      bullets: [
        'Cookie-uri de sesiune pentru login și menținerea autentificării.',
        'Cookie-uri sau stocare locală pentru coșul de cumpărături și finalizarea comenzii.',
        'Cookie-uri de securitate, protecție CSRF, limitarea abuzurilor și detectarea erorilor.',
        'Cookie-uri pentru memorarea alegerii privind consimțământul cookie.',
      ],
      callout:
        'Pentru cookie-urile strict necesare nu solicităm consimțământ, deoarece sunt necesare pentru furnizarea serviciului cerut de utilizator, cum ar fi autentificarea sau plasarea unei comenzi.',
    },
    {
      title: 'Cookie-uri de analiză',
      paragraphs: [
        'Cookie-urile de analiză ne pot ajuta să înțelegem modul în care este folosit website-ul, ce pagini sunt vizitate și ce probleme tehnice apar. Aceste informații ne ajută să îmbunătățim structura magazinului, disponibilitatea produselor și experiența de comandă.',
        'Dacă folosim instrumente de analiză care nu sunt strict necesare, acestea vor fi activate numai după consimțământul utilizatorului, exprimat prin bannerul cookie sau prin panoul de preferințe.',
      ],
    },
    {
      title: 'Cookie-uri de marketing',
      paragraphs: [
        'Cookie-urile de marketing pot fi folosite pentru măsurarea eficienței campaniilor, afișarea de comunicări relevante sau integrarea unor servicii de social media. Aceste cookie-uri nu sunt necesare pentru cumpărarea produselor.',
        'Cookie-urile de marketing sunt plasate numai dacă utilizatorul își exprimă consimțământul. Refuzul cookie-urilor de marketing nu afectează accesul la website, cont, coș sau plasarea comenzilor.',
      ],
    },
    {
      title: 'Durata cookie-urilor',
      table: {
        headers: ['Categorie', 'Durată orientativă'],
        rows: [
          ['Cookie-uri de sesiune', 'Până la închiderea browserului sau expirarea sesiunii.'],
          ['Autentificare și securitate', 'De la durata sesiunii până la 30 de zile, în funcție de setarea tehnică.'],
          ['Coș și preferințe operaționale', 'De regulă până la 30 de zile sau până la ștergerea de către utilizator.'],
          ['Preferințe cookie', 'De regulă până la 6 luni, după care preferința poate fi solicitată din nou.'],
          ['Cookie-uri de analiză', 'De regulă între 1 și 24 de luni, în funcție de furnizor și setările alese.'],
          ['Cookie-uri de marketing', 'De regulă între 1 și 12 luni, în funcție de furnizor și consimțământ.'],
        ],
      },
    },
    {
      title: 'Gestionarea cookie-urilor',
      paragraphs: [
        'La prima vizită, utilizatorul poate accepta toate cookie-urile opționale, poate respinge cookie-urile neesențiale sau poate gestiona preferințele pe categorii.',
        'Preferințele pot fi modificate ulterior din panoul de preferințe cookie, dacă acesta este disponibil, sau prin ștergerea cookie-urilor din browser. Browserul permite, de asemenea, blocarea sau ștergerea cookie-urilor, însă unele funcții ale website-ului pot deveni indisponibile.',
      ],
      bullets: [
        'Pentru cookie-uri necesare: acestea pot fi blocate din browser, dar autentificarea, coșul sau finalizarea comenzii pot fi afectate.',
        'Pentru analiză și marketing: acestea pot fi refuzate fără impact asupra serviciilor de bază.',
        'Pentru cookie-uri terțe: preferințele pot fi gestionate și prin instrumentele oferite de furnizorii respectivi.',
      ],
    },
    {
      title: 'Consimțământ, GDPR și ePrivacy',
      paragraphs: [
        'Cookie-urile și tehnologiile similare care nu sunt strict necesare sunt folosite numai în baza consimțământului liber, specific, informat și neechivoc al utilizatorului. Utilizatorul poate retrage consimțământul în orice moment.',
        'Atunci când informațiile colectate prin cookie-uri reprezintă date personale, prelucrarea acestora se realizează conform Politicii de confidențialitate.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'Pentru întrebări privind această Politică de cookie-uri, ne puteți contacta la [EMAIL] sau la [TELEFON].',
      ],
    },
  ],
};

export const termsAndConditions: LegalDocumentData = {
  title: 'Termeni și condiții',
  eyebrow: 'Reguli de utilizare',
  updated,
  metaDescription:
    'Termeni și condiții pentru utilizarea magazinului online DeSaga cu Legume, conturi, produse, comenzi, prețuri, livrare, răspundere și lege aplicabilă.',
  intro:
    'Acești termeni reglementează accesarea și utilizarea website-ului operat de DeSaga cu Legume, precum și plasarea comenzilor pentru legume, fructe, produse proaspete și produse locale disponibile prin website.',
  sections: [
    {
      title: 'Identitatea comerciantului',
      paragraphs: [
        'Website-ul este operat de [DENUMIRE_COMPANIE], societate înregistrată la Registrul Comerțului sub nr. [NUMAR_REGISTRUL_COMERTULUI], CUI/TVA [CUI], cu sediul social în [ADRESA].',
        'Pentru comunicări privind comenzile, conturile sau acești termeni, ne puteți contacta la [EMAIL] sau [TELEFON].',
      ],
    },
    {
      title: 'Scopul website-ului',
      paragraphs: [
        'Website-ul permite utilizatorilor să consulte informații despre produse, disponibilitate, prețuri, furnizori locali, opțiuni de livrare sau ridicare și să plaseze comenzi pentru produse proaspete.',
        'Website-ul nu este o platformă de procesare a plăților online. Plata, dacă este aplicabilă, se realizează la livrare, la ridicare sau printr-o modalitate confirmată direct de DeSaga cu Legume.',
      ],
    },
    {
      title: 'Crearea contului și responsabilitățile utilizatorului',
      paragraphs: [
        'Pentru plasarea unei comenzi poate fi necesară crearea unui cont de client. Utilizatorul declară că informațiile furnizate sunt reale, complete și actuale.',
        'Utilizatorul este responsabil pentru confidențialitatea datelor de autentificare și pentru toate activitățile efectuate prin contul său. Orice acces neautorizat sau suspiciune de compromitere trebuie comunicată imediat la [EMAIL].',
        'Utilizatorul poate solicita ștergerea contului din pagina „Contul meu”, folosind secțiunea „Ștergere cont”. Pentru protecția contului, solicitarea necesită parola curentă și confirmarea explicită afișată în interfață.',
      ],
      bullets: [
        'Este interzisă crearea unui cont folosind date false sau datele unei alte persoane fără autorizare.',
        'Este interzisă transmiterea de conținut ilegal, abuziv, fraudulos, defăimător sau care poate afecta funcționarea website-ului.',
        'Ne rezervăm dreptul de a suspenda sau limita accesul unui cont în cazul încălcării acestor termeni, al utilizării frauduloase sau al unor riscuri de securitate.',
      ],
    },
    {
      title: 'Efectele ștergerii contului',
      paragraphs: [
        'După ștergerea contului, utilizatorul nu va mai putea accesa profilul, istoricul comenzilor din cont sau conversațiile asociate contului prin interfața de client.',
        'Ștergerea contului nu afectează dreptul [DENUMIRE_COMPANIE] de a păstra informațiile necesare pentru comenzile plasate anterior, documente fiscale sau contabile, reclamații, obligații legale ori apărarea drepturilor, conform Politicii de confidențialitate și legislației aplicabile.',
      ],
    },
    {
      title: 'Informații despre produse și disponibilitate',
      paragraphs: [
        'Produsele prezentate sunt legume, fructe, produse proaspete sau produse locale, disponibile în funcție de sezon, recoltă, stoc, livrările furnizorilor și vânzările curente.',
        'Fotografiile, descrierile, cantitățile și informațiile afișate au rol informativ. Produsele agricole pot prezenta variații naturale de mărime, formă, culoare, coacere și greutate.',
      ],
      callout:
        'Disponibilitatea afișată online nu reprezintă o garanție absolută până la confirmarea comenzii de către DeSaga cu Legume, deoarece stocurile de produse proaspete se pot modifica rapid.',
    },
    {
      title: 'Prețuri',
      paragraphs: [
        'Prețurile sunt afișate în RON și includ TVA dacă DeSaga cu Legume este plătitoare de TVA sau conform regimului fiscal aplicabil. Costurile de livrare, dacă există, sunt afișate separat sau comunicate înainte de confirmarea comenzii.',
        'Prețul aplicabil este cel comunicat și confirmat pentru comandă. În cazul unor erori evidente de preț, de stoc sau de descriere, DeSaga cu Legume poate refuza sau anula comanda, cu informarea clientului.',
        'Pentru produse vândute la greutate, valoarea finală poate varia în funcție de greutatea pregătită efectiv. Diferențele rezonabile vor fi comunicate clientului la confirmare sau la predare, după caz.',
      ],
    },
    {
      title: 'Procesul de plasare a comenzii',
      paragraphs: [
        'Clientul selectează produsele disponibile, le adaugă în coș, alege livrare sau ridicare, completează datele necesare și transmite comanda prin website.',
        'Transmiterea comenzii reprezintă o solicitare de cumpărare. Contractul este considerat încheiat numai după confirmarea expresă a comenzii de către DeSaga cu Legume, prin e-mail, telefon, mesaj sau actualizarea statusului comenzii.',
      ],
    },
    {
      title: 'Confirmarea, respingerea și anularea comenzilor',
      paragraphs: [
        'DeSaga cu Legume poate contacta clientul pentru confirmarea produselor, a cantităților, a adresei, a intervalului de livrare sau a ridicării. Dacă nu putem confirma datele necesare, comanda poate fi amânată sau anulată.',
      ],
      bullets: [
        'Putem respinge sau anula comenzi în caz de lipsă stoc, produse neconforme, eroare de preț, adresă în afara zonei de livrare, comportament abuziv, suspiciune de fraudă sau imposibilitate obiectivă de livrare.',
        'Clientul poate solicita anularea comenzii înainte de pregătirea acesteia, prin contactarea DeSaga cu Legume la [TELEFON] sau [EMAIL].',
        'Pentru produse perisabile deja pregătite, rezervate sau aflate în livrare, anularea poate fi refuzată sau poate genera costuri rezonabile, în limitele legii.',
      ],
    },
    {
      title: 'Conduita utilizatorului',
      paragraphs: [
        'Utilizatorul se obligă să folosească website-ul în mod legal, loial și rezonabil, fără a afecta drepturile altor persoane, securitatea sistemelor sau activitatea comerciantului.',
      ],
      bullets: [
        'Este interzisă folosirea website-ului pentru fraude, atacuri informatice, colectare neautorizată de date, spam sau transmiterea de programe malițioase.',
        'Este interzisă copierea, extragerea automată sau reutilizarea datelor website-ului în scopuri comerciale fără acordul scris al DeSaga cu Legume.',
        'Utilizatorul nu trebuie să plaseze comenzi false, repetitive sau în scop de testare abuzivă.',
      ],
    },
    {
      title: 'Drepturi de proprietate intelectuală',
      paragraphs: [
        'Conținutul website-ului, inclusiv textele, fotografiile, denumirile comerciale, elementele grafice, structura, codul și materialele de prezentare, aparțin DeSaga cu Legume sau partenerilor săi, cu excepția elementelor furnizate de terți sub licențe proprii.',
        'Utilizarea website-ului nu transferă utilizatorului niciun drept de proprietate intelectuală. Reproducerea, distribuirea, modificarea sau exploatarea conținutului fără acordul prealabil scris este interzisă, cu excepțiile permise de lege.',
      ],
    },
    {
      title: 'Limitarea răspunderii',
      paragraphs: [
        'DeSaga cu Legume depune eforturi rezonabile pentru ca informațiile publicate să fie exacte și actualizate. Totuși, pot apărea erori, întârzieri, diferențe de stoc sau indisponibilități tehnice.',
        'În limitele permise de lege, DeSaga cu Legume nu răspunde pentru pierderi indirecte, pierderi de profit, prejudicii cauzate de utilizarea neautorizată a contului sau de imposibilitatea temporară de accesare a website-ului.',
        'Nimic din acești termeni nu limitează drepturile obligatorii ale consumatorilor, răspunderea pentru produse neconforme sau obligațiile impuse de legislația privind protecția consumatorilor și siguranța alimentară.',
      ],
    },
    {
      title: 'Reclamații și protecția consumatorilor',
      paragraphs: [
        'Pentru orice problemă privind o comandă, clientul trebuie să contacteze mai întâi DeSaga cu Legume la [EMAIL] sau [TELEFON], pentru soluționare amiabilă.',
        'Consumatorii pot utiliza și mecanismele puse la dispoziție de autoritățile competente din România și Uniunea Europeană, inclusiv Autoritatea Națională pentru Protecția Consumatorilor, în condițiile legii.',
      ],
    },
    {
      title: 'Legea aplicabilă și jurisdicția',
      paragraphs: [
        'Acești termeni sunt guvernați de legea română. Orice litigiu va fi soluționat pe cale amiabilă, iar în lipsa unei soluții amiabile, de instanțele competente potrivit dreptului român și normelor obligatorii de protecție a consumatorilor aplicabile în Uniunea Europeană.',
      ],
    },
  ],
};

export const deliveryPickupPolicy: LegalDocumentData = {
  title: 'Politica de livrare și ridicare',
  eyebrow: 'Comenzi și predare',
  updated,
  metaDescription:
    'Politica de livrare și ridicare pentru DeSaga cu Legume, cu informații despre zone, program, proceduri, livrare eșuată și inspecția produselor.',
  intro:
    'Această politică descrie modul în care DeSaga cu Legume organizează livrarea sau ridicarea comenzilor de produse proaspete, în funcție de disponibilitate, zonă și intervalul confirmat cu clientul.',
  sections: [
    {
      title: 'Zone de livrare',
      paragraphs: [
        'Livrarea este disponibilă numai în zonele comunicate pe website, în procesul de comandă sau confirmate direct de DeSaga cu Legume. Zonele de livrare pot varia în funcție de sezon, volum, personal disponibil, condiții de trafic, vreme și disponibilitatea produselor.',
        'Dacă adresa indicată de client nu se află într-o zonă activă de livrare, DeSaga cu Legume poate propune ridicarea comenzii, reprogramarea, o zonă alternativă de predare sau anularea comenzii.',
      ],
    },
    {
      title: 'Program și intervale de livrare',
      paragraphs: [
        'Intervalele de livrare sunt orientative până la confirmarea comenzii. Produsele proaspete sunt pregătite cât mai aproape de momentul predării, cu respectarea condițiilor rezonabile de transport și manipulare.',
        'Pot apărea întârzieri cauzate de trafic, vreme, volum mare de comenzi, disponibilitatea produselor, controale operaționale sau alte situații independente de voința DeSaga cu Legume. În astfel de cazuri, vom încerca să informăm clientul cât mai curând posibil.',
      ],
    },
    {
      title: 'Procedura de ridicare',
      paragraphs: [
        'Ridicarea se realizează la punctul indicat pe website sau comunicat la confirmarea comenzii. Clientul trebuie să se prezinte în intervalul confirmat, să comunice numele, numărul de telefon sau numărul comenzii și să verifice produsele la preluare.',
        'Comenzile neridicate în intervalul confirmat pot fi reprogramate doar dacă produsele își păstrează calitatea și dacă există disponibilitate. Pentru produse perisabile, DeSaga cu Legume poate anula comanda dacă ridicarea nu mai este posibilă în condiții de prospețime.',
      ],
    },
    {
      title: 'Livrare eșuată',
      paragraphs: [
        'O livrare poate fi considerată eșuată dacă adresa este incompletă sau incorectă, clientul nu poate fi contactat, accesul la adresă este imposibil sau clientul nu este disponibil în intervalul confirmat.',
      ],
      bullets: [
        'În cazul unei livrări eșuate, vom încerca să contactăm clientul folosind datele furnizate în comandă.',
        'Reprogramarea este posibilă numai în funcție de disponibilitate și de starea produselor.',
        'Pentru produse perisabile, dacă livrarea nu poate fi finalizată într-un interval rezonabil, comanda poate fi anulată, iar costurile generate pot fi suportate de client în limitele legii.',
      ],
    },
    {
      title: 'Responsabilitățile clientului',
      bullets: [
        'Clientul trebuie să furnizeze o adresă completă și corectă, inclusiv scară, apartament, cod de acces, reper și număr de telefon disponibil.',
        'Clientul trebuie să fie disponibil pentru contact în intervalul de livrare sau ridicare confirmat.',
        'Clientul trebuie să indice eventuale restricții de acces, instrucțiuni speciale sau condiții care pot afecta livrarea.',
        'Clientul trebuie să preia produsele rapid și să le depoziteze corespunzător după predare.',
      ],
    },
    {
      title: 'Inspectarea produselor la livrare sau ridicare',
      paragraphs: [
        'Clientul trebuie să inspecteze produsele la momentul livrării sau ridicării și să semnaleze imediat orice produs lipsă, greșit, deteriorat, alterat sau vizibil neconform.',
        'Pentru situațiile care nu pot fi observate la predare, clientul trebuie să contacteze DeSaga cu Legume cât mai curând posibil, preferabil în 24 de ore, având în vedere natura perisabilă a produselor.',
      ],
      callout:
        'Acceptarea produselor fără observații nu limitează drepturile legale ale consumatorului în cazul unor neconformități care nu puteau fi observate rezonabil la predare.',
    },
    {
      title: 'Contact livrare și ridicare',
      paragraphs: [
        'Pentru modificarea unei comenzi, clarificarea adresei sau informații despre ridicare, contactați DeSaga cu Legume la [TELEFON] sau [EMAIL].',
      ],
    },
  ],
};

export const returnsComplaintsPolicy: LegalDocumentData = {
  title: 'Politica de retururi, rambursări și reclamații',
  eyebrow: 'Produse perisabile',
  updated,
  metaDescription:
    'Politica de retururi, rambursări și reclamații pentru legume, fructe și produse perisabile, inclusiv excepția de la retragerea de 14 zile și procedura pentru produse neconforme.',
  intro:
    'Această politică se aplică produselor proaspete și perisabile comandate prin website și explică modul de raportare a produselor deteriorate, alterate, greșite sau lipsă.',
  sections: [
    {
      title: 'Dreptul de retragere și produsele perisabile',
      paragraphs: [
        'Potrivit legislației UE privind contractele la distanță, consumatorii beneficiază, în general, de un drept de retragere de 14 zile. Totuși, acest drept nu se aplică, de regulă, produselor care sunt susceptibile de a se deteriora sau expira rapid.',
        'Legumele proaspete, fructele, verdețurile și alte produse alimentare perisabile comercializate de DeSaga cu Legume sunt, în principiu, exceptate de la dreptul standard de retragere de 14 zile pentru simpla schimbare a deciziei de cumpărare.',
      ],
      callout:
        'Această excepție nu afectează drepturile consumatorului în cazul produselor deteriorate, alterate, greșite, lipsă sau neconforme cu comanda confirmată.',
    },
    {
      title: 'Situații care pot fi reclamate',
      bullets: [
        'Produs deteriorat, lovit sever, alterat, mucegăit sau impropriu consumului la momentul predării.',
        'Produs greșit față de comanda confirmată.',
        'Produs lipsă din comandă.',
        'Cantitate sau greutate semnificativ diferită de cea confirmată, în afara variațiilor rezonabile pentru produse agricole.',
        'Ambalare sau manipulare necorespunzătoare care afectează calitatea produselor.',
      ],
    },
    {
      title: 'Termene pentru reclamații',
      paragraphs: [
        'Pentru produse proaspete și perisabile, clientul trebuie să comunice reclamația cât mai repede posibil, preferabil în termen de 24 de ore de la livrare sau ridicare și, în orice caz, într-un termen care permite verificarea realistă a stării produsului la momentul predării.',
        'Reclamațiile transmise târziu pot fi mai dificil de verificat, deoarece produsele agricole se pot deteriora rapid din cauze legate de depozitare, temperatură, transport ulterior sau manipulare după predare.',
      ],
      callout:
        'Termenele operaționale de mai sus nu limitează drepturile obligatorii ale consumatorilor prevăzute de lege.',
    },
    {
      title: 'Dovezi necesare',
      paragraphs: [
        'Pentru soluționarea rapidă a unei reclamații, clientul trebuie să transmită informații clare și dovezi rezonabile.',
      ],
      bullets: [
        'Numărul comenzii, numele folosit la comandă și datele de contact.',
        'Descrierea problemei și produsul vizat.',
        'Fotografii clare ale produsului, ambalajului și etichetei, dacă există.',
        'Fotografii ale întregii comenzi în cazul produselor lipsă sau greșite.',
        'Data și ora livrării sau ridicării și modul în care produsul a fost depozitat după predare.',
      ],
    },
    {
      title: 'Procedura de soluționare',
      paragraphs: [
        'Reclamațiile se transmit la [EMAIL] sau [TELEFON]. După primire, DeSaga cu Legume poate solicita detalii suplimentare și va analiza situația ținând cont de natura produsului, timpul scurs, dovezi, condițiile de predare și istoricul comenzii.',
      ],
      bullets: [
        'Dacă reclamația este întemeiată, putem oferi înlocuire, produs echivalent, credit pentru o comandă viitoare, reducere de preț sau rambursare, după caz.',
        'Înlocuirea depinde de disponibilitatea produsului și de sezon.',
        'Rambursarea, dacă este aprobată, se realizează prin modalitatea convenită cu clientul, având în vedere că website-ul nu procesează plăți online.',
        'Dacă problema vizează siguranța alimentară, DeSaga cu Legume poate decide retragerea produsului, informarea furnizorului sau adoptarea altor măsuri necesare.',
      ],
    },
    {
      title: 'Cazuri în care reclamația poate fi respinsă',
      bullets: [
        'Produsul prezintă variații naturale normale de formă, culoare, mărime, coacere sau aspect.',
        'Produsul a fost depozitat necorespunzător după predare.',
        'Produsul a fost manipulat, preparat sau consumat parțial într-un mod care împiedică verificarea problemei.',
        'Reclamația este transmisă după o perioadă care nu permite stabilirea stării produsului la momentul predării.',
        'Dovezile furnizate sunt insuficiente pentru identificarea comenzii sau a neconformității.',
      ],
    },
    {
      title: 'Soluționare amiabilă și autorități',
      paragraphs: [
        'Obiectivul nostru este soluționarea amiabilă și rapidă a reclamațiilor. Dacă nu sunteți mulțumit de răspunsul primit, vă puteți adresa autorităților competente pentru protecția consumatorilor, în condițiile legii.',
      ],
    },
  ],
};

export const companyInformation: LegalDocumentData = {
  title: 'Informații despre companie',
  eyebrow: 'Date comerciale',
  updated,
  metaDescription:
    'Pagina de informații despre companie pentru DeSaga cu Legume, cu identificarea comerciantului, date de contact și detalii legale.',
  intro:
    'Această pagină conține informațiile de identificare ale comerciantului care operează website-ul și magazinul online.',
  sections: [
    {
      title: 'Identificarea comerciantului',
      table: {
        headers: ['Câmp', 'Informație'],
        rows: [
          ['Denumire societate', '[DENUMIRE_COMPANIE]'],
          ['Număr Registrul Comerțului', '[NUMAR_REGISTRUL_COMERTULUI]'],
          ['CUI / TVA', '[CUI]'],
          ['Sediu social', '[ADRESA]'],
          ['E-mail contact', '[EMAIL]'],
          ['Telefon contact', '[TELEFON]'],
        ],
      },
    },
    {
      title: 'Notițe pentru completare înainte de publicare',
      paragraphs: [
        'Înainte de publicarea website-ului, toate câmpurile de mai jos trebuie înlocuite cu datele reale ale comerciantului. Placeholder-ele sunt scrise cu majuscule și în limba română pentru a fi ușor de identificat.',
      ],
      table: {
        headers: ['Placeholder', 'Ce trebuie completat'],
        rows: [
          ['[DENUMIRE_COMPANIE]', 'Denumirea juridică exactă a societății, conform certificatului de înregistrare.'],
          ['[NUMAR_REGISTRUL_COMERTULUI]', 'Numărul de ordine în Registrul Comerțului. Exemplu orientativ: J12/1234/2026.'],
          ['[CUI]', 'Codul unic de identificare fiscală, cu prefix RO numai dacă societatea este plătitoare de TVA.'],
          ['[ADRESA]', 'Sediul social complet: localitate, stradă, număr, județ/sector și țară.'],
          ['[EMAIL]', 'Adresa de e-mail oficială pentru clienți, solicitări GDPR, comenzi și reclamații.'],
          ['[TELEFON]', 'Numărul de telefon oficial pentru suport clienți și comunicări privind comenzile.'],
        ],
      },
      callout:
        'Nu lăsați placeholder-e necompletate în producție. Datele comerciale trebuie să fie identice cu cele din documentele societății și cu informațiile afișate în facturi sau alte comunicări oficiale.',
    },
    {
      title: 'Activitate',
      paragraphs: [
        'DeSaga cu Legume comercializează legume, fructe, produse proaspete și produse locale provenite de la furnizori de piață și colaboratori locali, în funcție de disponibilitate, sezon și stoc.',
        'Website-ul permite informarea clienților, crearea de conturi, plasarea comenzilor și alegerea opțiunilor de livrare sau ridicare, fără procesare de plăți online.',
      ],
    },
    {
      title: 'Contact comercial și suport clienți',
      paragraphs: [
        'Pentru informații despre produse, comenzi, disponibilitate, livrare, ridicare, reclamații sau documente legale, ne puteți contacta la [EMAIL] sau [TELEFON].',
      ],
    },
    {
      title: 'Protecția consumatorilor',
      paragraphs: [
        'Consumatorii pot solicita mai întâi soluționarea amiabilă direct de la DeSaga cu Legume. În lipsa unei soluții, aceștia se pot adresa autorităților competente pentru protecția consumatorilor din România sau din Uniunea Europeană, în condițiile legii.',
      ],
    },
  ],
};

export const produceQualityPolicy: LegalDocumentData = {
  title: 'Politica privind informațiile despre produse și calitatea produselor proaspete',
  eyebrow: 'Calitate și prospețime',
  updated,
  metaDescription:
    'Politica DeSaga cu Legume privind variațiile naturale, prospețimea, depozitarea și așteptările clienților pentru produse agricole proaspete.',
  intro:
    'Această politică explică particularitățile produselor agricole proaspete și standardele pe care DeSaga cu Legume le urmărește în selectarea, manipularea și predarea produselor.',
  sections: [
    {
      title: 'Variații naturale',
      paragraphs: [
        'Legumele, fructele și alte produse agricole sunt produse naturale. Aspectul lor poate varia în funcție de soi, sezon, condiții meteo, sol, momentul recoltării, transport și depozitare.',
      ],
      bullets: [
        'Pot exista variații de mărime, formă, culoare, coacere, textură și greutate.',
        'Pot exista mici imperfecțiuni estetice care nu afectează siguranța sau calitatea alimentară.',
        'Greutățile afișate pot fi aproximative, în special pentru produse vândute la legătură, bucată, caserolă sau kilogram.',
        'Fotografiile de produs sunt orientative și nu garantează uniformitatea exactă a fiecărui produs livrat.',
      ],
    },
    {
      title: 'Standarde de prospețime',
      paragraphs: [
        'DeSaga cu Legume urmărește să ofere produse proaspete, potrivite pentru consum, selectate cu grijă de la furnizori locali, colaboratori sau piețe de aprovizionare.',
      ],
      bullets: [
        'Produsele sunt verificate vizual și, după caz, sortate înainte de predare.',
        'Produsele evident alterate, mucegăite sau improprii consumului nu trebuie comercializate.',
        'Pentru produse foarte sensibile, disponibilitatea poate fi limitată sau modificată în ziua comenzii.',
        'În cazul în care un produs nu îndeplinește standardul intern de prospețime, acesta poate fi retras din comandă și clientul va fi informat.',
      ],
    },
    {
      title: 'Depozitare recomandată',
      paragraphs: [
        'După livrare sau ridicare, clientul este responsabil pentru depozitarea produselor în condiții adecvate. Produsele proaspete pot pierde rapid din calitate dacă sunt expuse la căldură, soare, umiditate excesivă sau manipulare necorespunzătoare.',
      ],
      bullets: [
        'Verdețurile și frunzele se păstrează, de regulă, la rece și se consumă rapid.',
        'Roșiile, cartofii, ceapa, usturoiul sau alte produse pot necesita condiții diferite de păstrare, în funcție de soi și grad de coacere.',
        'Produsele spălate sau tăiate se pot altera mai repede și trebuie păstrate la rece.',
        'Clientul trebuie să inspecteze produsele după predare și să le depoziteze imediat în condiții potrivite.',
      ],
    },
    {
      title: 'Angajamente de calitate',
      bullets: [
        'Selectăm produse cu atenție, în funcție de prospețime, sezon și disponibilitate reală.',
        'Comunicăm, în măsura posibilului, dacă un produs are disponibilitate limitată sau caracteristici speciale.',
        'Nu promitem uniformitate industrială pentru produse agricole locale.',
        'Tratăm prompt reclamațiile privind produse deteriorate, alterate, greșite sau lipsă, conform Politicii de retururi, rambursări și reclamații.',
        'Colaborăm cu furnizori și parteneri pentru îmbunătățirea continuă a calității și trasabilității produselor.',
      ],
    },
    {
      title: 'Așteptări rezonabile pentru produse agricole',
      paragraphs: [
        'Clientul înțelege că produsele agricole locale pot diferi de produsele standardizate industrial. Variațiile naturale nu reprezintă, în sine, defecte sau neconformități.',
        'O neconformitate poate exista atunci când produsul este impropriu consumului, deteriorat semnificativ, greșit față de comanda confirmată, lipsă sau în mod evident sub standardul rezonabil de calitate comunicat clientului.',
      ],
    },
  ],
};

export const cookieBannerText: LegalDocumentData = {
  title: 'Text pentru bannerul de consimțământ cookie',
  eyebrow: 'Text operațional',
  updated,
  metaDescription:
    'Text propus pentru bannerul de consimțământ cookie, inclusiv butoane de acceptare, respingere și gestionare a preferințelor.',
  intro:
    'Acest document conține textul recomandat pentru bannerul de consimțământ cookie și etichetele butoanelor, în linie cu Politica de cookie-uri.',
  sections: [
    {
      title: 'Text banner',
      paragraphs: [
        'Folosim cookie-uri necesare pentru funcționarea website-ului, autentificare, coș și securitate. Cu acordul tău, putem folosi cookie-uri de analiză și marketing pentru a înțelege utilizarea website-ului și pentru a îmbunătăți comunicările noastre. Poți accepta, respinge sau gestiona preferințele, iar opțiunea poate fi modificată ulterior din Politica de cookie-uri.',
      ],
    },
    {
      title: 'Text butoane',
      table: {
        headers: ['Element', 'Text recomandat'],
        rows: [
          ['Text buton acceptare', 'Acceptă toate'],
          ['Text buton respingere', 'Respinge cookie-urile neesențiale'],
          ['Text buton gestionare preferințe', 'Gestionează preferințele'],
        ],
      },
    },
    {
      title: 'Notă de implementare',
      paragraphs: [
        'Butoanele de acceptare și respingere trebuie să fie la fel de accesibile, iar cookie-urile de analiză și marketing nu trebuie activate înainte ca utilizatorul să își exprime consimțământul.',
      ],
    },
  ],
};

export const legalDocuments = [
  {
    href: '/politica-de-confidentialitate',
    label: privacyPolicy.title,
    description: 'GDPR, date personale, temeiuri, retenție și drepturile utilizatorilor.',
    document: privacyPolicy,
  },
  {
    href: '/politica-cookies',
    label: cookiePolicy.title,
    description: 'Cookie-uri necesare, analiză, marketing, durate și preferințe.',
    document: cookiePolicy,
  },
  {
    href: '/termeni-si-conditii',
    label: termsAndConditions.title,
    description: 'Reguli de utilizare, conturi, produse, prețuri, comenzi și lege aplicabilă.',
    document: termsAndConditions,
  },
  {
    href: '/livrare-ridicare',
    label: deliveryPickupPolicy.title,
    description: 'Zone, program, ridicare, livrări eșuate și verificarea produselor.',
    document: deliveryPickupPolicy,
  },
  {
    href: '/retururi-rambursari-reclamatii',
    label: returnsComplaintsPolicy.title,
    description: 'Produse perisabile, reclamații, dovezi, rambursări și înlocuiri.',
    document: returnsComplaintsPolicy,
  },
  {
    href: '/informatii-companie',
    label: companyInformation.title,
    description: 'Date de identificare, contact și informații despre comerciant.',
    document: companyInformation,
  },
  {
    href: '/calitate-produse',
    label: produceQualityPolicy.title,
    description: 'Variații naturale, prospețime, depozitare și standarde de calitate.',
    document: produceQualityPolicy,
  },
  {
    href: '/text-banner-cookies',
    label: cookieBannerText.title,
    description: 'Textul bannerului cookie și etichetele butoanelor.',
    document: cookieBannerText,
  },
] as const;
