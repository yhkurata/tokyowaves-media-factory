CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'revised');--> statement-breakpoint
CREATE TYPE "public"."post_category" AS ENUM('教育系', '共感系', '大会・活動報告', '募集');--> statement-breakpoint
CREATE TYPE "public"."post_format" AS ENUM('feed', 'carousel', 'reel', 'story');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('proposed', 'approved', 'rejected', 'image_created', 'posted', 'backfilled');--> statement-breakpoint
CREATE TABLE "agent_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_instruction" text NOT NULL,
	"candidates" jsonb NOT NULL,
	"recommended_candidate_index" integer NOT NULL,
	"recommendation_reasoning" text NOT NULL,
	"operational_suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"open_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending' NOT NULL,
	"approved_candidate_index" integer
);
--> statement-breakpoint
CREATE TABLE "brand_context" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"operating_guide" text DEFAULT '' NOT NULL,
	"brand_colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_ratio_targets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kpi_metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_history" (
	"id" text PRIMARY KEY NOT NULL,
	"format" "post_format" NOT NULL,
	"category" "post_category" NOT NULL,
	"concept" text NOT NULL,
	"caption_excerpt" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "post_status" NOT NULL,
	"plan" jsonb,
	"source_proposal_id" text,
	"candidate_index" integer,
	"is_recommended" boolean,
	"proposed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"image_created_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"result_likes" integer,
	"result_saves" integer,
	"result_comments" integer,
	"result_views" integer,
	"result_memo" text,
	"instagram_media_id" text,
	"instagram_permalink" text,
	"instagram_published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
