// github-storage.js
class GitHubStorage {
    constructor() {
        // These will be set by user in settings
        this.username = '';
        this.repo = '';
        this.branch = 'main';  // Usually 'main' or 'master'
        this.token = '';
        this.dataPath = 'user-data/';  // Folder in your repo for data
    }
    
    // Test if configuration is valid
    isValidConfig() {
        return this.token && this.username && this.repo;
    }
    
    // Save user data to GitHub
    async saveUserData(userEmail, data) {
        if (!this.isValidConfig()) {
            return { 
                success: false, 
                message: 'Please configure GitHub settings first' 
            };
        }
        
        // Create filename from user email (replace @ and . with -)
        const safeEmail = userEmail.replace(/[@.]/g, '-');
        const fileName = `${safeEmail}.json`;
        
        // Convert data to JSON and encode for GitHub
        const content = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        try {
            console.log('Saving to GitHub:', { userEmail, fileName });
            
            // Try to get file info first
            const fileInfo = await this.getFileInfo(fileName);
            
            let response;
            let requestBody;
            
            if (fileInfo && fileInfo.sha) {
                // Update existing file
                requestBody = {
                    message: `Update GST Invoice data for ${userEmail} on ${new Date().toLocaleString()}`,
                    content: encodedContent,
                    sha: fileInfo.sha,
                    branch: this.branch
                };
                
                response = await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    }
                );
            } else {
                // Create new file - first ensure directory exists
                await this.ensureDataDirectoryExists();
                
                requestBody = {
                    message: `Create GST Invoice data for ${userEmail} on ${new Date().toLocaleString()}`,
                    content: encodedContent,
                    branch: this.branch
                };
                
                response = await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    }
                );
            }
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('GitHub save successful:', result);
                return { 
                    success: true, 
                    message: 'Data synced to GitHub successfully!',
                    data: result 
                };
            } else {
                console.error('GitHub save failed:', result);
                
                // Handle specific error cases
                let errorMessage = result.message || 'Failed to save to GitHub';
                
                if (result.message && result.message.includes('409')) {
                    errorMessage = 'File conflict. Try syncing again.';
                } else if (result.message && result.message.includes('404')) {
                    errorMessage = 'Repository not found or incorrect path. Check your repository name.';
                } else if (result.message && result.message.includes('401')) {
                    errorMessage = 'Invalid token. Please check your GitHub token.';
                } else if (result.message && result.message.includes('403')) {
                    errorMessage = 'Permission denied. Check token permissions.';
                }
                
                return { 
                    success: false, 
                    message: errorMessage,
                    error: result 
                };
            }
            
        } catch (error) {
            console.error('GitHub save error:', error);
            return { 
                success: false, 
                message: 'Network error: ' + error.message 
            };
        }
    }
    
    // Ensure data directory exists
    async ensureDataDirectoryExists() {
        try {
            // Try to create the directory by creating a placeholder file
            const placeholderFile = 'README.md';
            const placeholderContent = '# User Data Directory\n\nThis directory stores user data for GST Invoice System.';
            const encodedContent = btoa(unescape(encodeURIComponent(placeholderContent)));
            
            // Check if directory already exists by trying to list it
            const dirCheck = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (dirCheck.status === 404) {
                // Directory doesn't exist, create it
                await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${placeholderFile}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: 'Create user data directory',
                            content: encodedContent,
                            branch: this.branch
                        })
                    }
                );
                console.log('Created data directory');
            }
        } catch (error) {
            console.log('Directory check/create failed, continuing:', error.message);
        }
    }
    
    // Load user data from GitHub
    async loadUserData(userEmail) {
        if (!this.isValidConfig()) {
            console.log('GitHub config not set');
            return null;
        }
        
        const safeEmail = userEmail.replace(/[@.]/g, '-');
        const fileName = `${safeEmail}.json`;
        
        try {
            console.log('Loading from GitHub:', { userEmail, fileName });
            
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}?ref=${this.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.status === 404) {
                console.log('No data found on GitHub for this user');
                return null;
            }
            
            if (!response.ok) {
                console.error('GitHub load failed:', response.status);
                return null;
            }
            
            const fileData = await response.json();
            
            // Decode content from base64
            const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
            const data = JSON.parse(decodedContent);
            
            console.log('GitHub load successful');
            return data;
            
        } catch (error) {
            console.error('GitHub load error:', error);
            return null;
        }
    }
    
    // Get file info (to check if exists and get SHA)
    async getFileInfo(fileName) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}?ref=${this.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                return await response.json();
            } else if (response.status === 404) {
                return null; // File doesn't exist
            }
            return null;
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }
    
    // Test connection to GitHub
    async testConnection() {
        if (!this.isValidConfig()) {
            return { success: false, message: 'Configuration incomplete' };
        }
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                return { success: true, message: 'Connected to GitHub successfully!' };
            } else {
                const error = await response.json();
                let errorMessage = error.message || 'Connection failed';
                
                // Provide more helpful error messages
                if (response.status === 404) {
                    errorMessage = `Repository "${this.username}/${this.repo}" not found. Please check the repository name.`;
                } else if (response.status === 401) {
                    errorMessage = 'Invalid token. Please check your GitHub Personal Access Token.';
                } else if (response.status === 403) {
                    errorMessage = 'Permission denied. Token may not have sufficient permissions.';
                }
                
                return { success: false, message: errorMessage };
            }
        } catch (error) {
            return { success: false, message: 'Network error: ' + error.message };
        }
    }
    
    // List files in data directory (for debugging)
    async listDataFiles() {
        if (!this.isValidConfig()) {
            return [];
        }
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }
}

// Create global instance
const githubStorage = new GitHubStorage();
