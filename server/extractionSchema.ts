export interface ExtractedLeague {
  name: string;
  teams: string[];
}

export interface ExtractedMatch {
  date: string | null;
  venue: string | null;
  time: string | null;
  league: string | null;
  no: string | null;
  teamA: string | null;
  teamB: string | null;
}

export interface ExtractedBracketSlot {
  teamA: string | null;
  teamB: string | null;
}

export interface ExtractionResult {
  tournamentName: string | null;
  category: string | null;
  leagues: ExtractedLeague[];
  matches: ExtractedMatch[];
  bracket: ExtractedBracketSlot[];
}

const nullableString = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;

export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    tournamentName: nullableString,
    category: nullableString,
    leagues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          teams: { type: "array", items: { type: "string" } },
        },
        required: ["name", "teams"],
        additionalProperties: false,
      },
    },
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: nullableString,
          venue: nullableString,
          time: nullableString,
          league: nullableString,
          no: nullableString,
          teamA: nullableString,
          teamB: nullableString,
        },
        required: [
          "date",
          "venue",
          "time",
          "league",
          "no",
          "teamA",
          "teamB",
        ],
        additionalProperties: false,
      },
    },
    bracket: {
      type: "array",
      items: {
        type: "object",
        properties: {
          teamA: nullableString,
          teamB: nullableString,
        },
        required: ["teamA", "teamB"],
        additionalProperties: false,
      },
    },
  },
  required: ["tournamentName", "category", "leagues", "matches", "bracket"],
  additionalProperties: false,
} as const;
