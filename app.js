const supabaseUrl = "https://jyucjninnzwmycxtncjj.supabase.co";

const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWNqbmlubnp3bXljeHRuY2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTQ0NzMsImV4cCI6MjA5NzI5MDQ3M30.g8BiPO9wDPoWNk-nki0tRA4OLJn0fZuAqFskg3KEHBk";

const supabaseClient = supabase.createClient(
    supabaseUrl,
    supabaseKey
);

const btnIngresar = document.getElementById("btnIngresar");

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

}
        document.getElementById("inicio").style.display = "block";
    } else {

        alert("Usuario o contraseña incorrectos");

    }

});