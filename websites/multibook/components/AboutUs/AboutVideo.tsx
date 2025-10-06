'use client';
import { useEffect, useState } from 'react';

interface AboutVideoProps {
  title?: string;
  backgroundImage?: string;
  videoLink?: string;
}

export default function AboutVideo({ title, backgroundImage, videoLink }: AboutVideoProps) {
  const [isValidVideo, setIsValidVideo] = useState(false);

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : '';
  };

  const videoId = videoLink ? getYouTubeId(videoLink) : null;

  // Validate the video using YouTube Data API
  useEffect(() => {
    if (!videoId) {
      setIsValidVideo(false);
      return;
    }

    // Replace with your own API key
    const apiKey = process.env.NEXT_PUBLIC_YT_API_KEY;

    fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0 && data.items[0].status.embeddable) {
          setIsValidVideo(true);
        } else {
          setIsValidVideo(false);
        }
      })
      .catch(() => setIsValidVideo(false));
  }, [videoId]);
  return (
    <div
      className="container-video h-[40vh] md:h-[45vh] lg:h-[50vh]"
      style={{
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : 'url(/images/multibook%20How%20it%20works%20assets-03B-01.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <p className="title text-[2.5em] md:text-[70px] font-bold text-white">{title}</p>
      {isValidVideo && (
        <div className="video-container">
          <iframe
            className="video"
            src={`https://www.youtube.com/embed/${videoId}?si=s3PDElIIkt3e_nF8`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <style jsx>{`
        .container-video {
          margin-top: -60px;
          padding: 3rem 1rem 4rem;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          border-top-left-radius: 60px;
          border-top-right-radius: 60px;
          position: relative;
          max-width: 100%;
          overflow: hidden;
        }

        .title {
          text-align: center;
          font-family: 'Noto Sans', sans-serif;
          width: 100%;
          line-height: 1.2;
        }

        .video-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0;
        }

        .video {
          width: 100%;
          max-height: 85vh;
          aspect-ratio: 16/9;
          background-color: #0f2353;
          border-radius: 0;
          box-shadow: none;
          transition: all 0.3s ease;
        }

        @media (min-width: 1024px) {
          .container-video {
            padding-left: 0;
            padding-right: 0;
          }
        }

        @media (max-width: 1023px) {
          .container-video {
            padding: 2.5rem 1rem 3.5rem;
            border-top-left-radius: 50px;
            border-top-right-radius: 50px;
          }

          .video {
            border-radius: 12px;
            max-width: 1400px;
            margin: 0 auto;
          }

          .video-container {
            padding: 0 1rem;
            max-width: 1800px;
            margin: 0 auto;
          }
        }

        @media (max-width: 768px) {
          .container-video {
            padding: 2rem 0.75rem 3rem;
            border-top-left-radius: 40px;
            border-top-right-radius: 40px;
          }

          .video {
            border-radius: 8px 8px 0 0;
          }
        }

        @media (max-width: 480px) {
          .container-video {
            padding: 1.5rem 0.5rem 2.5rem;
            border-top-left-radius: 30px;
            border-top-right-radius: 30px;
          }

          .video-container {
            padding: 0;
          }

          .video {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}
