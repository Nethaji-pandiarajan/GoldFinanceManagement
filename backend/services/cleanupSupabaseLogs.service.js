const cron = require("node-cron");
const supabase = require("../config/supabaseClient");
const { logger } = require("../config/logger");

const BUCKET_NAME = "logs";
const RETENTION_DAYS = 5;

async function cleanupOldLogs() {
  logger.info(
    "[Supabase Log writter] Starting Supabase old logs cleanup job..."
  );

  try {
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (error) throw error;
    if (!files || files.length === 0) {
      logger.info(
        "[Supabase Log writter] No log files found in Supabase bucket. Cleanup job finished."
      );
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filesToDelete = [];

    for (const file of files) {
      const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) continue;

      const fileDate = new Date(dateMatch[1]);
      const ageInDays = (now - fileDate) / (1000 * 60 * 60 * 24);

      if (ageInDays >= RETENTION_DAYS) {
        filesToDelete.push(file.name);
      }
    }

    if (filesToDelete.length > 0) {
      logger.info(
        `[Supabase Log writter] Found ${
          filesToDelete.length
        } old log files to delete: ${filesToDelete.join(", ")}`
      );
      const { data, error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) throw deleteError;

      logger.info(
        "[Supabase Log writter] Successfully deleted old log files from Supabase."
      );
    } else {
      logger.info(
        "[Supabase Log writter] No old log files to delete from Supabase."
      );
    }
  } catch (error) {
    logger.error(
      `[Supabase Log writter] Error during Supabase log cleanup job: ${error.message}`
    );
  }
}

const scheduledCleanup = cron.schedule("*/10 * * * *", cleanupOldLogs, {
  scheduled: true,
  timezone: "Asia/Kolkata",
});

module.exports = {
  start: () => {
    logger.info(
      "[Supabase Log writter] Supabase log cleanup job scheduled to run daily."
    );
    scheduledCleanup.start();
  },
  runNow: cleanupOldLogs,
};
