// admin.js (SUDAH DIPERBAIKI)
(() => {
  const loginSection = document.getElementById('login-section');
  const otpSection = document.getElementById('otp-section');
  const editorSection = document.getElementById('editor-section');
  const messageEl = document.getElementById('message');

  const usernameForm = document.getElementById('username-form');
  const otpForm = document.getElementById('otp-form');
  const editorForm = document.getElementById('editor-form');
  const formContent = document.getElementById('form-content');

  // Utility: show message
  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#ff4c4c' : '#63ed7a';
  }

  // Utility: clear message
  function clearMessage() {
    messageEl.textContent = '';
  }

  // POST helper
  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  // GET helper
  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }

  // Step 1: Username form submit
  usernameForm.addEventListener('submit', async e => {
    e.preventDefault();
    clearMessage();
    const username = usernameForm.username.value.trim();
    if (!username) {
      showMessage('Please enter username.', true);
      return;
    }
    try {
      showMessage('Sending OTP...');
      const res = await postJSON('/login', {username});
      if (res.success) {
        showMessage('OTP sent to your email.');
        loginSection.style.display = 'none';
        otpSection.style.display = 'block';
      } else {
        showMessage(res.message || 'Login failed.', true);
      }
    } catch (err) {
      showMessage('Error sending OTP. Check server logs.', true);
      console.error(err);
    }
  });

  // Step 2: OTP form submit
  otpForm.addEventListener('submit', async e => {
    e.preventDefault();
    clearMessage();
    const otp = otpForm.otp.value.trim();
    if (!/^\d{6}$/.test(otp)) {
      showMessage('Please enter a valid 6-digit OTP.', true);
      return;
    }
    try {
      showMessage('Verifying OTP...');
      const res = await postJSON('/verify', {otp});
      if (res.success) {
        showMessage('Login successful.');
        otpSection.style.display = 'none';
        await loadDataAndBuildForm();
        editorSection.style.display = 'block';
      } else {
        showMessage(res.message || 'Invalid OTP.', true);
      }
    } catch (err) {
      showMessage('Error verifying OTP. Check server logs.', true);
      console.error(err);
    }
  });

  // Load data from backend and build editable form
  async function loadDataAndBuildForm() {
    try {
      showMessage('Loading data...');
      const data = await getJSON('/get-data');
      buildForm(data);
      clearMessage();
    } catch (err) {
      showMessage('Failed to load data.', true);
      console.error(err);
    }
  }

  // Build form inputs from the data object
  function buildForm(data) {
    formContent.innerHTML = '';
    // Personal Info
    formContent.appendChild(createFieldset('Personal Info', buildObjectInputs(data.personalInfo || {}, 'personalInfo')));

    // Education (array)
    formContent.appendChild(createFieldset('Education', buildArrayInputs(data.education || [], 'education', ['degree', 'institution', 'status'])));

    // Work Experience (array)
    formContent.appendChild(createFieldset('Work Experience', buildArrayInputs(data.workExperience || [], 'workExperience', ['period', 'company', 'position'])));

    // Certifications (array of strings)
    formContent.appendChild(createFieldset('Certifications', buildSimpleArrayInputs(data.certifications || [], 'certifications')));

    // Trainings (array of strings)
    formContent.appendChild(createFieldset('Trainings', buildSimpleArrayInputs(data.trainings || [], 'trainings')));

    // Projects (object with arrays)
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
  
  // (Fungsi-fungsi pembangun form seperti createFieldset, buildObjectInputs, dll. tetap sama)
    // Helpers to create fieldsets
  function createFieldset(legendText, content) {
    const fs = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = legendText;
    fs.appendChild(legend);
    fs.appendChild(content);
    return fs;
  }

  // Build inputs for simple object (key: string)
  function buildObjectInputs(obj, pathPrefix) {
    const container = document.createElement('div');
    for (const key of ['name', 'title', 'address', 'email']) { // Define order and fields
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

  // Build inputs for array of objects with specified keys
  function buildArrayInputs(arr, pathPrefix, keys) {
    const container = document.createElement('div');
    container.dataset.path = pathPrefix;
    container.dataset.keys = JSON.stringify(keys);

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

  // Build inputs for array of simple strings
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

  // *** FUNGSI INI DIGANTI TOTAL ***
  // Parse form data back into a structured JSON object
  function parseFormData() {
    const data = {
        personalInfo: {},
        education: [],
        workExperience: [],
        certifications: [],
        trainings: [],
        projects: {
            it: [],
            network_infrastructure: [],
            security: []
        }
    };

    // Personal Info
    document.querySelectorAll('[id^="personalInfo."]').forEach(input => {
        const key = input.id.split('.')[1];
        data.personalInfo[key] = input.value;
    });

    // Education
    document.querySelector('[data-path="education"]').querySelectorAll('.array-item').forEach(item => {
        const edu = {};
        item.querySelectorAll('input').forEach(input => {
            edu[input.dataset.key] = input.value;
        });
        if(Object.values(edu).some(v => v)) data.education.push(edu);
    });

    // Work Experience
    document.querySelector('[data-path="workExperience"]').querySelectorAll('.array-item').forEach(item => {
        const work = {};
        item.querySelectorAll('input').forEach(input => {
            work[input.dataset.key] = input.value;
        });
        if(Object.values(work).some(v => v)) data.workExperience.push(work);
    });

    // Certifications
    document.querySelector('[data-path="certifications"]').querySelectorAll('.array-item input').forEach(input => {
        if(input.value) data.certifications.push(input.value);
    });

    // Trainings
    document.querySelector('[data-path="trainings"]').querySelectorAll('.array-item input').forEach(input => {
        if(input.value) data.trainings.push(input.value);
    });

    // Projects
    document.querySelector('[data-path="projects.it"]').querySelectorAll('.array-item input').forEach(input => {
        if(input.value) data.projects.it.push(input.value);
    });
    document.querySelector('[data-path="projects.network_infrastructure"]').querySelectorAll('.array-item input').forEach(input => {
        if(input.value) data.projects.network_infrastructure.push(input.value);
    });
    document.querySelector('[data-path="projects.security"]').querySelectorAll('.array-item input').forEach(input => {
        if(input.value) data.projects.security.push(input.value);
    });

    return data;
  }


  // Step 3: Save changes
  editorForm.addEventListener('submit', async e => {
    e.preventDefault();
    showMessage('Saving...');
    try {
      const dataToSave = parseFormData();
      const res = await postJSON('/update-data', dataToSave);
      if (res.success) {
        showMessage('Data saved successfully!');
      } else {
        showMessage(res.message || 'Failed to save.', true);
      }
    } catch (err) {
      showMessage('Error saving data. Check server logs.', true);
      console.error(err);
    }
  });

})();