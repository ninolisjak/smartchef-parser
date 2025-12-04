#!/usr/bin/env node

/**
 * Primer ročnega testiranja gRPC klicev
 * 
 * Zagon: node test-grpc.js
 */

const grpcClient = require('./grpc/client');

async function runTests() {
    console.log('🚀 Začenjam testiranje gRPC klicev...\n');

    try {
        // Test 1: Iskanje
        console.log('1️⃣  TEST: SearchProducts');
        console.log('   Iskanje: "maslo"');
        const searchResult = await grpcClient.searchProducts('maslo', '', 5);
        console.log(`   ✅ Rezultati: ${searchResult.products.length} proizvodov`);
        if (searchResult.products.length > 0) {
            console.log(`   📦 Primer: ${searchResult.products[0].name} - ${searchResult.products[0].price}€\n`);
        }

        // Test 2: Po kategoriji
        console.log('2️⃣  TEST: GetProductsByCategory');
        console.log('   Kategorija: "mlečni"');
        const categoryResult = await grpcClient.getProductsByCategory('mlečni', 0, 10);
        console.log(`   ✅ Rezultati: ${categoryResult.products.length} proizvodov`);
        if (categoryResult.products.length > 0) {
            console.log(`   📦 Primer: ${categoryResult.products[0].name} @ ${categoryResult.products[0].store}\n`);
        }

        // Test 3: Statistika
        console.log('3️⃣  TEST: GetProductStats');
        console.log('   Proizvod: "maslo"');
        const statsResult = await grpcClient.getProductStats('maslo');
        console.log(`   ✅ Povprečna cena: ${statsResult.average_price}€`);
        console.log(`   📊 Dostopnost: ${statsResult.availability_count} trgovin`);
        console.log(`   💰 Najtaje: ${statsResult.lowest_price_store}`);
        console.log(`   💸 Najdraže: ${statsResult.highest_price_store}\n`);

        // Test 4: Vsi proizvodi
        console.log('4️⃣  TEST: GetAllProducts');
        const allResult = await grpcClient.getAllProducts();
        console.log(`   ✅ Skupaj: ${allResult.total_count} proizvodov`);
        console.log(`   ⏰ Čas: ${allResult.timestamp}\n`);

        // Test 5: Streaming
        console.log('5️⃣  TEST: WatchPriceUpdates (Streaming)');
        console.log('   Kategorija: "mlečni"');
        console.log('   Čakam na posodobitve...\n');
        const streamResult = await grpcClient.watchPriceUpdates('mlečni');
        console.log(`   ✅ Prejeto ${streamResult.length} posodobitev\n`);

        console.log('✅ Vsi testi zaključeni!\n');

    } catch (err) {
        console.error('❌ Napaka:', err.message);
        process.exit(1);
    }

    process.exit(0);
}

runTests();
