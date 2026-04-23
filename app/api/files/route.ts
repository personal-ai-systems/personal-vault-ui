import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const VAULT_PATH = path.join(process.env.HOME || '', 'personal-vault', 'raw');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let targetPath = VAULT_PATH;
    
    if (year) {
      targetPath = path.join(targetPath, year);
      if (month) {
        targetPath = path.join(targetPath, month);
      }
    }

    // Check if path exists
    try {
      await fs.access(targetPath);
    } catch {
      return NextResponse.json({ 
        files: [], 
        directories: [],
        currentPath: targetPath,
        exists: false 
      });
    }

    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    
    const files = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
      .map(entry => ({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        relativePath: path.relative(VAULT_PATH, path.join(targetPath, entry.name)),
        size: 0, // We'll get this separately
        mtime: 0
      }));

    const directories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        relativePath: path.relative(VAULT_PATH, path.join(targetPath, entry.name))
      }));

    // Get file stats
    for (const file of files) {
      try {
        const stats = await fs.stat(file.path);
        file.size = stats.size;
        file.mtime = stats.mtimeMs;
      } catch (err) {
        console.error(`Error getting stats for ${file.path}:`, err);
      }
    }

    // Sort files by name (date) descending
    files.sort((a, b) => b.name.localeCompare(a.name));
    
    // Sort directories by name (year/month) descending
    directories.sort((a, b) => b.name.localeCompare(a.name));

    return NextResponse.json({ 
      files, 
      directories,
      currentPath: targetPath,
      vaultRoot: VAULT_PATH,
      exists: true
    });
  } catch (error) {
    console.error('Error reading vault:', error);
    return NextResponse.json({ 
      error: 'Failed to read vault directory',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
