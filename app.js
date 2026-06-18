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

    // LOGIN

    btnIngresar.addEventListener(
        "click",
        login
    );

    // MENU

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

    // TURNOS

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

cargarInicio();

}

function mostrarAgenda(){

ocultarSecciones();

document.getElementById(
    "agenda"
).style.display = "block";

cargarTurnos();

}

function mostrarHistorial(){

ocultarSecciones();

document.getElementById(
    "historial"
).style.display = "block";

}

function mostrarConfiguracion(){

ocultarSecciones();

document.getElementById(
    "configuracion"
).style.display = "block";

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

    console.log(error);

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

    lista.innerHTML =
        "<p>No hay turnos.</p>";

    return;
}

turnos.forEach(
    turno => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "turno";

        div.innerHTML = `
            <strong>${turno.fecha}</strong>
            <br>
            ${turno.hora}
            <br>
            ${turno.cliente_nombre}
            <br>
            Estado:
            ${turno.estado}
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

}