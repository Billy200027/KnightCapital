// index.js - VERSIÓN CON SUPERADMIN Y CONFIGURACIÓN GLOBAL

document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

function iniciar() {
    console.log('=== INICIANDO CUADROS APP v2.0 ===');
    
    inicializarDatos();
    
    setTimeout(function() {
        console.log('Redirigiendo a login...');
        window.location.href = 'login.html';
    }, 2000);
}

function inicializarDatos() {
    var usuarios = localStorage.getItem('usuarios');
    
    if (!usuarios) {
        console.log('Inicializando datos por primera vez...');
        
        // SUPERADMIN único
        var superadmin = {
            id: 'superadmin001',
            usuario: 'superadmin',
            password: 'super.2024',
            rol: 'superadmin',
            cuentaBancaria: null,
            status: 'active',
            fechaRegistro: new Date().toISOString(),
            ultimoAcceso: null
        };
        
        // Admin normal
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
        
        // Configuración global del sistema
        var configuracion = {
            estado_global: 'activo',
            ultimaModificacion: new Date().toISOString(),
            modificadoPor: 'sistema'
        };
        
        localStorage.setItem('usuarios', JSON.stringify([superadmin, admin]));
        localStorage.setItem('cuadros', JSON.stringify([]));
        localStorage.setItem('penalizaciones', JSON.stringify([]));
        localStorage.setItem('cuentasBancarias', JSON.stringify([]));
        localStorage.setItem('notificaciones', JSON.stringify([]));
        localStorage.setItem('configuracion', JSON.stringify(configuracion));
        localStorage.setItem('sesionActiva', JSON.stringify(null));
        
        console.log('Datos inicializados: Superadmin + Admin creados');
    } else {
        console.log('Datos ya existen, conservando...');
    }
}

iniciar();


