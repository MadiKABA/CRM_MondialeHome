import "server-only";
import fs from "fs/promises";
import path from "path";
import { buildSafePath } from "./sanitize";

const BASE_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function saveFile(
  relativeDir: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const safePath = buildSafePath(BASE_DIR, relativeDir, filename);
  await ensureDir(path.dirname(safePath));
  await fs.writeFile(safePath, buffer);
  return `/uploads/${relativeDir}/${filename}`;
}

export async function deleteFile(
  relativeDir: string,
  filename: string
): Promise<boolean> {
  try {
    const safePath = buildSafePath(BASE_DIR, relativeDir, filename);
    await fs.unlink(safePath);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

export async function deleteDirectory(relativeDir: string): Promise<boolean> {
  try {
    const safePath = buildSafePath(BASE_DIR, relativeDir);
    await fs.rm(safePath, { recursive: true, force: true });
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

export async function fileExists(
  relativeDir: string,
  filename: string
): Promise<boolean> {
  try {
    const safePath = buildSafePath(BASE_DIR, relativeDir, filename);
    await fs.access(safePath);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(relativeDir: string): Promise<string[]> {
  try {
    const safePath = buildSafePath(BASE_DIR, relativeDir);
    return await fs.readdir(safePath);
  } catch {
    return [];
  }
}
