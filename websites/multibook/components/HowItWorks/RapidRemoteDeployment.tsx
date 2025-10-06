import { AnteImage } from '@/lib/strapi';

interface DeploymentStep {
  id: number;
  title: string;
  description: string;
}

interface RapidRemoteDeploymentProps {
  deploymentTitle: string;
  deploymentSubTitle: string;
  beginOperation: string;
  timelineImage?: AnteImage;
  deploymentSteps: DeploymentStep[];
}

export default function RapidRemoteDeployment({
  deploymentTitle,
  deploymentSubTitle,
  beginOperation,
  timelineImage,
  deploymentSteps,
}: RapidRemoteDeploymentProps) {
  return (
    <div className="bg-[#0a1744] text-white px-[clamp(1rem,3vw,5rem)] py-[clamp(2rem,5vw,10rem)] flex flex-col justify-center items-center gap-8">
      <div className="max-w-[min(90%,70rem)] w-full">
        <h2 className="text-center pb-2 md:pb-8 font-bold text-[2.5rem] md:text-[5.5em] max-w-3xl mx-auto leading-[1]">
          {deploymentTitle}
        </h2>
        <p className="text-[#fe6568] text-[21px] font-semibold text-center">{deploymentSubTitle}</p>
      </div>

      <div className="w-full">
        <img
          src={timelineImage?.url || "/images/time-line-for-how-it-works-page.png"}
          alt={timelineImage?.alt || "Timeline for how it works"}
          className="w-full object-cover"
        />
      </div>

      {/* <div className="w-full">
        <div className="flex justify-center items-center w-full min-h-[100px] gap-[clamp(1rem,3vw,30px)] max-lg:flex-col max-lg:gap-4">
          <div className="flex items-stretch w-full h-[clamp(40px,5vw,50px)] relative max-lg:w-[90%] max-lg:max-w-[500px]">
            <div className="bg-[#fe6568] text-[#0a1744] font-bold px-[clamp(0.5rem,2vw,24px)] flex justify-center items-center rounded-tl rounded-bl w-[calc(100%-50px)] text-center">
              <p className="absolute left-1/2 transform -translate-x-1/2 m-0 pl-2 z-10 text-[clamp(0.75rem,1.5vw,18px)] whitespace-nowrap">
                {beginOperation}
              </p>
            </div>
            <div className="w-[clamp(40px,5vw,50px)] h-[clamp(40px,5vw,50px)] bg-[#fe6568] relative flex-shrink-0">
              <div className="absolute top-0 left-full w-0 h-0 border-t-[clamp(20px,2.5vw,25px)] border-t-transparent border-b-[clamp(20px,2.5vw,25px)] border-b-transparent border-l-[clamp(20px,2.5vw,25px)] border-l-[#fe6568]" />
            </div>
          </div>

          <div className="flex items-stretch w-full max-w-[min(250px,90%)] h-[clamp(40px,5vw,50px)] relative max-lg:hidden">
            <div className="absolute top-0 right-[calc(100%-25px)] w-0 h-0 border-t-[clamp(20px,2.5vw,25px)] border-t-transparent border-b-[clamp(20px,2.5vw,25px)] border-b-transparent border-l-[clamp(20px,2.5vw,25px)] border-l-[#0a1744]" />
            <div className="w-[calc(100%-50px)] bg-[#fe6568] rounded-tl rounded-bl" />
            <div className="w-[clamp(40px,5vw,50px)] h-[clamp(40px,5vw,50px)] bg-[#fe6568] relative flex-shrink-0">
              <div className="absolute top-0 left-full w-0 h-0 border-t-[clamp(20px,2.5vw,25px)] border-t-transparent border-b-[clamp(20px,2.5vw,25px)] border-b-transparent border-l-[clamp(20px,2.5vw,25px)] border-l-[#fe6568]" />
            </div>
            <div className="w-[clamp(40px,5vw,50px)] h-[clamp(40px,5vw,50px)] bg-[#0a1744] relative -right-[80%] flex-shrink-0">
              <div className="absolute top-0 left-full w-0 h-0 border-t-[clamp(20px,2.5vw,25px)] border-t-transparent border-b-[clamp(20px,2.5vw,25px)] border-b-transparent border-l-[clamp(20px,2.5vw,25px)] border-l-[#0a1744]" />
            </div>
          </div>
        </div>
      </div> */}
      {/*
      <div className="flex flex-nowrap justify-center gap-[clamp(1rem,2vw,20px)] w-full px-[clamp(1rem,2vw,2rem)] max-lg:flex-wrap">
        {deploymentSteps.map((step) => (
          <div
            key={step.id}
            className="border-2 border-white rounded-[30px] p-[clamp(1rem,2vw,20px)] flex-1 flex-shrink flex-grow basis-[min(300px,100%)] bg-transparent text-white transition-transform duration-300 hover:-translate-y-[5px] max-lg:flex-auto max-lg:max-w-[400px]"
          >
            <div className="flex flex-col items-center h-full">
              <div className="flex-shrink-0 min-h-[clamp(60px,8vw,80px)] flex flex-col justify-center mb-[clamp(0.75rem,1.5vw,15px)] w-full">
                <h5 className="text-center text-[clamp(1rem,2vw,18px)] m-0 text-[#eef066] relative after:content-[''] after:block after:w-full after:h-[2px] after:bg-white after:mx-auto after:mt-[clamp(0.5rem,1vw,8px)] after:rounded-[2px]">
                  {step.title}
                </h5>
              </div>
              <div className="flex-grow flex items-start">
                <p className="m-0 text-[clamp(0.875rem,1.5vw,18px)] text-left leading-[1.5]">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}
