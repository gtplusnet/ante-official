
interface ContactUsHeroProps {
  title: string;
  header: string;
  subheader: string;
  backgroundImage: string;
}

export default function ContactUsHero({
  title,
  header,
  subheader,
  backgroundImage,
}: ContactUsHeroProps) {
  return (
    <div className="relative h-[40vh] md:h-[45vh] lg:h-[50vh] flex flex-col justify-center items-start rounded-t-[60px] -mt-[60px] z-[5] overflow-hidden">
      <img
        src={backgroundImage}
        alt="Contact us background"
        className="object-cover"
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <div className="relative z-10 text-center md:text-start font-noto-sans px-[25px] md:px-[100px]">
        <h1 className="title text-[2.5em] md:text-[70px] font-bold text-white">{title}</h1>
        <h2 className="text-[1.2em] md:text-[2rem] font-medium text-[#f1f080] mb-4 md:mb-6">
          {header}
        </h2>
        <p
          className="w-full md:w-[60%] text-[1.2rem] md:text-[1.5rem] font-normal text-white text-center md:text-start mx-auto md:mx-0"
          style={{ lineHeight: '25px' }}
        >
          {subheader}
        </p>
      </div>
    </div>
  );
}
