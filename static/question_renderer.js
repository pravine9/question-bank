export function updateStats(id, correct) {
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  if (!data[id]) data[id] = { right: 0, wrong: 0, saved: false };
  if (correct) {
    data[id].right++;
  } else {
    data[id].wrong++;
  }
  localStorage.setItem('questionStats', JSON.stringify(data));
}
