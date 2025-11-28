# SubastasApp - Aplicación de Subastas en Tiempo Real

Una PWA (Progressive Web App) moderna para subastas en tiempo real, desarrollada con HTML, CSS, JavaScript y Firebase.

## 🚀 Características

- ✅ **Autenticación de usuarios** con Firebase Auth
- ✅ **Sistema de roles** (Admin y Usuario)
- ✅ **Subastas en tiempo real** con Firebase Realtime Database
- ✅ **Contador regresivo** actualizado en tiempo real
- ✅ **Sistema de pujas** con validación
- ✅ **Solicitudes de subasta** con aprobación de admin
- ✅ **Notificaciones** para administradores
- ✅ **PWA instalable** en dispositivos móviles
- ✅ **Diseño moderno** con glassmorphism y animaciones

## 📋 Requisitos Previos

- Cuenta de Firebase
- Proyecto Firebase creado
- Navegador web moderno
- Python 3 o Node.js (para servidor local)

## 🔧 Configuración Inicial

### 1. Configurar Firebase

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** (⚙️) > **Configuración general**
4. En "Tus apps", copia las credenciales web

### 2. Actualizar Credenciales

Abre `js/firebase-config.js` y reemplaza con tus credenciales:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

### 3. Configurar Realtime Database

1. En Firebase Console → **Realtime Database**
2. Crea una base de datos
3. Ve a **Reglas**
4. Copia el contenido de `database.rules.json`
5. Pégalo y publica

### 4. Habilitar Authentication

1. Firebase Console → **Authentication**
2. Click en **Comenzar**
3. Habilita **Correo electrónico/contraseña**

### 5. Ejecutar Localmente

**Opción A: Python**
```bash
cd d:\Poyectos\ANTIGRAVITY
python -m http.server 8000
```

**Opción B: Node.js**
```bash
npx http-server -p 8000
```

Abre `http://localhost:8000`

### 6. Crear Primer Usuario Admin

1. Regístrate en la aplicación
2. Ve a Firebase Console → Realtime Database
3. Navega a `users/{tu-user-id}/role`
4. Cambia `"user"` a `"admin"`
5. Recarga la app

## 👥 Sistema de Roles

### Usuario (user)
- ✅ Ver subastas activas
- ✅ Realizar pujas
- ✅ Ver historial de pujas
- ✅ **Solicitar publicar subasta** (con aprobación de admin)

### Administrador (admin)
- ✅ Todo lo de Usuario
- ✅ **Crear subastas directamente**
- ✅ **Aprobar/rechazar solicitudes** de subastas
- ✅ Ver todas las subastas
- ✅ Recibir notificaciones

## 📊 Estructura de la Base de Datos

```
tu-proyecto-default-rtdb/
├── users/
│   └── {userId}/
│       ├── email
│       ├── displayName
│       ├── role: "admin" | "user"
│       └── createdAt
├── auctions/
│   └── {auctionId}/
│       ├── title
│       ├── description
│       ├── imageUrl
│       ├── startingPrice
│       ├── currentPrice
│       ├── endTime
│       ├── createdBy
│       ├── status: "active" | "ended"
│       └── createdAt
├── bids/
│   └── {auctionId}/
│       └── {bidId}/
│           ├── userId
│           ├── userName
│           ├── amount
│           └── timestamp
├── auctionRequests/
│   └── {requestId}/
│       ├── userId
│       ├── userName
│       ├── userEmail
│       ├── userPhone (NUEVO)
│       ├── title
│       ├── description
│       ├── imageUrl
│       ├── startingPrice
│       ├── duration
│       ├── status: "pending" | "approved" | "rejected"
│       ├── requestedAt
│       └── reviewedAt
└── notifications/
    └── {adminId}/
        └── {notificationId}/
            ├── type
            ├── message
            ├── read
            └── createdAt
```

## 🎯 Flujo de Trabajo

### Para Usuarios
1. **Registrarse/Iniciar sesión**
2. **Ver subastas activas** y realizar pujas
3. **Solicitar publicar subasta:**
   - Click en "Perfil"
   - Click en "📤 Solicitar Publicar Subasta"
   - Completar formulario (incluye número de celular)
   - Esperar aprobación del admin

### Para Administradores
1. **Crear subastas directamente:**
   - Click en "+ Nueva Subasta"
   - Completar formulario
   - Publicar

2. **Gestionar solicitudes:**
   - Click en "Admin" (⚙️)
   - Ver "Solicitudes de Subastas"
   - Aprobar o rechazar
   - Contactar al usuario por teléfono si es necesario

## 🎨 Estructura del Proyecto

```
ANTIGRAVITY/
├── index.html              # Página principal
├── manifest.json           # Configuración PWA
├── service-worker.js       # Service Worker
├── firebase.json           # Config Firebase Hosting
├── .firebaserc            # Proyecto Firebase
├── database.rules.json    # Reglas de seguridad
├── README.md              # Este archivo
├── QUICK_REFERENCE.md     # Referencia rápida
├── css/
│   └── styles.css         # Estilos
└── js/
    ├── firebase-config.js # Config Firebase
    ├── utils.js           # Utilidades
    ├── auth.js            # Autenticación
    ├── auctions.js        # Gestión de subastas
    ├── collaboration.js   # Sistema de solicitudes
    └── app.js             # App principal
```

## 🔒 Seguridad

Las reglas de Firebase están configuradas para:
- ✅ Solo usuarios autenticados pueden leer/escribir
- ✅ Solo admins pueden crear subastas directamente
- ✅ Solo admins pueden ver/aprobar solicitudes
- ✅ Usuarios solo pueden editar su propia información

## 💰 Monetización Futura

La estructura está preparada para:
- Comisiones por venta
- Suscripciones premium
- Destacar subastas
- Analytics y métricas

## 🐛 Solución de Problemas

### No veo el botón "+ Nueva Subasta"
- Verifica que tu rol sea "admin" en Firebase Database
- Recarga la página (Ctrl + Shift + R)
- Abre consola (F12) y verifica errores

### No puedo realizar pujas
- Asegúrate de estar autenticado
- Verifica que la subasta esté activa
- Tu puja debe ser mayor a la actual

### Las notificaciones no aparecen
- Solo admins reciben notificaciones
- Verifica las reglas de seguridad

## 📱 Instalar como PWA

1. Abre en Chrome (móvil o desktop)
2. Click en el ícono "Instalar" en la barra
3. La app se instalará como nativa

## 🚀 Desplegar en Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Desplegar
firebase deploy
```

Tu app estará en: `https://tu-proyecto.web.app`

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica las reglas de Firebase
3. Asegúrate de que Authentication esté habilitado
4. Revisa `QUICK_REFERENCE.md` para comandos rápidos

## 📄 Licencia

Proyecto de código abierto para fines educativos.

---

**Desarrollado con ❤️ usando Firebase y JavaScript Vanilla**
