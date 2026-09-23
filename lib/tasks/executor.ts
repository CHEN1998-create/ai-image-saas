// 生图任务执行器（server-only, Node runtime）
// 状态机：queued → running → success / failed
// 由 Route Handler 以 fire-and-forget 方式启动（不阻塞响应，前端轮询状态）。
//
// 注意：此模式在长驻 Node 进程（npm run dev / 自托管）下可靠；
// 部署到 Vercel 等 serverless 时函数返回后会冻结，届时需改用
// 队列/真实模型 webhook 驱动（provider 接口已为此预留）。

import { getProvider, hashString } from "@/lib/providers";
import { uploadGeneratedImage, deleteTaskObjects } from "@/lib/storage";
import { nextId } from "@/lib/db/store";
import {
  getTaskById
} from "@/lib/db/reads";
import {
  updateTaskProgress,
  completeTask,
  failTask,
  saveResultImage,
  addPointRecord,
  deleteTaskImages,
  logProviderCall
} from "@/lib/db/writes";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 是否已被管理员取消（cancelTask 会置 cancelled 并自行退还积分/清理）
async function isCancelled(taskId: string): Promise<boolean> {
  const d = await getTaskById(taskId);
  return !d || d.task.status === "cancelled";
}

export async function executeTask(taskId: string): Promise<void> {
  try {
    const detail = await getTaskById(taskId);
    if (!detail) return;
    const { task } = detail;
    // 只执行 queued 任务，防止重复触发
    if (task.status !== "queued") return;

    await updateTaskProgress(taskId, { status: "running", progress: 3 });
    await sleep(700); // 模拟任务调度/模型冷启动
    if (await isCancelled(taskId)) return;

    const provider = getProvider(task.model);
    const baseSeed = hashString(task.prompt + "|" + task.id);
    // 每张图分摊 5→98 的进度区间
    const span = Math.floor(93 / task.count);

    for (let i = 0; i < task.count; i++) {
      const base = 5 + i * span;
      await updateTaskProgress(taskId, { progress: base });
      if (await isCancelled(taskId)) return;

      // 1) 生成图片字节（计时 + 记录 provider 调用日志）
      const callStart = Date.now();
      let result;
      try {
        result = await provider.generate({
          prompt: task.prompt,
          negativePrompt: task.negativePrompt,
          model: task.model,
          ratio: task.ratio,
          seed: baseSeed + i
        });
        await logProviderCall({
          providerName: provider.code ?? task.model,
          taskId,
          status: "success",
          durationMs: Date.now() - callStart
        });
      } catch (genErr) {
        await logProviderCall({
          providerName: provider.code ?? task.model,
          taskId,
          status: "failed",
          durationMs: Date.now() - callStart,
          errorMessage: genErr instanceof Error ? genErr.message : "模型调用失败"
        });
        throw genErr;
      }
      await updateTaskProgress(taskId, { progress: base + Math.floor(span * 0.55) });
      if (await isCancelled(taskId)) return;

      // 2) 上传对象存储
      const imageId = nextId("g");
      const uploaded = await uploadGeneratedImage({
        userId: task.userId,
        taskId,
        imageId,
        buffer: result.buffer,
        contentType: result.contentType
      });
      await updateTaskProgress(taskId, { progress: base + Math.floor(span * 0.8) });
      if (await isCancelled(taskId)) return;

      // 3) 结果入库
      await saveResultImage({
        id: imageId,
        taskId,
        userId: task.userId,
        url: uploaded.url,
        prompt: task.prompt,
        model: task.model,
        ratio: task.ratio
      });
    }

    if (await isCancelled(taskId)) return;
    await completeTask(taskId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "生成失败";
    // 任务状态置 failed（独立 try，避免状态更新本身失败时吞掉后续回滚）
    try {
      await failTask(taskId, message);
      const detail = await getTaskById(taskId);
      const cost = detail?.task.pointsCost ?? 0;
      // 退还预扣积分
      if (cost > 0 && detail) {
        await addPointRecord(detail.task.userId, cost, `任务失败退还 ${taskId}`);
      }
      // 清理半成品：DB 行 + Storage 对象
      await deleteTaskImages(taskId);
      if (detail) await deleteTaskObjects(detail.task.userId, taskId);
    } catch (rollbackErr) {
      console.error(`[executor] 任务 ${taskId} 失败回滚异常:`, rollbackErr);
    }
  }
}
