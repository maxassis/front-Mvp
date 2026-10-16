import type { Lead } from '@/api/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { leadInitials } from '@/features/leads/lead-display'

interface LeadAvatarProps {
  lead: Lead
}

/** O lead nao carrega foto de perfil, entao a identidade visual vem das iniciais. */
export function LeadAvatar({ lead }: LeadAvatarProps) {
  return (
    <Avatar>
      <AvatarFallback>{leadInitials(lead)}</AvatarFallback>
    </Avatar>
  )
}
