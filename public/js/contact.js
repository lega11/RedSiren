// CODE BY OisinMccarthy(LEGA11)
/* Contact form — validates and confirms locally. There is no mail server
   in this project, so nothing is actually sent. */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  if (!form) return;

  const rules = {
    name: v => v.trim() ? '' : 'Enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.',
    subject: v => v.trim() ? '' : 'Choose what your message is about.',
    message: v => v.trim().length >= 10 ? '' : 'Tell us a little more (at least 10 characters).'
  };

  function validateField(field) {
    const input = document.getElementById('contact-' + field);
    const errorEl = document.getElementById('error-contact-' + field);
    const message = rules[field](input.value);
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  Object.keys(rules).forEach(field => {
    const input = document.getElementById('contact-' + field);
    input.addEventListener('blur', () => validateField(field));
    input.addEventListener('input', () => {
      if (document.getElementById('error-contact-' + field).textContent) validateField(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      Site.toast('Please complete all required fields.', 'error');
      document.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    form.reset();
    document.getElementById('contact-sent').hidden = false;
    Site.toast('Message sent. We reply within two days.', 'ok');
  });
})();
// CODE BY OisinMccarthy(LEGA11)
