const supabaseUrl =
    "https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient =
    supabase.createClient(
        supabaseUrl,
        supabaseKey
    );

let usuarioActual = null;
let configuracionActual = null;

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("btnIngresar")
        ?.addEventListener("click", login);

    document
        .getElementById("btnInicio")
        ?.addEventListener("click", mostrarInicio);

    document
        .getElementById("btnAgenda")
        ?.addEventListener("click", mostrarAgenda);

    document
        .getElementById("btnHistorial")
        ?.addEventListener("click", mostrarHistorial);

    document
        .getElementById("btnConfiguracion")
        ?.addEventListener("click", mostrarConfiguracion);

    document
        .getElementById("btnGuardarTurno")
        ?.addEventListener("click", guardarTurno);

    document
        .getElementById("btnGuardarConfig")
        ?.addEventListener("click", guardarConfiguracion);

    document
        .getElementById("btnNuevoTurno")
        ?.addEventListener("click", () => {

            const form =
                document.getElementById("formTurno");

            if (!form) return;

            form.style.display =
                form.style.display === "none"
                    ? "block"
                    : "none";
        });
});

/* ================= LOGIN ================= */

async function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const { data, error } =
        await supabaseClient
            .from("usuarios")
            .select("*")
            .eq("username", username)
            .eq("password_hash", password)
            .single();

    if (error || !data) {

        alert(
            "Usuario o contraseña incorrectos"
        );

        return;
    }

    usuarioActual = data;

    document.getElementById(
        "login"
    ).style.display = "none";

    document.getElementById(
        "app"
    ).style.display = "block";

    await cargarConfiguracion();
    await cargarInicio();

    mostrarInicio();
}

/* ================= CONFIG ================= */

async function cargarConfiguracion() {

    const { data } =
        await supabaseClient
            .from("configuracion")
            .select("*")
            .eq(
                "usuario_id",
                usuarioActual.id
            )
            .single();

    if (!data) return;

    configuracionActual = data;

    const nombre =
        document.getElementById(
            "nombreBarberia"
        );

    const precio =
        document.getElementById(
            "precioServicio"
        );

    if (nombre)
        nombre.value =
            data.nombre_barberia || "";

    if (precio)
        precio.value =
            data.precio_servicio || "";

    if (data.nombre_barberia) {

        document.getElementById(
            "tituloBarberia"
        ).textContent =
            data.nombre_barberia;
    }
}

async function guardarConfiguracion() {

    const nombreBarberia =
        document.getElementById(
            "nombreBarberia"
        ).value;

    const precioServicio =
        Number(
            document.getElementById(
                "precioServicio"
            ).value
        );

    const { error } =
        await supabaseClient
            .from("configuracion")
            .upsert({
                usuario_id:
                    usuarioActual.id,
                nombre_barberia:
                    nombreBarberia,
                precio_servicio:
                    precioServicio
            });

    if (error) {

        alert(
            "Error al guardar configuración"
        );

        return;
    }

    configuracionActual = {
        nombre_barberia:
            nombreBarberia,
        precio_servicio:
            precioServicio
    };

    document.getElementById(
        "tituloBarberia"
    ).textContent =
        nombreBarberia;

    alert("Configuración guardada");
}

/* ================= NAVEGACION ================= */

function ocultarSecciones() {

    document.getElementById(
        "inicio"
    ).style.display = "none";

    document.getElementById(
        "agenda"
    ).style.display = "none";

    document.getElementById(
        "historial"
    ).style.display = "none";

    document.getElementById(
        "configuracion"
    ).style.display = "none";
}

function mostrarInicio() {

    ocultarSecciones();

    document.getElementById(
        "inicio"
    ).style.display = "block";

    activarBoton(
        "btnInicio"
    );

    cargarInicio();
}

function mostrarAgenda() {

    ocultarSecciones();

    document.getElementById(
        "agenda"
    ).style.display = "block";

    activarBoton(
        "btnAgenda"
    );

    cargarTurnos();
}

function mostrarHistorial() {

    ocultarSecciones();

    document.getElementById("historial").style.display = "block";

    activarBoton("btnHistorial");

    const resultado =
        document.getElementById("resultadoFecha");

    if (resultado) {

        resultado.innerHTML = `
            <div class="card">

                <h3>Historial</h3>

                <p style="
                    font-size:18px;
                    color:#444;
                    margin-top:10px;
                ">
                    Próximamente disponible
                </p>

            </div>
        `;
    }
}

function mostrarConfiguracion() {

    ocultarSecciones();

    document.getElementById(
        "configuracion"
    ).style.display = "block";

    activarBoton(
        "btnConfiguracion"
    );

    cargarConfiguracion();
}

function activarBoton(id) {

    document
        .querySelectorAll(
            ".menu button"
        )
        .forEach(btn =>
            btn.classList.remove(
                "active"
            )
        );

    document
        .getElementById(id)
        ?.classList.add(
            "active"
        );
}

/* ================= TURNOS ================= */

async function guardarTurno() {

    const cliente =
        document.getElementById(
            "cliente"
        ).value;

    const fecha =
        document.getElementById(
            "fecha"
        ).value;

    const hora =
        document.getElementById(
            "hora"
        ).value;

    if (
        !cliente ||
        !fecha ||
        !hora
    ) {

        alert(
            "Completa todos los campos"
        );

        return;
    }

    const { error } =
        await supabaseClient
            .from("turnos")
            .insert([
                {
                    usuario_id:
                        usuarioActual.id,
                    fecha,
                    hora,
                    cliente_nombre:
                        cliente,
                    servicio_id: 1,
                    precio:
                        configuracionActual?.precio_servicio ||
                        5000,
                    estado:
                        "reservado"
                }
            ]);

    if (error) {

        alert(
            "Error al guardar turno"
        );

        return;
    }

    document.getElementById(
        "cliente"
    ).value = "";

    document.getElementById(
        "fecha"
    ).value = "";

    document.getElementById(
        "hora"
    ).value = "";

    document.getElementById(
        "formTurno"
    ).style.display =
        "none";

    cargarTurnos();
    cargarInicio();
}

