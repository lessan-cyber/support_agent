import logging
import sys


def setup_logging() -> logging.Logger:
    """
    Sets up logging for the application with different levels for console output.
    """
    logger = logging.getLogger("support_agent")
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)

    console_handler = logging.StreamHandler(sys.stdout)
    info_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(info_formatter)

    logger.addHandler(console_handler)
    return logger


logger = setup_logging()
