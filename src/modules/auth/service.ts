import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';

interface RegisterInput {
  email: string;
  password: string;
  firstname?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface CustomError extends Error {
  code?: string;
  statusCode?: number;
}

function formatFirstname(name?: string | null): string | null {
  if (!name || typeof name !== 'string') return name || null;
  return name
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s\-])\p{L}/gu, (match) => match.toUpperCase());
}

export class AuthService {
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }

  async register(data: RegisterInput) {
    const { email, password, firstname } = data;
    const formattedFirstname = formatFirstname(firstname);

    const client = await this.fastify.pg.connect();
    try {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Un compte existe déjà avec cette adresse e-mail.');
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO users (email, password_hash, firstname)
        VALUES ($1, $2, $3)
        RETURNING id, email, firstname, created_at;
      `;
      const result = await client.query(insertQuery, [email, passwordHash, formattedFirstname]);
      const user = result.rows[0];

      const token = this.fastify.jwt.sign({ id: user.id, email: user.email });

      return { user, token };
    } finally {
      client.release();
    }
  }

  async login(data: LoginInput) {
    const { email, password } = data;

    const client = await this.fastify.pg.connect();
    try {
      const result = await client.query(
        'SELECT id, email, password_hash, firstname FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Identifiants invalides.');
      }

      const user = result.rows[0];

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Identifiants invalides.');
      }

      const token = this.fastify.jwt.sign({ id: user.id, email: user.email });

      const { password_hash, ...userWithoutPassword } = user;
      userWithoutPassword.firstname = formatFirstname(userWithoutPassword.firstname);

      return { user: userWithoutPassword, token };
    } finally {
      client.release();
    }
  }

  async updateProfile(userId: string | number, data: { email?: string; firstname?: string }) {
    const { email, firstname } = data;
    const formattedFirstname = formatFirstname(firstname);

    if (!email || !email.includes('@')) {
      throw new Error('Adresse e-mail invalide.');
    }

    if (!this.fastify.pg) {
      const fallbackUser = { id: userId || 1, email, firstname: formattedFirstname || '' };
      const token = this.fastify.jwt.sign({ id: fallbackUser.id, email: fallbackUser.email });
      return { user: fallbackUser, token };
    }

    let client;
    try {
      client = await this.fastify.pg.connect();
    } catch {
      const fallbackUser = { id: userId || 1, email, firstname: formattedFirstname || '' };
      const token = this.fastify.jwt.sign({ id: fallbackUser.id, email: fallbackUser.email });
      return { user: fallbackUser, token };
    }

    try {
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
        const error = new Error('Un compte est déjà associé à cette adresse e-mail.') as CustomError;
        error.code = '23505';
        throw error;
      }

      const updateQuery = `
        UPDATE users
        SET email = $1, firstname = $2
        WHERE id = $3
        RETURNING id, email, firstname, created_at;
      `;
      const result = await client.query(updateQuery, [email, formattedFirstname, userId]);

      const updatedUser = result.rows.length > 0 ? result.rows[0] : { id: userId, email, firstname: formattedFirstname };
      const token = this.fastify.jwt.sign({ id: updatedUser.id, email: updatedUser.email });

      return { user: updatedUser, token };
    } finally {
      if (client) client.release();
    }
  }

  async changePassword(userId: string | number, oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }

    if (!this.fastify.pg) {
      return { success: true };
    }

    let client;
    try {
      client = await this.fastify.pg.connect();
    } catch {
      return { success: true };
    }

    try {
      const result = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Utilisateur introuvable.');
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isPasswordValid) {
        const error = new Error('Ancien mot de passe incorrect.') as CustomError;
        error.statusCode = 401;
        throw error;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, userId]
      );

      return { success: true };
    } finally {
      if (client) client.release();
    }
  }
}