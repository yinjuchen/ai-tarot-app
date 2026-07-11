// src/StarsBackground.jsx
import { useEffect, useRef } from "react";

export default function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.3 + 0.1, // 改變星星細度
      dx: 0,
      dy: 0,
      opacity: Math.random()* 0.8 + 0.8, // 星星閃爍的起始透明度
      dOpacity: (Math.random() - 0.5) * 0.005, // 閃爍速度
    }))      

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        // 更新透明度
        star.opacity += star.dOpacity;
        if (star.opacity <= 0.1 || star.opacity >= 0.9) {
          star.dOpacity = -star.dOpacity; // 反轉閃爍
        }
    
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fill();
    
        // 更新位置
        star.x += star.dx;
        star.y += star.dy;
    
        if (star.x > canvas.width) star.x = 0;
        if (star.y > canvas.height) star.y = 0;
        if (star.x < 0) star.x = canvas.width;
        if (star.y < 0) star.y = canvas.height;
      });
    }


    function animate() {
      draw();
      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
