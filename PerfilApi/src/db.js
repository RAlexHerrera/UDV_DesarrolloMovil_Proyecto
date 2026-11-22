// Conexión a PostgreSQL y creación de tablas.
// La foto de perfil se guarda como BYTEA (binario) directo en la base de datos,
// NO como archivo en el disco del servidor (así lo pide el enunciado).

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      foto_perfil BYTEA,
      foto_perfil_mime TEXT,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS galeria_imagenes (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      imagen BYTEA NOT NULL,
      imagen_mime TEXT NOT NULL,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  console.log("Base de datos lista (tablas usuarios y galeria_imagenes verificadas/creadas)");
}

module.exports = { pool, init };
