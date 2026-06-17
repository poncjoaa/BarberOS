const supabaseUrl = "https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient = supabase.createClient(
    supabaseUrl,
    supabaseKey
);

document.addEventListener("DOMContentLoaded", () => {

    const btnIngresar = document.getElementById("btnIngresar");
    const btnNuevoTurno = document.getElementById("btnNuevoTurno");
    const btnGuardarTurno = document.getElementById("btnGuardarTurno");

    // LOGIN
    btnIngresar.addEventListener("click", async () => {

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const { data, error } = await supabaseClient
            .from("usuarios")
            .select("*")
            .eq("username", username)
            .eq("password_hash", password)
            .single();

        if (data) {

            document.getElementById("login").style.display = "none";
            document.getElementById("inicio").style.display = "block";

        } else {

            alert("Usuario o contraseña incorrectos");
            console.log(error);

        }

    });

    // MOSTRAR FORMULARIO TURNO
    btnNuevoTurno.addEventListener("click", () => {

        document.getElementById("formTurno").style.display = "block";

    });

    // GUARDAR TURNO
    btnGuardarTurno.addEventListener("click", async () => {

        const cliente = document.getElementById("cliente").value;
        const fecha = document.getElementById("fecha").value;
        const hora = document.getElementById("hora").value;

        const { data: userData, error: userError } = await supabaseClient
            .from("usuarios")
            .select("id")
            .eq("username", "admin")
            .single();

        if (userError) {
            alert("Error obteniendo usuario");
            console.log(userError);
            return;
        }

        const { error } = await supabaseClient
    .from("turnos")
    .insert([{
        usuario_id: userData.id,
        fecha: fecha,
        hora: hora,
        cliente_nombre: cliente,
        servicio_id: 1,
        precio: 5000,
        estado: "reservado"
    }]);

        if (error) {

            alert("Error al guardar turno");
            alert(JSON.stringify(error, null, 2));
            console.log(error);

        } else {

            alert("Turno guardado");
            document.getElementById("formTurno").style.display = "none";

        }

    });

});
async function cargarTurnos() {

    const { data: userData } = await supabaseClient
        .from("usuarios")
        .select("id")
        .eq("username", "admin")
        .single();

    const { data: turnos, error } = await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", userData.id)
        .order("fecha", { ascending: true });

    const contenedor = document.getElementById("listaTurnos");
    contenedor.innerHTML = "";

    if (turnos.length === 0) {
        contenedor.innerHTML = "<p>No hay turnos aún</p>";
        return;
    }

    turnos.forEach(t => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.margin = "5px";
        div.style.padding = "10px";

        div.innerHTML = `
            <b>${t.fecha}</b> - ${t.hora} <br>
            Cliente: ${t.cliente_nombre} <br>
            Estado: ${t.estado}
        `;

        contenedor.appendChild(div);
    });
}