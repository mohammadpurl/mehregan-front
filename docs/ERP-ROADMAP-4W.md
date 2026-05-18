# نقشه راه ۴ هفته‌ای + چک‌لیست فایل‌به‌فایل

مرجع وضعیت: بررسی مخزن `Frontend-Next3/erp` + `Backend2` — هم‌راستا با [ERP-SCOPE-MAP.md](./ERP-SCOPE-MAP.md).

**راهنمای وضعیت**

| نماد | معنی |
|------|------|
| ✅ | قابل استفاده در محیط واقعی (با تنظیمات پایه) |
| 🟡 | نیمه‌کاره — اسکلت یا مسیر جزئی |
| ❌ | پرداخته نشده / وجود ندارد |
| 🔧 | نیاز به عملیات (deploy، consumer، داده تست) |

---

## بخش الف — چک‌لیست فایل‌به‌فایل

### ۱. فرانت — Server Actions (`erp/app/_actions/`)

| فایل | وضعیت | یادداشت |
|------|--------|---------|
| `auth-actions.ts` | ✅ | ورود/خروج |
| `profile-actions.ts` | ✅ | `/auth/me`, پروفایل |
| `user-actions.ts` | ✅ | CRUD کاربران |
| `department-actions.ts` | ✅ | درخت واحد |
| `role-actions.ts` | ✅ | |
| `permission-actions.ts` | ✅ | |
| `role-permission-actions.ts` | ✅ | صفحه assignment-rules |
| `workflow-definition-actions.ts` | ✅ | PUT تعریف مراحل |
| `workflow-runtime-actions.ts` | 🟡 | approve/reject؛ `GET /workflow/instances/{id}` در بک **route ندارد** |
| `workflow-actions.ts` | 🟡 | CRUD `workflow_form` — نه instance |
| `inbox-actions.ts` | ✅ | لیست + read/done + unread-count |
| `notification-actions.ts` | ✅ | لیست + unread-count |
| `payment-request-actions.ts` | ✅ | create/patch + attachments |
| `product-request-actions.ts` | 🟡 | CRUD؛ اتصال inbox/workflow در UI ضعیف |
| `warehouse-actions.ts` | 🟡 | فرم انبار |
| `item-actions.ts` | ✅ | |
| `category-actions.ts` | ✅ | |
| `warehouse-master-actions.ts` | ✅ | |
| `supplier-actions.ts` | ✅ | |
| `inventory-actions.ts` | 🟡 | بستگی به عمق بک |
| `purchase-order-actions.ts` | 🟡 | |
| `grn-actions.ts` | 🟡 | |
| `plan-actions.ts` | ❓ | بررسی مصرف در UI |
| `extract-action-error.ts` | ✅ | خطای FastAPI |

### ۲. فرانت — صفحات داشبورد (`erp/app/dashboard/`)

| مسیر | وضعیت | یادداشت |
|------|--------|---------|
| `page.tsx` | ❌ | خالی — API داشبورد مصرف نشده |
| `profile/page.tsx` | ✅ | |
| `notifications/page.tsx` | ✅ | |
| `payment-request/*` | ✅ | new/list/edit + inbox review |
| `workflow/inbox/page.tsx` | 🟡 | وابسته به API instance؛ payer/loan/advance |
| `workflow/new`, `workflow/page.tsx` | 🟡 | `workflow_form` |
| `workflow/tracking`, `all-requests` | 🟡 | روی **form** نه **instance** |
| `admin/workflow-definitions` | ✅ | steps builder + preview |
| `admin/users`, `roles`, `permissions` | ✅ | |
| `admin/departments/tree` | ✅ | |
| `admin/assignment-rules` | 🟡 | نام گمراه — مجوز نقش است |
| `master/*` | ✅ | items, categories, warehouses, suppliers |
| `inventory/*` | 🟡 | |
| `procurement/requests` | 🟡 | = reuse `product-request` |
| `procurement/orders`, `grn` | 🟡 | |
| `product-request/*` | 🟡 | خارج منوی اصلی |
| `warehouse/*` | 🟡 | `warehouse_form` + workflow بک |

