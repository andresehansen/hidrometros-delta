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
  const timeoutId = setTimeout(() => controller.abort(), 12000);
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
    let altura = null; 
    let tendencia = "ESTABLE"; 
    let fechaHora = null;

    // Limpiamos el texto para que sea más fácil de buscar
    const cleanHtml = html.replace(/\r?\n|\r/g, " ");

    // 1. Buscamos específicamente las palabras "Nivel" o "Altura" seguidas de un número
    const regexNivel = /(?:nivel|altura|cota|agua)[\s\S]{0,50}?([-]?\d{1,2}[.,]\d{2})/i;
    // 2. Buscamos un número que esté estrictamente acompañado de la letra "m" (metros)
    const regexMts = /([-]?\d{1,2}[.,]\d{2})\s*(?:m|mts|metros)/i;

    const patterns = [regexNivel, regexMts];

    for (let p of patterns) {
        let m = cleanHtml.match(p);
        if (m) {
            let val = parseFloat(m[1].replace(',', '.'));
            // Filtro Anti-Temperatura: Solo aceptamos valores lógicos de río (-2 a 12 metros)
            if (val > -2 && val < 12) { 
                altura = val; break; 
            }
        }
    }

    // Si las palabras clave fallan, buscamos cualquier número lógico en toda la página
    if (altura === null) {
        const todosLosNumeros = [...cleanHtml.matchAll(/([-]?\d{1,2}[.,]\d{2})/g)];
        for (let numMatch of todosLosNumeros) {
            let val = parseFloat(numMatch[1].replace(',', '.'));
            if (val > -2 && val < 12) {
                altura = val; break;
            }
        }
    }

    if (/subi[eo]ndo|↑|▲|up|subida/i.test(cleanHtml)) tendencia = "SUBIENDO";
    if (/bajando|descend|↓|▼|down|bajada/i.test(cleanHtml)) tendencia = "BAJANDO";
    if (/estable|igual|→|►/i.test(cleanHtml)) tendencia = "ESTABLE";
    
    const fechaMatch = cleanHtml.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})[^\d]*(\d{1,2}:\d{2})/);
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
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}/${d.getFullYear()}, ${horas}:${minutos} ${ampm}`;
}

async function procesarEstacion(est) {
    // Si la URL principal falla, el robot intentará automáticamente la versión moderna sin puerto
    let urlSecundaria = est.url.includes(':53880') 
        ? est.url.replace(':53880', '').replace('http:', 'https:') 
        : est.url.replace('https:', 'http:').replace('.ar/', '.ar:53880/');
        
    try {
        let html = await fetchURL(est.url);
        let datos = parsearHTML(html);
        
        if (datos.altura === null) {
            // Intento secundario si la página cargó pero estaba vacía
            let html2 = await fetchURL(urlSecundaria);
            let datos2 = parsearHTML(html2);
            if (datos2.altura !== null) return { ...est, ...datos2, ok: true };
        }
        return { ...est, ...datos, ok: datos.altura !== null };
    } catch(e) {
        try {
            // Intento secundario si la red bloqueó la URL primaria (Caso Zárate/Escobar)
            let html2 = await fetchURL(urlSecundaria);
            let datos2 = parsearHTML(html2);
            return { ...est, ...datos2, ok: datos2.altura !== null };
        } catch(e2) {
            return { ...est, altura: null, tendencia: "—", fechaHora: null, ok: false };
        }
    }
}

async function main() {
  const resultados = [];
  for (const est of ESTACIONES) {
    const dataEstacion = await procesarEstacion(est);
    resultados.push(dataEstacion);
    await new Promise(r => setTimeout(r, 800)); // Pausa para no saturar al servidor
  }

  const dataFinal = { actualizadoEn: obtenerHoraFormateada(), estaciones: resultados };
  fs.writeFileSync('datos.json', JSON.stringify(dataFinal, null, 2));
}

main();
