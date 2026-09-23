import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, src, alt = "", ...props }, ref) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      ref={ref}
      className={cn(
        "h-9 w-9 rounded-full object-cover ring-2 ring-border",
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

export { Avatar };
