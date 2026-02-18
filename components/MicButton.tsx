import React from 'react';
import { SessionState } from '../types';
import { MicIcon, SoundWaveIcon, StopIcon, LoaderIcon } from './Icons';

interface MicButtonProps {
  sessionState: SessionState;
  onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ sessionState, onClick }) => {
  const getButtonContent = () => {
    switch (sessionState) {
      case SessionState.Idle:
        return <MicIcon className="w-10 h-10" />;
      case SessionState.Listening:
        return <MicIcon className="w-10 h-10" />;
      case SessionState.Speaking:
        return <SoundWaveIcon className="w-10 h-10" />;
      case SessionState.Processing:
        return <LoaderIcon className="w-10 h-10 animate-spin" />;
      default:
        return <StopIcon className="w-10 h-10" />;
    }
  };

  const getButtonClass = () => {
    let baseClass = "relative flex items-center justify-center w-24 h-24 rounded-full text-white shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4";
    
    switch (sessionState) {
        case SessionState.Idle:
            return `${baseClass} bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-300`;
        case SessionState.Listening:
            return `${baseClass} bg-red-500 hover:bg-red-600 focus:ring-red-300`;
        case SessionState.Speaking:
            return `${baseClass} bg-red-500 hover:bg-red-600 focus:ring-red-300`;
        default:
            return `${baseClass} bg-gray-500`;
    }
  };
  
  const isPulsing = sessionState === SessionState.Listening || sessionState === SessionState.Speaking;

  return (
    <button onClick={onClick} className={getButtonClass()}>
      {isPulsing && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
      )}
      <span className="relative z-10">{getButtonContent()}</span>
    </button>
  );
};

export default MicButton;
