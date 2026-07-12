import { useState } from 'react';
import { drawThreeCards } from './cardData';
import { POSITIONS } from './spread';
import {getGptSpreadAnswer} from './gpt';

import StarsBackground from './components/StarsBackground'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [gptResponse, setGptResponse] = useState("");
  const [persona, setPersona] = useState("");
  const [isTransitioning, setTransitioning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  const drawSpread = async() => {
    if(isDrawing) return
    setIsDrawing(true)

    setTransitioning(true);
    setSpread(null)
    setRevealedCount(0)
    setGptResponse("");       // 先清空舊字卡，畫面馬上消失
    setPersona("")

    await sleep(1500) // "The Veil is parting..." 的停頓

    const drawnCards = drawThreeCards();
    setSpread(drawnCards) // 牌已經決定，但先不整批顯示
    setTransitioning(false)

    // 一張一張翻，營造儀式感
    for (let i = 1; i <= drawnCards.length; i++) {
      setRevealedCount(i)
      await sleep(650)
    }

    const { message, persona: personaName } = await getGptSpreadAnswer(drawnCards, question)
    setGptResponse(message)
    setPersona(personaName)

    setIsDrawing(false)
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

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={isDrawing}
        maxLength={100}
        placeholder="What's on your mind today? (optional)"
        className="
          w-full max-w-xs
          bg-white/10
          border border-white/20
          focus:border-yellow-200/60
          rounded-lg
          px-4 py-2
          text-sm text-yellow-50
          placeholder-gray-400
          italic
          text-center
          outline-none
          transition
          disabled:opacity-50"
      />

      <div
        onClick={drawSpread}
        className={`
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
          max-w-xs
          ${isDrawing ? "opacity-60 pointer-events-none" : ""}`}
       >
         <p className="text-lg animate-pulse drop-shadow-md">✨ Open the Veil ✨</p>
         <p className="text-xs opacity-80 italic drop-shadow-md">Step into the mystery of the unseen</p>
      </div>

      {
        isTransitioning && (
          <p className="text-sm text-gray-300 italic animate-fade-in-out">The Veil is parting...</p>
        )
      }

      {spread && revealedCount > 0 && (
        <div className="w-full max-w-4xl flex flex-col items-center space-y-6">
          {/* 三張牌依序翻出 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            {spread.slice(0, revealedCount).map((c, i) => (
              <div key={i} className="
                animate-card-in
                bg-white/90
                rounded-2xl
                shadow-2xl
                flex flex-col
                items-center
                text-center
                p-4 space-y-2
                backdrop-blur-sm
                w-full sm:w-56
                transition duration-300 ease-in-out
                hover:shadow-yellow-200/30
                ">
                <p className="text-xs uppercase tracking-widest text-blue-900/70">
                  {POSITIONS[i].en}{c.reversed ? " · Reversed" : ""}
                </p>
                <img
                  src={c.image}
                  alt={c.name}
                  className={`
                    max-w-full
                    max-h-56
                    object-contain
                    brightness-110
                    contrast-105
                    rounded
                    transition-transform duration-500
                    ${c.reversed ? "rotate-180" : ""}`}
                />
                <p className="text-gray-800 text-sm font-semibold">{c.name}</p>
                <p className="text-gray-600 text-xs italic leading-relaxed">{c.message}</p>
              </div>
            ))}
          </div>

          {/* GPT 整合解讀，等三張牌都翻完才出現 */}
          {revealedCount === spread.length && (
            <div className="
              w-full max-w-2xl
              bg-white/90
              rounded-2xl
              shadow-2xl
              p-6 space-y-2
              backdrop-blur-sm
              transition duration-300 ease-in-out
              ">
              {persona && gptResponse && (
                <p className="text-xs uppercase tracking-widest text-blue-900/50 italic">
                  — {persona} —
                </p>
              )}
              <div className="space-y-2 text-sm italic leading-relaxed text-gray-800">
                {gptResponse
                  ? gptResponse.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))
                  : <p className="text-blue-950 animate-pulse">Awaiting mystical insights …</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
}

export default App;
