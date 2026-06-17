const btnIngresar = document.getElementById("btnIngresar");

btnIngresar.addEventListener("click", () => {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "admin" && password === "123456") {

        alert("Bienvenido a BarberOS");

    } else {

        alert("Usuario o contraseña incorrectos");

    }

});