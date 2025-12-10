// Эффект волн при нажатии
export const rippleAnimation = (event, element) => {
  const circle = document.createElement('span');
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - element.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - element.getBoundingClientRect().top - radius}px`;
  circle.classList.add('ripple');
  
  element.appendChild(circle);
  
  setTimeout(() => circle.remove(), 600);
};

// Пульсация при обновлении
export const pulseAnimation = (element, duration) => {
  element.classList.add('pulse');
  setTimeout(() => element.classList.remove('pulse'), duration);
};