### ۳. فرانت — زیرساخت UI

| فایل | وضعیت | یادداشت |
|------|--------|---------|
| `components/header/Header.tsx` | ✅ | بج قرمز + dropdown |
| `hooks/use-notification-websocket.ts` | 🟡 | بدون auth روی WS |
| `components/notification/notification-realtime-provider.tsx` | ✅ | |
| `_store/notification-center.store.ts` | ✅ | inbox + notification count |
| `components/Table/Table.tsx` | ✅ | اسکرول افقی |
| `utils/resolve-workflow-form.ts` | 🟡 | ۴ ref_type ثابت |
| `public/assets/index.ts` (nav) | 🟡 | product/warehouse/notifications در منو نیست |

### ۴. بک‌اند — Routes (`Backend2/app/routes/`)

| فایل | وضعیت | endpoints مهم |
|------|--------|----------------|
| `auth.py` | ✅ | |
| `workflow.py` | 🟡 | فقط approve/reject — **بدون GET instances** |
| `workflow_definitions.py` | ✅ | CRUD + assignees-preview |
| `workflow_form.py` | ✅ | |
| `payment_request.py` | ✅ | + workflow.start |
| `warehouse_form.py` | ✅ | + workflow.start |
| `inbox.py` | ✅ | + unread-count |
| `notification.py` | ✅ | + unread-count |
| `ws.py` | 🟡 | `/ws/{user_id}` بدون JWT |
| `users.py`, `departments.py`, `roles.py`, `permissions.py` | ✅ | |
| `dashboard.py` | 🟡 | فرانت ندارد |
| `org.py` | 🟡 | hierarchy — جدا از departments UI |
| `procurement/*` (via request router) | 🟡 | workflow.start در service |

### ۵. بک‌اند — سرویس‌ها و موتور

| فایل | وضعیت | یادداشت |
|------|--------|---------|
| `infrastructure/messaging/consumer.py` | 🔧 | workflow.start/next_step؛ **sla.* handle نمی‌شود** |
| `infrastructure/messaging/publisher.py` | ✅ | fallback sync اگر RabbitMQ down |
| `workers/rabbitmq_consumer.py` | 🔧 | باید جدا اجرا شود |
| `workers/sla_worker.py` | 🟡 | publish می‌کند؛ consumer ناقص |
| `services/workflow.py` | ✅ | approve/reject + inbox done |
| `services/workflow_definition_service.py` | ✅ | steps_config |
| `services/workflow_instance_query.py` | 🟡 | `get_instance_approval_plan` — **بدون route** |
| `services/assignment.py` | 🟡 | random/least_loaded/round_robin — **بدون UI** |
| `services/payment_request_terms.py` | ✅ | وام/مساعده/payer |
| `services/workflow_messages.py` | ✅ | متن فارسی inbox/notify |
| `services/inbox.py` | ✅ | |
| `services/notification*.py` | ✅ | |
| `services/audit.py` | 🟡 | `create_audit_log` — **بدون UI و فراخوانی گسترده** |
| `services/dashboard.py` | 🟡 | بدون UI |
| `models/assignment_rule.py` | 🟡 | DB only |

### ۶. حوزه‌های بدون پیاده‌سازی meaningful

| حوزه | وضعیت |
|------|--------|
| دفتر کل / بودجه / بانک / مالیات | ❌ |
| RFQ رسمی / سه‌طرفه‌تطبیق | ❌ |
| Form Builder داینامیک | ❌ |
| شرط/شاخه workflow | ❌ |
| نسخه‌گذاری تعریف workflow | ❌ |
| مرکز ممیزی UI | ❌ |
| SSO / IdP | ❌ |
| Multi-tenant | ❌ |

---

## بخش ب — فازبندی ۴ هفته‌ای

### هفته ۱ — P0: runtime پایدار + inbox قابل اتکا

**هدف:** هر درخواست ثبت‌شده → کارتابل + اعلان → تأیید/رد بدون گسستگی.

