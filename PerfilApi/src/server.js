require("dotenv").config();

const express = require("express");
const cors = require("cors");
const os = require("os");
const { init } = require("./db");
const authRoutes = require("./routes/auth");
const perfilRoutes = require("./routes/perfil");

const app = express();
// La app (navegador en desarrollo, o WebView de Capacitor en Android) corre en un origen
// distinto al de esta API, así que sin CORS el navegador bloquea las peticiones.
app.use(cors());
// Límite más alto que el default (100kb) porque las fotos viajan como Base64 en el body.
app.use(express.json({ limit: "8mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/perfil", perfilRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", servicio: "PerfilApi", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ status: "ok", servicio: "PerfilApi" });
});

app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ mensaje: "El cuerpo de la petición no es un JSON válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ mensaje: "La imagen es demasiado grande" });
  }
  console.error("Error no controlado:", err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3001;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PerfilApi corriendo en el puerto ${PORT}`);
      console.log("");
      console.log("URLs para configurar la app (Ionic/Capacitor):");
      console.log(`  - Emulador de Android Studio:  http://10.0.2.2:${PORT}/`);

      const redes = os.networkInterfaces();
      for (const nombre of Object.keys(redes)) {
        for (const red of redes[nombre]) {
          if (red.family === "IPv4" && !red.internal) {
            console.log(`  - Dispositivo físico (misma red Wi-Fi):  http://${red.address}:${PORT}/`);
          }
        }
      }
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar la base de datos:", error);
    process.exit(1);
  });
