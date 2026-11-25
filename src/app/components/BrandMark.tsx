type Props = { className?: string };

export default function BrandMark({ className }: Props) {
  return (
    <img
      className={className}
      src="/banner-el-ganador-oficial.png"
      alt="EL GANADOR · Rifas online"
      style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
    />
  );
}
