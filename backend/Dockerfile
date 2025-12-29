# --- Stage 1: Build ---
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS build

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON=3.13

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && \
    apt-get purge -y gcc g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Copy the rest of the source and install the project
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev && \
    rm -rf /root/.venv/lib/python*/site-packages/*/tests && \
    rm -rf /root/.venv/lib/python*/site-packages/*/*.dist-info && \
    rm -rf /root/.venv/lib/python*/site-packages/*/src && \
    find /root/.venv -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /root/.venv -type f -name '*.pyc' -delete 2>/dev/null || true

# --- Stage 2: Runtime ---
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS runtime
WORKDIR /app

# Create a non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser -s /sbin/nologin

# Copy the virtual environment from the build stage
# Ensure the non-root user owns the application files
COPY --from=build --chown=appuser:appgroup /build/.venv /app/.venv
COPY --from=build --chown=appuser:appgroup /build /app

# Add the virtual environment to the PATH
ENV PATH="/app/.venv/bin:$PATH"

# Switch to the non-root user
USER appuser

# Run the application (replace with your entrypoint)
#CMD ["python", "main.py"]
