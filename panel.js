// panel.js - VERSIÓN SUPABASE FUNCIONAL

const SUPABASE_URL = 'https://ulylpdeutafjuuevdllz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rygFKvTzyxTvn9SfTHcYdA_tEeS6OTH';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var usuarioActual = null;
var esAdmin = false;

document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    configurarInterfaz();
    mostrarCuadros();
    setInterval(mostrarCuadros, 60000);
    mostrarFecha();
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

function mostrarFecha() {
    var opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    var fecha = new Date().toLocaleDateString('es-ES', opciones);
    document.getElementById('fechaActual').textContent = fecha;
}

async function mostrarCuadros() {
    var contenedor = document.getElementById('listaCuadros');
    
    try {
        const { data: cuadros, error } = await supabase
            .from('cuadros')
            .select('*');
        
        if (error) {
            contenedor.innerHTML = '<p class="empty">Error cargando cuadros</p>';
            return;
        }
        
        if (!cuadros || cuadros.length === 0) {
            contenedor.innerHTML = '<p class="empty">No hay cuadros disponibles. ' + 
                (esAdmin ? 'Crea el primero usando el menú.' : 'Vuelve más tarde.') + '</p>';
            return;
        }
        
        const { data: participantes, error: errPart } = await supabase
            .from('participantes')
            .select('*');
        
        contenedor.innerHTML = '';
        
        for (var i = 0; i < cuadros.length; i++) {
            var cuadro = cuadros[i];
            cuadro.participantes = [];
            for (var j = 0; j < (participantes || []).length; j++) {
                if (participantes[j].cuadro_id === cuadro.id) {
                    cuadro.participantes.push(participantes[j]);
                }
            }
            
            cuadro = actualizarEstadoCuadro(cuadro);
            
            if (cuadro.estado_cambiado) {
                await supabase
                    .from('cuadros')
                    .update({ 
                        estado: cuadro.estado,
                        semana_actual: cuadro.semana_actual
                    })
                    .eq('id', cuadro.id);
            }
            
            var tarjeta = crearTarjetaCuadro(cuadro);
            contenedor.appendChild(tarjeta);
        }
        
    } catch (err) {
        contenedor.innerHTML = '<p class="empty">Error de conexión</p>';
    }
}

function actualizarEstadoCuadro(cuadro) {
    var ahora = new Date();
    var fechaCreacion = new Date(cuadro.fecha_creacion);
    
    var diasHastaViernes = (5 - fechaCreacion.getDay() + 7) % 7;
    if (diasHastaViernes === 0) diasHastaViernes = 7;
    
    var primerViernes = new Date(fechaCreacion);
    primerViernes.setDate(fechaCreacion.getDate() + diasHastaViernes);
    primerViernes.setHours(23, 59, 59, 999);
    
    cuadro.estado_cambiado = false;
    
    if (ahora > primerViernes && cuadro.estado === 'abierto') {
        cuadro.estado = 'cerrado';
        cuadro.estado_cambiado = true;
        completarCuadroAutomaticamente(cuadro);
    }
    
    if ((cuadro.estado === 'activo' || cuadro.estado === 'cerrado') && cuadro.estado !== 'completado') {
        var inicio = new Date(primerViernes);
        inicio.setDate(inicio.getDate() + 2);
        
        var diffTiempo = ahora - inicio;
        var diffSemanas = Math.floor(diffTiempo / (1000 * 60 * 60 * 24 * 7));
        
        if (diffSemanas >= 0) {
            var nuevaSemana = Math.min(diffSemanas + 1, cuadro.semanas);
            if (nuevaSemana !== cuadro.semana_actual) {
                cuadro.semana_actual = nuevaSemana;
                cuadro.estado_cambiado = true;
            }
            
            if (cuadro.semana_actual > cuadro.semanas) {
                cuadro.estado = 'completado';
                cuadro.estado_cambiado = true;
            } else {
                cuadro.estado = 'activo';
                cuadro.estado_cambiado = true;
            }
        }
    }
    
    return cuadro;
}

async function completarCuadroAutomaticamente(cuadro) {
    var participantesReales = 0;
    for (var i = 0; i < cuadro.participantes.length; i++) {
        if (!cuadro.participantes[i].es_sistema) {
            participantesReales++;
        }
    }
    
    var faltantes = cuadro.semanas - participantesReales;
    
    for (var i = 0; i < faltantes; i++) {
        var numero = encontrarNumeroDisponible(cuadro);
        if (numero !== null) {
            var nuevoParticipante = {
                cuadro_id: cuadro.id,
                user_id: null,
                numero: numero,
                es_sistema: true,
                fecha_ingreso: new Date().toISOString()
            };
            
            await supabase.from('participantes').insert([nuevoParticipante]);
            cuadro.participantes.push(nuevoParticipante);
        }
    }
}

