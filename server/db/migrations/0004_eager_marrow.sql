CREATE TABLE "expedition_guide_history" (
	"id" text PRIMARY KEY NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "expedition_guide_history_created_idx" ON "expedition_guide_history" USING btree ("created_at");