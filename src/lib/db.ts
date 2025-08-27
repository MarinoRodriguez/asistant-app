import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function readJSON<T>(file: string): T {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    return JSON.parse('[]');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJSON<T>(file: string, data: T) {
  const filePath = path.join(dataDir, file);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export { readJSON, writeJSON };
