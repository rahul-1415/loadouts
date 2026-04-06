"use client";

import { useMemo, useState } from "react";
import LoadoutBoardEditor from "./LoadoutBoardEditor";
import LoadoutPostPreview from "./LoadoutPostPreview";
import LoadoutProductsManager, {
  type LoadoutProductItem,
} from "./LoadoutProductsManager";
import type { LoadoutLayout, LoadoutLayoutMode } from "../lib/loadoutLayout";

type WorkspaceTab = "products" | "layout" | "review";

interface LoadoutEditorWorkspaceProps {
  collectionIdentifier: string;
  initialProducts: LoadoutProductItem[];
  layoutMode: LoadoutLayoutMode;
  initialLayout: LoadoutLayout | null;
  title: string;
  description: string;
  coverImageUrl: string;
  categoryLabel: string;
  statusLabel: string;
}

export default function LoadoutEditorWorkspace({
  collectionIdentifier,
  initialProducts,
  layoutMode,
  initialLayout,
  title,
  description,
  coverImageUrl,
  categoryLabel,
  statusLabel,
}: LoadoutEditorWorkspaceProps) {
  const [attachedProducts, setAttachedProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("products");
  const [draftLayout, setDraftLayout] = useState<LoadoutLayout | null>(initialLayout);
  const availableTabs = useMemo<WorkspaceTab[]>(
    () => (layoutMode === "custom" ? ["products", "layout", "review"] : ["products", "review"]),
    [layoutMode]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/[0.05] bg-[#171717] px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            Workspace
          </p>
          <p className="mt-2 text-sm text-white/68">
            Move between products, layout, and review without leaving the editing workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.24em] transition ${
                activeTab === tab
                  ? "border-[#d4dd7f]/45 bg-[#10120d] text-[#e6ef92]"
                  : "border-white/[0.08] bg-[#181818] text-white/58 hover:border-white/[0.14] hover:text-white"
              }`}
            >
              {tab === "products" ? "Products" : tab === "layout" ? "Edit Layout" : "Review"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "products" ? (
        <LoadoutProductsManager
          collectionIdentifier={collectionIdentifier}
          initialItems={attachedProducts}
          defaultComposerOpen
          defaultComposerMode="existing"
          showComposerCloseButton={false}
          stickyComposer
          onItemsChange={setAttachedProducts}
        />
      ) : null}

      {activeTab === "layout" && layoutMode === "custom" ? (
        <LoadoutBoardEditor
          collectionIdentifier={collectionIdentifier}
          initialLayout={draftLayout}
          products={attachedProducts}
          onLayoutChange={setDraftLayout}
          previewMeta={{
            title,
            description,
            coverImageUrl,
            categoryLabel,
            authorLabel: "You",
            statusLabel,
          }}
        />
      ) : null}

      {activeTab === "review" ? (
        <LoadoutPostPreview
          title={title}
          description={description}
          coverImageUrl={coverImageUrl}
          categoryLabel={categoryLabel}
          authorLabel="You"
          statusLabel={statusLabel}
          layoutMode={layoutMode}
          layout={layoutMode === "custom" ? draftLayout : null}
          products={attachedProducts}
          heading="Review"
          subheading="Use this as the final quality check before leaving the editor or changing the loadout status."
        />
      ) : null}
    </div>
  );
}
