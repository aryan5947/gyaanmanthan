import React from 'react';

type BioProps = {
  name: string;
  tagline?: string;
  description?: string;
};

export default function Bio({ name, tagline, description }: BioProps) {
  return (
    <div className="bio text-gray-800">
      <h2 className="text-xl font-bold text-blue-700">{name}</h2>
      {tagline && <p className="text-sm text-yellow-600 italic">{tagline}</p>}
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  );
}
