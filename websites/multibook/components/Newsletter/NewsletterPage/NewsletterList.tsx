import Link from 'next/link';
import NewsletterListItem from './NewsletterListItem';

interface NewsletterListItem {
  id: number;
  documentId: string;
  title: string;
  imageUrl: string;
  readMoreText: string;
  contentPreview?: string;
}

interface NewsletterListProps {
  newsletters: NewsletterListItem[];
  currentPage: number;
  totalPages: number;
}

export default function NewsletterList({
  newsletters,
  currentPage,
  totalPages,
}: NewsletterListProps) {
  const displayedPages = (() => {
    const pages = [];
    const maxVisiblePages = 5;
    // Ensure at least 1 page is displayed
    const effectiveTotalPages = Math.max(1, totalPages);

    if (effectiveTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= effectiveTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= effectiveTotalPages - 2) {
        for (let i = effectiveTotalPages - 4; i <= effectiveTotalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  })();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1200px] mx-auto px-[50px] pt-[50px] lg:pt-[150px] pb-2.5">
        {newsletters.map((newsletter) => (
          <NewsletterListItem key={newsletter.id} {...newsletter} />
        ))}
      </div>

      {/* Always display pagination */}
      <div className="flex justify-center items-center gap-2 pt-8 pb-16">
        <Link
          href={currentPage > 1 ? `/newsletter?page=${currentPage - 1}` : '/newsletter?page=1'}
          className={`flex items-center justify-center min-w-[2.5rem] h-10 px-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-all ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer hover:bg-gray-50 hover:border-gray-400'
          }`}
          aria-disabled={currentPage === 1}
        >
          <span className="text-xl leading-none">←</span>
        </Link>

        <div className="flex gap-2">
          {displayedPages.map((page) => (
            <Link
              key={page}
              href={`/newsletter?page=${page}`}
              className={`flex items-center justify-center min-w-[2.5rem] h-10 px-3 border rounded-lg text-sm font-medium cursor-pointer transition-all ${
                currentPage === page
                  ? 'bg-[#0a0f2c] text-white border-[#0a0f2c]'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {page}
            </Link>
          ))}
        </div>

        <Link
          href={
            currentPage < Math.max(1, totalPages)
              ? `/newsletter?page=${currentPage + 1}`
              : `/newsletter?page=${Math.max(1, totalPages)}`
          }
          className={`flex items-center justify-center min-w-[2.5rem] h-10 px-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-all ${
            currentPage === Math.max(1, totalPages)
              ? 'opacity-50 cursor-not-allowed pointer-events-none'
              : 'cursor-pointer hover:bg-gray-50 hover:border-gray-400'
          }`}
          aria-disabled={currentPage === Math.max(1, totalPages)}
        >
          <span className="text-xl leading-none">→</span>
        </Link>
      </div>
    </>
  );
}
