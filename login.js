// login.js - VERSIÓN ROBUSTA

// Esperar a que todo cargue
window.onload = function() {
    console.log('=== WINDOW LOADED ===');
    iniciarLogin();
};

function iniciarLogin() {
    // Verificar Supabase
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase no cargó');
        document.getElementById('errorMessage').textContent = 'Error: Librería no cargada. Intenta recargar.';
        return;
    }
    
    console.log('Supabase disponible:', typeof window.supabase);
    
    // Configurar Supabase
    const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';
    
    var supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Cliente creado exitosamente');
    } catch (e) {
        console.error('Error creando cliente:', e);
        document.getElementById('errorMessage').textContent = 'Error inicializando conexión';
        return;
    }
    
    // Prevenir copiar
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Convertir a minúsculas
    document.getElementById('username').addEventListener('input', function(e) {
        e.target.value = e.target.value.toLowerCase();
    });
    
    // Manejar login
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var errorDiv = document.getElementById('errorMessage');
        
        errorDiv.textContent = 'Verificando...';
        errorDiv.style.color = '#666';
        
        console.log('Intentando login con:', username);
        
        try {
            const { data: usuarios, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', username)
                .eq('password', password)
                .eq('status', 'active');
            
            console.log('Respuesta:', usuarios, error);
            
            if (error) {
                errorDiv.textContent = 'Error de conexión: ' + error.message;
                errorDiv.style.color = '#e74c3c';
                return;
            }
            
            if (!usuarios || usuarios.length === 0) {
                errorDiv.textContent = 'Usuario o contraseña incorrectos';
                errorDiv.style.color = '#e74c3c';
                return;
            }
            
            var encontrado = usuarios[0];
            console.log('Login exitoso:', encontrado.usuario);
            
            // Actualizar último acceso
            await supabase
                .from('usuarios')
                .update({ ultimo_acceso: new Date().toISOString() })
                .eq('id', encontrado.id);
            
            // Guardar sesión
            localStorage.setItem('sesionActiva', JSON.stringify({
                id: encontrado.id,
                usuario: encontrado.usuario,
                rol: encontrado.rol
            }));
            
            // Redirigir
            window.location.href = 'panel.html';
            
        } catch (err) {
            console.error('Error:', err);
            errorDiv.textContent = 'Error inesperado: ' + err.message;
            errorDiv.style.color = '#e74c3c';
        }
    });
}
