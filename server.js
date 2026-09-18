// ==========================================
// VARIABLES DE ENTORNO
// ==========================================

require("dotenv").config();

// ==========================================
// IMPORTACIONES
// ==========================================


// Express nos permite crear el servidor y nuestra API REST
const express = require("express");

// fs permite leer y escribir archivos
const fs = require("fs");

// path permite trabajar con rutas de archivos
const path = require("path");

const cors = require("cors");


// ==========================================
// CONFIGURACIÓN DEL SERVIDOR
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;

const HORARIOS_PERMITIDOS = [
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00"
];

let colaReservas = Promise.resolve();

// Permite recibir información en formato JSON
app.use(express.json({
    limit: "20kb"
}));


app.use(cors({
    origin: [
        "https://luxautocr.com",
        "https://www.luxautocr.com"
    ]
}));

// ==========================================
// ARCHIVOS PÚBLICOS DEL FRONTEND
// ==========================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


app.get("/styles.css", (req, res) => {
    res.sendFile(
        path.join(__dirname, "styles.css")
    );
});


app.get("/reservas.js", (req, res) => {
    res.sendFile(
        path.join(__dirname, "reservas.js")
    );
});


app.use(
    "/img",
    express.static(
        path.join(__dirname, "img")
    )
);


// ==========================================
// UBICACIÓN DEL ARCHIVO DE RESERVAS
// ==========================================

const rutaReservas = path.join(
    __dirname,
    "public",
    "assets",
    "reservas.json"
);

// ==========================================
// OBTENER FECHA ACTUAL
// ==========================================

function obtenerFechaActual() {

    const hoy = new Date();

    const anio = hoy.getFullYear();

    const mes = String(
        hoy.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoy.getDate()
    ).padStart(2, "0");


    return `${anio}-${mes}-${dia}`;
}


// ==========================================
// CONVERTIR HORA A MINUTOS
// ==========================================

function horaAMinutos(hora) {

    // Separamos "13:30" en:
    // horas = 13
    // minutos = 30
    const [horas, minutos] = hora
        .split(":")
        .map(Number);

    // Convertimos todo a minutos
    return (horas * 60) + minutos;
}


// ==========================================
// RUTA DE PRUEBA
// ==========================================

app.get("/api/prueba", (req, res) => {

    res.json({
        mensaje: "Servidor de LuxAuto funcionando correctamente"
    });

});

// ==========================================
// CONSULTAR DISPONIBILIDAD
// GET /api/disponibilidad?fecha=AAAA-MM-DD
// ==========================================

app.get("/api/disponibilidad", async (req, res) => {

    try {

        // Obtenemos la fecha enviada en la URL
        const fecha = req.query.fecha;


        // ======================================
        // VALIDAR FECHA
        // ======================================

        if (!fecha) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "Debe indicar una fecha para consultar disponibilidad."
            });

        }


        // ======================================
        // LEER RESERVAS
        // ======================================

        const contenido =
            await fs.promises.readFile(
                rutaReservas,
                "utf8"
            );


        const datos =
            JSON.parse(contenido);


        // ======================================
        // OBTENER RESERVAS DEL DÍA
        // ======================================

        const reservasDelDia =
            datos.reservas.filter((reserva) => {

                return reserva.fecha === fecha;

            });


        // ======================================
        // OBTENER SOLO LAS HORAS
        // ======================================

        const horariosOcupados =
            reservasDelDia.map((reserva) => {

                return reserva.hora;

            });


        // ======================================
        // RESPUESTA
        // ======================================

        return res.json({
            fecha: fecha,
            horariosOcupados: horariosOcupados
        });

    }
    catch (error) {

        console.error(
            "Error consultando disponibilidad:",
            error
        );


        return res.status(500).json({
            exito: false,
            mensaje:
                "No fue posible consultar la disponibilidad."
        });

    }

});


// ==========================================
// CREAR UNA RESERVA
// POST /api/reservas
// ==========================================

