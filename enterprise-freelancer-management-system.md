 # Enterprise Freelancer Management System (EFMS)
 
 ## Purpose and scale
 EFMS is a contract-first platform for managing 100+ freelancers at enterprise
 scale. It enforces access and payment by contract terms, provides strict
 role-based access control (RBAC), and maintains audit-ready evidence for
 compliance obligations (e.g., SOC 2, ISO 27001, GDPR where applicable).
 
 ## Core capabilities (system build)
 - **Identity and access**: SSO with the enterprise IdP, MFA, RBAC, and
   attribute-based policy checks (contract status, jurisdiction, data
   classification, project).
 - **Contract lifecycle**: templated contract creation, approval workflows,
   signature, renewal, termination, and automated access provisioning.
 - **Work management**: onboarding checklists, project assignments, deliverable
   milestones, and timesheet validation tied to contracts.
 - **Payments and billing**: rate enforcement, milestone-based releases,
   invoice generation, tax/withholding rules, and payment holds on compliance
   violations.
 - **Audit and compliance**: immutable audit trails, evidence collection,
   retention, and reporting for internal and external audits.
 - **Risk and vendor management**: due diligence, background checks, conflict
   of interest attestations, and periodic re-certification.
 
 ## Contract-driven access and payment enforcement
 1. **Access gating**
    - Access is provisioned only after a contract reaches "Active".
    - Access is scoped to contract attributes: project, data classification,
      geography, time window, and required training.
    - Access is automatically revoked on contract end, suspension, or breach.
 2. **Payment gating**
    - Rates and caps are enforced from contract terms (hourly, fixed, or
      milestone).
    - Payments require approved deliverables or validated timesheets.
    - Payment is blocked when compliance checks fail (expired documents,
      training lapses, policy violations).
 
 ## Audit and compliance readiness
 - **Evidence by design**: each action (contract change, access grant, payment
   approval) is logged with actor, timestamp, policy decision, and references.
 - **Retention**: immutable logs and contracts retained per legal and audit
   requirements (typical 7 years, configurable).
 - **Segregation of duties**: policy-driven approval paths for access, payments,
   and contract changes.
 - **Periodic review**: quarterly access reviews and annual vendor risk reviews.
 
 ## Roles and RBAC (strict)
 - **Executive Sponsor**: governance oversight; no access to personal data.
 - **Compliance Officer**: audit evidence access and policy validation.
 - **Legal Counsel**: contract templates, terms, and legal hold actions.
 - **Procurement Manager**: vendor onboarding, rate card approvals.
 - **Program Manager**: staffing, allocation, project assignments.
 - **Hiring/Project Manager**: task definition, milestone acceptance.
 - **Finance Controller**: payment approvals, reconciliation, tax handling.
 - **Security Administrator**: access policy configuration, incident response.
 - **Data Steward**: data classification and access approval for sensitive data.
 - **Freelancer**: own profile, own timesheets/invoices, assigned project data.
 
 ## Governance model
 - **Governance bodies**
   - **Executive Steering Committee**: strategic direction and risk acceptance.
   - **Data Governance Council**: data policy, classification, and ownership.
   - **Change Advisory Board (CAB)**: approves high-risk changes.
 - **Decision rights**
   - Policy and control ownership resides with Compliance and Security.
   - Contract and rate terms owned by Legal and Procurement.
   - Payment releases owned by Finance with project acceptance by Managers.
 - **RACI highlights**
   - **Accountable**: Executive Sponsor for enterprise risk posture.
   - **Responsible**: Compliance, Security, Procurement, Finance for controls.
   - **Consulted**: Legal for contractual and regulatory interpretation.
   - **Informed**: Program Managers and Freelancers for operational changes.
 
 ## System boundaries
 **In scope**
 - EFMS application services (contract mgmt, onboarding, access, payments)
 - Identity provider integration and access gateway
 - Audit log service, evidence vault, and reporting
 - Integration with payroll/ERP, HRIS, and ticketing systems
 
 **Out of scope**
 - Corporate HR policies unrelated to freelancers
 - Employee payroll for full-time staff
 - Legal services beyond contract templates and review
 
 **Data boundaries**
 - Personal data stored with encryption at rest and in transit.
 - Sensitive customer data accessed by freelancers only through approved
   project workspaces with least-privilege access.
 
 ## Data ownership per role
 | Role | Primary data ownership | Stewardship responsibilities |
 | --- | --- | --- |
 | Compliance Officer | Audit logs, compliance evidence | Integrity, retention, audit access |
 | Legal Counsel | Contract templates, legal clauses | Template control, legal holds |
 | Procurement Manager | Vendor profiles, rate cards | Onboarding, due diligence |
 | Program Manager | Project staffing data | Allocation accuracy |
 | Hiring/Project Manager | Deliverables, acceptance records | Quality acceptance, approvals |
 | Finance Controller | Invoices, payment records | Payment accuracy, tax compliance |
 | Security Administrator | Access policies, security events | Policy enforcement |
 | Data Steward | Data classification metadata | Access approvals for sensitive data |
 | Freelancer | Own profile, timesheets, invoices | Accuracy of submissions |
 
 ## Change control principles
 1. **Risk-based change classification**
    - Standard (pre-approved), Normal (CAB review), Emergency (post-approval).
 2. **Segregation of duties**
    - No single role can create, approve, and execute the same change.
 3. **Traceability**
    - Every change requires a ticket, approvals, testing evidence, and rollback
      plan.
 4. **Contract and policy integrity**
    - Contract updates require Legal and Procurement approval.
    - Policy updates require Security and Compliance approval.
 5. **Release governance**
    - Scheduled releases with stakeholder communication.
    - Post-release verification for access and payment workflows.
 
