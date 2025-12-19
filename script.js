// ============================================
// GLOBAL VARIABLES AND STORAGE
// ============================================

// User Data Storage
let users = JSON.parse(localStorage.getItem('gstInvoiceUsers')) || [
    {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        businessName: 'ABC Technologies Pvt Ltd',
        phone: '+91 9876543210',
        gstin: '27AABCU9603R1ZX',
        address: '123 Tech Park, Bangalore',
        role: 'admin',
        createdAt: '2024-01-01',
        isActive: true,
        theme: 'light',
        securityQuestion: 'What is your pet\'s name?',
        securityAnswer: 'fluffy'
    }
];

// Password Reset Tokens Storage
let resetTokens = JSON.parse(localStorage.getItem('resetTokens')) || [];

// Current User
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// Inventory Data Storage
let inventory = JSON.parse(localStorage.getItem('inventory')) || [
    {
        id: 1,
        code: 'PROD-001',
        name: 'Wireless Mouse',
        category: 'Electronics',
        stock: 45,
        price: 899,
        gstRate: 18,
        description: 'Wireless optical mouse with 2.4GHz connectivity',
        lowStockThreshold: 10,
        lastUpdated: '2024-01-15'
    },
    {
        id: 2,
        code: 'PROD-002',
        name: 'Laptop Stand',
        category: 'Accessories',
        stock: 12,
        price: 1499,
        gstRate: 18,
        description: 'Adjustable aluminum laptop stand',
        lowStockThreshold: 10,
        lastUpdated: '2024-01-14'
    },
    {
        id: 3,
        code: 'PROD-003',
        name: 'USB-C Cable',
        category: 'Cables',
        stock: 0,
        price: 399,
        gstRate: 12,
        description: '3ft USB-C to USB-C charging cable',
        lowStockThreshold: 10,
        lastUpdated: '2024-01-10'
    },
    {
        id: 4,
        code: 'PROD-004',
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        stock: 78,
        price: 3499,
        gstRate: 18,
        description: 'RGB mechanical keyboard with blue switches',
        lowStockThreshold: 10,
        lastUpdated: '2024-01-12'
    }
];

// Invoice Data Storage
let invoices = JSON.parse(localStorage.getItem('invoices')) || [
    {
        id: 1,
        invoiceNumber: 'INV-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-15',
        customer: {
            name: 'ABC Technologies',
            gstin: '27AABCU9603R1ZX',
            email: 'accounts@abctech.com',
            phone: '+91 9876543210',
            address: '123 Business Street, Mumbai'
        },
        items: [
            { name: 'Web Development', description: 'Custom website development', quantity: 1, price: 25000, gst: 18 },
            { name: 'Hosting', description: 'Annual hosting package', quantity: 1, price: 5000, gst: 18 },
            { name: 'Domain', description: 'Domain registration', quantity: 1, price: 899, gst: 18 }
        ],
        subtotal: 30899,
        gstTotal: 5561.82,
        grandTotal: 36460.82,
        status: 'paid',
        paymentMethod: 'Bank Transfer',
        notes: 'Thank you for your business!'
    }
];

// Deletion Queue Storage
let deletionQueue = JSON.parse(localStorage.getItem('deletionQueue')) || [];

// Invoice Creation Variables (from second script)
let currentGstType = 'sgst-cgst';
let shopProfile = {};
let nextInvoiceNumber = 1;

// Save data to localStorage
function saveUsers() {
    localStorage.setItem('gstInvoiceUsers', JSON.stringify(users));
}

function saveResetTokens() {
    localStorage.setItem('resetTokens', JSON.stringify(resetTokens));
}

function saveInventory() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function saveInvoices() {
    localStorage.setItem('invoices', JSON.stringify(invoices));
}

function saveDeletionQueue() {
    localStorage.setItem('deletionQueue', JSON.stringify(deletionQueue));
}

// ============================================
// PASSWORD RESET SYSTEM
// ============================================

// Generate reset token
function generateResetToken(email) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    resetTokens = resetTokens.filter(t => t.email !== email);
    
    resetTokens.push({
        email: email,
        token: token,
        expiry: expiry.toISOString(),
        used: false
    });
    
    saveResetTokens();
    return token;
}

// Validate reset token
function validateResetToken(email, token) {
    const resetToken = resetTokens.find(t => 
        t.email === email && 
        t.token === token && 
        !t.used && 
        new Date(t.expiry) > new Date()
    );
    
    return resetToken !== undefined;
}

// Mark token as used
function markTokenAsUsed(email, token) {
    const tokenIndex = resetTokens.findIndex(t => t.email === email && t.token === token);
    if (tokenIndex !== -1) {
        resetTokens[tokenIndex].used = true;
        saveResetTokens();
    }
}

// Send password reset email (simulated)
function sendPasswordResetEmail(email, token) {
    const resetLink = `${window.location.origin}/reset-password.html?email=${encodeURIComponent(email)}&token=${token}`;
    
    localStorage.setItem('lastResetLink', resetLink);
    localStorage.setItem('lastResetEmail', email);
    localStorage.setItem('lastResetToken', token);
    
    console.log('Password Reset Email Sent:');
    console.log('To:', email);
    console.log('Reset Link:', resetLink);
    console.log('Token:', token);
    
    return {
        success: true,
        email: email,
        token: token,
        resetLink: resetLink
    };
}

// Request password reset
function requestPasswordReset(email) {
    const user = users.find(u => u.email === email && u.isActive);
    
    if (!user) {
        return { success: false, message: 'No account found with this email address.' };
    }
    
    const token = generateResetToken(email);
    const emailResult = sendPasswordResetEmail(email, token);
    
    return {
        success: true,
        message: 'Password reset instructions have been sent to your email.',
        data: emailResult
    };
}

// Reset password with token
function resetPasswordWithToken(email, token, newPassword) {
    if (!validateResetToken(email, token)) {
        return { success: false, message: 'Invalid or expired reset token.' };
    }
    
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    
    users[userIndex].password = newPassword;
    saveUsers();
    
    markTokenAsUsed(email, token);
    localStorage.removeItem('lastResetLink');
    localStorage.removeItem('lastResetToken');
    
    return { success: true, message: 'Password has been reset successfully!' };
}

// Change password (when logged in)
function changePassword(currentPassword, newPassword) {
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to change password.' };
    }
    
    if (currentUser.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
    }
    
    if (checkPasswordStrength(newPassword) < 3) {
        return { success: false, message: 'Please use a stronger password.' };
    }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        saveUsers();
        
        currentUser.password = newPassword;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        return { success: true, message: 'Password changed successfully!' };
    }
    
    return { success: false, message: 'User not found.' };
}

// Update security question
function updateSecurityQuestion(question, answer) {
    if (!currentUser) {
        return { success: false, message: 'You must be logged in to update security question.' };
    }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].securityQuestion = question;
        users[userIndex].securityAnswer = answer.toLowerCase().trim();
        saveUsers();
        
        currentUser.securityQuestion = question;
        currentUser.securityAnswer = answer.toLowerCase().trim();
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        return { success: true, message: 'Security question updated successfully!' };
    }
    
    return { success: false, message: 'User not found.' };
}

// Verify security answer
function verifySecurityAnswer(email, answer) {
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return { success: false, message: 'User not found.' };
    }
    
    if (!user.securityQuestion || !user.securityAnswer) {
        return { success: false, message: 'Security question not set for this account.' };
    }
    
    if (user.securityAnswer === answer.toLowerCase().trim()) {
        return { success: true };
    }
    
    return { success: false, message: 'Incorrect security answer.' };
}

// ============================================
// AUTHENTICATION SYSTEM
// ============================================

// Register new user
function registerUser(userData) {
    const existingUser = users.find(user => user.email === userData.email);
    if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
    }
    
    const newUser = {
        id: users.length + 1,
        ...userData,
        role: 'user',
        createdAt: new Date().toISOString().split('T')[0],
        isActive: true,
        theme: 'light',
        securityQuestion: userData.securityQuestion || 'What is your pet\'s name?',
        securityAnswer: userData.securityAnswer ? userData.securityAnswer.toLowerCase().trim() : 'fluffy'
    };
    
    users.push(newUser);
    saveUsers();
    return { success: true, message: 'Registration successful! Please login.' };
}

// Login user
function loginUser(email, password) {
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('isLoggedIn', 'true');
        return { success: true, user };
    }
    
    return { success: false, message: 'Invalid email or password' };
}

// Logout user
function logoutUser() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
}

// Delete user account
function deleteUserAccount(email, password) {
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    
    if (users[userIndex].password !== password) {
        return { success: false, message: 'Incorrect password.' };
    }
    
    // Mark user as inactive
    users[userIndex].isActive = false;
    users[userIndex].deletedAt = new Date().toISOString().split('T')[0];
    saveUsers();
    
    // Remove user from session
    if (currentUser && currentUser.email === email) {
        logoutUser();
    }
    
    return { success: true, message: 'Account deleted successfully.' };
}

// Check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

// Redirect to login if not authenticated
function requireAuth() {
    const publicPages = ['login.html', 'register.html', 'forgot-password.html', 'reset-password.html', 'index.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!isLoggedIn() && !publicPages.includes(currentPage)) {
        window.location.href = 'login.html';
    }
}

// ============================================
// ACCOUNT DELETION SYSTEM
// ============================================

