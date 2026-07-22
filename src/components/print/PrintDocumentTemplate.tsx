import type { ReactNode } from "react";
import { TokyoWavesLogo } from "../brand/TokyoWavesLogo";

export interface PrintDocumentSection {
  heading: string;
  body: string;
}

type Props = {
  title: string;
  dateLabel?: string;
  sections: PrintDocumentSection[];
  logo?: ReactNode;
};

// 保護者向け案内をA4で印刷/PDF保存するための共通テンプレート。
// 遠征要項AIに限らず、今後の練習案内AI・大会案内AI等でも
// title/dateLabel/sections を渡すだけで同じ見た目の印刷物が作れる。
// スタイル本体は src/styles/print.css を参照。
export function PrintDocumentTemplate({
  title,
  dateLabel,
  sections,
  logo,
}: Props) {
  return (
    <div className="print-document">
      <div className="print-document__header">
        {logo ?? <TokyoWavesLogo className="text-[#0d1230]" scale={0.9} />}
        {dateLabel && <p className="print-document__meta">{dateLabel}</p>}
      </div>

      <h1 className="print-document__title">{title}</h1>

      {sections.map((section, i) => (
        <section key={i} className="print-document__section">
          <span className="print-document__heading">{section.heading}</span>
          <p className="print-document__body">{section.body}</p>
        </section>
      ))}
    </div>
  );
}
