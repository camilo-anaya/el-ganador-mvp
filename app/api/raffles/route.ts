import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_CATALOG_RAFFLES = [
  {
    id: 'combo-flagship-5g',
    title: 'Smartphone 5G Pro Max + Smartwatch',
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 25.000',
    ticket_price: 25000,
    total_tickets: 100,
    soldPercent: 92,
    timeLabel: '⏳ En 2h 15m',
    category: 'tech',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
    ballotGrid: 100,
    description: 'Smartphone 5G Pro Max de 256 GB liberado con pantalla OLED 120Hz, triple cámara 48 MP y Smartwatch AMOLED con monitor cardíaco. Garantía 1 año.',
  },
  {
    id: 'yamaha-mt09-caribe',
    title: 'Yamaha MT-09 0 km + Matrícula',
    merchant: 'Motos Caribe Oficial',
    city: 'Barranquilla',
    priceCop: '$ 35.000',
    ticket_price: 35000,
    total_tickets: 1000,
    soldPercent: 88,
    timeLabel: '⏳ En 4h 40m',
    category: 'motos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'closing_soon',
    ballotGrid: 1000,
    description: 'Motocicleta deportiva 0 km lista para rodar, con SOAT, matrícula y casco certificado incluidos.',
  },
  {
    id: 'rolex-oro-18k',
    title: 'Cronógrafo & Cadena Oro 18K',
    merchant: 'Joyas & Diamantes ABC',
    city: 'Cartagena',
    priceCop: '$ 50.000',
    ticket_price: 50000,
    total_tickets: 100,
    soldPercent: 64,
    timeLabel: '🗓️ Sáb 9:00 PM',
    category: 'joyas',
    image: '/reloj-alta-gama.jpg',
    stage: 'upcoming',
    ballotGrid: 100,
    description: 'Cronógrafo suizo de alta precisión en acero inoxidable y cadena de oro macizo de 18 kilates garantizada con certificado gemológico.',
  },
  {
    id: 'bono-vip-moda',
    title: 'Calzado Diseñador + Gafas VIP',
    merchant: 'Boutique Elegance & Óptica VIP',
    city: 'Medellín',
    priceCop: '$ 15.000',
    ticket_price: 15000,
    total_tickets: 100,
    soldPercent: 52,
    timeLabel: '🗓️ Dom 7:00 PM',
    category: 'moda',
    image: '/zapatos-sandalias-dama.jpg',
    stage: 'upcoming',
    ballotGrid: 100,
    description: 'Par de sandalias/tacones de diseñador a elección más gafas de sol polarizadas italianas con estuche de lujo.',
  },
  {
    id: 'toyota-hilux-caribe',
    title: 'Toyota Hilux 4x4 Diésel 2026',
    merchant: 'AutoPremier Colombia 4x4',
    city: 'Cali',
    priceCop: '$ 50.000',
    ticket_price: 50000,
    total_tickets: 1000,
    soldPercent: 78,
    timeLabel: '⏳ En 6h 30m',
    category: 'vehiculos',
    image: '/galeria-premios-el-ganador-realista.jpg',
    stage: 'closing_soon',
    ballotGrid: 1000,
    description: 'Camioneta 4x4 Diésel nueva de vitrina con trámites de matrícula, SOAT y blindaje parcial incluidos.',
  },
  {
    id: 'ps5-pro-bundle',
    title: 'PlayStation 5 Pro + 2 Mandos DualSense',
    merchant: 'TechStore Colombia',
    city: 'Bogotá',
    priceCop: '$ 20.000',
    ticket_price: 20000,
    total_tickets: 100,
    soldPercent: 86,
    timeLabel: '⏳ En 3h 15m',
    category: 'gaming',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'closing_soon',
    ballotGrid: 100,
    description: 'Consola PlayStation 5 Pro con 2 TB de almacenamiento SSD, 2 mandos inalámbricos y suscripción por 1 año.',
  },
  {
    id: 'viaje-cancun-vip',
    title: 'Viaje a Cancún All-Inclusive (2 Personas)',
    merchant: 'Viajes & Sueños VIP',
    city: 'Medellín',
    priceCop: '$ 25.000',
    ticket_price: 25000,
    total_tickets: 100,
    soldPercent: 58,
    timeLabel: '🗓️ Sáb 8:00 PM',
    category: 'viajes',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
    ballotGrid: 100,
    description: 'Tiquetes aéreos ida y vuelta para 2 personas con 5 noches en hotel 5 estrellas todo incluido en la Riviera Maya.',
  },
  {
    id: 'combo-smart-hogar',
    title: 'Smart TV 65" 4K + Barra de Sonido',
    merchant: 'Hogar & Confort VIP',
    city: 'Barranquilla',
    priceCop: '$ 18.000',
    ticket_price: 18000,
    total_tickets: 100,
    soldPercent: 62,
    timeLabel: '🗓️ Dom 6:00 PM',
    category: 'hogar',
    image: '/galeria-premios-hogar-moda-viajes-portrait.jpg',
    stage: 'upcoming',
    ballotGrid: 100,
    description: 'Televisor Smart TV 65 pulgadas OLED 4K con barra de sonido Dolby Atmos y subwoofer inalámbrico.',
  },
  {
    id: 'gafas-polarizadas-vip',
    title: 'Gafas de Sol Polarizadas + Montura VIP',
    merchant: 'Óptica Visión VIP',
    city: 'Bucaramanga',
    priceCop: '$ 12.000',
    ticket_price: 12000,
    total_tickets: 100,
    soldPercent: 44,
    timeLabel: '🗓️ Lun 7:00 PM',
    category: 'optica',
    image: '/gafas-dama-hombre.jpg',
    stage: 'upcoming',
    ballotGrid: 100,
    description: 'Gafas de sol polarizadas con protección UV400 y montura de titanio ultra liviana con estuche rígido.',
  },
];

