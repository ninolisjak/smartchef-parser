# 📡 gRPC Implementacija - SmartChef Parser

## Povzetek

Nalogo je implementirana v celoti s popolno gRPC infrastrukturo za prenos podatkov med aplikacijo in strežnikom. Sistem omogoča hitro in učinkovito pridobivanje podatkov ter jih prikazuje v realnem času.

---

## 📁 Struktura projekta

```
smartchef_parser/
├── proto/
│   └── products.proto          # Definicija protokol bufferjev
├── grpc/
│   ├── server.js               # gRPC strežnik (5 RPC klicev)
│   └── client.js               # gRPC odjemalec
├── views/
│   └── grpc-test.ejs           # Interaktivni preizkuševalnik
├── index.js                    # Express aplikacija z gRPC integracijo
├── package.json                # Odvisnosti (dodani @grpc/grpc-js, @grpc/proto-loader)
└── products.json               # Podatki o proizvodih
```

---

## 🛠️ Instalacija

1. **Instalacija potrebnih paketov:**
```bash
npm install @grpc/grpc-js @grpc/proto-loader --save
```

2. **Zagon aplikacije:**
```bash
npm run serve
```

Aplikacija se bo zagnal na:
- 🌐 **Express**: http://localhost:3000
- 📡 **gRPC strežnik**: 0.0.0.0:50051

3. **Dostop do gRPC preizkuševalnika:**
- Odprite http://localhost:3000/grpc v brskalniku

---

## 📝 Datoteka `.proto` - Definicija protokola

Datoteka `proto/products.proto` vsebuje:

### Sporočila (Messages)
- **Product**: Osnovni podatki proizvoda (id, name, category, price, store, quantity)
- **ProductList**: Seznam proizvodov s skupnim številom in timestamp
- **SearchRequest**: Zahtevek za iskanje (query, category_filter, max_results)
- **CategoryRequest**: Zahtevek za filtriranje po kategoriji in ceni
- **StatsRequest**: Zahtevek za statistiko proizvoda
- **ProductStats**: Statistika s povprečno ceno in dostopnostjo
- **ProductUpdate**: Posodobitev cene (za streaming)
- **Empty**: Prazna zahteva

### Storitev `ProductService` - 5 RPC Klicev

#### 1️⃣ **SearchProducts** - Preprost RPC
```proto
rpc SearchProducts (SearchRequest) returns (ProductList) {}
```
- **Namen**: Iskanje proizvodov po ključni besedi
- **Paramteri**: query, category_filter (opciono), max_results
- **Odziv**: Seznam ujemajočih proizvodov

#### 2️⃣ **GetProductsByCategory** - Preprost RPC
```proto
rpc GetProductsByCategory (CategoryRequest) returns (ProductList) {}
```
- **Namen**: Pridobivanje proizvodov po kategoriji in ceni
- **Parametri**: category, min_price, max_price
- **Odziv**: Filtrirani seznam proizvodov

#### 3️⃣ **GetProductStats** - Preprost RPC
```proto
rpc GetProductStats (StatsRequest) returns (ProductStats) {}
```
- **Namen**: Pridobivanje statistike cen za proizvod
- **Parametri**: product_id
- **Odziv**: Povprečna cena, dostopnost, trgovine z najnižjo/najvišjo ceno

#### 4️⃣ **GetAllProducts** - Preprost RPC
```proto
rpc GetAllProducts (Empty) returns (ProductList) {}
```
- **Namen**: Pridobivanje vseh proizvodov
- **Parametri**: (brez)
- **Odziv**: Kompleten seznam vseh proizvodov

#### 5️⃣ **WatchPriceUpdates** - Server-side Streaming RPC ⭐
```proto
rpc WatchPriceUpdates (CategoryRequest) returns (stream ProductUpdate) {}
```
- **Namen**: Spremljanje posodobitev cen v realnem času
- **Parametri**: category, min_price, max_price
- **Odziv**: Tok (stream) posodobitev cen vsaki 2 sekundi
- **Tip**: **Server-side streaming** - strežnik pošilja več sporočil

---

## 🖥️ gRPC Strežnik (`grpc/server.js`)

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Nalaganje proto datoteke
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const smartchef = protoDescriptor.smartchef;
```

### Ključne funkcije:

- **searchProducts()** - Filtrira proizvode po ključni besedi
- **getProductsByCategory()** - Filtrira po kategoriji in ceni
- **getProductStats()** - Izračuna statistiko cen
- **getAllProducts()** - Vrne vse proizvode
- **watchPriceUpdates()** - Pošilja posodobitve cen v toku

Strežnik se zažene na portu **50051**.

---

## 👤 gRPC Odjemalec (`grpc/client.js`)

Odjemalec je namenjen komuniciranju s strežnikom. Vsa komunikacija je asinkriona preko Promise:

```javascript
const client = new smartchef.ProductService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// Iskanje
await grpcClient.searchProducts(query, category, maxResults);

