// login.js - VERSIÓN LOCAL STORAGE (funciona sin internet)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login cargado');
    
    // Prevenir copiar
    document.addEventListener('copy', function(e) {
        e.preventDefault();
    });
    
    // Convertir a minúsculas
    document.getElementById('username').addEventListener('input', function(e) {
        e.target.value = e.target.value.toLowerCase();
    });
    
    // Login con localStorage
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var errorDiv = document.getElementById('errorMessage');
        
        errorDiv.textContent = 'Verificando...';
        
        // Obtener usuarios de localStorage
        var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        
        // Buscar usuario
        var encontrado = null;
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].usuario === username && usuarios[i].password === password) {
                encontrado = usuarios[i];
                break;
            }
        }
        
        if (!encontrado) {
            errorDiv.textContent = 'Usuario o contraseña incorrectos';
            return;
        }
        
        // Actualizar último acceso
        encontrado.ultimoAcceso = new Date().toISOString();
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        
        // Guardar sesión
        localStorage.setItem('sesionActiva', JSON.stringify({
            id: encontrado.id,
            usuario: encontrado.usuario,
            rol: encontrado.rol
        }));
        
        // Redirigir
        window.location.href = 'panel.html';
    });
});
