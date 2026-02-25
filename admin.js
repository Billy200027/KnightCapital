// admin.js - VERSIÓN CORREGIDA Y COMPLETA

var usuarioActual = null;
var comprobanteActual = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarAdmin();
    configurarMenu();
    mostrarUsuarios();
    mostrarCuentasBancarias();
    cargarFiltroCuadros();
    cargarComprobantes();
    
    // Configurar formularios
    document.getElementById('formUsuario').addEventListener('submit', crearUsuario);
    document.getElementById('formBanco').addEventListener('submit', crearCuentaBancaria);
});

function configurarMenu() {
    var menuToggle = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('menuOverlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

function verificarAdmin() {
    var sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    if (!sesion || (sesion.rol !== 'admin' && sesion.rol !== 'superadmin')) {
        window.location.href = 'panel.html';
        return;
    }
    
    usuarioActual = sesion;
    document.getElementById('nombreUsuario').textContent = sesion.usuario;
}

// TABS - CORREGIDO: Recibe el botón como parámetro
function mostrarTab(tab, boton) {
    // Quitar active de todos los botones
    var botones = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < botones.length; i++) {
        botones[i].classList.remove('active');
    }
    
    // Quitar active de todos los contenidos
    var contenidos = document.querySelectorAll('.tab-content');
    for (var i = 0; i < contenidos.length; i++) {
        contenidos[i].classList.remove('active');
    }
    
    // Activar el botón clickeado
    if (boton) {
        boton.classList.add('active');
    }
    
    // Activar el contenido correspondiente
    var tabContent = document.getElementById('tab-' + tab);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Si es comprobantes, recargar
    if (tab === 'comprobantes') {
        cargarComprobantes();
    }
}

// USUARIOS
function crearUsuario(e) {
    e.preventDefault();
    
    var username = document.getElementById('newUsername').value.toLowerCase().trim();
    var password = document.getElementById('newPassword').value;
    var rol = document.getElementById('newRol').value;
    
    if (username.length < 3) {
        alert('El usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (password.length < 4) {
        alert('La contraseña debe tener al menos 4 caracteres');
        return;
    }
    
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].usuario === username) {
            alert('Este nombre de usuario ya existe');
            return;
        }
    }
    
    var nuevoUsuario = {
        id: 'user_' + Date.now(),
        usuario: username,
        password: password,
        rol: rol,
        cuentaBancaria: null,
        status: 'active',
        fechaRegistro: new Date().toISOString(),
        ultimoAcceso: null
    };
    
    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    document.getElementById('formUsuario').reset();
    mostrarUsuarios();
    
    alert('Usuario creado exitosamente');
}

function mostrarUsuarios() {
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var tbody = document.getElementById('tablaUsuarios');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        
        // NO mostrar al superadmin (protegido)
        if (u.rol === 'superadmin') continue;
        
        // No mostrar al usuario actual (admin logueado)
        if (u.id === usuarioActual.id) continue;
        
        var tr = document.createElement('tr');
        
        var rolClass = u.rol === 'admin' ? 'badge-admin' : 'badge-active';
        var estadoClass = u.status === 'active' ? 'badge-active' : 'badge-inactive';
        var estadoTexto = u.status === 'active' ? 'Activo' : 'Inactivo';
        
        tr.innerHTML = 
            '<td><strong>' + u.usuario + '</strong></td>' +
            '<td><span class="badge ' + rolClass + '">' + u.rol + '</span></td>' +
            '<td><span class="badge ' + estadoClass + '">' + estadoTexto + '</span></td>' +
            '<td>' + (u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleDateString() : 'Nunca') + '</td>' +
            '<td>' +
            '<button class="btn-delete" onclick="eliminarUsuario(\'' + u.id + '\')">' +
            'Eliminar' +
            '</button>' +
            '</td>';
        
        tbody.appendChild(tr);
    }
    
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No hay otros usuarios registrados</td></tr>';
    }
}

function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === userId) {
            usuarios[i].status = 'inactive';
            break;
        }
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    mostrarUsuarios();
    
    alert('Usuario eliminado');
}

// CUENTAS BANCARIAS
function crearCuentaBancaria(e) {
    e.preventDefault();
    
    var cuenta = {
        id: 'bank_' + Date.now(),
        banco: document.getElementById('bankNombre').value,
        numero: document.getElementById('bankNumero').value,
        titular: document.getElementById('bankTitular').value,
        tipo: document.getElementById('bankTipo').value,
        activa: true,
        fechaRegistro: new Date().toISOString()
    };
    
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    cuentas.push(cuenta);
    
    localStorage.setItem('cuentasBancarias', JSON.stringify(cuentas));
    
    document.getElementById('formBanco').reset();
    mostrarCuentasBancarias();
    
    alert('Cuenta bancaria registrada');
}

