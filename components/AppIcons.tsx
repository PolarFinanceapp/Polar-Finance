// ── Shared icon map — import this anywhere you need icons ────────────────────
// Add this to a new file: components/AppIcons.tsx

import { Ionicons } from '@expo/vector-icons';

export const APP_ICONS = {
  home:       { active: 'home',              inactive: 'home-outline'              },
  stats:      { active: 'bar-chart',         inactive: 'bar-chart-outline'         },
  credit:     { active: 'card',              inactive: 'card-outline'              },
  more:       { active: 'grid',              inactive: 'grid-outline'              },
  settings:   { active: 'settings',          inactive: 'settings-outline'          },
  calendar:   { active: 'calendar',          inactive: 'calendar-outline'          },
  goals:      { active: 'flag',              inactive: 'flag-outline'              },
  assets:     { active: 'briefcase',         inactive: 'briefcase-outline'         },
  add:        { active: 'add-circle',        inactive: 'add-circle-outline'        },
  explore:    { active: 'trending-up',       inactive: 'trending-up-outline'       },
  markets:    { active: 'trending-up',       inactive: 'trending-up-outline'       },
  scan:       { active: 'scan',              inactive: 'scan-outline'              },
  search:     { active: 'search',            inactive: 'search-outline'            },
  edit:       { active: 'create',            inactive: 'create-outline'            },
  profile:    { active: 'person-circle',     inactive: 'person-circle-outline'     },
  cards:      { active: 'card',              inactive: 'card-outline'              },
  invest:     { active: 'trending-up',       inactive: 'trending-up-outline'       },
  wallet:     { active: 'wallet',            inactive: 'wallet-outline'            },
  notif:      { active: 'notifications',     inactive: 'notifications-outline'     },
  lock:       { active: 'lock-closed',       inactive: 'lock-closed-outline'       },
  language:   { active: 'language',          inactive: 'language-outline'          },
  currency:   { active: 'cash',             inactive: 'cash-outline'              },
  backup:     { active: 'cloud',             inactive: 'cloud-outline'             },
  rate:       { active: 'star',              inactive: 'star-outline'              },
  feedback:   { active: 'chatbubble',        inactive: 'chatbubble-outline'        },
  theme:      { active: 'color-palette',     inactive: 'color-palette-outline'     },
  logout:     { active: 'log-out',           inactive: 'log-out-outline'           },
  close:      { active: 'close-circle',      inactive: 'close-circle-outline'      },
  info:       { active: 'information-circle',inactive: 'information-circle-outline'},
  privacy:    { active: 'shield-checkmark',  inactive: 'shield-checkmark-outline'  },
  terms:      { active: 'document-text',     inactive: 'document-text-outline'     },
  version:    { active: 'phone-portrait',    inactive: 'phone-portrait-outline'    },
  instagram:  { active: 'logo-instagram',    inactive: 'logo-instagram'            },
  receipt:    { active: 'receipt',           inactive: 'receipt-outline'           },
} as const;

// ── Helper component ─────────────────────────────────────────────────────────
type IconName = keyof typeof APP_ICONS;

export function AppIcon({
  name,
  size = 22,
  color,
  active = true,
}: {
  name: IconName;
  size?: number;
  color: string;
  active?: boolean;
}) {
  const iconName = active ? APP_ICONS[name].active : APP_ICONS[name].inactive;
  return <Ionicons name={iconName as any} size={size} color={color} />;
}