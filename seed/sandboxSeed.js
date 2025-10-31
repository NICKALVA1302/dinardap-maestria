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
      cedula: '0908070605',
      nombre: 'María Gomez',
      estadocivil: 'CASADO',
      fechaexpedicion: '2012-02-01',
      fechanacimiento: '1990-07-20',
      instruccion: 'TECNICA',
      nacionalidad: 'ECUATORIANA',
      profesion: 'Enfermera',
      lugarnacimiento: 'Guayaquil',
      domicilio: 'Calle Falsa 456',
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
