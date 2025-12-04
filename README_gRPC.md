# 🚀 SmartChef Parser - gRPC Naloga

## Hitri Pregled

Nalogo je **uspešno zaključena** z implementacijo polne gRPC infrastrukture za SmartChef aplikacijo.

```
┌─────────────┐      HTTP        ┌──────────────┐      gRPC       ┌──────────┐
│  Brskalne  │◄───────/api────────►│  Express.js │◄──────────────►│  gRPC    │
│   (Vue)    │       JSON         │   Server    │   Protocol      │ Server   │
└─────────────┘                    └──────────────┘   Buffers      └──────────┘
                                           ▲
                                           │
                                      Port 3000
                                           │
                                       Brskalniku dostopno
```

---

## 📋 Kaj je Implementirano?

### ✅ gRPC Protokol
- **1 Service**: `ProductService`
- **5 RPC Klicev**:
  1. `SearchProducts` - Iskanje po ključni besedi
  2. `GetProductsByCategory` - Filtriranje po kategoriji
  3. `GetProductStats` - Statistika cen
  4. `GetAllProducts` - Vsi proizvodi
  5. `WatchPriceUpdates` - **Streaming** (server-side)

### ✅ Protocol Buffers (proto3)
- Datoteka: `proto/products.proto`
- 8 Message tipov
- Binarna serializacija za hitrost

### ✅ Strežnik in Odjemalec
- **Strežnik**: `grpc/server.js` - Port 50051
- **Odjemalec**: `grpc/client.js` - Async komunikacija
- Express integracijo z 5 API endpoints

### ✅ Vmesnik
- Interaktivni preizkuševalnik na `http://localhost:3000/grpc`
- Vizualni prikaz rezultatov
- Konzola z logami
- Real-time streaming simulacija

---

## 🚀 Zagon

### 1. Instalacija
```bash
npm install
```

### 2. Spuščanje aplikacije
```bash
npm run serve
```

Aplikacija se zagnan na:
- 🌐 **Express**: http://localhost:3000
- 📡 **gRPC**: 0.0.0.0:50051

### 3. Dostop do aplikacije
- **Domača stran**: http://localhost:3000
- **Statistika**: http://localhost:3000/stats
- **gRPC Preizkuševalnik**: http://localhost:3000/grpc ⭐

---

## 📁 Datoteke

| Datoteka | Namen |
|----------|-------|
| `proto/products.proto` | Definicija protokol bufferjev |
| `grpc/server.js` | gRPC strežnik (5 RPC funkcij) |
| `grpc/client.js` | gRPC odjemalec (async) |
| `index.js` | Express + gRPC integracija |
| `views/grpc-test.ejs` | Preizkuševalnik |
| `test-grpc.js` | Ročni test skript |
| `GRPC_DOKUMENTACIJA.md` | Polna dokumentacija |

---

## 🔧 API Endpoints

```bash
# 1. Iskanje
POST /api/grpc/search
{ "query": "maslo", "category": "mlečni", "maxResults": 10 }

# 2. Po kategoriji
POST /api/grpc/category
{ "category": "sadje", "minPrice": 0, "maxPrice": 5 }

# 3. Statistika
POST /api/grpc/stats
{ "productId": "maslo" }

# 4. Vsi proizvodi
GET /api/grpc/all

# 5. Streaming
POST /api/grpc/watch
{ "category": "mlečni" }
```

---

## 📊 Primer Odziva

### SearchProducts
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "1",
        "name": "Maslo polnomastno",
        "category": "mlečni proizvodi",
        "price": 2.50,
        "store": "Lidl",
        "quantity": 10
      }
    ],
    "total_count": 1,
    "timestamp": "2025-12-04T15:30:00Z"
  }
}
```

### WatchPriceUpdates (Streaming)
```json
{
  "success": true,
  "data": [
    {
      "product_id": "1",
      "product_name": "Maslo",
      "new_price": 2.45,
      "store": "Lidl",
      "update_time": "2025-12-04T15:30:02Z"
    },
    {
      "product_id": "2",
      "product_name": "Mleko",
      "new_price": 1.22,
      "store": "Mercator",
      "update_time": "2025-12-04T15:30:04Z"
    }
  ]
}
```

---

## ✅ Zahteve Naloge

| ✓ | Zahteva | Status |
|---|---------|--------|
| ✅ | gRPC povezava | Implementirana |
| ✅ | Hitro prenašanje | Binarna serializacija |
| ✅ | Real-time prikaz | Streaming + API |
| ✅ | 1 Service | ProductService |
| ✅ | ≥ 4 RPC klici | 5 klicev |
| ✅ | Streaming | WatchPriceUpdates |
| ✅ | Messages | 8 tipov |

---

## 🎯 Streaming - Podrobno

**WatchPriceUpdates** je server-side streaming RPC klič:

1. Odjemalec pošlje zahtevek s kategorijo
2. Strežnik odpre tok in pošilja posodobitve vsakih 2 sekund
3. Odjemalec prejema več odgovore zaporedoma
4. Tok se zapre po X posodobitvah ali prekinitvi

```
Odjemalec                          Strežnik
    │                                 │
    ├─────► WatchPriceUpdates ───────►│
    │       (category: "mlečni")       │
    │                                  │ Posodobitev 1
    │◄─────── ProductUpdate ───────────┤ (t=0s)
    │     (Maslo, 2.50€)               │
    │                                  │ Posodobitev 2
    │◄─────── ProductUpdate ───────────┤ (t=2s)
    │     (Mleko, 1.22€)               │
    │                                  │ Posodobitev 3
    │◄─────── ProductUpdate ───────────┤ (t=4s)
    │     (Jogurt, 0.85€)              │
    │                                  │
    │◄─────── EOF ─────────────────────┤ Zaključek
    │
```

---

## 🔗 Tehnologije

- **gRPC.js** - Remote Procedure Call framework
- **Protocol Buffers** - Serializacija
- **Node.js** - Runtime
- **Express.js** - Web framework
- **EJS** - Templating

---

## 📖 Dodatne Informacije

- **Polna dokumentacija**: `GRPC_DOKUMENTACIJA.md`
- **Test skript**: `node test-grpc.js` (zahteva tekočo aplikacijo)
- **Proto datoteka**: `proto/products.proto`

---

## 🎓 Kako Deluje?

1. **Zahtevek** - Uporabnik klikne gumb v vmesniku
2. **HTTP POST** - Brskalniku pošlje JSON na `/api/grpc/..`
3. **Express** - Sprejme zahtevek
4. **gRPC Odjemalec** - Pretvori v Protocol Buffers in pošlje strežniku
5. **gRPC Strežnik** - Prejme, obdela, vrne odgovor
6. **Odjemalec** - Konvertira odgovor v JSON
7. **Express** - Vrne JSON brskalniku
8. **Vue.js** - Prikaže rezultate

**Ves proces je optimiziran za hitrost in učinkovitost! ⚡**

---

**Naloga je uspešno zaključena! 🎉**

Za vprašanja ali dodatne teste, glejte `GRPC_DOKUMENTACIJA.md`.