function mostrarCuentasBancarias() {
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    var contenedor = document.getElementById('listaCuentas');
    
    if (cuentas.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay cuentas registradas</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    for (var i = 0; i < cuentas.length; i++) {
        var c = cuentas[i];
        
        var div = document.createElement('div');
        div.className = 'account-item';
        
        var estadoClass = c.activa !== false ? 'activa' : 'inactiva';
        var estadoTexto = c.activa !== false ? 'Activa' : 'Inactiva';
        var btnTexto = c.activa !== false ? 'Desactivar' : 'Activar';
        var btnClass = c.activa !== false ? 'btn-warning' : 'btn-success';
        
        div.innerHTML = 
            '<div class="account-info">' +
            '<h4>' + c.banco + ' <span class="badge-estado ' + estadoClass + '">' + estadoTexto + '</span></h4>' +
            '<p>Cuenta: •••• ' + c.numero.slice(-4) + '</p>' +
            '<p>Titular: ' + c.titular + '</p>' +
            '<span class="account-type">' + c.tipo + '</span>' +
            '</div>' +
            '<div class="account-actions">' +
            '<button class="' + btnClass + '" onclick="toggleCuenta(\'' + c.id + '\')">' + btnTexto + '</button>' +
            '<button class="btn-delete" onclick="eliminarCuenta(\'' + c.id + '\')">Eliminar</button>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

function toggleCuenta(cuentaId) {
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    
    for (var i = 0; i < cuentas.length; i++) {
        if (cuentas[i].id === cuentaId) {
            cuentas[i].activa = !(cuentas[i].activa !== false);
            break;
        }
    }
    
    localStorage.setItem('cuentasBancarias', JSON.stringify(cuentas));
    mostrarCuentasBancarias();
}

function eliminarCuenta(cuentaId) {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
    
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    var filtradas = [];
    
    for (var i = 0; i < cuentas.length; i++) {
        if (cuentas[i].id !== cuentaId) {
            filtradas.push(cuentas[i]);
        }
    }
    
    localStorage.setItem('cuentasBancarias', JSON.stringify(filtradas));
    mostrarCuentasBancarias();
}

// COMPROBANTES
function cargarFiltroCuadros() {
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var select = document.getElementById('filtroCuadro');
    
    if (!select) return;
    
    select.innerHTML = '<option value="todos">Todos los cuadros</option>';
    
    for (var i = 0; i < cuadros.length; i++) {
        var option = document.createElement('option');
        option.value = cuadros[i].id;
        option.textContent = cuadros[i].nombre;
        select.appendChild(option);
    }
}

function cargarComprobantes() {
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var filtro = document.getElementById('filtroCuadro').value;
    var contenedor = document.getElementById('listaComprobantes');
    
    if (!contenedor) return;
    
    var todosComprobantes = [];
    
    for (var i = 0; i < cuadros.length; i++) {
        var cuadro = cuadros[i];
        
        if (filtro !== 'todos' && cuadro.id !== filtro) continue;
        if (!cuadro.comprobantes) continue;
        
        for (var j = 0; j < cuadro.comprobantes.length; j++) {
            var comp = cuadro.comprobantes[j];
            if (comp.estado === 'pendiente') {
                todosComprobantes.push({
                    comprobante: comp,
                    cuadro: cuadro
                });
            }
        }
    }
    
    if (todosComprobantes.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay comprobantes pendientes</p>';
        return;
    }
    
    todosComprobantes.sort(function(a, b) {
        return new Date(a.comprobante.fechaSubida) - new Date(b.comprobante.fechaSubida);
    });
    
    contenedor.innerHTML = '';
    
    for (var i = 0; i < todosComprobantes.length; i++) {
        var item = todosComprobantes[i];
        var comp = item.comprobante;
        var cuadro = item.cuadro;
        
        var div = document.createElement('div');
        div.className = 'comprobante-admin-item';
        
        var fecha = new Date(comp.fechaSubida).toLocaleString('es-ES');
        
        div.innerHTML = 
            '<div class="comp-admin-info">' +
            '<h4>' + comp.username + '</h4>' +
            '<p><strong>' + cuadro.nombre + '</strong> - Semana ' + comp.semana + '</p>' +
            '<p>Monto: $' + cuadro.montoSemanal + ' • Subido: ' + fecha + '</p>' +
            '</div>' +
            '<div class="comp-admin-actions">' +
            '<button class="btn-primary" onclick="verDetalleComprobante(\'' + cuadro.id + '\', \'' + comp.id + '\')">' +
            'Ver y Confirmar</button>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

function verDetalleComprobante(cuadroId, comprobanteId) {
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    
    comprobanteActual = null;
    
    for (var i = 0; i < cuadros.length; i++) {
        if (cuadros[i].id === cuadroId && cuadros[i].comprobantes) {
            for (var j = 0; j < cuadros[i].comprobantes.length; j++) {
                if (cuadros[i].comprobantes[j].id === comprobanteId) {
                    comprobanteActual = {
                        comprobante: cuadros[i].comprobantes[j],
                        cuadro: cuadros[i],
                        cuadroIndex: i,
                        compIndex: j
                    };
                    break;
                }
            }
            break;
        }
    }
    
    if (!comprobanteActual) return;
    
    var comp = comprobanteActual.comprobante;
    var cuadro = comprobanteActual.cuadro;
    
    document.getElementById('detalleUsuario').textContent = comp.username;
    document.getElementById('detalleCuadro').textContent = cuadro.nombre;
    document.getElementById('detalleSemana').textContent = comp.semana;
    document.getElementById('detalleMonto').textContent = cuadro.montoSemanal;
    document.getElementById('detalleFecha').textContent = new Date(comp.fechaSubida).toLocaleString('es-ES');
    document.getElementById('detalleNotas').textContent = comp.notas || 'Sin notas';
    
    var archivoDiv = document.getElementById('detalleArchivo');
    if (comp.tipoArchivo && comp.tipoArchivo.startsWith('image/')) {
        archivoDiv.innerHTML = '<img src="' + comp.archivo + '" style="max-width: 100%; border-radius: 10px;">';
    } else {
        archivoDiv.innerHTML = '<iframe src="' + comp.archivo + '" style="width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 10px;"></iframe>';
    }
    
    document.getElementById('modalVerComprobante').classList.add('active');
}

function cerrarModalVer() {
    document.getElementById('modalVerComprobante').classList.remove('active');
    comprobanteActual = null;
}

function confirmarComprobante() {
    if (!comprobanteActual) return;
    
    if (!confirm('¿Confirmar este pago?')) return;
    
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var comp = cuadros[comprobanteActual.cuadroIndex].comprobantes[comprobanteActual.compIndex];
    
    comp.estado = 'confirmado';
    comp.confirmadoPor = usuarioActual.usuario;
    comp.fechaConfirmacion = new Date().toISOString();
    
    localStorage.setItem('cuadros', JSON.stringify(cuadros));
    
    // Notificación al usuario
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones')) || [];
    var fechaEliminar = new Date();
    fechaEliminar.setDate(fechaEliminar.getDate() + 14);
    
    notificaciones.push({
        id: 'notif_' + Date.now(),
        userId: comp.userId,
        tipo: 'pago_confirmado',
        mensaje: '✅ Tu pago de la semana ' + comp.semana + ' ha sido confirmado',
        cuadroId: comprobanteActual.cuadro.id,
        cuadroNombre: comprobanteActual.cuadro.nombre,
        semana: comp.semana,
        fechaCreacion: new Date().toISOString(),
        autoEliminar: fechaEliminar.toISOString(),
        leida: false
    });
    
    localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
    
    cerrarModalVer();
    cargarComprobantes();
    
    alert('✅ Comprobante confirmado');
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}


// Agregar estas funciones a admin.js

async function cargarComprobantesAdmin() {
    var cuadros = getCachedCuadros();
    var filtro = document.getElementById('filtroCuadro').value;
    var contenedor = document.getElementById('listaComprobantes');
    
    var todos = [];
    
    for(var i = 0; i < cuadros.length; i++) {
        if(filtro !== 'todos' && cuadros[i].id !== filtro) continue;
        
        var comps = await getComprobantesDrive(cuadros[i].id);
        
        comps.forEach(function(c) {
            if(c.estado === 'pendiente') {
                todos.push({
                    comprobante: c,
                    cuadro: cuadros[i]
                });
            }
        });
    }
    
    if(todos.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay comprobantes pendientes</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    todos.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'comprobante-admin-item';
        
        div.innerHTML = 
            '<div class="comp-admin-info">' +
            '<h4>' + item.comprobante.username + '</h4>' +
            '<p><strong>' + item.cuadro.nombre + '</strong> - Semana ' + item.comprobante.semana + '</p>' +
            '<p>$' + item.cuadro.montoSemanal + ' • ' + new Date(item.comprobante.fechaSubida).toLocaleString() + '</p>' +
            '</div>' +
            '<div class="comp-admin-actions">' +
            '<button class="btn-primary" onclick="verYConfirmar(\'' + item.comprobante.id + '\', \'' + item.comprobante.driveUrl + '\', \'' + item.cuadro.nombre + '\', \'' + item.comprobante.username + '\')">' +
            'Ver y Confirmar</button>' +
            '</div>';
        
        contenedor.appendChild(div);
    });
}

function verYConfirmar(compId, driveUrl, cuadroNombre, username) {
    if(confirm('¿Confirmar pago de ' + username + ' por semana de ' + cuadroNombre + '?\n\nSe abrirá Drive para verificar.')) {
        window.open(driveUrl, '_blank');
        
        // Confirmar después de ver
        setTimeout(async function() {
            if(confirm('¿Ya verificaste el comprobante? ¿Confirmar pago?')) {
                var result = await confirmarComprobanteDrive(compId, usuarioActual.usuario);
                if(result.success) {
                    alert('✅ Pago confirmado');
                    await cargarComprobantesAdmin();
                }
            }
        }, 1000);
    }
}