## Scalable enterprise architecture
### Architecture diagram (textual)
```
 [Enterprise Users]                     [External Systems]
  (Managers, Legal,                      IdP, ERP, HRIS,
   Finance, Compliance,                  E-sign, Payment,
   Freelancers)                          SIEM, Ticketing
           |                                      |
           v                                      v
     [SSO/MFA via IdP] <----------------> [Integration Adapter]
           |                                      |
           v                                      v
       [API Gateway] <-----> [Event Bus / Message Broker]
           |
  +--------+---------+---------+---------+---------+--------+
  |                  |         |         |         |        |
  v                  v         v         v         v        v
[Freelancer      [Contract  [Work     [Payments [Compliance [Access
 Profile Service] Service]  Mgmt]    & Billing] & Risk]     Control]
  |                  |         |         |         |        |
  +--------+---------+---------+---------+---------+--------+
           |                       |
           v                       v
   [Workflow Engine]       [Scheduler / Job Service]
           |                       |
           v                       v
     [Audit Trail Service] <---- [Contract Expiration Jobs]
           |
           v
     [Relational Database] + [Evidence Vault / Object Store]
```

### Module responsibilities
- **API Gateway**: request routing, rate limits, authn/authz enforcement.
- **Freelancer Profile Service**: identities, profiles, onboarding state.
- **Contract Service**: contract creation, approvals, e-sign status, terms.
- **Work Management Service**: assignments, milestones, timesheets.
- **Payments & Billing Service**: rate enforcement, invoicing, disbursements.
- **Compliance & Risk Service**: due diligence, policy attestations, reviews.
- **Access Control Service**: provisioning/deprovisioning based on contracts.
- **Workflow Engine**: orchestrates approvals and cross-service state changes.
- **Scheduler/Job Service**: contract expiration checks and periodic reviews.
- **Audit Trail Service**: immutable logs of actions and policy decisions.
- **Reporting/Analytics Service**: compliance, spend, and risk reporting.
- **Integration Adapter**: connectors to ERP, HRIS, e-sign, payment rails.
- **Relational Database**: system of record for contracts, users, payments.
- **Evidence Vault**: signed contracts, audit evidence, supporting documents.

