// superadmin.js - Lógica del superadmin

var usuarioActual = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarSuperAdmin();
    configurarMenu();
    cargarEstadoGlobal();
    cargarResumen();
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

function cargarEstadoGlobal() {
    var config = JSON.parse(localStorage.getItem('configuracion')) || {
        estado_global: 'activo',
        ultimaModificacion: '-',
        modificadoPor: '-'
    };
    
    var toggle = document.getElementById('toggleEstado');
    var label = document.getElementById('toggleLabel');
    var display = document.getElementById('estadoActualDisplay');
    var info = document.getElementById('infoUltimoCambio');
    
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
    
    var fecha = config.ultimaModificacion !== '-' ? 
        new Date(config.ultimaModificacion).toLocaleString('es-ES') : '-';
    info.textContent = 'Último cambio: ' + fecha + ' por ' + (config.modificadoPor || '-');
}

function cambiarEstadoGlobal() {
    var toggle = document.getElementById('toggleEstado');
    var nuevoEstado = toggle.checked ? 'activo' : 'suspendido';
    
    if (!confirm('¿Estás seguro de ' + (toggle.checked ? 'ACTIVAR' : 'SUSPENDER') + ' el sistema?\n\n' +
        (toggle.checked ? 'Todos los usuarios podrán iniciar sesión.' : 'Solo el Super Admin podrá acceder.'))) {
        toggle.checked = !toggle.checked; // Revertir
        return;
    }
    
    var config = {
        estado_global: nuevoEstado,
        ultimaModificacion: new Date().toISOString(),
        modificadoPor: usuarioActual.usuario
    };
    
    localStorage.setItem('configuracion', JSON.stringify(config));
    cargarEstadoGlobal();
    
    alert('✅ Sistema ' + (toggle.checked ? 'ACTIVADO' : 'SUSPENDIDO') + ' correctamente');
}

function cargarResumen() {
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    
    var activos = 0;
    var comprobantesPendientes = 0;
    
    for (var i = 0; i < cuadros.length; i++) {
        if (cuadros[i].estado === 'activo') {
            activos++;
        }
        if (cuadros[i].comprobantes) {
            for (var j = 0; j < cuadros[i].comprobantes.length; j++) {
                if (cuadros[i].comprobantes[j].estado === 'pendiente') {
                    comprobantesPendientes++;
                }
            }
        }
    }
    
    document.getElementById('statUsuarios').textContent = usuarios.length;
    document.getElementById('statCuadros').textContent = cuadros.length;
    document.getElementById('statActivos').textContent = activos;
    document.getElementById('statComprobantes').textContent = comprobantesPendientes;
}

function cargarUsuarios() {
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
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
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var tbody = document.getElementById('tablaCuadrosSuper');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < cuadros.length; i++) {
        var c = cuadros[i];
        var tr = document.createElement('tr');
        
        var participantesReales = 0;
        for (var j = 0; j < c.participantes.length; j++) {
            if (!c.participantes[j].esSistema) {
                participantesReales++;
            }
        }
        
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
        configuracion: JSON.parse(localStorage.getItem('configuracion')),
        usuarios: JSON.parse(localStorage.getItem('usuarios')),
        cuadros: JSON.parse(localStorage.getItem('cuadros')),
        cuentasBancarias: JSON.parse(localStorage.getItem('cuentasBancarias')),
        notificaciones: JSON.parse(localStorage.getItem('notificaciones')),
        sesionActiva: JSON.parse(localStorage.getItem('sesionActiva'))
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


