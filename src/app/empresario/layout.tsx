// app/empresario/layout.tsx
// Layout de la superficie EMPRESARIAL: guarda de acceso propia, independiente
// de la superficie cliente.
import BusinessGuard from '@/components/business/BusinessGuard';

export const metadata = { title: 'El Ganador · Portal Empresarial' };

export default function EmpresarioLayout({ children }: { children: React.ReactNode }) {
  return <BusinessGuard>{children}</BusinessGuard>;
}
