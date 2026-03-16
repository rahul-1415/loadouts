interface CommentBoxProps {
  author: string;
  text: string;
}

export default function CommentBox({ author, text }: CommentBoxProps) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
        {author}
      </p>
      <p className="mt-2 text-sm text-white/75">{text}</p>
    </div>
  );
}
