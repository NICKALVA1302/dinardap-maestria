const AuditLog = require('../models/AuditLog');
const resolvers = {
  Query: {
    async auditorias() {
      return await AuditLog.find();
    }
  }
};
module.exports = resolvers;