process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

// MODO LABORATORIO: Solo La Plata
const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

async function fetchURL(url) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Chrome/122.0.0.0 Safari/537.36" } });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) { return null; }
}

// Succionador rápido que extrae todos los CSV que encuentra en la página
async function explorarCSV(url, visitados = new Set()) {
    if (visitados.has(url) || visitados.size > 8) return [];
    visitados.add(url);
    let csvsEncontrados = [];

    try {
        let html = await fetchURL(url);
        if (!html) return csvsEncontrados;

        let metaMatch = html.match(/<meta[^>]*url=([^"'>\s]+)/i);
        if (metaMatch) csvsEncontrados.push(...await explorarCSV(new URL(metaMatch[1], url).href, visitados));

        let iframes = [...html.matchAll(/<iframe[^>]+src=['"]([^'"]+)['"]/gi)].map(m => m[1]);
        for (let src of iframes) csvsEncontrados.push(...await explorarCSV(new URL(src, url).href, visitados));

        let datFiles = [...html.matchAll(/['"]([^'"]+\.dat)['"]/gi)].map(m => m[1]);
        for (let src of datFiles) {
            let datUrl = new URL(src, url).href;
            if (!visitados.has(datUrl)) {
                visitados.add(datUrl);
                let csv = await fetchURL(datUrl);
                if (csv && csv.includes(",")) csvsEncontrados.push(csv);
            }
        }
        return csvsEncontrados;
    } catch(e) { return csvsEncontrados; }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    let cabeceras = lineas[1].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let unidades = lineas[2].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let idxValor = -1, idxDir = -1;

    if (tipo === 'altura') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("nivel") || cabeceras[j].includes("altura") || cabeceras[j].includes("marea") || cabeceras[j].includes("cota") || cabeceras[j].includes("rio")) { idxValor = j; break; }
        }
        if (idxValor === -1) {
            for (let j = 0; j < unidades.length; j++) {
                if (unidades[j] === "m" || unidades[j] === "metros") { idxValor = j; break; }
            }
        }
    } else if (tipo === 'viento') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("velocidad") || cabeceras[j].includes("viento")) idxValor = j;
            if (cabeceras[j].includes("direc") || cabeceras[j].includes("dir")) idxDir = j;
        }
        if (idxValor === -1) {
            for (let j = 0; j < unidades.length; j++) {
                if (unidades[j].includes("km/h") || unidades[j].includes("m/s")) idxValor = j;
                if (unidades[j].includes("deg") || unidades[j].includes("°")) idxDir = j;
            }
        }
    }

    if (idxValor === -1) return null;

    let historial = []; let valorActual = null; let dirActual = null; let horaActual = null;
    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            let valido = tipo === 'altura' ? (val > -3 && val < 12) : (val >= 0 && val < 250);
            
            if (!isNaN(val) && valido) {
                let fechaRaw = col[0].replace(/['"]/g, '');
                let horaMatch = fechaRaw.match(/(\d{1,2}:\d{2})/);
                let hora = horaMatch ? horaMatch[1] : fechaRaw;

                if (valorActual === null) {
                    valorActual = val;
                    horaActual = hora; // ¡Atrapamos la hora!
                    if (idxDir !== -1 && col.length > idxDir) {
                        let dval = parseFloat(col[idxDir]);
                        dirActual = !isNaN(dval) ? dval : col[idxDir].replace(/['"]/g, '').trim();
                    }
                } else {
                    historial.push({ hora: hora, valor: val });
                }
            }
        }
    }
    return { valorActual, dirActual, historial, horaActual };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

async function procesarEstacion(est) {
    console.log(`\n=== 🔬 ANALIZANDO: ${est.nombre} ===`);
    let estData = { ...est, altura: null, tendencia: "—", fechaHora: null, historialAltura: [], vientoActual: null, vientoDireccion: null, fechaHoraViento: null, historialViento: [], ok: false };

    let csvs = await explorarCSV(est.url);
    console.log(`   Archivos CSV encontrados: ${csvs.length}`);

    for (let csv of csvs) {
        let resAltura = procesarCSV(csv, 'altura');
        if (resAltura && resAltura.valorActual !== null && estData.altura === null) {
            estData.altura = resAltura.valorActual;
            estData.fechaHora = resAltura.horaActual;
            estData.historialAltura = resAltura.historial;
            if (resAltura.historial.length > 0) {
                let valPrev = resAltura.historial[0].valor;
                if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                else estData.tendencia = "ESTABLE";
            }
            console.log(`   🌊 Altura lista: ${estData.altura}m a las ${estData.fechaHora} (${estData.tendencia})`);
        }

        let resViento = procesarCSV(csv, 'viento');
        if (resViento && resViento.valorActual !== null && estData.vientoActual === null) {
            estData.vientoActual = resViento.valorActual;
            estData.vientoDireccion = resViento.dirActual;
            estData.fechaHoraViento = resViento.horaActual;
            estData.historialViento = resViento.historial;
            console.log(`   💨 Viento listo: ${estData.vientoActual}km/h a las ${estData.fechaHoraViento}`);
        }
    }

    if (estData.altura !== null) estData.ok = true;
    return estData;
}

async function main() {
  const resultados = [];
  for (const est of ESTACIONES) {
    const dataEstacion = await procesarEstacion(est);
    resultados.push(dataEstacion);
  }
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
  console.log(`\n=== 🏁 PROCESO TERMINADO ===`);
}

main();
