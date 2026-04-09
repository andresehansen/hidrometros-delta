process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

// MODO LABORATORIO ESTRICTO: Solo La Plata
const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

async function fetchURL(url) {
  console.log(`Intentando descargar: ${url}`);
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) return null;
    return await response.text();
  } catch (error) { return null; }
}

function procesarCSV(csvText, tipo) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;

    console.log(`\n[${tipo.toUpperCase()}] Archivo encontrado. Leyendo cabeceras...`);
    console.log(`Títulos: ${lineas[1]}`);
    console.log(`Unidades: ${lineas[2]}`);

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
            if (cabeceras[j].includes("direc") || cabeceras[j].includes("dir") || cabeceras[j].includes("rumbo")) idxDir = j;
        }
        if (idxValor === -1) {
            for (let j = 0; j < unidades.length; j++) {
                if (unidades[j].includes("km/h") || unidades[j].includes("m/s") || unidades[j].includes("knots")) idxValor = j;
                if (unidades[j].includes("deg") || unidades[j].includes("°") || unidades[j].includes("grados")) idxDir = j;
            }
        }
    }

    if (idxValor === -1) {
        console.log(`❌ No se detectó columna válida para ${tipo}`);
        return null;
    }

    console.log(`✅ Columna de valor detectada: Índice ${idxValor}`);
    if (idxDir !== -1) console.log(`✅ Columna de dirección detectada: Índice ${idxDir}`);

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
                    horaActual = hora;
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

async function procesarLaPlata(est) {
    let estData = { ...est, altura: null, tendencia: "—", fechaHora: null, historialAltura: [], vientoActual: null, vientoDireccion: null, fechaHoraViento: null, historialViento: [], ok: false };

    // Hemos APAGADO el lector de textos HTML para evitar falsos positivos (como el 0.91).
    // Solo leemos los archivos secretos.
    let urlsAltura = [
        "http://hidrografia.agpse.gob.ar:53880/histdat/LaPlata.dat"
    ];
    
    // Probar posibles nombres comunes para el archivo de viento
    let urlsViento = [
        "http://hidrografia.agpse.gob.ar:53880/histdat/LaPlataViento.dat",
        "http://hidrografia.agpse.gob.ar:53880/histdat/laplataviento.dat",
        "http://hidrografia.agpse.gob.ar:53880/histdat/Viento.dat"
    ];

    for (let url of urlsAltura) {
        let csv = await fetchURL(url);
        if (csv && csv.includes(",")) {
            let res = procesarCSV(csv, 'altura');
            if (res && res.valorActual !== null) {
                estData.altura = res.valorActual;
                estData.fechaHora = res.horaActual;
                estData.historialAltura = res.historial;
                if (res.historial.length > 0) {
                    let valPrev = res.historial[0].valor;
                    if (estData.altura > valPrev + 0.02) estData.tendencia = "SUBIENDO";
                    else if (estData.altura < valPrev - 0.02) estData.tendencia = "BAJANDO";
                    else estData.tendencia = "ESTABLE";
                }
                console.log(`\n=> RESULTADO ALTURA: ${estData.altura}m a las ${estData.fechaHora}`);
                break;
            }
        }
    }

    for (let url of urlsViento) {
        let csv = await fetchURL(url);
        if (csv && csv.includes(",")) {
            let res = procesarCSV(csv, 'viento');
            if (res && res.valorActual !== null) {
                estData.vientoActual = res.valorActual;
                estData.vientoDireccion = res.dirActual;
                estData.fechaHoraViento = res.horaActual;
                estData.historialViento = res.historial;
                console.log(`\n=> RESULTADO VIENTO: ${estData.vientoActual}km/h a las ${estData.fechaHoraViento}`);
                break;
            }
        }
    }

    return estData;
}

async function main() {
  console.log("=== INICIANDO LABORATORIO: LA PLATA ===");
  const resultados = [await procesarLaPlata(ESTACIONES[0])];
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
  console.log("=== FIN ===");
}

main();
