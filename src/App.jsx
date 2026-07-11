import { useState } from 'react';
import cards from './cardData';
import {getGptAnswer} from './gpt';

import StarsBackground from './components/StarsBackground'

function App() {
  const [card, setCard] = useState(null);
  const [gptResponse, setGptResponse] = useState("");
  const [isTransitioning, setTransitioning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  const drawCard = async() => {
    if(isDrawing) return
    setIsDrawing(true)

    setTransitioning(true);
    setCard(null)
    setGptResponse("");       // 先清空舊字卡，畫面馬上消失

    setTimeout(async() => {
      const randomIndex = Math.floor(Math.random() * cards.length);
      const drawnCard = cards[randomIndex];
      setCard(drawnCard);// 顯示這張牌
  
      const gptReplay = await getGptAnswer(drawnCard.name)
      setGptResponse(gptReplay)

      setTransitioning(false)
      setIsDrawing(false)
    },2000)
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0e0e1f] to-[#1a1a2e] text-white overflow-hidden font-serif">
    {/* 星空背景動畫 */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <StarsBackground />
      </div>

     {/* 主要內容開始 */}
  <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center space-y-6 p-6">

      <h1 className="text-3xl font-bold font-garamond">AI Tarot</h1>
      <p className="mt-2 text-sm text-gray-300 italic tracking-wider">
       Breathe deeply, let the starlight guide your question.</p>
      <div
        onClick={drawCard}
        className="
          cursor-pointer
          bg-gradient-to-br from-blue-950/60 to-blue-900/60
          hover:from-blue-950/80 hover:to-blue-900/80
          hover:brightness-110
          text-yellow-50
          rounded-xl
          px-8 py-6
          shadow-inner shadow-yellow-500/10 hover:shadow-yellow-500/20
          transition duration-500 ease-in-out
          transform hover:scale-105
          tracking-wider
          font-garamond
          space-y-2
          max-w-xs"
       >
         <p className="text-lg animate-pulse drop-shadow-md">✨ Open the Veil ✨</p>
         <p className="text-xs opacity-80 italic drop-shadow-md">Step into the mystery of the unseen</p>
      </div>

      {
        isTransitioning && (
          <p className="text-sm text-gray-300 italic animate-fade-in-out">The Veil is parting...</p>
        )
      }

      {card && (
        <div className="
           w-80 
           bg-white/90
           rounded-2xl 
           shadow-2xl 
           flex flex-col 
           items-center 
           text-center 
           p-6 space-y-4
           backdrop-blur-sm
           transition duration-300 ease-in-out
           hover:shadow-yellow-200/30
           ">
          <img
            src={card.image}
            alt={card.name}
            className="
              max-w-full 
              max-h-96 
              object-contain 
              brightness-110 
              contrast-105 
              rounded"
          />
          <p className="text-gray-800 text-sm leading-relaxed">{card.message}</p>
          
          {/* 這裡是 GPT 回覆 or "..." */}
          {/* GPT 回覆 or "..." */}
          {/* GPT 回覆 or "..." */}
         <div className="space-y-2 text-sm italic leading-relaxed transition duration-300 text-gray-800">
          {gptResponse 
            ? gptResponse.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))
            : <p className="text-blue-950 animate-pulse">Awaiting mystical insights …</p>}
         </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default App;
