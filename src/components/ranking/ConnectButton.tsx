import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ConnectionStatus,
    useSendRequest,
    useAcceptRequest,
    useRejectRequest,
    useRemoveConnection,
} from '@/hooks/useConnections';
import { toast } from 'sonner';

interface ConnectButtonProps {
    targetUserId: string;
    status: ConnectionStatus;
    connectionId?: string; // needed to accept/reject
    className?: string;
}

export function ConnectButton({ targetUserId, status, connectionId, className }: ConnectButtonProps) {
    const sendRequest = useSendRequest();
    const acceptRequest = useAcceptRequest();
    const rejectRequest = useRejectRequest();
    const removeConnection = useRemoveConnection();

    if (status === 'accepted') {
        return (
            <Button
                size="sm"
                variant="ghost"
                className={cn('text-xs gap-1 text-green-500 hover:text-destructive hover:bg-destructive/10', className)}
                onClick={() =>
                    removeConnection.mutate(targetUserId, {
                        onSuccess: () => toast.success('Eliminado de tu círculo'),
                    })
                }
            >
                <UserCheck className="w-3 h-3" />
                Círculo
            </Button>
        );
    }

    if (status === 'pending_sent') {
        return (
            <Button size="sm" variant="ghost" disabled className={cn('text-xs gap-1 text-muted-foreground', className)}>
                <Clock className="w-3 h-3" />
                Pendiente
            </Button>
        );
    }

    if (status === 'pending_received' && connectionId) {
        return (
            <div className={cn('flex gap-1', className)}>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 text-green-500 hover:bg-green-500/10 px-2"
                    onClick={() =>
                        acceptRequest.mutate(connectionId, {
                            onSuccess: () => toast.success('¡Ahora forman parte del mismo círculo!'),
                        })
                    }
                >
                    <UserCheck className="w-3 h-3" />
                    Aceptar
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 text-muted-foreground px-2"
                    onClick={() =>
                        rejectRequest.mutate(connectionId, {
                            onSuccess: () => toast.info('Solicitud rechazada'),
                        })
                    }
                >
                    <UserX className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    // status === 'none'
    return (
        <Button
            size="sm"
            variant="ghost"
            className={cn('text-xs gap-1 text-muted-foreground hover:text-primary', className)}
            onClick={() =>
                sendRequest.mutate(targetUserId, {
                    onSuccess: () => toast.success('Solicitud enviada'),
                    onError: () => toast.error('No se pudo enviar la solicitud'),
                })
            }
        >
            <UserPlus className="w-3 h-3" />
            Agregar
        </Button>
    );
}
