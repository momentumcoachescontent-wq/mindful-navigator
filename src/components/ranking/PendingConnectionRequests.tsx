import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { usePendingRequests, useAcceptRequest, useRejectRequest } from '@/hooks/useConnections';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function PendingConnectionRequests() {
    const { data: pending = [], isLoading } = usePendingRequests();
    const acceptRequest = useAcceptRequest();
    const rejectRequest = useRejectRequest();

    // Fetch display names for requesters
    const requesterIds = pending.map(p => p.user_id);
    const { data: profiles = [] } = useQuery({
        queryKey: ['requester-profiles', requesterIds],
        queryFn: async () => {
            if (requesterIds.length === 0) return [];
            const { data } = await supabase
                .from('profiles')
                .select('user_id, display_name, streak_count')
                .in('user_id', requesterIds);
            return data || [];
        },
        enabled: requesterIds.length > 0,
    });

    const profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p]));

    if (isLoading) return null;
    if (pending.length === 0) return null;

    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Solicitudes de Círculo
                    <Badge className="bg-primary text-primary-foreground text-xs">{pending.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {pending.map(request => {
                    const profile = profileMap[request.user_id];
                    const name = profile?.display_name || 'Usuario';
                    const streak = profile?.streak_count || 0;

                    return (
                        <div key={request.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {name[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{name}</p>
                                <p className="text-xs text-muted-foreground">{streak} días de racha</p>
                            </div>

                            <div className="flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-500 hover:bg-green-500/10 px-2 gap-1"
                                    onClick={() =>
                                        acceptRequest.mutate(request.id, {
                                            onSuccess: () => toast.success(`¡${name} ahora está en tu círculo!`),
                                        })
                                    }
                                >
                                    <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-destructive px-2"
                                    onClick={() =>
                                        rejectRequest.mutate(request.id, {
                                            onSuccess: () => toast.info('Solicitud rechazada'),
                                        })
                                    }
                                >
                                    <UserX className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
