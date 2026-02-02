interface CommentBoxProps {
  author: string;
  text: string;
}

export default function CommentBox({ author, text }: CommentBoxProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
        {author}
      </p>
      <p className="mt-2 text-sm text-slate-700">{text}</p>
    </div>
  );
}
