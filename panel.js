// panel.js - VERSIÓN SIMPLIFICADA SIN PENALIZACIONES
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

function mostrarCuadros() {
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var contenedor = document.getElementById('listaCuadros');
    
    if (cuadros.length === 0) {
        contenedor.innerHTML = '<p class="empty">No hay cuadros disponibles. ' + 
            (esAdmin ? 'Crea el primero usando el menú.' : 'Vuelve más tarde.') + '</p>';
        return;
    }
    
    contenedor.innerHTML = '';
    
    for (var i = 0; i < cuadros.length; i++) {
        var cuadro = cuadros[i];
        cuadro = actualizarEstadoCuadro(cuadro);
        var tarjeta = crearTarjetaCuadro(cuadro);
        contenedor.appendChild(tarjeta);
    }
    
    localStorage.setItem('cuadros', JSON.stringify(cuadros));
}

function actualizarEstadoCuadro(cuadro) {
    var ahora = new Date();
    var fechaCreacion = new Date(cuadro.fechaCreacion);
    
    var diasHastaViernes = (5 - fechaCreacion.getDay() + 7) % 7;
    if (diasHastaViernes === 0) diasHastaViernes = 7;
    
    var primerViernes = new Date(fechaCreacion);
    primerViernes.setDate(fechaCreacion.getDate() + diasHastaViernes);
    primerViernes.setHours(23, 59, 59, 999);
    
    if (ahora > primerViernes && cuadro.estado === 'abierto') {
        cuadro.estado = 'cerrado';
        completarCuadroAutomaticamente(cuadro);
    }
    
    if (cuadro.estado === 'activo' || cuadro.estado === 'cerrado') {
        var inicio = new Date(primerViernes);
        inicio.setDate(inicio.getDate() + 2);
        
        var diffTiempo = ahora - inicio;
        var diffSemanas = Math.floor(diffTiempo / (1000 * 60 * 60 * 24 * 7));
        
        if (diffSemanas >= 0) {
            cuadro.semanaActual = Math.min(diffSemanas + 1, cuadro.semanas);
            
            if (cuadro.semanaActual > cuadro.semanas) {
                cuadro.estado = 'completado';
            } else {
                cuadro.estado = 'activo';
            }
        }
    }
    
    return cuadro;
}

function completarCuadroAutomaticamente(cuadro) {
    var participantesReales = 0;
    for (var i = 0; i < cuadro.participantes.length; i++) {
        if (!cuadro.participantes[i].esSistema) {
            participantesReales++;
        }
    }
    
    var faltantes = cuadro.semanas - participantesReales;
    
    for (var i = 0; i < faltantes; i++) {
        var numero = encontrarNumeroDisponible(cuadro);
        if (numero !== null) {
            cuadro.participantes.push({
                userId: 'sistema_' + i,
                username: 'Disponible',
                numero: numero,
                esSistema: true,
                fechaIngreso: new Date().toISOString()
            });
        }
    }
}