// Kategorija
await grpcClient.getProductsByCategory(category, minPrice, maxPrice);

// Statistika
await grpcClient.getProductStats(productId);

// Vsi proizvodi
await grpcClient.getAllProducts();

// Streaming posodobitev
await grpcClient.watchPriceUpdates(category);
```

---

## 🌐 Express API Endpoints

Vsi gRPC klici so dostopni prek Express REST API:

### 1. **POST /api/grpc/search** - Iskanje
```json
{
  "query": "maslo",
  "category": "mlečni proizvodi",
  "maxResults": 10
}
```

### 2. **POST /api/grpc/category** - Po kategoriji
```json
{
  "category": "sadje",
  "minPrice": 0,
  "maxPrice": 5
}
```

### 3. **POST /api/grpc/stats** - Statistika
```json
{
  "productId": "maslo"
}
```

### 4. **GET /api/grpc/all** - Vsi proizvodi

### 5. **POST /api/grpc/watch** - Streaming posodobitev
```json
{
  "category": "mlečni proizvodi"
}
```

---

## 🎨 Interaktivni Preizkuševalnik

Dostopno na: **http://localhost:3000/grpc**

Vmesnik omogoča:
- ✅ Testiranje vseh 5 RPC klicev
- ✅ Prikaz rezultatov v realnem času
- ✅ Spremljanje konzole z logami
- ✅ Vizualni prikaz podatkov
- ✅ Streaming simulacija

---

## 📊 Primer Delovanja

### Iskanje (SearchProducts)
```
Zahtevek: { query: "maslo", category: "mlečni" }
Odgovor: [
  { id: "1", name: "Maslo polnomastno", price: 2.50, store: "Lidl" },
  { id: "2", name: "Maslo nežno", price: 2.30, store: "Mercator" }
]
```

### Streaming (WatchPriceUpdates)
```
Zahtevek: { category: "mlečni proizvodi" }
Odgovor (stream):
  t=0s   → { product: "Mleko", price: 1.20, store: "Lidl" }
  t=2s   → { product: "Jogurt", price: 0.85, store: "Mercator" }
  t=4s   → { product: "Sir", price: 3.50, store: "Lidl" }
  ...
```

---

## ✅ Zahteve Naloge

| Zahteva | Status | Opis |
|---------|--------|------|
| gRPC povezava | ✅ | Implementirana polna gRPC infrastruktura |
| Hitro in učinkovito prenašanje | ✅ | Binarna serializacija preko protobufferjev |
| Prikaz podatkov v realnem času | ✅ | Streaming in API integacija |
| 1 Service | ✅ | `ProductService` |
| ≥ 4 RPC klici | ✅ | 5 RPC klicev (SearchProducts, GetProductsByCategory, GetProductStats, GetAllProducts, WatchPriceUpdates) |
| Streaming | ✅ | `WatchPriceUpdates` (Server-side streaming) |
| Message s podatkovnimi tipi | ✅ | Product, ProductList, SearchRequest, CategoryRequest, StatsRequest, ProductStats, ProductUpdate, Empty |

---

## 🚀 Kaj se Zgodi pri Zagonu?

1. Express strežnik se zažene na portu **3000**
2. gRPC strežnik se zažene na portu **50051**
3. Brskalniku dostopate na **http://localhost:3000**
4. Klikete na `/grpc` in vidite preizkuševalnik
5. Izberete ukaz in klikete gumb
6. Zahtevek gre prek Express → gRPC → Odjemalec → Strežnik
7. Strežnik vrne podatke nazaj
8. Rezultati se prikažejo v brskalniku

---

## 🔧 Tehnologije

- **gRPC** - Remote Procedure Call
- **Protocol Buffers** (proto3) - Serializacija podatkov
- **Node.js** - Izvajalno okolje
- **Express.js** - Web okvir
- **EJS** - Predloga
- **@grpc/grpc-js** - gRPC za JavaScript
- **@grpc/proto-loader** - Nalaganje proto datotek

---

## 📌 Opombe

- gRPC privzeto ne potrebuje special nastave - deluje out-of-the-box
- Proto datoteka se dinamično naloži in prevede ob zagonu
- Streaming je simuliran z intervalom 2 sekund
- Podatki se berejo iz `products.json`
- Vse je asinkriono in optimizirano za hitrost

---

**Naloga je uspešno zaključena! 🎉**
