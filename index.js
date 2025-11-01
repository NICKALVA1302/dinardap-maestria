require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinardap';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Conectado a la base de datos MongoDB');
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => console.log(`Servidor escuchando en el puerto ${port}`));
  })
  .catch(err => {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
  });
