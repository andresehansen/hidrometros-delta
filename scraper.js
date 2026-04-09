process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

async function fetchURL(url) {
    try {
        const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!response.ok) return null;
        return await response.text();
    } catch (error) { return null; }
}

async function investigarLaPlata() {
    console.log("=== 🔬 INICIANDO RAYOS X EN LA PLATA ===");
    let baseUrl = "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html";
    let htmlPrincipal = await fetchURL(baseUrl);

    if (!htmlPrincipal) {
        console.log("❌ No se pudo conectar a La Plata.");
        return;
    }

    let iframes = [...htmlPrincipal.matchAll(/<iframe[^>]+src=['"]([^'"]+)['"]/gi)].map(m => m[1]);
    console.log(`🔍 Iframes encontrados:`, iframes);

    let paginas = [{ url: baseUrl, html: htmlPrincipal }];
    for (let src of iframes) {
        let iframeUrl = new URL(src, baseUrl).href;
        let iframeHtml = await fetchURL(iframeUrl);
        if (iframeHtml) paginas.push({ url: iframeUrl, html: iframeHtml });
    }

    let archivosDat = new Set();
    for (let p of paginas) {
        let dats = [...p.html.matchAll(/['"]([^'"]+\.dat)['"]/gi)].map(m => m[1]);
        for (let d of dats) archivosDat.add(new URL(d, p.url).href);
    }

    console.log(`\n📂 Archivos .dat descubiertos:`, Array.from(archivosDat));

    for (let datUrl of archivosDat) {
        console.log(`\n⬇️ Analizando interior de: ${datUrl}`);
        let csv = await fetchURL(datUrl);
        if (csv) {
            let lineas = csv.trim().split('\n');
            if (lineas.length > 3) {
                console.log(`   Títulos:  ${lineas[1]}`);
                console.log(`   Unidades: ${lineas[2]}`);
                console.log(`   Última fila (Datos de hoy): ${lineas[lineas.length-1]}`);
            } else {
                console.log(`   ⚠️ Archivo vacío o dañado.`);
            }
        }
    }
    console.log("\n=== FIN DE RAYOS X ===");
}

investigarLaPlata();
