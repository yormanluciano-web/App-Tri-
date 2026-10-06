// Genera los PNG de la PWA a partir de los SVG originales (requiere sharp, incluido con Next).
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const icon = await readFile("public/icons/icon.svg");
const maskable = await readFile("public/icons/maskable.svg");
const jobs = [
  [icon, 192, "public/icons/icon-192.png"],
  [icon, 512, "public/icons/icon-512.png"],
  [maskable, 512, "public/icons/maskable-512.png"],
  [maskable, 192, "public/icons/maskable-192.png"],
  // Apple no admite transparencia útil: fondo opaco a sangre.
  [maskable, 180, "public/icons/apple-touch-icon.png"],
  [icon, 32, "public/favicon-32.png"],
];
for (const [src, size, out] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(out);
}
