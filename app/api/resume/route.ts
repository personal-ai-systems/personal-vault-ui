import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const VAULT_ROOT = path.join(process.env.HOME || '', 'personal-vault');

export async function GET() {
  try {
    const decisionPath = path.join(VAULT_ROOT, 'structured', 'decisions', '2026-05-23-resume-me-executive-mode.md');

    let decisionContent: string | null = null;
    let decisionFrontmatter: Record<string, unknown> | null = null;

    try {
      const raw = await fs.readFile(decisionPath, 'utf-8');
      const parsed = matter(raw);
      decisionContent = parsed.content;
      decisionFrontmatter = parsed.data as Record<string, unknown>;
    } catch {
      // fallback below
    }

    // Scan for recent project/decision files for "Still Matters" signals
    const recentProjects: Array<{ title: string; path: string; reason: string }> = [];
    const structuredDirs = ['projects', 'decisions', 'facts'];

    for (const dir of structuredDirs) {
      const dirPath = path.join(VAULT_ROOT, 'structured', dir);
      try {
        const entries = await fs.readdir(dirPath);
        for (const entry of entries.sort().reverse().slice(0, 5)) {
          if (!entry.endsWith('.md')) continue;
          const fullPath = path.join(dirPath, entry);
          const content = await fs.readFile(fullPath, 'utf-8');
          const { data } = matter(content);
          const imp = (data as any)?.importance ?? 5;
          if (imp >= 7 && (data as any)?.status === 'active') {
            recentProjects.push({
              title: (data as any)?.title || entry.replace('.md', ''),
              path: `structured/${dir}/${entry}`,
              reason: `Planned as active (importance: ${imp})`
            });
          }
        }
      } catch {
        // skip
      }
    }

    // Fallback copy for the decision
    const fallbackDecision = `## Current State\n\nThe Personal Vault UI project is active. The sidebar has been cleaned up. Recent Changes view shows vault markdown files. Next milestone is Resume Me.\n\n## Recommended Next Action\n\nReview the cleaned Personal Vault UI, then approve Context Builder MVP.`;

    return NextResponse.json({
      decision: decisionContent || fallbackDecision,
      frontmatter: decisionFrontmatter,
      activeProjects: recentProjects,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resume API error:', error);
    return NextResponse.json({
      decision: 'Could not load current state summary.',
      activeProjects: [],
      updatedAt: new Date().toISOString()
    });
  }
}
