FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /backend

RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser -s /sbin/nologin

COPY . .

RUN uv sync --frozen --no-dev
RUN chown -R appuser:appgroup /backend
USER appuser

ENV PATH="/app/.venv/bin:$PATH"
