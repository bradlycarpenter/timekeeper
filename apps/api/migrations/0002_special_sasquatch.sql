CREATE TABLE `sheet_auth_detail` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text,
	`password` text,
	`auth_token` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sheet_auth_detail_user_id_unique` ON `sheet_auth_detail` (`user_id`);