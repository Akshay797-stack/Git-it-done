const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { execSync } = require('child_process');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const isOpenRouter = apiKey && apiKey.startsWith('sk-or-');
const isCerebras = apiKey && apiKey.startsWith('csk-');

const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' :
        isCerebras ? 'https://api.cerebras.ai/v1' : undefined,
    defaultHeaders: isOpenRouter ? {
        'HTTP-Referer': 'https://github.com/cline/cline',
        'X-Title': 'Cline Agent'
    } : undefined
});

async function main() {
    const args = process.argv.slice(2);
    const issueBodyIndex = args.indexOf('--issue-body');
    const repoPathIndex = args.indexOf('--repo-path');

    if (issueBodyIndex === -1 || repoPathIndex === -1) {
        console.error('Usage: node agent.js --issue-body <text> --repo-path <path>');
        process.exit(1);
    }

    const issueBody = args[issueBodyIndex + 1];
    const repoPath = args[repoPathIndex + 1];

    console.log(`Analyzing issue for repo at: ${repoPath}`);

    // 1. Read codebase
    const files = readRepo(repoPath);
    const codebaseContext = files.map(f => `File: ${f.path}\nContent:\n${f.content}\n`).join('\n---\n');

    // 2. Read prompt template
    const promptTemplate = fs.readFileSync(path.join(__dirname, '../prompts/fix_prompt.txt'), 'utf8');
    const prompt = promptTemplate
        .replace('{{ISSUE_BODY}}', issueBody)
        .replace('{{CODEBASE}}', codebaseContext);

    // 3. Call OpenAI
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: isOpenRouter ? 'google/gemini-2.0-flash-exp:free' :
                isCerebras ? 'llama3.1-8b' : 'gpt-4o',
            max_tokens: 2000,
        });

        const responseContent = completion.choices[0].message.content;

        // 4. Parse Response and Generate Diff
        const diffs = [];
        // Regex to match "File: <path>" followed by code block
        const fileRegex = /File: (.*?)\n```[\w]*\n([\s\S]*?)```/g;
        let match;
        const fileContentMap = new Map();

        while ((match = fileRegex.exec(responseContent)) !== null) {
            const filePathRelative = match[1].trim();
            const newContent = match[2]; // Content inside code block
            fileContentMap.set(filePathRelative, newContent);
        }

        for (const [filePathRelative, newContent] of fileContentMap.entries()) {
            const originalFilePath = path.join(repoPath, filePathRelative);
            const tempFilePath = path.join(repoPath, `${filePathRelative}.new`);

            if (fs.existsSync(originalFilePath)) {
                fs.writeFileSync(tempFilePath, newContent);

                try {
                    // Generate diff using git
                    try {
                        execSync(`git diff --no-index --ignore-space-at-eol "${filePathRelative}" "${filePathRelative}.new"`, { cwd: repoPath });
                    } catch (e) {
                        // git diff exits with 1 when there is a diff
                        if (e.stdout) {
                            let diffOutput = e.stdout.toString();
                            // Fix the header to look like a standard git patch
                            // Escape regex special chars in filename
                            const escapedPath = filePathRelative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            diffOutput = diffOutput.replace(new RegExp(`b/${escapedPath}.new`, 'g'), `b/${filePathRelative}`);
                            diffs.push(diffOutput);
                        }
                    }
                } finally {
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                }
            } else {
                console.warn(`Skipping unknown file: ${filePathRelative}`);
            }
        }

        if (diffs.length > 0) {
            const fullPatch = diffs.join('\n');
            const patchPath = path.join(repoPath, 'patch.diff');
            fs.writeFileSync(patchPath, fullPatch);
            console.log(`Patch written to ${patchPath}`);
        } else {
            console.error('No changes detected or failed to parse AI response.');
            console.log('Response:', responseContent);
        }

    } catch (error) {
        console.error('Error calling OpenAI:', error);
        process.exit(1);
    }
}

function readRepo(dir, fileList = [], rootDir = dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== '.git' && file !== 'node_modules') {
                readRepo(filePath, fileList, rootDir);
            }
        } else {
            // Simple filter for text files
            if (['.js', '.ts', '.md', '.json', '.html', '.css', '.txt'].includes(path.extname(file))) {
                const content = fs.readFileSync(filePath, 'utf8');
                fileList.push({
                    path: path.relative(rootDir, filePath),
                    content: content
                });
            }
        }
    }
    return fileList;
}

main();
