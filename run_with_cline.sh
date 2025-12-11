#!/bin/bash
# Wrapper for the Node.js orchestrator
# This ensures cross-platform compatibility and avoids Bash/WSL/Docker path issues on Windows.

node src/orchestrator.js "$@"
