import { renderMenu } from "../components/commons/Menu";
import CommonModuleCss from "../components/commons/common.module.css";
import { renderNote } from "../components/commons/Note";
import { renderPlayback } from "../components/commons/Playback";
import { DSA_TYPES, type DSA_TYPE } from "../types/dsa";
import { renderArray } from "../components/arrays/array.renderer";
import { watch, state } from "../common/store";

export const renderDSAPage = (appMain: Element, pathname: DSA_TYPE) => {
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
  renderMenu(menuNode);

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
  const { ds, reducer } = router[pathname](canvasNode);
  watch(ds, reducer);
  ds.search(45);
  ds.update(4, 4);
  console.log("state...", state);
};

export const router: Record<DSA_TYPE, Function> = {
  [DSA_TYPES.ARRAYS]: renderArray,
};
