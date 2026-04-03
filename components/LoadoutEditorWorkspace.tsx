"use client";

import { useState } from "react";
import LoadoutBoardEditor from "./LoadoutBoardEditor";
import LoadoutProductsManager, {
  type LoadoutProductItem,
} from "./LoadoutProductsManager";
import type { LoadoutLayout, LoadoutLayoutMode } from "../lib/loadoutLayout";

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

  return (
    <div className="space-y-6">
      <LoadoutProductsManager
        collectionIdentifier={collectionIdentifier}
        initialItems={initialProducts}
        defaultComposerOpen
        defaultComposerMode="existing"
        showComposerCloseButton={false}
        stickyComposer
        onItemsChange={setAttachedProducts}
      />

      {layoutMode === "custom" ? (
        <LoadoutBoardEditor
          collectionIdentifier={collectionIdentifier}
          initialLayout={initialLayout}
          products={attachedProducts}
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
    </div>
  );
}
