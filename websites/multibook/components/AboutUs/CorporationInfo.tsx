'use client';

interface CompanyInfoItem {
  id: string;
  label: string;
  information: string;
}

interface HistoryEventItem {
  id: string;
  attributes: {
    year: string;
    description: string;
  };
}

interface CorporationInfoProps {
  backgroundImage?: string;
  title?: string;
  subHeadline?: string;
  historyTitle?: string;
  companyInfo?: CompanyInfoItem[];
  historyEvents?: HistoryEventItem[];
}

export default function CorporationInfo({
  backgroundImage,
  title,
  subHeadline,
  historyTitle,
  companyInfo = [],
  historyEvents = [],
}: CorporationInfoProps) {
  // Sort company info in specific order
  const desiredOrder = [
    'Company Name',
    'Location',
    'Representative',
    'Establishment',
    'Business',
    'Overseas offices',
  ];
  const sortedCompanyInfo = [...companyInfo].sort((a, b) => {
    const indexA = desiredOrder.indexOf(a.label);
    const indexB = desiredOrder.indexOf(b.label);
    return indexA - indexB;
  });

  // Helper function to decode HTML entities (server-safe)
  const decodeHtml = (html: string) => {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  // Transform API history data to component format and sort by year ascending
  const transformedHistoryEvents = historyEvents
    .map((item) => ({
      date: item.attributes.year,
      event: decodeHtml(item.attributes.description.replace(/<[^>]*>/g, ' ')).trim(),
    }))
    .sort((a, b) => {
      // Convert year strings to numbers for proper sorting
      const yearA = parseFloat(a.date);
      const yearB = parseFloat(b.date);
      return yearA - yearB;
    });

  return (
    <section className="w-full bg-white">
      <div className="min-h-screen">
        {/* Upper Section */}
        <div
          className="relative flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-14 p-6 md:p-8 lg:p-12 xl:p-20 min-h-[70vh]"
          style={{
            background: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          {/* Content */}
          <div className="relative z-10 w-full lg:max-w-3xl text-center lg:text-left">
            <p className="hero-text text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[4.5em] font-[600] mb-3 sm:mb-4">
              {title}
            </p>
            <p className="hero-text italic text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[1.7em]">
              {subHeadline}
            </p>
          </div>

          {/* Company Information Table */}
          <div className="w-full lg:w-[35%] max-w-md lg:max-w-none z-10">
            <div className="space-y-0">
              {sortedCompanyInfo.map((info, index) => (
                <div
                  key={info.id || index}
                  className="flex flex-col sm:flex-row py-2 sm:py-3 items-start sm:items-center gap-1 sm:gap-0"
                >
                  <div className="font-semibold text-white text-sm sm:text-base w-full sm:w-[35%] lg:w-[30%]">
                    {info.label}
                  </div>
                  <div className="text-white text-sm sm:text-base leading-[1.3em] w-full sm:w-[65%] lg:w-[70%]">
                    {info.information}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* overlay */}
          <div className="absolute inset-0 bg-black opacity-20 z-0"></div>
        </div>

        {/* Lower Information Panel */}
        <div className="bg-white flex flex-col items-center p-6 md:p-8 lg:p-12 xl:p-20">
          {/* History Timeline */}
          <div className="w-full max-w-7xl">
            {/* History Title */}
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h3 className="text-2xl md:text-4xl font-bold text-oxford-blue tracking-wider">
                {historyTitle}
              </h3>
            </div>

            {/* History Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
              {/* First Column */}
              <div className="space-y-3 sm:space-y-4">
                {transformedHistoryEvents
                  .slice(0, Math.ceil(transformedHistoryEvents.length / 2))
                  .map((event, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="font-bold text-sm sm:text-base text-oxford-blue whitespace-nowrap sm:w-[20%] lg:w-[15%]">
                        {event.date}
                      </div>
                      <div className="text-gray-700 text-sm sm:text-base leading-relaxed sm:w-[80%] lg:w-[85%]">
                        {event.event}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Second Column */}
              <div className="space-y-3 sm:space-y-4">
                {transformedHistoryEvents
                  .slice(Math.ceil(transformedHistoryEvents.length / 2))
                  .map((event, index) => (
                    <div
                      key={index + Math.ceil(transformedHistoryEvents.length / 2)}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="font-bold text-sm sm:text-base text-gray-900 whitespace-nowrap sm:w-[20%] lg:w-[15%]">
                        {event.date}
                      </div>
                      <div className="text-gray-700 text-sm sm:text-base leading-relaxed sm:w-[80%] lg:w-[85%]">
                        {event.event}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