// Schedule account deletion
function scheduleAccountDeletion(email, password, confirmEmail, confirmationText) {
    // Validate inputs
    if (email !== confirmEmail) {
        return { success: false, message: 'Email addresses do not match.' };
    }
    
    if (confirmationText !== 'DELETE') {
        return { success: false, message: 'Confirmation text must be exactly "DELETE".' };
    }
    
    const user = users.find(u => u.email === email && u.isActive);
    
    if (!user) {
        return { success: false, message: 'User not found.' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Incorrect password.' };
    }
    
    // Schedule deletion (immediate for demo)
    const deletionId = 'DEL-' + Date.now();
    const deletionData = {
        id: deletionId,
        email: email,
        scheduledAt: new Date().toISOString(),
        status: 'pending'
    };
    
    deletionQueue.push(deletionData);
    saveDeletionQueue();
    
    return {
        success: true,
        message: 'Account deletion scheduled successfully.',
        deletionId: deletionId,
        data: deletionData
    };
}

// Process account deletion
async function processAccountDeletion(deletionId, onProgress) {
    const deletionIndex = deletionQueue.findIndex(d => d.id === deletionId);
    
    if (deletionIndex === -1) {
        return { success: false, message: 'Deletion request not found.' };
    }
    
    const deletion = deletionQueue[deletionIndex];
    const userIndex = users.findIndex(u => u.email === deletion.email);
    
    if (userIndex === -1) {
        deletionQueue[deletionIndex].status = 'failed';
        deletionQueue[deletionIndex].error = 'User not found';
        saveDeletionQueue();
        return { success: false, message: 'User not found.' };
    }
    
    try {
        // Step 1: Update status
        onProgress?.(10, 'Starting deletion process...');
        deletionQueue[deletionIndex].status = 'processing';
        saveDeletionQueue();
        
        // Step 2: Remove user data (simulated delay)
        await new Promise(resolve => setTimeout(resolve, 1000));
        onProgress?.(30, 'Removing user account...');
        
        users[userIndex].isActive = false;
        users[userIndex].deletedAt = new Date().toISOString().split('T')[0];
        saveUsers();
        
        // Step 3: Remove user invoices (simulated)
        await new Promise(resolve => setTimeout(resolve, 800));
        onProgress?.(50, 'Deleting invoices...');
        
        const userInvoices = invoices.filter(inv => 
            inv.customer.email === deletion.email || 
            inv.createdBy === deletion.email
        );
        
        // Step 4: Remove user inventory (simulated)
        await new Promise(resolve => setTimeout(resolve, 600));
        onProgress?.(70, 'Clearing inventory...');
        
        // Step 5: Final cleanup
        await new Promise(resolve => setTimeout(resolve, 400));
        onProgress?.(90, 'Finalizing deletion...');
        
        // Mark deletion as complete
        deletionQueue[deletionIndex].status = 'completed';
        deletionQueue[deletionIndex].completedAt = new Date().toISOString();
        deletionQueue[deletionIndex].deletedCounts = {
            invoices: userInvoices.length,
            inventory: 0
        };
        saveDeletionQueue();
        
        onProgress?.(100, 'Deletion completed!');
        
        // Logout if current user
        if (currentUser && currentUser.email === deletion.email) {
            setTimeout(() => logoutUser(), 2000);
        }
        
        return {
            success: true,
            message: 'Account deleted successfully.',
            deletionId: deletionId
        };
        
    } catch (error) {
        deletionQueue[deletionIndex].status = 'failed';
        deletionQueue[deletionIndex].error = error.message;
        saveDeletionQueue();
        
        return {
            success: false,
            message: 'Deletion failed: ' + error.message,
            deletionId: deletionId
        };
    }
}

// Cancel scheduled deletion
function cancelAccountDeletion(deletionId) {
    const deletionIndex = deletionQueue.findIndex(d => d.id === deletionId);
    
    if (deletionIndex === -1) {
        return { success: false, message: 'Deletion request not found.' };
    }
    
    if (deletionQueue[deletionIndex].status === 'processing') {
        return { success: false, message: 'Cannot cancel deletion in progress.' };
    }
    
    deletionQueue.splice(deletionIndex, 1);
    saveDeletionQueue();
    
    return { success: true, message: 'Deletion cancelled successfully.' };
}

// ============================================
// FORGOT PASSWORD PAGES
// ============================================

// Initialize forgot password page
function initForgotPasswordPage() {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        const result = requestPasswordReset(email);
        
        if (result.success) {
            showResetTokenModal(email, result.data.token, result.data.resetLink);
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    const lastResetLink = localStorage.getItem('lastResetLink');
    if (lastResetLink) {
        const demoInfo = document.getElementById('demoResetInfo');
        if (demoInfo) {
            demoInfo.innerHTML = `
                <div class="alert alert-info">
                    <strong>Demo Reset Link:</strong><br>
                    <small>${lastResetLink}</small><br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="copyToClipboard('${lastResetLink}')">
                        Copy Reset Link
                    </button>
                </div>
            `;
        }
    }
}

// Initialize reset password page
function initResetPasswordPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const token = urlParams.get('token');
    
    const form = document.getElementById('resetPasswordForm');
    if (!form) return;
    
    if (email) {
        const emailField = document.getElementById('resetEmailField');
        if (emailField) {
            emailField.value = email;
        }
    }
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmailField').value;
        const token = document.getElementById('resetToken').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        if (checkPasswordStrength(newPassword) < 3) {
            showAlert('Please use a stronger password (at least 8 characters with letters and numbers)', 'warning');
            return;
        }
        
        const result = resetPasswordWithToken(email, token, newPassword);
        
        if (result.success) {
            showAlert(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    if (token) {
        const tokenField = document.getElementById('resetToken');
        if (tokenField) {
            tokenField.value = token;
        }
    }
}

// Show reset token modal (for demo)
function showResetTokenModal(email, token, resetLink) {
    const modalHTML = `
        <div class="modal" id="resetTokenModal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title text-primary">
                            <i class="fas fa-envelope"></i>
                            Password Reset Instructions
                        </h2>
                        <button class="btn-icon close-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            Password reset instructions have been sent to: <strong>${email}</strong>
                        </div>
                        
                        <div class="demo-reset-info">
                            <h4 class="mb-2">Demo Information:</h4>
                            <p>Since this is a demo without email backend, here are the reset details:</p>
                            
                            <div class="form-group">
                                <label class="form-label">Reset Token:</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="demoToken" value="${token}" readonly>
                                    <button class="btn btn-secondary" onclick="copyToClipboard('${token}')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Reset Link:</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="demoLink" value="${resetLink}" readonly>
                                    <button class="btn btn-secondary" onclick="copyToClipboard('${resetLink}')">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle"></i>
                                <strong>Next Steps:</strong>
                                <ol class="mt-2">
                                    <li>Copy the reset token or click the reset link</li>
                                    <li>You will be redirected to the password reset page</li>
                                    <li>Enter the token and your new password</li>
                                </ol>
                            </div>
                        </div>
                        
                        <div class="action-buttons mt-3">
                            <button class="btn btn-secondary close-modal">
                                Close
                            </button>
                            <button class="btn btn-primary" onclick="window.location.href='${resetLink}'">
                                <i class="fas fa-external-link-alt"></i> Go to Reset Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = document.getElementById('resetTokenModal');
            if (modal) modal.remove();
        });
    });
}

// ============================================
// SECURITY QUESTION SYSTEM
// ============================================

// Show security question modal for password reset
function showSecurityQuestionModal(email) {
    const user = users.find(u => u.email === email);
    
    if (!user || !user.securityQuestion) {
        const result = requestPasswordReset(email);
        if (result.success) {
            showResetTokenModal(email, result.data.token, result.data.resetLink);
        }
        return;
    }
    
    const modalHTML = `
        <div class="modal" id="securityQuestionModal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title text-primary">
                            <i class="fas fa-shield-alt"></i>
                            Security Verification
                        </h2>
                        <button class="btn-icon close-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">Security Question:</label>
                            <div class="security-question-display">
                                <strong>${user.securityQuestion}</strong>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Your Answer:</label>
                            <input type="text" class="form-control" id="securityAnswer" placeholder="Enter your answer" required>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Please answer your security question to proceed with password reset.
                        </div>
                        
                        <div class="action-buttons mt-3">
                            <button class="btn btn-secondary close-modal">
                                Cancel
                            </button>
                            <button class="btn btn-primary" id="verifySecurityAnswer">
                                <i class="fas fa-check"></i> Verify Answer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('verifySecurityAnswer')?.addEventListener('click', function() {
        const answer = document.getElementById('securityAnswer').value;
        const result = verifySecurityAnswer(email, answer);
        
        if (result.success) {
            const resetResult = requestPasswordReset(email);
            if (resetResult.success) {
                const modal = document.getElementById('securityQuestionModal');
                if (modal) modal.remove();
                showResetTokenModal(email, resetResult.data.token, resetResult.data.resetLink);
            }
        } else {
            showAlert(result.message, 'danger');
        }
    });
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = document.getElementById('securityQuestionModal');
            if (modal) modal.remove();
        });
    });
}

// ============================================
// SETTINGS PAGE - CHANGE PASSWORD & ACCOUNT DELETION
// ============================================

// Initialize settings page
function initSettingsPage() {
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmPassword) {
                showAlert('New passwords do not match!', 'danger');
                return;
            }
            
            if (checkPasswordStrength(newPassword) < 3) {
                showAlert('Please use a stronger password (at least 8 characters with letters and numbers)', 'warning');
                return;
            }
            
            const result = changePassword(currentPassword, newPassword);
            
            if (result.success) {
                showAlert(result.message, 'success');
                changePasswordForm.reset();
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }
    
    // Security question form
    const securityQuestionForm = document.getElementById('securityQuestionForm');
    if (securityQuestionForm) {
        if (currentUser && currentUser.securityQuestion) {
            const currentQuestionEl = document.getElementById('currentQuestion');
            if (currentQuestionEl) {
                currentQuestionEl.textContent = currentUser.securityQuestion;
            }
        }
        
        securityQuestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const question = document.getElementById('securityQuestion').value;
            const answer = document.getElementById('securityAnswer').value;
            const confirmAnswer = document.getElementById('confirmSecurityAnswer').value;
            
            if (!question || !answer) {
                showAlert('Please fill in both question and answer', 'warning');
                return;
            }
            
            if (answer !== confirmAnswer) {
                showAlert('Security answers do not match!', 'danger');
                return;
            }
            
            const result = updateSecurityQuestion(question, answer);
            
            if (result.success) {
                showAlert(result.message, 'success');
                const currentQuestionEl = document.getElementById('currentQuestion');
                if (currentQuestionEl) {
                    currentQuestionEl.textContent = question;
                }
                securityQuestionForm.reset();
            } else {
                showAlert(result.message, 'danger');
            }
        });
    }
    
    // Account deletion functionality
    initAccountDeletion();
}

// Initialize account deletion
function initAccountDeletion() {
    const initiateDeletionBtn = document.getElementById('initiateDeletion');
    const cancelDeletionBtn = document.getElementById('cancelDeletion');
    const cancelDeletionFinalBtn = document.getElementById('cancelDeletionFinal');
    const confirmDeletionFinalBtn = document.getElementById('confirmDeletionFinal');
    
    if (!initiateDeletionBtn) return;
    
    // Enable/disable delete button based on checkboxes
    const checkboxes = [
        document.getElementById('understandConsequences'),
        document.getElementById('confirmDeletion')
    ];
    
    const inputs = [
        document.getElementById('currentPasswordVerify'),
        document.getElementById('confirmEmail'),
        document.getElementById('confirmText')
    ];
    
    function updateDeleteButton() {
        const allChecked = checkboxes.every(cb => cb?.checked);
        const allFilled = inputs.every(input => input?.value.trim() !== '');
        const confirmText = document.getElementById('confirmText')?.value;
        
        initiateDeletionBtn.disabled = !(allChecked && allFilled && confirmText === 'DELETE');
    }
    
    checkboxes.forEach(cb => {
        if (cb) cb.addEventListener('change', updateDeleteButton);
    });
    
    inputs.forEach(input => {
        if (input) input.addEventListener('input', updateDeleteButton);
    });
    
    // Initiate deletion
    initiateDeletionBtn.addEventListener('click', function() {
        const modal = document.getElementById('deletionConfirmationModal');
        if (modal) {
            modal.classList.remove('hidden');
            startDeletionCountdown();
        }
    });
    
    // Cancel deletion
    if (cancelDeletionBtn) {
        cancelDeletionBtn.addEventListener('click', function() {
            showAlert('Account deletion cancelled.', 'info');
            resetDeletionForm();
        });
    }
    
    // Cancel final deletion
    if (cancelDeletionFinalBtn) {
        cancelDeletionFinalBtn.addEventListener('click', function() {
            const modal = document.getElementById('deletionConfirmationModal');
            if (modal) modal.classList.add('hidden');
            stopDeletionCountdown();
            showAlert('Account deletion cancelled.', 'success');
        });
    }
    
    // Confirm final deletion
    if (confirmDeletionFinalBtn) {
        confirmDeletionFinalBtn.addEventListener('click', function() {
            const modal = document.getElementById('deletionConfirmationModal');
            if (modal) modal.classList.add('hidden');
            stopDeletionCountdown();
            startDeletionProcess();
        });
    }
    
    // Export data buttons
    document.getElementById('exportInvoices')?.addEventListener('click', exportInvoices);
    document.getElementById('exportInventory')?.addEventListener('click', exportInventory);
    document.getElementById('exportAllData')?.addEventListener('click', exportAllData);
}

