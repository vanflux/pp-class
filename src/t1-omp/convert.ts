import { resolve } from "path";
import { dataScenesPath } from "./paths";
import { readFileSync, writeFileSync } from "fs";

const outPath = resolve(dataScenesPath, 'scene-1.txt');
const inputPath = resolve(__dirname, '../input.txt');
const inputJson = readFileSync(inputPath, 'utf8');
const data = JSON.parse(inputJson);
const padding = 100;

let minX = data[0],
  minY = data[1],
  maxX = data[0],
  maxY = data[1];
for (let i = 0; i < data.length; i += 2) {
  const x = data[i];
  const y = data[i + 1];
  if (x < minX) {
    minX = x;
  } else if (x > maxX) {
    maxX = x;
  }
  if (y < minY) {
    minY = y;
  } else if (y > maxY) {
    maxY = y;
  }
}
minX -= padding;
minY -= padding;
maxX += padding;
maxY += padding;
const width = maxX - minX + 1;
const height = maxY - minY + 1;
console.log('Width:', width, 'Height:', height);

const map = new Array(height).fill(undefined).map(() => new Array(width).fill('.'));
for (let i = 0; i < data.length; i += 2) {
  const x = data[i] - minX;
  const y = data[i + 1] - minY;
  map[y][x] = 'X';
}
console.log('Generating content');
const content = `${height} ${width} ${map.map((line) => line.join(' ')).join(' ')}`;

writeFileSync(outPath, content, 'utf8');

console.log('Generated, size:', content.length);
