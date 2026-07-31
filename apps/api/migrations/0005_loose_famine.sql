--> Merge duplicate board_sheet rows before the unique index can be created.
--> A "duplicate" is a second link for the same (user, board, sheet) triple. The
--> survivor is MIN(id) within the group: board_sheet carries no created_at, so
--> there is no creation order to prefer, and duplicates differ only by id.
--> Rules move to the survivor first, because deleting a loser cascades to its
--> stubs and posts.

UPDATE stub
SET board_sheet_id = (
  SELECT MIN(keep.id)
  FROM board_sheet keep, board_sheet dup
  WHERE dup.id = stub.board_sheet_id
    AND keep.user_id = dup.user_id
    AND keep.board_id = dup.board_id
    AND keep.sheet_task_id = dup.sheet_task_id
)
WHERE EXISTS (
  SELECT 1
  FROM board_sheet dup
  WHERE dup.id = stub.board_sheet_id
    AND dup.id <> (
      SELECT MIN(keep.id)
      FROM board_sheet keep
      WHERE keep.user_id = dup.user_id
        AND keep.board_id = dup.board_id
        AND keep.sheet_task_id = dup.sheet_task_id
    )
);--> statement-breakpoint

--> Posted history moves too, but only onto dates the survivor does not already
--> hold: daily_board_sheet_post is unique on (board_sheet_id, entry_date).

UPDATE daily_board_sheet_post
SET board_sheet_id = (
  SELECT MIN(keep.id)
  FROM board_sheet keep, board_sheet dup
  WHERE dup.id = daily_board_sheet_post.board_sheet_id
    AND keep.user_id = dup.user_id
    AND keep.board_id = dup.board_id
    AND keep.sheet_task_id = dup.sheet_task_id
)
WHERE EXISTS (
  SELECT 1
  FROM board_sheet dup
  WHERE dup.id = daily_board_sheet_post.board_sheet_id
    AND dup.id <> (
      SELECT MIN(keep.id)
      FROM board_sheet keep
      WHERE keep.user_id = dup.user_id
        AND keep.board_id = dup.board_id
        AND keep.sheet_task_id = dup.sheet_task_id
    )
)
AND NOT EXISTS (
  SELECT 1
  FROM daily_board_sheet_post other
  WHERE other.entry_date = daily_board_sheet_post.entry_date
    AND other.board_sheet_id = (
      SELECT MIN(keep.id)
      FROM board_sheet keep, board_sheet dup
      WHERE dup.id = daily_board_sheet_post.board_sheet_id
        AND keep.user_id = dup.user_id
        AND keep.board_id = dup.board_id
        AND keep.sheet_task_id = dup.sheet_task_id
    )
);--> statement-breakpoint

--> Two links posting the same day is the exact double-billing this migration
--> exists to stop. The survivor's row for that date is kept and the loser's
--> dropped rather than merged, so history shows one entry per day.

DELETE FROM daily_board_sheet_post
WHERE EXISTS (
  SELECT 1
  FROM board_sheet dup
  WHERE dup.id = daily_board_sheet_post.board_sheet_id
    AND dup.id <> (
      SELECT MIN(keep.id)
      FROM board_sheet keep
      WHERE keep.user_id = dup.user_id
        AND keep.board_id = dup.board_id
        AND keep.sheet_task_id = dup.sheet_task_id
    )
);--> statement-breakpoint

--> Merging can land two identical rules on the survivor. stub has no unique
--> constraint, and an identical rule would add the same sentence twice.

DELETE FROM stub
WHERE id NOT IN (
  SELECT MIN(id)
  FROM stub
  GROUP BY board_sheet_id, status_id, status_condition, message_id
);--> statement-breakpoint

DELETE FROM board_sheet
WHERE id <> (
  SELECT MIN(keep.id)
  FROM board_sheet keep
  WHERE keep.user_id = board_sheet.user_id
    AND keep.board_id = board_sheet.board_id
    AND keep.sheet_task_id = board_sheet.sheet_task_id
);--> statement-breakpoint

CREATE UNIQUE INDEX `board_sheet_user_board_sheet_idx` ON `board_sheet` (`user_id`,`board_id`,`sheet_task_id`);
