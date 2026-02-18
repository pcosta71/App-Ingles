import React from 'react';
import { UserIcon, AvatarIcon1, AvatarIcon2, AvatarIcon3 } from './Icons';

interface UserAvatarProps {
  avatar: string;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar, className }) => {
  if (avatar.startsWith('data:image/')) {
    return <img src={avatar} alt="User Avatar" className={`${className} rounded-full`} />;
  }

  switch (avatar) {
    case 'avatar1':
      return <AvatarIcon1 className={className} />;
    case 'avatar2':
      return <AvatarIcon2 className={className} />;
    case 'avatar3':
      return <AvatarIcon3 className={className} />;
    default:
      return <UserIcon className={className} />;
  }
};

export default UserAvatar;
