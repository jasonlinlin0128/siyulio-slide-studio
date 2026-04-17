import { notFound } from "next/navigation";
import Link from "next/link";
import { Presentation } from "@/lib/types";
import SlideViewer from "@/components/SlideViewer";
import presentationsData from "@/data/presentations.json";

const presentations = presentationsData as Presentation[];

export function generateStaticParams() {
  return presentations.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const p = presentations.find((p) => p.id === params.id);
  if (!p) return { title: "Not Found" };
  return { title: `${p.title} | Siyulio Slide Studio` };
}

export default function ViewPage({ params }: { params: { id: string } }) {
  const presentation = presentations.find((p) => p.id === params.id);
  if (!presentation) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
        <Link href="/gallery" className="hover:text-text-primary transition-colors">
          公開簡報
        </Link>
        <span>/</span>
        <span className="text-text-primary truncate">{presentation.title}</span>
      </div>

      <SlideViewer presentation={presentation} />

      <div className="mt-10 border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-black mb-3">{presentation.title}</h1>
          <p className="text-text-secondary leading-relaxed">{presentation.summary}</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">貢獻者</span>
            <span>{presentation.contributor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">主題風格</span>
            <span>{presentation.theme}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted font-bold">頁數</span>
            <span>{presentation.slideCount} 頁</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {presentation.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-surface text-text-secondary px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
