'use client';

interface CEOMessageProps {
  title?: string;
  message?: string;
  name?: string;
  position?: string;
  picture?: string;
  backgroundImage?: string;
}

export default function CEOMessage({
  title,
  message,
  name,
  position,
  picture,
  backgroundImage,
}: CEOMessageProps) {
  return (
    <section className="ceo-container">
      <div className="head">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
          {title || 'Message from the CEO'}
        </h2>
      </div>

      <div className="container2 flex justify-center">
        <div className="text-white text-base sm:text-lg md:text-xl leading-relaxed mx-auto text-left">
          <div className="space-y-8 max-w-3xl">
            {message &&
              (() => {
                const messageText = message || '';
                // Split by double line breaks first, if not enough paragraphs, split by single line breaks
                let paragraphs = messageText.split('\n\n').filter((p) => p.trim());
                if (paragraphs.length < 2) {
                  paragraphs = messageText.split('\n').filter((p) => p.trim());
                }
                // If still one long paragraph, split by sentences into 4 parts
                if (paragraphs.length === 1) {
                  const sentences = messageText.match(/[^.!?]+[.!?]+/g) || [messageText];
                  const chunkSize = Math.ceil(sentences.length / 4);
                  paragraphs = [];
                  for (let i = 0; i < sentences.length; i += chunkSize) {
                    paragraphs.push(
                      sentences
                        .slice(i, i + chunkSize)
                        .join(' ')
                        .trim()
                    );
                  }
                }
                return paragraphs.slice(0, 7).map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-white sm:text-lg md:text-xl leading-relaxed mx-auto text-left"
                  >
                    {paragraph.trim()}
                  </p>
                ));
              })()}
          </div>

          <div className="jayvee">
            <h3>{name || ''}</h3>
            <p>{position || ''}</p>
          </div>
        </div>

        <div className="ceo-profile">
          {picture ? (
            <img
              src={picture}
              alt={name || 'CEO'}
              className="ceo"
              style={{ width: '200px', height: '200px' }}
            />
          ) : (
            <div className="ceo bg-gray-300" />
          )}
        </div>
      </div>

      <style jsx>{`
        .ceo-container {
          padding: 70px 30px 120px 30px;
          background-image: url('${backgroundImage}');
          background-size: cover;
          background-position: center;
          margin-top: 5rem;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          position: relative;
        }

        .ceo-container::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.9;
        }

        .head {
          text-align: center;
          color: white;
          font-family: 'Noto Sans', sans-serif;
          width: 100%;
          max-width: 1200px;
          padding: 0 1rem 2rem;
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }

        .container2 {
          display: flex;
          flex-direction: row;
          position: relative;
          z-index: 1;
          max-width: 1200px;
        }

        .paragraph {
          color: white;
          font-family: 'Noto Sans', sans-serif;
          text-align: justify;
          font-weight: 500;
          line-height: 1.5;
          max-width: 800px;
          white-space: pre-wrap;
        }

        .paragraph p {
          margin: 0;
        }

        .jayvee {
          display: block;
          margin-top: 1rem;
        }

        .jayvee h3 {
          margin: 0;
          font-size: 2rem;
          font-weight: bold;
          color: white;
        }

        .jayvee p {
          margin: 0;
          font-size: 16px;
          color: white;
        }

        .ceo-profile {
          display: flex;
          margin-left: 34px;
          flex-shrink: 0;
        }

        :global(.ceo) {
          border-top-right-radius: 50%;
          border-top-left-radius: 50%;
          border-bottom-right-radius: 50%;
          width: 300px;
          height: 300px;
          object-fit: cover;
        }

        @media (max-width: 1024px) {
          .head h2 {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .head h2 {
            font-size: 2rem;
          }
        }

        @media (max-width: 480px) {
          .container2 {
            flex-direction: column-reverse;
            justify-content: center;
            align-items: center;
          }

          .paragraph {
            margin-top: 20px;
          }

          :global(.ceo) {
            margin-left: -40px;
          }
        }

        @media (max-width: 480px) {
          .paragraph {
            font-size: 15px;
            max-width: 300px;
            line-height: 1.2;
            text-align: left;
          }

          .ceo-profile {
            margin-left: 0;
            margin-bottom: 20px;
          }

          :global(.ceo) {
            margin-left: 5px;
            width: 250px;
            height: 270px;
          }
        }
      `}</style>
    </section>
  );
}
