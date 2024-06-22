import React from "react";
import UserColumn from "../components/UserColumn";
import DataColumn from "../components/DataColumn";

export default function StudentPage() {
  return (
    <div className="h-full w-full p-8 grid-cols-6 gap-5 grid">
      <UserColumn />
      <DataColumn />
    </div>
  );
}
