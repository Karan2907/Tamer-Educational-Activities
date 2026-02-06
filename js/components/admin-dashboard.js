/**
 * Admin Dashboard Component
 * 
 * This component provides the admin dashboard interface with user management,
 * analytics, and system monitoring features.
 */

import { BaseTemplate } from '../core/base-template.js';
import AdminRoleService from './admin-role-service.js';

export class AdminDashboard extends BaseTemplate {
    constructor(containerId, firebaseService) {
        super('admin', containerId);
        this.adminService = new AdminRoleService(firebaseService);
        this.currentUser = null;
        this.currentTab = 'dashboard';
        this.stats = null;
        this.users = [];
        this.actions = [];
    }
    
    /**
     * Initialize the admin dashboard
     */
    async initialize(data = null) {
        await this.adminService.initialize();
        this.currentUser = window.platform?.getUser();
        
        if (this.currentUser && await this.adminService.checkUserAdminStatus(this.currentUser.uid)) {
            await this.loadDashboardData();
        }
        
        await super.initialize(data);
    }
    
    /**
     * Get template HTML
     */
    async getTemplateHTML() {
        if (!this.currentUser || !(await this.adminService.checkUserAdminStatus(this.currentUser.uid))) {
            return this.getUnauthorizedHTML();
        }
        
        return this.getAdminDashboardHTML();
    }
    
    /**
     * Get unauthorized access HTML
     */
    getUnauthorizedHTML() {
        return `
            <div class="admin-unauthorized text-center py-12">
                <i class="fas fa-lock text-6xl text-gray-400 mb-6"></i>
                <h2 class="text-2xl font-bold mb-4">Access Denied</h2>
                <p class="text-muted mb-6">You do not have admin privileges to access this dashboard.</p>
                <button class="btn btn-primary" onclick="window.location.href='/'">
                    <i class="fas fa-home mr-2"></i>Return to Home
                </button>
            </div>
        `;
    }
    
