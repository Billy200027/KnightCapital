// superadmin.js - VERSIÓN GOOGLE SHEETS

var usuarioActual = null;

document.addEventListener('DOMContentLoaded', async function() {
    verificarSuperAdmin();
    configurarMenu();
    await cargarEstadoGlobal();
    await cargarResumen();
    cargarUsuarios();
    cargarCuadros();
});

function verificarSuperAdmin() {
    var sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    if (!sesion || sesion.rol !== 'superadmin') {
        window.location.href = 'login.html';
        return;
    }
    
    usuarioActual = sesion;
    document.getElementById('nombreUsuario').textContent = sesion.usuario;
}

function configurarMenu() {
    var menuToggle = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('menuOverlay');
    
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });
    
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

async function cargarEstadoGlobal() {
    var config = await verificarEstadoGlobal();
    
    var toggle = document.getElementById('toggleEstado');
    var label = document.getElementById('toggleLabel');
    var display = document.getElementById('estadoActualDisplay');
    var info = document.getElementById('infoUltimoCambio');
    
    if (!toggle) return;
    
    if (config.estado_global === 'suspendido') {
        toggle.checked = false;
        label.textContent = 'Sistema Suspendido';
        display.className = 'estado-actual estado-suspendido';
        display.innerHTML = '<span class="indicator suspendido">●</span><span class="texto">SISTEMA SUSPENDIDO</span>';
    } else {
        toggle.checked = true;
        label.textContent = 'Sistema Activo';
        display.className = 'estado-actual estado-activo';
        display.innerHTML = '<span class="indicator activo">●</span><span class="texto">SISTEMA ACTIVO</span>';
    }
    
    var fecha = config.ultimaModificacion ? 
        new Date(config.ultimaModificacion).toLocaleString('es-ES') : '-';
    var por = config.modificadoPor || '-';
    info.textContent = 'Último cambio: ' + fecha + ' por ' + por;
}

async function cambiarEstadoGlobal() {
    var toggle = document.getElementById('toggleEstado');
    var nuevoEstado = toggle.checked ? 'activo' : 'suspendido';
    
    if (!confirm('¿Estás seguro de ' + (toggle.checked ? 'ACTIVAR' : 'SUSPENDER') + ' el sistema?')) {
        toggle.checked = !toggle.checked;
        return;
    }
    
    var result = await toggleEstadoGlobalSheets(nuevoEstado, usuarioActual.usuario);
    
    if (result.success) {
        await cargarEstadoGlobal();
        alert('✅ Sistema ' + (toggle.checked ? 'ACTIVADO' : 'SUSPENDIDO'));
    } else {
        alert('Error: ' + (result.error || 'No se pudo cambiar estado'));
        toggle.checked = !toggle.checked;
    }
}

async function cargarResumen() {
    await refreshCache(true);
    var usuarios = getCachedUsuarios();
    var cuadros = getCachedCuadros();
    
    var activos = cuadros.filter(function(c) { return c.estado === 'activo'; }).length;
    
    // Contar comprobantes pendientes
    var pendientes = 0;
    for (var i = 0; i < cuadros.length; i++) {
        var comps = await getComprobantesDrive(cuadros[i].id);
        pendientes += comps.filter(function(c) { return c.estado === 'pendiente'; }).length;
    }
    
    document.getElementById('statUsuarios').textContent = usuarios.length;
    document.getElementById('statCuadros').textContent = cuadros.length;
    document.getElementById('statActivos').textContent = activos;
    document.getElementById('statComprobantes').textContent = pendientes;
}

function cargarUsuarios() {
    var usuarios = getCachedUsuarios();
    var tbody = document.getElementById('tablaUsuariosSuper');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        var tr = document.createElement('tr');
        
        var rolClass = 'badge-user';
        if (u.rol === 'superadmin') rolClass = 'badge-superadmin';
        else if (u.rol === 'admin') rolClass = 'badge-admin';
        
        var estadoClass = u.status === 'active' ? 'badge-active' : 'badge-inactive';
        var estadoTexto = u.status === 'active' ? 'Activo' : 'Inactivo';
        
        var tieneCuenta = u.cuentaBancaria ? '✅ Sí' : '❌ No';
        
        tr.innerHTML = 
            '<td><strong>' + u.usuario + '</strong></td>' +
            '<td><span class="badge ' + rolClass + '">' + u.rol + '</span></td>' +
            '<td><span class="badge ' + estadoClass + '">' + estadoTexto + '</span></td>' +
            '<td>' + (u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString() : 'Nunca') + '</td>' +
            '<td>' + tieneCuenta + '</td>';
        
        tbody.appendChild(tr);
    }
}

function cargarCuadros() {
    var cuadros = getCachedCuadros();
    var tbody = document.getElementById('tablaCuadrosSuper');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < cuadros.length; i++) {
        var c = cuadros[i];
        var tr = document.createElement('tr');
        
        var participantesReales = c.participantes.filter(function(p) { return !p.esSistema; }).length;
        
        tr.innerHTML = 
            '<td><strong>' + c.nombre + '</strong></td>' +
            '<td><span class="badge badge-' + c.estado + '">' + c.estado + '</span></td>' +
            '<td>' + (c.semanaActual || 0) + '/' + c.semanas + '</td>' +
            '<td>' + participantesReales + '/' + c.semanas + '</td>' +
            '<td>$' + c.montoSemanal + '</td>';
        
        tbody.appendChild(tr);
    }
}

function verDatosSistema() {
    var datos = {
        fecha: new Date().toISOString(),
        usuarios: getCachedUsuarios(),
        cuadros: getCachedCuadros(),
        configuracion: { estado_global: 'ver en Sheets' }
    };
    
    document.getElementById('datosSistemaJSON').value = JSON.stringify(datos, null, 2);
    document.getElementById('modalDatos').classList.add('active');
}

function cerrarModalDatos() {
    document.getElementById('modalDatos').classList.remove('active');
}

function copiarDatos() {
    var textarea = document.getElementById('datosSistemaJSON');
    textarea.select();
    document.execCommand('copy');
    alert('✅ Datos copiados al portapapeles');
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}
