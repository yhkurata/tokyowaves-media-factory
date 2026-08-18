CREATE TABLE "expedition_guide_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"input" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expedition_guide_templates_name_unique" UNIQUE("name")
);
