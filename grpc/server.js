const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');
const { scrapeTus } = require('../scraper-products');

// Pot do proto datoteke
const PROTO_PATH = path.join(__dirname, '../proto/products.proto');

// Naložimo proto datoteko
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const smartchef = protoDescriptor.smartchef;

// Cache za scapirane podatke (da ne scrapamo ves čas)
let cachedProducts = [];
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut cache

// Branje podatkov - prvo iz cachea, če je sveže, sicer scrapaj
async function getProducts(searchQuery = null) {
    try {
        // Če je cache sveži in ni novega iskanja, ga uporabi
        if (cachedProducts.length > 0 && Date.now() - cacheTime < CACHE_DURATION && !searchQuery) {
            console.log('[gRPC] Uporabim cachovane podatke');
            return cachedProducts;
        }

        // Če je iskalna beseda, scrapaj s to besedo
        let query = searchQuery || 'mleko';
        console.log(`[gRPC] Scapiram podatke s Tuša... (iskanje: "${query}")`);
        
        try {
            const products = await scrapeTus(query);
            
            // Transformacija podatkov
            cachedProducts = products.map((p, idx) => ({
                id: `${idx}`,
                name: p.name || 'Neznan proizvod',
                category: p.store || 'Tuš',
                price: parseFloat(p.price) || 0,
                store: p.store || 'Tuš',
                quantity: Math.floor(Math.random() * 50) + 1
            }));

            cacheTime = Date.now();
            console.log(`[gRPC] Scrapane podatke: ${cachedProducts.length} proizvodov`);
            return cachedProducts;

        } catch (err) {
            console.error(`[gRPC] Napaka pri scrapanju:`, err.message);
            
            // Fallback - poskusi s JSON
            try {
                const data = fs.readFileSync(path.join(__dirname, '../products.json'), 'utf-8');
                let products = JSON.parse(data);
                
                cachedProducts = products.map((p, idx) => ({
                    id: `${idx}`,
                    name: p.name || 'Neznan proizvod',
                    category: p.store || 'Tuš',
                    price: parseFloat(p.price) || 0,
                    store: p.store || 'Tuš',
                    quantity: Math.floor(Math.random() * 50) + 1
                }));

                return cachedProducts;
            } catch (fallbackErr) {
                console.error('Tudi fallback JSON ne dela:', fallbackErr);
                return [];
            }
        }

    } catch (err) {
        console.error('Napaka pri pridobivanju podatkov:', err);
        return [];
    }
}

