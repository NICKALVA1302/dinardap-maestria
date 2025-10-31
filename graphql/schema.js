const { makeExecutableSchema } = require("@graphql-tools/schema");
const resolvers  = require("../graphql/resolvers");

const typeDefs = `
type Query
{
    auditorias: [Auditoria]
}
type Auditoria
{
    usuario: String
    cedula: String
    endpoint: String
    metodo: String
    fechaHora: String
    ipOrigen: String
    exitoso: Boolean
}
`;
module.exports = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers,
});