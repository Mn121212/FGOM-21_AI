// OAuth and Deployment Types
// This file contains all type definitions for OAuth providers, connections, and deployment features

export type OAuthProvider = 
  | "github"
  | "vercel" 
  | "supabase"
  | "neon"
  | "planetscale"
  | "turso"
  | "railway"
  | "render"
  | "flyio"
  | "netlify";

// Database providers that support OAuth
export type DatabaseProvider = "supabase" | "neon" | "planetscale" | "turso";

// Hosting providers that support OAuth
export type HostingProvider = "vercel" | "railway" | "render" | "flyio" | "netlify";

// All platform providers
export type PlatformProvider = DatabaseProvider | HostingProvider | "github";

// Information about a connected OAuth account
export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  label: string;
  avatarUrl?: string;
  connectedAt: string;
  lastUsedAt?: string;
  scopes?: string[];
}

// Simplified version for frontend display
export interface ConnectedAccountDisplay {
  id: string;
  provider: OAuthProvider;
  label: string;
  avatarUrl?: string;
  connectedAt: string;
}

// GitHub Repository information
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatarUrl?: string;
  description: string;
  htmlUrl: string;
  apiUrl: string;
  defaultBranch: string;
  language: string;
  languages?: Record<string, number>;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  isFork: boolean;
  license?: {
    name: string;
    url?: string;
  };
  topics: string[];
  pushedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Repository file structure
export interface RepositoryFile {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink";
  size: number;
  mimeType?: string;
  extension?: string;
}

// Project deployment information
export interface DeploymentProject {
  id: string;
  userId: string;
  name: string;
  repositoryUrl: string;
  branch: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Database connection information
export interface ProjectDatabase {
  id: string;
  userId: string;
  projectId: string;
  provider: DatabaseProvider;
  providerDatabaseId: string;
  databaseName: string;
  connectionString: string;
  createdAt: string;
}

// Deployment status
export interface Deployment {
  id: string;
  userId: string;
  projectId: string;
  provider: HostingProvider;
  providerDeploymentId: string;
  status: "queued" | "building" | "deployed" | "error" | "cancelled";
  deploymentUrl?: string;
  previewUrl?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// OAuth flow state
export interface OAuthState {
  provider: OAuthProvider;
  state: string;
  codeVerifier: string;
  redirectTo?: "database" | "hosting" | "github";
  createdAt: number;
}

// Platform configuration for OAuth
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  redirectUri: string;
}

// Provider metadata for UI display
export interface ProviderMetadata {
  id: OAuthProvider;
  name: string;
  displayName: string;
  description: string;
  icon?: string;
  emoji: string;
  color: string;
  bgColor: string;
  recommended: boolean;
  category: "database" | "hosting" | "github";
  docsUrl: string;
  oauthSupported: boolean;
}

// Step types for multi-step flows
export type HostingFlowStep = "connect-github" | "select-repo" | "select-platform" | "select-branch" | "review" | "deploying" | "complete";

export type DatabaseFlowStep = "select-provider" | "authenticate" | "select-database" | "configure" | "complete";

// Props for modal components
export interface PlatformOAuthButtonProps {
  provider: OAuthProvider;
  isConnected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export interface ConnectedAccountsListProps {
  accounts: ConnectedAccountDisplay[];
  onDisconnect: (accountId: string) => void;
  onUse?: (account: ConnectedAccountDisplay) => void;
  showActions?: boolean;
}

export interface DatabaseConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess?: (account: ConnectedAccountDisplay) => void;
}

export interface HostingPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  onDeploySuccess?: (deployment: Deployment) => void;
}

// API response types
export interface OAuthStartResponse {
  authorizationUrl: string;
}

export interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  redirect_to?: string;
}

export interface ConnectionsResponse {
  accounts: ConnectedAccountDisplay[];
}

export interface RepositoriesResponse {
  repositories: GitHubRepository[];
}