async function cargarTurnos() {

    const { data: turnos } =
        await supabaseClient
            .from("turnos")
            .select("*")
            .eq(
                "usuario_id",
                usuarioActual.id
            )
            .order(
                "fecha",
                {
                    ascending: true
                }
            )
            .order(
                "hora",
                {
                    ascending: true
                }
            );

    const lista =
        document.getElementById(
            "listaTurnos"
        );

    lista.innerHTML = "";

    if (
        !turnos ||
        turnos.length === 0
    ) {

        lista.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">
                    calendar_month
                </span>
                <h3>No hay turnos</h3>
            </div>
        `;

        return;
    }

    turnos.forEach(turno => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            `turno turno-${turno.estado}`;

        div.innerHTML = `
           <div class="turno-hora">
    ${turno.hora.substring(0,5)}
</div>
            <div class="turno-cliente">
    ${turno.cliente_nombre}
</div>

${turno.telefono ? `
<div style="
    margin-bottom:10px;
    color:#555;
    font-weight:600;
">
    📱 ${turno.telefono}
</div>
` : ""}

<span class="estado estado-${turno.estado}">
    ${turno.estado}
</span>

<div class="acciones-turno">

    ${turno.telefono ? `
    <button onclick="abrirWhatsApp('${turno.telefono}')">
        WhatsApp
    </button>
    ` : ""}

                <button onclick="editarTurno(${turno.id})">
                    Editar
                </button>

                <button onclick="completarTurno(${turno.id})">
                    Completar
                </button>

                <button onclick="cancelarTurno(${turno.id})">
                    Cancelar
                </button>

                <button onclick="eliminarTurno(${turno.id})">
                    Eliminar
                </button>
            </div>
        `;

        lista.appendChild(div);
    });
}

/* ================= ESTADOS ================= */

async function completarTurno(id) {

    await supabaseClient
        .from("turnos")
        .update({
            estado:
                "completado"
        })
        .eq("id", id);

    cargarTurnos();
    cargarInicio();
}

async function cancelarTurno(id) {

    await supabaseClient
        .from("turnos")
        .update({
            estado:
                "cancelado"
        })
        .eq("id", id);

    cargarTurnos();
    cargarInicio();
}

async function eliminarTurno(id) {

    if (
        !confirm(
            "¿Eliminar turno?"
        )
    ) return;

    await supabaseClient
        .from("turnos")
        .delete()
        .eq("id", id);

    cargarTurnos();
    cargarInicio();
}

async function editarTurno(id) {

    const nuevoNombre =
        prompt(
            "Nuevo nombre del cliente"
        );

    if (!nuevoNombre)
        return;

    await supabaseClient
        .from("turnos")
        .update({
            cliente_nombre:
                nuevoNombre
        })
        .eq("id", id);

    cargarTurnos();
}

/* ================= DASHBOARD ================= */

async function cargarInicio() {

    const hoy =
        new Date()
            .toISOString()
            .split("T")[0];

    const { data: turnos } =
        await supabaseClient
            .from("turnos")
            .select("*")
            .eq(
                "usuario_id",
                usuarioActual.id
            )
            .eq(
                "fecha",
                hoy
            );

    let ocupados = 0;
    let ganancias = 0;

    if (turnos) {

        ocupados =
            turnos.filter(
                t =>
                    t.estado !==
                    "cancelado"
            ).length;

        turnos.forEach(
            turno => {

                if (
                    turno.estado !==
                    "cancelado"
                ) {

                    ganancias +=
                        Number(
                            turno.precio || 0
                        );
                }
            }
        );
    }

    const libres =
        Math.max(
            0,
            20 - ocupados
        );

    document.getElementById(
        "ocupadosHoy"
    ).textContent =
        ocupados;

    document.getElementById(
        "libresHoy"
    ).textContent =
        libres;

    document.getElementById(
        "gananciasHoy"
    ).textContent =
        ganancias;

    cargarProximosTurnos();
}

async function cargarProximosTurnos() {

    const hoy =
        new Date()
            .toISOString()
            .split("T")[0];

    const { data: turnos } =
        await supabaseClient
            .from("turnos")
            .select("*")
            .eq(
                "usuario_id",
                usuarioActual.id
            )
            .gte(
                "fecha",
                hoy
            )
            .neq(
                "estado",
                "cancelado"
            )
            .order(
                "fecha",
                {
                    ascending: true
                }
            )
            .order(
                "hora",
                {
                    ascending: true
                }
            )
            .limit(5);

    const contenedor =
        document.getElementById(
            "proximosTurnos"
        );

    if (!contenedor)
        return;

    contenedor.innerHTML = "";

    if (
        !turnos ||
        turnos.length === 0
    ) {

        contenedor.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined">
                    calendar_month
                </span>
                <h3>No hay turnos</h3>
            </div>
        `;

        return;
    }

    turnos.forEach(turno => {

        contenedor.innerHTML += `
            <div class="proximo-item">
                <div class="proximo-hora">
    ${turno.hora.substring(0,5)}
</div>

                <div class="proximo-cliente">
                    ${turno.cliente_nombre}
                </div>
            </div>
        `;
    });
}