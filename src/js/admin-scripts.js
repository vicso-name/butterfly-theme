document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.block-editor-block-list__block').forEach(block => {
      const acfFields = block.querySelector('.acf-block-fields.acf-fields');

      if (!acfFields || block.classList.contains('acf-toggle-ready')) return;

      block.classList.add('acf-toggle-ready');

      if (acfFields.previousElementSibling?.classList?.contains('acf-block-toggle')) return;

      acfFields.style.display = 'none';

      const toggle = document.createElement('div');
      toggle.className = 'acf-block-toggle';
      toggle.textContent = block.getAttribute('data-title') || 'ACF Block';

      acfFields.parentNode.insertBefore(toggle, acfFields);

      toggle.addEventListener('click', () => {
        const isVisible = acfFields.style.display === 'block';
        acfFields.style.display = isVisible ? 'none' : 'block';
        block.classList.toggle('acf-expanded');
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
