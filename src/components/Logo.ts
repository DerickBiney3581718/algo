export const renderLogo = (): string => {
  return /*html*/ `
    <div class="logo">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<g >
    <circle cx="50" cy="15" r="15" fill="#e7e9ea"  />
    <line x1="50" y1="10" x2="10" y2="80" stroke="#e7e9ea" />
    <circle cx="15" cy="80" r="15" fill="#e7e9ea" />
    <line x1="50" y1="10" x2="80" y2="80" stroke="#e7e9ea"  />
    <circle cx="80" cy="80" r="15" fill="#e7e9ea" />
</g>
</svg>
<span class="logo-text">RGOS</span>
</div>
    `;
};
