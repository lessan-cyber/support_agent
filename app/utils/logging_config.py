import logging
import sys


def setup_logging():
    """
    Sets up logging for the application with different levels for console output.
    """
    logger = logging.getLogger("support_agent")
    logger.setLevel(logging.INFO)

    console_handler = logging.StreamHandler(sys.stdout)
    info_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_handler.setFormatter(info_formatter)

    logger.addHandler(console_handler)
    return logger


# Initialize logger when this module is imported
logger = setup_logging()
