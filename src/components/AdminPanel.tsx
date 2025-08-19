import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, Eye, EyeOff } from "lucide-react";

// Festes Admin-Passwort
const ADMIN_SECRET = 'eezX"2,r636#';

interface AdminPanelProps {
  lang: "de" | "en";
  isVisible: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminPanel = ({ lang, isVisible, onClose, onLoginSuccess }: AdminPanelProps) => {
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const checkAdminKey = () => {
    if (adminKey === ADMIN_SECRET) {
      onLoginSuccess();
      onClose();
    } else {
      alert(lang === 'de' ? 'Falsches Passwort!' : 'Wrong password!');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {lang === 'de' ? 'Admin-Login' : 'Admin Login'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={lang === 'de' ? 'Passwort eingeben...' : 'Enter password...'}
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAdminKey()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={checkAdminKey} className="flex-1">
              {lang === 'de' ? 'Anmelden' : 'Login'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {lang === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;