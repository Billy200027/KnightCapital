// index.js - VERSIÓN SUPABASE FUNCIONAL

// Configurar Supabase global (desde CDN)
const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';

// Crear cliente Supabase
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

// Función principal
async function iniciar() {
    console.log('=== INICIANDO CUADROS APP ===');
    
    try {
        // Verificar conexión con Supabase
        const { data, error } = await supabase.from('usuarios').select('count');
        if (error) {
            console.log('Error conexión:', error);
        } else {
            console.log('✅ Conexión a Supabase OK');
        }
    } catch (err) {
        console.log('Error:', err);
    }
    
    // Redirigir después de 2 segundos
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 2000);
}

// Ejecutar
iniciar();
