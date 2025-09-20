// admin.js
(() => {
  const loginSection = document.getElementById('login-section');
  const otpSection = document.getElementById('otp-section');
  const editorSection = document.getElementById('editor-section');
  const messageEl = document.getElementById('message');

  const usernameForm = document.getElementById('username-form');
  const otpForm = document.getElementById('otp-form');
  const editorForm = document.getElementById('editor-form');
  const formContent = document.getElementById('form-content');

  let authToken = null; // simple token to track login state (not JWT, just for demo)
  let currentData = null;

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
    const res = await fetch(url, {credentials: 'include'});
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
      showMessage('Error sending OTP. Try again.', true);
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
        authToken = res.token || 'authenticated'; // token for future requests if needed
        otpSection.style.display = 'none';
        await loadDataAndBuildForm();
        editorSection.style.display = 'block';
      } else {
        showMessage(res.message || 'Invalid OTP.', true);
      }
    } catch (err) {
      showMessage('Error verifying OTP. Try again.', true);
      console.error(err);
    }
  });

  // Load data.json from backend and build editable form
  async function loadDataAndBuildForm() {
    try {
      showMessage('Loading data...');
      const data = await getJSON('/get-data');
      currentData = data;
      buildForm(data);
      clearMessage();
    } catch (err) {
      showMessage('Failed to load data.', true);
      console.error(err);
    }
  }

  // Build form inputs recursively for the data object
  function buildForm(data) {
    formContent.innerHTML = '';
    // Personal Info
    formContent.appendChild(createFieldset('Personal Info', buildObjectInputs(data.personalInfo, 'personalInfo')));

    // Education (array)
    formContent.appendChild(createFieldset('Education', buildArrayInputs(data.education, 'education', ['degree', 'institution', 'status'])));

    // Work Experience (array)
    formContent.appendChild(createFieldset('Work Experience', buildArrayInputs(data.workExperience, 'workExperience', ['period', 'company', 'position'])));

    // Certifications (array of strings)
    formContent.appendChild(createFieldset('Certifications', buildSimpleArrayInputs(data.certifications, 'certifications')));

    // Trainings (array of strings)
    formContent.appendChild(createFieldset('Trainings', buildSimpleArrayInputs(data.trainings, 'trainings')));

    // Projects (object with arrays)
    const projectsDiv = document.createElement('div');
    projectsDiv.classList.add('projects-container');
    for (const category in data.projects) {
      projectsDiv.appendChild(createFieldset(
        `Projects - ${formatProjectCategory(category)}`,
        buildSimpleArrayInputs(data.projects[category], `projects.${category}`)
      ));
    }
    formContent.appendChild(createFieldset('Projects', projectsDiv));
  }

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
    for (const key in obj) {
      const label = document.createElement('label');
      label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      label.htmlFor = `${pathPrefix}-${key}`;
      const input = document.createElement('input');
      input.type = key === 'email' ? 'email' : 'text';
      input.id = `${pathPrefix}-${key}`;
      input.name = `${pathPrefix}.${key}`;
      input.value = obj[key];
      container.appendChild(label);
      container.appendChild(input);
    }
    return container;
  }

  // Build inputs for array of objects with specified keys
  function buildArrayInputs(arr, pathPrefix, keys) {
    const container = document.createElement('div');
    arr.forEach((item, idx) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('array-item');
      keys.forEach(key => {
        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        label.htmlFor = `${pathPrefix}-${idx}-${key}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `${pathPrefix}-${idx}-${key}`;
        input.name = `${pathPrefix}[${idx}].${key}`;
        input.value = item[key] || '';
        itemDiv.appendChild(label);
        itemDiv.appendChild(input);
      });
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.classList.add('remove-item');
      removeBtn.title = 'Remove item';
      removeBtn.addEventListener('click', () => {
        itemDiv.remove();
      });
      itemDiv.appendChild(removeBtn);
      container.appendChild(itemDiv);
    });
    // Add button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Item';
    addBtn.classList.add('add-item-btn');
    addBtn.addEventListener('click', () => {
      const newItem = {};
      keys.forEach(k => newItem[k] = '');
      const idx = container.querySelectorAll('.array-item').length;
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('array-item');
      keys.forEach(key => {
        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        label.htmlFor = `${pathPrefix}-${idx}-${key}`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `${pathPrefix}-${idx}-${key}`;
        input.name = `${pathPrefix}[${idx}].${key}`;
        input.value = '';
        itemDiv.appendChild(label);
        itemDiv.appendChild(input);
      });
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.classList.add('remove-item');
      removeBtn.title = 'Remove item';
      removeBtn.addEventListener('click', () => {
        itemDiv.remove();
      });
      itemDiv.appendChild(removeBtn);
      container.appendChild(itemDiv);
    });
    container.appendChild(addBtn);
    return container;
  }

  // Build inputs for array of simple strings
  function buildSimpleArrayInputs(arr, pathPrefix) {
    const container = document.createElement('div');
    arr.forEach((item, idx) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('array-item');
      const label = document.createElement('label');
      label.textContent = `Item ${idx + 1}`;
      label.htmlFor = `${pathPrefix}-${idx}`;
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `${pathPrefix}-${idx}`;
      input.name = `${pathPrefix}[${idx}]`;
      input.value = item;
      itemDiv.appendChild(label);
      itemDiv.appendChild(input);
      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.classList.add('remove-item');
      removeBtn.title = 'Remove item';
      removeBtn.addEventListener('click', () => {
        itemDiv.remove();
      });
      itemDiv.appendChild(removeBtn);
      container.appendChild(itemDiv);
    });
    // Add button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Item';
    addBtn.classList.add('add-item-btn');
    addBtn.addEventListener('click', () => {
      const idx = container.querySelectorAll('.array-item').length;
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('array-item');
      const label = document.createElement('label');
      label.textContent = `Item ${idx + 1}`;
      label.htmlFor = `${pathPrefix}-${idx}`;
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `${pathPrefix}-${idx}`;
      input.name = `${pathPrefix}[${idx}]`;
      input.value = '';
      itemDiv.appendChild(label);
      itemDiv.appendChild(input);
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.classList.add('remove-item');
      removeBtn.title = 'Remove item';
      removeBtn.addEventListener('click', () => {
        itemDiv.remove();
      });
      itemDiv.appendChild(removeBtn);
      container.appendChild(itemDiv);
    });
    container.appendChild(addBtn);
    return container;
  }

  // Format project category keys to readable text
  function formatProjectCategory(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Parse form data back into structured JSON matching data.json
  function parseFormData(form) {
    const formData = new FormData(form);
    const obj = {};

    // Helper to set nested keys
    function setNested(obj, path, value) {
      const keys = path.split('.');
      let cur = obj;
      keys.forEach((k, i) => {
        // Handle array notation like key[index]
        const arrayMatch = k.match(/^(\w+)\$(\d+)\$$/);
        if (arrayMatch) {
          const arrKey = arrayMatch[1];
          const idx = parseInt(arrayMatch[2], 10);
          if (!cur[arrKey]) cur[arrKey] = [];
          while (cur[arrKey].length <= idx) cur[arrKey].push(null);
          if (i === keys.length - 1) {
            cur[arrKey][idx] = value;
          } else {
            if (!cur[arrKey][idx]) cur[arrKey][idx] = {};
            cur = cur[arrKey][idx];
          }
        } else {
          if (i === keys.length - 1) {
            cur[k] = value;
          } else {
            if (!cur[k]) cur[k] = {};
            cur = cur[k];
          }
        }
      });
    }

    // Collect all keys and values
    for (const [key, value] of formData.entries()) {
      setNested(obj, key, value.trim());
    }

    // Post-process arrays of objects: remove nulls and empty items
    if (obj.education) {
      obj.education = obj.education.filter(item => item && Object.values(item).some(v => v));
    }
    if (obj.workExperience) {
      obj.workExperience = obj.workExperience.filter(item => item && Object.values(item).some(v => v));
    }
    if (obj.certifications) {
      obj.certifications = obj.certifications.filter(v => v);
    }
    if (obj.trainings) {
      obj.trainings = obj.trainings.filter(v => v);
    }
    if (obj.projects) {
      for (const cat in obj.projects) {
        obj.projects[cat] = obj.projects[cat].filter(v => v);
      }
    }

    return obj;
  }

  // Step 3: Save changes
  editorForm.addEventListener('