// Rutas de autenticación: register y login son dos pasos separados
// (al registrarse, el usuario debe iniciar sesión aparte, como pide el enunciado).
const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { generarToken } = require("../utils/jwt");
const { esEmailValido, esTextoNoVacio } = require("../utils/validators");

const router = express.Router();

// POST /api/auth/register — crea la cuenta. No inicia sesión automáticamente.
router.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!esTextoNoVacio(nombre, 100) || !esTextoNoVacio(email) || !esTextoNoVacio(password)) {
    return res.status(400).json({ mensaje: "Nombre, email y contraseña son obligatorios" });
  }
  if (!esEmailValido(email)) {
    return res.status(400).json({ mensaje: "Formato de correo inválido" });
  }
  if (password.length < 4) {
    return res.status(400).json({ mensaje: "La contraseña debe tener al menos 4 caracteres" });
  }

  const emailLimpio = email.trim().toLowerCase();

  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE email = $1", [emailLimpio]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ mensaje: "Ya existe un usuario con ese email" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const resultado = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email",
      [nombre.trim(), emailLimpio, passwordHash]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error en /register:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

// POST /api/auth/login — autentica y devuelve token + datos del perfil (incluida la foto, si tiene).
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!esTextoNoVacio(email) || !esTextoNoVacio(password)) {
    return res.status(400).json({ mensaje: "Email y contraseña son obligatorios" });
  }
  if (!esEmailValido(email)) {
    return res.status(400).json({ mensaje: "Formato de correo inválido" });
  }

  const emailLimpio = email.trim().toLowerCase();

  try {
    const resultado = await pool.query("SELECT * FROM usuarios WHERE email = $1", [emailLimpio]);
    const usuario = resultado.rows[0];

    if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const token = generarToken(usuario);
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        fotoPerfil: usuario.foto_perfil ? usuario.foto_perfil.toString("base64") : null,
        fotoPerfilMime: usuario.foto_perfil_mime,
      },
    });
  } catch (error) {
    console.error("Error en /login:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
