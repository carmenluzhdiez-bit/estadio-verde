import { useState, useEffect } from "react";
import * as React from "react";

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
  { value:"diario",      label:"Diario",           dias:1  },
  { value:"cada2dias",   label:"Cada 2 días",       dias:2  },
  { value:"cada3dias",   label:"Cada 3 días",       dias:3  },
  { value:"cada5dias",   label:"Cada 5 días",       dias:5  },
  { value:"semanal",     label:"Semanal",           dias:7  },
  { value:"quincenal",   label:"Quincenal",         dias:15 },
  { value:"mensual",     label:"Mensual",           dias:30 },
  { value:"bimestral",   label:"Bimestral",         dias:60 },
  { value:"noaplica",    label:"No aplica",         dias:0  },
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
  {
    id: 39, nombre: "Bodega", categoria: "Bodegas", icono: "🏚️",
    elementos: [
      { id: "e1", nombre: "Bodega de materiales y herramientas", tipo: "bodegas" },
      { id: "e2", nombre: "Bodega de riego", tipo: "bodegas" },
      { id: "e3", nombre: "Bodega de maquinaria", tipo: "bodegas" },
      { id: "e4", nombre: "Guardería de plantas", tipo: "bodegas" },
      { id: "e5", nombre: "Bodega de sustratos y fertilizantes", tipo: "bodegas" },
      { id: "e6", nombre: "Bodega de pesticidas", tipo: "bodegas" },
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
  try {
    const saved = localStorage.getItem("ev2-data");
    if (saved) return JSON.parse(saved);
  } catch {}
  // Build default: one record per zona with elements
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
function ReporteSemanal({ S, tareasProg, semanaBase, setSemanaBase, MACROZONAS_BASE, personal }) {

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

          {/* Incidencias */}
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
        </>
      )}
    </div>
  );
}