// Start deletion countdown
let countdownInterval;
function startDeletionCountdown() {
    let countdown = 30;
    const countdownEl = document.getElementById('modalCountdown');
    const countdownTextEl = document.getElementById('countdown');
    
    if (!countdownEl && !countdownTextEl) return;
    
    function updateCountdown() {
        if (countdownEl) countdownEl.textContent = countdown;
        if (countdownTextEl) countdownTextEl.textContent = countdown;
        
        if (countdown <= 10) {
            if (countdownEl) countdownEl.classList.add('critical');
            if (countdownTextEl) countdownTextEl.classList.add('critical');
        } else if (countdown <= 20) {
            if (countdownEl) countdownEl.classList.add('warning');
            if (countdownTextEl) countdownTextEl.classList.add('warning');
        }
        
        if (countdown <= 0) {
            stopDeletionCountdown();
            startDeletionProcess();
            return;
        }
        
        countdown--;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// Stop deletion countdown
function stopDeletionCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const countdownEl = document.getElementById('modalCountdown');
    const countdownTextEl = document.getElementById('countdown');
    
    if (countdownEl) {
        countdownEl.classList.remove('warning', 'critical');
    }
    if (countdownTextEl) {
        countdownTextEl.classList.remove('warning', 'critical');
    }
}

// Start deletion process
async function startDeletionProcess() {
    const currentPassword = document.getElementById('currentPasswordVerify').value;
    const confirmEmail = document.getElementById('confirmEmail').value;
    const confirmText = document.getElementById('confirmText').value;
    
    if (!currentUser) {
        showAlert('You must be logged in to delete your account.', 'danger');
        return;
    }
    
    // Validate inputs
    if (currentUser.email !== confirmEmail) {
        showAlert('Email does not match your account email.', 'danger');
        return;
    }
    
    if (confirmText !== 'DELETE') {
        showAlert('Confirmation text must be exactly "DELETE".', 'danger');
        return;
    }
    
    // Show progress modal
    const progressModal = document.getElementById('deletionProgressModal');
    if (progressModal) {
        progressModal.classList.remove('hidden');
    }
    
    // Schedule deletion
    const result = scheduleAccountDeletion(
        currentUser.email,
        currentPassword,
        confirmEmail,
        confirmText
    );
    
    if (!result.success) {
        showAlert(result.message, 'danger');
        if (progressModal) progressModal.classList.add('hidden');
        return;
    }
    
    // Process deletion with progress updates
    const progressResult = await processAccountDeletion(result.deletionId, (progress, message) => {
        const progressBar = document.getElementById('deletionProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = progress + '%';
        
        // Update step status
        const steps = document.querySelectorAll('.deletion-steps .step');
        if (steps.length >= 5) {
            if (progress >= 20) steps[0].classList.add('completed');
            if (progress >= 40) steps[1].classList.add('completed');
            if (progress >= 60) steps[2].classList.add('completed');
            if (progress >= 80) steps[3].classList.add('completed');
            if (progress >= 100) steps[4].classList.add('completed');
        }
    });
    
    // Hide progress modal
    if (progressModal) {
        setTimeout(() => {
            progressModal.classList.add('hidden');
        }, 1000);
    }
    
    // Show completion modal
    if (progressResult.success) {
        const completeModal = document.getElementById('deletionCompleteModal');
        if (completeModal) {
            completeModal.classList.remove('hidden');
            startRedirectCountdown();
        }
    } else {
        showAlert(progressResult.message, 'danger');
    }
}

// Start redirect countdown
function startRedirectCountdown() {
    let countdown = 10;
    const countdownEl = document.getElementById('redirectCountdown');
    
    if (!countdownEl) return;
    
    const interval = setInterval(() => {
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(interval);
            logoutUser();
        }
        countdown--;
    }, 1000);
}

// Reset deletion form
function resetDeletionForm() {
    const checkboxes = [
        document.getElementById('understandConsequences'),
        document.getElementById('confirmDeletion')
    ];
    
    const inputs = [
        document.getElementById('currentPasswordVerify'),
        document.getElementById('confirmEmail'),
        document.getElementById('confirmText')
    ];
    
    checkboxes.forEach(cb => {
        if (cb) cb.checked = false;
    });
    
    inputs.forEach(input => {
        if (input) input.value = '';
    });
    
    const initiateDeletionBtn = document.getElementById('initiateDeletion');
    if (initiateDeletionBtn) {
        initiateDeletionBtn.disabled = true;
    }
}

// ============================================
// DATA EXPORT FUNCTIONS
// ============================================

// Export invoices
function exportInvoices() {
    const userInvoices = invoices.filter(inv => 
        inv.customer.email === currentUser?.email || 
        inv.createdBy === currentUser?.email ||
        !currentUser // If no user, export all (for demo)
    );
    
    const dataStr = JSON.stringify(userInvoices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `invoices-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showAlert('Invoices exported successfully!', 'success');
}

// Export inventory
function exportInventory() {
    const dataStr = JSON.stringify(inventory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `inventory-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showAlert('Inventory exported successfully!', 'success');
}

// Export all data
function exportAllData() {
    const allData = {
        users: users.filter(u => u.email === currentUser?.email || !currentUser),
        invoices: invoices.filter(inv => 
            inv.customer.email === currentUser?.email || 
            inv.createdBy === currentUser?.email ||
            !currentUser
        ),
        inventory: inventory,
        exportDate: new Date().toISOString(),
        exportedBy: currentUser?.email || 'anonymous'
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `gst-invoice-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    showAlert('All data exported successfully!', 'success');
}

// ============================================
// INVENTORY MANAGEMENT SYSTEM
// ============================================

// Get product status based on stock
function getProductStatus(stock, threshold) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
}

// Get badge class based on status
function getStatusBadgeClass(status) {
    switch (status) {
        case 'In Stock': return 'badge-success';
        case 'Low Stock': return 'badge-warning';
        case 'Out of Stock': return 'badge-danger';
        default: return 'badge-primary';
    }
}

// Update inventory statistics
function updateInventoryStats() {
    const totalProducts = inventory.length;
    let inventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    
    inventory.forEach(product => {
        inventoryValue += product.stock * product.price;
        const status = getProductStatus(product.stock, product.lowStockThreshold);
        if (status === 'Low Stock') lowStockCount++;
        if (status === 'Out of Stock') outOfStockCount++;
    });
    
    const elements = {
        'totalProducts': totalProducts,
        'inventoryValue': `₹${inventoryValue.toLocaleString()}`,
        'lowStockCount': lowStockCount,
        'outOfStockCount': outOfStockCount,
        'itemsSold': Math.floor(Math.random() * 50)
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = elements[id];
    });
}

// Render inventory table
function renderInventoryTable(filter = '') {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const filteredInventory = inventory.filter(product => 
        product.name.toLowerCase().includes(filter.toLowerCase()) ||
        product.code.toLowerCase().includes(filter.toLowerCase()) ||
        product.category.toLowerCase().includes(filter.toLowerCase())
    );
    
    filteredInventory.forEach(product => {
        const status = getProductStatus(product.stock, product.lowStockThreshold);
        const badgeClass = getStatusBadgeClass(status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.code}</td>
            <td>
                <strong>${product.name}</strong><br>
                <small class="text-light">${product.description || 'No description'}</small>
            </td>
            <td>${product.category}</td>
            <td>
                <span class="${product.stock === 0 ? 'text-danger' : product.stock <= product.lowStockThreshold ? 'text-warning' : ''}">
                    ${product.stock}
                </span>
            </td>
            <td>₹${product.price.toLocaleString()}</td>
            <td>${product.gstRate}%</td>
            <td><span class="badge ${badgeClass}">${status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit-product" title="Edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-product" title="Delete" data-id="${product.id}" data-name="${product.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon view-product" title="View Details" data-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateInventoryStats();
}

// Open product modal for add/edit
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    if (productId) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
        const product = inventory.find(p => p.id == productId);
        
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productCode').value = product.code;
            document.getElementById('productName').value = product.name;
            document.getElementById('category').value = product.category;
            document.getElementById('stock').value = product.stock;
            document.getElementById('price').value = product.price;
            document.getElementById('gstRate').value = product.gstRate;
            document.getElementById('description').value = product.description || '';
            document.getElementById('lowStockThreshold').value = product.lowStockThreshold || 10;
        }
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add New Product';
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productCode').value = `PROD-${String(inventory.length + 1).padStart(3, '0')}`;
    }
    
    modal.classList.remove('hidden');
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}

// Open delete confirmation modal
function openDeleteModal(productId, productName) {
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteProductName').textContent = productName;
    modal.dataset.productId = productId;
    modal.classList.remove('hidden');
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

// Initialize inventory page
function initInventoryPage() {
    renderInventoryTable();
    
    document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());
    document.getElementById('closeModal')?.addEventListener('click', closeProductModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeProductModal);
    document.getElementById('cancelDelete')?.addEventListener('click', closeDeleteModal);
    
    document.getElementById('searchProduct')?.addEventListener('input', function(e) {
        renderInventoryTable(e.target.value);
    });
    
    document.getElementById('exportBtn')?.addEventListener('click', function() {
        const dataStr = JSON.stringify(inventory, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `inventory-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showAlert('Inventory exported successfully!', 'success');
    });
    
    document.getElementById('productForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const productData = {
            id: productId ? parseInt(productId) : inventory.length + 1,
            code: document.getElementById('productCode').value,
            name: document.getElementById('productName').value,
            category: document.getElementById('category').value,
            stock: parseInt(document.getElementById('stock').value),
            price: parseFloat(document.getElementById('price').value),
            gstRate: parseInt(document.getElementById('gstRate').value),
            description: document.getElementById('description').value,
            lowStockThreshold: parseInt(document.getElementById('lowStockThreshold').value) || 10,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        if (productId) {
            const index = inventory.findIndex(p => p.id == productId);
            if (index !== -1) {
                inventory[index] = productData;
                showAlert('Product updated successfully!', 'success');
            }
        } else {
            inventory.push(productData);
            showAlert('Product added successfully!', 'success');
        }
        
        saveInventory();
        renderInventoryTable();
        closeProductModal();
    });
    
    document.getElementById('confirmDelete')?.addEventListener('click', function() {
        const modal = document.getElementById('deleteModal');
        const productId = modal.dataset.productId;
        
        inventory = inventory.filter(product => product.id != productId);
        saveInventory();
        renderInventoryTable();
        closeDeleteModal();
        
        showAlert('Product deleted successfully!', 'success');
    });
    
    document.getElementById('inventoryTableBody')?.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('edit-product')) {
            const productId = target.dataset.id;
            openProductModal(productId);
        } else if (target.classList.contains('delete-product')) {
            const productId = target.dataset.id;
            const productName = target.dataset.name;
            openDeleteModal(productId, productName);
        } else if (target.classList.contains('view-product')) {
            const productId = target.dataset.id;
            const product = inventory.find(p => p.id == productId);
            if (product) {
                showAlert(
                    `<strong>Product Details:</strong><br><br>
                    <strong>Code:</strong> ${product.code}<br>
                    <strong>Name:</strong> ${product.name}<br>
                    <strong>Category:</strong> ${product.category}<br>
                    <strong>Stock:</strong> ${product.stock}<br>
                    <strong>Price:</strong> ₹${product.price}<br>
                    <strong>GST Rate:</strong> ${product.gstRate}%<br>
                    <strong>Description:</strong> ${product.description || 'N/A'}<br>
                    <strong>Last Updated:</strong> ${product.lastUpdated}`,
                    'info'
                );
            }
        }
    });
}

// ============================================
// INVOICE MANAGEMENT SYSTEM
// ============================================

// Generate invoice number
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const lastInvoice = invoices[invoices.length - 1];
    let nextNumber = 1;
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/\d+/);
        if (match) {
            nextNumber = parseInt(match[0]) + 1;
        }
    }
    
    return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
}

// Calculate invoice totals
function calculateInvoiceTotals(items) {
    let subtotal = 0;
    let gstTotal = 0;
    
    items.forEach(item => {
        const itemTotal = item.quantity * item.price;
        const itemGST = itemTotal * (item.gst / 100);
        subtotal += itemTotal;
        gstTotal += itemGST;
    });
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstTotal: parseFloat(gstTotal.toFixed(2)),
        grandTotal: parseFloat((subtotal + gstTotal).toFixed(2))
    };
}

