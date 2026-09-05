# CompTIA Security+ (SY0-701) — Detailed Notes

These notes build from the smallest causal unit upward. Each concept explains why it exists before what it does.

---

## §1. General Security Concepts

### 1.1 The CIA Triad — the root of everything

Every security control exists to protect one of three properties. If you understand the triad, you understand what any control is actually for.

- **Confidentiality** — information is seen only by those authorized. The threat it counters is disclosure. Encryption, access control, and data classification all serve confidentiality.
- **Integrity** — information is not altered by unauthorized parties, and unauthorized changes are detectable. The threat it counters is tampering. Hashing, digital signatures, and change control serve integrity.
- **Availability** — information and systems are usable when needed. The threat it counters is disruption. Redundancy, backups, and DDoS protection serve availability.

Why it matters: when a scenario asks "which principle is affected," you trace back to which property the attacker broke. Ransomware breaks availability (files locked) and often confidentiality (data stolen). A defaced website breaks integrity. An overheard password breaks confidentiality.

A fourth property, **non-repudiation**, sits alongside the triad: a party cannot deny having taken an action. It is produced by combining integrity (the record was not altered) with authentication (we know who acted). Digital signatures deliver non-repudiation because only the holder of the private key could have produced the signature.

### 1.2 Control types — categorized two ways

Controls are classified by function and by nature. The exam expects both dimensions.

By **function** (what the control does relative to an incident):
- **Preventive** — stops an incident before it happens (a firewall rule, a locked door).
- **Detective** — identifies an incident in progress or after (IDS, log review, CCTV).
- **Corrective** — restores after an incident (backups, patching the exploited flaw).
- **Deterrent** — discourages an attacker from trying (warning signage, visible cameras).
- **Compensating** — a substitute when the primary control is not feasible (extra monitoring when patching must be delayed).
- **Directive** — instructs behavior (policies, acceptable use agreements).

By **nature** (how the control is implemented):
- **Technical** — enforced by technology (encryption, ACLs).
- **Managerial** — enforced by process and decision (risk assessments, policy).
- **Operational** — enforced by people executing procedures (guard rounds, awareness training).
- **Physical** — enforced by tangible barriers (fences, locks, mantraps).

Why the two-axis model matters: a single control can be both preventive and technical (a firewall), or deterrent and physical (a fence). Scenario questions often ask you to place a control in the correct category to justify a design choice.

### 1.3 Zero Trust — why the perimeter model failed

The old model assumed "inside the network = trusted." This collapsed when attackers learned to get inside (phishing, VPN compromise, insider threat) and then moved laterally with no further resistance. Zero Trust rebuilds security on a single premise: never trust, always verify — for every request, regardless of origin.

Two planes make it work:
- **Control plane** — decides. It holds the policy engine (evaluates whether to grant access) and policy administrator (issues the decision).
- **Data plane** — enforces. The policy enforcement point sits inline and permits or blocks the actual traffic based on the control plane's decision.

Access decisions consider identity, device posture, location, and behavior — not just a valid credential. This is why a stolen password alone should no longer grant access in a Zero Trust design.

### 1.4 Change management — why security cares about process

Unmanaged change is a leading cause of outages and of security gaps. A rushed firewall change can open the network; an untracked config drift can reintroduce a patched vulnerability. Change management imposes: a request, an impact analysis, approval, a test, a backout plan, and documentation. The security relevance is that every change is a potential new attack surface, and the backout plan is what preserves availability when a change goes wrong.

---

## §2. Threats, Vulnerabilities & Mitigations

### 2.1 Threat actors — motivation predicts behavior

You defend differently against different actors because their goals and resources differ.

- **Nation-state / APT** — high resources, high sophistication, patient. Motivated by espionage or strategic disruption. Uses zero-days and long dwell times.
- **Organized crime** — financially motivated. Ransomware, fraud, data theft for resale.
- **Hacktivist** — ideologically motivated. Defacement, DDoS, leaks for publicity.
- **Insider threat** — already has access. May be malicious (revenge, profit) or unintentional (negligence). Hardest to detect because activity looks authorized.
- **Script kiddie / unskilled** — low skill, uses existing tools. Opportunistic.
- **Shadow IT** — not an attacker but a risk source: unsanctioned tools and systems outside security's visibility.

Why motivation matters: an APT targeting your data will be stealthy and persistent, so you invest in detection and threat hunting. A hacktivist wants noise, so you invest in DDoS resilience and public-facing hardening.

### 2.2 Attack surfaces and vectors

A **vector** is the path an attack takes in. Common vectors: email (phishing), web, removable media, supply chain, wireless, and remote/cloud services. The **attack surface** is the sum of all vectors. Every open port, every exposed API, every third-party integration adds surface. Attack surface reduction — closing ports, removing unused software, limiting integrations — is one of the highest-leverage defensive moves because it removes paths before an attacker ever tries them.

### 2.3 Social engineering — attacking the human

Technology controls fail when the human is manipulated into authorizing the attacker. Key techniques:

