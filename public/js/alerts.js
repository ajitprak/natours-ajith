/* eslint-disable */

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
    hideAlert();
    const markup = `<div class="alert alert alert--${type}">${msg}</div>`;
    // afterbegin inside the begining immediately after the starting point
    const body = document.querySelector('body');
    body.insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(() => hideAlert(), 3000);
};
