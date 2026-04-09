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
    if (!response.ok) {
        console.log(`   ❌ Error: El servidor respondió con código ${response.status}`);
        return null;
    }
    const text = await response.text();
    console.log(`   ✅ Éxito: Se descargaron ${text.length} caracteres.`);
    return text;
  } catch (error) {
    console.log(`   ❌ Fallo de conexión: ${error.message}`);
    return null;
  }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    let cabeceras = (lineas[0] + "," + lineas[1]).toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let idxValor = -1;
    let numCols = lineas[lineas.length-1].split(',').length;

    if (tipo === 'altura') {
        for (let j = 0; j < cabeceras.length; j++) {
            if (cabeceras[j].includes("nivel") || cabeceras[j].includes("altura") || cabeceras[j].includes("marea") || cabeceras[j].includes("cota") || cabeceras[j].includes("rio")) {
                idxValor = j % numCols; break;
            }
        }
    }

    if (idxValor === -1) {
        console.log(`   ⚠️ No se encontró la columna de ${tipo} en el archivo.`);
        return null;
    }

    let historial = []; let valorActual = null;
    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            if (!isNaN(val)) {
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

    // Construimos las posibles rutas secretas exactas para La Plata
    let rutasOcultas = [
        "https://hidrografia.agpse.gob.ar/histdat/LaPlata.dat",
        "https://hidrografia.agpse.gob.ar/histdat/laplata.dat",
        "http://hidrografia.agpse.gob.ar:53880/histdat/LaPlata.dat"
    ];

    for (let url of rutasOcultas) {
        let csv = await fetchURL(url);
        if (csv && csv.includes(",")) {
            console.log(`   📊 Archivo CSV válido encontrado! Extrayendo datos...`);
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
                console.log(`   ✅ Altura actual: ${estData.altura} m`);
                console.log(`   ✅ Historial capturado: ${estData.historialAltura.length} registros`);
                return estData; // Salimos apenas tenemos éxito
            }
        }
    }
    
    console.log(`   ❌ No se pudo extraer la altura de La Plata.`);
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
