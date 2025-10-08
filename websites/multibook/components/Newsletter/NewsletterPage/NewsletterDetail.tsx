import NewsletterListItem from './NewsletterListItem';
import { anteClient } from '@/lib/strapi';
import { extractFirstSentence } from '@/lib/utils';

interface TextChild {
  type?: string;
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface ParagraphBlock {
  type: 'paragraph';
  children: TextChild[];
}

interface HeadingBlock {
  type: 'heading';
  level?: number;
  children: TextChild[];
}

interface ListItem {
  children: TextChild[];
}

interface ListBlock {
  type: 'list';
  format?: 'ordered' | 'unordered';
  children: ListItem[];
}

type ContentBlock = ParagraphBlock | HeadingBlock | ListBlock;

interface Article {
  id: number;
  documentId: string;
  title: string;
  imageUrl: string;
  readMoreText: string;
}

interface NewsletterDetailProps {
  title: string;
  date: string;
  content: ContentBlock[];
  coverImage?: string;
  documentId: string;
  recentArticles: Article[];
}

export default async function NewsletterDetail({
  title,
  date,
  content,
  coverImage,
  documentId,
}: NewsletterDetailProps) {
  const renderContent = (blocks: ContentBlock[]) => {
    // Ensure blocks is an array
    if (!Array.isArray(blocks)) {
      console.log('Content is not an array:', blocks);
      // If it's a string, display it as a paragraph
      if (typeof blocks === 'string') {
        return <p className="mb-4 text-base leading-relaxed">{blocks}</p>;
      }
      return null;
    }

    return blocks.map((block, index) => {
      if (block.type === 'paragraph') {
        const hasContent = block.children.some((child) => child.text.trim() !== '');

        if (!hasContent) {
          return <br key={index} />;
        }

        return (
          <p key={index} className="mb-4 text-base leading-relaxed">
            {block.children.map((child, childIndex: number) => {
              if (child.type === 'text') {
                if (child.bold) {
                  return <strong key={childIndex}>{child.text}</strong>;
                }
                if (child.italic) {
                  return <em key={childIndex}>{child.text}</em>;
                }
                return <span key={childIndex}>{child.text}</span>;
              }
              return null;
            })}
          </p>
        );
      }

      if (block.type === 'heading') {
        const level = block.level || 2;
        const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;
        const className =
          level === 1
            ? 'text-3xl font-bold mb-4'
            : level === 2
            ? 'text-2xl font-bold mb-3'
            : 'text-xl font-bold mb-2';

        return (
          <HeadingTag key={index} className={className}>
            {block.children.map((child) => child.text).join('')}
          </HeadingTag>
        );
      }

      if (block.type === 'list') {
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClass = block.format === 'ordered' ? 'list-decimal' : 'list-disc';

        return (
          <ListTag key={index} className={`${listClass} ml-6 mb-4`}>
            {block.children.map((item, itemIndex: number) => (
              <li key={itemIndex} className="mb-1">
                {item.children.map((child) => child.text).join('')}
              </li>
            ))}
          </ListTag>
        );
      }

      return null;
    });
  };

  // Fetch recent articles excluding the current one
  try {
    // Fetch all articles
    const [newsletterRes] = await Promise.all([anteClient.getNewsletterContent()]);

    if (!newsletterRes.data || newsletterRes.data.length === 0) {
      console.error('No newsletter data received:', newsletterRes);
      return null;
    }

    const newsletterData = newsletterRes.data;

    const newsletters = newsletterData.map((item: any) => {
      const imageUrl = item.attributes?.backgroundCover?.url
        ? item.attributes.backgroundCover.url
        : item.attributes?.backgroundCover?.variants?.large?.webp?.url
        ? item.attributes.backgroundCover.variants.large.webp.url
        : '/images/LandingPageAssets/NewsLetter-img1.png';

      return {
        id: item.id,
        documentId: item.attributes?.documentId || item.id,
        title: item.attributes?.title || item.attributes?.header || '',
        imageUrl: imageUrl
          ? anteClient.getMediaUrl(imageUrl)
          : '/images/LandingPageAssets/NewsLetter-img1.png',
        readMoreText: item.attributes?.readMoreButton || 'Read More',
        date: item.attributes?.createdAt || item.createdAt,
        contentPreview:
          item.attributes?.subtitle || extractFirstSentence(item.attributes?.content || ''),
      };
    });

    // Filter out the current article and take the first 3
    const recentArticles = newsletters
      .filter((article) => article.documentId !== documentId)
      .slice(0, 3);

    return (
      <div className="w-full">
        {coverImage && (
          <div
            className="relative w-full h-[40vh] md:h-[45vh] lg:h-[50vh] mb-8 overflow-hidden"
            style={{ borderRadius: '60px 60px 0px 0px' }}
          >
            <img
              src={coverImage}
              alt={title}
              className="object-cover"
              style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
          </div>
        )}
        <section className="p-8 md:p-16 lg:px-64">
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-[#FE6568] mb-2 lg:mb-6 w-full lg:w-[65%]">
            {title}
          </h1>
          <p className="text-gray-700 italic mb-6 lg:mb-10">{date}</p>

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-24">
            <div className="prose prose-lg max-w-none text-gray-700 col-span-1 lg:col-span-2">
              {content ? (
                typeof content === 'string' ? (
                  <div
                    className="newsletter-content text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                ) : (
                  renderContent(content)
                )
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
            <div className="col-span-1 ">
              <h2 className="text-2xl font-bold mb-4 lg:mb-12 text-oxford-blue">RECENT ARTICLES</h2>
              <div className="flex flex-col gap-2 ">
                {recentArticles.map((article) => (
                  <div key={article.documentId} className="flex my-2 w-full">
                    <div className="w-full">
                      <NewsletterListItem
                        documentId={String(article.id)}
                        title={article.title}
                        imageUrl={article.imageUrl}
                        date={article.date}
                        contentPreview={article.contentPreview}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error fetching recent articles:', error);
    return null;
  }
}
