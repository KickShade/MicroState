import { useEffect, useRef } from "react";

const AnimatedChartBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const charts = [
      { offset: 0, amplitude: 80, speed: 0.02, color: "rgba(16, 185, 129, 0.4)", lineWidth: 2 },
      { offset: 100, amplitude: 60, speed: 0.015, color: "rgba(16, 185, 129, 0.25)", lineWidth: 1.5 },
      { offset: 200, amplitude: 100, speed: 0.025, color: "rgba(6, 182, 212, 0.3)", lineWidth: 1.5 },
      { offset: -50, amplitude: 50, speed: 0.018, color: "rgba(16, 185, 129, 0.15)", lineWidth: 1 },
    ];

    const drawChart = (chart: typeof charts[0], baseY: number) => {
      ctx.beginPath();
      ctx.strokeStyle = chart.color;
      ctx.lineWidth = chart.lineWidth;

      const points: { x: number; y: number }[] = [];

      for (let x = 0; x <= canvas.width; x += 3) {
        const y =
          baseY +
          Math.sin((x + time * 50 * chart.speed + chart.offset) * 0.01) * chart.amplitude +
          Math.sin((x + time * 30 * chart.speed) * 0.02) * (chart.amplitude * 0.5) +
          Math.cos((x + time * 20 * chart.speed) * 0.005) * (chart.amplitude * 0.3);

        points.push({ x, y });
      }

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, baseY - chart.amplitude, 0, canvas.height);
      gradient.addColorStop(0, chart.color);
      gradient.addColorStop(1, "transparent");

      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;

      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    };

    const drawCandlesticks = () => {
      const candleWidth = 8;
      const gap = 30;

      for (let x = gap; x < canvas.width; x += gap) {
        const baseY = canvas.height * 0.5;
        const volatility = Math.sin((x + time * 10) * 0.02) * 50 + 50;
        const open = baseY + Math.sin((x + time * 5) * 0.03) * volatility;
        const close = baseY + Math.cos((x + time * 7) * 0.025) * volatility;
        const high = Math.min(open, close) - Math.random() * 20 - 10;
        const low = Math.max(open, close) + Math.random() * 20 + 10;

        const isGreen = close < open;
        const color = isGreen ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.2)";

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(x, high);
        ctx.lineTo(x, low);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, Math.min(open, close), candleWidth, Math.abs(close - open) || 2);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid();
      drawCandlesticks();

      charts.forEach((chart, index) => {
        const baseY = canvas.height * (0.3 + index * 0.15);
        drawChart(chart, baseY);
      });

      time++;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ 
        background: "linear-gradient(180deg, hsl(222, 84%, 5%) 0%, hsl(222, 60%, 8%) 100%)"
      }}
    />
  );
};

export default AnimatedChartBackground;
