import React from "react";
import Slide from "./Slide";
import { useState } from "react";
import PdfViewer from "./PdfViewer";

export default function SlidesBox({}) {
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const onSlideClick = (i) => {
    setSlideOpen(true);
    setSlideIndex(i);
  };
  return (
    <div className="row-span-1 col-span-2 flex">
      <div
        className={`rounded-lg flex bg-primary-400 text-center flex flex-col transition-all ${
          slideOpen ? "grow" : ""
        } p-5 w-1/2`}
      >
        {slideOpen ? (
          <div
            className="text-2xl absolute bold"
            onClick={() => setSlideOpen(false)}
          >
            {" "}
            ←
          </div>
        ) : (
          <></>
        )}
        Slides to Review
        <div
          className="flex justify-center items-center grow"
          onClick={() => onSlideClick(0)}
        >
          {slideOpen ? (
            <PdfViewer />
          ) : (
            <>
              <Slide
                style={{ transform: "translate(4rem, 0em) rotate(5deg)" }}
              />
              <Slide style={{ transform: "rotate(-3deg)" }} />
              <Slide
                style={{ transform: "translate(-4rem, 0em) rotate(3deg)" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
