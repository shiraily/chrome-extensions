// ...existing code...
// auto-form-input content script

import { FormInput } from './types';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'autoFillForm') {
    chrome.storage.sync.get('formInputs', ({ formInputs }: { formInputs?: FormInput[] }) => {
      if (!formInputs) return;
      // 1. 指定idの要素に値を入力
      formInputs.forEach(({ id, value, inputType }: FormInput) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (inputType === 'text') {
          (el as HTMLInputElement).value = value;
        } else if (inputType === 'checkbox') {
          (el as HTMLInputElement).checked = true;
        } else if (inputType === 'radio') {
          if ((el as HTMLInputElement).type === 'radio') {
            (el as HTMLInputElement).checked = true;
          }
        }
      });
      // 2. formタグ内の全checkboxをON
      document.querySelectorAll('form input[type="checkbox"]').forEach((el) => {
        (el as HTMLInputElement).checked = true;
      });
    });
  }
});
