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
    <div className='mb-[1.5em] mt-[2.3em] flex flex-col items-center justify-center'>
      <div className="mb-[1em] flex items-center flex-col justify-center">
        <h3 className="text-3xl text-black dark:text-white font-semibold">Submit a link to a rate my professor page</h3>
        <p className="text-slate-500 text-sm">When the link is submitted, it process the data using webscraping which is inserted into the chatbot for conversations.</p>
      </div>
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default LinkInput;