// Add invoice item row
function addInvoiceItem(item = {}) {
    const table = document.getElementById('itemsTable');
    const row = document.createElement('tr');
    const itemId = Date.now() + Math.random();
    
    row.innerHTML = `
        <td>
            <select class="form-control item-select" data-id="${itemId}">
                <option value="">Select Product</option>
                ${inventory.map(product => 
                    `<option value="${product.id}" ${item.productId == product.id ? 'selected' : ''}>
                        ${product.name} (₹${product.price})
                    </option>`
                ).join('')}
        </td>
        <td>
            <input type="text" class="form-control description" value="${item.description || ''}" placeholder="Description">
        </td>
        <td>
            <input type="number" class="form-control quantity" value="${item.quantity || 1}" min="1" step="1">
        </td>
        <td>
            <input type="number" class="form-control price" value="${item.price || 0}" min="0" step="0.01" placeholder="0.00">
        </td>
        <td>
            <select class="form-control gst">
                <option value="0" ${item.gst === 0 ? 'selected' : ''}>0%</option>
                <option value="5" ${item.gst === 5 ? 'selected' : ''}>5%</option>
                <option value="12" ${item.gst === 12 ? 'selected' : ''}>12%</option>
                <option value="18" ${item.gst === 18 ? 'selected' : ''}>18%</option>
                <option value="28" ${item.gst === 28 ? 'selected' : ''}>28%</option>
            </select>
        </td>
        <td class="item-total">₹0.00</td>
        <td>
            <button class="btn-icon remove-item" title="Remove item">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    table.appendChild(row);
    
    const productSelect = row.querySelector('.item-select');
    productSelect.addEventListener('change', function() {
        const productId = this.value;
        const product = inventory.find(p => p.id == productId);
        if (product) {
            row.querySelector('.description').value = product.description || product.name;
            row.querySelector('.price').value = product.price;
            row.querySelector('.gst').value = product.gstRate;
            calculateInvoiceRowTotal(row);
        }
    });
    
    row.querySelectorAll('.quantity, .price, .gst').forEach(input => {
        input.addEventListener('input', () => calculateInvoiceRowTotal(row));
        input.addEventListener('change', () => calculateInvoiceRowTotal(row));
    });
    
    row.querySelector('.remove-item').addEventListener('click', function() {
        row.remove();
        updateInvoiceTotals();
    });
    
    calculateInvoiceRowTotal(row);
}

// Calculate invoice row total
function calculateInvoiceRowTotal(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const price = parseFloat(row.querySelector('.price').value) || 0;
    const gst = parseFloat(row.querySelector('.gst').value) || 0;
    
    const itemTotal = quantity * price;
    const itemGST = itemTotal * (gst / 100);
    const total = itemTotal + itemGST;
    
    row.querySelector('.item-total').textContent = `₹${total.toFixed(2)}`;
    updateInvoiceTotals();
}

// Update invoice totals
function updateInvoiceTotals() {
    let subtotal = 0;
    let gstTotal = 0;
    
    document.querySelectorAll('#itemsTable tr').forEach(row => {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const gst = parseFloat(row.querySelector('.gst').value) || 0;
        
        const itemTotal = quantity * price;
        const itemGST = itemTotal * (gst / 100);
        
        subtotal += itemTotal;
        gstTotal += itemGST;
    });
    
    const grandTotal = subtotal + gstTotal;
    
    const subtotalEl = document.querySelector('tfoot tr:nth-child(1) td:nth-child(2)');
    const gstEl = document.querySelector('tfoot tr:nth-child(2) td:nth-child(2)');
    const totalEl = document.querySelector('tfoot tr:nth-child(3) td:nth-child(2)');
    
    if (subtotalEl) subtotalEl.innerHTML = `<strong>₹${subtotal.toFixed(2)}</strong>`;
    if (gstEl) gstEl.innerHTML = `<strong>₹${gstTotal.toFixed(2)}</strong>`;
    if (totalEl) totalEl.innerHTML = `<strong>₹${grandTotal.toFixed(2)}</strong>`;
    
    updateTaxBreakdown();
}

// Update tax breakdown
function updateTaxBreakdown() {
    const breakdown = {
        '0%': 0,
        '5%': 0,
        '12%': 0,
        '18%': 0,
        '28%': 0
    };
    
    document.querySelectorAll('#itemsTable tr').forEach(row => {
        const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const gst = parseFloat(row.querySelector('.gst').value) || 0;
        
        const itemTotal = quantity * price;
        const itemGST = itemTotal * (gst / 100);
        
        breakdown[`${gst}%`] = (breakdown[`${gst}%`] || 0) + itemGST;
    });
    
    const breakdownEl = document.getElementById('taxBreakdown');
    if (breakdownEl) {
        let html = '';
        Object.entries(breakdown).forEach(([rate, amount]) => {
            if (amount > 0) {
                html += `<div class="d-flex justify-between mb-1">
                    <span>GST ${rate}:</span>
                    <span>₹${amount.toFixed(2)}</span>
                </div>`;
            }
        });
        breakdownEl.innerHTML = html;
    }
}

// Save invoice
function saveInvoice() {
    const items = [];
    document.querySelectorAll('#itemsTable tr').forEach(row => {
        const description = row.querySelector('.description').value;
        const quantity = parseFloat(row.querySelector('.quantity').value);
        const price = parseFloat(row.querySelector('.price').value);
        const gst = parseFloat(row.querySelector('.gst').value);
        
        if (description && quantity && price) {
            items.push({
                name: description.split(' - ')[0] || description,
                description: description,
                quantity: quantity,
                price: price,
                gst: gst
            });
        }
    });
    
    if (items.length === 0) {
        showAlert('Please add at least one item to the invoice', 'warning');
        return null;
    }
    
    const totals = calculateInvoiceTotals(items);
    
    const invoice = {
        id: invoices.length + 1,
        invoiceNumber: document.getElementById('invoiceNumber')?.value || generateInvoiceNumber(),
        date: document.getElementById('invoiceDate')?.value || new Date().toISOString().split('T')[0],
        dueDate: document.getElementById('dueDate')?.value || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer: {
            name: document.getElementById('customerName')?.value || 'Walk-in Customer',
            gstin: document.getElementById('customerGSTIN')?.value || '',
            email: document.getElementById('customerEmail')?.value || '',
            phone: document.getElementById('customerPhone')?.value || '',
            address: document.getElementById('customerAddress')?.value || ''
        },
        items: items,
        subtotal: totals.subtotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal,
        status: 'pending',
        paymentMethod: document.getElementById('paymentMethod')?.value || 'Cash',
        notes: document.getElementById('invoiceNotes')?.value || '',
        createdBy: currentUser?.email || 'anonymous'
    };
    
    invoices.push(invoice);
    saveInvoices();
    return invoice;
}

// Initialize invoice page
function initInvoicePage() {
    const invoiceNumberEl = document.getElementById('invoiceNumber');
    if (invoiceNumberEl) {
        invoiceNumberEl.value = generateInvoiceNumber();
    }
    
    initializeDates();
    
    document.getElementById('addItem')?.addEventListener('click', function() {
        addInvoiceItem();
    });
    
    document.getElementById('generateInvoice')?.addEventListener('click', function() {
        const invoice = saveInvoice();
        if (invoice) {
            showAlert(`Invoice ${invoice.invoiceNumber} created successfully!`, 'success');
            
            setTimeout(() => {
                document.getElementById('itemsTable').innerHTML = '';
                addInvoiceItem();
                if (invoiceNumberEl) {
                    invoiceNumberEl.value = generateInvoiceNumber();
                }
                initializeDates();
            }, 1500);
        }
    });
    
    document.getElementById('printInvoice')?.addEventListener('click', function() {
        window.print();
    });
    
    document.getElementById('downloadPDF')?.addEventListener('click', function() {
        showAlert('PDF download would be implemented in a real application', 'info');
    });
    
    document.getElementById('emailInvoice')?.addEventListener('click', function() {
        const email = prompt('Enter customer email address:');
        if (email) {
            showAlert(`Invoice would be emailed to ${email}`, 'info');
        }
    });
    
    setTimeout(() => {
        if (document.getElementById('itemsTable')?.children.length === 0) {
            addInvoiceItem();
        }
    }, 100);
}

// ============================================
// DASHBOARD SYSTEM
// ============================================

// Update dashboard stats
function updateDashboardStats() {
    if (!document.getElementById('totalInvoices')) return;
    
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
    const pendingAmount = invoices.filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('pendingInvoices').textContent = pendingInvoices;
    document.getElementById('pendingAmount').textContent = `₹${pendingAmount.toLocaleString()}`;
    document.getElementById('totalProducts').textContent = inventory.length;
    
    updateRecentInvoices();
}

// Update recent invoices table
function updateRecentInvoices() {
    const tbody = document.getElementById('recentInvoicesBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const recentInvoices = invoices.slice(-5).reverse();
    
    recentInvoices.forEach(invoice => {
        const statusBadge = invoice.status === 'paid' ? 'badge-success' : 
                          invoice.status === 'pending' ? 'badge-warning' : 'badge-danger';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.customer.name}</td>
            <td>${invoice.date}</td>
            <td>₹${invoice.grandTotal.toLocaleString()}</td>
            <td><span class="badge ${statusBadge}">${invoice.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-invoice" title="View" data-id="${invoice.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon print-invoice" title="Print" data-id="${invoice.id}">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize dashboard page
function initDashboardPage() {
    updateDashboardStats();
    
    document.getElementById('refreshStats')?.addEventListener('click', function() {
        updateDashboardStats();
        showAlert('Dashboard stats updated!', 'success');
    });
    
    document.getElementById('quickInvoice')?.addEventListener('click', function() {
        window.location.href = 'invoice.html';
    });
}

// ============================================
// VIEW INVOICES PAGE
// ============================================

// Initialize view invoices page
function initViewInvoicesPage() {
    const tbody = document.getElementById('invoicesTableBody');
    if (tbody) {
        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-file-invoice"></i>
                            </div>
                            <h3>No Invoices Yet</h3>
                            <p>Create your first invoice to see it here.</p>
                            <a href="invoice.html" class="btn btn-primary mt-2">
                                <i class="fas fa-plus"></i> Create Invoice
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            invoices.forEach(invoice => {
                const statusBadge = invoice.status === 'paid' ? 'badge-success' : 
                                  invoice.status === 'pending' ? 'badge-warning' : 'badge-danger';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.invoiceNumber}</td>
                    <td>${invoice.customer.name}</td>
                    <td>${invoice.date}</td>
                    <td>${invoice.dueDate}</td>
                    <td>₹${invoice.grandTotal.toLocaleString()}</td>
                    <td><span class="badge ${statusBadge}">${invoice.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon view-invoice" title="View" data-id="${invoice.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon print-invoice" title="Print" data-id="${invoice.id}">
                                <i class="fas fa-print"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }
}

// ============================================
// LOGIN PAGE
// ============================================

// Initialize login page
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        const result = loginUser(email, password);
        
        if (result.success) {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// ============================================
// REGISTER PAGE
// ============================================

// Initialize register page
function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    const passwordInput = document.getElementById('regPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        if (checkPasswordStrength(password) < 3) {
            showAlert('Please use a stronger password (at least 8 characters with letters and numbers)', 'warning');
            return;
        }
        
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('regEmail').value,
            password: password,
            businessName: document.getElementById('businessName').value || '',
            phone: document.getElementById('phone').value || '',
            gstin: document.getElementById('gstin').value || '',
            securityQuestion: document.getElementById('securityQuestion')?.value || '',
            securityAnswer: document.getElementById('securityAnswer')?.value || ''
        };
        
        const result = registerUser(userData);
        
        if (result.success) {
            showAlert(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// Update password strength display
function updatePasswordStrength() {
    const password = document.getElementById('regPassword').value;
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthMeter || !strengthText) return;
    
    const strength = checkPasswordStrength(password);
    
    strengthMeter.className = 'strength-fill';
    if (password.length === 0) {
        strengthText.textContent = 'Password strength';
        strengthMeter.style.width = '0%';
    } else if (strength < 2) {
        strengthText.textContent = 'Weak';
        strengthMeter.classList.add('strength-weak');
    } else if (strength < 3) {
        strengthText.textContent = 'Fair';
        strengthMeter.classList.add('strength-fair');
    } else if (strength < 5) {
        strengthText.textContent = 'Good';
        strengthMeter.classList.add('strength-good');
    } else {
        strengthText.textContent = 'Strong';
        strengthMeter.classList.add('strength-strong');
    }
}

// Check if passwords match
function checkPasswordMatch() {
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchText = document.getElementById('passwordMatch');
    
    if (!matchText) return;
    
    if (confirmPassword) {
        if (password === confirmPassword) {
            matchText.textContent = '✓ Passwords match';
            matchText.style.color = 'var(--success)';
        } else {
            matchText.textContent = '✗ Passwords do not match';
            matchText.style.color = 'var(--danger)';
        }
    } else {
        matchText.textContent = '';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show alert message
function showAlert(message, type = 'info', duration = 5000) {
    const existingAlert = document.querySelector('.global-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `global-alert alert alert-${type}`;
    
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'danger': 'times-circle',
        'info': 'info-circle'
    };
    
    alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <div>${message}</div>
        </div>
        <button class="btn-icon" onclick="this.parentElement.remove()" style="margin-left: auto;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, duration);
    
    if (!document.querySelector('#globalAlertStyles')) {
        const style = document.createElement('style');
        style.id = 'globalAlertStyles';
        style.textContent = `
            .global-alert {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                box-shadow: var(--shadow-lg);
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Copied to clipboard!', 'success', 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showAlert('Failed to copy to clipboard', 'danger');
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Initialize date inputs
function initializeDates() {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (input.id === 'invoiceDate' || input.id === 'date') {
            input.value = today;
        }
        if (input.id === 'dueDate') {
            input.value = dueDate;
        }
    });
}

// ============================================
// NAVIGATION AND THEME SYSTEM
// ============================================

