import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "./ui/utils";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

// A person's picture in a circle; the initials show when there is no picture.
export function ContactAvatar({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  return (
    <Avatar className={cn("size-10", className)}>
      {photo && <AvatarImage src={photo} alt="" />}
      <AvatarFallback className="bg-purple-100 text-xs font-medium text-purple-800" aria-hidden>
        {initials(name) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

// Reads a picture file into a 160 px square (cropped from the middle) as a small JPEG data URL,
// so it stays light in localStorage.
export const readPhoto = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Choose an image file"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not read the image"));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    img.src = url;
  });
