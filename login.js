// login.js - VERSIÓN SUPABASE COMPLETA

// Configurar Supabase
const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
document.getElementById('username').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

document.getElementById('password').addEventListener('input', function(e) {
    e.target.value = e.target.value.toLowerCase();
});

// Login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var usernameInput = document.getElementById('username');
    var passwordInput = document.getElementById('password');
    var errorDiv = document.getElementById('errorMessage');
    
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    
    errorDiv.textContent = '';
    
    try {
        // Buscar en Supabase
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username)
            .eq('password', password)
            .eq('status', 'active');
        
        if (error) {
            console.error('Error Supabase:', error);
            errorDiv.textContent = 'Error de conexión con el servidor';
            return;
        }
        
        if (!usuarios || usuarios.length === 0) {
            errorDiv.textContent = 'Usuario o contraseña incorrectos';
            return;
        }
        
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
        
        // Redirigir
        window.location.href = 'panel.html';
        
    } catch (err) {
        console.error('Error:', err);
        errorDiv.textContent = 'Error inesperado. Intenta de nuevo.';
    }
});


