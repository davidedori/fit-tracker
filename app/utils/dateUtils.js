export function getDayName(date) {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  // Assicuriamoci che stiamo usando l'indice corretto del giorno
  return days[date.getDay()];
} 