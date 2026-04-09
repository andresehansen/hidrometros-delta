process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

// MODO LABORATORIO: Solo La Plata
const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

async function fetchURL(url) {
  console.log(`   -> Intentando entrar a: ${url}`);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36" }
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text;
  } catch (error) { return null; }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    // Imprimimos el "mapa" del archivo para verlo con nuestros propios ojos
    if (tipo === 'altura') {
        console.log(`   [Visor de Archivo] Fila 1 (Títulos): ${lineas[1]}`);
        console.log(`   [Visor de Archivo] Fila 2 (Unidades): ${lineas[2]}`);
    }

    let cabeceras = lineas[1].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let unidades = lineas[2].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let idxValor = -1;

    if (tipo === 'altura') {
        // Intento 1: Buscar por la palabra clave en el título
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("nivel") || cabeceras[j].includes("altura") || cabeceras[j].includes("marea") || cabeceras[j].includes("cota") || cabeceras[j].includes("rio")) {
                idxValor = j; break;
            }
        }
        // Intento 2: Si tienen nombres raros, buscamos la columna que se mida en "metros" (m)
        if (idxValor === -1) {
            for (let j = 0; j < unidades.length; j++) {
                if (unidades[j] === "m" || unidades[j] === "metros") {
                    idxValor = j; break;
                }
            }
        }
    }

    if (idxValor === -1) {
        console.log(`   ⚠️ No se encontró la columna correcta para ${tipo}.`);
        return null;
    } else {
        if (tipo === 'altura') console.log(`   🎯 Columna elegida para ${tipo}: Índice ${idxValor} (${cabeceras[idxValor]})`);
    }

    let historial = []; let valorActual = null;
    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            // FILTRO DE CORDURA: Si el valor es mayor a 12 metros, es imposible que sea el río, lo ignoramos.
            if (!isNaN(val) && val > -3 && val < 12) {
                let fechaRaw = col[0].replace(/['"]/g, '');
                let horaMatch = fechaRaw.match(/(\d{1,2}:\d{2})/);
                let hora = horaMatch ? horaMatch[1] : fechaRaw;

                if (valorActual === null) valorActual = val;
                else historial.push({ hora: hora, valor: val });
            }
        }
    }
    return { valorActual, historial };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

async function procesarLaPlata(est) {
    console.log(`\n=== 🔬 INICIANDO ANÁLISIS DE: ${est.nombre} ===`);
    let estData = { ...est, altura: null, tendencia: "—", historialAltura: [], vientoActual: null, vientoDireccion: null, historialViento: [], ok: false };

    let rutasOcultas = [
        "https://hidrografia.agpse.gob.ar/histdat/LaPlata.dat",
        "https://hidrografia.agpse.gob.ar/histdat/laplata.dat",
        "http://hidrografia.agpse.gob.ar:53880/histdat/LaPlata.dat"
    ];

    for (let url of rutasOcultas) {
        let csv = await fetchURL(url);
        if (csv && csv.includes(",")) {
            console.log(`   📊 Archivo CSV descargado con éxito. Procesando...`);
            let resAltura = procesarCSV(csv, 'altura');
            
            if (resAltura && resAltura.valorActual !== null) {
                estData.altura = resAltura.valorActual;
                estData.historialAltura = resAltura.historial;
                estData.ok = true;
                
                if (resAltura.historial.length > 0) {
                    let valPrev = resAltura.historial[0].valor;
                    if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                    else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                }
                console.log(`   ✅ Altura actual FINAL: ${estData.altura} m`);
                return estData; 
            } else {
                console.log(`   ❌ El archivo se descargó, pero los números no pasaron el filtro de cordura (ej. eran 13000 metros).`);
            }
        }
    }
    return estData;
}

async function main() {
  const resultados = [];
  for (const est of ESTACIONES) {
    const dataEstacion = await procesarLaPlata(est);
    resultados.push(dataEstacion);
  }
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
  console.log(`\n=== 🏁 PROCESO TERMINADO ===`);
}

main();
