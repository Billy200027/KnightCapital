// login.js - VERSIÓN CON VALIDACIÓN DE ESTADO GLOBAL

document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

document.getElementById('username').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

document.getElementById('password').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var errorDiv = document.getElementById('errorMessage');
    
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    
    errorDiv.textContent = '';
    
    // VERIFICAR CONFIGURACIÓN GLOBAL
    var configJSON = localStorage.getItem('configuracion');
    if (!configJSON) {
        errorDiv.textContent = 'Error: Sistema no inicializado';
        return;
    }
    
    var configuracion = JSON.parse(configJSON);
    
    // OBTENER USUARIOS
    var usuariosJSON = localStorage.getItem('usuarios');
    if (!usuariosJSON) {
        errorDiv.textContent = 'Error: Sistema no inicializado';
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
    
    if (!encontrado) {
        errorDiv.textContent = 'Usuario o contraseña incorrectos';
        return;
    }
    
    // VALIDAR ESTADO GLOBAL
    // Solo superadmin puede entrar si está suspendido
    if (configuracion.estado_global === 'suspendido' && encontrado.rol !== 'superadmin') {
        errorDiv.textContent = '⛔ Sistema suspendido. Contacte al administrador.';
        return;
    }
    
    // ÉXITO - Actualizar último acceso
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
    
    // Redirigir según rol
    if (encontrado.rol === 'superadmin') {
        window.location.href = 'superadmin.html';
    } else {
        window.location.href = 'panel.html';
    }
});


