const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const TOKEN = process.env.MY_GITEE_TOKEN;
const RELEASE_DIR = path.join(process.cwd(), 'release');

if (!TOKEN) {
    console.error('Error: MY_GITEE_TOKEN environment variable is not set.');
    process.exit(1);
}

// Helper: Get Repo Info
function getRepoInfo() {
    // Priority 1: GITEE_REPO env var (e.g. "owner/repo")
    if (process.env.GITEE_REPO) {
        return process.env.GITEE_REPO;
    }
    // Priority 2: Parse from GITEE_REPO_URL
    const repoUrl = process.env.GITEE_REPO_URL;
    if (repoUrl) {
        // e.g. https://gitee.com/username/project.git
        const match = repoUrl.match(/gitee\.com\/([^/]+\/[^/.]+)/);
        if (match) {
            let repo = match[1];
            if (repo.endsWith('.git')) repo = repo.slice(0, -4);
            return repo;
        }
    }
    
    console.error('Error: Could not determine repository info from environment variables.');
    process.exit(1);
}

const REPO = getRepoInfo();
console.log(`Repository: ${REPO}`);

// Helper: Get Version
function getVersion() {
    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
        console.error('Error: package.json not found.');
        process.exit(1);
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version;
}

const VERSION = getVersion();
const TAG_NAME = `v${VERSION}`;
console.log(`Version: ${VERSION}, Tag: ${TAG_NAME}`);

// Helper: HTTPS Request
function request(method, apiPath, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        // Construct path with access_token
        let fullPath = `/api/v5/repos/${REPO}${apiPath}`;
        if (!fullPath.includes('?')) {
            fullPath += `?access_token=${TOKEN}`;
        } else {
            fullPath += `&access_token=${TOKEN}`;
        }

        const options = {
            hostname: 'gitee.com',
            path: fullPath,
            method: method,
            headers: {
                'User-Agent': 'Node.js-Script',
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (e) {
                        resolve(body);
                    }
                } else {
                    // Try to parse error message
                    try {
                        const err = JSON.parse(body);
                        reject(new Error(`Request failed (${res.statusCode}): ${err.message || body}`));
                    } catch {
                        reject(new Error(`Request failed (${res.statusCode}): ${body}`));
                    }
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 1. Create Release
async function createRelease() {
    console.log('Checking/Creating release...');
    try {
        // Check if release exists by tag
        // Gitee API: GET /repos/{owner}/{repo}/releases/tags/{tag}
        // Note: If tag doesn't exist, this returns 404
        try {
            // We use a custom request here to handle 404 gracefully
            const release = await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'gitee.com',
                    path: `/api/v5/repos/${REPO}/releases/tags/${TAG_NAME}?access_token=${TOKEN}`,
                    method: 'GET',
                    headers: { 'User-Agent': 'Node.js-Script' }
                }, res => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        if (res.statusCode === 200) resolve(JSON.parse(body));
                        else reject(new Error(res.statusCode));
                    });
                });
                req.on('error', reject);
                req.end();
            });
            
            console.log('Release already exists. ID:', release.id);
            return release.id;
        } catch (e) {
            // Proceed to create
        }

        const payload = {
            tag_name: TAG_NAME,
            name: `Release ${TAG_NAME}`,
            body: `Release ${TAG_NAME} build by Gitee Go`,
            prerelease: false,
            target_commitish: process.env.GITEE_COMMIT || 'main'
        };

        const res = await request('POST', '/releases', payload);
        console.log('Release created. ID:', res.id);
        return res.id;
    } catch (e) {
        console.error('Failed to create release:', e.message);
        process.exit(1);
    }
}

// Helper: Upload File (Multipart)
function uploadFile(releaseId, filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        
        const options = {
            hostname: 'gitee.com',
            path: `/api/v5/repos/${REPO}/releases/${releaseId}/attach_files?access_token=${TOKEN}`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`Uploaded ${fileName} successfully.`);
                    resolve();
                } else {
                    reject(new Error(`Upload failed for ${fileName} (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));

        const fileContent = fs.readFileSync(filePath);
        
        // Header
        req.write(`--${boundary}\r\n`);
        req.write(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
        req.write('Content-Type: application/octet-stream\r\n\r\n');
        
        // Body
        req.write(fileContent);
        
        // Footer
        req.write(`\r\n--${boundary}--\r\n`);
        
        req.end();
    });
}

// Main Flow
async function run() {
    try {
        const releaseId = await createRelease();
        
        if (!fs.existsSync(RELEASE_DIR)) {
            console.error(`Release directory not found: ${RELEASE_DIR}`);
            // Don't fail the build, just skip upload
            return;
        }

        const files = fs.readdirSync(RELEASE_DIR);
        for (const file of files) {
            // Upload .exe, .yml, .zip, .dmg, .AppImage, etc.
            if (file.match(/\.(exe|yml|zip|dmg|AppImage|blockmap)$/)) {
                const filePath = path.join(RELEASE_DIR, file);
                console.log(`Uploading ${file}...`);
                try {
                    await uploadFile(releaseId, filePath);
                } catch (e) {
                    console.error(`Failed to upload ${file}: ${e.message}`);
                }
            }
        }
        console.log('Gitee release process completed.');
    } catch (e) {
        console.error('Unexpected error:', e);
        process.exit(1);
    }
}

run();
