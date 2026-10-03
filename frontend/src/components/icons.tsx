import { cn } from "@/utils/cn";

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)} aria-hidden>
      {icon(name)}
    </svg>
  );
}

function icon(name: string) {
  switch (name) {
    case "grid":
      return (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>);
    case "users":
      return (<><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="3" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 4.13a3 3 0 0 1 0 5.75" /></>);
    case "target":
      return (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>);
    case "briefcase":
      return (<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>);
    case "kanban":
      return (<><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="4" height="13" rx="1.5" /></>);
    case "file":
      return (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M8 13h8" /><path d="M8 17h5" /></>);
    case "chat":
      return (<><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0z" /></>);
    case "box":
      return (<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>);
    case "warehouse":
      return (<><path d="M3 10 12 4l9 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /></>);
    case "cart":
      return (<><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M3 4h2l2.2 11h11.3l2-7H7" /></>);
    case "receipt":
      return (<><path d="M6 3h12v18l-2-1.2L14 21l-2-1.2L10 21l-2-1.2L6 21z" /><path d="M9 8h6" /><path d="M9 12h6" /></>);
    case "card":
      return (<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" /></>);
    case "book":
      return (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M6 3v16" /></>);
    case "shield":
      return (<><path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6z" /><path d="M9 12l2 2 4-4" /></>);
    case "alert":
      return (<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0z" /></>);
    case "check":
      return <path d="M20 6 9 17l-5-5" />;
    case "chart":
      return (<><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></>);
    case "pie":
      return (<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9h9" /></>);
    case "settings":
      return (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.1 1.6 1.1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>);
    case "key":
      return (<><circle cx="8" cy="15" r="4" /><path d="M11.5 12.5 20 4" /><path d="M16 8l3 3" /><path d="M14 6l2 2" /></>);
    case "git":
      return (<><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 8v8" /><path d="M8 7h4a4 4 0 0 1 4 4v1" /></>);
    case "scroll":
      return (<><path d="M8 4h9a2 2 0 0 1 2 2v13l-2-1-2 1-2-1-2 1-2-1-2 1V6a2 2 0 0 0-2-2z" /><path d="M8 4a2 2 0 0 0-2 2v1" /></>);
    case "search":
      return (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
    case "bell":
      return (<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
    case "plus":
      return (<><path d="M12 5v14" /><path d="M5 12h14" /></>);
    case "x":
      return (<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>);
    case "arrowLeft":
      return (<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>);
    case "chevron":
      return <path d="m6 9 6 6 6-6" />;
    case "download":
      return (<><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>);
    case "refresh":
      return (<><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 4v5h-5" /></>);
    case "printer":
      return (<><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></>);
    case "user":
      return (<><circle cx="12" cy="8" r="3.2" /><path d="M5 19.5a7 7 0 0 1 14 0" /></>);
    case "flag":
      return (<><path d="M5 21V4" /><path d="M5 4h11l-1.5 3L16 10H5" /></>);
    case "menu":
      return (<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>);
    case "mail":
      return (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></>);
    case "phone":
      return <path d="M7 3h4l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v4a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-2z" />;
    case "info":
      return (<><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 8h.01" /></>);
    case "warning":
      return (<><path d="M12 8v5" /><path d="M12 16.5h.01" /><path d="m4 19 8-14 8 14z" /></>);
    case "logout":
      return (<><path d="M9 6H5v12h4" /><path d="M10 12h10" /><path d="m16 8 4 4-4 4" /></>);
    case "send":
      return (<><path d="m4 12 16-8-6 16-2-6z" /><path d="m12 14 4-4" /></>);
    case "eye":
      return (<><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></>);
    case "building":
      return (<><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 21v-4h6v4" /><path d="M8 7h.01" /><path d="M12 7h.01" /><path d="M16 7h.01" /><path d="M8 11h.01" /><path d="M12 11h.01" /><path d="M16 11h.01" /></>);
    case "layers":
      return (<><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5" /></>);
    case "scale":
      return (<><path d="M12 3v18" /><path d="M4 7h16" /><path d="m7 7-3 6h6z" /><path d="m17 7-3 6h6z" /></>);
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#132043" />
      <path d="M8 23V9h3.1l8.1 10.4V9H24v14h-3.1L12.8 12.6V23H8z" fill="white" />
      <rect x="20.2" y="20.2" width="5.2" height="5.2" rx="1.3" fill="#00F5D4" />
    </svg>
  );
}
