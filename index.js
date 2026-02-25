// index.js - VERSIÓN CON SOLUCIÓN CORS PARA GITHUB PAGES

const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';

// Crear cliente Supabase con opciones especiales
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }
});

// Prevenir copiar
document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
});

// Función para redirigir sin esperar a Supabase (más rápido)
function iniciar() {
    console.log('=== INICIANDO CUADROS APP ===');
    
    // Redirigir inmediatamente sin esperar
    setTimeout(function() {
        window.location.href = 'login.html';
    }, 2000);
}

// Ejecutar
iniciar();