| # | کار | فایل‌های اصلی | معیار پذیرش |
|---|-----|----------------|-------------|
| 1.1 | اضافه کردن `GET /workflow/instances/{id}` | `routes/workflow.py` یا `routes/workflow_instances.py`, `workflow_instance_query.py` | inbox جزئیات instance را بدون خطا باز کند |
| 1.2 | `GET /workflow/instances` (لیست با فیلتر ref_type, status) | همان + schema | صفحه پیگیری instance ممکن شود |
| 1.3 | مستند deploy: FastAPI + `python -m app.workers.rabbitmq_consumer` + RabbitMQ | `docs/DEPLOY-WORKFLOW.md` (جدید) | تیم بتواند E2E تست کند |
| 1.4 | تست E2E دستی: ثبت وام → inbox مدیر → approve | — | رکورد payment + step approved |
| 1.5 | اصلاح tracking: یا rename به «فرم‌های اداری» یا اتصال به instances | `workflow/tracking/page.tsx` | کاربر گیج نشود |
| 1.6 | فراخوانی `create_audit_log` در approve/reject | `workflow.py` service | ردیف audit در DB |

**خروجی هفته ۱:** inbox end-to-end پایدار؛ پیگیری instance حداقلی.

---

### هفته ۲ — P1: یکپارچگی فرایندها + تخصیص + SLA

**هدف:** PR/انبار مثل payment در کارتابل؛ SLA واقعی؛ ادمین assignment.

| # | کار | فایل‌های اصلی | معیار پذیرش |
|---|-----|----------------|-------------|
| 2.1 | UI ادمین `assignment_rules` (CRUD per role: strategy) | `admin/assignment-rules/` جدید یا تب در roles | round_robin قابل تنظیم |
| 2.2 | rename منو: «مجوزهای نقش» ≠ assignment | `public/assets/index.ts` | نام واضح |
| 2.3 | Handler `sla.breached` / `sla.escalated` در consumer | `consumer.py` | overdue → inbox/notify مدیر |
| 2.4 | اجرای `sla_worker` در deploy (systemd/cron) | `workers/sla_worker.py` | SLA record trigger شود |
| 2.5 | `resolve-workflow-form` + inbox برای `request` (PR) | `resolve-workflow-form.ts`, inbox UI | PR در کارتابل باز شود |
| 2.6 | منو: product-request, warehouse, notifications | `navItems` | دسترسی از sidebar |
| 2.7 | صفحه «پیگیری نمونه workflow» | `workflow/instances/[id]/page.tsx` | timeline مراحل + وضعیت |

**خروجی هفته ۲:** چند ref_type در یک inbox؛ SLA اولیه؛ تخصیص قابل تنظیم.

---

### هفته ۳ — P2: داشبورد، ممیزی، امنیت، کیفیت UX

**هدف:** دید مدیریتی؛ audit؛ hardening.

| # | کار | فایل‌های اصلی | معیار پذیرش |
|---|-----|----------------|-------------|
| 3.1 | داشبورد از `GET /dashboard` و `/dashboard/management` | `dashboard/page.tsx`, actions | KPI workflow + درخواست‌ها |
| 3.2 | صفحه ممیزی (فیلتر entity, user, date) | `admin/audit/page.tsx`, route `audit.py` | لیست approve/reject |
| 3.3 | WebSocket با token (query یا subprotocol) | `ws.py`, `use-notification-websocket.ts` | اتصال بدون user_id خام |
| 3.4 | جلوگیری از double-count بج (فقط inbox **یا** dedupe workflow notify) | `notification-center.store.ts` | یک workflow = یک عدد منطقی |
| 3.5 | چند نقش در UI کاربر (اگر بک دارد) | `users` form | همه roleها ذخیره شوند |
| 3.6 | enforce `require_permission` روی approve (اختیاری) | `workflow.py` route | بدون نقش/assignee = 403 |

**خروجی هفته ۳:** مدیر داشبورد و audit دارد؛ امنیت WS بهتر.

---

