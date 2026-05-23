import { NextResponse } from 'next/server';
import fsp from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const VAULT_ROOT = path.join(process.env.HOME || '', 'personal-vault');

interface HorizonBlock {
  title: string;
  body: string;
  items: string[];
}

interface ActivityBlock {
  title: string;
  body: string;
  filesChanged: number;
  highlights: string[];
}

interface ResumeResponse {
  headline: string;
  currentState: Array<{ label: string; status: string }>;
  recommendedAction: { title: string; why: string; agent: string; action: string };
  stillMatters: Array<{ title: string; path: string; reason: string }>;
  recentChanges: Array<{ relativePath: string; name: string; mtime: number; title: string; category: string }>;
  horizons: { year: HorizonBlock; month: HorizonBlock; week: HorizonBlock; today: HorizonBlock };
  activitySummary: { today: ActivityBlock; week: ActivityBlock };
  updatedAt: string;
}

function getCategoryForPath(relativePath: string): string {
  if (relativePath.startsWith('raw/')) return 'raw';
  if (relativePath.startsWith('structured/projects/')) return 'project';
  if (relativePath.startsWith('structured/decisions/')) return 'decision';
  if (relativePath.startsWith('structured/facts/')) return 'fact';
  if (relativePath.startsWith('structured/summaries/')) return 'summary';
  if (relativePath.startsWith('indexes/')) return 'index';
  return 'other';
}

function getLocalMidnightMs(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return midnight.getTime();
}

function get7DaysAgoMs(): number {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

async function collectAllFiles() {
  const excluded = new Set(['config', 'exports', '.git']);
  const allFiles: Array<{
    relativePath: string;
    name: string;
    mtime: number;
    title: string;
    category: string;
  }> = [];

  async function walk(dir: string) {
    let entries: any;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true }) as any;
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) await walk(fullPath);
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
          allFiles.push({
            relativePath,
            name: entry.name,
            mtime: stats.mtimeMs,
            title,
            category: getCategoryForPath(relativePath),
          });
        } catch {
          // skip
        }
      }
    }
  }

  await walk(VAULT_ROOT);
  allFiles.sort((a, b) => b.mtime - a.mtime);
  return allFiles;
}

async function collectStillMatters() {
  const items: Array<{ title: string; path: string; reason: string }> = [];
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
          items.push({
            title: (data as any)?.title || entry.replace('.md', ''),
            path: `structured/${dir}/${entry}`,
            reason,
          });
        }
      }
    } catch {
      // skip
    }
  }
  return items.slice(0, 3);
}

function buildActivitySummary(
  files: Array<{ relativePath: string; mtime: number; title: string; category: string }>,
  sinceMs: number,
  label: string
): ActivityBlock {
  const relevant = files.filter((f) => f.mtime >= sinceMs);
  const catCounts = new Map<string, number>();
  for (const f of relevant) {
    catCounts.set(f.category, (catCounts.get(f.category) || 0) + 1);
  }

  const catLabels: Record<string, string> = {
    raw: 'raw logs',
    project: 'project notes',
    decision: 'decisions',
    fact: 'facts',
    summary: 'summaries',
    index: 'indexes',
    other: 'other',
  };
  const catSummary = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `${count} ${catLabels[cat] || cat}`)
    .join(', ');

  const highlights = relevant.slice(0, 5).map((f) => f.title);
  const filesChanged = relevant.length;
  const title = `${label}`;
  const body =
    filesChanged === 0
      ? `No files changed ${label.toLowerCase()}.`
      : `${filesChanged} file${filesChanged !== 1 ? 's' : ''} modified (${catSummary}).`;

  return { title, body, filesChanged, highlights };
}

export async function GET() {
  try {
    const allFiles = await collectAllFiles();
    const topRecent = allFiles.slice(0, 5);
    const topStill = await collectStillMatters();

    const midnightMs = getLocalMidnightMs();
    const weekAgoMs = get7DaysAgoMs();

    const todaySummary = buildActivitySummary(allFiles, midnightMs, 'Today');
    const weekSummary = buildActivitySummary(allFiles, weekAgoMs, 'This week');

    const response: ResumeResponse = {
      headline: 'What are we doing next?',
      currentState: [
        { label: 'Personal Vault UI', status: 'Resume Me MVP is live, but currently too document-like.' },
        { label: 'Moltis', status: 'Backend and Playwright MCP are available for agent/browser validation.' },
        { label: 'Next milestone', status: 'Turn Resume Me into a structured executive brief before adding Context Builder.' },
      ],
      recommendedAction: {
        title: 'Turn Resume Me into an executive brief',
        why: 'The current screen dumps strategy notes instead of deciding the next useful action.',
        agent: 'Personal Vault Coder / DeepSeek Coder',
        action: 'Refactor ResumeMe view and API into structured cards.',
      },
      stillMatters: topStill,
      recentChanges: topRecent,
      horizons: {
        year: {
          title: 'Year direction',
          body: 'Build a personal execution and memory system that helps Kirill resume direction across AI tools, projects, and low-energy days.',
          items: [
            'Planner/product MVP — make the vault actionable daily',
            'Personal execution system — reduce cognitive overhead',
            'Focus and cognitive overload reduction — smaller surfaces, less noise',
            'Alcohol control guardrails — automated check-ins',
            'Health and energy baseline — track and trend',
            'AI orchestration and business POC — surface agent decisions',
          ],
        },
        month: {
          title: 'Month focus',
          body: 'Make Personal Vault usable as the daily surface, not just a markdown archive.',
          items: [
            'Stabilise Resume Me as the default landing view',
            'Add Recent Summary with human-readable activity explanations',
            'Prepare Context Builder entry point from Resume Me',
            'Let the vault answer "what happened" without reading raw files',
          ],
        },
        week: {
          title: 'Week vector',
          body: 'Stabilise Resume Me, Recent Changes, and Context Builder foundations.',
          items: [
            'Resume Me: time horizons and activity summaries are live',
            'Recent Changes: file list is working, human summary layer added',
            'Context Builder: plan entry point and wire to vault content',
            'Test with real use: daily check-ins using the vault',
          ],
        },
        today: {
          title: 'Today vector',
          body: 'Understand what changed and choose the next small implementation step.',
          items: [
            'Review today\'s file changes in Recent Summary',
            'Choose a direction: refine UI, add a panel, or fix a gap',
            'Keep the session small and deterministic — one feature pass at a time',
          ],
        },
      },
      activitySummary: {
        today: todaySummary,
        week: weekSummary,
      },
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resume API error:', error);
    return NextResponse.json({
      headline: 'What are we doing next?',
      currentState: [{ label: 'Vault status', status: 'Could not read persisted state.' }],
      recommendedAction: {
        title: 'Review vault file structure',
        why: 'The resume endpoint encountered an error and fell back to defaults.',
        agent: 'Personal Vault Coder',
        action: 'Check file permissions and retry.',
      },
      stillMatters: [],
      recentChanges: [],
      horizons: {
        year: { title: 'Year', body: 'Data unavailable.', items: [] },
        month: { title: 'Month', body: 'Data unavailable.', items: [] },
        week: { title: 'Week', body: 'Data unavailable.', items: [] },
        today: { title: 'Today', body: 'Data unavailable.', items: [] },
      },
      activitySummary: {
        today: { title: 'Today', body: 'No data.', filesChanged: 0, highlights: [] },
        week: { title: 'Week', body: 'No data.', filesChanged: 0, highlights: [] },
      },
      updatedAt: new Date().toISOString(),
    } as ResumeResponse);
  }
}
