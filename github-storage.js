// Update these GitHub functions in your settings.html JavaScript:

async function testGitHubConnection() {
    const username = document.getElementById('githubUsername').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    
    if (!username || !repo || !token) {
        showAlert('Please fill in all GitHub configuration fields', 'warning');
        return;
    }
    
    // IMPORTANT: GitHub usernames are CASE-SENSITIVE!
    // Use exactly the same case as your GitHub username
    githubStorage.username = username;
    githubStorage.repo = repo;
    githubStorage.token = token;
    
    const statusElement = document.getElementById('githubStatus');
    const statusText = document.getElementById('githubStatusText');
    statusElement.style.display = 'flex';
    statusElement.className = 'alert alert-info';
    statusText.textContent = 'Testing connection to GitHub...';
    
    try {
        const result = await githubStorage.testConnection();
        
        if (result.success) {
            statusElement.className = 'alert alert-success';
            statusText.textContent = result.message;
            showAlert('✓ GitHub connection successful!', 'success');
            
            // Save the configuration
            saveGitHubConfig();
            
            // Test if we can access/write to the data directory
            const accessCheck = await githubStorage.checkRepositoryAccess();
            console.log('Repository access check:', accessCheck);
            
        } else {
            statusElement.className = 'alert alert-danger';
            statusText.textContent = result.message;
            showAlert('✗ GitHub connection failed: ' + result.message, 'danger');
        }
    } catch (error) {
        statusElement.className = 'alert alert-danger';
        statusText.textContent = 'Error: ' + error.message;
        showAlert('Connection error: ' + error.message, 'danger');
    }
}

async function syncToGitHub() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.email) {
        showAlert('Please log in first', 'warning');
        return;
    }
    
    // Get configuration from form
    const username = document.getElementById('githubUsername').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    
    if (!username || !repo || !token) {
        showAlert('Please configure GitHub settings first', 'warning');
        return;
    }
    
    // Update the global githubStorage object
    githubStorage.username = username;
    githubStorage.repo = repo;
    githubStorage.token = token;
    
    const statusElement = document.getElementById('githubStatus');
    const statusText = document.getElementById('githubStatusText');
    statusElement.style.display = 'flex';
    statusElement.className = 'alert alert-info';
    statusText.textContent = 'Syncing data to GitHub...';
    
    try {
        // First, test the connection
        const connectionTest = await githubStorage.testConnection();
        if (!connectionTest.success) {
            statusElement.className = 'alert alert-danger';
            statusText.textContent = 'Connection failed: ' + connectionTest.message;
            showAlert('Cannot sync: ' + connectionTest.message, 'danger');
            return;
        }
        
        // Prepare all data to sync
        const allData = {
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            inventory: JSON.parse(localStorage.getItem('inventory') || '[]'),
            shopProfile: JSON.parse(localStorage.getItem('shopProfile') || '{}'),
            users: JSON.parse(localStorage.getItem('gstInvoiceUsers') || '[]'),
            settings: {
                theme: localStorage.getItem('themePreference'),
                invoiceDefaults: JSON.parse(localStorage.getItem('invoiceDefaults') || '{}'),
                nextInvoiceNumber: localStorage.getItem('nextInvoiceNumber'),
                darkMode: localStorage.getItem('darkMode'),
                githubConfig: {
                    username: username,
                    repo: repo,
                    token: '***', // Don't save the actual token
                    savedAt: new Date().toISOString()
                }
            },
            metadata: {
                syncTime: new Date().toISOString(),
                userEmail: currentUser.email,
                appVersion: '1.0.0'
            }
        };
        
        console.log('Attempting to sync data to GitHub...');
        
        // Try simple save first if regular save fails
        let result = await githubStorage.saveUserData(currentUser.email, allData);
        
        if (!result.success && result.status === 404) {
            // If 404, try creating directory and saving again
            console.log('Trying alternative save method...');
            result = await githubStorage.simpleSave(currentUser.email, allData);
        }
        
        if (result.success) {
            statusElement.className = 'alert alert-success';
            statusText.textContent = result.message;
            
            // Update last sync time
            const now = new Date();
            document.getElementById('lastSyncTime').textContent = now.toLocaleString();
            
            // Update saved config with last sync time
            const savedConfig = JSON.parse(localStorage.getItem('githubConfig') || '{}');
            savedConfig.lastSync = now.toISOString();
            savedConfig.username = username;
            savedConfig.repo = repo;
            savedConfig.token = token; // Save token (it's already in localStorage anyway)
            localStorage.setItem('githubConfig', JSON.stringify(savedConfig));
            
            showAlert('✓ Data synced to GitHub successfully!', 'success');
        } else {
            statusElement.className = 'alert alert-danger';
            statusText.textContent = result.message;
            showAlert('✗ Sync failed: ' + result.message, 'danger');
        }
    } catch (error) {
        statusElement.className = 'alert alert-danger';
        statusText.textContent = 'Error: ' + error.message;
        showAlert('Sync error: ' + error.message, 'danger');
    }
}

// Add a debug function
async function debugGitHubSetup() {
    const username = document.getElementById('githubUsername').value.trim() || 'tejaspanesar';
    const repo = document.getElementById('githubRepo').value.trim() || 'Invoiceing-Software';
    const token = document.getElementById('githubToken').value.trim();
    
    if (!token) {
        showAlert('Please enter your GitHub token', 'warning');
        return;
    }
    
    console.log('=== GitHub Debug Information ===');
    console.log('Username:', username);
    console.log('Repository:', repo);
    console.log('Token exists:', !!token);
    console.log('Token length:', token.length);
    console.log('Repository URL:', `https://github.com/${username}/${repo}`);
    console.log('API URL:', `https://api.github.com/repos/${username}/${repo}`);
    
    githubStorage.username = username;
    githubStorage.repo = repo;
    githubStorage.token = token;
    
    // Test direct API call
    try {
        const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        console.log('Direct API Response Status:', response.status);
        
        if (response.ok) {
            const repoData = await response.json();
            console.log('Repository Data:', repoData);
            showAlert(`✓ Repository found: ${repoData.full_name}`, 'success');
        } else {
            const error = await response.json();
            console.log('API Error:', error);
            showAlert(`✗ Error ${response.status}: ${error.message}`, 'danger');
        }
    } catch (error) {
        console.log('Network Error:', error);
        showAlert('Network error: ' + error.message, 'danger');
    }
}
