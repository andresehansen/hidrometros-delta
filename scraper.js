const fs = require('fs');

const ESTACIONES = [
  { nombre: "Zárate", url: "http://hidrografia.agpse.gob.ar:53880/zarate/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Las Rosas", url: "http://hidrografia.agpse.gob.ar:53880/LasRosas/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Escobar", url: "http://hidrografia.agpse.gob.ar:53880/escobar/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Braga", url: "http://hidrografia.agpse.gob.ar:53880/Braga/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Baliza Mitre", url: "http://hidrografia.agpse.gob.ar:53880/BalizaMitre/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Baradero", url: "http://hidrografia.agpse.gob.ar:53880/Baradero/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Ibicuy", url: "http://hidrografia2.agpse.gob.ar/Ibicuy/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Brazo Largo", url: "http://hidrografia.agpse.gob.ar:53880/BrazoLargo/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Desembocadura", url: "http://hidrografia.agpse.gob.ar:53880/Desembocadura/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Bs. As. 1° Espigón", url: "http://hidrografia2.agpse.gob.ar/buenosaires1erespigon/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Bs. As. Puerto Sur", url: "http://hidrografia.agpse.gob.ar:53880/buenosaires/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "La Plata", url: "http://hidrografia.agpse.gob.ar:53880/LaPlata/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Magdalena", url: "http://hidrografia2.agpse.gob.ar/Magdalena2/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "Oyarvide", url: "http://hidrografia.agpse.gob.ar:53880/oyarvide/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "San Clemente", url: "http://hidrografia.agpse.gob.ar:53880/SanClemente/index.html", zona: "Delta / Río de la Plata" },
  { nombre: "San Pedro", url: "http://hidrografia.agpse.gob.ar:53880/SanPedro/index.html", zona: "Confluencia – Océano" },
  { nombre: "Bifurcación", url: "http://hidrografia.agpse.gob.ar:53880/ehmail/bifurcacion2.htm", zona: "Confluencia – Océano" },
  { nombre: "Vuelta de Obligado", url: "http://hidrografia.agpse.gob.ar:53880/vueltaobligado/index.html", zona: "Confluencia – Océano" },
  { nombre: "Ramallo", url: "http://hidrografia2.agpse.gob.ar/Ramallo/index.html", zona: "Confluencia – Océano" },
  { nombre: "San Nicolás", url: "http://hidrografia2.agpse.gob.ar/SanNicolas/index.html", zona: "Confluencia – Océano" },
  { nombre: "Villa Constitución", url: "http://hidrografia2.agpse.gob.ar/VillaConstitucion/index.html", zona: "Confluencia – Océano" },
  { nombre: "Arroyo Seco", url: "http://hidrografia.agpse.gob.ar:53880/arroyoseco/index.html", zona: "Confluencia – Océano" },
  { nombre: "Rosario", url: "http://hidrografia2.agpse.gob.ar/Rosario/index.html", zona: "Confluencia – Océano" },
  { nombre: "San Lorenzo", url: "http://hidrografia2.agpse.gob.ar/SanLorenzo/index.html", zona: "Confluencia – Océano" },
  { nombre: "Timbúes", url: "http://hidrografia.agpse.gob.ar:53880/Timbues/index.html", zona: "Confluencia – Océano" },
  { nombre: "Diamante", url: "http://hidrografia.agpse.gob.ar:53880/Diamante/index.html", zona: "Confluencia – Océano" },
  { nombre: "Paraná", url: "http://hidrografia2.agpse.gob.ar/Parana/index.html", zona: "Confluencia – Océano" },
  { nombre: "Santa Fe", url: "http://hidrografia.agpse.gob.ar:53880/SantaFe/index.html", zona: "Confluencia – Océano" },
  { nombre: "Hernandarias", url: "http://hidrografia2.agpse.gob.ar/Hernandarias/index.html", zona: "Confluencia – Océano" },
  { nombre: "Santa Elena", url: "http://hidrografia.agpse.gob.ar:53880/SantaElena/index.html", zona: "Confluencia – Océano" },
  { nombre: "La Paz", url: "http://hidrografia2.agpse.gob.ar/LaPaz/index.html", zona: "Confluencia – Océano" },
  { nombre: "Esquina", url: "http://hidrografia.agpse.gob.ar:53880/Esquina/index.html", zona: "Confluencia – Océano" },
  { nombre: "Reconquista", url: "http://hidrografia2.agpse.gob.ar/Reconquista/index.html", zona: "Confluencia – Océano" },
  { nombre: "Goya", url: "http://hidrografia2.agpse.gob.ar/Goya/index.html", zona: "Confluencia – Océano" },
  { nombre: "Lavalle", url: "http://hidrografia2.agpse.gob.ar/lavalle/index.html", zona: "Confluencia – Océano" },
  { nombre: "Bella Vista", url: "http://hidrografia2.agpse.gob.ar/BellaVista/index.html", zona: "Confluencia – Océano" },
  { nombre: "Empedrado", url: "http://hidrografia2.agpse.gob.ar/Empedrado/index.html", zona: "Confluencia – Océano" },
  { nombre: "Barranqueras", url: "http://hidrografia2.agpse.gob.ar/Barranqueras/index.html", zona: "Confluencia – Océano" },
  { nombre: "Corrientes", url: "http://hidrografia2.agpse.gob.ar/Corrientes/index.html", zona: "Confluencia – Océano" },
  { nombre: "Paso de la Patria", url: "http://hidrografia2.agpse.gob.ar/PasodelaPatria/index.html", zona: "Confluencia – Océano" },
  { nombre: "Carabelitas", url: "http://hidrografia.agpse.gob.ar:53880/ehmail/Carabelitas2.htm", zona: "Brazo Bravo – Guazú" }
];

async function fetchURL(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function parsearHTML(html) {
    let altura = null; let tendencia = "ESTABLE"; let fechaHora = null;

    // 1. Convertimos todo a texto puro
    const textoPuro = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    // 2. Extraemos todos los números con formato X.XX
    const todosLosNumeros = [...textoPuro.matchAll(/([-]?\d{1,2}[.,]\d{2})/g)];
    
    for (let n of todosLosNumeros) {
        let index = n.index;
        // Revisamos el texto que está justo antes del número (el "contexto")
        let contextoPrevio = textoPuro.substring(Math.max(0, index - 45), index).toLowerCase();
        let contextoPosterior = textoPuro.substring(index, index + 20).toLowerCase();
        
        // FILTRO QUIRÚRGICO: Ignorar números trampa
        if (contextoPrevio.includes("cero") || 
            contextoPrevio.includes("bater") || 
            contextoPrevio.includes("temp") || 
            contextoPrevio.includes("predic") ||
            contextoPrevio.includes("escala") || 
            contextoPrevio.includes("referencia")) {
            continue; // Saltar al siguiente número
        }
        
        let val = parseFloat(n[1].replace(',', '.'));
        
        // Si el número es realista (-3 a 12 metros) y no fue filtrado, ES LA ALTURA.
        if (val > -3 && val < 12) {
            // Priorizamos si explícitamente dice "nivel" o "m"
            if (contextoPrevio.includes("nivel") || contextoPrevio.includes("altura") || contextoPosterior.includes("m")) {
                altura = val;
                break;
            } else if (altura === null) {
                // Lo guardamos por las dudas si no encontramos algo mejor
                altura = val; 
            }
        }
    }

    if (/subi[eo]ndo|↑|▲|up|subida|creci/i.test(textoPuro)) tendencia = "SUBIENDO";
    if (/bajando|descend|↓|▼|down|bajada|bajan/i.test(textoPuro)) tendencia = "BAJANDO";
    if (/estable|igual|→|►/i.test(textoPuro)) tendencia = "ESTABLE";
    
    let fechaMatch = textoPuro.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})[^\d]*(\d{1,2}:\d{2})/);
    if (fechaMatch) fechaHora = `${fechaMatch[1]} ${fechaMatch[2]}`;
    
    return { altura, tendencia, fechaHora };
}

