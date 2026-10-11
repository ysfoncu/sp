import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { answerLeave, usePendingLeave } from "../navGuard";

// Asked when something would leave a block that holds unsaved changes. "Keep editing" has the focus.
export function LeaveDialog() {
  const pending = usePendingLeave();
  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && answerLeave(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {pending && pending.labels.length > 0 ? `You have unsaved changes in ${pending.labels.join(", ")}.` : "You have unsaved changes."} If you leave now they are lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus onClick={() => answerLeave(false)}>
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => answerLeave(true)}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
