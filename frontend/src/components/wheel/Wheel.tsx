import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { api } from '../../api/config';
import { useTheme } from '../../context/ThemeContext';

interface Product {
  productId: number;
  name: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get(`${api.baseURL}${api.endpoints.products}`);
  return data;
};

// Geometry helpers. Angles are measured in degrees, clockwise from the top
// (12 o'clock), so segment 0 begins at the pointer.
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 4;
const LABEL_RADIUS = RADIUS * 0.62;

// Point on the wheel for an angle measured clockwise from the top.
const pointAt = (angle: number, radius: number) => {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
};

const segmentPath = (start: number, end: number) => {
  const p1 = pointAt(start, RADIUS);
  const p2 = pointAt(end, RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
};

const truncate = (name: string, max = 16) =>
  name.length > max ? `${name.slice(0, max - 1)}…` : name;

export default function Wheel() {
  const { darkMode } = useTheme();
  const { data: products, isLoading, error } = useQuery('products', fetchProducts);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const pendingWinner = useRef<string | null>(null);

  const names = useMemo(
    () => (products ?? []).map((p) => p.name).filter((n) => n && n.trim().length > 0),
    [products],
  );

  const segments = useMemo(() => {
    const count = names.length;
    if (count === 0) {
      return [] as Array<{ name: string; start: number; end: number; mid: number; color: string }>;
    }
    const segAngle = 360 / count;
    return names.map((name, i) => {
      const start = i * segAngle;
      const end = start + segAngle;
      return {
        name,
        start,
        end,
        mid: start + segAngle / 2,
        color: `hsl(${Math.round((i * 360) / count)}, 65%, ${darkMode ? 45 : 55}%)`,
      };
    });
  }, [names, darkMode]);

  const handleSpin = () => {
    if (spinning || segments.length === 0) {
      return;
    }
    const count = segments.length;
    const segAngle = 360 / count;

    // Uniform random winner.
    const winnerIndex = Math.floor(Math.random() * count);
    pendingWinner.current = segments[winnerIndex].name;

    // Rotation (clockwise) needed so the winner's centre aligns with the top
    // pointer, plus several extra full turns for a satisfying spin.
    const targetCenter = winnerIndex * segAngle + segAngle / 2;
    const base = ((-targetCenter) % 360 + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = base - currentMod;
    if (delta < 0) {
      delta += 360;
    }
    const extraTurns = 5;

    setWinner(null);
    setSpinning(true);
    setRotation(rotation + delta + extraTurns * 360);
  };

  const handleTransitionEnd = () => {
    if (!spinning) {
      return;
    }
    setSpinning(false);
    setWinner(pendingWinner.current);
  };

  const containerClasses = `min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`;
  const headingClasses = `text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`;

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="max-w-3xl mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className="max-w-3xl mx-auto text-red-500 text-center">Failed to load names</div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="max-w-3xl mx-auto flex flex-col items-center space-y-8">
        <h1 className={headingClasses}>Wheel of Names</h1>

        {segments.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center text-center py-20 px-8 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border`}
            role="status"
            aria-live="polite"
          >
            <p className={`${darkMode ? 'text-light' : 'text-gray-800'} text-lg font-medium`}>
              No names to spin yet
            </p>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Bulk-load some inventory first, then come back to spin the wheel.
            </p>
          </div>
        ) : (
          <>
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
              {/* Pointer at the top */}
              <div
                className="absolute left-1/2 -top-1 -translate-x-1/2 z-10"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '14px solid transparent',
                  borderRight: '14px solid transparent',
                  borderTop: '24px solid #76B852',
                }}
                aria-hidden="true"
              />
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={`Wheel with ${segments.length} names`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                    : 'none',
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {segments.map((seg) => {
                  const labelPoint = pointAt(seg.mid, LABEL_RADIUS);
                  return (
                    <g key={`${seg.name}-${seg.start}`}>
                      <path
                        d={segmentPath(seg.start, seg.end)}
                        fill={seg.color}
                        stroke={darkMode ? '#0A0A0A' : '#FFFFFF'}
                        strokeWidth={1}
                      />
                      <text
                        x={labelPoint.x}
                        y={labelPoint.y}
                        fill="#FFFFFF"
                        fontSize={segments.length > 18 ? 9 : 12}
                        fontWeight={600}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${seg.mid - 90} ${labelPoint.x} ${labelPoint.y})`}
                      >
                        {truncate(seg.name)}
                      </text>
                    </g>
                  );
                })}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  fill="none"
                  stroke={darkMode ? '#0A0A0A' : '#FFFFFF'}
                  strokeWidth={2}
                />
                <circle cx={CENTER} cy={CENTER} r={16} fill={darkMode ? '#F5F5F5' : '#0A0A0A'} />
              </svg>
            </div>

            <button
              onClick={handleSpin}
              disabled={spinning}
              className={`px-8 py-3 rounded-lg text-white font-semibold transition-colors ${spinning ? 'bg-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-accent'}`}
            >
              {spinning ? 'Spinning…' : winner ? 'Spin Again' : 'Spin'}
            </button>

            <div aria-live="assertive" className="min-h-[3rem] text-center">
              {winner && (
                <div
                  className={`px-6 py-3 rounded-lg font-bold text-xl ${darkMode ? 'bg-gray-800 text-light' : 'bg-white text-gray-800'} shadow-md border border-primary`}
                >
                  🎉 Winner: <span className="text-primary">{winner}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
