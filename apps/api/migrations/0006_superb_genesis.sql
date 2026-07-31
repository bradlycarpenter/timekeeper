CREATE TABLE `overtime_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`board_sheet_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`issue_key` text NOT NULL,
	`issue_summary` text DEFAULT '' NOT NULL,
	`hours` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`entry_id` integer,
	`message` text,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`board_sheet_id`) REFERENCES `board_sheet`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `overtime_entry_link_date_issue_idx` ON `overtime_entry` (`board_sheet_id`,`entry_date`,`issue_key`);--> statement-breakpoint
CREATE INDEX `overtime_entry_user_date_idx` ON `overtime_entry` (`user_id`,`entry_date`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`standard_hours` real DEFAULT 8 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
