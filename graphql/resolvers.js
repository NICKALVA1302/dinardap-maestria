const AuditLog = require('../models/AuditLog');
const resolvers = {
  Query: {
    async auditorias() {
      return await AuditLog.find();
    }
  },
  Mutation:{
    async createAuditoria(_,{input})
    {
      const newAuditLog=new AuditLog(input)
      await newAuditLog.save();
      return newAuditLog;
    },
  },
};
module.exports = resolvers;