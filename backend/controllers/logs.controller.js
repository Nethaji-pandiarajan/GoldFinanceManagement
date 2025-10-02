const { logger } = require("../config/logger");
const archiver = require("archiver");
const path = require("path");
const supabase = require("../config/supabaseClient");
const BUCKET_NAME = "logs";


exports.downloadLogs = async (req, res) => {
  const { type } = req.params;
  logger.info(
    `[LOGS] Request received to download '${type}' logs from Supabase.`
  );

  const filePrefix = type === "success" ? "application-" : "error-";
  const zipFileName = `${type}-logs-${
    new Date().toISOString().split("T")[0]
  }.zip`;

  res.attachment(zipFileName);

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.on("error", (err) => {
    logger.error(`[LOGS] Archiving error: ${err.message}`);
    throw new Error(err.message);
  });

  archive.pipe(res);

  try {
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (listError) {
      throw listError;
    }

    const logFiles = files.filter((file) => file.name.startsWith(filePrefix));

    if (logFiles.length === 0) {
      logger.warn(
        `[LOGS] No '${type}' logs found in Supabase bucket '${BUCKET_NAME}'. Sending empty archive.`
      );
      archive.finalize();
      return;
    }

    logger.info(
      `[LOGS] Found ${logFiles.length} '${type}' log files to download and archive.`
    );

    const downloadPromises = logFiles.map(async (file) => {
      const fileName = file.name;
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET_NAME)
        .download(fileName);

      if (downloadError) {
        logger.error(
          `[LOGS] Failed to download ${fileName} from Supabase: ${downloadError.message}`
        );
        return;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());

      archive.append(buffer, { name: fileName });
    });

    await Promise.all(downloadPromises);

    archive.finalize();

    res.on("close", () => {
      logger.info(
        `[LOGS] Zip archive '${zipFileName}' sent successfully. Total size: ${archive.pointer()} bytes.`
      );
    });
  } catch (err) {
    logger.error(
      `[LOGS] An error occurred during the log download process: ${err.message}`
    );
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Failed to create log archive.", error: err.message });
    }
  }
};
