// login.js - VERSIÓN CORREGIDA
// LÓGICA DEL LOGIN

// Prevenir copiar
document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

// Convertir a minúsculas mientras escribe
document.getElementById('username').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

document.getElementById('password').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

// Al enviar el formulario
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var errorDiv = document.getElementById('errorMessage');
    
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    
    // Limpiar error anterior
    errorDiv.textContent = '';
    
    // OBTENER USUARIOS DE LOCALSTORAGE
    var usuariosJSON = localStorage.getItem('usuarios');
    
    if (!usuariosJSON) {
        errorDiv.textContent = 'Error: Sistema no inicializado. Vuelve a index.html';
        return;
    }
    
    var usuarios = JSON.parse(usuariosJSON);
    
    // BUSCAR USUARIO
    var encontrado = null;
    
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        
        if (u.usuario === username && u.password === password) {
            encontrado = u;
            break;
        }
    }
    
    // SI NO ENCONTRÓ
    if (!encontrado) {
        errorDiv.textContent = 'Usuario o contraseña incorrectos';
        return;
    }
    
    // ÉXITO
    // Actualizar último acceso
    encontrado.ultimoAcceso = new Date().toISOString();
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    // Crear sesión
    var sesion = {
        id: encontrado.id,
        usuario: encontrado.usuario,
        rol: encontrado.rol,
        fechaLogin: new Date().toISOString()
    };
    
    localStorage.setItem('sesionActiva', JSON.stringify(sesion));
    
    // Redirigir
    window.location.href = 'panel.html';
});


