const loadButton = document.getElementById('load');
const output = document.getElementById('output');

loadButton.addEventListener('click', async () => {
  output.textContent = 'Cargando...';
  const response = await fetch('/api/home/today');
  const data = await response.json();
  output.textContent = JSON.stringify(data, null, 2);
});
