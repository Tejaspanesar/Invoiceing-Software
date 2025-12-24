// github-storage.js - Simplified version
class GitHubStorage {
    constructor() {
        this.username = '';
        this.repo = '';
        this.branch = 'main';
        this.token = '';
        this.dataPath = 'user-data/';
    }
    
    isValidConfig() {
        return this.token && this.username && this.repo;
    }
    
    // SIMPLIFIED: Always create file, don't check SHA first
    async saveUserData(userEmail, data) {
        if (!this.isValidConfig()) {
            return { 
                success: false, 
                message: 'Please configure GitHub settings first' 
            };
        }
        
        // Create filename
        const safeEmail = userEmail.replace(/[@.]/g, '-').toLowerCase();
        const fileName = `${safeEmail}.json`;
        const filePath = `${this.dataPath}${fileName}`;
        
        // Prepare data
        const content = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        console.log('Saving to GitHub:', {
            repo: `${this.username}/${this.repo}`,
            file: filePath,
            email: userEmail
        });
        
        try {
            // FIRST: Ensure directory exists
            await this.createDataDirectory();
            
            // SECOND: Create or update the file
            // We'll try to get the SHA first, but handle errors gracefully
            let sha = null;
            
            try {
                const existingFile = await this.getFileSHA(filePath);
                if (existingFile && existingFile.sha) {
                    sha = existingFile.sha;
                    console.log('Found existing file with SHA:', sha);
                }
            } catch (error) {
                console.log('File does not exist or error getting SHA:', error.message);
                // Continue without SHA - will create new file
            }
            
            // Prepare request
            const requestBody = {
                message: `GST Invoice System: ${userEmail} - ${new Date().toISOString()}`,
                content: encodedContent,
                branch: this.branch
            };
            
            // Add SHA if we have it (for update)
            if (sha) {
                requestBody.sha = sha;
            }
            
            // Make the API call
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${filePath}`,
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
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ GitHub save successful');
                return { 
                    success: true, 
                    message: 'Data synced to GitHub successfully!',
                    data: result 
                };
            } else {
                console.error('❌ GitHub save failed:', {
                    status: response.status,
                    message: result.message,
                    errors: result.errors
                });
                
                // Handle specific errors
                let errorMessage = result.message || 'Failed to save to GitHub';
                
                if (response.status === 409) {
                    errorMessage = 'File conflict. Please try syncing again.';
                    // The 409 usually means the SHA was wrong - file was modified
                    // We could retry with fresh SHA, but for simplicity just report error
                } else if (response.status === 404) {
                    errorMessage = 'Repository or path not found. Check your configuration.';
                }
                
                return { 
                    success: false, 
                    message: errorMessage,
                    status: response.status,
                    error: result 
                };
            }
            
        } catch (error) {
            console.error('Network error:', error);
            return { 
                success: false, 
                message: 'Network error: ' + error.message 
            };
        }
    }
    
    // Get file SHA (simplified)
    async getFileSHA(filePath) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${filePath}?ref=${this.branch}`,
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
    
    // Create data directory if it doesn't exist
    async createDataDirectory() {
        try {
            // Check if directory exists
            const checkResponse = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (checkResponse.status === 404) {
                // Directory doesn't exist - create a README file
                const readmeContent = '# User Data\n\nThis directory contains user data for the GST Invoice System.';
                const encodedContent = btoa(unescape(encodeURIComponent(readmeContent)));
                
                const createResponse = await fetch(
                    `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}README.md`,
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
                
                if (createResponse.ok) {
                    console.log('✅ Created data directory');
                }
            }
        } catch (error) {
            console.log('Directory check/create failed:', error.message);
        }
    }
    
    // Load user data
    async loadUserData(userEmail) {
        if (!this.isValidConfig()) {
            console.log('GitHub config not set');
            return null;
        }
        
        const safeEmail = userEmail.replace(/[@.]/g, '-').toLowerCase();
        const fileName = `${safeEmail}.json`;
        
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${fileName}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.status === 404) {
                console.log('No data found for user');
                return null;
            }
            
            if (!response.ok) {
                console.error('Load failed:', response.status);
                return null;
            }
            
            const fileData = await response.json();
            const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
            return JSON.parse(decodedContent);
            
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    }
    
    // Test connection
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
                const repoInfo = await response.json();
                return { 
                    success: true, 
                    message: `Connected to ${repoInfo.full_name}`,
                    data: repoInfo
                };
            } else {
                const error = await response.json();
                return { 
                    success: false, 
                    message: `Error ${response.status}: ${error.message}`,
                    status: response.status
                };
            }
        } catch (error) {
            return { success: false, message: 'Network error: ' + error.message };
        }
    }
    
    // List files in data directory
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
                const files = await response.json();
                return files.filter(file => file.name !== 'README.md');
            }
            return [];
        } catch (error) {
            console.error('List files error:', error);
            return [];
        }
    }
    
    // Force create (ignore conflicts)
    async forceCreate(userEmail, data) {
        if (!this.isValidConfig()) {
            return { success: false, message: 'Configuration incomplete' };
        }
        
        const safeEmail = userEmail.replace(/[@.]/g, '-').toLowerCase();
        const fileName = `${safeEmail}.json`;
        
        // Create unique filename with timestamp to avoid conflicts
        const uniqueFileName = `${safeEmail}-${Date.now()}.json`;
        
        const content = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        try {
            await this.createDataDirectory();
            
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${this.dataPath}${uniqueFileName}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Backup: ${userEmail} - ${new Date().toISOString()}`,
                        content: encodedContent,
                        branch: this.branch
                    })
                }
            );
            
            const result = await response.json();
            
            if (response.ok) {
                return { 
                    success: true, 
                    message: `Created backup file: ${uniqueFileName}`,
                    data: result,
                    fileName: uniqueFileName
                };
            } else {
                return { 
                    success: false, 
                    message: result.message || 'Failed to create backup',
                    error: result 
                };
            }
        } catch (error) {
            return { success: false, message: 'Error: ' + error.message };
        }
    }
    
    // Load data for any user (used for login)
    async loadAnyUserData() {
        if (!this.isValidConfig()) {
            console.log('GitHub config not set');
            return null;
        }
        
        try {
            // List all files in data directory
            const files = await this.listDataFiles();
            
            if (files.length === 0) {
                return null;
            }
            
            // Load the first user file we find
            const firstFile = files[0];
            const response = await fetch(
                `https://api.github.com/repos/${this.username}/${this.repo}/contents/${firstFile.path}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (response.ok) {
                const fileData = await response.json();
                const decodedContent = decodeURIComponent(escape(atob(fileData.content)));
                return JSON.parse(decodedContent);
            }
            
            return null;
        } catch (error) {
            console.error('Load any user error:', error);
            return null;
        }
    }
}

// Global instance
const githubStorage = new GitHubStorage();
