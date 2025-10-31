const mongoose = require('mongoose');

const CitizenSchema = new mongoose.Schema({
  cedula: { type: String, required: true, unique: true },
  nombre: String,
  estadocivil: String,
  fechaexpedicion: String,
  fechanacimiento: String,
  instruccion: String,
  nacionalidad: String,
  profesion: String,
  lugarnacimiento: String,
  domicilio: String,
  estado: { type: String, default: 'ACTIVA' }
}, { timestamps: true });

module.exports = mongoose.model('Citizen', CitizenSchema);
