import Link from 'next/link';

interface NewsletterItem {
  id: string;
  documentId: string;
  image: string;
  title: string;
  description: string;
}

interface NewsletterSectionProps {
  title?: string;
  items: NewsletterItem[];
}

export default function NewsletterSection({ title, items }: NewsletterSectionProps) {
  return (
    <section id="newsletter" className="px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[70px] font-bold text-center text-oxford-blue mb-8 sm:mb-10 md:mb-12">
          {title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 pb-16 sm:pb-20 md:pb-24">
          {items.slice(0, 3).map((item) => (
            <Link key={item.id} href={`/newsletter/${item.id}`} className="w-full h-full">
              <div className="h-full flex flex-col">
                {/* Image */}
                <div className="relative w-full aspect-[4/3] sm:aspect-[5/4] md:aspect-[4/3] lg:aspect-[5/4] xl:aspect-[10/7]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="object-cover rounded-2xl sm:rounded-3xl"
                      style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-2xl sm:rounded-3xl">
                      <span className="text-gray-400 text-sm sm:text-base">No image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold text-multibook-red mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
