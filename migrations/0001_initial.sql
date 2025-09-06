
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"avatar" text,
	"kyc_status" text DEFAULT 'unverified' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create assets table
CREATE TABLE IF NOT EXISTS "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"price" numeric(12, 6) NOT NULL,
	"change_24h" numeric(5, 2) DEFAULT '0' NOT NULL,
	"volume_24h" numeric(20, 2),
	"market_cap" numeric(20, 2),
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "assets_symbol_unique" UNIQUE("symbol")
);

-- Add is_active column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='is_active') THEN
        ALTER TABLE "assets" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
    END IF;
END $$;

-- Create traders table
CREATE TABLE IF NOT EXISTS "traders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"bio" text,
	"win_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"profit_30d" numeric(6, 2) DEFAULT '0' NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 1) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);

-- Create copy_relationships table
CREATE TABLE IF NOT EXISTS "copy_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"trader_id" integer NOT NULL,
	"allocation_percentage" numeric(5, 2) DEFAULT '100' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create trades table
CREATE TABLE IF NOT EXISTS "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 8) NOT NULL,
	"price" numeric(12, 6) NOT NULL,
	"status" text NOT NULL,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"copied_from_trade_id" integer
);

-- Create investment_plans table
CREATE TABLE IF NOT EXISTS "investment_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"min_amount" numeric(12, 2) NOT NULL,
	"max_amount" numeric(12, 2),
	"roi_percentage" numeric(5, 2) NOT NULL,
	"lock_period_days" integer NOT NULL,
	"features" jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);

-- Create investments table
CREATE TABLE IF NOT EXISTS "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" text NOT NULL,
	"status" text NOT NULL,
	"transaction_ref" text,
	"payment_proof_url" text,
	"payment_notes" text,
	"withdrawal_address" text,
	"withdrawal_details" jsonb,
	"admin_notes" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

-- Create kyc_documents table
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"document_number" text NOT NULL,
	"expiry_date" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create session table for express-session
CREATE TABLE IF NOT EXISTS "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "traders" ADD CONSTRAINT "traders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "copy_relationships" ADD CONSTRAINT "copy_relationships_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "copy_relationships" ADD CONSTRAINT "copy_relationships_trader_id_traders_id_fk" FOREIGN KEY ("trader_id") REFERENCES "traders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "investments" ADD CONSTRAINT "investments_plan_id_investment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "investment_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
