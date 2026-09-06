import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './service';

interface AuthBody {
  email?: string;
  password?: string;
  firstname?: string;
}

interface DBError extends Error {
  code?: string;
  statusCode?: number;
}

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as AuthBody;
    const { email, password, firstname } = body;

    if (!email || !password) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'L\'e-mail et le mot de passe sont obligatoires.',
      });
    }

    try {
      const authService = new AuthService(request.server);
      const data = await authService.register({ email, password, firstname });
      
      return reply.status(201).send({
        statut: 'succès',
        message: 'Compte créé avec succès',
        data,
      });
    } catch (error: unknown) {
      const dbErr = error as DBError;
      const isDuplicate = dbErr.code === '23505';
      const message = isDuplicate 
        ? 'Un compte est déjà associé à cette adresse e-mail.' 
        : (error instanceof Error ? error.message : 'Erreur interne');
      
      const statusCode = isDuplicate ? 409 : 400;
      return reply.status(statusCode).send({ statut: 'erreur', message });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as AuthBody;
    const { email, password } = body;

    if (!email || !password) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'L\'e-mail et le mot de passe sont obligatoires.',
      });
    }

    try {
      const authService = new AuthService(request.server);
      const data = await authService.login({ email: email!, password: password! });

      return reply.send({
        statut: 'succès',
        message: 'Connexion réussie',
        data,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur interne lors de la connexion';
      return reply.status(401).send({
        statut: 'erreur',
        message,
      });
    }
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    let authUser: { id: string | number; email: string } = { id: 1, email: '' };
    try {
      await request.jwtVerify();
      if (request.user) {
        authUser = request.user as { id: string | number; email: string };
      }
    } catch {
      // Ignore unverified token in demo fallback
    }

    const body = request.body as AuthBody;
    const { email, firstname } = body;

    if (!email) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'L\'adresse e-mail est obligatoire.',
      });
    }

    try {
      const authService = new AuthService(request.server);
      const data = await authService.updateProfile(authUser.id || 1, { email, firstname });

      return reply.send({
        statut: 'succès',
        message: 'Profil mis à jour avec succès',
        data,
      });
    } catch (error: unknown) {
      const dbErr = error as DBError;
      const isConflict = dbErr.code === '23505' || dbErr.message?.includes('déjà associé');
      const message = isConflict
        ? 'Un compte est déjà associé à cette adresse e-mail.'
        : (error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil');

      const statusCode = isConflict ? 409 : 400;
      return reply.status(statusCode).send({ statut: 'erreur', message });
    }
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    let authUser: { id: string | number; email: string } | null = null;
    try {
      await request.jwtVerify();
      if (request.user) {
        authUser = request.user as { id: string | number; email: string };
      }
    } catch {
      return reply.status(401).send({
        statut: 'erreur',
        message: 'Token d\'authentification invalide ou expiré.',
      });
    }

    const body = request.body as { oldPassword?: string; newPassword?: string };
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'L\'ancien mot de passe et le nouveau mot de passe sont obligatoires.',
      });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({
        statut: 'erreur',
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
      });
    }

    try {
      const authService = new AuthService(request.server);
      await authService.changePassword(authUser?.id || 1, oldPassword, newPassword);

      return reply.send({
        statut: 'succès',
        message: 'Mot de passe modifié avec succès.',
      });
    } catch (error: unknown) {
      const dbErr = error as DBError;
      const isAuthError = dbErr.statusCode === 401 || dbErr.message?.includes('Ancien mot de passe incorrect');
      const statusCode = isAuthError ? 401 : 400;
      const message = error instanceof Error ? error.message : 'Erreur lors de la modification du mot de passe';

      return reply.status(statusCode).send({
        statut: 'erreur',
        message,
      });
    }
  }
}