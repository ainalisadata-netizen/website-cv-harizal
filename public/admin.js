// admin.js (Final Version with Inbox)
(() => {
    const loginSection = document.getElementById('login-section');
    const mainAdminPanel = document.getElementById('main-admin-panel');
    const editorSection = document.getElementById('editor-section');
    const inboxSection = document.getElementById('inbox-section');
    const messageEl = document.getElementById('message');
    const loginForm = document.getElementById('login-form');
    const editorForm = document.getElementById('editor-form');
    const formContent = document.getElementById('form-content');
    const inboxContent = document.getElementById('inbox-content');
    const navEditorBtn = document.getElementById('nav-editor-btn');
    const navInboxBtn = document.getElementById('nav-inbox-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const token = localStorage.getItem('authToken');
    if (token) {
        loginSection.style.display = 'none';
        mainAdminPanel.style.display = 'block';
        loadDataAndBuildForm();
    }

    function showMessage(text, isError = false) { /* ... (fungsi sama) ... */ }
    async function apiFetch(url, options = {}) { /* ... (fungsi sama) ... */ }

    // --- NAVIGASI ---
    navEditorBtn.addEventListener('click', () => {
        inboxSection.style.display = 'none';
        editorSection.style.display = 'block';
        navInboxBtn.classList.remove('active');
        navEditorBtn.classList.add('active');
    });

    navInboxBtn.addEventListener('click', () => {
        editorSection.style.display = 'none';
        inboxSection.style.display = 'block';
        navEditorBtn.classList.remove('active');
        navInboxBtn.classList.add('active');
        loadInbox();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.reload();
    });

    // --- LOGIKA LOGIN (tetap sama) ---
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        // ... (kode login sama persis seperti sebelumnya)
    });

    // --- LOGIKA EDITOR (tetap sama) ---
    async function loadDataAndBuildForm() { /* ... (fungsi sama) ... */ }
    editorForm.addEventListener('submit', async e => {
        e.preventDefault();
        // ... (kode save changes sama persis seperti sebelumnya)
    });

    // --- LOGIKA INBOX BARU ---
    async function loadInbox() {
        showMessage('Loading inbox...');
        try {
            const requests = await apiFetch('/get-requests');
            displayInbox(requests);
            showMessage('');
        } catch (err) {
            showMessage('Failed to load inbox.', true);
        }
    }

    function displayInbox(requests) {
        inboxContent.innerHTML = '';
        if (requests.length === 0) {
            inboxContent.innerHTML = '<p>No new CV requests.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Message</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        requests.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(req.createdAt).toLocaleString('id-ID')}</td>
                <td>${escapeHtml(req.name)}</td>
                <td><a href="mailto:${escapeHtml(req.email)}">${escapeHtml(req.email)}</a></td>
                <td>${escapeHtml(req.company)}</td>
                <td><p class="message-cell">${escapeHtml(req.message)}</p></td>
                <td><button class="delete-btn" data-id="${req._id}">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
        inboxContent.appendChild(table);

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this request?')) {
                    try {
                        showMessage('Deleting...');
                        await apiFetch(`/delete-request/${id}`, { method: 'DELETE' });
                        showMessage('Request deleted.');
                        loadInbox(); // Refresh inbox
                    } catch (err) {
                        showMessage('Failed to delete request.', true);
                    }
                }
            });
        });
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m]);
    }
    
    // Semua fungsi pembangun form (buildForm, createFieldset, dll) tetap sama
    // ... (salin semua fungsi helper buildForm, createFieldset, parseFormData, dll. dari admin.js sebelumnya ke sini)
})();