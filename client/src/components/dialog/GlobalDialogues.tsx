import AlertDialog from "@/components/dialog/AlertDialog.tsx";
import EditPostDialog from "@/components/dialog/EditPostDialog.tsx";
import { useGetAuthQuery } from "@/services/queries/auth.queries.ts";

export default function GlobalDialogues() {
  const authUser = useGetAuthQuery();

  return (
    <>
      <AlertDialog />
      {authUser && <EditPostDialog />}
    </>
  );
}
