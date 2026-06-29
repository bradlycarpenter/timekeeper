ALTER TABLE `sheet_auth_detail` RENAME TO `sheet_auth_token`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sheet_auth_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`auth_token` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sheet_auth_token`("id", "user_id", "auth_token") SELECT "id", "user_id", "auth_token" FROM `sheet_auth_token`;--> statement-breakpoint
DROP TABLE `sheet_auth_token`;--> statement-breakpoint
ALTER TABLE `__new_sheet_auth_token` RENAME TO `sheet_auth_token`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sheet_auth_token_user_id_unique` ON `sheet_auth_token` (`user_id`);