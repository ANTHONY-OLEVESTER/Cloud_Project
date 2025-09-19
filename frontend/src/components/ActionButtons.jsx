import { 
  Eye, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Settings,
  ExternalLink,
  MoreVertical
} from 'lucide-react';

export function ViewButton({ onClick, title = "View Details", className = "" }) {
  return (
    <button 
      className={`action-button view ${className}`} 
      onClick={onClick}
      title={title}
      type="button"
    >
      <Eye size={16} />
    </button>
  );
}

export function EditButton({ onClick, title = "Edit", className = "" }) {
  return (
    <button 
      className={`action-button edit ${className}`} 
      onClick={onClick}
      title={title}
      type="button"
    >
      <Edit3 size={16} />
    </button>
  );
}

export function DeleteButton({ onClick, title = "Delete", className = "" }) {
  return (
    <button 
      className={`action-button delete ${className}`} 
      onClick={onClick}
      title={title}
      type="button"
    >
      <Trash2 size={16} />
    </button>
  );
}

export function SyncButton({ onClick, title = "Sync", isLoading = false, className = "" }) {
  return (
    <button 
      className={`sync-button ${isLoading ? 'syncing' : ''} ${className}`} 
      onClick={onClick}
      title={title}
      disabled={isLoading}
      type="button"
    >
      <RefreshCw size={16} />
      {isLoading ? 'Syncing...' : 'Sync'}
    </button>
  );
}

export function SettingsButton({ onClick, title = "Settings", className = "" }) {
  return (
    <button 
      className={`action-button settings ${className}`} 
      onClick={onClick}
      title={title}
      type="button"
    >
      <Settings size={16} />
    </button>
  );
}

export function ExternalLinkButton({ href, title = "Open External", className = "" }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`action-button external ${className}`} 
      title={title}
    >
      <ExternalLink size={16} />
    </a>
  );
}

export function MoreActionsButton({ onClick, title = "More Actions", className = "" }) {
  return (
    <button 
      className={`action-button more ${className}`} 
      onClick={onClick}
      title={title}
      type="button"
    >
      <MoreVertical size={16} />
    </button>
  );
}

export function ActionButtonGroup({ children, className = "" }) {
  return (
    <div className={`action-buttons ${className}`}>
      {children}
    </div>
  );
}