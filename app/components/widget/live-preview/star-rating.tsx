import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({ rating, maxRating = 5, size = 12, interactive = false, onRatingChange, className }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.125rem" }} className={className}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || rating) >= starValue;

        return (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 18"
            width={size}
            height={size}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onClick={() => handleClick(starValue)}
            onMouseLeave={handleMouseLeave}
          >
            <path
              fill={isFilled ? "#FFAC70" : "#D5DDE7"}
              d="M8.536.734c.323-.979 1.73-.979 2.053 0l1.517 4.595c.145.437.56.733 1.027.733h4.91c1.046 0 1.48 1.317.635 1.921l-3.973 2.84c-.378.27-.537.75-.392 1.187l1.518 4.595c.323.979-.815 1.792-1.661 1.187l-3.973-2.84c-.378-.27-.89-.27-1.269 0l-3.973 2.84c-.846.605-1.984-.208-1.66-1.187l1.517-4.595a1.052 1.052 0 00-.392-1.187L.447 7.983c-.846-.604-.411-1.92.634-1.92h4.911c.468 0 .882-.297 1.027-.734L8.536.734z"
            ></path>
          </svg>
        );
      })}
    </div>
  );
}