function obtenerHoraFormateada() {
    const d = new Date();
    d.setHours(d.getHours() - 3);
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12; horas = horas ? horas : 12; 
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}, ${horas}:${minutos} ${ampm}`;
}

async function procesarEstacion(est) {
    // Generar enlaces alternativos por si el gobierno apagó el servidor principal
    let url2 = est.url.replace(':53880', '').replace('http:', 'https:');
    let url3 = url2.replace('hidrografia.agpse', 'hidrografia2.agpse'); // Muchas se mudaron a hidrografia2
    let urls = [est.url, url2, url3];

    for (let currentUrl of urls) {
        try {
            let html = await fetchURL(currentUrl);
            let datos = parsearHTML(html);
            if (datos.altura !== null) {
                return { ...est, ...datos, ok: true };
            }
        } catch(e) {
            // Falla silenciosa, intenta la siguiente URL de la lista
        }
    }
    // Si agotó las 3 direcciones y no encontró nada
    return { ...est, altura: null, tendencia: "—", fechaHora: null, ok: false };
}

async function main() {
  const resultados = [];
  for (const est of ESTACIONES) {
    const dataEstacion = await procesarEstacion(est);
    resultados.push(dataEstacion);
  }

  const dataFinal = { actualizadoEn: obtenerHoraFormateada(), estaciones: resultados };
  fs.writeFileSync('datos.json', JSON.stringify(dataFinal, null, 2));
}

main();