function mapSupabaseRaffle(r: any) {
  const price = Number(r.ticket_price || 25000);
  const total = Number(r.total_tickets || 1000);
  const formattedPrice = `$ ${price.toLocaleString('es-CO')}`;

  let img = '/galeria-premios-el-ganador-realista.jpg';
  if (r.payment_receipt_url && (r.payment_receipt_url.includes('.jpg') || r.payment_receipt_url.includes('.jpeg') || r.payment_receipt_url.includes('.png') || r.payment_receipt_url.includes('storage'))) {
    img = r.payment_receipt_url;
  }

  let timeDisplay = '⏳ Próximamente';
  if (r.draw_date) {
    try {
      timeDisplay = `🗓️ ${new Date(r.draw_date).toLocaleDateString('es-CO')}`;
    } catch {}
  }

  return {
    id: r.id,
    title: r.title || 'Gran Sorteo Oficial',
    merchant: r.city ? `Comercio ${r.city}` : 'Comercio Oficial',
    city: r.city || 'Colombia',
    priceCop: formattedPrice,
    ticket_price: price,
    total_tickets: total,
    soldPercent: 0,
    timeLabel: timeDisplay,
    category: 'vehiculos',
    image: img,
    stage: 'upcoming',
    description: r.description || 'Sorteo oficial respaldado por El Ganador.',
    ballotGrid: total,
    radicado_number: r.radicado_number,
    resolution_pdf_url: r.resolution_pdf_url,
    payment_receipt_url: r.payment_receipt_url,
    status: r.status,
    legalVerified: true,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get('id') || searchParams.get('sorteo') || searchParams.get('raffleId');

  // Si se solicita un sorteo específico
  if (targetId) {
    const norm = targetId.trim().toLowerCase();

    // 1. Buscar en catálogo estático primero
    const catalogMatch = DEFAULT_CATALOG_RAFFLES.find(
      (r) =>
        r.id.toLowerCase() === norm ||
        r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === norm
    );
    if (catalogMatch) {
      return NextResponse.json({ ok: true, raffle: catalogMatch });
    }

    // 2. Buscar en Supabase
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      let query = supabase.from('raffles').select('*');

      if (isUuid) {
        query = query.eq('id', targetId);
      } else {
        query = query.or(`radicado_number.eq.${targetId},title.ilike.%${targetId}%`);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        return NextResponse.json({ ok: true, raffle: mapSupabaseRaffle(data) });
      }
    } catch (e) {
      console.warn('Error querying Supabase for raffle ID:', e);
    }

    return NextResponse.json({ ok: false, message: 'Rifa no encontrada' }, { status: 404 });
  }

  // Si no se pasa ID, retornar lista combinada de Supabase + catálogo
  try {
    const { data: dbRaffles, error } = await supabase
      .from('raffles')
      .select('*')
      .order('created_at', { ascending: false });

    const mappedDb = (!error && Array.isArray(dbRaffles))
      ? dbRaffles.map(mapSupabaseRaffle)
      : [];

    const existingIds = new Set(mappedDb.map((r) => r.id));
    const all = [...mappedDb, ...DEFAULT_CATALOG_RAFFLES.filter((r) => !existingIds.has(r.id))];

    return NextResponse.json({ ok: true, raffles: all });
  } catch (e) {
    return NextResponse.json({ ok: true, raffles: DEFAULT_CATALOG_RAFFLES });
  }
}
