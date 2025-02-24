// netlify/functions/validate-recaptcha.js

// Si usas Node.js 18 o superior, puedes usar fetch nativo y omitir la siguiente línea.
// De lo contrario, instala node-fetch con: npm install node-fetch
//const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Solo se aceptan solicitudes POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }),
    };
  }

  try {
    // Extraer el token enviado desde el cliente
    const { token } = JSON.parse(event.body);
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token no proporcionado.' }),
      };
    }

    // Recupera la clave secreta (private key) desde las variables de entorno
    const secretKey = process.env.RECAPTCHA_SECRET;

    // URL de verificación de reCAPTCHA de Google
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    // Realiza la petición POST a la API de Google
    const response = await fetch(verificationUrl, { method: 'POST' });
    const data = await response.json();

    // Si la verificación falla, se informa el error
    if (!data.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Fallo en la verificación del reCAPTCHA.', details: data }),
      };
    }

    // Verificar el score con el umbral humano (0.7)
    if (data.score < 0.7) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reCAPTCHA score bajo (comportamiento sospechoso).', score: data.score }),
      };
    }

    // Si todo es correcto, se devuelve una respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, score: data.score }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor.', message: error.message }),
    };
  }
};


