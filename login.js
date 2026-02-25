// login.js - VERSIÓN GOOGLE SHEETS

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
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var errorDiv = document.getElementById('errorMessage');
    
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    
    errorDiv.textContent = 'Conectando...';
    
    // Verificar estado global primero
    const config = await verificarEstadoGlobal();
    
    // LLAMADA A SHEETS PARA LOGIN
    const result = await loginSheets(username, password);
    
    if(!result.success) {
        if(result.suspendido) {
            errorDiv.textContent = '⛔ Sistema suspendido. Contacte al administrador.';
        } else {
            errorDiv.textContent = result.error || 'Usuario o contraseña incorrectos';
        }
        return;
    }
    
    // ÉXITO - Redirigir según rol
    if(result.usuario.rol === 'superadmin') {
        window.location.href = 'superadmin.html';
    } else {
        window.location.href = 'panel.html';
    }
});
