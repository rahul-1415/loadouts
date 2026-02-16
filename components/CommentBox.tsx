interface CommentBoxProps {
  author: string;
  text: string;
}

export default function CommentBox({ author, text }: CommentBoxProps) {
  return (
    <div className="rounded-2xl border border-white/12 bg-[#141821] p-4">
      <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
        {author}
      </p>
      <p className="mt-2 text-sm text-white/75">{text}</p>
    </div>
  );
}
