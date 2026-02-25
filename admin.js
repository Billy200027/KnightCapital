// admin.js - VERSIÓN GOOGLE SHEETS

var usuarioActual = null;
var comprobanteActual = null;

document.addEventListener('DOMContentLoaded', async function() {
    verificarAdmin();
    configurarMenu();
    await refreshCache(true);
    mostrarUsuarios();
    mostrarCuentasBancarias();
    cargarFiltroCuadros();
    await cargarComprobantesAdmin();
    
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

function mostrarTab(tab, boton) {
    var botones = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < botones.length; i++) {
        botones[i].classList.remove('active');
    }
    
    var contenidos = document.querySelectorAll('.tab-content');
    for (var i = 0; i < contenidos.length; i++) {
        contenidos[i].classList.remove('active');
    }
    
    if (boton) {
        boton.classList.add('active');
    }
    
    var tabContent = document.getElementById('tab-' + tab);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    if (tab === 'comprobantes') {
        cargarComprobantesAdmin();
    }
}

async function crearUsuario(e) {
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
    
    var result = await crearUsuarioSheets({
        usuario: username,
        password: password,
        rol: rol
    });
    
    if (!result.success) {
        alert(result.error || 'Error al crear usuario');
        return;
    }
    
    document.getElementById('formUsuario').reset();
    await refreshCache(true);
    mostrarUsuarios();
    
    alert('Usuario creado exitosamente');
}

function mostrarUsuarios() {
    var usuarios = getCachedUsuarios();
    var tbody = document.getElementById('tablaUsuarios');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        
        // NO mostrar superadmin (protegido)
        if (u.rol === 'superadmin') continue;
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

async function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    var result = await actualizarUsuarioSheets(userId, {status: 'inactive'});
    
    if (!result.success) {
        alert('Error al eliminar usuario');
        return;
    }
    
    await refreshCache(true);
    mostrarUsuarios();
    
    alert('Usuario eliminado');
}

async function crearCuentaBancaria(e) {
    e.preventDefault();
    
    var cuenta = {
        banco: document.getElementById('bankNombre').value,
        numero: document.getElementById('bankNumero').value,
        titular: document.getElementById('bankTitular').value,
        tipo: document.getElementById('bankTipo').value
    };
    
    var result = await crearCuentaBancoSheets(cuenta);
    
    if (!result.success) {
        alert('Error al crear cuenta: ' + (result.error || 'Desconocido'));
        return;
    }
    
    document.getElementById('formBanco').reset();
    await refreshCache(true);
    mostrarCuentasBancarias();
    
    alert('Cuenta bancaria registrada');
}

function mostrarCuentasBancarias() {
    var cuentas = getCachedCuentasBanco();
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

async function toggleCuenta(cuentaId) {
    var result = await toggleCuentaBancoSheets(cuentaId);
    if (result.success) {
        await refreshCache(true);
        mostrarCuentasBancarias();
    }
}

async function eliminarCuenta(cuentaId) {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
    
    var result = await eliminarCuentaBancoSheets(cuentaId);
    if (result.success) {
        await refreshCache(true);
        mostrarCuentasBancarias();
    }
}

function cargarFiltroCuadros() {
    var cuadros = getCachedCuadros();
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

async function cargarComprobantesAdmin() {
    var cuadros = getCachedCuadros();
    var filtro = document.getElementById('filtroCuadro').value;
    var contenedor = document.getElementById('listaComprobantes');
    
    if (!contenedor) return;
    
    var todos = [];
    
    for (var i = 0; i < cuadros.length; i++) {
        if (filtro !== 'todos' && cuadros[i].id !== filtro) continue;
        
        var comps = await getComprobantesDrive(cuadros[i].id);
        
        for (var j = 0; j < comps.length; j++) {
            if (comps[j].estado === 'pendiente') {
                todos.push({
                    comprobante: comps[j],
                    cuadro: cuadros[i]
                });
            }
        }
    }
    
    if (todos.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay comprobantes pendientes</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    todos.sort(function(a, b) {
        return new Date(a.comprobante.fechaSubida) - new Date(b.comprobante.fechaSubida);
    });
    
    for (var i = 0; i < todos.length; i++) {
        var item = todos[i];
        var comp = item.comprobante;
        var cuadro = item.cuadro;
        
        var div = document.createElement('div');
        div.className = 'comprobante-admin-item';
        
        var fecha = new Date(comp.fechaSubida).toLocaleString('es-ES');
        
        div.innerHTML = 
            '<div class="comp-admin-info">' +
            '<h4>' + comp.username + '</h4>' +
            '<p><strong>' + cuadro.nombre + '</strong> - Semana ' + comp.semana + '</p>' +
            '<p>$' + cuadro.montoSemanal + ' • ' + fecha + '</p>' +
            '</div>' +
            '<div class="comp-admin-actions">' +
            '<button class="btn-primary" onclick="verYConfirmar(\'' + comp.id + '\', \'' + comp.driveUrl + '\', \'' + cuadro.nombre + '\', \'' + comp.username + '\')">' +
            'Ver y Confirmar</button>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

function verYConfirmar(compId, driveUrl, cuadroNombre, username) {
    if (confirm('¿Confirmar pago de ' + username + '?\n\nSe abrirá Drive para verificar.')) {
        window.open(driveUrl, '_blank');
        
        setTimeout(async function() {
            if (confirm('¿Ya verificaste el comprobante? ¿Confirmar pago?')) {
                var result = await confirmarComprobanteDrive(compId, usuarioActual.usuario);
                if (result.success) {
                    alert('✅ Pago confirmado');
                    await cargarComprobantesAdmin();
                }
            }
        }, 1000);
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}
