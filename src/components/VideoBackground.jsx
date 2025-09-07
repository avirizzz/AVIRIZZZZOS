import React from 'react';
import bgVideo from '../assets/bg.mp4';
import '../styles/VideoBackground.css';

const VideoBackground = () => {
  return (
    <div className="video-background">
      <video autoPlay muted loop id="bg-video">
        <source src={bgVideo} type="video/mp4" />
      </video>
    </div>
  );
};

export default VideoBackground;