// Rutas de perfil: requieren autenticación. La foto se recibe/devuelve como Base64
// y se guarda como BYTEA en la base de datos — nunca como archivo en el servidor.
const express = require("express");
const { pool } = require("../db");
const requiereAutenticacion = require("../middleware/auth");
const { parsearImagenBase64 } = require("../utils/validators");

const router = express.Router();
router.use(requiereAutenticacion);

function aDto(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    fotoPerfil: fila.foto_perfil ? fila.foto_perfil.toString("base64") : null,
    fotoPerfilMime: fila.foto_perfil_mime,
  };
}

// GET /api/perfil — datos del usuario autenticado, incluida la foto si tiene.
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE id = $1", [req.usuarioId]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json(aDto(resultado.rows[0]));
  } catch (error) {
    console.error("Error en GET /perfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

function imagenGaleriaADto(fila) {
  return {
    id: fila.id,
    imagen: fila.imagen.toString("base64"),
    imagenMime: fila.imagen_mime,
    fechaCreacion: fila.fecha_creacion,
  };
}

// PUT /api/perfil/foto — actualiza (o quita, si foto es null) la foto de perfil.
// Al tomar una foto nueva o subir una desde el dispositivo, también se guarda una copia
// en la galería del usuario, para poder reutilizarla luego como foto de perfil.
router.put("/foto", async (req, res) => {
  const { foto } = req.body;

  // Permite "borrar" la foto mandando null/vacío. No toca la galería: la galería es
  // un historial aparte de la foto de perfil actual.
  if (foto === null || foto === "") {
    try {
      const resultado = await pool.query(
        "UPDATE usuarios SET foto_perfil = NULL, foto_perfil_mime = NULL WHERE id = $1 RETURNING *",
        [req.usuarioId]
      );
      return res.json({ usuario: aDto(resultado.rows[0]), imagenGaleria: null });
    } catch (error) {
      console.error("Error limpiando foto:", error);
      return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
  }

  const imagen = parsearImagenBase64(foto);
  if (!imagen) {
    return res.status(400).json({ mensaje: "Imagen inválida o demasiado grande (máximo 5 MB)" });
  }

  try {
    const [resultadoUsuario, resultadoGaleria] = await Promise.all([
      pool.query("UPDATE usuarios SET foto_perfil = $1, foto_perfil_mime = $2 WHERE id = $3 RETURNING *", [
        imagen.buffer,
        imagen.mime,
        req.usuarioId,
      ]),
      pool.query(
        "INSERT INTO galeria_imagenes (usuario_id, imagen, imagen_mime) VALUES ($1, $2, $3) RETURNING *",
        [req.usuarioId, imagen.buffer, imagen.mime]
      ),
    ]);
    res.json({
      usuario: aDto(resultadoUsuario.rows[0]),
      imagenGaleria: imagenGaleriaADto(resultadoGaleria.rows[0]),
    });
  } catch (error) {
    console.error("Error en PUT /perfil/foto:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// PUT /api/perfil/foto/desde-galeria/:id — reutiliza una imagen ya guardada en la galería
// del usuario como foto de perfil (no crea una copia nueva, ya existe).
router.put("/foto/desde-galeria/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "Id inválido" });
  }

  try {
    const resultadoImagen = await pool.query(
      "SELECT * FROM galeria_imagenes WHERE id = $1 AND usuario_id = $2",
      [id, req.usuarioId]
    );
    if (resultadoImagen.rows.length === 0) {
      return res.status(404).json({ mensaje: "Imagen no encontrada en tu galería" });
    }

    const imagen = resultadoImagen.rows[0];
    const resultadoUsuario = await pool.query(
      "UPDATE usuarios SET foto_perfil = $1, foto_perfil_mime = $2 WHERE id = $3 RETURNING *",
      [imagen.imagen, imagen.imagen_mime, req.usuarioId]
    );
    res.json(aDto(resultadoUsuario.rows[0]));
  } catch (error) {
    console.error("Error en PUT /perfil/foto/desde-galeria/:id:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// GET /api/perfil/galeria — todas las imágenes de la galería del usuario autenticado.
router.get("/galeria", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM galeria_imagenes WHERE usuario_id = $1 ORDER BY fecha_creacion DESC",
      [req.usuarioId]
    );
    res.json(resultado.rows.map(imagenGaleriaADto));
  } catch (error) {
    console.error("Error en GET /perfil/galeria:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// DELETE /api/perfil/galeria/:id — elimina una imagen, solo si es del usuario autenticado.
router.delete("/galeria/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ mensaje: "Id inválido" });
  }

  try {
    const resultado = await pool.query(
      "DELETE FROM galeria_imagenes WHERE id = $1 AND usuario_id = $2 RETURNING id",
      [id, req.usuarioId]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Imagen no encontrada" });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Error en DELETE /perfil/galeria/:id:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
