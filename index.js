// index.js - VERSIÓN CORREGIDA
// LÓGICA DE LA PANTALLA DE BIENVENIDA

// Prevenir copiar
document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

// Función principal que se ejecuta al cargar
function iniciar() {
    console.log('=== INICIANDO CUADROS APP ===');
    
    // PASO 1: Inicializar datos SOLO si no existen (NO limpiar nunca)
    inicializarDatos();
    
    // PASO 2: Esperar 2 segundos y redirigir
    setTimeout(function() {
        console.log('Redirigiendo a login...');
        window.location.href = 'login.html';
    }, 2000);
}

// Inicializar datos solo si no existen
function inicializarDatos() {
    // Verificar si ya existen usuarios
    var usuarios = localStorage.getItem('usuarios');
    
    if (!usuarios) {
        console.log('Inicializando datos por primera vez...');
        
        // Crear usuario admin obligatorio
        var admin = {
            id: 'admin001',
            usuario: 'administrador',
            password: 'billy.24',
            rol: 'admin',
            cuentaBancaria: null,
            status: 'active',
            fechaRegistro: new Date().toISOString(),
            ultimoAcceso: null
        };
        
        // Guardar en localStorage
        localStorage.setItem('usuarios', JSON.stringify([admin]));
        localStorage.setItem('cuadros', JSON.stringify([]));
        localStorage.setItem('penalizaciones', JSON.stringify([]));
        localStorage.setItem('cuentasBancarias', JSON.stringify([]));
        localStorage.setItem('sesionActiva', JSON.stringify(null));
        
        console.log('Datos inicializados correctamente');
    } else {
        console.log('Datos ya existen, conservando...');
    }
}

// Ejecutar inmediatamente
iniciar();


