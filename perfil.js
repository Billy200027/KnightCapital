// perfil.js - VERSIÓN GOOGLE SHEETS

var usuarioActual = null;
var esAdmin = false;

document.addEventListener('DOMContentLoaded', async function() {
    verificarSesion();
    configurarInterfaz();
    await cargarDatosUsuario();
    await cargarCuentasAdmin();
    await cargarNotificaciones();
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

async function cargarDatosUsuario() {
    await refreshCache(true);
    var usuarios = getCachedUsuarios();
    var usuario = usuarios.find(function(u) { return u.id === usuarioActual.id; });
    
    if (!usuario) return;
    
    document.getElementById('infoUsuario').textContent = usuario.usuario;
    document.getElementById('infoRol').textContent = usuario.rol === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('infoFecha').textContent = new Date(usuario.fechaRegistro).toLocaleDateString('es-ES');
    
    if (usuario.cuentaBancaria) {
        mostrarCuentaGuardada(usuario.cuentaBancaria);
    }
}

function mostrarCuentaGuardada(cuenta) {
    var contenedor = document.getElementById('miCuentaBancaria');
    contenedor.innerHTML = 
        '<div class="mi-cuenta-guardada">' +
        '<h4>✅ Cuenta Bancaria Registrada</h4>' +
        '<p><strong>Banco:</strong> ' + cuenta.banco + '</p>' +
        '<p><strong>Cuenta:</strong> •••• ' + cuenta.numero.slice(-4) + '</p>' +
        '<p><strong>Tipo:</strong> ' + cuenta.tipo + '</p>' +
        '<p><strong>Titular:</strong> ' + cuenta.titular + '</p>' +
        '<button onclick="editarMiCuenta()" class="btn-secondary" style="margin-top: 15px;">Editar Cuenta</button>' +
        '</div>';
}

function editarMiCuenta() {
    location.reload();
}

document.getElementById('formMiBanco').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var cuenta = {
        banco: document.getElementById('miBanco').value,
        numero: document.getElementById('miNumeroCuenta').value,
        tipo: document.getElementById('miTipoCuenta').value,
        titular: document.getElementById('miTitular').value
    };
    
    var result = await actualizarUsuarioSheets(usuarioActual.id, {
        cuentaBancaria: cuenta
    });
    
    if (!result.success) {
        alert('Error al guardar cuenta');
        return;
    }
    
    await refreshCache(true);
    mostrarCuentaGuardada(cuenta);
    alert('Cuenta bancaria guardada correctamente');
});

document.getElementById('formPassword').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var actual = document.getElementById('passActual').value;
    var nueva = document.getElementById('passNueva').value;
    var confirmar = document.getElementById('passConfirmar').value;
    
    if (nueva !== confirmar) {
        alert('Las contraseñas nuevas no coinciden');
        return;
    }
    
    if (nueva.length < 4) {
        alert('La contraseña debe tener al menos 4 caracteres');
        return;
    }
    
    // Verificar actual primero
    var loginCheck = await loginSheets(usuarioActual.usuario, actual);
    if (!loginCheck.success) {
        alert('Contraseña actual incorrecta');
        return;
    }
    
    var result = await actualizarUsuarioSheets(usuarioActual.id, {
        password: nueva
    });
    
    if (!result.success) {
        alert('Error al cambiar contraseña');
        return;
    }
    
    this.reset();
    alert('Contraseña actualizada correctamente');
});

async function cargarCuentasAdmin() {
    await refreshCache(true);
    var cuentas = getCachedCuentasBanco();
    var contenedor = document.getElementById('cuentasAdmin');
    
    var activas = cuentas.filter(function(c) { return c.activa !== false; });
    
    if (activas.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay cuentas bancarias disponibles para pagos</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    for (var i = 0; i < activas.length; i++) {
        var c = activas[i];
        var div = document.createElement('div');
        div.className = 'account-card';
        
        div.innerHTML = 
            '<div class="account-info">' +
            '<h4>' + c.banco + '</h4>' +
            '<p>Cuenta: •••• ' + c.numero.slice(-4) + '</p>' +
            '<p>Titular: ' + c.titular + '</p>' +
            '<span class="account-type">' + c.tipo + '</span>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

async function cargarNotificaciones() {
    // Las notificaciones se generan localmente basadas en cuadros
    var cuadros = getCachedCuadros();
    var contenedor = document.getElementById('listaNotificaciones');
    var contador = document.getElementById('contadorNotif');
    
    var notificaciones = [];
    
    // Generar notificaciones de pagos pendientes
    for (var i = 0; i < cuadros.length; i++) {
        var cuadro = cuadros[i];
        if (cuadro.estado !== 'activo') continue;
        
        var miParticipacion = cuadro.participantes.find(function(p) {
            return p.userId === usuarioActual.id;
        });
        
        if (!miParticipacion) continue;
        
        // Verificar si ya pagó esta semana (buscar comprobante)
        var comps = await getComprobantesDrive(cuadro.id);
        var yaPago = comps.find(function(c) {
            return c.userId === usuarioActual.id && 
                   parseInt(c.semana) === cuadro.semanaActual;
        });
        
        if (!yaPago && miParticipacion.numero !== cuadro.semanaActual) {
            // Debe pagar
            notificaciones.push({
                tipo: 'pago_requerido',
                mensaje: 'Semana ' + cuadro.semanaActual + ' de ' + cuadro.nombre + ': Debes pagar $' + cuadro.montoSemanal,
                cuadroNombre: cuadro.nombre,
                fecha: new Date().toLocaleDateString(),
                leida: false
            });
        } else if (yaPago && yaPago.estado === 'confirmado') {
            // Pago confirmado
            notificaciones.push({
                tipo: 'pago_confirmado',
                mensaje: '✅ Tu pago de la semana ' + cuadro.semanaActual + ' ha sido confirmado',
                cuadroNombre: cuadro.nombre,
                fecha: new Date(yaPago.fechaConfirmacion).toLocaleDateString(),
                leida: true
            });
        }
    }
    
    contador.textContent = notificaciones.filter(function(n) { return !n.leida; }).length;
    
    if (notificaciones.length === 0) {
        contenedor.innerHTML = '<p class="empty">No tienes notificaciones</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    notificaciones.sort(function(a, b) {
        return (a.leida === b.leida) ? 0 : a.leida ? 1 : -1;
    });
    
    for (var i = 0; i < notificaciones.length; i++) {
        var n = notificaciones[i];
        var div = document.createElement('div');
        div.className = 'notif-item ' + (n.leida ? 'leida' : 'nueva');
        
        div.innerHTML = 
            '<div class="notif-mensaje">' + n.mensaje + '</div>' +
            '<div class="notif-meta">' +
            '<span class="notif-cuadro">' + n.cuadroNombre + '</span>' +
            '<span>' + n.fecha + '</span>' +
            '</div>';
        
        contenedor.appendChild(div);
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}
