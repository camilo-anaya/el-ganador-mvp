const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

console.log('--- Lines 1845-1895 (A Punto de Comenzar + Feed Comercios) ---');
for (let i = 1845; i < 1895; i++) console.log(`${i+1}: ${lines[i]}`);

console.log('--- Lines 1890-1975 (Pasarela Publicidad) ---');
for (let i = 1890; i < 1975; i++) console.log(`${i+1}: ${lines[i]}`);

console.log('--- Lines 1970-2045 (Salas en Vivo) ---');
for (let i = 1970; i < 2045; i++) console.log(`${i+1}: ${lines[i]}`);
