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

/* ================= INIT ================= */

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

    /* BOTÓN COPIAR LINK */
    document
        .getElementById("btnCopiarLink")
        ?.addEventListener("click", copiarLinkReservas);
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

        alert("Usuario o contraseña incorrectos");
        return;
    }

    usuarioActual = data;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

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
            .eq("usuario_id", usuarioActual.id)
            .single();

    if (!data) return;

    configuracionActual = data;

    const nombre =
        document.getElementById("nombreBarberia");

    const precio =
        document.getElementById("precioServicio");

    if (nombre)
        nombre.value = data.nombre_barberia || "";

    if (precio)
        precio.value = data.precio_servicio || "";

    document.getElementById("tituloBarberia").textContent =
        data.nombre_barberia || "BarberOS";

    cargarLinkReservas();
}

async function guardarConfiguracion() {

    const nombreBarberia =
        document.getElementById("nombreBarberia").value;

    const precioServicio =
        Number(document.getElementById("precioServicio").value);

    const { error } =
        await supabaseClient
            .from("configuracion")
            .upsert({
                usuario_id: usuarioActual.id,
                nombre_barberia: nombreBarberia,
                precio_servicio: precioServicio
            });

    if (error) {
        alert("Error al guardar configuración");
        return;
    }

    configuracionActual = {
        nombre_barberia: nombreBarberia,
        precio_servicio: precioServicio
    };

    document.getElementById("tituloBarberia").textContent =
        nombreBarberia;

    cargarLinkReservas();

    alert("Configuración guardada");
}

/* ================= LINK RESERVAS ================= */

function cargarLinkReservas() {

    const input =
        document.getElementById("linkReservas");

    if (!input || !usuarioActual?.slug) return;

    input.value =
        `${window.location.origin}/reservar.html?slug=${usuarioActual.slug}`;
}

function copiarLinkReservas() {

    const input =
        document.getElementById("linkReservas");

    if (!input) return;

    navigator.clipboard.writeText(input.value);

    alert("Link copiado");
}

/* ================= NAVEGACION ================= */

function ocultarSecciones() {

    document.getElementById("inicio").style.display = "none";
    document.getElementById("agenda").style.display = "none";
    document.getElementById("historial").style.display = "none";
    document.getElementById("configuracion").style.display = "none";
}

function mostrarInicio() {
    ocultarSecciones();
    document.getElementById("inicio").style.display = "block";
    cargarInicio();
}

function mostrarAgenda() {
    ocultarSecciones();
    document.getElementById("agenda").style.display = "block";
    cargarTurnos();
}

function mostrarHistorial() {
    ocultarSecciones();
    document.getElementById("historial").style.display = "block";
}

function mostrarConfiguracion() {
    ocultarSecciones();
    document.getElementById("configuracion").style.display = "block";
    cargarConfiguracion();
}

/* ================= TURNOS ================= */

async function guardarTurno() {

    const cliente = document.getElementById("cliente").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;

    if (!cliente || !fecha || !hora) {
        alert("Completa todos los campos");
        return;
    }

    const { error } = await supabaseClient
        .from("turnos")
        .insert([{
            usuario_id: usuarioActual.id,
            fecha,
            hora,
            cliente_nombre: cliente,
            precio: configuracionActual?.precio_servicio || 5000,
            estado: "reservado"
        }]);

    if (error) {
        alert("Error al guardar turno");
        return;
    }

    document.getElementById("cliente").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("hora").value = "";
    document.getElementById("formTurno").style.display = "none";

    cargarTurnos();
    cargarInicio();
}

/* ================= TURNOS LISTA ================= */

async function cargarTurnos() {

    const { data: turnos } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

    const lista = document.getElementById("listaTurnos");
    lista.innerHTML = "";

    if (!turnos?.length) {
        lista.innerHTML = "<p>No hay turnos</p>";
        return;
    }

    turnos.forEach(turno => {

        const div = document.createElement("div");
        div.className = `turno`;

        div.innerHTML = `
            <div class="turno-hora">${turno.hora.substring(0,5)}</div>
            <div class="turno-cliente">${turno.cliente_nombre}</div>

            <div class="acciones-turno">
                <button onclick="abrirWhatsApp('${turno.telefono || ''}')">WhatsApp</button>
            </div>
        `;

        lista.appendChild(div);
    });
}

/* ================= WHATSAPP ================= */

function abrirWhatsApp(telefono) {

    if (!telefono) return;

    let numero = telefono.replace(/\D/g, "");

    if (!numero.startsWith("54")) {
        numero = "54" + numero;
    }

    window.open(`https://wa.me/${numero}`, "_blank");
}

/* ================= DASHBOARD ================= */

async function cargarInicio() {

    const hoy = new Date().toISOString().split("T")[0];

    const { data: turnos } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .eq("fecha", hoy);

    let ocupados = 0;
    let ganancias = 0;

    if (turnos) {

        ocupados = turnos.filter(t => t.estado !== "cancelado").length;

        turnos.forEach(t => {
            if (t.estado !== "cancelado") {
                ganancias += Number(t.precio || 0);
            }
        });
    }

    document.getElementById("ocupadosHoy").textContent = ocupados;
    document.getElementById("libresHoy").textContent = Math.max(0, 20 - ocupados);
    document.getElementById("gananciasHoy").textContent = ganancias;
}