function encontrarNumeroDisponible(cuadro) {
    for (var num = 1; num <= cuadro.semanas; num++) {
        if (cuadro.numerosBloqueados.indexOf(num) !== -1) continue;
        
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
        if (cuadro.participantes[i].userId === usuarioActual.id) {
            yaParticipa = true;
            miNumero = cuadro.participantes[i].numero;
            break;
        }
    }
    
    var participantesReales = 0;
    for (var i = 0; i < cuadro.participantes.length; i++) {
        if (!cuadro.participantes[i].esSistema) {
            participantesReales++;
        }
    }
    
    var ocupadosParaUsuario = participantesReales + cuadro.numerosBloqueados.length;
    var disponiblesParaUsuario = cuadro.semanas - ocupadosParaUsuario;
    var progreso = (ocupadosParaUsuario / cuadro.semanas) * 100;
    
    var html = '<div class="cuadro-header">' +
        '<h3>' + cuadro.nombre + '</h3>' +
        '<span class="estado ' + estadoClass + '">' + estadoTexto + '</span>' +
        '</div>' +
        '<div class="cuadro-info">' +
        '<div class="info-row"><span>Semanas:</span> <strong>' + cuadro.semanas + '</strong></div>' +
        '<div class="info-row"><span>Monto semanal:</span> <strong>$' + cuadro.montoSemanal + '</strong></div>' +
        '<div class="info-row"><span>Total a recibir:</span> <strong>$' + (cuadro.semanas * cuadro.montoSemanal) + '</strong></div>' +
        '<div class="info-row"><span>Disponibles:</span> <strong>' + disponiblesParaUsuario + ' de ' + cuadro.semanas + '</strong></div>';
    
    if (cuadro.estado === 'activo' && cuadro.semanaActual) {
        html += '<div class="info-row"><span>Semana actual:</span> <strong>' + cuadro.semanaActual + '/' + cuadro.semanas + '</strong></div>';
        
        var tocaEstaSemana = null;
        for (var j = 0; j < cuadro.participantes.length; j++) {
            if (cuadro.participantes[j].numero === cuadro.semanaActual) {
                tocaEstaSemana = cuadro.participantes[j];
                break;
            }
        }
        if (tocaEstaSemana) {
            html += '<div class="info-row"><span>Le toca el número:</span> <strong>#' + cuadro.semanaActual + '</strong></div>';
        }
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

function unirseACuadro(cuadroId) {
    if (esAdmin) {
        alert('El administrador no puede participar en cuadros.');
        return;
    }
    
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var cuadro = null;
    var index = -1;
    
    for (var i = 0; i < cuadros.length; i++) {
        if (cuadros[i].id === cuadroId) {
            cuadro = cuadros[i];
            index = i;
            break;
        }
    }
    
    if (!cuadro || cuadro.estado !== 'abierto') {
        alert('Este cuadro ya no está disponible.');
        return;
    }
    
    for (var j = 0; j < cuadro.participantes.length; j++) {
        if (cuadro.participantes[j].userId === usuarioActual.id) {
            alert('Ya estás en este cuadro.');
            return;
        }
    }
    
    var numeroAsignado = generarNumeroAleatorio(cuadro);
    
    if (!numeroAsignado) {
        alert('No hay números disponibles.');
        return;
    }
    
    cuadro.participantes.push({
        userId: usuarioActual.id,
        username: usuarioActual.usuario,
        numero: numeroAsignado,
        esSistema: false,
        fechaIngreso: new Date().toISOString()
    });
    
    cuadros[index] = cuadro;
    localStorage.setItem('cuadros', JSON.stringify(cuadros));
    
    mostrarModalNumero(numeroAsignado);
    mostrarCuadros();
}

function generarNumeroAleatorio(cuadro) {
    var disponibles = [];
    
    for (var num = 1; num <= cuadro.semanas; num++) {
        if (cuadro.numerosBloqueados.indexOf(num) !== -1) continue;
        
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

document.getElementById('formCuadro').addEventListener('submit', function(e) {
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
        montoSemanal: monto,
        numerosBloqueados: bloqueados,
        participantes: [],
        estado: 'abierto',
        semanaActual: 0,
        fechaCreacion: new Date().toISOString(),
        creadoPor: usuarioActual.id
    };
    
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    cuadros.push(nuevoCuadro);
    localStorage.setItem('cuadros', JSON.stringify(cuadros));
    
    cerrarModal();
    this.reset();
    mostrarCuadros();
    
    alert('Cuadro creado exitosamente.');
});

function cerrarSesion() {
    localStorage.removeItem('sesionActiva');
    window.location.href = 'login.html';
}

function verDetallesCuadro(cuadroId) {
    var cuadros = JSON.parse(localStorage.getItem('cuadros')) || [];
    var cuadro = null;
    
    for (var i = 0; i < cuadros.length; i++) {
        if (cuadros[i].id === cuadroId) {
            cuadro = cuadros[i];
            break;
        }
    }
    
    if (!cuadro) return;
    
    var mensaje = 'CUADRO: ' + cuadro.nombre + '\n\n';
    mensaje += 'PARTICIPANTES Y SUS NÚMEROS:\n';
    
    var ordenados = cuadro.participantes.slice().sort(function(a, b) {
        return a.numero - b.numero;
    });
    
    for (var j = 0; j < ordenados.length; j++) {
        var p = ordenados[j];
        mensaje += 'Número ' + p.numero + ': ' + p.username;
        if (p.esSistema) mensaje += ' (Sistema)';
        mensaje += '\n';
    }
    
    if (cuadro.numerosBloqueados.length > 0) {
        mensaje += '\nNÚMEROS BLOQUEADOS: ' + cuadro.numerosBloqueados.join(', ');
    }
    
    alert(mensaje);
}

