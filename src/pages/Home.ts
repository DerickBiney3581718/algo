import { renderAlgoGrid } from "../components/algo-grid/AlgoGrid";

export const renderHomePage = (appMain: Element) => {
  appMain.innerHTML = /*html*/ `
  <section class="center">
      <div>Master DSA</div>
      <p>Have fun! while at it!!</p>
  </section>
  <div id="algo-grid"></div>`;

  const algoGridNode = appMain.querySelector("#algo-grid")!;
  console.log(" algo grid node: ", algoGridNode);
  renderAlgoGrid(algoGridNode);
};
