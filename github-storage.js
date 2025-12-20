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
            
            // First, check if file already exists
            const existingFile = await this.getFileInfo(fileName);
            
            let response;
            
            if (existingFile && existingFile.sha) {
                // Update existing file
                response = await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Update GST Invoice data for ${userEmail}`,
                            content: encodedContent,
                            sha: existingFile.sha,  // Required for updates
                            branch: this.branch
                        })
                    }
                );
            } else {
                // Create new file
                response = await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Create GST Invoice data for ${userEmail}`,
                            content: encodedContent,
                            branch: this.branch
                        })
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
                return { 
                    success: false, 
                    message: result.message || 'Failed to save to GitHub',
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
            }
            return null;
        } catch (error) {
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
                return { success: false, message: error.message || 'Connection failed' };
            }
        } catch (error) {
            return { success: false, message: 'Network error: ' + error.message };
        }
    }
}

// Create global instance
const githubStorage = new GitHubStorage();