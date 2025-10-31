require('dotenv').config();
const mongoose = require('mongoose');
const Citizen = require('../models/Citizen');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dinardap';

async function seed() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Se conectó a la base de MONGO');

  const samples = [
    {
      cedula: '0928239235',
      nombre: 'ÁLVAREZ ARCE NICOLÁS ALEXANDER',
      estadocivil: 'SOLTERO',
      fechaexpedicion: '2010-05-12',
      fechanacimiento: '2002-08-09',
      instruccion: 'UNIVERSITARIA',
      nacionalidad: 'ECUATORIANA',
      profesion: 'Ingeniero',
      lugarnacimiento: 'Quito',
      domicilio: 'AV CRISTOBAL COLÓN',
      estado: 'ACTIVA'
    },
    {
      cedula: '0967285770',
      nombre: 'HERRERA PÉREZ STEVEN ALBERTO',
      estadocivil: 'SOLTERO',
      fechaexpedicion: '2020-02-01',
      fechanacimiento: '1998-09-09',
      instruccion: 'UNIVERSITARIA',
      nacionalidad: 'ECUATORIANA',
      profesion: 'INGENIERO EN SISTEMAS',
      lugarnacimiento: 'GUAYAQUIL',
      domicilio: 'SUBURBIO DE GUAYAQUIL',
      estado: 'ACTIVA'
    },
    {
      cedula: '0908070605',
      nombre: 'GOMEZ RODRIGUEZ MARIA FERNANDA',
      estadocivil: 'CASADO',
      fechaexpedicion: '2012-02-01',
      fechanacimiento: '1990-07-20',
      instruccion: 'TECNICA',
      nacionalidad: 'ECUATORIANA',
      profesion: 'ENFERMERA',
      lugarnacimiento: 'GUAYAQUIL',
      domicilio: 'CALLE FALSA 456',
      estado: 'ACTIVA'
    }
  ];

  for (const s of samples) {
    await Citizen.updateOne({ cedula: s.cedula }, { $set: s }, { upsert: true });
    console.log('Ingresado', s.cedula);
  }

  console.log('Seeding finalizado');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
