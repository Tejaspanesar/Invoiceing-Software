# Invoiceing-Software
## ☁️ Cloud Sync Feature

This app supports cross-device sync using GitHub:

### Setup Instructions:
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Create new token with `repo`, `write:packages`, `delete:packages` permissions
3. Copy the token
4. In the app, go to Settings → Cloud Sync
5. Enter your GitHub username, repository name, and token
6. Click "Save Configuration" then "Test Connection"

### How it works:
- Your data is stored in a private `user-data/` folder in your GitHub repository
- Each user's data is encrypted with their email as filename
- Click "Sync to Cloud" to upload, "Load from Cloud" to download
- Auto-sync happens when you save invoices or inventory

### Privacy:
- Only you can access your data (with your token)
- Data is not publicly accessible
- You own all your data
