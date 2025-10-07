interface PageHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div
      className="relative h-[20rem] pt-[1.9rem] pb-[130px] -mt-[120px] z-0"
      style={{
        background: 'linear-gradient(73deg, #c1e0fe 0%, #0d1b87 35%, #fe6568 65%, #f1f06c 100%)',
        paddingTop: '10rem',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 text-center">
        {title && <h1 className="text-white text-[3rem] md:text-[4rem] font-bold mb-4">{title}</h1>}
        {subtitle && (
          <p className="text-white text-[1.2rem] md:text-[1.5rem] font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
