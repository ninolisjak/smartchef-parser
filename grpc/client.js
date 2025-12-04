const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

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

// Kreiramo odjemalca
const client = new smartchef.ProductService(
    'localhost:50051',
    grpc.credentials.createInsecure()
);

// 1. SEARCH PRODUCTS
function searchProducts(query, category = '', maxResults = 10) {
    return new Promise((resolve, reject) => {
        client.searchProducts({
            query: query,
            category_filter: category,
            max_results: maxResults
        }, (err, response) => {
            if (err) {
                console.error('SearchProducts napaka:', err.message);
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

// 2. GET PRODUCTS BY CATEGORY
function getProductsByCategory(category, minPrice = 0, maxPrice = 100) {
    return new Promise((resolve, reject) => {
        client.getProductsByCategory({
            category: category,
            min_price: minPrice,
            max_price: maxPrice
        }, (err, response) => {
            if (err) {
                console.error('GetProductsByCategory napaka:', err.message);
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

// 3. GET PRODUCT STATS
function getProductStats(productId) {
    return new Promise((resolve, reject) => {
        client.getProductStats({
            product_id: productId
        }, (err, response) => {
            if (err) {
                console.error('GetProductStats napaka:', err.message);
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

// 4. GET ALL PRODUCTS
function getAllProducts() {
    return new Promise((resolve, reject) => {
        client.getAllProducts({}, (err, response) => {
            if (err) {
                console.error('GetAllProducts napaka:', err.message);
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

// 5. WATCH PRICE UPDATES (Streaming)
function watchPriceUpdates(category) {
    return new Promise((resolve, reject) => {
        const call = client.watchPriceUpdates({
            category: category,
            min_price: 0,
            max_price: 999
        });
        
        const updates = [];
        
        call.on('data', (priceUpdate) => {
            console.log(`📊 Posodobitev cene: ${priceUpdate.product_name} - ${priceUpdate.new_price}€ @ ${priceUpdate.store}`);
            updates.push(priceUpdate);
        });
        
        call.on('end', () => {
            console.log('✅ Streaming zaključen');
            resolve(updates);
        });
        
        call.on('error', (err) => {
            console.error('Napaka pri streamingu:', err.message);
            reject(err);
        });
    });
}

module.exports = {
    searchProducts,
    getProductsByCategory,
    getProductStats,
    getAllProducts,
    watchPriceUpdates,
    client
};
