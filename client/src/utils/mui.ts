export function inputSx(adornment: "InputAdornment" | "IconButton" = "InputAdornment") {
  return {
    "& .MuiOutlinedInput-root": {
      "&:hover fieldset": {
        borderColor: "primary.main",
      },
      [`&:hover .Mui${adornment}-root`]: {
        color: "primary.main",
      },
      "&.Mui-focused fieldset": {
        borderColor: "primary.dark",
      },
      [`&.Mui-focused .Mui${adornment}-root`]: {
        color: "primary.dark",
      },
      "&.Mui-error fieldset": {
        borderColor: "error.main",
      },
      [`&.Mui-error .Mui${adornment}-root`]: {
        color: "error.main",
      },
      "&.Mui-error:hover fieldset": {
        borderColor: "rgba(255, 0, 0, 0.6)",
      },
      [`&.Mui-error:hover .Mui${adornment}-root`]: {
        color: "rgba(255, 0, 0, 0.6)",
      },
      "&.Mui-error.Mui-focused fieldset": {
        borderColor: "error.main",
      },
      [`&.Mui-error.Mui-focused .Mui${adornment}-root`]: {
        color: "error.main",
      },
    },
  };
}
