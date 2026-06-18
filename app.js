const supabaseUrl =
"https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
"TU_ANON_KEY";

const supabaseClient =
supabase.createClient(
    supabaseUrl,
    supabaseKey
);

document.addEventListener("DOMContentLoaded", () => {

    const btnIngresar =
        document.getElementById("btnIngresar");

    const btnNuevoTurno =
        document.getElementById("btnNuevoTurno");

    const btnGuardarTurno =
        document.getElementById("btnGuardarTurno");

    const btnAgenda =
        document.getElementById("btnAgenda");

    const btnHistorial =
        document.getElementById("btnHistorial");

    const btnServicios =
        document.getElementById("btnServicios");

    const btnConfiguracion =
        document.getElementById("btnConfiguracion");

    // LOGIN

    btnIngresar.addEventListener("click", async () => {

        const username =
            document.getElementById("username").value;

        const password =
            document.getElementById("password").value;

        const { data } =
            await supabaseClient
            .from("usuarios")
            .select("*")
            .eq("username", username)
            .eq("password_hash", password)
            .single();

        if (!data) {

            alert(
                "Usuario o contraseña incorrectos"
            );

            return;
        }

        document.getElementById("login").style.display =
            "none";

        document.getElementById("inicio").style.display =
            "block";

    });

    // NUEVO TURNO

    btnNuevoTurno.addEventListener("click", () => {

        ocultarSecciones();

        document.getElementById(
            "formTurno"
        ).style.display = "block";

    });

    // AGENDA

    btnAgenda.addEventListener("click", () => {

        ocultarSecciones();

        document.getElementById(
            "agenda"
        ).style.display = "block";

        cargarTurnos();

    });

    // HISTORIAL

    btnHistorial.addEventListener("click", () => {

        ocultarSecciones();

        document.getElementById(
            "historial"
        ).style.display = "block";

    });

    // SERVICIOS

    btnServicios.addEventListener("click", () => {

        ocultarSecciones();

        document.getElementById(
            "servicios"
        ).style.display = "block";

    });

    // CONFIG

    btnConfiguracion.addEventListener("click", () => {

        ocultarSecciones();

        document.getElementById(
            "configuracion"
        ).style.display = "block";

    });

    // GUARDAR TURNO

    btnGuardarTurno.addEventListener("click", async () => {

        const cliente =
            document.getElementById("cliente").value;

        const fecha =
            document.getElementById("fecha").value;

        const hora =
            document.getElementById("hora").value;

        const { data:userData } =
            await supabaseClient
            .from("usuarios")
            .select("id")
            .eq("username","admin")
            .single();

        const { error } =
            await supabaseClient
            .from("turnos")
            .insert([{
                usuario_id:userData.id,
                fecha,
                hora,
                cliente_nombre:cliente,
                servicio_id:1,
                precio:5000,
                estado:"reservado"
            }]);

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

        cargarTurnos();

    });

});

function ocultarSecciones(){

    document.getElementById("formTurno")
        .style.display = "none";

    document.getElementById("agenda")
        .style.display = "none";

    document.getElementById("historial")
        .style.display = "none";

    document.getElementById("servicios")
        .style.display = "none";

    document.getElementById("configuracion")
        .style.display = "none";
}

async function cargarTurnos(){

    const { data:userData } =
        await supabaseClient
        .from("usuarios")
        .select("id")
        .eq("username","admin")
        .single();

    const { data:turnos } =
        await supabaseClient
        .from("turnos")
        .select("*")
        .eq("usuario_id", userData.id)
        .order("fecha");

    const lista =
        document.getElementById(
            "listaTurnos"
        );

    lista.innerHTML = "";

    if(!turnos || turnos.length === 0){

        lista.innerHTML =
            "<p>No hay turnos</p>";

        return;
    }

    turnos.forEach(turno => {

        const div =
            document.createElement("div");

        div.className = "turno";

        div.innerHTML = `
            <strong>${turno.fecha}</strong>
            <br>
            ${turno.hora}
            <br>
            ${turno.cliente_nombre}
            <br>
            ${turno.estado}
        `;

        lista.appendChild(div);

    });

}