/**
 * Endpoint para recibir datos vía POST y escribir en la hoja "Users" de un Google Sheet.
 *
 * Se espera que se envíe un JSON con las propiedades:
 *  - name: nombre del usuario.
 *  - email: correo del usuario.
 *
 * Se agregará una nueva fila en la hoja "Users" con:
 *  1. La fórmula "=NOW()" (para registrar la fecha y hora actual).
 *  2. El valor recibido en "name".
 *  3. El valor recibido en "email".
 */
function doPost(e) {
  /* Verifica que se haya recibido contenido en la solicitud POST.*/
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "Error", error: "No se recibieron datos POST." })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    /* Parseamos el contenido JSON del POST.*/
    var data = JSON.parse(e.postData.contents);
    var name = data.name || "";
    var email = data.email || "";
    
    /* Abrir el archivo de Google Sheets mediante su ID.*/
    var ss = SpreadsheetApp.openById("1NJ73tmBiSeL8-eiGDUd6tozBzUGajFCjJj0C7rBi0LU");
    /* Obtener la hoja "Users".*/
    var sheet = ss.getSheetByName("Users");
    
    /* Agregar una nueva fila con:
    // Columna 1: la fórmula "=NOW()"
    // Columna 2: el nombre recibido
    // Columna 3: el email recibido*/
    sheet.appendRow(["=NOW()", name, email]);
    
    /* Devolver respuesta exitosa en formato JSON.*/
    return ContentService.createTextOutput(
      JSON.stringify({ result: "Success" })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // En caso de error, devolver el mensaje de error en formato JSON.
    return ContentService.createTextOutput(
      JSON.stringify({ result: "Error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}