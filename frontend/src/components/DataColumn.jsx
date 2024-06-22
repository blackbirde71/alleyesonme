import React from "react";
import { useStore } from "../Store";

export default function DataColumn() {
  const currClass = useStore((state) => state.currClass);
  return (
    <div className="col-span-5 bg-primary-500 rounded-xl py-5 px-2">
      <div className="text-center text-primary-100 flex justify-center items-center flex-col mb-5 text-xl">
        <div className="rounded-full overflow-clip w-2/3 mb-5"></div>
        {currClass.name}
      </div>
    </div>
  );
}
