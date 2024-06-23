import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import TestPdf from "../media/test.pdf";
import { useState } from "react";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
export default function PdfViewer() {
  const [numPages, setNumPages] = useState();
  const [currIndex, setCurrIndex] = useState(0);

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
    console.log(nextNumPages);
  }
  return (
    <div className="flex flex-col h-full w-full justify-center items-center">
      <div className="w-full h-full bg-primary-400 rounded-xl flex overflow-clip flex justify-center">
        <Document
          file={TestPdf}
          className={"h-4"}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={1} className={"w-full h-full"} />
        </Document>
      </div>
      <div className="flex mt-4">
        {Array.from(new Array(numPages), (el, index) => (
          <div
            className={`w-2 h-2 rounded-full ${
              index === currIndex + 1 ? "bg-primary-100" : "bg-primary-200"
            } mx-1`}
          />
        ))}
      </div>
    </div>
  );
}
