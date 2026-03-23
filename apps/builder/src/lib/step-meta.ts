export interface StepMeta {
  type: string;
  label: string;
  icon: string;         // Material Symbols icon name
  badgeClass: string;   // CSS class from globals.css
  borderColor: string;  // CSS color for node top border
}

export const STEP_META: Record<string, StepMeta> = {
  navigate: {
    type: 'navigate',
    label: 'Navigate',
    icon: 'navigation',
    badgeClass: 'badge-nav',
    borderColor: '#2563eb',
  },
  scan: {
    type: 'scan',
    label: 'Scan',
    icon: 'barcode_scanner',
    badgeClass: 'badge-scan',
    borderColor: '#16a34a',
  },
  number_input: {
    type: 'number_input',
    label: 'Number Input',
    icon: 'pin',
    badgeClass: 'badge-num',
    borderColor: '#9333ea',
  },
  confirm: {
    type: 'confirm',
    label: 'Confirm',
    icon: 'fact_check',
    badgeClass: 'badge-conf',
    borderColor: '#0284c7',
  },
  menu_select: {
    type: 'menu_select',
    label: 'Menu Select',
    icon: 'list',
    badgeClass: 'badge-menu',
    borderColor: '#ea580c',
  },
  message: {
    type: 'message',
    label: 'Message',
    icon: 'info',
    badgeClass: 'badge-msg',
    borderColor: '#475569',
  },
  camera_input: {
    type: 'camera_input',
    label: 'Camera',
    icon: 'photo_camera',
    badgeClass: 'badge-cam',
    borderColor: '#0d9488',
  },
  api_call: {
    type: 'api_call',
    label: 'API Call',
    icon: 'cloud_upload',
    badgeClass: 'badge-api',
    borderColor: '#7c3aed',
  },
  print: {
    type: 'print',
    label: 'Print',
    icon: 'print',
    badgeClass: 'badge-print',
    borderColor: '#4f46e5',
  },
};

export const STEP_TYPES_LIST = Object.values(STEP_META);

/** Get a tag CSS class from the transition key + target step.
 *  on_dismiss is green only when targeting __exit__; grey for retry loops. */
export function getTagClass(key: string, target?: string): string {
  if (key.includes('success') || key.includes('confirm')) return 'tag-ok';
  if (key === 'on_dismiss' && target === '__exit__') return 'tag-ok';
  if (key === 'on_dismiss') return 'tag-grey'; // retry loops (error nodes)
  if (key.includes('failure') || key.includes('exception')) return 'tag-err';
  if (key.includes('short_pick') || key.includes('warn')) return 'tag-warn';
  if (key.includes('skip') || key.includes('back')) return 'tag-grey';
  return 'tag-blue';
}

/** Determine node modifier class based on step metadata */
export function getNodeModifier(
  step: { id: string; type: string; severity?: string },
  entryStepId?: string
): string {
  if (step.id === entryStepId) return 'entry';
  if (step.severity === 'error') return 'node-err';
  if (step.severity === 'success' || step.id.includes('complete') || step.id.includes('__exit__')) return 'node-exit';
  if (step.type === 'menu_select' && step.id.includes('exception')) return 'node-err';
  if (step.type === 'message' && step.id.includes('error')) return 'node-err';
  if (step.type === 'menu_select' && step.id.includes('short')) return 'node-warn';
  return '';
}
