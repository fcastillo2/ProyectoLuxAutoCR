// ==========================================
// ELEMENTOS DEL ADMINISTRADOR
// ==========================================

const claveAdmin =
    document.getElementById("claveAdmin");

const btnDescargar =
    document.getElementById("btnDescargar");

const mensajeAdmin =
    document.getElementById("mensajeAdmin");


// ==========================================
// DESCARGAR RESERVAS
// ==========================================

btnDescargar.addEventListener("click", async () => {

    // Limpiamos mensajes anteriores
    mensajeAdmin.textContent = "";
    mensajeAdmin.className = "mt-3";


    // ======================================
    // VALIDAR CLAVE
    // ======================================

    const clave = claveAdmin.value.trim();

    if (!clave) {

        mensajeAdmin.className =
            "alert alert-warning mt-3";

        mensajeAdmin.textContent =
            "Ingrese la clave administrativa.";

        return;

    }


    // ======================================
    // DESHABILITAR BOTÓN
    // ======================================

    btnDescargar.disabled = true;
    btnDescargar.textContent =
        "Preparando archivo...";


    try {

        // ==================================
        // SOLICITAR CSV AL SERVIDOR
        // ==================================

        const respuesta = await fetch(
            "/api/admin/reservas/csv",
            {
                method: "GET",

                headers: {
                    "X-Admin-Key": clave
                }
            }
        );


        // ==================================
        // VERIFICAR RESPUESTA
        // ==================================

        if (!respuesta.ok) {

            const datos =
                await respuesta.json();

            throw new Error(
                datos.mensaje ||
                "No fue posible descargar las reservas."
            );

        }


        // ==================================
        // CONVERTIR RESPUESTA EN ARCHIVO
        // ==================================

        const archivo =
            await respuesta.blob();


        // ==================================
        // CREAR URL TEMPORAL
        // ==================================

        const url =
            URL.createObjectURL(archivo);


        // ==================================
        // CREAR DESCARGA
        // ==================================

        const enlace =
            document.createElement("a");

        enlace.href = url;

        enlace.download =
            "reservas-luxauto.csv";


        document.body.appendChild(enlace);

        enlace.click();

        enlace.remove();


        // Liberamos la URL temporal
        URL.revokeObjectURL(url);


        // ==================================
        // MENSAJE EXITOSO
        // ==================================

        mensajeAdmin.className =
            "alert alert-success mt-3";

        mensajeAdmin.textContent =
            "Archivo descargado correctamente.";

    }
    catch (error) {

        console.error(
            "Error descargando reservas:",
            error
        );


        mensajeAdmin.className =
            "alert alert-danger mt-3";

        mensajeAdmin.textContent =
            error.message;

    }
    finally {

        // ==================================
        // REACTIVAR BOTÓN
        // ==================================

        btnDescargar.disabled = false;

        btnDescargar.textContent =
            "Descargar reservas";

    }

});