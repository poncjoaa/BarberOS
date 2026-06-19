const supabaseUrl =
"https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient =
supabase.createClient(
supabaseUrl,
supabaseKey
);

let barberia = null;

document.addEventListener(
"DOMContentLoaded",
async () => {

await cargarBarberia();

const fechaInput =
    document.getElementById("fecha");

const hoy =
    new Date()
        .toISOString()
        .split("T")[0];

fechaInput.min = hoy;

fechaInput.addEventListener(
    "change",
    cargarHorarios
);

document
    .querySelectorAll(
        "#fecha,#hora,#telefono,#nombre"
    )
    .forEach(campo => {

        campo.addEventListener(
            "input",
            validarFormulario
        );

        campo.addEventListener(
            "change",
            validarFormulario
        );
    });

document
    .getElementById(
        "btnReservar"
    )
    .addEventListener(
        "click",
        reservarTurno
    );

}
);

async function cargarBarberia() {

const slug =
new URLSearchParams(
window.location.search
).get("slug");

if (!slug) {

alert(
    "Barbería no encontrada"
);

return;

}

const {
data,
error
} =
await supabaseClient
.from("usuarios")
.select("*")
.eq("slug", slug)
.single();

if (error || !data) {

alert(
    "Barbería no encontrada"
);

return;

}

barberia = data;

document.getElementById(
"nombreBarberia"
).textContent =
barberia.nombre_barberia;

}

async function cargarHorarios() {

const fecha =
document.getElementById(
"fecha"
).value;

if (!fecha || !barberia)
return;

const selector =
document.getElementById(
"hora"
);

selector.innerHTML =
`

<option value="">
    Seleccionar horario
</option>
`;const {
data: turnos
} =
await supabaseClient
.from("turnos")
.select("hora")
.eq(
"usuario_id",
barberia.id
)
.eq(
"fecha",
fecha
)
.neq(
"estado",
"cancelado"
);

const ocupados =
(turnos || [])
.map(t =>
t.hora.substring(0,5)
);

const hoy =
new Date()
.toISOString()
.split("T")[0];

const ahora =
new Date();

const minutosActuales =
ahora.getHours() * 60 +
ahora.getMinutes();

let actual =
convertirMinutos(
barberia.hora_inicio
);

const fin =
convertirMinutos(
barberia.hora_fin
);

while (actual < fin) {

const horario =
    formatearHora(
        actual
    );

if (
    fecha === hoy &&
    actual <= minutosActuales
) {

    actual +=
        barberia.duracion_turno;

    continue;
}

if (
    !ocupados.includes(
        horario
    )
) {

    const option =
        document.createElement(
            "option"
        );

    option.value =
        horario;

    option.textContent =
        horario;

    selector.appendChild(
        option
    );
}

actual +=
    barberia.duracion_turno;

}

}

function convertirMinutos(
hora
) {

const partes =
hora.split(":");

return (
Number(partes[0]) *
60 +
Number(partes[1])
);

}

function formatearHora(
minutos
) {

const horas =
Math.floor(
minutos / 60
);

const mins =
minutos % 60;

return (
String(horas)
.padStart(2,"0") +
":" +
String(mins)
.padStart(2,"0")
);

}

function validarFormulario() {

const fecha =
document.getElementById(
"fecha"
).value;

const hora =
document.getElementById(
"hora"
).value;

const telefono =
document.getElementById(
"telefono"
).value;

const nombre =
document.getElementById(
"nombre"
).value;

document.getElementById(
"btnReservar"
).style.display =

fecha &&
hora &&
telefono &&
nombre

    ? "block"
    : "none";

}

async function reservarTurno() {

const fecha =
document.getElementById(
"fecha"
).value;

const hora =
document.getElementById(
"hora"
).value;

const telefono =
document.getElementById(
"telefono"
).value;

const nombre =
document.getElementById(
"nombre"
).value;

const {
data: existente
} =
await supabaseClient
.from("turnos")
.select("id")
.eq(
"usuario_id",
barberia.id
)
.eq(
"fecha",
fecha
)
.eq(
"hora",
hora + ":00"
)
.neq(
"estado",
"cancelado"
);

if (
existente &&
existente.length > 0
) {

alert(
    "Ese horario ya fue reservado"
);

await cargarHorarios();

return;

}

const { error } =
await supabaseClient
.from("turnos")
.insert([
{
usuario_id:
barberia.id,

            fecha,

            hora:
                hora + ":00",

            cliente_nombre:
                nombre,

            telefono,

            servicio_id: 1,

            precio: 5000,

            estado:
                "reservado"
        }
    ]);

if (error) {

alert(
    "Error al reservar"
);

return;

}

document.querySelector(
".card"
).style.display =
"none";

const mensaje =
document.getElementById(
"mensaje"
);

mensaje.style.display =
"block";

mensaje.innerHTML = `

<h2>
    ✅ Turno reservado
</h2><p style="
    font-size:18px;
    color:#111;
    margin-top:15px;
">
    ${nombre}<br><br>
    ${fecha}<br>
    ${hora}
</p>
`;
}