### Integration points
- **Identity Provider (SSO/MFA)**: authentication, group sync, de-provisioning.
- **E-signature platform**: contract execution and signature evidence.
- **ERP/Accounting**: PO numbers, invoice posting, reconciliation.
- **Payment processor / bank**: disbursements, tax handling, remittance.
- **HRIS/Vendor management**: onboarding data, worker classification.
- **Ticketing/ITSM**: change requests, access exceptions, audit tickets.
- **SIEM/SOC tooling**: security events, anomalous access alerts.

## Enterprise-grade relational database schema
### Table structures with keys and status fields
**Common columns (all core tables)**
- `id` (PK, UUID)
- `created_at`, `created_by` (FK -> users.id)
- `updated_at`, `updated_by` (FK -> users.id)
- `deleted_at`, `deleted_by` (FK -> users.id, nullable)

**users**
- `id` (PK), `email` (unique), `user_type` (employee, freelancer, service)
- `status` (active, suspended, offboarded)

**roles**
- `id` (PK), `name` (unique)

**permissions**
- `id` (PK), `code` (unique)

**user_roles**
- `user_id` (FK -> users.id), `role_id` (FK -> roles.id)
- PK (`user_id`, `role_id`)

**vendor_organizations**
- `id` (PK), `name`, `status` (active, suspended, terminated)

**freelancers**
- `id` (PK), `user_id` (FK -> users.id), `vendor_org_id` (FK -> vendor_organizations.id)
- `status` (active, onboarding, suspended, offboarded)

**projects**
- `id` (PK), `name`, `owner_user_id` (FK -> users.id)
- `status` (active, paused, closed)

**project_assignments**
- `id` (PK), `project_id` (FK -> projects.id), `freelancer_id` (FK -> freelancers.id)
- `contract_id` (FK -> contracts.id)
- `status` (assigned, active, completed, removed)

**contracts**
- `id` (PK), `contract_number` (unique), `vendor_org_id` (FK -> vendor_organizations.id)
- `current_version_id` (FK -> contract_versions.id)
- `status` (draft, in_review, active, suspended, terminated, expired)
- `start_date`, `end_date`

**contract_versions**
- `id` (PK), `contract_id` (FK -> contracts.id)
- `version_number` (int, unique per contract)
- `effective_from`, `effective_to`
- `status` (draft, in_review, approved, signed, superseded, void)
- `terms_hash`, `signed_at`, `supersedes_version_id` (FK -> contract_versions.id, nullable)

**contract_approvals**
- `id` (PK), `contract_version_id` (FK -> contract_versions.id)
- `approver_user_id` (FK -> users.id)
- `status` (pending, approved, rejected)

**contract_documents**
- `id` (PK), `contract_version_id` (FK -> contract_versions.id)
- `storage_uri`, `checksum`, `status` (active, revoked)

**work_items**
- `id` (PK), `project_id` (FK -> projects.id), `contract_id` (FK -> contracts.id)
- `status` (planned, in_progress, submitted, accepted, rejected)

**timesheets**
- `id` (PK), `freelancer_id` (FK -> freelancers.id), `contract_id` (FK -> contracts.id)
- `period_start`, `period_end`
- `status` (draft, submitted, approved, rejected, paid)

**timesheet_entries**
- `id` (PK), `timesheet_id` (FK -> timesheets.id)
- `work_item_id` (FK -> work_items.id, nullable), `hours`

**invoices**
- `id` (PK), `freelancer_id` (FK -> freelancers.id), `contract_id` (FK -> contracts.id)
- `timesheet_id` (FK -> timesheets.id, nullable)
- `status` (draft, submitted, approved, rejected, paid)

**payments**
- `id` (PK), `invoice_id` (FK -> invoices.id)
- `status` (pending, released, failed, reversed)
- `payment_reference`

**compliance_artifacts**
- `id` (PK), `freelancer_id` (FK -> freelancers.id)
- `artifact_type`, `status` (valid, expired, revoked, pending)
- `expires_at`

**access_grants**
- `id` (PK), `user_id` (FK -> users.id), `project_id` (FK -> projects.id)
- `contract_id` (FK -> contracts.id)
- `status` (requested, active, suspended, revoked)
- `start_at`, `end_at`

