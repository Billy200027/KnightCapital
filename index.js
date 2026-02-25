// index.js - VERSIÓN SUPABASE COMPLETA

// Configurar Supabase global
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

// Función principal
async function iniciar() {
    console.log('=== INICIANDO CUADROS APP CON SUPABASE ===');
    
    try {
        // Verificar conexión
        const { data, error } = await supabase.from('usuarios').select('count');
        if (error) {
            console.log('Error conexión Supabase:', error);
            // Si falla, igual redirigir (podría ser problema de red)
        } else {
            console.log('Conexión a Supabase OK');
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