### هفته ۴ — P3: گام اول «workflow دلخواه» + تدارکات

**هدف:** فراتر از ref_type هاردکد؛ RFQ/تدارکات یک پله جلوتر.

| # | کار | فایل‌های اصلی | معیار پذیرش |
|---|-----|----------------|-------------|
| 4.1 | **Process Registry** در DB: code, label, active, default_workflow | migration + admin UI | ref_type جدید بدون deploy |
| 4.2 | Form schema JSON برای `workflow_form` (فیلدهای پویا) | `workflow_form` + renderer | ادمین فیلد اضافه کند |
| 4.3 | پیش‌نمایش مسیر تأیید قبل از submit (reuse builder) | payment-request new | کاربر مسیر را ببیند |
| 4.4 | PO/GRN: نمایش وضعیت workflow در لیست | procurement pages | ستون «مرحله workflow» |
| 4.5 | طراحی RFQ (اسپک + mock UI) — پیاده‌سازی حداقلی یا backlog | `docs/RFQ-SPEC.md` | توافق محصول |
| 4.6 | تست خودکار smoke (Playwright یا pytest API) | `tests/` | CI سبز روی مسیر وام |

**خروجی هفته ۴:** بذر platform workflow؛ تدارکات قابل ردیابی.

---

## بخش ج — معماری هدف (ERP + workflow قابل تنظیم)

برای اینکه «هر کسی هر workflow را ست کند» (بدون برنامه‌نویس)، بعد از ۴ هفته به این لایه‌ها نیاز دارید:

```
┌─────────────────────────────────────────────────────────┐
│  Process Registry (کاتالوگ فرایندها)                     │
├─────────────────────────────────────────────────────────┤
│  Form Designer (schema + visibility per step)            │
├─────────────────────────────────────────────────────────┤
│  Workflow Designer (linear → شرط → موازی)                │
├─────────────────────────────────────────────────────────┤
│  Assignment + SLA policies (UI)                          │
├─────────────────────────────────────────────────────────┤
│  Runtime: instances, tasks, history, audit               │
├─────────────────────────────────────────────────────────┤
│  Task Center (inbox) + Notifications (WS/email)          │
└─────────────────────────────────────────────────────────┘
```

**وضعیت فعلی شما:** لایه Runtime (پایه) + Designer خطی + Inbox — حدود **۴۰٪** مسیر بالا.

---

## بخش د — چک‌لیست روزانه تست (QA)

قبل از هر release:

- [ ] RabbitMQ up + consumer running
- [ ] کاربر A درخواست وام → کاربر B inbox + بج قرمز
- [ ] B approve با اقساط → inbox done + مرحله بعد (اگر تعریف شده)
- [ ] reject → وضعیت rejected
- [ ] consumer خاموش → fallback sync هنوز inbox می‌سازد
- [ ] `/workflow/instances/{id}` پاسخ 200
- [ ] WebSocket reconnect بعد از قطع

---

## بخش ه — وابستگی‌های بین تیم

| نقش | هفته ۱ | هفته ۲ | هفته ۳ | هفته ۴ |
|-----|--------|--------|--------|--------|
| Backend | instances API, audit hook, SLA consumer | assignment API, audit routes | WS auth, dashboard API | process registry DB |
| Frontend | inbox fix, tracking clarify | assignment UI, instances page, nav | dashboard, audit UI | dynamic form MVP |
| DevOps | RabbitMQ + consumer systemd | sla_worker service | — | CI smoke |
| Product | سناریو تست وام | PR/inbox acceptance | KPI داشبورد | RFQ spec |

---

## پیوندها

- [ERP-SCOPE-MAP.md](./ERP-SCOPE-MAP.md) — نقشه دامنه و شکاف‌ها
- مسیر inbox: `/dashboard/workflow/inbox`
- تعریف workflow: `/dashboard/admin/workflow-definitions`

---

*آخرین به‌روزرسانی: بر اساس وضعیت مخزن پس از تکمیل WebSocket، بج اعلان، payer در inbox، و اسکرول جدول.*
