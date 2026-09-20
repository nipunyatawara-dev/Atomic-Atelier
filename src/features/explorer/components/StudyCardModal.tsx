"use client";

import { useMemo } from "react";
import { Download, Printer, Sparkles } from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import {
  downloadElementCardSvg,
  generateElementStudyCardSvg,
} from "@/features/explorer/lib/studyCardExport";
import type { ElementRecord } from "@/types";

export interface StudyCardModalProps {
  element: ElementRecord;
  onClose: () => void;
}

export function StudyCardModal({ element, onClose }: StudyCardModalProps) {
  const svgContent = useMemo(() => {
    return generateElementStudyCardSvg(element);
  }, [element]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      title={`${element.name} (${element.symbol}) · Study Card`}
      eyebrow="Printable Flashcard & Vector Reference"
      onClose={onClose}
      wide
      className="study-card-dialog"
    >
      {/* Action Toolbar */}
      <div className="study-card-actions">
        <button
          type="button"
          className="study-action-btn primary"
          onClick={() => downloadElementCardSvg(element)}
          aria-label="Download vector SVG study card"
        >
          <Download size={15} />
          <span>Download SVG Card</span>
        </button>

        <button
          type="button"
          className="study-action-btn secondary"
          onClick={handlePrint}
          aria-label="Print study sheet"
        >
          <Printer size={15} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Interactive Card Preview */}
      <div className="study-card-preview-container">
        <div
          className="study-card-svg-wrapper print-card-target"
          dangerouslySetInnerHTML={{ __html: svgContent }}
          aria-label={`Study card preview for ${element.name}`}
        />
      </div>

      <div className="study-card-tip">
        <Sparkles size={14} />
        <span>
          Vector SVG exports can be imported into Notion, GoodNotes, Anki flashcard decks, or vector
          design tools without loss of resolution.
        </span>
      </div>
    </Dialog>
  );
}
