import { useState } from "react";
import { BsAlphabetUppercase } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { MdOutlineVisibility } from "react-icons/md";
import { MdOutlineVisibilityOff } from "react-icons/md";
import { CgSpinnerTwo } from "react-icons/cg";
import { IoSearch } from "react-icons/io5";

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  field: "email" | "fullname" | "username" | "password";
  autoFocus?: boolean;
}

export function Input({ value, onChange, field, autoFocus }: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex w-auto flex-col items-start border-b-2 border-gray-400  has-[>div>input:focus]:border-blue-600 hover:border-gray-600">
      <label htmlFor={field}>
        <span className="text-sm font-bold capitalize text-gray-400">{field === "fullname" ? "Full Name" : field}</span>
      </label>
      <div className="flex w-full items-center bg-gray-100">
        <input
          className="peer flex w-full bg-gray-100 p-2.5 font-semibold text-slate-600 placeholder:font-exo placeholder:font-normal placeholder:tracking-normal focus:outline-none"
          type={field === "password" ? (show ? "text" : "password") : field === "email" ? "email" : "text"}
          value={value}
          placeholder={"Enter your " + field}
          id={field}
          onChange={onChange}
          onKeyDown={e => field !== "fullname" && (e.key === "Enter" || e.key === " ") && e.preventDefault()}
          autoFocus={autoFocus}
          required
        />
        <label
          htmlFor={field}
          className={`mr-3 cursor-pointer text-slate-500 transition-none peer-focus:text-blue-500 ${
            field === "password" && (show ? "peer-focus:text-green-600" : "peer-focus:text-red-500")
          }`}
        >
          {field === "fullname" ? (
            <BsAlphabetUppercase className="size-6" />
          ) : field === "username" ? (
            <FaRegUser className="size-4" />
          ) : field === "email" ? (
            <MdOutlineEmail className="size-5" />
          ) : field === "password" ? (
            show ? (
              <MdOutlineVisibility onClick={() => setShow(prev => !prev)} className="size-5 transition-none" />
            ) : (
              <MdOutlineVisibilityOff onClick={() => setShow(prev => !prev)} className="size-5 transition-none" />
            )
          ) : null}
        </label>
      </div>
    </div>
  );
}

interface SearchInputProps {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}
export function SearchInput({ onChange, value }: SearchInputProps) {
  return (
    <div className="flex w-40 justify-center md:w-full">
      <div className="hover:bg-gray flex w-fit flex-col items-start overflow-clip rounded-full border-2 border-gray-500 bg-white shadow-sm">
        <div className="flex w-full items-center">
          <label className="ml-3 cursor-pointer">
            <IoSearch size={20} />
          </label>
          <input
            placeholder="Search"
            defaultValue={value}
            onChange={onChange}
            required
            className="flex h-9 w-full bg-white p-2.5 font-semibold text-black placeholder:font-exo placeholder:tracking-normal focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

interface SubmitButtonProps {
  type: string;
  processing?: boolean;
  redirecting?: boolean;
  disabled?: boolean;
}
export function SubmitButton({ type, processing, redirecting, disabled }: SubmitButtonProps) {
  return (
    <button
      className={`bg-pos-0 hover:bg-pos-100 flex flex-1 cursor-pointer justify-center bg-opacity-100 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 p-3 text-white hover:from-pink-300 hover:via-purple-300 hover:to-indigo-300 hover:shadow-2xl disabled:from-pink-300 disabled:via-purple-300 disabled:to-indigo-300 disabled:shadow-2xl ${
        disabled && "disabled:cursor-not-allowed"
      }`}
      disabled={processing || redirecting || disabled}
    >
      <span className="text-lg font-bold lowercase tracking-wider">
        {processing ? "processing..." : redirecting ? "redirecting..." : type}
      </span>
      {(processing || redirecting) && <CgSpinnerTwo className="ml-2 mt-[2px] size-5 animate-spin" />}
    </button>
  );
}
