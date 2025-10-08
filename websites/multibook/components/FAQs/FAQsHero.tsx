'use client';

export default function FAQsHero({
  backgroundCover,
  pageTitle,
}: {
  backgroundCover: string;
  pageTitle: string;
}) {
  return (
    <div
      className="h-[40vh] md:h-[45vh] lg:h-[50vh] flex items-center justify-center rounded-t-[60px] relative -mt-[60px] z-[5]"
      style={{
        backgroundImage: `url(${backgroundCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center">
        <h2 className="text-[3rem] md:text-[70px] font-bold text-white">{pageTitle}</h2>
      </div>
    </div>
  );
}
