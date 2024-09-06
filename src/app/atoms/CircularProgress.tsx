import React, { FC } from 'react';

type CircularProgressProps = {
  borderWeight: number;
  circleSize: number;
  circleColor: string;
  progress: number;
  spin: boolean;
};

const CircularProgress: FC<CircularProgressProps> = ({ borderWeight, circleSize, circleColor, progress, spin }) => {
  const circleBackground = 'transparent';
  const transitionLength = '1s';
  const circleStyle = {
    margin: '20px auto',
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    backgroundColor: circleBackground,
    borderRadius: '50%'
  };
  const baseStyle = {
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    position: 'absolute' as 'absolute',
    backfaceVisibility: 'hidden' as 'hidden',
    transition: `transform ${transitionLength}`,
    borderRadius: '50%',
    transform: `rotate(${(180 / 100) * progress}deg)`,
    clip: `rect(0px, ${circleSize}px, ${circleSize}px, ${circleSize / 2}px)`
  };

  const firstSliceStyle = {
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    position: 'absolute' as 'absolute',
    backfaceVisibility: 'hidden' as 'hidden',
    transition: `transform ${transitionLength}`,
    borderRadius: '50%',
    clip: `rect(0px, ${circleSize}px, ${circleSize}px, ${circleSize / 2}px)`
  };

  const secondSliceStyle = {
    ...baseStyle,
    transform: `rotate(${(180 / 100) * progress}deg)`
  };

  const fillStyle = {
    ...baseStyle,
    clip: `rect(0px, ${circleSize / 2}px, ${circleSize}px, 0px)`,
    backgroundColor: 'transparent',
    border: `${borderWeight}px solid ${circleColor}`
  };

  const circleBarStyle = {
    ...baseStyle,
    transform: `rotate(${(180 / 100) * progress * 2}deg)`
  };

  return (
    <div className={`${spin ? 'animate-spin' : ''}`} data-progress={progress} style={circleStyle}>
      <div>
        <div style={firstSliceStyle}>
          <div style={fillStyle}></div>
        </div>
        <div style={secondSliceStyle}>
          <div style={fillStyle}></div>
          <div style={circleBarStyle}></div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
