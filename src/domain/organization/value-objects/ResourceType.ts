/**
 * Definierar olika typer av resurser som kan finnas i en organisation
 * 
 * Dessa resurstyper används för att kategorisera organisationsresurser
 * och associera dem med olika behörighetsmodeller.
 */
export enum ResourceType {
  DOCUMENT = 'document',
  PROJECT = 'project',
  GOAL = 'goal',
  TEMPLATE = 'template',
  FILE = 'file',
  REPORT = 'report',
  DASHBOARD = 'dashboard',
  CONFIG = 'config',
  OTHER = 'other'
}

/**
 * Svenska etiketter för resurstyper
 */
export const ResourceTypeLabels: Record<ResourceType, string> = {
  [ResourceType.DOCUMENT]: 'Dokument',
  [ResourceType.PROJECT]: 'Projekt',
  [ResourceType.GOAL]: 'Mål',
  [ResourceType.TEMPLATE]: 'Mall',
  [ResourceType.FILE]: 'Fil',
  [ResourceType.REPORT]: 'Rapport',
  [ResourceType.DASHBOARD]: 'Dashboard',
  [ResourceType.CONFIG]: 'Konfiguration',
  [ResourceType.OTHER]: 'Övrigt'
};

/**
 * Beskrivningar för de olika resurstyperna
 */
export const ResourceTypeDescriptions: Record<ResourceType, string> = {
  [ResourceType.DOCUMENT]: 'Dokument som kan delas inom organisationen',
  [ResourceType.PROJECT]: 'Projekt för att organisera arbete',
  [ResourceType.GOAL]: 'Mål för organisationen eller team',
  [ResourceType.TEMPLATE]: 'Återanvändbara mallar',
  [ResourceType.FILE]: 'Filer uppladdade till organisationen',
  [ResourceType.REPORT]: 'Rapporter genererade i systemet',
  [ResourceType.DASHBOARD]: 'Dashboards för övervakning och visualisering',
  [ResourceType.CONFIG]: 'Konfigurationer för organisationen',
  [ResourceType.OTHER]: 'Övriga resurstyper'
}; 