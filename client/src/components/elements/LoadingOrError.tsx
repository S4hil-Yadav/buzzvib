import { Box, Typography, CircularProgress } from "@mui/material";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";

interface LoadingOrErrorProps {
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  // refetch?: () => Promise;
  refetch?: (options?: RefetchOptions) => Promise<QueryObserverResult>;
  LoadingComponent?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
}

export default function LoadingOrError({
  isLoading,
  isFetching,
  isError,
  refetch,
  loadingMessage = "",
  LoadingComponent,
  errorMessage = "",
}: LoadingOrErrorProps) {
  if (isLoading) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        {LoadingComponent ?? (
          <>
            <CircularProgress size={30} color="primary" />
            <Typography variant="body1" fontWeight="400" color="primary.dark">
              {loadingMessage}
            </Typography>
          </>
        )}
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", my: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          {/* <Typography variant="h6" fontWeight="400"> */}
          {errorMessage}
          {/* </Typography> */}
          {isFetching ? (
            <Typography variant="body2" color="primary.dark">
              <CircularProgress size={25} color="primary" />
            </Typography>
          ) : refetch ? (
            <Typography
              variant="body1"
              color="primary.dark"
              sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
              onClick={() => refetch()}
            >
              Retry
            </Typography>
          ) : null}
        </Box>
      </Box>
    );
  }

  return null;
}
