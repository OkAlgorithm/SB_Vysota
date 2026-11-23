import('./app.js').catch(error => {
  const status = document.querySelector('#launch-status');
  const retry = document.querySelector('#launch-retry');
  if (status) status.textContent = 'Не удалось загрузить курс. Попробуйте перезагрузить страницу.';
  if (retry) retry.hidden = false;
  console.error('Course startup failed', error);
});
