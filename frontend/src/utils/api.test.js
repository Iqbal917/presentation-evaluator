import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { evaluationAPI } from "./api";

describe("evaluationAPI", () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should call start-evaluation with Authorization header when token is provided", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ status: "started", task_id: "abc123" }),
        });

        const response = await evaluationAPI.startEvaluation("token-123");

        expect(global.fetch).toHaveBeenCalledWith(
            "/start-evaluation",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
            })
        );
        expect(response.status).toBe("started");
        expect(response.task_id).toBe("abc123");
    });

    it("should return metrics from /api/metrics without token", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ expression: "happy", pitch: 112, confidence: 88 }),
        });

        const response = await evaluationAPI.getMetrics();

        expect(global.fetch).toHaveBeenCalledWith("/api/metrics", expect.objectContaining({ headers: { cache: "no-store" } }));
        expect(response.expression).toBe("happy");
        expect(response.pitch).toBe(112);
        expect(response.confidence).toBe(88);
    });
});
