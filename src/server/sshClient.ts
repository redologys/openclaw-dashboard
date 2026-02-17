import { NodeSSH } from 'node-ssh';
import { config } from '../lib/config';

export class SshClient {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect() {
    if (config.SAFE_MODE) {
      console.log('[SSH] Safe Mode enabled. Skipping real connection.');
      return;
    }

    try {
      await this.ssh.connect({
        host: config.SSH_HOST,
        username: config.SSH_USER,
        password: config.SSH_PASSWORD,
        privateKeyPath: config.SSH_KEY_PATH,
      });
      console.log(`[SSH] Connected to ${config.SSH_HOST}`);
    } catch (error) {
      console.error(`[SSH] Connection failed:`, error);
      throw error;
    }
  }

  async executeCommand(command: string): Promise<{ stdout: string; stderr: string; code: number | null }> {
    console.log(`[SSH] Executing: ${command}`);

    if (config.SAFE_MODE) {
      return { stdout: `[MOCK] Executed: ${command}`, stderr: '', code: 0 };
    }

    try {
      const result = await this.ssh.execCommand(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code,
      };
    } catch (error) {
       console.error(`[SSH] Command execution failed:`, error);
       throw error;
    }
  }

  async dispose() {
    this.ssh.dispose();
  }
}

export const sshClient = new SshClient();
