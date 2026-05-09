import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import * as metricsService from '../../services/metrics.service';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await metricsService.getDashboardMetrics();
    return sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
});

router.get('/platform', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await metricsService.getPlatformMetrics();
    return sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
});

router.get('/workers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await metricsService.getWorkerStats();
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});

router.get('/timeseries', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const precision = (req.query.precision as any) || 'day';
    const stats = await metricsService.getTimeSeriesMetrics(precision);
    return sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
});

export const adminMetricsRouter = router;
