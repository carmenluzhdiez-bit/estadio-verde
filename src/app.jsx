import { useState, useEffect, useRef } from "react";
import * as React from "react";

// ─── FIREBASE ────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set as fbSet } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgxVOk_OAh2XTouD9gLw5rycaNF-OWlnU",
  authDomain: "riego-estadio-espanol.firebaseapp.com",
  databaseURL: "https://riego-estadio-espanol-default-rtdb.firebaseio.com",
  projectId: "riego-estadio-espanol",
  storageBucket: "riego-estadio-espanol.firebasestorage.app",
  messagingSenderId: "972722300084",
  appId: "1:972722300084:web:0da9c37b416a050c3b63e1",
};

const fbApp = initializeApp(firebaseConfig, "estadio-verde");
const db    = getDatabase(fbApp);
const auth  = getAuth(fbApp);
const ROOT  = "estadio-verde-data";

// ─── ROLES POR EMAIL ─────────────────────────────────────────────────────────
const ROLES_EMAIL = {
  "carmenluzhdiez@gmail.com":    "jefa",
  "juberjuarez1234@gmail.com":   "supervisor",
  "astorga.guzman@gmail.com":    "trabajador",
  "bhalu.armijo@gmail.com":      "trabajador",
  "bandiiiixx@gmail.com":        "trabajador",
  "saulmolina@gmail.com":        "trabajador",
};

const getRolByEmail = (email) => ROLES_EMAIL[email?.toLowerCase()] || "trabajador";

// Hook genérico Firebase ↔ React state
// Sincroniza un nodo de Firebase con un estado local.
// defaultValue se usa solo si Firebase devuelve null.
function useFirebaseState(path, defaultValue) {
  const fullPath = `${ROOT}/${path}`;
  const [value, setValueLocal] = useState(defaultValue);
  const [ready,  setReady]     = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    const r = ref(db, fullPath);
    const unsub = onValue(r, (snap) => {
      if (skipRef.current) { skipRef.current = false; return; }
      const v = snap.val();
      setValueLocal(v !== null && v !== undefined ? v : defaultValue);
      setReady(true);
    });
    return () => unsub();
  }, [fullPath]);

  const setValue = (newVal) => {
    const resolved = typeof newVal === "function" ? newVal(value) : newVal;
    setValueLocal(resolved); // actualiza local inmediatamente
    skipRef.current = true;
    fbSet(ref(db, fullPath), resolved).catch(() => { skipRef.current = false; });
  };

  return [value, setValue, ready];
}

// ─── CATEGORÍAS DE ELEMENTOS ────────────────────────────────────────────────
const CATEGORIAS_ELEM = {
  arboles:         { label: "Árboles",             color: "#15803d", icon: "🌳", parent: "vegetacion" },
  arbustos:        { label: "Arbustos",             color: "#22c55e", icon: "🌿", parent: "vegetacion" },
  cesped:          { label: "Césped",               color: "#4ade80", icon: "🟩", parent: "vegetacion" },
  herbaceas:       { label: "Herbáceas",            color: "#86efac", icon: "🌸", parent: "vegetacion" },
  trepadoras:      { label: "Trepadoras",           color: "#2dd4bf", icon: "🪴", parent: "vegetacion" },
  rastreras:       { label: "Rastreras",            color: "#6ee7b7", icon: "🍃", parent: "vegetacion" },
  jardineras:      { label: "Jardineras",           color: "#f472b6", icon: "🪻", parent: "vegetacion" },
  macetas_piso:    { label: "Macetas a piso",       color: "#e879f9", icon: "🌷", parent: "vegetacion" },
  colgantes:       { label: "Colgantes",            color: "#c084fc", icon: "🌺", parent: "vegetacion" },
  infraestructura: { label: "Infraestructura",      color: "#f59e0b", icon: "🏗️" },
  sistemas:        { label: "Sistemas",             color: "#3b82f6", icon: "⚙️" },
  pavimentos:      { label: "Pavimentos y Suelos",  color: "#a78bfa", icon: "🪨" },
  mobiliario:      { label: "Mobiliario Urbano",    color: "#fb923c", icon: "🪑" },
  bodegas:         { label: "Bodegas",               color: "#94a3b8", icon: "🏚️" },
};
const VEGETACION_SUBS = ["arboles","arbustos","cesped","herbaceas","trepadoras","rastreras","jardineras","macetas_piso","colgantes"];
const OTRAS_CATS      = ["infraestructura","sistemas","pavimentos","mobiliario","bodegas"];
// ─── ESTACIONES ──────────────────────────────────────────────────────────────
const ESTACIONES = {
  verano:    { label:"Verano",    icon:"☀️",  color:"#f59e0b", meses:"Dic–Feb" },
  otono:     { label:"Otoño",     icon:"🍂",  color:"#f97316", meses:"Mar–May" },
  invierno:  { label:"Invierno",  icon:"❄️",  color:"#60a5fa", meses:"Jun–Ago" },
  primavera: { label:"Primavera", icon:"🌸",  color:"#4ade80", meses:"Sep–Nov" },
};

// ─── FRECUENCIAS DISPONIBLES ─────────────────────────────────────────────────
const FRECUENCIAS = [
  { value:"diario",      label:"Diario",             dias:1   },
  { value:"cada2dias",   label:"Cada 2 días",         dias:2   },
  { value:"cada3dias",   label:"Cada 3 días",         dias:3   },
  { value:"cada5dias",   label:"Cada 5 días",         dias:5   },
  { value:"semanal",     label:"Semanal",             dias:7   },
  { value:"quincenal",   label:"Quincenal",           dias:15  },
  { value:"mensual",     label:"Mensual",             dias:30  },
  { value:"bimestral",   label:"Bimestral",           dias:60  },
  { value:"trimestral",  label:"Trimestral",          dias:90  },
  { value:"semestral",   label:"Semestral",           dias:180 },
  { value:"anual",       label:"Anual",               dias:365 },
  { value:"unavez",      label:"Una sola vez",        dias:null },
  { value:"segunecesidad", label:"Según necesidad",   dias:null },
  { value:"noaplica",    label:"No aplica",           dias:0   },
];

// ─── TAREAS PREDEFINIDAS POR SUBCATEGORÍA ────────────────────────────────────
// Cada tarea: { tarea, verano, otono, invierno, primavera }
const TAREAS_DEFAULT = {
  arboles: [
    { tarea:"Riego",               verano:"semanal",   otono:"quincenal",  invierno:"noaplica", primavera:"semanal"   },
    { tarea:"Poda de limpieza",    verano:"mensual",   otono:"mensual",    invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Poda de formación",   verano:"noaplica",  otono:"noaplica",   invierno:"mensual",  primavera:"noaplica"  },
    { tarea:"Fertilización",       verano:"mensual",   otono:"noaplica",   invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Control de plagas",   verano:"mensual",   otono:"mensual",    invierno:"noaplica", primavera:"mensual"   },
  ],
  arbustos: [
    { tarea:"Riego",               verano:"cada3dias", otono:"semanal",    invierno:"quincenal",primavera:"cada5dias" },
    { tarea:"Poda de limpieza",    verano:"semanal",   otono:"quincenal",  invierno:"noaplica", primavera:"semanal"   },
    { tarea:"Poda de formación",   verano:"noaplica",  otono:"noaplica",   invierno:"semanal",  primavera:"noaplica"  },
    { tarea:"Fertilización",       verano:"mensual",   otono:"noaplica",   invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Control de plagas",   verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
  ],
  cesped: [
    { tarea:"Riego",               verano:"cada2dias", otono:"cada5dias",  invierno:"noaplica", primavera:"cada3dias" },
    { tarea:"Corte",               verano:"semanal",   otono:"quincenal",  invierno:"mensual",  primavera:"semanal"   },
    { tarea:"Fertilización",       verano:"mensual",   otono:"bimestral",  invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Aireado / escarificado",verano:"noaplica",otono:"mensual",    invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Control de malezas",  verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
  ],
  herbaceas: [
    { tarea:"Riego",               verano:"cada2dias", otono:"cada3dias",  invierno:"semanal",  primavera:"cada3dias" },
    { tarea:"Deadheading (flores marchitas)", verano:"semanal", otono:"semanal", invierno:"noaplica", primavera:"semanal" },
    { tarea:"Fertilización",       verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Control de plagas",   verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
  ],
  trepadoras: [
    { tarea:"Riego",               verano:"cada3dias", otono:"semanal",    invierno:"quincenal",primavera:"cada5dias" },
    { tarea:"Poda de limpieza",    verano:"mensual",   otono:"mensual",    invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Poda de formación",   verano:"noaplica",  otono:"noaplica",   invierno:"mensual",  primavera:"noaplica"  },
    { tarea:"Guiado / tutoraje",   verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Fertilización",       verano:"mensual",   otono:"noaplica",   invierno:"noaplica", primavera:"mensual"   },
  ],
  rastreras: [
    { tarea:"Riego",               verano:"cada3dias", otono:"semanal",    invierno:"quincenal",primavera:"cada5dias" },
    { tarea:"Poda de contención",  verano:"mensual",   otono:"mensual",    invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Fertilización",       verano:"mensual",   otono:"noaplica",   invierno:"noaplica", primavera:"mensual"   },
    { tarea:"Control de malezas",  verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
  ],
  jardineras: [
    { tarea:"Riego",               verano:"cada2dias", otono:"cada3dias",  invierno:"semanal",  primavera:"cada3dias" },
    { tarea:"Poda / recorte",      verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Fertilización",       verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Cambio de sustrato",  verano:"noaplica",  otono:"noaplica",   invierno:"mensual",  primavera:"noaplica"  },
    { tarea:"Limpieza recipiente", verano:"mensual",   otono:"mensual",    invierno:"mensual",  primavera:"mensual"   },
  ],
  macetas_piso: [
    { tarea:"Riego",               verano:"cada2dias", otono:"cada3dias",  invierno:"semanal",  primavera:"cada3dias" },
    { tarea:"Poda / recorte",      verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Fertilización",       verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Cambio de sustrato",  verano:"noaplica",  otono:"noaplica",   invierno:"mensual",  primavera:"noaplica"  },
    { tarea:"Limpieza recipiente", verano:"mensual",   otono:"mensual",    invierno:"mensual",  primavera:"mensual"   },
  ],
  colgantes: [
    { tarea:"Riego",               verano:"diario",    otono:"cada3dias",  invierno:"semanal",  primavera:"cada2dias" },
    { tarea:"Poda / recorte",      verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Fertilización",       verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Cambio de sustrato",  verano:"noaplica",  otono:"noaplica",   invierno:"mensual",  primavera:"noaplica"  },
    { tarea:"Limpieza recipiente", verano:"mensual",   otono:"mensual",    invierno:"mensual",  primavera:"mensual"   },
  ],
  // Subcategorías especiales de arbustos — mismas frecuencias base pero con podas diferenciadas
  rosales: [
    { tarea:"Riego",               verano:"cada3dias", otono:"semanal",    invierno:"quincenal",primavera:"cada5dias" },
    { tarea:"Poda de limpieza",    verano:"semanal",   otono:"quincenal",  invierno:"noaplica", primavera:"semanal"   },
    { tarea:"Poda de formación",   verano:"noaplica",  otono:"noaplica",   invierno:"semanal",  primavera:"noaplica"  },
    { tarea:"Poda de mantenimiento (floración)", verano:"semanal", otono:"semanal", invierno:"noaplica", primavera:"semanal" },
    { tarea:"Fertilización",       verano:"quincenal", otono:"noaplica",   invierno:"noaplica", primavera:"quincenal" },
    { tarea:"Control de hongos",   verano:"quincenal", otono:"mensual",    invierno:"noaplica", primavera:"quincenal" },
  ],
};

// ─── ESTADOS DE ELEMENTO ─────────────────────────────────────────────────────
const ESTADOS_ELEM = {
  bueno: { label: "Bueno", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  regular: { label: "Regular", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  critico: { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  mantenimiento: { label: "En Mantenimiento", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

// ─── DATOS DE MACROZONAS CON ELEMENTOS PROPUESTOS ────────────────────────────
const MACROZONAS_BASE = [
  {
    id: 1, nombre: "Calle Nevería", categoria: "Calles y Accesos", icono: "🌿",
    elementos: [
      { id: "e1", nombre: "Árboles de alineación", tipo: "arboles" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e5", nombre: "Pavimento asfalto/adoquín", tipo: "pavimentos" },
      { id: "e6", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 2, nombre: "Calle del Inca", categoria: "Calles y Accesos", icono: "🌿",
    elementos: [
      { id: "e1", nombre: "Árboles de alineación", tipo: "arboles" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e5", nombre: "Pavimento asfalto/adoquín", tipo: "pavimentos" },
      { id: "e6", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 3, nombre: "Rotonda del Emigrante", categoria: "Plazas y Rotondas", icono: "🌀",
    elementos: [
      { id: "e1", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e2", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e3", nombre: "Árbol central / escultura vegetal", tipo: "arboles" },
      { id: "e4", nombre: "Setos perimetrales", tipo: "arbustos" },
      { id: "e5", nombre: "Maicillo / grava decorativa", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias decorativas", tipo: "infraestructura" },
      { id: "e7", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e8", nombre: "Señalética", tipo: "mobiliario" },
    ]
  },
  {
    id: 4, nombre: "Salones", categoria: "Edificios", icono: "🏛️",
    elementos: [
      { id: "e1", nombre: "Maceteros exteriores", tipo: "macetas_piso" },
      { id: "e2", nombre: "Plantas de interior/accesos", tipo: "herbaceas" },
      { id: "e3", nombre: "Césped perimetral", tipo: "cesped" },
      { id: "e4", nombre: "Arbustos borde edificio", tipo: "arbustos" },
      { id: "e5", nombre: "Pavimento accesos", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e7", nombre: "Drenaje perimetral", tipo: "sistemas" },
    ]
  },
  {
    id: 5, nombre: "Plaza Manuel de Falla", categoria: "Plazas y Rotondas", icono: "🎭",
    elementos: [
      { id: "e1", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e2", nombre: "Setos", tipo: "arbustos" },
      { id: "e3", nombre: "Césped", tipo: "cesped" },
      { id: "e4", nombre: "Árboles", tipo: "arboles" },
      { id: "e5", nombre: "Arbustos", tipo: "arbustos" },
      { id: "e6", nombre: "Maicillo", tipo: "pavimentos" },
      { id: "e7", nombre: "Maceteros", tipo: "macetas_piso" },
      { id: "e8", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e9", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e10", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e11", nombre: "Pavimento / adoquines", tipo: "pavimentos" },
    ]
  },
  {
    id: 6, nombre: "Capilla", categoria: "Edificios", icono: "⛪",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Maceteros y floreros", tipo: "macetas_piso" },
      { id: "e5", nombre: "Pavimento acceso", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias", tipo: "infraestructura" },
    ]
  },
  {
    id: 7, nombre: "Patio Andaluz", categoria: "Patios y Jardines", icono: "🌺",
    elementos: [
      { id: "e1", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e2", nombre: "Plantas trepadoras / enredaderas", tipo: "herbaceas" },
      { id: "e3", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e4", nombre: "Maceteros de cerámica", tipo: "macetas_piso" },
      { id: "e5", nombre: "Césped / tapizante", tipo: "cesped" },
      { id: "e6", nombre: "Fuente / estanque", tipo: "infraestructura" },
      { id: "e7", nombre: "Pavimento cerámico / ladrillo", tipo: "pavimentos" },
      { id: "e8", nombre: "Luminarias decorativas", tipo: "infraestructura" },
      { id: "e9", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e10", nombre: "Bancas y mobiliario", tipo: "mobiliario" },
    ]
  },
  {
    id: 8, nombre: "Palitroque", categoria: "Deportivo", icono: "🎯",
    elementos: [
      { id: "e1", nombre: "Césped perimetral", tipo: "cesped" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Superficie de juego (tierra/maicillo)", tipo: "pavimentos" },
      { id: "e4", nombre: "Luminarias cancha", tipo: "infraestructura" },
      { id: "e5", nombre: "Cercado perimetral", tipo: "infraestructura" },
      { id: "e6", nombre: "Bancas espectadores", tipo: "mobiliario" },
    ]
  },
  {
    id: 9, nombre: "Cruzeiro", categoria: "Deportivo", icono: "⚽",
    elementos: [
      { id: "e1", nombre: "Césped natural / sintético", tipo: "cesped" },
      { id: "e2", nombre: "Arbustos perimetrales", tipo: "arbustos" },
      { id: "e3", nombre: "Luminarias cancha", tipo: "infraestructura" },
      { id: "e4", nombre: "Cercado / malla", tipo: "infraestructura" },
      { id: "e5", nombre: "Arcos de fútbol", tipo: "infraestructura" },
      { id: "e6", nombre: "Sistema de drenaje", tipo: "sistemas" },
      { id: "e7", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e8", nombre: "Bancas y graderías", tipo: "mobiliario" },
    ]
  },
  {
    id: 10, nombre: "Pérgola el Cid", categoria: "Patios y Jardines", icono: "🌸",
    elementos: [
      { id: "e1", nombre: "Plantas trepadoras / glicinas", tipo: "herbaceas" },
      { id: "e2", nombre: "Macizos florales bajo pérgola", tipo: "herbaceas" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Estructura de pérgola (madera/metal)", tipo: "infraestructura" },
      { id: "e5", nombre: "Pavimento pérgola", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias decorativas", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas y mesas", tipo: "mobiliario" },
      { id: "e8", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 11, nombre: "Terraza Quijote", categoria: "Patios y Jardines", icono: "🌄",
    elementos: [
      { id: "e1", nombre: "Maceteros grandes", tipo: "macetas_piso" },
      { id: "e2", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e3", nombre: "Plantas rastreras / tapizantes", tipo: "cesped" },
      { id: "e4", nombre: "Pavimento terraza", tipo: "pavimentos" },
      { id: "e5", nombre: "Barandas / pasamanos", tipo: "infraestructura" },
      { id: "e6", nombre: "Luminarias exterior", tipo: "infraestructura" },
      { id: "e7", nombre: "Mobiliario terraza", tipo: "mobiliario" },
      { id: "e8", nombre: "Sistema drenaje", tipo: "sistemas" },
    ]
  },
  {
    id: 12, nombre: "Tenis Edificio", categoria: "Deportivo", icono: "🎾",
    elementos: [
      { id: "e1", nombre: "Jardines perimetrales", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e4", nombre: "Pavimento accesos", tipo: "pavimentos" },
      { id: "e5", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e6", nombre: "Drenaje perimetral", tipo: "sistemas" },
    ]
  },
  {
    id: 13, nombre: "Tenis Canchas", categoria: "Deportivo", icono: "🎾",
    elementos: [
      { id: "e1", nombre: "Superficie de canchas", tipo: "pavimentos" },
      { id: "e2", nombre: "Arbustos borde canchas", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles cortaviento", tipo: "arboles" },
      { id: "e4", nombre: "Luminarias canchas", tipo: "infraestructura" },
      { id: "e5", nombre: "Malla perimetral", tipo: "infraestructura" },
      { id: "e6", nombre: "Red de tenis", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas jugadores", tipo: "mobiliario" },
      { id: "e8", nombre: "Drenaje canchas", tipo: "sistemas" },
    ]
  },
  {
    id: 14, nombre: "Casa Taller", categoria: "Edificios", icono: "🔧",
    elementos: [
      { id: "e1", nombre: "Césped perimetral", tipo: "cesped" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Pavimento patio taller", tipo: "pavimentos" },
      { id: "e5", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e6", nombre: "Punto agua exterior", tipo: "sistemas" },
    ]
  },
  {
    id: 15, nombre: "Pádel", categoria: "Deportivo", icono: "🏓",
    elementos: [
      { id: "e1", nombre: "Superficie canchas pádel", tipo: "pavimentos" },
      { id: "e2", nombre: "Arbustos perimetrales", tipo: "arbustos" },
      { id: "e3", nombre: "Césped decorativo exterior", tipo: "cesped" },
      { id: "e4", nombre: "Estructura cristal/malla", tipo: "infraestructura" },
      { id: "e5", nombre: "Luminarias LED canchas", tipo: "infraestructura" },
      { id: "e6", nombre: "Bancas jugadores", tipo: "mobiliario" },
      { id: "e7", nombre: "Drenaje", tipo: "sistemas" },
    ]
  },
  {
    id: 16, nombre: "Polideportivo", categoria: "Deportivo", icono: "🏟️",
    elementos: [
      { id: "e1", nombre: "Jardines perimetrales", tipo: "arbustos" },
      { id: "e2", nombre: "Árboles borde edificio", tipo: "arboles" },
      { id: "e3", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e4", nombre: "Pavimento accesos y plazoletas", tipo: "pavimentos" },
      { id: "e5", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e6", nombre: "Drenaje pluvial", tipo: "sistemas" },
      { id: "e7", nombre: "Señalética exterior", tipo: "mobiliario" },
    ]
  },
  {
    id: 17, nombre: "Gimnasio", categoria: "Deportivo", icono: "💪",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e3", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e4", nombre: "Pavimento exterior", tipo: "pavimentos" },
      { id: "e5", nombre: "Luminarias acceso", tipo: "infraestructura" },
    ]
  },
  {
    id: 18, nombre: "Plaza Colón", categoria: "Plazas y Rotondas", icono: "🗺️",
    elementos: [
      { id: "e1", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e2", nombre: "Setos ornamentales", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles plaza", tipo: "arboles" },
      { id: "e4", nombre: "Arbustos", tipo: "arbustos" },
      { id: "e5", nombre: "Césped", tipo: "cesped" },
      { id: "e6", nombre: "Maicillo / grava", tipo: "pavimentos" },
      { id: "e7", nombre: "Pavimento adoquín / baldosa", tipo: "pavimentos" },
      { id: "e8", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e9", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e10", nombre: "Monumento / escultura", tipo: "infraestructura" },
      { id: "e11", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 19, nombre: "Piscina Exterior", categoria: "Acuático", icono: "🏊",
    elementos: [
      { id: "e1", nombre: "Césped áreas de descanso", tipo: "cesped" },
      { id: "e2", nombre: "Arbustos pantalla/borde", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles sombra", tipo: "arboles" },
      { id: "e4", nombre: "Maceteros decorativos", tipo: "macetas_piso" },
      { id: "e5", nombre: "Pavimento no deslizante borde", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias piscina y entorno", tipo: "infraestructura" },
      { id: "e7", nombre: "Sistema depuración agua", tipo: "sistemas" },
      { id: "e8", nombre: "Sistema drenaje", tipo: "sistemas" },
      { id: "e9", nombre: "Duchas exteriores", tipo: "infraestructura" },
      { id: "e10", nombre: "Reposeras / tumbonas", tipo: "mobiliario" },
      { id: "e11", nombre: "Sombrillas / parasoles", tipo: "mobiliario" },
    ]
  },
  {
    id: 20, nombre: "Kiosko", categoria: "Edificios", icono: "☕",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Maceteros decorativos", tipo: "macetas_piso" },
      { id: "e3", nombre: "Pérgola / toldo", tipo: "infraestructura" },
      { id: "e4", nombre: "Pavimento exterior", tipo: "pavimentos" },
      { id: "e5", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e6", nombre: "Mesas y sillas exteriores", tipo: "mobiliario" },
    ]
  },
  {
    id: 21, nombre: "Piscina Temperada", categoria: "Acuático", icono: "🌊",
    elementos: [
      { id: "e1", nombre: "Jardines interiores / maceteros", tipo: "macetas_piso" },
      { id: "e2", nombre: "Plantas ornamentales borde", tipo: "herbaceas" },
      { id: "e3", nombre: "Pavimento no deslizante", tipo: "pavimentos" },
      { id: "e4", nombre: "Sistema calefacción agua", tipo: "sistemas" },
      { id: "e5", nombre: "Sistema depuración", tipo: "sistemas" },
      { id: "e6", nombre: "Luminarias interiores y borde", tipo: "infraestructura" },
      { id: "e7", nombre: "Duchas interiores", tipo: "infraestructura" },
      { id: "e8", nombre: "Reposeras interiores", tipo: "mobiliario" },
    ]
  },
  {
    id: 22, nombre: "Plaza los Conquistadores", categoria: "Plazas y Rotondas", icono: "⚔️",
    elementos: [
      { id: "e1", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e2", nombre: "Setos", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e5", nombre: "Césped", tipo: "cesped" },
      { id: "e6", nombre: "Maicillo", tipo: "pavimentos" },
      { id: "e7", nombre: "Pavimento / adoquín", tipo: "pavimentos" },
      { id: "e8", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e9", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e10", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 23, nombre: "Alameda Norte", categoria: "Alamedas", icono: "🌳",
    elementos: [
      { id: "e1", nombre: "Árboles de alineación", tipo: "arboles" },
      { id: "e2", nombre: "Setos / borduras", tipo: "arbustos" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e5", nombre: "Camino peatonal", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias alameda", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e8", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e9", nombre: "Papeleros", tipo: "mobiliario" },
    ]
  },
  {
    id: 24, nombre: "Alameda Central", categoria: "Alamedas", icono: "🌳",
    elementos: [
      { id: "e1", nombre: "Árboles de alineación", tipo: "arboles" },
      { id: "e2", nombre: "Setos / borduras", tipo: "arbustos" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e5", nombre: "Camino peatonal", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias alameda", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e8", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e9", nombre: "Papeleros", tipo: "mobiliario" },
    ]
  },
  {
    id: 25, nombre: "Alameda Sur", categoria: "Alamedas", icono: "🌳",
    elementos: [
      { id: "e1", nombre: "Árboles de alineación", tipo: "arboles" },
      { id: "e2", nombre: "Setos / borduras", tipo: "arbustos" },
      { id: "e3", nombre: "Césped lateral", tipo: "cesped" },
      { id: "e4", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e5", nombre: "Camino peatonal", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias alameda", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e8", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e9", nombre: "Papeleros", tipo: "mobiliario" },
    ]
  },
  {
    id: 26, nombre: "Juegos Infantiles", categoria: "Infantil", icono: "🎠",
    elementos: [
      { id: "e1", nombre: "Césped área de juegos", tipo: "cesped" },
      { id: "e2", nombre: "Arbustos perimetrales", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles sombra", tipo: "arboles" },
      { id: "e4", nombre: "Superficie amortiguadora (caucho/arena)", tipo: "pavimentos" },
      { id: "e5", nombre: "Juegos columpios", tipo: "infraestructura" },
      { id: "e6", nombre: "Toboganes", tipo: "infraestructura" },
      { id: "e7", nombre: "Trepadoras / estructuras juego", tipo: "infraestructura" },
      { id: "e8", nombre: "Cercado perimetral", tipo: "infraestructura" },
      { id: "e9", nombre: "Bancas padres / tutores", tipo: "mobiliario" },
      { id: "e10", nombre: "Luminarias", tipo: "infraestructura" },
    ]
  },
  {
    id: 27, nombre: "Patinaje", categoria: "Deportivo", icono: "⛸️",
    elementos: [
      { id: "e1", nombre: "Superficie pista patinaje", tipo: "pavimentos" },
      { id: "e2", nombre: "Jardines perimetrales", tipo: "arbustos" },
      { id: "e3", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e4", nombre: "Borde / bordillo pista", tipo: "infraestructura" },
      { id: "e5", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e6", nombre: "Bancas", tipo: "mobiliario" },
    ]
  },
  {
    id: 28, nombre: "Torre 01", categoria: "Torres", icono: "🏢",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos borde edificio", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e5", nombre: "Pavimento accesos", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e7", nombre: "Sistema drenaje", tipo: "sistemas" },
    ]
  },
  {
    id: 29, nombre: "Torre 02", categoria: "Torres", icono: "🏢",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos borde edificio", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e5", nombre: "Pavimento accesos", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e7", nombre: "Sistema drenaje", tipo: "sistemas" },
    ]
  },
  {
    id: 30, nombre: "Torre 03", categoria: "Torres", icono: "🏢",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos borde edificio", tipo: "arbustos" },
      { id: "e3", nombre: "Árboles", tipo: "arboles" },
      { id: "e4", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e5", nombre: "Pavimento accesos", tipo: "pavimentos" },
      { id: "e6", nombre: "Luminarias exteriores", tipo: "infraestructura" },
      { id: "e7", nombre: "Sistema drenaje", tipo: "sistemas" },
    ]
  },
  {
    id: 31, nombre: "Golf", categoria: "Deportivo", icono: "⛳",
    elementos: [
      { id: "e1", nombre: "Fairway (calle de golf)", tipo: "cesped" },
      { id: "e2", nombre: "Green / putting green", tipo: "cesped" },
      { id: "e3", nombre: "Rough (zona alta)", tipo: "cesped" },
      { id: "e4", nombre: "Bunkers (arena)", tipo: "pavimentos" },
      { id: "e5", nombre: "Árboles y arboledas", tipo: "arboles" },
      { id: "e6", nombre: "Arbustos decorativos", tipo: "arbustos" },
      { id: "e7", nombre: "Banderines y hoyos", tipo: "infraestructura" },
      { id: "e8", nombre: "Sistema de riego", tipo: "sistemas" },
      { id: "e9", nombre: "Caminos carros golf", tipo: "pavimentos" },
      { id: "e10", nombre: "Luminarias perimetrales", tipo: "infraestructura" },
    ]
  },
  {
    id: 32, nombre: "Rincón Riojano", categoria: "Patios y Jardines", icono: "🍇",
    elementos: [
      { id: "e1", nombre: "Parras / vid ornamental", tipo: "trepadoras" },
      { id: "e2", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e3", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e4", nombre: "Césped", tipo: "cesped" },
      { id: "e5", nombre: "Pérgola / emparrado", tipo: "infraestructura" },
      { id: "e6", nombre: "Pavimento piedra / ladrillo", tipo: "pavimentos" },
      { id: "e7", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e8", nombre: "Bancas y mesas", tipo: "mobiliario" },
      { id: "e9", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 33, nombre: "Jardín Infantil", categoria: "Infantil", icono: "🌼",
    elementos: [
      { id: "e1", nombre: "Césped área de juego", tipo: "cesped" },
      { id: "e2", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e3", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e4", nombre: "Árboles sombra", tipo: "arboles" },
      { id: "e5", nombre: "Maceteros decorativos", tipo: "macetas_piso" },
      { id: "e6", nombre: "Pavimento seguro exterior", tipo: "pavimentos" },
      { id: "e7", nombre: "Cercado perimetral", tipo: "infraestructura" },
      { id: "e8", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e9", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 34, nombre: "Sala Cuna", categoria: "Infantil", icono: "🍼",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e3", nombre: "Maceteros acceso", tipo: "macetas_piso" },
      { id: "e4", nombre: "Pavimento acceso", tipo: "pavimentos" },
      { id: "e5", nombre: "Cercado seguridad", tipo: "infraestructura" },
      { id: "e6", nombre: "Luminarias exteriores", tipo: "infraestructura" },
    ]
  },
  {
    id: 35, nombre: "Boleras Asturianas", categoria: "Deportivo", icono: "🎳",
    elementos: [
      { id: "e1", nombre: "Pista de juego (tierra/arena)", tipo: "pavimentos" },
      { id: "e2", nombre: "Césped perimetral", tipo: "cesped" },
      { id: "e3", nombre: "Arbustos borde", tipo: "arbustos" },
      { id: "e4", nombre: "Árboles sombra", tipo: "arboles" },
      { id: "e5", nombre: "Estructuras de juego / boleras", tipo: "infraestructura" },
      { id: "e6", nombre: "Cercado / borde pista", tipo: "infraestructura" },
      { id: "e7", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e8", nombre: "Luminarias", tipo: "infraestructura" },
    ]
  },
  {
    id: 36, nombre: "Hórreo Andaluz", categoria: "Patios y Jardines", icono: "🌾",
    elementos: [
      { id: "e1", nombre: "Jardín perimetral", tipo: "arbustos" },
      { id: "e2", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e3", nombre: "Arbustos ornamentales", tipo: "arbustos" },
      { id: "e4", nombre: "Césped", tipo: "cesped" },
      { id: "e5", nombre: "Estructura hórreo (madera)", tipo: "infraestructura" },
      { id: "e6", nombre: "Pavimento entorno", tipo: "pavimentos" },
      { id: "e7", nombre: "Luminarias decorativas", tipo: "infraestructura" },
    ]
  },
  {
    id: 37, nombre: "Plaza Murcia", categoria: "Plazas y Rotondas", icono: "🌹",
    elementos: [
      { id: "e1", nombre: "Rosales / macizos de rosas", tipo: "arbustos" },
      { id: "e2", nombre: "Macizos florales", tipo: "herbaceas" },
      { id: "e3", nombre: "Setos ornamentales", tipo: "arbustos" },
      { id: "e4", nombre: "Árboles plaza", tipo: "arboles" },
      { id: "e5", nombre: "Arbustos", tipo: "arbustos" },
      { id: "e6", nombre: "Césped", tipo: "cesped" },
      { id: "e7", nombre: "Maicillo", tipo: "pavimentos" },
      { id: "e8", nombre: "Pavimento / adoquín", tipo: "pavimentos" },
      { id: "e9", nombre: "Bancas", tipo: "mobiliario" },
      { id: "e10", nombre: "Luminarias", tipo: "infraestructura" },
      { id: "e11", nombre: "Sistema de riego", tipo: "sistemas" },
    ]
  },
  {
    id: 38, nombre: "Cancha de Fútbol Sintética", categoria: "Deportivo", icono: "🥅",
    elementos: [
      { id: "e1", nombre: "Césped sintético", tipo: "cesped" },
      { id: "e2", nombre: "Relleno de caucho / arena", tipo: "pavimentos" },
      { id: "e3", nombre: "Jardines perimetrales", tipo: "arbustos" },
      { id: "e4", nombre: "Luminarias LED cancha", tipo: "infraestructura" },
      { id: "e5", nombre: "Malla perimetral", tipo: "infraestructura" },
      { id: "e6", nombre: "Arcos de fútbol", tipo: "infraestructura" },
      { id: "e7", nombre: "Marcación cancha", tipo: "infraestructura" },
      { id: "e8", nombre: "Drenaje sub-base", tipo: "sistemas" },
      { id: "e9", nombre: "Bancas jugadores", tipo: "mobiliario" },
    ]
  },
];

const CATEGORIAS_ZONA = [...new Set(MACROZONAS_BASE.map(z => z.categoria))];

const ESTADOS_ZONA = {
  bueno: { label: "Bueno", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  regular: { label: "Regular", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  critico: { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  mantenimiento: { label: "En Mantenimiento", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
};

const TAREAS_PRESET = [
  "Corte de césped", "Riego", "Poda arbustos", "Poda árboles", "Limpieza general",
  "Fertilización", "Control de plagas", "Reparación de caminos", "Replante", "Inspección",
  "Pintura / retoque", "Revisión sistema riego", "Limpieza luminarias", "Reparación mobiliario",
];

const initData = () => {
  // Build default data structure (usado solo si Firebase devuelve null)
  const d = {};
  MACROZONAS_BASE.forEach(z => {
    const elementos = {};
    z.elementos.forEach(e => {
      const defaultTareas = TAREAS_DEFAULT[e.tipo] ? TAREAS_DEFAULT[e.tipo].map(t=>({...t, id:e.id+"_"+t.tarea})) : [];
      elementos[e.id] = { estado: "bueno", notas: "", frecuencias: defaultTareas };
    });
    d[z.id] = {
      estadoGeneral: "bueno",
      ultimoMant: "", proximoMant: "", notas: "",
      elementos,
      // custom elements added by user
      elementosCustom: [],
      tareas: [],
      historial: [],
    };
  });
  return d;
};

// ─── SELECTOR DE RESPONSABLE ─────────────────────────────────────────────────
function ResponsableSelector({ value, personal, onChange, S, fontSize=14, inline=false }) {
  const [modo, setModo] = React.useState("lista"); // "lista" | "custom"
  const [customVal, setCustomVal] = React.useState("");

  // Si el valor actual no está en la lista, mostrar modo custom
  React.useEffect(() => {
    if (value && !personal.find(p=>p.nombre===value)) {
      setModo("custom");
      setCustomVal(value);
    }
  }, []);

  const listaOrdenada = [...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  if (inline) {
    // Versión compacta para las tarjetas de tarea
    return (
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        {modo==="lista" ? (
          <>
            <select
              value={value||""}
              onChange={e=>{
                if(e.target.value==="__custom__"){setModo("custom");setCustomVal("");}
                else onChange(e.target.value);
              }}
              style={{background:"transparent",border:"none",borderBottom:"1px dashed rgba(255,255,255,0.2)",color:value?"#c0e0c0":"#7a9a8a",padding:"2px 4px",fontFamily:"'Georgia',serif",fontSize:13,outline:"none",maxWidth:200,cursor:"pointer"}}
            >
              <option value="">⬜ Por designar...</option>
              {listaOrdenada.map(p=><option key={p.id} value={p.nombre}>{p.nombre} {p.cargo?"·"+p.cargo:""}</option>)}
              <option value="__custom__">✏️ Otro nombre...</option>
            </select>
          </>
        ) : (
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <input
              autoFocus
              value={customVal}
              onChange={e=>{setCustomVal(e.target.value);onChange(e.target.value);}}
              placeholder="Escribir nombre..."
              style={{background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.25)",color:"#c0e0c0",padding:"2px 6px",fontFamily:"'Georgia',serif",fontSize:13,outline:"none",minWidth:120}}
            />
            <button onClick={()=>{setModo("lista");if(!personal.find(p=>p.nombre===customVal)){}}} style={{background:"transparent",border:"none",color:"#6aaa7a",cursor:"pointer",fontSize:12,padding:"2px 4px"}}>≡</button>
          </div>
        )}
      </div>
    );
  }

  // Versión completa para el formulario
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <button
          onClick={()=>setModo("lista")}
          style={{...S.btn,padding:"5px 12px",fontSize:12,background:modo==="lista"?"rgba(61,122,82,0.3)":"rgba(255,255,255,0.05)",color:modo==="lista"?"#90d0a0":"#7aaa80",border:`1px solid ${modo==="lista"?"rgba(61,122,82,0.4)":"rgba(255,255,255,0.1)"}`}}
        >👥 Personal registrado</button>
        <button
          onClick={()=>{setModo("custom");}}
          style={{...S.btn,padding:"5px 12px",fontSize:12,background:modo==="custom"?"rgba(61,122,82,0.3)":"rgba(255,255,255,0.05)",color:modo==="custom"?"#90d0a0":"#7aaa80",border:`1px solid ${modo==="custom"?"rgba(61,122,82,0.4)":"rgba(255,255,255,0.1)"}`}}
        >✏️ Otro</button>
      </div>

      {modo==="lista" ? (
        <select
          style={{...S.input,fontSize:fontSize||14}}
          value={value||""}
          onChange={e=>onChange(e.target.value)}
        >
          <option value="">⬜ Por designar...</option>
          {listaOrdenada.map(p=>(
            <option key={p.id} value={p.nombre}>
              {p.nombre}{p.cargo ? " · "+p.cargo : ""}{p.zona ? " · "+p.zona : ""}
            </option>
          ))}
        </select>
      ) : (
        <input
          style={{...S.input,fontSize:fontSize||14}}
          placeholder="Escribir nombre libre..."
          value={customVal||value||""}
          onChange={e=>{setCustomVal(e.target.value);onChange(e.target.value);}}
        />
      )}
      {personal.length===0 && modo==="lista" && (
        <div style={{fontSize:11,color:"#5a8a6a",marginTop:4}}>Sin personal registrado. Ve a 👷 Personal para agregar trabajadores.</div>
      )}
    </div>
  );
}

// ─── REPORTE SEMANAL ─────────────────────────────────────────────────────────
function ReporteSemanal({ S, tareasProg, semanaBase, setSemanaBase, MACROZONAS_BASE, personal, incidenciasFito=[] }) {

  // Calcular días lunes-domingo de la semana elegida
  const getDiasSemana = (lunesStr) => {
    const lunes = new Date(lunesStr + "T12:00:00");
    return Array.from({length:7}, (_,i) => {
      const d = new Date(lunes); d.setDate(d.getDate()+i);
      return d.toISOString().slice(0,10);
    });
  };

  const semanaAnterior = () => {
    const d = new Date(semanaBase+"T12:00:00"); d.setDate(d.getDate()-7);
    setSemanaBase(d.toISOString().slice(0,10));
  };
  const semanaSiguiente = () => {
    const d = new Date(semanaBase+"T12:00:00"); d.setDate(d.getDate()+7);
    setSemanaBase(d.toISOString().slice(0,10));
  };
  const semanaActual = () => {
    const d = new Date(); const day = d.getDay(); const diff = (day===0?-6:1-day);
    d.setDate(d.getDate()+diff); setSemanaBase(d.toISOString().slice(0,10));
  };

  const dias = getDiasSemana(semanaBase);
  const domingo = dias[6];
  const DIAS_LABEL = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  // Todas las tareas de la semana
  const tareasSemanales = dias.flatMap(d => (tareasProg[d]||[]).map(t=>({...t, fechaDia:d})));

  // Stats globales
  const total    = tareasSemanales.length;
  const hechas   = tareasSemanales.filter(t=>["hecha","completada"].includes(t.estado)).length;
  const noPudo   = tareasSemanales.filter(t=>t.estado==="no_pudo").length;
  const pend     = tareasSemanales.filter(t=>["pendiente","por_designar","haciendose","en_curso"].includes(t.estado)).length;
  const pct      = total ? Math.round((hechas/total)*100) : 0;

  // Resumen por trabajador
  const porTrabajador = {};
  tareasSemanales.forEach(t => {
    const nombre = t.responsable || "Sin asignar";
    if (!porTrabajador[nombre]) porTrabajador[nombre] = {total:0,hechas:0,noPudo:0,pend:0};
    porTrabajador[nombre].total++;
    if(["hecha","completada"].includes(t.estado)) porTrabajador[nombre].hechas++;
    else if(t.estado==="no_pudo") porTrabajador[nombre].noPudo++;
    else porTrabajador[nombre].pend++;
  });

  // Resumen por zona
  const porZona = {};
  tareasSemanales.forEach(t => {
    const z = t.zona||"Sin zona";
    if(!porZona[z]) porZona[z]={total:0,hechas:0,noPudo:0};
    porZona[z].total++;
    if(["hecha","completada"].includes(t.estado)) porZona[z].hechas++;
    if(t.estado==="no_pudo") porZona[z].noPudo++;
  });

  // Tareas "no se pudo" de la semana
  const incidencias = tareasSemanales.filter(t=>t.estado==="no_pudo");

  const imprimir = () => {
    const lunes = new Date(semanaBase+"T12:00:00");
    const dom   = new Date(domingo+"T12:00:00");
    const fmtFecha = (d) => new Date(d+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
    const fmtLargo = (d) => new Date(d+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});

    const resumenDias = dias.map((d,i) => {
      const td = tareasProg[d]||[];
      const h  = td.filter(t=>["hecha","completada"].includes(t.estado)).length;
      const np = td.filter(t=>t.estado==="no_pudo").length;
      const p  = td.filter(t=>["pendiente","por_designar","haciendose","en_curso"].includes(t.estado)).length;
      const pct2 = td.length ? Math.round((h/td.length)*100) : null;
      const isDom = i===6;
      return `<tr style="${isDom?"background:#fff8f0":""}">
        <td style="font-weight:600;white-space:nowrap">${DIAS_LABEL[i]} ${fmtFecha(d)}</td>
        <td style="text-align:center">${td.length||"—"}</td>
        <td style="text-align:center;color:#166534">${h||"—"}</td>
        <td style="text-align:center;color:${np>0?"#991b1b":"#6b7280"}">${np||"—"}</td>
        <td style="text-align:center;color:${p>0?"#92400e":"#6b7280"}">${p||"—"}</td>
        <td style="text-align:center;font-weight:700;color:${pct2===null?"#9ca3af":pct2===100?"#166534":pct2>50?"#92400e":"#991b1b"}">${pct2!==null?pct2+"%":"—"}</td>
      </tr>`;
    }).join("");

    const resumenTrabajadores = Object.entries(porTrabajador)
      .sort((a,b)=>b[1].total-a[1].total)
      .map(([n,v])=>`<tr>
        <td>${n}</td>
        <td style="text-align:center">${v.total}</td>
        <td style="text-align:center;color:#166534">${v.hechas}</td>
        <td style="text-align:center;color:${v.noPudo>0?"#991b1b":"#6b7280"}">${v.noPudo||"—"}</td>
        <td style="text-align:center;color:${v.pend>0?"#92400e":"#6b7280"}">${v.pend||"—"}</td>
        <td style="text-align:center;font-weight:700;color:${v.total?v.hechas/v.total===1?"#166534":v.hechas/v.total>0.5?"#92400e":"#991b1b":"#9ca3af"}">${v.total?Math.round((v.hechas/v.total)*100)+"%":"—"}</td>
      </tr>`).join("");

    const resumenZonas = Object.entries(porZona)
      .sort((a,b)=>b[1].total-a[1].total)
      .map(([z,v])=>{
        const icono = MACROZONAS_BASE.find(x=>x.nombre===z)?.icono||"📍";
        return `<tr>
          <td>${icono} ${z}</td>
          <td style="text-align:center">${v.total}</td>
          <td style="text-align:center;color:#166534">${v.hechas}</td>
          <td style="text-align:center;color:${v.noPudo>0?"#991b1b":"#6b7280"}">${v.noPudo||"—"}</td>
          <td style="text-align:center;font-weight:700">${v.total?Math.round((v.hechas/v.total)*100)+"%":"—"}</td>
        </tr>`;
      }).join("");

    const incidenciasRows = incidencias.length===0
      ? "<tr><td colspan='5' style='text-align:center;color:#6b7280;padding:12px'>Sin incidencias registradas</td></tr>"
      : incidencias.map(t=>`<tr>
          <td style="white-space:nowrap">${new Date(t.fechaDia+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}</td>
          <td>${t.tarea}</td>
          <td>${MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||""} ${t.zona||"—"}</td>
          <td>${t.responsable||"Sin asignar"}</td>
          <td style="color:#991b1b;font-style:italic">${t.notaWorker||"Sin observación"}</td>
        </tr>`).join("");

    // Incidencias fitosanitarias de la semana
    const incFitoSemana = incidenciasFito.filter(inc=>{
      const f=inc.fechaObservacion||inc.fechaAplicacion||"";
      return f>=semanaBase&&f<=domingo;
    });
    const TIPO_LABEL_PDF = {fitosanitario:"🦠 Fitosanitario",mantenimiento:"🔧 Mantenimiento",clima:"🌧️ Clima"};
    const incFitoRows = incFitoSemana.length===0
      ? "<tr><td colspan='6' style='text-align:center;color:#6b7280;padding:12px'>Sin incidencias fitosanitarias esta semana</td></tr>"
      : incFitoSemana.map(inc=>{
          const sectObs=(inc.sectoresObservados||[]).join(", ")||"—";
          const sectCerr=(inc.sectoresCerrados||[]).join(", ")||"—";
          const reap=inc.fechaReaperturaISO?new Date(inc.fechaReaperturaISO).toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
          const estLabel=inc.estado==="cerrada"?"🚫 Cerrada":inc.estado==="reabierta"?"✅ Reabierta":"⚠️ En obs.";
          return `<tr>
            <td style="white-space:nowrap">${inc.fechaObservacion||"—"}</td>
            <td>${TIPO_LABEL_PDF[inc.tipoCierre]||"🚨"}</td>
            <td style="font-weight:600">${inc.agenteCausal||inc.diagnostico||"—"}</td>
            <td>${sectObs}</td>
            <td style="color:#991b1b">${sectCerr}</td>
            <td>${inc.productoAplicar||"—"}<br><small style="color:#6b7280">${inc.fechaAplicacion||""} ${inc.horaAplicacion||""}</small></td>
            <td style="color:#166534">${reap}</td>
            <td>${estLabel}</td>
          </tr>`;
        }).join("");

    const win = window.open("","_blank","width=900,height=700");
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Informe Semanal Áreas Verdes — Estadio Español</title>
    <style>
      body{font-family:Georgia,serif;color:#1a2e1a;padding:36px;max-width:860px;margin:0 auto;font-size:13px}
      h1{font-size:20px;color:#0d3320;margin:0 0 4px}
      h2{font-size:14px;color:#1a4a2e;margin:24px 0 8px;padding-bottom:4px;border-bottom:2px solid #1a4a2e;text-transform:uppercase;letter-spacing:0.8px}
      .encabezado{background:#f0f7f0;border-radius:8px;padding:14px 18px;margin-bottom:20px}
      .periodo{font-size:15px;font-weight:700;color:#0d3320;margin-bottom:4px}
      .generado{font-size:11px;color:#6b7280}
      .kpis{display:flex;gap:20px;margin-bottom:20px;flex-wrap:wrap}
      .kpi{background:#f5fbf5;border-radius:8px;padding:12px 16px;text-align:center;min-width:100px;flex:1}
      .kpi-num{font-size:26px;font-weight:700;font-family:Georgia,serif}
      .kpi-lbl{font-size:11px;color:#4a7a4a;margin-top:2px}
      .ok{color:#166534} .bad{color:#991b1b} .warn{color:#92400e} .gray{color:#6b7280}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4px}
      th{text-align:left;padding:7px 10px;background:#1a4a2e;color:#fff;font-size:10px;letter-spacing:0.7px;text-transform:uppercase;white-space:nowrap}
      tr:nth-child(even){background:#f5fbf5}
      td{padding:7px 10px;border-bottom:1px solid #dce8dc;vertical-align:top}
      .bar-bg{background:#e0ede0;border-radius:4px;height:8px;overflow:hidden;margin-top:4px}
      .bar{height:100%;border-radius:4px}
      .pie{margin-top:28px;font-size:11px;color:#6b7280;border-top:1px solid #dce8dc;padding-top:12px;display:flex;justify-content:space-between}
      @media print{body{padding:18px}h2{break-before:avoid}}
    </style></head><body>
    <div class="encabezado">
      <div class="periodo">📋 Informe Semanal de Áreas Verdes</div>
      <div style="font-size:14px;color:#2d6a3f;margin:4px 0">Período: ${fmtLargo(semanaBase)} al ${fmtLargo(domingo)}</div>
      <div class="generado">Generado: ${new Date().toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · ${new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})} · Departamento de Áreas Verdes — Estadio Español de Las Condes</div>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="kpi-num">${total}</div><div class="kpi-lbl">Tareas totales</div></div>
      <div class="kpi"><div class="kpi-num ok">${hechas}</div><div class="kpi-lbl">✅ Completadas</div></div>
      <div class="kpi"><div class="kpi-num bad">${noPudo}</div><div class="kpi-lbl">🔴 No pudieron</div></div>
      <div class="kpi"><div class="kpi-num warn">${pend}</div><div class="kpi-lbl">⏳ Pendientes</div></div>
      <div class="kpi"><div class="kpi-num" style="color:${pct===100?"#166534":pct>70?"#2d6a3f":pct>40?"#92400e":"#991b1b"}">${pct}%</div><div class="kpi-lbl">Cumplimiento</div>
        <div class="bar-bg"><div class="bar" style="width:${pct}%;background:${pct===100?"#166534":pct>70?"#16a34a":pct>40?"#d97706":"#dc2626"}"></div></div>
      </div>
    </div>

    <h2>📅 Resumen por Día</h2>
    <table><thead><tr><th>Día</th><th>Total</th><th>✅ Hechas</th><th>🔴 No pudo</th><th>⏳ Pend.</th><th>%</th></tr></thead>
    <tbody>${resumenDias}</tbody></table>

    <h2>👷 Desempeño por Trabajador</h2>
    <table><thead><tr><th>Trabajador</th><th>Total</th><th>✅ Hechas</th><th>🔴 No pudo</th><th>⏳ Pend.</th><th>%</th></tr></thead>
    <tbody>${resumenTrabajadores||"<tr><td colspan='6' style='text-align:center;color:#6b7280'>Sin asignaciones registradas</td></tr>"}</tbody></table>

    <h2>🗺️ Actividad por Zona</h2>
    <table><thead><tr><th>Macrozona</th><th>Total</th><th>✅ Hechas</th><th>🔴 No pudo</th><th>%</th></tr></thead>
    <tbody>${resumenZonas||"<tr><td colspan='4' style='text-align:center;color:#6b7280'>Sin actividad registrada</td></tr>"}</tbody></table>

    <h2>⚠️ Incidencias — Tareas No Realizadas</h2>
    <table><thead><tr><th>Día</th><th>Tarea</th><th>Zona</th><th>Responsable</th><th>Motivo</th></tr></thead>
    <tbody>${incidenciasRows}</tbody></table>

    <h2>🚨 Incidencias Fitosanitarias y Cierres de Cancha</h2>
    <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Agente / Causa</th><th>Sectores observados</th><th>Sectores cerrados</th><th>Producto / Aplicación</th><th>Reapertura estimada</th><th>Estado</th></tr></thead>
    <tbody>${incFitoRows}</tbody></table>

    <div class="pie">
      <span>Estadio Español de Las Condes · Departamento de Áreas Verdes · Jefa Carmen Luz Hermosilla</span>
      <span>${new Date().getFullYear()}</span>
    </div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="ein">
      {/* Navegación de semana */}
      <div style={{...S.card,padding:"14px 18px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={semanaAnterior} style={{...S.btn,padding:"6px 14px",fontSize:16,background:"rgba(255,255,255,0.07)",color:"#a0c8a0",border:"1px solid rgba(255,255,255,0.12)"}}>‹</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>
                {new Date(semanaBase+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long"})} – {new Date(domingo+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"})}
              </div>
              <div style={{fontSize:12,color:"#6aaa7a",marginTop:2}}>Semana {Math.ceil(new Date(semanaBase+"T12:00:00").toLocaleDateString("es-CL").split("/")[0]/7)}</div>
            </div>
            <button onClick={semanaSiguiente} style={{...S.btn,padding:"6px 14px",fontSize:16,background:"rgba(255,255,255,0.07)",color:"#a0c8a0",border:"1px solid rgba(255,255,255,0.12)"}}>›</button>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="date" value={semanaBase} onChange={e=>{const d=new Date(e.target.value+"T12:00:00");const day=d.getDay();const diff=(day===0?-6:1-day);d.setDate(d.getDate()+diff);setSemanaBase(d.toISOString().slice(0,10));}}
              style={{...S.input,width:"auto",fontSize:13}}/>
            <button onClick={semanaActual} style={{...S.btn,background:"transparent",color:"#6aaa7a",border:"1px solid rgba(255,255,255,0.1)",fontSize:12}}>Esta semana</button>
            <button onClick={imprimir} style={{...S.btn,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",fontSize:13}}>🖨️ Imprimir</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {total===0 ? (
        <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
          <div style={{fontSize:36,marginBottom:10}}>📅</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:6}}>Sin tareas programadas esta semana</div>
          <div style={{fontSize:13}}>Ve a 📆 Programa para agregar o generar tareas para los días de esta semana.</div>
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
            {[
              {label:"Tareas totales",val:total,color:"#c0dac0",icon:"📋"},
              {label:"Completadas",val:hechas,color:"#22c55e",icon:"✅"},
              {label:"No pudieron",val:noPudo,color:"#ef4444",icon:"🔴"},
              {label:"Pendientes",val:pend,color:"#f59e0b",icon:"⏳"},
              {label:"Cumplimiento",val:pct+"%",color:pct===100?"#22c55e":pct>70?"#4ade80":pct>40?"#f59e0b":"#ef4444",icon:"📊"},
            ].map(s=>(
              <div key={s.label} style={{...S.card,padding:"14px 10px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#6aaa7a"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Resumen días */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:12}}>📅 Resumen por Día</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:22}}>
            {dias.map((d,i)=>{
              const td=tareasProg[d]||[];
              const h=td.filter(t=>["hecha","completada"].includes(t.estado)).length;
              const np=td.filter(t=>t.estado==="no_pudo").length;
              const p=td.length?Math.round((h/td.length)*100):null;
              const isDom=i===6;
              return (
                <div key={d} style={{...S.card,padding:"10px 8px",textAlign:"center",opacity:isDom?0.7:1,borderColor:isDom?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.10)"}}>
                  <div style={{fontSize:11,color:isDom?"#f59e0b":"#6aaa7a",fontWeight:600,marginBottom:4}}>{DIAS_LABEL[i]}</div>
                  <div style={{fontSize:11,color:"#4a7a6a",marginBottom:6}}>{new Date(d+"T12:00:00").getDate()}</div>
                  {td.length===0 ? <div style={{fontSize:11,color:"#3a6a4a"}}>—</div> : (
                    <>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:p===100?"#22c55e":p>50?"#f59e0b":"#ef4444"}}>{p!==null?p+"%":"—"}</div>
                      <div style={{fontSize:10,color:"#5a8a6a",marginTop:2}}>{td.length} tar.</div>
                      {np>0&&<div style={{fontSize:10,color:"#ef4444"}}>🔴 {np}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Por trabajador */}
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:12}}>👷 Desempeño por Trabajador</div>
          <div style={{...S.card,padding:0,marginBottom:22,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"rgba(61,122,82,0.2)"}}>
                  {["Trabajador","Total","✅ Hechas","🔴 No pudo","⏳ Pend.","% Cumplimiento"].map(h=>(
                    <th key={h} style={{padding:"9px 12px",textAlign:h==="Trabajador"?"left":"center",fontSize:11,color:"#6aaa7a",fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(porTrabajador).sort((a,b)=>b[1].total-a[1].total).map(([nombre,v],i)=>{
                  const p=v.total?Math.round((v.hechas/v.total)*100):0;
                  return (
                    <tr key={nombre} style={{borderBottom:"1px solid rgba(255,255,255,0.05)",background:i%2===0?"transparent":"rgba(255,255,255,0.018)"}}>
                      <td style={{padding:"9px 12px",fontWeight:600}}>{nombre}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",color:"#8ab0c0"}}>{v.total}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",color:"#22c55e"}}>{v.hechas||"—"}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",color:v.noPudo>0?"#ef4444":"#4a7a6a"}}>{v.noPudo||"—"}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",color:v.pend>0?"#f59e0b":"#4a7a6a"}}>{v.pend||"—"}</td>
                      <td style={{padding:"9px 12px",textAlign:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:6,width:60,overflow:"hidden"}}>
                            <div style={{width:`${p}%`,height:"100%",background:p===100?"#22c55e":p>70?"#4ade80":p>40?"#f59e0b":"#ef4444",borderRadius:4}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:700,color:p===100?"#22c55e":p>70?"#4ade80":p>40?"#f59e0b":"#ef4444"}}>{p}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Incidencias de tareas */}
          {incidencias.length>0&&(
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:12,color:"#fca5a5"}}>⚠️ Incidencias — No se pudo realizar</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22}}>
                {incidencias.map(t=>(
                  <div key={t.id} style={{...S.card,padding:"12px 16px",borderLeft:"3px solid rgba(239,68,68,0.6)"}}>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:11,color:"#f59e0b",background:"rgba(245,158,11,0.1)",padding:"2px 8px",borderRadius:8}}>{new Date(t.fechaDia+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"})}</span>
                      <span style={{fontSize:14,fontWeight:600}}>{t.tarea}</span>
                      {t.elemento&&<span style={{fontSize:11,color:"#5a8a6a"}}>{t.elemento}</span>}
                      <span style={{fontSize:11,color:"#5a7a7a"}}>{MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||"📍"} {t.zona}</span>
                      {t.responsable&&<span style={{fontSize:11,color:"#7a9a8a"}}>👤 {t.responsable}</span>}
                    </div>
                    {t.notaWorker&&<div style={{fontSize:12,color:"#fca5a5",fontStyle:"italic",padding:"5px 10px",background:"rgba(239,68,68,0.08)",borderRadius:6}}>⚠️ {t.notaWorker}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── INCIDENCIAS FITOSANITARIAS Y CIERRES DE CANCHA ── */}
          {(()=>{
            // Filtrar incidencias fitosanitarias de la semana actual
            const incSemana = incidenciasFito.filter(inc => {
              const f = inc.fechaObservacion||inc.fechaAplicacion||"";
              return f >= semanaBase && f <= domingo;
            });
            if(!incSemana.length) return null;
            const TIPO_ICON = {fitosanitario:"🦠",mantenimiento:"🔧",clima:"🌧️"};
            const SEV_COLOR = {leve:"#f59e0b",media:"#f97316",alta:"#ef4444",critica:"#7c3aed"};
            return (
              <>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:12,color:"#fb923c"}}>
                  🚨 Incidencias Fitosanitarias y Cierres de Cancha
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
                  {incSemana.map(inc=>{
                    const sevColor = SEV_COLOR[inc.severidad]||"#f59e0b";
                    const ESTADO_COLOR = {observacion:"#f59e0b",cerrada:"#ef4444",reabierta:"#22c55e"};
                    const estColor = ESTADO_COLOR[inc.estado]||"#f59e0b";
                    return (
                      <div key={inc.id} style={{...S.card,padding:16,borderLeft:`3px solid ${estColor}`}}>
                        {/* Cabecera */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontSize:20}}>{TIPO_ICON[inc.tipoCierre]||"🚨"}</span>
                            <div>
                              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#ede9e0"}}>
                                {inc.agenteCausal||inc.diagnostico||"Incidencia registrada"}
                              </div>
                              <div style={{fontSize:11,color:"#7aaa80",marginTop:2}}>
                                📅 {inc.fechaObservacion} {inc.horaObservacion} · 👤 Observado por: {inc.observador}
                              </div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            <span style={{...S.chip,background:`${sevColor}18`,color:sevColor,border:`1px solid ${sevColor}40`,fontSize:11}}>
                              ⚡ {inc.severidad||"media"}
                            </span>
                            <span style={{...S.chip,background:`${estColor}18`,color:estColor,border:`1px solid ${estColor}40`,fontSize:11}}>
                              {inc.estado==="cerrada"?"🚫 Cerrada":inc.estado==="reabierta"?"✅ Reabierta":"⚠️ En observación"}
                            </span>
                          </div>
                        </div>

                        {/* Observación */}
                        {inc.observacion&&(
                          <div style={{fontSize:12,color:"#a0c0a0",fontStyle:"italic",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px",marginBottom:8}}>
                            "{inc.observacion}"
                          </div>
                        )}

                        {/* Sectores */}
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                          {(inc.sectoresObservados||[]).map(s=>(
                            <span key={s} style={{...S.chip,background:"rgba(249,115,22,0.1)",color:"#fb923c",border:"1px solid rgba(249,115,22,0.25)",fontSize:10}}>⚠️ {s}</span>
                          ))}
                          {(inc.sectoresCerrados||[]).map(s=>(
                            <span key={s} style={{...S.chip,background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)",fontSize:10}}>🚫 {s}</span>
                          ))}
                        </div>

                        {/* Diagnóstico y tratamiento */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
                          {inc.diagnosticadoPor&&<div style={{color:"#7aaa80"}}>🩺 Diagnóstico: <span style={{color:"#c0e0c0"}}>{inc.diagnosticadoPor}</span></div>}
                          {inc.productoAplicar&&<div style={{color:"#7aaa80"}}>🧪 Producto: <span style={{color:"#c0e0c0"}}>{inc.productoAplicar}</span></div>}
                          {inc.fechaAplicacion&&<div style={{color:"#7aaa80"}}>💉 Aplicación: <span style={{color:"#c0e0c0"}}>{inc.fechaAplicacion} {inc.horaAplicacion}</span></div>}
                          {inc.tratamiento&&<div style={{color:"#7aaa80"}}>📋 Alcance: <span style={{color:"#c0e0c0"}}>{inc.tratamiento==="completo"?"Fumigación completa":inc.tratamiento==="sectores"?"Sectores afectados":inc.tratamiento}</span></div>}
                        </div>

                        {/* Reapertura */}
                        {inc.fechaReaperturaISO&&(
                          <div style={{marginTop:8,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"8px 12px"}}>
                            <span style={{fontSize:12,color:"#86efac",fontWeight:600}}>📅 Reapertura estimada: </span>
                            <span style={{fontSize:12,color:"#4ade80"}}>{new Date(inc.fechaReaperturaISO).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})} a las {new Date(inc.fechaReaperturaISO).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</span>
                            {inc.notaReingreso&&<div style={{fontSize:11,color:"#5a9a7a",marginTop:3,fontStyle:"italic"}}>{inc.notaReingreso}</div>}
                          </div>
                        )}

                        {inc.motivoCierre&&(
                          <div style={{marginTop:8,fontSize:12,color:"#fcd34d",background:"rgba(252,211,77,0.06)",borderRadius:6,padding:"6px 10px"}}>
                            📢 {inc.motivoCierre}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── HISTORIAL DE PROGRAMACIÓN ───────────────────────────────────────────────
function HistorialProg({ tareas, setTareas, MACROZONAS_BASE, S, esJefa=false }) {
  const [filtroDia,    setFiltroDia]    = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState("todos");
  const [filtroTarea,  setFiltroTarea]  = React.useState("");
  const [filtroZona,   setFiltroZona]   = React.useState("todas");
  const [diaImpresion, setDiaImpresion] = React.useState("");

  const EC = {
    hecha:       {color:"#22c55e", icon:"✅", label:"Hecha"},
    completada:  {color:"#22c55e", icon:"✅", label:"Completada"},
    no_pudo:     {color:"#ef4444", icon:"🔴", label:"No se pudo"},
    haciendose:  {color:"#3b82f6", icon:"🔵", label:"Haciéndose"},
    en_curso:    {color:"#3b82f6", icon:"🔵", label:"En curso"},
    pendiente:   {color:"#f59e0b", icon:"🟡", label:"Pendiente"},
    por_designar:{color:"#94a3b8", icon:"⬜", label:"Por designar"},
    cancelada:   {color:"#ef4444", icon:"❌", label:"Cancelada"},
  };

  // Opciones únicas para filtros
  const allTareas   = Object.values(tareas).flat();
  const todasTareas = [...new Set(allTareas.map(t=>t.tarea))].sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
  const todasZonas  = [...new Set(allTareas.map(t=>t.zona).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));

  const diasOrdenados = Object.keys(tareas)
    .filter(d => (tareas[d]||[]).length > 0)
    .filter(d => !filtroDia || d === filtroDia)
    .sort((a,b)=>b.localeCompare(a));

  const filtrarTareas = (td) => td.filter(t => {
    const mE = filtroEstado==="todos" || t.estado===filtroEstado;
    const mT = !filtroTarea || t.tarea===filtroTarea;
    const mZ = filtroZona==="todas" || t.zona===filtroZona;
    return mE && mT && mZ;
  });

  const imprimirDia = (dia) => {
    const td = filtrarTareas(tareas[dia]||[]);
    const hechas = td.filter(t=>["hecha","completada"].includes(t.estado)).length;
    const noPudo = td.filter(t=>t.estado==="no_pudo").length;
    const pct = td.length ? Math.round((hechas/td.length)*100) : 0;
    const win = window.open("","_blank","width=800,height=600");
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Programación ${dia} — Estadio Español</title>
    <style>
      body{font-family:Georgia,serif;color:#1a2e1a;padding:32px;max-width:750px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px;color:#0d3320}
      .sub{font-size:13px;color:#4a7a4a;margin-bottom:20px}
      .stats{display:flex;gap:20px;margin-bottom:20px;padding:12px 16px;background:#f0f7f0;border-radius:8px;font-size:14px}
      .stat-ok{color:#166534;font-weight:700} .stat-bad{color:#991b1b;font-weight:700} .stat-pct{color:#1e40af;font-weight:700}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;padding:8px 10px;background:#1a4a2e;color:#fff;font-size:11px;letter-spacing:0.8px;text-transform:uppercase}
      tr:nth-child(even){background:#f5fbf5}
      td{padding:8px 10px;border-bottom:1px solid #dce8dc;vertical-align:top}
      .est-ok{color:#166534} .est-bad{color:#991b1b} .est-pend{color:#92400e} .est-blue{color:#1e40af} .est-gray{color:#4b5563}
      .nota{font-size:11px;color:#991b1b;font-style:italic;margin-top:3px}
      .pie{margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #dce8dc;padding-top:12px}
      @media print{body{padding:16px}.pie{position:fixed;bottom:20px;width:100%}}
    </style></head><body>
    <h1>📋 Programación Diaria — Estadio Español</h1>
    <div class="sub">Fecha: <b>${dia}</b>${td.length !== (tareas[dia]||[]).length ? " (filtrado)" : ""} · Generado: ${new Date().toLocaleDateString("es-CL")} ${new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>
    <div class="stats">
      <span>Total: <b>${td.length}</b></span>
      <span class="stat-ok">✅ Hechas: ${hechas}</span>
      ${noPudo>0?"<span class=\"stat-bad\">🔴 No pudieron: "+noPudo+"</span>":""}
      <span class="stat-pct">${pct}% completado</span>
    </div>
    <table>
      <thead><tr><th>Estado</th><th>Tarea</th><th>Elemento</th><th>Zona</th><th>Responsable</th><th>Observación</th></tr></thead>
      <tbody>
        ${td.map(t => {
          const estCls = ["hecha","completada"].includes(t.estado)?"est-ok":t.estado==="no_pudo"?"est-bad":["haciendose","en_curso"].includes(t.estado)?"est-blue":["pendiente"].includes(t.estado)?"est-pend":"est-gray";
          const estLabel = EC[t.estado]?.label || t.estado;
          const icono = MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||""
          return '<tr>'+'<td class="'+estCls+'">'+( EC[t.estado]?.icon||"-")+" "+estLabel+"</td>"+'<td><b>'+t.tarea+'</b></td>'+'<td>'+(t.elemento||"-")+"</td>"+'<td>'+icono+" "+(t.zona||"-")+"</td>"+'<td>'+(t.responsable||"<i>Sin asignar</i>")+"</td>"+'<td>'+(t.notaWorker?"⚠️ "+t.notaWorker:"-")+"</td>"+'</tr>';
        }).join("")}
      </tbody>
    </table>
    </table>
    <div class="pie">Estadio Español de Las Condes · Departamento de Áreas Verdes</div>
    <script>window.onload=()=>{window.print();}<\/script>
    </body></html>`);
    win.document.close();
  };

  const hayFiltros = filtroEstado!=="todos"||filtroTarea||filtroZona!=="todas"||filtroDia;

  return (
    <div className="ein">
      {/* Filtros */}
      <div style={{...S.card,padding:16,marginBottom:18}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0"}}>🔍 Filtros</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:10}}>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>DÍA</label>
            <select style={{...S.input,fontSize:13}} value={filtroDia} onChange={e=>setFiltroDia(e.target.value)}>
              <option value="">Todos los días</option>
              {Object.keys(tareas).filter(d=>(tareas[d]||[]).length>0).sort((a,b)=>b.localeCompare(a)).map(d=>(
                <option key={d} value={d}>{d}{new Date(d+"T12:00:00").getDay()===0?" 🔴":""}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
            <select style={{...S.input,fontSize:13}} value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)}>
              <option value="todos">Todos</option>
              {Object.entries(EC).filter(([k])=>!["completada","haciendose","en_curso"].includes(k)).map(([k,v])=>(
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TAREA</label>
            <select style={{...S.input,fontSize:13}} value={filtroTarea} onChange={e=>setFiltroTarea(e.target.value)}>
              <option value="">Todas las tareas</option>
              {todasTareas.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ZONA</label>
            <select style={{...S.input,fontSize:13}} value={filtroZona} onChange={e=>setFiltroZona(e.target.value)}>
              <option value="todas">Todas las zonas</option>
              {todasZonas.map(z=>{const icono=MACROZONAS_BASE.find(x=>x.nombre===z)?.icono||"📍";return <option key={z} value={z}>{icono} {z}</option>;})}
            </select>
          </div>
        </div>
        {hayFiltros && (
          <button onClick={()=>{setFiltroDia("");setFiltroEstado("todos");setFiltroTarea("");setFiltroZona("todas");}}
            style={{...S.btn,background:"transparent",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)",fontSize:12}}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* Sin registros */}
      {Object.keys(tareas).length===0 && (
        <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
          <div style={{fontSize:36,marginBottom:10}}>📜</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin registros históricos aún</div>
        </div>
      )}

      {/* Días */}
      {diasOrdenados.map(dia => {
        const tdFiltradas = filtrarTareas(tareas[dia]||[]);
        if(tdFiltradas.length===0) return null;
        const td = tareas[dia]||[];
        const hechas = tdFiltradas.filter(t=>["hecha","completada"].includes(t.estado)).length;
        const noPudo = tdFiltradas.filter(t=>t.estado==="no_pudo").length;
        const pend   = tdFiltradas.filter(t=>["pendiente","por_designar","haciendose","en_curso"].includes(t.estado)).length;
        const pct2   = tdFiltradas.length ? Math.round((hechas/tdFiltradas.length)*100) : 0;
        const esDom  = new Date(dia+"T12:00:00").getDay()===0;
        return (
          <div key={dia} style={{...S.card,padding:18,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{dia}</span>
                {esDom&&<span style={{fontSize:11,color:"#f59e0b",background:"rgba(245,158,11,0.12)",padding:"2px 8px",borderRadius:10}}>Domingo</span>}
                <span style={{fontSize:12,color:"#6aaa7a"}}>{tdFiltradas.length}{tdFiltradas.length!==td.length?` / ${td.length}`:""} tareas</span>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#22c55e"}}>✅ {hechas}</span>
                {noPudo>0&&<span style={{fontSize:12,color:"#ef4444"}}>🔴 {noPudo}</span>}
                {pend>0&&<span style={{fontSize:12,color:"#94a3b8"}}>⏳ {pend}</span>}
                <span style={{fontSize:13,fontWeight:700,color:pct2===100?"#22c55e":pct2>50?"#f59e0b":"#94a3b8"}}>{pct2}%</span>
                <button
                  onClick={()=>imprimirDia(dia)}
                  style={{...S.btn,padding:"5px 12px",fontSize:12,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}}>
                  🖨️ Imprimir
                </button>
                {esJefa&&(
                  <button
                    onClick={()=>{if(window.confirm("¿Eliminar todas las tareas del día "+dia+"?"))setTareas(prev=>{const n={...prev};delete n[dia];return n;});}}
                    style={{cursor:"pointer",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"5px 12px",fontSize:12,background:"rgba(239,68,68,0.12)",color:"#fca5a5",fontFamily:"'Georgia',serif"}}>
                    🗑 Borrar día
                  </button>
                )}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:6,marginBottom:12,overflow:"hidden"}}>
              <div style={{width:`${pct2}%`,height:"100%",background:pct2===100?"#22c55e":"#3b82f6",borderRadius:4}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {tdFiltradas.map(t=>{
                const est=EC[t.estado]||EC.pendiente;
                return (
                  <div key={t.id} style={{display:"flex",gap:10,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",borderLeft:`3px solid ${est.color}40`}}>
                    <span style={{flexShrink:0,fontSize:15}}>{est.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:600}}>{t.tarea}</span>
                        {t.elemento&&<span style={{fontSize:11,color:"#5a8a6a",background:"rgba(255,255,255,0.05)",padding:"1px 6px",borderRadius:8}}>{t.elemento}</span>}
                      </div>
                      <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"#5a7a7a"}}>{MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||"📍"} {t.zona}</span>
                        {t.responsable&&<span style={{fontSize:11,color:"#7a9a8a"}}>👤 {t.responsable}</span>}
                      </div>
                      {t.notaWorker&&<div style={{fontSize:11,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",marginTop:4,fontStyle:"italic",padding:"4px 8px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>{t.estado==="no_pudo"?"⚠️ ":""}{t.notaWorker}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {diasOrdenados.length>0 && diasOrdenados.every(d=>filtrarTareas(tareas[d]||[]).length===0) && (
        <div style={{...S.card,padding:32,textAlign:"center",color:"#4a8a5a",fontSize:14}}>
          Sin tareas que coincidan con los filtros aplicados.
        </div>
      )}
    </div>
  );
}

// ─── PROGRAMACIÓN DIARIA ─────────────────────────────────────────────────────
// ─── VISTA TRABAJADOR ────────────────────────────────────────────────────────
function VistaWorker({ trabajador, fecha, tareas, S, onUpdateTarea, onAddTarea, onSetFrecs, getFrecs, MACROZONAS_BASE }) {
  const hoy = new Date().toISOString().slice(0,10);
  const [fechaVer, setFechaVer] = React.useState(fecha || hoy);
  const [showNuevaTareaEmerg, setShowNuevaTareaEmerg] = React.useState(false);
  const [nuevaTareaEmerg, setNuevaTareaEmerg] = React.useState({ zona:"", tarea:"", notas:"" });

  const ESTADOS_TAREA = {
    pendiente:    { label:"Pendiente",      color:"#f59e0b", bg:"rgba(245,158,11,0.15)",  icon:"🟡" },
    haciendose:   { label:"Haciéndose",     color:"#3b82f6", bg:"rgba(59,130,246,0.15)",  icon:"🔵" },
    hecha:        { label:"Hecha ✓",        color:"#22c55e", bg:"rgba(34,197,94,0.15)",   icon:"🟢" },
    no_pudo:      { label:"No se pudo",     color:"#ef4444", bg:"rgba(239,68,68,0.15)",   icon:"🔴" },
  };

  const getTareasDeZona = (nombreZona) => {
    const zona = MACROZONAS_BASE.find(z=>z.nombre===nombreZona);
    if(!zona) return [];
    const tareaSet = new Set();
    zona.elementos.forEach(e=>{
      const frecs = TAREAS_DEFAULT[e.tipo]||[];
      frecs.forEach(f=>{ if(f.tarea) tareaSet.add(f.tarea); });
    });
    return [...tareaSet].sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
  };

  const normalizar = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  const misTargets = (tareas[fechaVer]||[])
    .filter(t => t.responsable && normalizar(t.responsable) === normalizar(trabajador.nombre))
    .sort((a,b)=>(a.zona||"").localeCompare(b.zona||"","es",{sensitivity:"base"}));

  const stats = {
    total: misTargets.length,
    hechas: misTargets.filter(t=>t.estado==="hecha").length,
    noPudo: misTargets.filter(t=>t.estado==="no_pudo").length,
  };
  const pct = stats.total>0 ? Math.round((stats.hechas/stats.total)*100) : 0;

  const TAREAS_AGUA = ["riego","corte","corte de césped","corte cesped","orillado","orillad"];
  const esRiegoOCorte = (nombreTarea) => {
    const n = (nombreTarea||"").toLowerCase();
    return TAREAS_AGUA.some(k => n.includes(k));
  };

  const handleHumedad = (t) => {
    // Postpone next execution by 2 days in frecuencias
    const zonaBase = MACROZONAS_BASE.find(z=>z.nombre===t.zona);
    if (!zonaBase) return;
    // Find element in zona
    const estSig = (f) => {
      const m = new Date(fechaVer).getMonth()+1;
      if([12,1,2].includes(m)) return "verano";
      if([3,4,5].includes(m)) return "otono";
      if([6,7,8].includes(m)) return "invierno";
      return "primavera";
    };
    const est = estSig(fechaVer);
    const FREC_ORDER = ["diario","cada2dias","cada3dias","cada5dias","semanal","quincenal","mensual","bimestral","trimestral","semestral","anual","unavez","segunecesidad","noaplica"];
    // bump frequency 2 steps down (less frequent) for this element+tarea
    const frecsActuales = getFrecs(zonaBase.id, null, null, false, t.elemento, t.tarea);
    if (frecsActuales) {
      const { frecs, eid, isCustom } = frecsActuales;
      const updated = frecs.map(f => {
        if (f.tarea.toLowerCase()===t.tarea.toLowerCase()) {
          const idx = FREC_ORDER.indexOf(f[est]);
          const newIdx = Math.min(idx+2, FREC_ORDER.length-2); // +2 steps, not noaplica
          return {...f, [est]: FREC_ORDER[newIdx]};
        }
        return f;
      });
      onSetFrecs(zonaBase.id, eid, isCustom, updated);
    }
    onUpdateTarea(fechaVer, t.id, { estado:"hecha", humedad:true, notaWorker:"Terreno húmedo — frecuencia ajustada +2 días" });
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#0a1f10 0%,#122d1a 100%)",color:"#ede9e0",fontFamily:"'Georgia',serif",padding:"0 0 40px"}}>
      <style>{`.wtab{cursor:pointer;padding:8px 16px;border-radius:8px;font-size:13px;font-family:'Georgia',serif;transition:all .15s}.wtab.on{background:#3d7a52;color:#fff}.wtab:not(.on){color:#7aaa80}.wtab:not(.on):hover{background:rgba(61,122,82,0.2)}`}</style>

      {/* Header trabajador */}
      <div style={{background:"rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(160,200,140,0.15)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#3d7a52,#1a4a2e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
            {trabajador.nombre[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{trabajador.nombre}</div>
            <div style={{fontSize:11,color:"#6aaa7a"}}>{trabajador.cargo||"Jardinero"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="date" value={fechaVer} onChange={e=>setFechaVer(e.target.value)}
            style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"6px 10px",fontFamily:"'Georgia',serif",fontSize:13,outline:"none"}}/>
        </div>
      </div>

      <div style={{padding:"20px 16px"}}>
        {/* Progreso del día */}
        {stats.total > 0 && (
          <div style={{background:"rgba(255,255,255,0.055)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:14,padding:"14px 18px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:14,color:"#a0c8a0"}}>Mi progreso — {fechaVer===hoy?"hoy":fechaVer}</span>
              <span style={{fontSize:14,fontWeight:700,color:pct===100?"#22c55e":pct>50?"#4ade80":"#f59e0b"}}>{pct}%</span>
            </div>
            <div style={{background:"rgba(255,255,255,0.07)",borderRadius:6,height:10,overflow:"hidden",marginBottom:8}}>
              <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#22c55e":"#3b82f6",borderRadius:6,transition:"width .4s"}}/>
            </div>
            <div style={{display:"flex",gap:14,fontSize:12,color:"#6aaa7a"}}>
              <span>📋 {stats.total} tareas</span>
              <span style={{color:"#22c55e"}}>✅ {stats.hechas} hechas</span>
              {stats.noPudo>0&&<span style={{color:"#ef4444"}}>❌ {stats.noPudo} no pudieron</span>}
            </div>
          </div>
        )}

        {/* Nueva tarea emergente */}
        {fechaVer===hoy && (
          <div style={{marginBottom:16}}>
            {!showNuevaTareaEmerg ? (
              <button onClick={()=>setShowNuevaTareaEmerg(true)}
                style={{width:"100%",cursor:"pointer",border:"1px dashed rgba(61,122,82,0.4)",borderRadius:12,padding:"10px",background:"rgba(61,122,82,0.08)",color:"#6aaa7a",fontFamily:"'Georgia',serif",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ➕ Agregar tarea emergente del turno
              </button>
            ) : (
              <div style={{background:"rgba(255,255,255,0.055)",border:"1px solid rgba(61,122,82,0.3)",borderRadius:14,padding:16}} className="ein">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#90d4a0"}}>🆕 Nueva Tarea del Turno</div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
                  {/* 1. Zona */}
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ZONA</label>
                    <select style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"8px 12px",fontFamily:"'Georgia',serif",fontSize:14,width:"100%",outline:"none"}}
                      value={nuevaTareaEmerg.zona} onChange={e=>setNuevaTareaEmerg(p=>({...p,zona:e.target.value,tarea:""}))}>
                      <option value="">Seleccionar zona...</option>
                      {[...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=>(
                        <option key={z.id} value={z.nombre}>{z.icono} {z.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {/* 2. Tarea — solo muestra si hay zona seleccionada */}
                  {nuevaTareaEmerg.zona && (
                    <div>
                      <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TAREA</label>
                      {getTareasDeZona(nuevaTareaEmerg.zona).length===0 ? (
                        <div style={{fontSize:12,color:"#f59e0b",padding:"8px 12px",background:"rgba(245,158,11,0.1)",borderRadius:8,border:"1px solid rgba(245,158,11,0.2)"}}>
                          ⚠️ Esta zona no tiene tareas definidas en sus elementos. Defínelas primero en la sección de Frecuencias de cada elemento.
                        </div>
                      ) : (
                        <select style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"8px 12px",fontFamily:"'Georgia',serif",fontSize:14,width:"100%",outline:"none"}}
                          value={nuevaTareaEmerg.tarea} onChange={e=>setNuevaTareaEmerg(p=>({...p,tarea:e.target.value}))}>
                          <option value="">Seleccionar tarea...</option>
                          {getTareasDeZona(nuevaTareaEmerg.zona).map(t=>(
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  {/* 3. Observaciones */}
                  {nuevaTareaEmerg.tarea && (
                    <div>
                      <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>OBSERVACIONES (opcional)</label>
                      <textarea rows={2} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"8px 12px",fontFamily:"'Georgia',serif",fontSize:13,width:"100%",outline:"none",resize:"vertical"}}
                        value={nuevaTareaEmerg.notas} onChange={e=>setNuevaTareaEmerg(p=>({...p,notas:e.target.value}))}/>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{
                    if(!nuevaTareaEmerg.zona||!nuevaTareaEmerg.tarea) return;
                    onAddTarea({
                      id: Date.now()+Math.random(),
                      fecha: fechaVer,
                      zona: nuevaTareaEmerg.zona,
                      elemento: "",
                      tarea: nuevaTareaEmerg.tarea,
                      responsable: trabajador.nombre,
                      estado: "haciendose",
                      notas: nuevaTareaEmerg.notas,
                      notaWorker: "",
                      emergente: true,
                    });
                    setNuevaTareaEmerg({zona:"",tarea:"",notas:""});
                    setShowNuevaTareaEmerg(false);
                  }} style={{cursor:"pointer",border:"none",borderRadius:8,padding:"8px 18px",background:"#3d7a52",color:"#fff",fontFamily:"'Georgia',serif",fontSize:14}}>
                    ✓ Registrar
                  </button>
                  <button onClick={()=>{setShowNuevaTareaEmerg(false);setNuevaTareaEmerg({zona:"",tarea:"",notas:""});}}
                    style={{cursor:"pointer",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"8px 18px",background:"transparent",color:"#a0c8a0",fontFamily:"'Georgia',serif",fontSize:14}}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sin tareas */}
        {misTargets.length===0 && (
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:32,textAlign:"center",color:"#4a8a5a"}}>
            <div style={{fontSize:36,marginBottom:10}}>🌿</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:6}}>Sin tareas asignadas</div>
            <div style={{fontSize:13,marginBottom:12}}>No hay tareas para este día o aún no han sido asignadas.</div>
            {(tareas[fechaVer]||[]).length > 0 && (
              <div style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 14px",textAlign:"left",fontSize:12,color:"#6aaa7a"}}>
                <div style={{marginBottom:6,fontWeight:600}}>Tareas del día ({(tareas[fechaVer]||[]).length} total):</div>
                {(tareas[fechaVer]||[]).slice(0,5).map((t,i)=>(
                  <div key={i} style={{padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                    <span style={{color:normalizar(t.responsable)===normalizar(trabajador.nombre)?"#22c55e":"#ef4444"}}>
                      {normalizar(t.responsable)===normalizar(trabajador.nombre)?"✓":"✗"}
                    </span>
                    {" "}{t.tarea} — <span style={{color:"#94a3b8"}}>"{t.responsable||"sin asignar"}"</span>
                  </div>
                ))}
                {(tareas[fechaVer]||[]).length > 5 && <div style={{marginTop:4,color:"#5a7a6a"}}>...y {(tareas[fechaVer]||[]).length-5} más</div>}
                <div style={{marginTop:8,fontSize:11,color:"#4a6a5a"}}>Tu nombre registrado: <b style={{color:"#a0c8a0"}}>"{trabajador.nombre}"</b></div>
              </div>
            )}
          </div>
        )}

        {/* Lista de tareas */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {misTargets.map(t=>{
            const est = ESTADOS_TAREA[t.estado]||ESTADOS_TAREA.pendiente;
            const esAgua = esRiegoOCorte(t.tarea);
            return (
              <div key={t.id} style={{background:"rgba(255,255,255,0.055)",border:`1px solid rgba(255,255,255,0.10)`,borderRadius:14,borderLeft:`4px solid ${est.color}`,padding:"16px 16px",opacity:t.estado==="hecha"||t.estado==="no_pudo"?0.75:1}}>
                {/* Info tarea */}
                <div style={{marginBottom:12}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:4}}>{t.tarea}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#5a8a6a",background:"rgba(255,255,255,0.06)",padding:"2px 8px",borderRadius:10}}>{MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||"📍"} {t.zona}</span>
                    {t.elemento&&<span style={{fontSize:12,color:"#4a7a6a",background:"rgba(255,255,255,0.04)",padding:"2px 8px",borderRadius:10}}>{t.elemento}</span>}
                  </div>
                  {t.notaWorker&&<div style={{fontSize:12,color:"#7aaa80",marginTop:6,fontStyle:"italic",padding:"6px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>{t.notaWorker}</div>}
                </div>

                {/* Botones de estado */}
                {t.estado!=="hecha" && t.estado!=="no_pudo" && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom: esAgua?"10px":"0"}}>
                    <button onClick={()=>onUpdateTarea(fechaVer,t.id,{estado:"haciendose"})}
                      style={{flex:1,minWidth:100,cursor:"pointer",border:"none",borderRadius:10,padding:"10px 8px",background:t.estado==="haciendose"?"rgba(59,130,246,0.3)":"rgba(255,255,255,0.07)",color:t.estado==="haciendose"?"#93c5fd":"#a0c8a0",fontFamily:"'Georgia',serif",fontSize:13,transition:"all .15s"}}>
                      🔵 Haciéndose
                    </button>
                    <button onClick={()=>onUpdateTarea(fechaVer,t.id,{estado:"hecha",notaWorker:""})}
                      style={{flex:1,minWidth:100,cursor:"pointer",border:"none",borderRadius:10,padding:"10px 8px",background:"rgba(34,197,94,0.15)",color:"#86efac",fontFamily:"'Georgia',serif",fontSize:13,transition:"all .15s"}}>
                      ✅ Hecha
                    </button>
                    <button onClick={()=>onUpdateTarea(fechaVer,t.id,{estado:"no_pudo",notaWorker:""})}
                      style={{flex:1,minWidth:100,cursor:"pointer",border:"none",borderRadius:10,padding:"10px 8px",background:"rgba(239,68,68,0.12)",color:"#fca5a5",fontFamily:"'Georgia',serif",fontSize:13,transition:"all .15s"}}>
                      ❌ No se pudo
                    </button>
                  </div>
                )}

                {/* Húmedo — solo riego/corte */}
                {esAgua && t.estado!=="hecha" && t.estado!=="no_pudo" && (
                  <button onClick={()=>handleHumedad(t)}
                    style={{width:"100%",cursor:"pointer",border:"1px solid rgba(96,165,250,0.3)",borderRadius:10,padding:"9px 8px",background:"rgba(96,165,250,0.08)",color:"#93c5fd",fontFamily:"'Georgia',serif",fontSize:13,marginBottom:0}}>
                    💧 Terreno húmedo — omitir y postponer 2 días
                  </button>
                )}

                {/* Razón si no se pudo */}
                {t.estado==="no_pudo" && (
                  <div style={{marginTop:8}}>
                    <textarea
                      rows={2}
                      placeholder="¿Por qué no se pudo? (obligatorio)"
                      value={t.notaWorker||""}
                      onChange={e=>onUpdateTarea(fechaVer,t.id,{notaWorker:e.target.value})}
                      style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,color:"#fca5a5",padding:"8px 10px",fontFamily:"'Georgia',serif",fontSize:13,width:"100%",resize:"vertical",outline:"none"}}
                    />
                    <button onClick={()=>onUpdateTarea(fechaVer,t.id,{estado:"pendiente"})}
                      style={{marginTop:6,cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 12px",background:"transparent",color:"#7aaa80",fontFamily:"'Georgia',serif",fontSize:12}}>
                      ← Volver a pendiente
                    </button>
                  </div>
                )}

                {/* Reabrir si ya está hecha */}
                {(t.estado==="hecha"||t.estado==="no_pudo") && (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:12,color:est.color,fontWeight:600}}>{est.icon} {est.label}</span>
                    <button onClick={()=>onUpdateTarea(fechaVer,t.id,{estado:"pendiente",notaWorker:"",humedad:false})}
                      style={{cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 10px",background:"transparent",color:"#6aaa7a",fontFamily:"'Georgia',serif",fontSize:11}}>
                      ↩ Reabrir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProgramacionDiaria({ S, zonas, data, personal, getZD, getAllElems, MACROZONAS_BASE, tareas, setTareas, tareasZonaHoy=0, esJefa=false }) {
  const hoy = new Date().toISOString().slice(0,10);
  const [fecha, setFecha] = React.useState(hoy);
  const [tabProg, setTabProg] = React.useState("programa");
  const [showAgregar, setShowAgregar] = React.useState(false);
  const [nuevaTarea, setNuevaTarea] = React.useState({ zona:"", elemento:"", tarea:"", responsable:"", estado:"por_designar", notas:"" });
  const [filtroEstado, setFiltroEstado] = React.useState("todos");
  const [filtroZona, setFiltroZona] = React.useState("todas");
  const [aviso, setAviso] = React.useState(null);

  const esDomingo = (f) => new Date(f + "T12:00:00").getDay() === 0;
  const getTareasDelDia = (f) => tareas[f] || [];
  const setTareasDelDia = (f, arr) => setTareas(p => ({ ...p, [f]: arr }));
  const addTarea = (t) => {
    setTareasDelDia(fecha, [...getTareasDelDia(fecha), { ...t, id: Date.now(), fecha }]);
    if (esDomingo(fecha)) setAviso("⚠️ El día seleccionado es domingo. Considera mover esta tarea a otro día.");
  };
  const updateTarea = (id, patch) => setTareasDelDia(fecha, getTareasDelDia(fecha).map(t => t.id===id ? {...t,...patch} : t));
  const deleteTarea = (id) => setTareasDelDia(fecha, getTareasDelDia(fecha).filter(t => t.id!==id));

  const proponerTareas = () => {
    const estacionDelDia = (f) => {
      const m = new Date(f).getMonth() + 1;
      if([12,1,2].includes(m)) return "verano";
      if([3,4,5].includes(m)) return "otono";
      if([6,7,8].includes(m)) return "invierno";
      return "primavera";
    };
    const est = estacionDelDia(fecha);
    const propuestas = [];
    const existentes = getTareasDelDia(fecha).map(t => t.zona+"_"+t.elemento+"_"+t.tarea);
    MACROZONAS_BASE.forEach(z => {
      const zdat = getZD(z.id);
      const elems = getAllElems(z.id);
      elems.forEach(e => {
        const zdatElem = zdat.elementos?.[e.id] || (zdat.elementosCustom||[]).find(x=>x.id===e.id);
        const frecs = zdatElem?.frecuencias || [];
        if(frecs.length===0) return; // solo proponer si hay frecuencias definidas manualmente
        frecs.forEach(f => {
          const frecVal = f[est];
          if(!frecVal || frecVal==="noaplica" || frecVal==="unavez" || frecVal==="segunecesidad") return;
          const key = z.nombre+"_"+e.nombre+"_"+f.tarea;
          if(existentes.includes(key)) return;
          propuestas.push({ id: Date.now()+Math.random(), fecha, zona:z.nombre, elemento:e.nombre, tarea:f.tarea, responsable:"", estado:"por_designar", notas:f.obs||"", frecuencia:frecVal, estacion:est, auto:true });
        });
      });
    });
    if(propuestas.length===0) return alert("No hay tareas nuevas que proponer para esta fecha.");
    setTareasDelDia(fecha, [...getTareasDelDia(fecha), ...propuestas]);
    if(esDomingo(fecha)) setAviso("⚠️ El día seleccionado es domingo. Las tareas fueron cargadas igual, pero considera mover la programación a otro día.");
  };

  const ESTADOS_TAREA = {
    por_designar: { label:"Por designar", color:"#94a3b8", bg:"rgba(148,163,184,0.12)", icon:"⬜" },
    pendiente:    { label:"Pendiente",    color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  icon:"🟡" },
    en_curso:     { label:"En curso",     color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  icon:"🔵" },
    completada:   { label:"Completada",   color:"#22c55e", bg:"rgba(34,197,94,0.12)",   icon:"🟢" },
    cancelada:    { label:"Cancelada",    color:"#ef4444", bg:"rgba(239,68,68,0.12)",   icon:"🔴" },
  };

  const tareasHoy = getTareasDelDia(fecha);
  const filtradas = tareasHoy.filter(t => {
    const mE = filtroEstado==="todos" || t.estado===filtroEstado;
    const mZ = filtroZona==="todas" || t.zona===filtroZona;
    return mE && mZ;
  });
  const stats = {
    total: tareasHoy.length,
    completadas: tareasHoy.filter(t=>t.estado==="completada"||t.estado==="hecha").length,
    pendientes: tareasHoy.filter(t=>["pendiente","en_curso","haciendose"].includes(t.estado)).length,
    porDesignar: tareasHoy.filter(t=>t.estado==="por_designar").length,
  };
  const pct = stats.total > 0 ? Math.round((stats.completadas/stats.total)*100) : 0;
  const zonasEnProg = [...new Set(tareasHoy.map(t=>t.zona))].sort();
  const porZona = {};
  filtradas.forEach(t => { if(!porZona[t.zona]) porZona[t.zona]=[]; porZona[t.zona].push(t); });

  return (
    <div className="ein">
      {/* Cabecera */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:3}}>Programación Diaria</h1>
          <p style={{color:"#6aaa7a",fontSize:14}}>Asignación y seguimiento de tareas por día</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <input type="date" value={fecha} onChange={e=>{
              setFecha(e.target.value);
              if(esDomingo(e.target.value)) setAviso("⚠️ El día seleccionado es domingo. Considera usar un día hábil.");
              else if(e.target.value<=hoy) setAviso("ℹ️ Estás programando para hoy o una fecha pasada. Recuerda que lo ideal es programar con al menos un día de anticipación.");
              else setAviso(null);
            }}
            style={{...S.input,width:"auto",fontSize:13}}/>
          <button onClick={proponerTareas} style={{...S.btn,background:"rgba(59,130,246,0.2)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",fontSize:13}}>✨ Proponer del día</button>
          <button onClick={()=>setShowAgregar(true)} style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)",fontSize:13}}>➕ Agregar tarea</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["programa","📆 Programar"],["historial","📜 Historial"]].map(([t,l])=>(
          <button key={t} className={`tab${tabProg===t?" on":""}`} onClick={()=>setTabProg(t)}>{l}</button>
        ))}
      </div>

      {/* ── HISTORIAL ── */}
      {tabProg==="historial" && (
        <HistorialProg tareas={tareas} setTareas={setTareas} MACROZONAS_BASE={MACROZONAS_BASE} S={S} esJefa={esJefa}/>
      )}

      {/* ── PROGRAMAR ── */}
      {tabProg==="programa" && (
        <>
          {aviso && (
            <div style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"start",gap:10}}>
              <div>
                <div style={{fontSize:14,color:"#fcd34d",fontWeight:600,marginBottom:4}}>{aviso}</div>
                <div style={{fontSize:12,color:"#a08040"}}>Cambia la fecha y reagenda las tareas en el día hábil que corresponda.</div>
              </div>
              <button onClick={()=>setAviso(null)} style={{background:"transparent",border:"none",color:"#a08040",cursor:"pointer",fontSize:18,lineHeight:1,flexShrink:0}}>✕</button>
            </div>
          )}
          {tareasZonaHoy>0 && fecha!==hoy && (
            <div style={{background:"rgba(192,132,252,0.1)",border:"1px solid rgba(192,132,252,0.3)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,color:"#c084fc"}}>
                📍 <b>{tareasZonaHoy} tarea{tareasZonaHoy>1?"s":""} nueva{tareasZonaHoy>1?"s":""}</b> agregada{tareasZonaHoy>1?"s":""} desde macrozonas esperan asignación en el día de hoy.
              </div>
              <button onClick={()=>setFecha(hoy)} style={{...S.btn,background:"rgba(192,132,252,0.2)",color:"#c084fc",border:"1px solid rgba(192,132,252,0.3)",fontSize:12,flexShrink:0,padding:"6px 12px"}}>
                Ir a hoy →
              </button>
            </div>
          )}

          {stats.total > 0 && (
            <div style={{...S.card,padding:"14px 18px",marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                  <span style={{fontSize:13}}><b style={{color:"#c0dac0"}}>{stats.total}</b> <span style={{color:"#6aaa7a"}}>tareas</span></span>
                  <span style={{fontSize:13}}><b style={{color:"#22c55e"}}>{stats.completadas}</b> <span style={{color:"#6aaa7a"}}>completadas</span></span>
                  <span style={{fontSize:13}}><b style={{color:"#3b82f6"}}>{stats.pendientes}</b> <span style={{color:"#6aaa7a"}}>en curso/pend.</span></span>
                  <span style={{fontSize:13}}><b style={{color:"#94a3b8"}}>{stats.porDesignar}</b> <span style={{color:"#6aaa7a"}}>por designar</span></span>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:pct===100?"#22c55e":pct>50?"#f59e0b":"#94a3b8"}}>{pct}%</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.07)",borderRadius:6,height:8,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#22c55e":pct>50?"#4ade80":"#3b82f6",borderRadius:6,transition:"width .4s"}}/>
              </div>
            </div>
          )}

          {stats.total > 0 && (
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)} style={{...S.input,flex:"1 1 130px",maxWidth:180,fontSize:13}}>
                <option value="todos">Todos los estados</option>
                {Object.entries(ESTADOS_TAREA).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <select value={filtroZona} onChange={e=>setFiltroZona(e.target.value)} style={{...S.input,flex:"1 1 160px",maxWidth:220,fontSize:13}}>
                <option value="todas">Todas las zonas</option>
                {zonasEnProg.map(z=><option key={z} value={z}>{z}</option>)}
              </select>
              {(filtroEstado!=="todos"||filtroZona!=="todas")&&(
                <button onClick={()=>{setFiltroEstado("todos");setFiltroZona("todas");}} style={{...S.btn,background:"transparent",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)",fontSize:12}}>✕ Limpiar</button>
              )}
            </div>
          )}

          {showAgregar && (
            <div style={{...S.card,padding:18,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14}}>Nueva Tarea — {fecha}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>MACROZONA</label>
                  <select style={{...S.input,fontSize:13}} value={nuevaTarea.zona} onChange={e=>setNuevaTarea(p=>({...p,zona:e.target.value,elemento:""}))}>
                    <option value="">Seleccionar zona...</option>
                    {[...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=>(
                      <option key={z.id} value={z.nombre}>{z.icono} {z.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ELEMENTO</label>
                  <input style={{...S.input,fontSize:13}} placeholder="Ej: Maceteros colgantes..." value={nuevaTarea.elemento} onChange={e=>setNuevaTarea(p=>({...p,elemento:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TAREA</label>
                  <input style={{...S.input,fontSize:13}} placeholder="Ej: Riego, Poda de limpieza..." value={nuevaTarea.tarea} onChange={e=>setNuevaTarea(p=>({...p,tarea:e.target.value}))}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>RESPONSABLE</label>
                  <ResponsableSelector
                    value={nuevaTarea.responsable}
                    personal={personal}
                    onChange={v=>setNuevaTarea(p=>({...p,responsable:v,estado:v?"pendiente":"por_designar"}))}
                    S={S}
                    fontSize={13}
                  />
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
                  <select style={{...S.input,fontSize:13}} value={nuevaTarea.estado} onChange={e=>setNuevaTarea(p=>({...p,estado:e.target.value}))}>
                    {Object.entries(ESTADOS_TAREA).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NOTAS</label>
                  <textarea rows={2} style={{...S.input,resize:"vertical",fontSize:13}} value={nuevaTarea.notas} onChange={e=>setNuevaTarea(p=>({...p,notas:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={()=>{
                  if(!nuevaTarea.zona||!nuevaTarea.tarea) return;
                  addTarea(nuevaTarea);
                  setNuevaTarea({zona:"",elemento:"",tarea:"",responsable:"",estado:"por_designar",notas:""});
                  setShowAgregar(false);
                }}>✓ Agregar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowAgregar(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {tareasHoy.length===0 && (
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:40,marginBottom:12}}>📆</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,marginBottom:8}}>Sin tareas para este día</div>
              <div style={{fontSize:13,marginBottom:16}}>Usa <b style={{color:"#93c5fd"}}>✨ Proponer del día</b> para generar automáticamente, o agrega tareas manualmente.</div>
            </div>
          )}

          {Object.entries(porZona).sort(([a],[b])=>a.localeCompare(b,"es")).map(([zona,tz])=>(
            <div key={zona} style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:6,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{MACROZONAS_BASE.find(z=>z.nombre===zona)?.icono||"📍"} {zona}</span>
                <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,background:"rgba(255,255,255,0.07)",color:"#7aaa80"}}>{tz.length}</span>
                <span style={{fontSize:11,color:"#22c55e"}}>{tz.filter(t=>["hecha","completada"].includes(t.estado)).length} ✓</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {tz.map(t=>{
                  const est=ESTADOS_TAREA[t.estado]||ESTADOS_TAREA.por_designar;
                  return (
                    <div key={t.id} style={{...S.card,padding:"12px 14px",borderLeft:`3px solid ${est.color}`,opacity:t.estado==="cancelada"?0.5:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                            <span style={{fontSize:14,fontWeight:600}}>{t.tarea}</span>
                            {t.elemento&&<span style={{fontSize:11,color:"#5a8a6a",background:"rgba(255,255,255,0.06)",padding:"1px 7px",borderRadius:10}}>{t.elemento}</span>}
                            {t.auto&&<span style={{fontSize:10,color:"#4a8a7a",background:"rgba(59,130,246,0.1)",padding:"1px 6px",borderRadius:10,border:"1px solid rgba(59,130,246,0.2)"}}>auto</span>}
                            {t.origenZona&&<span style={{fontSize:10,color:"#c084fc",background:"rgba(192,132,252,0.1)",padding:"1px 6px",borderRadius:10,border:"1px solid rgba(192,132,252,0.2)"}}>📍 zona</span>}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:"#5a8a6a"}}>👤</span>
                            <ResponsableSelector
                              value={t.responsable||""}
                              personal={personal}
                              onChange={v=>updateTarea(t.id,{responsable:v,estado:v&&t.estado==="por_designar"?"pendiente":t.estado})}
                              S={S}
                              inline={true}
                            />
                          </div>
                          {t.notas&&<div style={{fontSize:11,color:"#5a8a6a",marginTop:3,fontStyle:"italic"}}>{t.notas}</div>}
                          {t.notaWorker&&<div style={{fontSize:11,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",marginTop:3,fontStyle:"italic",padding:"4px 8px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>{t.estado==="no_pudo"?"⚠️ ":""}{t.notaWorker}</div>}
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
                          <select value={t.estado} onChange={e=>updateTarea(t.id,{estado:e.target.value})}
                            style={{background:est.bg,border:`1px solid ${est.color}40`,borderRadius:7,color:est.color,padding:"4px 7px",fontFamily:"'Georgia',serif",fontSize:12,outline:"none",cursor:"pointer"}}>
                            {Object.entries(ESTADOS_TAREA).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                          </select>
                          <button onClick={()=>deleteTarea(t.id)} style={{background:"transparent",border:"none",color:"#7a5a5a",cursor:"pointer",fontSize:14,padding:"3px 5px"}}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── CONFIGURADOR DE PIN POR ROL ─────────────────────────────────────────────
function PinConfig({ getPines, setPinRol, S }) {
  const [open, setOpen] = React.useState(false);
  const [editRol, setEditRol] = React.useState("jefa");
  const [pin1, setPin1] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [pines, setPines] = React.useState(getPines);

  const guardar = () => {
    if(pin1.length!==4){setMsg("El PIN debe tener 4 dígitos.");return;}
    if(pin1!==pin2){setMsg("Los PINs no coinciden.");return;}
    setPinRol(editRol, pin1);
    setPines(getPines()); // re-read to update UI
    setPin1(""); setPin2("");
    setMsg("✅ PIN guardado correctamente.");
    setTimeout(()=>setMsg(""),3000);
  };

  return (
    <div style={{marginTop:20}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{...S.btn,background:"transparent",color:"#5a8a6a",border:"1px solid rgba(255,255,255,0.08)",fontSize:12,width:"100%"}}>
        ⚙️ {open?"Ocultar":"Configurar"} PINs de Jefa / Supervisor
      </button>
      {open&&(
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:18,marginTop:10}} className="ein">
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ROL</label>
            <div style={{display:"flex",gap:6}}>
              {[["jefa","🌿 Jefa AV"],["supervisor","🎯 Supervisor"]].map(([r,l])=>(
                <button key={r} onClick={()=>{setEditRol(r);setPin1("");setPin2("");setMsg("");}}
                  style={{flex:1,cursor:"pointer",border:`1px solid ${editRol===r?"rgba(61,122,82,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:8,padding:"7px 4px",background:editRol===r?"rgba(61,122,82,0.2)":"transparent",color:editRol===r?"#90d0a0":"#7aaa80",fontFamily:"'Georgia',serif",fontSize:12}}>
                  {l} {pines[r]?"🔒":"❌"}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NUEVO PIN</label>
              <input type="password" maxLength={4} placeholder="••••" value={pin1} onChange={e=>setPin1(e.target.value)}
                style={{...S.input,fontSize:18,letterSpacing:"0.5em",textAlign:"center"}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>CONFIRMAR</label>
              <input type="password" maxLength={4} placeholder="••••" value={pin2} onChange={e=>setPin2(e.target.value)}
                style={{...S.input,fontSize:18,letterSpacing:"0.5em",textAlign:"center"}}/>
            </div>
          </div>
          {msg&&<div style={{fontSize:12,color:msg.startsWith("✅")?"#86efac":"#fca5a5",marginBottom:8,textAlign:"center"}}>{msg}</div>}
          <button onClick={guardar} style={{...S.btn,background:"#3d7a52",color:"#fff",width:"100%",fontSize:13}}>💾 Guardar PIN</button>
        </div>
      )}
    </div>
  );
}

// ─── VISTA DESIGNACIÓN (SUPERVISOR) ─────────────────────────────────────────
function VistaDesignacion({ S, tareasProg, setTareasProg, personal, MACROZONAS_BASE, onSalir }) {
  const hoy = new Date().toISOString().slice(0,10);
  const [fecha, setFecha] = React.useState(hoy);
  const [showAgregar, setShowAgregar] = React.useState(false);
  const [nuevaTarea, setNuevaTarea] = React.useState({ zona:"", tarea:"", elemento:"" });
  const [expandida, setExpandida] = React.useState(null); // tid expanded
  const [cancelando, setCancelando] = React.useState(null); // tid being cancelled
  const [motivoCancelacion, setMotivoCancelacion] = React.useState("");

  const tareasDelDia = [...(tareasProg[fecha]||[])].sort((a,b)=>(a.zona||"").localeCompare(b.zona||"","es",{sensitivity:"base"}));
  const sinAsignar = tareasDelDia.filter(t=>t.estado==="por_designar");
  const asignadas  = tareasDelDia.filter(t=>t.estado!=="por_designar");

  const setDia = (arr) => setTareasProg(prev=>({...prev,[fecha]:arr}));

  const asignar = (tid, responsable) => {
    setDia((tareasProg[fecha]||[]).map(t=>
      t.id===tid ? {...t, responsable, estado: responsable?"pendiente":"por_designar"} : t
    ));
  };

  const iniciarCancelacion = (tid) => {
    setCancelando(tid);
    setMotivoCancelacion("");
    setExpandida(null);
  };
  const confirmarCancelacion = (tid) => {
    if(!motivoCancelacion.trim()) return;
    setDia((tareasProg[fecha]||[]).map(t=>
      t.id===tid ? {...t, estado:"cancelada", notaSuper:motivoCancelacion, responsable:""} : t
    ));
    setCancelando(null);
    setMotivoCancelacion("");
  };

  const agregarTarea = () => {
    if(!nuevaTarea.zona||!nuevaTarea.tarea) return;
    const nueva = {
      id: Date.now()+Math.random(), fecha,
      zona: nuevaTarea.zona, elemento: nuevaTarea.elemento,
      tarea: nuevaTarea.tarea, responsable:"", estado:"por_designar",
      notas:"", supervisorAgregada: true,
    };
    setDia([...(tareasProg[fecha]||[]), nueva]);
    setNuevaTarea({zona:"",tarea:"",elemento:""});
    setShowAgregar(false);
  };

  const getTareasZona = (nombreZona) => {
    const zona = MACROZONAS_BASE.find(z=>z.nombre===nombreZona);
    if(!zona) return [];
    const set = new Set();
    zona.elementos.forEach(e=>{(TAREAS_DEFAULT[e.tipo]||[]).forEach(f=>{if(f.tarea)set.add(f.tarea);});});
    return [...set].sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
  };

  const listaPersonal = [...personal]
    .filter(p=>p.cargo!=="Jefa de Áreas Verdes")
    .sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  const EICO={hecha:"✅",completada:"✅",no_pudo:"🔴",haciendose:"🔵",en_curso:"🔵",pendiente:"🟡",por_designar:"⬜",cancelada:"❌"};

  const renderTarea = (t, resaltada=false) => {
    const icono=MACROZONAS_BASE.find(z=>z.nombre===t.zona)?.icono||"📍";
    const yaFinalizada = ["hecha","completada","no_pudo"].includes(t.estado);
    const cancelada = t.estado==="cancelada";
    const esCancelando = cancelando===t.id;
    const estaExpandida = expandida===t.id;

    return (
      <div key={t.id}>
        {/* Tarjeta principal — clic para expandir */}
        <div onClick={()=>{if(!esCancelando)setExpandida(estaExpandida?null:t.id);}}
          style={{background:resaltada?"rgba(255,255,255,0.065)":"rgba(255,255,255,0.04)",border:`1px solid ${cancelada?"rgba(239,68,68,0.2)":resaltada?"rgba(245,158,11,0.3)":estaExpandida?"rgba(61,122,82,0.35)":"rgba(255,255,255,0.08)"}`,borderRadius:estaExpandida?"12px 12px 0 0":12,padding:"11px 14px",cursor:"pointer",opacity:cancelada?0.5:1,transition:"border-color .15s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>
                {EICO[t.estado]||"🟡"} {t.tarea}
                {t.supervisorAgregada&&<span style={{fontSize:10,color:"#f59e0b",background:"rgba(245,158,11,0.1)",padding:"1px 5px",borderRadius:6,border:"1px solid rgba(245,158,11,0.2)",marginLeft:5}}>+sup</span>}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#5a8a6a"}}>{icono} {t.zona}</span>
                {t.elemento&&<span style={{fontSize:11,color:"#4a7a6a"}}>{t.elemento}</span>}
                {t.responsable
                  ? <span style={{fontSize:11,color:"#86c4a0"}}>👤 <b>{t.responsable}</b></span>
                  : <span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Sin asignar</span>}
              </div>
              {cancelada&&t.notaSuper&&<div style={{fontSize:11,color:"#fca5a5",marginTop:3,fontStyle:"italic"}}>❌ {t.notaSuper}</div>}
            </div>
            <span style={{color:"#5a8a6a",fontSize:12,flexShrink:0}}>{estaExpandida?"▲":"▼"}</span>
          </div>
        </div>

        {/* Panel expandido */}
        {estaExpandida&&!esCancelando&&(
          <div style={{background:"rgba(61,122,82,0.06)",border:"1px solid rgba(61,122,82,0.25)",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
            {/* Asignar/reasignar */}
            {!yaFinalizada&&!cancelada&&(
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>RESPONSABLE</label>
                <select value={t.responsable||""} onChange={e=>asignar(t.id,e.target.value)}
                  style={{...S.input,fontSize:13,background:t.responsable?"rgba(61,122,82,0.2)":"rgba(148,163,184,0.1)",color:t.responsable?"#c0e0c0":"#94a3b8",border:`1px solid ${t.responsable?"rgba(61,122,82,0.4)":"rgba(148,163,184,0.3)"}`}}>
                  <option value="">{t.responsable?"↺ Reasignar...":"👤 Seleccionar responsable..."}</option>
                  {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}{p.cargo?" · "+p.cargo:""}</option>)}
                </select>
              </div>
            )}
            {/* Info adicional */}
            {t.notas&&<div style={{fontSize:12,color:"#6a9a8a",marginBottom:8,fontStyle:"italic"}}>📝 {t.notas}</div>}
            {t.notaWorker&&<div style={{fontSize:12,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",marginBottom:8,fontStyle:"italic"}}>{t.estado==="no_pudo"?"⚠️":"💬"} {t.notaWorker}</div>}
            {/* Cancelar */}
            {!yaFinalizada&&!cancelada&&(
              <button onClick={()=>iniciarCancelacion(t.id)}
                style={{...S.btn,background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)",fontSize:12,padding:"5px 12px"}}>
                🗑 Cancelar tarea
              </button>
            )}
          </div>
        )}

        {/* Modal cancelación — justificación */}
        {esCancelando&&(
          <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",borderTop:"none",borderRadius:"0 0 12px 12px",padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:13,color:"#fca5a5",fontWeight:600,marginBottom:8}}>❌ Cancelar: {t.tarea}</div>
            <label style={{fontSize:11,color:"#9a7a7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>MOTIVO DE CANCELACIÓN (obligatorio)</label>
            <textarea rows={2} autoFocus
              placeholder="Ej: Se posterga por lluvia, insumos insuficientes..."
              value={motivoCancelacion} onChange={e=>setMotivoCancelacion(e.target.value)}
              style={{...S.input,fontSize:13,resize:"vertical",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>confirmarCancelacion(t.id)}
                disabled={!motivoCancelacion.trim()}
                style={{...S.btn,background:motivoCancelacion.trim()?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.05)",color:motivoCancelacion.trim()?"#fca5a5":"#5a6a5a",border:"1px solid rgba(239,68,68,0.3)",fontSize:13,cursor:motivoCancelacion.trim()?"pointer":"default"}}>
                Confirmar cancelación
              </button>
              <button onClick={()=>{setCancelando(null);setMotivoCancelacion("");}}
                style={{...S.btn,background:"transparent",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)",fontSize:13}}>
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#0a1f10 0%,#122d1a 100%)",color:"#ede9e0",fontFamily:"'Georgia',serif",paddingBottom:40}}>
      {/* Header */}
      <div style={{background:"rgba(0,0,0,0.45)",borderBottom:"1px solid rgba(160,200,140,0.15)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#1a3a8e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎯</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>Supervisor · Designación</div>
            <div style={{fontSize:11,color:"#6aaa7a"}}>Asigna, agrega o elimina tareas del día</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
            style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"6px 10px",fontFamily:"'Georgia',serif",fontSize:13,outline:"none"}}/>
          <button onClick={()=>setFecha(hoy)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#6aaa7a",padding:"5px 10px",fontFamily:"'Georgia',serif",fontSize:12,cursor:"pointer"}}>Hoy</button>
          <button onClick={onSalir} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,color:"#7aaa80",padding:"6px 12px",fontFamily:"'Georgia',serif",fontSize:13,cursor:"pointer"}}>← Salir</button>
        </div>
      </div>

      <div style={{padding:"16px 16px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[
            {label:"Sin designar",val:sinAsignar.length,color:"#94a3b8",icon:"⬜"},
            {label:"Asignadas",val:asignadas.length,color:"#22c55e",icon:"✅"},
            {label:"Total",val:tareasDelDia.length,color:"#a0c8a0",icon:"📋"},
            {label:"Completadas",val:tareasDelDia.filter(t=>["hecha","completada"].includes(t.estado)).length,color:"#4ade80",icon:"🏁"},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.055)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
              <div style={{fontSize:10,color:"#6aaa7a"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Agregar tarea */}
        <div style={{marginBottom:16}}>
          {!showAgregar ? (
            <button onClick={()=>setShowAgregar(true)}
              style={{width:"100%",cursor:"pointer",border:"1px dashed rgba(59,130,246,0.4)",borderRadius:10,padding:"10px",background:"rgba(59,130,246,0.06)",color:"#93c5fd",fontFamily:"'Georgia',serif",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              ➕ Agregar tarea al día
            </button>
          ) : (
            <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:12,padding:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#93c5fd"}}>➕ Nueva Tarea del Día</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ZONA</label>
                  <select style={{...S.input,fontSize:13}} value={nuevaTarea.zona}
                    onChange={e=>setNuevaTarea(p=>({...p,zona:e.target.value,tarea:"",elemento:""}))}>
                    <option value="">Seleccionar zona...</option>
                    {[...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=>(
                      <option key={z.id} value={z.nombre}>{z.icono} {z.nombre}</option>
                    ))}
                  </select>
                </div>
                {nuevaTarea.zona&&(
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TAREA</label>
                    {getTareasZona(nuevaTarea.zona).length===0 ? (
                      <div style={{fontSize:12,color:"#f59e0b",padding:"8px 12px",background:"rgba(245,158,11,0.08)",borderRadius:8}}>⚠️ Sin tareas definidas para esta zona.</div>
                    ) : (
                      <select style={{...S.input,fontSize:13}} value={nuevaTarea.tarea}
                        onChange={e=>setNuevaTarea(p=>({...p,tarea:e.target.value}))}>
                        <option value="">Seleccionar tarea...</option>
                        {getTareasZona(nuevaTarea.zona).map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={agregarTarea} style={{...S.btn,background:"#2563eb",color:"#fff",fontSize:13,padding:"8px 16px"}}>✓ Agregar</button>
                <button onClick={()=>{setShowAgregar(false);setNuevaTarea({zona:"",tarea:"",elemento:"",responsable:"",notas:"",estado:"por_designar"});}} style={{...S.btn,background:"transparent",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)",fontSize:13}}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {tareasDelDia.length===0&&(
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:36,textAlign:"center",color:"#4a8a5a"}}>
            <div style={{fontSize:36,marginBottom:10}}>📆</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:6}}>Sin tareas para este día</div>
            <div style={{fontSize:13}}>La jefa programa con anticipación. También puedes agregar tú arriba.</div>
          </div>
        )}

        {/* Asignadas primero */}
        {asignadas.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:10,color:"#86efac"}}>✅ Asignadas ({asignadas.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {asignadas.map(t=>renderTarea(t,false))}
            </div>
          </div>
        )}

        {/* Por designar al final */}
        {sinAsignar.length>0&&(
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:10,color:"#fcd34d"}}>⬜ Por Designar ({sinAsignar.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {sinAsignar.map(t=>renderTarea(t,true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GESTIÓN DE RECURSOS (BODEGA) ────────────────────────────────────────────
function GestionRecursos({ zonaId, S, personal, recursos, setRecursos, esJefa }) {
  const [subTab, setSubTab] = React.useState("maquinaria");
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [showMovimiento, setShowMovimiento] = React.useState(null); // id de material
  const [movForm, setMovForm] = React.useState({tipo:"entrada",cantidad:"",responsable:"",motivo:"",fecha:new Date().toISOString().slice(0,10)});

  const maquinaria  = recursos.maquinaria  || [];
  const herramientas= recursos.herramientas|| [];
  const materiales  = recursos.materiales  || [];

  const set = (key, arr) => setRecursos({...recursos,[key]:arr});

  // ── MAQUINARIA ──────────────────────────────────────────────────────────────
  const ESTADOS_MAQ = {
    operativo:    {label:"Operativo",      color:"#22c55e", bg:"rgba(34,197,94,0.12)"},
    mantencion:   {label:"En Mantención",  color:"#f59e0b", bg:"rgba(245,158,11,0.12)"},
    fuera:        {label:"Fuera de Servicio",color:"#ef4444",bg:"rgba(239,68,68,0.12)"},
  };
  const emptyMaq = {nombre:"",modelo:"",numeroSerie:"",estado:"operativo",ultimoServicio:"",proximoServicio:"",operador:"",horasUso:0,nivelAceite:"ok",filtroAire:"ok",filtroAceite:"ok",correa:"ok",obs:"",revisiones:[],reparaciones:[]};
  const [maqForm, setMaqForm] = React.useState(emptyMaq);

  const saveMaq = () => {
    if(!maqForm.nombre.trim()) return;
    if(editId) {
      set("maquinaria", maquinaria.map(m=>m.id===editId?{...maqForm,id:editId}:m));
    } else {
      set("maquinaria", [...maquinaria,{...maqForm,id:Date.now()}]);
    }
    setMaqForm(emptyMaq); setShowForm(false); setEditId(null);
  };

  // ── HERRAMIENTAS ────────────────────────────────────────────────────────────
  const emptyHerr = {nombre:"",cantidad:1,disponible:1,estado:"bueno",ubicacion:"",obs:"",prestamos:[],mantenimientos:[],reparaciones:[]};
  const [herrForm, setHerrForm] = React.useState(emptyHerr);
  const [showPrestamo, setShowPrestamo] = React.useState(null);
  const [prestForm, setPrestForm] = React.useState({responsable:"",fecha:new Date().toISOString().slice(0,10),fechaDevolucion:"",obs:""});
  const [showRevision, setShowRevision] = React.useState(null);
  const [showReparacion, setShowReparacion] = React.useState(null);
  const [showMantHerr, setShowMantHerr] = React.useState(null);
  const [showTareasMat, setShowTareasMat] = React.useState(null);
  const [revForm, setRevForm] = React.useState({fecha:new Date().toISOString().slice(0,10),horasUso:"",nivelAceite:"ok",filtroAire:"ok",filtroAceite:"ok",correa:"ok",responsable:"",obs:""});
  const [repForm, setRepForm] = React.useState({fecha:new Date().toISOString().slice(0,10),descripcion:"",responsable:"",costo:"",estado:"pendiente"});
  const [mantHerrForm, setMantHerrForm] = React.useState({fecha:new Date().toISOString().slice(0,10),tipo:"Afilado",responsable:"",obs:""});
  const [tareaMatForm, setTareaMatForm] = React.useState({descripcion:"",responsable:"",fechaLimite:"",completada:false});
  const ESTADO_REV = {ok:{label:"OK",color:"#22c55e"},bajo:{label:"Bajo",color:"#f59e0b"},critico:{label:"Crítico",color:"#ef4444"},cambiar:{label:"Cambiar",color:"#ef4444"}};
  const TIPO_MANT_HERR = ["Afilado","Limpieza","Engrase","Reemplazo pieza","Revisión general","Otro"];

  const saveHerr = () => {
    if(!herrForm.nombre.trim()) return;
    if(editId) {
      set("herramientas", herramientas.map(h=>h.id===editId?{...herrForm,id:editId,prestamos:herramientas.find(x=>x.id===editId)?.prestamos||[]}:h));
    } else {
      set("herramientas", [...herramientas,{...herrForm,id:Date.now(),prestamos:[]}]);
    }
    setHerrForm(emptyHerr); setShowForm(false); setEditId(null);
  };

  const registrarPrestamo = (hid) => {
    if(!prestForm.responsable.trim()) return;
    const arr = herramientas.map(h=>h.id===hid?{...h,prestamos:[...(h.prestamos||[]),{...prestForm,id:Date.now(),devuelta:false}]}:h);
    set("herramientas",arr); setShowPrestamo(null); setPrestForm({responsable:"",fecha:new Date().toISOString().slice(0,10),fechaDevolucion:"",obs:""});
  };
  const marcarDevuelta = (hid,pid) => {
    const arr = herramientas.map(h=>h.id===hid?{...h,prestamos:(h.prestamos||[]).map(p=>p.id===pid?{...p,devuelta:true,fechaDevolucion:new Date().toISOString().slice(0,10)}:p)}:h);
    set("herramientas",arr);
  };

  // ── MATERIALES ──────────────────────────────────────────────────────────────
  const UNIDADES = ["kg","g","L","ml","sacos","unidades","rollos","metros","m²","cajas","bolsas"];
  const emptyMat = {nombre:"",unidad:"kg",stockActual:0,stockMinimo:0,obs:"",movimientos:[],tareas:[]};
  const [matForm, setMatForm] = React.useState(emptyMat);

  const saveMat = () => {
    if(!matForm.nombre.trim()) return;
    if(editId) {
      set("materiales", materiales.map(m=>m.id===editId?{...matForm,id:editId,movimientos:materiales.find(x=>x.id===editId)?.movimientos||[]}:m));
    } else {
      set("materiales", [...materiales,{...matForm,id:Date.now(),movimientos:[]}]);
    }
    setMatForm(emptyMat); setShowForm(false); setEditId(null);
  };

  const registrarMovimiento = (mid) => {
    if(!movForm.cantidad||!movForm.responsable) return;
    const mat = materiales.find(m=>m.id===mid);
    const delta = movForm.tipo==="entrada" ? Number(movForm.cantidad) : -Number(movForm.cantidad);
    const nuevoStock = Math.max(0, (mat.stockActual||0)+delta);
    const arr = materiales.map(m=>m.id===mid?{...m,stockActual:nuevoStock,movimientos:[{...movForm,id:Date.now(),delta},...(m.movimientos||[])].slice(0,50)}:m);
    set("materiales",arr); setShowMovimiento(null); setMovForm({tipo:"entrada",cantidad:"",responsable:"",motivo:"",fecha:new Date().toISOString().slice(0,10)});
  };

  const listaPersonal = [...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));
  const inputSt = {background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,color:"#ede9e0",padding:"7px 10px",fontFamily:"'Georgia',serif",fontSize:13,width:"100%",outline:"none"};
  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};

  return (
    <div className="ein">
      {/* Sub-pestañas */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["maquinaria","🚜 Maquinaria"],["herramientas","🔧 Herramientas"],["materiales","📦 Materiales"]].map(([t,l])=>(
          <button key={t} className={`tab${subTab===t?" on":""}`} onClick={()=>{setSubTab(t);setShowForm(false);setEditId(null);}}>{l}</button>
        ))}
      </div>

      {/* ══ MAQUINARIA ══ */}
      {subTab==="maquinaria"&&(
        <div className="ein">
          {esJefa&&!showForm&&(
            <button onClick={()=>{setShowForm(true);setMaqForm(emptyMaq);setEditId(null);}} style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)",marginBottom:14}}>
              ➕ Agregar equipo
            </button>
          )}
          {showForm&&subTab==="maquinaria"&&(
            <div style={{...S.card,padding:18,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14,color:"#a0d8b0"}}>{editId?"Editar":"Nuevo"} Equipo</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[["Nombre del equipo","nombre"],["Modelo / Marca","modelo"],["Operador asignado","operador"]].map(([lbl,k])=>(
                  <div key={k} style={{gridColumn:k==="nombre"?"1/-1":"auto"}}>
                    <label style={labelSt}>{lbl}</label>
                    {k==="operador"
                      ? <select style={inputSt} value={maqForm[k]} onChange={e=>setMaqForm(p=>({...p,[k]:e.target.value}))}>
                          <option value="">Sin asignar</option>
                          {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                      : <input style={inputSt} value={maqForm[k]} onChange={e=>setMaqForm(p=>({...p,[k]:e.target.value}))}/>
                    }
                  </div>
                ))}
                <div>
                  <label style={labelSt}>Estado</label>
                  <select style={inputSt} value={maqForm.estado} onChange={e=>setMaqForm(p=>({...p,estado:e.target.value}))}>
                    {Object.entries(ESTADOS_MAQ).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Último servicio</label>
                  <input type="date" style={inputSt} value={maqForm.ultimoServicio} onChange={e=>setMaqForm(p=>({...p,ultimoServicio:e.target.value}))}/>
                </div>
                <div>
                  <label style={labelSt}>Próximo servicio</label>
                  <input type="date" style={inputSt} value={maqForm.proximoServicio} onChange={e=>setMaqForm(p=>({...p,proximoServicio:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelSt}>Observaciones</label>
                  <textarea rows={2} style={{...inputSt,resize:"vertical"}} value={maqForm.obs} onChange={e=>setMaqForm(p=>({...p,obs:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={saveMaq}>✓ Guardar</button>
                <button className="btn-g" style={S.btn} onClick={()=>{setShowForm(false);setEditId(null);}}>Cancelar</button>
              </div>
            </div>
          )}
          {maquinaria.length===0&&!showForm&&(
            <div style={{...S.card,padding:32,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:32,marginBottom:8}}>🚜</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15}}>Sin equipos registrados</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {maquinaria.map(m=>{
              const est=ESTADOS_MAQ[m.estado]||ESTADOS_MAQ.operativo;
              const hoy=new Date(); hoy.setHours(12,0,0,0);
              const proxServ=m.proximoServicio?new Date(m.proximoServicio+"T12:00:00"):null;
              const diasServ=proxServ?Math.round((proxServ-hoy)/(24*60*60*1000)):null;
              return (
                <div key={m.id} style={{...S.card,padding:16,borderLeft:`3px solid ${diasServ!==null&&diasServ<=0?"#ef4444":diasServ!==null&&diasServ<=15?"#f59e0b":est.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap",marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{m.nombre}</div>
                      {m.modelo&&<div style={{fontSize:12,color:"#6aaa7a"}}>{m.modelo}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:600,color:est.color,background:est.bg,padding:"3px 10px",borderRadius:12}}>{est.label}</span>
                      {esJefa&&<button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>{setMaqForm({nombre:m.nombre,modelo:m.modelo||"",estado:m.estado,ultimoServicio:m.ultimoServicio||"",proximoServicio:m.proximoServicio||"",operador:m.operador||"",obs:m.obs||""});setEditId(m.id);setShowForm(true);}}>✏️</button>}
                      {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>set("maquinaria",maquinaria.filter(x=>x.id!==m.id))}>🗑</button>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12}}>
                    {m.operador&&<span style={{color:"#7a9a8a"}}>👤 {m.operador}</span>}
                    {m.ultimoServicio&&<span style={{color:"#5a8a6a"}}>🔧 Último: {m.ultimoServicio}</span>}
                    {diasServ!==null&&(
                      <span style={{color:diasServ<=0?"#ef4444":diasServ<=15?"#f59e0b":"#22c55e",fontWeight:600}}>
                        📅 Próx. servicio: {m.proximoServicio} {diasServ<=0?`(⚠️ ${Math.abs(diasServ)}d vencido)`:diasServ<=15?`(${diasServ}d)`:""}
                      </span>
                    )}
                  </div>
                  {m.obs&&<div style={{fontSize:11,color:"#6aaa7a",marginTop:6,fontStyle:"italic"}}>{m.obs}</div>}
                  {/* Revisiones y Reparaciones */}
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",cursor:"pointer"}}
                      onClick={()=>{setShowRevision(m.id);setShowReparacion(null);setRevForm({fecha:new Date().toISOString().slice(0,10),horasUso:"",nivelAceite:"ok",filtroAire:"ok",filtroAceite:"ok",correa:"ok",responsable:"",obs:""});}}>
                      🔍 Revisión
                    </button>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(245,158,11,0.15)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)",cursor:"pointer"}}
                      onClick={()=>{setShowReparacion({tipo:"maquinaria",id:m.id});setShowRevision(null);setRepForm({fecha:new Date().toISOString().slice(0,10),descripcion:"",responsable:"",costo:"",estado:"pendiente"});}}>
                      🔨 Reparación
                    </button>
                  </div>
                  {/* Panel revisión inline */}
                  {showRevision===m.id&&(
                    <div style={{marginTop:10,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#93c5fd"}}>🔍 Nueva Revisión</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div><label style={labelSt}>Fecha</label><input type="date" style={inputSt} value={revForm.fecha} onChange={e=>setRevForm(p=>({...p,fecha:e.target.value}))}/></div>
                        <div><label style={labelSt}>Horas de uso acumuladas</label><input type="number" min="0" style={inputSt} value={revForm.horasUso} onChange={e=>setRevForm(p=>({...p,horasUso:e.target.value}))} placeholder="0"/></div>
                        <div><label style={labelSt}>Responsable</label>
                          <select style={inputSt} value={revForm.responsable} onChange={e=>setRevForm(p=>({...p,responsable:e.target.value}))}>
                            <option value="">Seleccionar...</option>
                            {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                          </select>
                        </div>
                        {[["nivelAceite","🛢️ Nivel de aceite"],["filtroAire","💨 Filtro de aire"],["filtroAceite","🔩 Filtro de aceite"],["correa","⚙️ Correa / transmisión"]].map(([k,lbl])=>(
                          <div key={k}>
                            <label style={labelSt}>{lbl}</label>
                            <select style={inputSt} value={revForm[k]} onChange={e=>setRevForm(p=>({...p,[k]:e.target.value}))}>
                              {Object.entries(ESTADO_REV).map(([v,d])=><option key={v} value={v}>{d.label}</option>)}
                            </select>
                          </div>
                        ))}
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><textarea rows={2} style={{...inputSt,resize:"vertical"}} value={revForm.obs} onChange={e=>setRevForm(p=>({...p,obs:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...S.btn,background:"rgba(59,130,246,0.2)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",cursor:"pointer"}} onClick={()=>{
                          const rev={...revForm,id:Date.now()};
                          set("maquinaria",maquinaria.map(x=>x.id===m.id?{...x,revisiones:[rev,...(x.revisiones||[])].slice(0,30),horasUso:revForm.horasUso||x.horasUso,nivelAceite:revForm.nivelAceite,filtroAire:revForm.filtroAire,filtroAceite:revForm.filtroAceite,correa:revForm.correa}:x));
                          setShowRevision(null);
                        }}>✓ Guardar revisión</button>
                        <button className="btn-g" style={S.btn} onClick={()=>setShowRevision(null)}>Cancelar</button>
                      </div>
                      {/* Historial revisiones */}
                      {(m.revisiones||[]).length>0&&(
                        <div style={{marginTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}>
                          <div style={{fontSize:10,color:"#5a8a6a",marginBottom:6,letterSpacing:"0.5px"}}>ÚLTIMAS REVISIONES</div>
                          {(m.revisiones||[]).slice(0,3).map(r=>(
                            <div key={r.id} style={{fontSize:11,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8,flexWrap:"wrap"}}>
                              <span style={{color:"#a0c8e0"}}>{r.fecha}</span>
                              {r.horasUso&&<span style={{color:"#7aaa80"}}>⏱ {r.horasUso}h</span>}
                              {[["nivelAceite","🛢️"],["filtroAire","💨"],["filtroAceite","🔩"],["correa","⚙️"]].map(([k,ico])=>(
                                r[k]&&r[k]!=="ok"&&<span key={k} style={{color:ESTADO_REV[r[k]]?.color||"#f59e0b"}}>{ico} {ESTADO_REV[r[k]]?.label}</span>
                              ))}
                              {r.responsable&&<span style={{color:"#6a9a8a"}}>👤 {r.responsable}</span>}
                              {r.obs&&<span style={{color:"#5a8a6a",fontStyle:"italic",width:"100%"}}>{r.obs}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Panel reparación inline */}
                  {showReparacion?.tipo==="maquinaria"&&showReparacion?.id===m.id&&(
                    <div style={{marginTop:10,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#fcd34d"}}>🔨 Reparación</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Descripción del problema / trabajo</label><textarea rows={2} style={{...inputSt,resize:"vertical"}} value={repForm.descripcion} onChange={e=>setRepForm(p=>({...p,descripcion:e.target.value}))}/></div>
                        <div><label style={labelSt}>Fecha</label><input type="date" style={inputSt} value={repForm.fecha} onChange={e=>setRepForm(p=>({...p,fecha:e.target.value}))}/></div>
                        <div><label style={labelSt}>Responsable / Técnico</label><input style={inputSt} value={repForm.responsable} onChange={e=>setRepForm(p=>({...p,responsable:e.target.value}))} placeholder="Nombre o empresa..."/></div>
                        <div><label style={labelSt}>Costo estimado ($)</label><input type="number" min="0" style={inputSt} value={repForm.costo} onChange={e=>setRepForm(p=>({...p,costo:e.target.value}))}/></div>
                        <div><label style={labelSt}>Estado</label>
                          <select style={inputSt} value={repForm.estado} onChange={e=>setRepForm(p=>({...p,estado:e.target.value}))}>
                            {["pendiente","en curso","completada"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...S.btn,background:"rgba(245,158,11,0.2)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)",cursor:"pointer"}} onClick={()=>{
                          const rep={...repForm,id:Date.now()};
                          set("maquinaria",maquinaria.map(x=>x.id===m.id?{...x,reparaciones:[rep,...(x.reparaciones||[])].slice(0,20)}:x));
                          setShowReparacion(null);
                        }}>✓ Registrar</button>
                        <button className="btn-g" style={S.btn} onClick={()=>setShowReparacion(null)}>Cancelar</button>
                      </div>
                      {(m.reparaciones||[]).length>0&&(
                        <div style={{marginTop:8,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}>
                          {(m.reparaciones||[]).slice(0,3).map(r=>(
                            <div key={r.id} style={{fontSize:11,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8,flexWrap:"wrap"}}>
                              <span style={{color:"#fcd34d"}}>{r.fecha}</span>
                              <span style={{color:"#e0c080",flex:1}}>{r.descripcion}</span>
                              <span style={{color:r.estado==="completada"?"#22c55e":r.estado==="en curso"?"#3b82f6":"#f59e0b"}}>{r.estado}</span>
                              {r.costo&&<span style={{color:"#6aaa7a"}}>${r.costo}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ HERRAMIENTAS ══ */}
      {subTab==="herramientas"&&(
        <div className="ein">
          {esJefa&&!showForm&&!showPrestamo&&(
            <button onClick={()=>{setShowForm(true);setHerrForm(emptyHerr);setEditId(null);}} style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)",marginBottom:14}}>
              ➕ Agregar herramienta
            </button>
          )}
          {showForm&&subTab==="herramientas"&&(
            <div style={{...S.card,padding:18,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14,color:"#a0d8b0"}}>{editId?"Editar":"Nueva"} Herramienta</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelSt}>Nombre</label>
                  <input style={inputSt} value={herrForm.nombre} onChange={e=>setHerrForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Pala ancha, Tijeras de poda..."/>
                </div>
                <div><label style={labelSt}>Cantidad total</label><input type="number" min="0" style={inputSt} value={herrForm.cantidad} onChange={e=>setHerrForm(p=>({...p,cantidad:Number(e.target.value)}))}/></div>
                <div><label style={labelSt}>Disponible</label><input type="number" min="0" style={inputSt} value={herrForm.disponible} onChange={e=>setHerrForm(p=>({...p,disponible:Number(e.target.value)}))}/></div>
                <div>
                  <label style={labelSt}>Estado</label>
                  <select style={inputSt} value={herrForm.estado} onChange={e=>setHerrForm(p=>({...p,estado:e.target.value}))}>
                    {["bueno","regular","deteriorado","baja"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Ubicación en bodega</label><input style={inputSt} value={herrForm.ubicacion} onChange={e=>setHerrForm(p=>({...p,ubicacion:e.target.value}))} placeholder="Ej: Estante A, Gancho 3..."/></div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><textarea rows={2} style={{...inputSt,resize:"vertical"}} value={herrForm.obs} onChange={e=>setHerrForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={saveHerr}>✓ Guardar</button>
                <button className="btn-g" style={S.btn} onClick={()=>{setShowForm(false);setEditId(null);}}>Cancelar</button>
              </div>
            </div>
          )}
          {showPrestamo&&(
            <div style={{...S.card,padding:18,marginBottom:16,border:"1px solid rgba(59,130,246,0.3)"}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,marginBottom:12,color:"#93c5fd"}}>🔧 Registrar Préstamo</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Responsable</label>
                  <select style={inputSt} value={prestForm.responsable} onChange={e=>setPrestForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Fecha salida</label><input type="date" style={inputSt} value={prestForm.fecha} onChange={e=>setPrestForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><input style={inputSt} value={prestForm.obs} onChange={e=>setPrestForm(p=>({...p,obs:e.target.value}))} placeholder="Para qué zona / trabajo..."/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.btn,background:"rgba(59,130,246,0.2)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",cursor:"pointer"}} onClick={()=>registrarPrestamo(showPrestamo)}>✓ Registrar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowPrestamo(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {herramientas.length===0&&!showForm&&(
            <div style={{...S.card,padding:32,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:32,marginBottom:8}}>🔧</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15}}>Sin herramientas registradas</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {herramientas.map(h=>{
              const ECOL={bueno:"#22c55e",regular:"#f59e0b",deteriorado:"#ef4444",baja:"#94a3b8"};
              const prestActivos=(h.prestamos||[]).filter(p=>!p.devuelta);
              return (
                <div key={h.id} style={{...S.card,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap",marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{h.nombre}</div>
                      {h.ubicacion&&<div style={{fontSize:11,color:"#5a8a6a"}}>📍 {h.ubicacion}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:ECOL[h.estado]||"#94a3b8",background:`${ECOL[h.estado]||"#94a3b8"}18`,padding:"3px 10px",borderRadius:12,fontWeight:600}}>
                        {h.estado}
                      </span>
                      <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",cursor:"pointer"}} onClick={()=>{setShowPrestamo(h.id);setShowForm(false);}}>📤 Préstamo</button>
                      {esJefa&&<button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>{setHerrForm({nombre:h.nombre,cantidad:h.cantidad,disponible:h.disponible,estado:h.estado,ubicacion:h.ubicacion||"",obs:h.obs||""});setEditId(h.id);setShowForm(true);}}>✏️</button>}
                      {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>set("herramientas",herramientas.filter(x=>x.id!==h.id))}>🗑</button>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:12,flexWrap:"wrap"}}>
                    <span style={{color:"#6aaa7a"}}>Total: <b>{h.cantidad}</b></span>
                    <span style={{color:h.disponible<h.cantidad?"#f59e0b":"#22c55e"}}>Disponible: <b>{h.disponible}</b></span>
                    {prestActivos.length>0&&<span style={{color:"#f59e0b"}}>📤 {prestActivos.length} en préstamo</span>}
                  </div>
                  {prestActivos.length>0&&(
                    <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                      {prestActivos.map(p=>(
                        <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(245,158,11,0.08)",borderRadius:8,gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:12}}>👤 {p.responsable} · {p.fecha}{p.obs?" · "+p.obs:""}</span>
                          <button style={{...S.btn,fontSize:11,padding:"3px 10px",background:"rgba(34,197,94,0.15)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",cursor:"pointer"}} onClick={()=>marcarDevuelta(h.id,p.id)}>✓ Devuelta</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Botones mantenimiento y reparación */}
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",cursor:"pointer"}}
                      onClick={()=>{setShowMantHerr(h.id);setShowReparacion(null);setMantHerrForm({fecha:new Date().toISOString().slice(0,10),tipo:"Afilado",responsable:"",obs:""});}}>
                      🔧 Mantención
                    </button>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",cursor:"pointer"}}
                      onClick={()=>{setShowReparacion({tipo:"herramienta",id:h.id});setShowMantHerr(null);setRepForm({fecha:new Date().toISOString().slice(0,10),descripcion:"",responsable:"",costo:"",estado:"pendiente"});}}>
                      🔨 Reparación
                    </button>
                  </div>
                  {showMantHerr===h.id&&(
                    <div style={{marginTop:10,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#86efac"}}>🔧 Mantención</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div><label style={labelSt}>Tipo de mantención</label>
                          <select style={inputSt} value={mantHerrForm.tipo} onChange={e=>setMantHerrForm(p=>({...p,tipo:e.target.value}))}>
                            {TIPO_MANT_HERR.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div><label style={labelSt}>Fecha</label><input type="date" style={inputSt} value={mantHerrForm.fecha} onChange={e=>setMantHerrForm(p=>({...p,fecha:e.target.value}))}/></div>
                        <div><label style={labelSt}>Responsable</label>
                          <select style={inputSt} value={mantHerrForm.responsable} onChange={e=>setMantHerrForm(p=>({...p,responsable:e.target.value}))}>
                            <option value="">Seleccionar...</option>
                            {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                          </select>
                        </div>
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><input style={inputSt} value={mantHerrForm.obs} onChange={e=>setMantHerrForm(p=>({...p,obs:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...S.btn,background:"rgba(34,197,94,0.2)",color:"#86efac",border:"1px solid rgba(34,197,94,0.3)",cursor:"pointer"}} onClick={()=>{
                          const mant={...mantHerrForm,id:Date.now()};
                          set("herramientas",herramientas.map(x=>x.id===h.id?{...x,mantenimientos:[mant,...(x.mantenimientos||[])].slice(0,20)}:x));
                          setShowMantHerr(null);
                        }}>✓ Registrar</button>
                        <button className="btn-g" style={S.btn} onClick={()=>setShowMantHerr(null)}>Cancelar</button>
                      </div>
                      {(h.mantenimientos||[]).length>0&&(
                        <div style={{marginTop:8,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}>
                          {(h.mantenimientos||[]).slice(0,3).map(m=>(
                            <div key={m.id} style={{fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8,flexWrap:"wrap"}}>
                              <span style={{color:"#86efac"}}>{m.fecha}</span>
                              <span style={{color:"#a0c8a0"}}>{m.tipo}</span>
                              {m.responsable&&<span style={{color:"#6a9a8a"}}>👤 {m.responsable}</span>}
                              {m.obs&&<span style={{color:"#5a8a6a",fontStyle:"italic"}}>{m.obs}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {showReparacion?.tipo==="herramienta"&&showReparacion?.id===h.id&&(
                    <div style={{marginTop:10,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#fcd34d"}}>🔨 Reparación</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Descripción</label><textarea rows={2} style={{...inputSt,resize:"vertical"}} value={repForm.descripcion} onChange={e=>setRepForm(p=>({...p,descripcion:e.target.value}))}/></div>
                        <div><label style={labelSt}>Fecha</label><input type="date" style={inputSt} value={repForm.fecha} onChange={e=>setRepForm(p=>({...p,fecha:e.target.value}))}/></div>
                        <div><label style={labelSt}>Responsable</label><input style={inputSt} value={repForm.responsable} onChange={e=>setRepForm(p=>({...p,responsable:e.target.value}))}/></div>
                        <div><label style={labelSt}>Costo ($)</label><input type="number" min="0" style={inputSt} value={repForm.costo} onChange={e=>setRepForm(p=>({...p,costo:e.target.value}))}/></div>
                        <div><label style={labelSt}>Estado</label>
                          <select style={inputSt} value={repForm.estado} onChange={e=>setRepForm(p=>({...p,estado:e.target.value}))}>
                            {["pendiente","en curso","completada"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...S.btn,background:"rgba(245,158,11,0.2)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)",cursor:"pointer"}} onClick={()=>{
                          set("herramientas",herramientas.map(x=>x.id===h.id?{...x,reparaciones:[{...repForm,id:Date.now()},...(x.reparaciones||[])].slice(0,20)}:x));
                          setShowReparacion(null);
                        }}>✓ Registrar</button>
                        <button className="btn-g" style={S.btn} onClick={()=>setShowReparacion(null)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MATERIALES ══ */}
      {subTab==="materiales"&&(
        <div className="ein">
          {esJefa&&!showForm&&!showMovimiento&&(
            <button onClick={()=>{setShowForm(true);setMatForm(emptyMat);setEditId(null);}} style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)",marginBottom:14}}>
              ➕ Agregar material/insumo
            </button>
          )}
          {showForm&&subTab==="materiales"&&(
            <div style={{...S.card,padding:18,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14,color:"#a0d8b0"}}>{editId?"Editar":"Nuevo"} Material / Insumo</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Nombre</label><input style={inputSt} value={matForm.nombre} onChange={e=>setMatForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Fertilizante NPK, Tierra de hoja..."/></div>
                <div>
                  <label style={labelSt}>Unidad</label>
                  <select style={inputSt} value={matForm.unidad} onChange={e=>setMatForm(p=>({...p,unidad:e.target.value}))}>
                    {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Stock actual</label><input type="number" min="0" step="0.1" style={inputSt} value={matForm.stockActual} onChange={e=>setMatForm(p=>({...p,stockActual:Number(e.target.value)}))}/></div>
                <div><label style={labelSt}>Stock mínimo (alerta)</label><input type="number" min="0" step="0.1" style={inputSt} value={matForm.stockMinimo} onChange={e=>setMatForm(p=>({...p,stockMinimo:Number(e.target.value)}))}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><textarea rows={2} style={{...inputSt,resize:"vertical"}} value={matForm.obs} onChange={e=>setMatForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={saveMat}>✓ Guardar</button>
                <button className="btn-g" style={S.btn} onClick={()=>{setShowForm(false);setEditId(null);}}>Cancelar</button>
              </div>
            </div>
          )}
          {showMovimiento&&(
            <div style={{...S.card,padding:18,marginBottom:16,border:`1px solid ${movForm.tipo==="entrada"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,marginBottom:12,color:movForm.tipo==="entrada"?"#86efac":"#fca5a5"}}>
                {movForm.tipo==="entrada"?"📥 Registrar Entrada":"📤 Registrar Salida"}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {["entrada","salida"].map(t=>(
                  <button key={t} onClick={()=>setMovForm(p=>({...p,tipo:t}))}
                    style={{...S.btn,padding:"6px 16px",fontSize:13,background:movForm.tipo===t?(t==="entrada"?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"):"rgba(255,255,255,0.05)",color:movForm.tipo===t?(t==="entrada"?"#86efac":"#fca5a5"):"#7aaa80",border:`1px solid ${movForm.tipo===t?(t==="entrada"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"):"rgba(255,255,255,0.1)"}`,cursor:"pointer"}}>
                    {t==="entrada"?"📥 Entrada":"📤 Salida"}
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Cantidad ({materiales.find(m=>m.id===showMovimiento)?.unidad})</label><input type="number" min="0" step="0.1" style={inputSt} value={movForm.cantidad} onChange={e=>setMovForm(p=>({...p,cantidad:e.target.value}))}/></div>
                <div><label style={labelSt}>Fecha</label><input type="date" style={inputSt} value={movForm.fecha} onChange={e=>setMovForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable</label>
                  <select style={inputSt} value={movForm.responsable} onChange={e=>setMovForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Motivo / Zona destino</label><input style={inputSt} value={movForm.motivo} onChange={e=>setMovForm(p=>({...p,motivo:e.target.value}))} placeholder="Ej: Aplicación Alameda Central..."/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.btn,background:movForm.tipo==="entrada"?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)",color:movForm.tipo==="entrada"?"#86efac":"#fca5a5",border:`1px solid ${movForm.tipo==="entrada"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}`,cursor:"pointer"}} onClick={()=>registrarMovimiento(showMovimiento)}>✓ Registrar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowMovimiento(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {/* Alerta stock bajo */}
          {materiales.filter(m=>m.stockActual<=m.stockMinimo&&m.stockMinimo>0).length>0&&(
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13}}>
              <b style={{color:"#fca5a5"}}>⚠️ Stock bajo:</b>{" "}
              {materiales.filter(m=>m.stockActual<=m.stockMinimo&&m.stockMinimo>0).map(m=>(
                <span key={m.id} style={{color:"#fca5a5",marginLeft:8}}>{m.nombre} ({m.stockActual} {m.unidad})</span>
              ))}
            </div>
          )}
          {materiales.length===0&&!showForm&&(
            <div style={{...S.card,padding:32,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:32,marginBottom:8}}>📦</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15}}>Sin materiales registrados</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {materiales.map(m=>{
              const bajStock=m.stockActual<=m.stockMinimo&&m.stockMinimo>0;
              const movs=(m.movimientos||[]).slice(0,5);
              return (
                <div key={m.id} style={{...S.card,padding:16,borderLeft:`3px solid ${bajStock?"#ef4444":"rgba(61,122,82,0.4)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:10,flexWrap:"wrap",marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{m.nombre}</div>
                      {m.obs&&<div style={{fontSize:11,color:"#5a8a6a",fontStyle:"italic"}}>{m.obs}</div>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      {bajStock&&<span style={{fontSize:11,color:"#fca5a5",background:"rgba(239,68,68,0.12)",padding:"3px 8px",borderRadius:8,border:"1px solid rgba(239,68,68,0.25)"}}>⚠️ Stock bajo</span>}
                      <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(34,197,94,0.15)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",cursor:"pointer"}} onClick={()=>{setShowMovimiento(m.id);setShowForm(false);setMovForm({tipo:"entrada",cantidad:"",responsable:"",motivo:"",fecha:new Date().toISOString().slice(0,10)});}}>📥📤 Movimiento</button>
                      {esJefa&&<button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>{setMatForm({nombre:m.nombre,unidad:m.unidad,stockActual:m.stockActual,stockMinimo:m.stockMinimo,obs:m.obs||""});setEditId(m.id);setShowForm(true);}}>✏️</button>}
                      {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>set("materiales",materiales.filter(x=>x.id!==m.id))}>🗑</button>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:14,fontSize:13,marginBottom:movs.length>0?10:0,flexWrap:"wrap"}}>
                    <span style={{color:bajStock?"#ef4444":"#22c55e",fontWeight:700}}>Stock: {m.stockActual} {m.unidad}</span>
                    {m.stockMinimo>0&&<span style={{color:"#6aaa7a",fontSize:12}}>Mínimo: {m.stockMinimo} {m.unidad}</span>}
                  </div>
                  {movs.length>0&&(
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}>
                      <div style={{fontSize:10,color:"#5a8a6a",marginBottom:5,letterSpacing:"0.5px"}}>ÚLTIMOS MOVIMIENTOS</div>
                      {movs.map(mv=>(
                        <div key={mv.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",flexWrap:"wrap",gap:6}}>
                          <span style={{color:mv.tipo==="entrada"?"#86efac":"#fca5a5"}}>{mv.tipo==="entrada"?"📥":"📤"} {mv.tipo==="entrada"?"+":"-"}{mv.cantidad} {m.unidad}</span>
                          <span style={{color:"#6a9a8a"}}>{mv.responsable}</span>
                          <span style={{color:"#5a8a6a"}}>{mv.fecha}</span>
                          {mv.motivo&&<span style={{color:"#4a7a6a",fontStyle:"italic",width:"100%"}}>{mv.motivo}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Tareas / Inventario */}
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(124,58,237,0.12)",color:"#c4b5fd",border:"1px solid rgba(124,58,237,0.25)",cursor:"pointer"}}
                      onClick={()=>{setShowTareasMat(showTareasMat===m.id?null:m.id);setTareaMatForm({descripcion:"",responsable:"",fechaLimite:"",completada:false});}}>
                      📋 Tareas / Inventario
                    </button>
                  </div>
                  {showTareasMat===m.id&&(
                    <div style={{marginTop:10,background:"rgba(124,58,237,0.05)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#c4b5fd"}}>📋 Tareas del Material</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Tarea (ej: Inventario, Revisar vencimiento, Reabastecer)</label><input style={inputSt} value={tareaMatForm.descripcion} onChange={e=>setTareaMatForm(p=>({...p,descripcion:e.target.value}))} placeholder="Ej: Hacer inventario · Revisar fecha vencimiento..."/></div>
                        <div><label style={labelSt}>Responsable</label>
                          <select style={inputSt} value={tareaMatForm.responsable} onChange={e=>setTareaMatForm(p=>({...p,responsable:e.target.value}))}>
                            <option value="">Seleccionar...</option>
                            {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                          </select>
                        </div>
                        <div><label style={labelSt}>Fecha límite</label><input type="date" style={inputSt} value={tareaMatForm.fechaLimite} onChange={e=>setTareaMatForm(p=>({...p,fechaLimite:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:12}}>
                        <button style={{...S.btn,background:"rgba(124,58,237,0.2)",color:"#c4b5fd",border:"1px solid rgba(124,58,237,0.3)",cursor:"pointer"}} onClick={()=>{
                          if(!tareaMatForm.descripcion.trim()) return;
                          set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:[...(x.tareas||[]),{...tareaMatForm,id:Date.now()}]}:x));
                          setTareaMatForm({descripcion:"",responsable:"",fechaLimite:"",completada:false});
                        }}>➕ Agregar tarea</button>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {(m.tareas||[]).map(t=>(
                          <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,borderLeft:`3px solid ${t.completada?"#22c55e":"#c084fc"}`}}>
                            <input type="checkbox" checked={t.completada} onChange={()=>set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:(x.tareas||[]).map(tt=>tt.id===t.id?{...tt,completada:!tt.completada}:tt)}:x))}
                              style={{width:15,height:15,accentColor:"#7c3aed",cursor:"pointer",flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,textDecoration:t.completada?"line-through":"none",color:t.completada?"#5a8a6a":"#ede9e0"}}>{t.descripcion}</div>
                              <div style={{fontSize:10,color:"#5a8a6a",display:"flex",gap:8}}>
                                {t.responsable&&<span>👤 {t.responsable}</span>}
                                {t.fechaLimite&&<span>📅 {t.fechaLimite}</span>}
                              </div>
                            </div>
                            <button onClick={()=>set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:(x.tareas||[]).filter(tt=>tt.id!==t.id)}:x))}
                              style={{background:"transparent",border:"none",color:"#7a5a5a",cursor:"pointer",fontSize:12,padding:"2px 4px"}}>🗑</button>
                          </div>
                        ))}
                        {(m.tareas||[]).length===0&&<div style={{fontSize:12,color:"#4a8a5a",textAlign:"center",padding:8}}>Sin tareas. Agrega una arriba.</div>}
                      </div>
                    </div>
                  )}
                  {/* Tareas / Inventario */}
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(124,58,237,0.12)",color:"#c4b5fd",border:"1px solid rgba(124,58,237,0.25)",cursor:"pointer"}}
                      onClick={()=>{setShowTareasMat(showTareasMat===m.id?null:m.id);setTareaMatForm({descripcion:"",responsable:"",fechaLimite:"",completada:false});}}>
                      📋 Tareas / Inventario {(m.tareas||[]).filter(t=>!t.completada).length>0&&<span style={{fontSize:10,background:"rgba(124,58,237,0.3)",borderRadius:10,padding:"1px 5px",marginLeft:4}}>{(m.tareas||[]).filter(t=>!t.completada).length}</span>}
                    </button>
                  </div>
                  {showTareasMat===m.id&&(
                    <div style={{marginTop:10,background:"rgba(124,58,237,0.05)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:10,padding:14}} className="ein">
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#c4b5fd"}}>📋 Tareas del Material</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Tarea</label><input style={inputSt} value={tareaMatForm.descripcion} onChange={e=>setTareaMatForm(p=>({...p,descripcion:e.target.value}))} placeholder="Ej: Hacer inventario · Revisar vencimiento · Reabastecer..."/></div>
                        <div><label style={labelSt}>Responsable</label>
                          <select style={inputSt} value={tareaMatForm.responsable} onChange={e=>setTareaMatForm(p=>({...p,responsable:e.target.value}))}>
                            <option value="">Seleccionar...</option>
                            {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                          </select>
                        </div>
                        <div><label style={labelSt}>Fecha límite</label><input type="date" style={inputSt} value={tareaMatForm.fechaLimite} onChange={e=>setTareaMatForm(p=>({...p,fechaLimite:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:12}}>
                        <button style={{...S.btn,background:"rgba(124,58,237,0.2)",color:"#c4b5fd",border:"1px solid rgba(124,58,237,0.3)",cursor:"pointer"}} onClick={()=>{
                          if(!tareaMatForm.descripcion.trim()) return;
                          set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:[...(x.tareas||[]),{...tareaMatForm,id:Date.now()}]}:x));
                          setTareaMatForm({descripcion:"",responsable:"",fechaLimite:"",completada:false});
                        }}>➕ Agregar</button>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {(m.tareas||[]).map(t=>(
                          <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,borderLeft:`3px solid ${t.completada?"#22c55e":"#c084fc"}`}}>
                            <input type="checkbox" checked={t.completada} onChange={()=>set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:(x.tareas||[]).map(tt=>tt.id===t.id?{...tt,completada:!tt.completada}:tt)}:x))}
                              style={{width:15,height:15,accentColor:"#7c3aed",cursor:"pointer",flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,textDecoration:t.completada?"line-through":"none",color:t.completada?"#5a8a6a":"#ede9e0"}}>{t.descripcion}</div>
                              <div style={{fontSize:10,color:"#5a8a6a",display:"flex",gap:8}}>
                                {t.responsable&&<span>👤 {t.responsable}</span>}
                                {t.fechaLimite&&<span>📅 {t.fechaLimite}</span>}
                              </div>
                            </div>
                            <button onClick={()=>set("materiales",materiales.map(x=>x.id===m.id?{...x,tareas:(x.tareas||[]).filter(tt=>tt.id!==t.id)}:x))}
                              style={{background:"transparent",border:"none",color:"#7a5a5a",cursor:"pointer",fontSize:12,padding:"2px 4px"}}>🗑</button>
                          </div>
                        ))}
                        {(m.tareas||[]).length===0&&<div style={{fontSize:12,color:"#4a8a5a",textAlign:"center",padding:8}}>Sin tareas. Agrega una arriba.</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PANEL DE FRECUENCIAS DE MANTENCIÓN ─────────────────────────────────────
function FrecuenciasPanel({ zid, eid, tipo, isCustom, S, getFrecs, setFrecs }) {
  const ESTACIONES_LIST = ["verano","otono","invierno","primavera"];
  const frecuencias = getFrecs(zid, eid, tipo, isCustom);
  const updateFila = (idx, campo, valor) => { const arr = frecuencias.map((f,i)=>i===idx?{...f,[campo]:valor}:f); setFrecs(zid,eid,isCustom,arr); };
  const addFila = () => { setFrecs(zid,eid,isCustom,[...frecuencias,{id:eid+"_"+Date.now(),tarea:"",verano:"semanal",otono:"semanal",invierno:"noaplica",primavera:"semanal",ultimaVez:""}]); };
  const removeFila = (idx) => { setFrecs(zid,eid,isCustom,frecuencias.filter((_,i)=>i!==idx)); };

  // Convierte frecuencia a días
  const frecToDias = (frec) => {
    const map = {diario:1,cada2dias:2,cada3dias:3,cada5dias:5,semanal:7,quincenal:15,mensual:30,bimestral:60,trimestral:90,semestral:180,anual:365,unavez:null,segunecesidad:null};
    return map[frec]||null;
  };

  // Estación actual (hemisferio sur)
  const mes = new Date().getMonth()+1;
  const estActual = [12,1,2].includes(mes)?"verano":[3,4,5].includes(mes)?"otono":[6,7,8].includes(mes)?"invierno":"primavera";

  // Calcula próxima fecha y días
  const calcProxima = (f) => {
    const frecVal = f[estActual];
    if(!frecVal||frecVal==="noaplica"||frecVal==="unavez"||frecVal==="segunecesidad") return null;
    if(!f.ultimaVez) return null;
    const dias = frecToDias(frecVal);
    if(!dias) return null;
    const ultima = new Date(f.ultimaVez+"T12:00:00");
    const proxima = new Date(ultima.getTime() + dias*24*60*60*1000);
    const hoy = new Date(); hoy.setHours(12,0,0,0);
    const diff = Math.round((proxima-hoy)/(24*60*60*1000));
    return { fecha: proxima.toISOString().slice(0,10), diff };
  };
  const esSinFrecuencia = (f) => ["unavez","segunecesidad"].includes(f[estActual]);

  const inputSt = {background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,color:"#ede9e0",padding:"7px 10px",fontFamily:"'Georgia',serif",fontSize:13,width:"100%",outline:"none"};
  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};

  return (
    <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#a0d8b0"}}>📅 Frecuencias de Mantención</div>
        <div style={{fontSize:11,color:"#5a8a6a"}}>
          Estación actual: <b style={{color:ESTACIONES[estActual].color}}>{ESTACIONES[estActual].icon} {ESTACIONES[estActual].label}</b>
          <span style={{marginLeft:8,color:"#ef4444",fontSize:10}}>■ vencida</span>
          <span style={{marginLeft:6,color:"#f59e0b",fontSize:10}}>■ ≤7d</span>
          <span style={{marginLeft:6,color:"#fcd34d",fontSize:10}}>■ ≤30d</span>
          <span style={{marginLeft:6,color:"#22c55e",fontSize:10}}>■ ok</span>
        </div>
      </div>

      {frecuencias.length===0 && (
        <div style={{padding:"16px",textAlign:"center",color:"#4a8a5a",fontSize:13,background:"rgba(255,255,255,0.03)",borderRadius:8,marginBottom:10}}>
          Sin tareas definidas. Agrega una abajo.
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
        {frecuencias.map((f,idx)=>{
          const prox = calcProxima(f);
          const diasColor = prox===null?"#5a8a7a":prox.diff<0?"#ef4444":prox.diff<=7?"#f59e0b":prox.diff<=30?"#fcd34d":"#22c55e";
          const diasLabel = prox===null?"—":prox.diff===0?"Hoy":prox.diff<0?`${Math.abs(prox.diff)}d atrás`:`${prox.diff}d`;
          return (
            <div key={idx} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${prox&&prox.diff<0?"rgba(239,68,68,0.3)":prox&&prox.diff<=7?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${prox&&prox.diff<0?"#ef4444":prox&&prox.diff<=7?"#f59e0b":"rgba(61,122,82,0.4)"}`}}>
              {/* Fila 1: Nombre tarea + badge días + botón eliminar */}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <div style={{flex:1}}>
                  <label style={labelSt}>Nombre de la tarea</label>
                  <input style={{...inputSt,fontSize:14,fontWeight:600}} value={f.tarea} onChange={e=>updateFila(idx,"tarea",e.target.value)} placeholder="Ej: Poda de limpieza, Riego, Corte de césped..."/>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                  {esSinFrecuencia(f) ? (
                    <span style={{fontSize:11,color:"#c084fc",background:"rgba(192,132,252,0.12)",padding:"4px 10px",borderRadius:8,border:"1px solid rgba(192,132,252,0.25)",whiteSpace:"nowrap"}}>
                      {f[estActual]==="unavez"?"1 sola vez":"Según necesidad"}
                    </span>
                  ) : (
                    <span style={{fontSize:12,fontWeight:700,color:diasColor,background:`${diasColor}18`,padding:"4px 10px",borderRadius:8,whiteSpace:"nowrap",border:`1px solid ${diasColor}35`}}>
                      {diasLabel}
                    </span>
                  )}
                  {prox&&<div style={{fontSize:10,color:"#c084fc",textAlign:"center"}}>{new Date(prox.fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"short"})}</div>}
                  <button onClick={()=>removeFila(idx)} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,color:"#fca5a5",cursor:"pointer",fontSize:12,padding:"3px 8px",marginTop:2}}>✕ Quitar</button>
                </div>
              </div>

              {/* Fila 2: Frecuencias por estación */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
                {ESTACIONES_LIST.map(est=>{
                  const esNA=f[est]==="noaplica";
                  return (
                    <div key={est}>
                      <label style={{...labelSt,color:ESTACIONES[est].color}}>{ESTACIONES[est].icon} {ESTACIONES[est].label}</label>
                      <select value={f[est]||"noaplica"} onChange={e=>updateFila(idx,est,e.target.value)}
                        style={{background:esNA?"rgba(255,255,255,0.04)":`${ESTACIONES[est].color}15`,border:`1px solid ${esNA?"rgba(255,255,255,0.08)":ESTACIONES[est].color+"35"}`,borderRadius:7,color:esNA?"#4a7a6a":ESTACIONES[est].color,padding:"6px 8px",fontFamily:"'Georgia',serif",fontSize:12,outline:"none",cursor:"pointer",width:"100%"}}>
                        {FRECUENCIAS.map(fr=><option key={fr.value} value={fr.value}>{fr.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Fila 3: Última vez + Observaciones */}
              <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:10}}>
                <div>
                  <label style={{...labelSt,color:"#a0c8e0"}}>📅 Última realización</label>
                  <input type="date" value={f.ultimaVez||""} onChange={e=>updateFila(idx,"ultimaVez",e.target.value)}
                    style={{...inputSt,color:"#a0c8e0",border:"1px solid rgba(160,200,224,0.25)",background:"rgba(160,200,224,0.06)"}}/>
                </div>
                <div>
                  <label style={{...labelSt,color:"#fbbf24"}}>📝 Observaciones / Especificaciones técnicas</label>
                  <input value={f.obs||""} onChange={e=>updateFila(idx,"obs",e.target.value)}
                    placeholder="Ej: Cortar a 3&quot; de altura · Usar EPP · Retirar no más del 30% copa..."
                    style={{...inputSt,color:"#fde68a",border:"1px solid rgba(251,191,36,0.25)",background:"rgba(251,191,36,0.05)"}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={addFila} style={{background:"rgba(61,122,82,0.2)",border:"1px solid rgba(61,122,82,0.3)",borderRadius:8,color:"#80c890",padding:"8px 16px",fontFamily:"'Georgia',serif",fontSize:13,cursor:"pointer",width:"100%"}}>
        ＋ Agregar tarea de mantención
      </button>
    </div>
  );
}

// ─── FICHA TRABAJADOR ────────────────────────────────────────────────────────
// ─── SELECTOR TIPO EVENTO ─────────────────────────────────────────────────────
function TipoEventoSelector({ value, onChange, S, TIPO_EVENTO }) {
  const [open, setOpen] = React.useState(false);
  const grupos = [
    {label:"📋 Asistencia", color:"#60a5fa", keys:["permiso","vacaciones","licencia"]},
    {label:"⏰ Horas", color:"#4ade80", keys:["horaExtra"]},
    {label:"📚 Formación y otros", color:"#fbbf24", keys:["capacitacion","amonestacion","otro"]},
  ];
  const tp = TIPO_EVENTO[value];
  return (
    <div style={{position:"relative"}}>
      <button style={{...S.input,width:"100%",textAlign:"left",cursor:"pointer",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px"}}
        onClick={()=>setOpen(p=>!p)}>
        <span>{tp?`${tp.icon} ${tp.label}`:"Seleccionar tipo..."}</span>
        <span style={{fontSize:10,color:"#5a8a6a"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:"#0f2517",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.5)",marginTop:4}}>
          <div style={{maxHeight:260,overflowY:"auto"}}>
            {grupos.map(g=>(
              <div key={g.label}>
                <div style={{padding:"8px 14px 4px",fontSize:11,color:g.color,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",background:"rgba(255,255,255,0.03)",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                  {g.label}
                </div>
                {g.keys.map(k=>{
                  const t=TIPO_EVENTO[k];
                  if(!t) return null;
                  return (
                    <div key={k} style={{padding:"9px 14px 9px 22px",cursor:"pointer",fontSize:13,color:value===k?t.color:"#ede9e0",background:value===k?`${t.color}18`:"transparent",borderLeft:value===k?`2px solid ${t.color}`:"2px solid transparent",display:"flex",alignItems:"center",gap:8}}
                      onClick={()=>{onChange(k);setOpen(false);}}>
                      <span style={{fontSize:16}}>{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FichaTrabajador({ t, S, onVolver, onDelete, onUpdate, onAddEvento, onDeleteEvento, onUpdateEvento }) {
  const [tab, setTab] = React.useState("ficha");
  const [showNuevoEvento, setShowNuevoEvento] = React.useState(false);
  const [nuevoEvento, setNuevoEvento] = React.useState({ tipo:"permiso", fecha:"", fechaFin:"", horas:"", descripcion:"", estado:"pendiente" });
  const [editEventoId, setEditEventoId] = React.useState(null);
  const [editEventoForm, setEditEventoForm] = React.useState({});

  const abrirEditEvento = (ev) => { setEditEventoId(ev.id); setEditEventoForm({...ev}); setShowNuevoEvento(false); };
  const guardarEditEvento = () => { onUpdateEvento(editEventoId, editEventoForm); setEditEventoId(null); };

  const TIPO_EVENTO = {
    permiso:          { label:"Permiso",               color:"#f59e0b", icon:"📋" },
    vacaciones:       { label:"Vacaciones",            color:"#3b82f6", icon:"🏖️" },
    horaExtra:        { label:"Hora Extra",            color:"#22c55e", icon:"⏰" },
    licencia:         { label:"Licencia",              color:"#a78bfa", icon:"🏥" },
    amonestacion:     { label:"Amonestación",          color:"#ef4444", icon:"⚠️" },
    capacitacion:     { label:"Capacitación",          color:"#2dd4bf", icon:"📚" },
    bonoConstruccion: { label:"Bono Construcción",     color:"#f97316", icon:"🏗️" },
    bonoPesado:       { label:"Bono Trabajo Pesado",   color:"#dc2626", icon:"💪" },
    bonoEspecializado:{ label:"Bono Especializado",    color:"#7c3aed", icon:"⭐" },
    otro:             { label:"Otro",                  color:"#94a3b8", icon:"📌" },
  };
  const ESTADO_EVENTO = {
    pendiente:  { label:"Pendiente",  color:"#f59e0b" },
    aprobado:   { label:"Aprobado",   color:"#22c55e" },
    rechazado:  { label:"Rechazado",  color:"#ef4444" },
    completado: { label:"Completado", color:"#94a3b8" },
  };
  const CONTRATOS = ["indefinido","plazo fijo","honorarios","part-time"];
  const CARGOS = ["Jefa de Áreas Verdes","Supervisor de Áreas Verdes","Jardinero","Jardinero Senior","Técnico en Riego","Operador Maquinaria","Capataz","Administrativo","Otro"];

  const eventos = (t.eventos||[]).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));
  const vacAprobadas = eventos.filter(e=>e.tipo==="vacaciones"&&e.estado==="aprobado").reduce((a,e)=>{
    if(!e.fecha||!e.fechaFin) return a;
    return a+Math.round((new Date(e.fechaFin)-new Date(e.fecha))/(1000*60*60*24))+1;
  },0);
  const heTotal = eventos.filter(e=>e.tipo==="horaExtra"&&e.estado==="aprobado").reduce((a,e)=>a+Number(e.horas||0),0);
  const pendientes = eventos.filter(e=>e.estado==="pendiente").length;
  const bonosRegistros = eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo));
  const bonosAprobados = bonosRegistros.filter(e=>e.estado==="aprobado");
  const bonosMonto = bonosAprobados.reduce((a,e)=>a+Number(e.valor||0),0);

  const chip = (bg,color,border,children) => ({display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:12,background:bg,color,border});

  return (
    <div className="ein">
      <button className="btn-g" style={S.btn} onClick={onVolver}>← Volver</button>
      <div style={{...S.card,padding:22,marginTop:16,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,#3d7a52,#1a4a2e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{t.nombre[0].toUpperCase()}</div>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900}}>{t.nombre}</div>
              <div style={{fontSize:13,color:"#6aaa7a",marginTop:2}}>{t.cargo||"Sin cargo"} · {t.contrato||"—"}</div>
              <div style={{fontSize:12,color:"#4a8a6a",marginTop:2}}>{t.zona||"Sin zona asignada"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={chip("rgba(59,130,246,0.12)","#93c5fd","1px solid rgba(59,130,246,0.25)")}>🏖️ {vacAprobadas}d vac.</span>
            <span style={chip("rgba(34,197,94,0.12)","#86efac","1px solid rgba(34,197,94,0.25)")}>⏰ {heTotal}h ext.</span>
            {bonosTotal>0&&<span style={chip("rgba(124,58,237,0.12)","#c4b5fd","1px solid rgba(124,58,237,0.25)")}>💰 {bonosTotal}h bon.</span>}
            {pendientes>0&&<span style={chip("rgba(245,158,11,0.12)","#fcd34d","1px solid rgba(245,158,11,0.25)")}>⏳ {pendientes} pend.</span>}
            <button className="btn-d" style={{...S.btn,fontSize:12,padding:"5px 12px"}} onClick={()=>{if(window.confirm("¿Eliminar trabajador?")) onDelete();}}>🗑 Eliminar</button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["ficha","📋 Ficha"],["eventos","📅 Eventos"],["bonos","💰 Bonos"],["resumen","📊 Resumen"]].map(([tb,lb])=>(
          <button key={tb} className={`tab${tab===tb?" on":""}`} onClick={()=>setTab(tb)}>{lb}</button>
        ))}
      </div>

      {tab==="ficha"&&(
        <div className="ein">
          {/* ── SECCIÓN 1: DATOS PERSONALES ── */}
          <div style={{...S.card,padding:18,marginBottom:12}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>👤 Datos Personales</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NOMBRE COMPLETO</label>
                <input style={S.input} value={t.nombre||""} onChange={e=>onUpdate({nombre:e.target.value})}/>
              </div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>RUT</label><input style={S.input} value={t.rut||""} onChange={e=>onUpdate({rut:e.target.value})}/></div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>FECHA DE NACIMIENTO</label><input type="date" style={S.input} value={t.fechaNacimiento||""} onChange={e=>onUpdate({fechaNacimiento:e.target.value})}/></div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NACIONALIDAD</label><input style={S.input} value={t.nacionalidad||""} onChange={e=>onUpdate({nacionalidad:e.target.value})} placeholder="Chileno/a, Peruano/a..."/></div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TELÉFONO / CELULAR</label><input type="tel" style={S.input} value={t.telefono||""} onChange={e=>onUpdate({telefono:e.target.value})}/></div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>EMAIL</label><input type="email" style={S.input} value={t.email||""} onChange={e=>onUpdate({email:e.target.value})}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>DIRECCIÓN</label><input style={S.input} value={t.direccion||""} onChange={e=>onUpdate({direccion:e.target.value})} placeholder="Calle, número, comuna..."/></div>
            </div>
          </div>

          {/* ── SECCIÓN 2: DATOS LABORALES ── */}
          <div style={{...S.card,padding:18,marginBottom:12}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>💼 Datos Laborales</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>CARGO</label>
                <select style={S.input} value={t.cargo||""} onChange={e=>onUpdate({cargo:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {CARGOS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TIPO DE CONTRATO</label>
                <select style={S.input} value={t.contrato||"indefinido"} onChange={e=>onUpdate({contrato:e.target.value})}>
                  {CONTRATOS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>FECHA DE INGRESO</label><input type="date" style={S.input} value={t.fechaIngreso||""} onChange={e=>onUpdate({fechaIngreso:e.target.value})}/></div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
                <select style={S.input} value={t.estado||"vigente"} onChange={e=>onUpdate({estado:e.target.value})}>
                  {["vigente","vacaciones","licencia","desvinculado"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 3: HORARIO DE TRABAJO ── */}
          <div style={{...S.card,padding:18,marginBottom:12}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>🕐 Horario de Trabajo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>DÍAS DE TRABAJO</label>
                <input style={S.input} value={t.diasTrabajo||""} onChange={e=>onUpdate({diasTrabajo:e.target.value})} placeholder="Ej: Lun-Sáb"/>
              </div>
              <div><label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>HORAS / SEMANA</label>
                <input type="number" style={S.input} value={t.horasSemana||""} onChange={e=>onUpdate({horasSemana:e.target.value})} placeholder="42"/>
              </div>
            </div>
            {/* Tabla horaria */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"'Georgia',serif",minWidth:380}}>
                <thead>
                  <tr style={{background:"rgba(61,122,82,0.15)"}}>
                    {["Jornada","Entrada","Alm. inicio","Alm. término","Salida","Hrs/día"].map(h=>(
                      <th key={h} style={{padding:"6px 8px",textAlign:"left",color:"#6aaa7a",fontSize:10,letterSpacing:"0.5px",fontWeight:600,whiteSpace:"nowrap"}}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(t.horario||[{dias:"Lun · Mar · Mié",entrada:"",almInicio:"",almTermino:"",salida:"",hrsDia:""}]).map((fila,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      {[["dias","Lun · Mar · Mié"],["entrada","08:00"],["almInicio","13:00"],["almTermino","14:00"],["salida","17:00"],["hrsDia","8"]].map(([k,ph])=>(
                        <td key={k} style={{padding:"4px 4px"}}>
                          <input style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#ede9e0",padding:"4px 6px",fontFamily:"'Georgia',serif",fontSize:11,width:"100%",outline:"none"}}
                            value={fila[k]||""} placeholder={ph}
                            onChange={e=>{const h=[...(t.horario||[{dias:"",entrada:"",almInicio:"",almTermino:"",salida:"",hrsDia:""}])];h[i]={...h[i],[k]:e.target.value};onUpdate({horario:h});}}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button onClick={()=>{const h=[...(t.horario||[])];h.push({dias:"",entrada:"",almInicio:"",almTermino:"",salida:"",hrsDia:""});onUpdate({horario:h});}}
                style={{...S.btn,fontSize:11,padding:"4px 12px",background:"rgba(61,122,82,0.2)",color:"#80c890",border:"1px solid rgba(61,122,82,0.3)",cursor:"pointer"}}>+ Fila</button>
              {(t.horario||[]).length>1&&(
                <button onClick={()=>{const h=[...(t.horario||[])];h.pop();onUpdate({horario:h});}}
                  style={{...S.btn,fontSize:11,padding:"4px 12px",background:"rgba(239,68,68,0.1)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer"}}>- Fila</button>
              )}
            </div>
          </div>

          {/* ── SECCIÓN 4: UNIFORMES ── */}
          <div style={{...S.card,padding:18,marginBottom:12}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>👕 Tallas de Uniformes</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[["Polera","tallaPolera"],["Polerón","tallaPoleron"],["Pantalón","tallaPantalon"],["Zapato","tallaZapato"]].map(([lbl,k])=>(
                <div key={k}>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>{lbl.toUpperCase()}</label>
                  <input style={S.input} value={t[k]||""} onChange={e=>onUpdate({[k]:e.target.value})} placeholder="XS/S/M/L/XL o número"/>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECCIÓN 5: ACCESO ── */}
          <div style={{...S.card,padding:18,marginBottom:12}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:12,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>🔐 Acceso al Sistema</div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:"0 0 auto"}}>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>PIN (4 DÍGITOS)</label>
                <input type="password" maxLength={4} placeholder="••••"
                  style={{...S.input,maxWidth:120,fontSize:20,letterSpacing:"0.5em",textAlign:"center"}}
                  value={t.pin||""} onChange={e=>onUpdate({pin:e.target.value})}/>
              </div>
              <div style={{fontSize:12,color:"#5a8a6a",flex:1}}>El trabajador usa este PIN para acceder a 🌿 Mi Turno y ver sus tareas del día.</div>
            </div>
          </div>

          {/* ── SECCIÓN 6: OBSERVACIONES ── */}
          <div style={{...S.card,padding:18}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:10,color:"#a0d8b0",borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:8}}>📝 Observaciones</div>
            <textarea rows={3} style={{...S.input,resize:"vertical"}} value={t.notas||""} onChange={e=>onUpdate({notas:e.target.value})} placeholder="Anotaciones generales del trabajador..."/>
          </div>
        </div>
      )}

      {tab==="eventos"&&(
        <div className="ein">
          <div style={{...S.card,padding:16,marginBottom:14}}>
            {!showNuevoEvento?(
              <button style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)",cursor:"pointer"}} onClick={()=>setShowNuevoEvento(true)}>➕ Registrar evento</button>
            ):(
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14}}>Nuevo Evento</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TIPO</label>
                    <TipoEventoSelector value={nuevoEvento.tipo} onChange={v=>setNuevoEvento(p=>({...p,tipo:v}))} S={S} TIPO_EVENTO={TIPO_EVENTO}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
                    <select style={S.input} value={nuevoEvento.estado} onChange={e=>setNuevoEvento(p=>({...p,estado:e.target.value}))}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>FECHA INICIO</label>
                    <input type="date" style={S.input} value={nuevoEvento.fecha} onChange={e=>setNuevoEvento(p=>({...p,fecha:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>FECHA FIN (opcional)</label>
                    <input type="date" style={S.input} value={nuevoEvento.fechaFin} onChange={e=>setNuevoEvento(p=>({...p,fechaFin:e.target.value}))}/>
                  </div>
                  {nuevoEvento.tipo==="horaExtra"&&(
                    <div>
                      <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>HORAS EXTRA</label>
                      <input type="number" min="0" style={S.input} value={nuevoEvento.horas} onChange={e=>setNuevoEvento(p=>({...p,horas:e.target.value}))}/>
                    </div>
                  )}
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>DESCRIPCIÓN</label>
                    <textarea rows={2} style={{...S.input,resize:"vertical"}} value={nuevoEvento.descripcion} onChange={e=>setNuevoEvento(p=>({...p,descripcion:e.target.value}))}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-p" style={S.btn} onClick={()=>{
                    if(!nuevoEvento.fecha) return;
                    onAddEvento(nuevoEvento);
                    setNuevoEvento({tipo:"permiso",fecha:"",fechaFin:"",horas:"",descripcion:"",estado:"pendiente"});
                    setShowNuevoEvento(false);
                  }}>✓ Guardar</button>
                  <button className="btn-g" style={S.btn} onClick={()=>setShowNuevoEvento(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
          {eventos.filter(e=>!["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).length===0&&(
            <div style={{textAlign:"center",color:"#4a8a5a",padding:32,fontSize:14}}>Sin eventos registrados.</div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {eventos.filter(e=>!["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).map(ev=>{
              const tp=TIPO_EVENTO[ev.tipo]||TIPO_EVENTO.otro;
              const est=ESTADO_EVENTO[ev.estado]||ESTADO_EVENTO.pendiente;
              const dias=ev.fechaFin&&ev.fecha?Math.round((new Date(ev.fechaFin)-new Date(ev.fecha))/(1000*60*60*24))+1:null;
              return (
              <div key={ev.id}>
                <div style={{...S.card,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:12}}>
                  <div style={{display:"flex",gap:10,alignItems:"start",flex:1}}>
                    <span style={{fontSize:20,flexShrink:0}}>{tp.icon}</span>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:600,color:tp.color}}>{tp.label}</span>
                        <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,background:`${est.color}18`,color:est.color,border:`1px solid ${est.color}35`}}>{est.label}</span>
                        {dias&&<span style={{fontSize:12,color:"#6aaa7a"}}>{dias} día{dias!==1?"s":""}</span>}
                        {ev.horas&&<span style={{fontSize:12,color:"#6aaa7a"}}>{ev.horas}h</span>}
                      </div>
                      <div style={{fontSize:12,color:"#5a8a6a"}}>{ev.fecha}{ev.fechaFin&&ev.fechaFin!==ev.fecha?" → "+ev.fechaFin:""}</div>
                      {ev.descripcion&&<div style={{fontSize:12,color:"#7aaa80",marginTop:3,fontStyle:"italic"}}>{ev.descripcion}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>abrirEditEvento(ev)}>✏️</button>
                    <select value={ev.estado} style={{...S.input,width:"auto",fontSize:12,padding:"4px 8px"}} onChange={e=>onUpdateEvento(ev.id,{estado:e.target.value})}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>onDeleteEvento(ev.id)}>🗑</button>
                  </div>
                </div>
                {/* Formulario edición inline */}
                {editEventoId===ev.id&&(
                  <div style={{marginTop:4,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.1)"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>TIPO</label>
                        <TipoEventoSelector value={editEventoForm.tipo||"permiso"} onChange={v=>setEditEventoForm(p=>({...p,tipo:v}))} S={S} TIPO_EVENTO={TIPO_EVENTO}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>ESTADO</label>
                        <select style={S.input} value={editEventoForm.estado||"pendiente"} onChange={e=>setEditEventoForm(p=>({...p,estado:e.target.value}))}>
                          {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>FECHA</label>
                        <input type="date" style={S.input} value={editEventoForm.fecha||""} onChange={e=>setEditEventoForm(p=>({...p,fecha:e.target.value}))}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>FECHA FIN</label>
                        <input type="date" style={S.input} value={editEventoForm.fechaFin||""} onChange={e=>setEditEventoForm(p=>({...p,fechaFin:e.target.value}))}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>HORAS</label>
                        <input type="number" min={0} style={S.input} value={editEventoForm.horas||""} onChange={e=>setEditEventoForm(p=>({...p,horas:e.target.value}))}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>VALOR ($)</label>
                        <input type="number" min={0} style={S.input} value={editEventoForm.valor||""} onChange={e=>setEditEventoForm(p=>({...p,valor:e.target.value}))}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>DESCRIPCIÓN</label>
                        <input style={S.input} value={editEventoForm.descripcion||""} onChange={e=>setEditEventoForm(p=>({...p,descripcion:e.target.value}))}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn-p" style={S.btn} onClick={guardarEditEvento}>✓ Guardar</button>
                      <button className="btn-g" style={S.btn} onClick={()=>setEditEventoId(null)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {tab==="bonos"&&(
        <div className="ein">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
            {[
              {tipo:"bonoConstruccion",label:"Bono Construcción",  color:"#f97316",icon:"🏗️"},
              {tipo:"bonoPesado",      label:"Bono Trabajo Pesado",color:"#dc2626",icon:"💪"},
              {tipo:"bonoEspecializado",label:"Bono Especializado",color:"#7c3aed",icon:"⭐"},
            ].map(b=>{
              const aprobados=eventos.filter(e=>e.tipo===b.tipo&&e.estado==="aprobado");
              const totalH=aprobados.reduce((a,e)=>a+Number(e.horas||0),0);
              return (
                <div key={b.tipo} style={{...S.card,padding:"18px 14px",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:6}}>{b.icon}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:b.color}}>{totalH}<span style={{fontSize:14,marginLeft:3}}>h</span></div>
                  <div style={{fontSize:12,color:"#6aaa7a",marginBottom:4}}>{b.label}</div>
                  <div style={{fontSize:11,color:"#4a7a5a"}}>{aprobados.length} registro{aprobados.length!==1?"s":""}</div>
                </div>
              );
            })}
          </div>
          <div style={{...S.card,padding:16,marginBottom:14}}>
            {!showNuevoEvento?(
              <button style={{...S.btn,background:"rgba(124,58,237,0.2)",color:"#c4b5fd",border:"1px solid rgba(124,58,237,0.35)",cursor:"pointer"}} onClick={()=>{setNuevoEvento(p=>({...p,tipo:"bonoConstruccion"}));setShowNuevoEvento(true);}}>➕ Registrar bono</button>
            ):(
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14}}>Nuevo Bono</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TIPO DE BONO</label>
                    <select style={S.input} value={nuevoEvento.tipo} onChange={e=>setNuevoEvento(p=>({...p,tipo:e.target.value}))}>
                      <option value="bonoConstruccion">🏗️ Bono Construcción</option>
                      <option value="bonoPesado">💪 Bono Trabajo Pesado</option>
                      <option value="bonoEspecializado">⭐ Bono Especializado</option>
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
                    <select style={S.input} value={nuevoEvento.estado} onChange={e=>setNuevoEvento(p=>({...p,estado:e.target.value}))}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>FECHA</label>
                    <input type="date" style={S.input} value={nuevoEvento.fecha} onChange={e=>setNuevoEvento(p=>({...p,fecha:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>HORAS</label>
                    <input type="number" min="0" style={S.input} value={nuevoEvento.horas} placeholder="0" onChange={e=>setNuevoEvento(p=>({...p,horas:e.target.value}))}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>VALOR ($)</label>
                    <input type="number" min="0" style={S.input} value={nuevoEvento.valor||""} placeholder="ej: 25000" onChange={e=>setNuevoEvento(p=>({...p,valor:e.target.value}))}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>DESCRIPCIÓN</label>
                    <textarea rows={2} style={{...S.input,resize:"vertical"}} value={nuevoEvento.descripcion} onChange={e=>setNuevoEvento(p=>({...p,descripcion:e.target.value}))}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-p" style={S.btn} onClick={()=>{
                    if(!nuevoEvento.fecha) return;
                    onAddEvento(nuevoEvento);
                    setNuevoEvento({tipo:"bonoConstruccion",fecha:"",fechaFin:"",horas:"",descripcion:"",estado:"pendiente"});
                    setShowNuevoEvento(false);
                  }}>✓ Guardar</button>
                  <button className="btn-g" style={S.btn} onClick={()=>setShowNuevoEvento(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).map(ev=>{
              const tp=TIPO_EVENTO[ev.tipo];
              const est=ESTADO_EVENTO[ev.estado]||ESTADO_EVENTO.pendiente;
              return (
              <div key={ev.id}>
                <div style={{...S.card,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:12}}>
                  <div style={{display:"flex",gap:10,alignItems:"start",flex:1}}>
                    <span style={{fontSize:20,flexShrink:0}}>{tp.icon}</span>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:600,color:tp.color}}>{tp.label}</span>
                        <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,background:`${est.color}18`,color:est.color,border:`1px solid ${est.color}35`}}>{est.label}</span>
                        {ev.horas&&<span style={{fontSize:12,color:"#6aaa7a"}}>⏰ {ev.horas}h</span>}
                        {ev.valor&&<span style={{fontSize:13,fontWeight:700,color:"#c4b5fd",fontFamily:"'Playfair Display',serif"}}>💵 ${Number(ev.valor).toLocaleString("es-CL")}</span>}
                      </div>
                      <div style={{fontSize:12,color:"#5a8a6a"}}>{ev.fecha}</div>
                      {ev.descripcion&&<div style={{fontSize:12,color:"#7aaa80",marginTop:3,fontStyle:"italic"}}>{ev.descripcion}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>abrirEditEvento(ev)}>✏️</button>
                    <select value={ev.estado} style={{...S.input,width:"auto",fontSize:12,padding:"4px 8px"}} onChange={e=>onUpdateEvento(ev.id,{estado:e.target.value})}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>onDeleteEvento(ev.id)}>🗑</button>
                  </div>
                </div>
                {editEventoId===ev.id&&(
                  <div style={{marginTop:4,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(255,255,255,0.1)"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>FECHA</label>
                        <input type="date" style={S.input} value={editEventoForm.fecha||""} onChange={e=>setEditEventoForm(p=>({...p,fecha:e.target.value}))}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>ESTADO</label>
                        <select style={S.input} value={editEventoForm.estado||"pendiente"} onChange={e=>setEditEventoForm(p=>({...p,estado:e.target.value}))}>
                          {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>VALOR ($)</label>
                        <input type="number" min={0} style={S.input} value={editEventoForm.valor||""} onChange={e=>setEditEventoForm(p=>({...p,valor:e.target.value}))}/>
                      </div>
                      <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>HORAS</label>
                        <input type="number" min={0} style={S.input} value={editEventoForm.horas||""} onChange={e=>setEditEventoForm(p=>({...p,horas:e.target.value}))}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>DESCRIPCIÓN</label>
                        <input style={S.input} value={editEventoForm.descripcion||""} onChange={e=>setEditEventoForm(p=>({...p,descripcion:e.target.value}))}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn-p" style={S.btn} onClick={guardarEditEvento}>✓ Guardar</button>
                      <button className="btn-g" style={S.btn} onClick={()=>setEditEventoId(null)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
            {/* Total bonos aprobados */}
            {eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)&&e.estado==="aprobado"&&e.valor).length>0&&(
              <div style={{...S.card,padding:"10px 16px",background:"rgba(196,181,253,0.08)",borderColor:"rgba(196,181,253,0.2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:"#c4b5fd"}}>💰 Total bonos aprobados</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#c4b5fd"}}>
                  ${eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)&&e.estado==="aprobado"&&e.valor).reduce((a,e)=>a+Number(e.valor||0),0).toLocaleString("es-CL")}
                </span>
              </div>
            )}
            {eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).length===0&&(
              <div style={{textAlign:"center",color:"#4a8a5a",padding:32,fontSize:14}}>Sin bonos registrados.</div>
            )}
          </div>
        </div>
      )}

      {tab==="resumen"&&(
        <div className="ein">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
            {[
              {label:"Días vacaciones",val:vacAprobadas,color:"#3b82f6",icon:"🏖️"},
              {label:"Horas extra",val:`${heTotal}h`,color:"#22c55e",icon:"⏰"},
              {label:"Permisos",val:eventos.filter(e=>e.tipo==="permiso").length,color:"#f59e0b",icon:"📋"},
              {label:"Licencias",val:eventos.filter(e=>e.tipo==="licencia").length,color:"#a78bfa",icon:"🏥"},
              {label:"Capacitaciones",val:eventos.filter(e=>e.tipo==="capacitacion").length,color:"#2dd4bf",icon:"📚"},
              {label:"Amonestaciones",val:eventos.filter(e=>e.tipo==="amonestacion").length,color:"#ef4444",icon:"⚠️"},
            ].map(s=>(
              <div key={s.label} style={{...S.card,padding:"14px 10px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#6aaa7a"}}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Resumen bonos por tipo */}
          <div style={{...S.card,padding:16,marginBottom:14}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,marginBottom:10}}>💰 Bonos por tarea</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:bonosRegistros.length>0?10:0}}>
              {[
                {tipo:"bonoConstruccion",label:"Bono Construcción",color:"#f97316",icon:"🏗️"},
                {tipo:"bonoPesado",label:"Bono Trabajo Pesado",color:"#dc2626",icon:"💪"},
                {tipo:"bonoEspecializado",label:"Bono Especializado",color:"#7c3aed",icon:"⭐"},
              ].map(b=>{
                const regs = bonosRegistros.filter(e=>e.tipo===b.tipo);
                const aprov = regs.filter(e=>e.estado==="aprobado");
                const monto = aprov.reduce((a,e)=>a+Number(e.valor||0),0);
                return (
                  <div key={b.tipo} style={{background:`${b.color}10`,borderRadius:8,padding:"10px 12px",border:`1px solid ${b.color}30`}}>
                    <div style={{fontSize:16,marginBottom:4}}>{b.icon}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:b.color}}>{regs.length}</div>
                    <div style={{fontSize:10,color:"#6aaa7a",marginBottom:4}}>registro{regs.length!==1?"s":""} · {aprov.length} aprobado{aprov.length!==1?"s":""}</div>
                    {monto>0&&<div style={{fontSize:12,fontWeight:700,color:b.color}}>${monto.toLocaleString("es-CL")}</div>}
                    <div style={{fontSize:10,color:"#5a8a6a"}}>{b.label}</div>
                  </div>
                );
              })}
            </div>
            {bonosMonto>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(196,181,253,0.08)",borderRadius:7,border:"1px solid rgba(196,181,253,0.2)"}}>
              <span style={{fontSize:12,color:"#c4b5fd"}}>Total bonos aprobados</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#c4b5fd"}}>${bonosMonto.toLocaleString("es-CL")}</span>
            </div>}
            {bonosRegistros.length===0&&<div style={{fontSize:12,color:"#4a6a54",textAlign:"center",padding:8}}>Sin bonos por tarea registrados</div>}
          </div>
          <div style={{...S.card,padding:18}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14}}>Últimos eventos</div>
            {eventos.slice(0,8).map(ev=>{
              const tp=TIPO_EVENTO[ev.tipo]||TIPO_EVENTO.otro;
              const est=ESTADO_EVENTO[ev.estado]||ESTADO_EVENTO.pendiente;
              return (
                <div key={ev.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <span style={{fontSize:14}}>{tp.icon} {tp.label}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,color:est.color}}>{est.label}</span>
                    <span style={{fontSize:12,color:"#5a8a6a"}}>{ev.fecha}</span>
                  </div>
                </div>
              );
            })}
            {eventos.length===0&&<div style={{color:"#4a7a5a",fontSize:13,textAlign:"center",padding:12}}>Sin eventos</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const PERSONAL_INICIAL = [
  {
    id: 1001,
    nombre: "Carmen Luz Hermosilla Diez",
    rut: "—",
    cargo: "Jefa de Áreas Verdes",
    contrato: "indefinido",
    telefono: "",
    email: "",
    fechaIngreso: "",
    zona: "",
    notas: "Jornada: Lun 08-18h · Mar-Jue 09-18h · Vie 08-18h · 42h/semana",
    pin: "",
    eventos: [],
  },
  {
    id: 1002, nombre:"Juber Leopoldo Juárez Burgos", rut:"22.052.327-6",
    cargo:"Supervisor de Áreas Verdes", contrato:"indefinido",
    telefono:"+56 9 5959 9594", email:"juberjuarez1234@gmail.com",
    fechaIngreso:"2016-11-10", fechaNacimiento:"1987-08-31",
    nacionalidad:"Peruano", direccion:"Pantaleón Vélez Silva 862, Independencia",
    tallaPolera:"M", tallaPoleron:"M", tallaPantalon:"44", tallaZapato:"39",
    diasTrabajo:"Lun-Sáb", horasSemana:42,
    horario:[
      {dias:"Lun · Mar · Mié",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"17:00",hrsDia:"8"},
      {dias:"Jue · Vie",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"16:00",hrsDia:"7"},
      {dias:"Sáb",entrada:"08:00",almInicio:"—",almTermino:"—",salida:"12:00",hrsDia:"4"},
    ],
    estado:"vigente", pin:"", notas:"", eventos:[],
  },
  {
    id: 1003, nombre:"Andrés Astorga Guzmán", rut:"17.879.479-5",
    cargo:"Jardinero", contrato:"indefinido",
    telefono:"+56 9 7834 6909", email:"astorga.guzman@gmail.com",
    fechaIngreso:"2023-09-25", fechaNacimiento:"1991-09-16",
    nacionalidad:"Chileno", direccion:"San Agustín 9122, Pudahuel",
    tallaPolera:"M", tallaPoleron:"M", tallaPantalon:"44", tallaZapato:"42",
    diasTrabajo:"Lun-Sáb", horasSemana:42,
    horario:[
      {dias:"Lun · Mar · Mié",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"17:00",hrsDia:"8"},
      {dias:"Jue · Vie",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"16:00",hrsDia:"7"},
      {dias:"Sáb",entrada:"08:00",almInicio:"—",almTermino:"—",salida:"12:00",hrsDia:"4"},
    ],
    estado:"vigente", pin:"", notas:"Ingreso anterior: 30-08-2021", eventos:[],
  },
  {
    id: 1004, nombre:"Osmar Bhalú Armijo Zúñiga", rut:"15.065.268-5",
    cargo:"Jardinero", contrato:"indefinido",
    telefono:"+56 9 6756 0322", email:"bhalu.armijo@gmail.com",
    fechaIngreso:"2021-08-30", fechaNacimiento:"1996-11-22",
    nacionalidad:"Chileno", direccion:"Mar de Drake 402, Pudahuel",
    tallaPolera:"L", tallaPoleron:"L", tallaPantalon:"44", tallaZapato:"43",
    diasTrabajo:"Lun-Sáb", horasSemana:42,
    horario:[
      {dias:"Lun · Mar · Mié",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"17:00",hrsDia:"8"},
      {dias:"Jue · Vie",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"16:00",hrsDia:"7"},
      {dias:"Sáb",entrada:"08:00",almInicio:"—",almTermino:"—",salida:"12:00",hrsDia:"4"},
    ],
    estado:"vigente", pin:"", notas:"", eventos:[],
  },
  {
    id: 1005, nombre:"Sergio Esteban Peña Quintanilla", rut:"13.682.102-4",
    cargo:"Jardinero", contrato:"indefinido",
    telefono:"+56 9 7541 9199", email:"bandiiiixx@gmail.com",
    fechaIngreso:"2015-06-04", fechaNacimiento:"1979-07-19",
    nacionalidad:"Chileno", direccion:"Santa Teresa 1902, Estación Central",
    tallaPolera:"M", tallaPoleron:"M", tallaPantalon:"48", tallaZapato:"40",
    diasTrabajo:"Lun-Sáb", horasSemana:42,
    horario:[
      {dias:"Lun · Mar · Mié",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"17:00",hrsDia:"8"},
      {dias:"Jue · Vie",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"16:00",hrsDia:"7"},
      {dias:"Sáb",entrada:"08:00",almInicio:"—",almTermino:"—",salida:"12:00",hrsDia:"4"},
    ],
    estado:"vigente", pin:"", notas:"", eventos:[],
  },
  {
    id: 1006, nombre:"Saúl Molina Escalera", rut:"28.444.223-7",
    cargo:"Jardinero", contrato:"indefinido",
    telefono:"+56 9 5922 6281", email:"marcelopolancopavez@gmail.com",
    fechaIngreso:"2024-10-01", fechaNacimiento:"2002-06-29",
    nacionalidad:"Boliviano", direccion:"Los Loros 6720, Cerro Navia",
    tallaPolera:"XL", tallaPoleron:"L", tallaPantalon:"50", tallaZapato:"43",
    diasTrabajo:"Lun-Sáb", horasSemana:42,
    horario:[
      {dias:"Lun · Mar · Mié",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"17:00",hrsDia:"8"},
      {dias:"Jue · Vie",entrada:"08:00",almInicio:"13:00",almTermino:"14:00",salida:"16:00",hrsDia:"7"},
      {dias:"Sáb",entrada:"08:00",almInicio:"—",almTermino:"—",salida:"12:00",hrsDia:"4"},
    ],
    estado:"vigente", pin:"", notas:"", eventos:[],
  },
];

// ─── PROGRAMA ANUAL DE FUNGICIDAS ────────────────────────────────────────────
const PROGRAMA_FUNGICIDAS = [
  // INVIERNO Jun-Ago
  { mes:6,  estacion:"invierno",  superficie:"Agrostis stolonifera", producto:"Benomil + Mancozeb",    dosis:"400 g/ha + 2,5 kg/ha", objetivo:"Contener Microdochium nivale",      prioridad:"alta",  tipo:"mezcla"    },
  { mes:7,  estacion:"invierno",  superficie:"Agrostis / General",   producto:"Mancozeb 80% WP",       dosis:"2,5 kg/ha",            objetivo:"Protectante invernal",              prioridad:"media", tipo:"simple"    },
  { mes:8,  estacion:"invierno",  superficie:"Agrostis stolonifera", producto:"Apolo 25 EW (tebuconazol)", dosis:"1,0 L/ha",         objetivo:"Triazol pre-rebrote",               prioridad:"alta",  tipo:"simple"    },
  // PRIMAVERA Sep-Nov
  { mes:9,  estacion:"primavera", superficie:"Agrostis stolonifera", producto:"Amistar TOP",            dosis:"0,75 L/ha",           objetivo:"Protección al rebrote",             prioridad:"alta",  tipo:"simple"    },
  { mes:10, estacion:"primavera", superficie:"General",              producto:"Mancozeb 80% WP",        dosis:"2,5 kg/ha",           objetivo:"Rotación multisitio",               prioridad:"media", tipo:"simple"    },
  { mes:11, estacion:"primavera", superficie:"Agrostis stolonifera", producto:"Score 250 EC (difenoconazol)", dosis:"0,5 L/ha",      objetivo:"Si hay presión de enfermedad",      prioridad:"baja",  tipo:"condicional"},
  // VERANO Dic-Feb
  { mes:12, estacion:"verano",    superficie:"General",              producto:"—",                      dosis:"—",                   objetivo:"Monitoreo solamente",               prioridad:"baja",  tipo:"monitoreo" },
  { mes:1,  estacion:"verano",    superficie:"General",              producto:"Mancozeb 80% WP",        dosis:"2,5 kg/ha",           objetivo:"Preventivo si hay humedad alta",    prioridad:"baja",  tipo:"condicional"},
  { mes:2,  estacion:"verano",    superficie:"Agrostis stolonifera", producto:"Amistar TOP",            dosis:"0,75 L/ha",           objetivo:"Aplicación pre-otoño",              prioridad:"media", tipo:"simple"    },
  // OTOÑO Mar-May
  { mes:3,  estacion:"otono",     superficie:"Agrostis stolonifera", producto:"Amistar TOP",            dosis:"1,0 L/ha",            objetivo:"Aplicación clave pre-otoño",        prioridad:"alta",  tipo:"simple"    },
  { mes:4,  estacion:"otono",     superficie:"General",              producto:"Mancozeb + Apolo 25 EW", dosis:"2,5 kg/ha + 1,0 L/ha",objetivo:"Máxima cobertura otoñal",           prioridad:"alta",  tipo:"mezcla"    },
  { mes:5,  estacion:"otono",     superficie:"Agrostis stolonifera", producto:"Score 250 EC",           dosis:"0,5 L/ha",            objetivo:"Curativo si hay parches activos",   prioridad:"media", tipo:"condicional"},
];

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const ESTACION_CONFIG = {
  verano:    { color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  icon:"☀️"  },
  otono:     { color:"#f97316", bg:"rgba(249,115,22,0.12)",  icon:"🍂"  },
  invierno:  { color:"#60a5fa", bg:"rgba(96,165,250,0.12)",  icon:"❄️"  },
  primavera: { color:"#4ade80", bg:"rgba(74,222,128,0.12)",  icon:"🌸"  },
};
const PRIORIDAD_CONFIG = {
  alta:      { color:"#ef4444", bg:"rgba(239,68,68,0.12)",   label:"Alta"       },
  media:     { color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  label:"Media"      },
  baja:      { color:"#6aaa7a", bg:"rgba(106,170,122,0.12)", label:"Baja/Cond." },
};

// ─── PROVEEDOR Y STOCK ───────────────────────────────────────────────────────
const PROVEEDOR_PRINCIPAL = {
  nombre: "Brigitte Elena Pardo Contreras",
  empresa: "Copargo Agro",
  rut: "10.831.211-4",
  giro: "Venta de Semillas / Agroquímicos",
  direccion: "La Paz 419, Recoleta, Santiago",
  telefono: "+56 232 637 700",
  email: "agrobrisol@yahoo.es",
  vendedor: "Marlene Pino Zapata",
  telefonoVendedor: "+56 9 9907 1213",
  condicion: "Crédito 30 días",
};

const STOCK_INICIAL = [
  { id:"s1", producto:"Amistar TOP x 1 lt. (Azoxistrobina + Difenoconazol)", codigo:"350610381", unidad:"L",  stockActual:2, stockMinimo:1, precioUnitario:82000, grupo:"Estrobilurina + Triazol" },
  { id:"s2", producto:"Score 250 EC x 1 lt. (Difenoconazol)",                codigo:"350612657", unidad:"L",  stockActual:2, stockMinimo:1, precioUnitario:55500, grupo:"Triazol" },
  { id:"s3", producto:"Fungizeb 800 WP x 1 kg. (Mancozeb)",                  codigo:"350481354", unidad:"kg", stockActual:5, stockMinimo:2, precioUnitario:8824,  grupo:"Multisitio" },
  { id:"s4", producto:"Apolo 25 EW x 1 lt. (Tebuconazol)",                   codigo:"350111398", unidad:"L",  stockActual:2, stockMinimo:1, precioUnitario:25210, grupo:"Triazol" },
];

const PEDIDO_INICIAL = [{
  id: 7609,
  fecha: "2026-06-10",
  proveedor: "Copargo Agro",
  vendedor: "Marlene Pino Zapata",
  condicion: "Crédito 30 días",
  vencimiento: "2026-07-10",
  total: 439753,
  items: [
    { codigo:"350610381", descripcion:"Fung. Amistar Top x 1 lt. SYN",             cantidad:2, precio:82000,  total:164000 },
    { codigo:"350612657", descripcion:"Fung. Score 250 EC x 1 lt. SYN",            cantidad:2, precio:55500,  total:111000 },
    { codigo:"350481354", descripcion:"Fung. Fungizeb 800 WP x 1 kg. (Mancozeb)",  cantidad:5, precio:8824,   total:44120  },
    { codigo:"350111398", descripcion:"Fung. Apolo 25 EW (Tebuconazol) x 1 lt.",   cantidad:2, precio:25210,  total:50420  },
  ],
}];

// ─── SECTORES DE APLICACIÓN ──────────────────────────────────────────────────
const SECTORES_APLICACION = {
  "Greens": [
    "Green 01","Green 02","Green 03","Green 04","Green 05","Green 06",
    "Green 07","Green 08","Green 09","Green 10","Green 11","Green 12",
    "Green 13","Green 14","Green 15","Green 16","Green 17","Green 18",
    "Todos los greens",
  ],
  "Fairways": [
    "Fairway 01","Fairway 02","Fairway 03","Fairway 04","Fairway 05",
    "Fairway 06","Fairway 07","Fairway 08","Fairway 09","Fairway 10",
    "Fairway 11","Fairway 12","Fairway 13","Fairway 14","Fairway 15",
    "Fairway 16","Fairway 17","Fairway 18","Todos los fairways",
  ],
  "Tees": [
    "Tee 01","Tee 02","Tee 03","Tee 04","Tee 05","Tee 06",
    "Tee 07","Tee 08","Tee 09","Tee 10","Tee 11","Tee 12",
    "Todos los tees",
  ],
  "Otras zonas": [
    "Alameda Central (Agrostis)","Chépica peruana (general)",
    "Canchas fútbol","Zonas ornamentales","Completo (todo el campo)",
    "Otro",
  ],
};

// ─── REINGRESO POR PRODUCTO (días desde ficha técnica SAG) ───────────────────
const REINGRESO_DIAS = {
  "Amistar TOP (Azoxistrobina + Difenoconazol)": { dias:1,  nota:"No cosechar en 7 días. Reingreso 24 hrs post-aplicación (Reg SAG 2595)" },
  "Score 250 EC (Difenoconazol)":                { dias:1,  nota:"Reingreso 24 hrs. No aplicar con viento >15 km/h (Reg SAG 2343)" },
  "Apolo 25 EW (Tebuconazol)":                   { dias:1,  nota:"Reingreso 24 hrs post-aplicación seca (Reg SAG Anasac)" },
  "Fungizeb 800 WP (Mancozeb)":                  { dias:1,  nota:"Reingreso 24 hrs. Usar EPP completo durante aplicación (Reg SAG 2797)" },
  "Benomil 50% WP":                              { dias:1,  nota:"Reingreso 24 hrs. Benzimidazol, evitar contacto con piel" },
  "Poliben (Carbendazim)":                       { dias:1,  nota:"Reingreso 24 hrs post-aplicación" },
  "Benomil + Mancozeb (mezcla)":                 { dias:2,  nota:"Mezcla: reingreso 48 hrs por precaución" },
  "Mancozeb + Apolo 25 EW (mezcla)":             { dias:2,  nota:"Mezcla: reingreso 48 hrs por precaución" },
  "Otro":                                        { dias:2,  nota:"Consultar ficha técnica del producto" },
};

// ─── INCIDENCIAS FITOSANITARIAS Y CIERRES ───────────────────────────────────
// Estado inicial vacío — se inicializa desde localStorage
const INCIDENCIAS_INICIAL = [];

function PanelFungicidas({ S, aplicaciones, setAplicaciones, personal, esJefa, tareasProg, setTareasProg, incidenciasFito, setIncidenciasFito }) {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const [subTab, setSubTab] = React.useState("alerta");
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    fecha: hoy.toISOString().slice(0,10),
    producto:"", dosis:"", cantidadUsada:"", unidadUsada:"L",
    superficie:"", sectorGrupo:"", sectorDetalle:"", sectorCustom:"",
    responsable:"", obs:"", clima:"", volAgua:"",
    costoUnitario:"", costoTotal:"", cuentaImputar:"", enviarProg:true,
  });

  // usar alias local para compatibilidad con el resto del código
  const incidencias = incidenciasFito;
  const setIncidencias = setIncidenciasFito;

  // ── Stock (inicializa desde localStorage o desde STOCK_INICIAL) ──────────────
  const initStock = () => { try { const s=localStorage.getItem("ev2-fung-stock"); return s?JSON.parse(s):STOCK_INICIAL; } catch { return STOCK_INICIAL; } };
  const [stock, setStock] = React.useState(initStock);
  React.useEffect(() => { try { localStorage.setItem("ev2-fung-stock", JSON.stringify(stock)); } catch {} }, [stock]);

  // ── Pedidos (inicializa con el pedido 7609) ──────────────────────────────────
  const initPedidos = () => { try { const s=localStorage.getItem("ev2-fung-pedidos"); return s?JSON.parse(s):PEDIDO_INICIAL; } catch { return PEDIDO_INICIAL; } };
  const [pedidos, setPedidos] = React.useState(initPedidos);
  React.useEffect(() => { try { localStorage.setItem("ev2-fung-pedidos", JSON.stringify(pedidos)); } catch {} }, [pedidos]);

  const [showStockEdit, setShowStockEdit] = React.useState(null); // id de producto en edición
  const [showPedidoDetalle, setShowPedidoDetalle] = React.useState(null);

  // ── Incidencias / Cierres ────────────────────────────────────────────────────
  // (estado manejado desde App vía props incidenciasFito / setIncidenciasFito)
  const [showIncidForm, setShowIncidForm] = React.useState(false);
  const [incidPaso, setIncidPaso] = React.useState(1);
  const [expandIncid, setExpandIncid] = React.useState(null);

  const emptyIncid = {
    fechaObservacion: hoy.toISOString().slice(0,10), horaObservacion: hoy.toTimeString().slice(0,5),
    observador:"Osmar Bhalú Armijo Zúñiga", observacion:"", sectoresObservados:[],
    tipoCierre:"fitosanitario", diagnostico:"", agenteCausal:"", severidad:"media",
    diagnosticadoPor:"", otrosDiagnosticos:"",
    tratamiento:"completo", productoAplicar:"", fechaAplicacion: hoy.toISOString().slice(0,10), horaAplicacion:"14:00",
    sectoresCerrados:[], motivoCierre:"", obs:"",
    estado:"observacion", fechaReaperturaISO:"", notaReingreso:"",
  };
  const [incidForm, setIncidForm] = React.useState(emptyIncid);

  const todosSectoresGolf = [
    ...Array.from({length:18},(_,i)=>`Green ${String(i+1).padStart(2,"0")}`),
    ...Array.from({length:18},(_,i)=>`Fairway ${String(i+1).padStart(2,"0")}`),
    ...Array.from({length:18},(_,i)=>`Tee ${String(i+1).padStart(2,"0")}`),
    "Cancha completa","Todos los greens","Todos los fairways",
  ];

  const calcReapertura = (producto, fechaAplic, horaAplic) => {
    const info = REINGRESO_DIAS[producto];
    if(!info||!fechaAplic) return { fechaISO:"", label:"", nota:"" };
    const base = new Date(`${fechaAplic}T${horaAplic||"14:00"}:00`);
    base.setHours(base.getHours() + info.dias*24);
    return {
      fechaISO: base.toISOString().slice(0,16),
      label: base.toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})+" a las "+base.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}),
      nota: info.nota,
    };
  };

  const guardarIncidencia = () => {
    if(!incidForm.observacion.trim()) return;
    const reap = calcReapertura(incidForm.productoAplicar, incidForm.fechaAplicacion, incidForm.horaAplicacion);
    const nueva = { ...incidForm, id:Date.now(), fechaReaperturaISO:reap.fechaISO, notaReingreso:reap.nota, estado: incidForm.sectoresCerrados.length>0?"cerrada":"observacion" };
    setIncidencias(prev=>[nueva,...prev].slice(0,100));

    // Tareas al programa del día
    const fp = incidForm.fechaAplicacion;
    if(fp && incidForm.productoAplicar) {
      const sectLabel = incidForm.sectoresCerrados.join(", ") || "Cancha golf";
      setTareasProg(prev=>({ ...prev, [fp]: [...(prev[fp]||[]), {
        id:Date.now()+Math.random(), fecha:fp,
        zona: sectLabel, elemento:"",
        tarea:`🧪 Fumigación: ${incidForm.productoAplicar} — ${incidForm.agenteCausal||incidForm.diagnostico}`,
        responsable: incidForm.diagnosticadoPor||"", estado:"por_designar",
        notas:`Reingreso estimado: ${reap.label}. ${reap.nota}`, auto:false, origenFungicida:true,
      }]}));
    }
    // Cierre de cancha al programa
    if(incidForm.sectoresCerrados.length>0) {
      const fc = incidForm.fechaObservacion;
      setTareasProg(prev=>({ ...prev, [fc]: [...(prev[fc]||[]), {
        id:Date.now()+Math.random()+1, fecha:fc,
        zona: incidForm.sectoresCerrados.join(", "), elemento:"",
        tarea:`🚫 CIERRE: ${incidForm.sectoresCerrados.join(", ")} — ${incidForm.tipoCierre==="fitosanitario"?"Tratamiento fitosanitario":incidForm.tipoCierre==="clima"?"Condición climática adversa":"Mantenimiento"}`,
        responsable:"", estado:"por_designar",
        notas:`Reapertura estimada: ${reap.label||"por determinar"}`, auto:false, origenCierre:true,
      }]}));
    }
    setIncidForm(emptyIncid); setShowIncidForm(false); setIncidPaso(1);
  };

  const progMes = PROGRAMA_FUNGICIDAS.filter(p => p.mes === mesActual);
  const progAll = [...PROGRAMA_FUNGICIDAS].sort((a,b)=>a.mes-b.mes);
  const listaPersonal = [...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  const sectorFinal = form.sectorDetalle==="Otro" ? form.sectorCustom : form.sectorDetalle;

  const guardarAplicacion = () => {
    if(!form.producto.trim()||!form.fecha) return;
    const nueva = { ...form, id:Date.now(), mes:mesActual, sectorFinal };
    setAplicaciones(prev=>[nueva, ...prev].slice(0,200));

    // Enviar a programa del día si está marcado
    if(form.enviarProg && form.fecha) {
      const tareaProgDia = {
        id: Date.now() + Math.random(),
        fecha: form.fecha,
        zona: sectorFinal || form.superficie || "Fungicidas",
        elemento: "",
        tarea: `🧪 Aplicación fungicida: ${form.producto}${form.dosis ? " · "+form.dosis : ""}${sectorFinal ? " → "+sectorFinal : ""}`,
        responsable: form.responsable || "",
        estado: "por_designar",
        notas: form.obs || "",
        auto: false,
        origenFungicida: true,
      };
      setTareasProg(prev => ({
        ...prev,
        [form.fecha]: [...(prev[form.fecha]||[]), tareaProgDia],
      }));
    }

    setForm({ fecha:hoy.toISOString().slice(0,10), producto:"", dosis:"", cantidadUsada:"", unidadUsada:"L", superficie:"", sectorGrupo:"", sectorDetalle:"", sectorCustom:"", responsable:"", obs:"", clima:"", volAgua:"", costoUnitario:"", costoTotal:"", cuentaImputar:"", enviarProg:true });
    setShowForm(false);
  };

  const labelSt = { fontSize:10, color:"#6aaa7a", letterSpacing:"0.6px", display:"block", marginBottom:3, textTransform:"uppercase" };

  return (
    <div className="ein">
      <div style={{marginBottom:22}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:4}}>🧪 Programa de Fungicidas</h1>
        <p style={{color:"#6aaa7a",fontSize:14}}>Temporada 2026–2027 · Áreas Verdes Estadio Español</p>
      </div>

      {/* Alerta del mes actual */}
      {progMes.length > 0 && (
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:14,padding:18,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:20}}>🔔</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#fcd34d"}}>
              Aplicaciones de {MESES_ES[mesActual]}
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {progMes.map((p,i)=>{
              const est = ESTACION_CONFIG[p.estacion]||ESTACION_CONFIG.invierno;
              const pri = PRIORIDAD_CONFIG[p.prioridad]||PRIORIDAD_CONFIG.media;
              const yaAplicado = aplicaciones.some(a => {
                const aFecha = new Date(a.fecha);
                return aFecha.getMonth()+1 === mesActual && aFecha.getFullYear() === hoy.getFullYear() &&
                  a.producto.toLowerCase().includes(p.producto.split(" ")[0].toLowerCase());
              });
              return (
                <div key={i} style={{...S.card,padding:14,borderLeft:`3px solid ${yaAplicado?"#22c55e":pri.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,fontSize:14,color:"#ede9e0"}}>{p.producto}</span>
                        <span style={{...S.chip,background:pri.bg,color:pri.color,border:`1px solid ${pri.color}40`,fontSize:11}}>
                          {pri.label}
                        </span>
                        {yaAplicado && <span style={{...S.chip,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.25)",fontSize:11}}>✅ Registrado</span>}
                      </div>
                      <div style={{fontSize:13,color:"#a0c8a0",marginBottom:4}}>📍 {p.superficie} · 💧 {p.dosis}</div>
                      <div style={{fontSize:12,color:"#6aaa7a",fontStyle:"italic"}}>{p.objetivo}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["alerta","📅 Programa"],["incidencias","🚨 Incidencias"],["stock","📦 Stock"],["proveedor","🏪 Proveedor"],["registro","📝 Registrar"],["historial","🗂️ Historial"]].map(([t,l])=>{
          const hayAlerta = t==="incidencias" && incidencias.some(i=>i.estado==="cerrada"||i.estado==="observacion");
          return (
            <button key={t} className={`tab${subTab===t?" on":""}`} onClick={()=>{setSubTab(t);setShowForm(false);}} style={{position:"relative"}}>
              {l}
              {hayAlerta&&<span style={{position:"absolute",top:2,right:2,width:7,height:7,borderRadius:"50%",background:"#ef4444"}}/>}
            </button>
          );
        })}
      </div>

      {/* ── INCIDENCIAS FITOSANITARIAS Y CIERRES ── */}
      {subTab==="incidencias"&&(
        <div className="ein">
          {/* Badges de estado actual de cancha */}
          {(()=>{
            const cerradas = incidencias.filter(i=>i.estado==="cerrada");
            const abiertas = incidencias.filter(i=>i.estado==="observacion");
            if(!cerradas.length&&!abiertas.length) return null;
            return (
              <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
                {cerradas.flatMap(i=>i.sectoresCerrados).filter((v,i,a)=>a.indexOf(v)===i).map(sec=>(
                  <span key={sec} style={{...S.chip,background:"rgba(239,68,68,0.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.3)",fontSize:12,padding:"5px 12px"}}>
                    🚫 {sec} — CERRADO
                  </span>
                ))}
                {abiertas.length>0&&<span style={{...S.chip,background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.3)",fontSize:12,padding:"5px 12px"}}>⚠️ {abiertas.length} observación pendiente de diagnóstico</span>}
              </div>
            );
          })()}

          <button className="btn-p" style={{...S.btn,marginBottom:16}} onClick={()=>{setShowIncidForm(true);setIncidPaso(1);setIncidForm(emptyIncid);}}>
            🚨 Nueva incidencia / Cierre de cancha
          </button>

          {/* ── FORMULARIO PASO A PASO ── */}
          {showIncidForm&&(
            <div style={{...S.card,padding:20,marginBottom:20}} className="ein">
              {/* Indicador de pasos */}
              <div style={{display:"flex",gap:6,marginBottom:20,alignItems:"center"}}>
                {[["1","🔍 Observación"],["2","🩺 Diagnóstico"],["3","🧪 Tratamiento"],["4","🚫 Cierre y reapertura"]].map(([n,lbl])=>(
                  <React.Fragment key={n}>
                    <div style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}} onClick={()=>Number(n)<incidPaso&&setIncidPaso(Number(n))}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:incidPaso>=Number(n)?"#3d7a52":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:incidPaso>=Number(n)?"#fff":"#5a8a6a",flexShrink:0}}>
                        {incidPaso>Number(n)?"✓":n}
                      </div>
                      <span style={{fontSize:11,color:incidPaso===Number(n)?"#a0d8b0":"#5a8a6a",display:"none"}} className="paso-lbl">{lbl}</span>
                    </div>
                    {Number(n)<4&&<div style={{flex:1,height:2,background:incidPaso>Number(n)?"#3d7a52":"rgba(255,255,255,0.1)",borderRadius:1,maxWidth:30}}/>}
                  </React.Fragment>
                ))}
                <span style={{fontSize:13,color:"#a0d8b0",marginLeft:8,fontFamily:"'Playfair Display',serif"}}>
                  {["","🔍 Observación","🩺 Diagnóstico","🧪 Tratamiento","🚫 Cierre y reapertura"][incidPaso]}
                </span>
              </div>

              {/* PASO 1 — OBSERVACIÓN */}
              {incidPaso===1&&(
                <div className="ein">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Fecha</label>
                      <input type="date" style={S.input} value={incidForm.fechaObservacion} onChange={e=>setIncidForm(p=>({...p,fechaObservacion:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Hora</label>
                      <input type="time" style={S.input} value={incidForm.horaObservacion} onChange={e=>setIncidForm(p=>({...p,horaObservacion:e.target.value}))}/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Observado por</label>
                      <select style={S.input} value={incidForm.observador} onChange={e=>setIncidForm(p=>({...p,observador:e.target.value}))}>
                        {listaPersonal.map(t=><option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Descripción de la observación</label>
                      <textarea rows={3} style={{...S.input,resize:"vertical"}} placeholder="Ej: Se observan manchas irregulares amarillo-pardas en Green 02, 06 y 08. Parches difusos en fairway del Green 01..." value={incidForm.observacion} onChange={e=>setIncidForm(p=>({...p,observacion:e.target.value}))}/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:6,textTransform:"uppercase"}}>Sectores con síntomas observados</label>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {Array.from({length:18},(_,i)=>`Green ${String(i+1).padStart(2,"0")}`).map(s=>{
                          const sel = incidForm.sectoresObservados.includes(s);
                          return <button key={s} style={{...S.btn,fontSize:11,padding:"4px 10px",background:sel?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.06)",color:sel?"#fca5a5":"#7aaa80",border:`1px solid ${sel?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.1)"}`}} onClick={()=>setIncidForm(p=>({...p,sectoresObservados:sel?p.sectoresObservados.filter(x=>x!==s):[...p.sectoresObservados,s]}))}>
                            {s}
                          </button>;
                        })}
                        {Array.from({length:18},(_,i)=>`Fairway ${String(i+1).padStart(2,"0")}`).map(s=>{
                          const sel = incidForm.sectoresObservados.includes(s);
                          return <button key={s} style={{...S.btn,fontSize:11,padding:"4px 10px",background:sel?"rgba(249,115,22,0.2)":"rgba(255,255,255,0.06)",color:sel?"#fb923c":"#7aaa80",border:`1px solid ${sel?"rgba(249,115,22,0.4)":"rgba(255,255,255,0.1)"}`}} onClick={()=>setIncidForm(p=>({...p,sectoresObservados:sel?p.sectoresObservados.filter(x=>x!==s):[...p.sectoresObservados,s]}))}>
                            {s}
                          </button>;
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-p" style={S.btn} onClick={()=>incidForm.observacion.trim()&&setIncidPaso(2)}>Siguiente → Diagnóstico</button>
                    <button className="btn-g" style={S.btn} onClick={()=>{setShowIncidForm(false);setIncidPaso(1);}}>Cancelar</button>
                  </div>
                </div>
              )}

              {/* PASO 2 — DIAGNÓSTICO */}
              {incidPaso===2&&(
                <div className="ein">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Tipo de cierre</label>
                      <select style={S.input} value={incidForm.tipoCierre} onChange={e=>setIncidForm(p=>({...p,tipoCierre:e.target.value}))}>
                        <option value="fitosanitario">🦠 Fitosanitario (plaga / enfermedad)</option>
                        <option value="mantenimiento">🔧 Mantenimiento programado</option>
                        <option value="clima">🌧️ Condición climática adversa</option>
                      </select>
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Severidad</label>
                      <select style={S.input} value={incidForm.severidad} onChange={e=>setIncidForm(p=>({...p,severidad:e.target.value}))}>
                        <option value="leve">🟡 Leve — monitoreo</option>
                        <option value="media">🟠 Media — tratamiento preventivo</option>
                        <option value="alta">🔴 Alta — tratamiento curativo urgente</option>
                        <option value="critica">⛔ Crítica — cierre inmediato</option>
                      </select>
                    </div>
                    {incidForm.tipoCierre==="fitosanitario"&&(<>
                      <div>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Agente causal</label>
                        <select style={S.input} value={incidForm.agenteCausal} onChange={e=>setIncidForm(p=>({...p,agenteCausal:e.target.value}))}>
                          <option value="">Seleccionar...</option>
                          {["Fusarium patch (Microdochium nivale)","Fusarium spp.","Rhizoctonia solani (Large Patch)","Dollar Spot (Clarireedia jacksonii)","Pythium spp.","Helminthosporium / Drechslera","Antracnosis (Colletotrichum)","Gusano blanco (larva coleóptero)","Trips","Pulgones","Otro patógeno"].map(a=><option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Diagnóstico / descripción</label>
                        <input style={S.input} placeholder="ej: Fusarium en greens 02, 06, 08 + Microdochium en fairway G01" value={incidForm.diagnostico} onChange={e=>setIncidForm(p=>({...p,diagnostico:e.target.value}))}/>
                      </div>
                    </>)}
                    {incidForm.tipoCierre==="clima"&&(
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Condición climática</label>
                        <select style={S.input} value={incidForm.diagnostico} onChange={e=>setIncidForm(p=>({...p,diagnostico:e.target.value}))}>
                          <option value="">Seleccionar...</option>
                          {["Helada — riesgo daño mecánico por pisadas","Lluvia intensa — suelo saturado","Post-lluvia — suelo blando (>24 hrs)","Viento extremo (>60 km/h)","Calor extremo — estrés hídrico","Granizo — daño mecánico al césped"].map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}
                    {incidForm.tipoCierre==="mantenimiento"&&(
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Tipo de mantenimiento</label>
                        <select style={S.input} value={incidForm.diagnostico} onChange={e=>setIncidForm(p=>({...p,diagnostico:e.target.value}))}>
                          <option value="">Seleccionar...</option>
                          {["Aireado y resiembra","Fertilización — reingreso 24 hrs","Corte y perfilado","Reconstrucción de bunkers","Reparación sistema riego","Preparación torneo","Otro mantenimiento"].map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    )}
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Diagnosticado / evaluado por</label>
                      <select style={S.input} value={incidForm.diagnosticadoPor} onChange={e=>setIncidForm(p=>({...p,diagnosticadoPor:e.target.value}))}>
                        <option value="">Seleccionar...</option>
                        {listaPersonal.map(t=><option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-g" style={S.btn} onClick={()=>setIncidPaso(1)}>← Volver</button>
                    <button className="btn-p" style={S.btn} onClick={()=>setIncidPaso(3)}>Siguiente → Tratamiento</button>
                  </div>
                </div>
              )}

              {/* PASO 3 — TRATAMIENTO */}
              {incidPaso===3&&(
                <div className="ein">
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Alcance del tratamiento</label>
                      <select style={S.input} value={incidForm.tratamiento} onChange={e=>setIncidForm(p=>({...p,tratamiento:e.target.value}))}>
                        <option value="completo">Fumigación completa de cancha</option>
                        <option value="sectores">Sectores afectados únicamente</option>
                        <option value="preventivo">Preventivo — sectores aledaños</option>
                        <option value="ninguno">Sin tratamiento químico</option>
                      </select>
                    </div>
                    {incidForm.tratamiento!=="ninguno"&&(<>
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Producto a aplicar</label>
                        <select style={S.input} value={incidForm.productoAplicar} onChange={e=>setIncidForm(p=>({...p,productoAplicar:e.target.value}))}>
                          <option value="">Seleccionar producto...</option>
                          {Object.keys(REINGRESO_DIAS).filter(k=>k!=="Otro").map(p=><option key={p} value={p}>{p}</option>)}
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Fecha aplicación</label>
                        <input type="date" style={S.input} value={incidForm.fechaAplicacion} onChange={e=>setIncidForm(p=>({...p,fechaAplicacion:e.target.value}))}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Hora aplicación</label>
                        <input type="time" style={S.input} value={incidForm.horaAplicacion} onChange={e=>setIncidForm(p=>({...p,horaAplicacion:e.target.value}))}/>
                      </div>
                      {incidForm.productoAplicar&&(()=>{
                        const r = calcReapertura(incidForm.productoAplicar, incidForm.fechaAplicacion, incidForm.horaAplicacion);
                        if(!r.label) return null;
                        return (
                          <div style={{gridColumn:"1/-1",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:10,padding:"10px 14px"}}>
                            <div style={{fontSize:12,color:"#86efac",fontWeight:600,marginBottom:4}}>📅 Reapertura estimada según ficha técnica</div>
                            <div style={{fontSize:15,color:"#4ade80",fontWeight:700,marginBottom:4}}>{r.label}</div>
                            <div style={{fontSize:11,color:"#5a9a7a",fontStyle:"italic"}}>{r.nota}</div>
                          </div>
                        );
                      })()}
                    </>)}
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Observaciones adicionales</label>
                      <textarea rows={2} style={{...S.input,resize:"vertical"}} placeholder="Notas del tratamiento..." value={incidForm.obs} onChange={e=>setIncidForm(p=>({...p,obs:e.target.value}))}/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-g" style={S.btn} onClick={()=>setIncidPaso(2)}>← Volver</button>
                    <button className="btn-p" style={S.btn} onClick={()=>setIncidPaso(4)}>Siguiente → Cierre</button>
                  </div>
                </div>
              )}

              {/* PASO 4 — CIERRE Y REAPERTURA */}
              {incidPaso===4&&(
                <div className="ein">
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:8,textTransform:"uppercase"}}>Sectores a cerrar</label>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                      {["Cancha completa","Todos los greens","Todos los fairways"].map(s=>{
                        const sel=incidForm.sectoresCerrados.includes(s);
                        return <button key={s} style={{...S.btn,fontSize:12,padding:"5px 14px",background:sel?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.06)",color:sel?"#fca5a5":"#7aaa80",border:`1px solid ${sel?"rgba(239,68,68,0.4)":"rgba(255,255,255,0.1)"}`}} onClick={()=>setIncidForm(p=>({...p,sectoresCerrados:sel?p.sectoresCerrados.filter(x=>x!==s):[...p.sectoresCerrados,s]}))}>
                          {sel?"🚫 ":""}{s}
                        </button>;
                      })}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {Array.from({length:18},(_,i)=>`Green ${String(i+1).padStart(2,"0")}`).map(s=>{
                        const sel=incidForm.sectoresCerrados.includes(s)||incidForm.sectoresObservados.includes(s);
                        const forzado=incidForm.sectoresObservados.includes(s);
                        return <button key={s} style={{...S.btn,fontSize:11,padding:"3px 9px",background:sel?"rgba(239,68,68,0.2)":"rgba(255,255,255,0.05)",color:sel?"#fca5a5":"#7aaa80",border:`1px solid ${sel?"rgba(239,68,68,0.35)":"rgba(255,255,255,0.08)"}`,opacity:forzado?0.7:1}} onClick={()=>!forzado&&setIncidForm(p=>({...p,sectoresCerrados:sel?p.sectoresCerrados.filter(x=>x!==s):[...p.sectoresCerrados,s]}))}>
                          {sel?"🚫 ":""}{s}
                        </button>;
                      })}
                    </div>
                    {incidForm.sectoresObservados.length>0&&(
                      <div style={{fontSize:11,color:"#f59e0b",marginTop:6}}>⚠️ Sectores con síntomas observados se sugieren automáticamente</div>
                    )}
                  </div>
                  {(()=>{
                    const r = calcReapertura(incidForm.productoAplicar, incidForm.fechaAplicacion, incidForm.horaAplicacion);
                    if(!r.label) return null;
                    return (
                      <div style={{...S.card,padding:14,marginBottom:12,background:"rgba(34,197,94,0.08)",borderColor:"rgba(34,197,94,0.25)"}}>
                        <div style={{fontSize:12,color:"#86efac",fontWeight:600,marginBottom:3}}>✅ Reapertura estimada</div>
                        <div style={{fontSize:16,color:"#4ade80",fontWeight:700}}>{r.label}</div>
                        <div style={{fontSize:11,color:"#5a9a7a",marginTop:4,fontStyle:"italic"}}>{r.nota}</div>
                      </div>
                    );
                  })()}
                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Motivo del cierre (para comunicar)</label>
                    <input style={S.input} placeholder="ej: Cancha cerrada por tratamiento fitosanitario. Reapertura estimada mañana." value={incidForm.motivoCierre} onChange={e=>setIncidForm(p=>({...p,motivoCierre:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button className="btn-g" style={S.btn} onClick={()=>setIncidPaso(3)}>← Volver</button>
                    <button className="btn-p" style={{...S.btn,background:"#3d7a52"}} onClick={guardarIncidencia}>✓ Registrar incidencia y cerrar cancha</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LISTADO DE INCIDENCIAS ── */}
          {!showIncidForm&&incidencias.length===0&&(
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:10}}>🏌️</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin incidencias registradas</div>
              <div style={{fontSize:13,color:"#4a7a5a",marginTop:6}}>Registra observaciones, diagnósticos y cierres de cancha</div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
            {incidencias.map(inc=>{
              const ESTADO_INC = {
                observacion:{label:"⚠️ Observación pendiente",color:"#f59e0b",bg:"rgba(245,158,11,0.12)"},
                cerrada:     {label:"🚫 Cancha cerrada",      color:"#ef4444",bg:"rgba(239,68,68,0.12)"},
                reabierta:   {label:"✅ Reabierta",           color:"#22c55e",bg:"rgba(34,197,94,0.12)"},
              };
              const TIPO_INC = {fitosanitario:"🦠",mantenimiento:"🔧",clima:"🌧️"};
              const est = ESTADO_INC[inc.estado]||ESTADO_INC.observacion;
              const r = calcReapertura(inc.productoAplicar, inc.fechaAplicacion, inc.horaAplicacion);
              return (
                <div key={inc.id} style={{...S.card,padding:16,borderLeft:`3px solid ${est.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:18}}>{TIPO_INC[inc.tipoCierre]||"🚨"}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>{inc.agenteCausal||inc.diagnostico||"Incidencia registrada"}</span>
                        <span style={{...S.chip,background:est.bg,color:est.color,border:`1px solid ${est.color}40`,fontSize:11}}>{est.label}</span>
                      </div>
                      <div style={{fontSize:12,color:"#7aaa80",marginBottom:4}}>
                        📅 {inc.fechaObservacion} {inc.horaObservacion&&`${inc.horaObservacion}`} · 👤 {inc.observador}
                      </div>
                      {inc.sectoresObservados?.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
                          {inc.sectoresObservados.map(s=><span key={s} style={{...S.chip,background:"rgba(249,115,22,0.1)",color:"#fb923c",border:"1px solid rgba(249,115,22,0.25)",fontSize:10}}>{s}</span>)}
                        </div>
                      )}
                      {inc.sectoresCerrados?.length>0&&(
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:4}}>
                          {inc.sectoresCerrados.map(s=><span key={s} style={{...S.chip,background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)",fontSize:10}}>🚫 {s}</span>)}
                        </div>
                      )}
                      {r.label&&<div style={{fontSize:12,color:"#4ade80",marginBottom:2}}>📅 Reapertura estimada: <strong>{r.label}</strong></div>}
                      {r.nota&&<div style={{fontSize:11,color:"#5a9a7a",fontStyle:"italic",marginBottom:4}}>{r.nota}</div>}
                      {inc.productoAplicar&&<div style={{fontSize:12,color:"#a0c8a0"}}>🧪 {inc.productoAplicar}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                      {inc.estado==="cerrada"&&(
                        <button style={{...S.btn,fontSize:11,padding:"5px 12px",background:"rgba(34,197,94,0.15)",color:"#86efac",border:"1px solid rgba(34,197,94,0.3)"}}
                          onClick={()=>setIncidencias(prev=>prev.map(x=>x.id===inc.id?{...x,estado:"reabierta"}:x))}>
                          ✅ Marcar reabierta
                        </button>
                      )}
                      <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setExpandIncid(expandIncid===inc.id?null:inc.id)}>
                        {expandIncid===inc.id?"▲":"▼"}
                      </button>
                      {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setIncidencias(prev=>prev.filter(x=>x.id!==inc.id))}>🗑</button>}
                    </div>
                  </div>
                  {expandIncid===inc.id&&(
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:12,marginTop:10,fontSize:12,color:"#7aaa80",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {inc.observacion&&<div style={{gridColumn:"1/-1",fontStyle:"italic",color:"#a0c0a0"}}>"{inc.observacion}"</div>}
                      {inc.diagnosticadoPor&&<div>🩺 Diagnóstico por: {inc.diagnosticadoPor}</div>}
                      {inc.severidad&&<div>⚡ Severidad: {inc.severidad}</div>}
                      {inc.tratamiento&&<div>💊 Tratamiento: {inc.tratamiento}</div>}
                      {inc.fechaAplicacion&&<div>🗓️ Aplicación: {inc.fechaAplicacion} {inc.horaAplicacion}</div>}
                      {inc.motivoCierre&&<div style={{gridColumn:"1/-1",color:"#fcd34d"}}>📢 {inc.motivoCierre}</div>}
                      {inc.obs&&<div style={{gridColumn:"1/-1",fontStyle:"italic"}}>{inc.obs}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PROGRAMA ANUAL ── */}
      {subTab==="alerta"&&(
        <div className="ein">
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {progAll.map((p,i)=>{
              const est = ESTACION_CONFIG[p.estacion]||ESTACION_CONFIG.invierno;
              const pri = PRIORIDAD_CONFIG[p.prioridad]||PRIORIDAD_CONFIG.media;
              const esMesActual = p.mes === mesActual;
              return (
                <div key={i} style={{...S.card,padding:14,borderLeft:`3px solid ${esMesActual?"#fcd34d":est.color}`,opacity:esMesActual?1:0.8}}>
                  <div style={{display:"flex",alignItems:"start",gap:12,flexWrap:"wrap"}}>
                    <div style={{minWidth:90,textAlign:"center",background:esMesActual?"rgba(252,211,77,0.1)":est.bg,borderRadius:8,padding:"6px 10px",flexShrink:0}}>
                      <div style={{fontSize:18}}>{est.icon}</div>
                      <div style={{fontSize:13,fontWeight:700,color:esMesActual?"#fcd34d":est.color}}>{MESES_ES[p.mes]}</div>
                      <div style={{fontSize:10,color:"#6aaa7a",textTransform:"uppercase"}}>{p.estacion}</div>
                    </div>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15}}>{p.producto}</span>
                        <span style={{...S.chip,background:pri.bg,color:pri.color,border:`1px solid ${pri.color}40`,fontSize:11}}>{pri.label}</span>
                        {esMesActual&&<span style={{...S.chip,background:"rgba(252,211,77,0.15)",color:"#fcd34d",border:"1px solid rgba(252,211,77,0.3)",fontSize:11}}>← Este mes</span>}
                      </div>
                      <div style={{fontSize:13,color:"#a0c8a0",marginBottom:3}}>📍 {p.superficie}</div>
                      <div style={{fontSize:13,color:"#7aaa80",marginBottom:3}}>💧 {p.dosis}</div>
                      <div style={{fontSize:12,color:"#5a8a6a",fontStyle:"italic"}}>{p.objetivo}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{...S.card,padding:16,marginTop:18,background:"rgba(59,130,246,0.06)",borderColor:"rgba(59,130,246,0.2)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#93c5fd",marginBottom:10}}>📐 Reglas de rotación anti-resistencia</div>
            <div style={{fontSize:12,color:"#7a9ab0",lineHeight:1.8}}>
              🔵 Grupo 11 (Estrobilurina: Amistar TOP) → máx. 2 aplicaciones/temporada<br/>
              🟡 Grupo 3 (Triazol: Score, Apolo) → máx. 3 aplicaciones/temporada<br/>
              🟠 Grupo 1 (Benzimidazol: Benomil/Poliben) → solo invierno, vigilar resistencia<br/>
              ⚪ Grupo M3 (Mancozeb) → libre, siempre en mezcla o rotación
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTRAR APLICACIÓN ── */}
      {subTab==="registro"&&(
        <div className="ein">
          {!showForm&&(
            <button className="btn-p" style={{...S.btn,marginBottom:16}} onClick={()=>setShowForm(true)}>
              ➕ Nueva aplicación
            </button>
          )}
          {showForm&&(
            <div style={{...S.card,padding:20,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:16,color:"#a0d8b0"}}>Registrar Aplicación de Fungicida</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>

                {/* Fecha y responsable */}
                <div>
                  <label style={labelSt}>Fecha</label>
                  <input type="date" style={S.input} value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/>
                </div>
                <div>
                  <label style={labelSt}>Responsable</label>
                  <select style={S.input} value={form.responsable} onChange={e=>setForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(t=><option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                </div>

                {/* Producto */}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelSt}>Producto aplicado</label>
                  <select style={S.input} value={form.producto} onChange={e=>{
                    const pu = stock.find(s=>s.producto.toLowerCase().includes(e.target.value.split(" ")[0].toLowerCase()))?.precioUnitario||"";
                    setForm(p=>({...p,producto:e.target.value,costoUnitario:pu?String(pu):""}));
                  }}>
                    <option value="">Seleccionar producto...</option>
                    {["Amistar TOP (Azoxistrobina + Difenoconazol)","Score 250 EC (Difenoconazol)","Apolo 25 EW (Tebuconazol)","Fungizeb 800 WP (Mancozeb)","Benomil 50% WP","Poliben (Carbendazim)","Benomil + Mancozeb (mezcla)","Mancozeb + Apolo 25 EW (mezcla)","Otro"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Dosis y cantidad */}
                <div>
                  <label style={labelSt}>Dosis (por ha)</label>
                  <input style={S.input} placeholder="ej: 0,75 L/ha" value={form.dosis} onChange={e=>setForm(p=>({...p,dosis:e.target.value}))}/>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <div style={{flex:2}}>
                    <label style={labelSt}>Cantidad utilizada</label>
                    <input type="number" min={0} step={0.01} style={S.input} placeholder="ej: 0,5" value={form.cantidadUsada}
                      onChange={e=>{
                        const cant=Number(e.target.value);
                        const cu=Number(form.costoUnitario)||0;
                        setForm(p=>({...p,cantidadUsada:e.target.value,costoTotal:cu&&cant?String(Math.round(cant*cu)):""}));
                      }}/>
                  </div>
                  <div style={{flex:1}}>
                    <label style={labelSt}>Unidad</label>
                    <select style={S.input} value={form.unidadUsada} onChange={e=>setForm(p=>({...p,unidadUsada:e.target.value}))}>
                      {["L","ml","kg","g","unidad"].map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Volumen agua (L/ha)</label>
                  <input style={S.input} placeholder="ej: 400 L/ha" value={form.volAgua} onChange={e=>setForm(p=>({...p,volAgua:e.target.value}))}/>
                </div>
                <div>
                  <label style={labelSt}>Condición climática</label>
                  <select style={S.input} value={form.clima} onChange={e=>setForm(p=>({...p,clima:e.target.value}))}>
                    <option value="">—</option>
                    {["Soleado","Nublado","Parcialmente nublado","Sin viento","Viento leve","Post-lluvia (suelo húmedo)"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ── SECTOR DE APLICACIÓN ── */}
                <div style={{gridColumn:"1/-1",background:"rgba(61,122,82,0.08)",border:"1px solid rgba(61,122,82,0.2)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.6px",marginBottom:8,textTransform:"uppercase"}}>📍 Sector de aplicación</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={labelSt}>Grupo</label>
                      <select style={S.input} value={form.sectorGrupo} onChange={e=>setForm(p=>({...p,sectorGrupo:e.target.value,sectorDetalle:""}))}>
                        <option value="">Seleccionar grupo...</option>
                        {Object.keys(SECTORES_APLICACION).map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelSt}>Sector específico</label>
                      <select style={S.input} value={form.sectorDetalle} onChange={e=>setForm(p=>({...p,sectorDetalle:e.target.value}))} disabled={!form.sectorGrupo}>
                        <option value="">{form.sectorGrupo?"Seleccionar...":"— elige grupo primero —"}</option>
                        {(SECTORES_APLICACION[form.sectorGrupo]||[]).map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {form.sectorDetalle==="Otro"&&(
                      <div style={{gridColumn:"1/-1"}}>
                        <label style={labelSt}>Especificar sector</label>
                        <input style={S.input} placeholder="Nombre del sector..." value={form.sectorCustom} onChange={e=>setForm(p=>({...p,sectorCustom:e.target.value}))}/>
                      </div>
                    )}
                  </div>
                  {sectorFinal&&(
                    <div style={{marginTop:8,fontSize:12,color:"#86efac"}}>✅ Sector seleccionado: <strong>{sectorFinal}</strong></div>
                  )}
                </div>

                {/* ── COSTO Y RENDICIÓN ── */}
                <div style={{gridColumn:"1/-1",background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#93c5fd",letterSpacing:"0.6px",marginBottom:8,textTransform:"uppercase"}}>💰 Costo para rendición</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div>
                      <label style={labelSt}>Precio unitario ($)</label>
                      <input type="number" min={0} style={S.input} placeholder="ej: 82000" value={form.costoUnitario}
                        onChange={e=>{
                          const cu=Number(e.target.value);
                          const cant=Number(form.cantidadUsada)||0;
                          setForm(p=>({...p,costoUnitario:e.target.value,costoTotal:cu&&cant?String(Math.round(cant*cu)):""}));
                        }}/>
                    </div>
                    <div>
                      <label style={labelSt}>Costo total ($)</label>
                      <input type="number" min={0} style={{...S.input,background:"rgba(59,130,246,0.1)",fontWeight:600}} placeholder="Auto-calculado" value={form.costoTotal}
                        onChange={e=>setForm(p=>({...p,costoTotal:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={labelSt}>Cuenta / Ítem presupuesto</label>
                      <select style={S.input} value={form.cuentaImputar} onChange={e=>setForm(p=>({...p,cuentaImputar:e.target.value}))}>
                        <option value="">Sin imputar</option>
                        {["Insumos Áreas Verdes","Mantenimiento Canchas","Rama Golf","Mantenimiento Ornamental","Fitosanitarios General","Presupuesto Emergencia","Otro"].map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  {form.costoTotal&&(
                    <div style={{marginTop:8,fontSize:13,color:"#93c5fd",fontWeight:600}}>
                      Total a rendir: ${Number(form.costoTotal).toLocaleString("es-CL")}
                      {form.cuentaImputar&&<span style={{fontSize:11,fontWeight:400,color:"#6a9abf",marginLeft:8}}>→ {form.cuentaImputar}</span>}
                    </div>
                  )}
                </div>

                {/* Observaciones y enviar a programa */}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelSt}>Observaciones</label>
                  <input style={S.input} placeholder="Notas adicionales..." value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))}/>
                </div>
                <div style={{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:10,background:"rgba(61,122,82,0.08)",borderRadius:8,padding:"10px 14px",cursor:"pointer"}} onClick={()=>setForm(p=>({...p,enviarProg:!p.enviarProg}))}>
                  <div style={{width:20,height:20,borderRadius:5,border:"2px solid #3d7a52",background:form.enviarProg?"#3d7a52":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {form.enviarProg&&<span style={{color:"#fff",fontSize:13}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontSize:13,color:"#a0d8b0",fontWeight:600}}>📆 Enviar a Programa del Día</div>
                    <div style={{fontSize:11,color:"#5a8a6a"}}>Aparecerá en la vista Programación para asignar al equipo</div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn-p" style={S.btn} onClick={guardarAplicacion}>✓ Guardar registro</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          )}
          {!showForm&&aplicaciones.length===0&&(
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:10}}>🧪</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin aplicaciones registradas</div>
              <div style={{fontSize:13,color:"#4a7a5a",marginTop:6}}>Registra aquí cada aplicación de fungicida</div>
            </div>
          )}
          {/* Resumen de costos */}
          {!showForm&&aplicaciones.length>0&&(()=>{
            const totalRendir = aplicaciones.reduce((a,x)=>a+Number(x.costoTotal||0),0);
            const porCuenta = aplicaciones.reduce((acc,x)=>{
              if(x.costoTotal&&x.cuentaImputar){acc[x.cuentaImputar]=(acc[x.cuentaImputar]||0)+Number(x.costoTotal);}
              return acc;
            },{});
            if(!totalRendir) return null;
            return (
              <div style={{...S.card,padding:16,marginTop:16,background:"rgba(59,130,246,0.06)",borderColor:"rgba(59,130,246,0.2)"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#93c5fd",marginBottom:10}}>💰 Resumen de costos registrados</div>
                <div style={{fontSize:20,fontWeight:700,color:"#93c5fd",marginBottom:8}}>${totalRendir.toLocaleString("es-CL")}</div>
                {Object.entries(porCuenta).map(([cuenta,monto])=>(
                  <div key={cuenta} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#7a9ab0",borderTop:"1px solid rgba(59,130,246,0.1)",padding:"5px 0"}}>
                    <span>{cuenta}</span><span style={{fontWeight:600}}>${monto.toLocaleString("es-CL")}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {subTab==="historial"&&(
        <div className="ein">
          {aplicaciones.length===0?(
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:10}}>🗂️</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin registros aún</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {aplicaciones.map((a)=>(
                <div key={a.id} style={{...S.card,padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:4}}>{a.producto}</div>
                      <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#7aaa80",marginBottom:4}}>
                        <span>📅 {a.fecha}</span>
                        {a.responsable&&<span>👤 {a.responsable}</span>}
                        {a.dosis&&<span>💧 {a.dosis}</span>}
                        {(a.cantidadUsada)&&<span>📦 {a.cantidadUsada} {a.unidadUsada}</span>}
                        {a.volAgua&&<span>🪣 {a.volAgua}</span>}
                        {a.clima&&<span>🌤️ {a.clima}</span>}
                      </div>
                      {(a.sectorFinal||a.sectorDetalle)&&(
                        <div style={{fontSize:12,color:"#86efac",marginBottom:3}}>📍 {a.sectorFinal||a.sectorDetalle}</div>
                      )}
                      {a.costoTotal&&(
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                          <span style={{fontSize:12,color:"#93c5fd",fontWeight:600}}>💰 ${Number(a.costoTotal).toLocaleString("es-CL")}</span>
                          {a.cuentaImputar&&<span style={{fontSize:11,color:"#6a9abf",background:"rgba(59,130,246,0.1)",padding:"1px 8px",borderRadius:8}}>{a.cuentaImputar}</span>}
                        </div>
                      )}
                      {a.obs&&<div style={{fontSize:12,color:"#6aaa7a",fontStyle:"italic",marginTop:2}}>{a.obs}</div>}
                      {a.enviarProg&&<span style={{fontSize:10,color:"#4ade80",background:"rgba(74,222,128,0.08)",padding:"1px 8px",borderRadius:8,border:"1px solid rgba(74,222,128,0.2)"}}>📆 En programa del día</span>}
                    </div>
                    {esJefa&&(
                      <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setAplicaciones(prev=>prev.filter(x=>x.id!==a.id))}>🗑</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STOCK ── */}
      {subTab==="stock"&&(
        <div className="ein">
          <div style={{marginBottom:14,fontFamily:"'Playfair Display',serif",fontSize:16,color:"#a0d8b0"}}>Stock actual de fungicidas</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {stock.map(item=>{
              const bajo = item.stockActual <= item.stockMinimo;
              const agotado = item.stockActual === 0;
              const color = agotado?"#ef4444":bajo?"#f59e0b":"#22c55e";
              const bg = agotado?"rgba(239,68,68,0.1)":bajo?"rgba(245,158,11,0.1)":"rgba(34,197,94,0.08)";
              return (
                <div key={item.id} style={{...S.card,padding:16,borderLeft:`3px solid ${color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,marginBottom:4}}>{item.producto}</div>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#7aaa80",marginBottom:6}}>
                        <span>📦 Cód: {item.codigo}</span>
                        <span style={{fontSize:11,color:"#5a8a6a",background:"rgba(255,255,255,0.06)",padding:"1px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)"}}>{item.grupo}</span>
                        <span>💰 ${item.precioUnitario.toLocaleString("es-CL")} / {item.unidad}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color}}>
                          {item.stockActual} <span style={{fontSize:13,fontWeight:400}}>{item.unidad}</span>
                        </span>
                        <span style={{...S.chip,background:bg,color,border:`1px solid ${color}40`,fontSize:11}}>
                          {agotado?"⛔ Agotado":bajo?"⚠️ Stock bajo":"✅ OK"}
                        </span>
                        <span style={{fontSize:11,color:"#5a8a6a"}}>Mín: {item.stockMinimo} {item.unidad}</span>
                      </div>
                    </div>
                    {esJefa&&(
                      <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                        <button style={{...S.btn,fontSize:13,padding:"5px 12px",background:"rgba(239,68,68,0.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.3)"}}
                          onClick={()=>setStock(prev=>prev.map(s=>s.id===item.id?{...s,stockActual:Math.max(0,s.stockActual-1)}:s))}>−</button>
                        <button style={{...S.btn,fontSize:13,padding:"5px 12px",background:"rgba(61,122,82,0.25)",color:"#a0d8b0",border:"1px solid rgba(61,122,82,0.35)"}}
                          onClick={()=>setStock(prev=>prev.map(s=>s.id===item.id?{...s,stockActual:s.stockActual+1}:s))}>+</button>
                        {showStockEdit===item.id?(
                          <input type="number" min={0} autoFocus style={{...S.input,width:70,fontSize:13,padding:"4px 8px"}}
                            defaultValue={item.stockActual}
                            onBlur={e=>{ setStock(prev=>prev.map(s=>s.id===item.id?{...s,stockActual:Math.max(0,Number(e.target.value))}:s)); setShowStockEdit(null); }}/>
                        ):(
                          <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setShowStockEdit(item.id)}>✏️</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {stock.some(s=>s.stockActual<=s.stockMinimo)&&(
            <div style={{...S.card,padding:14,marginTop:16,background:"rgba(245,158,11,0.07)",borderColor:"rgba(245,158,11,0.25)"}}>
              <div style={{fontSize:13,color:"#fcd34d",fontWeight:600,marginBottom:4}}>⚠️ Productos con stock bajo — considerar reorden a Copargo Agro</div>
              <div style={{fontSize:12,color:"#a08050"}}>Vendedora: Marlene Pino · {PROVEEDOR_PRINCIPAL.email} · {PROVEEDOR_PRINCIPAL.telefono}</div>
            </div>
          )}
        </div>
      )}

      {/* ── PROVEEDOR + PEDIDOS ── */}
      {subTab==="proveedor"&&(
        <div className="ein">
          <div style={{...S.card,padding:20,marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#1e40af)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏪</div>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>{PROVEEDOR_PRINCIPAL.empresa}</div>
                <div style={{fontSize:12,color:"#6aaa7a"}}>{PROVEEDOR_PRINCIPAL.giro}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:13}}>
              {[
                ["👤 Titular",  PROVEEDOR_PRINCIPAL.nombre],
                ["🪪 RUT",       PROVEEDOR_PRINCIPAL.rut],
                ["📍 Dirección", PROVEEDOR_PRINCIPAL.direccion],
                ["📞 Teléfono",  PROVEEDOR_PRINCIPAL.telefono],
                ["✉️ Email",     PROVEEDOR_PRINCIPAL.email],
                ["🛒 Vendedora",  PROVEEDOR_PRINCIPAL.vendedor],
                ["📱 Tel. vendedora", PROVEEDOR_PRINCIPAL.telefonoVendedor],
                ["💳 Condición", PROVEEDOR_PRINCIPAL.condicion],
              ].map(([lbl,val])=>(
                <div key={lbl} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:10,color:"#5a8a6a",letterSpacing:"0.5px",marginBottom:2}}>{lbl}</div>
                  <div style={{color:"#ede9e0"}}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:12,color:"#a0d8b0"}}>Pedidos realizados</div>
          {pedidos.map(p=>(
            <div key={p.id} style={{...S.card,padding:16,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>Pedido N° {p.id}</span>
                    <span style={{...S.chip,background:"rgba(34,197,94,0.1)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",fontSize:11}}>✅ Recibido</span>
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#7aaa80"}}>
                    <span>📅 {p.fecha}</span>
                    <span>🏪 {p.proveedor}</span>
                    <span>👤 {p.vendedor}</span>
                    <span style={{color:"#f59e0b"}}>⏰ Vence: {p.vencimiento}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#86efac"}}>${p.total.toLocaleString("es-CL")}</span>
                  <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}}
                    onClick={()=>setShowPedidoDetalle(showPedidoDetalle===p.id?null:p.id)}>
                    {showPedidoDetalle===p.id?"▲ Cerrar":"▼ Detalle"}
                  </button>
                </div>
              </div>
              {showPedidoDetalle===p.id&&(
                <div style={{borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:12,marginTop:12}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{color:"#6aaa7a",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
                        <th style={{textAlign:"left",padding:"4px 8px"}}>Código</th>
                        <th style={{textAlign:"left",padding:"4px 8px"}}>Descripción</th>
                        <th style={{textAlign:"center",padding:"4px 8px"}}>Cant.</th>
                        <th style={{textAlign:"right",padding:"4px 8px"}}>P. Unit.</th>
                        <th style={{textAlign:"right",padding:"4px 8px"}}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.items.map((it,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.05)",color:"#c8e0c8"}}>
                          <td style={{padding:"5px 8px",color:"#6aaa7a",fontFamily:"monospace"}}>{it.codigo}</td>
                          <td style={{padding:"5px 8px"}}>{it.descripcion}</td>
                          <td style={{padding:"5px 8px",textAlign:"center"}}>{it.cantidad}</td>
                          <td style={{padding:"5px 8px",textAlign:"right"}}>${it.precio.toLocaleString("es-CL")}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontWeight:600}}>${it.total.toLocaleString("es-CL")}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:"1px solid rgba(255,255,255,0.15)",color:"#ede9e0"}}>
                        <td colSpan={4} style={{padding:"6px 8px",textAlign:"right",color:"#7aaa80"}}>Afecto</td>
                        <td style={{padding:"6px 8px",textAlign:"right"}}>$369.540</td>
                      </tr>
                      <tr style={{color:"#ede9e0"}}>
                        <td colSpan={4} style={{padding:"4px 8px",textAlign:"right",color:"#7aaa80"}}>IVA 19%</td>
                        <td style={{padding:"4px 8px",textAlign:"right"}}>$70.213</td>
                      </tr>
                      <tr style={{color:"#86efac",fontFamily:"'Playfair Display',serif",fontWeight:700}}>
                        <td colSpan={4} style={{padding:"6px 8px",textAlign:"right",fontSize:14}}>TOTAL</td>
                        <td style={{padding:"6px 8px",textAlign:"right",fontSize:15}}>${p.total.toLocaleString("es-CL")}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ─── ACTIVIDAD DEL DÍA — VISTA COMPACTA COLAPSABLE ──────────────────────────
function ActividadDelDia({ zonas, MACROZONAS_BASE, S, EC, tareasDelDia }) {
  const [expandidas, setExpandidas] = React.useState({});
  const [vistaCompacta, setVistaCompacta] = React.useState(true);

  const toggle = (zona) => setExpandidas(p=>({...p,[zona]:!p[zona]}));
  const expandirTodas = () => { const e={}; zonas.forEach(([z])=>{e[z]=true;}); setExpandidas(e); };
  const colapsarTodas = () => setExpandidas({});

  const totalHechas = tareasDelDia.filter(t=>["hecha","completada"].includes(t.estado)).length;
  const totalNoPudo = tareasDelDia.filter(t=>t.estado==="no_pudo").length;
  const totalPend   = tareasDelDia.filter(t=>["pendiente","por_designar"].includes(t.estado)).length;

  return (
    <div>
      {/* Barra de control */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:14,fontSize:12,flexWrap:"wrap"}}>
          <span style={{color:"#22c55e"}}>✅ {totalHechas} hechas</span>
          {totalNoPudo>0&&<span style={{color:"#ef4444"}}>🔴 {totalNoPudo} no pudieron</span>}
          <span style={{color:"#f59e0b"}}>⏳ {totalPend} pendientes</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={expandirTodas}>▼ Todas</button>
          <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={colapsarTodas}>▲ Colapsar</button>
          <button className={`tab${!vistaCompacta?" on":""}`} style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setVistaCompacta(p=>!p)}>
            {vistaCompacta?"📋 Detalle":"📊 Compacto"}
          </button>
        </div>
      </div>

      {vistaCompacta ? (
        /* ── VISTA COMPACTA: tabla una fila por zona ── */
        <div style={{...S.card,overflow:"hidden"}}>
          {zonas.map(([nombreZona, tareasZona], idx)=>{
            const zonaInfo = MACROZONAS_BASE.find(z=>z.nombre===nombreZona);
            const hechas   = tareasZona.filter(t=>["hecha","completada"].includes(t.estado)).length;
            const noPudo   = tareasZona.filter(t=>t.estado==="no_pudo").length;
            const pend     = tareasZona.filter(t=>["pendiente","por_designar"].includes(t.estado)).length;
            const pct      = Math.round((hechas/tareasZona.length)*100);
            const abierta  = expandidas[nombreZona];
            const barColor = pct===100?"#22c55e":pct>60?"#4ade80":pct>30?"#f59e0b":"#ef4444";
            const hayAlerta = noPudo>0;

            return (
              <div key={nombreZona}>
                {/* Fila resumen — siempre visible */}
                <div
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.06)",background:idx%2===0?"transparent":"rgba(255,255,255,0.018)",borderLeft:`3px solid ${hayAlerta?"#ef4444":pct===100?"#22c55e":"rgba(255,255,255,0.1)"}`}}
                  onClick={()=>toggle(nombreZona)}
                >
                  <span style={{fontSize:16,flexShrink:0}}>{zonaInfo?.icono||"📍"}</span>
                  <span style={{flex:1,fontSize:13,fontWeight:600,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nombreZona}</span>
                  {/* Mini barra de progreso */}
                  <div style={{width:60,height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden",flexShrink:0}}>
                    <div style={{width:`${pct}%`,height:"100%",background:barColor,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:barColor,width:32,textAlign:"right",flexShrink:0}}>{pct}%</span>
                  <div style={{display:"flex",gap:5,flexShrink:0}}>
                    <span style={{fontSize:11,color:"#22c55e",background:"rgba(34,197,94,0.1)",padding:"1px 7px",borderRadius:8}}>✅{hechas}</span>
                    {noPudo>0&&<span style={{fontSize:11,color:"#ef4444",background:"rgba(239,68,68,0.1)",padding:"1px 7px",borderRadius:8}}>🔴{noPudo}</span>}
                    {pend>0&&<span style={{fontSize:11,color:"#f59e0b",background:"rgba(245,158,11,0.08)",padding:"1px 7px",borderRadius:8}}>⏳{pend}</span>}
                  </div>
                  <span style={{fontSize:11,color:"#4a7a5a",flexShrink:0}}>{abierta?"▲":"▼"}</span>
                </div>

                {/* Detalle colapsable */}
                {abierta&&(
                  <div style={{background:"rgba(0,0,0,0.15)",padding:"8px 14px 10px 44px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                    {tareasZona.map(t=>{
                      const est = EC[t.estado]||EC.pendiente;
                      return (
                        <div key={t.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",alignItems:"start"}}>
                          <span style={{flexShrink:0,fontSize:12,color:est.color,width:16}}>{est.icon}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <span style={{fontSize:12,fontWeight:600}}>{t.tarea}</span>
                            {t.elemento&&<span style={{fontSize:11,color:"#5a7a6a",marginLeft:6}}>{t.elemento}</span>}
                            {t.responsable&&<span style={{fontSize:11,color:"#6a9a7a",marginLeft:6}}>· 👤 {t.responsable}</span>}
                            {t.notaWorker&&<div style={{fontSize:11,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",fontStyle:"italic",marginTop:2}}>⚠️ {t.notaWorker}</div>}
                          </div>
                          <span style={{fontSize:10,color:est.color,flexShrink:0}}>{est.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VISTA DETALLE: cards completas ── */
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {zonas.map(([nombreZona, tareasZona])=>{
            const zonaInfo=MACROZONAS_BASE.find(z=>z.nombre===nombreZona);
            const hechas=tareasZona.filter(t=>["hecha","completada"].includes(t.estado)).length;
            const noPudo=tareasZona.filter(t=>t.estado==="no_pudo").length;
            const pct=Math.round((hechas/tareasZona.length)*100);
            return (
              <div key={nombreZona} style={{...S.card,padding:16,borderLeft:`3px solid ${noPudo>0?"#ef4444":pct===100?"#22c55e":"rgba(255,255,255,0.1)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{zonaInfo?.icono||"📍"}</span>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>{nombreZona}</span>
                    <span style={{fontSize:11,color:"#5a8a6a"}}>{zonaInfo?.categoria||""}</span>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#22c55e"}}>✅ {hechas}</span>
                    {noPudo>0&&<span style={{fontSize:11,color:"#ef4444"}}>🔴 {noPudo}</span>}
                    <span style={{fontSize:12,fontWeight:700,color:pct===100?"#22c55e":pct>50?"#f59e0b":"#ef4444"}}>{pct}%</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {tareasZona.map(t=>{
                    const est=EC[t.estado]||EC.pendiente;
                    return (
                      <div key={t.id} style={{display:"flex",gap:8,padding:"6px 10px",borderRadius:7,background:"rgba(255,255,255,0.04)",borderLeft:`2px solid ${est.color}40`,alignItems:"start"}}>
                        <span style={{flexShrink:0,fontSize:13}}>{est.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600}}>{t.tarea}{t.elemento&&<span style={{fontWeight:400,color:"#5a8a6a",marginLeft:6,fontSize:11}}>{t.elemento}</span>}</div>
                          <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap",fontSize:11}}>
                            <span style={{color:est.color}}>{est.label}</span>
                            {t.responsable&&<span style={{color:"#6a9a8a"}}>👤 {t.responsable}</span>}
                          </div>
                          {t.notaWorker&&<div style={{fontSize:11,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",marginTop:2,fontStyle:"italic"}}>⚠️ {t.notaWorker}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PANEL DE COMPRAS Y RENDICIÓN ────────────────────────────────────────────
const MESES_COMPRAS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── DEFINICIÓN DE BODEGAS ───────────────────────────────────────────────────
const BODEGAS_DEF = [
  { id:"b01", nombre:"Vivero", icono:"🌱", color:"#4ade80",
    descripcion:"Plantas, semillas, contenedores, sustratos",
    categorias:["Planta","Semilla","Contenedor/Macetero","Sustrato","Herramienta vivero","Otro"],
    tareasTipo:["Riego","Poda","Fertilización","Control plagas","Inventario","Orden y limpieza","Trasplante","Embalaje"],
  },
  { id:"b02", nombre:"Materiales de Riego", icono:"💧", color:"#60a5fa",
    descripcion:"Tuberías, aspersores, goteros, accesorios riego",
    categorias:["Tubería","Aspersor/Gotero","Válvula","Accesorio","Controlador","Cable/Sensor","Otro"],
    tareasTipo:["Inventario","Orden y limpieza","Revisión stock","Recepción material"],
  },
  { id:"b03", nombre:"Materiales y Herramientas", icono:"🔧", color:"#f59e0b",
    descripcion:"Herramientas manuales, materiales generales, fertilizantes",
    categorias:["Herramienta manual","Herramienta eléctrica","Fertilizante","Maicillo","Arena","Compost","Malla","Geotextil","Material construcción","EPP","Otro"],
    tareasTipo:["Inventario","Orden y limpieza","Mantenimiento herramientas","Recepción material","Baja de material"],
  },
  { id:"b04", nombre:"Maquinaria", icono:"🚜", color:"#f97316",
    descripcion:"Tractores, cortadoras, equipos motorizados",
    categorias:["Tractor","Cortadora césped","Motosierra","Bordeadora","Hidrolavadora","Compresor","Bomba","Otro equipo"],
    tareasTipo:["Revisión nivel aceite","Revisión combustible","Registro horas uso","Mantención preventiva","Mantención externa","Reparación interna","Limpieza","Traslado"],
  },
  { id:"b05", nombre:"Pesticidas", icono:"🧪", color:"#a78bfa",
    descripcion:"Fungicidas, herbicidas, insecticidas, reguladores",
    categorias:["Fungicida","Herbicida","Insecticida","Acaricida","Regulador crecimiento","Adherente","Otro"],
    tareasTipo:["Inventario","Orden y limpieza","Revisión vencimientos","Recepción","Baja/Destrucción"],
  },
  { id:"b06", nombre:"Golf", icono:"⛳", color:"#34d399",
    descripcion:"Maquinaria, herramientas, materiales y fertilizantes específicos de Golf",
    categorias:["Maquinaria golf","Herramienta golf","Fertilizante golf","Arena golf","Semilla golf","Material cancha","Accesorio golf","Otro"],
    tareasTipo:["Inventario","Orden y limpieza","Revisión maquinaria","Mantención","Recepción","Registro uso combustible"],
  },
];
const ESTADOS_MOV = {
  entrada:   {color:"#22c55e", label:"📥 Entrada"},
  salida:    {color:"#ef4444", label:"📤 Salida"},
  traslado:  {color:"#f59e0b", label:"🔄 Traslado"},
  baja:      {color:"#6b7280", label:"🗑️ Baja"},
  ajuste:    {color:"#a78bfa", label:"⚙️ Ajuste inventario"},
};

// ─── SELECTOR DE CUENTA ──────────────────────────────────────────────────────
function CuentaSelector({ value, onChange, S, CUENTAS_INTERNAS, CUENTAS_EXTERNAS }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{position:"relative"}}>
      <button style={{...S.input,width:"100%",textAlign:"left",cursor:"pointer",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px"}}
        onClick={()=>setOpen(p=>!p)}>
        <span style={{color:value?"#ede9e0":"#4a6a54"}}>{value||"Seleccionar cuenta..."}</span>
        <span style={{fontSize:10,color:"#5a8a6a"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,background:"#0f2517",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,overflow:"hidden",boxShadow:"0 10px 30px rgba(0,0,0,0.5)",marginTop:4}}>
          <div style={{padding:"4px 0",maxHeight:280,overflowY:"auto"}}>
            {/* Internas */}
            <div style={{padding:"8px 14px 4px",fontSize:10,color:"#4ade80",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",background:"rgba(74,222,128,0.05)"}}>
              🏛️ Internas — Beneficio general socios
            </div>
            {CUENTAS_INTERNAS.map(c=>(
              <div key={c} style={{padding:"9px 14px 9px 22px",cursor:"pointer",fontSize:13,color:value===c?"#86efac":"#ede9e0",background:value===c?"rgba(34,197,94,0.1)":"transparent",borderLeft:value===c?"2px solid #86efac":"2px solid transparent"}}
                onClick={()=>{onChange(c);setOpen(false);}}>
                {c}
              </div>
            ))}
            {/* Externas */}
            <div style={{padding:"8px 14px 4px",fontSize:10,color:"#60a5fa",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",background:"rgba(96,165,250,0.05)",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:4}}>
              🏢 Externas — Beneficio área específica
            </div>
            {CUENTAS_EXTERNAS.map(c=>(
              <div key={c} style={{padding:"9px 14px 9px 22px",cursor:"pointer",fontSize:13,color:value===c?"#93c5fd":"#ede9e0",background:value===c?"rgba(59,130,246,0.1)":"transparent",borderLeft:value===c?"2px solid #93c5fd":"2px solid transparent"}}
                onClick={()=>{onChange(c);setOpen(false);}}>
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SELECTOR DE BODEGA POR ÍTEM ─────────────────────────────────────────────
function BodegaSelector({ items, compra, onConfirm, onCancel, S }) {
  const [asignaciones, setAsignaciones] = React.useState(
    items.map(it=>it.bodegaDestino||"")
  );
  return (
    <div style={{marginTop:8,background:"rgba(61,122,82,0.08)",borderRadius:10,padding:"12px 14px",border:"1px solid rgba(61,122,82,0.25)"}}>
      <div style={{fontSize:12,color:"#86efac",fontWeight:600,marginBottom:10}}>
        📦 Asignar ítems a bodega — {compra.proveedor}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
        {items.map((it,i)=>(
          <div key={it.id||i} style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",background:"rgba(255,255,255,0.03)",borderRadius:7,padding:"7px 10px"}}>
            <div style={{flex:1,minWidth:120}}>
              <div style={{fontSize:12,fontWeight:600}}>{it.descripcion||"Sin descripción"}</div>
              <div style={{fontSize:11,color:"#6aaa7a"}}>{it.cantidad} {it.unidad}</div>
            </div>
            <select style={{...S.input,fontSize:11,padding:"5px 8px",minWidth:160,flex:1}}
              value={asignaciones[i]} onChange={e=>setAsignaciones(p=>{const n=[...p];n[i]=e.target.value;return n;})}>
              <option value="">🚫 No ingresar (servicio/mano de obra)</option>
              {BODEGAS_DEF.map(b=><option key={b.id} value={b.id}>{b.icono} {b.nombre}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn-p" style={S.btn} onClick={()=>onConfirm(asignaciones)}>✓ Confirmar</button>
        <button className="btn-g" style={S.btn} onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

function PanelCompras({ S, comprasData, setComprasData, personal, esJefa, data={}, updateZona=()=>{}, MACROZONAS_BASE=[], bodegasData={}, setBodegasData=()=>{} }) {
  const { compras, rendiciones=[], fondo=3000000, saldoAnterior=0, periodoAnterior="" } = comprasData;
  const set = (patch) => setComprasData(p=>({...p,...patch}));

  // ── Ingreso automático a bodega ───────────────────────────────────────────
  const ingresarItemsABodega = (docFecha, docRef, items, compraId) => {
    const porBodega = {};
    items.forEach(it=>{
      if(!it.bodegaDestino||!it.descripcion?.trim()) return;
      if(!porBodega[it.bodegaDestino]) porBodega[it.bodegaDestino]=[];
      porBodega[it.bodegaDestino].push(it);
    });
    if(!Object.keys(porBodega).length) {
      // Igual guardar asignación aunque no haya bodegas (todo es servicio)
      if(compraId) set({compras:compras.map(c=>c.id===compraId?{...c,items:(c.items||[]).map((it,i)=>({...it,bodegaDestino:items[i]?.bodegaDestino||""}))}:c)});
      return;
    }
    const nuevoBodegasData = {...bodegasData};
    Object.entries(porBodega).forEach(([bodId, its])=>{
      const bd = nuevoBodegasData[bodId]||{items:[],movimientos:[],tareas:[],traslados:[]};
      const nuevosItems = [...(bd.items||[])];
      const nuevosMovs  = [...(bd.movimientos||[])];
      its.forEach(it=>{
        const cant = Number(it.cantidad)||1;
        // Evitar duplicados: verificar si ya existe movimiento de esta compra+ítem
        const yaIngresado = nuevosMovs.some(m=>m.docRef===docRef&&m.itemNombre?.toLowerCase()===it.descripcion.trim().toLowerCase());
        if(yaIngresado) return;
        const idx = nuevosItems.findIndex(i=>i.nombre.trim().toLowerCase()===it.descripcion.trim().toLowerCase());
        if(idx>=0) {
          nuevosItems[idx] = {...nuevosItems[idx], stockActual:(Number(nuevosItems[idx].stockActual)||0)+cant};
        } else {
          nuevosItems.push({id:Date.now()+Math.random(), nombre:it.descripcion, categoria:it.categoria||"", unidad:it.unidad||"unidad", stockActual:cant, stockMinimo:0, ubicacion:"", obs:`Ingresado desde ${docRef}`});
        }
        const itemId = idx>=0?nuevosItems[idx].id:nuevosItems[nuevosItems.length-1].id;
        nuevosMovs.unshift({id:Date.now()+Math.random(), fecha:docFecha, tipo:"entrada", cantidad:cant, unidad:it.unidad||"unidad", motivo:`Compra — ${docRef}`, responsable:"", itemId:String(itemId), docRef, itemNombre:it.descripcion.trim()});
      });
      nuevoBodegasData[bodId] = {...bd, items:nuevosItems, movimientos:nuevosMovs.slice(0,200)};
    });
    setBodegasData(nuevoBodegasData);
    // Guardar asignación en la compra para que persista al volver
    if(compraId) set({compras:compras.map(c=>c.id===compraId?{...c,items:(c.items||[]).map((it,i)=>({...it,bodegaDestino:items[i]?.bodegaDestino||it.bodegaDestino||""}))}:c)});
  };

  // ── Categorías predefinidas ───────────────────────────────────────────────
  const CATEGORIAS = ["Caja chica","Combustible","Decoración Interior","Difusión/Educación","EPP / Uniforme","Fertilizante","Fletes","Herramienta","Maceteros","Maicillo","Maquinaria/Equipos","Material de construcción","Material de riego","Materiales/Herramientas","Mulch","Plaguicida","Planta","Repuesto maquinaria","Semilla","Servicio externo","Sustratos/Enmiendas","Otro"];

  // ── Cuentas a imputar según organigrama ──────────────────────────────────
  const CUENTAS_INTERNAS = ["Mantenimiento Áreas Verdes","Obras Áreas Verdes"];
  const CUENTAS_EXTERNAS = ["Rama de Fútbol","Rama de Golf","Taller Depto. Social y Cultural","Rama de Tenis","Jardín Infantil"];
  const TODAS_CUENTAS = [...CUENTAS_INTERNAS,...CUENTAS_EXTERNAS];

  const PIE_PAGINA = "Jefe de Departamento de Áreas Verdes · Carmen Luz Hermosilla Diez";

  const hoy = new Date();
  const [subTab, setSubTab] = React.useState("fondo");
  const [showForm, setShowForm] = React.useState(false);
  const [showRendForm, setShowRendForm] = React.useState(false);
  const [showReembolsoForm, setShowReembolsoForm] = React.useState(false);
  const [showSaldoAnt, setShowSaldoAnt] = React.useState(false);
  const [saldoForm, setSaldoForm] = React.useState({monto:"", periodo:""});
  const [editId, setEditId] = React.useState(null);
  const [filtroCuenta, setFiltroCuenta] = React.useState("todas");
  const [filtroMes, setFiltroMes] = React.useState("todos");
  const [seleccionadas, setSeleccionadas] = React.useState([]);
  const [rendForm, setRendForm] = React.useState({fecha:hoy.toISOString().slice(0,10),obs:""});
  const [reembolsoForm, setReembolsoForm] = React.useState({fecha:hoy.toISOString().slice(0,10),monto:"",banco:"",nTransferencia:"",obs:""});
  const [expandDetalle, setExpandDetalle] = React.useState(null);

  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};

  // ── Formulario cabecera + ítems ───────────────────────────────────────────
  const emptyItem = {id:Date.now(), descripcion:"", categoria:"", cantidad:1, unidad:"unidad", precioUnitario:"", totalNeto:"", iva:"", totalBruto:"", bodegaDestino:""};
  const emptyForm = {
    fecha:hoy.toISOString().slice(0,10),
    proveedor:"", rut:"", nDocumento:"", tipoDoc:"Factura",
    cuenta:"", responsable:"",
    fechaPago:"", formaPago:"transferencia", bancoPago:"", nTransferencia:"",
    estado:"pendiente", obs:"",
    items:[{...emptyItem, id:1}],
    totalNetoDoc:"", ivaDoc:"", totalBrutoDoc:"",
  };
  const [form, setForm] = React.useState(emptyForm);

  // ── Cálculo automático por ítem ───────────────────────────────────────────
  const calcItem = (item) => {
    const cant = Number(item.cantidad)||1;
    const pu   = Number(item.precioUnitario)||0;
    const neto = Math.round(cant*pu);
    const iva  = form.tipoDoc==="Boleta"?0:Math.round(neto*0.19);
    return {...item, totalNeto:neto||"", iva:iva||"", totalBruto:(neto+iva)||""};
  };

  const updateItem = (idx, patch) => {
    const items = form.items.map((it,i)=>{
      if(i!==idx) return it;
      const next = {...it,...patch};
      if(patch.cantidad!==undefined||patch.precioUnitario!==undefined) return calcItem(next);
      return next;
    });
    const totalNeto  = items.reduce((a,it)=>a+Number(it.totalNeto||0),0);
    const ivaTotal   = items.reduce((a,it)=>a+Number(it.iva||0),0);
    const totalBruto = items.reduce((a,it)=>a+Number(it.totalBruto||0),0);
    setForm(p=>({...p, items, totalNetoDoc:totalNeto||"", ivaDoc:ivaTotal||"", totalBrutoDoc:totalBruto||""}));
  };

  const addItem = () => setForm(p=>({...p, items:[...p.items,{...emptyItem,id:Date.now()}]}));
  const removeItem = (idx) => {
    if(form.items.length===1) return;
    const items = form.items.filter((_,i)=>i!==idx);
    const totalNeto  = items.reduce((a,it)=>a+Number(it.totalNeto||0),0);
    const ivaTotal   = items.reduce((a,it)=>a+Number(it.iva||0),0);
    const totalBruto = items.reduce((a,it)=>a+Number(it.totalBruto||0),0);
    setForm(p=>({...p,items,totalNetoDoc:totalNeto||"",ivaDoc:ivaTotal||"",totalBrutoDoc:totalBruto||""}));
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const [alertaDuplicado, setAlertaDuplicado] = React.useState(null);

  const guardar = () => {
    if(!form.proveedor.trim()||!form.cuenta||!form.items[0].descripcion.trim()) {
      console.log("GUARDAR BLOQUEADO: falta proveedor, cuenta o descripción", {proveedor:form.proveedor, cuenta:form.cuenta, desc:form.items[0]?.descripcion});
      return;
    }
    // Verificar duplicado — solo mismo tipoDoc + mismo N° + mismo RUT
    if(!editId && form.nDocumento.trim() && form.rut.trim()) {
      const duplicado = compras.find(c=>
        c.nDocumento?.trim()===form.nDocumento.trim() &&
        c.tipoDoc===form.tipoDoc &&
        c.rut?.trim()===form.rut.trim()
      );
      if(duplicado) {
        setAlertaDuplicado(`⚠️ Ya existe una ${duplicado.tipoDoc} N° ${duplicado.nDocumento} de ${duplicado.proveedor} ingresada el ${duplicado.fecha}. ¿Deseas guardar igual?`);
        return;
      }
    }
    const docId = editId || Date.now();
    const doc = {...form, id:docId};
    const notasVinculadas = form.notasVinculadas||[];
    console.log("GUARDANDO:", doc.tipoDoc, doc.nDocumento, "notas vinculadas:", notasVinculadas.length);
    if(editId) {
      set({compras:compras.map(c=>c.id===editId?doc:c)});
      setEditId(null);
    } else {
      set({compras:[doc,...compras.map(c=>notasVinculadas.includes(c.id)?{...c,estado:"facturada",facturaId:docId}:c)]});
      // Ingresar ítems a bodegas
      ingresarItemsABodega(doc.fecha, `${doc.tipoDoc} ${doc.nDocumento||""} ${doc.proveedor||""}`, doc.items||[]);
    }
    setForm(emptyForm); setShowForm(false); setAlertaDuplicado(null);
  };

  const guardarIgual = () => {
    const doc = {...form, id:Date.now()};
    set({compras:[doc,...compras]});
    setForm(emptyForm); setShowForm(false); setAlertaDuplicado(null);
  };

  const eliminar = (id) => set({compras:compras.filter(c=>c.id!==id)});
  const editar   = (c)  => { setForm({...c,items:c.items||[{...emptyItem,descripcion:c.descripcion||"",cantidad:c.cantidad||1,precioUnitario:c.precioUnitario||"",totalNeto:c.totalNeto||"",iva:c.iva||"",totalBruto:c.totalBruto||""}]}); setEditId(c.id); setShowForm(true); setSubTab("lista"); };

  const marcarPagada = (id, forma) => {
    const compra = compras.find(c=>c.id===id);
    if(compra && ["pagada","pagada_efectivo","pagada_debito","rendida","en_rendicion"].includes(compra.estado)) {
      const estadoLabel = compra.estado==="pagada"?"ya fue pagada por transferencia":compra.estado==="pagada_efectivo"?"ya fue pagada en efectivo":compra.estado==="rendida"?"ya fue rendida":"está en proceso de rendición";
      if(!window.confirm(`⚠️ Esta factura ${estadoLabel}. ¿Deseas marcarla como pagada de todas formas?`)) return;
    }
    set({compras:compras.map(c=>c.id===id?{...c,estado:"pagada",formaPago:forma,fechaPago:c.fechaPago||hoy.toISOString().slice(0,10)}:c)});
  };

  // ── Rendición ─────────────────────────────────────────────────────────────
  const crearRendicion = () => {
    if(!seleccionadas.length) return;
    const items = compras.filter(c=>seleccionadas.includes(c.id));
    const total = items.reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0);
    const nueva = {id:Date.now(),fecha:rendForm.fecha,obs:rendForm.obs,items:seleccionadas,total,estado:"presentada",reembolso:false,montoReembolso:0,fechaReembolso:"",nTransReembolso:""};
    set({compras:compras.map(c=>seleccionadas.includes(c.id)?{...c,estado:"en_rendicion"}:c),rendiciones:[nueva,...rendiciones]});
    setSeleccionadas([]); setRendForm({fecha:hoy.toISOString().slice(0,10),obs:""}); setShowRendForm(false);
  };

  const registrarReembolso = (rendId) => {
    if(!reembolsoForm.monto) return;
    set({
      rendiciones:rendiciones.map(r=>r.id===rendId?{...r,reembolso:true,estado:"reembolsada",montoReembolso:Number(reembolsoForm.monto),fechaReembolso:reembolsoForm.fecha,nTransReembolso:reembolsoForm.nTransferencia,bancoReembolso:reembolsoForm.banco,obsReembolso:reembolsoForm.obs}:r),
      compras:compras.map(c=>rendiciones.find(r=>r.id===rendId)?.items?.includes(c.id)?{...c,estado:"rendida"}:c),
    });
    setReembolsoForm({fecha:hoy.toISOString().slice(0,10),monto:"",banco:"",nTransferencia:"",obs:""});
    setShowReembolsoForm(false);
  };

  const deshacerRendicion = (rendId) => {
    if(!window.confirm("¿Deshacer esta rendición? Las compras volverán al estado anterior.")) return;
    const rend = rendiciones.find(r=>r.id===rendId);
    if(!rend) return;
    set({
      rendiciones: rendiciones.filter(r=>r.id!==rendId),
      compras: compras.map(c=>rend.items?.includes(c.id)?{...c,estado:"pagada"}:c),
    });
  };

  // ── Informe de rendición ──────────────────────────────────────────────────
  const imprimirRendicion = (r) => {
    const itemsRend = compras.filter(c=>r.items?.includes(c.id));
    const fechaRend = new Date(r.fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
    const fechaHoy  = new Date().toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
    const porCuentaRend = {};
    itemsRend.forEach(c=>{
      if(!porCuentaRend[c.cuenta]) porCuentaRend[c.cuenta]={total:0,n:0};
      porCuentaRend[c.cuenta].total += Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0);
      porCuentaRend[c.cuenta].n++;
    });
    const filas = itemsRend.map(c=>{
      const items = c.items||[{descripcion:c.descripcion,cantidad:c.cantidad||1,unidad:c.unidad||"unidad",totalNeto:c.totalNeto||0,iva:c.iva||0,totalBruto:c.totalBruto||0}];
      const totalDoc = Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0);
      const notasVinc = compras.filter(np=>np.facturaId===c.id);
      const notasHtml = notasVinc.length>0?`<tr><td colspan="8" style="padding:3px 8px 3px 24px;font-size:10px;color:#777;background:#fffde7;border:1px solid #e0e0e0"><em>NP vinculadas: ${notasVinc.map(np=>"NP "+np.nDocumento+" ("+np.fecha+")").join(", ")}</em></td></tr>`:"";
      return `<tr>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.fecha}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.tipoDoc} N°${c.nDocumento||"—"}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.proveedor||"—"}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${items.map(it=>it.descripcion+(it.categoria?" ("+it.categoria+")":"")).join("<br>")}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right">$${items.reduce((a,it)=>a+Number(it.totalNeto||0),0).toLocaleString("es-CL")}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right">$${items.reduce((a,it)=>a+Number(it.iva||0),0).toLocaleString("es-CL")}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right;font-weight:bold">$${totalDoc.toLocaleString("es-CL")}</td>
        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.cuenta||"—"}</td>
      </tr>${notasHtml}`;
    }).join("");
    const subtotales = Object.entries(porCuentaRend).map(([cu,d])=>`<tr style="background:#f5f5f5"><td colspan="6" style="padding:4px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right">Subtotal ${cu}:</td><td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right;font-weight:600">$${d.total.toLocaleString("es-CL")}</td><td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:10px;color:#888">${d.n} doc.</td></tr>`).join("");
    const totalNeto  = itemsRend.reduce((a,c)=>a+Number((c.items||[]).reduce((b,it)=>b+Number(it.totalNeto||0),0)||c.totalNeto||0),0);
    const totalIva   = itemsRend.reduce((a,c)=>a+Number((c.items||[]).reduce((b,it)=>b+Number(it.iva||0),0)||c.iva||0),0);
    const totalBruto = r.total;
    const pendienteReembolso = fondo - Number(saldoAnterior||0);
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Rendicion Gastos Dpto Areas Verdes</title>
    <style>body{font-family:Arial,sans-serif;margin:25px;color:#1a1a1a;font-size:12px}
    h1{font-size:17px;color:#1a5c2a;margin:0 0 3px}h2{font-size:12px;color:#333;margin:0}
    .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a5c2a;padding-bottom:10px;margin-bottom:14px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
    .box{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:8px 10px}
    .lbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .val{font-size:13px;font-weight:700;color:#1a5c2a}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{background:#1a5c2a;color:#fff;padding:6px 8px;font-size:10px;text-align:left}
    tr:nth-child(even){background:#fafafa}
    .tot{background:#e8f5e9!important;font-weight:bold}
    .sec{font-size:11px;font-weight:700;color:#1a5c2a;margin:12px 0 5px;border-left:3px solid #1a5c2a;padding-left:7px;text-transform:uppercase}
    .firmas{display:flex;justify-content:space-between;margin-top:50px}
    .firma{text-align:center;width:30%}
    .flinea{border-top:1px solid #333;padding-top:6px;margin-top:40px;font-size:10px}
    .footer{margin-top:18px;padding-top:8px;border-top:1px solid #ccc;font-size:9px;color:#888;text-align:center}
    @media print{.noprint{display:none}}</style></head><body>
    <div class="hdr">
      <div><h1>Informe de Rendicion de Gastos</h1><h2>Departamento de Areas Verdes - Estadio Espanol de Las Condes</h2>
      <div style="font-size:10px;color:#666;margin-top:3px">Dirigido a: Gerencia General y Administracion</div></div>
      <div style="text-align:right">
        <div style="font-size:10px;color:#666">Fecha rendicion: <strong>${fechaRend}</strong></div>
        <div style="font-size:10px;color:#666">Emision: <strong>${fechaHoy}</strong></div>
        <div style="font-size:18px;font-weight:900;color:#c62828">$${totalBruto.toLocaleString("es-CL")}</div>
        <div style="font-size:10px;color:#888">Total a reembolsar</div>
        ${r.obs?"<div style='font-size:10px;color:#555;margin-top:3px'><em>"+r.obs+"</em></div>":""}
      </div>
    </div>
    <div class="grid3">
      <div class="box"><div class="lbl">Fondo base</div><div class="val">$${fondo.toLocaleString("es-CL")}</div></div>
      ${Number(saldoAnterior)>0?"<div class='box' style='border-color:#ffc107'><div class='lbl'>Saldo periodo anterior"+(periodoAnterior?" ("+periodoAnterior+")":"")+"</div><div class='val' style='color:#e65100'>$"+Number(saldoAnterior).toLocaleString("es-CL")+"</div></div>":"<div></div>"}
      <div class="box" style="border-color:#c62828"><div class="lbl">Esta rendicion</div><div class="val" style="color:#c62828">$${totalBruto.toLocaleString("es-CL")}</div></div>
    </div>
    ${Number(saldoAnterior)>0&&pendienteReembolso>0?"<div style='background:#fff8e1;border:1px solid #ffc107;border-radius:5px;padding:8px 12px;margin-bottom:12px;font-size:11px'>Reembolso pendiente periodo anterior"+(periodoAnterior?" ("+periodoAnterior+")":"")+": <strong>$"+pendienteReembolso.toLocaleString("es-CL")+"</strong> - se solicita regularizacion junto a esta rendicion.</div>":""}
    <div class="sec">Detalle de Documentos</div>
    <table><thead><tr><th>Fecha</th><th>Documento</th><th>Proveedor</th><th>Descripcion</th><th style="text-align:right">Neto</th><th style="text-align:right">IVA</th><th style="text-align:right">Total</th><th>Cuenta</th></tr></thead>
    <tbody>${filas}</tbody>${subtotales}
    <tfoot><tr class="tot"><td colspan="4" style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right">TOTALES</td>
    <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right">$${totalNeto.toLocaleString("es-CL")}</td>
    <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right">$${totalIva.toLocaleString("es-CL")}</td>
    <td style="padding:6px 8px;border:1px solid #e0e0e0;text-align:right">$${totalBruto.toLocaleString("es-CL")}</td>
    <td style="padding:6px 8px;border:1px solid #e0e0e0"></td></tr></tfoot></table>
    <div class="sec">Resumen por Cuenta</div>
    <table style="width:65%"><thead><tr><th>Cuenta</th><th>Tipo</th><th style="text-align:right">Total</th><th style="text-align:right">%</th></tr></thead><tbody>
    ${Object.entries(porCuentaRend).map(([cu,d])=>{
      const pct = totalBruto?Math.round((d.total/totalBruto)*100):0;
      const barW = pct;
      return "<tr><td style='padding:5px 8px;border:1px solid #e0e0e0'>"+cu+"</td><td style='padding:5px 8px;border:1px solid #e0e0e0;font-size:10px;color:#888'>"+(CUENTAS_INTERNAS.includes(cu)?"Interna":"Externa")+"</td><td style='padding:5px 8px;border:1px solid #e0e0e0;text-align:right;font-weight:600'>$"+d.total.toLocaleString("es-CL")+"</td><td style='padding:5px 8px;border:1px solid #e0e0e0;text-align:right'><div style='display:flex;align-items:center;justify-content:flex-end;gap:6px'><div style='width:60px;height:7px;background:#e0e0e0;border-radius:3px;overflow:hidden'><div style='width:"+barW+"%;height:100%;background:#1a5c2a;border-radius:3px'></div></div><span style='font-size:11px;font-weight:600;color:#1a5c2a'>"+pct+"%</span></div></td></tr>";
    }).join("")}
    <tr class="tot"><td colspan="2" style="padding:5px 8px;border:1px solid #e0e0e0;text-align:right">TOTAL A REEMBOLSAR</td><td style="padding:5px 8px;border:1px solid #e0e0e0;text-align:right;color:#c62828;font-size:14px">$${totalBruto.toLocaleString("es-CL")}</td><td style="padding:5px 8px;border:1px solid #e0e0e0;text-align:right;font-weight:700;color:#1a5c2a">100%</td></tr>
    </tbody></table>
    ${r.reembolso?"<div style='background:#e8f5e9;border:1px solid #4caf50;border-radius:5px;padding:7px 12px;margin-bottom:12px;font-size:11px'>Reembolso recibido: <strong>$"+Number(r.montoReembolso).toLocaleString("es-CL")+"</strong> - "+r.fechaReembolso+(r.bancoReembolso?" - "+r.bancoReembolso:"")+(r.nTransReembolso?" - Trans: "+r.nTransReembolso:"")+"</div>":""}
    <div class="firmas">
      <div class="firma"><div class="flinea"><strong>Carmen Luz Hermosilla Diez</strong><br>Jefe Depto. de Areas Verdes</div></div>
      <div class="firma"><div class="flinea">Gerencia General<br>Estadio Espanol de Las Condes</div></div>
      <div class="firma"><div class="flinea">Administracion / Finanzas<br>Estadio Espanol de Las Condes</div></div>
    </div>
    <div class="footer">Estadio Espanol de Las Condes - Departamento de Areas Verdes<br>
    Jefe de Departamento de Areas Verdes - Carmen Luz Hermosilla Diez - Documento generado el ${fechaHoy}</div>
    <div class="noprint" style="text-align:center;margin-top:18px">
      <button onclick="window.print()" style="background:#1a5c2a;color:#fff;border:none;padding:10px 28px;border-radius:7px;font-size:13px;cursor:pointer">Imprimir / Guardar PDF</button>
    </div></body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close();
  };
  // Fondo disponible real = saldo anterior (si no hay reembolso pendiente → fondo base)
  // Si hay rendición pendiente de reembolso → el fondo real es el saldo anterior
  // Cuando llega el reembolso → el fondo vuelve a $3.000.000
  const totalGeneral = compras.reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0);
  const totalReembolsado = rendiciones.reduce((a,r)=>a+(r.reembolso?Number(r.montoReembolso||0):0),0);
  const hayRendicionPendiente = rendiciones.some(r=>!r.reembolso);
  // Si hay saldo anterior ingresado → ese es el fondo actual (reembolso pendiente)
  // Si no hay saldo anterior → fondo base ($3M)
  const fondoActual = Number(saldoAnterior)>0 ? Number(saldoAnterior) : fondo;
  const gastadoPendiente = compras
    .filter(c=>["pendiente","pagada","pagada_efectivo","pagada_debito","en_rendicion"].includes(c.estado))
    .reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0);
  const saldoDisponible = fondoActual - gastadoPendiente;
  const pctUsado        = fondoActual?Math.round((gastadoPendiente/fondoActual)*100):0;
  const colorSaldo      = saldoDisponible>fondoActual*0.4?"#22c55e":saldoDisponible>fondoActual*0.15?"#f59e0b":"#ef4444";

  const porCuenta = TODAS_CUENTAS.map(cu=>{
    const items=compras.filter(c=>c.cuenta===cu);
    const total=items.reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0);
    return {cuenta:cu,total,n:items.length,esInterna:CUENTAS_INTERNAS.includes(cu)};
  }).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);

  const mesesDisp=[];
  for(let i=5;i>=0;i--){const d=new Date(hoy.getFullYear(),hoy.getMonth()-i,1);mesesDisp.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:`${MESES_COMPRAS[d.getMonth()]} ${d.getFullYear()}`});}
  const porMes=mesesDisp.map(m=>({...m,total:compras.filter(c=>(c.fecha||"").startsWith(m.key)).reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0)}));
  const maxMes=Math.max(...porMes.map(m=>m.total),1);
  const mesesUnicos=[...new Set(compras.map(c=>(c.fecha||"").slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const listaPersonal=[...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  const ESTADO_C={
    pendiente:      {color:"#f59e0b",bg:"rgba(245,158,11,0.1)",   label:"⏳ Pendiente pago"},
    pagada:         {color:"#3b82f6",bg:"rgba(59,130,246,0.1)",   label:"💳 Pagada (transferencia)"},
    pagada_efectivo:{color:"#8b5cf6",bg:"rgba(139,92,246,0.1)",   label:"💵 Pagada (efectivo/débito)"},
    nota_credito:   {color:"#f97316",bg:"rgba(249,115,22,0.1)",   label:"📝 Nota de crédito"},
    facturada:      {color:"#06b6d4",bg:"rgba(6,182,212,0.1)",    label:"🔗 Facturada"},
    en_rendicion:   {color:"#a78bfa",bg:"rgba(167,139,250,0.1)",  label:"📤 En rendición"},
    rendida:        {color:"#22c55e",bg:"rgba(34,197,94,0.1)",    label:"✅ Rendida"},
    rechazada:      {color:"#ef4444",bg:"rgba(239,68,68,0.1)",    label:"❌ Rechazada"},
  };

  const [mostrarFacturadas, setMostrarFacturadas] = React.useState(false);
  const [selectBodegaId, setSelectBodegaId] = React.useState(null);
  const [showCuentaMenu, setShowCuentaMenu] = React.useState(false);
  const comprasFilt = compras.filter(c=>{
    const mc=filtroCuenta==="todas"||c.cuenta===filtroCuenta;
    const mm=filtroMes==="todos"||(c.fecha||"").slice(0,7)===filtroMes;
    const mf=mostrarFacturadas||c.estado!=="facturada";
    return mc&&mm&&mf;
  });

  return (
    <div className="ein">
      <div style={{marginBottom:16}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:4}}>🛒 Compras y Rendición</h1>
        <p style={{color:"#6aaa7a",fontSize:14}}>Fondo fijo rotativo · Departamento de Áreas Verdes · Estadio Español</p>
      </div>

      {/* Panel fondo */}
      <div style={{...S.card,padding:18,marginBottom:18,borderColor:colorSaldo+"40"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:12,marginBottom:14}}>
          <div>
            <div style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.6px",marginBottom:4,textTransform:"uppercase"}}>💼 Fondo disponible</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,color:colorSaldo}}>${saldoDisponible.toLocaleString("es-CL")}</div>
            <div style={{fontSize:12,color:"#5a8a6a",marginTop:2}}>
              {"de $"+fondoActual.toLocaleString("es-CL")+" "+(hayRendicionPendiente&&Number(saldoAnterior)>0?"(saldo período anterior)":"(fondo base)")}
            </div>
            {hayRendicionPendiente&&Number(saldoAnterior)>0&&(
              <div style={{fontSize:11,color:"#f59e0b",marginTop:6,background:"rgba(245,158,11,0.08)",borderRadius:6,padding:"5px 8px"}}>
                {"⏳ Reembolso pendiente"+(periodoAnterior?" de "+periodoAnterior:"")+": $"+(fondo-Number(saldoAnterior)).toLocaleString("es-CL")+" — cuando llegue, el fondo vuelve a $"+fondo.toLocaleString("es-CL")}
              </div>
            )}
            {!hayRendicionPendiente&&Number(saldoAnterior)>0&&(
              <div style={{fontSize:11,color:"#22c55e",marginTop:6,background:"rgba(34,197,94,0.08)",borderRadius:6,padding:"5px 8px"}}>
                {"✅ Reembolso recibido — fondo en $"+fondo.toLocaleString("es-CL")}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 16px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#f59e0b"}}>${gastadoPendiente.toLocaleString("es-CL")}</div>
              <div style={{fontSize:10,color:"#a08050"}}>Comprometido</div>
            </div>
            <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 16px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#22c55e"}}>${totalReembolsado.toLocaleString("es-CL")}</div>
              <div style={{fontSize:10,color:"#4a8a5a"}}>Reembolsado</div>
            </div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:6,height:10,overflow:"hidden",marginBottom:6}}>
          <div style={{width:`${Math.min(pctUsado,100)}%`,height:"100%",background:colorSaldo,borderRadius:6}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#5a8a6a"}}>
          <span>{pctUsado}% comprometido</span>
          {esJefa&&<div style={{display:"flex",gap:6}}>
            <button style={{...S.btn,fontSize:10,padding:"2px 8px",background:"rgba(245,158,11,0.1)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.2)"}}
              onClick={()=>{setSaldoForm({monto:String(saldoAnterior||""),periodo:periodoAnterior||""});setShowSaldoAnt(true);}}>
              💰 Saldo anterior
            </button>
            <button style={{...S.btn,fontSize:10,padding:"2px 8px",background:"rgba(255,255,255,0.06)",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)"}}
              onClick={()=>{const v=prompt("Monto del fondo base ($):",fondo);if(v&&!isNaN(Number(v)))set({fondo:Number(v)});}}>
              ⚙️ Ajustar fondo
            </button>
          </div>}
        </div>
      </div>

      {/* Formulario saldo anterior */}
      {showSaldoAnt&&(
        <div style={{...S.card,padding:16,marginBottom:16,background:"rgba(245,158,11,0.07)",borderColor:"rgba(245,158,11,0.3)"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#fcd34d",marginBottom:6}}>💰 Inicializar saldo del fondo</div>
          <div style={{fontSize:12,color:"#a08050",marginBottom:12}}>
            Ingresa el saldo real disponible a la fecha de corte. Este es el punto de partida — la diferencia con ${fondo.toLocaleString("es-CL")} quedará registrada como rendición pendiente de reembolso.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Saldo disponible ($)</label>
              <input type="number" min={0} style={S.input} placeholder={"ej: 193793"} value={saldoForm.monto} onChange={e=>setSaldoForm(p=>({...p,monto:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"}}>Fecha de corte</label>
              <input type="text" style={S.input} placeholder="ej: 03/06/2026" value={saldoForm.periodo} onChange={e=>setSaldoForm(p=>({...p,periodo:e.target.value}))}/>
            </div>
          </div>
          {saldoForm.monto&&saldoForm.periodo&&(
            <div style={{fontSize:12,color:"#f59e0b",background:"rgba(245,158,11,0.06)",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
              <div>Saldo disponible actual: <strong>${Number(saldoForm.monto).toLocaleString("es-CL")}</strong></div>
              <div>Pendiente de reembolso: <strong>${(fondo-Number(saldoForm.monto)).toLocaleString("es-CL")}</strong></div>
              <div style={{fontSize:11,color:"#8a7050",marginTop:2}}>Cuando el Estadio reembolse, el fondo volverá a ${fondo.toLocaleString("es-CL")}</div>
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button className="btn-p" style={S.btn} onClick={()=>{
              const montoNum = Number(saldoForm.monto)||0;
              const fechaTexto = saldoForm.periodo||"";
              if(montoNum>0) {
                set({saldoAnterior:montoNum, periodoAnterior:fechaTexto});
              }
              setShowSaldoAnt(false);
            }}>✓ Guardar</button>
            <button className="btn-g" style={S.btn} onClick={()=>setShowSaldoAnt(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {[["fondo","📊 Resumen"],["lista","📋 Compras"],["rendiciones","📤 Rendiciones"]].map(([t,l])=>{
          const badge=t==="lista"?compras.filter(c=>c.estado==="pendiente").length:t==="rendiciones"?rendiciones.filter(r=>!r.reembolso).length:0;
          return <button key={t} className={`tab${subTab===t?" on":""}`} onClick={()=>{setSubTab(t);setShowForm(false);}} style={{position:"relative"}}>
            {l}{badge>0&&<span style={{position:"absolute",top:1,right:1,background:"#ef4444",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{badge}</span>}
          </button>;
        })}
      </div>
      {subTab==="fondo"&&(
        <div className="ein">
          {compras.length===0?(
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:10}}>🛒</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin compras registradas</div>
            </div>
          ):(
            <>
              {/* Botón imprimir resumen */}
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
                <button style={{...S.btn,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",fontSize:12}}
                  onClick={()=>{
                    const fechaHoy = new Date().toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
                    const mesActual = new Date().toLocaleDateString("es-CL",{month:"long",year:"numeric"});
                    // Por cuenta con %
                    const filasCuenta = porCuenta.map(c=>{
                      const pct = totalGeneral?Math.round((c.total/totalGeneral)*100):0;
                      return `<tr>
                        <td style="padding:6px 10px;border:1px solid #e0e0e0">${c.cuenta}</td>
                        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:10px;color:#888">${CUENTAS_INTERNAS.includes(c.cuenta)?"Interna":"Externa"}</td>
                        <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:center">${c.n}</td>
                        <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right;font-weight:600">$${c.total.toLocaleString("es-CL")}</td>
                        <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right">
                          <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px">
                            <div style="width:80px;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden">
                              <div style="width:${pct}%;height:100%;background:#1a5c2a;border-radius:4px"></div>
                            </div>
                            <strong style="color:#1a5c2a">${pct}%</strong>
                          </div>
                        </td>
                      </tr>`;
                    }).join("");
                    // Pendientes de pago
                    const pendientes = compras.filter(c=>c.estado==="pendiente");
                    const filasPend = pendientes.length===0
                      ? "<tr><td colspan='5' style='text-align:center;color:#888;padding:10px'>Sin compras pendientes</td></tr>"
                      : pendientes.map(c=>`<tr>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.fecha}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.tipoDoc} N°${c.nDocumento||"—"}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.proveedor||"—"}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${c.cuenta||"—"}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right;font-weight:600">$${Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0).toLocaleString("es-CL")}</td>
                        </tr>`).join("");
                    // Rendiciones pendientes
                    const rendPend = rendiciones.filter(r=>!r.reembolso);
                    const filasRend = rendPend.length===0
                      ? "<tr><td colspan='3' style='text-align:center;color:#888;padding:10px'>Sin rendiciones pendientes</td></tr>"
                      : rendPend.map(r=>`<tr>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${new Date(r.fecha+"T12:00:00").toLocaleDateString("es-CL")}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px">${r.obs||"—"}</td>
                          <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right;font-weight:600;color:#c62828">$${r.total.toLocaleString("es-CL")}</td>
                        </tr>`).join("");
                    // Gráfico barras por mes (texto)
                    const filasGraf = porMes.filter(m=>m.total>0).map(m=>{
                      const pct = maxMes?Math.round((m.total/maxMes)*100):0;
                      return `<tr>
                        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;width:100px">${m.label}</td>
                        <td style="padding:5px 8px;border:1px solid #e0e0e0">
                          <div style="display:flex;align-items:center;gap:8px">
                            <div style="width:${Math.round(pct*2)}px;height:14px;background:#1a5c2a;border-radius:3px;min-width:4px"></div>
                            <span style="font-size:11px;font-weight:600">$${Math.round(m.total/1000)}k</span>
                          </div>
                        </td>
                        <td style="padding:5px 8px;border:1px solid #e0e0e0;font-size:11px;text-align:right">$${m.total.toLocaleString("es-CL")}</td>
                      </tr>`;
                    }).join("");
                    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Resumen Compras Dpto Areas Verdes</title>
                    <style>body{font-family:Arial,sans-serif;margin:25px;color:#1a1a1a;font-size:12px}
                    h1{font-size:17px;color:#1a5c2a;margin:0 0 3px}h2{font-size:12px;color:#333;margin:0}
                    .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a5c2a;padding-bottom:10px;margin-bottom:16px}
                    .grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px}
                    .box{background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:8px 10px}
                    .lbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
                    .val{font-size:14px;font-weight:700;color:#1a5c2a}
                    table{width:100%;border-collapse:collapse;margin-bottom:16px}
                    th{background:#1a5c2a;color:#fff;padding:6px 10px;font-size:10px;text-align:left}
                    tr:nth-child(even){background:#fafafa}
                    .tot{background:#e8f5e9!important;font-weight:bold}
                    .sec{font-size:11px;font-weight:700;color:#1a5c2a;margin:14px 0 6px;border-left:3px solid #1a5c2a;padding-left:7px;text-transform:uppercase}
                    .footer{margin-top:20px;padding-top:8px;border-top:1px solid #ccc;font-size:9px;color:#888;text-align:center}
                    @media print{.noprint{display:none}}</style></head><body>
                    <div class="hdr">
                      <div><h1>Resumen de Compras y Rendicion</h1><h2>Departamento de Areas Verdes · Estadio Espanol de Las Condes</h2></div>
                      <div style="text-align:right;font-size:10px;color:#666">Emitido: <strong>${fechaHoy}</strong><br>Periodo: <strong>${mesActual}</strong></div>
                    </div>
                    <!-- KPIs -->
                    <div class="grid4">
                      <div class="box"><div class="lbl">Fondo base</div><div class="val">$${fondo.toLocaleString("es-CL")}</div></div>
                      <div class="box" style="border-color:${colorSaldo}"><div class="lbl">Disponible actual</div><div class="val" style="color:${saldoDisponible>=0?"#1a5c2a":"#c62828"}">$${saldoDisponible.toLocaleString("es-CL")}</div></div>
                      <div class="box" style="border-color:#e65100"><div class="lbl">Comprometido</div><div class="val" style="color:#e65100">$${gastadoPendiente.toLocaleString("es-CL")}</div></div>
                      <div class="box" style="border-color:#1565c0"><div class="lbl">Total reembolsado</div><div class="val" style="color:#1565c0">$${totalReembolsado.toLocaleString("es-CL")}</div></div>
                    </div>
                    ${Number(saldoAnterior)>0?"<div style='background:#fff8e1;border:1px solid #ffc107;border-radius:5px;padding:7px 12px;margin-bottom:14px;font-size:11px'>Saldo periodo anterior"+(periodoAnterior?" ("+periodoAnterior+")":"")+": <strong>$"+Number(saldoAnterior).toLocaleString("es-CL")+"</strong> — pendiente de reembolso.</div>":""}
                    <!-- Por cuenta -->
                    <div class="sec">Gasto por Cuenta</div>
                    <table><thead><tr><th>Cuenta</th><th>Tipo</th><th style="text-align:center">N° Doc.</th><th style="text-align:right">Total</th><th style="text-align:right">% del total</th></tr></thead>
                    <tbody>${filasCuenta}</tbody>
                    <tfoot><tr class="tot"><td colspan="3" style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right">TOTAL GENERAL</td><td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right">$${totalGeneral.toLocaleString("es-CL")}</td><td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right;color:#1a5c2a;font-weight:700">100%</td></tr></tfoot></table>
                    <!-- Por mes -->
                    <div class="sec">Gasto Mensual (ultimos 6 meses)</div>
                    <table style="width:60%"><thead><tr><th>Mes</th><th>Barras</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${filasGraf||"<tr><td colspan='3' style='text-align:center;color:#888;padding:10px'>Sin movimientos</td></tr>"}</tbody></table>
                    <!-- Pendientes -->
                    <div class="sec">Compras Pendientes de Pago</div>
                    <table><thead><tr><th>Fecha</th><th>Documento</th><th>Proveedor</th><th>Cuenta</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${filasPend}</tbody></table>
                    <!-- Rendiciones pendientes -->
                    <div class="sec">Rendiciones Pendientes de Reembolso</div>
                    <table style="width:60%"><thead><tr><th>Fecha</th><th>Descripcion</th><th style="text-align:right">Total</th></tr></thead>
                    <tbody>${filasRend}</tbody></table>
                    <div class="footer">Estadio Espanol de Las Condes · Departamento de Areas Verdes<br>
                    Jefe de Departamento de Areas Verdes · Carmen Luz Hermosilla Diez · ${fechaHoy}</div>
                    <div class="noprint" style="text-align:center;margin-top:18px">
                      <button onclick="window.print()" style="background:#1a5c2a;color:#fff;border:none;padding:10px 28px;border-radius:7px;font-size:13px;cursor:pointer">Imprimir / Guardar PDF</button>
                    </div></body></html>`;
                    const w=window.open("","_blank"); w.document.write(html); w.document.close();
                  }}>
                  🖨️ Imprimir resumen
                </button>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:10}}>💰 Gasto por cuenta</div>
              {[{grupo:"Internas (Beneficio general socios)",cuentas:CUENTAS_INTERNAS},{grupo:"Externas (Beneficio área específica)",cuentas:CUENTAS_EXTERNAS}].map(g=>{
                const itemsG = porCuenta.filter(c=>g.cuentas.includes(c.cuenta));
                if(!itemsG.length) return null;
                return (
                  <div key={g.grupo} style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.5px",marginBottom:6,textTransform:"uppercase"}}>{g.grupo}</div>
                    <div style={{...S.card,padding:0,overflow:"hidden"}}>
                      {itemsG.map((c,i)=>{
                        const pct=totalGeneral?Math.round((c.total/totalGeneral)*100):0;
                        return <div key={c.cuenta} style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:i%2===0?"transparent":"rgba(255,255,255,0.018)",cursor:"pointer"}} onClick={()=>{setFiltroCuenta(c.cuenta);setSubTab("lista");}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:13,fontWeight:600}}>{c.cuenta}</span>
                            <div style={{display:"flex",gap:10,alignItems:"center"}}>
                              <span style={{fontSize:11,color:"#6aaa7a"}}>{c.n} compra{c.n!==1?"s":""}</span>
                              <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#93c5fd"}}>${c.total.toLocaleString("es-CL")}</span>
                              <span style={{fontSize:10,color:"#4a7a6a"}}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.07)",borderRadius:3,height:4,overflow:"hidden"}}>
                            <div style={{width:`${pct}%`,height:"100%",background:"#3b82f6",borderRadius:3}}/>
                          </div>
                        </div>;
                      })}
                    </div>
                  </div>
                );
              })}
              <div style={{...S.card,padding:"12px 16px",display:"flex",justifyContent:"space-between",background:"rgba(59,130,246,0.08)",borderColor:"rgba(59,130,246,0.2)",marginBottom:20}}>
                <span style={{fontWeight:700,fontSize:13}}>TOTAL GENERAL</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#93c5fd"}}>${totalGeneral.toLocaleString("es-CL")}</span>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:10}}>📅 Gasto mensual</div>
              <div style={{...S.card,padding:18,marginBottom:20}}>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {porMes.map(m=>{
                    const pct=Math.round((m.total/maxMes)*100);
                    const esActual=m.key===`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
                    return (
                      <div key={m.key} style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:12,color:esActual?"#93c5fd":"#6aaa7a",fontWeight:esActual?700:400,width:60,flexShrink:0,textAlign:"right"}}>{m.label}</div>
                        <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:4,height:22,overflow:"hidden",position:"relative"}}>
                          <div style={{width:`${Math.max(pct,m.total>0?2:0)}%`,height:"100%",background:esActual?"rgba(59,130,246,0.6)":"rgba(59,130,246,0.25)",borderRadius:4,transition:"width 0.3s"}}/>
                        </div>
                        <div style={{fontSize:12,fontWeight:600,color:esActual?"#93c5fd":"#7aaa80",width:90,flexShrink:0,textAlign:"right"}}>
                          {m.total>0?"$"+m.total.toLocaleString("es-CL"):"—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LISTA COMPRAS ── */}
      {subTab==="lista"&&(
        <div className="ein">
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <button className="btn-p" style={S.btn} onClick={()=>{setForm(emptyForm);setEditId(null);setShowForm(true);}}>➕ Nueva compra</button>
            {seleccionadas.length>0&&<button style={{...S.btn,background:"rgba(167,139,250,0.2)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.35)",fontSize:12}} onClick={()=>setShowRendForm(true)}>📤 Rendir ({seleccionadas.length})</button>}
            <button style={{...S.btn,fontSize:11,background:mostrarFacturadas?"rgba(6,182,212,0.15)":"rgba(255,255,255,0.05)",color:mostrarFacturadas?"#22d3ee":"#5a8a6a",border:`1px solid ${mostrarFacturadas?"rgba(6,182,212,0.3)":"rgba(255,255,255,0.1)"}`}} onClick={()=>setMostrarFacturadas(p=>!p)}>
              {mostrarFacturadas?"Ocultar NP facturadas":"Mostrar NP facturadas"}
            </button>
            {/* Selector cuentas personalizado */}
            <div style={{position:"relative",flex:1,minWidth:160}}>
              <button style={{...S.input,width:"100%",textAlign:"left",cursor:"pointer",fontSize:12,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px"}}
                onClick={()=>setShowCuentaMenu(p=>!p)}>
                <span style={{color:filtroCuenta==="todas"?"#5a8a6a":"#ede9e0"}}>{filtroCuenta==="todas"?"Todas las cuentas":filtroCuenta}</span>
                <span style={{fontSize:10,color:"#5a8a6a"}}>{showCuentaMenu?"▲":"▼"}</span>
              </button>
              {showCuentaMenu&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,background:"#0f2517",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",marginTop:4}}>
                  <div style={{padding:"4px 0"}}>
                    <div style={{padding:"7px 14px",cursor:"pointer",fontSize:12,color:filtroCuenta==="todas"?"#86efac":"#ede9e0",background:filtroCuenta==="todas"?"rgba(34,197,94,0.08)":"transparent"}}
                      onClick={()=>{setFiltroCuenta("todas");setShowCuentaMenu(false);}}>
                      Todas las cuentas
                    </div>
                    <div style={{padding:"5px 14px 3px",fontSize:10,color:"#3d7a52",fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:2}}>
                      Internas — beneficio general socios
                    </div>
                    {CUENTAS_INTERNAS.map(c=>(
                      <div key={c} style={{padding:"7px 14px 7px 20px",cursor:"pointer",fontSize:12,color:filtroCuenta===c?"#86efac":"#ede9e0",background:filtroCuenta===c?"rgba(34,197,94,0.08)":"transparent"}}
                        onClick={()=>{setFiltroCuenta(c);setShowCuentaMenu(false);}}>
                        {c}
                      </div>
                    ))}
                    <div style={{padding:"5px 14px 3px",fontSize:10,color:"#3d6a7a",fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:2}}>
                      Externas — beneficio área específica
                    </div>
                    {CUENTAS_EXTERNAS.map(c=>(
                      <div key={c} style={{padding:"7px 14px 7px 20px",cursor:"pointer",fontSize:12,color:filtroCuenta===c?"#93c5fd":"#ede9e0",background:filtroCuenta===c?"rgba(59,130,246,0.08)":"transparent"}}
                        onClick={()=>{setFiltroCuenta(c);setShowCuentaMenu(false);}}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <select style={{...S.input,flex:1,minWidth:100,fontSize:12}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}>
              <option value="todos">Todos los meses</option>
              {mesesUnicos.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Form rendición */}
          {showRendForm&&(
            <div style={{...S.card,padding:16,marginBottom:14,background:"rgba(167,139,250,0.06)",borderColor:"rgba(167,139,250,0.25)"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,marginBottom:12,color:"#c4b5fd"}}>
                📤 Crear rendición — {seleccionadas.length} compra{seleccionadas.length!==1?"s":""} · ${compras.filter(c=>seleccionadas.includes(c.id)).reduce((a,c)=>a+Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0),0).toLocaleString("es-CL")}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Fecha presentación</label><input type="date" style={S.input} value={rendForm.fecha} onChange={e=>setRendForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Observaciones</label><input style={S.input} placeholder="ej: Rendición junio 2026" value={rendForm.obs} onChange={e=>setRendForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={crearRendicion}>✓ Crear rendición</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowRendForm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Formulario nueva compra */}
          {showForm&&(
            <div style={{...S.card,padding:20,marginBottom:16}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:16,color:"#a0d8b0"}}>{editId?"✏️ Editar":"➕ Nueva"} compra</div>

              {/* Panel notas de pedido AL INICIO — seleccionar primero si es Factura */}
              {form.tipoDoc==="Factura"&&!editId&&(()=>{
                const notasDisp = compras.filter(c=>
                  c.tipoDoc==="Nota de Pedido" &&
                  !["facturada","cancelada"].includes(c.estado)
                );
                if(!notasDisp.length) return null;
                return (
                  <div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
                    <div style={{fontSize:11,color:"#fcd34d",letterSpacing:"0.6px",marginBottom:8,textTransform:"uppercase"}}>
                      📋 ¿Esta factura corresponde a Notas de Pedido? — Selecciona las que incluye
                    </div>
                    <div style={{fontSize:11,color:"#a08050",marginBottom:10}}>Al seleccionar, se copian automáticamente proveedor, RUT e ítems</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {notasDisp.map(np=>{
                        const vinculada=(form.notasVinculadas||[]).includes(np.id);
                        return (
                          <div key={np.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:7,background:vinculada?"rgba(251,191,36,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${vinculada?"rgba(251,191,36,0.35)":"rgba(255,255,255,0.07)"}`,cursor:"pointer"}}
                            onClick={()=>{
                              const nuevasVinc = vinculada
                                ? (form.notasVinculadas||[]).filter(x=>x!==np.id)
                                : [...(form.notasVinculadas||[]),np.id];
                              const notasSel = compras.filter(c=>nuevasVinc.includes(c.id));
                              const primeraNote = notasSel[0];
                              const itemsHeredados = notasSel.flatMap(n=>
                                (n.items||[{descripcion:n.descripcion||"",categoria:"",cantidad:n.cantidad||1,unidad:n.unidad||"unidad",precioUnitario:n.precioUnitario||"",totalNeto:n.totalNeto||"",iva:n.iva||"",totalBruto:n.totalBruto||""}])
                                .map(it=>({...it,id:Date.now()+Math.random()}))
                              );
                              const totalNeto  = itemsHeredados.reduce((a,it)=>a+Number(it.totalNeto||0),0);
                              const ivaTotal   = itemsHeredados.reduce((a,it)=>a+Number(it.iva||0),0);
                              const totalBruto = itemsHeredados.reduce((a,it)=>a+Number(it.totalBruto||0),0);
                              setForm(p=>({...p,
                                notasVinculadas:nuevasVinc,
                                items: itemsHeredados.length>0?itemsHeredados:[{...emptyItem,id:1}],
                                totalNetoDoc:totalNeto||"",ivaDoc:ivaTotal||"",totalBrutoDoc:totalBruto||"",
                                ...(primeraNote&&nuevasVinc.length>0?{
                                  proveedor: primeraNote.proveedor||"",
                                  rut:       primeraNote.rut||"",
                                  cuenta:    primeraNote.cuenta||"",
                                  responsable: primeraNote.responsable||"",
                                }:{}),
                              }));
                            }}>
                            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${vinculada?"#fcd34d":"rgba(255,255,255,0.2)"}`,background:vinculada?"#fcd34d":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {vinculada&&<span style={{color:"#000",fontSize:11,fontWeight:700}}>✓</span>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600}}>NP {np.nDocumento} — {np.proveedor} <span style={{fontSize:10,color:"#8a7050"}}>RUT {np.rut}</span></div>
                              <div style={{fontSize:11,color:"#a08050"}}>{np.fecha} · {(np.items||[{descripcion:np.descripcion}]).map(i=>i.descripcion).filter(Boolean).join(", ")} · <strong>${Number(np.totalBrutoDoc||np.totalBruto||np.totalNeto||0).toLocaleString("es-CL")}</strong></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(form.notasVinculadas||[]).length>0&&(
                      <div style={{fontSize:11,color:"#fcd34d",marginTop:8,background:"rgba(251,191,36,0.06)",borderRadius:6,padding:"5px 10px"}}>
                        ✓ {(form.notasVinculadas||[]).length} nota{(form.notasVinculadas||[]).length!==1?"s":""} vinculada{(form.notasVinculadas||[]).length!==1?"s":""} — proveedor, RUT e ítems copiados automáticamente
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Tipo documento</label>
                  <select style={S.input} value={form.tipoDoc} onChange={e=>setForm(p=>({...p,tipoDoc:e.target.value}))}>
                    {["Factura","Boleta","Nota de Pedido","Cotización","Orden de Compra","Otro"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Proveedor</label><input style={S.input} placeholder="Nombre empresa / persona" value={form.proveedor} onChange={e=>setForm(p=>({...p,proveedor:e.target.value}))}/></div>
                <div><label style={labelSt}>RUT proveedor</label><input style={S.input} placeholder="12.345.678-9" value={form.rut} onChange={e=>setForm(p=>({...p,rut:e.target.value}))}/></div>
                <div><label style={labelSt}>N° Documento</label><input style={S.input} placeholder="ej: 7609" value={form.nDocumento} onChange={e=>setForm(p=>({...p,nDocumento:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable compra</label>
                  <select style={S.input} value={form.responsable} onChange={e=>setForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    <option value="Carmen Luz Hermosilla Diez">Carmen Luz Hermosilla Diez (Jefa)</option>
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={labelSt}>Cuenta a imputar</label>
                  <CuentaSelector value={form.cuenta} onChange={v=>setForm(p=>({...p,cuenta:v}))} S={S} CUENTAS_INTERNAS={CUENTAS_INTERNAS} CUENTAS_EXTERNAS={CUENTAS_EXTERNAS}/>
                </div>

              </div>{/* fin grid campos */}

              {/* ── ÍTEMS DE LA FACTURA ── */}
              <div style={{background:"rgba(61,122,82,0.06)",border:"1px solid rgba(61,122,82,0.2)",borderRadius:10,padding:"14px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.6px",textTransform:"uppercase"}}>📦 Ítems del documento</div>
                  <button style={{...S.btn,fontSize:11,padding:"3px 10px",background:"rgba(61,122,82,0.2)",color:"#86efac",border:"1px solid rgba(61,122,82,0.3)"}} onClick={addItem}>+ Agregar ítem</button>
                </div>
                {form.items.map((item,idx)=>(
                  <div key={item.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 12px",marginBottom:8,border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:11,color:"#6aaa7a"}}>Ítem {idx+1}</span>
                      {form.items.length>1&&<button className="btn-d" style={{...S.btn,fontSize:10,padding:"2px 8px"}} onClick={()=>removeItem(idx)}>✕</button>}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:8}}>
                      <div><label style={labelSt}>Descripción</label><input style={S.input} placeholder="Nombre del producto" value={item.descripcion} onChange={e=>updateItem(idx,{descripcion:e.target.value})}/></div>
                      <div><label style={labelSt}>Categoría</label>
                        <select style={S.input} value={item.categoria||""} onChange={e=>updateItem(idx,{categoria:e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                      <div><label style={labelSt}>Cantidad</label><input type="number" min={1} step={0.01} style={S.input} value={item.cantidad} onChange={e=>updateItem(idx,{cantidad:e.target.value})}/></div>
                      <div><label style={labelSt}>Unidad</label>
                        <select style={S.input} value={item.unidad} onChange={e=>updateItem(idx,{unidad:e.target.value})}>
                          {["unidad","kg","L","ml","g","m²","m","hora","servicio","saco","caja"].map(u=><option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div><label style={labelSt}>P. unitario neto</label><input type="number" min={0} style={S.input} value={item.precioUnitario} onChange={e=>updateItem(idx,{precioUnitario:e.target.value})}/></div>
                      <div><label style={labelSt}>Total bruto</label><input type="number" style={{...S.input,background:"rgba(59,130,246,0.08)",fontWeight:600}} value={item.totalBruto} readOnly/></div>
                    </div>
                    <div style={{marginTop:8}}>
                      <label style={labelSt}>📦 Ingresar a bodega</label>
                      <select style={{...S.input,fontSize:12}} value={item.bodegaDestino||""} onChange={e=>updateItem(idx,{bodegaDestino:e.target.value})}>
                        <option value="">— No ingresar a stock —</option>
                        {BODEGAS_DEF.map(b=><option key={b.id} value={b.id}>{b.icono} {b.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {/* Totales documento */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10,background:"rgba(59,130,246,0.06)",borderRadius:8,padding:"10px 12px",border:"1px solid rgba(59,130,246,0.15)"}}>
                  <div><label style={labelSt}>Total neto</label><input type="number" style={{...S.input,background:"rgba(59,130,246,0.08)"}} value={form.totalNetoDoc} readOnly/></div>
                  <div><label style={labelSt}>IVA 19%</label><input type="number" style={{...S.input,background:"rgba(59,130,246,0.08)"}} value={form.ivaDoc} readOnly/></div>
                  <div><label style={labelSt}>Total bruto</label><input type="number" style={{...S.input,background:"rgba(59,130,246,0.12)",fontWeight:700,color:"#93c5fd"}} value={form.totalBrutoDoc} readOnly/></div>
                </div>
              </div>

              {/* Pago */}
              <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:11,color:"#86efac",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>💳 Pago</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label style={labelSt}>Forma de pago</label>
                    <select style={S.input} value={form.formaPago} onChange={e=>setForm(p=>({...p,formaPago:e.target.value}))}>
                      <option value="transferencia">Transferencia bancaria</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="debito">Tarjeta de débito</option>
                      <option value="nota_credito">Nota de crédito</option>
                    </select>
                  </div>
                  <div><label style={labelSt}>Fecha pago</label><input type="date" style={S.input} value={form.fechaPago} onChange={e=>setForm(p=>({...p,fechaPago:e.target.value}))}/></div>
                  {["transferencia"].includes(form.formaPago)&&<>
                    <div><label style={labelSt}>Banco origen</label><input style={S.input} placeholder="ej: BancoEstado" value={form.bancoPago} onChange={e=>setForm(p=>({...p,bancoPago:e.target.value}))}/></div>
                    <div><label style={labelSt}>N° Transferencia</label><input style={S.input} placeholder="ej: 000123456" value={form.nTransferencia} onChange={e=>setForm(p=>({...p,nTransferencia:e.target.value}))}/></div>
                  </>}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div><label style={labelSt}>Estado</label>
                  <select style={S.input} value={form.estado} onChange={e=>setForm(p=>({...p,estado:e.target.value}))}>
                    <option value="pendiente">⏳ Pendiente pago</option>
                    <option value="pagada">💳 Pagada (transferencia)</option>
                    <option value="pagada_efectivo">💵 Pagada (efectivo/débito)</option>
                    <option value="nota_credito">📝 Nota de crédito</option>
                    <option value="rendida">✅ Rendida</option>
                    <option value="rechazada">❌ Rechazada</option>
                  </select>
                </div>
                <div><label style={labelSt}>Observaciones</label><input style={S.input} value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              {alertaDuplicado&&(
                <div style={{gridColumn:"1/-1",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:13,color:"#fca5a5",marginBottom:10}}>{alertaDuplicado}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btn,background:"rgba(239,68,68,0.2)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.35)",fontSize:12}} onClick={guardarIgual}>Sí, guardar igual</button>
                    <button className="btn-g" style={S.btn} onClick={()=>setAlertaDuplicado(null)}>Cancelar</button>
                  </div>
                </div>
              )}
              <div style={{gridColumn:"1/-1",display:"flex",gap:10}}>
                <button className="btn-p" style={S.btn} onClick={guardar}>✓ {editId?"Actualizar":"Guardar"}</button>
                <button className="btn-g" style={S.btn} onClick={()=>{setShowForm(false);setEditId(null);setForm(emptyForm);setAlertaDuplicado(null);}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista */}
          {comprasFilt.length===0&&!showForm?(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}><div style={{fontSize:32,marginBottom:8}}>🛒</div><div>Sin compras registradas</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {comprasFilt.map(c=>{
                const est=ESTADO_C[c.estado]||ESTADO_C.pendiente;
                const sel=seleccionadas.includes(c.id);
                const selectable=["pendiente","pagada","pagada_efectivo"].includes(c.estado);
                const totalDoc = Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0);
                const items = c.items||[{descripcion:c.descripcion,cantidad:c.cantidad,unidad:c.unidad}];
                return (
                  <div key={c.id} style={{...S.card,padding:14,borderLeft:`3px solid ${sel?"#a78bfa":est.color}40`,background:sel?"rgba(167,139,250,0.06)":"transparent"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",gap:10,alignItems:"start",flex:1,minWidth:0}}>
                        {selectable&&<div style={{width:18,height:18,borderRadius:4,border:`2px solid ${sel?"#a78bfa":"rgba(255,255,255,0.2)"}`,background:sel?"#a78bfa":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",marginTop:2}} onClick={()=>setSeleccionadas(p=>sel?p.filter(x=>x!==c.id):[...p,c.id])}>{sel&&<span style={{color:"#fff",fontSize:11}}>✓</span>}</div>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                            <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>{c.proveedor||"Sin proveedor"}</span>
                            <span style={{...S.chip,background:est.bg,color:est.color,border:`1px solid ${est.color}40`,fontSize:10}}>{est.label}</span>
                            {c.cuenta&&<span style={{...S.chip,background:"rgba(59,130,246,0.1)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.2)",fontSize:10}}>🏷️ {c.cuenta}</span>}
                          </div>
                          <div style={{fontSize:11,color:"#7aaa80",marginBottom:4}}>
                            📅 {c.fecha} · 📄 {c.tipoDoc} {c.nDocumento} {c.responsable&&`· 👤 ${c.responsable}`}
                            {c.fechaPago&&<span style={{color:"#86efac"}}> · 💳 Pagado {c.fechaPago}</span>}
                          </div>
                          {/* Ítems */}
                          <div style={{fontSize:12,color:"#5a8a6a",cursor:"pointer"}} onClick={()=>setExpandDetalle(expandDetalle===c.id?null:c.id)}>
                            {items.length===1?items[0].descripcion:`${items.length} productos — clic para ver detalle`} {items.length>1&&(expandDetalle===c.id?"▲":"▼")}
                          </div>
                          {expandDetalle===c.id&&items.length>1&&(
                            <div style={{marginTop:6,background:"rgba(255,255,255,0.04)",borderRadius:6,padding:"6px 10px"}}>
                              {items.map((it,i)=>(
                                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#7aaa80",padding:"3px 0",borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                                  <span>{it.descripcion} — {it.cantidad} {it.unidad}</span>
                                  <span style={{fontWeight:600,color:"#93c5fd"}}>${Number(it.totalBruto||0).toLocaleString("es-CL")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#93c5fd"}}>${totalDoc.toLocaleString("es-CL")}</span>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {c.estado==="pendiente"&&<>
                            <button style={{...S.btn,fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}} onClick={()=>marcarPagada(c.id,"transferencia")}>💳 Trans.</button>
                            <button style={{...S.btn,fontSize:10,padding:"3px 8px",background:"rgba(139,92,246,0.15)",color:"#c4b5fd",border:"1px solid rgba(139,92,246,0.3)"}} onClick={()=>marcarPagada(c.id,"efectivo")}>💵 Efect.</button>
                          </>}
                          {esJefa&&<button style={{...S.btn,fontSize:10,padding:"3px 8px",background:"rgba(61,122,82,0.15)",color:"#86efac",border:"1px solid rgba(61,122,82,0.3)"}}
                            onClick={()=>setSelectBodegaId(selectBodegaId===c.id?null:c.id)}>📦 Bodega</button>}
                          {esJefa&&<button className="btn-g" style={{...S.btn,fontSize:10,padding:"3px 8px"}} onClick={()=>editar(c)}>✏️</button>}
                          {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:10,padding:"3px 8px"}} onClick={()=>eliminar(c.id)}>🗑</button>}
                        </div>
                      </div>
                    </div>
                  {/* Selector bodega inline */}
                  {selectBodegaId===c.id&&(()=>{
                    const items = c.items||[{id:"i0",descripcion:c.descripcion||"",categoria:"",cantidad:c.cantidad||1,unidad:c.unidad||"unidad"}];
                    const [bodSel, setBodSel] = [c._bodSel||{}, (v)=>{}]; // placeholder — usamos estado local
                    return (
                      <BodegaSelector
                        key={c.id} items={items} compra={c}
                        onConfirm={(asignaciones)=>{
                          const itemsConBodega = items.map((it,i)=>({...it,bodegaDestino:asignaciones[i]||""}));
                          ingresarItemsABodega(c.fecha,`${c.tipoDoc} ${c.nDocumento||""} ${c.proveedor||""}`,itemsConBodega,c.id);
                          setSelectBodegaId(null);
                        }}
                        onCancel={()=>setSelectBodegaId(null)}
                        S={S}
                      />
                    );
                  })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RENDICIONES ── */}
      {subTab==="rendiciones"&&(
        <div className="ein">
          {rendiciones.length===0?(
            <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:10}}>📤</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin rendiciones</div>
              <div style={{fontSize:13,marginTop:6}}>Selecciona compras en 📋 Compras y crea una rendición</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {rendiciones.map(r=>{
                const itemsRend=compras.filter(c=>r.items?.includes(c.id));
                return (
                  <div key={r.id} style={{...S.card,padding:16,borderLeft:`3px solid ${r.reembolso?"#22c55e":"#a78bfa"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>
                            Rendición {new Date(r.fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"})}
                          </span>
                          <span style={{...S.chip,background:r.reembolso?"rgba(34,197,94,0.12)":"rgba(167,139,250,0.12)",color:r.reembolso?"#86efac":"#c4b5fd",border:`1px solid ${r.reembolso?"rgba(34,197,94,0.25)":"rgba(167,139,250,0.25)"}`,fontSize:10}}>
                            {r.reembolso?"✅ Reembolsada":"📤 Presentada — pendiente reembolso"}
                          </span>
                        </div>
                        <div style={{fontSize:12,color:"#7aaa80"}}>{r.items?.length} compra{r.items?.length!==1?"s":""}{r.obs&&` · ${r.obs}`}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#93c5fd"}}>${r.total.toLocaleString("es-CL")}</span>
                        <button style={{...S.btn,fontSize:11,padding:"5px 12px",background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}} onClick={()=>imprimirRendicion(r)}>🖨️ Imprimir</button>
                        {!r.reembolso&&esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"5px 10px"}} onClick={()=>deshacerRendicion(r.id)}>↩️ Deshacer</button>}
                      </div>
                    </div>
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:10,marginBottom:10}}>
                      {itemsRend.map(c=>{
                        const items=c.items||[{descripcion:c.descripcion}];
                        return <div key={c.id} style={{fontSize:12,color:"#7aaa80",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                          <div style={{display:"flex",justifyContent:"space-between"}}>
                            <span>{c.proveedor} · {c.tipoDoc} {c.nDocumento} ({items.length} ítem{items.length!==1?"s":""})</span>
                            <span style={{fontWeight:600,color:"#93c5fd"}}>${Number(c.totalBrutoDoc||c.totalBruto||c.totalNeto||0).toLocaleString("es-CL")}</span>
                          </div>
                        </div>;
                      })}
                    </div>
                    {r.reembolso&&(
                      <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"10px 14px"}}>
                        <div style={{fontSize:12,color:"#86efac",fontWeight:600,marginBottom:4}}>💳 Reembolso del Estadio</div>
                        <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#5aaa7a"}}>
                          <span>📅 {r.fechaReembolso}</span>
                          <span style={{color:"#4ade80",fontWeight:700}}>${Number(r.montoReembolso).toLocaleString("es-CL")}</span>
                          {r.bancoReembolso&&<span>🏦 {r.bancoReembolso}</span>}
                          {r.nTransReembolso&&<span>🔢 Trans: {r.nTransReembolso}</span>}
                        </div>
                      </div>
                    )}
                    {!r.reembolso&&esJefa&&(
                      showReembolsoForm===r.id?(
                        <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"12px 14px",marginTop:10}}>
                          <div style={{fontSize:12,color:"#86efac",fontWeight:600,marginBottom:10}}>💳 Registrar reembolso del Estadio</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                            <div><label style={labelSt}>Fecha transferencia</label><input type="date" style={S.input} value={reembolsoForm.fecha} onChange={e=>setReembolsoForm(p=>({...p,fecha:e.target.value}))}/></div>
                            <div><label style={labelSt}>Monto ($)</label><input type="number" style={S.input} placeholder={r.total} value={reembolsoForm.monto} onChange={e=>setReembolsoForm(p=>({...p,monto:e.target.value}))}/></div>
                            <div><label style={labelSt}>Banco (Estadio)</label><input style={S.input} value={reembolsoForm.banco} onChange={e=>setReembolsoForm(p=>({...p,banco:e.target.value}))}/></div>
                            <div><label style={labelSt}>N° Transferencia</label><input style={S.input} value={reembolsoForm.nTransferencia} onChange={e=>setReembolsoForm(p=>({...p,nTransferencia:e.target.value}))}/></div>
                          </div>
                          <div style={{display:"flex",gap:8}}>
                            <button className="btn-p" style={{...S.btn,background:"#166534",color:"#86efac"}} onClick={()=>registrarReembolso(r.id)}>✓ Confirmar</button>
                            <button className="btn-g" style={S.btn} onClick={()=>setShowReembolsoForm(false)}>Cancelar</button>
                          </div>
                        </div>
                      ):(
                        <button style={{...S.btn,marginTop:10,background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",fontSize:12,width:"100%"}}
                          onClick={()=>{setShowReembolsoForm(r.id);setReembolsoForm({fecha:hoy.toISOString().slice(0,10),monto:String(r.total),banco:"",nTransferencia:"",obs:""});}}>
                          💳 Registrar reembolso del Estadio → fondo
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PANEL BODEGAS ───────────────────────────────────────────────────────────
function PanelBodegas({ S, bodegasData, setBodegasData, personal, esJefa, tareasProg, setTareasProg, compras=[] }) {
  const hoy = new Date().toISOString().slice(0,10);
  const [bodegaActiva, setBodegaActiva] = React.useState("b01");
  const [subTab, setSubTab] = React.useState("stock");
  const [showItemForm, setShowItemForm] = React.useState(false);
  const [showMovForm, setShowMovForm] = React.useState(false);
  const [showTareaForm, setShowTareaForm] = React.useState(false);
  const [showTraslForm, setShowTraslForm] = React.useState(false);
  const [showInventForm, setShowInventForm] = React.useState(false);
  const [editItemId, setEditItemId] = React.useState(null);
  const [inventFecha, setInventFecha] = React.useState(hoy);
  const [inventItems, setInventItems] = React.useState([{id:1,nombre:"",categoria:"",unidad:"unidad",stockActual:0,stockMinimo:0,ubicacion:""}]);

  const bodega = BODEGAS_DEF.find(b=>b.id===bodegaActiva);
  const bd = bodegasData[bodegaActiva]||{items:[],movimientos:[],tareas:[],traslados:[]};
  const setbd = (patch) => setBodegasData(p=>({...p,[bodegaActiva]:{...bd,...patch}}));

  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};
  const listaPersonal = [...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  const emptyItem = {nombre:"",categoria:"",descripcion:"",unidad:"unidad",stockActual:0,stockMinimo:0,ubicacion:"",obs:""};
  const [itemForm, setItemForm] = React.useState(emptyItem);
  const emptyMov = {fecha:hoy,tipo:"entrada",cantidad:1,unidad:"unidad",motivo:"",responsable:"",proveedor:"",nDoc:"",obs:"",itemId:"",litros:"",horasActuales:""};
  const [movForm, setMovForm] = React.useState(emptyMov);
  const emptyTarea = {fecha:hoy,tipo:"",descripcion:"",responsable:"",estado:"pendiente",obs:""};
  const [tareaForm, setTareaForm] = React.useState(emptyTarea);
  const emptyTrasl = {fecha:hoy,itemId:"",cantidad:1,destino:"",motivo:"",conRegreso:true,fechaRegreso:"",responsable:"",obs:"",estado:"en_camino"};
  const [traslForm, setTraslForm] = React.useState(emptyTrasl);
  const emptyMaq = {marca:"",modelo:"",patente:"",horasUso:0,nivelAceite:"OK",nivelCombustible:"OK",proxMantención:""};
  const [maqForm, setMaqForm] = React.useState(emptyMaq);

  const guardarInventario = () => {
    const validos = inventItems.filter(i=>i.nombre.trim());
    if(!validos.length) return;
    const nuevosItems = validos.map(i=>({...i,id:Date.now()+Math.random()}));
    const movimientos = nuevosItems.map(i=>({id:Date.now()+Math.random(),fecha:inventFecha,tipo:"entrada",cantidad:Number(i.stockActual)||0,unidad:i.unidad,motivo:`Inventario inicial — ${inventFecha}`,responsable:"",itemId:String(i.id)}));
    setbd({items:[...(bd.items||[]),...nuevosItems],movimientos:[...movimientos,...(bd.movimientos||[])].slice(0,200)});
    setInventItems([{id:1,nombre:"",categoria:"",unidad:"unidad",stockActual:0,stockMinimo:0,ubicacion:""}]);
    setShowInventForm(false);
  };

  const guardarItem = () => {
    if(!itemForm.nombre.trim()) return;
    const items = editItemId
      ? (bd.items||[]).map(i=>i.id===editItemId?{...itemForm,id:editItemId,...(bodegaActiva==="b04"?maqForm:{})}:i)
      : [{...itemForm,id:Date.now(),...(bodegaActiva==="b04"?maqForm:{})}, ...(bd.items||[])];
    setbd({items});
    setItemForm(emptyItem); setMaqForm(emptyMaq); setShowItemForm(false); setEditItemId(null);
  };

  const eliminarItem = (id) => setbd({items:(bd.items||[]).filter(i=>i.id!==id)});

  const guardarMov = () => {
    if(!movForm.itemId||!movForm.cantidad) return;
    const cant = Number(movForm.cantidad);
    const mov = {...movForm,id:Date.now(),cantidad:cant};
    const items = (bd.items||[]).map(i=>{
      if(i.id!==movForm.itemId&&String(i.id)!==String(movForm.itemId)) return i;
      const delta = movForm.tipo==="entrada"||movForm.tipo==="ajuste"?cant:-cant;
      return {...i,stockActual:Math.max(0,(Number(i.stockActual)||0)+delta)};
    });
    setbd({items,movimientos:[mov,...(bd.movimientos||[])].slice(0,200)});
    setMovForm(emptyMov); setShowMovForm(false);
  };

  const guardarTarea = () => {
    if(!tareaForm.tipo) return;
    const tarea = {...tareaForm,id:Date.now()};
    setbd({tareas:[tarea,...(bd.tareas||[])].slice(0,100)});
    if(tareaForm.responsable&&tareaForm.fecha) {
      setTareasProg(p=>({...p,[tareaForm.fecha]:[...(p[tareaForm.fecha]||[]),{id:Date.now()+1,fecha:tareaForm.fecha,zona:bodega.nombre,elemento:"",tarea:`${bodega.icono} ${tareaForm.tipo}: ${tareaForm.descripcion||bodega.nombre}`,responsable:tareaForm.responsable,estado:"por_designar",notas:tareaForm.obs||"",auto:false}]}));
    }
    setTareaForm(emptyTarea); setShowTareaForm(false);
  };

  const guardarTrasl = () => {
    if(!traslForm.itemId||!traslForm.destino) return;
    const cant = Number(traslForm.cantidad);
    const trasl = {...traslForm,id:Date.now(),cantidad:cant,bodegaOrigen:bodegaActiva};
    const items = (bd.items||[]).map(i=>String(i.id)===String(traslForm.itemId)?{...i,stockActual:Math.max(0,(Number(i.stockActual)||0)-cant)}:i);
    setbd({items,traslados:[trasl,...(bd.traslados||[])].slice(0,100)});
    setTraslForm(emptyTrasl); setShowTraslForm(false);
  };

  const marcarRegreso = (id) => {
    const t = (bd.traslados||[]).find(x=>x.id===id);
    if(!t) return;
    const items = (bd.items||[]).map(i=>String(i.id)===String(t.itemId)?{...i,stockActual:(Number(i.stockActual)||0)+Number(t.cantidad)}:i);
    setbd({items,traslados:(bd.traslados||[]).map(x=>x.id===id?{...x,estado:"regresó",fechaRegresoReal:hoy}:x)});
  };

  const itemsStockBajo = (bd.items||[]).filter(i=>Number(i.stockActual||0)<=Number(i.stockMinimo||0)&&Number(i.stockMinimo||0)>0);
  const traslPendientes = (bd.traslados||[]).filter(t=>t.conRegreso&&t.estado==="en_camino");

  return (
    <div className="ein">
      <div style={{marginBottom:16}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:4}}>🏪 Bodegas</h1>
        <p style={{color:"#6aaa7a",fontSize:14}}>Gestión de inventario · Estadio Español</p>
      </div>

      {/* Selector bodega */}
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {BODEGAS_DEF.map(b=>{
          const bd2=bodegasData[b.id]||{};
          const bajo=(bd2.items||[]).some(i=>Number(i.stockActual||0)<=Number(i.stockMinimo||0)&&Number(i.stockMinimo||0)>0);
          const traslP=(bd2.traslados||[]).some(t=>t.conRegreso&&t.estado==="en_camino");
          return (
            <button key={b.id} onClick={()=>{setBodegaActiva(b.id);setSubTab("stock");}}
              style={{position:"relative",background:bodegaActiva===b.id?`${b.color}22`:"rgba(255,255,255,0.05)",border:`1px solid ${bodegaActiva===b.id?b.color+"60":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"8px 14px",color:bodegaActiva===b.id?b.color:"#7aaa80",fontFamily:"'Georgia',serif",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:16}}>{b.icono}</span><span>{b.nombre}</span>
              {(bajo||traslP)&&<span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>}
            </button>
          );
        })}
      </div>

      {/* Info bodega */}
      <div style={{...S.card,padding:"12px 16px",marginBottom:16,borderLeft:`3px solid ${bodega.color}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{bodega.icono} {bodega.nombre}</div>
          <div style={{fontSize:12,color:"#6aaa7a",marginTop:2}}>{bodega.descripcion}</div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"6px 12px"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:bodega.color}}>{(bd.items||[]).length}</div>
            <div style={{fontSize:10,color:"#5a8a6a"}}>ítems</div>
          </div>
          {itemsStockBajo.length>0&&<div style={{textAlign:"center",background:"rgba(239,68,68,0.1)",borderRadius:8,padding:"6px 12px",border:"1px solid rgba(239,68,68,0.25)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#ef4444"}}>{itemsStockBajo.length}</div>
            <div style={{fontSize:10,color:"#ef4444"}}>stock bajo</div>
          </div>}
          {traslPendientes.length>0&&<div style={{textAlign:"center",background:"rgba(245,158,11,0.1)",borderRadius:8,padding:"6px 12px",border:"1px solid rgba(245,158,11,0.25)"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#f59e0b"}}>{traslPendientes.length}</div>
            <div style={{fontSize:10,color:"#f59e0b"}}>en traslado</div>
          </div>}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["stock","📦 Stock"],["movimientos","🔄 Movimientos"],["traslados","🚛 Traslados"],["tareas","✅ Tareas"],["historial","📜 Historial"]].map(([t,l])=>(
          <button key={t} className={`tab${subTab===t?" on":""}`} onClick={()=>setSubTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── STOCK ── */}
      {subTab==="stock"&&(
        <div className="ein">
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            {esJefa&&<button className="btn-p" style={S.btn} onClick={()=>{setItemForm(emptyItem);setMaqForm(emptyMaq);setEditItemId(null);setShowItemForm(true);setShowInventForm(false);}}>
              ➕ {bodegaActiva==="b04"?"Nueva máquina":"Nuevo ítem"}
            </button>}
            {esJefa&&<button style={{...S.btn,background:"rgba(167,139,250,0.15)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.3)"}} onClick={()=>{setShowInventForm(p=>!p);setShowItemForm(false);setShowMovForm(false);}}>📋 Inventario inicial</button>}
            {esJefa&&<button style={{...S.btn,background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)"}} onClick={()=>{setShowMovForm(true);setShowInventForm(false);}}>📥 Movimiento</button>}
            {esJefa&&<button style={{...S.btn,background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)"}} onClick={()=>{setShowTraslForm(true);setShowInventForm(false);}}>🚛 Traslado</button>}
          </div>

          {/* Inventario inicial */}
          {showInventForm&&(
            <div style={{...S.card,padding:20,marginBottom:14,background:"rgba(167,139,250,0.05)",borderColor:"rgba(167,139,250,0.25)"}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#c4b5fd",marginBottom:6}}>📋 Inventario Inicial — {bodega.nombre}</div>
              <div style={{fontSize:12,color:"#7a6a9a",marginBottom:14}}>Carga el stock real actual con la fecha del inventario.</div>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
                <div><label style={labelSt}>Fecha inventario</label><input type="date" style={{...S.input,width:160}} value={inventFecha} onChange={e=>setInventFecha(e.target.value)}/></div>
                <button style={{...S.btn,marginTop:16,background:"rgba(167,139,250,0.15)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.3)",fontSize:12}}
                  onClick={()=>setInventItems(p=>[...p,{id:Date.now(),nombre:"",categoria:"",unidad:"unidad",stockActual:0,stockMinimo:0,ubicacion:""}])}>+ Agregar fila</button>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"rgba(167,139,250,0.1)"}}>
                    <th style={{padding:"6px 8px",textAlign:"left",color:"#c4b5fd",fontSize:10}}>NOMBRE</th>
                    <th style={{padding:"6px 8px",textAlign:"left",color:"#c4b5fd",fontSize:10}}>CATEGORÍA</th>
                    <th style={{padding:"6px 8px",textAlign:"left",color:"#c4b5fd",fontSize:10}}>UNIDAD</th>
                    <th style={{padding:"6px 8px",textAlign:"center",color:"#c4b5fd",fontSize:10}}>STOCK</th>
                    <th style={{padding:"6px 8px",textAlign:"center",color:"#c4b5fd",fontSize:10}}>MÍN.</th>
                    <th style={{padding:"6px 8px",textAlign:"left",color:"#c4b5fd",fontSize:10}}>UBICACIÓN</th>
                    <th style={{width:30}}></th>
                  </tr></thead>
                  <tbody>
                    {inventItems.map((item,idx)=>(
                      <tr key={item.id} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                        <td style={{padding:"4px 6px"}}><input style={{...S.input,fontSize:12,padding:"5px 8px"}} placeholder="Nombre" value={item.nombre} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,nombre:e.target.value}:x))}/></td>
                        <td style={{padding:"4px 6px"}}><select style={{...S.input,fontSize:12,padding:"5px 8px"}} value={item.categoria} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,categoria:e.target.value}:x))}>
                          <option value="">—</option>{bodega.categorias.map(c=><option key={c}>{c}</option>)}</select></td>
                        <td style={{padding:"4px 6px"}}><select style={{...S.input,fontSize:12,padding:"5px 8px"}} value={item.unidad} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,unidad:e.target.value}:x))}>
                          {["unidad","kg","L","m","m²","saco","caja","bolsa","par","set"].map(u=><option key={u}>{u}</option>)}</select></td>
                        <td style={{padding:"4px 6px"}}><input type="number" min={0} style={{...S.input,fontSize:12,padding:"5px 8px",textAlign:"center"}} value={item.stockActual} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,stockActual:Number(e.target.value)}:x))}/></td>
                        <td style={{padding:"4px 6px"}}><input type="number" min={0} style={{...S.input,fontSize:12,padding:"5px 8px",textAlign:"center"}} value={item.stockMinimo} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,stockMinimo:Number(e.target.value)}:x))}/></td>
                        <td style={{padding:"4px 6px"}}><input style={{...S.input,fontSize:12,padding:"5px 8px"}} placeholder="ej: Estante A" value={item.ubicacion} onChange={e=>setInventItems(p=>p.map((x,i)=>i===idx?{...x,ubicacion:e.target.value}:x))}/></td>
                        <td style={{padding:"4px 6px"}}>{inventItems.length>1&&<button className="btn-d" style={{...S.btn,fontSize:10,padding:"3px 6px"}} onClick={()=>setInventItems(p=>p.filter((_,i)=>i!==idx))}>✕</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button className="btn-p" style={S.btn} onClick={guardarInventario}>✓ Guardar inventario ({inventItems.filter(i=>i.nombre.trim()).length} ítems)</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowInventForm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Nuevo ítem */}
          {showItemForm&&(
            <div style={{...S.card,padding:20,marginBottom:14}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14,color:bodega.color}}>{editItemId?"✏️ Editar":"➕ Nuevo"} {bodegaActiva==="b04"?"equipo":"ítem"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Nombre</label><input style={S.input} value={itemForm.nombre} onChange={e=>setItemForm(p=>({...p,nombre:e.target.value}))} placeholder="Nombre del ítem"/></div>
                <div><label style={labelSt}>Categoría</label>
                  <select style={S.input} value={itemForm.categoria} onChange={e=>setItemForm(p=>({...p,categoria:e.target.value}))}>
                    <option value="">Seleccionar...</option>{bodega.categorias.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Unidad</label>
                  <select style={S.input} value={itemForm.unidad} onChange={e=>setItemForm(p=>({...p,unidad:e.target.value}))}>
                    {["unidad","kg","L","m","m²","saco","caja","bolsa","par","set"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Stock actual</label><input type="number" min={0} style={S.input} value={itemForm.stockActual} onChange={e=>setItemForm(p=>({...p,stockActual:Number(e.target.value)}))}/></div>
                <div><label style={labelSt}>Stock mínimo</label><input type="number" min={0} style={S.input} value={itemForm.stockMinimo} onChange={e=>setItemForm(p=>({...p,stockMinimo:Number(e.target.value)}))}/></div>
                <div><label style={labelSt}>Ubicación</label><input style={S.input} value={itemForm.ubicacion} onChange={e=>setItemForm(p=>({...p,ubicacion:e.target.value}))} placeholder="ej: Estante A"/></div>
                <div><label style={labelSt}>Observaciones</label><input style={S.input} value={itemForm.obs} onChange={e=>setItemForm(p=>({...p,obs:e.target.value}))}/></div>
                {bodegaActiva==="b04"&&(
                  <div style={{gridColumn:"1/-1",background:"rgba(249,115,22,0.06)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:"#fb923c",marginBottom:8,textTransform:"uppercase"}}>🚜 Datos del equipo</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div><label style={labelSt}>Marca</label><input style={S.input} value={maqForm.marca} onChange={e=>setMaqForm(p=>({...p,marca:e.target.value}))}/></div>
                      <div><label style={labelSt}>Modelo</label><input style={S.input} value={maqForm.modelo} onChange={e=>setMaqForm(p=>({...p,modelo:e.target.value}))}/></div>
                      <div><label style={labelSt}>Patente / N° Serie</label><input style={S.input} value={maqForm.patente} onChange={e=>setMaqForm(p=>({...p,patente:e.target.value}))}/></div>
                      <div><label style={labelSt}>Horas de uso</label><input type="number" min={0} style={S.input} value={maqForm.horasUso} onChange={e=>setMaqForm(p=>({...p,horasUso:Number(e.target.value)}))}/></div>
                      <div><label style={labelSt}>Nivel aceite</label>
                        <select style={S.input} value={maqForm.nivelAceite} onChange={e=>setMaqForm(p=>({...p,nivelAceite:e.target.value}))}>
                          {["OK","Bajo","Crítico","Recién cambiado"].map(v=><option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div><label style={labelSt}>Nivel combustible</label>
                        <select style={S.input} value={maqForm.nivelCombustible} onChange={e=>setMaqForm(p=>({...p,nivelCombustible:e.target.value}))}>
                          {["Lleno","3/4","1/2","1/4","Vacío"].map(v=><option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div><label style={labelSt}>Próx. mantención (horas)</label><input type="number" min={0} style={S.input} value={maqForm.proxMantención} onChange={e=>setMaqForm(p=>({...p,proxMantención:e.target.value}))}/></div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={guardarItem}>✓ Guardar</button>
                <button className="btn-g" style={S.btn} onClick={()=>{setShowItemForm(false);setEditItemId(null);}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Movimiento */}
          {showMovForm&&(
            <div style={{...S.card,padding:16,marginBottom:14,background:"rgba(34,197,94,0.05)",borderColor:"rgba(34,197,94,0.2)"}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#86efac",marginBottom:12}}>📥 Registrar movimiento</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={movForm.fecha} onChange={e=>setMovForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Tipo</label>
                  <select style={S.input} value={movForm.tipo} onChange={e=>setMovForm(p=>({...p,tipo:e.target.value}))}>
                    {Object.entries(ESTADOS_MOV).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Ítem</label>
                  <select style={S.input} value={movForm.itemId} onChange={e=>{const it=(bd.items||[]).find(i=>String(i.id)===e.target.value);setMovForm(p=>({...p,itemId:e.target.value,unidad:it?.unidad||"unidad"}));}}>
                    <option value="">Seleccionar ítem...</option>
                    {(bd.items||[]).map(i=><option key={i.id} value={i.id}>{i.nombre} (stock: {i.stockActual} {i.unidad})</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Cantidad</label><input type="number" min={0.01} step={0.01} style={S.input} value={movForm.cantidad} onChange={e=>setMovForm(p=>({...p,cantidad:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable</label>
                  <select style={S.input} value={movForm.responsable} onChange={e=>setMovForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Motivo</label><input style={S.input} value={movForm.motivo} onChange={e=>setMovForm(p=>({...p,motivo:e.target.value}))} placeholder="ej: Uso mantenimiento, Compra factura..."/></div>
                {movForm.tipo==="entrada"&&<>
                  <div><label style={labelSt}>Proveedor</label><input style={S.input} value={movForm.proveedor} onChange={e=>setMovForm(p=>({...p,proveedor:e.target.value}))}/></div>
                  <div><label style={labelSt}>N° Documento</label><input style={S.input} value={movForm.nDoc} onChange={e=>setMovForm(p=>({...p,nDoc:e.target.value}))}/></div>
                </>}
                {bodegaActiva==="b04"&&movForm.tipo==="salida"&&(
                  <div style={{gridColumn:"1/-1",background:"rgba(249,115,22,0.06)",borderRadius:8,padding:"10px 12px",border:"1px solid rgba(249,115,22,0.2)"}}>
                    <div style={{fontSize:11,color:"#fb923c",marginBottom:6}}>⛽ Registro combustible</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><label style={labelSt}>Litros cargados</label><input type="number" min={0} style={S.input} value={movForm.litros} onChange={e=>setMovForm(p=>({...p,litros:e.target.value}))}/></div>
                      <div><label style={labelSt}>Horas actuales</label><input type="number" min={0} style={S.input} value={movForm.horasActuales} onChange={e=>setMovForm(p=>({...p,horasActuales:e.target.value}))}/></div>
                    </div>
                  </div>
                )}
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><input style={S.input} value={movForm.obs} onChange={e=>setMovForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={guardarMov}>✓ Registrar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowMovForm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Traslado */}
          {showTraslForm&&(
            <div style={{...S.card,padding:16,marginBottom:14,background:"rgba(245,158,11,0.05)",borderColor:"rgba(245,158,11,0.2)"}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#fcd34d",marginBottom:12}}>🚛 Traslado</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={traslForm.fecha} onChange={e=>setTraslForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable</label>
                  <select style={S.input} value={traslForm.responsable} onChange={e=>setTraslForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Ítem</label>
                  <select style={S.input} value={traslForm.itemId} onChange={e=>setTraslForm(p=>({...p,itemId:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {(bd.items||[]).map(i=><option key={i.id} value={i.id}>{i.nombre} (disponible: {i.stockActual} {i.unidad})</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Cantidad</label><input type="number" min={1} style={S.input} value={traslForm.cantidad} onChange={e=>setTraslForm(p=>({...p,cantidad:e.target.value}))}/></div>
                <div><label style={labelSt}>Destino</label><input style={S.input} value={traslForm.destino} onChange={e=>setTraslForm(p=>({...p,destino:e.target.value}))} placeholder="ej: Cancha Golf, Taller externo..."/></div>
                <div><label style={labelSt}>Motivo</label><input style={S.input} value={traslForm.motivo} onChange={e=>setTraslForm(p=>({...p,motivo:e.target.value}))}/></div>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",cursor:"pointer"}} onClick={()=>setTraslForm(p=>({...p,conRegreso:!p.conRegreso}))}>
                  <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${traslForm.conRegreso?"#3d7a52":"rgba(255,255,255,0.2)"}`,background:traslForm.conRegreso?"#3d7a52":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {traslForm.conRegreso&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
                  </div>
                  <span style={{fontSize:13}}>¿Regresa a bodega?</span>
                </div>
                {traslForm.conRegreso&&<div><label style={labelSt}>Fecha estimada regreso</label><input type="date" style={S.input} value={traslForm.fechaRegreso} onChange={e=>setTraslForm(p=>({...p,fechaRegreso:e.target.value}))}/></div>}
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><input style={S.input} value={traslForm.obs} onChange={e=>setTraslForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={guardarTrasl}>✓ Registrar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowTraslForm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista ítems */}
          {(bd.items||[]).length===0&&!showItemForm&&!showMovForm&&!showTraslForm&&!showInventForm?(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}>
              <div style={{fontSize:36,marginBottom:8}}>{bodega.icono}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15}}>Sin ítems en {bodega.nombre}</div>
              <div style={{fontSize:12,marginTop:4}}>Usa "Inventario inicial" para cargar el stock actual</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(bd.items||[]).map(item=>{
                const bajo=Number(item.stockActual||0)<=Number(item.stockMinimo||0)&&Number(item.stockMinimo||0)>0;
                const agotado=Number(item.stockActual||0)===0;
                const color=agotado?"#ef4444":bajo?"#f59e0b":"#22c55e";
                return (
                  <div key={item.id} style={{...S.card,padding:14,borderLeft:`3px solid ${color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>{item.nombre}</span>
                          {item.categoria&&<span style={{...S.chip,fontSize:10,background:"rgba(255,255,255,0.06)",color:"#7aaa80"}}>{item.categoria}</span>}
                          <span style={{...S.chip,background:agotado?"rgba(239,68,68,0.12)":bajo?"rgba(245,158,11,0.12)":"rgba(34,197,94,0.08)",color,fontSize:10}}>
                            {agotado?"⛔ Sin stock":bajo?"⚠️ Bajo":"✅ OK"}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:12,color:"#7aaa80"}}>
                          {item.ubicacion&&<span>📍 {item.ubicacion}</span>}
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color}}>{item.stockActual} <span style={{fontSize:12,fontWeight:400}}>{item.unidad}</span></span>
                          {Number(item.stockMinimo)>0&&<span style={{fontSize:11,color:"#5a8a6a"}}>mín: {item.stockMinimo}</span>}
                        </div>
                        {bodegaActiva==="b04"&&(item.marca||item.horasUso)&&(
                          <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"#7aaa80",marginTop:4}}>
                            {item.marca&&<span>🏷️ {item.marca} {item.modelo}</span>}
                            {item.patente&&<span>🔢 {item.patente}</span>}
                            {item.horasUso&&<span>⏱️ {item.horasUso}h</span>}
                            {item.nivelAceite&&<span style={{color:item.nivelAceite==="OK"||item.nivelAceite==="Recién cambiado"?"#22c55e":"#ef4444"}}>🛢️ {item.nivelAceite}</span>}
                            {item.nivelCombustible&&<span style={{color:["Lleno","3/4"].includes(item.nivelCombustible)?"#22c55e":item.nivelCombustible==="1/2"?"#f59e0b":"#ef4444"}}>⛽ {item.nivelCombustible}</span>}
                            {item.proxMantención&&<span style={{color:"#f59e0b"}}>🔧 Próx: {item.proxMantención}h</span>}
                          </div>
                        )}
                        {item.obs&&<div style={{fontSize:11,color:"#5a8a6a",fontStyle:"italic",marginTop:3}}>{item.obs}</div>}
                      </div>
                      {esJefa&&(
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)"}}
                            onClick={()=>{setMovForm({...emptyMov,itemId:String(item.id),unidad:item.unidad||"unidad"});setShowMovForm(true);}}>± Mov.</button>
                          <button className="btn-g" style={{...S.btn,fontSize:11,padding:"4px 10px"}}
                            onClick={()=>{setItemForm({nombre:item.nombre,categoria:item.categoria||"",descripcion:item.descripcion||"",unidad:item.unidad||"unidad",stockActual:item.stockActual||0,stockMinimo:item.stockMinimo||0,ubicacion:item.ubicacion||"",obs:item.obs||""});setMaqForm({marca:item.marca||"",modelo:item.modelo||"",patente:item.patente||"",horasUso:item.horasUso||0,nivelAceite:item.nivelAceite||"OK",nivelCombustible:item.nivelCombustible||"OK",proxMantención:item.proxMantención||""});setEditItemId(item.id);setShowItemForm(true);}}>✏️</button>
                          <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>eliminarItem(item.id)}>🗑</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MOVIMIENTOS ── */}
      {subTab==="movimientos"&&(
        <div className="ein">
          {esJefa&&<button style={{...S.btn,background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",marginBottom:14}} onClick={()=>setShowMovForm(true)}>📥 Registrar movimiento</button>}
          {showMovForm&&(
            <div style={{...S.card,padding:16,marginBottom:14,background:"rgba(34,197,94,0.05)",borderColor:"rgba(34,197,94,0.2)"}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#86efac",marginBottom:12}}>📥 Registrar movimiento</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={movForm.fecha} onChange={e=>setMovForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Tipo</label>
                  <select style={S.input} value={movForm.tipo} onChange={e=>setMovForm(p=>({...p,tipo:e.target.value}))}>
                    {Object.entries(ESTADOS_MOV).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Ítem</label>
                  <select style={S.input} value={movForm.itemId} onChange={e=>{const it=(bd.items||[]).find(i=>String(i.id)===e.target.value);setMovForm(p=>({...p,itemId:e.target.value,unidad:it?.unidad||"unidad"}));}}>
                    <option value="">Seleccionar ítem...</option>
                    {(bd.items||[]).map(i=><option key={i.id} value={i.id}>{i.nombre} (stock: {i.stockActual} {i.unidad})</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Cantidad</label><input type="number" min={0.01} step={0.01} style={S.input} value={movForm.cantidad} onChange={e=>setMovForm(p=>({...p,cantidad:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable</label>
                  <select style={S.input} value={movForm.responsable} onChange={e=>setMovForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Motivo</label><input style={S.input} value={movForm.motivo} onChange={e=>setMovForm(p=>({...p,motivo:e.target.value}))}/></div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label><input style={S.input} value={movForm.obs} onChange={e=>setMovForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={guardarMov}>✓ Registrar</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowMovForm(false)}>Cancelar</button>
              </div>
            </div>
          )}
          {(bd.movimientos||[]).length===0&&!showMovForm?(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}><div style={{fontSize:32,marginBottom:8}}>🔄</div><div>Sin movimientos</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(bd.movimientos||[]).map(mov=>{
                const est=ESTADOS_MOV[mov.tipo]||ESTADOS_MOV.entrada;
                const item=(bd.items||[]).find(i=>String(i.id)===String(mov.itemId));
                return (
                  <div key={mov.id} style={{...S.card,padding:"12px 14px",borderLeft:`3px solid ${est.color}40`}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",fontSize:12,flexWrap:"wrap"}}>
                      <span style={{color:"#5a8a6a"}}>{mov.fecha}</span>
                      <span style={{fontWeight:600,color:est.color}}>{est.label}</span>
                      <span style={{fontWeight:600}}>{item?.nombre||"Ítem"}</span>
                      <span style={{color:est.color}}>{mov.tipo==="entrada"?"+":"-"}{mov.cantidad} {mov.unidad}</span>
                      {mov.responsable&&<span style={{color:"#5a8a6a"}}>· 👤 {mov.responsable}</span>}
                      {mov.motivo&&<span style={{color:"#5a8a6a"}}>· {mov.motivo}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRASLADOS ── */}
      {subTab==="traslados"&&(
        <div className="ein">
          {esJefa&&<button style={{...S.btn,background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",marginBottom:14}} onClick={()=>setShowTraslForm(true)}>🚛 Nuevo traslado</button>}
          {(bd.traslados||[]).length===0?(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}><div style={{fontSize:32,marginBottom:8}}>🚛</div><div>Sin traslados</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(bd.traslados||[]).map(t=>{
                const item=(bd.items||[]).find(i=>String(i.id)===String(t.itemId));
                const enCamino=t.conRegreso&&t.estado==="en_camino";
                return (
                  <div key={t.id} style={{...S.card,padding:14,borderLeft:`3px solid ${enCamino?"#f59e0b":t.estado==="regresó"?"#22c55e":"#6b7280"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                          <span style={{fontSize:14,fontWeight:700}}>{item?.nombre||"Ítem"}</span>
                          <span style={{...S.chip,fontSize:10,color:enCamino?"#fcd34d":t.estado==="regresó"?"#86efac":"#9ca3af"}}>
                            {enCamino?"🚛 En camino":t.estado==="regresó"?"✅ Regresó":"📤 Sin regreso"}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:"#7aaa80"}}>
                          <span>📅 {t.fecha}</span><span>📦 {t.cantidad}</span><span>📍 {t.destino}</span>
                          {t.fechaRegreso&&<span>🔄 Est: {t.fechaRegreso}</span>}
                          {t.responsable&&<span>👤 {t.responsable}</span>}
                        </div>
                        {t.motivo&&<div style={{fontSize:11,color:"#5a8a6a",marginTop:2}}>{t.motivo}</div>}
                      </div>
                      {enCamino&&esJefa&&<button style={{...S.btn,fontSize:11,padding:"5px 12px",background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)"}} onClick={()=>marcarRegreso(t.id)}>✅ Regresó</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAREAS ── */}
      {subTab==="tareas"&&(
        <div className="ein">
          {esJefa&&<button className="btn-p" style={{...S.btn,marginBottom:14}} onClick={()=>setShowTareaForm(true)}>➕ Nueva tarea</button>}
          {showTareaForm&&(
            <div style={{...S.card,padding:16,marginBottom:14}} className="ein">
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#a0d8b0",marginBottom:12}}>➕ Nueva tarea — {bodega.nombre}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={tareaForm.fecha} onChange={e=>setTareaForm(p=>({...p,fecha:e.target.value}))}/></div>
                <div><label style={labelSt}>Tipo</label>
                  <select style={S.input} value={tareaForm.tipo} onChange={e=>setTareaForm(p=>({...p,tipo:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {bodega.tareasTipo.map(t=><option key={t}>{t}</option>)}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Descripción</label><input style={S.input} value={tareaForm.descripcion} onChange={e=>setTareaForm(p=>({...p,descripcion:e.target.value}))}/></div>
                <div><label style={labelSt}>Responsable</label>
                  <select style={S.input} value={tareaForm.responsable} onChange={e=>setTareaForm(p=>({...p,responsable:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                </div>
                <div><label style={labelSt}>Observaciones</label><input style={S.input} value={tareaForm.obs} onChange={e=>setTareaForm(p=>({...p,obs:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-p" style={S.btn} onClick={guardarTarea}>✓ Guardar y enviar al programa</button>
                <button className="btn-g" style={S.btn} onClick={()=>setShowTareaForm(false)}>Cancelar</button>
              </div>
            </div>
          )}
          {(bd.tareas||[]).length===0&&!showTareaForm?(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div>Sin tareas</div></div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(bd.tareas||[]).map(t=>(
                <div key={t.id} style={{...S.card,padding:"12px 14px",borderLeft:`3px solid ${t.estado==="completada"?"#22c55e":"rgba(255,255,255,0.1)"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{t.tipo}{t.descripcion&&` — ${t.descripcion}`}</div>
                      <div style={{display:"flex",gap:10,fontSize:11,color:"#7aaa80",flexWrap:"wrap"}}>
                        <span>📅 {t.fecha}</span>
                        {t.responsable&&<span>👤 {t.responsable}</span>}
                        <span style={{color:t.estado==="completada"?"#22c55e":"#f59e0b"}}>{t.estado==="completada"?"✅ Completada":"⏳ Pendiente"}</span>
                      </div>
                      {t.obs&&<div style={{fontSize:11,color:"#5a8a6a",fontStyle:"italic",marginTop:2}}>{t.obs}</div>}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {t.estado!=="completada"&&<button style={{...S.btn,fontSize:11,padding:"4px 10px",background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)"}} onClick={()=>setbd({tareas:(bd.tareas||[]).map(x=>x.id===t.id?{...x,estado:"completada"}:x)})}>✅</button>}
                      {esJefa&&<button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 10px"}} onClick={()=>setbd({tareas:(bd.tareas||[]).filter(x=>x.id!==t.id)})}>🗑</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {subTab==="historial"&&(
        <div className="ein">
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:12}}>📜 Historial — {bodega.nombre}</div>
          {[...(bd.movimientos||[]),...(bd.traslados||[]),...(bd.tareas||[])].sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")).slice(0,50).map((evt,i)=>{
            const esMov=evt.tipo&&Object.keys(ESTADOS_MOV).includes(evt.tipo);
            const esTrasl=evt.destino!==undefined;
            return (
              <div key={i} style={{...S.card,padding:"10px 14px",marginBottom:6,borderLeft:`2px solid ${esMov?ESTADOS_MOV[evt.tipo]?.color||"#7aaa80":esTrasl?"#f59e0b":"#a0d8b0"}`}}>
                <div style={{display:"flex",gap:8,alignItems:"center",fontSize:12,flexWrap:"wrap"}}>
                  <span style={{color:"#5a8a6a"}}>{evt.fecha}</span>
                  <span style={{fontWeight:600}}>{esMov?ESTADOS_MOV[evt.tipo]?.label:esTrasl?"🚛 Traslado":"✅ "+evt.tipo}</span>
                  {esMov&&<span>{(bd.items||[]).find(i=>String(i.id)===String(evt.itemId))?.nombre||""} · {evt.tipo==="entrada"?"+":"-"}{evt.cantidad} {evt.unidad}</span>}
                  {esTrasl&&<span>{(bd.items||[]).find(i=>String(i.id)===String(evt.itemId))?.nombre||""} → {evt.destino}</span>}
                  {!esMov&&!esTrasl&&<span>{evt.descripcion||""}</span>}
                  {evt.responsable&&<span style={{color:"#5a8a6a"}}>· 👤 {evt.responsable}</span>}
                </div>
              </div>
            );
          })}
          {[...(bd.movimientos||[]),...(bd.traslados||[]),...(bd.tareas||[])].length===0&&(
            <div style={{...S.card,padding:36,textAlign:"center",color:"#4a8a5a"}}><div style={{fontSize:32,marginBottom:8}}>📜</div><div>Sin actividad</div></div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAREA PLANTACIÓN / TRASPLANTE ───────────────────────────────────────────
function TareaPlantacion({ modo, zona, zonaId, bodegasData, setBodegasData, tareasProg, setTareasProg, personal, S, addTareaZona, addHistorial, onClose }) {
  const hoy = new Date().toISOString().slice(0,10);
  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};
  const listaPersonal = [...personal].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  // Stock vivero
  const vivero = bodegasData["b01"]||{items:[]};
  const b03    = bodegasData["b03"]||{items:[]};
  const plantasDisp = (vivero.items||[]).filter(i=>Number(i.stockActual||0)>0);
  const insumosDisp = [
    ...(vivero.items||[]).filter(i=>Number(i.stockActual||0)>0&&["Contenedor/Macetero","Sustrato"].some(cat=>i.categoria?.includes(cat))),
    ...(b03.items||[]).filter(i=>Number(i.stockActual||0)>0&&["Fertilizante","Maicillo","Arena","Compost","Malla","Material construcción"].some(cat=>i.categoria?.includes(cat)||i.nombre?.toLowerCase().includes(cat.toLowerCase()))),
  ];

  const [fecha,    setFecha]    = React.useState(hoy);
  const [planta,   setPlanta]   = React.useState("");
  const [cantidad, setCantidad] = React.useState(1);
  const [responsable, setResponsable] = React.useState("");
  const [obs,      setObs]      = React.useState("");
  const [insumos,  setInsumos]  = React.useState([]);
  const [showInsumos, setShowInsumos] = React.useState(false);

  const plantaSel = plantasDisp.find(i=>String(i.id)===planta);

  const addInsumo = () => setInsumos(p=>[...p,{id:Date.now(),itemId:"",bodegaId:"b01",nombre:"",cantidad:1,unidad:"unidad"}]);
  const updInsumo = (idx,patch) => setInsumos(p=>p.map((x,i)=>i===idx?{...x,...patch}:x));
  const delInsumo = (idx) => setInsumos(p=>p.filter((_,i)=>i!==idx));

  const guardar = () => {
    if(modo==="plantar"&&!planta) return;
    if(modo==="trasplantar"&&!obs.trim()) return;

    const esPlantacion = modo==="plantar";
    const textoTarea = esPlantacion
      ? `🌱 Plantación: ${plantaSel?.nombre||"planta"} (${cantidad} ${plantaSel?.unidad||"unidad"}) en ${zona?.nombre||"zona"}`
      : `🔄 Trasplante a Vivero desde ${zona?.nombre||"zona"}: ${obs}`;

    // Descuentos de stock a ejecutar al completar
    const descuentoStock = [];
    if(esPlantacion && plantaSel) {
      descuentoStock.push({bodegaId:"b01", itemId:String(plantaSel.id), cantidad:Number(cantidad), nombre:plantaSel.nombre, unidad:plantaSel.unidad||"unidad", fecha});
    }
    insumos.forEach(ins=>{
      if(ins.itemId&&ins.cantidad) {
        descuentoStock.push({bodegaId:ins.bodegaId, itemId:String(ins.itemId), cantidad:Number(ins.cantidad), nombre:ins.nombre, unidad:ins.unidad, fecha});
      }
    });

    // Agregar tarea a la macrozona con descuentos pendientes
    const nuevaTarea = {
      id:Date.now(), texto:textoTarea, fecha,
      completada:false, enviadaProg:!!responsable,
      descuentoStock: descuentoStock.length>0?descuentoStock:null,
      insumos: insumos.filter(i=>i.nombre).map(i=>({nombre:i.nombre,cantidad:i.cantidad,unidad:i.unidad})),
    };

    addTareaZona(zonaId, textoTarea, nuevaTarea);
    addHistorial(zonaId, textoTarea);

    // Enviar al programa si hay responsable
    if(responsable&&fecha) {
      setTareasProg(p=>({...p,[fecha]:[...(p[fecha]||[]),{
        id:Date.now()+1, fecha, zona:zona?.nombre||"", elemento:"",
        tarea:textoTarea, responsable, estado:"por_designar", notas:obs||"", auto:false,
      }]}));
    }

    // Si es trasplante → ingresa planta al vivero inmediatamente
    if(modo==="trasplantar"&&obs.trim()) {
      const nuevoBodegasData = {...bodegasData};
      const bdVivero = nuevoBodegasData["b01"]||{items:[],movimientos:[]};
      const items = [...(bdVivero.items||[])];
      const idx = items.findIndex(i=>i.nombre.trim().toLowerCase()===obs.trim().toLowerCase());
      if(idx>=0) {
        items[idx]={...items[idx],stockActual:(Number(items[idx].stockActual)||0)+Number(cantidad)};
      } else {
        items.push({id:Date.now()+2,nombre:obs.trim(),categoria:"Planta",unidad:"unidad",stockActual:Number(cantidad),stockMinimo:0,ubicacion:"",obs:`Trasplantada desde ${zona?.nombre} el ${fecha}`});
      }
      const movimientos=[{id:Date.now()+3,fecha,tipo:"entrada",cantidad:Number(cantidad),unidad:"unidad",motivo:`Trasplante desde ${zona?.nombre}`,itemId:String(idx>=0?items[idx].id:items[items.length-1].id)},...(bdVivero.movimientos||[])].slice(0,200);
      nuevoBodegasData["b01"]={...bdVivero,items,movimientos};
      setBodegasData(nuevoBodegasData);
    }

    onClose();
  };

  return (
    <div style={{...S.card,padding:20,marginBottom:14,background:modo==="plantar"?"rgba(74,222,128,0.05)":"rgba(251,191,36,0.05)",borderColor:modo==="plantar"?"rgba(74,222,128,0.25)":"rgba(251,191,36,0.25)"}} className="ein">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:modo==="plantar"?"#4ade80":"#fbbf24",marginBottom:14}}>
        {modo==="plantar"?"🌱 Plantar desde Vivero":"🔄 Trasplantar a Vivero"} — {zona?.nombre}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
        <div><label style={labelSt}>Responsable</label>
          <select style={S.input} value={responsable} onChange={e=>setResponsable(e.target.value)}>
            <option value="">Seleccionar...</option>
            {listaPersonal.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
        </div>

        {modo==="plantar"?(
          <>
            <div style={{gridColumn:"1/-1"}}>
              <label style={labelSt}>Planta del Vivero</label>
              {plantasDisp.length===0?(
                <div style={{...S.input,color:"#ef4444",fontSize:12}}>⚠️ Sin stock en Vivero</div>
              ):(
                <select style={S.input} value={planta} onChange={e=>setPlanta(e.target.value)}>
                  <option value="">Seleccionar planta...</option>
                  {plantasDisp.map(i=><option key={i.id} value={i.id}>{i.nombre} — stock: {i.stockActual} {i.unidad}</option>)}
                </select>
              )}
            </div>
            <div><label style={labelSt}>Cantidad</label>
              <input type="number" min={1} max={plantaSel?.stockActual||999} style={S.input} value={cantidad} onChange={e=>setCantidad(e.target.value)}/>
              {plantaSel&&Number(cantidad)>Number(plantaSel.stockActual)&&<div style={{fontSize:11,color:"#ef4444",marginTop:3}}>⚠️ Supera el stock disponible ({plantaSel.stockActual})</div>}
            </div>
            <div><label style={labelSt}>Observaciones</label><input style={S.input} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Sector de plantación, condiciones..."/></div>
          </>
        ):(
          <>
            <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Nombre de la planta a trasplantar</label><input style={S.input} value={obs} onChange={e=>setObs(e.target.value)} placeholder="ej: Lavanda, Rosa..."/></div>
            <div><label style={labelSt}>Cantidad</label><input type="number" min={1} style={S.input} value={cantidad} onChange={e=>setCantidad(e.target.value)}/></div>
          </>
        )}
      </div>

      {/* Insumos */}
      <div style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px",marginBottom:12,border:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:insumos.length>0||showInsumos?8:0}}>
          <div style={{fontSize:12,color:"#7aaa80",fontWeight:600}}>📦 Insumos asociados (macetas, arena, compost...)</div>
          <button style={{...S.btn,fontSize:11,padding:"3px 10px",background:"rgba(255,255,255,0.06)",color:"#7aaa80"}}
            onClick={()=>{setShowInsumos(true);addInsumo();}}>+ Agregar</button>
        </div>
        {(showInsumos||insumos.length>0)&&(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {insumos.map((ins,idx)=>(
              <div key={ins.id} style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <select style={{...S.input,flex:2,fontSize:12,padding:"5px 8px"}}
                  value={ins.itemId}
                  onChange={e=>{
                    const allItems=[...(vivero.items||[]).map(i=>({...i,_bod:"b01"})),...(b03.items||[]).map(i=>({...i,_bod:"b03"}))];
                    const sel=allItems.find(i=>String(i.id)===e.target.value);
                    updInsumo(idx,{itemId:e.target.value,bodegaId:sel?._bod||"b03",nombre:sel?.nombre||"",unidad:sel?.unidad||"unidad"});
                  }}>
                  <option value="">Seleccionar insumo...</option>
                  <optgroup label="🌱 Vivero">{(vivero.items||[]).filter(i=>Number(i.stockActual||0)>0).map(i=><option key={i.id} value={i.id}>{i.nombre} (stock:{i.stockActual})</option>)}</optgroup>
                  <optgroup label="🔧 Materiales y Herramientas">{(b03.items||[]).filter(i=>Number(i.stockActual||0)>0).map(i=><option key={i.id} value={i.id}>{i.nombre} (stock:{i.stockActual})</option>)}</optgroup>
                </select>
                <input type="number" min={1} style={{...S.input,width:70,fontSize:12,padding:"5px 8px"}} value={ins.cantidad} onChange={e=>updInsumo(idx,{cantidad:e.target.value})} placeholder="Cant."/>
                <button className="btn-d" style={{...S.btn,fontSize:11,padding:"3px 8px"}} onClick={()=>delInsumo(idx)}>✕</button>
              </div>
            ))}
            <div style={{fontSize:11,color:"#f59e0b",marginTop:4}}>⚠️ Los insumos se descontarán del stock al marcar la tarea como completada</div>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8}}>
        <button className="btn-p" style={S.btn} onClick={guardar}
          disabled={modo==="plantar"&&!planta}>
          ✓ Crear tarea y enviar a programa
        </button>
        <button className="btn-g" style={S.btn} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── INFORME MENSUAL RRHH ─────────────────────────────────────────────────────
// ─── INFORME MENSUAL RRHH ────────────────────────────────────────────────────
function InformeRRHH({ S, personal, bonosMasivos, setBonosMasivos, setPersonal, onVolver }) {
  const hoy = new Date();
  const fechaHoyStr = hoy.toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
  const mesRendicion = hoy.toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  const personalArr = Array.isArray(personal)?personal:Object.values(personal||{});
  const bonosArr = Array.isArray(bonosMasivos)?bonosMasivos:Object.values(bonosMasivos||{});

  // Bonos masivos pendientes de rendición
  const bonosPendientes = bonosArr.filter(b=>b.estado!=="rendido");

  // Selección de bonos a incluir en este informe
  const [selBonos, setSelBonos] = React.useState({});
  // Eventos individuales pendientes por trabajador (horas extra, permisos)
  const [selEventos, setSelEventos] = React.useState({});

  // Al montar, pre-seleccionar todos los bonos pendientes
  React.useEffect(()=>{
    const ini = {};
    bonosPendientes.forEach(b=>{ ini[b.id]=true; });
    setSelBonos(ini);
  },[bonosMasivos]);

  // Construir vista previa por trabajador
  const trabajadoresCon = personalArr.map(t=>{
    const bonosT = bonosPendientes.filter(b=>(b.participantes||[]).some(p=>String(p.trabajadorId)===String(t.id)));
    const eventosT = (t.eventos||[]).filter(e=>
      ["bonoConstruccion","bonoPesado","bonoEspecializado","horaExtra","permiso","vacaciones","licencia"].includes(e.tipo) &&
      e.estado!=="rendido"
    );
    if(!bonosT.length&&!eventosT.length) return null;
    return {t, bonosT, eventosT};
  }).filter(Boolean);

  const generarInforme = () => {
    const bonosSeleccionados = bonosPendientes.filter(b=>selBonos[b.id]);
    const eventosSeleccionados = selEventos; // {trabajadorId_eventoId: true}

    const paginas = trabajadoresCon.map(({t, bonosT, eventosT})=>{
      const bonosTSel = bonosT.filter(b=>selBonos[b.id]);
      const eventosTSel = eventosT.filter(e=>selEventos[`${t.id}_${e.id}`]);
      if(!bonosTSel.length&&!eventosTSel.length) return "";

      const totalBonos = bonosTSel.reduce((a,b)=>{
        const p=b.participantes?.find(p=>String(p.trabajadorId)===String(t.id));
        return a+Number(p?.monto||0);
      },0) + eventosTSel.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).reduce((a,e)=>a+Number(e.valor||0),0);

      const totalHE = eventosTSel.filter(e=>e.tipo==="horaExtra"&&e.estado==="aprobado").reduce((a,e)=>a+Number(e.horas||0),0);

      const filasBonosMasivos = bonosTSel.map(b=>{
        const p=b.participantes?.find(p=>String(p.trabajadorId)===String(t.id));
        return `<tr style="background:#f9f0ff">
          <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${b.fecha}</td>
          <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${p?.rol||""} — ${b.descripcion}</td>
          <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px;text-align:right;font-weight:700;color:#7b1fa2">$${Number(p?.monto||0).toLocaleString("es-CL")}</td>
        </tr>`;}).join("");

      const filasBonosInd = eventosTSel.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)).map(e=>`
        <tr><td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.fecha}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.descripcion||"Bono"}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px;text-align:right;font-weight:700;color:#7b1fa2">${e.valor?`$${Number(e.valor).toLocaleString("es-CL")}`:"—"}</td></tr>`).join("");

      const filasHE = eventosTSel.filter(e=>e.tipo==="horaExtra").map(e=>`
        <tr><td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.fecha}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.descripcion||"Hora extra"}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px;text-align:right;font-weight:700">${e.horas||0} hrs</td></tr>`).join("");

      const filasPermisos = eventosTSel.filter(e=>["permiso","vacaciones","licencia"].includes(e.tipo)).map(e=>`
        <tr><td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.fecha}${e.fechaFin?` al ${e.fechaFin}`:""}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px">${e.tipo==="permiso"?"Permiso":e.tipo==="vacaciones"?"Vacaciones":"Licencia"}${e.descripcion?` — ${e.descripcion}`:""}</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;font-size:12px;text-align:center">—</td></tr>`).join("");

      return `<div class="pagina">
        <div class="hdr">
          <div><h1>Informe de Personal — Rendición ${mesRendicion}</h1>
          <h2>Departamento de Áreas Verdes · Estadio Español de Las Condes</h2>
          <h2>Para: Recursos Humanos / Remuneraciones</h2></div>
          <div style="text-align:right;font-size:12px;color:#555">Emisión: <strong>${fechaHoyStr}</strong></div>
        </div>
        <div style="background:#f0f7f0;border:1px solid #a5d6a7;border-radius:8px;padding:14px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:18px;font-weight:900">${t.nombre}</div>
          <div style="font-size:13px;color:#555">${t.cargo||"—"} · ${t.contrato||"—"}</div></div>
          <div style="text-align:right">
            ${totalBonos>0?`<div style="font-size:11px;color:#888">Total bonos</div><div style="font-size:20px;font-weight:700;color:#7b1fa2">$${totalBonos.toLocaleString("es-CL")}</div>`:""}
            ${totalHE>0?`<div style="font-size:11px;color:#888;margin-top:4px">Horas extras</div><div style="font-size:16px;font-weight:700;color:#1565c0">${totalHE} hrs</div>`:""}
          </div>
        </div>
        ${(filasBonosMasivos||filasBonosInd)?`
        <div class="sec">💰 Bonos por Tarea</div>
        <table><thead><tr><th>Fecha tarea</th><th>Descripción</th><th style="text-align:right">Monto</th></tr></thead>
        <tbody>${filasBonosMasivos}${filasBonosInd}</tbody>
        <tfoot><tr style="background:#f3e5ff;font-weight:bold"><td colspan="2" style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right">TOTAL BONOS</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right;color:#7b1fa2">$${totalBonos.toLocaleString("es-CL")}</td></tr></tfoot></table>`:""}
        ${filasHE?`<div class="sec">⏰ Horas Extras</div>
        <table><thead><tr><th>Fecha</th><th>Descripción</th><th style="text-align:right">Horas</th></tr></thead>
        <tbody>${filasHE}</tbody>
        <tfoot><tr style="background:#e3f2fd;font-weight:bold"><td colspan="2" style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right">TOTAL</td>
        <td style="padding:6px 10px;border:1px solid #e0e0e0;text-align:right;color:#1565c0">${totalHE} hrs</td></tr></tfoot></table>`:""}
        ${filasPermisos?`<div class="sec">📋 Permisos y Ausentismo</div>
        <table><thead><tr><th>Período</th><th>Tipo</th><th>—</th></tr></thead>
        <tbody>${filasPermisos}</tbody></table>`:""}
        <div class="firmas">
          <div class="firma"><div class="flinea"><strong>${t.nombre}</strong><br>Firma trabajador</div></div>
          <div class="firma"><div class="flinea"><strong>Carmen Luz Hermosilla Diez</strong><br>Jefe Dpto. Áreas Verdes</div></div>
          <div class="firma"><div class="flinea">RRHH / Remuneraciones<br>Estadio Español</div></div>
        </div>
        <div class="footer">Estadio Español de Las Condes · Departamento de Áreas Verdes · Jefe de Departamento de Áreas Verdes · Carmen Luz Hermosilla Diez · ${fechaHoyStr}</div>
      </div>`;
    }).filter(Boolean).join("<div class='salto'></div>");

    if(!paginas) { alert("No hay items seleccionados para incluir en el informe."); return; }

    // Marcar bonos seleccionados como "rendido"
    setBonosMasivos(prev=>(Array.isArray(prev)?prev:Object.values(prev||{})).map(b=>selBonos[b.id]?{...b,estado:"rendido",fechaRendicion:fechaHoyStr}:b));
    // Marcar eventos individuales seleccionados como "rendido"
    setPersonal(prev=>(Array.isArray(prev)?prev:Object.values(prev||{})).map(t=>({
      ...t, eventos:(t.eventos||[]).map(e=>selEventos[`${t.id}_${e.id}`]?{...e,estado:"rendido"}:e)
    })));

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Informe RRHH ${mesRendicion}</title>
    <style>body{font-family:Arial,sans-serif;margin:0;color:#1a1a1a;font-size:13px}
    .pagina{padding:28px;max-width:720px;margin:0 auto}
    h1{font-size:17px;color:#1a5c2a;margin:0 0 3px}h2{font-size:12px;color:#444;margin:0;font-weight:normal}
    .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a5c2a;padding-bottom:10px;margin-bottom:16px}
    .sec{font-size:11px;font-weight:700;color:#1a5c2a;margin:12px 0 5px;border-left:3px solid #1a5c2a;padding-left:7px;text-transform:uppercase}
    table{width:100%;border-collapse:collapse;margin-bottom:12px}
    th{background:#1a5c2a;color:#fff;padding:7px 10px;font-size:11px;text-align:left}
    tr:nth-child(even){background:#fafafa}
    .firmas{display:flex;justify-content:space-between;margin-top:40px}
    .firma{text-align:center;width:30%}
    .flinea{border-top:1px solid #333;padding-top:6px;margin-top:36px;font-size:11px}
    .footer{margin-top:14px;padding-top:8px;border-top:1px solid #ccc;font-size:10px;color:#888;text-align:center}
    .salto{page-break-after:always}
    @media print{.noprint{display:none}.salto{border:none}}</style></head><body>
    ${paginas}
    <div class="noprint" style="text-align:center;padding:20px;background:#f5f5f5">
      <button onclick="window.print()" style="background:#1a5c2a;color:#fff;border:none;padding:10px 28px;border-radius:7px;font-size:13px;cursor:pointer">🖨️ Imprimir / Guardar PDF</button>
    </div></body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close();
  };

  return (
    <div className="ein">
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <button className="btn-g" style={S.btn} onClick={onVolver}>← Volver</button>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,flex:1}}>📄 Informe RRHH — {mesRendicion}</h1>
        <button className="btn-p" style={{...S.btn,padding:"10px 20px"}} onClick={generarInforme}>🖨️ Generar e imprimir</button>
      </div>

      <div style={{...S.card,padding:14,marginBottom:14,background:"rgba(196,181,253,0.06)",borderColor:"rgba(196,181,253,0.2)"}}>
        <div style={{fontSize:12,color:"#c4b5fd",marginBottom:4,fontWeight:600}}>💡 Selecciona qué incluir en este informe</div>
        <div style={{fontSize:11,color:"#7a6a9a"}}>Los ítems seleccionados quedarán como "Rendido" y no aparecerán en la próxima rendición. Los no seleccionados siguen pendientes.</div>
      </div>

      {/* Bonos masivos pendientes */}
      {bonosPendientes.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:8}}>💰 Bonos por Tarea pendientes</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {bonosPendientes.map(b=>(
              <div key={b.id} style={{...S.card,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderColor:selBonos[b.id]?"rgba(196,181,253,0.4)":"rgba(255,255,255,0.08)"}}
                onClick={()=>setSelBonos(p=>({...p,[b.id]:!p[b.id]}))}>
                <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selBonos[b.id]?"#c4b5fd":"rgba(255,255,255,0.2)"}`,background:selBonos[b.id]?"#c4b5fd":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {selBonos[b.id]&&<span style={{color:"#1a1a1a",fontSize:11,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{b.descripcion}</div>
                  <div style={{fontSize:11,color:"#7a6a9a"}}>📅 Fecha tarea: {b.fecha} · {(b.participantes||[]).length} participantes · Fondo: ${Number(b.fondoTotal||0).toLocaleString("es-CL")}</div>
                </div>
                <div style={{fontSize:12,color:"#c4b5fd",fontWeight:700}}>${(b.participantes||[]).reduce((a,p)=>a+Number(p.monto||0),0).toLocaleString("es-CL")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eventos por trabajador */}
      {trabajadoresCon.map(({t, eventosT})=>{
        const evSel = eventosT.filter(e=>selEventos[`${t.id}_${e.id}`]);
        return (
          <div key={t.id} style={{...S.card,padding:14,marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>{t.nombre} <span style={{fontSize:11,color:"#6aaa7a",fontWeight:400}}>{t.cargo}</span></div>
            {eventosT.map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",cursor:"pointer"}}
                onClick={()=>setSelEventos(p=>({...p,[`${t.id}_${e.id}`]:!p[`${t.id}_${e.id}`]}))}>
                <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${selEventos[`${t.id}_${e.id}`]?"#86efac":"rgba(255,255,255,0.2)"}`,background:selEventos[`${t.id}_${e.id}`]?"#86efac":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {selEventos[`${t.id}_${e.id}`]&&<span style={{color:"#000",fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <div style={{flex:1,fontSize:12}}>
                  <span style={{color:"#a0d8b0"}}>{e.tipo==="horaExtra"?"⏰":e.tipo==="permiso"?"📋":e.tipo==="vacaciones"?"🏖️":e.tipo==="licencia"?"🏥":"💰"}</span>
                  {" "}{e.descripcion||e.tipo} · {e.fecha}{e.fechaFin?` → ${e.fechaFin}`:""}
                </div>
                <div style={{fontSize:12,color:"#7aaa80",flexShrink:0}}>
                  {e.valor?`$${Number(e.valor).toLocaleString("es-CL")}`:e.horas?`${e.horas}h`:""}
                </div>
              </div>
            ))}
            {eventosT.length===0&&<div style={{fontSize:12,color:"#4a6a54"}}>Sin eventos pendientes</div>}
          </div>
        );
      })}

      {bonosPendientes.length===0&&trabajadoresCon.length===0&&(
        <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
          <div style={{fontSize:36,marginBottom:8}}>✅</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Todo al día — sin ítems pendientes de rendición</div>
        </div>
      )}
    </div>
  );
}

// ─── BONO POR TAREA ──────────────────────────────────────────────────────────
function BonoMasivo({ S, personal, bonosConfig, setBonosConfig, bonosMasivos, setBonosMasivos, setPersonal, onVolver, esJefa }) {
  const hoy = new Date().toISOString().slice(0,10);
  const labelSt = {fontSize:10,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:3,textTransform:"uppercase"};

  const pctFondo    = Number(bonosConfig.pctFondo||50);
  const pctEjecutor = Number(bonosConfig.pctEjecutor||50);
  const pctAyudante = Number(bonosConfig.pctAyudante||30);
  const pctApoyo    = Number(bonosConfig.pctApoyo||20);

  const [showConfig, setShowConfig] = React.useState(false);
  const [showForm,   setShowForm]   = React.useState(false);
  const [editBonoId, setEditBonoId] = React.useState(null);
  const [editBonoForm, setEditBonoForm] = React.useState(null);
  const [form, setForm] = React.useState({
    fecha: hoy, descripcion:"", valorMercado:"",
    ejecutor:"", ayudante:"", apoyos:[], obs:""
  });

  const personalArr = Array.isArray(personal) ? personal : Object.values(personal||{});
  const listaPersonal = [...personalArr].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));
  const getNombre = (id) => personalArr.find(p=>String(p.id)===String(id))?.nombre||"—";

  const fondoTotal  = Math.round(Number(form.valorMercado||0) * pctFondo / 100);
  const montoEjec   = Math.round(fondoTotal * pctEjecutor / 100);
  const montoAyud   = Math.round(fondoTotal * pctAyudante / 100);
  const nApoyos     = form.apoyos.filter(a=>a).length;
  const montoApoyo  = nApoyos>0 ? Math.round((fondoTotal * pctApoyo / 100) / nApoyos) : 0;
  const totalDistr  = montoEjec + montoAyud + (montoApoyo * nApoyos);

  const imprimirBono = (bono) => {
    const fechaHoy = new Date().toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"});
    const fechaBono = bono.fecha ? new Date(bono.fecha+"T12:00:00").toLocaleDateString("es-CL",{day:"numeric",month:"long",year:"numeric"}) : bono.fecha;
    // Generar una página por trabajador
    const paginas = (bono.participantes||[]).map(p=>`
      <div class="pagina">
        <div class="hdr">
          <div>
            <h1>Comprobante de Bono por Tarea Especial</h1>
            <h2>Departamento de Áreas Verdes · Estadio Español de Las Condes</h2>
            <h2>Para: Recursos Humanos / Remuneraciones</h2>
          </div>
          <div style="text-align:right;font-size:12px;color:#555">
            <div>Fecha tarea: <strong>${fechaBono}</strong></div>
            <div>Emisión: <strong>${fechaHoy}</strong></div>
          </div>
        </div>
        <div style="background:#f8f9fa;border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:18px">
          <div style="font-size:16px;font-weight:700;color:#1a5c2a;margin-bottom:8px">📋 ${bono.descripcion}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div><div style="font-size:10px;color:#888;text-transform:uppercase">Valor mercado</div><div style="font-size:14px;font-weight:700">$${Number(bono.valorMercado).toLocaleString("es-CL")}</div></div>
            <div><div style="font-size:10px;color:#888;text-transform:uppercase">Fondo distribuido (${pctFondo}%)</div><div style="font-size:14px;font-weight:700;color:#c62828">$${Number(bono.fondoTotal).toLocaleString("es-CL")}</div></div>
            <div><div style="font-size:10px;color:#888;text-transform:uppercase">N° participantes</div><div style="font-size:14px;font-weight:700">${(bono.participantes||[]).length} personas</div></div>
          </div>
        </div>
        <div style="background:${p.rol==="Ejecutor"?"#e8f5e9":p.rol==="Ayudante"?"#e3f2fd":"#fff8e1"};border:2px solid ${p.rol==="Ejecutor"?"#2e7d32":p.rol==="Ayudante"?"#1565c0":"#f57f17"};border-radius:10px;padding:20px;margin-bottom:18px;text-align:center">
          <div style="font-size:13px;color:#666;margin-bottom:4px">TRABAJADOR</div>
          <div style="font-size:22px;font-weight:900;color:#1a1a1a;margin-bottom:8px">${p.nombre||"—"}</div>
          <div style="display:inline-block;background:${p.rol==="Ejecutor"?"#2e7d32":p.rol==="Ayudante"?"#1565c0":"#f57f17"};color:#fff;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:12px">${p.rol}</div>
          <div style="font-size:13px;color:#666">Porcentaje asignado: <strong>${p.pct}% del fondo</strong></div>
          <div style="font-size:36px;font-weight:900;color:${p.rol==="Ejecutor"?"#2e7d32":p.rol==="Ayudante"?"#1565c0":"#e65100"};margin-top:8px">$${Number(p.monto).toLocaleString("es-CL")}</div>
          <div style="font-size:12px;color:#888;margin-top:4px">MONTO BONO A PAGAR</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:50px">
          <div style="text-align:center">
            <div style="border-top:1px solid #333;padding-top:8px;margin-top:40px;font-size:12px">
              <strong>${p.nombre||"—"}</strong><br>RUT: ___________________<br>Firma y fecha recepción
            </div>
          </div>
          <div style="text-align:center">
            <div style="border-top:1px solid #333;padding-top:8px;margin-top:40px;font-size:12px">
              <strong>Carmen Luz Hermosilla Diez</strong><br>Jefe Dpto. de Áreas Verdes
            </div>
          </div>
        </div>
        <div style="margin-top:20px;padding-top:8px;border-top:1px solid #ccc;font-size:10px;color:#888;text-align:center">
          Estadio Español de Las Condes · Departamento de Áreas Verdes<br>
          Jefe de Departamento de Áreas Verdes · Carmen Luz Hermosilla Diez · ${fechaHoy}
        </div>
      </div>`).join("<div class='salto'></div>");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Bonos — ${bono.descripcion}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;color:#1a1a1a;font-size:13px}
      .pagina{padding:30px;max-width:700px;margin:0 auto}
      h1{font-size:17px;color:#1a5c2a;margin:0 0 3px}
      h2{font-size:12px;color:#444;margin:0;font-weight:normal}
      .hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a5c2a;padding-bottom:10px;margin-bottom:16px}
      .salto{page-break-after:always;border-top:2px dashed #ccc;margin:20px 0}
      @media print{.noprint{display:none}.salto{border:none}}
    </style></head><body>
    ${paginas}
    <div class="noprint" style="text-align:center;padding:20px;background:#f5f5f5">
      <button onclick="window.print()" style="background:#1a5c2a;color:#fff;border:none;padding:10px 28px;border-radius:7px;font-size:13px;cursor:pointer">🖨️ Imprimir / Guardar PDF</button>
      <p style="font-size:12px;color:#666;margin-top:8px">Se imprimirá un comprobante por página para cada trabajador</p>
    </div>
    </body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close();
  };

  const guardar = () => {
    if(!form.descripcion.trim()||!form.valorMercado||!form.ejecutor) return;
    const apoyosValidos = form.apoyos.filter(a=>a);
    const participantes = [
      {trabajadorId:String(form.ejecutor), nombre:getNombre(form.ejecutor), rol:"Ejecutor", pct:pctEjecutor, monto:montoEjec},
      ...(form.ayudante?[{trabajadorId:String(form.ayudante), nombre:getNombre(form.ayudante), rol:"Ayudante", pct:pctAyudante, monto:montoAyud}]:[]),
      ...apoyosValidos.map(id=>({trabajadorId:String(id), nombre:getNombre(id), rol:"Apoyo", pct:pctApoyo, monto:montoApoyo})),
    ];
    const nuevoBono = {
      id:Date.now(), fecha:form.fecha, descripcion:form.descripcion,
      valorMercado:Number(form.valorMercado), fondoTotal, obs:form.obs,
      estado:"generado", participantes,
    };
    setBonosMasivos(p=>[nuevoBono,...(Array.isArray(p)?p:Object.values(p||{}))]);
    // Agregar bono en ficha de cada trabajador
    setPersonal(p=>{
      const arr=Array.isArray(p)?p:Object.values(p||{});
      return arr.map(t=>{
        const partic = participantes.find(x=>String(x.trabajadorId)===String(t.id));
        if(!partic) return t;
        const nuevaEntrada = {
          id:Date.now()+Math.random(), tipo:"bonoConstruccion",
          fecha:form.fecha, estado:"pendiente",
          descripcion:`${partic.rol} — ${form.descripcion}`,
          valor:String(partic.monto), horas:"",
        };
        return {...t, eventos:[...(t.eventos||[]),nuevaEntrada]};
      });
    });
    setForm({fecha:hoy,descripcion:"",valorMercado:"",ejecutor:"",ayudante:"",apoyos:[],obs:""});
    setShowForm(false);
  };

  return (
    <div className="ein">
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <button className="btn-g" style={S.btn} onClick={onVolver}>← Volver</button>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,flex:1}}>💰 Bono por Tarea</h1>
        {esJefa&&<button style={{...S.btn,fontSize:12,background:"rgba(255,255,255,0.06)",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)"}} onClick={()=>setShowConfig(p=>!p)}>⚙️ Configurar %</button>}
        <button className="btn-p" style={S.btn} onClick={()=>setShowForm(p=>!p)}>➕ Nueva tarea con bono</button>
      </div>

      {/* Configuración % */}
      {showConfig&&esJefa&&(
        <div style={{...S.card,padding:18,marginBottom:16,background:"rgba(255,255,255,0.03)"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#c4b5fd",marginBottom:12}}>⚙️ Configuración de porcentajes — {bonosConfig.año||new Date().getFullYear()}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={labelSt}>% Fondo sobre valor mercado</label>
              <input type="number" min={1} max={100} style={S.input} value={bonosConfig.pctFondo||50}
                onChange={e=>setBonosConfig(p=>({...p,pctFondo:Number(e.target.value)}))}/>
              <div style={{fontSize:10,color:"#5a8a6a",marginTop:3}}>Ejemplo: 50% de $200.000 = $100.000 a distribuir</div>
            </div>
            <div><label style={labelSt}>Año de vigencia</label>
              <input type="number" style={S.input} value={bonosConfig.año||new Date().getFullYear()}
                onChange={e=>setBonosConfig(p=>({...p,año:Number(e.target.value)}))}/>
            </div>
            <div><label style={labelSt}>% Ejecutor (del fondo)</label>
              <input type="number" min={1} max={100} style={S.input} value={bonosConfig.pctEjecutor||50}
                onChange={e=>setBonosConfig(p=>({...p,pctEjecutor:Number(e.target.value)}))}/>
            </div>
            <div><label style={labelSt}>% Ayudante (del fondo)</label>
              <input type="number" min={1} max={100} style={S.input} value={bonosConfig.pctAyudante||30}
                onChange={e=>setBonosConfig(p=>({...p,pctAyudante:Number(e.target.value)}))}/>
            </div>
            <div><label style={labelSt}>% Apoyo total (del fondo, se divide entre N)</label>
              <input type="number" min={1} max={100} style={S.input} value={bonosConfig.pctApoyo||20}
                onChange={e=>setBonosConfig(p=>({...p,pctApoyo:Number(e.target.value)}))}/>
              <div style={{fontSize:10,color:"#5a8a6a",marginTop:3}}>Si hay 2 apoyos cada uno recibe {Math.round((bonosConfig.pctApoyo||20)/2)}%</div>
            </div>
            <div style={{display:"flex",alignItems:"end",paddingBottom:4}}>
              <div style={{fontSize:13,color:pctEjecutor+pctAyudante+pctApoyo===100?"#86efac":"#ef4444",fontWeight:600}}>
                Total distribuido: {pctEjecutor+pctAyudante+pctApoyo}%
                {pctEjecutor+pctAyudante+pctApoyo!==100&&<span style={{fontSize:11}}> ⚠️ debe sumar 100%</span>}
              </div>
            </div>
          </div>
          <button className="btn-g" style={S.btn} onClick={()=>setShowConfig(false)}>✓ Guardar configuración</button>
        </div>
      )}

      {/* Formulario nueva tarea con bono */}
      {showForm&&(
        <div style={{...S.card,padding:20,marginBottom:16}} className="ein">
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#c4b5fd",marginBottom:14}}>➕ Nueva tarea con bono</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={labelSt}>Fecha</label><input type="date" style={S.input} value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/></div>
            <div><label style={labelSt}>Valor mercado de la tarea ($)</label>
              <input type="number" min={0} style={S.input} placeholder="ej: 200000" value={form.valorMercado} onChange={e=>setForm(p=>({...p,valorMercado:e.target.value}))}/>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Descripción de la tarea</label>
              <input style={S.input} placeholder="ej: Tala palmera cancha golf hoyo 5" value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/>
            </div>
          </div>

          {/* Vista previa del fondo */}
          {Number(form.valorMercado)>0&&(
            <div style={{background:"rgba(196,181,253,0.08)",border:"1px solid rgba(196,181,253,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
              <div style={{fontSize:11,color:"#c4b5fd",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>💰 Distribución del bono</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:13}}>
                <div><span style={{color:"#7a6a9a"}}>Valor mercado:</span> <strong>${Number(form.valorMercado).toLocaleString("es-CL")}</strong></div>
                <div><span style={{color:"#7a6a9a"}}>Fondo ({pctFondo}%):</span> <strong style={{color:"#c4b5fd"}}>${fondoTotal.toLocaleString("es-CL")}</strong></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10}}>
                <div style={{background:"rgba(74,222,128,0.08)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(74,222,128,0.2)"}}>
                  <div style={{fontSize:10,color:"#4ade80",marginBottom:2}}>EJECUTOR ({pctEjecutor}%)</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#4ade80"}}>${montoEjec.toLocaleString("es-CL")}</div>
                </div>
                <div style={{background:"rgba(96,165,250,0.08)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(96,165,250,0.2)"}}>
                  <div style={{fontSize:10,color:"#60a5fa",marginBottom:2}}>AYUDANTE ({pctAyudante}%)</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#60a5fa"}}>${montoAyud.toLocaleString("es-CL")}</div>
                </div>
                <div style={{background:"rgba(251,191,36,0.08)",borderRadius:7,padding:"8px 10px",border:"1px solid rgba(251,191,36,0.2)"}}>
                  <div style={{fontSize:10,color:"#fbbf24",marginBottom:2}}>APOYO c/u ({pctApoyo}%÷{Math.max(nApoyos,1)})</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#fbbf24"}}>${montoApoyo.toLocaleString("es-CL")}</div>
                </div>
              </div>
              {totalDistr!==fondoTotal&&<div style={{fontSize:11,color:"#f59e0b",marginTop:6}}>⚠️ Distribuido: ${totalDistr.toLocaleString("es-CL")} de ${fondoTotal.toLocaleString("es-CL")}</div>}
            </div>
          )}

          {/* Asignación de roles */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={labelSt}>Ejecutor</label>
              <select style={S.input} value={form.ejecutor} onChange={e=>setForm(p=>({...p,ejecutor:String(e.target.value)}))}>
                <option value="">Seleccionar...</option>
                {listaPersonal.map(p=><option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
              </select>
              {form.ejecutor&&<div style={{fontSize:11,color:"#4ade80",marginTop:3}}>✓ {getNombre(form.ejecutor)}</div>}
            </div>
            <div><label style={labelSt}>Ayudante</label>
              <select style={S.input} value={form.ayudante} onChange={e=>setForm(p=>({...p,ayudante:String(e.target.value)}))}>
                <option value="">Sin ayudante</option>
                {listaPersonal.filter(p=>String(p.id)!==form.ejecutor).map(p=><option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
              </select>
              {form.ayudante&&<div style={{fontSize:11,color:"#60a5fa",marginTop:3}}>✓ {getNombre(form.ayudante)}</div>}
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={labelSt}>Apoyos</label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {form.apoyos.map((ap,idx)=>(
                  <div key={idx} style={{display:"flex",gap:6,alignItems:"center"}}>
                    <select style={{...S.input,flex:1}} value={ap} onChange={e=>setForm(p=>({...p,apoyos:p.apoyos.map((a,i)=>i===idx?String(e.target.value):a)}))}>
                      <option value="">Seleccionar...</option>
                      {listaPersonal.filter(p=>String(p.id)!==form.ejecutor&&String(p.id)!==form.ayudante&&!form.apoyos.filter((_,i)=>i!==idx).includes(String(p.id))).map(p=><option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
                    </select>
                    {ap&&<span style={{fontSize:11,color:"#fbbf24",flexShrink:0}}>✓ {getNombre(ap)}</span>}
                    <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>setForm(p=>({...p,apoyos:p.apoyos.filter((_,i)=>i!==idx)}))}>✕</button>
                  </div>
                ))}
                <button style={{...S.btn,fontSize:12,background:"rgba(251,191,36,0.1)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.2)",alignSelf:"flex-start"}}
                  onClick={()=>setForm(p=>({...p,apoyos:[...p.apoyos,""]}))}>+ Agregar apoyo</button>
              </div>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={labelSt}>Observaciones</label>
              <input style={S.input} value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))} placeholder="Condiciones especiales, notas..."/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-p" style={S.btn} onClick={guardar} disabled={!form.descripcion||!form.valorMercado||!form.ejecutor}>
              ✓ Generar bonos
            </button>
            <button className="btn-g" style={S.btn} onClick={()=>setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Historial bonos masivos */}
      {(bonosMasivos||[]).length===0&&!showForm?(
        <div style={{...S.card,padding:40,textAlign:"center",color:"#4a8a5a"}}>
          <div style={{fontSize:36,marginBottom:8}}>💰</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Sin bonos por tarea registrados</div>
          <div style={{fontSize:13,marginTop:4}}>Crea una nueva tarea con bono para comenzar</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(bonosMasivos||[]).map(bono=>(
            <div key={bono.id} style={{...S.card,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:3}}>{bono.descripcion}</div>
                  <div style={{fontSize:12,color:"#6aaa7a"}}>📅 {bono.fecha}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"start",flexWrap:"wrap"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:"#7a6a9a"}}>Valor mercado</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700}}>${Number(bono.valorMercado).toLocaleString("es-CL")}</div>
                    <div style={{fontSize:11,color:"#c4b5fd"}}>Fondo: ${Number(bono.fondoTotal).toLocaleString("es-CL")}</div>
                  </div>
                  <button style={{...S.btn,fontSize:11,padding:"5px 12px",background:"rgba(255,255,255,0.06)",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)"}} onClick={()=>{setEditBonoId(bono.id);setEditBonoForm({...bono});}}>✏️ Editar</button>
                  <button style={{...S.btn,fontSize:11,padding:"5px 12px",background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}} onClick={()=>imprimirBono(bono)}>🖨️ Informe RRHH</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {(bono.participantes||[]).map((p,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:7,border:"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:p.rol==="Ejecutor"?"rgba(74,222,128,0.12)":p.rol==="Ayudante"?"rgba(96,165,250,0.12)":"rgba(251,191,36,0.12)",color:p.rol==="Ejecutor"?"#4ade80":p.rol==="Ayudante"?"#60a5fa":"#fbbf24",fontWeight:600}}>{p.rol}</span>
                      <span style={{fontSize:13}}>{p.nombre}</span>
                    </div>
                    <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:p.rol==="Ejecutor"?"#4ade80":p.rol==="Ayudante"?"#60a5fa":"#fbbf24"}}>${Number(p.monto).toLocaleString("es-CL")}</span>
                  </div>
                ))}
              </div>
              {bono.obs&&<div style={{fontSize:11,color:"#5a8a6a",marginTop:8,fontStyle:"italic"}}>{bono.obs}</div>}

              {/* Formulario edición inline */}
              {editBonoId===bono.id&&editBonoForm&&(
                <div style={{marginTop:12,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.1)"}}>
                  <div style={{fontSize:12,color:"#c4b5fd",fontWeight:600,marginBottom:10}}>✏️ Editar bono</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>FECHA</label>
                      <input type="date" style={S.input} value={editBonoForm.fecha||""} onChange={e=>setEditBonoForm(p=>({...p,fecha:e.target.value}))}/>
                    </div>
                    <div><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>VALOR MERCADO ($)</label>
                      <input type="number" min={0} style={S.input} value={editBonoForm.valorMercado||""} onChange={e=>{
                        const vm=Number(e.target.value);
                        const ft=Math.round(vm*pctFondo/100);
                        const partic=(editBonoForm.participantes||[]).map(p=>({...p,
                          monto:p.rol==="Ejecutor"?Math.round(ft*pctEjecutor/100):
                                p.rol==="Ayudante"?Math.round(ft*pctAyudante/100):
                                Math.round((ft*pctApoyo/100)/Math.max(1,(editBonoForm.participantes||[]).filter(x=>x.rol==="Apoyo").length))
                        }));
                        setEditBonoForm(p=>({...p,valorMercado:vm,fondoTotal:ft,participantes:partic}));
                      }}/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>DESCRIPCIÓN</label>
                      <input style={S.input} value={editBonoForm.descripcion||""} onChange={e=>setEditBonoForm(p=>({...p,descripcion:e.target.value}))}/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,color:"#6aaa7a",display:"block",marginBottom:3}}>OBSERVACIONES</label>
                      <input style={S.input} value={editBonoForm.obs||""} onChange={e=>setEditBonoForm(p=>({...p,obs:e.target.value}))}/>
                    </div>
                  </div>
                  {/* Editar participantes y montos */}
                  <div style={{fontSize:11,color:"#6aaa7a",marginBottom:6,fontWeight:600}}>Participantes (puedes cambiar nombre y monto):</div>
                  {(editBonoForm.participantes||[]).map((p,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap",background:"rgba(255,255,255,0.03)",borderRadius:6,padding:"6px 10px"}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:p.rol==="Ejecutor"?"rgba(74,222,128,0.12)":p.rol==="Ayudante"?"rgba(96,165,250,0.12)":"rgba(251,191,36,0.12)",color:p.rol==="Ejecutor"?"#4ade80":p.rol==="Ayudante"?"#60a5fa":"#fbbf24",fontWeight:600,flexShrink:0}}>{p.rol}</span>
                      <select style={{...S.input,flex:2,fontSize:12,padding:"4px 8px"}} value={p.trabajadorId||""}
                        onChange={e=>{
                          const nuevoId = String(e.target.value);
                          const nuevoNombre = getNombre(nuevoId);
                          setEditBonoForm(prev=>({...prev,participantes:prev.participantes.map((x,j)=>j===i?{...x,trabajadorId:nuevoId,nombre:nuevoNombre}:x)}));
                        }}>
                        <option value="">Seleccionar...</option>
                        {listaPersonal.map(lp=><option key={lp.id} value={String(lp.id)}>{lp.nombre}</option>)}
                      </select>
                      <input type="number" min={0} style={{...S.input,width:100,fontSize:12,padding:"4px 8px"}} value={p.monto||0}
                        onChange={e=>setEditBonoForm(prev=>({...prev,participantes:prev.participantes.map((x,j)=>j===i?{...x,monto:Number(e.target.value)}:x)}))}/>
                      <span style={{fontSize:11,color:"#5a8a6a",flexShrink:0}}>${Number(p.monto||0).toLocaleString("es-CL")}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button className="btn-p" style={S.btn} onClick={()=>{
                      setBonosMasivos(p=>(Array.isArray(p)?p:Object.values(p||{})).map(b=>b.id===editBonoId?editBonoForm:b));
                      setEditBonoId(null);setEditBonoForm(null);
                    }}>✓ Guardar</button>
                    <button className="btn-g" style={S.btn} onClick={()=>{setEditBonoId(null);setEditBonoForm(null);}}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [zonas, setZonas] = useState(MACROZONAS_BASE);
  const [vista, setVista] = useState("dashboard");
  const [zonaId, setZonaId] = useState(null);
  const [tab, setTab] = useState("elementos");
  const [filtroCat, setFiltroCat] = useState("Todas");
  const [filtroEst, setFiltroEst] = useState("Todos");
  const [busq, setBusq] = useState(null);
  const [editElem, setEditElem] = useState(null);
  const [showAddElem, setShowAddElem] = useState(false);
  const [newElem, setNewElem] = useState({ nombre:"", tipo:"vegetacion" });
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [showPlantacionForm, setShowPlantacionForm] = useState(null);

  const ejecutarDescuentoStock = (descuentos) => {
    if(!descuentos||!descuentos.length) return;
    const nuevoBodegasData = {...bodegasData};
    descuentos.forEach(({bodegaId, itemId, cantidad, nombre, unidad, fecha})=>{
      const bd = nuevoBodegasData[bodegaId]||{items:[],movimientos:[]};
      const items = (bd.items||[]).map(i=>String(i.id)===String(itemId)?{...i,stockActual:Math.max(0,(Number(i.stockActual)||0)-Number(cantidad))}:i);
      const movimientos = [{id:Date.now()+Math.random(),fecha:fecha||new Date().toISOString().slice(0,10),tipo:"salida",cantidad:Number(cantidad),unidad:unidad||"unidad",motivo:"Tarea completada — uso en macrozona",itemId:String(itemId),itemNombre:nombre},...(bd.movimientos||[])].slice(0,200);
      nuevoBodegasData[bodegaId] = {...bd,items,movimientos};
    });
    setBodegasData(nuevoBodegasData);
  };
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().slice(0,10));
  const [tabReporte, setTabReporte] = useState("general");
  const [semanaBase, setSemanaBase] = useState(()=>{
    const d = new Date(); const day = d.getDay(); const diff = (day===0?-6:1-day);
    d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10);
  });

  // ─── AUTENTICACIÓN FIREBASE ──────────────────────────────────────────────────
  const [fbUser,    setFbUser]    = useState(null);
  const [fbRol,     setFbRol]     = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass,  setLoginPass]  = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setFbRol(user ? getRolByEmail(user.email) : null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e && e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
    } catch(err) {
      setLoginError("Email o contraseña incorrectos.");
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => signOut(auth);
  const CUENTAS_DEFAULT = ["Rama Golf","Mantenimiento Jardines","Obras","Insumos Generales","Maquinaria y Equipos","Fitosanitarios","Semillas y Plantas","Uniformes y EPP"];
  const [data,           setData,           dataReady]     = useFirebaseState("data",           initData());
  const [personal,       setPersonalRaw,    personalReady] = useFirebaseState("personal",       PERSONAL_INICIAL);
  const personalArr2 = Array.isArray(personal)?personal:Object.values(personal||{});
  const setPersonal = (fn) => {
    if(typeof fn==="function") {
      const arr = Array.isArray(personal)?personal:Object.values(personal||{});
      setPersonalRaw(fn(arr));
    } else {
      setPersonalRaw(fn);
    }
  };
  const [tareasProg,     setTareasProg,     progReady]     = useFirebaseState("prog",           {});
  const [aplicaciones,   setAplicaciones,   aplReady]      = useFirebaseState("fungicidas",     []);
  const [incidenciasFito,setIncidenciasFito,incidReady]    = useFirebaseState("fung-incid",     []);
  const [comprasData,    setComprasData,    comprasReady]  = useFirebaseState("compras",  {compras:[],cuentas:CUENTAS_DEFAULT});
  const [bodegasData,    setBodegasData,    bodegasReady]  = useFirebaseState("bodegas",  {});
  const [bonosConfig,    setBonosConfig,    bonosReady]    = useFirebaseState("bonos-config", {
    pctFondo:50, pctEjecutor:50, pctAyudante:30, pctApoyo:20, año:new Date().getFullYear()
  });
  const [bonosMasivos,   setBonosMasivos,   bonosMasReady] = useFirebaseState("bonos-masivos", []);

  const appReady = dataReady && personalReady && progReady;

  // PINes siguen en localStorage (son locales por dispositivo)
  const getPines    = () => { try { return JSON.parse(localStorage.getItem("ev2-pines")||"{}"); } catch { return {}; } };
  const setPinRol   = (rol, pin) => { const p=getPines(); p[rol]=pin; localStorage.setItem("ev2-pines", JSON.stringify(p)); };
  const [personalVista, setPersonalVista] = useState("lista");
  const [personalId, setPersonalId] = useState(null);
  const [personalTab, setPersonalTab] = useState("ficha");
  const [showNuevoEvento, setShowNuevoEvento] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({ tipo:"permiso", fecha:"", fechaFin:"", horas:"", descripcion:"", estado:"pendiente" });
  const [nuevoTrabajador, setNuevoTrabajador] = useState({ nombre:"", rut:"", cargo:"", zona:"", telefono:"", email:"", fechaIngreso:"", contrato:"indefinido", foto:"", pin:"" });
  const [vistaWorker, setVistaWorker] = useState(false);
  const [workerLogueado, setWorkerLogueado] = useState(null);
  const [workerPinError, setWorkerPinError] = useState(false);
  const [workerPinInput, setWorkerPinInput] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState("trabajador");
  const rolLogueado = fbRol;
  const esJefa = fbRol === "jefa";
  const esSupervisor = fbRol === "supervisor";
  const esTrabajador = fbRol === "trabajador";

  // ─── FUNGICIDAS ──────────────────────────────────────────────────────────────
  const checkPin = (rol, pin) => { const p=getPines(); return p[rol] && String(p[rol])===String(pin); };

  // updateZona — actualiza una zona en el estado data

  const updateZona = (id, patch) => setData(p => ({ ...p, [id]: { ...p[id], ...patch } }));
  const addHistorial = (id, txt) => setData(p => ({
    ...p, [id]: { ...p[id], historial: [{ txt, fecha: new Date().toLocaleDateString("es-CL"), hora: new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"}) }, ...(p[id]?.historial||[])].slice(0,30) }
  }));

  const getZD = (zid) => data[zid] ?? { estadoGeneral:"bueno", ultimoMant:"", proximoMant:"", notas:"", elementos:{}, elementosCustom:[], tareas:[], historial:[] };
  const getElemFrecs = (zid, eid, tipo, isCustom) => {
    const zdat = getZD(zid);
    if (isCustom) { const ce=(zdat.elementosCustom||[]).find(e=>e.id===eid); if(ce?.frecuencias) return ce.frecuencias; }
    else { if(zdat.elementos?.[eid]?.frecuencias) return zdat.elementos[eid].frecuencias; }
    return TAREAS_DEFAULT[tipo] ? TAREAS_DEFAULT[tipo].map(t=>({...t,id:eid+"_"+t.tarea})) : [];
  };
  const setElemFrecs = (zid, eid, isCustom, frecuencias) => {
    if(isCustom){const arr=[...(data[zid]?.elementosCustom||[])];const i=arr.findIndex(e=>e.id===eid);if(i>=0){arr[i]={...arr[i],frecuencias};setData(p=>({...p,[zid]:{...p[zid],elementosCustom:arr}}));}}
    else{setData(p=>({...p,[zid]:{...p[zid],elementos:{...p[zid]?.elementos,[eid]:{...(p[zid]?.elementos?.[eid]||{}),frecuencias}}}}));}
  };

  const zona = zonas.find(z=>z.id===zonaId);
  const zd = zonaId ? getZD(zonaId) : null;

  const getAllElems = (zid) => {
    const z = zonas.find(x=>x.id===zid);
    const zdat = getZD(zid);
    const base = (z?.elementos||[]).map(e=>({...e,isCustom:false,edData:zdat.elementos?.[e.id]||{estado:"bueno",notas:""}}));
    const custom = (zdat.elementosCustom||[]).map(e=>({...e,isCustom:true,edData:{estado:e.estado||"bueno",notas:e.notas||""}}));
    return [...base,...custom].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));
  };

  const filteredZonas = MACROZONAS_BASE.filter(z=>{
    const matchC=filtroCat==="Todas"||z.categoria===filtroCat;
    const matchE=filtroEst==="Todos"||getZD(z.id).estadoGeneral===filtroEst;
    const matchB=!busq||z.nombre.toLowerCase().includes(busq.toLowerCase());
    return matchC&&matchE&&matchB;
  }).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));

  const stats = {
    total: MACROZONAS_BASE.length,
    bueno: MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral==="bueno").length,
    regular: MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral==="regular").length,
    critico: MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral==="critico").length,
    mantenimiento: MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral==="mantenimiento").length,
  };
  const totalElems = MACROZONAS_BASE.reduce((a,z)=>a+getAllElems(z.id).length,0);
  const elemsOk = MACROZONAS_BASE.reduce((a,z)=>a+getAllElems(z.id).filter(e=>e.edData.estado==="bueno").length,0);

  const addTareaZona = (zid, texto, tareaObj) => {
    if(!texto.trim()) return;
    const nuevaTareaZona = tareaObj || { id:Date.now(), texto, completada:false, fecha:new Date().toLocaleDateString("es-CL"), enviadaProg:true };
    updateZona(zid, { tareas: [...(getZD(zid).tareas||[]), nuevaTareaZona] });
    addHistorial(zid, `Tarea añadida: ${texto}`);
    // 2. Agregar a programación diaria como tarea pendiente (hoy)
    const hoy = new Date().toISOString().slice(0,10);
    const zona = zonas.find(z=>z.id===zid);
    const nuevaProg = {
      id: Date.now() + Math.random(),
      fecha: hoy,
      zona: zona?.nombre || "",
      elemento: "",
      tarea: texto,
      responsable: "",
      estado: "por_designar",
      notas: "",
      auto: false,
      origenZona: true,
    };
    setTareasProg(prev => ({ ...prev, [hoy]: [...(prev[hoy]||[]), nuevaProg] }));
  };
  const toggleTareaZona = (zid, tid) => { const arr=(getZD(zid).tareas||[]).map(t=>t.id===tid?{...t,completada:!t.completada}:t); updateZona(zid,{tareas:arr}); };

  const setElemEstado = (zid,eid,isCustom,estado) => {
    if(isCustom){const arr=[...(data[zid].elementosCustom||[])];const i=arr.findIndex(e=>e.id===eid);if(i>=0){arr[i]={...arr[i],estado};updateZona(zid,{elementosCustom:arr});}}
    else{updateZona(zid,{elementos:{...data[zid]?.elementos,[eid]:{...data[zid]?.elementos?.[eid],estado}}});}
    addHistorial(zid,`Estado "${getElemNombre(zid,eid,isCustom)}" → ${ESTADOS_ELEM[estado]?.label}`);
  };
  const setElemNotas = (zid,eid,isCustom,notas) => {
    if(isCustom){const arr=[...(data[zid].elementosCustom||[])];const i=arr.findIndex(e=>e.id===eid);if(i>=0){arr[i]={...arr[i],notas};updateZona(zid,{elementosCustom:arr});}}
    else{updateZona(zid,{elementos:{...data[zid]?.elementos,[eid]:{...data[zid]?.elementos?.[eid],notas}}});}
  };
  const getElemNombre = (zid,eid,isCustom) => {
    if(isCustom) return (data[zid]?.elementosCustom||[]).find(e=>e.id===eid)?.nombre||"";
    return zonas.find(z=>z.id===zid)?.elementos.find(e=>e.id===eid)?.nombre||"";
  };
  const addCustomElem = (zid,elem) => { const id="c"+Date.now(); const arr=[...(data[zid]?.elementosCustom||[]),{...elem,id,estado:"bueno",notas:""}]; updateZona(zid,{elementosCustom:arr}); addHistorial(zid,`Elemento agregado: ${elem.nombre}`); };
  const removeCustomElem = (zid,eid) => { const arr=(data[zid]?.elementosCustom||[]).filter(e=>e.id!==eid); updateZona(zid,{elementosCustom:arr}); };
  const removeBaseElem = (zid,eid) => { setZonas(prev=>prev.map(z=>z.id===zid?{...z,elementos:z.elementos.filter(e=>e.id!==eid)}:z)); const elems={...data[zid]?.elementos}; delete elems[eid]; updateZona(zid,{elementos:elems}); addHistorial(zid,`Elemento eliminado`); };

  const addTrabajador = (t) => { const id=Date.now(); setPersonal(p=>[...p,{...t,id,eventos:[]}]); };
  const updateTrabajador = (id,patch) => setPersonal(p=>p.map(t=>t.id===id?{...t,...patch}:t));
  const deleteTrabajador = (id) => setPersonal(p=>p.filter(t=>t.id!==id));
  const addEvento = (tid,ev) => setPersonal(p=>p.map(t=>t.id===tid?{...t,eventos:[...(t.eventos||[]),{...ev,id:Date.now()}]}:t));
  const deleteEvento = (tid,eid) => setPersonal(p=>p.map(t=>t.id===tid?{...t,eventos:(t.eventos||[]).filter(e=>e.id!==eid)}:t));
  const getTrabajador = (id) => personal.find(t=>t.id===id);

  const getSugerenciaAI = async () => {
    if(!zona) return;
    setAiLoading(true); setAiText("");
    const elems=getAllElems(zona.id).map(e=>`${e.nombre} (${ESTADOS_ELEM[e.edData.estado]?.label||"Bueno"})`).join(", ");
    const prompt=`Eres experto en mantenimiento de parques y jardines de un club español en Chile. Analiza la macrozona "${zona.nombre}" con estos elementos: ${elems}. Estado general: ${ESTADOS_ZONA[zd?.estadoGeneral]?.label}. Notas: ${zd?.notas||"Ninguna"}. Da recomendaciones específicas de mantenimiento para cada elemento en estado regular o crítico, y un plan de acción priorizado. Responde en español con viñetas y secciones claras.`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":"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","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const json=await res.json();
      setAiText(json.content?.[0]?.text||"Sin respuesta.");
    } catch { setAiText("Error al conectar con el asistente IA."); }
    setAiLoading(false);
  };

  const S = {
    app: { fontFamily:"'Georgia',serif", minHeight:"100vh", background:"linear-gradient(150deg,#0a1f10 0%,#122d1a 50%,#0d2414 100%)", color:"#ede9e0" },
    header: { background:"rgba(0,0,0,0.45)", borderBottom:"1px solid rgba(160,200,140,0.15)" },
    headerTop: { maxWidth:1600, margin:"0 auto", display:"flex", alignItems:"center", padding:"10px 20px", gap:10 },
    headerNav: { background:"rgba(0,0,0,0.3)", borderTop:"1px solid rgba(160,200,140,0.08)", display:"flex", overflowX:"auto", padding:"0 8px", gap:2, scrollbarWidth:"none" },
    logo: { display:"flex", alignItems:"center", gap:10, flex:1 },
    logoCircle: { width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3d7a52,#1e4d30)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
    logoTitle: { fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700 },
    logoSub: { fontSize:9, color:"#6aaa7a", letterSpacing:"1.5px", textTransform:"uppercase" },
    nav: { display:"flex", gap:2 },
    main: { maxWidth:1600, margin:"0 auto", padding:"20px 20px" },
    card: { background:"rgba(255,255,255,0.055)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:14 },
    btn: { cursor:"pointer", border:"none", borderRadius:8, padding:"8px 18px", fontFamily:"'Georgia',serif", fontSize:14, transition:"all .15s" },
    chip: { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:12, fontFamily:"'Georgia',serif" },
    input: { background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:8, color:"#ede9e0", padding:"8px 12px", fontFamily:"'Georgia',serif", fontSize:14, width:"100%", outline:"none" },
  };

  const ESTADOS_ZONA = {
    bueno: { label:"Bueno", color:"#22c55e", bg:"rgba(34,197,94,0.12)" },
    regular: { label:"Regular", color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
    critico: { label:"Crítico", color:"#ef4444", bg:"rgba(239,68,68,0.12)" },
    mantenimiento: { label:"En Mantenimiento", color:"#3b82f6", bg:"rgba(59,130,246,0.12)" },
  };

  const renderElemCard = (e) => {
    const est=ESTADOS_ELEM[e.edData.estado||"bueno"];
    return (
      <div key={e.id} className="ecard" style={{...S.card,padding:14}} onClick={()=>setEditElem(editElem?.eid===e.id?null:{zid:zonaId,eid:e.id,isCustom:e.isCustom})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
          <span style={{fontSize:14,fontWeight:600,flex:1,paddingRight:8}}>{e.nombre}</span>
          <span style={{...S.chip,background:est.bg,color:est.color,border:`1px solid ${est.color}35`,flexShrink:0,fontSize:11}}>{est.label}</span>
        </div>
        {e.edData.notas&&<div style={{fontSize:12,color:"#7aaa80",fontStyle:"italic"}}>{e.edData.notas}</div>}
        {(()=>{
          const frecs=getElemFrecs(zonaId,e.id,e.tipo,e.isCustom);
          const mes=new Date().getMonth()+1;
          const est=[12,1,2].includes(mes)?"verano":[3,4,5].includes(mes)?"otono":[6,7,8].includes(mes)?"invierno":"primavera";
          const tareasActivas=frecs.filter(f=>f[est]&&f[est]!=="noaplica");
          if(tareasActivas.length===0) return null;
          return <div style={{marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
            {tareasActivas.slice(0,3).map(f=>(
              <span key={f.tarea||f.id} style={{fontSize:10,color:"#5a9a7a",background:"rgba(61,122,82,0.12)",padding:"1px 6px",borderRadius:8,border:"1px solid rgba(61,122,82,0.2)"}}>
                {f.tarea}: {f[est]}{f.obs?<span style={{color:"#fde68a",marginLeft:3}}>· {f.obs}</span>:""}
              </span>
            ))}
          </div>;
        })()}
        {editElem?.eid===e.id&&(
          <div style={{marginTop:12,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:12}} onClick={ev=>ev.stopPropagation()}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NOMBRE</label>
                <input style={{...S.input,fontSize:13}} value={editElem.nombreEdit!==undefined?editElem.nombreEdit:e.nombre} onChange={ev=>setEditElem(p=>({...p,nombreEdit:ev.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>CATEGORÍA</label>
                <select style={{...S.input,fontSize:13,width:"auto"}} value={editElem.tipoEdit!==undefined?editElem.tipoEdit:e.tipo} onChange={ev=>setEditElem(p=>({...p,tipoEdit:ev.target.value}))}>
                  {(()=>{const vk=["arboles","arbustos","cesped","herbaceas","trepadoras","rastreras","jardineras","macetas_piso","colgantes"];const ok=["infraestructura","sistemas","pavimentos","mobiliario","bodegas"];return(<><optgroup label="🌿 Vegetación">{vk.map(k=><option key={k} value={k}>{CATEGORIAS_ELEM[k].icon} {CATEGORIAS_ELEM[k].label}</option>)}</optgroup><optgroup label="──────────">{ok.map(k=><option key={k} value={k}>{CATEGORIAS_ELEM[k].icon} {CATEGORIAS_ELEM[k].label}</option>)}</optgroup></>);})()}
                </select>
              </div>
            </div>
            {((editElem.nombreEdit!==undefined&&editElem.nombreEdit!==e.nombre)||(editElem.tipoEdit!==undefined&&editElem.tipoEdit!==e.tipo))&&(
              <div style={{marginBottom:10}}>
                <button className="btn-p" style={{...S.btn,fontSize:12,padding:"5px 14px"}} onClick={()=>{
                  const nn=editElem.nombreEdit!==undefined?editElem.nombreEdit:e.nombre;
                  const nt=editElem.tipoEdit!==undefined?editElem.tipoEdit:e.tipo;
                  if(e.isCustom){const arr=[...(data[zonaId].elementosCustom||[])];const i=arr.findIndex(x=>x.id===e.id);if(i>=0){arr[i]={...arr[i],nombre:nn,tipo:nt};updateZona(zonaId,{elementosCustom:arr});}}
                  else{setZonas(prev=>prev.map(z=>z.id===zonaId?{...z,elementos:z.elementos.map(x=>x.id===e.id?{...x,nombre:nn,tipo:nt}:x)}:z));}
                  addHistorial(zonaId,`Elemento modificado: "${e.nombre}" → "${nn}"`);
                  setEditElem(p=>({...p,nombreEdit:undefined,tipoEdit:undefined}));
                }}>✓ Guardar cambios</button>
              </div>
            )}
            <div style={{marginBottom:8}}>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>ESTADO</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(ESTADOS_ELEM).map(([k,v])=>(
                  <button key={k} style={{...S.btn,padding:"5px 12px",fontSize:12,background:e.edData.estado===k?v.bg:"rgba(255,255,255,0.05)",color:v.color,border:`1px solid ${v.color}40`}} onClick={()=>setElemEstado(zonaId,e.id,e.isCustom,k)}>{v.label}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>NOTAS</label>
              <textarea rows={2} style={{...S.input,resize:"vertical",fontSize:13}} placeholder="Observaciones del elemento..." value={e.edData.notas||""} onChange={ev=>setElemNotas(zonaId,e.id,e.isCustom,ev.target.value)}/>
              <FrecuenciasPanel zid={zonaId} eid={e.id} tipo={e.tipo} isCustom={e.isCustom} S={S} getFrecs={getElemFrecs} setFrecs={setElemFrecs}/>
            </div>
            {(e.isCustom||(zona?.elementos.find(x=>x.id===e.id)))&&(
              <button className="btn-d" style={{...S.btn,fontSize:12,padding:"5px 12px"}} onClick={()=>{e.isCustom?removeCustomElem(zonaId,e.id):removeBaseElem(zonaId,e.id);setEditElem(null);}}>🗑 Eliminar elemento</button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Esperando Firebase Auth ───────────────────────────────────────────────
  if (!authReady) return (
    <div style={{minHeight:"100vh",background:"#0d1f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:48}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#a0d8b0",fontWeight:700}}>Estadio Español</div>
      <div style={{width:40,height:40,border:"3px solid #1a3a22",borderTop:"3px solid #4a9a64",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Login ─────────────────────────────────────────────────────────────────
  if (!fbUser) return (
    <div style={{minHeight:"100vh",background:"#0d1f13",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{background:"#0f2517",border:"1px solid #1e3a22",borderRadius:20,padding:40,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,marginBottom:12}}>🌿</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"#ede9e0",marginBottom:4}}>Estadio Español</div>
          <div style={{fontSize:12,color:"#4a8a5a",letterSpacing:"2px",textTransform:"uppercase"}}>Gestión · Áreas Verdes</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:6,textTransform:"uppercase"}}>Correo electrónico</label>
            <input type="email" autoComplete="email" style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"12px 14px",color:"#ede9e0",fontSize:14,outline:"none"}}
              value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="tu@email.com"/>
          </div>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",letterSpacing:"0.6px",display:"block",marginBottom:6,textTransform:"uppercase"}}>Contraseña</label>
            <input type="password" autoComplete="current-password" style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"12px 14px",color:"#ede9e0",fontSize:14,outline:"none"}}
              value={loginPass} onChange={e=>setLoginPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="••••••••"/>
          </div>
          {loginError&&<div style={{fontSize:13,color:"#fca5a5",background:"rgba(239,68,68,0.1)",borderRadius:8,padding:"8px 12px",textAlign:"center"}}>{loginError}</div>}
          <button onClick={handleLogin} disabled={loginLoading}
            style={{background:"#2d6a3f",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:6,opacity:loginLoading?0.7:1}}>
            {loginLoading?"Ingresando...":"Ingresar →"}
          </button>
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"#2a5a35"}}>Acceso restringido · Personal autorizado</div>
      </div>
    </div>
  );

  // ── Pantalla de carga Firebase ────────────────────────────────────────────
  if (!appReady) return (
    <div style={{minHeight:"100vh",background:"#0d1f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:48}}>🌿</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#a0d8b0",fontWeight:700}}>Estadio Español</div>
      <div style={{fontSize:13,color:"#4a8a5a",marginBottom:8}}>Conectando con Firebase...</div>
      <div style={{width:40,height:40,border:"3px solid #1a3a22",borderTop:"3px solid #4a9a64",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0a1f10}::-webkit-scrollbar-thumb{background:#3d7a52;border-radius:3px}
        .hov:hover{background:rgba(255,255,255,0.09)!important;border-color:rgba(150,210,140,0.3)!important;transform:translateY(-1px)}
        .btn-p{background:#3d7a52;color:#fff}.btn-p:hover{background:#4c9464}
        .btn-g{background:transparent;color:#a0c8a0;border:1px solid rgba(160,200,140,0.25)}.btn-g:hover{background:rgba(160,200,140,0.1)}
        .btn-d{background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.25)}.btn-d:hover{background:rgba(239,68,68,0.25)}
        .tab{cursor:pointer;padding:7px 16px;border-radius:8px;font-family:'Georgia',serif;font-size:14px;transition:all .15s}
        .tab.on{background:#3d7a52;color:#fff}.tab:not(.on){color:#7aaa80}.tab:not(.on):hover{background:rgba(61,122,82,0.2);color:#a0c8a0}
        input:focus,select:focus,textarea:focus{border-color:#3d7a52!important;background:rgba(255,255,255,0.12)!important}
        select option{background:#122d1a;color:#ede9e0}
        .ein{animation:ein .25s ease}@keyframes ein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,0.15);border-top-color:#3d7a52;border-radius:50%;animation:rot .7s linear infinite;display:inline-block}@keyframes rot{to{transform:rotate(360deg)}}
        .ecard{transition:all .2s;cursor:pointer}.ecard:hover{background:rgba(255,255,255,0.09)!important}
        .headerNav::-webkit-scrollbar{display:none}
      `}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.logo}>
            <div style={S.logoCircle}>🌿</div>
            <div>
              <div style={S.logoTitle}>Estadio Español</div>
              <div style={S.logoSub}>Gestión · Áreas Verdes</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <span style={{fontSize:11,color:fbRol==="jefa"?"#86efac":fbRol==="supervisor"?"#93c5fd":"#fcd34d",background:fbRol==="jefa"?"rgba(34,197,94,0.1)":fbRol==="supervisor"?"rgba(59,130,246,0.1)":"rgba(252,211,77,0.1)",padding:"4px 10px",borderRadius:20,border:`1px solid ${fbRol==="jefa"?"rgba(34,197,94,0.25)":fbRol==="supervisor"?"rgba(59,130,246,0.25)":"rgba(252,211,77,0.25)"}`}}>
              {fbRol==="jefa"?"🌿 Jefa AV":fbRol==="supervisor"?"👷 Supervisor":"🌱 Jardinero"}
            </span>
            <button onClick={handleLogout}
              style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#7aaa80",padding:"4px 10px",fontFamily:"'Georgia',serif",fontSize:11,cursor:"pointer"}}>
              Salir
            </button>
          </div>
        </div>
        <div style={S.headerNav} className="headerNav">
          {(fbRol==="jefa"
            ? [["dashboard","📊","Panel"],["zonas","🗺️","Macrozonas"],["reporte","📋","Reporte"],["programacion","📆","Programa"],["fungicidas","🧪","Fungicidas"],["compras","🛒","Compras"],["bodegas","🏪","Bodegas"],["personal","👷","Personal"]]
            : fbRol==="supervisor"
            ? [["dashboard","📊","Panel"],["zonas","🗺️","Macrozonas"],["reporte","📋","Reporte"],["programacion","📆","Programa"],["fungicidas","🧪","Fungicidas"],["bodegas","🏪","Bodegas"],["miturno","🌿","Mi Turno"]]
            : [["miturno","🌿","Mi Turno"]]
          ).map(([v,ico,lbl])=>(
            <button key={v} onClick={()=>{setVista(v);setZonaId(null);setAiText("");}} style={{cursor:"pointer",border:"none",background:"transparent",color:vista===v?"#fff":"#7aaa80",fontFamily:"'Georgia',serif",fontSize:12,padding:"10px 14px",borderBottom:vista===v?"2px solid #4a9a64":"2px solid transparent",transition:"all .15s",whiteSpace:"nowrap",display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              <span style={{fontSize:16}}>{ico}</span>
              <span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={S.main}>
        {/* DASHBOARD */}
        {vista==="dashboard"&&!zonaId&&(
          <div className="ein">
            <div style={{marginBottom:26}}>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:3}}>Panel General</h1>
              <p style={{color:"#6aaa7a",fontSize:15}}>Estado global de las {stats.total} macrozonas</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:28}}>
              {[{label:"Total Zonas",val:stats.total,color:"#c0dab0",icon:"🗺️"},{label:"Buen estado",val:stats.bueno,color:"#22c55e",icon:"✅"},{label:"Estado regular",val:stats.regular,color:"#f59e0b",icon:"⚠️"},{label:"Estado crítico",val:stats.critico,color:"#ef4444",icon:"🔴"},{label:"Total elementos",val:totalElems,color:"#a0c8e0",icon:"📋"},{label:"Elementos OK",val:elemsOk,color:"#22c55e",icon:"🌿"}].map(s=>(
                <div key={s.label} style={{...S.card,padding:"18px 14px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:12,color:"#7aaa80"}}>{s.label}</div>
                </div>
              ))}
            </div>
            {stats.critico>0&&(
              <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:16,marginBottom:22}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:10,color:"#fca5a5"}}>🚨 Zonas en Estado Crítico</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral==="critico").map(z=>(
                    <span key={z.id} onClick={()=>{setZonaId(z.id);setVista("zonas");setTab("elementos");}} style={{...S.chip,background:"rgba(239,68,68,0.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.3)",cursor:"pointer"}}>{z.icono} {z.nombre}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{marginBottom:12,fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700}}>Por Categoría</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
              {[...new Set(MACROZONAS_BASE.map(z=>z.categoria))].map(cat=>{
                const zc=[...MACROZONAS_BASE].filter(z=>z.categoria===cat).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}));
                const ok=zc.filter(z=>getZD(z.id).estadoGeneral==="bueno").length;
                const pct=Math.round((ok/zc.length)*100);
                return (
                  <div key={cat} style={{...S.card,padding:16,cursor:"pointer"}} className="hov" onClick={()=>{setFiltroCat(cat);setVista("zonas");}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{fontSize:14,fontWeight:600}}>{cat}</div>
                      <span style={{fontSize:11,color:"#6aaa7a"}}>{zc.length} zonas</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:7,overflow:"hidden",marginBottom:5}}>
                      <div style={{width:`${pct}%`,height:"100%",background:pct>70?"#22c55e":pct>40?"#f59e0b":"#ef4444",borderRadius:4,transition:"width .5s"}}/>
                    </div>
                    <div style={{fontSize:12,color:"#6aaa7a"}}>{pct}% en buen estado</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ZONAS LIST */}
        {vista==="zonas"&&!zonaId&&(
          <div className="ein">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:20,flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900}}>Macrozonas</h1>
                <p style={{color:"#6aaa7a",fontSize:14}}>{filteredZonas.length} de {MACROZONAS_BASE.length} zonas</p>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
              <input placeholder="🔍 Buscar zona..." value={busq||""} onChange={e=>setBusq(e.target.value)} style={{...S.input,flex:"1 1 180px",maxWidth:260}}/>
              <select value={filtroCat} onChange={e=>setFiltroCat(e.target.value)} style={{...S.input,flex:"1 1 150px",maxWidth:200}}>
                <option value="Todas">Todas las categorías</option>
                {[...new Set(MACROZONAS_BASE.map(z=>z.categoria))].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filtroEst} onChange={e=>setFiltroEst(e.target.value)} style={{...S.input,flex:"1 1 130px",maxWidth:180}}>
                <option value="Todos">Todos los estados</option>
                {Object.entries(ESTADOS_ZONA).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14}}>
              {filteredZonas.map(z=>{
                const d=getZD(z.id); const est=ESTADOS_ZONA[d.estadoGeneral||"bueno"];
                const allElems=getAllElems(z.id);
                const criticos=allElems.filter(e=>e.edData.estado==="critico").length;
                const pendTareas=(d.tareas||[]).filter(t=>!t.completada).length;
                return (
                  <div key={z.id} style={{...S.card,padding:16,cursor:"pointer"}} className="hov" onClick={()=>{setZonaId(z.id);setTab("elementos");setAiText("");}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
                      <span style={{fontSize:30}}>{z.icono}</span>
                      <span style={{...S.chip,background:est.bg,color:est.color,border:`1px solid ${est.color}35`}}>{est.label}</span>
                    </div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:3}}>{z.nombre}</div>
                    <div style={{fontSize:12,color:"#6aaa7a",marginBottom:10}}>{z.categoria}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <span style={{...S.chip,background:"rgba(255,255,255,0.07)",color:"#9abaa0",border:"1px solid rgba(255,255,255,0.1)"}}>📋 {allElems.length} elem.</span>
                      {criticos>0&&<span style={{...S.chip,background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)"}}>🔴 {criticos} crítico{criticos>1?"s":""}</span>}
                      {pendTareas>0&&<span style={{...S.chip,background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)"}}>⚠️ {pendTareas}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETALLE ZONA */}
        {zonaId&&zona&&zd&&(
          <div className="ein">
            <button style={{...S.btn,background:"transparent",color:"#a0c8a0",border:"1px solid rgba(160,200,140,0.22)",marginBottom:20}} onClick={()=>{setZonaId(null);setAiText("");}}>← Volver</button>
            <div style={{...S.card,padding:22,marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <span style={{fontSize:46}}>{zona.icono}</span>
                <div>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:4}}>{zona.nombre}</h2>
                  <span style={{...S.chip,background:"rgba(255,255,255,0.07)",color:"#8abaa0",border:"1px solid rgba(255,255,255,0.1)"}}>📂 {zona.categoria}</span>
                  <span style={{...S.chip,marginLeft:6,background:"rgba(255,255,255,0.07)",color:"#8ab0c0",border:"1px solid rgba(255,255,255,0.1)"}}>📋 {getAllElems(zonaId).length} elementos</span>
                </div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <select value={zd.estadoGeneral||"bueno"} onChange={e=>{updateZona(zonaId,{estadoGeneral:e.target.value});addHistorial(zonaId,`Estado zona → ${ESTADOS_ZONA[e.target.value].label}`);}} style={{...S.input,width:"auto"}}>
                  {Object.entries(ESTADOS_ZONA).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
                <button style={{...S.btn,background:"rgba(61,122,82,0.3)",color:"#a0d8b0",border:"1px solid rgba(61,122,82,0.4)"}} onClick={getSugerenciaAI} disabled={aiLoading}>
                  {aiLoading?<><span className="spin"/> Analizando...</>:"🤖 Sugerencia IA"}
                </button>
              </div>
            </div>
            {(aiLoading||aiText)&&(
              <div style={{background:"rgba(40,100,60,0.15)",border:"1px solid rgba(61,122,82,0.35)",borderRadius:12,padding:18,marginBottom:18}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:10,color:"#90d4a0"}}>🤖 Recomendaciones del Asistente</div>
                {aiLoading?<div style={{color:"#6aaa7a",display:"flex",gap:8,alignItems:"center"}}><span className="spin"/> Generando...</div>
                  :<div style={{fontSize:14,lineHeight:1.7,color:"#c8e0c8",whiteSpace:"pre-wrap"}}>{aiText}</div>}
              </div>
            )}
            <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
              {[["elementos","🌿 Elementos"],["info","📝 Info"],["tareas","✅ Tareas"],["historial","📜 Historial"],...(zona?.categoria==="Bodegas"?[["recursos","🏗️ Recursos"]]:[])].map(([t,l])=>(
                <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>{l}</button>
              ))}
            </div>

            {tab==="elementos"&&(
              <div className="ein">
                {(()=>{
                  const vegeElems=getAllElems(zonaId).filter(e=>CATEGORIAS_ELEM[e.tipo]?.parent==="vegetacion");
                  if(vegeElems.length===0) return null;
                  return (
                    <div style={{marginBottom:26}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,paddingBottom:8,borderBottom:"1px solid rgba(34,197,94,0.2)"}}>
                        <span style={{fontSize:20}}>🌿</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#86efac"}}>Vegetación</span>
                        <span style={{...S.chip,background:"rgba(34,197,94,0.1)",color:"#4ade80",border:"1px solid rgba(34,197,94,0.2)",fontSize:11}}>{vegeElems.length} elementos</span>
                      </div>
                      {VEGETACION_SUBS.map(subKey=>{
                        const subMeta=CATEGORIAS_ELEM[subKey];
                        const subElems=vegeElems.filter(e=>e.tipo===subKey);
                        if(subElems.length===0) return null;
                        // Solo mostrar si al menos un elemento tiene frecuencias definidas
                        const tieneFrecs = subElems.some(e=>{
                          const frecs = getElemFrecs(zonaId, e.id, e.tipo, e.isCustom);
                          return frecs && frecs.length > 0;
                        });
                        if(!tieneFrecs) return null;
                        return (
                          <div key={subKey} style={{marginBottom:18,paddingLeft:14,borderLeft:`2px solid ${subMeta.color}30`}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                              <span style={{fontSize:15}}>{subMeta.icon}</span>
                              <span style={{fontSize:14,fontWeight:600,color:subMeta.color}}>{subMeta.label}</span>
                              <span style={{fontSize:11,color:"#5aaa70"}}>({subElems.length})</span>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
                              {subElems.map(e=>renderElemCard(e))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {OTRAS_CATS.map(tipoKey=>{
                  const tipoMeta=CATEGORIAS_ELEM[tipoKey];
                  const elems=getAllElems(zonaId).filter(e=>e.tipo===tipoKey);
                  if(elems.length===0) return null;
                  const tieneFrecs2=elems.some(e=>{const f=getElemFrecs(zonaId,e.id,e.tipo,e.isCustom);return f&&f.length>0;});
                  if(!tieneFrecs2) return null;
                  return (
                    <div key={tipoKey} style={{marginBottom:22}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{fontSize:18}}>{tipoMeta.icon}</span>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{tipoMeta.label}</span>
                        <span style={{...S.chip,background:"rgba(255,255,255,0.07)",color:"#7aaa80",fontSize:11}}>{elems.length}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
                        {elems.map(e=>renderElemCard(e))}
                      </div>
                    </div>
                  );
                })}
                {getAllElems(zonaId).filter(e=>!CATEGORIAS_ELEM[e.tipo]).length>0&&(
                  <div style={{marginBottom:22}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:12}}>🔹 Otros</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
                      {getAllElems(zonaId).filter(e=>!CATEGORIAS_ELEM[e.tipo]).map(e=>renderElemCard(e))}
                    </div>
                  </div>
                )}
                <div style={{...S.card,padding:18,marginTop:8}}>
                  {!showAddElem?(
                    <button style={{...S.btn,background:"rgba(61,122,82,0.25)",color:"#90d0a0",border:"1px solid rgba(61,122,82,0.35)"}} onClick={()=>setShowAddElem(true)}>➕ Agregar elemento a esta zona</button>
                  ):(
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:14}}>Nuevo Elemento</div>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                        <input placeholder="Nombre del elemento..." value={newElem.nombre} onChange={e=>setNewElem(p=>({...p,nombre:e.target.value}))} style={{...S.input,flex:"2 1 200px"}}/>
                        <select value={newElem.tipo} onChange={e=>setNewElem(p=>({...p,tipo:e.target.value}))} style={{...S.input,flex:"1 1 150px",maxWidth:210}}>
                          {(()=>{const vk=["arboles","arbustos","cesped","herbaceas","trepadoras","rastreras","jardineras","macetas_piso","colgantes"];const ok=["infraestructura","sistemas","pavimentos","mobiliario","bodegas"];return(<><optgroup label="🌿 Vegetación">{vk.map(k=><option key={k} value={k}>{CATEGORIAS_ELEM[k].icon} {CATEGORIAS_ELEM[k].label}</option>)}</optgroup><optgroup label="──────────">{ok.map(k=><option key={k} value={k}>{CATEGORIAS_ELEM[k].icon} {CATEGORIAS_ELEM[k].label}</option>)}</optgroup></>);})()}
                        </select>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn-p" style={S.btn} onClick={()=>{if(newElem.nombre.trim()){addCustomElem(zonaId,newElem);setNewElem({nombre:"",tipo:"arbustos"});setShowAddElem(false);}}}>✓ Agregar</button>
                        <button className="btn-g" style={S.btn} onClick={()=>{setShowAddElem(false);setNewElem({nombre:"",tipo:"arbustos"});}}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab==="info"&&(
              <div className="ein" style={{...S.card,padding:22}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:5,letterSpacing:"0.5px"}}>ÚLTIMO MANTENIMIENTO</label>
                    <input type="date" value={zd.ultimoMant||""} onChange={e=>updateZona(zonaId,{ultimoMant:e.target.value})} style={S.input}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:5,letterSpacing:"0.5px"}}>PRÓXIMO MANTENIMIENTO</label>
                    <input type="date" value={zd.proximoMant||""} onChange={e=>updateZona(zonaId,{proximoMant:e.target.value})} style={S.input}/>
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:5,letterSpacing:"0.5px"}}>NOTAS Y OBSERVACIONES</label>
                  <textarea rows={4} style={{...S.input,resize:"vertical"}} value={zd.notas||""} onChange={e=>updateZona(zonaId,{notas:e.target.value})}/>
                </div>
                <button className="btn-p" style={S.btn} onClick={()=>addHistorial(zonaId,"Información general actualizada")}>💾 Guardar</button>
              </div>
            )}

            {tab==="tareas"&&(
              <div className="ein">
                <div style={{...S.card,padding:16,marginBottom:14}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                    <input placeholder="Escribir tarea..." value={nuevaTarea} onChange={e=>setNuevaTarea(e.target.value)} style={{...S.input,flex:"2 1 180px"}} onKeyDown={e=>{if(e.key==="Enter"){addTareaZona(zonaId,nuevaTarea);setNuevaTarea("");}}}/>
                    <button className="btn-p" style={S.btn} onClick={()=>{addTareaZona(zonaId,nuevaTarea);setNuevaTarea("");}}>➕ Agregar</button>
                  </div>
                  {/* Botones especiales */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button style={{...S.btn,background:"rgba(74,222,128,0.12)",color:"#4ade80",border:"1px solid rgba(74,222,128,0.3)",fontSize:12}}
                      onClick={()=>setShowPlantacionForm(p=>p==="plantar"?null:"plantar")}>
                      🌱 Plantar desde Vivero
                    </button>
                    <button style={{...S.btn,background:"rgba(251,191,36,0.12)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)",fontSize:12}}
                      onClick={()=>setShowPlantacionForm(p=>p==="trasplantar"?null:"trasplantar")}>
                      🔄 Trasplantar a Vivero
                    </button>
                  </div>
                  <div style={{fontSize:11,color:"#5a8a6a",marginTop:8}}>💡 Las tareas aparecen en 📆 Programación como Por designar — listas para asignar responsable y fecha.</div>
                </div>

                {/* Formulario Plantación desde Vivero */}
                {showPlantacionForm==="plantar"&&(
                  <TareaPlantacion
                    modo="plantar" zona={zona} zonaId={zonaId}
                    bodegasData={bodegasData} setBodegasData={setBodegasData}
                    tareasProg={tareasProg} setTareasProg={setTareasProg}
                    personal={personal} S={S}
                    addTareaZona={addTareaZona} addHistorial={addHistorial}
                    onClose={()=>setShowPlantacionForm(null)}
                  />
                )}

                {/* Formulario Trasplante a Vivero */}
                {showPlantacionForm==="trasplantar"&&(
                  <TareaPlantacion
                    modo="trasplantar" zona={zona} zonaId={zonaId}
                    bodegasData={bodegasData} setBodegasData={setBodegasData}
                    tareasProg={tareasProg} setTareasProg={setTareasProg}
                    personal={personal} S={S}
                    addTareaZona={addTareaZona} addHistorial={addHistorial}
                    onClose={()=>setShowPlantacionForm(null)}
                  />
                )}

                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(zd.tareas||[]).length===0&&<div style={{textAlign:"center",color:"#4a8a5a",padding:32,fontSize:15}}>Sin tareas registradas.</div>}
                  {(zd.tareas||[]).map(t=>(
                    <div key={t.id} style={{...S.card,padding:"11px 16px",display:"flex",alignItems:"center",gap:12,opacity:t.completada?0.55:1}}>
                      <input type="checkbox" checked={t.completada} onChange={()=>{
                        toggleTareaZona(zonaId,t.id);
                        addHistorial(zonaId,`Tarea ${t.completada?"reabierta":"completada"}: ${t.texto}`);
                        // Si la tarea tiene descuento de stock pendiente, ejecutarlo al completar
                        if(!t.completada && t.descuentoStock) {
                          ejecutarDescuentoStock(t.descuentoStock);
                        }
                      }} style={{width:17,height:17,accentColor:"#3d7a52",cursor:"pointer",flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:14,textDecoration:t.completada?"line-through":"none"}}>{t.texto}</span>
                        {t.insumos&&t.insumos.length>0&&(
                          <div style={{fontSize:11,color:"#6aaa7a",marginTop:3}}>
                            📦 Insumos: {t.insumos.map(i=>`${i.nombre} (${i.cantidad} ${i.unidad})`).join(", ")}
                            {!t.completada&&<span style={{color:"#fbbf24"}}> — se descontarán al confirmar</span>}
                            {t.completada&&<span style={{color:"#4ade80"}}> ✅ descontados</span>}
                          </div>
                        )}
                      </div>
                      <span style={{fontSize:11,color:"#4a8a5a"}}>{t.fecha}</span>
                      {t.enviadaProg&&<span style={{fontSize:10,color:"#c084fc",background:"rgba(192,132,252,0.1)",padding:"1px 6px",borderRadius:8,border:"1px solid rgba(192,132,252,0.2)",flexShrink:0}}>📆 En prog.</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="historial"&&(
              <div className="ein">
                {(zd.historial||[]).length===0?<div style={{textAlign:"center",color:"#4a8a5a",padding:40,fontSize:15}}>Sin registros aún.</div>:(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {rolLogueado==="jefa"&&(
                      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                        <button onClick={()=>{if(window.confirm("¿Borrar todo el historial de esta zona?"))updateZona(zonaId,{historial:[]});}}
                          style={{...S.btn,background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)",fontSize:12,padding:"5px 12px"}}>
                          🗑 Borrar todo el historial
                        </button>
                      </div>
                    )}
                    {(zd.historial||[]).map((h,i)=>(
                      <div key={i} style={{...S.card,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:16,flexShrink:0}}>📌</span>
                          <span style={{fontSize:14}}>{h.txt}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontSize:11,color:"#4a8a5a",whiteSpace:"nowrap"}}>{h.fecha} {h.hora}</div>
                          {rolLogueado==="jefa"&&(
                            <button onClick={()=>updateZona(zonaId,{historial:(zd.historial||[]).filter((_,j)=>j!==i)})}
                              style={{background:"transparent",border:"none",color:"#7a5a5a",cursor:"pointer",fontSize:13,padding:"2px 4px",flexShrink:0}}>🗑</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* REPORTE */}
        {vista==="reporte"&&(
          <div className="ein">
            <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:4}}>Reporte General</h1>
                <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                  {[["general","📋 Estado Actual"],["semanal","📅 Reporte Semanal"]].map(([t,l])=>(
                    <button key={t} className={`tab${tabReporte===t?" on":""}`} onClick={()=>setTabReporte(t)} style={{fontSize:13}}>{l}</button>
                  ))}
                </div>
                <p style={{color:"#6aaa7a",fontSize:15}}>
                  Estado completo de macrozonas y elementos
                </p>
                {tabReporte==="general" && <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6,flexWrap:"wrap"}}>
                  <label style={{fontSize:12,color:"#6aaa7a"}}>📅 Fecha del reporte:</label>
                  <input type="date" value={fechaReporte} onChange={e=>setFechaReporte(e.target.value)}
                    style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",borderRadius:8,color:"#ede9e0",padding:"5px 10px",fontFamily:"'Georgia',serif",fontSize:13,outline:"none"}}/>
                  <span style={{fontSize:13,color:"#4a8a6a"}}>
                    {new Date(fechaReporte+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
                  </span>
                  {fechaReporte!==new Date().toISOString().slice(0,10)&&(
                    <button onClick={()=>setFechaReporte(new Date().toISOString().slice(0,10))}
                      style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#6aaa7a",padding:"3px 8px",fontFamily:"'Georgia',serif",fontSize:11,cursor:"pointer"}}>
                      Hoy
                    </button>
                  )}
                </div>}
              </div>
              <button
                onClick={()=>{
                  const zonaRows = [...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=>{
                    const d=getZD(z.id);
                    const allE=getAllElems(z.id);
                    const crit=allE.filter(e=>e.edData.estado==="critico").length;
                    const pend=(d.tareas||[]).filter(t=>!t.completada).length;
                    const COLORES={bueno:"#166534",regular:"#92400e",critico:"#991b1b",mantenimiento:"#1e40af"};
                    const LABELS={bueno:"Bueno",regular:"Regular",critico:"Crítico",mantenimiento:"En Mantenimiento"};
                    return "<tr>"
                      +"<td>"+z.icono+" "+z.nombre+"</td>"
                      +"<td>"+z.categoria+"</td>"
                      +"<td style='color:"+COLORES[d.estadoGeneral||"bueno"]+";font-weight:600'>"+LABELS[d.estadoGeneral||"bueno"]+"</td>"
                      +"<td style='text-align:center'>"+allE.length+"</td>"
                      +"<td style='text-align:center;color:"+(crit>0?"#991b1b":"#166534")+"'>"+(crit>0?"🔴 "+crit:"—")+"</td>"
                      +"<td>"+(d.ultimoMant||"—")+"</td>"
                      +"<td>"+(d.proximoMant||"—")+"</td>"
                      +"<td style='text-align:center;color:"+(pend>0?"#92400e":"#166534")+"'>"+(pend>0?"⚠️ "+pend:"✅ 0")+"</td>"
                      +"</tr>";
                  }).join("");
                  const estadoStats = Object.entries({bueno:{label:"Bueno",color:"#166534"},regular:{label:"Regular",color:"#92400e"},critico:{label:"Crítico",color:"#991b1b"},mantenimiento:{label:"En Mant.",color:"#1e40af"}}).map(([k,v])=>{
                    const c=MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral===k).length;
                    return "<span style='color:"+v.color+";font-weight:700'>"+v.label+": "+c+"</span>";
                  }).join(" &nbsp;·&nbsp; ");
                  const html = "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'>"
                    +"<title>Reporte Áreas Verdes — Estadio Español</title>"
                    +"<style>"
                    +"body{font-family:Georgia,serif;color:#1a2e1a;padding:32px;max-width:900px;margin:0 auto}"
                    +"h1{font-size:22px;color:#0d3320;margin-bottom:4px}"
                    +".sub{font-size:13px;color:#4a7a4a;margin-bottom:6px}"
                    +".stats{font-size:13px;margin-bottom:20px;padding:10px 14px;background:#f0f7f0;border-radius:8px}"
                    +"table{width:100%;border-collapse:collapse;font-size:12px}"
                    +"th{text-align:left;padding:8px 10px;background:#1a4a2e;color:#fff;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;white-space:nowrap}"
                    +"tr:nth-child(even){background:#f5fbf5}"
                    +"td{padding:7px 10px;border-bottom:1px solid #dce8dc;vertical-align:top}"
                    +".pie{margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #dce8dc;padding-top:12px;display:flex;justify-content:space-between}"
                    +"@media print{body{padding:16px}}"
                    +"</style></head><body>"
                    +"<h1>📋 Reporte General de Áreas Verdes — Estadio Español</h1>"
                    +"<div class='sub'>Fecha del reporte: "+new Date(fechaReporte+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})+" · Generado: "+new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})+"</div>"
                    +"<div class='stats'>"+estadoStats+" &nbsp;·&nbsp; <b>Total zonas: "+MACROZONAS_BASE.length+"</b></div>"
                    +"<table><thead><tr><th>Zona</th><th>Categoría</th><th>Estado</th><th>Elementos</th><th>Críticos</th><th>Últ. Mant.</th><th>Próx. Mant.</th><th>Tareas Pend.</th></tr></thead><tbody>"+zonaRows+"</tbody></table>"
                    +"<div class='pie'><span>Estadio Español de Las Condes · Departamento de Áreas Verdes</span><span>"+new Date().getFullYear()+"</span></div>"
                    +"</body></html>";
                  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.target = "_blank"; a.click();
                  setTimeout(()=>URL.revokeObjectURL(url), 10000);
                }}
                style={{...S.btn,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",fontSize:13,flexShrink:0}}
              >🖨️ Imprimir Reporte</button>
            </div>
            {tabReporte==="semanal" && (
              <ReporteSemanal S={S} tareasProg={tareasProg} semanaBase={semanaBase} setSemanaBase={setSemanaBase} MACROZONAS_BASE={MACROZONAS_BASE} personal={personal} incidenciasFito={incidenciasFito}/>
            )}
            {tabReporte==="general" && <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:18,marginBottom:26}}>
              <div style={{...S.card,padding:20}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:14}}>📊 Zonas por Estado</div>
                {Object.entries(ESTADOS_ZONA).map(([k,v])=>{
                  const c=MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral===k).length;
                  const pct=Math.round((c/MACROZONAS_BASE.length)*100);
                  return (
                    <div key={k} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:13}}>
                        <span style={{color:v.color}}>{v.label}</span>
                        <span style={{color:"#6aaa7a"}}>{c} ({pct}%)</span>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:7,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:v.color,borderRadius:4}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{...S.card,padding:20}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,marginBottom:14}}>📅 Próximos Mantenimientos</div>
                {MACROZONAS_BASE.filter(z=>getZD(z.id).proximoMant).sort((a,b)=>new Date(getZD(a.id).proximoMant)-new Date(getZD(b.id).proximoMant)).slice(0,8).map(z=>(
                  <div key={z.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{fontSize:14}}>{z.icono} {z.nombre}</span>
                    <span style={{fontSize:12,color:"#5a8a6a"}}>{getZD(z.id).proximoMant}</span>
                  </div>
                ))}
                {MACROZONAS_BASE.filter(z=>getZD(z.id).proximoMant).length===0&&<div style={{color:"#4a7a5a",fontSize:13,textAlign:"center",padding:16}}>Sin fechas programadas</div>}
              </div>
            </div>
            {/* Detalle actividad del día del reporte */}
            {(()=>{
              const tareasDelDia = tareasProg[fechaReporte]||[];
              // Agrupar por zona, solo zonas con actividad
              const zonaMap = {};
              tareasDelDia.forEach(t=>{
                if(!t.zona) return;
                if(!zonaMap[t.zona]) zonaMap[t.zona]=[];
                zonaMap[t.zona].push(t);
              });
              const zonasConActividad = Object.entries(zonaMap).sort(([a],[b])=>a.localeCompare(b,"es",{sensitivity:"base"}));

              const EC={hecha:{color:"#22c55e",icon:"✅",label:"Hecha"},completada:{color:"#22c55e",icon:"✅",label:"Hecha"},no_pudo:{color:"#ef4444",icon:"🔴",label:"No se pudo"},haciendose:{color:"#3b82f6",icon:"🔵",label:"Haciéndose"},en_curso:{color:"#3b82f6",icon:"🔵",label:"En curso"},pendiente:{color:"#f59e0b",icon:"🟡",label:"Pendiente"},por_designar:{color:"#94a3b8",icon:"⬜",label:"Por designar"},cancelada:{color:"#ef4444",icon:"❌",label:"Cancelada"}};

              return (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>
                      Actividad del {new Date(fechaReporte+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"})}
                    </div>
                    {zonasConActividad.length>0 && (
                      <span style={{...S.chip,background:"rgba(255,255,255,0.07)",color:"#7aaa80",border:"1px solid rgba(255,255,255,0.1)"}}>
                        {zonasConActividad.length} zona{zonasConActividad.length!==1?"s":""} · {tareasDelDia.length} tarea{tareasDelDia.length!==1?"s":""}
                      </span>
                    )}
                  </div>

                  {zonasConActividad.length===0 ? (
                    <div style={{...S.card,padding:32,textAlign:"center",color:"#4a8a5a"}}>
                      <div style={{fontSize:32,marginBottom:8}}>📋</div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,marginBottom:6}}>Sin actividad registrada para esta fecha</div>
                      <div style={{fontSize:13}}>Las tareas programadas en 📆 Programación aparecerán aquí.</div>
                    </div>
                  ) : (
                    <ActividadDelDia zonas={zonasConActividad} MACROZONAS_BASE={MACROZONAS_BASE} S={S} EC={EC} tareasDelDia={tareasDelDia} />
                  )}
                </>
              );
            })()}
            </>}
          </div>
        )}

        {/* PROGRAMACIÓN */}
        {vista==="programacion"&&(
          <ProgramacionDiaria key="prog" S={S} zonas={zonas} data={data} personal={personal} getZD={getZD} getAllElems={getAllElems} MACROZONAS_BASE={MACROZONAS_BASE} tareas={tareasProg} setTareas={setTareasProg}
            tareasZonaHoy={(tareasProg[new Date().toISOString().slice(0,10)]||[]).filter(t=>t.origenZona&&t.estado==="por_designar").length}
            esJefa={rolLogueado==="jefa"}
          />
        )}

        {/* MI TURNO */}
        {vista==="miturno"&&(
          <div className="ein">
            {/* ── Logged in as supervisor ── */}
            {rolLogueado==="supervisor"&&(
              <VistaDesignacion
                S={S}
                tareasProg={tareasProg}
                setTareasProg={setTareasProg}
                personal={personal}
                MACROZONAS_BASE={MACROZONAS_BASE}
                onSalir={()=>{setRolLogueado(null);setWorkerPinInput("");setWorkerLogueado(null);}}
              />
            )}

            {/* ── Logged in as worker ── */}
            {rolLogueado==="trabajador"&&vistaWorker&&(
              <div>
                <button className="btn-g" style={{...S.btn,marginBottom:16}} onClick={()=>{setVistaWorker(false);setWorkerPinInput("");setWorkerLogueado(null);setRolLogueado(null);}}>← Salir</button>
                <VistaWorker
                  trabajador={personal.find(x=>String(x.id)===String(workerLogueado))}
                  fecha={new Date().toISOString().slice(0,10)}
                  tareas={tareasProg}
                  S={S}
                  MACROZONAS_BASE={MACROZONAS_BASE}
                  onUpdateTarea={(fecha,tid,patch)=>{
                    setTareasProg(prev=>{
                      const updated={...prev,[fecha]:(prev[fecha]||[]).map(t=>t.id===tid?{...t,...patch}:t)};
                      if(patch.estado==="no_pudo"||patch.estado==="hecha"||patch.estado==="haciendose"){
                        const tarea=(prev[fecha]||[]).find(t=>t.id===tid);
                        if(tarea){const z=MACROZONAS_BASE.find(z=>z.nombre===tarea.zona);if(z){const ico=patch.estado==="no_pudo"?"🔴":patch.estado==="hecha"?"✅":"🔵";addHistorial(z.id,`${ico} [${tarea.responsable||"?"}] ${tarea.tarea}${tarea.elemento?" — "+tarea.elemento:""}${patch.estado==="no_pudo"&&patch.notaWorker?": "+patch.notaWorker:""}`);}}
                      }
                      return updated;
                    });
                  }}
                  getFrecs={(zid,_eid,_tipo,_isCustom,nombreElem)=>{
                    const zdat=getZD(zid); const zona=zonas.find(z=>z.id===zid); if(!zona) return null;
                    const elem=zona.elementos.find(e=>e.nombre===nombreElem); if(!elem) return null;
                    const frecs=zdat.elementos?.[elem.id]?.frecuencias||(TAREAS_DEFAULT[elem.tipo]||[]).map(t=>({...t}));
                    return {frecs,eid:elem.id,isCustom:false};
                  }}
                  onSetFrecs={setElemFrecs}
                  onAddTarea={(nuevaTarea)=>{
                    const hoyKey=nuevaTarea.fecha||new Date().toISOString().slice(0,10);
                    setTareasProg(prev=>({...prev,[hoyKey]:[...(prev[hoyKey]||[]),nuevaTarea]}));
                    const z=MACROZONAS_BASE.find(z=>z.nombre===nuevaTarea.zona);
                    if(z) addHistorial(z.id,`🆕 [${nuevaTarea.responsable}] Tarea emergente: ${nuevaTarea.tarea}`);
                  }}
                />
              </div>
            )}

            {/* ── Login screen ── */}
            {!rolLogueado&&(
              <div style={{maxWidth:380,margin:"50px auto 0"}}>
                <div style={{textAlign:"center",marginBottom:28}}>
                  <div style={{fontSize:48,marginBottom:12}}>🌿</div>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:6}}>Acceso por Rol</h2>
                  <p style={{color:"#6aaa7a",fontSize:14}}>Selecciona tu rol e ingresa tu PIN</p>
                </div>

                {/* Role selector */}
                <div style={{display:"flex",gap:8,marginBottom:20,justifyContent:"center"}}>
                  {[
                    {key:"trabajador",label:"👷 Trabajador",color:"#3d7a52"},
                    {key:"supervisor",label:"🎯 Supervisor",color:"#2563eb"},
                    {key:"jefa",     label:"🌿 Jefa AV",   color:"#7c3aed"},
                  ].map(r=>(
                    <button key={r.key} onClick={()=>{setRolSeleccionado(r.key);setWorkerPinInput("");setWorkerPinError(false);setWorkerLogueado(null);}}
                      style={{flex:1,cursor:"pointer",border:`2px solid ${rolSeleccionado===r.key?r.color:"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"10px 6px",background:rolSeleccionado===r.key?`${r.color}22`:"rgba(255,255,255,0.04)",color:rolSeleccionado===r.key?"#fff":"#7aaa80",fontFamily:"'Georgia',serif",fontSize:12,transition:"all .15s"}}>
                      {r.label}
                    </button>
                  ))}
                </div>

                <div style={{background:"rgba(255,255,255,0.055)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:14,padding:24}}>
                  {/* Worker: select from list */}
                  {rolSeleccionado==="trabajador"&&(
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:5,letterSpacing:"0.5px"}}>TRABAJADOR</label>
                      <select style={S.input} value={workerLogueado||""} onChange={e=>{setWorkerLogueado(e.target.value);setWorkerPinError(false);setWorkerPinInput("");}}>
                        <option value="">Seleccionar...</option>
                        {personal.filter(p=>p.cargo!=="Jefa de Áreas Verdes"&&p.cargo!=="Supervisor de Áreas Verdes")
                          .sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"}))
                          .map(t=><option key={t.id} value={t.id}>{t.nombre} {t.cargo?" · "+t.cargo:""}</option>)}
                      </select>
                    </div>
                  )}

                  <div style={{marginBottom:18}}>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:5,letterSpacing:"0.5px"}}>PIN (4 DÍGITOS)</label>
                    <input type="password" maxLength={4} placeholder="••••"
                      style={{...S.input,fontSize:22,letterSpacing:"0.6em",textAlign:"center"}}
                      value={workerPinInput}
                      onChange={e=>{setWorkerPinInput(e.target.value);setWorkerPinError(false);}}
                      onKeyDown={e=>{
                        if(e.key!=="Enter") return;
                        if(rolSeleccionado==="trabajador"){
                          const t=personal.find(x=>String(x.id)===String(workerLogueado));
                          if(t&&String(t.pin)===String(workerPinInput)){setVistaWorker(true);setRolLogueado("trabajador");setWorkerPinError(false);}
                          else setWorkerPinError(true);
                        } else {
                          if(checkPin(rolSeleccionado,workerPinInput)){setRolLogueado(rolSeleccionado);setWorkerPinError(false);}
                          else setWorkerPinError(true);
                        }
                      }}
                    />
                    {workerPinError&&<div style={{color:"#fca5a5",fontSize:12,marginTop:6,textAlign:"center"}}>PIN incorrecto. Intenta nuevamente.</div>}
                    {rolSeleccionado==="trabajador"&&workerLogueado&&!personal.find(x=>String(x.id)===String(workerLogueado))?.pin&&(
                      <div style={{color:"#f59e0b",fontSize:11,marginTop:6,textAlign:"center"}}>⚠️ Sin PIN configurado. Configúralo en la ficha.</div>
                    )}
                    {(rolSeleccionado==="supervisor"||rolSeleccionado==="jefa")&&!getPines()[rolSeleccionado]&&(
                      <div style={{color:"#f59e0b",fontSize:11,marginTop:6,textAlign:"center"}}>⚠️ PIN no configurado aún.</div>
                    )}
                  </div>

                  <button style={{...S.btn,width:"100%",padding:"12px",fontSize:15,background:"#3d7a52",color:"#fff",cursor:"pointer"}}
                    onClick={()=>{
                      if(rolSeleccionado==="trabajador"){
                        const t=personal.find(x=>String(x.id)===String(workerLogueado));
                        if(t&&String(t.pin)===String(workerPinInput)){setVistaWorker(true);setRolLogueado("trabajador");setWorkerPinError(false);}
                        else setWorkerPinError(true);
                      } else {
                        if(checkPin(rolSeleccionado,workerPinInput)){setRolLogueado(rolSeleccionado);setWorkerPinError(false);}
                        else setWorkerPinError(true);
                      }
                    }}>
                    Ingresar →
                  </button>
                </div>

                {/* PIN config for jefa/supervisor roles */}
                {/* Configuración de PINs — siempre disponible en modo setup */}
                <PinConfig getPines={getPines} setPinRol={setPinRol} S={S}/>
              </div>
            )}

            {/* ── Jefa logged in → redirect to main app ── */}
            {rolLogueado==="jefa"&&(
              <div className="ein" style={{textAlign:"center",paddingTop:40}}>
                <div style={{fontSize:48,marginBottom:16}}>🌿</div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,marginBottom:8}}>Bienvenida, Jefa de Áreas Verdes</h2>
                <p style={{color:"#6aaa7a",fontSize:14,marginBottom:24}}>Usa el menú de navegación para acceder a todas las secciones.</p>
                <button onClick={()=>setVista("programacion")} style={{...S.btn,background:"#3d7a52",color:"#fff",fontSize:15,padding:"12px 28px"}}>📆 Ir a Programación →</button>
                <div style={{marginTop:12}}>
                  <button onClick={()=>{setRolLogueado(null);setWorkerPinInput("");}} style={{...S.btn,background:"transparent",color:"#6aaa7a",border:"1px solid rgba(255,255,255,0.1)",fontSize:13}}>← Cerrar sesión</button>

                <div style={{maxWidth:380,margin:"24px auto 0"}}>
                  <PinConfig getPines={getPines} setPinRol={setPinRol} S={S}/>
                </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* FUNGICIDAS */}
        {vista==="fungicidas"&&(
          <PanelFungicidas S={S} aplicaciones={aplicaciones} setAplicaciones={setAplicaciones} personal={personal} esJefa={rolLogueado==="jefa"||rolLogueado==="supervisor"} tareasProg={tareasProg} setTareasProg={setTareasProg} incidenciasFito={incidenciasFito} setIncidenciasFito={setIncidenciasFito} />
        )}

        {/* COMPRAS */}
        {vista==="compras"&&(
          <PanelCompras S={S} comprasData={comprasData} setComprasData={setComprasData} personal={personal} esJefa={rolLogueado==="jefa"||rolLogueado==="supervisor"} data={data} updateZona={updateZona} MACROZONAS_BASE={MACROZONAS_BASE} bodegasData={bodegasData} setBodegasData={setBodegasData} />
        )}

        {/* BODEGAS */}
        {vista==="bodegas"&&(
          <PanelBodegas S={S} bodegasData={bodegasData} setBodegasData={setBodegasData} personal={personal} esJefa={rolLogueado==="jefa"||rolLogueado==="supervisor"} tareasProg={tareasProg} setTareasProg={setTareasProg} compras={comprasData?.compras||[]} />
        )}

        {/* PERSONAL */}
        {vista==="personal"&&personalVista==="lista"&&(
          <div className="ein">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:22,flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:3}}>Personal</h1>
                <p style={{color:"#6aaa7a",fontSize:14}}>{personal.length} trabajador{personal.length!==1?"es":""} registrado{personal.length!==1?"s":""}</p>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button style={{...S.btn,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}} onClick={()=>setPersonalVista("informe-rrhh")}>📄 Informe RRHH</button>
                <button style={{...S.btn,background:"rgba(196,181,253,0.15)",color:"#c4b5fd",border:"1px solid rgba(196,181,253,0.3)"}} onClick={()=>setPersonalVista("bono-masivo")}>💰 Bono por Tarea</button>
                <button className="btn-p" style={S.btn} onClick={()=>setPersonalVista("nuevo")}>➕ Nuevo Trabajador</button>
              </div>
            </div>
            {personal.length===0&&(
              <div style={{...S.card,padding:48,textAlign:"center",color:"#4a8a5a"}}>
                <div style={{fontSize:48,marginBottom:12}}>👷</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:8}}>Sin personal registrado</div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
              {personal.sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(t=>{
                const eventosAbiertos=(t.eventos||[]).filter(e=>e.estado==="pendiente").length;
                const vacDias=(t.eventos||[]).filter(e=>e.tipo==="vacaciones"&&e.estado==="aprobado").reduce((a,e)=>{if(!e.fecha||!e.fechaFin) return a;return a+Math.round((new Date(e.fechaFin)-new Date(e.fecha))/(1000*60*60*24))+1;},0);
                const heHoras=(t.eventos||[]).filter(e=>e.tipo==="horaExtra"&&e.estado==="aprobado").reduce((a,e)=>a+Number(e.horas||0),0);
                return (
                  <div key={t.id} className="hov" style={{...S.card,padding:18,cursor:"pointer"}} onClick={()=>{setPersonalId(t.id);setPersonalVista("ficha");setPersonalTab("ficha");}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#3d7a52,#1a4a2e)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{t.nombre?t.nombre[0].toUpperCase():"?"}</div>
                      <div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{t.nombre}</div>
                        <div style={{fontSize:12,color:"#6aaa7a"}}>{t.cargo||"Sin cargo"}</div>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:"#5a8a6a",marginBottom:10}}>{t.zona||"Sin zona asignada"}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{...S.chip,background:"rgba(255,255,255,0.07)",color:"#8ab0c0",border:"1px solid rgba(255,255,255,0.1)",fontSize:11}}>📄 {t.contrato||"—"}</span>
                      {eventosAbiertos>0&&<span style={{...S.chip,background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",fontSize:11}}>⏳ {eventosAbiertos} pend.</span>}
                      {vacDias>0&&<span style={{...S.chip,background:"rgba(59,130,246,0.12)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.25)",fontSize:11}}>🏖️ {vacDias}d</span>}
                      {heHoras>0&&<span style={{...S.chip,background:"rgba(34,197,94,0.12)",color:"#86efac",border:"1px solid rgba(34,197,94,0.25)",fontSize:11}}>⏰ {heHoras}h</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vista==="personal"&&personalVista==="informe-rrhh"&&(
          <InformeRRHH S={S} personal={personal} bonosMasivos={bonosMasivos} setBonosMasivos={setBonosMasivos} setPersonal={setPersonal} onVolver={()=>setPersonalVista("lista")}/>
        )}

        {vista==="personal"&&personalVista==="bono-masivo"&&(
          <BonoMasivo
            S={S} personal={personal} bonosConfig={bonosConfig} setBonosConfig={setBonosConfig}
            bonosMasivos={bonosMasivos} setBonosMasivos={setBonosMasivos}
            setPersonal={setPersonal}
            onVolver={()=>setPersonalVista("lista")}
            esJefa={rolLogueado==="jefa"}
          />
        )}

        {vista==="personal"&&personalVista==="nuevo"&&(
          <div className="ein">
            <button className="btn-g" style={S.btn} onClick={()=>setPersonalVista("lista")}>← Volver</button>
            <div style={{...S.card,padding:24,marginTop:16}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,marginBottom:20}}>Nuevo Trabajador</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                {[["Nombre completo","nombre","text"],["RUT","rut","text"],["Teléfono","telefono","tel"],["Email","email","email"],["Fecha de ingreso","fechaIngreso","date"]].map(([lbl,key,type])=>(
                  <div key={key}>
                    <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>{lbl.toUpperCase()}</label>
                    <input type={type} style={S.input} value={nuevoTrabajador[key]||""} onChange={e=>setNuevoTrabajador(p=>({...p,[key]:e.target.value}))}/>
                  </div>
                ))}
                {/* PIN en fila propia */}
                <div style={{gridColumn:"1/-1",background:"rgba(61,122,82,0.08)",border:"1px solid rgba(61,122,82,0.2)",borderRadius:10,padding:"12px 14px"}}>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:6,letterSpacing:"0.5px"}}>🔐 PIN DE ACCESO (4 DÍGITOS)</label>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <input type="password" maxLength={4} placeholder="••••"
                      style={{...S.input,maxWidth:140,fontSize:20,letterSpacing:"0.5em",textAlign:"center"}}
                      value={nuevoTrabajador.pin||""} onChange={e=>setNuevoTrabajador(p=>({...p,pin:e.target.value}))}/>
                    <div style={{fontSize:12,color:"#5a8a6a"}}>El trabajador usa este PIN para acceder a sus tareas en 🌿 Mi Turno</div>
                  </div>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>CARGO</label>
                  <select style={S.input} value={nuevoTrabajador.cargo} onChange={e=>setNuevoTrabajador(p=>({...p,cargo:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {["Jefa de Áreas Verdes","Supervisor de Áreas Verdes","Jardinero","Jardinero Senior","Técnico en Riego","Operador Maquinaria","Capataz","Administrativo","Otro"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>MACROZONA ASIGNADA</label>
                  <select style={S.input} value={nuevoTrabajador.zona} onChange={e=>setNuevoTrabajador(p=>({...p,zona:e.target.value}))}>
                    <option value="">Sin zona</option>
                    {[...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=><option key={z.id} value={z.nombre}>{z.icono} {z.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TIPO DE CONTRATO</label>
                  <select style={S.input} value={nuevoTrabajador.contrato} onChange={e=>setNuevoTrabajador(p=>({...p,contrato:e.target.value}))}>
                    {["indefinido","plazo fijo","honorarios","part-time"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>OBSERVACIONES</label>
                <textarea rows={3} style={{...S.input,resize:"vertical"}} value={nuevoTrabajador.notas||""} onChange={e=>setNuevoTrabajador(p=>({...p,notas:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn-p" style={S.btn} onClick={()=>{
                  if(!nuevoTrabajador.nombre.trim()) return;
                  addTrabajador(nuevoTrabajador);
                  setNuevoTrabajador({nombre:"",rut:"",cargo:"",zona:"",telefono:"",email:"",fechaIngreso:"",contrato:"indefinido",notas:"",pin:""});
                  setPersonalVista("lista");
                }}>✓ Guardar Trabajador</button>
                <button className="btn-g" style={S.btn} onClick={()=>setPersonalVista("lista")}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {vista==="personal"&&personalVista==="ficha"&&personalId&&getTrabajador(personalId)&&(
          <FichaTrabajador
            t={getTrabajador(personalId)}
            S={S}
            onVolver={()=>{setPersonalVista("lista");setPersonalId(null);}}
            onDelete={()=>{deleteTrabajador(personalId);setPersonalVista("lista");setPersonalId(null);}}
            onUpdate={(patch)=>updateTrabajador(personalId,patch)}
            onAddEvento={(ev)=>addEvento(personalId,ev)}
            onDeleteEvento={(eid)=>deleteEvento(personalId,eid)}
            onUpdateEvento={(eid,patch)=>setPersonal(p=>p.map(t=>t.id===personalId?{...t,eventos:(t.eventos||[]).map(e=>e.id===eid?{...e,...patch}:e)}:t))}
          />
        )}
      </div>
    </div>
  );
}
