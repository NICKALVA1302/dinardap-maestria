require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { authMiddleware } = require('./middleware/auth');
const dinardapRoutes = require('./routes/dinardap');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const expressGraphqlHTTP = require('express-graphql');

const app = express();
// Pruebas app.set('trust proxy', true); // Para AWS ALB/CloudFront: usar X-Forwarded-For
//Prod
app.set('x-forwarded-for', true);
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  originAgentCluster: false
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const schema = require ('./graphql/schema.js');
app.use('/graphql',expressGraphqlHTTP.graphqlHTTP({
  graphiql:true,
  schema:schema
}));

app.post('/oauth/token', (req, res) => {
  const grant_type = req.body.grant_type || req.query.grant_type;
  if (grant_type !== 'client_credentials') return res.status(400).json({ error: 'unsupported_grant_type' });

  const clientId = req.body.client_id || req.query.client_id;
  const clientSecret = req.body.client_secret || req.query.client_secret;
  if (!clientId || !clientSecret) return res.status(400).json({ error: 'invalid_client' });

  const clientsRaw = (process.env.OAUTH_CLIENTS || '').split(',').map(s => s.trim()).filter(Boolean);
  const valid = clientsRaw.some(c => {
    const [id, secret] = c.split(':');
    return id === clientId && secret === clientSecret;
  });
  if (!valid) return res.status(401).json({ error: 'invalid_client' });

  const payload = {
    iss: 'min-gob-dinardap-sandbox',
    sub: clientId,
    scope: 'dinardap:consulta dinardap:validacion dinardap:auditoria'
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '2h' });
  res.json({ access_token: token, token_type: 'Bearer', expires_in: 7200 });
});

app.use('/api/v1/dinardap', authMiddleware, dinardapRoutes);
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// Swagger UI (interactive API docs) — incluye esquema Bearer para probar con token
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

module.exports = app;
