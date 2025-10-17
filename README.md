# Shopify Quiz Server - Wild Balance

Servidor Node.js para procesar resultados del quiz de mascotas y crear metaobjetos en Shopify.

## 🚀 Descripción

Este servidor recibe datos del quiz de RevenueHunt, calcula las porciones diarias de comida según el peso y edad de la mascota, y crea un metaobjeto en Shopify con toda la información del resultado.

**Stack tecnológico:**
- Node.js + Express
- Shopify GraphQL Admin API
- Vercel (hosting serverless)

**URLs de producción:**
- Servidor: `https://shopify-quiz-server.vercel.app`
- Callback web: `/insert-data`
- Webhook: `/webhook/quiz`

---

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Arquitectura](#arquitectura)
- [Cómo Funciona](#cómo-funciona)
- [Fórmulas de Cálculo](#fórmulas-de-cálculo)
- [Despliegue](#despliegue)
- [Modificaciones Comunes](#modificaciones-comunes)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ Instalación

### Requisitos Previos

- Node.js 18+
- Cuenta de Vercel
- Acceso admin a Shopify
- Token de API de Shopify con permisos de escritura en metaobjetos

### Instalar Dependencias

```bash
npm install
```

Las dependencias principales son:
- `express`: Framework web
- `axios`: Cliente HTTP para Shopify API
- `cors`: Manejo de CORS
- `dotenv`: Variables de entorno

---

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz:

```bash
SHOPIFY_DOMAIN=wildbalancemascotas.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-10
PORT=3000
```

| Variable | Descripción |
|----------|-------------|
| `SHOPIFY_DOMAIN` | Dominio de tu tienda Shopify |
| `SHOPIFY_ACCESS_TOKEN` | Token de acceso a la Admin API |
| `SHOPIFY_API_VERSION` | Versión de la API (2025-10) |
| `PORT` | Puerto local para desarrollo |

### Obtener Access Token de Shopify

1. Ve a Shopify Admin → Settings → Apps and sales channels  
2. Click "Develop apps" → "Create an app"  
3. Configura permisos: `write_metaobjects`  
4. Instala la app y copia el Access Token

### Probar Localmente

```bash
node index.js
```

El servidor arrancará en `http://localhost:3000`

---

## 🏗️ Arquitectura

```
┌─────────────┐
│ RevenueHunt │ Quiz en wildbalance.es
│    Quiz     │
└──────┬──────┘
│ POST (callback)
▼
┌─────────────────────┐
│  Express Server     │
│  (Vercel Serverless)│
├─────────────────────┤
│ -  Recibe respuestas │
│ -  Calcula porciones │
│ -  Crea metaobjeto   │
│ -  Publica resultado │
└──────┬──────────────┘
│ GraphQL Mutation
▼
┌─────────────────┐
│ Shopify Admin   │
│   API (2025-10) │
│ Metaobject:     │
│ wizard_result   │
└─────────────────┘
```

### Estructura del Proyecto

```
shopify-quiz-server/
├── index.js              # Servidor principal
├── package.json          # Dependencias
├── vercel.json           # Config de Vercel
├── .env                  # Variables (NO subir a Git)
├── .gitignore            # Archivos ignorados
└── README.md             # Esta documentación
```

---

## 🔄 Cómo Funciona

### Flujo Completo

1. **Usuario completa el quiz** en wildbalance.es  
2. **RevenueHunt ejecuta callback** → `POST /insert-data`  
3. **Servidor recibe y procesa**:
   - Tipo de mascota (perro/gato)
   - Nombre
   - Peso en kg
   - Año de nacimiento (opcional)
   - Tipo de comida (BARF/cocinada)
   - Plan (completo/medio menú)
4. **Servidor calcula**:
   - Gramos diarios según peso, edad y actividad
   - Número de hamburguesas/porciones
   - Precio diario y mensual
   - Frecuencias de suscripción
5. **Crea metaobjeto** en Shopify vía GraphQL  
6. **Publica metaobjeto** (status: ACTIVE)  
7. **Devuelve response_id** al frontend  
8. **Frontend redirige** a `/pages/wizard-result/{response_id}`

### Endpoints

#### `GET /`
**Health check del servidor.**

**Response:**
```json
{
  "status": "Server is running",
  "timestamp": "2025-10-17T19:00:00.000Z",
  "endpoints": ["/insert-data", "/webhook/quiz"]
}
```

#### `POST /insert-data`
Recibe el callback del quiz desde la web.

**Input:** JSON del quiz callback de RevenueHunt  
**Output:**
```json
{
  "success": true,
  "quizId": "abc123",
  "metaobject": { "id": "gid://shopify/...", "...": "..." },
  "calculated": {
    "pet": "PERRO",
    "grams": 462,
    "burgers": 2,
    "dailyEuros": 3.91,
    "monthEuros": 117.3
  }
}
```

#### `POST /webhook/quiz`
Webhook alternativo para RevenueHunt (formato diferente).

---

## 🧮 Fórmulas de Cálculo

### Fórmula Base

```js
gramos_diarios = peso_gramos × factor_edad_peso × multiplicador_actividad

// Si es medio menú:
gramos_diarios = gramos_diarios / 2
```

### Factores por Edad

**Perros:**
- `baby0`: 0-4 meses  
- `baby4`: 4-8 meses  
- `baby8`: 8-12 meses  
- `baby12`: 12-24 meses  
- `adult_senior`: +24 meses (por defecto si no hay edad)

**Gatos:**
- `baby0`: 0-4 meses  
- `baby4`: 4-8 meses  
- `baby8`: 8-12 meses  
- `adult_senior`: +12 meses (por defecto si no hay edad)

### Factores por Peso (Ejemplo: Perro Adulto BURGERS)

| Peso (gramos) | Factor |
|--------------|--------|
| 10 - 1,000   | 0.055  |
| 1,000 - 2,000 | 0.05  |
| 2,000 - 3,000 | 0.045 |
| 3,000 - 4,000 | 0.04  |
| 4,000 - 6,000 | 0.03  |
| 20,000 - 30,000 | 0.021 |

### Multiplicadores de Actividad

- **Baja** ("Poca cosa"): 0.9  
- **Normal**: 1.0  
- **Alta** ("Pequeña gran revolución"): 1.1

### Ejemplo de Cálculo

**Perro de 22kg, adulto, actividad normal, burgers:**

1. Peso: 22,000 gramos  
2. Edad: sin datos → asume 36 meses → `adult_senior`  
3. Rango de peso: 20,000-30,000g → factor **0.021**  
4. Actividad: normal → multiplicador **1.0**  
5. **Cálculo:** `22,000 × 0.021 × 1.0 = 462g/día`  
6. **Burgers:** `462 ÷ 325 = 1.42 → 2 burgers`  
7. **Precio:** `1.42 × 2.75€ = 3.91€/día`

---

## 🚀 Despliegue

### Primera Vez en Vercel

```bash
npm install -g vercel
vercel login
vercel
vercel env add SHOPIFY_DOMAIN
vercel env add SHOPIFY_ACCESS_TOKEN
vercel env add SHOPIFY_API_VERSION
vercel --prod
```

### Actualizar Despliegue

```bash
node index.js
vercel --prod
```

### Ver Logs

```bash
vercel logs https://shopify-quiz-server.vercel.app --follow
```

Dashboard: [https://vercel.com/migraciones-devs-projects/shopify-quiz-server](https://vercel.com/migraciones-devs-projects/shopify-quiz-server)

---

## 🔧 Modificaciones Comunes

### Cambiar Factores de Cálculo

```js
const DOG_FACTORS_BURGERS = {
  adult_senior: {
    base: {
      values: [
        { min: 10, max: 1000, value: 0.060 }, // Cambiar de 0.055 a 0.060
      ]
    }
  }
};
```

### Cambiar Precios

```js
const DOG_EUROS_PER_BURGER = 2.75;
const CAT_EUROS_PER_BURGER = 1.1;
```

### Añadir Campo al Metaobjeto

```js
const metaobjectFields = [
  { key: 'email', value: email || '' },
  { key: 'nuevo_campo', value: 'valor' },
];
```

Crear también el campo en Shopify Admin:  
Settings → Custom Data → Metaobject Definitions → wizard_result

---

## 🐛 Troubleshooting

### El metaobjeto no se crea

```bash
vercel env ls
vercel logs
```

### Error de CORS

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## 📞 Soporte

- Logs: `vercel logs`  
- Dashboard: [https://vercel.com/migraciones-devs-projects/shopify-quiz-server](https://vercel.com/migraciones-devs-projects/shopify-quiz-server)

---

## 📄 Licencia

Propietario: **Wild Balance**  
**Última actualización:** Octubre 2025  
**Versión:** 1.0.0
