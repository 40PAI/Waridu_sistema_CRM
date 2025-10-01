import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Debug = () => {
  const { user, session, logout } = useAuth();
  const [sessionDetails, setSessionDetails] = React.useState<any>(null);
  const [profileDetails, setProfileDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setSessionDetails(sessionData);

      // Fetch profile details
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) throw profileError;
        setProfileDetails(profileData);
      }

      showSuccess("Debug info fetched successfully!");
    } catch (error: any) {
      console.error("Debug fetch error:", error);
      showError(`Error fetching debug info: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDebugInfo();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess("Logged out successfully!");
    } catch (error: any) {
      showError(`Logout error: ${error.message}`);
    }
  };

  const handleTestNotification = () => {
    showSuccess("Test notification sent!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Page</h1>
        <p className="text-muted-foreground">Useful information for testing and troubleshooting.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Info</CardTitle>
            <CardDescription>Current authentication session details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>User ID:</strong> {user?.id || 'Not logged in'}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || 'N/A'}
            </div>
            <div>
              <strong>Session Expires:</strong> {session?.expires_at ? format(new Date(session.expires_at * 1000), 'PPP p', { locale: ptBR }) : 'N/A'}
            </div>
            <div>
              <strong>Role:</strong> <Badge variant="outline">{user?.profile?.role || 'N/A'}</Badge>
            </div>
            <Button onClick={fetchDebugInfo} disabled={loading}>
              {loading ? "Loading..." : "Refresh Info"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Extended profile information from database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileDetails ? (
              <>
                <div>
                  <strong>First Name:</strong> {profileDetails.first_name || 'N/A'}
                </div>
                <div>
                  <strong>Last Name:</strong> {profileDetails.last_name || 'N/A'}
                </div>
                <div>
                  <strong>Avatar URL:</strong> {profileDetails.avatar_url || 'N/A'}
                </div>
                <div>
                  <strong>Banned Until:</strong> {profileDetails.banned_until ? format(new Date(profileDetails.banned_until), 'PPP p', { locale: ptBR }) : 'Not banned'}
                </div>
                <div>
                  <strong>Updated At:</strong> {format(new Date(profileDetails.updated_at), 'PPP p', { locale: ptBR })}
                </div>
              </>
            ) : (
              <p>No profile data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Test various app functionalities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestNotification} variant="outline">
            Test Notification
          </Button>
          <Button onClick={handleLogout} variant="destructive">
            Force Logout
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>JSON dumps for debugging (development only).</CardDescription>
        </CardHeader>
        <CardContent>
          <details>
            <summary className="cursor-pointer font-medium">Session Data</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(sessionDetails, null, 2)}
            </pre>
          </details>
          <details className="mt-4">
            <summary className="cursor-pointer font-medium">Profile Data</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(profileDetails, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default Debug;