// Platform provider metadata
export const PROVIDER_METADATA: Record<OAuthProvider, ProviderMetadata> = {
  github: {
    id: "github",
    name: "github",
    displayName: "GitHub",
    description: "مستودعات الكود المصدر مع Git",
    emoji: "🐙",
    color: "#ffffff",
    bgColor: "#24292f",
    recommended: true,
    category: "github",
    docsUrl: "https://docs.github.com",
    oauthSupported: true,
  },
  vercel: {
    id: "vercel",
    name: "vercel",
    displayName: "Vercel",
    description: "استضافة سريعة للتطبيقات modernen",
    emoji: "▲",
    color: "#ffffff",
    bgColor: "#000000",
    recommended: true,
    category: "hosting",
    docsUrl: "https://vercel.com/docs",
    oauthSupported: true,
  },
  supabase: {
    id: "supabase",
    name: "supabase",
    displayName: "Supabase",
    description: "قاعدة بيانات مفتوحة المصدر مع Auth و Storage",
    emoji: "🔥",
    color: "#ffffff",
    bgColor: "#102428",
    recommended: true,
    category: "database",
    docsUrl: "https://supabase.com/docs",
    oauthSupported: true,
  },
  neon: {
    id: "neon",
    name: "neon",
    displayName: "Neon",
    description: "PostgreSQL serverless مدرنة",
    emoji: "⚡",
    color: "#00D4FF",
    bgColor: "#000000",
    recommended: false,
    category: "database",
    docsUrl: "https://neon.tech/docs",
    oauthSupported: true,
  },
  planetscale: {
    id: "planetscale",
    name: "planetscale",
    displayName: "PlanetScale",
    description: "MySQL serverless قابلة للتوسع",
    emoji: "🌍",
    color: "#000000",
    bgColor: "#FFDE59",
    recommended: false,
    category: "database",
    docsUrl: "https://planetscale.com/docs",
    oauthSupported: true,
  },
  turso: {
    id: "turso",
    name: "turso",
    displayName: "Turso",
    description: "SQLite serverless على الحافة",
    emoji: "✨",
    color: "#000000",
    bgColor: "#4ECDD4",
    recommended: false,
    category: "database",
    docsUrl: "https://turso.tech/docs",
    oauthSupported: true,
  },
  railway: {
    id: "railway",
    name: "railway",
    displayName: "Railway",
    description: "استضافة التطبيقات الكاملة",
    emoji: "🚂",
    color: "#ffffff",
    bgColor: "#000000",
    recommended: false,
    category: "hosting",
    docsUrl: "https://docs.railway.app",
    oauthSupported: true,
  },
  render: {
    id: "render",
    name: "render",
    displayName: "Render",
    description: "استضافة بسيطة وقوية",
    emoji: "🎨",
    color: "#4A4AFF",
    bgColor: "#ffffff",
    recommended: false,
    category: "hosting",
    docsUrl: "https://render.com/docs",
    oauthSupported: true,
  },
  flyio: {
    id: "flyio",
    name: "flyio",
    displayName: "Fly.io",
    description: "استضافة مع Docker",
    emoji: "🪰",
    color: "#ffffff",
    bgColor: "#262626",
    recommended: false,
    category: "hosting",
    docsUrl: "https://fly.io/docs",
    oauthSupported: true,
  },
  netlify: {
    id: "netlify",
    name: "netlify",
    displayName: "Netlify",
    description: "استضافة للمواقع الثابتة Serverless",
    emoji: "🐉",
    color: "#ffffff",
    bgColor: "#00C7B7",
    recommended: false,
    category: "hosting",
    docsUrl: "https://docs.netlify.com",
    oauthSupported: true,
  },
};

// Category grouping
export const DATABASE_PROVIDERS: DatabaseProvider[] = ["supabase", "neon", "planetscale", "turso"];

export const HOSTING_PROVIDERS: HostingProvider[] = ["vercel", "railway", "render", "flyio", "netlify"];

export const ALL_OAUTH_PROVIDERS: OAuthProvider[] = [
  "github",
  "vercel",
  "supabase",
  "neon",
  "planetscale",
  "turso",
];
