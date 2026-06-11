import ActionMenuSvg from "../../assets/icons/action-menu.svg?raw";
import CommonModuleCss from "./common.module.css";

export const renderMenu = (menuNode: HTMLDivElement) => {
  const menu = document.createElement("div");
  menu.classList.add(CommonModuleCss.menuIcon);
  menu.innerHTML = ActionMenuSvg;
  menuNode.append(menu);
};
