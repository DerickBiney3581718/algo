import { renderLogo } from "./components/Logo";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
<section id="nav"></section>
<section class="center">
  <div>
    <h1>Master DSA</h1>
    <p>Have fun! while at it!!</p>
  </div>
</section>
`;

const navBar = document.querySelector<HTMLDivElement>("#nav")!;
navBar.innerHTML = renderLogo();
