// src/components/Login.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginProps {
    onLogin: (token: string, accountId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
    const [password, setPassword] = useState("");
    const [accountId, setAccountId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [storedPassword, setStoredPassword] = useState<string | null>(null);

    useEffect(() => {
        // Check if we already have a stored password
        const savedPassword = localStorage.getItem("utmValidationPassword");
        if (savedPassword) {
            setStoredPassword(savedPassword);
        }
    }, []);

    const handleAuthenticate = async () => {
        setIsLoading(true);
        setError(null);

        const pwdToUse = storedPassword || password;

        if (!pwdToUse) {
            setError("Password is required");
            setIsLoading(false);
            return;
        }

        if (!accountId) {
            setError("Account ID is required");
            setIsLoading(false);
            return;
        }

        try {
            // Encode the password for URL safety
            const encodedPassword = encodeURIComponent(pwdToUse);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/v2/dashboards/auth?password=${encodedPassword}&accountId=${accountId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status}`);
            }

            const data = await response.json();

            // Store password and token
            localStorage.setItem("utmValidationPassword", pwdToUse);
            localStorage.setItem("utmValidationToken", data.token);
            localStorage.setItem("utmValidationAccountId", accountId);

            // Call the onLogin callback with the token and account ID
            onLogin(data.token, accountId);
        } catch (err) {
            console.error("Authentication error:", err);
            setError("Authentication failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">UTM Validation Center</CardTitle>
                    <CardDescription>
                        {storedPassword
                            ? "Enter your Account ID to continue"
                            : "Enter your credentials to access the validation tools"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        {!storedPassword && (
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        )}
                        <Input
                            type="text"
                            placeholder="Enter Account ID (e.g., 4560)"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        />
                        <Button
                            className="w-full"
                            onClick={handleAuthenticate}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>

                        {storedPassword && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    localStorage.removeItem("utmValidationPassword");
                                    setStoredPassword(null);
                                }}
                            >
                                Use Different Password
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;