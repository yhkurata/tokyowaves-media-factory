import { forwardRef } from "react";
import type { Tournament } from "../../types/tournament";
import { IMAGE_WIDTH, IMAGE_HEIGHT } from "../../lib/constants";
import { getDateRangeLabel, getVenueSummaryLabel } from "../../lib/tournamentSchedule";

type Props = {
  tournament: Tournament;
};

export const PostImageTemplate = forwardRef<HTMLDivElement, Props>(
  function PostImageTemplate({ tournament }, ref) {
    return (
      <div
        ref={ref}
        style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
        className="flex flex-col items-center justify-center gap-6 bg-white p-16 text-center"
      >
        <p className="text-4xl font-bold text-gray-900">
          {tournament.name || "大会名未入力"}
        </p>
        <p className="text-2xl text-gray-700">
          {getDateRangeLabel(tournament.days)}
        </p>
        <p className="text-2xl text-gray-700">
          {getVenueSummaryLabel(tournament.days)}
        </p>
      </div>
    );
  },
);
