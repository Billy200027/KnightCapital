// admin.js - VERSIÓN CORREGIDA
// LÓGICA DE LA PÁGINA DE ADMINISTRACIÓN

var usuarioActual = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que sea admin
    verificarAdmin();
    
    // Configurar menú móvil
    configurarMenu();
    
    // Mostrar datos iniciales
    mostrarUsuarios();
    mostrarCuentasBancarias();
    
    // Configurar formularios
    document.getElementById('formUsuario').addEventListener('submit', crearUsuario);
    document.getElementById('formBanco').addEventListener('submit', crearCuentaBancaria);
});

// Configurar menú móvil
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

// Verificar que el usuario actual sea admin
function verificarAdmin() {
    var sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    if (!sesion || sesion.rol !== 'admin') {
        window.location.href = 'panel.html';
        return;
    }
    
    usuarioActual = sesion;
    document.getElementById('nombreUsuario').textContent = sesion.usuario;
}

// Cambiar entre tabs (Usuarios / Bancos)
function mostrarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// Crear nuevo usuario
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

// Mostrar tabla de usuarios
function mostrarUsuarios() {
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var tbody = document.getElementById('tablaUsuarios');
    
    tbody.innerHTML = '';
    
    for (var i = 0; i < usuarios.length; i++) {
        var u = usuarios[i];
        
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
}

// Eliminar usuario
function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?\n\nSi tiene cuadros activos, se crearán penalizaciones automáticamente.')) {
        return;
    }
    
    var usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var penalizaciones = JSON.parse(localStorage.getItem('penalizaciones')) || [];
    
    var usuarioEliminar = null;
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].id === userId) {
            usuarioEliminar = usuarios[i];
            break;
        }
    }
    
    if (!usuarioEliminar) return;
    
    var cuadrosActivos = [];
    for (var j = 0; j < cuadros.length; j++) {
        var cuadro = cuadros[j];
        
        if (cuadro.estado === 'completado') continue;
        
        for (var k = 0; k < cuadro.participantes.length; k++) {
            if (cuadro.participantes[k].userId === userId && !cuadro.participantes[k].esSistema) {
                cuadrosActivos.push(cuadro);
                break;
            }
        }
    }
    
    for (var m = 0; m < cuadrosActivos.length; m++) {
        var c = cuadrosActivos[m];
        
        var penalizacion = {
            id: 'penalty_' + Date.now() + '_' + m,
            userId: userId,
            username: usuarioEliminar.usuario,
            cuadroId: c.id,
            cuadroNombre: c.nombre,
            monto: 0.50,
            estado: 'pendiente',
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            semanasPendientes: 0
        };
        
        penalizaciones.push(penalizacion);
    }
    
    for (var n = 0; n < usuarios.length; n++) {
        if (usuarios[n].id === userId) {
            usuarios[n].status = 'inactive';
            break;
        }
    }
    
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('penalizaciones', JSON.stringify(penalizaciones));
    
    mostrarUsuarios();
    
    var mensaje = 'Usuario eliminado.';
    if (cuadrosActivos.length > 0) {
        mensaje += ' Se crearon ' + cuadrosActivos.length + ' penalizaciones.';
    }
    alert(mensaje);
}

// Crear cuenta bancaria
function crearCuentaBancaria(e) {
    e.preventDefault();
    
    var cuenta = {
        id: 'bank_' + Date.now(),
        banco: document.getElementById('bankNombre').value,
        numero: document.getElementById('bankNumero').value,
        titular: document.getElementById('bankTitular').value,
        tipo: document.getElementById('bankTipo').value,
        fechaRegistro: new Date().toISOString()
    };
    
    var cuentas = JSON.parse(localStorage.getItem('cuentasBancarias')) || [];
    cuentas.push(cuenta);
    
    localStorage.setItem('cuentasBancarias', JSON.stringify(cuentas));
    
    document.getElementById('formBanco').reset();
    mostrarCuentasBancarias();
    
    alert('Cuenta bancaria registrada');
}

// Mostrar cuentas bancarias
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
        
        div.innerHTML = 
            '<div class="account-info">' +
            '<h4>' + c.banco + '</h4>' +
            '<p>Cuenta: •••• ' + c.numero.slice(-4) + '</p>' +
            '<p>Titular: ' + c.titular + '</p>' +
            '<span class="account-type">' + c.tipo + '</span>' +
            '</div>' +
            '<button class="btn-delete" onclick="eliminarCuenta(\'' + c.id + '\')">Eliminar</button>';
        
        contenedor.appendChild(div);
    }
}

// Eliminar cuenta bancaria
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

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}


