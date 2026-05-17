import Image from "next/image";

type Props = {
  className?: string;
  size?: number;
};

export function StudlikeLogo({ className = "", size = 40 }: Props) {
  return (
    <Image
      src="/studlike-logo.png"
      width={size}
      height={size}
      alt="Studlike"
      priority={size >= 44}
      className={`object-cover ${className}`}
    />
  );
}
