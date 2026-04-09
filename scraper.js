process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function espiarHTML() {
    console.log("=== 🕵️‍♂️ ESPIANDO EL CÓDIGO FUENTE DE AGP ===");
    
    const urls = [
        "http://hidrografia.agpse.gob.ar:53880/LaPlata/marea.html",
        "http://hidrografia.agpse.gob.ar:53880/LaPlata/viento.html"
    ];

    for (let url of urls) {
        console.log(`\n🔍 Analizando: ${url}`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const res = await fetch(url, { 
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                console.log(`❌ Error HTTP: ${res.status}`);
                continue;
            }
            const html = await res.text();
            
            // Buscar mágicamente cualquier archivo que termine en .dat
            const dats = [...html.matchAll(/['"]([^'"]+\.dat)['"]/gi)].map(m => m[1]);
            
            if (dats.length > 0) {
                console.log(`🎯 ¡BINGO! Archivo de datos encontrado:`);
                dats.forEach(d => console.log(`   👉 ${d}`));
            } else {
                console.log(`⚠️ No se encontró '.dat'. Buscando '.txt' o '.csv'...`);
                const otros = [...html.matchAll(/['"]([^'"]+\.(csv|txt))['"]/gi)].map(m => m[1]);
                otros.forEach(o => console.log(`   👉 ${o}`));
            }
            
        } catch(e) {
            console.log(`❌ Error: ${e.message}`);
        }
    }
    console.log("\n=== FIN DEL ESPIONAJE ===");
}

espiarHTML();