// Update navigation based on auth status
function updateNavigation() {
    const navLinks = document.querySelector('.nav-links');
    const isOnAuthPage = window.location.pathname.includes('login.html') || 
                         window.location.pathname.includes('register.html');
    
    if (isOnAuthPage) return;
    
    if (navLinks && isLoggedIn()) {
        const userName = currentUser?.firstName || 'User';
        
        navLinks.innerHTML = `
            <a href="dashboard.html" class="nav-link ${window.location.pathname.includes('dashboard.html') ? 'active' : ''}">
                <i class="fas fa-chart-bar"></i> Dashboard
            </a>
            <a href="invoice.html" class="nav-link ${window.location.pathname.includes('invoice.html') ? 'active' : ''}">
                <i class="fas fa-file-invoice"></i> Create Invoice
            </a>
            <a href="view-invoice.html" class="nav-link ${window.location.pathname.includes('view-invoice.html') ? 'active' : ''}">
                <i class="fas fa-eye"></i> View Invoices
            </a>
            <a href="inventory.html" class="nav-link ${window.location.pathname.includes('inventory.html') ? 'active' : ''}">
                <i class="fas fa-boxes"></i> Inventory
            </a>
            <a href="settings.html" class="nav-link ${window.location.pathname.includes('settings.html') ? 'active' : ''}">
                <i class="fas fa-cog"></i> Settings
            </a>
            <div class="dropdown">
                <button class="btn-icon" id="userDropdown" style="color: var(--primary);">
                    <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                    <span style="margin-left: 8px; font-size: 14px;">${userName}</span>
                </button>
                <div class="dropdown-menu" id="dropdownMenu">
                    <div class="dropdown-header" style="padding: 10px 20px; font-weight: 600; color: var(--text-primary);">
                        ${userName}
                    </div>
                    <div class="dropdown-divider"></div>
                    <a href="settings.html" class="dropdown-item">
                        <i class="fas fa-cog"></i> Settings
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
            <label class="theme-switch">
                <input type="checkbox" id="darkModeToggle">
                <span class="slider"></span>
            </label>
        `;
        
        const userDropdown = document.getElementById('userDropdown');
        const dropdownMenu = document.getElementById('dropdownMenu');
        
        if (userDropdown && dropdownMenu) {
            userDropdown.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });
            
            document.addEventListener('click', function() {
                dropdownMenu.classList.remove('show');
            });
            
            document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        
    } else if (navLinks) {
        navLinks.innerHTML = `
            <a href="login.html" class="nav-link ${window.location.pathname.includes('login.html') ? 'active' : ''}">
                <i class="fas fa-sign-in-alt"></i> Login
            </a>
            <a href="register.html" class="nav-link ${window.location.pathname.includes('register.html') ? 'active' : ''}">
                <i class="fas fa-user-plus"></i> Register
            </a>
            <label class="theme-switch">
                <input type="checkbox" id="darkModeToggle">
                <span class="slider"></span>
            </label>
        `;
    }
    
    initializeDarkMode();
}

// Initialize dark mode
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (isDarkMode || (!isDarkMode && userPrefersDark && localStorage.getItem('darkMode') === null)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
}

// ============================================
// CREATE INVOICE PAGE FUNCTIONS (FROM SECOND SCRIPT)
// ============================================

function loadShopToPreview() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (currentUser) {
            document.getElementById('shopNamePreview').textContent = currentUser.businessName || 'My Business';
            document.getElementById('shopDescPreview').textContent = currentUser.address || 'Business Address';
            document.getElementById('shopContactPreview').textContent = `${currentUser.phone || ''} • ${currentUser.gstin || ''}`;
        }
    } catch(e) {
        console.log('Could not load shop preview');
    }
}

function setupInvoiceForm() {
    const invoiceForm = document.getElementById('invoiceForm');
    if (!invoiceForm) return;
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Generate invoice number
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const nextNumber = invoices.length + 1;
    const year = new Date().getFullYear();
    document.getElementById('invoiceNumber').value = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
    
    // Add item row button
    document.getElementById('addRowBtn')?.addEventListener('click', addItemRow);
    
    // Clear button
    document.getElementById('clearInvoiceBtn')?.addEventListener('click', clearInvoiceForm);
    
    // Send button
    document.getElementById('sendInvoiceBtn')?.addEventListener('click', sendInvoice);
    
    // Download PDF button
    document.getElementById('downloadPDF')?.addEventListener('click', downloadPDF);
    
    // Calculate totals when form changes
    invoiceForm.addEventListener('input', calculateTotals);
    
    // Submit handler
    invoiceForm.addEventListener('submit', saveInvoiceForm);
}

function addItemRow() {
    const tbody = document.querySelector('#itemsTable tbody');
    if (!tbody) return;
    
    const rowCount = tbody.children.length + 1;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="it-name" placeholder="Item name" list="itemsList" style="width: 100%;"></td>
        <td><input type="text" class="it-hsn" placeholder="HSN/SAC" style="width: 100%;"></td>
        <td><select class="it-unit" style="width: 100%;">
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="meter">meter</option>
            <option value="litre">litre</option>
            <option value="set">set</option>
        </select></td>
        <td><input type="number" class="it-qty" value="1" min="1" style="width: 100%;"></td>
        <td><input type="number" class="it-rate" value="0.00" step="0.01" min="0" style="width: 100%;"></td>
        <td><select class="it-gst" style="width: 100%;">
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18" selected>18%</option>
            <option value="28">28%</option>
        </select></td>
        <td class="it-total">Rs. 0.00</td>
        <td><button type="button" class="btn-icon remove-row">×</button></td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listeners to new row
    row.querySelector('.remove-row').addEventListener('click', function() {
        row.remove();
        updateRowNumbers();
        calculateTotals();
    });
    
    row.querySelectorAll('.it-qty, .it-rate, .it-gst').forEach(input => {
        input.addEventListener('input', calculateTotals);
    });
    
    calculateTotals();
}

function updateRowNumbers() {
    const tbody = document.querySelector('#itemsTable tbody');
    if (!tbody) return;
    
    Array.from(tbody.children).forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

function calculateTotals() {
    let subtotal = 0;
    let sgstTotal = 0;
    let cgstTotal = 0;
    let igstTotal = 0;
    
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.it-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.it-rate').value) || 0;
        const gst = parseFloat(row.querySelector('.it-gst').value) || 0;
        
        const itemTotal = qty * rate;
        const gstAmount = itemTotal * (gst / 100);
        
        // For demo: assuming half SGST and half CGST (common in India)
        const sgst = gstAmount / 2;
        const cgst = gstAmount / 2;
        const igst = 0; // Assuming no IGST for now
        
        row.querySelector('.it-total').textContent = `Rs. ${(itemTotal + gstAmount).toFixed(2)}`;
        
        subtotal += itemTotal;
        sgstTotal += sgst;
        cgstTotal += cgst;
        igstTotal += igst;
    });
    
    const grandTotal = subtotal + sgstTotal + cgstTotal + igstTotal;
    
    document.getElementById('subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
    document.getElementById('totSGST').textContent = `Rs. ${sgstTotal.toFixed(2)}`;
    document.getElementById('totCGST').textContent = `Rs. ${cgstTotal.toFixed(2)}`;
    document.getElementById('totIGST').textContent = `Rs. ${igstTotal.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `Rs. ${grandTotal.toFixed(2)}`;
}

function saveInvoiceForm(e) {
    e.preventDefault();
    
    // Collect form data
    const invoiceData = {
        id: Date.now(),
        invoiceNumber: document.getElementById('invoiceNumber').value,
        date: document.getElementById('invoiceDate').value,
        note: document.getElementById('invoiceNote').value,
        customer: {
            name: document.getElementById('custName').value,
            mobile: document.getElementById('custMobile').value,
            gstin: document.getElementById('custGST').value,
            address: document.getElementById('custAddress').value
        },
        items: [],
        totals: {
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('Rs. ', '') || 0),
            sgst: parseFloat(document.getElementById('totSGST').textContent.replace('Rs. ', '') || 0),
            cgst: parseFloat(document.getElementById('totCGST').textContent.replace('Rs. ', '') || 0),
            igst: parseFloat(document.getElementById('totIGST').textContent.replace('Rs. ', '') || 0),
            grandTotal: parseFloat(document.getElementById('grandTotal').textContent.replace('Rs. ', '') || 0)
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: JSON.parse(sessionStorage.getItem('currentUser'))?.email || 'anonymous'
    };
    
    // Collect items
    const rows = document.querySelectorAll('#itemsTable tbody tr');
    rows.forEach(row => {
        const item = {
            name: row.querySelector('.it-name').value,
            hsn: row.querySelector('.it-hsn').value,
            unit: row.querySelector('.it-unit').value,
            quantity: parseFloat(row.querySelector('.it-qty').value) || 0,
            rate: parseFloat(row.querySelector('.it-rate').value) || 0,
            gst: parseFloat(row.querySelector('.it-gst').value) || 0,
            total: parseFloat(row.querySelector('.it-total').textContent.replace('Rs. ', '') || 0)
        };
        
        if (item.name) {
            invoiceData.items.push(item);
        }
    });
    
    // Save to localStorage (invoices array from script.js)
    let invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    invoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(invoices));
    
    // Show success message
    alert(`Invoice ${invoiceData.invoiceNumber} saved successfully!`);
    
    // Reset form
    clearInvoiceForm();
    
    // Generate new invoice number
    const nextNumber = invoices.length + 1;
    const year = new Date().getFullYear();
    document.getElementById('invoiceNumber').value = `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
}

function clearInvoiceForm() {
    const tbody = document.querySelector('#itemsTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        addItemRow();
        addItemRow();
    }
    
    document.getElementById('custName').value = '';
    document.getElementById('custMobile').value = '';
    document.getElementById('custGST').value = '';
    document.getElementById('custAddress').value = '';
    document.getElementById('invoiceNote').value = '';
    
    calculateTotals();
}

function sendInvoice() {
    const email = prompt('Enter customer email address to send invoice:');
    if (email) {
        alert(`Invoice would be sent to ${email} in a real implementation`);
    }
}

function downloadPDF() {
    alert('PDF download would be generated in a real implementation');
}

// ============================================
// ENHANCED CREATE INVOICE FUNCTIONS (FROM SECOND SCRIPT)
// ============================================

