import { useEffect, useState } from 'react';

export interface DatatablePart {
  id: string;
  itemNumber: string;
  partNumber: string;
  groupName: string;
  displayName: string;
  category: string;
  side: string;
  description: string;
  technicalNotes: string;
  storeLink: string | null;
  storeLinkText: string | null;
  specifications: Record<string, string>;
  maintenance: {
    interval: string;
    task: string;
    commonIssues: string;
  } | null;
}

interface DatatableRow {
  [key: string]: string;
}

interface DatatableResponse {
  id: number;
  name: string;
  schema: { name: string; type: string }[];
  rows: DatatableRow[];
}

const DATATABLE_URL = 'https://renderadmin.vivid3d.tech/datatables/524';

const SPEC_FIELDS: { key: string; label: string }[] = [
  { key: 'spec_material', label: 'Material' },
  { key: 'spec_weight', label: 'Weight' },
  { key: 'spec_torque', label: 'Torque' },
  { key: 'spec_bearing_type', label: 'Bearing Type' },
  { key: 'spec_brake_type', label: 'Brake Type' },
  { key: 'spec_spring_type', label: 'Spring Type' },
  { key: 'spec_load_capacity', label: 'Load Capacity' },
  { key: 'spec_lining_life', label: 'Lining Life' },
  { key: 'spec_durability', label: 'Durability' },
];

function parseSpecifications(row: DatatableRow): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const { key, label } of SPEC_FIELDS) {
    if (row[key]) specs[label] = row[key];
  }
  return specs;
}

function parseMaintenance(row: DatatableRow) {
  const interval = row.maint_interval || '';
  const task = row.maint_task || '';
  const commonIssues = row.maint_common_issues || '';
  if (!interval && !task && !commonIssues) return null;
  return { interval, task, commonIssues };
}

function parseDatatableRows(data: DatatableResponse): DatatablePart[] {
  if (!data?.rows) return [];

  return data.rows
    .filter((row) => row.id)
    .map((row) => ({
      id: row.id || '',
      itemNumber: row.itemNumber || '',
      partNumber: row.partNumber || '',
      groupName: row.groupName || '',
      displayName: row.displayName || '',
      category: row.category || '',
      side: row.side || '',
      description: row.description || '',
      technicalNotes: row.technical_notes || '',
      storeLink: row.store_link || null,
      storeLinkText: row.store_link_text || null,
      specifications: parseSpecifications(row),
      maintenance: parseMaintenance(row),
    }));
}

let cachedParts: DatatablePart[] | null = null;
let fetchPromise: Promise<DatatablePart[]> | null = null;

function fetchParts(): Promise<DatatablePart[]> {
  if (cachedParts) return Promise.resolve(cachedParts);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(DATATABLE_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: DatatableResponse) => {
      cachedParts = parseDatatableRows(data);
      return cachedParts;
    })
    .catch((err) => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

export function useDatatableParts() {
  const [parts, setParts] = useState<DatatablePart[]>(cachedParts ?? []);
  const [isLoading, setIsLoading] = useState(!cachedParts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchParts()
      .then((data) => {
        if (!cancelled) {
          setParts(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load parts');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { parts, isLoading, error };
}
