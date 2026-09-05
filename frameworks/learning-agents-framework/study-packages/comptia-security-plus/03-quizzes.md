# CompTIA Security+ (SY0-701) — Quizzes

Answer before reading the explanation. Read the explanation even when correct.

---

## Domain 1: General Security Concepts

**Q1.** A company installs visible security cameras primarily to discourage would-be intruders. Which control type BEST describes this use?
- A) Detective
- B) Preventive
- C) Deterrent
- D) Corrective

**Answer: C.** A camera can be detective (it records evidence), but the stated intent — *discourage* — is deterrent. The exam keys on intent. If the scenario emphasized reviewing footage after an event, the answer would be detective.

**Q2.** Which property of the CIA triad is directly violated when an attacker modifies transaction records in a database?
- A) Confidentiality
- B) Integrity
- C) Availability
- D) Non-repudiation

**Answer: B.** Modification of data is an integrity violation. Confidentiality would be reading it; availability would be denying access to it.

**Q3.** In a Zero Trust architecture, which component makes the access decision?
- A) Policy enforcement point
- B) Policy engine
- C) Data plane gateway
- D) Certificate authority

**Answer: B.** The policy engine (control plane) decides; the policy enforcement point (data plane) enforces the decision inline.

## Domain 2: Threats, Vulnerabilities & Mitigations

**Q4.** An attacker sends a highly personalized email to the CFO requesting an urgent wire transfer, impersonating the CEO. This is BEST classified as:
- A) Spam
- B) Whaling / Business Email Compromise
- C) Watering hole
- D) Vishing

**Answer: B.** Targeting a high-value executive is whaling; the fraudulent-payment intent via impersonation is BEC. Vishing would be voice; watering hole compromises a shared website.

**Q5.** Malware runs entirely in memory using PowerShell and leaves almost nothing on disk. Which detection approach is MOST likely to catch it?
- A) Signature-based antivirus
- B) Behavior-based / anomaly detection
- C) Hash allowlisting of files
- D) Disk forensics after shutdown

**Answer: B.** Fileless malware defeats signature and file-hash approaches because there is little on disk. Behavior-based detection flags the anomalous process activity. Note that shutting down destroys memory-resident evidence.

**Q6.** A web form passes user input directly into a database query, allowing an attacker to read other users' records. What is the root cause and the correct fix?
- A) Weak passwords; enforce complexity
- B) Mixing data with instructions; use parameterized queries
- C) Missing encryption; enable TLS
- D) Excessive privileges; apply least privilege

**Answer: B.** This is SQL injection. The root cause is that untrusted data is interpreted as query instructions. Parameterized queries separate data from code. (Least privilege limits impact but does not fix the flaw.)

**Q7.** A vulnerability is being actively exploited and no patch exists. Which is the LEAST useful response?
- A) Network segmentation to limit reach
- B) Waiting to apply the vendor patch
- C) Behavior-based monitoring for exploitation effects
- D) Restricting privileges of the affected service

**Answer: B.** It is a zero-day — no patch exists, so waiting to patch does nothing now. The others reduce reach, impact, or improve detection.

## Domain 3: Security Architecture

**Q8.** Public-facing web servers should be placed in which network zone to isolate them from the internal network?
- A) VLAN 1
- B) DMZ
- C) The core network
- D) A guest wireless network

**Answer: B.** The DMZ isolates internet-facing services so that their compromise does not directly expose the internal network.

**Q9.** Data being processed in a server's RAM is in which state, and which is hardest to protect?
- A) At rest; easiest
- B) In transit; moderate
- C) In use; hardest
- D) Archived; easiest

**Answer: C.** Data in use (in memory) is the hardest to protect; secure enclaves address it. At rest uses encryption, in transit uses TLS/IPsec.

**Q10.** In the cloud shared responsibility model, a public storage bucket is left open and leaks data. Who is responsible?
- A) The cloud provider
- B) The customer
- C) Shared equally
- D) The end users

**Answer: B.** Configuration of customer resources is the customer's responsibility. Most cloud breaches are customer-side misconfiguration.

## Domain 4: Security Operations

**Q11.** A user authenticates with a password and a code from a hardware token. This is:
- A) Single-factor (two knowledge items)
- B) Multi-factor (know + have)
- C) Multi-factor (have + are)
- D) Not authentication, only identification

**Answer: B.** Password is "something you know," the token is "something you have" — two different categories, so it is MFA.

**Q12.** Why is a unique salt added to each password before hashing?
- A) To make the hash reversible
- B) To speed up hashing
- C) To defeat precomputed rainbow table attacks
- D) To encrypt the password

**Answer: C.** A unique salt makes identical passwords hash differently, defeating precomputed tables and forcing per-password effort.

**Q13.** During incident response, a host is actively spreading malware across the network. What should happen FIRST?
- A) Eradicate the malware completely
- B) Contain by isolating the host
- C) Write the lessons-learned report
- D) Rebuild the host from backup

**Answer: B.** Containment stops the spread immediately. Eradication and recovery follow once the bleeding is stopped.

**Q14.** A SIEM generates an alert only after correlating a thousand failed logins across many accounts within two minutes. What capability is this?
- A) Signature detection
- B) Log aggregation with correlation
- C) Data loss prevention
- D) Endpoint encryption

**Answer: B.** The value is correlation across sources — individually the events are noise; together they are a password-spraying attack.

**Q15.** An organization can tolerate losing at most one hour of data. This defines its:
- A) RTO
- B) RPO
- C) MTBF
- D) SLA

**Answer: B.** RPO is the maximum tolerable data loss (how far back the last good recovery point is). RTO is how fast you must restore.

## Domain 5: Program Management & Oversight

**Q16.** An asset worth $200,000 has an exposure factor of 25% for a given threat that occurs twice per year. What is the ALE?
- A) $50,000
- B) $100,000
- C) $25,000
- D) $200,000

**Answer: B.** SLE = 200,000 × 0.25 = 50,000. ALE = SLE × ARO = 50,000 × 2 = 100,000.

**Q17.** A company buys cyber insurance to offset the financial impact of a potential breach. This is which risk treatment?
- A) Avoidance
- B) Mitigation
- C) Transfer
- D) Acceptance

**Answer: C.** Insurance transfers the financial risk to a third party. It does not reduce likelihood (mitigation) or stop the activity (avoidance).

**Q18.** In data governance, who determines the purpose and means of processing personal data?
- A) Data custodian
- B) Data processor
- C) Data controller
- D) Data subject

**Answer: C.** The controller decides why and how data is processed. The processor acts on the controller's behalf; the custodian handles day-to-day protection.

---

*Generated by the Learning Agents Framework V2.*
