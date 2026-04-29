import React from 'react';
import RobotHero from './RobotHero';
import RobotBuddy from './RobotBuddy';

type AnimatedCartoonSceneProps = {
  side?: 'left' | 'right';
  className?: string;
};

const AnimatedCartoonScene: React.FC<AnimatedCartoonSceneProps> = ({ side = 'left', className = '' }) => {
  return (
    <div className={`cartoon-side-scene cartoon-side-scene-${side} ${className}`.trim()} aria-hidden="true">
      <div className="cartoon-scene-speedlines" />
      <div className="cartoon-scene-particle p1" />
      <div className="cartoon-scene-particle p2" />
      <div className="cartoon-scene-particle p3" />
      <div className="cartoon-scene-glow" />
      <div className="cartoon-scene-lane" />
      <div className="robot-beam" />
      <RobotBuddy />
      <RobotHero />
    </div>
  );
};

export default AnimatedCartoonScene;
