import type { DSA_TYPE } from "../types/dsa";
import { renderArray } from "../components/arrays/Array";
import { renderMenu } from "../components/commons/Menu";
import CommonModuleCss from "../components/commons/common.module.css";
import { renderNote } from "../components/commons/Note";
import { renderPlayback } from "../components/commons/Playback";

const ARRAY = ["1", "2", "3", "4", "5"];
export const renderDSAPage = (appMain: Element, slug: DSA_TYPE) => {
  appMain.innerHTML = /*html*/ `
  <div id="container">
    <!-- menu -->
    <div id="menu"></div>
    <!-- main -->
    <div id="view">
    <div id="canvas"></div>
        <!-- playback -->
    <div id="playback"></div>
    </div>
    <!-- notes -->
    <div id="notes"></div>

    </div>
    `;

  // render menu
  const menuNode = appMain.querySelector<HTMLDivElement>("#menu")!;
  menuNode.classList.add(CommonModuleCss.closeMenu);
  renderMenu(menuNode, slug);

  menuNode.addEventListener("click", () => {
    menuNode.classList.toggle(CommonModuleCss.openMenu);
  });

  // notes
  const noteNode = appMain.querySelector("#notes")!;
  noteNode.classList.add(CommonModuleCss.closeNote);
  renderNote(noteNode);

  noteNode.addEventListener("click", () => {
    noteNode.classList.toggle(CommonModuleCss.openNote);
  });

  // playback
  const playbackNode = appMain.querySelector("#playback")!;
  renderPlayback(playbackNode);

  // canvas
  const canvasNode = appMain.querySelector("#canvas")!;
  const arrayVi = renderArray(ARRAY);
  canvasNode.prepend(arrayVi);
};
