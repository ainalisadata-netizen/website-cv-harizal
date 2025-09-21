// admin.js (Versi Login Email & Password dengan JWT)
(() => {
    const loginSection = document.getElementById('login-section');
    const editorSection = document.getElementById('editor-section');
    const messageEl = document.getElementById('message');
    const loginForm = document.getElementById('login-form');
    const editorForm = document.getElementById('editor-form');
    const formContent = document.getElementById('form-content');

    // Cek jika sudah ada token di local storage
    const token = localStorage.getItem('authToken');
    if (token) {
        loginSection.style.display = 'none';
        loadDataAndBuildForm();
        editorSection.style.display = 'block';
    }

    function showMessage(text, isError = false) {
        messageEl.textContent = text;
        messageEl.style.color = isError ? '#ff4c4c' : '#63ed7a';
    }

    async function apiFetch(url, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            if(res.status === 401 || res.status === 403) {
                // Token tidak valid atau expired, hapus token dan refresh
                localStorage.removeItem('authToken');
                window.location.reload();
            }
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    }

    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        showMessage('Logging in...');
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            const res = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (res.success && res.token) {
                localStorage.setItem('authToken', res.token);
                showMessage('Login successful!');
                loginSection.style.display = 'none';
                await loadDataAndBuildForm();
                editorSection.style.display = 'block';
            } else {
                showMessage(res.message || 'Login failed.', true);
            }
        } catch (err) {
            showMessage('Invalid email or password.', true);
        }
    });

    async function loadDataAndBuildForm() {
        try {
            showMessage('Loading data...');
            const data = await apiFetch('/get-data');
            buildForm(data);
            showMessage('');
        } catch (err) {
            showMessage('Failed to load data. Please log in again.', true);
        }
    }
    
    // Semua fungsi buildForm (buildForm, createFieldset, dll) tetap sama persis seperti sebelumnya.
    // Salin semua fungsi tersebut dari kode admin.js Anda yang lama dan tempel di sini.
    // ... (Paste all "buildForm" helper functions here) ...
    function buildForm(data) {
        formContent.innerHTML = '';
        formContent.appendChild(createFieldset('Personal Info', buildObjectInputs(data.personalInfo || {}, 'personalInfo')));
        formContent.appendChild(createFieldset('Education', buildArrayInputs(data.education || [], 'education', ['degree', 'institution', 'status'])));
        formContent.appendChild(createFieldset('Work Experience', buildArrayInputs(data.workExperience || [], 'workExperience', ['period', 'company', 'position'])));
        formContent.appendChild(createFieldset('Certifications', buildSimpleArrayInputs(data.certifications || [], 'certifications')));
        formContent.appendChild(createFieldset('Trainings', buildSimpleArrayInputs(data.trainings || [], 'trainings')));
        const projectsDiv = document.createElement('div');
        projectsDiv.classList.add('projects-container');
        const projectData = data.projects || {};
        for (const category of ['it', 'network_infrastructure', 'security']) {
            projectsDiv.appendChild(createFieldset(
                `Projects - ${formatProjectCategory(category)}`,
                buildSimpleArrayInputs(projectData[category] || [], `projects.${category}`)
            ));
        }
        formContent.appendChild(createFieldset('Projects', projectsDiv));
    }
    function createFieldset(legendText, content) {
        const fs = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = legendText;
        fs.appendChild(legend);
        fs.appendChild(content);
        return fs;
    }
    function buildObjectInputs(obj, pathPrefix) {
        const container = document.createElement('div');
        for (const key of ['name', 'title', 'address', 'email']) {
            const label = document.createElement('label');
            label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            label.htmlFor = `${pathPrefix}.${key}`;
            const input = document.createElement('input');
            input.type = key === 'email' ? 'email' : 'text';
            input.id = `${pathPrefix}.${key}`;
            input.name = `${pathPrefix}.${key}`;
            input.value = obj[key] || '';
            container.appendChild(label);
            container.appendChild(input);
        }
        return container;
    }
    function buildArrayInputs(arr, pathPrefix, keys) {
        const container = document.createElement('div');
        container.dataset.path = pathPrefix;
        arr.forEach((item, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('array-item');
            keys.forEach(key => {
                const label = document.createElement('label');
                label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.key = key;
                input.value = item[key] || '';
                itemDiv.appendChild(label);
                itemDiv.appendChild(input);
            });
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.classList.add('remove-item');
            removeBtn.onclick = () => itemDiv.remove();
            itemDiv.appendChild(removeBtn);
            container.appendChild(itemDiv);
        });
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = '+ Add Item';
        addBtn.classList.add('add-item-btn');
        addBtn.onclick = () => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('array-item');
            keys.forEach(key => {
                const label = document.createElement('label');
                label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.key = key;
                input.value = '';
                itemDiv.appendChild(label);
                itemDiv.appendChild(input);
            });
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.classList.add('remove-item');
            removeBtn.onclick = () => itemDiv.remove();
            itemDiv.appendChild(removeBtn);
            container.insertBefore(itemDiv, addBtn);
        };
        container.appendChild(addBtn);
        return container;
    }
    function buildSimpleArrayInputs(arr, pathPrefix) {
        const container = document.createElement('div');
        container.dataset.path = pathPrefix;
        arr.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('array-item');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = item || '';
            itemDiv.appendChild(input);
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.classList.add('remove-item');
            removeBtn.onclick = () => itemDiv.remove();
            itemDiv.appendChild(removeBtn);
            container.appendChild(itemDiv);
        });
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = '+ Add Item';
        addBtn.classList.add('add-item-btn');
        addBtn.onclick = () => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('array-item');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = '';
            itemDiv.appendChild(input);
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.classList.add('remove-item');
            removeBtn.onclick = () => itemDiv.remove();
            itemDiv.appendChild(removeBtn);
            container.insertBefore(itemDiv, addBtn);
        };
        container.appendChild(addBtn);
        return container;
    }
    function formatProjectCategory(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    function parseFormData() {
        const data = { personalInfo: {}, education: [], workExperience: [], certifications: [], trainings: [], projects: { it: [], network_infrastructure: [], security: [] } };
        document.querySelectorAll('[id^="personalInfo."]').forEach(input => { const key = input.id.split('.')[1]; data.personalInfo[key] = input.value; });
        document.querySelector('[data-path="education"]').querySelectorAll('.array-item').forEach(item => { const edu = {}; item.querySelectorAll('input').forEach(input => { edu[input.dataset.key] = input.value; }); if(Object.values(edu).some(v => v)) data.education.push(edu); });
        document.querySelector('[data-path="workExperience"]').querySelectorAll('.array-item').forEach(item => { const work = {}; item.querySelectorAll('input').forEach(input => { work[input.dataset.key] = input.value; }); if(Object.values(work).some(v => v)) data.workExperience.push(work); });
        document.querySelector('[data-path="certifications"]').querySelectorAll('.array-item input').forEach(input => { if(input.value) data.certifications.push(input.value); });
        document.querySelector('[data-path="trainings"]').querySelectorAll('.array-item input').forEach(input => { if(input.value) data.trainings.push(input.value); });
        document.querySelector('[data-path="projects.it"]').querySelectorAll('.array-item input').forEach(input => { if(input.value) data.projects.it.push(input.value); });
        document.querySelector('[data-path="projects.network_infrastructure"]').querySelectorAll('.array-item input').forEach(input => { if(input.value) data.projects.network_infrastructure.push(input.value); });
        document.querySelector('[data-path="projects.security"]').querySelectorAll('.array-item input').forEach(input => { if(input.value) data.projects.security.push(input.value); });
        return data;
    }

    editorForm.addEventListener('submit', async e => {
        e.preventDefault();
        showMessage('Saving...');
        try {
            const dataToSave = parseFormData();
            const res = await apiFetch('/update-data', {
                method: 'POST',
                body: JSON.stringify(dataToSave),
            });
            if (res.success) {
                showMessage('Data saved successfully!');
            } else {
                showMessage(res.message || 'Failed to save.', true);
            }
        } catch (err) {
            showMessage('Error saving data. Please log in again.', true);
        }
    });
})();