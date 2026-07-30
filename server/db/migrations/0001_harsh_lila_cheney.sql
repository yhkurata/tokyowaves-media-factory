ALTER TABLE "agent_proposals" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "cache_creation_input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "cache_read_input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "cost_usd" double precision;--> statement-breakpoint
ALTER TABLE "agent_proposals" ADD COLUMN "cost_jpy" double precision;