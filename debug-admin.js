// 🔍 SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN
// Pega esto en la consola del navegador (F12)

console.log('=== 🔍 DIAGNÓSTICO DE ELEMENTOS ADMIN ===\n');

// 1. Verificar elementos admin-only
const adminElements = document.querySelectorAll('.admin-only');
console.log('1️⃣ Elementos con clase .admin-only:', adminElements.length);
adminElements.forEach((el, i) => {
    console.log(`   ${i + 1}. ${el.tagName}#${el.id || 'sin-id'} - Hidden: ${el.classList.contains('hidden')}`);
});

// 2. Verificar botón específico
console.log('\n2️⃣ Botón "Nueva Subasta":');
const btnCreate = document.getElementById('btn-create-auction');
if (btnCreate) {
    console.log('   Encontrado:', true);
    console.log('   Clases:', btnCreate.className);
    console.log('   Hidden?:', btnCreate.classList.contains('hidden'));
    console.log('   Display:', window.getComputedStyle(btnCreate).display);
} else {
    console.log('   ❌ NO ENCONTRADO');
}

// 3. Verificar menú Admin
console.log('\n3️⃣ Menú Admin:');
const navAdmin = document.getElementById('nav-admin');
if (navAdmin) {
    console.log('   Encontrado:', true);
    console.log('   Clases:', navAdmin.className);
    console.log('   Hidden?:', navAdmin.classList.contains('hidden'));
    console.log('   Display:', window.getComputedStyle(navAdmin).display);
} else {
    console.log('   ❌ NO ENCONTRADO');
}

// 4. Verificar sección Admin
console.log('\n4️⃣ Sección Admin:');
const adminSection = document.getElementById('admin-section');
if (adminSection) {
    console.log('   Encontrado:', true);
    console.log('   Clases:', adminSection.className);
    console.log('   Hidden?:', adminSection.classList.contains('hidden'));
    console.log('   Display:', window.getComputedStyle(adminSection).display);
} else {
    console.log('   ❌ NO ENCONTRADO');
}

// 5. FORZAR MOSTRAR ELEMENTOS DE ADMIN
console.log('\n5️⃣ FORZANDO VISUALIZACIÓN...');
adminElements.forEach(el => {
    el.classList.remove('hidden');
    console.log(`   ✅ Mostrado: ${el.tagName}#${el.id || 'sin-id'}`);
});

console.log('\n=== ✅ DIAGNÓSTICO COMPLETO ===');
console.log('Si ahora ves los elementos de admin, el problema está en la función updateUIForRole()');
console.log('Recarga la página y comparte los resultados de este diagnóstico.');
