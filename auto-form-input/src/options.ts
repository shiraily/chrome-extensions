// ...existing code...
// auto-form-input options page

import { FormInput } from './types';

const inputList = document.getElementById('input-list') as HTMLElement;
const addBtn = document.querySelector('.add-btn') as HTMLButtonElement;
const saveBtn = document.querySelector('.save-btn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLElement;

let formInputs: FormInput[] = [
  { id: 'inputItem326766', name: '住所', value: '', inputType: 'text' },
  { id: 'inputNumberItemQues326770', name: '利用人数', value: '24', inputType: 'text' }, 
  { id: 'radioItem326763--0', name: '中央区在住?', value: 'on', inputType: 'radio' }, 
];

// 初期レンダリング（ストレージ読込前に必ず3つ表示）
renderInputs();

function showStatus(message: string, isSuccess: boolean): void {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isSuccess ? 'success' : 'error'}`;
  statusDiv.style.display = 'block';
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 2000);
}

function renderInputs() {
  inputList.innerHTML = '';
  const idLabels: Record<string, string> = {
    'inputItem326766': '住所',
    'inputNumberItemQues326770': '利用人数',
    'radioItem326763--0': '中央区在住?'
  };
  formInputs.forEach((input, idx) => {
    const row = document.createElement('div');
    row.className = 'input-row';
    const label = idLabels[input.id] ? `<span style="min-width:5em;display:inline-block;">${idLabels[input.id]}</span>` : '';
    row.innerHTML = `
      ${label}
      <input type="text" placeholder="id" value="${input.id}" data-idx="${idx}" class="id-input">
      <select class="type-select" data-idx="${idx}">
        <option value="text" ${input.inputType === 'text' ? 'selected' : ''}>text</option>
        <option value="checkbox" ${input.inputType === 'checkbox' ? 'selected' : ''}>checkbox</option>
        <option value="radio" ${input.inputType === 'radio' ? 'selected' : ''}>radio</option>
      </select>
      <input type="text" placeholder="value" value="${input.value}" data-idx="${idx}" class="value-input">
      <button class="remove-btn" data-idx="${idx}">−</button>
    `;
    inputList.appendChild(row);
  });
}

addBtn.addEventListener('click', async () => {
  formInputs.push({ id: '', name: '', value: '', inputType: 'text' });
  renderInputs();
  try {
    await chrome.storage.sync.set({ formInputs });
    showStatus('追加して保存しました', true);
  } catch (error) {
    showStatus('保存失敗', false);
  }
});

inputList.addEventListener('input', (e) => {
  const target = e.target as HTMLElement;
  const idx = Number(target.getAttribute('data-idx'));
  if (target.classList.contains('id-input')) {
    formInputs[idx].id = (target as HTMLInputElement).value;
  } else if (target.classList.contains('value-input')) {
    formInputs[idx].value = (target as HTMLInputElement).value;
  } else if (target.classList.contains('type-select')) {
    formInputs[idx].inputType = (target as HTMLSelectElement).value as FormInput['inputType'];
  }
});

inputList.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('remove-btn')) {
    const idx = Number(target.getAttribute('data-idx'));
    formInputs.splice(idx, 1);
    renderInputs();
  }
});

saveBtn.addEventListener('click', async () => {
  try {
    await chrome.storage.sync.set({ formInputs });
    showStatus('保存しました', true);
  } catch (error) {
    showStatus('保存失敗', false);
  }
});

async function loadInputs() {
  try {
    const result = await chrome.storage.sync.get(['formInputs']);
    if (result.formInputs && Array.isArray(result.formInputs) && result.formInputs.length > 0) {
      formInputs = result.formInputs;
      renderInputs();
    } else {
      await chrome.storage.sync.set({ formInputs });
    }
  } catch (error) {
    showStatus('読込失敗', false);
  }
}

loadInputs();
