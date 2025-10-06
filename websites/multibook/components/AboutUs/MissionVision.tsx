interface MissionVisionProps {
  missionTitle?: string;
  mission?: string;
  visionTitle?: string;
  vision?: string;
}

export default function MissionVision({
  missionTitle,
  mission,
  visionTitle,
  vision,
}: MissionVisionProps) {
  return (
    <section className="bg-white w-full">
      <div className="w-full">
        {/* Mission */}
        <div
          className="flex justify-center items-center h-[50vh] px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: '#0F1F4B' }}
        >
          <div className="container mx-auto max-w-7xl">
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-multibook-red text-left mb-1 md:mb-2">
              {missionTitle}
            </p>
            <p
              className="text-2xl lg:text-5xl font-medium text-white text-left leading-tight sm:leading-snug lg:leading-normal"
              style={{ lineHeight: '1.2' }}
            >
              {mission ||
                'To empower businesses with innovative solutions that simplify operations and accelerate growth.'}
            </p>
          </div>
        </div>

        {/* Vision */}
        <div
          className="flex justify-center items-center h-[50vh] px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: '#FE6568' }}
        >
          <div className="container mx-auto max-w-7xl">
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-white text-left mb-1 md:mb-2">
              {visionTitle}
            </p>
            <p
              className="text-2xl lg:text-5xl font-medium text-oxford-blue text-left leading-tight sm:leading-snug lg:leading-normal"
              style={{ lineHeight: '1.2' }}
            >
              {vision ||
                'To be the leading provider of integrated business management solutions worldwide.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
