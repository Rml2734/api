# API Backend de MetasApp

## Descripción general

Esta API backend proporciona funcionalidades para gestionar metas de usuarios. Permite a los usuarios iniciar sesión, crear, leer, actualizar y eliminar metas. También permite eliminar usuarios.

## Tecnologías utilizadas

* **Node.js:** Entorno de ejecución de JavaScript del lado del servidor.
* **Express:** Framework web para Node.js.
* **PostgreSQL:** Base de datos relacional.
* **jsonwebtoken (JWT):** Para la autenticación y autorización.
* **bcrypt:** Para el hashing de contraseñas.
* **cors:** Para habilitar el intercambio de recursos de origen cruzado (CORS).
* **express-validator:** Para la validación de datos.

## Puntos finales

### Autenticación

* **POST /api/login:** Inicia sesión de usuario.
    * **Cuerpo de la solicitud:**
        ```json
        {
            "usuario": "ejemplo@gmail.com",
            "clave": "contraseña"
        }
        ```
    * **Respuesta (200 OK):**
        ```json
        {
            "token": "JWT_TOKEN"
        }
        ```
    * **Respuesta de error:**
        ```json
        {
            "message": "Token inválido, expirado o no proporcionado"
        }
        ```

### Metas

* **GET /api/metas:** Obtiene todas las metas del usuario autenticado.
    * **Autenticación:** Requiere un token JWT válido en el encabezado `Authorization`.
    * **Respuesta (200 OK):**
        ```json
        [
            {
                "id": 1,
                "detalles": "PRUEBA 1 USUARIO 2 EJEMPLO",
                "periodo": "semana",
                "eventos": 7,
                "icono": "‍♂️",
                "meta": 365,
                "plazo": "2025-03-25T06:00:00.000Z",
                "completado": 365,
                "cuenta_id": 2
            },
            // ... otras metas
        ]
        ```
* **POST /api/metas:** Crea una nueva meta.
    * **Autenticación:** Requiere un token JWT válido en el encabezado `Authorization`.
    * **Cuerpo de la solicitud:** Objeto JSON con los detalles de la meta.
    * **Respuesta (200 OK):** La meta creada en formato JSON.
* **PUT /api/metas/{id}:** Actualiza una meta por su ID.
    * **Autenticación:** Requiere un token JWT válido en el encabezado `Authorization`.
    * **Parámetros de ruta:** `id` (entero).
    * **Cuerpo de la solicitud:** Objeto JSON con los detalles actualizados de la meta.
    * **Respuesta (200 OK):** La meta actualizada en formato JSON.
* **DELETE /api/metas/{id}:** Elimina una meta por su ID.
    * **Autenticación:** Requiere un token JWT válido en el encabezado `Authorization`.
    * **Parámetros de ruta:** `id` (entero).
    * **Respuesta (204 No Content):** La meta se eliminó correctamente.

### Usuarios

* **DELETE /api/usuarios/{id}:** Elimina un usuario por su ID.
    * **Autenticación:** Requiere un token JWT válido en el encabezado `Authorization`.
    * **Parámetros de ruta:** `id` (entero).
    * **Respuesta (204 No Content):** El usuario se eliminó correctamente.

## Autenticación

La API utiliza autenticación JWT. Se requiere un token JWT válido en el encabezado `Authorization` para acceder a los puntos finales protegidos.

## Errores

* **401 No autorizado:** Token inválido, expirado o no proporcionado.
* **404 No encontrado:** La meta o el usuario con el ID especificado no existe.

## Ejemplos de código

### Node.js

```javascript
const axios = require('axios');

axios.get('http://localhost:10000/api/metas', {
    headers: {
        Authorization: 'Bearer <token>'
    }
})
.then(response => {
    console.log(response.data);
})
.catch(error => {
    console.error(error);
});