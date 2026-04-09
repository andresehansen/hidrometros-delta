process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

const ESTACIONES = [
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" }
];

async function fetchURL(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
}

// Lector experto del archivo de Altura (Ya comprobado que saca el 1.50m)
function procesarCSVAltura(csvText) {
    let lineas = csvText.trim().split('\n');
    if (lineas.length < 4) return null;
    
    // Buscar la columna que se mide en Metros
    let unidades = lineas[2].toLowerCase().replace(/['"]/g, '').split(',').map(s => s.trim());
    let idxValor = -1;
    for (let j = 0; j < unidades.length; j++) {
        if (unidades[j] === "m" || unidades[j] === "metros") { idxValor = j; break; }
    }
    if (idxValor === -1) idxValor = 2; // Columna por defecto si no declara metros
    
    let historial = []; let valorActual = null; let horaActual = null;
    for (let i = lineas.length - 1; i > 2 && historial.length < 5; i--) {
        let col = lineas[i].split(',');
        if (col.length > idxValor && !col[idxValor].includes("NAN")) {
            let val = parseFloat(col[idxValor]);
            
            // FILTRO DE CORDURA: Ignora contadores gigantes. Solo alturas de río reales (-3m a 12m)
            if (!isNaN(val) && val > -3 && val < 12) {
                let horaMatch = col[0].match(/(\d{1,2}:\d{2})/);
                let hora = horaMatch ? horaMatch[1] : col[0].replace(/['"]/g, '').trim().substring(0,5);
                
                if (valorActual === null) {
                    valorActual = val; horaActual = hora;
                } else {
                    historial.push({ hora: hora, valor: val });
                }
            }
        }
    }
    return { valorActual, horaActual, historial };
}

function obtenerHoraFormateada() {
    const d = new Date(); d.setHours(d.getHours() - 3);
    let horas = d.getHours(); const ampm = horas >= 12 ? 'PM' : 'AM'; horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${d.getMinutes().toString().padStart(2, '0')} ${ampm}`;
}

async function procesarLaPlata(est) {
    let estData = { ...est, altura: null, tendencia: "—", fechaHora: null, historialAltura: [], vientoActual: null, vientoDireccion: null, fechaHoraViento: null, historialViento: [], ok: false };

    console.log("🌊 1. OBTENIENDO ALTURA (Archivo oculto)...");
    // Usamos la URL exacta y sin carpetas extra que funcionó en nuestras pruebas pasadas
    let csvMarea = await fetchURL("http://hidrografia.agpse.gob.ar:53880/histdat/LaPlata.dat");
    if (csvMarea) {
        let res = procesarCSVAltura(csvMarea);
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
            console.log(`   ✅ Altura capturada: ${estData.altura}m a las ${estData.fechaHora}`);
        } else {
            console.log("   ❌ El archivo de marea descargó, pero los datos no eran válidos.");
        }
    } else {
        console.log("   ❌ No se pudo descargar el archivo de marea.");
    }

    console.log("💨 2. OBTENIENDO VIENTO (Leyendo la pantalla)...");
    let htmlViento = await fetchURL("http://hidrografia.agpse.gob.ar:53880/LaPlata/viento.html");
    let htmlPrincipal = await fetchURL(est.url);
    
    // MAGIA: Unimos las páginas, extraemos números atrapados en "value='12.52'" y luego borramos los tags HTML.
    let textoTotal = ((htmlViento || "") + " " + (htmlPrincipal || ""))
        .replace(/<[^>]*value=['"]?([\d.]+)['"]?[^>]*>/gi, " $1 ") // Ganzúa para inputs
        .replace(/<[^>]*>/g, " ") // Borrar tags
        .replace(/\s+/g, " "); // Limpiar espacios extras

    // Buscamos literalmente la frase: Velocidad 12.52 Km/h
    let matchViento = textoTotal.match(/Velocidad\s*([\d.]+)\s*(Km\/h|Kmh)/i);
    if (matchViento) {
        estData.vientoActual = parseFloat(matchViento[1]);
        console.log(`   ✅ Viento capturado: ${estData.vientoActual} km/h`);
    }

    // Buscamos literalmente la frase: Direccion 70.0 Grados
    let matchDir = textoTotal.match(/Direccion\s*([\d.]+)\s*Grados/i);
    if (matchDir) {
        estData.vientoDireccion = matchDir[1] + "°";
        console.log(`   ✅ Dirección capturada: ${estData.vientoDireccion}`);
    }
    
    // Atrapamos la hora visible en la pantalla (ej. 22:50:00)
    let matchHoraViento = textoTotal.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
    if (matchHoraViento) {
        estData.fechaHoraViento = matchHoraViento[1].substring(0,5);
    }

    if (estData.altura !== null) estData.ok = true;
    return estData;
}

async function main() {
  const resultados = [await procesarLaPlata(ESTACIONES[0])];
  fs.writeFileSync('datos.json', JSON.stringify({ actualizadoEn: obtenerHoraFormateada(), estaciones: resultados }, null, 2));
  console.log("\n🏁 Proceso de La Plata finalizado con éxito.");
}

main();
