import NoteSvg from "../../assets/icons/notes.svg?raw";
import CommonModuleCss from "./common.module.css";

export const renderNote = (noteNode: Element) => {
  const noteDiv = document.createElement("div");
  noteDiv.classList.add(CommonModuleCss.noteIcon);
  noteDiv.innerHTML = NoteSvg;
  noteNode.append(noteDiv);
};
