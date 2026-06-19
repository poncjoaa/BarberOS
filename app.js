const supabaseUrl = "https://jyucjninnzwmycxtncjj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let usuarioActual = null;
let configuracionActual = null;

/* INIT */
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("btnIngresar")?.addEventListener("click", login);
    document.getElementById("btnInicio")?.addEventListener("click", mostrarInicio);
    document.getElementById("btnAgenda")?.addEventListener("click", mostrarAgenda);
    document.getElementById("btnHistorial")?.addEventListener("click", mostrarHistorial);
    document.getElementById("btnConfiguracion")?.addEventListener("click", mostrarConfiguracion);

    document.getElementById("btnGuardarTurno")?.addEventListener("click", guardarTurno);
    document.getElementById("btnGuardarConfig")?.addEventListener("click", guardarConfiguracion);
    document.getElementById("btnBuscarFecha")?.addEventListener("click", buscarPorFecha);

    document.getElementById("btnNuevoTurno")?.addEventListener("click", () => {
        const f = document.getElementById("formTurno");
        f.style.display = f.style.display === "none" ? "block" : "none";
    });

    document.getElementById("btnCopiarLink")?.addEventListener("click", copiarLink);
});

/* LOGIN */
async function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { data } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("username", username)
        .eq("password_hash", password)
        .single();

    if (!data) return alert("Error login");

    usuarioActual = data;

    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";

    await cargarConfiguracion();
    generarLink();

    mostrarInicio();
}

/* CONFIG */
async function cargarConfiguracion() {

    const { data } = await supabaseClient
        .from("configuracion")
        .select("*")
        .eq("usuario_id", usuarioActual.id)
        .maybeSingle();

    configuracionActual = data || {};

    document.getElementById("nombreBarberia").value =
        data?.nombre_barberia || "";

    document.getElementById("precioServicio").value =
        data?.precio_servicio || "";
}

async function guardarConfiguracion() {

    const nombre = document.getElementById("nombreBarberia").value;
    const precio = Number(document.getElementById("precioServicio").value);

    await supabaseClient
        .from("configuracion")
        .upsert({
            usuario_id: usuarioActual.id,
            nombre_barberia: nombre,
            precio_servicio: precio
        });

    configuracionActual = { nombre_barberia: nombre, precio_servicio: precio };

    document.getElementById("tituloBarberia").textContent = nombre;

    alert("Guardado");
}

/* LINK */
function generarLink() {
    const input = document.getElementById("linkReservas");
    if (!usuarioActual) return;

    input.value = `${window.location.origin}/reservar.html?slug=${usuarioActual.slug}`;
}

function copiarLink() {
    const input = document.getElementById("linkReservas");
    input.select();
    document.execCommand("copy");
    alert("Copiado");
}

/* NAV */
function ocultar() {
    ["inicio","agenda","historial","configuracion"].forEach(id=>{
        document.getElementById(id).style.display="none";
    });
}

function mostrarInicio(){ocultar();document.getElementById("inicio").style.display="block";cargarInicio();}
function mostrarAgenda(){ocultar();document.getElementById("agenda").style.display="block";cargarTurnos();}
function mostrarHistorial(){ocultar();document.getElementById("historial").style.display="block";}
function mostrarConfiguracion(){ocultar();document.getElementById("configuracion").style.display="block";}

/* TURNOS */
async function guardarTurno(){

    const cliente=document.getElementById("cliente").value;
    const fecha=document.getElementById("fecha").value;
    const hora=document.getElementById("hora").value;

    await supabaseClient.from("turnos").insert([{
        usuario_id:usuarioActual.id,
        cliente_nombre:cliente,
        fecha,
        hora,
        precio:configuracionActual?.precio_servicio||0,
        estado:"reservado"
    }]);

    cargarTurnos();
    cargarInicio();
}

/* LISTA */
async function cargarTurnos(){

    const {data}=await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id",usuarioActual.id);

    const lista=document.getElementById("listaTurnos");
    lista.innerHTML="";

    data?.forEach(t=>{
        lista.innerHTML+=`
        <div class="turno turno-${t.estado}">
            <div class="turno-hora">${t.hora.substring(0,5)}</div>
            <div class="turno-cliente">${t.cliente_nombre}</div>

            <span class="estado estado-${t.estado}">${t.estado}</span>

            <div class="acciones-turno">

                <button onclick="abrirWhatsApp('${t.telefono||''}')">WhatsApp</button>
                <button onclick="cambiarEstado(${t.id},'completado')">OK</button>
                <button onclick="cambiarEstado(${t.id},'cancelado')">X</button>

            </div>
        </div>`;
    });
}

/* ESTADOS */
async function cambiarEstado(id,estado){
    await supabaseClient.from("turnos").update({estado}).eq("id",id);
    cargarTurnos();
}

/* INICIO */
async function cargarInicio(){

    const hoy=new Date().toISOString().split("T")[0];

    const {data}=await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id",usuarioActual.id)
        .eq("fecha",hoy);

    let ocupados=0,ganancias=0;

    data?.forEach(t=>{
        if(t.estado!=="cancelado"){
            ocupados++;
            ganancias+=Number(t.precio||0);
        }
    });

    document.getElementById("ocupadosHoy").textContent=ocupados;
    document.getElementById("libresHoy").textContent=Math.max(0,20-ocupados);
    document.getElementById("gananciasHoy").textContent=ganancias;
}

/* HISTORIAL */
async function buscarPorFecha(){

    const fecha=document.getElementById("fechaBusqueda").value;

    const {data}=await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id",usuarioActual.id)
        .eq("fecha",fecha);

    const cont=document.getElementById("resultadoFecha");
    cont.innerHTML="";

    data?.forEach(t=>{
        cont.innerHTML+=`
        <div class="card">
            ${t.cliente_nombre} - ${t.hora} - ${t.estado}
        </div>`;
    });
}

/* WHATSAPP */
function abrirWhatsApp(tel){
    if(!tel) return;
    window.open(`https://wa.me/${tel}`,"_blank");
}