// Calculate next invoice number from existing invoices AND manual changes
function calculateNextInvoiceNumber() {
    try {
        console.log('Calculating next invoice number...');
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        let maxNumber = 0;
        
        // Check existing invoices for highest number
        invoices.forEach(invoice => {
            if (invoice.invoiceNumber) {
                console.log('Checking invoice:', invoice.invoiceNumber);
                const match = invoice.invoiceNumber.match(/INV-(\d+)/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    console.log('Extracted number:', num);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });
        
        // Check stored last invoice number
        const lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber');
        if (lastInvoiceNumber) {
            console.log('Found last invoice number in localStorage:', lastInvoiceNumber);
            const match = lastInvoiceNumber.match(/INV-(\d+)/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        }
        
        nextInvoiceNumber = maxNumber + 1;
        
        // If no invoices exist, start from 1
        if (nextInvoiceNumber === 0 || isNaN(nextInvoiceNumber)) {
            nextInvoiceNumber = 1;
        }
        
        console.log('Calculated next invoice number:', nextInvoiceNumber, 'from max:', maxNumber);
        
    } catch(e) {
        console.log('Error calculating next invoice number:', e);
        nextInvoiceNumber = 1;
    }
}

// Store the last invoice number when manually changed
function updateStoredInvoiceNumber(invoiceNumber) {
    if (invoiceNumber) {
        console.log('Storing invoice number:', invoiceNumber);
        localStorage.setItem('lastInvoiceNumber', invoiceNumber);
        
        // Extract numeric part and update nextInvoiceNumber
        const match = invoiceNumber.match(/INV-(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num)) {
                nextInvoiceNumber = num + 1;
                console.log('Updated nextInvoiceNumber to:', nextInvoiceNumber);
            }
        }
    }
}

// Generate invoice number (enhanced version)
function generateInvoiceNumberEnhanced() {
    const invoiceNumber = `INV-${nextInvoiceNumber}`;
    if (document.getElementById('invoiceNumber')) {
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }
    if (document.getElementById('invoiceLabel')) {
        document.getElementById('invoiceLabel').textContent = invoiceNumber;
    }
    console.log('Generated invoice number:', invoiceNumber);
    return invoiceNumber;
}

// Load shop profile (enhanced version)
function loadShopProfile() {
    try {
        // First try to get shop profile from localStorage
        shopProfile = JSON.parse(localStorage.getItem('shopProfile')) || {};
        
        // If no shop profile in localStorage, try to get from current user
        if (!shopProfile.name && currentUser) {
            shopProfile = {
                name: currentUser.businessName || currentUser.firstName + ' ' + currentUser.lastName + ' Business',
                description: 'Business Description',
                address: currentUser.address || 'Address Line 1, City, State - PIN',
                phone: currentUser.phone || '+91 9876543210',
                gstin: currentUser.gstin || '27ABCDE1234F1Z5',
                pan: currentUser.pan || 'ABCDE1234F',
                email: currentUser.email || 'contact@business.com'
            };
        }
        
        // Update UI elements
        if (shopProfile.name && document.getElementById('shopNamePreview')) {
            document.getElementById('shopNamePreview').textContent = shopProfile.name;
        }
        if (shopProfile.description && document.getElementById('shopDescPreview')) {
            document.getElementById('shopDescPreview').textContent = shopProfile.description;
        }
        if (shopProfile.address && document.getElementById('shopAddressPreview')) {
            document.getElementById('shopAddressPreview').textContent = shopProfile.address;
        }
        
        if (document.getElementById('shopContactPreview')) {
            let contactText = '';
            if (shopProfile.phone) contactText += `Contact: ${shopProfile.phone}`;
            if (shopProfile.gstin) contactText += ` | GSTIN: ${shopProfile.gstin}`;
            if (shopProfile.pan) contactText += ` | PAN: ${shopProfile.pan}`;
            if (shopProfile.email) contactText += ` | Email: ${shopProfile.email}`;
            document.getElementById('shopContactPreview').textContent = contactText;
        }
        
        const logoContainer = document.getElementById('shopLogoContainer');
        const logoIcon = document.getElementById('shopLogoIcon');
        if (logoContainer && logoIcon) {
            if (shopProfile.logo && shopProfile.logo.startsWith('data:image')) {
                logoIcon.style.display = 'none';
                const logoImg = document.createElement('img');
                logoImg.src = shopProfile.logo;
                logoImg.alt = shopProfile.name;
                logoImg.style.width = '100%';
                logoImg.style.height = '100%';
                logoImg.style.objectFit = 'contain';
                logoContainer.appendChild(logoImg);
            }
        }
        
        if (document.getElementById('termsContent')) {
            if (shopProfile.terms) {
                document.getElementById('termsContent').textContent = shopProfile.terms;
            } else {
                document.getElementById('termsContent').textContent = 'No terms & conditions set. Please update your shop profile.';
            }
        }
        
    } catch(e) {
        console.log('Error loading shop profile:', e);
        // Set defaults
        if (document.getElementById('shopNamePreview')) {
            document.getElementById('shopNamePreview').textContent = 'Your Business Name';
        }
        if (document.getElementById('shopDescPreview')) {
            document.getElementById('shopDescPreview').textContent = 'Business Description';
        }
        if (document.getElementById('shopAddressPreview')) {
            document.getElementById('shopAddressPreview').textContent = 'Address Line 1, City, State - PIN';
        }
        if (document.getElementById('shopContactPreview')) {
            document.getElementById('shopContactPreview').textContent = 'Contact: +91 9876543210 | GSTIN: 27ABCDE1234F1Z5 | PAN: ABCDE1234F';
        }
        if (document.getElementById('termsContent')) {
            document.getElementById('termsContent').textContent = 'No terms & conditions set. Please update your shop profile.';
        }
    }
}

// Load inventory data for autocomplete (enhanced version)
function loadInventoryData() {
    try {
        // Use the global inventory array
        const itemsList = document.getElementById('itemsList');
        if (itemsList) {
            itemsList.innerHTML = '';
            
            inventory.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.setAttribute('data-hsn', item.hsn || '');
                option.setAttribute('data-unit', item.unit || 'PCS');
                option.setAttribute('data-rate', item.price || 0);
                option.setAttribute('data-gst', item.gstRate || 18);
                itemsList.appendChild(option);
            });
        }
        
    } catch(e) {
        console.log('Error loading inventory:', e);
    }
}

// Load customers for autocomplete (enhanced version)
function loadCustomers() {
    try {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const customersList = document.getElementById('customersList');
        const seen = new Set();
        if (customersList) {
            customersList.innerHTML = '';
        }
        
        const customersMap = new Map();
        
        invoices.forEach(invoice => {
            if (invoice.customer && invoice.customer.name && !seen.has(invoice.customer.name)) {
                seen.add(invoice.customer.name);
                customersMap.set(invoice.customer.name, invoice.customer);
                
                if (customersList) {
                    const option = document.createElement('option');
                    option.value = invoice.customer.name;
                    customersList.appendChild(option);
                }
            }
        });
        
        const custNameInput = document.getElementById('custName');
        if (custNameInput) {
            custNameInput.addEventListener('change', function() {
                const selectedCustomer = customersMap.get(this.value);
                if (selectedCustomer) {
                    if (document.getElementById('custMobile')) {
                        document.getElementById('custMobile').value = selectedCustomer.mobile || '';
                    }
                    if (document.getElementById('custGST')) {
                        document.getElementById('custGST').value = selectedCustomer.gstin || '';
                    }
                    if (document.getElementById('custAddress')) {
                        document.getElementById('custAddress').value = selectedCustomer.address || '';
                    }
                    if (document.getElementById('shippingAddress')) {
                        document.getElementById('shippingAddress').value = selectedCustomer.shippingAddress || '';
                    }
                }
            });
        }
        
    } catch(e) {
        console.log('Error loading customers:', e);
    }
}

// Setup GST Type Selector
function setupGstTypeSelector() {
    const gstButtons = document.querySelectorAll('.gst-type-btn');
    const gstInfo = document.getElementById('gstTypeInfo');
    
    gstButtons.forEach(button => {
        button.addEventListener('click', function() {
            gstButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentGstType = this.dataset.gstType;
            
            if (currentGstType === 'sgst-cgst') {
                if (gstInfo) {
                    gstInfo.innerHTML = `<strong>SGST + CGST Mode:</strong> Use this for sales within the same state. GST will be split equally between State GST (SGST) and Central GST (CGST).`;
                }
                if (document.getElementById('sgstRow')) {
                    document.getElementById('sgstRow').style.display = 'flex';
                }
                if (document.getElementById('cgstRow')) {
                    document.getElementById('cgstRow').style.display = 'flex';
                }
                if (document.getElementById('igstRow')) {
                    document.getElementById('igstRow').style.display = 'none';
                }
            } else {
                if (gstInfo) {
                    gstInfo.innerHTML = `<strong>IGST Mode:</strong> Use this for interstate sales. Integrated GST (IGST) will be applied instead of SGST + CGST.`;
                }
                if (document.getElementById('sgstRow')) {
                    document.getElementById('sgstRow').style.display = 'none';
                }
                if (document.getElementById('cgstRow')) {
                    document.getElementById('cgstRow').style.display = 'none';
                }
                if (document.getElementById('igstRow')) {
                    document.getElementById('igstRow').style.display = 'flex';
                }
            }
            
            calculateAllTotals();
        });
    });
}

// Setup event listeners (enhanced version)
function setupEventListenersEnhanced() {
    // Add row button
    document.getElementById('addRowBtn')?.addEventListener('click', function() {
        addItemRowEnhanced();
    });
    
    // Clear all items button
    document.getElementById('clearAllBtn')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all items?')) {
            const tbody = document.getElementById('itemsTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                for (let i = 0; i < 5; i++) {
                    addItemRowEnhanced();
                }
                calculateAllTotals();
            }
        }
    });
    
    // Clear form button
    document.getElementById('clearInvoiceBtn')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the entire form? All entered data will be lost.')) {
            const invoiceForm = document.getElementById('invoiceForm');
            if (invoiceForm) {
                invoiceForm.reset();
            }
            if (document.getElementById('additionalNotes')) {
                document.getElementById('additionalNotes').value = '';
            }
            if (document.getElementById('shippingAddress')) {
                document.getElementById('shippingAddress').value = '';
            }
            
            // Recalculate next invoice number based on latest data
            calculateNextInvoiceNumber();
            generateInvoiceNumberEnhanced();
            
            const today = new Date().toISOString().split('T')[0];
            if (document.getElementById('invoiceDate')) {
                document.getElementById('invoiceDate').value = today;
            }
            
            const tbody = document.getElementById('itemsTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                for (let i = 0; i < 5; i++) {
                    addItemRowEnhanced();
                }
            }
            
            calculateAllTotals();
        }
    });
    
    // Download PDF button - Single page PDF
    document.getElementById('downloadPDF')?.addEventListener('click', generatePDFEnhanced);
    
    // Form submission
    document.getElementById('invoiceForm')?.addEventListener('submit', saveInvoiceEnhanced);
}

// Add item row - FIXED: Amount column shows without GST
function addItemRowEnhanced() {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return null;
    
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <input type="text" class="form-control item-name" 
                   placeholder="Product/Service name" list="itemsList">
        </td>
        <td>
            <input type="text" class="form-control item-hsn" 
                   placeholder="HSN Code" readonly>
        </td>
        <td>
            <input type="number" class="form-control item-qty" 
                   placeholder="Qty" min="0" step="0.001" value="1">
        </td>
        <td>
            <input type="text" class="form-control item-unit" 
                   placeholder="Unit" readonly>
        </td>
        <td>
            <input type="number" class="form-control item-rate" 
                   placeholder="Rate" min="0" step="0.01" value="0">
        </td>
        <td>
            <input type="number" class="form-control item-gst" 
                   placeholder="%" min="0" max="100" step="0.01" value="18">
        </td>
        <td>
            <input type="text" class="form-control item-amount" 
                   placeholder="0.00" readonly>
        </td>
        <td>
            <button type="button" class="btn-icon delete" onclick="removeItemRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    const nameInput = row.querySelector('.item-name');
    const qtyInput = row.querySelector('.item-qty');
    const rateInput = row.querySelector('.item-rate');
    const gstInput = row.querySelector('.item-gst');
    
    if (nameInput) {
        nameInput.addEventListener('change', function() {
            autoFillItemDetails(this);
        });
    }
    
    [qtyInput, rateInput, gstInput].forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                calculateRowAmount(this.closest('tr'));
            });
        }
    });
    
    calculateRowAmount(row);
    
    return row;
}

// Auto-fill item details from inventory
function autoFillItemDetails(nameInput) {
    const itemName = nameInput.value;
    if (!itemName) return;
    
    const item = inventory.find(i => i.name === itemName);
    if (item) {
        const row = nameInput.closest('tr');
        if (row.querySelector('.item-hsn')) {
            row.querySelector('.item-hsn').value = item.hsn || '';
        }
        if (row.querySelector('.item-unit')) {
            row.querySelector('.item-unit').value = item.unit || 'PCS';
        }
        if (row.querySelector('.item-rate')) {
            row.querySelector('.item-rate').value = item.price || 0;
        }
        if (row.querySelector('.item-gst')) {
            row.querySelector('.item-gst').value = item.gstRate || 18;
        }
        
        calculateRowAmount(row);
    }
}

// Remove item row
function removeItemRow(button) {
    const row = button.closest('tr');
    if (row) {
        row.remove();
        updateRowNumbersEnhanced();
        calculateAllTotals();
    }
}

// Update row numbers
function updateRowNumbersEnhanced() {
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = index + 1;
    });
}

// Calculate row amount - FIXED: Amount shows without GST
function calculateRowAmount(row) {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
    const gst = parseFloat(row.querySelector('.item-gst')?.value) || 0;
    
    // Amount WITHOUT GST (simple rate addition)
    const amountWithoutGST = qty * rate;
    
    if (row.querySelector('.item-amount')) {
        row.querySelector('.item-amount').value = amountWithoutGST.toFixed(2);
    }
    
    calculateAllTotals();
}

