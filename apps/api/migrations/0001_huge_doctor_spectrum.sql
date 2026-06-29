CREATE TABLE `daily_board_sheet_post` (
	`id` text PRIMARY KEY NOT NULL,
	`board_sheet_id` text NOT NULL,
	`user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`status` text NOT NULL,
	`entry_id` integer,
	`error` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`board_sheet_id`) REFERENCES `board_sheet`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_board_sheet_post_board_sheet_id_idx` ON `daily_board_sheet_post` (`board_sheet_id`);--> statement-breakpoint
CREATE INDEX `daily_board_sheet_post_user_id_idx` ON `daily_board_sheet_post` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_board_sheet_post_board_sheet_date_idx` ON `daily_board_sheet_post` (`board_sheet_id`,`entry_date`);
