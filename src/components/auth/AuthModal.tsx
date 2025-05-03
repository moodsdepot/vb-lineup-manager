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
  initialMode?: 'login' | 'signup';
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
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-xl shadow-xl border border-white/10 bg-blue-950/80 backdrop-blur-lg"> 
        <DialogHeader className="sr-only">
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            {initialMode === 'login' 
              ? 'Log in to your account.' 
              : 'Create a new account.'}
          </DialogDescription>
        </DialogHeader>
        
        <AuthForm initialMode={initialMode} onSuccess={handleAuthSuccess} />
      </DialogContent>
    </Dialog>
  );
}