// Calculate all totals
function calculateAllTotals() {
    let subtotal = 0;
    let sgstTotal = 0;
    let cgstTotal = 0;
    let igstTotal = 0;
    
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
        const gst = parseFloat(row.querySelector('.item-gst')?.value) || 0;
        
        const rowSubtotal = qty * rate;
        const gstAmount = rowSubtotal * (gst / 100);
        
        subtotal += rowSubtotal;
        
        if (currentGstType === 'sgst-cgst') {
            sgstTotal += gstAmount / 2;
            cgstTotal += gstAmount / 2;
        } else {
            igstTotal += gstAmount;
        }
    });
    
    const grandTotal = subtotal + sgstTotal + cgstTotal + igstTotal;
    
    // Update display
    if (document.getElementById('subtotal')) {
        document.getElementById('subtotal').textContent = `₹ ${subtotal.toFixed(2)}`;
    }
    if (document.getElementById('totSGST')) {
        document.getElementById('totSGST').textContent = `₹ ${sgstTotal.toFixed(2)}`;
    }
    if (document.getElementById('totCGST')) {
        document.getElementById('totCGST').textContent = `₹ ${cgstTotal.toFixed(2)}`;
    }
    if (document.getElementById('totIGST')) {
        document.getElementById('totIGST').textContent = `₹ ${igstTotal.toFixed(2)}`;
    }
    if (document.getElementById('grandTotal')) {
        document.getElementById('grandTotal').textContent = `₹ ${grandTotal.toFixed(2)}`;
    }
}

// Generate PDF - FIXED: Use the actual invoice number entered by user
function generatePDFEnhanced() {
    console.log('Generating PDF...');
    
    // Get the current invoice number from the form
    const currentInvoiceNumber = document.getElementById('invoiceNumber')?.value;
    console.log('Current invoice number from form:', currentInvoiceNumber);
    
    const invoiceData = collectInvoiceDataEnhanced();
    
    // Make sure we use the exact invoice number from the form
    invoiceData.invoiceNumber = currentInvoiceNumber || generateInvoiceNumberEnhanced();
    console.log('Invoice data for PDF:', invoiceData.invoiceNumber);
    
    // Use the invoice number from the form
    const pdfContent = createPDFContentEnhanced(invoiceData);
    
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        showAlert('PDF library not loaded. Please include html2pdf.js', 'danger');
        return;
    }
    
    // Single page PDF settings
    const options = {
        margin: [5, 5, 5, 5], // Minimal margins for corner-to-corner
        filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            width: 794, // A4 width in pixels at 96 DPI
            height: 1123, // A4 height in pixels at 96 DPI
            windowWidth: 794,
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    html2pdf().set(options).from(pdfContent).save();
}

// Collect invoice data (enhanced version)
function collectInvoiceDataEnhanced() {
    const items = [];
    const rows = document.querySelectorAll('#itemsTableBody tr');
    rows.forEach(row => {
        const name = row.querySelector('.item-name')?.value;
        if (name) {
            const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
            const gst = parseFloat(row.querySelector('.item-gst')?.value) || 0;
            const amountWithoutGST = qty * rate;
            const gstAmount = amountWithoutGST * (gst / 100);
            const totalWithGST = amountWithoutGST + gstAmount;
            
            items.push({
                name: name,
                hsn: row.querySelector('.item-hsn')?.value || '',
                qty: qty,
                unit: row.querySelector('.item-unit')?.value || 'PCS',
                rate: rate,
                gst: gst,
                amountWithoutGST: amountWithoutGST,
                gstAmount: gstAmount,
                totalWithGST: totalWithGST
            });
        }
    });
    
    // Get the EXACT invoice number from the form as entered by user
    let invoiceNumber = document.getElementById('invoiceNumber')?.value || generateInvoiceNumberEnhanced();
    
    return {
        invoiceNumber: invoiceNumber,
        date: document.getElementById('invoiceDate')?.value || new Date().toISOString().split('T')[0],
        note: document.getElementById('invoiceNote')?.value || '',
        customer: {
            name: document.getElementById('custName')?.value || '',
            mobile: document.getElementById('custMobile')?.value || '',
            gstin: document.getElementById('custGST')?.value || '',
            address: document.getElementById('custAddress')?.value || '',
            shippingAddress: document.getElementById('shippingAddress')?.value || ''
        },
        items: items,
        subtotal: parseFloat(document.getElementById('subtotal')?.textContent.replace('₹', '').trim() || 0),
        sgst: parseFloat(document.getElementById('totSGST')?.textContent.replace('₹', '').trim() || 0),
        cgst: parseFloat(document.getElementById('totCGST')?.textContent.replace('₹', '').trim() || 0),
        igst: parseFloat(document.getElementById('totIGST')?.textContent.replace('₹', '').trim() || 0),
        grandTotal: parseFloat(document.getElementById('grandTotal')?.textContent.replace('₹', '').trim() || 0),
        additionalNotes: document.getElementById('additionalNotes')?.value || '',
        gstType: currentGstType,
        shopProfile: shopProfile,
        terms: document.getElementById('termsContent')?.textContent || 'No terms & conditions set. Please update your shop profile.'
    };
}