// ─── HISTORIAL DE PROGRAMACIÓN ───────────────────────────────────────────────
function HistorialProg({ tareas, MACROZONAS_BASE, S }) {
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
    const FREC_ORDER = ["diario","cada2dias","cada3dias","cada5dias","semanal","quincenal","mensual","bimestral","noaplica"];
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

function ProgramacionDiaria({ S, zonas, data, personal, getZD, getAllElems, MACROZONAS_BASE, tareas, setTareas, tareasZonaHoy=0 }) {
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
        const zdatElem = zdat.elementos?.[e.id];
        const frecs = zdatElem?.frecuencias || (TAREAS_DEFAULT[e.tipo] ? TAREAS_DEFAULT[e.tipo].map(t=>({...t})) : []);
        frecs.forEach(f => {
          const frecVal = f[est];
          if(!frecVal || frecVal==="noaplica") return;
          const key = z.nombre+"_"+e.nombre+"_"+f.tarea;
          if(existentes.includes(key)) return;
          propuestas.push({ id: Date.now()+Math.random(), fecha, zona:z.nombre, elemento:e.nombre, tarea:f.tarea, responsable:"", estado:"por_designar", notas:"", frecuencia:frecVal, estacion:est, auto:true });
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
        <HistorialProg tareas={tareas} MACROZONAS_BASE={MACROZONAS_BASE} S={S}/>
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

// ─── PANEL DE FRECUENCIAS DE MANTENCIÓN ─────────────────────────────────────
function FrecuenciasPanel({ zid, eid, tipo, isCustom, S, getFrecs, setFrecs }) {
  const ESTACIONES_LIST = ["verano","otono","invierno","primavera"];
  const frecuencias = getFrecs(zid, eid, tipo, isCustom);
  const updateFila = (idx, campo, valor) => { const arr = frecuencias.map((f,i)=>i===idx?{...f,[campo]:valor}:f); setFrecs(zid,eid,isCustom,arr); };
  const addFila = () => { setFrecs(zid,eid,isCustom,[...frecuencias,{id:eid+"_"+Date.now(),tarea:"",verano:"semanal",otono:"semanal",invierno:"noaplica",primavera:"semanal"}]); };
  const removeFila = (idx) => { setFrecs(zid,eid,isCustom,frecuencias.filter((_,i)=>i!==idx)); };
  return (
    <div style={{marginTop:14,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:14}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,marginBottom:10,color:"#a0d8b0"}}>📅 Frecuencias de Mantención</div>
      <div style={{overflowX:"auto",marginBottom:10}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,fontFamily:"'Georgia',serif",minWidth:420}}>
          <thead>
            <tr style={{background:"rgba(61,122,82,0.15)"}}>
              <th style={{padding:"7px 8px",textAlign:"left",color:"#6aaa7a",fontWeight:600,fontSize:11,letterSpacing:"0.5px",minWidth:120}}>TAREA</th>
              {ESTACIONES_LIST.map(est=>(
                <th key={est} style={{padding:"7px 8px",textAlign:"center",color:ESTACIONES[est].color,fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{ESTACIONES[est].icon} {ESTACIONES[est].label}</th>
              ))}
              <th style={{padding:"7px 4px",width:24}}></th>
            </tr>
          </thead>
          <tbody>
            {frecuencias.length===0&&(<tr><td colSpan={6} style={{padding:"16px 8px",textAlign:"center",color:"#4a8a5a",fontSize:12}}>Sin tareas. Agrega una abajo.</td></tr>)}
            {frecuencias.map((f,idx)=>(
              <tr key={idx} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <td style={{padding:"5px 6px"}}>
                  <input style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#ede9e0",padding:"4px 7px",fontFamily:"'Georgia',serif",fontSize:12,width:"100%",outline:"none"}} value={f.tarea} onChange={e=>updateFila(idx,"tarea",e.target.value)} placeholder="Nombre tarea..."/>
                </td>
                {ESTACIONES_LIST.map(est=>{
                  const esNA=f[est]==="noaplica";
                  return (
                    <td key={est} style={{padding:"5px 6px",textAlign:"center"}}>
                      <select value={f[est]||"noaplica"} onChange={e=>updateFila(idx,est,e.target.value)}
                        style={{background:esNA?"rgba(255,255,255,0.04)":`${ESTACIONES[est].color}18`,border:`1px solid ${esNA?"rgba(255,255,255,0.08)":ESTACIONES[est].color+"40"}`,borderRadius:6,color:esNA?"#4a7a6a":ESTACIONES[est].color,padding:"4px 5px",fontFamily:"'Georgia',serif",fontSize:11,outline:"none",cursor:"pointer",width:"100%"}}>
                        {FRECUENCIAS.map(fr=><option key={fr.value} value={fr.value}>{fr.label}</option>)}
                      </select>
                    </td>
                  );
                })}
                <td style={{padding:"5px 4px",textAlign:"center"}}>
                  <button onClick={()=>removeFila(idx)} style={{background:"transparent",border:"none",color:"#7a5a5a",cursor:"pointer",fontSize:14,padding:"2px 4px",borderRadius:4}}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addFila} style={{background:"rgba(61,122,82,0.2)",border:"1px solid rgba(61,122,82,0.3)",borderRadius:7,color:"#80c890",padding:"5px 12px",fontFamily:"'Georgia',serif",fontSize:12,cursor:"pointer"}}>＋ Agregar tarea</button>
    </div>
  );
}

// ─── FICHA TRABAJADOR ────────────────────────────────────────────────────────
function FichaTrabajador({ t, S, onVolver, onDelete, onUpdate, onAddEvento, onDeleteEvento, onUpdateEvento }) {
  const [tab, setTab] = React.useState("ficha");
  const [showNuevoEvento, setShowNuevoEvento] = React.useState(false);
  const [nuevoEvento, setNuevoEvento] = React.useState({ tipo:"permiso", fecha:"", fechaFin:"", horas:"", descripcion:"", estado:"pendiente" });

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
  const bonosTotal = eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)&&e.estado==="aprobado").reduce((a,e)=>a+Number(e.horas||0),0);

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
        <div className="ein" style={{...S.card,padding:22}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {[["Nombre completo","nombre","text"],["RUT","rut","text"],["Teléfono","telefono","tel"],["Email","email","email"],["Fecha de ingreso","fechaIngreso","date"]].map(([lbl,key,type])=>(
              <div key={key}>
                <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>{lbl.toUpperCase()}</label>
                <input type={type} style={S.input} value={t[key]||""} onChange={e=>onUpdate({[key]:e.target.value})}/>
              </div>
            ))}
            {/* PIN en fila propia al final */}
            <div style={{gridColumn:"1/-1",background:"rgba(61,122,82,0.08)",border:"1px solid rgba(61,122,82,0.2)",borderRadius:10,padding:"12px 14px"}}>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:6,letterSpacing:"0.5px"}}>🔐 PIN DE ACCESO (4 DÍGITOS)</label>
              <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <input type="password" maxLength={4} placeholder="••••"
                  style={{...S.input,maxWidth:140,fontSize:20,letterSpacing:"0.5em",textAlign:"center"}}
                  value={t.pin||""} onChange={e=>onUpdate({pin:e.target.value})}/>
                <div style={{fontSize:12,color:"#5a8a6a"}}>El trabajador usa este PIN para acceder a sus tareas en 🌿 Mi Turno</div>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>CARGO</label>
              <select style={S.input} value={t.cargo||""} onChange={e=>onUpdate({cargo:e.target.value})}>
                <option value="">Seleccionar...</option>
                {CARGOS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>MACROZONA ASIGNADA</label>
              <select style={S.input} value={t.zona||""} onChange={e=>onUpdate({zona:e.target.value})}>
                <option value="">Sin zona</option>
                {[...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=><option key={z.id} value={z.nombre}>{z.icono} {z.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>TIPO DE CONTRATO</label>
              <select style={S.input} value={t.contrato||"indefinido"} onChange={e=>onUpdate({contrato:e.target.value})}>
                {CONTRATOS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:"#6aaa7a",display:"block",marginBottom:4,letterSpacing:"0.5px"}}>OBSERVACIONES</label>
            <textarea rows={3} style={{...S.input,resize:"vertical"}} value={t.notas||""} onChange={e=>onUpdate({notas:e.target.value})}/>
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
                    <select style={S.input} value={nuevoEvento.tipo} onChange={e=>setNuevoEvento(p=>({...p,tipo:e.target.value}))}>
                      <optgroup label="── Asistencia ──">
                        {["permiso","vacaciones","licencia"].map(k=><option key={k} value={k}>{TIPO_EVENTO[k].icon} {TIPO_EVENTO[k].label}</option>)}
                      </optgroup>
                      <optgroup label="── Horas ──">
                        <option value="horaExtra">{TIPO_EVENTO.horaExtra.icon} {TIPO_EVENTO.horaExtra.label}</option>
                      </optgroup>
                      <optgroup label="── Otros ──">
                        {["capacitacion","amonestacion","otro"].map(k=><option key={k} value={k}>{TIPO_EVENTO[k].icon} {TIPO_EVENTO[k].label}</option>)}
                      </optgroup>
                    </select>
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
                <div key={ev.id} style={{...S.card,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:12}}>
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
                    <select value={ev.estado} style={{...S.input,width:"auto",fontSize:12,padding:"4px 8px"}} onChange={e=>onUpdateEvento(ev.id,{estado:e.target.value})}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>onDeleteEvento(ev.id)}>🗑</button>
                  </div>
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
                <div key={ev.id} style={{...S.card,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:12}}>
                  <div style={{display:"flex",gap:10,alignItems:"start",flex:1}}>
                    <span style={{fontSize:20,flexShrink:0}}>{tp.icon}</span>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:600,color:tp.color}}>{tp.label}</span>
                        <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,background:`${est.color}18`,color:est.color,border:`1px solid ${est.color}35`}}>{est.label}</span>
                        {ev.horas&&<span style={{fontSize:12,color:"#6aaa7a"}}>⏰ {ev.horas}h</span>}
                      </div>
                      <div style={{fontSize:12,color:"#5a8a6a"}}>{ev.fecha}</div>
                      {ev.descripcion&&<div style={{fontSize:12,color:"#7aaa80",marginTop:3,fontStyle:"italic"}}>{ev.descripcion}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <select value={ev.estado} style={{...S.input,width:"auto",fontSize:12,padding:"4px 8px"}} onChange={e=>onUpdateEvento(ev.id,{estado:e.target.value})}>
                      {Object.entries(ESTADO_EVENTO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button className="btn-d" style={{...S.btn,fontSize:11,padding:"4px 8px"}} onClick={()=>onDeleteEvento(ev.id)}>🗑</button>
                  </div>
                </div>
              );
            })}
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
              {label:"Horas extra",val:heTotal,color:"#22c55e",icon:"⏰"},
              {label:"Permisos",val:eventos.filter(e=>e.tipo==="permiso").length,color:"#f59e0b",icon:"📋"},
              {label:"Licencias",val:eventos.filter(e=>e.tipo==="licencia").length,color:"#a78bfa",icon:"🏥"},
              {label:"Capacitaciones",val:eventos.filter(e=>e.tipo==="capacitacion").length,color:"#2dd4bf",icon:"📚"},
              {label:"Amonestaciones",val:eventos.filter(e=>e.tipo==="amonestacion").length,color:"#ef4444",icon:"⚠️"},
              {label:"Bonos aprobados",val:eventos.filter(e=>["bonoConstruccion","bonoPesado","bonoEspecializado"].includes(e.tipo)&&e.estado==="aprobado").length,color:"#7c3aed",icon:"💰"},
            ].map(s=>(
              <div key={s.label} style={{...S.card,padding:"14px 10px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.color}}>{s.val}</div>
                <div style={{fontSize:11,color:"#6aaa7a"}}>{s.label}</div>
              </div>
            ))}
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

export default function App() {
  const [data, setData] = useState(initData);
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
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().slice(0,10));
  const [tabReporte, setTabReporte] = useState("general"); // "general" | "semanal"
  const [semanaBase, setSemanaBase] = useState(()=>{
    // Default: lunes de la semana actual
    const d = new Date(); const day = d.getDay(); const diff = (day===0?-6:1-day);
    d.setDate(d.getDate()+diff); return d.toISOString().slice(0,10);
  });

  const initPersonal = () => { try { const s=localStorage.getItem("ev2-personal"); if(s) return JSON.parse(s); } catch {} return []; };
  const [personal, setPersonal] = useState(initPersonal);

  const initTareasProg = () => { try { const s=localStorage.getItem("ev2-prog"); return s?JSON.parse(s):{}; } catch { return {}; } };
  const [tareasProg, setTareasProg] = useState(initTareasProg);
  useEffect(() => { try { localStorage.setItem("ev2-prog", JSON.stringify(tareasProg)); } catch {} }, [tareasProg]);

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
  const [rolLogueado, setRolLogueado] = useState(null);
  const getPines = () => { try { return JSON.parse(localStorage.getItem("ev2-pines")||"{}"); } catch { return {}; } };
  const setPinRol = (rol, pin) => { const p=getPines(); p[rol]=pin; localStorage.setItem("ev2-pines", JSON.stringify(p)); };
  const checkPin = (rol, pin) => { const p=getPines(); return p[rol] && String(p[rol])===String(pin); };

  useEffect(() => { try { localStorage.setItem("ev2-data", JSON.stringify(data)); } catch {} }, [data]);
  useEffect(() => { try { localStorage.setItem("ev2-personal", JSON.stringify(personal)); } catch {} }, [personal]);

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

  const addTareaZona = (zid, texto) => {
    if(!texto.trim()) return;
    // 1. Agregar al checklist de la zona
    updateZona(zid, { tareas: [...(getZD(zid).tareas||[]), { id:Date.now(), texto, completada:false, fecha:new Date().toLocaleDateString("es-CL"), enviadaProg:true }] });
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
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const json=await res.json();
      setAiText(json.content?.[0]?.text||"Sin respuesta.");
    } catch { setAiText("Error al conectar con el asistente IA."); }
    setAiLoading(false);
  };

  const S = {
    app: { fontFamily:"'Georgia',serif", minHeight:"100vh", background:"linear-gradient(150deg,#0a1f10 0%,#122d1a 50%,#0d2414 100%)", color:"#ede9e0" },
    header: { background:"rgba(0,0,0,0.45)", borderBottom:"1px solid rgba(160,200,140,0.15)" },
    headerTop: { maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", padding:"10px 16px", gap:10 },
    headerNav: { background:"rgba(0,0,0,0.3)", borderTop:"1px solid rgba(160,200,140,0.08)", display:"flex", overflowX:"auto", padding:"0 8px", gap:2, scrollbarWidth:"none" },
    logo: { display:"flex", alignItems:"center", gap:10, flex:1 },
    logoCircle: { width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#3d7a52,#1e4d30)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
    logoTitle: { fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700 },
    logoSub: { fontSize:9, color:"#6aaa7a", letterSpacing:"1.5px", textTransform:"uppercase" },
    nav: { display:"flex", gap:2 },
    main: { maxWidth:1280, margin:"0 auto", padding:"20px 16px" },
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
                {f.tarea}: {f[est]}
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
        </div>
        <div style={S.headerNav} className="headerNav">
          {[["dashboard","📊","Panel"],["zonas","🗺️","Macrozonas"],["reporte","📋","Reporte"],["programacion","📆","Programa"],["personal","👷","Personal"],["miturno","🌿","Mi Turno"]].map(([v,ico,lbl])=>(
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
              {[["elementos","🌿 Elementos"],["info","📝 Info"],["tareas","✅ Tareas"],["historial","📜 Historial"]].map(([t,l])=>(
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
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <input placeholder="Escribir tarea..." value={nuevaTarea} onChange={e=>setNuevaTarea(e.target.value)} style={{...S.input,flex:"2 1 180px"}} onKeyDown={e=>{if(e.key==="Enter"){addTareaZona(zonaId,nuevaTarea);setNuevaTarea("");}}}/>
                    <button className="btn-p" style={S.btn} onClick={()=>{addTareaZona(zonaId,nuevaTarea);setNuevaTarea("");}}>➕ Agregar</button>
                  </div>
                  <div style={{fontSize:11,color:"#5a8a6a",marginTop:6}}>💡 Las tareas aparecen en 📆 <b style={{color:"#c084fc"}}>Programación</b> como <b style={{color:"#94a3b8"}}>Por designar</b> — listas para asignar responsable y fecha.</div>
                  <div style={{fontSize:11,color:"#5a8a6a",marginTop:6}}>💡 Las tareas agregadas aparecen automáticamente en 📆 Programación como <b style={{color:"#94a3b8"}}>Por designar</b> para asignar responsable y fecha.</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(zd.tareas||[]).length===0&&<div style={{textAlign:"center",color:"#4a8a5a",padding:32,fontSize:15}}>Sin tareas registradas.</div>}
                  {(zd.tareas||[]).map(t=>(
                    <div key={t.id} style={{...S.card,padding:"11px 16px",display:"flex",alignItems:"center",gap:12,opacity:t.completada?0.55:1}}>
                      <input type="checkbox" checked={t.completada} onChange={()=>{toggleTareaZona(zonaId,t.id);addHistorial(zonaId,`Tarea ${t.completada?"reabierta":"completada"}: ${t.texto}`);}} style={{width:17,height:17,accentColor:"#3d7a52",cursor:"pointer",flexShrink:0}}/>
                      <span style={{flex:1,fontSize:14,textDecoration:t.completada?"line-through":"none"}}>{t.texto}</span>
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
                    {(zd.historial||[]).map((h,i)=>(
                      <div key={i} style={{...S.card,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:16,flexShrink:0}}>📌</span>
                          <span style={{fontSize:14}}>{h.txt}</span>
                        </div>
                        <div style={{fontSize:11,color:"#4a8a5a",whiteSpace:"nowrap"}}>{h.fecha} {h.hora}</div>
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
                  const win = window.open("","_blank","width=900,height=700");
                  const zonaRows = [...MACROZONAS_BASE].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es",{sensitivity:"base"})).map(z=>{
                    const d=getZD(z.id);
                    const allE=getAllElems(z.id);
                    const crit=allE.filter(e=>e.edData.estado==="critico").length;
                    const pend=(d.tareas||[]).filter(t=>!t.completada).length;
                    const COLORES={bueno:"#166534",regular:"#92400e",critico:"#991b1b",mantenimiento:"#1e40af"};
                    const LABELS={bueno:"Bueno",regular:"Regular",critico:"Crítico",mantenimiento:"En Mantenimiento"};
                    return `<tr>
                      <td>${z.icono} ${z.nombre}</td>
                      <td>${z.categoria}</td>
                      <td style="color:${COLORES[d.estadoGeneral||"bueno"]};font-weight:600">${LABELS[d.estadoGeneral||"bueno"]}</td>
                      <td style="text-align:center">${allE.length}</td>
                      <td style="text-align:center;color:${crit>0?"#991b1b":"#166534"}">${crit>0?"🔴 "+crit:"—"}</td>
                      <td>${d.ultimoMant||"—"}</td>
                      <td>${d.proximoMant||"—"}</td>
                      <td style="text-align:center;color:${pend>0?"#92400e":"#166534"}">${pend>0?"⚠️ "+pend:"✅ 0"}</td>
                    </tr>`;
                  }).join("");
                  const estadoStats = Object.entries({bueno:{label:"Bueno",color:"#166534"},regular:{label:"Regular",color:"#92400e"},critico:{label:"Crítico",color:"#991b1b"},mantenimiento:{label:"En Mant.",color:"#1e40af"}}).map(([k,v])=>{
                    const c=MACROZONAS_BASE.filter(z=>getZD(z.id).estadoGeneral===k).length;
                    return `<span style="color:${v.color};font-weight:700">${v.label}: ${c}</span>`;
                  }).join(" &nbsp;·&nbsp; ");
                  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
                  <title>Reporte Áreas Verdes — Estadio Español</title>
                  <style>
                    body{font-family:Georgia,serif;color:#1a2e1a;padding:32px;max-width:900px;margin:0 auto}
                    h1{font-size:22px;color:#0d3320;margin-bottom:4px}
                    .sub{font-size:13px;color:#4a7a4a;margin-bottom:6px}
                    .stats{font-size:13px;margin-bottom:20px;padding:10px 14px;background:#f0f7f0;border-radius:8px}
                    table{width:100%;border-collapse:collapse;font-size:12px}
                    th{text-align:left;padding:8px 10px;background:#1a4a2e;color:#fff;font-size:10px;letter-spacing:0.8px;text-transform:uppercase;white-space:nowrap}
                    tr:nth-child(even){background:#f5fbf5}
                    td{padding:7px 10px;border-bottom:1px solid #dce8dc;vertical-align:top}
                    .pie{margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #dce8dc;padding-top:12px;display:flex;justify-content:space-between}
                    @media print{body{padding:16px}}
                  </style></head><body>
                  <h1>📋 Reporte General de Áreas Verdes — Estadio Español</h1>
                  <div class="sub">Fecha del reporte: ${new Date(fechaReporte+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · Generado: ${new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"})}</div>
                  <div class="stats">${estadoStats} &nbsp;·&nbsp; <b>Total zonas: ${MACROZONAS_BASE.length}</b></div>
                  <table><thead><tr><th>Zona</th><th>Categoría</th><th>Estado</th><th>Elementos</th><th>Críticos</th><th>Últ. Mant.</th><th>Próx. Mant.</th><th>Tareas Pend.</th></tr></thead><tbody>${zonaRows}</tbody></table>
                  <div class="pie"><span>Estadio Español de Las Condes · Departamento de Áreas Verdes</span><span>${new Date().getFullYear()}</span></div>
                  <script>window.onload=()=>{window.print();}<\/script>
                  </body></html>`);
                  win.document.close();
                }}
                style={{...S.btn,background:"rgba(59,130,246,0.15)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)",fontSize:13,flexShrink:0}}
              >🖨️ Imprimir Reporte</button>
            </div>
            {tabReporte==="semanal" && (
              <ReporteSemanal S={S} tareasProg={tareasProg} semanaBase={semanaBase} setSemanaBase={setSemanaBase} MACROZONAS_BASE={MACROZONAS_BASE} personal={personal}/>
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
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {zonasConActividad.map(([nombreZona, tareasZona])=>{
                        const zonaInfo=MACROZONAS_BASE.find(z=>z.nombre===nombreZona);
                        const hechas=tareasZona.filter(t=>["hecha","completada"].includes(t.estado)).length;
                        const noPudo=tareasZona.filter(t=>t.estado==="no_pudo").length;
                        const pct=Math.round((hechas/tareasZona.length)*100);
                        return (
                          <div key={nombreZona} style={{...S.card,padding:16}}>
                            {/* Cabecera zona */}
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:20}}>{zonaInfo?.icono||"📍"}</span>
                                <div>
                                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{nombreZona}</span>
                                  <span style={{fontSize:11,color:"#5a8a6a",marginLeft:8}}>{zonaInfo?.categoria||""}</span>
                                </div>
                              </div>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <span style={{fontSize:12,color:"#22c55e"}}>✅ {hechas}</span>
                                {noPudo>0&&<span style={{fontSize:12,color:"#ef4444"}}>🔴 {noPudo}</span>}
                                <span style={{fontSize:12,fontWeight:700,color:pct===100?"#22c55e":pct>50?"#f59e0b":"#ef4444"}}>{pct}%</span>
                              </div>
                            </div>
                            {/* Lista de tareas */}
                            <div style={{display:"flex",flexDirection:"column",gap:6}}>
                              {tareasZona.map(t=>{
                                const est=EC[t.estado]||EC.pendiente;
                                return (
                                  <div key={t.id} style={{display:"flex",gap:10,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",borderLeft:`3px solid ${est.color}40`,alignItems:"start"}}>
                                    <span style={{flexShrink:0,fontSize:14}}>{est.icon}</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                                        <span style={{fontSize:13,fontWeight:600}}>{t.tarea}</span>
                                        {t.elemento&&<span style={{fontSize:11,color:"#5a8a6a",background:"rgba(255,255,255,0.05)",padding:"1px 6px",borderRadius:8}}>{t.elemento}</span>}
                                        {t.emergente&&<span style={{fontSize:10,color:"#f59e0b",background:"rgba(245,158,11,0.1)",padding:"1px 6px",borderRadius:8}}>🆕</span>}
                                      </div>
                                      <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap"}}>
                                        <span style={{fontSize:11,color:est.color}}>{est.label}</span>
                                        {t.responsable&&<span style={{fontSize:11,color:"#6a9a8a"}}>👤 {t.responsable}</span>}
                                      </div>
                                      {t.notaWorker&&<div style={{fontSize:11,color:t.estado==="no_pudo"?"#fca5a5":"#7aaa80",marginTop:3,fontStyle:"italic",padding:"3px 8px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>{t.estado==="no_pudo"?"⚠️ ":""}{t.notaWorker}</div>}
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
                <button onClick={()=>{setRolLogueado(null);setVista("programacion");}} style={{...S.btn,background:"#3d7a52",color:"#fff",fontSize:15,padding:"12px 28px"}}>📆 Ir a Programación →</button>
                <div style={{marginTop:12}}>
                  <button onClick={()=>{setRolLogueado(null);setWorkerPinInput("");}} style={{...S.btn,background:"transparent",color:"#6aaa7a",border:"1px solid rgba(255,255,255,0.1)",fontSize:13}}>← Volver al login</button>

                <div style={{maxWidth:380,margin:"24px auto 0"}}>
                  <PinConfig getPines={getPines} setPinRol={setPinRol} S={S}/>
                </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* PERSONAL */}
        {vista==="personal"&&personalVista==="lista"&&(
          <div className="ein">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:22,flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:3}}>Personal</h1>
                <p style={{color:"#6aaa7a",fontSize:14}}>{personal.length} trabajador{personal.length!==1?"es":""} registrado{personal.length!==1?"s":""}</p>
              </div>
              <button className="btn-p" style={S.btn} onClick={()=>setPersonalVista("nuevo")}>➕ Nuevo Trabajador</button>
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
