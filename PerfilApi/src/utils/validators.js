const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esEmailValido(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

function esTextoNoVacio(valor, maxLength) {
  if (typeof valor !== "string") return false;
  const limpio = valor.trim();
  if (limpio.length === 0) return false;
  if (maxLength && limpio.length > maxLength) return false;
  return true;
}

// Valida que sea un data URL de imagen (data:image/...;base64,XXXX) o un base64 "pelado",
// y que no sea absurdamente grande (protección básica contra abuso).
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024; // 5 MB

function parsearImagenBase64(valor) {
  if (typeof valor !== "string" || valor.length === 0) return null;

  const match = valor.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  const mime = match ? match[1] : "image/jpeg";
  const base64 = match ? match[2] : valor;

  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch (e) {
    return null;
  }

  if (buffer.length === 0 || buffer.length > MAX_IMAGEN_BYTES) return null;

  return { buffer, mime };
}

module.exports = { esEmailValido, esTextoNoVacio, parsearImagenBase64, MAX_IMAGEN_BYTES };