// Create PDF content - Professional corner-to-corner invoice WITH LOGO and Shop Mobile/Email
// FIXED: Customer name font size increased to 16px in PDF
function createPDFContentEnhanced(data) {
    console.log('Creating PDF content with invoice number:', data.invoiceNumber);
    
    const container = document.createElement('div');
    container.style.width = '794px'; // A4 width in pixels
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, Helvetica, sans-serif';
    container.style.fontSize = '11px';
    container.style.lineHeight = '1.4';
    container.style.background = 'white';
    container.style.color = '#000000';
    container.style.boxSizing = 'border-box';
    
    // Header with logo and business info
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.borderBottom = '3px solid #000';
    header.style.paddingBottom = '15px';
    header.style.marginBottom = '20px';
    header.style.width = '100%';
    
    // Left side - Business info with logo
    const businessInfo = document.createElement('div');
    businessInfo.style.flex = '1';
    businessInfo.style.display = 'flex';
    businessInfo.style.alignItems = 'flex-start';
    businessInfo.style.gap = '15px';
    
    // Logo container
    const logoContainer = document.createElement('div');
    logoContainer.style.width = '80px';
    logoContainer.style.height = '80px';
    logoContainer.style.border = '2px solid #000';
    logoContainer.style.display = 'flex';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.justifyContent = 'center';
    logoContainer.style.overflow = 'hidden';
    logoContainer.style.background = '#fff';
    
    // Add logo if exists
    if (data.shopProfile.logo && data.shopProfile.logo.startsWith('data:image')) {
        const logoImg = document.createElement('img');
        logoImg.src = data.shopProfile.logo;
        logoImg.alt = data.shopProfile.name || 'Business Logo';
        logoImg.style.width = '100%';
        logoImg.style.height = '100%';
        logoImg.style.objectFit = 'contain';
        logoContainer.appendChild(logoImg);
    } else {
        // Default logo icon
        const defaultLogo = document.createElement('div');
        defaultLogo.style.fontSize = '30px';
        defaultLogo.style.color = '#4f46e5';
        defaultLogo.innerHTML = '<i class="fas fa-store"></i>';
        logoContainer.appendChild(defaultLogo);
    }
    
    // Business text info
    const businessText = document.createElement('div');
    businessText.style.flex = '1';
    
    // Business Name - Large and bold
    const businessName = document.createElement('h1');
    businessName.textContent = data.shopProfile.name || 'PANESAR SANITARY STORE';
    businessName.style.margin = '0 0 5px 0';
    businessName.style.fontSize = '24px';
    businessName.style.fontWeight = '900';
    businessName.style.textTransform = 'uppercase';
    businessName.style.letterSpacing = '1px';
    businessName.style.fontFamily = "'Playfair Display', 'Times New Roman', serif";
    
    // GSTIN and PAN
    const taxInfo = document.createElement('div');
    taxInfo.style.fontWeight = 'bold';
    taxInfo.style.marginBottom = '5px';
    taxInfo.style.fontSize = '11px';
    taxInfo.innerHTML = `
        GSTIN: ${data.shopProfile.gstin || '03ABRPS9453M2ZR'} &nbsp;&nbsp;&nbsp;&nbsp; 
        PAN: ${data.shopProfile.pan || 'ABRPS9453M'}
    `;
    
    // Business Description
    const businessDesc = document.createElement('div');
    businessDesc.style.fontWeight = 'bold';
    businessDesc.style.marginBottom = '5px';
    businessDesc.style.fontSize = '12px';
    businessDesc.textContent = data.shopProfile.description || 'DEALS IN : ALL KIND OF SANITARY';
    
    // Address and Contact Info
    const contactInfo = document.createElement('div');
    contactInfo.style.marginBottom = '10px';
    contactInfo.style.fontSize = '11px';
    
    let contactText = data.shopProfile.address || '#4076/4 OPP. I.T.I. GILL ROAD LUDHIANA';
    if (data.shopProfile.phone) {
        contactText += `<br>Mobile: ${data.shopProfile.phone}`;
    }
    if (data.shopProfile.email) {
        contactText += `<br>Email: ${data.shopProfile.email}`;
    }
    contactInfo.innerHTML = contactText;
    
    businessText.appendChild(businessName);
    businessText.appendChild(taxInfo);
    businessText.appendChild(businessDesc);
    businessText.appendChild(contactInfo);
    
    businessInfo.appendChild(logoContainer);
    businessInfo.appendChild(businessText);
    
    // Right side - Invoice title and number
    const invoiceInfo = document.createElement('div');
    invoiceInfo.style.textAlign = 'right';
    invoiceInfo.style.flex = '1';
    
    // Invoice title
    const invoiceTitle = document.createElement('h2');
    invoiceTitle.textContent = 'GST INVOICE';
    invoiceTitle.style.margin = '0 0 15px 0';
    invoiceTitle.style.fontSize = '28px';
    invoiceTitle.style.fontWeight = 'bold';
    invoiceTitle.style.textDecoration = 'underline';
    invoiceTitle.style.fontFamily = "'Playfair Display', 'Times New Roman', serif";
    invoiceTitle.style.color = '#000';
    
    // Invoice number and date - USING THE EXACT INVOICE NUMBER FROM FORM
    const invoiceDetails = document.createElement('div');
    invoiceDetails.style.fontSize = '14px';
    invoiceDetails.style.fontWeight = 'bold';
    invoiceDetails.innerHTML = `
        <div style="margin-bottom: 8px; font-size: 16px;">Invoice No: <span style="font-size: 18px; color: #000;">${data.invoiceNumber}</span></div>
        <div style="font-size: 14px;">Date: ${new Date(data.date).toLocaleDateString('en-IN')}</div>
    `;
    
    invoiceInfo.appendChild(invoiceTitle);
    invoiceInfo.appendChild(invoiceDetails);
    
    header.appendChild(businessInfo);
    header.appendChild(invoiceInfo);
    container.appendChild(header);
    
    // Customer and invoice details table - corner to corner
    const detailsTable = document.createElement('table');
    detailsTable.style.width = '100%';
    detailsTable.style.borderCollapse = 'collapse';
    detailsTable.style.border = '2px solid #000';
    detailsTable.style.marginBottom = '20px';
    detailsTable.style.fontSize = '10px';
    
    // Build customer info with fixed mobile and GSTIN
    // FIXED: Customer name font size increased to 16px
    let customerInfoHtml = `
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">To M/s:</div>
        <div style="margin-bottom: 5px; font-weight: bold; font-size: 16px;">${data.customer.name || ''}</div>
    `;
    
    // Always show Mobile and GSTIN (even if empty)
    customerInfoHtml += `
        <div style="margin-bottom: 3px; font-size: 12px;"><strong>Mobile:</strong> ${data.customer.mobile || 'Not Provided'}</div>
        <div style="margin-bottom: 3px; font-size: 12px;"><strong>GSTIN:</strong> ${data.customer.gstin || 'Not Provided'}</div>
    `;
    
    detailsTable.innerHTML = `
        <tr>
            <td style="border: 1px solid #000; padding: 10px; width: 50%; vertical-align: top;">
                ${customerInfoHtml}
            </td>
            <td style="border: 1px solid #000; padding: 10px; width: 50%; vertical-align: top;">
                ${data.note ? `<div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">Reference:</div>
                <div style="margin-bottom: 15px; font-size: 12px;">${data.note}</div>` : ''}
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 12px;">Shipping Address:</div>
                <div style="white-space: pre-line; font-size: 12px;">${data.customer.shippingAddress || data.customer.address || ''}</div>
            </td>
        </tr>
    `;
    
    container.appendChild(detailsTable);
    
    // Items table - corner to corner with full width
    const itemsTable = document.createElement('table');
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.border = '2px solid #000';
    itemsTable.style.marginBottom = '20px';
    itemsTable.style.fontSize = '10px';
    itemsTable.style.tableLayout = 'fixed';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 5%; font-weight: bold; font-size: 11px;">No.</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 35%; font-weight: bold; font-size: 11px;">Name of Product / Service</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 10%; font-weight: bold; font-size: 11px;">HSN Code</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 8%; font-weight: bold; font-size: 11px;">Qty</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 8%; font-weight: bold; font-size: 11px;">Unit</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 12%; font-weight: bold; font-size: 11px;">Rate</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 12%; font-weight: bold; font-size: 11px;">Amount</th>
        </tr>
    `;
    itemsTable.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    // Add actual items
    data.items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.height = '35px';
        row.innerHTML = `
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;">${index + 1}</td>
            <td style="border: 1px solid #000; padding: 6px; vertical-align: middle;">${item.name}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;">${item.hsn || ''}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;">${item.qty}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;">${item.unit}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; vertical-align: middle;">₹${item.rate.toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; vertical-align: middle;">₹${item.amountWithoutGST.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add empty rows for a total of 12 rows
    const emptyRowsNeeded = Math.max(12 - data.items.length, 0);
    for (let i = 0; i < emptyRowsNeeded; i++) {
        const row = document.createElement('tr');
        row.style.height = '35px';
        const rowNum = data.items.length + i + 1;
        row.innerHTML = `
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;">${rowNum}</td>
            <td style="border: 1px solid #000; padding: 6px; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; vertical-align: middle;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; vertical-align: middle;"></td>
        `;
        tbody.appendChild(row);
    }
    
    itemsTable.appendChild(tbody);
    container.appendChild(itemsTable);
    
    // New layout: Terms & Conditions on left, Totals on right
    const bottomContainer = document.createElement('div');
    bottomContainer.style.display = 'flex';
    bottomContainer.style.gap = '20px';
    bottomContainer.style.marginBottom = '20px';
    
    // Left side - Terms & Conditions (if available)
    if (data.terms && data.terms !== 'No terms & conditions set. Please update your shop profile.') {
        const termsDiv = document.createElement('div');
        termsDiv.style.flex = '1';
        termsDiv.style.padding = '12px';
        termsDiv.style.border = '1px solid #000';
        termsDiv.style.fontSize = '9px';
        termsDiv.style.background = '#f8f9fa';
        termsDiv.style.minHeight = '180px';
        
        const termsTitle = document.createElement('div');
        termsTitle.style.fontWeight = 'bold';
        termsTitle.style.marginBottom = '10px';
        termsTitle.style.fontSize = '11px';
        termsTitle.textContent = 'Terms & Conditions:';
        
        const termsContent = document.createElement('div');
        termsContent.innerHTML = data.terms.replace(/\n/g, '<br>');
        
        termsDiv.appendChild(termsTitle);
        termsDiv.appendChild(termsContent);
        bottomContainer.appendChild(termsDiv);
    }
    
    // Right side - Totals section
    const totalsDiv = document.createElement('div');
    totalsDiv.style.width = '300px';
    totalsDiv.style.fontSize = '12px';
    
    totalsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #ddd;">
            <div style="font-weight: bold;">Subtotal:</div>
            <div style="font-weight: bold;">₹ ${data.subtotal.toFixed(2)}</div>
        </div>
        ${data.gstType === 'sgst-cgst' ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #ddd;">
                <div>SGST:</div>
                <div>₹ ${data.sgst.toFixed(2)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #ddd;">
                <div>CGST:</div>
                <div>₹ ${data.cgst.toFixed(2)}</div>
            </div>
        ` : `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #ddd;">
                <div>IGST:</div>
                <div>₹ ${data.igst.toFixed(2)}</div>
            </div>
        `}
        <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-size: 16px; font-weight: bold;">
            <div>Grand Total:</div>
            <div>₹ ${data.grandTotal.toFixed(2)}</div>
        </div>
    `;
    
    bottomContainer.appendChild(totalsDiv);
    container.appendChild(bottomContainer);
    
    // Signature section - 2-column layout (removed company stamp)
    const signatureDiv = document.createElement('div');
    signatureDiv.style.marginTop = '50px';
    signatureDiv.style.display = 'flex';
    signatureDiv.style.justifyContent = 'space-between';
    signatureDiv.style.alignItems = 'flex-end';
    signatureDiv.style.paddingTop = '25px';
    signatureDiv.style.borderTop = '1px solid #000';
    
    // Left - Customer Signature
    const customerSign = document.createElement('div');
    customerSign.style.flex = '1';
    customerSign.innerHTML = `
        <div style="font-size: 10px; margin-bottom: 8px; font-weight: bold;">E. & O.E.</div>
        <div style="border-top: 1px solid #000; width: 80%; padding-top: 8px; font-size: 11px; font-weight: bold; margin-top: 25px;">
            Customer's Signature
        </div>
    `;
    
    // Right - Authorized Signatory
    const authorizedSign = document.createElement('div');
    authorizedSign.style.flex = '1';
    authorizedSign.style.textAlign = 'right';
    authorizedSign.innerHTML = `
        <div style="font-size: 11px; margin-bottom: 8px; font-weight: bold;">For ${data.shopProfile.name || 'Your Business Name'}</div>
        <div style="border-top: 1px solid #000; width: 80%; margin-left: auto; padding-top: 8px; font-size: 11px; font-weight: bold; margin-top: 25px;">
            Authorized Signatory
        </div>
    `;
    
    signatureDiv.appendChild(customerSign);
    signatureDiv.appendChild(authorizedSign);
    container.appendChild(signatureDiv);
    
    // Bottom left - Authorized Signature
    const bottomLeftAuthSign = document.createElement('div');
    bottomLeftAuthSign.style.marginTop = '30px';
    bottomLeftAuthSign.style.paddingTop = '15px';
    bottomLeftAuthSign.style.borderTop = '1px solid #ccc';
    bottomLeftAuthSign.style.fontSize = '12px';
    bottomLeftAuthSign.style.fontWeight = 'bold';
    bottomLeftAuthSign.style.textAlign = 'left';
    bottomLeftAuthSign.innerHTML = `
        <div>______________________</div>
        <div>Authorized Signature</div>
    `;
    container.appendChild(bottomLeftAuthSign);
    
    // Bottom note - simple and professional
    const bottomNote = document.createElement('div');
    bottomNote.style.marginTop = '10px';
    bottomNote.style.paddingTop = '10px';
    bottomNote.style.borderTop = '1px solid #ccc';
    bottomNote.style.fontSize = '9px';
    bottomNote.style.textAlign = 'center';
    bottomNote.style.color = '#666';
    
    bottomNote.innerHTML = `
        <div>This is a computer generated invoice. No signature required.</div>
    `;
    
    container.appendChild(bottomNote);
    
    return container;
}

// Save invoice (enhanced version)
function saveInvoiceEnhanced(e) {
    e.preventDefault();
    
    if (!document.getElementById('custName')?.value) {
        showAlert('Please enter customer name', 'danger');
        return;
    }
    
    if (!document.getElementById('custMobile')?.value) {
        showAlert('Please enter customer mobile number', 'danger');
        return;
    }
    
    const invoiceData = collectInvoiceDataEnhanced();
    invoiceData.id = 'inv_' + Date.now();
    invoiceData.status = 'pending';
    invoiceData.createdAt = new Date().toISOString();
    
    // Get current user from sessionStorage
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    invoiceData.createdBy = currentUser?.email || 'anonymous';
    
    try {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        invoices.push(invoiceData);
        localStorage.setItem('invoices', JSON.stringify(invoices));
        
        console.log('Invoice saved:', invoiceData.invoiceNumber);
        
        // Store this invoice number as the last used
        updateStoredInvoiceNumber(invoiceData.invoiceNumber);
        
        // After saving, recalculate next invoice number for next invoice
        calculateNextInvoiceNumber();
        generateInvoiceNumberEnhanced();
        
        showAlert(`Invoice ${invoiceData.invoiceNumber} saved successfully!`, 'success');
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showAlert('Error saving invoice. Please try again.', 'danger');
    }
}

// ============================================
// MAIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    updateNavigation();
    
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'dashboard.html':
            initDashboardPage();
            break;
        case 'invoice.html':
            initInvoicePage();
            setupInvoiceForm();
            loadShopToPreview();
            break;
        case 'create_invoice.html':
            // Enhanced invoice creation page
            console.log('Initializing enhanced create invoice page');
            
            // Set default date
            const today = new Date().toISOString().split('T')[0];
            if (document.getElementById('invoiceDate')) {
                document.getElementById('invoiceDate').value = today;
            }
            
            // Calculate next invoice number
            calculateNextInvoiceNumber();
            
            // Generate invoice number
            generateInvoiceNumberEnhanced();
            
            // Load shop profile
            loadShopProfile();
            
            // Load inventory data for autocomplete
            loadInventoryData();
            
            // Load customers for autocomplete
            loadCustomers();
            
            // Initialize 5 rows
            for (let i = 0; i < 5; i++) {
                addItemRowEnhanced();
            }
            
            // Setup GST Type Selector
            setupGstTypeSelector();
            
            // Setup Dark Mode Toggle (already handled by initializeDarkMode)
            
            // Setup event listeners
            setupEventListenersEnhanced();
            
            // Add invoice number change listener
            document.getElementById('invoiceNumber')?.addEventListener('input', function() {
                // Update the invoice label in real-time
                if (document.getElementById('invoiceLabel')) {
                    document.getElementById('invoiceLabel').textContent = this.value;
                }
            });
            
            document.getElementById('invoiceNumber')?.addEventListener('change', function() {
                updateStoredInvoiceNumber(this.value);
            });
            
            console.log('Enhanced page initialization complete');
            break;
        case 'view-invoice.html':
            initViewInvoicesPage();
            break;
        case 'inventory.html':
            initInventoryPage();
            break;
        case 'settings.html':
            initSettingsPage();
            break;
        case 'login.html':
            initLoginPage();
            break;
        case 'register.html':
            initRegisterPage();
            break;
        case 'forgot-password.html':
            initForgotPasswordPage();
            break;
        case 'reset-password.html':
            initResetPasswordPage();
            break;
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showAlert('Save functionality would be triggered here', 'info');
        }
        
        if (e.key === 'Escape') {
            closeProductModal();
            closeDeleteModal();
            document.querySelectorAll('.modal').forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
    
    if (!localStorage.getItem('demoNoticeShown')) {
        setTimeout(() => {
            if (isLoggedIn() && window.location.pathname.includes('dashboard.html')) {
                showAlert(
                    'Welcome to the GST Invoice System! This is a demo with sample data. ' +
                    'All data is stored in your browser\'s localStorage.',
                    'info',
                    10000
                );
                localStorage.setItem('demoNoticeShown', 'true');
            }
        }, 2000);
    }
});

// ============================================
// GLOBAL FUNCTIONS (accessible from HTML)
// ============================================

window.copyToClipboard = copyToClipboard;
window.showAlert = showAlert;
window.logoutUser = logoutUser;
window.showSecurityQuestionModal = showSecurityQuestionModal;
window.showResetTokenModal = showResetTokenModal;
window.exportInvoices = exportInvoices;
window.exportInventory = exportInventory;
window.exportAllData = exportAllData;
window.formatCurrency = formatCurrency;
window.addItemRow = addItemRow;
window.loadShopToPreview = loadShopToPreview;
window.setupInvoiceForm = setupInvoiceForm;
window.removeItemRow = removeItemRow;
window.generatePDFEnhanced = generatePDFEnhanced;
window.saveInvoiceEnhanced = saveInvoiceEnhanced;

// PAGE LOAD AUTHENTICATION CHECK
// Run authentication check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    
    // List of pages that require authentication
    const protectedPages = [
        'dashboard.html',
        'invoice.html',
        'create_invoice.html',
        'view-invoice.html',
        'inventory.html',
        'settings.html'
    ];
    
    // If on a protected page, check authentication
    if (protectedPages.includes(currentPage)) {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        
        if (!isLoggedIn || !currentUser) {
            // Redirect to login
            window.location.href = 'login.html';
            return;
        }
    }
});