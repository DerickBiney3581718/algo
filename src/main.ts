import { renderLogo } from "./components/Logo";
import { renderDSAPage } from "./pages/DSA";
import { renderHomePage } from "./pages/Home";
import type { DSA_TYPE } from "./types/dsa";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
<section id="nav"></section>
<main id="app-main"></main>
`;

const appMain = document.querySelector("#app-main")!;

const navBar = document.querySelector<HTMLDivElement>("#nav")!;
navBar.innerHTML = renderLogo();

const pathname = window.location.pathname.replaceAll("/", "");

switch (pathname) {
  case "":
    renderHomePage(appMain);
    break;
  default:
    renderDSAPage(appMain, pathname as DSA_TYPE);
}
