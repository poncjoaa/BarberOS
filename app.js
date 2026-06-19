const supabaseUrl = "https://jyucjninnzwmycxtncjj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let usuarioActual = null;
let configuracionActual = null;

/* INIT */
document.addEventListener("DOMContentLoaded", () => {

    btn("btnIngresar", login);
    btn("btnInicio", mostrarInicio);
    btn("btnAgenda", mostrarAgenda);
    btn("btnHistorial", mostrarHistorial);
    btn("btnConfiguracion", mostrarConfiguracion);

    btn("btnGuardarTurno", guardarTurno);
    btn("btnGuardarConfig", guardarConfig);
    btn("btnBuscarFecha", buscarHistorial);
    btn("btnCopiarLink", copiarLink);

    btn("btnNuevoTurno", () => {
        const f = document.getElementById("formTurno");
        f.style.display = f.style.display === "none" ? "block" : "none";
    });
});

function btn(id, fn) {
    document.getElementById(id)?.addEventListener("click", fn);
}

/* LOGIN */
async function login() {

    const username = v("username");
    const password = v("password");

    const { data } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password)
        .single();

    if (!data) return alert("Error login");

    usuarioActual = data;

    hide("login");
    show("app");

    await cargarConfig();
    generarLink();
    mostrarInicio();
}

/* CONFIG */
async function cargarConfig() {

    const { data } = await supabaseClient
        .from("configuracion")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .maybeSingle();

    configuracionActual = data || {};

    set("nombreBarberia", data?.nombre_barberia || "");
    set("precioServicio", data?.precio_servicio || 0);
}

async function guardarConfig() {

    await supabaseClient
        .from("configuracion")
        .upsert({
            usuario_id: usuarioActual.id,
            nombre_barberia: v("nombreBarberia"),
            precio_servicio: Number(v("precioServicio"))
        }, { onConflict: "usuario_id" });

    await cargarConfig();
    generarLink();
    alert("Guardado");
}

/* LINK */
function generarLink() {
    if (!usuarioActual) return;

    set("linkReservas",
        window.location.origin + "/reservar.html?slug=" + usuarioActual.slug
    );
}

function copiarLink() {
    const i = document.getElementById("linkReservas");
    i.select();
    document.execCommand("copy");
    alert("Copiado");
}

/* TURNOS */
async function guardarTurno() {

    await supabaseClient.from("turnos").insert([{
        usuario_id: usuarioActual.id,
        cliente_nombre: v("cliente"),
        fecha: v("fecha"),
        hora: v("hora"),
        precio: configuracionActual?.precio_servicio || 0,
        estado: "reservado"
    }]);

    cargarTurnos();
    cargarInicio();
}

/* LISTA */
async function cargarTurnos() {

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .order("fecha");

    const lista = document.getElementById("listaTurnos");
    lista.innerHTML = "";

    data?.forEach(t => {

        lista.innerHTML += `
        <div class="card turno-${t.estado}">
            <b>${t.cliente_nombre}</b><br>
            ${t.fecha} ${t.hora}<br>
            ${t.estado}

            <div>
                <button onclick="estado(${t.id},'completado')">✔</button>
                <button onclick="estado(${t.id},'cancelado')">✖</button>
                <button onclick="del(${t.id})">🗑</button>
                ${t.telefono ? `<button onclick="wa('${t.telefono}')">WA</button>` : ""}
            </div>
        </div>`;
    });
}

/* ESTADOS */
async function estado(id, est) {
    await supabaseClient.from("turnos").update({ estado: est }).eq("id", id);
    cargarTurnos();
    cargarInicio();
}

async function del(id) {
    await supabaseClient.from("turnos").delete().eq("id", id);
    cargarTurnos();
    cargarInicio();
}

function wa(t) {
    window.open("https://wa.me/" + t, "_blank");
}

/* INICIO */
async function cargarInicio() {

    const hoy = new Date().toISOString().split("T")[0];

    const { data } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .eq("fecha", hoy);

    let ocupados = 0;
    let gan = 0;

    data?.forEach(t => {
        if (t.estado !== "cancelado") {
            ocupados++;
            gan += Number(t.precio || 0);
        }
    });

    const cap = configuracionActual?.capacidad || 20;

    set("ocupadosHoy", ocupados);
    set("libresHoy", Math.max(0, cap - ocupados));
    set("gananciasHoy", gan);
}

/* HISTORIAL */
async function buscarHistorial() {

    const fecha = v("fechaBusqueda");

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
            ${t.cliente_nombre}<br>
            ${t.hora} - ${t.estado}
        </div>`;
    });
}

/* HELPERS */
function v(id){ return document.getElementById(id)?.value }
function set(id,val){ const e=document.getElementById(id); if(e) e.value=val }
function show(id){ document.getElementById(id).style.display="block" }
function hide(id){ document.getElementById(id).style.display="none" }

/* NAV */
function mostrarInicio(){ hideAll(); show("inicio"); cargarInicio(); }
function mostrarAgenda(){ hideAll(); show("agenda"); cargarTurnos(); }
function mostrarHistorial(){ hideAll(); show("historial"); }
function mostrarConfiguracion(){ hideAll(); show("configuracion"); cargarConfig(); }
function hideAll(){
    ["inicio","agenda","historial","configuracion"].forEach(hide);
}