- **Phishing** — fraudulent message at scale. **Spear phishing** targets a specific person; **whaling** targets executives.
- **Vishing / smishing** — voice and SMS variants.
- **Pretexting** — inventing a scenario to justify the request ("I'm from IT, I need your password to fix your account").
- **Business Email Compromise (BEC)** — impersonating an executive or vendor to trigger a fraudulent payment.
- **Watering hole** — compromising a site the target group frequents.

The underlying logic: social engineering exploits trust, authority, urgency, and fear. Every awareness program teaches people to slow down and verify when a message triggers those feelings, because the attacker's leverage is the victim's haste.

### 2.4 Malware families — classified by behavior

- **Virus** — attaches to a file, runs when the file runs, requires user action to spread.
- **Worm** — self-propagating across networks, no user action needed. Dangerous because of speed.
- **Trojan** — disguised as legitimate software.
- **Ransomware** — encrypts data and demands payment; attacks availability directly.
- **Rootkit** — hides its presence by subverting the OS, often at kernel level. Hard to detect because it controls what the system reports.
- **Keylogger / spyware** — captures input and activity for exfiltration.
- **Logic bomb** — dormant code that triggers on a condition (a date, an event).
- **Fileless malware** — lives in memory and uses legitimate tools (PowerShell, WMI), leaving little on disk. Defeats signature-based detection, which is why behavior-based detection matters.

### 2.5 Common vulnerabilities

- **Race condition (TOCTOU — time-of-check to time-of-use)** — a value is validated, then changes before use. The fix is atomic operations.
- **Buffer overflow** — writing past allocated memory to corrupt adjacent data or inject code. Mitigated by memory-safe languages, ASLR, and DEP.
- **Injection (SQL, command, LDAP)** — untrusted input is executed as code. The root cause is mixing data and instructions; the fix is parameterized queries and input validation.
- **Cross-site scripting (XSS)** — injecting script into pages other users view. Fixed by output encoding and content security policy.
- **Misconfiguration** — default credentials, open buckets, excessive permissions. The most common real-world breach cause and entirely preventable by hardening.
- **Zero-day** — a vulnerability with no patch yet available. You cannot patch it, so you rely on defense in depth, monitoring, and rapid response.

---

## §3. Security Architecture

### 3.1 Defense in depth and layering

No single control is trusted to be perfect. Defense in depth stacks independent controls so that failure of one does not equal compromise. An attacker who bypasses the firewall still faces network segmentation, then host hardening, then access control, then encryption, then monitoring. Each layer buys detection time and raises attacker cost.

### 3.2 Network segmentation

Segmentation divides the network so that compromise in one zone does not spread. A **DMZ** isolates public-facing servers from the internal network. **VLANs** separate traffic logically. **Microsegmentation** applies policy down to individual workloads. The logic: lateral movement is how a single foothold becomes a full breach; segmentation is the wall that stops the spread.

### 3.3 Secure design models

- **On-premises** — full control, full responsibility, high capital cost.
- **Cloud** — shared responsibility. The provider secures the infrastructure; you secure your data, identities, and configuration. Most cloud breaches are customer-side misconfiguration, not provider failure.
- **Hybrid / multi-cloud** — flexibility at the cost of complexity and a larger attack surface.

### 3.4 Data protection

Data is protected differently depending on its **state**:
- **Data at rest** — stored. Protected by encryption (full-disk, database, file-level).
- **Data in transit** — moving across a network. Protected by TLS, IPsec, VPN.
- **Data in use** — being processed in memory. Hardest to protect; addressed by secure enclaves and memory protection.

**Data classification** (public, internal, confidential, restricted) drives how much protection each dataset gets. You cannot protect everything at the highest level, so classification directs resources where the impact of loss is greatest.

---

## §4. Security Operations

### 4.1 Identity and Access Management (IAM)

IAM answers three questions in order: who are you (identification), can you prove it (authentication), and what may you do (authorization)?

**Authentication factors:**
- Something you **know** (password, PIN).
- Something you **have** (token, phone, smart card).
- Something you **are** (biometric).
- Somewhere you **are** (location).
- Something you **do** (behavioral).

**Multi-factor authentication (MFA)** requires factors from different categories. Two passwords are not MFA; a password plus a phone token is. The logic: an attacker who steals one factor still cannot authenticate, because the second factor is a different kind of secret they do not possess.

**Authorization models:**
- **RBAC (role-based)** — permissions attach to roles, users get roles. Scales well.
- **ABAC (attribute-based)** — decisions use attributes (department, time, device). Most granular.
- **MAC (mandatory)** — the system enforces labels; users cannot change them. Used in high-security environments.
- **DAC (discretionary)** — the resource owner sets permissions. Flexible but error-prone.

**Least privilege** — grant only the access needed for the job, nothing more. It limits the blast radius when an account is compromised.

### 4.2 Cryptography applied

