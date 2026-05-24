import PlayBtnSvg from "../../assets/icons/play.svg?raw";
import PauseBtnSvg from "../../assets/icons/pause.svg?raw";
import NextBtnSvg from "../../assets/icons/next.svg?raw";
import FastForwardSvg from "../../assets/icons/fast-forward.svg?raw";
import CommonModuleCss from "./common.module.css";

export const renderPlayback = (playbackNode: Element) => {
  const playBtn = document.createElement("button");
  playBtn.innerHTML = PlayBtnSvg;

  // pause btn
  const pauseBtn = document.createElement("button");
  pauseBtn.innerHTML = PauseBtnSvg;

  //   next btn
  const nextBtn = document.createElement("button")!;
  nextBtn.innerHTML = NextBtnSvg;

  // prev btn
  const prevBtn = document.createElement("button")!;
  prevBtn.innerHTML = NextBtnSvg;
  prevBtn.classList.add(CommonModuleCss.reverse);

  //   fast-forward
  const fforwardBtn = document.createElement("button");
  fforwardBtn.innerHTML = FastForwardSvg;

  //fast-backward
  const fbackBtn = document.createElement("button");
  fbackBtn.innerHTML = FastForwardSvg;
  fbackBtn.classList.add(CommonModuleCss.reverse);

  playbackNode.append(fbackBtn, prevBtn, playBtn, nextBtn, fforwardBtn);
};
