const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Citizen = require('../models/Citizen');

let mongoServer;

beforeAll(async () => {
  jest.setTimeout(20000);
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_secret';
  process.env.OAUTH_CLIENTS = 'test_client:secret123';

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // seed datos
  await Citizen.create({ cedula: '0928239235', nombre: 'ALVAREZ ARCE NICOLÁS ALEXANDER', estado: 'ACTIVA' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('DINARDAP API integration', () => {
  let token;

  test('obtain token with client credentials', async () => {
    const res = await request(app)
      .post('/oauth/token')
      .type('form')
      .send({ grant_type: 'client_credentials', client_id: 'test_client', client_secret: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    token = res.body.access_token;
  });

  test('health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('consulta-ciudadano returns data for seeded cedula', async () => {
    const res = await request(app)
      .get('/api/v1/dinardap/consulta-ciudadano/0102030405')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cedula).toBe('0102030405');
  });

  test('validacion-identidad returns valida true for seeded cedula', async () => {
    const res = await request(app)
      .get('/api/v1/dinardap/validacion-identidad/0102030405')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.valida).toBe(true);
  });

  test('consulta-ciudadano returns 404 for unknown cedula', async () => {
    const res = await request(app)
      .get('/api/v1/dinardap/consulta-ciudadano/9999999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
