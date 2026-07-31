ALTER TABLE "agent_proposals" ADD COLUMN "ai_provider" text DEFAULT 'anthropic' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "ai_model" text;