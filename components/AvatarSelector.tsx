import React, { useRef } from 'react';
import { AvatarIcon1, AvatarIcon2, AvatarIcon3, UploadIcon } from './Icons';
import UserAvatar from './UserAvatar';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: string) => void;
  currentAvatar: string;
}

const PREDEFINED_AVATARS = ['avatar1', 'avatar2', 'avatar3'];

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ isOpen, onClose, onSelectAvatar, currentAvatar }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelectAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-200">Choose Your Avatar</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {PREDEFINED_AVATARS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => onSelectAvatar(avatar)}
              className={`flex items-center justify-center p-1 rounded-full focus:outline-none transition-all duration-200 ${currentAvatar === avatar ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-400'}`}
            >
              <UserAvatar avatar={avatar} className="w-20 h-20" />
            </button>
          ))}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors duration-200"
        >
          <UploadIcon className="w-6 h-6" />
          Upload Your Own
        </button>
      </div>
    </div>
  );
};

export default AvatarSelector;