    /**
     * Get admin dashboard HTML
     */
    getAdminDashboardHTML() {
        return `
            <div class="admin-dashboard">
                <div class="admin-header bg-gray-800 text-white p-4 mb-6">
                    <div class="container mx-auto">
                        <div class="flex justify-between items-center">
                            <div>
                                <h1 class="text-2xl font-bold"><i class="fas fa-crown mr-2"></i>Admin Dashboard</h1>
                                <p class="text-gray-300">Manage users, content, and system settings</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="text-sm">Welcome, ${this.currentUser?.displayName || this.currentUser?.email || 'Admin'}</span>
                                <button class="btn btn-sm btn-secondary" id="logout-admin">
                                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="admin-main container mx-auto">
                    <div class="admin-tabs mb-6">
                        <div class="flex border-b">
                            <button class="tab-button px-4 py-2 font-medium ${this.currentTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-tab="dashboard">
                                <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                            </button>
                            <button class="tab-button px-4 py-2 font-medium ${this.currentTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-tab="users">
                                <i class="fas fa-users mr-2"></i>Users
                            </button>
                            <button class="tab-button px-4 py-2 font-medium ${this.currentTab === 'content' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-tab="content">
                                <i class="fas fa-file-alt mr-2"></i>Content
                            </button>
                            <button class="tab-button px-4 py-2 font-medium ${this.currentTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-tab="analytics">
                                <i class="fas fa-chart-bar mr-2"></i>Analytics
                            </button>
                            <button class="tab-button px-4 py-2 font-medium ${this.currentTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}" data-tab="logs">
                                <i class="fas fa-clipboard-list mr-2"></i>Logs
                            </button>
                        </div>
                    </div>
                    
                    <div class="admin-content">
                        ${this.renderCurrentTab()}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render current tab content
     */
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'dashboard':
                return this.renderDashboardTab();
            case 'users':
                return this.renderUsersTab();
            case 'content':
                return this.renderContentTab();
            case 'analytics':
                return this.renderAnalyticsTab();
            case 'logs':
                return this.renderLogsTab();
            default:
                return this.renderDashboardTab();
        }
    }
    
    /**
     * Render dashboard tab
     */
    renderDashboardTab() {
        const stats = this.stats || {
            totalUsers: 0,
            activeUsers: 0,
            newUsersToday: 0,
            totalActivities: 0,
            activitiesToday: 0,
            storageUsed: '0 MB',
            systemHealth: 'Unknown'
        };
        
        return `
            <div class="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Users</p>
                            <p class="text-3xl font-bold">${stats.totalUsers}</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                            <i class="fas fa-users text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Active Users</p>
                            <p class="text-3xl font-bold">${stats.activeUsers}</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                            <i class="fas fa-user-check text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">New Today</p>
                            <p class="text-3xl font-bold">${stats.newUsersToday}</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                            <i class="fas fa-user-plus text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Activities</p>
                            <p class="text-3xl font-bold">${stats.totalActivities}</p>
                        </div>
                        <div class="p-3 bg-yellow-100 rounded-full">
                            <i class="fas fa-tasks text-yellow-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Created Today</p>
                            <p class="text-3xl font-bold">${stats.activitiesToday}</p>
                        </div>
                        <div class="p-3 bg-indigo-100 rounded-full">
                            <i class="fas fa-plus-circle text-indigo-600 text-xl"></i>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Storage Used</p>
                            <p class="text-3xl font-bold">${stats.storageUsed}</p>
                        </div>
                        <div class="p-3 bg-red-100 rounded-full">
                            <i class="fas fa-hdd text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h3 class="text-lg font-bold mb-4">System Health</h3>
                    <div class="flex items-center">
                        <div class="p-2 rounded-full ${stats.systemHealth === 'Operational' ? 'bg-green-100' : 'bg-red-100'} mr-3">
                            <i class="fas ${stats.systemHealth === 'Operational' ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-600'}"></i>
                        </div>
                        <div>
                            <p class="font-medium">${stats.systemHealth}</p>
                            <p class="text-sm text-gray-600">Last checked: ${stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="card p-6">
                    <h3 class="text-lg font-bold mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button class="btn btn-outline w-full" id="refresh-stats">
                            <i class="fas fa-sync mr-2"></i>Refresh Stats
                        </button>
                        <button class="btn btn-outline w-full" id="backup-data">
                            <i class="fas fa-download mr-2"></i>Backup Data
                        </button>
                        <button class="btn btn-outline w-full" id="clear-cache">
                            <i class="fas fa-broom mr-2"></i>Clear Cache
                        </button>
                        <button class="btn btn-outline w-full" id="system-report">
                            <i class="fas fa-file-pdf mr-2"></i>System Report
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render users tab
     */
    renderUsersTab() {
        const users = this.users || [];
        
        return `
            <div class="users-management">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">User Management</h2>
                    <div class="flex gap-3">
                        <input type="text" id="user-search" placeholder="Search users..." 
                               class="px-3 py-2 border rounded-lg" style="background-color: var(--button-bg); border: 1px solid var(--button-border);">
                        <select id="role-filter" class="px-3 py-2 border rounded-lg" style="background-color: var(--button-bg); border: 1px solid var(--button-border);">
                            <option value="">All Roles</option>
                            <option value="user">User</option>
                            <option value="editor">Editor</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button class="btn btn-primary" id="refresh-users">
                            <i class="fas fa-sync mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
                
                <div class="users-table-container">
                    <table class="w-full card">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left">User</th>
                                <th class="px-4 py-3 text-left">Email</th>
                                <th class="px-4 py-3 text-left">Role</th>
                                <th class="px-4 py-3 text-left">Status</th>
                                <th class="px-4 py-3 text-left">Last Login</th>
                                <th class="px-4 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr class="border-t">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                                <i class="fas fa-user text-gray-600"></i>
                                            </div>
                                            <span>${user.displayName || user.email.split('@')[0]}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">${user.email}</td>
                                    <td class="px-4 py-3">
                                        <span class="badge ${this.getRoleBadgeClass(user.role)}">${user.role}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="badge ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                                    <td class="px-4 py-3">
                                        <div class="flex gap-2">
                                            <button class="btn btn-sm btn-outline view-user" data-user-id="${user.id}">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-warning promote-user" data-user-id="${user.id}" data-current-role="${user.role}">
                                                <i class="fas fa-arrow-up"></i>
                                            </button>
                                            <button class="btn btn-sm btn-error ban-user" data-user-id="${user.id}">
                                                <i class="fas fa-ban"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="pagination mt-6 flex justify-center">
                    <button class="btn btn-outline mr-2" id="prev-page">Previous</button>
                    <button class="btn btn-outline" id="next-page">Next</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render content tab
     */
    renderContentTab() {
        return `
            <div class="content-management">
                <h2 class="text-xl font-bold mb-6">Content Management</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Activities</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Total Activities:</span>
                                <span class="font-bold">234</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Drafts:</span>
                                <span class="font-bold">12</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Published:</span>
                                <span class="font-bold">222</span>
                            </div>
                        </div>
                        <button class="btn btn-outline w-full mt-4">Manage Activities</button>
                    </div>
                    
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Templates</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Total Templates:</span>
                                <span class="font-bold">20</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Active:</span>
                                <span class="font-bold">18</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Inactive:</span>
                                <span class="font-bold">2</span>
                            </div>
                        </div>
                        <button class="btn btn-outline w-full mt-4">Manage Templates</button>
                    </div>
                    
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Media</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Total Files:</span>
                                <span class="font-bold">45</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Storage Used:</span>
                                <span class="font-bold">2.4 GB</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Unused:</span>
                                <span class="font-bold">8</span>
                            </div>
                        </div>
                        <button class="btn btn-outline w-full mt-4">Manage Media</button>
                    </div>
                </div>
                
                <div class="card p-6">
                    <h3 class="text-lg font-bold mb-4">Content Moderation</h3>
                    <div class="flex gap-4">
                        <button class="btn btn-warning flex-1">
                            <i class="fas fa-flag mr-2"></i>Review Pending Content
                        </button>
                        <button class="btn btn-danger flex-1">
                            <i class="fas fa-trash mr-2"></i>Clean Up Orphaned Files
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render analytics tab
     */
    renderAnalyticsTab() {
        return `
            <div class="analytics-dashboard">
                <h2 class="text-xl font-bold mb-6">Analytics Dashboard</h2>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">User Engagement</h3>
                        <canvas id="engagement-chart" height="200"></canvas>
                    </div>
                    
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Activity Completion</h3>
                        <canvas id="completion-chart" height="200"></canvas>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Top Performing Activities</h3>
                        <ul class="space-y-2">
                            <li class="flex justify-between">Quiz: Science - <span class="font-bold">85%</span></li>
                            <li class="flex justify-between">Flashcards: Spanish - <span class="font-bold">78%</span></li>
                            <li class="flex justify-between">Drag & Drop: History - <span class="font-bold">72%</span></li>
                        </ul>
                    </div>
                    
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Most Active Users</h3>
                        <ul class="space-y-2">
                            <li class="flex justify-between">john_doe - <span class="font-bold">24 activities</span></li>
                            <li class="flex justify-between">jane_smith - <span class="font-bold">18 activities</span></li>
                            <li class="flex justify-between">bob_wilson - <span class="font-bold">15 activities</span></li>
                        </ul>
                    </div>
                    
                    <div class="card p-6">
                        <h3 class="text-lg font-bold mb-4">Traffic Sources</h3>
                        <ul class="space-y-2">
                            <li class="flex justify-between">Direct - <span class="font-bold">45%</span></li>
                            <li class="flex justify-between">Search - <span class="font-bold">30%</span></li>
                            <li class="flex justify-between">Social - <span class="font-bold">25%</span></li>
                        </ul>
                    </div>
                </div>
                
                <div class="card p-6">
                    <h3 class="text-lg font-bold mb-4">Export Reports</h3>
                    <div class="flex gap-3">
                        <button class="btn btn-primary">
                            <i class="fas fa-file-pdf mr-2"></i>Export PDF Report
                        </button>
                        <button class="btn btn-outline">
                            <i class="fas fa-file-excel mr-2"></i>Export Excel
                        </button>
                        <button class="btn btn-outline">
                            <i class="fas fa-cog mr-2"></i>Schedule Reports
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render logs tab
     */
    renderLogsTab() {
        const actions = this.actions || [];
        
        return `
            <div class="audit-logs">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Audit Logs</h2>
                    <div class="flex gap-3">
                        <select id="log-filter" class="px-3 py-2 border rounded-lg" style="background-color: var(--button-bg); border: 1px solid var(--button-border);">
                            <option value="">All Actions</option>
                            <option value="login">Login</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="admin">Admin Actions</option>
                        </select>
                        <input type="date" id="date-filter" class="px-3 py-2 border rounded-lg" style="background-color: var(--button-bg); border: 1px solid var(--button-border);">
                        <button class="btn btn-primary" id="refresh-logs">
                            <i class="fas fa-sync mr-2"></i>Refresh
                        </button>
                    </div>
                </div>
                
                <div class="logs-table-container">
                    <table class="w-full card">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left">Time</th>
                                <th class="px-4 py-3 text-left">User</th>
                                <th class="px-4 py-3 text-left">Action</th>
                                <th class="px-4 py-3 text-left">Details</th>
                                <th class="px-4 py-3 text-left">IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${actions.map(action => `
                                <tr class="border-t">
                                    <td class="px-4 py-3">${new Date(action.timestamp).toLocaleString()}</td>
                                    <td class="px-4 py-3">${action.adminId || action.userId}</td>
                                    <td class="px-4 py-3">
                                        <span class="badge ${this.getActionBadgeClass(action.action)}">${action.action}</span>
                                    </td>
                                    <td class="px-4 py-3">${JSON.stringify(action.details || {}).substring(0, 50)}...</td>
                                    <td class="px-4 py-3">${action.ip || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="pagination mt-6 flex justify-center">
                    <button class="btn btn-outline mr-2">Previous</button>
                    <button class="btn btn-outline">Next</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Get role badge class
     */
    getRoleBadgeClass(role) {
        const roleClasses = {
            'user': 'bg-gray-100 text-gray-800',
            'editor': 'bg-blue-100 text-blue-800',
            'moderator': 'bg-purple-100 text-purple-800',
            'admin': 'bg-red-100 text-red-800',
            'superadmin': 'bg-yellow-100 text-yellow-800'
        };
        
        return roleClasses[role] || 'bg-gray-100 text-gray-800';
    }
    
    /**
     * Get action badge class
     */
    getActionBadgeClass(action) {
        const actionClasses = {
            'login': 'bg-green-100 text-green-800',
            'logout': 'bg-red-100 text-red-800',
            'create': 'bg-blue-100 text-blue-800',
            'update': 'bg-yellow-100 text-yellow-800',
            'delete': 'bg-red-100 text-red-800',
            'promote_user': 'bg-purple-100 text-purple-800',
            'ban_user': 'bg-orange-100 text-orange-800'
        };
        
        return actionClasses[action] || 'bg-gray-100 text-gray-800';
    }
    
    /**
     * Called after render completes
     */
    async afterRender() {
        this.initializeEventListeners();
        
        // Initialize charts if on analytics tab
        if (this.currentTab === 'analytics') {
            this.initializeCharts();
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Tab switching
        const tabButtons = this.getElements('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab-button').dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Logout button
        const logoutBtn = this.getElement('#logout-admin');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (this.firebaseService) {
                    await this.firebaseService.signOut();
                    window.location.reload();
                }
            });
        }
        
        // Refresh stats button
        const refreshStatsBtn = this.getElement('#refresh-stats');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }
        
        // Refresh users button
        const refreshUsersBtn = this.getElement('#refresh-users');
        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => {
                this.loadUsers();
            });
        }
        
        // Refresh logs button
        const refreshLogsBtn = this.getElement('#refresh-logs');
        if (refreshLogsBtn) {
            refreshLogsBtn.addEventListener('click', () => {
                this.loadLogs();
            });
        }
        
        // User action buttons
        const promoteButtons = this.getElements('.promote-user');
        promoteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.closest('.promote-user').dataset.userId;
                const currentRole = e.target.closest('.promote-user').dataset.currentRole;
                this.promoteUser(userId, currentRole);
            });
        });
        
        const banButtons = this.getElements('.ban-user');
        banButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.closest('.ban-user').dataset.userId;
                this.banUser(userId);
            });
        });
        
        // Search and filter functionality
        const userSearch = this.getElement('#user-search');
        if (userSearch) {
            userSearch.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }
        
        const roleFilter = this.getElement('#role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterUsersByRole(e.target.value);
            });
        }
    }
    
    /**
     * Switch to a different tab
     */
    async switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab button states
        const tabButtons = this.getElements('.tab-button');
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('border-b-2', 'border-blue-500', 'text-blue-600');
                button.classList.remove('text-gray-600', 'hover:text-gray-800');
            } else {
                button.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600');
                button.classList.add('text-gray-600', 'hover:text-gray-800');
            }
        });
        
        // Re-render content
        const contentContainer = this.getElement('.admin-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderCurrentTab();
            this.afterRender();
        }
    }
    
    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            this.stats = await this.adminService.getDashboardStats(this.currentUser.uid);
            
            // Re-render if on dashboard tab
            if (this.currentTab === 'dashboard') {
                const contentContainer = this.getElement('.admin-content');
                if (contentContainer) {
                    contentContainer.innerHTML = this.renderCurrentTab();
                    this.afterRender();
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }
    
    /**
     * Load users
     */
    async loadUsers() {
        try {
            this.users = await this.adminService.getUserList(this.currentUser.uid);
            
            // Re-render if on users tab
            if (this.currentTab === 'users') {
                const contentContainer = this.getElement('.admin-content');
                if (contentContainer) {
                    contentContainer.innerHTML = this.renderCurrentTab();
                    this.afterRender();
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load users');
        }
    }
    
    /**
     * Load logs
     */
    async loadLogs() {
        try {
            this.actions = await this.adminService.getRecentActions(this.currentUser.uid);
            
            // Re-render if on logs tab
            if (this.currentTab === 'logs') {
                const contentContainer = this.getElement('.admin-content');
                if (contentContainer) {
                    contentContainer.innerHTML = this.renderCurrentTab();
                    this.afterRender();
                }
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Failed to load logs');
        }
    }
    
    /**
     * Filter users by search term
     */
    filterUsers(searchTerm) {
        // This would normally filter the user list
        console.log('Filtering users:', searchTerm);
    }
    
    /**
     * Filter users by role
     */
    filterUsersByRole(role) {
        // This would normally filter the user list by role
        console.log('Filtering users by role:', role);
    }
    
    /**
     * Promote user to higher role
     */
    async promoteUser(userId, currentRole) {
        try {
            // Determine next role in hierarchy
            const roleHierarchy = this.adminService.getRoleHierarchy();
            const roles = Object.keys(roleHierarchy).sort((a, b) => roleHierarchy[a] - roleHierarchy[b]);
            const currentIndex = roles.indexOf(currentRole);
            const nextIndex = Math.min(currentIndex + 1, roles.length - 1);
            const nextRole = roles[nextIndex];
            
            if (confirm(`Promote user to ${nextRole}?`)) {
                await this.adminService.promoteToAdmin(this.currentUser.uid, userId, nextRole);
                this.showSuccess(`User promoted to ${nextRole}`);
                this.loadUsers(); // Refresh user list
            }
        } catch (error) {
            console.error('Error promoting user:', error);
            this.showError('Failed to promote user: ' + error.message);
        }
    }
    
    /**
     * Ban user
     */
    async banUser(userId) {
        const reason = prompt('Enter reason for banning:');
        if (reason) {
            try {
                await this.adminService.banUser(this.currentUser.uid, userId, reason);
                this.showSuccess('User banned successfully');
                this.loadUsers(); // Refresh user list
            } catch (error) {
                console.error('Error banning user:', error);
                this.showError('Failed to ban user: ' + error.message);
            }
        }
    }
    
    /**
     * Initialize charts for analytics tab
     */
    initializeCharts() {
        // This would initialize Chart.js or similar library
        // For now, we'll just log that charts should be initialized
        console.log('Initializing analytics charts...');
        
        // In a real implementation, you would create charts using Chart.js
        /*
        const engagementCtx = document.getElementById('engagement-chart').getContext('2d');
        new Chart(engagementCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'User Engagement',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'User Engagement Over Time'
                    }
                }
            }
        });
        */
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        // Create a toast notification or alert
        alert(message);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        // Create a toast notification or alert
        alert('Error: ' + message);
    }
    
    /**
     * Template-specific validation
     */
    validateTemplateData() {
        return {
            valid: true,
            errors: []
        };
    }
}

// Export the component
export default AdminDashboard;