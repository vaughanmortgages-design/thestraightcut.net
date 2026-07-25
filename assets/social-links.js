(() => {
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/straightcutguide/',
      icon: '<path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm.5 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/profile.php?id=61590185402033',
      icon: '<path d="M13.5 22v-9h3l.5-3h-3.5V8.2c0-.9.3-1.7 1.8-1.7H17V3.8c-.7-.1-1.6-.3-2.8-.3-2.8 0-4.7 1.7-4.7 4.9V10H6.4v3h3.1v9h4z"/>'
    },
    {
      name: 'Pinterest',
      url: 'https://ca.pinterest.com/straightcutguide/',
      icon: '<path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-1.6 0-3.5.4-5.2l1.3-5.5s-.3-.7-.3-1.8c0-1.7 1-3 2.2-3 1 0 1.6.8 1.6 1.7 0 1-.7 2.6-1 4-.5 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5.1-5-3.5 0-5.5 2.6-5.5 5.3 0 1 .4 2.2.9 2.8.1.1.1.2.1.4l-.3 1.3c-.1.4-.4.5-.8.3-1.8-.8-2.9-3-2.9-4.9 0-4 2.9-7.7 8.4-7.7 4.4 0 7.8 3.1 7.8 7.3 0 4.4-2.8 7.9-6.6 7.9-1.3 0-2.5-.7-2.9-1.5l-.8 3c-.3 1.1-1.1 2.5-1.6 3.3.9.3 1.9.4 2.9.4A10 10 0 0 0 12 2z"/>'
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@RayCutter',
      icon: '<path d="M23 7.3a3 3 0 0 0-2.1-2.1C19 4.7 12 4.7 12 4.7s-7 0-8.9.5A3 3 0 0 0 1 7.3 31 31 0 0 0 .5 12c0 1.6.2 3.2.5 4.7a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.3-1.5.5-3.1.5-4.7s-.2-3.2-.5-4.7zM9.7 15.5v-7L16 12l-6.3 3.5z"/>'
    }
  ];

  const footer = document.querySelector('footer');
  if (!footer || footer.querySelector('[data-official-social-links]')) return;

  const row = footer.querySelector('.social-row') || document.createElement('nav');
  row.classList.add('official-social-row');
  row.setAttribute('data-official-social-links', '');
  row.setAttribute('aria-label', 'Follow The Straight Cut');

  socialLinks.forEach(({ name, url, icon }) => {
    const link = document.createElement('a');
    link.className = 'official-social-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Follow The Straight Cut on ${name}`);
    link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg>`;
    row.append(link);
  });

  if (!row.isConnected) {
    const brand = footer.querySelector('.footer-top > div:first-child, .footer-brand') || footer;
    brand.append(row);
  }

  const style = document.createElement('style');
  style.textContent = `
    .official-social-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
    .official-social-link{align-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;color:inherit;display:inline-flex;height:44px;justify-content:center;min-width:44px;transition:border-color .16s ease,color .16s ease,transform .16s ease;width:44px}
    .official-social-link svg{fill:currentColor;height:20px;width:20px}
    .official-social-link:hover{border-color:#c8a858;color:#c8a858;transform:translateY(-2px)}
    .official-social-link:focus-visible{outline:3px solid #c8a858;outline-offset:3px}
    @media(max-width:600px){.official-social-link{height:48px;min-width:48px;width:48px}}
  `;
  document.head.append(style);
})();
