# CompTIA Security+ (SY0-701) — Self-Assessment

A scenario-based readiness check. Work all sections before consulting the answer key. Scoring guidance at the end.

---

## Section A — Scenario Analysis (5 questions)

**A1.** A mid-size company detects that an employee's workstation is beaconing to an unknown external IP every 60 seconds. Endpoint AV shows nothing. The SOC confirms the process is `powershell.exe` spawning from a Word document opened that morning.

a) What malware category is most consistent with this behavior?
b) Why did signature-based AV miss it?
c) What is the correct FIRST response action, and why that before eradication?

**A2.** A company moves customer records to a cloud object store. Three months later, security researchers report the records were publicly downloadable. The provider's infrastructure was never breached.

a) Under the shared responsibility model, who is responsible and why?
b) What control category (function and nature) would have prevented this?
c) What data-protection measure would have limited the impact even if the bucket were exposed?

**A3.** An analyst must choose an authentication design for a remote-access VPN. Leadership wants strong protection against credential theft from phishing.

a) Why is a stronger password policy insufficient here?
b) Design an MFA scheme and justify each factor's category.
c) Why would two knowledge-based factors fail the requirement?

**A4.** A risk register lists a threat with asset value $500,000, exposure factor 40%, occurring an estimated 0.5 times per year. A proposed control costs $60,000 per year and would cut the occurrence rate in half.

a) Compute the current ALE.
b) Compute the ALE after the control.
c) Is the control financially justified? Show the reasoning.

**A5.** During an incident, the team isolates the affected host, removes the malware, patches the exploited vulnerability, restores data from a known-good backup, and holds a review meeting.

a) Map each action to its incident-response phase.
b) Which phase is missing from this list, and why does it matter most for the next incident?

---

## Section B — Best-Response (5 questions)

**B1.** Which single change most reduces attack surface on a newly provisioned server?
- A) Add antivirus
- B) Disable unused services and close unused ports
- C) Enable verbose logging
- D) Install a host firewall in monitor mode

**B2.** A hash of a downloaded file matches the vendor-published hash. This primarily assures:
- A) Confidentiality
- B) Integrity
- C) Availability
- D) Non-repudiation

**B3.** The BEST reason to segment an OT/industrial network from the corporate network is:
- A) Faster corporate internet
- B) Preventing lateral movement from IT compromise into OT
- C) Reducing licensing cost
- D) Simplifying DNS

**B4.** Least privilege primarily reduces:
- A) The likelihood of compromise
- B) The blast radius of a compromise
- C) The need for MFA
- D) The cost of encryption

**B5.** An organization tolerates four hours of downtime but zero data loss. This means:
- A) RTO 0, RPO 4h
- B) RTO 4h, RPO 0
- C) RTO 4h, RPO 4h
- D) RTO 0, RPO 0

---

## Answer Key

**A1.** (a) Fileless / living-off-the-land malware delivered by a malicious macro. (b) It runs in memory via a legitimate binary (PowerShell), leaving no file signature to match. (c) Containment — isolate the host from the network first, because the beaconing indicates active command-and-control and possible spread/exfiltration; stopping that is more urgent than the careful work of eradication.

**A2.** (a) The customer — configuration of customer resources is always the customer's side of shared responsibility. (b) A preventive, technical control (correct access configuration / blocking public access). (c) Encryption at rest with controlled keys — exposed ciphertext without the key is far less damaging than exposed plaintext.

**A3.** (a) A password is one secret in one category and can be phished/copied without the owner knowing. (b) Password (know) + hardware or app-based token (have); optionally biometric (are). Each is a different category, so compromising one does not yield the others. (c) Two knowledge factors are the same category — a single phishing capture can take both, so it is not true MFA.

**A4.** (a) SLE = 500,000 × 0.40 = 200,000; ALE = 200,000 × 0.5 = 100,000. (b) New ARO = 0.25; ALE = 200,000 × 0.25 = 50,000. (c) The control reduces ALE by 50,000/year but costs 60,000/year — it costs more than it saves, so it is not financially justified on these numbers alone (though qualitative factors like regulatory penalties could change the decision).

**A5.** (a) Isolate = Containment; remove malware = Eradication; patch vulnerability = Eradication (root-cause removal); restore from backup = Recovery; review meeting = Lessons Learned. (b) Preparation is missing — it happens before the incident (plans, tooling, training) and most determines how well the next incident is handled.

**B1.** B — disabling unused services/ports removes attack paths before they are ever tried.
**B2.** B — matching hashes assure integrity (the file was not altered).
**B3.** B — segmentation stops lateral movement from a compromised IT network into OT.
**B4.** B — least privilege caps the blast radius; it does not lower the likelihood of the initial compromise.
**B5.** B — RTO 4h (restore within four hours), RPO 0 (no data loss tolerable).

## Scoring Guidance

- **Section A** — 3 points per sub-question (correct concept + correct reasoning). 45 points possible. Full credit requires the *why*, not just the label.
- **Section B** — 2 points each. 10 points possible.
- **Total: 55.**

| Score | Readiness |
|:---|:---|
| 50-55 | Exam-ready. Reasoning is sound, not just recall. |
| 40-49 | Nearly ready. Review the sub-questions you missed the reasoning on. |
| 30-39 | Solid recall, weak application. Re-read `02-first-principles.md`. |
| Below 30 | Return to `01-detailed-notes.md` and rebuild from the causal chains. |

The pattern to internalize: Section A rewards understanding, Section B rewards it too. If you scored high on B but low on A, you are memorizing — the real exam is mostly Section A style.

---

*Generated by the Learning Agents Framework V2.*
