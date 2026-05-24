import { type DSA_TYPE } from "../../types/dsa";
import ActionMenuSvg from "../../assets/icons/action-menu.svg?raw";
import CommonModuleCss from "./common.module.css";

export const renderMenu = (menuNode: HTMLDivElement, slug: DSA_TYPE) => {
  const menu = document.createElement("div");
  menu.classList.add(CommonModuleCss.menuIcon);
  menu.innerHTML = ActionMenuSvg;
  menuNode.append(menu);
};
