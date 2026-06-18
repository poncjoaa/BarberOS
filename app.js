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

document.addEventListener(
"DOMContentLoaded",
() => {

const btnIngresar =
    document.getElementById(
        "btnIngresar"
    );

const btnInicio =
    document.getElementById(
        "btnInicio"
    );

const btnAgenda =
    document.getElementById(
        "btnAgenda"
    );

const btnHistorial =
    document.getElementById(
        "btnHistorial"
    );

const btnConfiguracion =
    document.getElementById(
        "btnConfiguracion"
    );

const btnNuevoTurno =
    document.getElementById(
        "btnNuevoTurno"
    );

const btnGuardarTurno =
    document.getElementById(
        "btnGuardarTurno"
    );

btnIngresar.addEventListener(
    "click",
    login
);

btnInicio.addEventListener(
    "click",
    mostrarInicio
);

btnAgenda.addEventListener(
    "click",
    mostrarAgenda
);

btnHistorial.addEventListener(
    "click",
    mostrarHistorial
);

btnConfiguracion.addEventListener(
    "click",
    mostrarConfiguracion
);

btnNuevoTurno.addEventListener(
    "click",
    () => {

        const form =
            document.getElementById(
                "formTurno"
            );

        form.style.display =
            form.style.display === "none"
            ? "block"
            : "none";
    }
);

btnGuardarTurno.addEventListener(
    "click",
    guardarTurno
);

}
);

async function login(){

const username =
    document.getElementById(
        "username"
    ).value;

const password =
    document.getElementById(
        "password"
    ).value;

const { data } =
    await supabaseClient
    .from("usuarios")
    .select("*")
    .eq("username", username)
    .eq("password_hash", password)
    .single();

if(!data){

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

await cargarInicio();

mostrarInicio();

}

function ocultarSecciones(){

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

function mostrarInicio(){

ocultarSecciones();

document.getElementById(
    "inicio"
).style.display = "block";

activarBoton("btnInicio");

cargarInicio();

}

function mostrarAgenda(){

ocultarSecciones();

document.getElementById(
    "agenda"
).style.display = "block";

activarBoton("btnAgenda");

cargarTurnos();

}

function mostrarHistorial(){

ocultarSecciones();

document.getElementById(
    "historial"
).style.display = "block";

activarBoton("btnHistorial");

const historial =
document.getElementById(
    "listaHistorial"
);

historial.innerHTML = `
    <div class="empty-state">

        <span class="material-symbols-outlined">
            bar_chart
        </span>

        <h3>Sin historial</h3>

        <p>
            Aún no hay turnos completados
        </p>

    </div>
`;

}

function mostrarConfiguracion(){

ocultarSecciones();

document.getElementById(
    "configuracion"
).style.display = "block";

activarBoton("btnConfiguracion");

}

async function guardarTurno(){

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

if(
    !cliente ||
    !fecha ||
    !hora
){
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

            servicio_id:1,

            precio:5000,

            estado:
                "reservado"
        }
    ]);

if(error){

    alert(
        "Error al guardar turno"
    );

    return;
}

alert(
    "Turno guardado"
);

document.getElementById(
    "cliente"
).value = "";

cargarTurnos();

cargarInicio();

}

async function cargarTurnos(){

const { data:turnos } =
    await supabaseClient
    .from("turnos")
    .select("*")
    .eq(
        "usuario_id",
        usuarioActual.id
    )
    .order(
        "fecha",
        { ascending:true }
    );

const lista =
    document.getElementById(
        "listaTurnos"
    );

lista.innerHTML = "";

if(
    !turnos ||
    turnos.length === 0
){

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

turnos.forEach(
    turno => {

        const div =
            document.createElement(
                "div"
            );

        div.className = `turno turno-${turno.estado}`;

        div.innerHTML = `
    <div class="turno-hora">
        ${turno.hora}
    </div>

    <div class="turno-cliente">
        ${turno.cliente_nombre}
    </div>

    <span class="estado estado-${turno.estado}">
    ${turno.estado}
</span>

    <div class="acciones-turno">

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

        lista.appendChild(
            div
        );
    }
);

}

async function cargarInicio(){

const hoy =
    new Date()
    .toISOString()
    .split("T")[0];

const { data:turnos } =
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

if(turnos){

    ocupados =
        turnos.length;

    turnos.forEach(
        turno => {

            ganancias +=
                Number(
                    turno.precio || 0
                );
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

async function cargarProximosTurnos(){

const hoy =
    new Date()
    .toISOString()
    .split("T")[0];

const { data:turnos } =
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
    .order(
        "fecha",
        { ascending:true }
    )
    .order(
        "hora",
        { ascending:true }
    )
    .limit(5);

const contenedor =
    document.getElementById(
        "proximosTurnos"
    );

if(!contenedor) return;

if(
    !turnos ||
    turnos.length === 0
){

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

contenedor.innerHTML = "";

turnos.forEach(turno => {

    contenedor.innerHTML += `
        <div class="proximo-item">

            <div class="proximo-hora">
                ${turno.hora}
            </div>

            <div class="proximo-cliente">
                ${turno.cliente_nombre}
            </div>

        </div>
    `;
});

}

function activarBoton(id){

    document
        .querySelectorAll(".menu button")
        .forEach(btn =>
            btn.classList.remove("active")
        );

    document
        .getElementById(id)
        .classList.add("active");
}

async function completarTurno(id){

    await supabaseClient
    .from("turnos")
    .update({
        estado:"completado"
    })
    .eq("id",id);

    cargarTurnos();
    cargarInicio();
}

async function cancelarTurno(id){

    await supabaseClient
    .from("turnos")
    .update({
        estado:"cancelado"
    })
    .eq("id",id);

    cargarTurnos();
}

async function eliminarTurno(id){

    if(!confirm("¿Eliminar turno?")){
        return;
    }

    await supabaseClient
    .from("turnos")
    .delete()
    .eq("id",id);

    cargarTurnos();
    cargarInicio();
}

async function editarTurno(id){

    const nuevoNombre =
        prompt(
            "Nuevo nombre del cliente"
        );

    if(!nuevoNombre){
        return;
    }

    await supabaseClient
    .from("turnos")
    .update({
        cliente_nombre:nuevoNombre
    })
    .eq("id",id);

    cargarTurnos();
}