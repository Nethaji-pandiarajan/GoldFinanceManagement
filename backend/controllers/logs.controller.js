const logger = require("../config/logger");
const archiver = require('archiver');
const path = require('path');
const os = require('os');
const fs = require('fs');

const logDir = path.join(process.cwd(), 'logs');

exports.downloadLogs = (req, res) => {
    const { type } = req.params;
    logger.info(`[LOGS] Request received to download '${type}' logs.`);

    const filePrefix = type === 'success' ? 'application-' : 'error-';
    const zipFileName = `${type}-logs-${new Date().toISOString().split('T')[0]}.zip`;

    if (!fs.existsSync(logDir)) {
        logger.warn(`[LOGS] Log directory not found at: ${logDir}`);
        return res.status(404).json({ message: "Log directory not found." });
    }
    res.attachment(zipFileName);

    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive.pipe(res);

    fs.readdir(logDir, (err, files) => {
        if (err) {
            logger.error(`[LOGS] Failed to read log directory: ${err.message}`);
            return res.status(500).send({ error: 'Could not read log directory' });
        }

        const logFiles = files.filter(file => file.startsWith(filePrefix));
        
        if (logFiles.length === 0) {
            logger.warn(`[LOGS] No '${type}' logs found to archive.`);
            archive.finalize();
            return;
        }

        logFiles.forEach(file => {
            const filePath = path.join(logDir, file);
            archive.file(filePath, { name: file });
        });

        archive.finalize();
    });

    res.on('close', () => {
        logger.info(`[LOGS] Zip archive '${zipFileName}' sent successfully. Total size: ${archive.pointer()} bytes.`);
    });
    
    archive.on('error', (err) => {
        logger.error(`[LOGS] Archiving error: ${err.message}`);
        res.status(500).send({ error: err.message });
    });
};