import { NextResponse } from 'next/server';
import fsp from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const VAULT_ROOT = path.join(process.env.HOME || '', 'personal-vault');

interface ResumeResponse {
  headline: string;
  currentState: Array<{ label: string; status: string }>;
  recommendedAction: {
    title: string;
    why: string;
    agent: string;
    action: string;
  };
  stillMatters: Array<{ title: string; path: string; reason: string }>;
  recentChanges: Array<{
    relativePath: string;
    name: string;
    mtime: number;
    title: string;
    category: string;
  }>;
  updatedAt: string;
}

export async function GET() {
  try {
    // Read the 5 most recently modified files from /api/recent endpoint logic
    // (inline to avoid import complications)
    const everyMdFile: Array<{
      relativePath: string;
      name: string;
      mtime: number;
      title: string;
      category: string;
    }> = [];

    async function collectFiles(dir: string, baseDepth = 0) {
      const excluded = new Set(['config', 'exports', '.git']);
      let entries: any;
      try {
        entries = await fsp.readdir(dir, { withFileTypes: true }) as any;
      } catch {
        return;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!excluded.has(entry.name)) {
            await collectFiles(fullPath, baseDepth + 1);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const stats = await fsp.stat(fullPath);
            const content = await fsp.readFile(fullPath, 'utf-8');
            const { data } = matter(content);
            const relativePath = path.relative(VAULT_ROOT, fullPath);
            const title =
              (data as any)?.title ||
              entry.name
                .replace(/\.md$/, '')
                .replace(/^\d{4}-\d{2}-\d{2}-/, '')
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());

            const category = relativePath.startsWith('raw/')
              ? 'raw'
              : relativePath.startsWith('structured/projects/')
                ? 'project'
                : relativePath.startsWith('structured/decisions/')
                  ? 'decision'
                  : relativePath.startsWith('structured/facts/')
                    ? 'fact'
                    : relativePath.startsWith('structured/summaries/')
                      ? 'summary'
                      : relativePath.startsWith('indexes/')
                        ? 'index'
                        : 'other';

            everyMdFile.push({
              relativePath,
              name: entry.name,
              mtime: stats.mtimeMs,
              title,
              category
            });
          } catch {
            // skip unreadable files
          }
        }
      }
    }

    await collectFiles(VAULT_ROOT);
    everyMdFile.sort((a, b) => b.mtime - a.mtime);
    const topRecent = everyMdFile.slice(0, 5);

    // Scan structured dirs for Still Matters (importance >= 7, status === 'active')
    const stillMatters: Array<{ title: string; path: string; reason: string }> = [];
    const structuredDirs = ['projects', 'decisions', 'facts'];

    for (const dir of structuredDirs) {
      const dirPath = path.join(VAULT_ROOT, 'structured', dir);
      try {
        const entries = await fsp.readdir(dirPath);
        for (const entry of entries.sort().reverse().slice(0, 5)) {
          if (!entry.endsWith('.md')) continue;
          const fullPath = path.join(dirPath, entry);
          const content = await fsp.readFile(fullPath, 'utf-8');
          const { data } = matter(content);
          const imp = (data as any)?.importance ?? 5;
          if (imp >= 7 && (data as any)?.status === 'active') {
            const reason = (data as any)?.description
              ? (data as any).description.substring(0, 100)
              : `Active project with ${imp}/10 priority.`;
            stillMatters.push({
              title: (data as any)?.title || entry.replace('.md', ''),
              path: `structured/${dir}/${entry}`,
              reason
            });
          }
        }
      } catch {
        // skip
      }
    }

    const topStill = stillMatters.slice(0, 3);

    const response: ResumeResponse = {
      headline: "What are we doing next?",
      currentState: [
        {
          label: "Personal Vault UI",
          status: "Resume Me MVP is live, but currently too document-like."
        },
        {
          label: "Moltis",
          status: "Backend and Playwright MCP are available for agent/browser validation."
        },
        {
          label: "Next milestone",
          status: "Turn Resume Me into a structured executive brief before adding Context Builder."
        }
      ],
      recommendedAction: {
        title: "Turn Resume Me into an executive brief",
        why: "The current screen dumps strategy notes instead of deciding the next useful action.",
        agent: "Personal Vault Coder / DeepSeek Coder",
        action: "Refactor ResumeMe view and API into structured cards."
      },
      stillMatters: topStill,
      recentChanges: topRecent,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Resume API error:', error);
    return NextResponse.json({
      headline: "What are we doing next?",
      currentState: [
        { label: "Vault status", status: "Could not read persisted state. Defaulting to safe resume." }
      ],
      recommendedAction: {
        title: "Review vault file structure",
        why: "The resume endpoint encountered an error and fell back to defaults.",
        agent: "Personal Vault Coder",
        action: "Check file permissions and retry."
      },
      stillMatters: [],
      recentChanges: [],
      updatedAt: new Date().toISOString()
    } as ResumeResponse);
  }
}
