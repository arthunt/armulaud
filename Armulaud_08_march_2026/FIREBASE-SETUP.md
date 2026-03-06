# Firebase Seadistamine – Samm-sammult juhend

## Miks Firebase?
Firebase võimaldab **reaalajas sünkrooni** eri seadmete vahel:
- Su sülearvuti (kõneleja) → tõlkija telefon → projektori arvuti
- Latentsus alla 0.5 sekundi

---

## Samm 1: Loo Firebase konto

1. Mine: **https://console.firebase.google.com/**
2. Logi sisse Google kontoga
3. Klõpsa **"Add project"** (Lisa projekt)
4. Anna projekti nimi, nt: `armulaud-2026`
5. Keela Google Analytics (pole vaja)
6. Klõpsa **"Create project"**

---

## Samm 2: Lisa Realtime Database

1. Vasaku menüüs vali: **Build → Realtime Database**
2. Klõpsa **"Create Database"**
3. Vali server: **Europe-west1** (lähim Eestile)
4. Turvareeglid: vali **"Start in test mode"** *(ajutiselt)*
5. Klõpsa **"Enable"**

---

## Samm 3: Seadista turvareeglid

1. Realtime Database → vahekaart **Rules**
2. Asenda sisu sellega:

```json
{
  "rules": {
    "presentation": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Klõpsa **"Publish"**

> ⚠️ **Märkus:** Need reeglid on avatud – sobib kirikuürituse ajaks.
> Pärast üritust võid projekti kustutada või reeglid sulgeda.

---

## Samm 4: Hangi konfiguratsioon

1. Firebase Console → projekti ülevaade ⚙️ → **Project settings**
2. Kerige alla jaotiseni **"Your apps"**
3. Klõpsa ikooni **`</>`** (Web app)
4. Anna rakenduse hüüdnimi nt: `armulaud`
5. Klõpsa **"Register app"**
6. Näed konfiguratsiooni sellisel kujul:

```javascript
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "armulaud-2026.firebaseapp.com",
  databaseURL:       "https://armulaud-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "armulaud-2026",
  storageBucket:     "armulaud-2026.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## ✅ Konfiguratsioon on juba seadistatud!

Kõik kolm faili (`speaker.html`, `translator.html`, `projector.html`) sisaldavad juba
sinu Firebase projekti `armulaud-af87f` konfiguratsioooni. **Midagi pole vaja muuta.**

---

## Samm 6: Testi

### Testimine ilma internetita (sama arvuti):
1. Ava **speaker.html** Chrome'is
2. Ava **translator.html** teises tabis
3. Ava **projector.html** kolmandas tabis
4. Vajuta speaker vaates → nooleklahv → translator ja projector peavad uuenduma

> BroadcastChannel toimib automaatselt, Firebase'i seadistamist pole vaja.

### Testimine eri seadmetel (vajab Firebase'i):
1. Hostige failid – kasutage näiteks **Visual Studio Code Live Server**
2. Või laadige failid Google Drive'i ja avage iga seade eraldi
3. Kõik 3 seadet peavad olema **samas WiFi võrgus**

---

## Seadmete paigutus kirikuteenistusel

```
┌─────────────────┐   WiFi    ┌──────────────────┐
│  KÕNELEJA       │◄─────────►│  TÕLKIJA         │
│  speaker.html   │           │  translator.html  │
│  Sülearvuti     │           │  Mobiiltelefon    │
└────────┬────────┘           └──────────────────┘
         │ WiFi
         ▼
┌─────────────────┐
│  PROJEKTOR      │
│  projector.html │
│  Saali arvuti   │
└─────────────────┘
```

---

## Korduma kippuvad küsimused

**K: Kas internet on kohustuslik?**
V: Mitte sama arvuti testimiseks. Eri seadmete vahel on internet vajalik.

**K: Mis juhtub, kui internet katkeb?**
V: BroadcastChannel (sama brauser) jätkab tööd. Eri seadmete vahel sünk peatub,
   kuid kõneleja saab edasi navigeerida – lihtsalt tõlkija ei uuene automaatselt.

**K: Taimer annab 7 minutil punase hoiatuse – miks?**
V: Armulaua kõne peab jääma alla 7 minuti. Hoiatus aitab aega kontrollida.

**K: Kuidas projektoril täisekraanile minna?**
V: Vajuta klaviatuuril `F` klahvi projector.html failis.

**K: Slaidi 22 (2Kr 12:9) puhul kuvatakse 3 keeles – kuidas?**
V: See on eelseadistatud slides.js failis `projector: "bible"` tüübiga.

---

## Projektor – mida millal näidatakse

| Slaidi tüüp | Projektoril | Näide |
|-------------|-------------|-------|
| `none` | Sinine taustagraafika | Enamik slaide |
| `section` | Jaotise pealkiri (EST + RUS) | "3. Identiteet" |
| `bible` | Piiblisalm (EST + RUS + ENG) | 2Kr 12:9 |
| `image` | Foto + allkiri | Leib, trenn |
| `keytext` | Suur võtmesõna | "TÄNA / СЕГОДНЯ" |

---

*Seadistamise küsimuste korral vaata: https://firebase.google.com/docs/database/web/start*
