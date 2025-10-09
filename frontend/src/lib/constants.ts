// lib/constants.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7257',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/Auth/login',
      REGISTER: '/api/Auth/register',
      REFRESH: '/api/Auth/refresh',
      LOGOUT: '/api/Auth/logout',
      VERIFY_EMAIL: '/api/Auth/verify-email',
      FORGOT_PASSWORD: '/api/Auth/forgot-password',
      RESET_PASSWORD: '/api/Auth/reset-password'
    },
    USER: {
      PROFILE: '/api/User/profile',
      UPDATE_PROFILE: '/api/User/profile',
      CHANGE_PASSWORD: '/api/User/change-password'
    },
    PROPERTIES: {
      LIST: '/api/Properties',
      DETAIL: '/api/Properties',
      CREATE: '/api/Properties',
      UPDATE: '/api/Properties',
      DELETE: '/api/Properties'
    },
    BOOKINGS: {
      LIST: '/api/Bookings',
      DETAIL: '/api/Bookings',
      CREATE: '/api/Bookings',
      UPDATE: '/api/Bookings',
      CANCEL: '/api/Bookings'
    }
  }
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data'
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_EMAIL: '/auth/verify-email',
  PROFILE: '/profile',
  PROPERTIES: '/properties',
  BOOKINGS: '/bookings',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PROPERTIES: '/admin/properties',
    BOOKINGS: '/admin/bookings',
    USERS: '/admin/users'
  }
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const;