function encontrarNumeroDisponible(cuadro) {
    for (var num = 1; num <= cuadro.semanas; num++) {
        if (cuadro.numeros_bloqueados && cuadro.numeros_bloqueados.indexOf(num) !== -1) continue;
        
        var ocupado = false;
        for (var j = 0; j < cuadro.participantes.length; j++) {
            if (cuadro.participantes[j].numero === num) {
                ocupado = true;
                break;
            }
        }
        
        if (!ocupado) return num;
    }
    return null;
}

function crearTarjetaCuadro(cuadro) {
    var div = document.createElement('div');
    div.className = 'cuadro-card';
    
    var estadoClass = 'estado-' + cuadro.estado;
    var estadoTexto = cuadro.estado.toUpperCase();
    
    var yaParticipa = false;
    var miNumero = null;
    for (var i = 0; i < cuadro.participantes.length; i++) {
        if (cuadro.participantes[i].user_id === usuarioActual.id) {
            yaParticipa = true;
            miNumero = cuadro.participantes[i].numero;
            break;
        }
    }
    
    var participantesReales = 0;
    for (var i = 0; i < cuadro.participantes.length; i++) {
        if (!cuadro.participantes[i].es_sistema) {
            participantesReales++;
        }
    }
    
    var bloqueados = cuadro.numeros_bloqueados || [];
    var ocupadosParaUsuario = participantesReales + bloqueados.length;
    var disponiblesParaUsuario = cuadro.semanas - ocupadosParaUsuario;
    var progreso = (ocupadosParaUsuario / cuadro.semanas) * 100;
    
    var html = '<div class="cuadro-header">' +
        '<h3>' + cuadro.nombre + '</h3>' +
        '<span class="estado ' + estadoClass + '">' + estadoTexto + '</span>' +
        '</div>' +
        '<div class="cuadro-info">' +
        '<div class="info-row"><span>Semanas:</span> <strong>' + cuadro.semanas + '</strong></div>' +
        '<div class="info-row"><span>Monto semanal:</span> <strong>$' + cuadro.monto_semanal + '</strong></div>' +
        '<div class="info-row"><span>Total a recibir:</span> <strong>$' + (cuadro.semanas * cuadro.monto_semanal) + '</strong></div>' +
        '<div class="info-row"><span>Disponibles:</span> <strong>' + disponiblesParaUsuario + ' de ' + cuadro.semanas + '</strong></div>';
    
    if (cuadro.estado === 'activo' && cuadro.semana_actual) {
        html += '<div class="info-row"><span>Semana actual:</span> <strong>' + cuadro.semana_actual + '/' + cuadro.semanas + '</strong></div>';
    }
    
    html += '</div>' +
        '<div class="progress-container">' +
        '<div class="progress-bar">' +
        '<div class="progress-fill" style="width: ' + progreso + '%"></div>' +
        '</div>' +
        '<span class="progress-text">' + Math.round(progreso) + '% completado</span>' +
        '</div>';
    
    html += '<div class="cuadro-actions">';
    
    if (esAdmin) {
        html += '<button class="btn-secondary" onclick="verDetallesCuadro(\'' + cuadro.id + '\')">Ver Detalles</button>';
    } else if (yaParticipa) {
        html += '<div class="mi-numero">Tu número: ' + miNumero + '</div>';
    } else if (cuadro.estado === 'abierto' && disponiblesParaUsuario > 0) {
        html += '<button class="btn-primary" onclick="unirseACuadro(\'' + cuadro.id + '\')">Unirme al Cuadro</button>';
    } else {
        html += '<button class="btn-secondary" disabled>Cuadro Cerrado</button>';
    }
    
    html += '</div>';
    
    div.innerHTML = html;
    return div;
}

async function unirseACuadro(cuadroId) {
    if (esAdmin) {
        alert('El administrador no puede participar en cuadros.');
        return;
    }
    
    try {
        const { data: cuadros, error } = await supabase
            .from('cuadros')
            .select('*')
            .eq('id', cuadroId);
        
        if (error || !cuadros || cuadros.length === 0) {
            alert('Error al acceder al cuadro');
            return;
        }
        
        var cuadro = cuadros[0];
        
        if (cuadro.estado !== 'abierto') {
            alert('Este cuadro ya no está disponible.');
            return;
        }
        
        const { data: existentes, error: errExistentes } = await supabase
            .from('participantes')
            .select('*')
            .eq('cuadro_id', cuadroId)
            .eq('user_id', usuarioActual.id);
        
        if (errExistentes) throw errExistentes;
        
        if (existentes && existentes.length > 0) {
            alert('Ya estás en este cuadro.');
            return;
        }
        
        const { data: participantes, error: errPart } = await supabase
            .from('participantes')
            .select('*')
            .eq('cuadro_id', cuadroId);
        
        if (errPart) throw errPart;
        
        cuadro.participantes = participantes || [];
        
        var numeroAsignado = generarNumeroAleatorio(cuadro);
        
        if (!numeroAsignado) {
            alert('No hay números disponibles.');
            return;
        }
        
        const { error: errInsert } = await supabase
            .from('participantes')
            .insert([{
                cuadro_id: cuadroId,
                user_id: usuarioActual.id,
                numero: numeroAsignado,
                es_sistema: false,
                fecha_ingreso: new Date().toISOString()
            }]);
        
        if (errInsert) {
            alert('Error al unirse al cuadro');
            return;
        }
        
        mostrarModalNumero(numeroAsignado);
        mostrarCuadros();
        
    } catch (err) {
        alert('Error de conexión');
    }
}

