
import React, { useRef, useEffect } from 'react';
import { TomeProps } from '../types';

const Tome: React.FC<TomeProps> = ({
  id,
  r = '0deg',
  ry = '0deg',
  top,
  left,
  right,
  bottom,
  width = '180px',
  height = '240px',
  bgColorClass,
  animationDelay = '0s',
  content,
  isOpened = false,
  lines = 0,
}) => {
  const tomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (tomeRef.current) {
        // Get the current computed transform styles
        const currentTransform = getComputedStyle(tomeRef.current).transform;

        // Extract existing rotation/scale from CSS directly if needed, or assume base `r` and `ry`
        // For simplicity, we'll assume `r` and `ry` passed as props are the base rotations
        // and add translation on top.
        
        const xTranslate = (window.innerWidth / 2 - e.pageX) / 100;
        const yTranslate = (window.innerHeight / 2 - e.pageY) / 100;
        const speed = (id + 1) * 0.5;

        // Apply base rotations from CSS variables and then add parallax translation
        tomeRef.current.style.transform = `
          rotate(${r})
          rotateY(${ry})
          ${isOpened ? 'rotateX(10deg)' : ''}
          translateY(${yTranslate * speed}px)
          translateX(${xTranslate * speed}px)
          translateZ(0)
        `;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [id, r, ry, isOpened]);

  const style: React.CSSProperties = {
    top,
    left,
    right,
    bottom,
    width,
    height,
    // Pass CSS variables for animation keyframes
    '--r': r,
    '--ry': ry,
    animationDelay,
  } as React.CSSProperties; // Type assertion for custom CSS variables

  return (
    <div
      ref={tomeRef}
      className={`absolute shadow-deep rounded-md transition-transform duration-500 ease-in-out transform-gpu
                  ${bgColorClass}
                  ${isOpened ? 'flex' : ''}
                  animate-float`}
      style={style}
    >
      {!isOpened ? (
        <>
          <div className="absolute inset-0 rounded-md flex flex-col items-center justify-center text-center p-5 border border-white/20">
            {content?.text && (
              <div className={`font-serif font-bold text-2xl leading-tight mix-blend-overlay opacity-80 ${content?.textColorClass || 'text-black'}`}>
                {content.text.split('<br>').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < content.text!.split('<br>').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            )}
            {content?.icon && (
              <div className="w-10 h-10 mt-4 opacity-60 mix-blend-overlay">
                {content.icon}
              </div>
            )}
          </div>
          <div className={`absolute left-0 top-0 bottom-0 w-5 transform -rotate-y-90 -translate-x-full origin-left ${bgColorClass} brightness-80 rounded-l-md`}></div>
        </>
      ) : (
        <>
          <div className="absolute inset-x-1 inset-y-1 bg-white shadow-inner-lg transform translate-z-[2px]"></div>
          <div className="absolute z-10 top-5 left-5 right-5 bottom-5 transform translate-z-[3px] flex flex-col gap-1.5">
            {Array.from({ length: lines }).map((_, idx) => (
              <div key={idx} className={`h-0.5 bg-gray-200 rounded-sm ${idx % 3 === 0 ? 'w-full' : 'w-3/5'}`}></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Tome;