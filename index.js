// index.js - Inicializar datos

document.addEventListener('DOMContentLoaded', function() {
    console.log('Index cargado');
    
    // Crear admin si no existe
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    if (usuarios.length === 0) {
        var admin = {
            id: 'admin001',
            usuario: 'administrador',
            password: 'billy.24',
            rol: 'admin',
            status: 'active',
            fechaRegistro: new Date().toISOString(),
            ultimoAcceso: null
        };
        
        usuarios.push(admin);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.setItem('cuadros', JSON.stringify([]));
        localStorage.setItem('cuentasBancarias', JSON.stringify([]));
        
        console.log('Admin creado');
    }
    
    // Redirigir después de 2 segundos
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 2000);
});