function generarNumeroAleatorio(cuadro) {
    var disponibles = [];
    var bloqueados = cuadro.numeros_bloqueados || [];
    
    for (var num = 1; num <= cuadro.semanas; num++) {
        if (bloqueados.indexOf(num) !== -1) continue;
        
        var ocupado = false;
        for (var i = 0; i < cuadro.participantes.length; i++) {
            if (cuadro.participantes[i].numero === num) {
                ocupado = true;
                break;
            }
        }
        
        if (!ocupado) {
            disponibles.push(num);
        }
    }
    
    if (disponibles.length === 0) return null;
    
    var randomIndex = Math.floor(Math.random() * disponibles.length);
    return disponibles[randomIndex];
}

function mostrarModalNumero(numero) {
    document.getElementById('numeroAsignado').textContent = numero;
    document.getElementById('modalNumero').classList.add('active');
}

function cerrarModalNumero() {
    document.getElementById('modalNumero').classList.remove('active');
}

function mostrarCrearCuadro() {
    if (!esAdmin) return;
    document.getElementById('modalCuadro').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalCuadro').classList.remove('active');
}

document.getElementById('formCuadro').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!esAdmin) {
        alert('Solo el administrador puede crear cuadros.');
        return;
    }
    
    var nombre = document.getElementById('nombreCuadro').value;
    var semanas = parseInt(document.getElementById('numSemanas').value);
    var monto = parseInt(document.getElementById('montoSemanal').value);
    var bloqueadosInput = document.getElementById('numerosBloqueados').value;
    
    if (semanas < 5 || semanas > 25) {
        alert('El número de semanas debe estar entre 5 y 25');
        return;
    }
    
    var bloqueados = [];
    if (bloqueadosInput.trim() !== '') {
        var partes = bloqueadosInput.split(',');
        for (var i = 0; i < partes.length; i++) {
            var num = parseInt(partes[i].trim());
            if (!isNaN(num) && num > 0 && num <= semanas) {
                bloqueados.push(num);
            }
        }
    }
    
    var nuevoCuadro = {
        id: 'cuadro_' + Date.now(),
        nombre: nombre,
        semanas: semanas,
        monto_semanal: monto,
        numeros_bloqueados: bloqueados,
        estado: 'abierto',
        semana_actual: 0,
        fecha_creacion: new Date().toISOString(),
        creado_por: usuarioActual.id
    };
    
    try {
        const { error } = await supabase
            .from('cuadros')
            .insert([nuevoCuadro]);
        
        if (error) {
            alert('Error creando cuadro: ' + error.message);
            return;
        }
        
        cerrarModal();
        this.reset();
        mostrarCuadros();
        alert('Cuadro creado exitosamente.');
        
    } catch (err) {
        alert('Error de conexión');
    }
});

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}

async function verDetallesCuadro(cuadroId) {
    try {
        const { data: cuadros, error } = await supabase
            .from('cuadros')
            .select('*')
            .eq('id', cuadroId);
        
        if (error || !cuadros || cuadros.length === 0) return;
        
        var cuadro = cuadros[0];
        
        const { data: participantes, error: errPart } = await supabase
            .from('participantes')
            .select('*, usuarios(usuario)')
            .eq('cuadro_id', cuadroId);
        
        if (errPart) throw errPart;
        
        var mensaje = 'CUADRO: ' + cuadro.nombre + '\n\n';
        mensaje += 'PARTICIPANTES Y SUS NÚMEROS:\n';
        
        var ordenados = (participantes || []).sort(function(a, b) {
            return a.numero - b.numero;
        });
        
        for (var j = 0; j < ordenados.length; j++) {
            var p = ordenados[j];
            var nombre = p.usuarios ? p.usuarios.usuario : 'Sistema';
            mensaje += 'Número ' + p.numero + ': ' + nombre;
            if (p.es_sistema) mensaje += ' (Sistema)';
            mensaje += '\n';
        }
        
        if (cuadro.numeros_bloqueados && cuadro.numeros_bloqueados.length > 0) {
            mensaje += '\nNÚMEROS BLOQUEADOS: ' + cuadro.numeros_bloqueados.join(', ');
        }
        
        alert(mensaje);
        
    } catch (err) {
        alert('Error cargando detalles');
    }
}
