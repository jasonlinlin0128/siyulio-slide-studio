import { readFileSync } from "fs";
import { join } from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DESIGN.md | Siyulio Slide Studio",
  description: "Design system specification for Siyulio Slide Studio",
};

export default function DesignPage() {
  const mdPath = join(process.cwd(), "DESIGN.md");
  const content = readFileSync(mdPath, "utf-8");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <span className="bg-[#111111] text-accent text-xs font-mono font-bold px-3 py-1 rounded">
          DESIGN.md
        </span>
        <span className="text-sm text-text-muted">品牌脊柱 · 設計系統文件</span>
      </div>

      <article className="prose prose-slate max-w-none
        prose-headings:font-black prose-headings:text-[#111111]
        prose-h1:text-3xl prose-h1:mb-6
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-2
        prose-h3:text-base prose-h3:mt-6
        prose-p:text-[#555555] prose-p:leading-relaxed
        prose-li:text-[#555555]
        prose-code:bg-[#F5F5F5] prose-code:text-[#111111] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-[#111111] prose-pre:text-gray-100
        prose-table:text-sm
        prose-th:bg-[#F5F5F5] prose-th:font-bold
        prose-strong:text-[#111111]
        prose-a:text-[#1A73E8] prose-a:no-underline hover:prose-a:underline
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
