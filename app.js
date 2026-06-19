const supabaseUrl =
    "https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient =
    supabase.createClient(supabaseUrl, supabaseKey);

let usuarioActual = null;
let configuracionActual = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("btnIngresar")?.addEventListener("click", login);
    document.getElementById("btnInicio")?.addEventListener("click", mostrarInicio);
    document.getElementById("btnAgenda")?.addEventListener("click", mostrarAgenda);

    document.getElementById("btnConfiguracion")?.addEventListener("click", async () => {
        mostrarConfiguracion();
        await cargarConfiguracion();
        generarLinkReservas();
    });

    document.getElementById("btnGuardarTurno")?.addEventListener("click", guardarTurno);
    document.getElementById("btnGuardarConfig")?.addEventListener("click", guardarConfiguracion);

    document.getElementById("btnNuevoTurno")?.addEventListener("click", () => {
        const form = document.getElementById("formTurno");
        if (!form) return;
        form.style.display = form.style.display === "none" ? "block" : "none";
    });

    document.getElementById("btnBuscarFecha")?.addEventListener("click", buscarPorFecha);

    document.getElementById("btnCopiarLink")?.addEventListener("click", () => {
        const input = document.getElementById("linkReservas");
        input.select();
        document.execCommand("copy");
        alert("Link copiado");
    });
});

/* ================= LOGIN ================= */

async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { data } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password)
        .single();

    if (!data) return alert("Usuario o contraseña incorrectos");

    usuarioActual = data;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    await cargarConfiguracion();
    generarLinkReservas();
    mostrarInicio();
}

/* ================= CONFIG ================= */

async function cargarConfiguracion() {

    if (!usuarioActual) return;

    const { data } = await supabaseClient
        .from("configuracion")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .maybeSingle();

    configuracionActual = data || {};

    document.getElementById("nombreBarberia").value =
        data?.nombre_barberia || "";

    document.getElementById("precioServicio").value =
        data?.precio_servicio || 0;

    document.getElementById("tituloBarberia").textContent =
        data?.nombre_barberia || "BarberOS";
}

async function guardarConfiguracion() {

    const nombreBarberia =
        document.getElementById("nombreBarberia").value;

    const precioServicio =
        Number(document.getElementById("precioServicio").value);

    const { error } = await supabaseClient
        .from("configuracion")
        .upsert({
            usuario_id: usuarioActual.id,
            nombre_barberia: nombreBarberia,
            precio_servicio: precioServicio
        }, { onConflict: "usuario_id" });

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

    generarLinkReservas();

    alert("Configuración guardada");
}

/* ================= LINK RESERVAS ================= */

function generarLinkReservas() {

    if (!usuarioActual) return;

    const input = document.getElementById("linkReservas");

    if (!input) return;

    input.value =
        window.location.origin +
        "/reservar.html?slug=" +
        (usuarioActual.slug || usuarioActual.username);
}

/* ================= NAV ================= */

function ocultar() {
    ["inicio", "agenda", "historial", "configuracion"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
}

function mostrarInicio() {
    ocultar();
    document.getElementById("inicio").style.display = "block";

    cargarInicio();
    cargarProximosTurnos();
}

function mostrarAgenda() {
    ocultar();
    document.getElementById("agenda").style.display = "block";
    cargarTurnos();
}

function mostrarHistorial() {
    ocultar();
    document.getElementById("historial").style.display = "block";
    buscarPorFecha();
}

function mostrarConfiguracion() {
    ocultar();
    document.getElementById("configuracion").style.display = "block";
}

/* ================= TURNOS ================= */

async function guardarTurno() {

    const cliente = document.getElementById("cliente").value;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;

    if (!cliente || !fecha || !hora) return alert("Completa los campos");

    await supabaseClient.from("turnos").insert([{
        usuario_id: usuarioActual.id,
        cliente_nombre: cliente,
        fecha,
        hora,
        precio: configuracionActual?.precio_servicio || 0,
        estado: "reservado"
    }]);

    cargarTurnos();
    cargarInicio();
}

/* ================= TURNOS LISTA ================= */

async function cargarTurnos() {

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

    const lista = document.getElementById("listaTurnos");
    lista.innerHTML = "";

    data?.forEach(t => {

        lista.innerHTML += `
        <div class="turno turno-${t.estado}">
            <div class="turno-hora">${t.hora?.substring(0,5)}</div>
            <div class="turno-cliente">${t.cliente_nombre}</div>

            <span class="estado estado-${t.estado}">
                ${t.estado}
            </span>

            <div class="acciones-turno">

                ${t.telefono ? `<button onclick="abrirWhatsApp('${t.telefono}')">WhatsApp</button>` : ""}

                <button onclick="editarTurno(${t.id})">Editar</button>
                <button onclick="cambiarEstado(${t.id},'completado')">Completar</button>
                <button onclick="cambiarEstado(${t.id},'cancelado')">Cancelar</button>
                <button onclick="eliminarTurno(${t.id})">Eliminar</button>

            </div>
        </div>
        `;
    });
}

/* ================= ESTADOS ================= */

async function cambiarEstado(id, estado) {

    await supabaseClient
        .from("turnos")
        .update({ estado })
        .eq("id", id);

    cargarTurnos();
    cargarInicio();
}

async function eliminarTurno(id) {

    await supabaseClient
        .from("turnos")
        .delete()
        .eq("id", id);

    cargarTurnos();
    cargarInicio();
}

async function editarTurno(id) {

    const nuevo = prompt("Nuevo nombre");
    if (!nuevo) return;

    await supabaseClient
        .from("turnos")
        .update({ cliente_nombre: nuevo })
        .eq("id", id);

    cargarTurnos();
}

/* ================= DASHBOARD ================= */

async function cargarInicio() {

async function cargarProximosTurnos() {

    const hoy = new Date().toISOString().split("T")[0];

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .eq("fecha", hoy)
        .neq("estado", "cancelado")
        .order("hora", { ascending: true });

    const contenedor =
        document.getElementById("proximosTurnos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!data || data.length === 0) {

        contenedor.innerHTML = `
            <div class="empty-state">
                Sin turnos para hoy
            </div>
        `;

        return;
    }

    data.forEach(turno => {

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

    const hoy = new Date().toISOString().split("T")[0];

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .eq("fecha", hoy);

    let ocupados = 0;
    let ganancias = 0;

    data?.forEach(t => {
        if (t.estado !== "cancelado") {
            ocupados++;
            ganancias += Number(t.precio || 0);
        }
    });

    const capacidad = configuracionActual?.capacidad || 20;

    document.getElementById("ocupadosHoy").textContent = ocupados;
    document.getElementById("libresHoy").textContent = Math.max(0, capacidad - ocupados);
    document.getElementById("gananciasHoy").textContent = ganancias;
}

/* ================= HISTORIAL ================= */

async function buscarPorFecha() {

    const fecha = document.getElementById("fechaBusqueda")?.value;
    if (!fecha) return;

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .eq("fecha", fecha);

    const cont = document.getElementById("resultadoFecha");
    cont.innerHTML = "";

    data?.forEach(t => {
        cont.innerHTML += `
        <div class="card">
            <b>${t.cliente_nombre}</b><br>
            ${t.hora?.substring(0,5)} - ${t.estado}
        </div>
        `;
    });
}

/* ================= WHATSAPP ================= */

function abrirWhatsApp(tel) {
    if (!tel) return;
    window.open(`https://wa.me/${tel}`, "_blank");
}