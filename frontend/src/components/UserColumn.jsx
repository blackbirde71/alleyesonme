import React, { useState } from "react";
import ProfilePicture from "../media/profile.jpeg";
import ClassTab from "./ClassTab";
import { useStore } from "../Store";

export default function UserColumn() {
  const setCurrClass = useStore((state) => state.setCurrClass);
  const [currIndex, setCurrIndex] = useState(0);
  const classes = [
    {
      name: "CIS-1962",
      semester: "Fall 2024",
    },
    {
      name: "BIO-101",
      semester: "Fall 2024",
    },
    {
      name: "PHYS-151",
      semester: "Fall 2024",
    },
  ];
  return (
    <div className="col-span-1 bg-primary-500 rounded-xl py-5 px-2">
      <div className="text-center text-primary-100 flex justify-center items-center flex-col mb-5 text-xl">
        <div className="rounded-full overflow-clip w-2/3 mb-5">
          <img src={ProfilePicture} alt="" />
        </div>
        Justin
      </div>
      {classes.map((c, i) => (
        <ClassTab
          key={i}
          name={c.name}
          semester={c.semester}
          selected={currIndex === i}
          onClick={() => {
            setCurrClass(c);
            setCurrIndex(i);
            console.log("clicked");
          }}
        />
      ))}
    </div>
  );
}
