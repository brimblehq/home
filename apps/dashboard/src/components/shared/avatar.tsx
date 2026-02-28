import { useEffect, useState, type ComponentProps } from "react";

interface AvatarProps extends Omit<ComponentProps<"img">, "onError"> {
  fallbackSeed?: string;
}

function getFallbackUrl(seed: string) {
  return `https://avatar.vercel.sh/${encodeURIComponent(seed)}`;
}

export function Avatar({ src, fallbackSeed = "user", alt = "", ...props }: AvatarProps) {
  const fallback = getFallbackUrl(fallbackSeed);
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
    />
  );
}
