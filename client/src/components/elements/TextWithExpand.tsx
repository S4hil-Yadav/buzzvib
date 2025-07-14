import { useEffect, useRef, useState } from "react";
import { Box, Typography, IconButton, Link as MuiLink } from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";

interface TextWithExpandProps {
  originalText: string | null;
  minHeight: number;
}

export default function TextWithExpand({ originalText, minHeight = 5 }: TextWithExpandProps) {
  const [showButton, setShowButton] = useState(false);
  const commentRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const height = commentRef.current?.offsetHeight ?? 0;
    setShowButton(height > 16 * minHeight);
  }, [minHeight]);

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography
        component="pre"
        ref={commentRef}
        onClick={() => showButton && setExpanded(true)}
        sx={{
          fontSize: "0.875rem",
          fontFamily: "inherit",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
          lineHeight: 1.6,
          maxHeight: !showButton || expanded ? "none" : `${minHeight * 1.6}rem`,
          cursor: showButton ? "pointer" : "default",
          color: "text.primary",
        }}
      >
        {originalText?.split(/(\s+)/).map((word, index) =>
          word.startsWith("#") ? (
            <MuiLink
              component={RouterLink}
              key={index}
              to={`/search?searchTerm=posts&searchParam=${word}`}
              style={{ color: "#3B82F6", textDecoration: "none" }}
              onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
            >
              {word}
            </MuiLink>
          ) : word.startsWith("@") ? (
            <MuiLink
              component={RouterLink}
              key={index}
              to={`/search?searchTerm=users&searchParam=${word}`}
              style={{ color: "#3B82F6", textDecoration: "none" }}
              onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
            >
              {word}
            </MuiLink>
          ) : word.endsWith(".com") || word.endsWith(".in") ? (
            <a
              key={index}
              href={word.startsWith("http") ? word : `https://${word}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3B82F6", textDecoration: "none" }}
              onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
            >
              {word}
            </a>
          ) : (
            word
          )
        )}
      </Typography>

      {showButton && (
        <Box
          onClick={() => setExpanded(prev => !prev)}
          sx={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-end",
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "grey.600",
            cursor: "pointer",
            gap: 0.5,
            "&:hover": { color: "text.primary" },
          }}
        >
          {expanded ? "Show less" : "Show more"}
          <IconButton size="small" sx={{ p: 0.5 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