async function procesarReserva(req, res) {

    try {

        // ======================================
        // INFORMACIÓN RECIBIDA
        // ======================================

        const {
            nombre,
            vehiculo,
            fecha,
            hora
        } = req.body;

        // ======================================
        // VALIDAR TIPOS DE DATOS
        // ======================================

        if (
            typeof nombre !== "string" ||
            typeof vehiculo !== "string" ||
            typeof fecha !== "string" ||
            typeof hora !== "string"
        ) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "Los datos enviados no tienen un formato válido."
            });

        }

        // ======================================
        // VALIDAR CAMPOS
        // ======================================

        if (!nombre || !vehiculo || !fecha || !hora) {

            return res.status(400).json({
                exito: false,
                mensaje: "Todos los campos son obligatorios."
            });

        }


        // ======================================
        // LIMPIAR TEXTOS
        // ======================================

        const nombreLimpio = nombre.trim();
        const vehiculoLimpio = vehiculo.trim();


        // ======================================
        // VALIDAR LONGITUD
        // ======================================

        if (
            nombreLimpio.length < 2 ||
            nombreLimpio.length > 80
        ) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "El nombre debe contener entre 2 y 80 caracteres."
            });

        }


        if (
            vehiculoLimpio.length < 2 ||
            vehiculoLimpio.length > 100
        ) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "El vehículo debe contener entre 2 y 100 caracteres."
            });

        }

        // ======================================
        // VALIDAR FORMATO DE FECHA
        // ======================================

        const formatoFecha =
            /^\d{4}-\d{2}-\d{2}$/;


        if (!formatoFecha.test(fecha)) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "El formato de la fecha no es válido."
            });

        }


        // ======================================
        // VALIDAR FECHA
        // ======================================

        const fechaActual = obtenerFechaActual();

        if (fecha < fechaActual) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "No se pueden realizar reservas en fechas anteriores."
            });

        }


        // ======================================
        // VALIDAR HORARIO
        // ======================================

        if (!HORARIOS_PERMITIDOS.includes(hora)) {

            return res.status(400).json({
                exito: false,
                mensaje:
                    "La hora seleccionada no es válida."
            });

        }


        // ======================================
        // LEER RESERVAS EXISTENTES
        // ======================================

        const contenido =
            await fs.promises.readFile(
                rutaReservas,
                "utf8"
            );


        // Convertimos el texto JSON
        // en un objeto JavaScript
        const datos = JSON.parse(contenido);


        // ======================================
        // CALCULAR NUEVO HORARIO
        // ======================================

        const nuevoInicio =
            horaAMinutos(hora);

        // Cada reserva dura 2 horas
        const nuevoFin =
            nuevoInicio + 120;


        // ======================================
        // BUSCAR CRUCES
        // ======================================

        const existeCruce =
            datos.reservas.some((reserva) => {

                // Solo nos interesan las reservas
                // del mismo día
                if (reserva.fecha !== fecha) {

                    return false;

                }


                const reservaInicio =
                    horaAMinutos(reserva.hora);

                const reservaFin =
                    reservaInicio + 120;


                return (
                    nuevoInicio < reservaFin &&
                    nuevoFin > reservaInicio
                );

            });


        // ======================================
        // SI EL HORARIO ESTÁ OCUPADO
        // ======================================

        if (existeCruce) {

            return res.status(409).json({
                exito: false,
                mensaje:
                    "La fecha y hora seleccionadas no están disponibles."
            });

        }


        // ======================================
        // CREAR RESERVA
        // ======================================

        const nuevaReserva = {

            nombre: nombreLimpio,
            vehiculo: vehiculoLimpio,
            fecha: fecha,
            hora: hora

        };


        datos.reservas.push(nuevaReserva);


        // ======================================
        // GUARDAR RESERVAS
        // ======================================

        await fs.promises.writeFile(
            rutaReservas,
            JSON.stringify(datos, null, 4),
            "utf8"
        );


        // ======================================
        // RESPUESTA EXITOSA
        // ======================================

        return res.status(201).json({
            exito: true,
            mensaje:
                "Reserva realizada correctamente.",
            reserva: nuevaReserva
        });

    }
    catch (error) {

        // ======================================
        // MANEJO DE ERRORES
        // ======================================

        console.error(
            "Error procesando la reserva:",
            error
        );


        return res.status(500).json({
            exito: false,
            mensaje:
                "Ocurrió un error procesando la reserva."
        });

    }

};

// ==========================================
// RECIBIR SOLICITUD DE RESERVA
// ==========================================

app.post("/api/reservas", (req, res) => {

    // Agregamos esta reserva al final de la cola
    colaReservas = colaReservas
        .then(() => procesarReserva(req, res))
        .catch((error) => {

            console.error(
                "Error en la cola de reservas:",
                error
            );


            if (!res.headersSent) {

                res.status(500).json({
                    exito: false,
                    mensaje:
                        "Ocurrió un error procesando la reserva."
                });

            }

        });

});


// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log(
        `Servidor iniciado en http://localhost:${PORT}`
    );

});