**audit_events**
- `id` (PK), `actor_user_id` (FK -> users.id)
- `event_type`, `entity_type`, `entity_id`
- `policy_decision`, `ip_address`, `created_at`

### Contract versioning strategy
- **Immutable versions**: every contract change creates a new row in
  `contract_versions` with a monotonic `version_number`.
- **Active pointer**: `contracts.current_version_id` points to the currently
  active signed version.
- **Supersession chain**: `contract_versions.supersedes_version_id` links the
  new version to the previous signed version for traceability.
- **Status gating**: only `approved` and `signed` versions can become current.
- **Document linkage**: signed files are stored in `contract_documents` with
  checksums tied to the version hash.

### Soft delete vs hard delete policy
- **Soft delete (default)**: set `deleted_at` and `deleted_by` for all business
  entities; data remains queryable for audit and legal hold.
- **Hard delete (exception only)**: allowed only for test data or when required
  by legal/regulatory erasure (e.g., verified privacy request).
- **Retention enforcement**: scheduled jobs purge only after retention windows
  and compliance approvals; audit_events are never hard deleted.

## Contract lifecycle logic (enterprise-grade)
### Core rules
1. **Versioning (no overwrite)**
   - Any modification to terms creates a new `contract_versions` record.
   - The prior signed version becomes `superseded`; it is never edited.
   - `contracts.current_version_id` is updated only when a version is signed.
2. **Automated expiration handling**
   - Scheduler checks daily (or hourly for large volume) for contracts within
     their effective date window.
   - At `end_date` (or `effective_to` of the signed version), the contract
     status becomes `expired` unless a new signed version is already active.
3. **Reminder logic (H-30, H-14, H-7)**
   - Reminders are sent relative to the effective end date of the signed
     version: H-30, H-14, H-7.
   - Reminders are idempotent using a `contract_notifications` table with
     unique `(contract_id, version_id, reminder_type)` to prevent duplicates.
4. **Automatic access suspension**
   - At expiration or contract status `suspended/terminated`, access grants
     linked to the contract move to `suspended` and access tokens are revoked.
5. **Re-activation on new contract**
   - When a new version is signed, the system re-evaluates access against the
     new contract scope and re-activates eligible access grants.

### Workflow sequence (summary)
1. Draft -> Review -> Approved -> Signed (new version).
2. `current_version_id` updated and contract status set to `active`.
3. Scheduler emits reminder events at H-30/H-14/H-7.
4. On end date, if no newer signed version, set `expired` and suspend access.
5. If a new signed version exists, mark prior version `superseded`, keep active.

### Edge cases and handling
- **Signed renewal before expiry**: If a new version is signed before the old
  version expires, mark the old version `superseded` and keep contract `active`;
  do not suspend access.
- **Overlapping versions**: Allow overlap only if explicitly approved; the
  system chooses the version with the latest `effective_from` that is signed.
- **Late signature after expiry**: If the contract expires and a renewal is
  signed later, access is suspended during the gap and re-activated on signing.
- **Backdated amendments**: New version cannot have an `effective_from` earlier
  than the current version start without Legal approval; audit the exception.
- **Manual suspension**: If Compliance suspends a contract, reminders stop and
  access is suspended immediately; renewal requires explicit re-activation.
- **Termination for breach**: Access is revoked and cannot be re-activated by
  a renewal until Compliance clears the breach flag.
- **Pending invoice/timesheet**: Expiration does not block payment of approved
  work; payments remain governed by contract terms at the time of work.
- **Multiple projects per contract**: Access suspension applies to all project
  grants tied to the contract; other contracts remain unaffected.
- **Timezone boundaries**: Use contract-local timezone for end date evaluation;
  store all dates in UTC with timezone metadata to prevent off-by-one errors.
- **Reminder duplicates**: Use idempotency keys and audit logs to avoid repeated
  notifications in retry scenarios.
- **External system lag**: If ERP or IdP sync is delayed, keep internal access
  state authoritative and reconcile async with retry/backoff.

