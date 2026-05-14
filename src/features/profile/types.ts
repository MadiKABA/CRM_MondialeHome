export interface ProfileDTO {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  language: string;
  timezone: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface SessionDTO {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}
