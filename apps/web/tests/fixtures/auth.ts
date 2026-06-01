import { test as base, Page } from '@playwright/test';
import jwt from 'jsonwebtoken';

export type AuthFixtures = {
  adminToken: string;
  userToken: string;
  adminPage: Page;
  userPage: Page;
};

/**
 * Generate JWT token for testing
 */
function generateTestToken(userId: string, role: string = 'ADMIN'): string {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(
    {
      sub: userId,
      email: `${userId}@test.local`,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    secret,
  );
}

/**
 * Setup admin authentication
 */
const adminTokenFixture = async ({}, use) => {
  const token = generateTestToken('admin-user-123', 'ADMIN');
  await use(token);
};

/**
 * Setup user authentication
 */
const userTokenFixture = async ({}, use) => {
  const token = generateTestToken('regular-user-456', 'USER');
  await use(token);
};

/**
 * Create authenticated admin page
 */
const adminPageFixture = async ({ page, adminToken }, use) => {
  // Set token in localStorage
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
  }, { token: adminToken });

  await use(page);
};

/**
 * Create authenticated user page
 */
const userPageFixture = async ({ page, userToken }, use) => {
  // Set token in localStorage
  await page.addInitScript(({ token }) => {
    localStorage.setItem('auth_token', token);
  }, { token: userToken });

  await use(page);
};

export const test = base.extend<AuthFixtures>({
  adminToken: adminTokenFixture,
  userToken: userTokenFixture,
  adminPage: adminPageFixture,
  userPage: userPageFixture,
});

export { expect } from '@playwright/test';
