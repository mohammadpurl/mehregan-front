import { z } from 'zod';

export const MissionRequestCreateSchema = z.object({
  destination: z.string().min(1, 'محل ماموریت الزامی است').max(500),
  reason: z.string().min(1, 'دلیل ماموریت الزامی است').max(8000),
  vehicle: z.string().min(1, 'وسیله نقلیه الزامی است').max(255),
});

export type MissionRequestCreateValues = z.infer<typeof MissionRequestCreateSchema>;

export const MissionReportSchema = z.object({
  reportText: z.string().min(1, 'متن گزارش الزامی است').max(20000),
});

export type MissionReportValues = z.infer<typeof MissionReportSchema>;
