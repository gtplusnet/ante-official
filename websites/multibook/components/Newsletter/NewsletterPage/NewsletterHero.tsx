interface NewsletterHeroProps {
  title: string;
  backgroundImage: string;
}

export default function NewsletterHero({ title, backgroundImage }: NewsletterHeroProps) {
  return (
    <div className="relative h-[40vh] md:h-[45vh] lg:h-[50vh] rounded-t-[60px] -mt-[60px] z-[5] overflow-hidden">
      <img
        src={backgroundImage}
        alt="Newsletter background"
        className="object-cover"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 h-full flex items-center justify-center px-5 py-20">
        <h2 className="text-[2.5em] md:text-[70px] font-bold text-white">{title}</h2>
      </div>
    </div>
  );
}
