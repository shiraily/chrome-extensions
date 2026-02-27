// ...existing code...
// auto-reserva-input content script

import { FormInput } from './types';


// 100msごとにformタグを監視し、自動入力を発火、成功したら終了
let intervalId: number | undefined;
function tryAutoFillForm() {
  const form = document.querySelector('form');
  if (!form) return false;
  chrome.storage.sync.get('formInputs', ({ formInputs }: { formInputs?: FormInput[] }) => {
    if (!formInputs) return;
    let success = false;
    formInputs.forEach(({ id, value, inputType }: FormInput) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (inputType === 'text') {
        (el as HTMLInputElement).value = value;
        success = true;
      } else if (inputType === 'checkbox') {
        (el as HTMLInputElement).checked = true;
        success = true;
      } else if (inputType === 'radio') {
        if ((el as HTMLInputElement).type === 'radio') {
          (el as HTMLInputElement).checked = true;
          success = true;
        }
      }
    });
    // formタグ内の全checkboxをON
    document.querySelectorAll('form input[type="checkbox"]').forEach((el) => {
      (el as HTMLInputElement).checked = true;
      success = true;
    });
    if (success && intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
      setTimeout(() => {
        const confirmBtn = document.getElementById('contact-btn__confirm');
        if (confirmBtn) {
          (confirmBtn as HTMLElement).click();
        }
      }, 10);
    }
  });
  return form !== null;
}

intervalId = window.setInterval(tryAutoFillForm, 100);
