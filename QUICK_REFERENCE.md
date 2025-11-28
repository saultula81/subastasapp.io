# 📝 SubastasApp - Referencia Rápida

## 🔑 Credenciales Importantes

### Firebase Console
- **URL:** https://console.firebase.google.com/
- **Proyecto:** Tu proyecto Firebase

### Archivo a Configurar
- **Ruta:** `d:\Poyectos\ANTIGRAVITY\js\firebase-config.js`
- **Qué cambiar:** Reemplazar valores de `firebaseConfig`

---

## 🚀 Comandos Rápidos

### Iniciar Servidor Local
```powershell
cd d:\Poyectos\ANTIGRAVITY
python -m http.server 8000
```
Luego abre: `http://localhost:8000`

### Desplegar a Firebase
```powershell
firebase deploy
```

---

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **user** | Ver subastas, pujar, solicitar publicar subastas |
| **admin** | Todo lo anterior + crear subastas + aprobar solicitudes |

---

## 📊 Estructura de la Base de Datos

```
tu-proyecto-default-rtdb/
├── users/{userId}
│   ├── email
│   ├── displayName
│   ├── role: "admin" | "user"
│   └── createdAt
├── auctions/{auctionId}
│   ├── title
│   ├── description
│   ├── imageUrl
│   ├── startingPrice
│   ├── currentPrice
│   ├── endTime
│   ├── createdBy
│   └── status
├── bids/{auctionId}/{bidId}
│   ├── userId
│   ├── userName
│   ├── amount
│   └── timestamp
├── auctionRequests/{requestId}
│   ├── userId
│   ├── userName
│   ├── userEmail
│   ├── userPhone (NUEVO)
│   ├── title
│   ├── description
│   ├── imageUrl
│   ├── startingPrice
│   ├── duration
│   ├── status: "pending" | "approved" | "rejected"
│   ├── requestedAt
│   └── reviewedAt
└── notifications/{adminId}/{notificationId}
    ├── type
    ├── message
    ├── read
    └── createdAt
```

---

## 🎯 Flujo de Trabajo

### Para Usuarios Normales
1. Registrarse → Login
2. Ver subastas activas
3. Realizar pujas
4. **Solicitar publicar subasta:**
   - Perfil → "📤 Solicitar Publicar Subasta"
   - Completar formulario (incluye teléfono)
   - Esperar aprobación

### Para Administradores
1. Todo lo anterior +
2. **Crear subastas directamente:**
   - Click en "+ Nueva Subasta"
   - Publicar inmediatamente
3. **Gestionar solicitudes:**
   - Admin → "Solicitudes de Subastas"
   - Aprobar/Rechazar
   - Contactar por teléfono si es necesario

---

## 🛠️ Tareas Comunes

### Cambiar un usuario a Admin
1. Firebase Console → Realtime Database
2. Navegar a `users/{userId}/role`
3. Cambiar valor a `"admin"`
4. Usuario debe recargar la app

### Ver logs de errores
1. Abrir navegador (F12)
2. Ir a pestaña "Console"

### Limpiar caché de PWA
1. F12 → Application → Storage
2. Click en "Clear site data"

---

## 🎨 Personalización Rápida

### Cambiar colores principales
Archivo: `css/styles.css`
```css
:root {
  --color-accent-purple: #667eea;
  --color-accent-pink: #f5576c;
}
```

### Cambiar nombre de la app
- `index.html` → Buscar "SubastasApp"
- `manifest.json` → Cambiar "name"

---

## 📱 URLs Importantes

- **Firebase Console:** https://console.firebase.google.com/
- **Firebase Docs:** https://firebase.google.com/docs
- **App Local:** http://localhost:8000
- **App Desplegada:** https://tu-proyecto.web.app

---

## ⚡ Atajos de Teclado

- **F12:** Abrir DevTools
- **Ctrl + Shift + R:** Recarga forzada (ignora caché)
- **F5:** Recargar página
- **Esc:** Cerrar modal

---

## 🔧 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| No carga la app | Verificar credenciales en `firebase-config.js` |
| No veo botón admin | Verificar rol en Firebase Database + recargar |
| Error de permisos | Publicar reglas en Firebase Console |
| No hay notificaciones | Solo admins reciben notificaciones |
| Puja no se registra | Debe ser mayor a la puja actual |

---

## 💡 Tips

- **Siempre** verifica la consola del navegador (F12) para errores
- **Recarga** la página después de cambiar roles
- **Usa** imágenes de placeholder: `https://via.placeholder.com/400x300?text=Producto`
- **Prueba** con múltiples usuarios en ventanas de incógnito
- **Incluye** número de teléfono válido en solicitudes

---

## 📞 Checklist de Configuración Inicial

- [ ] Copiar credenciales de Firebase a `firebase-config.js`
- [ ] Crear Realtime Database en Firebase Console
- [ ] Publicar reglas de seguridad (`database.rules.json`)
- [ ] Habilitar Authentication (Email/Password)
- [ ] Registrar primer usuario
- [ ] Cambiar rol a "admin" en Firebase Database
- [ ] Recargar app y verificar botón "+ Nueva Subasta"
- [ ] Probar crear una subasta
- [ ] Probar realizar una puja
- [ ] Probar solicitud de subasta (como usuario)
- [ ] Probar aprobar solicitud (como admin)

---

## 🆕 Novedades del Sistema

### Sistema de Solicitudes de Subasta
- ✅ Usuarios pueden solicitar publicar sin ser colaboradores
- ✅ Formulario incluye número de teléfono
- ✅ Admin puede contactar antes de aprobar
- ✅ Proceso más controlado y seguro

### Eliminado
- ❌ Rol "colaborador" (simplificado a solo admin/user)
- ❌ Solicitudes de colaboración

---

**¡Guarda este archivo para referencia rápida!** 🚀

*Última actualización: Noviembre 2024*
