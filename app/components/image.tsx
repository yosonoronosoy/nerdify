import { useEffect, useState } from "react";

type ImageProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
> & {
  fallbackSrc?: string;
};

export function Image({
  fallbackSrc = "https://via.placeholder.com/158",
  src,
  ...props
}: ImageProps) {
  const [imgSource, setImgSource] = useState(src);

  return (
    <img
      src={imgSource}
      alt={props.alt}
      onError={() => {
        setImgSource(fallbackSrc);
      }}
      {...props}
    />
  );
}
