import React from "react";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";

const LinkInput = () => {
  const placeholders = [
    "https://www.ratemyprofessors.com/school/1003",
    "https://www.ratemyprofessors.com/professor/2312857",
    "https://www.ratemyprofessors.com/professor/55850",
    "https://www.ratemyprofessors.com/professor/96364",
    "https://www.ratemyprofessors.com/school/2003",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <div className='mb-[1.5em]'>
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default LinkInput;
