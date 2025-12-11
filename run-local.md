# Run Local Guide

Follow these steps to validate the AI Issue Autofix flow using the provided sample code.

## 1. Prepare a Test Repository

Since the tool interacts with GitHub, you need a real GitHub repository to test the full flow (fetching issues, creating PRs).

1. Create a **new public repository** on GitHub (e.g., `ai-autofix-test`).
2. Push the contents of the `test-repo` folder to your new repository:
   ```bash
   cd test-repo
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/ai-autofix-test.git
   git push -u origin main
   cd ..
   ```

## 2. Create Sample Issues

Go to your new GitHub repository and create two issues:

**Issue 1:**
- **Title**: Fix addition bug
- **Body**:
  ```text
  The add function in index.js is subtracting instead of adding.
  Please fix it so it returns a + b.
  ```

**Issue 2:**
- **Title**: Update greeting
- **Body**:
  ```text
  The greet function should be more enthusiastic.
  Change it to say "Hello <name>!" with an exclamation mark.
  ```

## 3. Run the Tool

### Test Dry Run (Issue 1)
Replace `<YOUR_USERNAME>` and `<ISSUE_NUMBER>` (likely 1) below:

```bash
./run_with_cline.sh \
  --issue https://github.com/<YOUR_USERNAME>/ai-autofix-test/issues/1 \
  --repo https://github.com/<YOUR_USERNAME>/ai-autofix-test.git
```

**Expected Output:**
- The script will fetch the issue and clone the repo.
- It will run the AI agent.
- It should say `✨ Patch generated at workspace/patch.diff`.
- You can inspect `workspace/patch.diff` to see the fix.

### Test Full Flow (Issue 2)
Replace `<ISSUE_NUMBER>` (likely 2):

```bash
./run_with_cline.sh \
  --issue https://github.com/<YOUR_USERNAME>/ai-autofix-test/issues/2 \
  --repo https://github.com/<YOUR_USERNAME>/ai-autofix-test.git \
  --push
```

**Expected Output:**
- Same as above, but it will also:
- Apply the patch.
- Run tests (they might fail if the fix isn't perfect, or pass).
- Push a new branch `fix/issue-2-ai`.
- Create a Pull Request on your repository.

## Troubleshooting

- **Docker Errors**: Ensure Docker Desktop is running.
- **Auth Errors**: Check your `.env` file for valid `OPENAI_API_KEY` and `GITHUB_TOKEN`.
- **Git Errors**: Ensure you have write access to the repository.
