import React from "react";

export default function ClassTab({ name, semester, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`text-primary-100 rounded-xl w-full flex flex-col justify-center mb-5 py-1 px-3 transition-all duration-200 ${
        selected ? "bg-primary-400" : "bg-primary-500"
      }`}
    >
      {name}
      <span className="opacity-50 self-end text-sm">{semester}</span>
    </div>
  );
}
