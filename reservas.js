// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API_URL = "";

// ==========================================
// OBTENER ELEMENTOS DEL HTML
// ==========================================

const formReserva = document.getElementById("formReserva");

const nombre = document.getElementById("nombre");
const vehiculo = document.getElementById("vehiculo");
const fecha = document.getElementById("fecha");
const hora = document.getElementById("hora");

const btnReservar = document.getElementById("btnReservar");
const mensajeReserva = document.getElementById("mensajeReserva");

// ==========================================
// FECHA MÍNIMA PARA RESERVAR
// ==========================================

function configurarFechaMinima() {

    const hoy = new Date();

    const anio = hoy.getFullYear();

    const mes = String(
        hoy.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoy.getDate()
    ).padStart(2, "0");


    const fechaActual =
        `${anio}-${mes}-${dia}`;


    fecha.min = fechaActual;

}

configurarFechaMinima();




// ==========================================
// CONVERTIR HORA A MINUTOS
// ==========================================

function horaAMinutos(horaTexto) {

    const [horas, minutos] = horaTexto
        .split(":")
        .map(Number);

    return (horas * 60) + minutos;
}


// ==========================================
// COMPROBAR SI UN HORARIO TIENE CRUCE
// ==========================================

function horarioTieneCruce(horaSeleccionada, reservasDelDia) {

    const nuevoInicio = horaAMinutos(horaSeleccionada);

    // Cada trabajo dura 1 hora
    const nuevoFin = nuevoInicio + 60;


    return reservasDelDia.some((reserva) => {

        const reservaInicio =
            horaAMinutos(reserva.hora);

        const reservaFin =
            reservaInicio + 60;


        return (
            nuevoInicio < reservaFin &&
            nuevoFin > reservaInicio
        );

    });

}

// ==========================================
// CONSULTAR HORARIOS DISPONIBLES
// ==========================================

async function actualizarHorariosDisponibles() {

    // Si todavía no se seleccionó una fecha,
    // no hacemos ninguna consulta
    if (!fecha.value) {
        return;
    }


    // Deshabilitamos temporalmente el select
    hora.disabled = true;


    try {

        // Consultamos las reservas existentes
        const respuesta = await fetch(
            `${API_URL}/api/disponibilidad?fecha=${encodeURIComponent(fecha.value)}`
        );


        if (!respuesta.ok) {
            throw new Error(
                "No fue posible consultar las reservas."
            );
        }

        // Convertimos la respuesta del servidor a JSON
        const datos = await respuesta.json();

        // ==================================
        // CREAR OPCIONES SEGÚN EL DÍA
        // ==================================

        // Limpiamos las opciones anteriores
        hora.innerHTML = "";


        // Creamos nuevamente la opción inicial
        const opcionInicial =
            document.createElement("option");

        opcionInicial.value = "";
        opcionInicial.textContent =
            "Seleccione una hora";

        opcionInicial.selected = true;
        opcionInicial.disabled = true;

        hora.appendChild(opcionInicial);


        // Creamos las horas enviadas por el servidor
        datos.horariosPermitidos.forEach((horaPermitida) => {

            const opcion =
                document.createElement("option");

            opcion.value = horaPermitida;
            opcion.textContent = horaPermitida;

            hora.appendChild(opcion);

        });


        // Convertimos las horas ocupadas en objetos
        // para poder reutilizar horarioTieneCruce()
        const reservasDelDia =
            datos.horariosOcupados.map((horaOcupada) => {

                return {
                    hora: horaOcupada
                };

            });


        // ==================================
        // REVISAR CADA OPCIÓN DE HORA
        // ==================================

        const opcionesHora =
            hora.querySelectorAll("option");


        opcionesHora.forEach((opcion) => {

            // Ignoramos:
            // "Seleccione una hora"
            if (!opcion.value) {
                return;
            }


            const ocupado = horarioTieneCruce(
                opcion.value,
                reservasDelDia
            );


            opcion.disabled = ocupado;


            // Guardamos el texto original una sola vez
            if (!opcion.dataset.textoOriginal) {

                opcion.dataset.textoOriginal =
                    opcion.textContent;

            }


            // Mostramos visualmente disponibilidad
            if (ocupado) {

                opcion.textContent =
                    opcion.dataset.textoOriginal +
                    " - No disponible";

            }
            else {

                opcion.textContent =
                    opcion.dataset.textoOriginal;

            }

        });


        // Volvemos a habilitar el select
        hora.disabled = false;

    }
    catch (error) {

        console.error(
            "Error consultando disponibilidad:",
            error
        );


        mensajeReserva.className =
            "alert alert-danger mt-4";

        mensajeReserva.textContent =
            "No fue posible consultar los horarios disponibles.";


        hora.disabled = false;

    }

}

// ==========================================
// CAMBIO DE FECHA
// ==========================================

fecha.addEventListener(
    "change",
    actualizarHorariosDisponibles
);


// ==========================================
// ESCUCHAR ENVÍO DEL FORMULARIO
// ==========================================

formReserva.addEventListener("submit", async (event) => {

    // Evita que el formulario recargue la página
    event.preventDefault();


    // ======================================
    // CREAR OBJETO DE RESERVA
    // ======================================

    const nuevaReserva = {

        nombre: nombre.value.trim(),
        vehiculo: vehiculo.value.trim(),
        fecha: fecha.value,
        hora: hora.value

    };


    // ======================================
    // LIMPIAR MENSAJE ANTERIOR
    // ======================================

    mensajeReserva.className = "mt-4";
    mensajeReserva.textContent = "";


    // ======================================
    // DESHABILITAR BOTÓN
    // ======================================

    btnReservar.disabled = true;
    btnReservar.textContent = "Procesando...";


    try {

        // ==================================
        // ENVIAR RESERVA AL SERVIDOR
        // ==================================

        const respuesta = await fetch(
            `${API_URL}/api/reservas`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(nuevaReserva)
            }
        );


        // Convertimos la respuesta a JSON
        const datos = await respuesta.json();

        // ==================================
        // RESERVA EXITOSA
        // ==================================

        if (respuesta.ok) {

            mensajeReserva.className =
                "alert alert-success mt-4";

            mensajeReserva.textContent =
                datos.mensaje;


            // Limpiamos el formulario
            formReserva.reset();

        }


        // ==================================
        // RESERVA RECHAZADA
        // ==================================

        else {

            mensajeReserva.className =
                "alert alert-danger mt-4";

            mensajeReserva.textContent =
                datos.mensaje;

        }

    }
    catch (error) {

        // ==================================
        // ERROR DE CONEXIÓN
        // ==================================

        console.error(
            "Error al realizar la reserva:",
            error
        );


        mensajeReserva.className =
            "alert alert-danger mt-4";

        mensajeReserva.textContent =
            "No fue posible conectar con el servidor. Inténtelo nuevamente.";

    }
    finally {

        // ==================================
        // REACTIVAR BOTÓN
        // ==================================

        btnReservar.disabled = false;
        btnReservar.textContent =
            "Realizar reserva";

    }

});