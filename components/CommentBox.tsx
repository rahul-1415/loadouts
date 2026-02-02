interface CommentBoxProps {
  author: string;
  text: string;
}

export default function CommentBox({ author, text }: CommentBoxProps) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
        {author}
      </p>
      <p className="mt-2 text-sm text-ink/70">{text}</p>
    </div>
  );
}
