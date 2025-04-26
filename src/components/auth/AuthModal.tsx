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
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-blue-950 via-indigo-900 to-blue-900 border-white/10 text-white rounded-lg shadow-xl"> 
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
