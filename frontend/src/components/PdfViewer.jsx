import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import TestPdf from "../media/test.pdf";
import { useState } from "react";
import { useStore } from "../Store";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
export default function PdfViewer() {
  const [numPages, setNumPages] = useState();
  const [currIndex, setCurrIndex] = useState(0);
  const pdf = useStore((state) => state.pdf);

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
    console.log(nextNumPages);
  }
  return (
    <div className="flex flex-col h-full w-full justify-center items-center">
      <div className="w-full h-full bg-primary-400 rounded-xl flex overflow-clip flex justify-center">
        <Document
          file={pdf}
          className={"h-4"}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={currIndex + 1} className={"w-full h-full"} />
        </Document>
      </div>
      <div className="flex pt-4 justify-center items-center">
        <div
          className="mx-4 text-xl"
          onClick={() => setCurrIndex((currIndex - 1) % numPages)}
        >
          ←
        </div>
        {Array.from(new Array(numPages), (el, index) => (
          <div
            className={`w-2 h-2 rounded-full ${
              index === currIndex ? "bg-primary-100" : "bg-primary-200"
            } mx-1`}
          />
        ))}
        <div
          className="mx-4 text-xl"
          onClick={() => setCurrIndex((currIndex + 1) % numPages)}
        >
          →
        </div>
      </div>
    </div>
  );
}
