// comprobantes.js - VERSIÓN GOOGLE DRIVE

var usuarioActual = null;
var esAdmin = false;

document.addEventListener('DOMContentLoaded', async function() {
    verificarSesion();
    configurarInterfaz();
    await cargarCuadrosActivos();
    await cargarHistorial();
    configurarFileInput();
});

function verificarSesion() {
    var sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    if (!sesion) {
        window.location.href = 'login.html';
        return;
    }
    usuarioActual = sesion;
    esAdmin = (sesion.rol === 'admin');
}

function configurarInterfaz() {
    document.getElementById('nombreUsuario').textContent = usuarioActual.usuario;
    document.getElementById('rolUsuario').textContent = esAdmin ? 'Administrador' : 'Usuario';
    
    if (esAdmin) {
        var adminElements = document.querySelectorAll('.admin-only');
        for (var i = 0; i < adminElements.length; i++) {
            adminElements[i].style.display = 'block';
        }
    }
    
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

async function cargarCuadrosActivos() {
    await refreshCache(true);
    var cuadros = getCachedCuadros();
    var contenedor = document.getElementById('listaCuadrosActivos');
    
    // Filtrar cuadros donde participa y están activos
    var misCuadros = cuadros.filter(function(c) {
        if(c.estado !== 'activo') return false;
        return c.participantes && c.participantes.find(function(p) {
            return p.userId === usuarioActual.id;
        });
    });
    
    if(misCuadros.length === 0) {
        contenedor.innerHTML = '<p class="empty">No tienes cuadros activos</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    for(var i = 0; i < misCuadros.length; i++) {
        var cuadro = misCuadros[i];
        var semanaActual = cuadro.semanaActual || 1;
        
        // Buscar comprobante de esta semana
        var comprobantes = await getComprobantesDrive(cuadro.id);
        var miComp = comprobantes.find(function(c) {
            return c.userId === usuarioActual.id && parseInt(c.semana) === semanaActual;
        });
        
        var card = crearCardComprobante(cuadro, semanaActual, miComp);
        contenedor.appendChild(card);
    }
}

function crearCardComprobante(cuadro, semana, comprobante) {
    var div = document.createElement('div');
    div.className = 'comprobante-card';
    
    var estadoClass = comprobante ? (comprobante.estado === 'confirmado' ? 'estado-confirmado' : 'estado-pendiente') : '';
    var estadoTexto = comprobante ? (comprobante.estado === 'confirmado' ? '✓ Confirmado' : '⏳ Pendiente') : 'Sin comprobante';
    
    var html = 
        '<div class="comp-header">' +
        '<h3>' + cuadro.nombre + '</h3>' +
        '<span class="comp-semana">Semana ' + semana + '</span>' +
        '</div>' +
        '<div class="comp-info">' +
        '<div class="comp-info-row"><span>Monto:</span> <strong>$' + cuadro.montoSemanal + '</strong></div>' +
        '<div class="comp-info-row"><span>Estado:</span> <span class="comp-estado ' + estadoClass + '">' + estadoTexto + '</span></div>' +
        '</div>';
    
    if(comprobante) {
        html += 
            '<div class="comp-actions">' +
            '<button class="btn-ver" onclick="verComprobanteDrive(\'' + comprobante.driveUrl + '\')">👁 Ver en Drive</button>';
        
        if(comprobante.semana == semana && comprobante.estado === 'pendiente') {
            html += '<button class="btn-secondary" onclick="eliminarComprobante(\'' + cuadro.id + '\', \'' + comprobante.id + '\')" style="padding: 12px 20px;">🗑 Eliminar</button>';
        }
        
        html += '</div>';
        
        if(parseInt(comprobante.semana) !== semana) {
            html += '<div class="bloqueado-mensaje">🔒 Semana cerrada - No se puede modificar</div>';
        }
    } else {
        html += 
            '<div class="comp-actions">' +
            '<button class="btn-upload" onclick="abrirModalComprobante(\'' + cuadro.id + '\', ' + semana + ', ' + cuadro.montoSemanal + ')">📤 Subir Comprobante</button>' +
            '</div>';
    }
    
    div.innerHTML = html;
    return div;
}

function configurarFileInput() {
    var input = document.getElementById('archivoComprobante');
    var preview = document.getElementById('filePreview');
    
    input.addEventListener('change', async function(e) {
        var file = e.target.files[0];
        if(!file) return;
        
        if(file.size > 5 * 1024 * 1024) {
            alert('Máximo 5MB');
            input.value = '';
            return;
        }
        
        // Mostrar preview
        var reader = new FileReader();
        reader.onload = function(e) {
            preview.classList.add('has-file');
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width: 100%; max-height: 200px; border-radius: 8px;"><br><span>' + file.name + '</span>';
            
            // Guardar base64 para enviar después
            preview.dataset.base64 = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function abrirModalComprobante(cuadroId, semana, monto) {
    document.getElementById('compCuadroId').value = cuadroId;
    document.getElementById('compCuadroNombre').textContent = getCachedCuadros().find(c => c.id === cuadroId)?.nombre || '-';
    document.getElementById('compSemana').textContent = semana;
    document.getElementById('compMonto').textContent = monto;
    
    document.getElementById('formComprobante').reset();
    document.getElementById('filePreview').classList.remove('has-file');
    document.getElementById('filePreview').innerHTML = '<span>📎 Arrastra o haz clic para seleccionar</span>';
    
    document.getElementById('modalComprobante').classList.add('active');
}

function cerrarModalComp() {
    document.getElementById('modalComprobante').classList.remove('active');
}

document.getElementById('formComprobante').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var cuadroId = document.getElementById('compCuadroId').value;
    var semana = document.getElementById('compSemana').textContent;
    var preview = document.getElementById('filePreview');
    var base64 = preview.dataset.base64;
    
    if(!base64) {
        alert('Selecciona una imagen');
        return;
    }
    
    // Mostrar cargando
    var btn = this.querySelector('button[type="submit"]');
    var originalText = btn.textContent;
    btn.textContent = 'Subiendo...';
    btn.disabled = true;
    
    // Subir a Drive vía Sheets
    var result = await subirComprobanteDrive(cuadroId, semana, base64, 'comp_semana' + semana + '.jpg');
    
    btn.textContent = originalText;
    btn.disabled = false;
    
    if(!result.success) {
        alert('Error: ' + (result.error || 'No se pudo subir'));
        return;
    }
    
    cerrarModalComp();
    await cargarCuadrosActivos();
    await cargarHistorial();
    
    alert('✅ Comprobante subido. Espera confirmación del admin.');
});

function verComprobanteDrive(url) {
    window.open(url, '_blank');
}

async function eliminarComprobante(cuadroId, compId) {
    if(!confirm('¿Eliminar este comprobante?')) return;
    
    // Nota: En Drive no podemos eliminar directamente desde el cliente
    // Solo marcamos como eliminado en la UI o esperamos a la limpieza automática
    
    alert('El comprobante se eliminará automáticamente en la próxima limpieza (7 días)');
    await cargarCuadrosActivos();
}

async function cargarHistorial() {
    var cuadros = getCachedCuadros();
    var contenedor = document.getElementById('historialComprobantes');
    
    // Obtener todos mis comprobantes de todos los cuadros
    var misComprobantes = [];
    
    for(var i = 0; i < cuadros.length; i++) {
        var comps = await getComprobantesDrive(cuadros[i].id);
        var mios = comps.filter(function(c) {
            return c.userId === usuarioActual.id;
        });
        
        mios.forEach(function(c) {
            misComprobantes.push({
                comprobante: c,
                cuadro: cuadros[i]
            });
        });
    }
    
    // Ordenar por fecha
    misComprobantes.sort(function(a, b) {
        return new Date(b.comprobante.fechaSubida) - new Date(a.comprobante.fechaSubida);
    });
    
    if(misComprobantes.length === 0) {
        contenedor.innerHTML = '<p class="empty">No has subido comprobantes</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    for(var i = 0; i < misComprobantes.length; i++) {
        var item = misComprobantes[i];
        var comp = item.comprobante;
        var cuadro = item.cuadro;
        
        var div = document.createElement('div');
        div.className = 'historial-item ' + comp.estado;
        
        var fecha = new Date(comp.fechaSubida).toLocaleDateString('es-ES');
        
        div.innerHTML = 
            '<div class="hist-info">' +
            '<h4>' + cuadro.nombre + ' - Semana ' + comp.semana + '</h4>' +
            '<p>Monto: $' + cuadro.montoSemanal + ' • ' + fecha + '</p>' +
            '</div>' +
            '<div class="hist-meta">' +
            '<span class="comp-estado ' + (comp.estado === 'confirmado' ? 'estado-confirmado' : 'estado-pendiente') + '">' +
            (comp.estado === 'confirmado' ? '✓ CONFIRMADO' : '⏳ PENDIENTE') +
            '</span>' +
            '<br><a href="' + comp.driveUrl + '" target="_blank" style="font-size: 0.8rem; color: #722F37;">Ver en Drive</a>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}