- **Symmetric encryption** (AES) — one shared key, fast, used for bulk data. The problem is key distribution: how do two parties share the key securely?
- **Asymmetric encryption** (RSA, ECC) — a public/private key pair. Solves key distribution: you encrypt with the recipient's public key, only their private key decrypts. Slower, so it is used to exchange symmetric keys, not bulk data.
- **Hashing** (SHA-256) — one-way; produces a fixed digest. Used for integrity and password storage. A hash cannot be reversed, only compared.
- **Salting** — adding random data to a password before hashing, so identical passwords produce different hashes and precomputed (rainbow table) attacks fail.
- **Digital signature** — hash of a message encrypted with the sender's private key. Provides integrity, authentication, and non-repudiation together.
- **PKI (Public Key Infrastructure)** — the trust system: a Certificate Authority vouches for the binding between an identity and a public key via a certificate. Trust chains up to a root CA.

The unifying logic: symmetric is fast but has a key-sharing problem; asymmetric solves the sharing problem but is slow; real systems combine them (asymmetric to exchange a symmetric session key, then symmetric for the data). TLS does exactly this.

### 4.3 Monitoring and detection

- **SIEM (Security Information and Event Management)** — aggregates logs from across the environment and correlates them to surface incidents. The value is correlation: one failed login is noise; a thousand across accounts in minutes is an attack.
- **SOAR (Security Orchestration, Automation, and Response)** — automates response playbooks to reduce manual toil and response time.
- **IDS/IPS** — detection (IDS) versus prevention (IPS, which sits inline and blocks). Signature-based catches known attacks; anomaly-based catches deviations from baseline, including novel attacks.
- **Log sources** — the raw material of detection. Without collected, time-synchronized logs, investigation is blind.

### 4.4 Incident response — the lifecycle

A repeatable process turns chaos into a controlled procedure:
1. **Preparation** — plans, tools, and training before anything happens.
2. **Detection & Analysis** — identify and scope the incident.
3. **Containment** — stop the spread (isolate the host, block the C2 domain).
4. **Eradication** — remove the cause (delete malware, close the vulnerability).
5. **Recovery** — restore to normal operation and verify.
6. **Lessons Learned** — improve so the same incident does not recur.

The logic of ordering: you contain before you eradicate because stopping the bleeding is more urgent than a perfect cleanup, and you preserve evidence throughout for forensics and legal needs.

### 4.5 Resilience and recovery

- **RTO (Recovery Time Objective)** — how fast you must restore.
- **RPO (Recovery Point Objective)** — how much data loss is tolerable (how far back the last good backup is).
- **Backups** — the 3-2-1 rule: three copies, two media types, one offsite. Ransomware resilience depends on an offline or immutable copy the attacker cannot encrypt.
- **High availability** — redundancy (clustering, load balancing, failover) so a single failure does not cause an outage.

---

## §5. Security Program Management & Oversight

### 5.1 Risk management — the discipline behind every decision

Security is applied risk management. You cannot eliminate risk; you decide how to treat it.

- **Risk = likelihood × impact.** This is why you prioritize: a high-likelihood, high-impact risk gets resources before a rare, minor one.
- **Risk treatments:** accept (the cost of control exceeds the risk), avoid (stop the activity), transfer (insurance, outsourcing), mitigate (apply controls to reduce it).
- **Quantitative analysis:** SLE (single loss expectancy) = asset value × exposure factor; ALE (annualized loss expectancy) = SLE × ARO (annual rate of occurrence). ALE tells you how much a risk costs per year, which tells you how much a control is worth.
- **Qualitative analysis:** ranking by high/medium/low when precise numbers are unavailable.

### 5.2 Third-party and supply chain risk

Your security is only as strong as your weakest vendor with access. Vendor risk management assesses suppliers before and during the relationship: security questionnaires, right-to-audit clauses, SLAs, and monitoring. The supply chain is a vector because attackers compromise a trusted supplier to reach many downstream targets at once.

### 5.3 Governance, compliance, and frameworks

- **Governance** — who decides and who is accountable. Policies (high-level intent), standards (mandatory specifics), procedures (step-by-step), and guidelines (recommendations) form the hierarchy.
- **Compliance** — meeting external requirements (regulations, contracts). Non-compliance carries legal and financial penalties.
- **Frameworks** — NIST CSF, ISO 27001, CIS Controls provide structured, tested approaches so you are not inventing security from scratch.

### 5.4 Data governance and privacy

- **Data owner** — accountable for the data (usually a business leader).
- **Data controller** — determines why and how data is processed.
- **Data processor** — processes on the controller's behalf.
- **Data custodian / steward** — handles day-to-day protection and quality.
- **Privacy** — protecting personal information; driven by regulation (GDPR-style consent, breach notification, data subject rights).

### 5.5 Security awareness

The human is both the largest attack surface and a control. Awareness programs, phishing simulations, and role-based training convert people from a vulnerability into a detection layer — a trained user who reports a phishing email is functioning as a sensor.

---

*Generated by the Learning Agents Framework V2.*
