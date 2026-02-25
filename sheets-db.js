// ============================================
// sheets-db.js - Cliente para Google Sheets API
// ============================================

// REEMPLAZA ESTO con tu URL de deploy
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxPNqpavaJLAGQLlGQ7s6Q_8qSO_CEqVtKKGeHLwxZXamvjCDQVQ7hXyd7doT86lzQY/exec'



// ============================================
// FUNCIONES GENÉRICAS
// ============================================

async function sheetsGet(action, params = {}) {
    const queryString = new URLSearchParams({action, ...params}).toString();
    const url = `${SHEETS_API_URL}?${queryString}`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        // Apps Script a veces devuelve HTML en errores, verificamos
        try {
            return JSON.parse(text);
        } catch(e) {
            console.error('Respuesta no es JSON:', text.substring(0, 200));
            return {error: 'Respuesta inválida del servidor'};
        }
    } catch(err) {
        console.error('Error GET:', err);
        return {error: 'No se pudo conectar con el servidor'};
    }
}

async function sheetsPost(action, data) {
    try {
        const response = await fetch(SHEETS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });
        
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch(e) {
            console.error('Respuesta POST no es JSON:', text.substring(0, 200));
            return {error: 'Respuesta inválida del servidor'};
        }
    } catch(err) {
        console.error('Error POST:', err);
        return {error: 'No se pudo conectar con el servidor'};
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================

async function loginSheets(usuario, password) {
    const result = await sheetsPost('login', {usuario, password});
    
    if(result.success && result.usuario) {
        // Guardar sesión en LocalStorage temporal (solo para UI)
        localStorage.setItem('sesionActiva', JSON.stringify({
            ...result.usuario,
            fechaLogin: new Date().toISOString()
        }));
    }
    
    return result;
}

async function verificarEstadoGlobal() {
    return await sheetsGet('getConfig');
}

// ============================================
// USUARIOS
// ============================================

async function getUsuarios() {
    return await sheetsGet('getUsuarios');
}

async function crearUsuarioSheets(datos) {
    return await sheetsPost('crearUsuario', datos);
}

async function actualizarUsuarioSheets(id, datos) {
    return await sheetsPost('actualizarUsuario', {id, datos});
}

// ============================================
// CUADROS
// ============================================

async function getCuadros() {
    return await sheetsGet('getCuadros');
}

async function getCuadro(id) {
    return await sheetsGet('getCuadro', {id});
}

async function crearCuadroSheets(datos) {
    return await sheetsPost('crearCuadro', datos);
}

async function actualizarCuadroSheets(id, datos) {
    return await sheetsPost('actualizarCuadro', {id, datos});
}

async function unirseCuadroSheets(userId, cuadroId, numero, username) {
    return await sheetsPost('unirseCuadro', {userId, cuadroId, numero, username});
}

// ============================================
// COMPROBANTES
// ============================================

async function subirComprobanteSheets(cuadroId, comprobante) {
    return await sheetsPost('subirComprobante', {cuadroId, comprobante});
}

async function eliminarComprobanteSheets(cuadroId, compId) {
    return await sheetsPost('eliminarComprobante', {cuadroId, compId});
}

async function confirmarComprobanteSheets(cuadroId, compId, admin) {
    return await sheetsPost('confirmarComprobante', {cuadroId, compId, admin});
}

// ============================================
// CUENTAS BANCARIAS (ADMIN)
// ============================================

async function getCuentasBanco() {
    const config = await sheetsGet('getConfig');
    try {
        return JSON.parse(config.cuentas_banco || '[]');
    } catch(e) {
        return [];
    }
}

async function crearCuentaBancoSheets(cuenta) {
    return await sheetsPost('crearCuentaBanco', {cuenta});
}

async function toggleCuentaBancoSheets(cuentaId) {
    return await sheetsPost('toggleCuentaBanco', {cuentaId});
}

async function eliminarCuentaBancoSheets(cuentaId) {
    return await sheetsPost('eliminarCuentaBanco', {cuentaId});
}

// ============================================
// SUPERADMIN
// ============================================

async function toggleEstadoGlobalSheets(nuevoEstado, modificadoPor) {
    return await sheetsPost('toggleEstadoGlobal', {nuevoEstado, modificadoPor});
}

// ============================================
// CACHE LOCAL (para UI rápida, se refresca cada 30 seg)
// ============================================

var cacheApp = {
    usuarios: null,
    cuadros: null,
    cuentasBanco: null,
    lastFetch: 0
};

async function refreshCache(force = false) {
    const now = Date.now();
    if(!force && now - cacheApp.lastFetch < 30000) return; // 30 segundos
    
    const [usuarios, cuadros] = await Promise.all([
        getUsuarios(),
        getCuadros()
    ]);
    
    cacheApp.usuarios = usuarios;
    cacheApp.cuadros = cuadros;
    cacheApp.cuentasBanco = await getCuentasBanco();
    cacheApp.lastFetch = now;
}

function getCachedUsuarios() {
    return cacheApp.usuarios || [];
}

function getCachedCuadros() {
    return cacheApp.cuadros || [];
}

function getCachedCuentasBanco() {
    return cacheApp.cuentasBanco || [];
}


// ============================================
// COMPROBANTES - GOOGLE DRIVE
// ============================================

async function subirComprobanteDrive(cuadroId, semana, imagenBase64, nombreArchivo) {
    const sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    return await sheetsPost('subirComprobanteDrive', {
        cuadroId: cuadroId,
        userId: sesion.id,
        username: sesion.usuario,
        semana: semana,
        imagenBase64: imagenBase64,
        nombreArchivo: nombreArchivo
    });
}

async function getComprobantesDrive(cuadroId) {
    return await sheetsGet('getComprobantesDrive', cuadroId ? {cuadroId: cuadroId} : {});
}

async function confirmarComprobanteDrive(compId, admin) {
    return await sheetsPost('confirmarComprobanteDrive', {
        compId: compId,
        admin: admin
    });
}
