// login.js - VERSIÓN DEBUG

// Configurar Supabase
const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';

console.log('=== LOGIN.JS CARGADO ===');

// Verificar que Supabase cargó
if (typeof window.supabase === 'undefined') {
    console.error('ERROR: Supabase no cargó');
    alert('Error: No se pudo cargar Supabase. Recarga la página.');
} else {
    console.log('Supabase cargado correctamente');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Cliente Supabase creado');

// Prevenir copiar
document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

// Convertir a minúsculas
var usernameInput = document.getElementById('username');
var passwordInput = document.getElementById('password');

if (usernameInput) {
    usernameInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.toLowerCase();
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.toLowerCase();
    });
}

// Login - USAR onclick en lugar de submit para evitar recarga
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    console.log('=== FORM SUBMIT DETECTADO ===');
    
    // PREVENIR RECARGA INMEDIATAMENTE
    e.preventDefault();
    e.stopPropagation();
    
    console.log('preventDefault ejecutado');
    
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    var errorDiv = document.getElementById('errorMessage');
    
    console.log('Usuario:', username);
    console.log('Password:', password ? '********' : 'vacía');
    
    errorDiv.textContent = 'Conectando...';
    errorDiv.style.color = '#666';
    
    try {
        console.log('Intentando consulta a Supabase...');
        
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username)
            .eq('password', password)
            .eq('status', 'active');
        
        console.log('Respuesta:', usuarios, error);
        
        if (error) {
            console.error('Error Supabase:', error);
            errorDiv.textContent = 'Error de conexión: ' + error.message;
            errorDiv.style.color = '#e74c3c';
            return false;
        }
        
        if (!usuarios || usuarios.length === 0) {
            console.log('Usuario no encontrado');
            errorDiv.textContent = 'Usuario o contraseña incorrectos';
            errorDiv.style.color = '#e74c3c';
            return false;
        }
        
        console.log('Usuario encontrado:', usuarios[0].usuario);
        
        var encontrado = usuarios[0];
        
        // Actualizar último acceso
        await supabase
            .from('usuarios')
            .update({ ultimo_acceso: new Date().toISOString() })
            .eq('id', encontrado.id);
        
        // Guardar sesión
        var sesion = {
            id: encontrado.id,
            usuario: encontrado.usuario,
            rol: encontrado.rol,
            fechaLogin: new Date().toISOString()
        };
        
        localStorage.setItem('sesionActiva', JSON.stringify(sesion));
        console.log('Sesión guardada');
        
        errorDiv.textContent = '¡Bienvenido! Redirigiendo...';
        errorDiv.style.color = 'green';
        
        // Redirigir después de 500ms
        setTimeout(function() {
            console.log('Redirigiendo a panel.html');
            window.location.href = 'panel.html';
        }, 500);
        
    } catch (err) {
        console.error('Error catch:', err);
        errorDiv.textContent = 'Error: ' + err.message;
        errorDiv.style.color = '#e74c3c';
    }
    
    return false;
});

console.log('=== LOGIN.JS LISTO ===');

