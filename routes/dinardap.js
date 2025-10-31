const express = require('express');
const router = express.Router();
const Citizen = require('../models/Citizen');
const AuditLog = require('../models/AuditLog');
const { requireScope } = require('../middleware/auth');

async function writeAudit(req, { cedula, exitoso, metadata = {} }) {
  try {
    const aud = new AuditLog({
      usuario: req.auth ? req.auth.sub : 'unknown',
      cedula,
      endpoint: req.originalUrl,
      metodo: req.method,
      ipOrigen: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      exitoso,
      metadata
    });
    await aud.save();
  } catch (err) {
    console.error('Error saving audit log:', err);
  }
}

// GET /consulta-ciudadano/:cedula
router.get('/consulta-ciudadano/:cedula', requireScope('dinardap:consulta'), async (req, res) => {
  const cedula = req.params.cedula;
  try {
    const citizen = await Citizen.findOne({ cedula }).lean();
    if (!citizen) {
      await writeAudit(req, { cedula, exitoso: false });
      return res.status(404).json({ success: false, message: 'Cédula no encontrada en el registro' });
    }
    await writeAudit(req, { cedula, exitoso: true });
    return res.json({ success: true, message: 'Información obtenida exitosamente', data: citizen });
  } catch (err) {
    await writeAudit(req, { cedula, exitoso: false, metadata: { error: err.message } });
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// GET /validacion-identidad/:cedula
router.get('/validacion-identidad/:cedula', requireScope('dinardap:validacion'), async (req, res) => {
  const cedula = req.params.cedula;
  try {
    const citizen = await Citizen.findOne({ cedula }).lean();
    if (!citizen) {
      await writeAudit(req, { cedula, exitoso: true, metadata: { valida: false, motivo: 'Cédula no registrada o inactiva' } });
      return res.json({ success: true, message: 'Validación completada', data: { cedula, valida: false, motivo: 'Cédula no registrada o inactiva' } });
    }
    await writeAudit(req, { cedula, exitoso: true, metadata: { valida: true } });
    return res.json({ success: true, message: 'Validación completada exitosamente', data: { cedula, valida: true, nombre: citizen.nombre, estado: citizen.estado, fechaValidacion: new Date().toISOString() } });
  } catch (err) {
    await writeAudit(req, { cedula, exitoso: false, metadata: { error: err.message } });
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// GET /auditoria
// query: fechaInicio, fechaFin, cedula, usuario, page, limit
router.get('/auditoria', requireScope('dinardap:auditoria'), async (req, res) => {
  // Helper to parse date strings. Accepts ISO (YYYY-MM-DD) or DD/MM/YYYY
  function parseDateFlexible(input) {
    if (!input) return null;
    const d1 = new Date(input);
    if (!isNaN(d1.valueOf())) return d1;
    const m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const day = m[1].padStart(2, '0');
      const month = m[2].padStart(2, '0');
      const year = m[3];
      const iso = `${year}-${month}-${day}`;
      const d2 = new Date(iso);
      if (!isNaN(d2.valueOf())) return d2;
    }
    return null;
  }

  try {
    const { fechaInicio, fechaFin, cedula, usuario, page = 1, limit = 50 } = req.query;
    const q = {};
    if (cedula) q.cedula = cedula;
    if (usuario) q.usuario = usuario;

    const start = parseDateFlexible(fechaInicio);
    const end = parseDateFlexible(fechaFin);
    if (fechaInicio && !start) return res.status(400).json({ success: false, message: 'fechaInicio tiene un formato inválido. Use YYYY-MM-DD o DD/MM/YYYY' });
    if (fechaFin && !end) return res.status(400).json({ success: false, message: 'fechaFin tiene un formato inválido. Use YYYY-MM-DD o DD/MM/YYYY' });
    if (start || end) q.fechaHora = {};
    if (start) q.fechaHora.$gte = start;
    if (end) {
      // Para fechaFin, incluir todo el día: end + 1 día - 1 ms
      const endOfDay = new Date(end);
      endOfDay.setDate(endOfDay.getDate() + 1);
      endOfDay.setMilliseconds(-1);
      q.fechaHora.$lte = endOfDay;
    }

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const pg = Math.max(parseInt(page, 10) || 1, 1);

    const total = await AuditLog.countDocuments(q);
    const registros = await AuditLog.find(q).sort({ fechaHora: -1 }).skip((pg - 1) * lim).limit(lim).lean();

    return res.json({
      success: true,
      message: 'Auditoría obtenida exitosamente',
      data: {
        registros,
        paginacion: {
          paginaActual: pg,
          totalPaginas: Math.ceil(total / lim),
          totalRegistros: total,
          registrosPorPagina: lim
        }
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
