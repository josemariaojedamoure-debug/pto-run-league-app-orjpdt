import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';

export function registerUserRoutes(app: App) {
  const requireAuth = app.requireAuth();

  app.fastify.get(
    '/api/user/profile',
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ): Promise<{
      firstName: string;
      lastName: string;
      company: string;
      email: string;
      createdAt: string;
    } | void> => {
      app.logger.info(
        { method: 'GET', path: '/api/user/profile' },
        'Fetching user profile'
      );

      const session = await requireAuth(request, reply);
      if (!session) return;

      try {
        const userId = session.user.id;

        // Query the profiles table for the user's profile
        const profileResult = await app.db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId));

        const profile = profileResult[0];

        // Construct response with profile data or defaults
        const response = {
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          company: profile?.company || '',
          email: session.user.email,
          createdAt: profile?.createdAt
            ? new Date(profile.createdAt).toISOString()
            : new Date().toISOString(),
        };

        app.logger.info(
          { userId, firstName: response.firstName, lastName: response.lastName },
          'User profile fetched successfully'
        );

        return response;
      } catch (error) {
        app.logger.error(
          { err: error, userId: session.user.id },
          'Failed to fetch user profile'
        );
        throw error;
      }
    }
  );
}