// 1. RPC: SearchProducts - Iskanje po ključni besedi
async function searchProducts(call, callback) {
    try {
        console.log(`[gRPC] SearchProducts - Iskanje: "${call.request.query}"`);
        
        const query = call.request.query || '';
        const maxResults = call.request.max_results || 10;
        
        // Scrapaj s to specifično besedo
        const products = await getProducts(query);
        
        let filtered = products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.store.toLowerCase().includes(query.toLowerCase())
        ).slice(0, maxResults);
        
        // Dodatni filter po kategoriji (store)
        if (call.request.category_filter) {
            filtered = filtered.filter(p => 
                p.store.toLowerCase().includes(call.request.category_filter.toLowerCase())
            );
        }
        
        console.log(`[gRPC] SearchProducts - Najdeno: ${filtered.length} rezultatov`);
        
        callback(null, {
            products: filtered,
            total_count: filtered.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[gRPC] Napaka pri SearchProducts:', err);
        callback(err);
    }
}

// 2. RPC: GetProductsByCategory - Filtriranje po ceni
async function getProductsByCategory(call, callback) {
    try {
        console.log(`[gRPC] GetProductsByCategory - Kategorija: "${call.request.category}"`);
        
        // Scrapaj z iskalnim terminom (kategorija je iskalna beseda)
        const products = await getProducts(call.request.category);
        
        const minPrice = call.request.min_price || 0;
        const maxPrice = call.request.max_price || Number.MAX_VALUE;
        
        // Filtriramo samo po CENI - že smo scrapali po iskalni besedi (kategorija)
        let filtered = products.filter(p =>
            p.price >= minPrice &&
            p.price <= maxPrice
        );
        
        console.log(`[gRPC] GetProductsByCategory - Najdeno: ${filtered.length} rezultatov (filtracija po ceni)`);
        
        callback(null, {
            products: filtered,
            total_count: filtered.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[gRPC] Napaka pri GetProductsByCategory:', err);
        callback(err);
    }
}

// 3. RPC: GetProductStats - Statistika za proizvod
async function getProductStats(call, callback) {
    try {
        console.log(`[gRPC] GetProductStats - Proizvod ID: "${call.request.product_id}"`);
        
        // Scrapaj po imenu proizvoda
        const products = await getProducts(call.request.product_id);
        const productId = call.request.product_id.toLowerCase();
        
        // Poiščemo vse variacije produkta
        const productVariants = products.filter(p =>
            p.name.toLowerCase().includes(productId)
        );
        
        if (productVariants.length === 0) {
            callback(null, {
                product_id: productId,
                product_name: 'Proizvod ni najden',
                average_price: 0,
                availability_count: 0,
                lowest_price_store: '',
                highest_price_store: ''
            });
            return;
        }
        
        const prices = productVariants.map(p => p.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        const lowestStore = productVariants.find(p => p.price === minPrice)?.store || '';
        const highestStore = productVariants.find(p => p.price === maxPrice)?.store || '';
        
        console.log(`[gRPC] GetProductStats - Najdeno: ${productVariants.length} variacij`);
        
        callback(null, {
            product_id: productId,
            product_name: productVariants[0].name,
            average_price: Math.round(avgPrice * 100) / 100,
            availability_count: productVariants.length,
            lowest_price_store: lowestStore,
            highest_price_store: highestStore
        });
    } catch (err) {
        console.error('[gRPC] Napaka pri GetProductStats:', err);
        callback(err);
    }
}

// 4. RPC: GetAllProducts - Pridobivanje vseh proizvodov
async function getAllProducts(call, callback) {
    try {
        console.log('[gRPC] GetAllProducts');
        
        const products = await getProducts();
        
        console.log(`[gRPC] GetAllProducts - Skupaj: ${products.length} proizvodov`);
        
        callback(null, {
            products: products,
            total_count: products.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[gRPC] Napaka pri GetAllProducts:', err);
        callback(err);
    }
}

// 5. RPC: WatchPriceUpdates - Server-side streaming
async function watchPriceUpdates(call) {
    try {
        console.log(`[gRPC] WatchPriceUpdates - Kategorija: "${call.request.category}"`);
        
        // Scrapaj po kategoriji (iskalni termin)
        const products = await getProducts(call.request.category);
        
        // Vsi scapani podatki - ne filtriramo dodatno
        let filtered = products;
        
        // Če nič ne najdemo, vzamemo nekaj privzetih
        if (filtered.length === 0) {
            filtered = products.slice(0, 5);
        }
        
        // Simuliramo streaming - pošiljamo posodobitve v 2-sekundnih intervalih
        let index = 0;
        const maxItems = Math.min(filtered.length, 10);
        
        const interval = setInterval(() => {
            if (index >= maxItems) {
                clearInterval(interval);
                call.end();
                return;
            }
            
            const product = filtered[index];
            const priceVariation = (Math.random() - 0.5) * 0.5;
            const newPrice = Math.max(0.5, product.price + priceVariation);
            
            call.write({
                product_id: product.id,
                product_name: product.name,
                new_price: Math.round(newPrice * 100) / 100,
                store: product.store,
                update_time: new Date().toISOString()
            });
            
            index++;
        }, 2000);
        
        call.on('cancelled', () => {
            console.log('[gRPC] WatchPriceUpdates - Streaming prekinjen');
            clearInterval(interval);
        });
    } catch (err) {
        console.error('[gRPC] Napaka pri streamingu:', err);
        call.destroy(err);
    }
}

// Funkcija za pričetek gRPC strežnika
function startServer() {
    const server = new grpc.Server();
    
    // Registriramo storitve
    server.addService(smartchef.ProductService.service, {
        SearchProducts: searchProducts,
        GetProductsByCategory: getProductsByCategory,
        GetProductStats: getProductStats,
        GetAllProducts: getAllProducts,
        WatchPriceUpdates: watchPriceUpdates
    });
    
    // Strežnik se zažene na portu 50051
    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error('Napaka pri zagonu gRPC strežnika:', err);
            return;
        }
        console.log('✅ gRPC strežnik se je uspešno zagnal na 0.0.0.0:50051');
    });
    
    return server;
}

module.exports = { startServer, smartchef };
