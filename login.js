// login.js - VERSIÓN CON SUPABASE LOCAL

// Esperar a que todo cargue
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CARGADO ===');
    
    // Verificar Supabase local
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase no cargó');
        document.getElementById('errorMessage').textContent = 'Error: Librería no cargada';
        return;
    }
    
    console.log('Supabase disponible');
    
    // Configurar Supabase
    const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';
    
    var supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Cliente creado');
    } catch (e) {
        console.error('Error:', e);
        document.getElementById('errorMessage').textContent = 'Error inicializando';
        return;
    }
    
    // Prevenir copiar
    document.addEventListener('copy', function(e) {
        e.preventDefault();
    });
    
    // Convertir a minúsculas
    document.getElementById('username').addEventListener('input', function(e) {
        e.target.value = e.target.value.toLowerCase();
    });
    
    // Login
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var errorDiv = document.getElementById('errorMessage');
        
        errorDiv.textContent = 'Verificando...';
        
        try {
            const { data: usuarios, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', username)
                .eq('password', password)
                .eq('status', 'active');
            
            if (error) {
                errorDiv.textContent = 'Error: ' + error.message;
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
            localStorage.setItem('sesionActiva', JSON.stringify({
                id: encontrado.id,
                usuario: encontrado.usuario,
                rol: encontrado.rol
            }));
            
            // Redirigir
            window.location.href = 'panel.html';
            
        } catch (err) {
            errorDiv.textContent = 'Error: ' + err.message;
        }
    });
});
