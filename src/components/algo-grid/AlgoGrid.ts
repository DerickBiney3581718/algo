import algoGridCss from "./algo-grid.module.css";

const dsas = ["Arrays", "Linked-Lists"];

const renderAlgoCard = (title: string): HTMLAnchorElement => {
  const cardNode = document.createElement("a");
  cardNode.className = algoGridCss.algoCard;
  cardNode.href = `/${title.toLowerCase().replaceAll(" ", "_")}`;
  cardNode.innerHTML = /*html*/ `<div><span> ${title} </span></div>`;

  return cardNode;
};

export const renderAlgoGrid = (algoGridNode: Element) => {
  const cards = dsas.map((title) => renderAlgoCard(title));
  algoGridNode.append(...cards);
};
