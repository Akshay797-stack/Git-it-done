# AI Issue Autofix MVP

This repository demonstrates an end-to-end AI-assisted issue fixing workflow without complex orchestration tools. It uses a custom "Cline" agent (powered by OpenAI) to analyze GitHub issues, clone the repository, generate a fix, and optionally apply it and open a Pull Request.

## Prerequisites

- **Docker**: Must be installed and running.
- **Git**: Installed locally.
- **OpenAI API Key**: For the LLM.
- **GitHub Personal Access Token (PAT)**: For fetching issues and creating PRs.

## Setup

1. **Clone this repository**:
   ```bash
   git clone <this-repo-url>
   cd ai-issue-autofix-mvp
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your keys.
   ```bash
   cp .env.example .env
   ```
   - `OPENAI_API_KEY`: Your OpenAI API key (needs GPT-4 access ideally).
   - `GITHUB_TOKEN`: A GitHub PAT with `repo` scope.

3. **Make Script Executable**:
   ```bash
   chmod +x run_with_cline.sh
   ```

## Usage

The main entry point is `run_with_cline.sh`.

### Syntax
```bash
./run_with_cline.sh --issue <ISSUE_URL> --repo <REPO_URL> [--apply] [--push]
```

- `--issue`: Full URL to the GitHub issue.
- `--repo`: Full URL to the GitHub repository.
- `--apply`: Apply the generated patch and run tests (if any).
- `--push`: Push the branch and create a PR (implies `--apply`).
- Default (no flags): Dry-run mode. Generates `patch.diff` in `workspace/` but does not modify the repo.

### Example (Dry Run)
```bash
./run_with_cline.sh --issue https://github.com/myuser/myrepo/issues/1 --repo https://github.com/myuser/myrepo.git
```

### Example (Full Automation)
```bash
./run_with_cline.sh --issue https://github.com/myuser/myrepo/issues/1 --repo https://github.com/myuser/myrepo.git --push
```

## Architecture

1. **`run_with_cline.sh`**: Orchestrates the flow. Fetches issue body, clones repo, builds Docker image, runs agent, handles git operations.
2. **`docker/cline-agent/`**: Contains the Dockerfile for the AI agent.
3. **`src/agent.js`**: The Node.js script that acts as the agent. It reads the codebase, prompts OpenAI, and outputs a diff.
4. **`prompts/`**: Contains the prompt templates used by the agent.

## Testing with Sample Data

See [run-local.md](run-local.md) for a step-by-step guide to test this using the provided `test-repo`.
