import os
import time
import glob
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - LOG_PURGER - %(levelname)s - %(message)s')

LOG_DIR = os.getenv("LOG_DIR", "/var/log/npci-forum")
MAX_AGE_DAYS = int(os.getenv("MAX_LOG_AGE_DAYS", "7"))

def purge_old_logs():
    now = time.time()
    cutoff = now - (MAX_AGE_DAYS * 86400)
    
    logging.info(f"Scanning directory {LOG_DIR} for logs older than {MAX_AGE_DAYS} days...")
    
    if not os.path.exists(LOG_DIR):
        logging.info(f"Log directory {LOG_DIR} does not exist yet. Creating...")
        os.makedirs(LOG_DIR, exist_ok=True)
        return

    log_files = glob.glob(os.path.join(LOG_DIR, "*.log")) + glob.glob(os.path.join(LOG_DIR, "*.txt"))
    purged_count = 0

    for file_path in log_files:
        try:
            file_mtime = os.path.getmtime(file_path)
            if file_mtime < cutoff:
                os.remove(file_path)
                purged_count += 1
                logging.info(f"Purged old log file: {file_path}")
        except Exception as e:
            logging.error(f"Error purging file {file_path}: {e}")

    logging.info(f"Log purge cycle complete. Purged {purged_count} files.")

if __name__ == "__main__":
    purge_old_logs()
