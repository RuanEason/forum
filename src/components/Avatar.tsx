interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-xl',
  xl: 'h-32 w-32 text-3xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const finalSizeClass = sizeClasses[size];
  const displayName = name || '?';
  const firstChar = displayName.charAt(0).toUpperCase();

  // Generate a consistent background color based on the name
  const colors = [
    'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-gray-500'
  ];
  const colorIndex = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  if (src) {
    return (
      // Avatar URLs may come from external OAuth providers as well as our CDN.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={`rounded-full object-cover ${finalSizeClass} ${className}`}
        src={src}
        alt={displayName}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${bgColor} ${finalSizeClass} ${className}`}
    >
      {firstChar}
    </div>
  );
}
