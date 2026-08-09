import {
  DocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

// Maps a document to a type identity: icon + literal (purge-safe) Tailwind
// classes. Extracted from the original Dashboard.js so DocumentRow and any
// future document list can share one definition instead of duplicating it.
export const FILE_TYPE_STYLES = {
  pdf: {
    label: 'PDF', Icon: DocumentTextIcon,
    tile: 'bg-rose-50 dark:bg-rose-950/40', icon: 'text-rose-500 dark:text-rose-400',
  },
  doc: {
    label: 'Doc', Icon: DocumentTextIcon,
    tile: 'bg-blue-50 dark:bg-blue-950/40', icon: 'text-blue-500 dark:text-blue-400',
  },
  sheet: {
    label: 'Sheet', Icon: TableCellsIcon,
    tile: 'bg-emerald-50 dark:bg-emerald-950/40', icon: 'text-emerald-500 dark:text-emerald-400',
  },
  slide: {
    label: 'Slides', Icon: PresentationChartBarIcon,
    tile: 'bg-orange-50 dark:bg-orange-950/40', icon: 'text-orange-500 dark:text-orange-400',
  },
  image: {
    label: 'Image', Icon: PhotoIcon,
    tile: 'bg-violet-50 dark:bg-violet-950/40', icon: 'text-violet-500 dark:text-violet-400',
  },
  archive: {
    label: 'Archive', Icon: ArchiveBoxIcon,
    tile: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400',
  },
  default: {
    label: 'File', Icon: DocumentIcon,
    tile: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400',
  },
};

export const getFileType = (doc) => {
  const raw = (doc?.type || doc?.filename?.split('.').pop() || '').toLowerCase();
  if (raw.includes('pdf')) return FILE_TYPE_STYLES.pdf;
  if (['doc', 'docx'].some((e) => raw.includes(e))) return FILE_TYPE_STYLES.doc;
  if (['xls', 'xlsx', 'csv'].some((e) => raw.includes(e))) return FILE_TYPE_STYLES.sheet;
  if (['ppt', 'pptx'].some((e) => raw.includes(e))) return FILE_TYPE_STYLES.slide;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some((e) => raw.includes(e))) return FILE_TYPE_STYLES.image;
  if (['zip', 'rar', '7z'].some((e) => raw.includes(e))) return FILE_TYPE_STYLES.archive;
  return FILE_TYPE_STYLES.default;
};