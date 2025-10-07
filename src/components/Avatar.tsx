import React from 'react';

type AvatarProps = {
  src: string;
  alt?: string;
  size?: number;
};

export default function Avatar({ src, alt = 'User Avatar', size = 64 }: AvatarProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="rounded-full border-2 border-yellow-400 shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}
