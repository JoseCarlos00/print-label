import bcrypt from 'bcryptjs';

const salt = await bcrypt.genSalt(10);

export class Bcrypt {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
