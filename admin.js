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
        const { data: existentes, error: errExistentes } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username);
        
        if (errExistentes) throw errExistentes;
        
        if (existentes && existentes.length > 0) {
            alert('Este nombre de usuario ya existe');
            return;
        }
        
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
        
       

