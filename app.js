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
    document.getElementById("btnHistorial")?.addEventListener("click", mostrarHistorial);
    document.getElementById("btnConfiguracion")?.addEventListener("click", mostrarConfiguracion);
    document.getElementById("btnGuardarTurno")?.addEventListener("click", guardarTurno);
    document.getElementById("btnGuardarConfig")?.addEventListener("click", guardarConfiguracion);

    document.getElementById("btnNuevoTurno")?.addEventListener("click", () => {
        const form = document.getElementById("formTurno");
        if (!form) return;
        form.style.display = form.style.display === "none" ? "block" : "none";
    });

    document.getElementById("btnBuscarFecha")?.addEventListener("click", buscarPorFecha);
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
    mostrarInicio();
}

/* ================= CONFIG ================= */

async function cargarConfiguracion() {

    const { data } = await supabaseClient
        .from("configuracion")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .single();

    if (data) configuracionActual = data;

    const nombre = document.getElementById("nombreBarberia");
    const precio = document.getElementById("precioServicio");

    if (nombre) nombre.value = data?.nombre_barberia || "";
    if (precio) precio.value = data?.precio_servicio || 0;
}

async function guardarConfiguracion() {

    const nombre = document.getElementById("nombreBarberia").value;
    const precio = Number(document.getElementById("precioServicio").value);

    const { error } = await supabaseClient
        .from("configuracion")
        .upsert({
            usuario_id: usuarioActual.id,
            nombre_barberia: nombre,
            precio_servicio: precio
        });

    if (error) return alert("Error al guardar");

    configuracionActual = { nombre_barberia: nombre, precio_servicio: precio };

    alert("Guardado");
}

/* ================= NAVEGACION ================= */

function ocultar() {
    ["inicio", "agenda", "historial", "configuracion"].forEach(id => {
        document.getElementById(id).style.display = "none";
    });
}

function mostrarInicio() {
    ocultar();
    document.getElementById("inicio").style.display = "block";
    cargarInicio();
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

    const { error } = await supabaseClient
        .from("turnos")
        .insert([{
            usuario_id: usuarioActual.id,
            cliente_nombre: cliente,
            fecha,
            hora,
            precio: configuracionActual?.precio_servicio || 0,
            estado: "reservado"
        }]);

    if (error) return alert("Error");

    cargarTurnos();
    cargarInicio();
}

/* ================= LISTA TURNOS ================= */

async function cargarTurnos() {

    const { data: turnos } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .order("fecha");

    const lista = document.getElementById("listaTurnos");
    lista.innerHTML = "";

    turnos?.forEach(t => {

        lista.innerHTML += `
        <div class="turno">
            <div class="turno-hora">${t.hora?.substring(0,5)}</div>
            <div class="turno-cliente">${t.cliente_nombre}</div>

            <span class="estado">${t.estado}</span>

            <div class="acciones-turno">

                <button onclick="abrirWhatsApp('${t.telefono || ''}')">WhatsApp</button>

                <button onclick="editarTurno(${t.id})">Editar</button>
                <button onclick="completarTurno(${t.id})">Completar</button>
                <button onclick="cancelarTurno(${t.id})">Cancelar</button>
                <button onclick="eliminarTurno(${t.id})">Eliminar</button>

            </div>
        </div>
        `;
    });
}

/* ================= ACCIONES ================= */

async function completarTurno(id) {
    await supabaseClient.from("turnos").update({ estado: "completado" }).eq("id", id);
    cargarTurnos();
}

async function cancelarTurno(id) {
    await supabaseClient.from("turnos").update({ estado: "cancelado" }).eq("id", id);
    cargarTurnos();
}

async function eliminarTurno(id) {
    await supabaseClient.from("turnos").delete().eq("id", id);
    cargarTurnos();
}

async function editarTurno(id) {
    const nuevo = prompt("Nuevo nombre");
    if (!nuevo) return;

    await supabaseClient.from("turnos")
        .update({ cliente_nombre: nuevo })
        .eq("id", id);

    cargarTurnos();
}

function abrirWhatsApp(tel) {
    if (!tel) return;
    window.open(`https://wa.me/${tel}`, "_blank");
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

    turnos?.forEach(t => {
        if (t.estado !== "cancelado") {
            ocupados++;
            ganancias += Number(t.precio || 0);
        }
    });

    document.getElementById("ocupadosHoy").textContent = ocupados;
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