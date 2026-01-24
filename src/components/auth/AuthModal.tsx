import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthForm from "./AuthForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'login' | 'signup' | 'link';
}

export default function AuthModal({
  open,
  onOpenChange,
  initialMode = 'login'
}: AuthModalProps) {

  const handleAuthSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-md shadow-lg border border-[#c4b8a5] bg-[#faf7f2] modal-enter">
        <DialogHeader className="sr-only">
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            {initialMode === 'login'
              ? 'Log in to your account.'
              : initialMode === 'signup'
                ? 'Create a new account.'
                : 'Link your email and password to this session.'}
          </DialogDescription>
        </DialogHeader>

        <AuthForm initialMode={initialMode} onSuccess={handleAuthSuccess} />
      </DialogContent>
    </Dialog>
  );
}
