import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyGreetingProps {
    userName: string;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
};

export function DailyGreeting({ userName, isLoading, isAuthenticated }: DailyGreetingProps) {
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState(getGreeting());

    useEffect(() => {
        const interval = setInterval(() => setGreeting(getGreeting()), 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-muted-foreground">{greeting}</p>
                <h1 className="text-xl font-display font-bold text-foreground">
                    {userName ? `Hola, ${userName}` : "Tu Coach de Bolsillo"}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {!isLoading && (
                    <>
                        {isAuthenticated ? (
                            <Button variant="ghost" size="icon-sm" onClick={() => navigate("/profile")}>
                                <User className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/auth")}
                                className="gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Entrar
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
