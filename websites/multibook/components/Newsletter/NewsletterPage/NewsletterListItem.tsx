import Link from 'next/link';

interface NewsletterListItemProps {
  documentId: string;
  title: string;
  imageUrl: string;
  imageHeight?: string;
  date?: string;
  contentPreview?: string;
}

export default function NewsletterListItem({
  documentId,
  title,
  imageUrl,
  date,
  contentPreview,
}: NewsletterListItemProps) {
  return (
    <Link
      href={`/newsletter/${documentId}`}
      className=" cursor-pointer transition-transform duration-300 hover:-translate-y-[5px] group"
      id={documentId}
    >
      <div className={`relative w-full overflow-hidden rounded-[15px] h-[200px]`}>
        <img
          src={imageUrl}
          alt={title}
          className="object-cover group-hover:scale-105 transition-transform duration-300 h-[200px]"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
      </div>
      <p className="text-[#FE6568] text-xl font-bold mt-[15px] text-left line-clamp-2 overflow-hidden">
        {title}
      </p>
      {/* article content */}
      {contentPreview && (
        <p className="text-gray-400 text-base mt-2 text-left line-clamp-2 overflow-hidden">
          {contentPreview}
        </p>
      )}
      <p className="text-gray-500 text-sm my-2 text-left overflow-hidden">
        {date
          ? new Date(date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : ''}
      </p>
    </Link>
  );
}
