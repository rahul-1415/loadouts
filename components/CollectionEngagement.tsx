"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";
import CommentBox from "./CommentBox";

interface CommentItem {
  id: string;
  userId: string;
  author: string;
  body: string;
  createdAt: string;
}

interface CollectionEngagementProps {
  collectionId: string;
  collectionSlug: string;
  initialLikeCount: number;
  initialViewerHasLiked: boolean;
  initialComments: CommentItem[];
  viewerUserId: string | null;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

export default function CollectionEngagement({
  collectionId,
  collectionSlug,
  initialLikeCount,
  initialViewerHasLiked,
  initialComments,
  viewerUserId,
}: CollectionEngagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [viewerHasLiked, setViewerHasLiked] = useState(initialViewerHasLiked);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [commentBody, setCommentBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const requireAuth = () => {
    const nextPath = pathname || `/loadouts/${collectionSlug}`;
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  const requireProfileSetup = () => {
    const nextPath = pathname || `/loadouts/${collectionSlug}`;
    router.push(`/onboarding/profile?next=${encodeURIComponent(nextPath)}`);
  };

  const handleApiAuthError = (payload: ApiErrorPayload | null) => {
    const code = payload?.error?.code;

    if (code === "PROFILE_INCOMPLETE") {
      requireProfileSetup();
      return true;
    }

    if (code === "UNAUTHORIZED") {
      requireAuth();
      return true;
    }

    return false;
  };

  const toggleLike = async () => {
    if (!viewerUserId) {
      requireAuth();
      return;
    }

    setIsLiking(true);
    setErrorMessage(null);
    setMessage(null);

    const response = await fetch("/api/likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collectionId,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | null;

      if (handleApiAuthError(payload)) {
        setIsLiking(false);
        return;
      }

      setErrorMessage(payload?.error?.message ?? "Unable to update like.");
      setIsLiking(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { liked?: boolean; likeCount?: number } }
      | null;

    setViewerHasLiked(Boolean(payload?.data?.liked));
    setLikeCount(payload?.data?.likeCount ?? likeCount);
    setIsLiking(false);
    router.refresh();
  };

  const postComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewerUserId) {
      requireAuth();
      return;
    }

    const body = commentBody.trim();
    if (!body) {
      setErrorMessage("Comment cannot be empty.");
      return;
    }

    setIsPosting(true);
    setErrorMessage(null);
    setMessage(null);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collectionId,
        body,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | null;

      if (handleApiAuthError(payload)) {
        setIsPosting(false);
        return;
      }

      setErrorMessage(payload?.error?.message ?? "Unable to post comment.");
      setIsPosting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: {
            id: string;
            userId: string;
            author: string;
            body: string;
            createdAt: string;
          };
        }
      | null;

    if (payload?.data) {
      setComments((current) => [payload.data as CommentItem, ...current]);
      setCommentBody("");
      setMessage("Comment posted.");
    }

    setIsPosting(false);
    router.refresh();
  };

  const deleteComment = async (commentId: string) => {
    if (!viewerUserId) {
      requireAuth();
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | null;

      if (handleApiAuthError(payload)) {
        return;
      }

      setErrorMessage(payload?.error?.message ?? "Unable to delete comment.");
      return;
    }

    setComments((current) => current.filter((item) => item.id !== commentId));
    setMessage("Comment deleted.");
    router.refresh();
  };

  const editComment = async (comment: CommentItem) => {
    if (!viewerUserId || viewerUserId !== comment.userId) {
      return;
    }

    const updatedBody = window.prompt("Edit comment", comment.body);
    if (updatedBody == null) {
      return;
    }

    const text = updatedBody.trim();
    if (!text) {
      setErrorMessage("Comment cannot be empty.");
      return;
    }

    const response = await fetch(`/api/comments/${encodeURIComponent(comment.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: text }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorPayload
        | null;

      if (handleApiAuthError(payload)) {
        return;
      }

      setErrorMessage(payload?.error?.message ?? "Unable to update comment.");
      return;
    }

    setComments((current) =>
      current.map((item) =>
        item.id === comment.id
          ? {
              ...item,
              body: text,
            }
          : item
      )
    );
    setMessage("Comment updated.");
    router.refresh();
  };

  return (
    <>
      <section className="flex flex-wrap gap-3">
        <Button type="button" onClick={toggleLike} disabled={isLiking}>
          {isLiking
            ? "Working..."
            : viewerHasLiked
              ? `Unlike (${likeCount})`
              : `Like (${likeCount})`}
        </Button>
        <Button variant="secondary">Save</Button>
        <Button variant="secondary">Share</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Comments</h2>
        <form className="flex flex-wrap gap-3" onSubmit={postComment}>
          <input
            placeholder="Add a comment..."
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <Button type="submit" disabled={isPosting}>
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </form>

        {message ? <p className="text-sm text-[#86efac]">{message}</p> : null}
        {errorMessage ? (
          <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
        ) : null}

        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <CommentBox author={comment.author} text={comment.body} />
              {viewerUserId === comment.userId ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editComment(comment)}
                    className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/65"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteComment(comment.id)}
                    className="rounded-full border border-[#fda4a4]/45 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#fda4a4]"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {comments.length === 0 ? (
            <p className="text-sm text-white/70">No comments yet.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
