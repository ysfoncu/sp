// Organization Structure Types for SPM System

export interface OrganizationNode {
  id: string;              // Unique identifier for the node
  name: string;            // Display name of the organizational unit
  type: string;            // Type of unit (e.g., "Helseforetak", "Klinikk", "Avdeling", "Seksjon")
  level: number;           // Hierarchy level (0 = root, 1 = first child level, etc.)
  parentId?: string;       // Optional reference to parent node ID
  children: OrganizationNode[];  // Array of child nodes
}

export type OrganizationType = "HF" | "Kommune";

// Hierarchy Level Definitions
export const HF_LEVELS = [
  { level: 0, name: "Helseforetak", singular: "Helseforetak" },     // Health Enterprise
  { level: 1, name: "Klinikk", singular: "Klinikk" },               // Clinic
  { level: 2, name: "Avdeling", singular: "Avdeling" },             // Department
  { level: 3, name: "Seksjon", singular: "Seksjon" },               // Section
  { level: 4, name: "Sengepost", singular: "Sengepost" },           // Ward
];

export const KOMMUNE_LEVELS = [
  { level: 0, name: "Kommune", singular: "Kommune" },               // Municipality
  { level: 1, name: "Sykehjem", singular: "Sykehjem" },            // Nursing Home
  { level: 2, name: "Avdeling", singular: "Avdeling" },            // Department
  { level: 3, name: "Gruppe", singular: "Gruppe" },                // Group
];

// Helper function to get level info by organization type
export const getLevelInfo = (type: OrganizationType, level: number) => {
  const levels = type === "HF" ? HF_LEVELS : KOMMUNE_LEVELS;
  return levels.find(l => l.level === level);
};

// Helper function to flatten organization tree for searching
export const flattenOrganizationTree = (node: OrganizationNode): OrganizationNode[] => {
  const result: OrganizationNode[] = [node];
  node.children.forEach(child => {
    result.push(...flattenOrganizationTree(child));
  });
  return result;
};

// Helper function to find node by id
export const findNodeById = (root: OrganizationNode, id: string): OrganizationNode | null => {
  if (root.id === id) return root;
  
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  
  return null;
};

// Helper function to get breadcrumb path to a node
export const getNodePath = (root: OrganizationNode, targetId: string): OrganizationNode[] => {
  if (root.id === targetId) return [root];
  
  for (const child of root.children) {
    const childPath = getNodePath(child, targetId);
    if (childPath.length > 0) {
      return [root, ...childPath];
    }
  }
  
  return [];
};
