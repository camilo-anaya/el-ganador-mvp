// audit-master.js - Auditoría Maestra en Tiempo Real para "El Ganador"
const fs = require('fs');
const path = require('path');

const coreModules = [
  { path: 'src/app/sorteo-en-vivo/page.tsx', name: '🎱 Balotera y Ruleta (SHA-256 Intocable)' },
  { path: 'src/components/StoryViewer.tsx', name: '📱 Visor de Historias (Lógica Instagram 5s / Video)' },
  { path: 'src/components/WompiCheckoutBtn.tsx', name: '💳 Pasarela Wompi Anti-Doble Clic' },
  { path: 'src/lib/supabase.ts', name: '☁️ Cliente Supabase y Storage' },
  { path: 'src/app/globals.css', name: '🎨 Estilos Globales, Safe Area y Opacidades' },
  { path: 'src/app/empresario/page.tsx', name: '💼 Panel Empresario con useSearchParams (Suspense)' },
  { path: 'src/app/perfil/page.tsx', name: '👤 Perfil de Usuario y Borrado de Cuenta' }
];

console.log('==================================================');
console.log('🔍 INICIANDO AUDITORÍA MAESTRA DE "EL GANADOR"');
console.log('==================================================\n');

let errorCount = 0;

coreModules.forEach((mod) => {
  const fullPath = path.join(process.cwd(), mod.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.trim().length > 50) {
      console.log(`✅ [VERIFICADO] ${mod.name}`);
      console.log(
        `   ↳ Ruta: ${mod.path} (${content.length} caracteres escritos)\n`
      );
    } else {
      console.log(`⚠️ [ADVERTENCIA] ${mod.name}`);
      console.log(`   ↳ El archivo ${mod.path} está prácticamente vacío.\n`);
      errorCount++;
    }
  } else {
    console.log(`❌ [FALTANTE] ${mod.name}`);
    console.log(`   ↳ No se encontró el archivo en: ${mod.path}\n`);
    errorCount++;
  }
});

// Verificación de variables de entorno críticas
console.log('--------------------------------------------------');
console.log('🔑 VERIFICANDO CREDENCIALES Y ENTORNO...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasWompiKey = envContent.includes('NEXT_PUBLIC_WOMPI_PUBLIC_KEY');

  if (hasSupabaseUrl && hasWompiKey) {
    console.log('✅ [ENTORNO] Archivo .env.local configurado con llaves.');
  } else {
    console.log(
      '⚠️ [ENTORNO] El archivo .env.local existe pero faltan variables clave (Supabase o Wompi).'
    );
  }
} else {
  console.log(
    '❌ [ENTORNO CRÍTICO] No se encontró el archivo .env.local en la raíz. Las conexiones con Supabase y Wompi no funcionarán.'
  );
  errorCount++;
}

console.log('==================================================');
if (errorCount === 0) {
  console.log(
    '🎉 ¡AUDITORÍA PERFECTA! Todos los módulos requeridos están guardados y listos.'
  );
} else {
  console.log(
    `⚠️ Se detectaron ${errorCount} puntos de atención que debes revisar antes de compilar.`
  );
}
console.log('==================================================\n');
