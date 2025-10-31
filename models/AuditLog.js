const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  usuario: String,
  cedula: String,
  endpoint: String,
  metodo: String,
  fechaHora: { type: Date, default: Date.now },
  ipOrigen: String,
  exitoso: Boolean,
  metadata: Object
});

module.exports = mongoose.model('AuditLog', AuditSchema);
