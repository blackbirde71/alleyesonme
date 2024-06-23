import React from "react";
import { useStore } from "../Store";
import DataVis from "./DataVis";
import CustomWebcam from "./CustomWebcam";
import SlidesBox from "./SlidesBox";
import { useState } from "react";
import PdfViewer from "./PdfViewer";

export default function DataColumn() {
  const currClass = useStore((state) => state.currClass);

  return (
    <div className="col-span-5 bg-primary-500 rounded-xl py-5 px-5 flex flex-col">
      <div className="text-center text-primary-100 flex justify-center items-center flex-col mb-5 text-2xl bold">
        {"LockIn"}
      </div>
      <div className="grid-cols-2 grid-rows-2 w-full h-max  rounded-xl grow grid gap-5">
        <DataVis />
        <CustomWebcam />
        <SlidesBox />
      </div>
    </div>
  );
}
