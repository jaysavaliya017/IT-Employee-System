import React from 'react';

type RobotHeroProps = {
  className?: string;
};

const RobotHero: React.FC<RobotHeroProps> = ({ className = '' }) => {
  return (
    <div className={`robot-hero ${className}`.trim()}>
      <div className="robot-hero-antenna" />
      <div className="robot-hero-head">
        <div className="robot-hero-eye left" />
        <div className="robot-hero-eye right" />
        <div className="robot-hero-mouth" />
      </div>
      <div className="robot-hero-neck" />
      <div className="robot-hero-body">
        <div className="robot-hero-screen" />
        <div className="robot-hero-button b1" />
        <div className="robot-hero-button b2" />
      </div>
      <div className="robot-hero-arm left" />
      <div className="robot-hero-arm right" />
      <div className="robot-hero-hand left" />
      <div className="robot-hero-hand right" />
      <div className="robot-hero-touch-spark" />
      <div className="robot-hero-leg left" />
      <div className="robot-hero-leg right" />
      <div className="robot-hero-shadow" />
    </div>
  );
};

export default RobotHero;