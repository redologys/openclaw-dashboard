import { Router } from 'express';
import { gateway } from './gateway';
import { config } from '../lib/config';
import { PermissionContext } from '../lib/types';
import { PermissionFirewall } from '../lib/permissions';

let lastScreenshot: string | null = null;
let lastScreenshotTime: number = 0;

export const createBrowserRouter = (permissionFirewall: PermissionFirewall) => {
    const browserRouter = Router();

    const buildPermissionContext = (body: Record<string, unknown> | undefined): PermissionContext => {
        const role = typeof body?.userRole === 'string' ? body.userRole : 'admin';
        const userRole =
            role === 'root' || role === 'admin' || role === 'viewer' || role === 'user'
                ? role
                : 'admin';
        return {
            userRole,
            agentId: typeof body?.agentId === 'string' ? body.agentId : undefined,
            safeMode: config.SAFE_MODE,
        };
    };

    // GET /api/browser/screenshot
    browserRouter.get('/screenshot', async (_req, res) => {
        if (config.SAFE_MODE) {
            // Return a grey placeholder base64
            return res.json({
                image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
                placeholder: true
            });
        }

        const now = Date.now();
        // Cache for 800ms
        if (lastScreenshot && (now - lastScreenshotTime < 800)) {
            return res.json({ image: lastScreenshot });
        }

        try {
            const result = await gateway.callTool('browser_screenshot', {});
            if (result && result.base64) {
                lastScreenshot = result.base64;
                lastScreenshotTime = now;
                res.json({ image: lastScreenshot });
                // Emit event for SSE
                gateway.emit('browser_event', { type: 'screenshot_updated', timestamp: new Date().toISOString() });
            } else {
                res.status(503).json({ error: 'Browser not responsive or screenshot failed' });
            }
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/browser/state
    browserRouter.get('/state', (_req, res) => {
        res.json({
            active: !config.SAFE_MODE,
            url: "https://www.youtube.com",
            title: "YouTube - Home",
            agent: "ResearchBot",
            task: "Searching for documentary footage",
            step: 3,
            lastScreenshot: lastScreenshotTime ? new Date(lastScreenshotTime).toISOString() : null
        });
    });

    // GET /api/browser/events (SSE)
    browserRouter.get('/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendEvent = (data: any) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Forward browser specific events
        const onBrowserEvent = (event: any) => sendEvent(event);
        gateway.on('browser_event', onBrowserEvent);

        // Also forward agent reasoning steps that involve browser
        const onThought = (thought: any) => {
            if (thought.tool === 'browser' || thought.text?.toLowerCase().includes('browser')) {
                 sendEvent({ type: 'task_progress', ...thought });
            }
        };
        gateway.on('thought', onThought);

        req.on('close', () => {
            gateway.off('browser_event', onBrowserEvent);
            gateway.off('thought', onThought);
            res.end();
        });
    });

    // POST /api/browser/click
    browserRouter.post('/click', async (req, res) => {
        const { x, y } = req.body ?? {};
        try {
            const permission = await permissionFirewall.validateAndExecute(
                'execute',
                'web',
                buildPermissionContext(req.body),
                { action: 'click', x, y },
            );
            if (!permission.granted) {
                const code = permission.policy === 'ask' ? 202 : 403;
                return res.status(code).json({
                    error: permission.reason ?? 'Blocked by Permission Firewall',
                    policy: permission.policy,
                    ruleId: permission.ruleId,
                    approvalId: permission.approvalId,
                    safeMode: config.SAFE_MODE,
                });
            }

            const result = await gateway.callTool('browser_click', { x, y });
            return res.json(result);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    });

    // POST /api/browser/navigate
    browserRouter.post('/navigate', async (req, res) => {
        const { url } = req.body ?? {};
        try {
            const permission = await permissionFirewall.validateAndExecute(
                'execute',
                'web',
                buildPermissionContext(req.body),
                { action: 'navigate', url },
            );
            if (!permission.granted) {
                const code = permission.policy === 'ask' ? 202 : 403;
                return res.status(code).json({
                    error: permission.reason ?? 'Blocked by Permission Firewall',
                    policy: permission.policy,
                    ruleId: permission.ruleId,
                    approvalId: permission.approvalId,
                    safeMode: config.SAFE_MODE,
                });
            }

            const result = await gateway.callTool('browser_navigate', { url });
            return res.json(result);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    });

    return browserRouter;
};
