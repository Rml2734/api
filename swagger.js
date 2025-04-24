const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Backend de MetasApp',
      version: '1.0.0',
      description: 'Documentación de la API Backend de MetasApp',
    },
  },
  apis: ['./routes/metas.js'], // Ruta a tus archivos de rutas
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;