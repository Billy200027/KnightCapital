// admin.js - VERSIÓN SUPABASE FUNCIONAL

const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var usuarioActual = null;

document.addEventListener('DOMContentLoaded', function() {
    verificarAdmin();
    configurarMenu();
    mostrarUsuarios();
    mostrarCuentasBancarias();
    
    document.getElementById('formUsuario').addEventListener('submit', crearUsuario);
    document.getElementById('formBanco').addEventListener('submit', crearCuentaBancaria);
});

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

function verificarAdmin() {
    var sesion = JSON.parse(localStorage.getItem('sesionActiva'));
    
    if (!sesion || sesion.rol !== 'admin') {
        window.location.href = 'panel.html';
        return;
    }
    
    usuarioActual = sesion;
    document.getElementById('nombreUsuario').textContent = sesion.usuario;
}

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
    
    try {
        // Verificar si existe
        const { data: existentes, error: errExistentes } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username);
        
        if (errExistentes) throw errExistentes;
        
        if (existentes && existentes.length > 0) {
            alert('Este nombre de usuario ya existe');
            return;
        }
        
        // Crear usuario
        const { error } = await supabase
            .from('usuarios')
            .insert([{
                usuario: username,
                password: password,
                rol: rol,
                status: 'active',
                fecha_registro: new Date().toISOString()
            }]);
        
        if (error) {
            alert('Error creando usuario: ' + error.message);
            return;
        }
        
        document.getElementById('formUsuario').reset();
        mostrarUsuarios();
        alert('Usuario creado exitosamente');
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error de conexión');
    }
}

async function mostrarUsuarios() {
    var tbody = document.getElementById('tablaUsuarios');
    
    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('fecha_registro', { ascending: false });
        
        if (error) {
            tbody.innerHTML = '<tr><td colspan="5">Error cargando usuarios</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        for (var i = 0; i < (usuarios || []).length; i++) {
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
                '<td>' + (u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString() : 'Nunca') + '</td>' +
                '<td>' +
                '<button class="btn-delete" onclick="eliminarUsuario(\'' + u.id + '\')">' +
                'Eliminar' +
                '</button>' +
                '</td>';
            
            tbody.appendChild(tr);
        }
        
    } catch (err) {
        console.error('Error:', err);
        tbody.innerHTML = '<tr><td colspan="5">Error de conexión</td></tr>';
    }
}

async function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) {
        return;
    }
    
    try {
        const { error: errUpdate } = await supabase
            .from('usuarios')
            .update({ status: 'inactive' })
            .eq('id', userId);
        
        if (errUpdate) throw errUpdate;
        
        mostrarUsuarios();
        alert('Usuario desactivado correctamente.');
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error eliminando usuario');
    }
}

async function crearCuentaBancaria(e) {
    e.preventDefault();
    
    var cuenta = {
        banco: document.getElementById('bankNombre').value,
        numero: document.getElementById('bankNumero').value,
        titular: document.getElementById('bankTitular').value,
        tipo: document.getElementById('bankTipo').value,
        fecha_registro: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from('cuentas_bancarias')
            .insert([cuenta]);
        
        if (error) {
            alert('Error registrando cuenta: ' + error.message);
            return;
        }
        
        document.getElementById('formBanco').reset();
        mostrarCuentasBancarias();
        alert('Cuenta bancaria registrada');
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error de conexión');
    }
}

async function mostrarCuentasBancarias() {
    var contenedor = document.getElementById('listaCuentas');
    
    try {
        const { data: cuentas, error } = await supabase
            .from('cuentas_bancarias')
            .select('*')
            .order('fecha_registro', { ascending: false });
        
        if (error) {
            contenedor.innerHTML = '<p class="empty">Error cargando cuentas</p>';
            return;
        }
        
        if (!cuentas || cuentas.length === 0) {
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
        
    } catch (err) {
        console.error('Error:', err);
        contenedor.innerHTML = '<p class="empty">Error de conexión</p>';
    }
}

async function eliminarCuenta(cuentaId) {
    if (!confirm('¿Eliminar esta cuenta bancaria?')) return;
    
    try {
        const { error } = await supabase
            .from('cuentas_bancarias')
            .delete()
            .eq('id', cuentaId);
        
        if (error) {
            alert('Error eliminando cuenta');
            return;
        }
        
        mostrarCuentasBancarias();
        
    } catch (err) {
        console.error('Error:', err);
        alert('Error de conexión');
    }
}

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}
