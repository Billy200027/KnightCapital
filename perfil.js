// perfil.js - Lógica de la página de perfil

var usuarioActual = null;
var esAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    configurarInterfaz();
    cargarDatosUsuario();
    cargarCuentasAdmin();
    cargarNotificaciones();
    limpiarNotificacionesViejas();
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

function cargarDatosUsuario() {
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var usuario = null;
    
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === usuarioActual.id) {
            usuario = usuarios[i];
            break;
        }
    }
    
    if (!usuario) return;
    
    document.getElementById('infoUsuario').textContent = usuario.usuario;
    document.getElementById('infoRol').textContent = usuario.rol === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('infoFecha').textContent = new Date(usuario.fechaRegistro).toLocaleDateString('es-ES');
    
    // Cargar cuenta bancaria si existe
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
    location.reload(); // Recarga para mostrar el formulario de nuevo
}

// Formulario de cuenta bancaria
document.getElementById('formMiBanco').addEventListener('submit', function(e) {
    e.preventDefault();
    
    var cuenta = {
        banco: document.getElementById('miBanco').value,
        numero: document.getElementById('miNumeroCuenta').value,
        tipo: document.getElementById('miTipoCuenta').value,
        titular: document.getElementById('miTitular').value
    };
    
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === usuarioActual.id) {
            usuarios[i].cuentaBancaria = cuenta;
            break;
        }
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    mostrarCuentaGuardada(cuenta);
    alert('Cuenta bancaria guardada correctamente');
});

// Cambiar contraseña
document.getElementById('formPassword').addEventListener('submit', function(e) {
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
    
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var encontrado = false;
    
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === usuarioActual.id && usuarios[i].password === actual) {
            usuarios[i].password = nueva;
            encontrado = true;
            break;
        }
    }
    
    if (!encontrado) {
        alert('Contraseña actual incorrecta');
        return;
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    this.reset();
    alert('Contraseña actualizada correctamente');
});

function cargarCuentasAdmin() {
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    var contenedor = document.getElementById('cuentasAdmin');
    
    // Filtrar solo activas
    var activas = [];
    for (var i = 0; i < cuentas.length; i++) {
        if (cuentas[i].activa !== false) {
            activas.push(cuentas[i]);
        }
    }
    
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

function cargarNotificaciones() {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones')) || [];
    var contenedor = document.getElementById('listaNotificaciones');
    var contador = document.getElementById('contadorNotif');
    
    var misNotifs = [];
    for (var i = 0; i < notificaciones.length; i++) {
        if (notificaciones[i].userId === usuarioActual.id) {
            misNotifs.push(notificaciones[i]);
        }
    }
    
    contador.textContent = misNotifs.length;
    
    if (misNotifs.length === 0) {
        contenedor.innerHTML = '<p class="empty">No tienes notificaciones</p>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    misNotifs.sort(function(a, b) {
        return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
    });
    
    contenedor.innerHTML = '';
    
    for (var i = 0; i < misNotifs.length; i++) {
        var n = misNotifs[i];
        var div = document.createElement('div');
        div.className = 'notif-item ' + (n.leida ? 'leida' : 'nueva');
        div.setAttribute('data-id', n.id);
        
        var fecha = new Date(n.fechaCreacion).toLocaleDateString('es-ES');
        
        div.innerHTML = 
            '<div class="notif-mensaje">' + n.mensaje + '</div>' +
            '<div class="notif-meta">' +
            '<span class="notif-cuadro">' + (n.cuadroNombre || 'General') + '</span>' +
            '<span>' + fecha + '</span>' +
            '</div>';
        
        if (!n.leida) {
            div.innerHTML += '<button class="btn-mark-read" onclick="marcarLeida(\'' + n.id + '\')">Marcar como leída</button>';
        }
        
        contenedor.appendChild(div);
    }
}

function marcarLeida(notifId) {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones')) || [];
    
    for (var i = 0; i < notificaciones.length; i++) {
        if (notificaciones[i].id === notifId) {
            notificaciones[i].leida = true;
            break;
        }
    }
    
    localStorage.setItem('notificaciones', JSON.stringify(notificaciones));
    cargarNotificaciones();
}

function limpiarNotificacionesViejas() {
    var notificaciones = JSON.parse(localStorage.getItem('notificaciones')) || [];
    var ahora = new Date();
    
    var filtradas = [];
    for (var i = 0; i < notificaciones.length; i++) {
        var fechaEliminar = new Date(notificaciones[i].autoEliminar);
        if (fechaEliminar > ahora) {
            filtradas.push(notificaciones[i]);
        }
    }
    
    if (filtradas.length !== notificaciones.length) {
        localStorage.setItem('notificaciones', JSON.stringify(filtradas));
        cargarNotificaciones();
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}


