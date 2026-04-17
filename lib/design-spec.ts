import fs from "node:fs";
import path from "node:path";

export interface DesignInclude {
  section: string;
  content: string;
}

interface Cache {
  mtimeMs: number;
  includes: DesignInclude[];
}

let cache: Cache | null = null;

export function loadDesignIncludes(): DesignInclude[] {
  const file = path.join(process.cwd(), "DESIGN.md");
  const stat = fs.statSync(file);

  if (cache && cache.mtimeMs === stat.mtimeMs) {
    return cache.includes;
  }

  const raw = fs.readFileSync(file, "utf-8");
  const re = /<!-- prompt-include: ([a-z][a-z0-9-]*) -->([\s\S]*?)<!-- \/prompt-include -->/g;
  const includes: DesignInclude[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    includes.push({ section: m[1], content: m[2].trim() });
  }
  cache = { mtimeMs: stat.mtimeMs, includes };
  return includes;
}
