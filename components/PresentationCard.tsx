import Link from "next/link";
import { Presentation } from "@/lib/types";

interface Props {
  presentation: Presentation;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PresentationCard({ presentation }: Props) {
  const { id, title, summary, theme, tags, createdAt, contributor, slideCount } =
    presentation;

  return (
    <article className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs bg-surface text-text-secondary px-2 py-1 rounded-full">
          {theme}
        </span>
        <span className="text-xs text-text-muted">{slideCount} 頁</span>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-text-primary leading-snug mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
          {summary}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[11px] bg-surface text-text-secondary px-2 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div>
          <p className="text-[11px] text-text-muted">{formatDate(createdAt)}</p>
          <p className="text-[11px] text-text-muted">by {contributor}</p>
        </div>
        <Link
          href={`/view/${id}`}
          className="bg-[#111111] text-accent text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
        >
          開啟
        </Link>
      </div>
    </article>
  );
}
