// Lógica de Autenticación
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

function signInWithGoogle() {
  auth.signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;
      var token = credential.accessToken;
      var user = result.user;
      console.log("Usuario logueado:", user);
      alert("Bienvenido " + user.displayName);
      // Aquí puedes redirigir al usuario o actualizar la UI
    }).catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;
      console.error("Error en login:", errorMessage);
      alert("Error al iniciar sesión: " + errorMessage);
    });
}

// Observador del estado de autenticación
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Usuario activo:", user.uid);
    // Actualizar UI para usuario logueado
  } else {
    console.log("No hay usuario activo");
    // Actualizar UI para usuario deslogueado
  }
});
